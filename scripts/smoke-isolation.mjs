import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { agentDir } from "./profile.mjs";

const baseUrl = process.env.PI_WEB_URL ?? "http://127.0.0.1:30141";
const suffix = randomUUID().replaceAll("-", "");
const managedSkillName = `managed-probe-${suffix}`;
const externalSkillName = `external-probe-${suffix}`;
const managedSkillDir = join(agentDir, "skills", managedSkillName);
const workspace = mkdtempSync(join(tmpdir(), "pi-managed-workspace-"));
const externalSkillDir = join(workspace, ".agents", "skills", externalSkillName);
const externalExtensionDir = join(workspace, ".pi", "extensions");
const externalExtensionMarker = join(workspace, "external-extension-executed");

async function readJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${data.error ?? "unknown error"}`);
  return data;
}

try {
  mkdirSync(managedSkillDir, { recursive: true });
  mkdirSync(externalSkillDir, { recursive: true });
  mkdirSync(externalExtensionDir, { recursive: true });
  writeFileSync(
    join(managedSkillDir, "SKILL.md"),
    `---\nname: ${managedSkillName}\ndescription: managed isolation probe\n---\nManaged probe.\n`,
  );
  writeFileSync(
    join(externalSkillDir, "SKILL.md"),
    `---\nname: ${externalSkillName}\ndescription: external isolation probe\n---\nExternal probe.\n`,
  );
  writeFileSync(
    join(externalExtensionDir, "probe.js"),
    `import { writeFileSync } from "node:fs";\nexport default () => { writeFileSync(${JSON.stringify(externalExtensionMarker)}, "executed"); };\n`,
  );

  await readJson("/api/cwd/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cwd: workspace }),
  });
  const result = await readJson(`/api/skills?cwd=${encodeURIComponent(workspace)}`);
  const names = new Set(result.skills.map((skill) => skill.name));
  const managedSkillLoaded = names.has(managedSkillName);
  const externalWorkspaceSkillLoaded = names.has(externalSkillName);
  const externalWorkspaceExtensionExecuted = existsSync(externalExtensionMarker);
  if (!managedSkillLoaded || externalWorkspaceSkillLoaded || externalWorkspaceExtensionExecuted) {
    throw new Error("Managed resource isolation check failed");
  }

  console.log(JSON.stringify({
    managedSkillLoaded,
    externalWorkspaceSkillLoaded,
    externalWorkspaceExtensionExecuted,
  }, null, 2));
} finally {
  rmSync(managedSkillDir, { recursive: true, force: true });
  rmSync(workspace, { recursive: true, force: true });
}
