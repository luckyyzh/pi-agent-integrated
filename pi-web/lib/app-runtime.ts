import { existsSync, realpathSync } from "fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "path";
import {
  SettingsManager,
  type ResourceDiagnostic,
  type Skill,
} from "@earendil-works/pi-coding-agent";

export const MANAGED_RUNTIME_ENV = "PI_AGENT_MANAGED_RUNTIME";

export interface ManagedRuntimePaths {
  appRoot: string;
  dataDir: string;
  agentDir: string;
  resourcesDir: string;
  skillsHomeDir: string;
  stateDir: string;
  managedSkillRoots: string[];
}

export interface AppResourceLoaderOptions {
  additionalExtensionPaths?: string[];
  additionalSkillPaths?: string[];
  additionalPromptTemplatePaths?: string[];
  additionalThemePaths?: string[];
  skillsOverride?: (base: { skills: Skill[]; diagnostics: ResourceDiagnostic[] }) => {
    skills: Skill[];
    diagnostics: ResourceDiagnostic[];
  };
}

export function isManagedRuntime(): boolean {
  return process.env[MANAGED_RUNTIME_ENV] === "1";
}

function requiredPath(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in managed runtime mode`);
  return resolve(value);
}

export function getManagedRuntimePaths(): ManagedRuntimePaths {
  const appRoot = requiredPath("PI_AGENT_APP_ROOT");
  const dataDir = requiredPath("PI_AGENT_DATA_DIR");
  const agentDir = requiredPath("PI_CODING_AGENT_DIR");
  const resourcesDir = requiredPath("PI_AGENT_RESOURCES_DIR");
  const skillsHomeDir = requiredPath("PI_AGENT_SKILLS_HOME");
  const stateDir = resolve(process.env.XDG_STATE_HOME ?? `${dataDir}/state`);
  return {
    appRoot,
    dataDir,
    agentDir,
    resourcesDir,
    skillsHomeDir,
    stateDir,
    managedSkillRoots: [
      resolve(resourcesDir, "skills"),
      resolve(agentDir, "skills"),
      resolve(skillsHomeDir, ".agents", "skills"),
      resolve(skillsHomeDir, ".pi", "agent", "skills"),
    ],
  };
}

function canonicalPath(path: string): string {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    const parent = dirname(resolved);
    if (parent === resolved) return resolved;
    return resolve(canonicalPath(parent), basename(resolved));
  }
  try {
    return realpathSync.native(resolved);
  } catch {
    return resolved;
  }
}

export function isManagedPath(path: string): boolean {
  if (!isManagedRuntime()) return true;
  const candidate = canonicalPath(path);
  const { appRoot, dataDir, resourcesDir } = getManagedRuntimePaths();
  return [appRoot, dataDir, resourcesDir].some((root) => {
    const rel = relative(canonicalPath(root), candidate);
    return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
  });
}

export function createAppSettingsManager(
  cwd: string,
  agentDir: string,
  projectTrusted = true,
): SettingsManager {
  return SettingsManager.create(cwd, agentDir, {
    projectTrusted: isManagedRuntime() ? false : projectTrusted,
  });
}

export function getAppResourceLoaderOptions(): AppResourceLoaderOptions {
  if (!isManagedRuntime()) return {};

  const { resourcesDir, managedSkillRoots } = getManagedRuntimePaths();
  return {
    additionalExtensionPaths: [resolve(resourcesDir, "extensions")],
    additionalSkillPaths: managedSkillRoots,
    additionalPromptTemplatePaths: [resolve(resourcesDir, "prompts")],
    additionalThemePaths: [resolve(resourcesDir, "themes")],
    skillsOverride: ({ skills, diagnostics }) => ({
      skills: skills.filter((skill) => isManagedPath(skill.filePath)),
      diagnostics: diagnostics.filter((diagnostic) => !diagnostic.path || isManagedPath(diagnostic.path)),
    }),
  };
}

export function getSkillsCliEnvironment(): NodeJS.ProcessEnv {
  if (!isManagedRuntime()) return { ...process.env, FORCE_COLOR: "0" };

  const { dataDir, skillsHomeDir, stateDir } = getManagedRuntimePaths();
  return {
    ...process.env,
    HOME: skillsHomeDir,
    USERPROFILE: skillsHomeDir,
    XDG_STATE_HOME: stateDir,
    npm_config_cache: resolve(dataDir, "cache", "npm"),
    FORCE_COLOR: "0",
  };
}
