import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  configurePiMemory,
  isPiMemoryLiteConfigured,
  patchPiMemorySource,
} from "./configure-pi-memory.mjs";
import { agentDir, managedEnvironment } from "./profile.mjs";

test("managed profile defaults pi-memory to lightweight mode", () => {
  const defaultEnvironment = managedEnvironment({ ...process.env, PI_MEMORY_NO_SEARCH: undefined });
  const searchEnvironment = managedEnvironment({ ...process.env, PI_MEMORY_NO_SEARCH: "0" });

  assert.equal(defaultEnvironment.PI_MEMORY_NO_SEARCH, "1");
  assert.equal(searchEnvironment.PI_MEMORY_NO_SEARCH, "0");
});

test("installed pi-memory integration is patched and idempotent", (context) => {
  const sourcePath = join(agentDir, "npm", "node_modules", "pi-memory", "index.ts");
  if (!existsSync(sourcePath)) {
    context.skip("managed pi-memory is not installed; npm run setup installs it before CI tests");
    return;
  }

  configurePiMemory({ quiet: true });
  const source = readFileSync(sourcePath, "utf8");
  assert.equal(isPiMemoryLiteConfigured(source), true);
  assert.equal(patchPiMemorySource(source), source);
});

test("integration rejects an unreviewed pi-memory version", () => {
  const temporaryAgentDir = mkdtempSync(join(tmpdir(), "pi-memory-version-"));
  const packageDir = join(temporaryAgentDir, "npm", "node_modules", "pi-memory");
  mkdirSync(packageDir, { recursive: true });
  writeFileSync(join(packageDir, "package.json"), JSON.stringify({ version: "9.9.9" }), "utf8");
  writeFileSync(join(packageDir, "index.ts"), "export default function () {}\n", "utf8");

  assert.throws(
    () => configurePiMemory({ agentDir: temporaryAgentDir, quiet: true }),
    /Unsupported pi-memory version 9\.9\.9/,
  );
});
