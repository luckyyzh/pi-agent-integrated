import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { DefaultResourceLoader } from "@earendil-works/pi-coding-agent";

const extensionPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../resources/extensions/searxng-search.ts",
);
const extensionDir = dirname(extensionPath);

test("managed SearXNG extension loads and maps the complete search contract", async () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), "pi-searxng-extension-"));
  const agentDir = resolve(fixtureRoot, "agent");
  mkdirSync(agentDir, { recursive: true });

  const originalFetch = globalThis.fetch;
  const originalToken = process.env.SEARXNG_TOKEN;
  const originalUrl = process.env.SEARXNG_URL;
  let capturedRequest;

  process.env.SEARXNG_TOKEN = "test-token";
  process.env.SEARXNG_URL = "https://search.example.test/search";
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return new Response(
      JSON.stringify({
        answers: ["A current answer"],
        results: [
          {
            title: "Example result",
            url: "https://example.test/result",
            content: "Example snippet",
            engines: ["google", "github"],
            publishedDate: "2026-07-30",
          },
        ],
        suggestions: ["refined query"],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  try {
    const loader = new DefaultResourceLoader({
      cwd: fixtureRoot,
      agentDir,
      additionalExtensionPaths: [extensionDir],
    });
    await loader.reload();

    const loaded = loader.getExtensions();
    assert.deepEqual(loaded.errors, []);
    const extension = loaded.extensions.find((candidate) => resolve(candidate.path) === extensionPath);
    assert.ok(extension, "SearXNG extension should load through the managed extension directory manifest");

    const registeredTool = extension.tools.get("web_search");
    assert.ok(registeredTool, "web_search should be registered");
    const tool = registeredTool.definition;

    const result = await tool.execute(
      "test-call",
      {
        query: "pi coding agent",
        num_results: 5,
        engines: ["google", "github"],
        language: "en",
        page: 2,
        time_range: "week",
      },
      undefined,
      undefined,
      undefined,
    );

    assert.ok(capturedRequest, "web_search should make an HTTP request");
    const requestUrl = new URL(capturedRequest.input);
    assert.equal(requestUrl.searchParams.get("q"), "pi coding agent");
    assert.equal(requestUrl.searchParams.get("format"), "json");
    assert.equal(requestUrl.searchParams.get("engines"), "google,github");
    assert.equal(requestUrl.searchParams.get("language"), "en");
    assert.equal(requestUrl.searchParams.get("pageno"), "2");
    assert.equal(requestUrl.searchParams.get("time_range"), "week");
    assert.equal(new Headers(capturedRequest.init.headers).get("X-Search-Token"), "test-token");
    assert.match(result.content[0].text, /Example result/);
    assert.match(result.content[0].text, /https:\/\/example\.test\/result/);
    assert.equal(result.details.resultCount, 1);
    assert.equal(JSON.stringify(result).includes("test-token"), false);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.SEARXNG_TOKEN;
    else process.env.SEARXNG_TOKEN = originalToken;
    if (originalUrl === undefined) delete process.env.SEARXNG_URL;
    else process.env.SEARXNG_URL = originalUrl;
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
