import type { Hono } from "hono";
import fs from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createAgentSessionServices,
  getAgentDir,
  ModelRuntime,
  type SettingsManager,
} from "@earendil-works/pi-coding-agent";
import { getSupportedThinkingLevels } from "@earendil-works/pi-ai";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { completeSimple, type AssistantMessage } from "@earendil-works/pi-ai/compat";
import { getAllowedFileRoots, isExistingFilePathAllowed, isFilePathAllowed, isWindowsAbsolutePath } from "../lib/file-access";
import { getGitFileDiff, getGitStatus } from "../lib/git-changes";
import { loadModelsWithCache, invalidateModelsCache, withModelRuntimeError, type ModelsData } from "../lib/models-cache";
import { projectTrustReloadOptions } from "../lib/project-trust";
import { createAppSettingsManager, getAppResourceLoaderOptions } from "../lib/app-runtime";
import {
  flattenModelsDevCatalog,
  recommendModelCatalogPreset,
  searchModelCatalog,
  type ModelCatalogEntry,
} from "../lib/model-catalog";
import { resolveModelDiscoveryAuth } from "../lib/model-discovery-auth";
import { buildModelsListUrl, parseDiscoveredModels } from "../lib/model-discovery";
import { hasJsonContentType } from "../lib/request-security";

const modelNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareModelEntries(
  a: { id: string; name: string; provider: string },
  b: { id: string; name: string; provider: string },
): number {
  return (
    modelNameCollator.compare(a.name || a.id, b.name || b.id) ||
    modelNameCollator.compare(a.provider, b.provider) ||
    modelNameCollator.compare(a.id, b.id)
  );
}

const THINKING_SUFFIXES = new Set([
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

function stripThinkingSuffix(modelRef: string): string {
  const trimmed = modelRef.trim();
  const colonIndex = trimmed.lastIndexOf(":");
  if (colonIndex === -1) return trimmed;
  const suffix = trimmed.substring(colonIndex + 1);
  return THINKING_SUFFIXES.has(suffix)
    ? trimmed.substring(0, colonIndex)
    : trimmed;
}

function filterByExactEnabledModels<T extends { id: string; provider: string }>(
  available: readonly T[],
  enabledModels: string[] | undefined,
): readonly T[] {
  if (!enabledModels || enabledModels.length === 0) return available;

  const refs = new Set(enabledModels.map(stripThinkingSuffix).filter(Boolean));
  const visible = available.filter(
    (m) => refs.has(`${m.provider}/${m.id}`) || refs.has(m.id),
  );
  return visible.length > 0 ? visible : available;
}

async function loadModels(cwd: string): Promise<ModelsData> {
  const nameMap = new Map<string, string>();
  let modelList: { id: string; name: string; provider: string }[] = [];
  let defaultModel: { provider: string; modelId: string } | null = null;
  const thinkingLevels: Record<string, string[]> = {};
  const thinkingLevelMaps: Record<string, Record<string, string | null>> = {};

  const agentDir = getAgentDir();
  // Gate untrusted project extensions: enumerating models still imports and
  // runs a repository's .pi/extensions factories, so honor project trust here
  // too (see lib/project-trust.ts, #236).
  const trustReloadOptions = projectTrustReloadOptions(cwd, agentDir);
  const services = await createAgentSessionServices({
    cwd,
    agentDir,
    settingsManager: createAppSettingsManager(cwd, agentDir),
    resourceLoaderOptions: getAppResourceLoaderOptions(),
    ...(trustReloadOptions
      ? { resourceLoaderReloadOptions: trustReloadOptions }
      : {}),
  });
  const available = await services.modelRuntime.getAvailable();
  const modelError = services.modelRuntime.getError();
  const settings: SettingsManager = services.settingsManager;
  const enabledModels = settings.getEnabledModels();
  const visible = filterByExactEnabledModels(available, enabledModels);
  modelList = visible
    .map(
      (m: {
        id: string;
        name: string;
        provider: string;
        serviceTier?: string;
      }) => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
        serviceTier: m.serviceTier,
      }),
    )
    .sort(compareModelEntries);
  for (const m of visible) {
    const key = `${m.provider}:${m.id}`;
    nameMap.set(key, m.name);
    thinkingLevels[key] = getSupportedThinkingLevels(m);
    if (m.thinkingLevelMap) thinkingLevelMaps[key] = m.thinkingLevelMap;
  }

  const provider = settings.getDefaultProvider();
  const modelId = settings.getDefaultModel();
  if (
    provider &&
    modelId &&
    visible.some((m) => m.provider === provider && m.id === modelId)
  ) {
    defaultModel = { provider, modelId };
  }

  return withModelRuntimeError(
    {
      models: Object.fromEntries(nameMap),
      modelList,
      defaultModel,
      thinkingLevels,
      thinkingLevelMaps,
    },
    modelError,
  );
}

const EMPTY_MODELS: ModelsData = {
  models: {},
  modelList: [],
  defaultModel: null,
  thinkingLevels: {},
  thinkingLevelMaps: {},
};

function getModelsPath(): string {
  return join(getAgentDir(), "models.json");
}

function readModelsJson(): Record<string, unknown> {
  const path = getModelsPath();
  if (!existsSync(path)) return { providers: {} };
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return { providers: {} };
  }
}

function writeModelsJson(data: Record<string, unknown>): void {
  const path = getModelsPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

const MODELS_DEV_URL = "https://models.dev/api.json";
const CATALOG_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

interface CatalogCache {
  entries: ModelCatalogEntry[];
  expiresAt: number;
  inFlight?: Promise<ModelCatalogEntry[]>;
}

let modelsDevCatalogCache: CatalogCache | undefined;

function getCatalogCache(): CatalogCache {
  return modelsDevCatalogCache ??= { entries: [], expiresAt: 0 };
}

async function fetchCatalog(): Promise<ModelCatalogEntry[]> {
  const response = await fetch(MODELS_DEV_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`models.dev returned HTTP ${response.status}`);
  const entries = flattenModelsDevCatalog(await response.json());
  if (entries.length === 0) throw new Error("models.dev returned an empty catalog");
  return entries;
}

async function loadCatalog(): Promise<ModelCatalogEntry[]> {
  const cache = getCatalogCache();
  if (cache.entries.length > 0 && cache.expiresAt > Date.now()) return cache.entries;
  if (!cache.inFlight) {
    cache.inFlight = fetchCatalog().then((entries) => {
      cache.entries = entries;
      cache.expiresAt = Date.now() + CATALOG_TTL_MS;
      return entries;
    }).finally(() => {
      cache.inFlight = undefined;
    });
  }

  try {
    return await cache.inFlight;
  } catch (error) {
    if (cache.entries.length > 0) return cache.entries;
    throw error;
  }
}

const DISCOVERY_TIMEOUT_MS = 20_000;
const TEST_TIMEOUT_MS = 20_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasHeader(headers: Headers, name: string): boolean {
  return headers.has(name);
}

function buildDiscoveryHeaders(api: string, apiKey: string | undefined, configured: Record<string, string>): Headers {
  const headers = new Headers(configured);
  if (!hasHeader(headers, "accept")) headers.set("Accept", "application/json");
  if (!apiKey) return headers;

  if (api === "anthropic-messages") {
    if (!hasHeader(headers, "x-api-key")) headers.set("x-api-key", apiKey);
    if (!hasHeader(headers, "anthropic-version")) headers.set("anthropic-version", "2023-06-01");
  } else if (api === "google-generative-ai") {
    if (!hasHeader(headers, "x-goog-api-key")) headers.set("x-goog-api-key", apiKey);
  } else if (!hasHeader(headers, "authorization")) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  return headers;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getAssistantText(message: AssistantMessage): string {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function registerGitAndModelRoutes(app: Hono): void {
  app.get("/api/git/diff", async (c) => {
    try {
      const cwd = c.req.query("cwd")?.trim() ?? "";
      const filePath = c.req.query("path")?.trim() ?? "";
      if (!cwd || (!cwd.startsWith("/") && !isWindowsAbsolutePath(cwd))) {
        return c.json({ error: "cwd must be an absolute path" }, 400);
      }
      if (!filePath || (!filePath.startsWith("/") && !isWindowsAbsolutePath(filePath))) {
        return c.json({ error: "path must be an absolute path" }, 400);
      }

      const allowedRoots = await getAllowedFileRoots();
      if (!isFilePathAllowed(cwd, allowedRoots) || !isFilePathAllowed(filePath, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }
      // The cwd must resolve inside an allowed root. The file itself may no
      // longer exist when Git reports it as deleted; getGitFileDiff verifies
      // that the requested path belongs to this repository and its status.
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      return c.json(await getGitFileDiff(cwd, filePath));
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
  });

  app.get("/api/git/status", async (c) => {
    try {
      const cwd = c.req.query("cwd")?.trim() ?? "";
      if (!cwd || (!cwd.startsWith("/") && !isWindowsAbsolutePath(cwd))) {
        return c.json({ error: "cwd must be an absolute path" }, 400);
      }

      const allowedRoots = await getAllowedFileRoots();
      if (!isFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      let dirStat: fs.Stats;
      try {
        dirStat = fs.statSync(cwd);
      } catch {
        return c.json({ error: "Directory not found" }, 404);
      }
      if (!dirStat.isDirectory()) {
        return c.json({ error: "Not a directory" }, 400);
      }
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      return c.json(await getGitStatus(cwd));
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
  });

  app.get("/api/models", async (c) => {
    const requestedCwd = c.req.query("cwd") || process.cwd();
    const cwd = resolve(requestedCwd);

    let cwdStat;
    try {
      cwdStat = await stat(cwd);
    } catch {
      return c.json({ error: `Directory does not exist: ${cwd}` }, 400);
    }
    if (!cwdStat.isDirectory()) {
      return c.json({ error: `Not a directory: ${cwd}` }, 400);
    }
    const allowedRoots = await getAllowedFileRoots();
    if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
      return c.json({ error: "Access denied" }, 403);
    }

    try {
      return c.json(await loadModelsWithCache(cwd, () => loadModels(cwd)));
    } catch {
      return c.json(EMPTY_MODELS);
    }
  });

  app.get("/api/models-config", (c) => c.json(readModelsJson()));

  app.put("/api/models-config", async (c) => {
    try {
      const body = await c.req.json() as Record<string, unknown>;
      writeModelsJson(body);
      invalidateModelsCache();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/models-config/catalog", async (c) => {
    const query = (c.req.query("q") ?? "").slice(0, 120);
    const provider = (c.req.query("provider") ?? "").slice(0, 120);
    const baseUrl = (c.req.query("baseUrl") ?? "").slice(0, 500);
    const parsedLimit = Number.parseInt(c.req.query("limit") ?? "50", 10);
    const limit = Number.isFinite(parsedLimit) ? parsedLimit : 50;

    try {
      const entries = await loadCatalog();
      const models = searchModelCatalog(entries, query, provider, limit);
      const recommendation = recommendModelCatalogPreset(entries, query, provider, baseUrl);
      return c.json({ models, recommendation, source: MODELS_DEV_URL });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : String(error) }, 502);
    }
  });

  app.post("/api/models-config/discover", async (c) => {
    try {
      const body = await c.req.json() as { providerName?: unknown; provider?: unknown };
      const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
      if (!providerName) return c.json({ error: "providerName is required" }, 400);
      if (!isRecord(body.provider)) return c.json({ error: "provider is required" }, 400);

      const baseUrl = typeof body.provider.baseUrl === "string" ? body.provider.baseUrl.trim() : "";
      if (!baseUrl) return c.json({ error: "Base URL is required" }, 400);
      const api = typeof body.provider.api === "string" && body.provider.api
        ? body.provider.api
        : "openai-completions";

      let endpoint: URL;
      try {
        endpoint = buildModelsListUrl(baseUrl, api);
      } catch {
        return c.json({ error: "Base URL is invalid" }, 400);
      }

      const auth = await resolveModelDiscoveryAuth(providerName, body.provider);
      if (typeof body.provider.apiKey === "string" && body.provider.apiKey.trim() && !auth.apiKey) {
        return c.json({ error: `No API key found for "${providerName}"` }, 400);
      }

      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: buildDiscoveryHeaders(api, auth.apiKey, auth.headers),
        signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
      });
      const responseText = await response.text();
      if (!response.ok) {
        return c.json({
          error: responseText.slice(0, 500) || `Upstream returned HTTP ${response.status}`,
          status: response.status,
        }, 502);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(responseText);
      } catch {
        return c.json({ error: "Upstream model list was not valid JSON" }, 502);
      }
      const models = parseDiscoveredModels(payload);
      if (models.length === 0) {
        return c.json({ error: "No models found in the upstream response" }, 502);
      }

      return c.json({ models, endpoint: endpoint.toString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = error instanceof DOMException && error.name === "TimeoutError" ? 504 : 500;
      return c.json({ error: message }, status);
    }
  });

  app.post("/api/models-config/test", async (c) => {
    // The global security middleware already enforces isApiRequestAllowed.
    if (!hasJsonContentType(c.req.raw)) {
      return c.json(
        { ok: false, error: "Content-Type must be application/json" },
        415,
      );
    }

    let tempDir: string | undefined;

    try {
      const body = await c.req.json() as { providerName?: unknown; provider?: unknown; model?: unknown };
      const providerName = typeof body.providerName === "string" ? body.providerName.trim() : "";
      if (!providerName) return c.json({ ok: false, error: "providerName is required" }, 400);
      if (!isRecord(body.provider)) return c.json({ ok: false, error: "provider is required" }, 400);
      if (!isRecord(body.model)) return c.json({ ok: false, error: "model is required" }, 400);

      const modelId = typeof body.model.id === "string" ? body.model.id.trim() : "";
      if (!modelId) return c.json({ ok: false, error: "Model ID is required" }, 400);

      tempDir = mkdtempSync(join(tmpdir(), "pi-web-model-test-"));
      const modelsPath = join(tempDir, "models.json");
      writeFileSync(modelsPath, JSON.stringify({
        providers: {
          [providerName]: {
            ...body.provider,
            models: [{ ...body.model, id: modelId }],
          },
        },
      }, null, 2), "utf8");

      const modelRuntime = await ModelRuntime.create({ modelsPath });
      const loadError = modelRuntime.getError();
      if (loadError) return c.json({ ok: false, error: loadError });

      const model = modelRuntime.getModel(providerName, modelId);
      if (!model) return c.json({ ok: false, error: `Model not found: ${providerName}/${modelId}` });

      const resolved = await modelRuntime.getAuth(model);
      if (!resolved?.auth.apiKey) {
        return c.json({ ok: false, error: `No API key found for "${providerName}"` });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);
      let status: number | undefined;
      const startedAt = Date.now();

      try {
        const message = await completeSimple(model, {
          messages: [{
            role: "user",
            content: "Reply with OK only.",
            timestamp: Date.now(),
          }],
        }, {
          apiKey: resolved.auth.apiKey,
          headers: resolved.auth.headers,
          maxTokens: 16,
          timeoutMs: TEST_TIMEOUT_MS,
          maxRetries: 0,
          cacheRetention: "none",
          signal: controller.signal,
          onResponse: (response) => { status = response.status; },
        });

        const latencyMs = Date.now() - startedAt;
        if (message.stopReason === "error" || message.stopReason === "aborted") {
          return c.json({
            ok: false,
            error: message.errorMessage ?? (controller.signal.aborted ? "Test timed out" : "Model returned an error"),
            latencyMs,
            status,
          });
        }

        return c.json({
          ok: true,
          latencyMs,
          status,
          responseText: getAssistantText(message).slice(0, 300),
        });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      return c.json({ ok: false, error: errorMessage(error) }, 500);
    } finally {
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    }
  });
}
