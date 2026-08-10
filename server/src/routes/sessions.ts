import type { Hono } from "hono";
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SessionManager, type AgentSession } from "@earendil-works/pi-coding-agent";
import {
  resolveSessionPath,
  resolveSessionIdByPath,
  invalidateSessionPathCache,
  invalidateSessionListCache,
  buildSessionContext,
  readSessionHeader,
  listAllSessions,
  getSessionEntries,
} from "../lib/session-reader";
import { sessionPathKey } from "../lib/session-path";
import { getRpcSession, getRunningRpcSessionIds, startRpcSession } from "../lib/rpc-manager";
import { generateSessionTitle } from "../lib/session-title";

const execFileAsync = promisify(execFile);

// BranchNavigator still traverses recursively, so keep the response tree shallow.
const MAX_PROJECTED_TREE_DEPTH = 200;

/**
 * Project the session tree into the shallow navigation tree sent to the client.
 * Keeps roots, branch points, and leaves while contracting single-child chains
 * without recursive traversal. Contracted entry IDs are attached to the next
 * visible node so the UI can still recognize an active leaf inside the chain.
 */
function projectTreeForResponse<T extends { entry: { id: string }; children: T[]; compressedEntryIds?: string[] }>(
  nodes: T[]
): T[] {
  const keep = new Set<T>();
  const roots = new Set(nodes);
  const seen = new Set<T>();
  const stack = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (seen.has(node)) continue;
    seen.add(node);

    if (
      roots.has(node) ||
      node.children.length !== 1
    ) {
      keep.add(node);
    }

    for (const child of node.children) {
      stack.push(child);
    }
  }

  const cloneNode = (node: T, compressedEntryIds?: string[]): T => ({
    ...node,
    children: [],
    ...(compressedEntryIds?.length ? { compressedEntryIds } : {}),
  });
  const projectedRoots = nodes.map((node) => cloneNode(node));
  const tasks = nodes.map((source, index) => ({
    source,
    projected: projectedRoots[index],
    depth: 1,
  }));

  const appendFlattenedKeptDescendants = (source: T, projectedParent: T) => {
    const pending = [{ node: source, compressedEntryIds: [] as string[] }];
    const flattenedSeen = new Set<T>();

    while (pending.length > 0) {
      const { node, compressedEntryIds } = pending.pop()!;
      if (flattenedSeen.has(node)) continue;
      flattenedSeen.add(node);

      if (keep.has(node)) {
        projectedParent.children.push(cloneNode(node, compressedEntryIds));
      }

      for (let i = node.children.length - 1; i >= 0; i--) {
        pending.push({
          node: node.children[i],
          compressedEntryIds: keep.has(node)
            ? []
            : [...compressedEntryIds, node.entry.id],
        });
      }
    }
  };

  while (tasks.length > 0) {
    const { source, projected, depth } = tasks.pop()!;

    for (const sourceChild of source.children) {
      let child = sourceChild;

      if (depth >= MAX_PROJECTED_TREE_DEPTH) {
        appendFlattenedKeptDescendants(child, projected);
        continue;
      }

      const compressedEntryIds: string[] = [];
      while (!keep.has(child) && child.children.length === 1) {
        compressedEntryIds.push(child.entry.id);
        child = child.children[0];
      }

      if (!keep.has(child)) {
        continue;
      }

      const projectedChild = cloneNode(child, compressedEntryIds);
      projected.children.push(projectedChild);
      tasks.push({ source: child, projected: projectedChild, depth: depth + 1 });
    }
  }

  return projectedRoots;
}

type PiCodingAgentModule = {
  getPackageDir: () => string;
};

type ExportHtmlModule = {
  exportFromFile: (inputPath: string, outputPath: string) => Promise<string>;
};

async function getPiPackageDir(): Promise<string | null> {
  try {
    const { getPackageDir } = (await import("@earendil-works/pi-coding-agent")) as PiCodingAgentModule;
    return getPackageDir();
  } catch {
    return null;
  }
}

function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (ch) =>
    `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function getContentDisposition(fileName: string, inline: boolean): string {
  const fallback = fileName.replace(/[^\x20-\x7E]|["\\;\r\n]/g, "_") || "session.html";
  const disposition = inline ? "inline" : "attachment";
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeHeaderValue(fileName)}`;
}

async function getPiCliPath(): Promise<string | null> {
  const candidates = new Set<string>();
  const packageDir = await getPiPackageDir();

  if (packageDir) {
    candidates.add(join(packageDir, "dist", "cli.js"));
  }

  try {
    const resolver = (import.meta as ImportMeta & {
      resolve?: (specifier: string) => string | Promise<string>;
    }).resolve;
    if (typeof resolver === "function") {
      const indexUrl = await resolver("@earendil-works/pi-coding-agent");
      candidates.add(join(dirname(fileURLToPath(indexUrl)), "cli.js"));
    }
  } catch {
    // Some runtimes strip import.meta.resolve.
  }

  candidates.add(
    join(
      process.cwd(),
      "node_modules",
      "@earendil-works",
      "pi-coding-agent",
      "dist",
      "cli.js"
    )
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Patch the exported HTML to fix recursive functions that overflow
 * the call stack on deep linear session trees (e.g., 5000+ entries).
 * Replaces sortChildren / mapNodes / markActive with iterative
 * equivalents; see the pi-web route for the full root-cause notes.
 * Line endings are normalized to LF before matching.
 */
function patchExportHtml(html: string): string {
  const n = (s: string) => s.replace(/\r\n/g, "\n");
  html = n(html);

  const replaceRequired = (source: string, name: string, search: string, replacement: string) => {
    const normalizedSearch = n(search);
    const normalizedReplacement = n(replacement);
    const matches = source.split(normalizedSearch).length - 1;
    if (matches !== 1) {
      throw new Error(`Failed to patch exported HTML: ${name} expected 1 match, found ${matches}`);
    }
    return source.replace(normalizedSearch, normalizedReplacement);
  };

  html = replaceRequired(
    html,
    "sortChildren",
    `        function sortChildren(node) {
          node.children.sort((a, b) =>
            new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime()
          );
          node.children.forEach(sortChildren);
        }`,
    `        function sortChildren(root) {
          const stack = [root];
          while (stack.length) {
            const node = stack.pop();
            node.children.sort((a, b) =>
              new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime()
            );
            for (let i = node.children.length - 1; i >= 0; i--) {
              stack.push(node.children[i]);
            }
          }
        }`
  );

  html = replaceRequired(
    html,
    "mapNodes",
    `          function mapNodes(node) {
            treeNodeMap.set(node.entry.id, node);
            node.children.forEach(mapNodes);
          }
          tree.forEach(mapNodes);`,
    `          const stack = [...tree].reverse();
          while (stack.length) {
            const node = stack.pop();
            treeNodeMap.set(node.entry.id, node);
            for (let i = node.children.length - 1; i >= 0; i--) {
              stack.push(node.children[i]);
            }
          }`
  );

  html = replaceRequired(
    html,
    "markActive",
    `        function markActive(node) {
          let has = activePathIds.has(node.entry.id);
          for (const child of node.children) {
            if (markActive(child)) has = true;
          }
          containsActive.set(node, has);
          return has;
        }`,
    `        function markActive(root) {
          // Post-order traversal using two stacks
          const stack1 = [root];
          const stack2 = [];
          while (stack1.length) {
            const node = stack1.pop();
            stack2.push(node);
            for (const child of node.children) {
              stack1.push(child);
            }
          }
          while (stack2.length) {
            const node = stack2.pop();
            let has = activePathIds.has(node.entry.id);
            for (const child of node.children) {
              if (containsActive.get(child)) has = true;
            }
            containsActive.set(node, has);
          }
        }`
  );

  return html;
}

async function exportSession(filePath: string, outputPath: string): Promise<void> {
  const cliPath = await getPiCliPath();
  if (cliPath) {
    await execFileAsync(process.execPath, [cliPath, "--export", filePath, outputPath], {
      cwd: process.cwd(),
      timeout: 30_000,
      env: {
        ...process.env,
        PI_OFFLINE: "1",
        PI_SKIP_VERSION_CHECK: "1",
      },
      maxBuffer: 1024 * 1024,
    });
    return;
  }

  const packageDir = await getPiPackageDir();
  if (!packageDir) throw new Error("pi CLI not found");

  const exporterUrl = pathToFileURL(join(packageDir, "dist", "core", "export-html", "index.js")).href;
  const { exportFromFile } = (await import(exporterUrl)) as ExportHtmlModule;
  await exportFromFile(filePath, outputPath);
}

export function registerSessionRoutes(app: Hono): void {
  app.get("/api/sessions", async (c) => {
    try {
      const sessions = await listAllSessions();
      return c.json({ sessions, runningSessionIds: getRunningRpcSessionIds() });
    } catch (error) {
      return c.json(
        { error: String(error) },
        500
      );
    }
  });

  app.get("/api/sessions/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      const sm = SessionManager.open(filePath);
      const entries = sm.getEntries() as never;
      const leafId = sm.getLeafId();
      const tree = projectTreeForResponse(sm.getTree());
      const url = new URL(c.req.raw.url);
      const deferThinking = url.searchParams.has("deferThinking");
      const deferToolResultImages = url.searchParams.has("deferMedia");
      const context = buildSessionContext(entries, leafId, { deferThinking, deferToolResultImages });

      const header = sm.getHeader();
      let modified = header?.timestamp ?? new Date().toISOString();
      try { modified = statSync(filePath).mtime.toISOString(); } catch { /* use header timestamp */ }
      const parentSessionId = header?.parentSession
        ? await resolveSessionIdByPath(header.parentSession)
        : undefined;
      const info = header ? {
        path: filePath,
        id: header.id,
        cwd: header.cwd ?? "",
        name: sm.getSessionName(),
        created: header.timestamp,
        modified,
        messageCount: context.messages.length,
        firstMessage: context.messages.find((m) => m.role === "user")
          ? (() => {
              const msg = context.messages.find((m) => m.role === "user")!;
              const content = (msg as { content: unknown }).content;
              return typeof content === "string" ? content : (Array.isArray(content) ? (content.find((b: { type: string }) => b.type === "text") as { text: string } | undefined)?.text ?? "" : "") || "(no messages)";
            })()
          : "(no messages)",
        parentSessionId,
      } : null;

      return c.json({
        sessionId: id,
        filePath,
        info,
        leafId,
        tree,
        context,
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // PATCH /api/sessions/:id  body: { name: string }
  app.patch("/api/sessions/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const { name } = await c.req.json() as { name?: string };
      if (typeof name !== "string") {
        return c.json({ error: "name is required" }, 400);
      }
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }
      const sm = SessionManager.open(filePath);
      sm.appendSessionInfo(name.trim());
      invalidateSessionListCache();
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // DELETE /api/sessions/:id
  app.delete("/api/sessions/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      // Read only the bounded header before deleting.
      const parentSessionPath = readSessionHeader(filePath)?.parentSession;

      // Re-attach all direct children to this session's parent (cascade re-parent)
      // Scan sibling files in the same directory
      const targetPathKey = sessionPathKey(filePath);
      const dir = dirname(filePath);
      try {
        const files = readdirSync(dir).filter(
          (file) => file.endsWith(".jsonl") && sessionPathKey(join(dir, file)) !== targetPathKey,
        );
        for (const file of files) {
          const childPath = join(dir, file);
          try {
            const content = readFileSync(childPath, "utf8");
            const lines = content.split("\n");
            const header = JSON.parse(lines[0]) as { type?: string; parentSession?: string };
            if (
              header.type === "session" &&
              header.parentSession &&
              sessionPathKey(header.parentSession) === targetPathKey
            ) {
              // Rewrite header with new parentSession
              header.parentSession = parentSessionPath;
              lines[0] = JSON.stringify(header);
              writeFileSync(childPath, lines.join("\n"));
            }
          } catch { /* skip malformed */ }
        }
      } catch { /* skip if dir unreadable */ }

      getRpcSession(id)?.destroy();
      unlinkSync(filePath);
      invalidateSessionPathCache(id);
      invalidateSessionListCache();
      return c.json({ ok: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/sessions/:id/state", async (c) => {
    const id = c.req.param("id");
    try {
      if (!await resolveSessionPath(id)) {
        return c.json({ error: "Session not found" }, 404);
      }

      const rpc = getRpcSession(id);
      if (!rpc?.isAlive()) return c.json({ running: false });

      const state = await rpc.send({ type: "get_state" });
      return c.json({ running: true, state });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/sessions/:id/context", async (c) => {
    const id = c.req.param("id");
    const url = new URL(c.req.raw.url);
    const leafId = url.searchParams.get("leafId") ?? undefined;
    const deferThinking = url.searchParams.has("deferThinking");
    const deferToolResultImages = url.searchParams.has("deferMedia");

    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      const sm = SessionManager.open(filePath);
      const context = buildSessionContext(sm.getEntries() as never, leafId, {
        deferThinking,
        deferToolResultImages,
      });

      return c.json({ context });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.post("/api/sessions/:id/auto-name", async (c) => {
    const id = c.req.param("id");

    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      const cwd = SessionManager.open(filePath).getHeader()?.cwd ?? process.cwd();
      const existing = getRpcSession(id);
      const { session } = existing?.isAlive()
        ? { session: existing }
        : await startRpcSession(id, filePath, cwd);

      // Older wrapper instances may predate waitUntilReady(), but those have
      // already completed startup.
      await session.waitUntilReady?.();
      const result = await generateSessionTitle(session.inner as unknown as AgentSession);

      if (!session.isAlive()) {
        return c.json(
          { error: "The session was closed while its title was being generated. Please try again." },
          409,
        );
      }

      session.inner.setSessionName(result.title);
      invalidateSessionListCache();
      return c.json({ title: result.title, usage: result.usage ?? null });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });

  app.get("/api/sessions/:id/entries/:entryId/thinking", async (c) => {
    const id = c.req.param("id");
    const entryId = c.req.param("entryId");
    const blockIndexParam = c.req.query("blockIndex") ?? null;
    const blockIndex = blockIndexParam === null ? Number.NaN : Number(blockIndexParam);
    if (!Number.isSafeInteger(blockIndex) || blockIndex < 0) {
      return c.json({ error: "Valid blockIndex is required" }, 400);
    }

    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) return c.json({ error: "Session not found" }, 404);

      // SessionManager-backed parsing preserves the SDK's malformed-line tolerance.
      const entry = getSessionEntries(filePath).find((candidate) => candidate.id === entryId);
      if (!entry || entry.type !== "message" || entry.message.role !== "assistant") {
        return c.json({ error: "Assistant message not found" }, 404);
      }

      const block = entry.message.content[blockIndex];
      if (!block || block.type !== "thinking") {
        return c.json({ error: "Thinking block not found" }, 404);
      }

      return c.json({ thinking: block.thinking });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  app.get("/api/sessions/:id/export", async (c) => {
    const id = c.req.param("id");
    const inline = c.req.query("inline") === "1";

    try {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      const tempDir = join(tmpdir(), "pi-web-export");
      mkdirSync(tempDir, { recursive: true });

      const sessionBase = basename(filePath, ".jsonl");
      const fileName = `pi-session-${sessionBase}.html`;
      const outputPath = join(tempDir, `${randomUUID()}.html`);

      try {
        await exportSession(filePath, outputPath);

        const html = readFileSync(outputPath, "utf8");
        const patchedHtml = patchExportHtml(html);
        return new Response(patchedHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": getContentDisposition(fileName, inline),
            "Cache-Control": "no-cache",
            "Content-Security-Policy": "frame-ancestors 'none'",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
          },
        });
      } finally {
        rmSync(outputPath, { force: true });
      }
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
}
