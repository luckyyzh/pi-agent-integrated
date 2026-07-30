import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { agentDir, managedEnvironment, rootDir } from "./profile.mjs";

const settings = JSON.parse(
  readFileSync(join(rootDir, "config", "settings.default.json"), "utf8"),
);
const packages = Array.isArray(settings.packages) ? settings.packages : [];
const cliPath = join(rootDir, "pi", "packages", "coding-agent", "dist", "cli.js");
const env = managedEnvironment();

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

for (const source of packages) {
  if (typeof source !== "string" || !source.trim()) continue;
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
