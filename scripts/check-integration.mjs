import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const webDir = join(rootDir, "pi-web");
const requiredProfilePaths = [
  join(rootDir, "config", "settings.default.json"),
  join(rootDir, "config", "mcp.default.json"),
  join(rootDir, "config", "models.example.json"),
  join(rootDir, "config", "subagents.default.json"),
  join(rootDir, "config", "subagent-tool-description.default.md"),
  join(rootDir, ".env.example"),
  join(rootDir, "LICENSE"),
  join(rootDir, "THIRD_PARTY_NOTICES.md"),
  join(rootDir, "resources", "skills"),
  join(rootDir, "resources", "extensions"),
  join(rootDir, "resources", "prompts"),
  join(rootDir, "resources", "themes"),
];

const packages = [
  ["@earendil-works/pi-agent-core", "agent"],
  ["@earendil-works/pi-ai", "ai"],
  ["@earendil-works/pi-coding-agent", "coding-agent"],
  ["@earendil-works/pi-tui", "tui"],
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const webPackage = readJson(join(webDir, "package.json"));
const failures = [];
const versions = new Set();

for (const path of requiredProfilePaths) {
  if (!existsSync(path)) failures.push(`Missing managed profile path: ${path}`);
}

for (const [packageName, packageDirName] of packages) {
  const localDir = resolve(rootDir, "pi", "packages", packageDirName);
  const installedDir = resolve(webDir, "node_modules", ...packageName.split("/"));
  const localPackagePath = join(localDir, "package.json");
  const installedPackagePath = join(installedDir, "package.json");
  const expectedSpec = `file:../pi/packages/${packageDirName}`;

  if (webPackage.dependencies?.[packageName] !== expectedSpec) {
    failures.push(`${packageName} must use ${expectedSpec}`);
    continue;
  }
  if (!existsSync(localPackagePath)) {
    failures.push(`Missing local package: ${localPackagePath}`);
    continue;
  }
  if (!existsSync(installedPackagePath)) {
    failures.push(`Missing installed package link: ${installedDir}; run npm run setup`);
    continue;
  }

  const localPackage = readJson(localPackagePath);
  const installedPackage = readJson(installedPackagePath);
  versions.add(localPackage.version);

  if (installedPackage.version !== localPackage.version) {
    failures.push(`${packageName} installed ${installedPackage.version}, local source is ${localPackage.version}`);
  }

  const installedRealPath = realpathSync(installedDir);

  const mainPath = join(installedDir, installedPackage.main ?? "dist/index.js");
  if (!existsSync(mainPath)) {
    failures.push(`${packageName} is not built: ${mainPath}`);
  }

  console.log(
    `${packageName}@${localPackage.version} <- ${relative(rootDir, localDir)} ` +
      `(installed at ${relative(rootDir, installedRealPath)})`,
  );
}

if (versions.size > 1) failures.push(`Pi packages are not lockstep-versioned: ${[...versions].join(", ")}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}

console.log("Local Pi backend packages are built and installed into Pi Web.");
