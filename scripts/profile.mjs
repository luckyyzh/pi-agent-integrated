import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

export const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const projectEnvPath = join(rootDir, ".env");
if (existsSync(projectEnvPath)) loadEnvFile(projectEnvPath);

export const configDir = join(rootDir, "config");
export const resourcesDir = join(rootDir, "resources");
export const dataDir = resolve(process.env.PI_AGENT_DATA_DIR ?? join(rootDir, "data"));
export const agentDir = join(dataDir, "agent");
export const homeDir = join(dataDir, "home");
export const memoryDir = join(agentDir, "memory");
export const skillsHomeDir = join(dataDir, "skills-home");
export const stateDir = join(dataDir, "state");

const managedDirectories = [
  agentDir,
  homeDir,
  join(agentDir, "sessions"),
  join(agentDir, "npm"),
  join(agentDir, "git"),
  join(agentDir, "bin"),
  join(agentDir, "extensions", "subagent"),
  memoryDir,
  join(memoryDir, "daily"),
  join(memoryDir, "recovery"),
  join(agentDir, "tools"),
  join(agentDir, "tmp"),
  join(dataDir, "logs"),
  join(dataDir, "cache", "npm"),
  join(dataDir, "mcp", "playwright", "output"),
  join(dataDir, "workspaces", "default"),
  join(skillsHomeDir, ".agents", "skills"),
  join(skillsHomeDir, ".pi", "agent", "skills"),
  stateDir,
  join(resourcesDir, "skills"),
  join(resourcesDir, "extensions"),
  join(resourcesDir, "prompts"),
  join(resourcesDir, "themes"),
];

const seedFiles = [
  [join(configDir, "settings.default.json"), join(agentDir, "settings.json")],
  [join(configDir, "mcp.default.json"), join(agentDir, "mcp.json")],
  [join(configDir, "models.example.json"), join(agentDir, "models.json")],
  [join(configDir, "subagents.default.json"), join(agentDir, "extensions", "subagent", "config.json")],
  [join(configDir, "subagent-tool-description.default.md"), join(agentDir, "subagent-tool-description.md")],
];

const persistedWindowsEnvironmentKeys = ["SEARXNG_TOKEN", "SEARXNG_URL"];

function readPersistedWindowsEnvironment(baseEnv) {
  if (platform() !== "win32") return {};

  const missingKeys = persistedWindowsEnvironmentKeys.filter((key) => !baseEnv[key]?.trim());
  if (missingKeys.length === 0) return {};

  const keyLiterals = missingKeys.map((key) => `'${key.replaceAll("'", "''")}'`).join(", ");
  const script = `
$result = @{}
foreach ($name in @(${keyLiterals})) {
  $value = [Environment]::GetEnvironmentVariable($name, 'User')
  if ([string]::IsNullOrWhiteSpace($value)) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Machine')
  }
  if (-not [string]::IsNullOrWhiteSpace($value)) {
    $result[$name] = $value
  }
}
ConvertTo-Json -Compress -InputObject $result
`;

  const result = spawnSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
    { encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0 || !result.stdout.trim()) return {};

  try {
    const values = JSON.parse(result.stdout);
    return values && typeof values === "object" && !Array.isArray(values) ? values : {};
  } catch {
    return {};
  }
}

export function ensureProfile({ quiet = false } = {}) {
  for (const path of managedDirectories) mkdirSync(path, { recursive: true });

  const created = [];
  for (const [source, destination] of seedFiles) {
    if (existsSync(destination)) continue;
    copyFileSync(source, destination);
    created.push(destination);
  }

  if (!quiet) {
    console.log(`Managed Pi profile: ${agentDir}`);
    if (created.length > 0) console.log(`Initialized ${created.length} profile file(s).`);
  }

  return { rootDir, configDir, resourcesDir, dataDir, agentDir, homeDir, skillsHomeDir, stateDir, created };
}

export function managedEnvironment(baseEnv = process.env) {
  ensureProfile({ quiet: true });
  const persistedEnvironment = readPersistedWindowsEnvironment(baseEnv);
  return {
    ...baseEnv,
    ...persistedEnvironment,
    PI_AGENT_MANAGED_RUNTIME: "1",
    PI_AGENT_APP_ROOT: rootDir,
    PI_AGENT_DATA_DIR: dataDir,
    PI_AGENT_RESOURCES_DIR: resourcesDir,
    PI_AGENT_SKILLS_HOME: skillsHomeDir,
    PI_CODING_AGENT_DIR: agentDir,
    HOME: homeDir,
    USERPROFILE: homeDir,
    PI_MEMORY_DIR: baseEnv.PI_MEMORY_DIR?.trim() || memoryDir,
    PI_MEMORY_SNAPSHOT: baseEnv.PI_MEMORY_SNAPSHOT?.trim() || "stable",
    PI_MEMORY_QMD_UPDATE: baseEnv.PI_MEMORY_QMD_UPDATE?.trim() || "off",
    PI_RETRY_STALL_TIMEOUT_MS: baseEnv.PI_RETRY_STALL_TIMEOUT_MS?.trim() || "180000",
    npm_config_cache: baseEnv.npm_config_cache?.trim() || join(dataDir, "cache", "npm"),
    XDG_STATE_HOME: stateDir,
  };
}
