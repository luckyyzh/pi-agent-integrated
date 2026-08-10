import type { Hono } from "hono";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import {
  DefaultPackageManager,
  getAgentDir,
  SettingsManager,
  type PackageSource,
  type ResolvedPaths,
  type ResolvedResource,
} from "@earendil-works/pi-coding-agent";
import { getAllowedFileRoots, isExistingFilePathAllowed } from "../lib/file-access";
import { hasJsonContentType } from "../lib/request-security";
import { getProjectTrustStatus } from "../lib/project-trust";
import { createAppSettingsManager, getManagedRuntimePaths, isManagedPath, isManagedRuntime } from "../lib/app-runtime";
import type {
  ExtensionInfo,
  ExtensionsResponse,
  PluginDiagnostic,
  PluginPackageInfo,
  PluginResourceCounts,
  PluginResourceInfo,
  PluginResourceKind,
  PluginScope,
  PluginsResponse,
} from "../lib/api-types";

function extensionName(path: string): string {
  const file = basename(path);
  const extension = extname(file);
  if (/^index\.(ts|js)$/.test(file)) return basename(dirname(path));
  return extension ? file.slice(0, -extension.length) : file;
}

function extensionFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  try {
    const stats = statSync(root);
    if (stats.isFile()) return /\.(?:ts|js)$/.test(root) ? [root] : [];
    if (!stats.isDirectory()) return [];
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) files.push(...extensionFiles(entryPath));
    else if (entry.isFile() && /\.(?:ts|js)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function infoFromResource(resource: ResolvedResource, scopeOverride?: ExtensionInfo["scope"]): ExtensionInfo {
  const baseDir = resource.metadata.baseDir ?? dirname(resource.path);
  const rel = relative(baseDir, resource.path);
  return {
    name: extensionName(resource.path),
    path: resource.path,
    relativePath: rel && !rel.startsWith("..") ? rel : resource.path,
    source: scopeOverride === "builtin" ? "resources" : resource.metadata.source,
    scope: scopeOverride ?? (resource.metadata.scope === "project" ? "project" : "global"),
    status: resource.enabled ? "enabled" : "disabled",
  };
}

function blockedInfo(path: string): ExtensionInfo {
  return {
    name: extensionName(path),
    path,
    relativePath: relative(dirname(dirname(path)), path),
    source: "project",
    scope: "project",
    status: "blocked",
  };
}

function byPathHasScope(entries: Map<string, ExtensionInfo>, scope: ExtensionInfo["scope"]): boolean {
  for (const entry of entries.values()) {
    if (entry.scope === scope) return true;
  }
  return false;
}

type PluginAction = "install" | "remove" | "update" | "disable" | "enable";

function emptyCounts(): PluginResourceCounts {
  return { extensions: 0, skills: 0, prompts: 0, themes: 0 };
}

function toPluginScope(scope: string): PluginScope {
  return scope === "project" ? "project" : "global";
}

function keyFor(source: string, scope: PluginScope): string {
  return `${scope}\0${source}`;
}

function getPackageSource(entry: PackageSource): string {
  return typeof entry === "string" ? entry : entry.source;
}

function isDisabledPackage(entry: PackageSource): boolean {
  if (typeof entry === "string") return false;
  return (
    Array.isArray(entry.extensions) && entry.extensions.length === 0 &&
    Array.isArray(entry.skills) && entry.skills.length === 0 &&
    Array.isArray(entry.prompts) && entry.prompts.length === 0 &&
    Array.isArray(entry.themes) && entry.themes.length === 0
  );
}

function getDisabledPackages(settingsManager: SettingsManager): Map<string, boolean> {
  const disabled = new Map<string, boolean>();
  for (const entry of settingsManager.getGlobalSettings().packages ?? []) {
    disabled.set(keyFor(getPackageSource(entry), "global"), isDisabledPackage(entry));
  }
  for (const entry of settingsManager.getProjectSettings().packages ?? []) {
    disabled.set(keyFor(getPackageSource(entry), "project"), isDisabledPackage(entry));
  }
  return disabled;
}

function setPackageDisabled(
  settingsManager: SettingsManager,
  source: string,
  scope: PluginScope,
  disabled: boolean,
): boolean {
  const current = scope === "project"
    ? settingsManager.getProjectSettings().packages ?? []
    : settingsManager.getGlobalSettings().packages ?? [];
  let changed = false;
  const next = current.map((entry): PackageSource => {
    if (getPackageSource(entry) !== source) return entry;
    changed = true;
    if (disabled) {
      return {
        ...(typeof entry === "string" ? { source: entry } : entry),
        extensions: [],
        skills: [],
        prompts: [],
        themes: [],
      };
    }
    return getPackageSource(entry);
  });
  if (!changed) return false;
  if (scope === "project") settingsManager.setProjectPackages(next);
  else settingsManager.setPackages(next);
  return true;
}

function addCount(counts: PluginResourceCounts, kind: keyof PluginResourceCounts): void {
  counts[kind] += 1;
}

function getResourceName(path: string, kind: PluginResourceKind): string {
  const file = basename(path);
  const ext = extname(file);
  if (kind === "skill" && file.toLowerCase() === "skill.md") return basename(dirname(path));
  if ((kind === "extension" || kind === "theme" || kind === "prompt") && ext) {
    if (kind === "extension" && /^index\.(ts|js)$/.test(file)) return basename(dirname(path));
    return file.slice(0, -ext.length);
  }
  return file;
}

function getRelativePath(resource: ResolvedResource): string {
  const baseDir = resource.metadata.baseDir;
  if (!baseDir) return resource.path;
  const rel = relative(baseDir, resource.path);
  return rel && !rel.startsWith("..") ? rel : resource.path;
}

function getConfiguredVersion(source: string): string | undefined {
  const npmSpec = source.startsWith("npm:") ? source.slice(4) : undefined;
  if (npmSpec) {
    const lastAt = npmSpec.lastIndexOf("@");
    const packageNameEnd = npmSpec.startsWith("@") ? npmSpec.indexOf("/", 1) : 0;
    if (lastAt > packageNameEnd) return npmSpec.slice(lastAt + 1) || undefined;
    return undefined;
  }

  if (source.startsWith("git:") || /^[a-z]+:\/\//.test(source)) {
    const lastAt = source.lastIndexOf("@");
    const lastSlash = source.lastIndexOf("/");
    const lastColon = source.lastIndexOf(":");
    if (lastAt > Math.max(lastSlash, lastColon)) return source.slice(lastAt + 1) || undefined;
  }
  return undefined;
}

function readPackageMetadata(installedPath?: string): { packageName?: string; version?: string } {
  if (!installedPath) return {};
  try {
    const stats = statSync(installedPath);
    const packageJsonPath = stats.isDirectory()
      ? join(installedPath, "package.json")
      : join(dirname(installedPath), "package.json");
    if (!existsSync(packageJsonPath)) return {};
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      name?: unknown;
      version?: unknown;
    };
    return {
      packageName: typeof parsed.name === "string" ? parsed.name : undefined,
      version: typeof parsed.version === "string" ? parsed.version : undefined,
    };
  } catch {
    return {};
  }
}

function collectResource(
  resource: ResolvedResource,
  kind: keyof PluginResourceCounts,
  countsByPackage: Map<string, PluginResourceCounts>,
  resourcesByPackage: Map<string, PluginResourceInfo[]>,
  totals: PluginResourceCounts,
): void {
  if (!isManagedPath(resource.path)) return;
  if (!resource.enabled || resource.metadata.origin !== "package") return;
  const source = resource.metadata.source;
  const scope = toPluginScope(resource.metadata.scope);
  const key = keyFor(source, scope);
  const counts = countsByPackage.get(key) ?? emptyCounts();
  addCount(counts, kind);
  addCount(totals, kind);
  countsByPackage.set(key, counts);
  const resources = resourcesByPackage.get(key) ?? [];
  const resourceKind = kind === "extensions"
    ? "extension"
    : kind === "skills"
      ? "skill"
      : kind === "prompts"
        ? "prompt"
        : "theme";
  resources.push({
    kind: resourceKind,
    name: getResourceName(resource.path, resourceKind),
    path: resource.path,
    relativePath: getRelativePath(resource),
  });
  resourcesByPackage.set(key, resources);
}

function collectResources(paths: ResolvedPaths): {
  countsByPackage: Map<string, PluginResourceCounts>;
  resourcesByPackage: Map<string, PluginResourceInfo[]>;
  totals: PluginResourceCounts;
} {
  const countsByPackage = new Map<string, PluginResourceCounts>();
  const resourcesByPackage = new Map<string, PluginResourceInfo[]>();
  const totals = emptyCounts();
  for (const resource of paths.extensions) collectResource(resource, "extensions", countsByPackage, resourcesByPackage, totals);
  for (const resource of paths.skills) collectResource(resource, "skills", countsByPackage, resourcesByPackage, totals);
  for (const resource of paths.prompts) collectResource(resource, "prompts", countsByPackage, resourcesByPackage, totals);
  for (const resource of paths.themes) collectResource(resource, "themes", countsByPackage, resourcesByPackage, totals);
  return { countsByPackage, resourcesByPackage, totals };
}

async function readPlugins(cwd: string): Promise<PluginsResponse> {
  const agentDir = getAgentDir();
  const projectTrust = getProjectTrustStatus(cwd, agentDir);
  const settingsManager = createAppSettingsManager(cwd, agentDir, projectTrust.trusted);
  const packageManager = new DefaultPackageManager({
    cwd,
    agentDir,
    settingsManager,
  });

  const diagnostics: PluginDiagnostic[] = [];
  let countsByPackage = new Map<string, PluginResourceCounts>();
  let resourcesByPackage = new Map<string, PluginResourceInfo[]>();
  let totals = emptyCounts();
  const disabledByPackage = getDisabledPackages(settingsManager);

  try {
    const resolved = await packageManager.resolve(async (source) => {
      diagnostics.push({
        type: "warning",
        source,
        message: "Package is configured but not installed yet.",
      });
      return "skip";
    });
    ({ countsByPackage, resourcesByPackage, totals } = collectResources(resolved));
  } catch (error) {
    diagnostics.push({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const packages = packageManager.listConfiguredPackages().map((pkg) => {
    const scope = toPluginScope(pkg.scope);
    const key = keyFor(pkg.source, scope);
    const disabled = disabledByPackage.get(key) ?? false;
    const counts = countsByPackage.get(key) ?? emptyCounts();
    const resources = resourcesByPackage.get(key) ?? [];
    const resourceCount = counts.extensions + counts.skills + counts.prompts + counts.themes;
    const packageMetadata = readPackageMetadata(pkg.installedPath);
    if (!pkg.installedPath) {
      diagnostics.push({
        type: "warning",
        source: pkg.source,
        message: "Configured package path was not found.",
      });
    }
    return {
      source: pkg.source,
      scope,
      filtered: pkg.filtered,
      disabled,
      installedPath: pkg.installedPath,
      packageName: packageMetadata.packageName,
      version: packageMetadata.version,
      configuredVersion: getConfiguredVersion(pkg.source),
      counts,
      resources,
      status: disabled ? "disabled" : resourceCount > 0 ? "loaded" : pkg.installedPath ? "installed" : "missing",
    } satisfies PluginPackageInfo;
  });

  return {
    packages,
    totals,
    diagnostics,
    projectResourcesLoaded: projectTrust.trusted,
  };
}

function readScope(scope: unknown): PluginScope {
  if (isManagedRuntime()) return "global";
  return scope === "project" ? "project" : "global";
}

function isRemotePackageSource(source: string): boolean {
  return source.startsWith("npm:") || source.startsWith("git:") || /^[a-z]+:\/\//i.test(source);
}

interface McpConfigFile {
  mcpServers: Record<string, Record<string, unknown>>;
  settings?: Record<string, unknown>;
  imports?: string[];
}

function getMcpPath(): string {
  return join(getAgentDir(), "mcp.json");
}

function readMcpJson(): McpConfigFile {
  const path = getMcpPath();
  if (!existsSync(path)) return { mcpServers: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as McpConfigFile;
    if (!parsed || typeof parsed !== "object" || typeof parsed.mcpServers !== "object") {
      return { mcpServers: {} };
    }
    return parsed;
  } catch {
    return { mcpServers: {} };
  }
}

function writeMcpJson(data: McpConfigFile): void {
  const path = getMcpPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

interface VisionConfigFile {
  backend?: "ollama" | "openai";
  ollama?: { host?: string; model?: string };
  openai?: { baseUrl?: string; apiKey?: string; model?: string };
}

function getVisionPath(): string {
  return join(getAgentDir(), "vision.json");
}

function readVisionJson(): VisionConfigFile {
  const path = getVisionPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as VisionConfigFile;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeVisionJson(data: VisionConfigFile): void {
  const path = getVisionPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function registerConfigRoutes(app: Hono): void {
  app.get("/api/extensions", async (c) => {
    const cwd = c.req.query("cwd") ?? null;
    if (!cwd) return c.json({ error: "cwd required" }, 400);

    try {
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const agentDir = getAgentDir();
      const trust = getProjectTrustStatus(cwd, agentDir);
      const settingsManager = createAppSettingsManager(cwd, agentDir, trust.trusted);
      const packageManager = new DefaultPackageManager({ cwd, agentDir, settingsManager });
      const diagnostics: PluginDiagnostic[] = [];
      const byPath = new Map<string, ExtensionInfo>();

      try {
        const resolved = await packageManager.resolve(async () => "skip");
        for (const resource of resolved.extensions) {
          // Package-provided extensions belong to the plugin panel, not here.
          if (resource.metadata.origin !== "top-level") continue;
          byPath.set(resource.path, infoFromResource(resource));
        }
      } catch (error) {
        diagnostics.push({ type: "error", message: error instanceof Error ? error.message : String(error) });
      }

      if (isManagedRuntime()) {
        const resourcesRoot = resolve(getManagedRuntimePaths().resourcesDir, "extensions");
        const builtIn = await packageManager.resolveExtensionSources([resourcesRoot], { temporary: true });
        for (const resource of builtIn.extensions) {
          byPath.set(resource.path, infoFromResource(resource, "builtin"));
        }
      }

      const projectExtensionsRoot = join(cwd, ".pi", "extensions");
      if (trust.requiresTrust && !trust.trusted) {
        for (const path of extensionFiles(projectExtensionsRoot)) {
          byPath.set(path, blockedInfo(path));
        }
        if (byPathHasScope(byPath, "project")) {
          diagnostics.push({ type: "warning", source: "project", message: "Project extensions are blocked until this project is trusted." });
        }
      }

      const scopeOrder: Record<ExtensionInfo["scope"], number> = { project: 0, builtin: 1, global: 2 };
      const extensions = [...byPath.values()].sort((a, b) => (
        scopeOrder[a.scope] - scopeOrder[b.scope] || a.name.localeCompare(b.name) || a.path.localeCompare(b.path)
      ));
      return c.json({ extensions, diagnostics, projectResourcesLoaded: trust.trusted } satisfies ExtensionsResponse);
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/mcp", (c) => c.json({ config: readMcpJson(), path: getMcpPath() }));

  app.put("/api/mcp", async (c) => {
    try {
      const body = (await c.req.json()) as McpConfigFile;
      if (!body || typeof body !== "object" || typeof body.mcpServers !== "object" || body.mcpServers === null) {
        return c.json({ error: "mcpServers must be an object" }, 400);
      }
      // 只保留已知顶层字段，避免写入无关键
      const out: McpConfigFile = { mcpServers: body.mcpServers };
      if (body.settings && typeof body.settings === "object") out.settings = body.settings;
      if (Array.isArray(body.imports)) out.imports = body.imports;
      writeMcpJson(out);
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/vision-config", (c) => c.json({ config: readVisionJson(), path: getVisionPath() }));

  app.put("/api/vision-config", async (c) => {
    try {
      const body = (await c.req.json()) as VisionConfigFile;
      if (!body || typeof body !== "object") {
        return c.json({ error: "body must be an object" }, 400);
      }
      const out: VisionConfigFile = {};
      if (body.backend === "ollama" || body.backend === "openai") out.backend = body.backend;
      if (body.ollama && typeof body.ollama === "object") {
        out.ollama = {};
        if (typeof body.ollama.host === "string" && body.ollama.host.trim()) out.ollama.host = body.ollama.host.trim();
        if (typeof body.ollama.model === "string" && body.ollama.model.trim()) out.ollama.model = body.ollama.model.trim();
      }
      if (body.openai && typeof body.openai === "object") {
        out.openai = {};
        if (typeof body.openai.baseUrl === "string" && body.openai.baseUrl.trim()) out.openai.baseUrl = body.openai.baseUrl.trim();
        if (typeof body.openai.apiKey === "string" && body.openai.apiKey.trim()) out.openai.apiKey = body.openai.apiKey.trim();
        if (typeof body.openai.model === "string" && body.openai.model.trim()) out.openai.model = body.openai.model.trim();
      }
      writeVisionJson(out);
      return c.json({ success: true, path: getVisionPath() });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/plugins", async (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) return c.json({ error: "cwd required" }, 400);

    try {
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }
      return c.json(await readPlugins(cwd));
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // POST /api/plugins body: { action, source?, scope?, cwd }
  app.post("/api/plugins", async (c) => {
    // The global security middleware already enforces isApiRequestAllowed.
    if (!hasJsonContentType(c.req.raw)) {
      return c.json({ error: "Content-Type must be application/json" }, 415);
    }

    try {
      const body = await c.req.json() as {
        action?: PluginAction;
        source?: string;
        scope?: PluginScope;
        cwd?: string;
      };
      if (!body.cwd) return c.json({ error: "cwd required" }, 400);
      if (!body.action) return c.json({ error: "action required" }, 400);
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(body.cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const agentDir = getAgentDir();
      const projectTrust = getProjectTrustStatus(body.cwd, agentDir);
      const settingsManager = createAppSettingsManager(body.cwd, agentDir, projectTrust.trusted);
      const scope = readScope(body.scope);
      if (scope === "project" && !projectTrust.trusted) {
        return c.json(
          { error: "Project resources must be trusted before modifying project plugins" },
          403,
        );
      }
      const packageManager = new DefaultPackageManager({
        cwd: body.cwd,
        agentDir,
        settingsManager,
      });
      const source = body.source?.trim();
      const local = scope === "project";

      if (
        source &&
        isManagedRuntime() &&
        !isRemotePackageSource(source) &&
        !isManagedPath(resolve(body.cwd, source))
      ) {
        return c.json(
          { error: "Local plugins must be stored inside the integrated application directory" },
          400,
        );
      }

      if (body.action === "install") {
        if (!source) return c.json({ error: "source required" }, 400);
        await packageManager.installAndPersist(source, { local });
      } else if (body.action === "remove") {
        if (!source) return c.json({ error: "source required" }, 400);
        await packageManager.removeAndPersist(source, { local });
      } else if (body.action === "update") {
        await packageManager.update(source);
      } else if (body.action === "disable") {
        if (!source) return c.json({ error: "source required" }, 400);
        setPackageDisabled(settingsManager, source, scope, true);
        await settingsManager.flush();
      } else if (body.action === "enable") {
        if (!source) return c.json({ error: "source required" }, 400);
        setPackageDisabled(settingsManager, source, scope, false);
        await settingsManager.flush();
      } else {
        return c.json({ error: `Unsupported action: ${body.action}` }, 400);
      }

      return c.json(await readPlugins(body.cwd));
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
  });
}
