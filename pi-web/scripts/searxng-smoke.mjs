import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DefaultResourceLoader } from "@earendil-works/pi-coding-agent";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, "../..");
const extensionDir = resolve(appRoot, "resources/extensions");
const extensionPath = resolve(appRoot, "resources/extensions/searxng-search.ts");
const fixtureRoot = mkdtempSync(join(tmpdir(), "pi-searxng-smoke-"));
const agentDir = resolve(fixtureRoot, "agent");
const query = process.argv.slice(2).join(" ").trim() || "Pi coding agent";

if (!process.env.SEARXNG_TOKEN?.trim()) {
  console.error("SEARXNG_TOKEN is not available to this process.");
  process.exit(1);
}

mkdirSync(agentDir, { recursive: true });

try {
  const loader = new DefaultResourceLoader({
    cwd: appRoot,
    agentDir,
    additionalExtensionPaths: [extensionDir],
  });
  await loader.reload();

  const loaded = loader.getExtensions();
  if (loaded.errors.length > 0) {
    throw new Error(`Extension load failed: ${loaded.errors.map((error) => error.error).join("; ")}`);
  }

  const extension = loaded.extensions.find((candidate) => resolve(candidate.path) === extensionPath);
  const tool = extension?.tools.get("web_search")?.definition;
  if (!tool) throw new Error("web_search was not registered");

  const result = await tool.execute(
    "searxng-smoke",
    { query, num_results: 3 },
    undefined,
    undefined,
    undefined,
  );

  console.log(
    JSON.stringify(
      {
        extensionLoaded: true,
        tool: tool.name,
        query,
        resultCount: result.details?.resultCount ?? null,
        responseHasText: Boolean(result.content[0]?.text),
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}
