import { DefaultResourceLoader, getAgentDir } from "@earendil-works/pi-coding-agent";
import type { SkillInfo, SkillsResponse } from "@/lib/api-types";
import { annotateSkillsWithInstallInfo } from "@/lib/skill-lock";
import { getProjectTrustStatus, projectTrustReloadOptions } from "@/lib/project-trust";
import {
  createAppSettingsManager,
  getAppResourceLoaderOptions,
  getManagedRuntimePaths,
  isManagedRuntime,
} from "@/lib/app-runtime";

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
