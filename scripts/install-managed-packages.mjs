import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { configurePiMemory } from "./configure-pi-memory.mjs";
import { configurePiAiVision } from "./configure-pi-ai-vision.mjs";
import { agentDir, managedEnvironment, rootDir } from "./profile.mjs";

let settings;
try {
  settings = JSON.parse(readFileSync(join(rootDir, "config", "settings.default.json"), "utf8"));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(`Invalid config/settings.default.json: ${message}`);
}
const packages = Array.isArray(settings.packages) ? settings.packages : [];
const cliPath = join(rootDir, "pi", "packages", "coding-agent", "dist", "cli.js");
const env = managedEnvironment();
const npmCliPath = process.env.npm_execpath;
const localSmartFetchSource = "../../resources/packages/pi-smart-fetch";

function parseLocalSource(source) {
  if (
    source.startsWith("npm:") ||
    source.startsWith("git:") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(source)
  ) {
    return undefined;
  }
  return resolve(agentDir, source);
}

function packageDependenciesReady(packageDir) {
  const packageJsonPath = join(packageDir, "package.json");
  if (!existsSync(packageJsonPath)) return false;

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const dependencies = packageJson.dependencies ?? {};
    return Object.keys(dependencies).every((name) =>
      existsSync(join(packageDir, "node_modules", ...name.split("/"), "package.json")),
    );
  } catch {
    return false;
  }
}

function ensureLocalPackage(source) {
  const packageDir = parseLocalSource(source);
  if (!packageDir) return false;
  if (!existsSync(join(packageDir, "package.json"))) {
    throw new Error(`Local managed package is missing: ${packageDir}`);
  }
  if (packageDependenciesReady(packageDir)) {
    console.log(`Local managed package ready: ${source}`);
    return true;
  }

  console.log(`Installing local managed package dependencies: ${source}`);
  const args = ["install", "--prefix", packageDir, "--omit=dev", "--legacy-peer-deps"];
  const result = npmCliPath
    ? spawnSync(process.execPath, [npmCliPath, ...args], { cwd: rootDir, env, stdio: "inherit" })
    : spawnSync("npm", args, { cwd: rootDir, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return true;
}

function ensureSmartFetchConfigured() {
  const settingsPath = join(agentDir, "settings.json");
  if (!existsSync(settingsPath)) return;

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    return;
  }
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return;

  const packages = Array.isArray(settings.packages) ? settings.packages : [];
  const migrated = packages.map((entry) =>
    entry === "npm:pi-smart-fetch" ||
    (typeof entry === "string" && entry.startsWith("npm:pi-smart-fetch@"))
      ? localSmartFetchSource
      : entry,
  );
  if (!migrated.some((entry) => entry === localSmartFetchSource)) {
    migrated.push(localSmartFetchSource);
  }

  if (JSON.stringify(packages) !== JSON.stringify(migrated)) {
    writeFileSync(settingsPath, `${JSON.stringify({ ...settings, packages: migrated }, null, 2)}\n`, "utf8");
    console.log(`Configured project-local smart fetch package: ${localSmartFetchSource}`);
  }
}

function parseExactNpmSource(source) {
  if (!source.startsWith("npm:")) return undefined;
  const spec = source.slice(4);
  const separator = spec.lastIndexOf("@");
  if (separator <= 0) return undefined;
  return { name: spec.slice(0, separator), version: spec.slice(separator + 1) };
}

function installedAtExpectedVersion(source) {
  const parsed = parseExactNpmSource(source);
  if (!parsed) return false;
  const packageJson = join(agentDir, "npm", "node_modules", ...parsed.name.split("/"), "package.json");
  if (!existsSync(packageJson)) return false;
  try {
    return JSON.parse(readFileSync(packageJson, "utf8")).version === parsed.version;
  } catch {
    return false;
  }
}

ensureSmartFetchConfigured();

for (const source of packages) {
  if (typeof source !== "string" || !source.trim()) continue;
  if (ensureLocalPackage(source)) continue;
  if (installedAtExpectedVersion(source)) {
    console.log(`Managed package ready: ${source}`);
    continue;
  }

  console.log(`Installing managed package: ${source}`);
  const result = spawnSync(process.execPath, [cliPath, "install", source], {
    cwd: rootDir,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

configurePiMemory({ agentDir });
try {
  configurePiAiVision({ quiet: false });
} catch (error) {
  console.warn(`[vision] pi-ai passthrough patch skipped: ${error.message}`);
}
