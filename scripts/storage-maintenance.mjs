import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { createConnection } from "node:net";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dataDir as managedDataDir, rootDir as projectRootDir } from "./profile.mjs";

const MIB = 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

function numericSetting(env, name, fallback) {
  const value = Number.parseFloat(env[name] ?? "");
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function enabledSetting(env, name, fallback = true) {
  const value = env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return !["0", "false", "no", "off"].includes(value);
}

export function storagePolicy(env = process.env) {
  return {
    enabled: enabledSetting(env, "PI_STORAGE_AUTO_MAINTENANCE", true),
    nextDevMaxBytes: numericSetting(env, "PI_STORAGE_NEXT_DEV_MAX_MB", 640) * MIB,
    nextBuildCacheMaxBytes: numericSetting(env, "PI_STORAGE_NEXT_CACHE_MAX_MB", 256) * MIB,
    npmCacheMaxBytes: numericSetting(env, "PI_STORAGE_NPM_CACHE_MAX_MB", 256) * MIB,
    orphanGraceMs: numericSetting(env, "PI_STORAGE_ORPHAN_GRACE_DAYS", 7) * DAY_MS,
    rewindGcLooseObjects: numericSetting(env, "PI_STORAGE_REWIND_GC_OBJECTS", 1000),
  };
}

export function directoryStats(path) {
  if (!existsSync(path)) return { bytes: 0, files: 0, newestMtimeMs: 0 };

  let bytes = 0;
  let files = 0;
  let newestMtimeMs = 0;
  const pending = [path];

  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const child = join(current, entry.name);
      let stats;
      try {
        stats = lstatSync(child);
      } catch {
        continue;
      }
      newestMtimeMs = Math.max(newestMtimeMs, stats.mtimeMs);
      if (stats.isSymbolicLink()) continue;
      if (stats.isDirectory()) pending.push(child);
      else if (stats.isFile()) {
        bytes += stats.size;
        files += 1;
      }
    }
  }

  return { bytes, files, newestMtimeMs };
}

function collectSessionIds(path) {
  const ids = new Set();
  if (!existsSync(path)) return ids;
  const pending = [path];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const child = join(current, entry.name);
      if (entry.isDirectory()) pending.push(child);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) ids.add(basename(entry.name, ".jsonl"));
    }
  }
  return ids;
}

function countLooseGitObjects(checkpointPath) {
  const objectsPath = join(checkpointPath, ".git", "objects");
  if (!existsSync(objectsPath)) return 0;
  let count = 0;
  for (const entry of readdirSync(objectsPath, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^[0-9a-f]{2}$/i.test(entry.name)) continue;
    count += readdirSync(join(objectsPath, entry.name), { withFileTypes: true })
      .filter((child) => child.isFile()).length;
  }
  return count;
}

function defaultCheckpointCompactor(path) {
  const result = spawnSync("git", ["-C", path, "gc", "--quiet"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git gc exited with ${result.status}`);
}

function removeDirectory(path, label, result) {
  const before = directoryStats(path);
  if (!existsSync(path)) return;
  rmSync(path, { recursive: true, force: true });
  result.reclaimedBytes += before.bytes;
  result.actions.push({ type: "removed", label, path, bytes: before.bytes });
}

export function maintainStorage({
  mode = "auto",
  rootDir = projectRootDir,
  dataDir = managedDataDir,
  env = process.env,
  nowMs = Date.now(),
  compactCheckpoint = defaultCheckpointCompactor,
} = {}) {
  const policy = storagePolicy(env);
  const result = { mode, actions: [], warnings: [], reclaimedBytes: 0, status: {} };
  if (mode === "auto" && !policy.enabled) return { ...result, disabled: true };

  const cacheTargets = [
    {
      label: "Next.js development output",
      path: join(rootDir, "pi-web", ".next", "dev"),
      limit: policy.nextDevMaxBytes,
    },
    {
      label: "Next.js build cache",
      path: join(rootDir, "pi-web", ".next", "cache"),
      limit: policy.nextBuildCacheMaxBytes,
    },
    {
      label: "managed npm cache",
      path: join(dataDir, "cache", "npm"),
      limit: policy.npmCacheMaxBytes,
    },
  ];

  for (const target of cacheTargets) {
    const stats = directoryStats(target.path);
    result.status[target.label] = stats;
    if (mode === "clean" || (mode === "auto" && stats.bytes > target.limit)) {
      removeDirectory(target.path, target.label, result);
    }
  }

  const sessionIds = collectSessionIds(join(dataDir, "agent", "sessions"));
  const checkpointsPath = join(dataDir, "home", ".pi", "agent", "ayu", "checkpoints", "sessions");
  if (existsSync(checkpointsPath)) {
    for (const entry of readdirSync(checkpointsPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const checkpointPath = join(checkpointsPath, entry.name);
      const stats = directoryStats(checkpointPath);
      const orphan = !sessionIds.has(entry.name);
      const ageMs = Math.max(0, nowMs - stats.newestMtimeMs);

      if (orphan && (mode === "clean" || ageMs >= policy.orphanGraceMs)) {
        removeDirectory(checkpointPath, `orphan Rewind checkpoint ${entry.name}`, result);
        continue;
      }

      if (mode !== "status") {
        const looseObjects = countLooseGitObjects(checkpointPath);
        if (looseObjects >= policy.rewindGcLooseObjects) {
          const before = directoryStats(checkpointPath).bytes;
          try {
            compactCheckpoint(checkpointPath);
            const after = directoryStats(checkpointPath).bytes;
            result.reclaimedBytes += Math.max(0, before - after);
            result.actions.push({
              type: "compacted",
              label: `Rewind checkpoint ${entry.name}`,
              path: checkpointPath,
              bytes: Math.max(0, before - after),
            });
          } catch (error) {
            result.warnings.push(`Unable to compact ${checkpointPath}: ${error.message}`);
          }
        }
      }
    }
  }

  return result;
}

export function formatBytes(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(1)} MiB`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export function printMaintenanceResult(result) {
  if (result.disabled) {
    console.log("[storage] automatic maintenance is disabled");
    return;
  }
  if (result.mode === "status") {
    for (const [label, stats] of Object.entries(result.status)) {
      console.log(`[storage] ${label}: ${formatBytes(stats.bytes)} (${stats.files} files)`);
    }
  }
  for (const action of result.actions) {
    const verb = action.type === "compacted" ? "compacted" : "removed";
    console.log(`[storage] ${verb} ${action.label}; reclaimed ${formatBytes(action.bytes)}`);
  }
  for (const warning of result.warnings) console.warn(`[storage] ${warning}`);
  if (result.actions.length > 0) console.log(`[storage] total reclaimed: ${formatBytes(result.reclaimedBytes)}`);
  else if (result.mode !== "auto") console.log("[storage] nothing to clean");
}

export function isLocalPortListening(port, host = "127.0.0.1", timeoutMs = 250) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ port, host });
    const finish = (listening) => {
      socket.destroy();
      resolvePromise(listening);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === resolve(fileURLToPath(import.meta.url))) {
  const mode = process.argv[2] ?? "status";
  if (!new Set(["status", "auto", "clean"]).has(mode)) {
    console.error("Usage: node scripts/storage-maintenance.mjs [status|auto|clean]");
    process.exit(2);
  }
  if (mode !== "status" && await isLocalPortListening(30141)) {
    console.error("[storage] Pi Web is running on port 30141. Stop it first or use npm run restart.");
    process.exit(1);
  }
  printMaintenanceResult(maintainStorage({ mode }));
}
