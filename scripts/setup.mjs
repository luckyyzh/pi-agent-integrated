import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureProfile } from "./profile.mjs";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const npmCliPath = process.env.npm_execpath;
const setupEnv = { ...process.env };

if (process.env.PI_SETUP_USE_PROXY !== "1") {
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) {
    delete setupEnv[key];
  }
}

if (!npmCliPath) {
  console.error("Run this setup through npm: npm run setup");
  process.exit(1);
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, [npmCliPath, ...args], {
    cwd,
    stdio: "inherit",
    env: setupEnv,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function hydrateModelData() {
  const aiDir = join(rootDir, "pi", "packages", "ai");
  const modelDataDir = join(aiDir, "src", "providers", "data");
  if (existsSync(join(modelDataDir, "amazon-bedrock.json"))) return;

  const aiPackage = JSON.parse(readFileSync(join(aiDir, "package.json"), "utf8"));
  const tempDir = mkdtempSync(join(tmpdir(), "pi-ai-model-data-"));

  try {
    console.log(`Model data is absent; extracting it from ${aiPackage.name}@${aiPackage.version}...`);
    const packResult = spawnSync(
      process.execPath,
      [
        npmCliPath,
        "pack",
        `${aiPackage.name}@${aiPackage.version}`,
        "--pack-destination",
        tempDir,
        "--ignore-scripts",
        "--json",
      ],
      { cwd: rootDir, encoding: "utf8", env: setupEnv },
    );
    if (packResult.error) throw packResult.error;
    if (packResult.status !== 0) {
      process.stderr.write(packResult.stderr);
      process.exit(packResult.status ?? 1);
    }

    const packOutput = JSON.parse(packResult.stdout);
    const archiveName = packOutput[0]?.filename;
    if (!archiveName) throw new Error("npm pack did not return an archive filename");

    const extractResult = spawnSync("tar", ["-xzf", join(tempDir, archiveName), "-C", tempDir], {
      stdio: "inherit",
    });
    if (extractResult.error) throw extractResult.error;
    if (extractResult.status !== 0) process.exit(extractResult.status ?? 1);

    const publishedDataDir = join(tempDir, "package", "dist", "providers", "data");
    if (!existsSync(join(publishedDataDir, "amazon-bedrock.json"))) {
      throw new Error(`Published model data is missing from ${publishedDataDir}`);
    }
    cpSync(publishedDataDir, modelDataDir, { recursive: true });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertSupportedNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 19)) {
    console.error(`Node.js >=22.19.0 is required; current version is ${process.versions.node}.`);
    process.exit(1);
  }
}

assertSupportedNodeVersion();
ensureProfile();

console.log("[1/4] Installing Pi dependencies...");
run(["ci", "--ignore-scripts"], join(rootDir, "pi"));

console.log("[2/4] Hydrating model data and building local Pi packages...");
hydrateModelData();
run(["run", "build:offline"], join(rootDir, "pi"));

console.log("[3/4] Installing Pi Web with local Pi package links...");
run(["ci", "--ignore-scripts", "--install-links"], join(rootDir, "pi-web"));

console.log("[4/4] Verifying the integration...");
const checkResult = spawnSync(process.execPath, [join(rootDir, "scripts", "check-integration.mjs")], {
  cwd: rootDir,
  stdio: "inherit",
  env: setupEnv,
});
if (checkResult.error) throw checkResult.error;
process.exit(checkResult.status ?? 0);
