import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { agentDir, ensureProfile, rootDir, skillsHomeDir } from "./profile.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const dryRun = args.includes("--dry-run");

function valueAfter(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? resolve(args[index + 1]) : fallback;
}

const sourceAgentDir = valueAfter("--from", join(homedir(), ".pi", "agent"));
const sourceAgentsDir = valueAfter("--skills-from", join(homedir(), ".agents"));

ensureProfile({ quiet: true });

function copyContents(source, destination, label) {
  if (!existsSync(source)) {
    console.log(`Skip ${label}: source does not exist (${source})`);
    return { copied: 0, skipped: 0 };
  }

  mkdirSync(destination, { recursive: true });
  let copied = 0;
  let skipped = 0;
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);
    if (existsSync(destinationPath) && !force) {
      skipped++;
      console.log(`Skip existing: ${destinationPath}`);
      continue;
    }
    console.log(`${dryRun ? "Would copy" : "Copy"}: ${sourcePath} -> ${destinationPath}`);
    if (!dryRun) cpSync(sourcePath, destinationPath, { recursive: true, force });
    copied++;
  }
  return { copied, skipped };
}

function isInsideApp(path) {
  const rel = relative(rootDir, resolve(path));
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function isRemotePackageSource(source) {
  return source.startsWith("npm:") || source.startsWith("git:") || /^[a-z]+:\/\//i.test(source);
}

function sanitizeMigratedSettings() {
  const settingsPath = join(agentDir, "settings.json");
  if (!existsSync(settingsPath)) return { changed: false, removed: [] };

  let settings;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {
    console.log(`Skip settings cleanup: invalid JSON (${settingsPath})`);
    return { changed: false, removed: [] };
  }
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    console.log(`Skip settings cleanup: expected a JSON object (${settingsPath})`);
    return { changed: false, removed: [] };
  }

  const removed = [];
  for (const key of ["extensions", "skills", "prompts", "themes"]) {
    if (!Array.isArray(settings[key])) continue;
    settings[key] = settings[key].filter((entry) => {
      if (typeof entry !== "string" || !isAbsolute(entry) || isInsideApp(entry)) return true;
      removed.push(`${key}:${entry}`);
      return false;
    });
  }

  if (Array.isArray(settings.packages)) {
    settings.packages = settings.packages.filter((entry) => {
      const source = typeof entry === "string" ? entry : entry?.source;
      if (typeof source !== "string" || isRemotePackageSource(source)) return true;
      const resolvedSource = resolve(agentDir, source);
      if (isInsideApp(resolvedSource)) return true;
      removed.push(`packages:${source}`);
      return false;
    });
  }

  if (removed.length > 0) {
    console.log(`Remove ${removed.length} external resource reference(s) from migrated settings.`);
    for (const entry of removed) console.log(`  ${entry}`);
    if (!dryRun) writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
  }
  return { changed: removed.length > 0, removed };
}

const agentResult = copyContents(sourceAgentDir, agentDir, "Pi agent profile");
const skillsResult = copyContents(sourceAgentsDir, join(skillsHomeDir, ".agents"), "global skills profile");
const settingsCleanup = sanitizeMigratedSettings();

console.log(JSON.stringify({ dryRun, force, agent: agentResult, skills: skillsResult, settingsCleanup }, null, 2));
