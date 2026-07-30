import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  createAppSettingsManager,
  getAppResourceLoaderOptions,
  getManagedRuntimePaths,
  getSkillsCliEnvironment,
  isManagedPath,
} = await jiti.import("./app-runtime.ts");

async function managedFixture(t) {
  const root = await mkdtemp(join(tmpdir(), "pi-web-managed-runtime-"));
  const appRoot = join(root, "app");
  const dataDir = join(appRoot, "data");
  const agentDir = join(dataDir, "agent");
  const resourcesDir = join(appRoot, "resources");
  const skillsHomeDir = join(dataDir, "skills-home");
  const stateDir = join(dataDir, "state");
  const cwd = join(root, "workspace");
  await Promise.all([
    mkdir(agentDir, { recursive: true }),
    mkdir(resourcesDir, { recursive: true }),
    mkdir(skillsHomeDir, { recursive: true }),
    mkdir(stateDir, { recursive: true }),
    mkdir(join(cwd, ".pi"), { recursive: true }),
  ]);

  const previous = new Map();
  const env = {
    PI_AGENT_MANAGED_RUNTIME: "1",
    PI_AGENT_APP_ROOT: appRoot,
    PI_AGENT_DATA_DIR: dataDir,
    PI_AGENT_RESOURCES_DIR: resourcesDir,
    PI_AGENT_SKILLS_HOME: skillsHomeDir,
    PI_CODING_AGENT_DIR: agentDir,
    XDG_STATE_HOME: stateDir,
  };
  for (const [key, value] of Object.entries(env)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }
  t.after(async () => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(root, { recursive: true, force: true });
  });
  return { root, appRoot, dataDir, agentDir, resourcesDir, skillsHomeDir, stateDir, cwd };
}

test("managed runtime resolves every mutable path inside its application profile", async (t) => {
  const fixture = await managedFixture(t);
  const paths = getManagedRuntimePaths();
  assert.equal(paths.appRoot, fixture.appRoot);
  assert.equal(paths.agentDir, fixture.agentDir);
  assert.ok(paths.managedSkillRoots.every((path) => isManagedPath(path)));

  const cliEnv = getSkillsCliEnvironment();
  assert.equal(cliEnv.HOME, fixture.skillsHomeDir);
  assert.equal(cliEnv.USERPROFILE, fixture.skillsHomeDir);
  assert.equal(cliEnv.XDG_STATE_HOME, fixture.stateDir);
  assert.equal(cliEnv.npm_config_cache, join(fixture.dataDir, "cache", "npm"));
});

test("managed resource policy removes skills outside the application", async (t) => {
  const fixture = await managedFixture(t);
  const appSkill = join(fixture.resourcesDir, "skills", "inside", "SKILL.md");
  const externalSkill = join(fixture.root, "outside", "SKILL.md");
  await mkdir(join(appSkill, ".."), { recursive: true });
  await mkdir(join(externalSkill, ".."), { recursive: true });
  await writeFile(appSkill, "---\nname: inside\n---\n");
  await writeFile(externalSkill, "---\nname: outside\n---\n");

  const options = getAppResourceLoaderOptions();
  assert.ok(options.skillsOverride);
  const filtered = options.skillsOverride({
    skills: [
      { filePath: appSkill },
      { filePath: externalSkill },
    ],
    diagnostics: [
      { type: "warning", message: "inside", path: appSkill },
      { type: "warning", message: "outside", path: externalSkill },
    ],
  });
  assert.deepEqual(filtered.skills.map((skill) => skill.filePath), [appSkill]);
  assert.deepEqual(filtered.diagnostics.map((diagnostic) => diagnostic.path), [appSkill]);
});

test("managed settings ignore the opened workspace's .pi settings", async (t) => {
  const fixture = await managedFixture(t);
  await writeFile(join(fixture.agentDir, "settings.json"), JSON.stringify({ defaultModel: "app-model" }));
  await writeFile(join(fixture.cwd, ".pi", "settings.json"), JSON.stringify({ defaultModel: "workspace-model" }));

  const settings = createAppSettingsManager(fixture.cwd, fixture.agentDir);
  assert.equal(settings.isProjectTrusted(), false);
  assert.deepEqual(settings.getProjectSettings(), {});
  assert.equal(settings.getDefaultModel(), "app-model");
});
