import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  agentDir,
  dataDir,
  managedEnvironment,
  resourcesDir,
  rootDir,
} from "./profile.mjs";

Object.assign(process.env, managedEnvironment());

const codingAgentEntry = pathToFileURL(
  join(rootDir, "pi-web", "node_modules", "@earendil-works", "pi-coding-agent", "dist", "index.js"),
).href;
const { DefaultResourceLoader } = await import(codingAgentEntry);

const loader = new DefaultResourceLoader({
  cwd: join(dataDir, "workspaces", "default"),
  agentDir,
  additionalExtensionPaths: [join(resourcesDir, "extensions")],
  additionalSkillPaths: [join(resourcesDir, "skills")],
});

await loader.reload();
const loaded = loader.getExtensions();
if (loaded.errors.length > 0) {
  for (const error of loaded.errors) console.error(`Extension load error: ${error.error}`);
  process.exit(1);
}

const tools = new Set(loaded.extensions.flatMap((extension) => [...extension.tools.keys()]));
const commands = new Set(loaded.extensions.flatMap((extension) => [...extension.commands.keys()]));
const requiredTools = [
  "web_search",
  "mcp",
  "lens_diagnostics",
  "subagent",
  "web_fetch",
  "memory_write",
  "resolve-library-id",
  "query-docs",
];
const requiredCommands = ["checkpoint", "rewind"];
const missing = [
  ...requiredTools.filter((name) => !tools.has(name)).map((name) => `tool:${name}`),
  ...requiredCommands.filter((name) => !commands.has(name)).map((name) => `command:/${name}`),
];
if (process.env.PI_MEMORY_NO_SEARCH === "1" && tools.has("memory_search")) {
  missing.push("unexpected tool:memory_search in lightweight memory mode");
}
if (process.env.PI_MEMORY_NO_SEARCH !== "1" && !tools.has("memory_search")) {
  missing.push("tool:memory_search");
}

if (missing.length > 0) {
  console.error(`Managed Pi profile is incomplete: ${missing.join(", ")}`);
  process.exit(1);
}

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  console.error("Run the managed profile check through npm: npm run check:profile");
  process.exit(1);
}
const playwrightResult = spawnSync(
  process.execPath,
  [npmCliPath, "exec", "--yes", "--package=@playwright/mcp@0.0.78", "--", "playwright-mcp", "--version"],
  { cwd: rootDir, env: process.env, encoding: "utf8" },
);
if (playwrightResult.error || playwrightResult.status !== 0) {
  process.stderr.write(playwrightResult.stderr ?? "");
  console.error("Unable to cache @playwright/mcp@0.0.78 for the managed MCP profile.");
  process.exit(playwrightResult.status ?? 1);
}

if (platform() === "win32") {
  const edgeCandidates = [
    join(process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    join(process.env.ProgramFiles ?? "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe"),
  ];
  if (!edgeCandidates.some(existsSync)) {
    console.error("Microsoft Edge is required by config/mcp.default.json but was not found.");
    process.exit(1);
  }
}

console.log(
  `Managed Pi profile ready: ${loaded.extensions.length} extension(s), ${tools.size} tool(s), ${commands.size} command(s).`,
);
