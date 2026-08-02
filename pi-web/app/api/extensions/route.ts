import { existsSync, readdirSync, statSync } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { DefaultPackageManager, getAgentDir, type ResolvedResource } from "@earendil-works/pi-coding-agent";
import { getAllowedFileRoots, isExistingFilePathAllowed } from "@/lib/file-access";
import { getManagedRuntimePaths, isManagedRuntime, createAppSettingsManager } from "@/lib/app-runtime";
import { getProjectTrustStatus } from "@/lib/project-trust";
import type { ExtensionInfo, ExtensionsResponse, PluginDiagnostic } from "@/lib/api-types";

export const dynamic = "force-dynamic";

function extensionName(path: string): string {
  const file = basename(path);
  const extension = extname(file);
  if (/^index\.(ts|js)$/.test(file)) return basename(dirname(path));
  return extension ? file.slice(0, -extension.length) : file;
}

function extensionFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  try {
    const stats = statSync(root);
    if (stats.isFile()) return /\.(?:ts|js)$/.test(root) ? [root] : [];
    if (!stats.isDirectory()) return [];
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...extensionFiles(path));
    else if (entry.isFile() && /\.(?:ts|js)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function infoFromResource(resource: ResolvedResource, scopeOverride?: ExtensionInfo["scope"]): ExtensionInfo {
  const baseDir = resource.metadata.baseDir ?? dirname(resource.path);
  const rel = relative(baseDir, resource.path);
  return {
    name: extensionName(resource.path),
    path: resource.path,
    relativePath: rel && !rel.startsWith("..") ? rel : resource.path,
    source: scopeOverride === "builtin" ? "resources" : resource.metadata.source,
    scope: scopeOverride ?? (resource.metadata.scope === "project" ? "project" : "global"),
    status: resource.enabled ? "enabled" : "disabled",
  };
}

function blockedInfo(path: string): ExtensionInfo {
  return {
    name: extensionName(path),
    path,
    relativePath: relative(dirname(dirname(path)), path),
    source: "project",
    scope: "project",
    status: "blocked",
  };
}

export async function GET(req: Request) {
  let cwd: string | null;
  try {
    cwd = new URL(req.url).searchParams.get("cwd");
  } catch {
    return Response.json({ error: "invalid request URL" }, { status: 400 });
  }
  if (!cwd) return Response.json({ error: "cwd required" }, { status: 400 });

  try {
    const allowedRoots = await getAllowedFileRoots();
    if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const agentDir = getAgentDir();
    const trust = getProjectTrustStatus(cwd, agentDir);
    const settingsManager = createAppSettingsManager(cwd, agentDir, trust.trusted);
    const packageManager = new DefaultPackageManager({ cwd, agentDir, settingsManager });
    const diagnostics: PluginDiagnostic[] = [];
    const byPath = new Map<string, ExtensionInfo>();

    try {
      const resolved = await packageManager.resolve(async () => "skip");
      for (const resource of resolved.extensions) {
        // Package-provided extensions belong to the plugin panel, not here.
        if (resource.metadata.origin !== "top-level") continue;
        byPath.set(resource.path, infoFromResource(resource));
      }
    } catch (error) {
      diagnostics.push({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }

    if (isManagedRuntime()) {
      const resourcesRoot = resolve(getManagedRuntimePaths().resourcesDir, "extensions");
      const builtIn = await packageManager.resolveExtensionSources([resourcesRoot], { temporary: true });
      for (const resource of builtIn.extensions) {
        byPath.set(resource.path, infoFromResource(resource, "builtin"));
      }
    }

    const projectExtensionsRoot = join(cwd, ".pi", "extensions");
    if (trust.requiresTrust && !trust.trusted) {
      for (const path of extensionFiles(projectExtensionsRoot)) {
        byPath.set(path, blockedInfo(path));
      }
      if (byPathHasScope(byPath, "project")) {
        diagnostics.push({ type: "warning", source: "project", message: "Project extensions are blocked until this project is trusted." });
      }
    }

    const scopeOrder: Record<ExtensionInfo["scope"], number> = { project: 0, builtin: 1, global: 2 };
    const extensions = [...byPath.values()].sort((a, b) => (
      scopeOrder[a.scope] - scopeOrder[b.scope] || a.name.localeCompare(b.name) || a.path.localeCompare(b.path)
    ));
    return Response.json({ extensions, diagnostics, projectResourcesLoaded: trust.trusted } satisfies ExtensionsResponse);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

function byPathHasScope(entries: Map<string, ExtensionInfo>, scope: ExtensionInfo["scope"]): boolean {
  for (const entry of entries.values()) {
    if (entry.scope === scope) return true;
  }
  return false;
}
