import type { Hono } from "hono";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { getAgentDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";
import { loadSkillsWithInstallInfo } from "../lib/skills-service";
import { getAllowedFileRoots, isExistingFilePathAllowed } from "../lib/file-access";
import { getManagedRuntimePaths, getSkillsCliEnvironment, isManagedRuntime } from "../lib/app-runtime";
import { checkSkillUpdates, buildSkillUpdateArgs } from "../lib/skill-updates";
import { runNpx } from "../lib/npx";
import { hasJsonContentType } from "../lib/request-security";
import { getProjectTrustStatus } from "../lib/project-trust";
import type { SkillInstallScope, SkillSearchResult } from "../lib/api-types";

const ANSI_RE = /\x1B\[[0-9;]*m/g;
const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 50;
const SEARCH_API_BASE = process.env.SKILLS_API_URL || "https://skills.sh";

interface SkillsApiSkill {
  id?: string;
  name?: string;
  source?: string;
  installs?: number;
}

interface SkillsApiResponse {
  skills?: SkillsApiSkill[];
}

function parseLimit(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.floor(num)));
}

function formatInstalls(count?: number): string {
  if (!count || count <= 0) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M installs`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K installs`;
  return `${count} install${count === 1 ? "" : "s"}`;
}

function parseSearchOutput(raw: string): SkillSearchResult[] {
  const clean = raw.replace(ANSI_RE, "");
  const results: SkillSearchResult[] = [];
  const lines = clean.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // package line: "owner/repo@skill  NNK installs"
    const pkgMatch = line.match(/^([\w.\-]+\/[\w.\-@:]+)\s+([\d.,]+[KMB]?\s+installs)$/);
    if (pkgMatch) {
      const urlLine = lines[i + 1]?.trim().replace(/^└\s*/, "");
      results.push({
        package: pkgMatch[1],
        installs: pkgMatch[2],
        url: urlLine?.startsWith("https://") ? urlLine : "",
      });
    }
  }
  return results;
}

async function searchSkillsApi(query: string, limit: number): Promise<SkillSearchResult[]> {
  const url = `${SEARCH_API_BASE}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`skills.sh search failed: HTTP ${res.status}`);

  const data = (await res.json()) as SkillsApiResponse;
  return (data.skills ?? [])
    .map((skill) => {
      const name = skill.name?.trim();
      const source = skill.source?.trim();
      const slug = skill.id?.trim();
      if (!name || (!source && !slug)) return null;

      const pkg = `${source || slug}@${name}`;
      return {
        package: pkg,
        installs: formatInstalls(skill.installs),
        url: slug ? `${SEARCH_API_BASE}/${slug}` : "",
      };
    })
    .filter((skill): skill is SkillSearchResult => skill !== null)
    .sort((a, b) => parseInstallCount(b.installs) - parseInstallCount(a.installs));
}

function parseInstallCount(installs: string): number {
  const match = installs.match(/^([\d.]+)([KMB])?\s+installs?$/);
  if (!match) return 0;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return 0;
  const multiplier = match[2] === "B" ? 1_000_000_000 : match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1;
  return value * multiplier;
}

export function registerSkillRoutes(app: Hono): void {
  // GET /api/skills?cwd=<path>
  // Uses DefaultResourceLoader (same logic as AgentSession startup) so settings.json
  // skill paths, package skills, and .agents/skills directories are all included.
  app.get("/api/skills", async (c) => {
    const cwd = c.req.query("cwd");
    if (!cwd) return c.json({ error: "cwd required" }, 400);

    try {
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }
      return c.json(await loadSkillsWithInstallInfo(cwd));
    } catch (e) {
      return c.json({ error: String(e) }, 500);
    }
  });

  // PATCH /api/skills — toggle disable-model-invocation on a SKILL.md file
  app.patch("/api/skills", async (c) => {
    try {
      const body = await c.req.json() as { filePath: string; disableModelInvocation: boolean };
      const { filePath, disableModelInvocation } = body;
      if (!filePath) return c.json({ error: "filePath required" }, 400);
      if (!existsSync(filePath)) return c.json({ error: "file not found" }, 404);
      const allowedRoots = new Set(await getAllowedFileRoots());
      allowedRoots.add(getAgentDir());
      if (isManagedRuntime()) {
        for (const root of getManagedRuntimePaths().managedSkillRoots) {
          if (existsSync(root)) allowedRoots.add(root);
        }
      } else {
        // Upstream-compatible mode keeps the CLI's user-wide skill root.
        const globalSkillsDir = path.join(homedir(), ".agents", "skills");
        if (existsSync(globalSkillsDir)) allowedRoots.add(globalSkillsDir);
      }
      if (!isExistingFilePathAllowed(filePath, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const content = readFileSync(filePath, "utf8");
      const key = "disable-model-invocation";

      // Use parseFrontmatter to check current value, then do a surgical line edit
      // to preserve the original YAML formatting of all other fields.
      const { frontmatter } = parseFrontmatter<Record<string, unknown>>(content);
      const alreadySet = Boolean(frontmatter[key]);

      let updated = content;
      if (disableModelInvocation && !alreadySet) {
        // Add key after the opening --- line
        updated = content.replace(/^---\r?\n/, `---\n${key}: true\n`);
        // If no frontmatter exists, create one
        if (updated === content) updated = `---\n${key}: true\n---\n${content}`;
      } else if (!disableModelInvocation && alreadySet) {
        // Remove the key line entirely
        updated = content.replace(new RegExp(`^${key}\\s*:.*\\r?\\n`, "m"), "");
      }

      writeFileSync(filePath, updated, "utf8");
      return c.json({ success: true });
    } catch (e) {
      return c.json({ error: String(e) }, 500);
    }
  });

  app.post("/api/skills/check", async (c) => {
    try {
      const body = await c.req.json() as {
        cwd?: unknown;
        package?: unknown;
        scope?: unknown;
      };
      const cwd = typeof body.cwd === "string" ? body.cwd : "";
      if (!cwd) return c.json({ error: "cwd required" }, 400);
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const pkg = typeof body.package === "string" ? body.package : undefined;
      const scope = body.scope === "global" || body.scope === "project"
        ? body.scope as SkillInstallScope
        : undefined;
      if ((pkg && !scope) || (!pkg && scope)) {
        return c.json({ error: "package and scope must be provided together" }, 400);
      }

      const { skills } = await loadSkillsWithInstallInfo(cwd);
      const installs = skills
        .map((skill) => skill.install)
        .filter((install): install is NonNullable<typeof install> => Boolean(install))
        .filter((install) => !pkg || (install.package === pkg && install.scope === scope));

      if (pkg && installs.length === 0) {
        return c.json({ error: "Installed skill not found" }, 404);
      }

      const updates = await checkSkillUpdates(installs, {
        githubToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      });
      return c.json({ updates });
    } catch (error) {
      return c.json(
        { error: error instanceof Error ? error.message : String(error) },
        500,
      );
    }
  });

  // POST /api/skills/install  body: { package: string; scope: "global" | "project"; cwd?: string }
  app.post("/api/skills/install", async (c) => {
    // The global security middleware already enforces isApiRequestAllowed.
    if (!hasJsonContentType(c.req.raw)) {
      return c.json({ error: "Content-Type must be application/json" }, 415);
    }

    try {
      const { package: pkg, scope, cwd } = await c.req.json() as { package?: string; scope?: string; cwd?: string };
      if (!pkg?.trim()) return c.json({ error: "package required" }, 400);

      const isGlobal = isManagedRuntime() || scope !== "project";
      if (!isGlobal) {
        if (!cwd) return c.json({ error: "cwd required for project install" }, 400);
        const allowedRoots = await getAllowedFileRoots();
        if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
          return c.json({ error: "Access denied" }, 403);
        }
        if (!getProjectTrustStatus(cwd, getAgentDir()).trusted) {
          return c.json(
            { error: "Project resources must be trusted before installing project skills" },
            403,
          );
        }
      }
      const args = ["skills", "add", pkg.trim(), "-y", "--agent", "pi"];
      if (isGlobal) args.push("-g");

      console.log(`[skills/install] running: npx ${args.join(" ")}`);
      const { stdout, stderr } = await runNpx(args, {
        timeout: 60000,
        cwd: !isGlobal && cwd ? cwd : undefined,
        env: getSkillsCliEnvironment(),
      });

      const output = (stdout + stderr).replace(ANSI_RE, "");
      const success = /Installation complete|Installed \d+ skill/.test(output);
      if (!success) {
        return c.json({ error: output.slice(-300) || "Install failed" }, 500);
      }
      return c.json({ success: true, output });
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const output = ((err.stdout ?? "") + (err.stderr ?? "")).replace(ANSI_RE, "");
      return c.json({ error: output || (err.message ?? String(e)) }, 500);
    }
  });

  // POST /api/skills/search  body: { query: string, limit?: number }
  app.post("/api/skills/search", async (c) => {
    try {
      const { query, limit: rawLimit } = await c.req.json() as { query?: string; limit?: unknown };
      if (!query?.trim()) return c.json({ error: "query required" }, 400);
      const limit = parseLimit(rawLimit);

      try {
        const results = await searchSkillsApi(query.trim(), limit);
        return c.json({ results });
      } catch {
        const { stdout, stderr } = await runNpx(["skills", "find", query.trim()], {
          timeout: 20000,
          env: { ...process.env, FORCE_COLOR: "0" },
        });

        const results = parseSearchOutput(stdout + stderr).slice(0, limit);
        return c.json({ results });
      }
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const raw = (err.stdout ?? "") + (err.stderr ?? "");
      const results = raw ? parseSearchOutput(raw) : [];
      if (results.length > 0) return c.json({ results });
      return c.json({ error: err.message ?? String(e) }, 500);
    }
  });

  app.post("/api/skills/update", async (c) => {
    try {
      const body = await c.req.json() as {
        cwd?: unknown;
        package?: unknown;
        scope?: unknown;
      };
      const cwd = typeof body.cwd === "string" ? body.cwd : "";
      const pkg = typeof body.package === "string" ? body.package : "";
      const scope = body.scope === "global" || body.scope === "project"
        ? body.scope as SkillInstallScope
        : undefined;
      if (!cwd || !pkg || !scope) {
        return c.json({ error: "cwd, package, and scope are required" }, 400);
      }
      const allowedRoots = await getAllowedFileRoots();
      if (!isExistingFilePathAllowed(cwd, allowedRoots)) {
        return c.json({ error: "Access denied" }, 403);
      }

      const { skills } = await loadSkillsWithInstallInfo(cwd);
      const skill = skills.find(
        (item) => item.install?.package === pkg && item.install.scope === scope,
      );
      if (!skill?.install) {
        return c.json({ error: "Installed skill not found" }, 404);
      }
      if (!skill.install.canCheckForUpdates) {
        return c.json({ error: "This skill cannot be updated automatically" }, 400);
      }

      const { stdout, stderr } = await runNpx(buildSkillUpdateArgs(skill.install), {
        timeout: 60_000,
        cwd: !isManagedRuntime() && scope === "project" ? cwd : undefined,
        env: getSkillsCliEnvironment(),
      });

      const refreshed = await loadSkillsWithInstallInfo(cwd);
      const updatedSkill = refreshed.skills.find(
        (item) => item.install?.package === pkg && item.install.scope === scope,
      );
      return c.json({
        success: true,
        skill: updatedSkill,
        output: `${stdout}${stderr}`.slice(-500),
      });
    } catch (error: unknown) {
      const detail = error as { stdout?: string; stderr?: string; message?: string };
      const output = `${detail.stdout ?? ""}${detail.stderr ?? ""}`;
      return c.json(
        { error: output || detail.message || String(error) },
        500,
      );
    }
  });
}
