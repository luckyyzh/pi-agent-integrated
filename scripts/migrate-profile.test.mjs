import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("profile migration copies state and removes external resource references", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-profile-migration-"));
  const sourceAgent = join(root, "source-agent");
  const sourceSkills = join(root, "source-agents");
  const dataDir = join(root, "managed-data");
  const externalExtension = join(root, "external-extension.js");
  mkdirSync(join(sourceAgent, "sessions"), { recursive: true });
  mkdirSync(join(sourceSkills, "skills", "example"), { recursive: true });
  writeFileSync(join(sourceAgent, "sessions", "session.jsonl"), "{}\n");
  writeFileSync(join(sourceSkills, "skills", "example", "SKILL.md"), "---\nname: example\n---\n");
  writeFileSync(sourceAgent + "-source-marker", "preserved");
  writeFileSync(join(sourceAgent, "settings.json"), JSON.stringify({
    extensions: [externalExtension, "extensions/local.js"],
    packages: ["npm:example@1.0.0", externalExtension],
  }));

  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(
    process.execPath,
    [
      join(process.cwd(), "scripts", "migrate-profile.mjs"),
      "--from",
      sourceAgent,
      "--skills-from",
      sourceSkills,
      "--force",
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, PI_AGENT_DATA_DIR: dataDir },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const settings = JSON.parse(readFileSync(join(dataDir, "agent", "settings.json"), "utf8"));
  assert.deepEqual(settings.extensions, ["extensions/local.js"]);
  assert.deepEqual(settings.packages, ["npm:example@1.0.0"]);
  assert.equal(existsSync(join(dataDir, "agent", "sessions", "session.jsonl")), true);
  assert.equal(existsSync(join(dataDir, "skills-home", ".agents", "skills", "example", "SKILL.md")), true);
  assert.equal(existsSync(sourceAgent + "-source-marker"), true);
});
