import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { maintainStorage } from "./storage-maintenance.mjs";

function createFile(path, bytes = 2048) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, Buffer.alloc(bytes));
}

function createCheckpoint(root, id, modifiedAt) {
  const checkpoint = join(root, "home", ".pi", "agent", "ayu", "checkpoints", "sessions", id);
  const objectDir = join(checkpoint, ".git", "objects", "ab");
  mkdirSync(objectDir, { recursive: true });
  createFile(join(objectDir, "object"));
  createFile(join(checkpoint, "manifest.json"), 64);
  for (const path of [join(objectDir, "object"), objectDir, join(checkpoint, ".git", "objects"), join(checkpoint, ".git"), join(checkpoint, "manifest.json"), checkpoint]) {
    utimesSync(path, modifiedAt, modifiedAt);
  }
  return checkpoint;
}

test("automatic maintenance bounds caches and removes only expired orphan checkpoints", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-storage-maintenance-"));
  const dataDir = join(root, "data");
  const now = new Date("2026-07-31T00:00:00Z");
  const old = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
  const recent = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  t.after(() => rmSync(root, { recursive: true, force: true }));

  const nextDev = join(root, "pi-web", ".next", "dev");
  const nextCache = join(root, "pi-web", ".next", "cache");
  const npmCache = join(dataDir, "cache", "npm");
  createFile(join(nextDev, "large.bin"));
  createFile(join(nextCache, "large.bin"));
  createFile(join(npmCache, "large.bin"));

  const sessions = join(dataDir, "agent", "sessions");
  createFile(join(sessions, "live-session.jsonl"), 16);
  const liveCheckpoint = createCheckpoint(dataDir, "live-session", old);
  const expiredOrphan = createCheckpoint(dataDir, "expired-orphan", old);
  const recentOrphan = createCheckpoint(dataDir, "recent-orphan", recent);
  const compacted = [];

  const result = maintainStorage({
    mode: "auto",
    rootDir: root,
    dataDir,
    nowMs: now.getTime(),
    env: {
      PI_STORAGE_NEXT_DEV_MAX_MB: "0.001",
      PI_STORAGE_NEXT_CACHE_MAX_MB: "0.001",
      PI_STORAGE_NPM_CACHE_MAX_MB: "0.001",
      PI_STORAGE_ORPHAN_GRACE_DAYS: "7",
      PI_STORAGE_REWIND_GC_OBJECTS: "1",
    },
    compactCheckpoint(path) {
      compacted.push(path);
    },
  });

  assert.equal(existsSync(nextDev), false);
  assert.equal(existsSync(nextCache), false);
  assert.equal(existsSync(npmCache), false);
  assert.equal(existsSync(expiredOrphan), false);
  assert.equal(existsSync(recentOrphan), true);
  assert.equal(existsSync(liveCheckpoint), true);
  assert.deepEqual(new Set(compacted), new Set([recentOrphan, liveCheckpoint]));
  assert.ok(result.reclaimedBytes > 0);
});

test("clean mode removes every orphan while preserving live checkpoints", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-storage-clean-"));
  const dataDir = join(root, "data");
  t.after(() => rmSync(root, { recursive: true, force: true }));

  createFile(join(dataDir, "agent", "sessions", "live-session.jsonl"), 16);
  const liveCheckpoint = createCheckpoint(dataDir, "live-session", new Date());
  const orphanCheckpoint = createCheckpoint(dataDir, "orphan-session", new Date());

  maintainStorage({
    mode: "clean",
    rootDir: root,
    dataDir,
    env: { PI_STORAGE_REWIND_GC_OBJECTS: "999999" },
  });

  assert.equal(existsSync(liveCheckpoint), true);
  assert.equal(existsSync(orphanCheckpoint), false);
});
