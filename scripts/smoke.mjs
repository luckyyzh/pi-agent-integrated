import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const baseUrl = process.env.PI_WEB_URL ?? "http://127.0.0.1:30141";
const cwd = resolve(process.env.PI_SMOKE_CWD ?? rootDir);

async function readJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text };
  }
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} returned ${response.status}: ${data.error ?? text}`);
  }
  return data;
}

const pageResponse = await fetch(baseUrl);
const pageHtml = await pageResponse.text();
if (!pageResponse.ok || !pageHtml.includes("Pi Web")) {
  throw new Error(`Pi Web page check failed with status ${pageResponse.status}`);
}

const jsonHeaders = { "Content-Type": "application/json" };
const validated = await readJson("/api/cwd/validate", {
  method: "POST",
  headers: jsonHeaders,
  body: JSON.stringify({ cwd }),
});
const models = await readJson(`/api/models?cwd=${encodeURIComponent(cwd)}`);
const runtime = await readJson("/api/runtime");
const created = await readJson("/api/agent/new", {
  method: "POST",
  headers: jsonHeaders,
  body: JSON.stringify({ cwd, type: "ensure_session", toolNames: [] }),
});
const state = await readJson(`/api/agent/${encodeURIComponent(created.sessionId)}`);

if (
  !validated.success ||
  !runtime.managed ||
  resolve(runtime.appRoot) !== rootDir ||
  resolve(runtime.agentDir) !== resolve(rootDir, "data", "agent") ||
  !created.success ||
  !created.sessionId ||
  !state.running ||
  !state.state
) {
  throw new Error("Pi AgentSession smoke check returned an incomplete state");
}

console.log(
  JSON.stringify(
    {
      pageStatus: pageResponse.status,
      cwdAccepted: validated.success,
      managedRuntime: runtime.managed,
      agentDir: runtime.agentDir,
      modelCount: Array.isArray(models.modelList) ? models.modelList.length : 0,
      defaultModelConfigured: Boolean(models.defaultModel),
      sessionCreated: created.success,
      runtimeRunning: state.running,
      llmRequestSent: false,
    },
    null,
    2,
  ),
);
