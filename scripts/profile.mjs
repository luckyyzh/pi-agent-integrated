import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
export const configDir = join(rootDir, "config");
export const resourcesDir = join(rootDir, "resources");
export const dataDir = resolve(process.env.PI_AGENT_DATA_DIR ?? join(rootDir, "data"));
export const agentDir = join(dataDir, "agent");
export const skillsHomeDir = join(dataDir, "skills-home");
export const stateDir = join(dataDir, "state");

const managedDirectories = [
  agentDir,
  join(agentDir, "sessions"),
  join(agentDir, "npm"),
  join(agentDir, "git"),
  join(agentDir, "bin"),
  join(agentDir, "tools"),
  join(agentDir, "tmp"),
  join(dataDir, "logs"),
  join(dataDir, "cache"),
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
  [join(configDir, "models.example.json"), join(agentDir, "models.json")],
];

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

  return { rootDir, configDir, resourcesDir, dataDir, agentDir, skillsHomeDir, stateDir, created };
}

export function managedEnvironment(baseEnv = process.env) {
  ensureProfile({ quiet: true });
  return {
    ...baseEnv,
    PI_AGENT_MANAGED_RUNTIME: "1",
    PI_AGENT_APP_ROOT: rootDir,
    PI_AGENT_DATA_DIR: dataDir,
    PI_AGENT_RESOURCES_DIR: resourcesDir,
    PI_AGENT_SKILLS_HOME: skillsHomeDir,
    PI_CODING_AGENT_DIR: agentDir,
    XDG_STATE_HOME: stateDir,
  };
}
