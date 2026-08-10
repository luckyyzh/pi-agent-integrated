import type { Hono } from "hono";
import { stat } from "node:fs/promises";
import { homedir } from "node:os";
import { mkdirSync, statSync, type Stats } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { isAbsolute, resolve } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
  getBrowseStartDirectory,
  getParentDirectory,
  listDirectories,
  resolveDirectory,
} from "../lib/directory-browser";
import { allowFileRoot, getAllowedFileRoots, isExistingFilePathAllowed, isFilePathAllowed, isWindowsAbsolutePath } from "../lib/file-access";
import { buildEntriesFromFiles, filterFileEntries, type FileIndexEntry } from "../lib/file-fuzzy";
import { getManagedRuntimePaths, isManagedRuntime } from "../lib/app-runtime";
import { addWorktree, listWorktrees, removeWorktree, resolveProject } from "../lib/worktree";
import { invalidateModelsCache } from "../lib/models-cache";
import { getProjectTrustStatus, trustProject } from "../lib/project-trust";
import { destroyRpcSessionsForCwd, hasBusyRpcSessionForCwd } from "../lib/rpc-manager";

const execFileAsync = promisify(execFile);

// Same skip lists as /api/files — only used for the non-git readdir fallback.
// Git-tracked repos rely on .gitignore instead (matches the TUI's fd behavior).
const IGNORED_NAMES = new Set([
  "node_modules", ".git", ".next", "dist", "build", "__pycache__",
  ".turbo", ".cache", "coverage", ".pytest_cache", ".mypy_cache",
  "target", "vendor", ".DS_Store",
]);

const IGNORED_SUFFIXES = [".pyc"];

/** Cap on the plain (no-query) response used as the client-side index */
const MAX_FILES = 5000;
/** Hard caps on the full in-memory listing that ?q= searches against */
const GIT_HARD_CAP = 200_000;
const WALK_HARD_CAP = 50_000;
const MAX_WALK_DEPTH = 8;
const MAX_QUERY_LENGTH = 500;
const CACHE_TTL_MS = 10_000;
const CACHE_MAX_ENTRIES = 20;

interface FileListing {
  /** Full listing up to the hard cap (not the client cap) */
  files: string[];
  /** True when even the hard cap was exceeded */
  hardTruncated: boolean;
}

interface CacheEntry {
  listing: FileListing;
  /** Derived lazily on the first ?q= search against this listing */
  entries?: FileIndexEntry[];
  expiresAt: number;
}

// Module-level cache: the @ menu re-requests on every open and searches on
// every keystroke, so listings must not be recomputed within a short window.
let fileIndexCache: Map<string, CacheEntry> | undefined;

function getIndexCache(): Map<string, CacheEntry> {
  if (!fileIndexCache) fileIndexCache = new Map();
  return fileIndexCache;
}

async function listWithGit(cwd: string): Promise<FileListing | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", cwd, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
      { timeout: 10_000, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, LC_ALL: "C" } },
    );
    const all = stdout.split("\0").filter(Boolean);
    if (all.length > GIT_HARD_CAP) {
      return { files: all.slice(0, GIT_HARD_CAP), hardTruncated: true };
    }
    return { files: all, hardTruncated: false };
  } catch {
    // Not a git repo (or git unavailable) — caller falls back to readdir walk.
    return null;
  }
}

function listWithWalk(cwd: string): FileListing {
  const files: string[] = [];
  // BFS so shallow files win when the cap truncates the listing.
  const queue: Array<{ abs: string; rel: string; depth: number }> = [{ abs: cwd, rel: "", depth: 0 }];
  while (queue.length > 0) {
    const { abs, rel, depth } = queue.shift()!;
    let dirents: fs.Dirent[];
    try {
      dirents = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const d of dirents) {
      if (IGNORED_NAMES.has(d.name) || IGNORED_SUFFIXES.some((s) => d.name.endsWith(s))) continue;
      const childRel = rel ? `${rel}/${d.name}` : d.name;
      if (d.isDirectory()) {
        if (depth + 1 <= MAX_WALK_DEPTH) {
          queue.push({ abs: path.join(abs, d.name), rel: childRel, depth: depth + 1 });
        }
      } else if (d.isFile()) {
        if (files.length >= WALK_HARD_CAP) {
          return { files, hardTruncated: true };
        }
        files.push(childRel);
      }
    }
  }
  return { files, hardTruncated: false };
}

function normalizeCwd(cwd: string): string {
  if (cwd === "~") return homedir();
  if (cwd.startsWith("~/")) return resolve(homedir(), cwd.slice(2));
  return isAbsolute(cwd) ? cwd : resolve(cwd);
}

export function registerMiscRoutes(app: Hono): void {
  app.get("/api/home", (c) => c.json({ home: homedir() }));

  app.get("/api/runtime", (c) => {
    if (!isManagedRuntime()) {
      return c.json({ managed: false, agentDir: getAgentDir() });
    }

    const paths = getManagedRuntimePaths();
    return c.json({
      managed: true,
      appRoot: paths.appRoot,
      dataDir: paths.dataDir,
      agentDir: paths.agentDir,
      resourcesDir: paths.resourcesDir,
      skillRoots: paths.managedSkillRoots,
    });
  });

  // POST /api/default-cwd
  // Managed app: creates <dataDir>/workspaces/default.
  // Standalone pi-web: preserves the upstream ~/pi-cwd-<YYYYMMDD> behavior.
  app.post("/api/default-cwd", (c) => {
    try {
      const dir = isManagedRuntime()
        ? path.join(getManagedRuntimePaths().dataDir, "workspaces", "default")
        : path.join(
            homedir(),
            `pi-cwd-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
          );
      mkdirSync(dir, { recursive: true });
      allowFileRoot(dir);
      return c.json({ cwd: dir });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // GET /api/cwd/browse?path=...：列出文件系统中的可读子目录。
  app.get("/api/cwd/browse", async (c) => {
    try {
      const requested = c.req.query("path")?.trim();
      const candidate = getBrowseStartDirectory(requested ?? undefined);

      let resolved: string;
      try {
        resolved = await resolveDirectory(candidate);
      } catch {
        return c.json({ error: "Directory does not exist" }, 404);
      }

      const directoryStat = await stat(resolved);
      if (!directoryStat.isDirectory()) {
        return c.json({ error: "Path is not a directory" }, 400);
      }

      const directories = await listDirectories(resolved);

      return c.json({
        path: resolved,
        parentPath: getParentDirectory(resolved),
        directories,
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // POST /api/cwd/validate  body: { cwd: string }
  // Validates a candidate workspace before the UI selects it.
  app.post("/api/cwd/validate", async (c) => {
    try {
      const body = await c.req.json() as { cwd?: unknown };
      const cwd = typeof body.cwd === "string" ? body.cwd.trim() : "";

      if (!cwd) {
        return c.json({ error: "Path is required" }, 400);
      }

      const normalizedCwd = normalizeCwd(cwd);
      let fileStat: Stats;
      try {
        fileStat = statSync(normalizedCwd);
      } catch {
        return c.json({ error: `Directory does not exist: ${cwd}` }, 400);
      }

      if (!fileStat.isDirectory()) {
        return c.json({ error: `Path is not a directory: ${cwd}` }, 400);
      }

      allowFileRoot(normalizedCwd);
      return c.json({ success: true, cwd: normalizedCwd });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // GET /api/file-index?cwd=/abs/path[&q=query]
  // Without q: { files: string[] (relative to cwd, capped at MAX_FILES),
  // truncated: boolean } — the client-side index for local filtering.
  // With q: { matches: { path, isDir }[] } — ranked against the FULL listing so
  // repos larger than MAX_FILES still find deep files (cap applied after
  // matching, like the TUI passing the query to fd).
  // Guarded by the same allow-list as /api/files.
  app.get("/api/file-index", async (c) => {
    try {
      const cwd = c.req.query("cwd")?.trim() ?? "";
      if (!cwd || (!cwd.startsWith("/") && !isWindowsAbsolutePath(cwd))) {
        return c.json({ error: "cwd must be an absolute path" }, 400);
      }
      const query = c.req.query("q")?.slice(0, MAX_QUERY_LENGTH) ?? "";

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

      const cache = getIndexCache();
      const now = Date.now();
      let cached = cache.get(cwd);
      if (!cached || cached.expiresAt <= now) {
        const listing = (await listWithGit(cwd)) ?? listWithWalk(cwd);
        for (const [key, entry] of cache) {
          if (entry.expiresAt <= now) cache.delete(key);
        }
        if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
        cached = { listing, expiresAt: now + CACHE_TTL_MS };
        cache.set(cwd, cached);
      }

      if (query) {
        cached.entries ??= buildEntriesFromFiles(cached.listing.files);
        return c.json({ matches: filterFileEntries(cached.entries, query) });
      }

      const { files, hardTruncated } = cached.listing;
      return c.json({
        files: files.slice(0, MAX_FILES),
        truncated: hardTruncated || files.length > MAX_FILES,
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // GET /api/worktrees?cwd=  →  { projectRoot, isGit, isTopLevel, worktrees }
  app.get("/api/worktrees", async (c) => {
    try {
      const cwd = c.req.query("cwd");
      if (!cwd) {
        return c.json({ error: "cwd is required" }, 400);
      }
      const allowedRoots = await getAllowedFileRoots();
      if (!isFilePathAllowed(cwd, allowedRoots) || !isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const project = await resolveProject(cwd);
      let worktrees: Awaited<ReturnType<typeof listWorktrees>> = [];
      let isGit = true;
      try {
        // For a removed-worktree cwd (session of a deleted worktree), fall back
        // to the inferred project root so the switcher still shows the project.
        worktrees = await listWorktrees(fs.existsSync(cwd) ? cwd : project.projectRoot);
      } catch {
        isGit = false;
      }
      // Every listed path is a git-verified worktree of this project; allow the
      // file explorer to browse them even before they have any session (the
      // in-memory allowlist from addWorktree does not survive server restarts).
      for (const w of worktrees) allowFileRoot(w.path);
      return c.json({
        projectRoot: project.projectRoot,
        isGit,
        isTopLevel: project.isTopLevel,
        worktrees,
      });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // POST /api/worktrees  body: { cwd, branch }  →  { path, branch }
  app.post("/api/worktrees", async (c) => {
    try {
      const body = await c.req.json() as { cwd?: string; branch?: string };
      if (!body.cwd || typeof body.cwd !== "string") {
        return c.json({ error: "cwd is required" }, 400);
      }
      if (!body.branch || typeof body.branch !== "string") {
        return c.json({ error: "branch is required" }, 400);
      }
      const allowedRoots = await getAllowedFileRoots();
      if (!isFilePathAllowed(body.cwd, allowedRoots) || !isExistingFilePathAllowed(body.cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }
      if (!fs.existsSync(body.cwd)) {
        return c.json({ error: `Directory does not exist: ${body.cwd}` }, 400);
      }

      const result = await addWorktree(body.cwd, body.branch);
      return c.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return c.json({ error: message }, 400);
    }
  });

  // DELETE /api/worktrees  body: { cwd, path, force? }
  app.delete("/api/worktrees", async (c) => {
    try {
      const body = await c.req.json() as { cwd?: string; path?: string; force?: boolean };
      if (!body.cwd || typeof body.cwd !== "string") {
        return c.json({ error: "cwd is required" }, 400);
      }
      if (!body.path || typeof body.path !== "string") {
        return c.json({ error: "path is required" }, 400);
      }
      const allowedRoots = await getAllowedFileRoots();
      if (!isFilePathAllowed(body.cwd, allowedRoots) || !isExistingFilePathAllowed(body.cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      await removeWorktree(body.cwd, body.path, body.force === true);
      return c.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // git refuses to remove dirty worktrees without --force; surface that so
      // the UI can offer a force-remove confirmation.
      const dirty = /contains modified or untracked files|is dirty/i.test(message);
      return c.json({ error: message, dirty }, dirty ? 409 : 400);
    }
  });

  // GET /api/project-trust?cwd=
  app.get("/api/project-trust", async (c) => {
    const result = await validateTrustCwd(c.req.query("cwd") ?? null);
    if ("response" in result) return result.response;
    return c.json(getProjectTrustStatus(result.cwd, getAgentDir()));
  });
  // POST /api/project-trust  body: { cwd }
  app.post("/api/project-trust", async (c) => {
    try {
      const body = await c.req.json() as { cwd?: unknown };
      const result = await validateTrustCwd(body.cwd);
      if ("response" in result) return result.response;

      const agentDir = getAgentDir();
      const current = getProjectTrustStatus(result.cwd, agentDir);
      if (!current.requiresTrust) {
        return c.json({ error: "This project has no resources that require trust" }, 409);
      }
      if (hasBusyRpcSessionForCwd(result.cwd)) {
        return c.json({ error: "Wait for the active session to finish before trusting this project" }, 409);
      }

      const status = trustProject(result.cwd, agentDir);
      invalidateModelsCache();
      destroyRpcSessionsForCwd(result.cwd);
      return c.json(status);
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });
}

async function validateTrustCwd(value: unknown): Promise<
  { cwd: string } | { response: Response }
> {
  if (typeof value !== "string" || !value.trim()) {
    return { response: Response.json({ error: "cwd required" }, { status: 400 }) };
  }

  const cwd = resolve(value);
  try {
    if (!(await stat(cwd)).isDirectory()) {
      return { response: Response.json({ error: "cwd must be a directory" }, { status: 400 }) };
    }
  } catch {
    return { response: Response.json({ error: "Directory does not exist" }, { status: 400 }) };
  }

  const allowedRoots = await getAllowedFileRoots();
  if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
    return { response: Response.json({ error: "Access denied" }, { status: 403 }) };
  }
  return { cwd };
}
