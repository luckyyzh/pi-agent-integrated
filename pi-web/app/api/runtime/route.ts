import { getAgentDir } from "@earendil-works/pi-coding-agent";
import {
  getManagedRuntimePaths,
  isManagedRuntime,
} from "@/lib/app-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isManagedRuntime()) {
    return Response.json({ managed: false, agentDir: getAgentDir() });
  }

  const paths = getManagedRuntimePaths();
  return Response.json({
    managed: true,
    appRoot: paths.appRoot,
    dataDir: paths.dataDir,
    agentDir: paths.agentDir,
    resourcesDir: paths.resourcesDir,
    skillRoots: paths.managedSkillRoots,
  });
}
