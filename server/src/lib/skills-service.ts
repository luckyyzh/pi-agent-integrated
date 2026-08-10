import { DefaultResourceLoader, getAgentDir } from "@earendil-works/pi-coding-agent";
import type { SkillInfo, SkillsResponse } from "./api-types";
import { annotateSkillsWithInstallInfo } from "./skill-lock";
import { getProjectTrustStatus, projectTrustReloadOptions } from "./project-trust";
import {
  createAppSettingsManager,
  getAppResourceLoaderOptions,
  getManagedRuntimePaths,
  isManagedRuntime,
} from "./app-runtime";

export async function loadSkillsWithInstallInfo(cwd: string): Promise<SkillsResponse> {
  const agentDir = getAgentDir();
  const loader = new DefaultResourceLoader({
    ...getAppResourceLoaderOptions(),
    cwd,
    agentDir,
    settingsManager: createAppSettingsManager(cwd, agentDir),
  });
  await loader.reload(projectTrustReloadOptions(cwd, agentDir));
  const { skills, diagnostics } = loader.getSkills();
  const managedPaths = isManagedRuntime() ? getManagedRuntimePaths() : undefined;
  return {
    skills: annotateSkillsWithInstallInfo(skills as SkillInfo[], {
      cwd,
      agentDir,
      ...(managedPaths ? { globalSkillRoots: managedPaths.managedSkillRoots } : {}),
    }),
    diagnostics,
    projectResourcesLoaded: getProjectTrustStatus(cwd, agentDir).trusted,
  };
}
