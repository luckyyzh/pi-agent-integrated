import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rootDir } from "./profile.mjs";

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  console.error("Run this smoke test through npm: npm run smoke:fresh-profile");
  process.exit(1);
}

const fixtureDataDir = mkdtempSync(join(tmpdir(), "pi-agent-integrated-profile-"));
const childEnv = {
  ...process.env,
  PI_AGENT_DATA_DIR: fixtureDataDir,
};
if (process.env.PI_SETUP_USE_PROXY !== "1") {
  for (const key of ["HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"]) {
    delete childEnv[key];
  }
}

try {
  const installResult = spawnSync(
    process.execPath,
    [npmCliPath, "run", "profile:packages"],
    { cwd: rootDir, env: childEnv, stdio: "inherit" },
  );
  if (installResult.error) throw installResult.error;
  if (installResult.status !== 0) {
    throw new Error(`Fresh profile package installation exited with ${installResult.status ?? "unknown status"}`);
  }

  const checkResult = spawnSync(
    process.execPath,
    [npmCliPath, "run", "check:profile"],
    { cwd: rootDir, env: childEnv, stdio: "inherit" },
  );
  if (checkResult.error) throw checkResult.error;
  if (checkResult.status !== 0) {
    throw new Error(`Fresh profile validation exited with ${checkResult.status ?? "unknown status"}`);
  }

  const settingsPath = join(fixtureDataDir, "agent", "settings.json");
  const mcpPath = join(fixtureDataDir, "agent", "mcp.json");
  const packagePath = join(fixtureDataDir, "agent", "npm", "package.json");
  for (const path of [settingsPath, mcpPath, packagePath]) {
    if (!existsSync(path)) throw new Error(`Fresh profile is missing ${path}`);
    JSON.parse(readFileSync(path, "utf8"));
  }

  console.log("Fresh managed profile installed and loaded successfully.");
} finally {
  rmSync(fixtureDataDir, { recursive: true, force: true });
}
