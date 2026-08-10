import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAgentRoutes } from "./routes/agent.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerConfigRoutes } from "./routes/config.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerGitAndModelRoutes } from "./routes/models.js";
import { registerMiscRoutes } from "./routes/misc.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerSkillRoutes } from "./routes/skills.js";
import { securityMiddleware } from "./security.js";

const serverDir = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(readFileSync(join(serverDir, "package.json"), "utf8")) as { version: string };

const startedAt = Date.now();

export const app = new Hono();

app.use("/api/*", securityMiddleware);

// Liveness probe used by scripts/run.mjs to sequence startup and by
// npm run check to verify the backend is reachable.
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    name: "pi-agent-server",
    version,
    uptimeMs: Date.now() - startedAt,
  }),
);

registerAgentRoutes(app);
registerSessionRoutes(app);
registerFileRoutes(app);
registerGitAndModelRoutes(app);
registerMiscRoutes(app);
registerAuthRoutes(app);
registerConfigRoutes(app);
registerSkillRoutes(app);

export function startServer(): ReturnType<typeof serve> {
  const port = Number(process.env.PI_SERVER_PORT ?? "30142");
  // The frontend proxies /api here server-side, so the backend stays on
  // loopback even in LAN mode unless the operator overrides explicitly.
  const hostname = process.env.PI_SERVER_HOSTNAME ?? "127.0.0.1";

  const server = serve({ fetch: app.fetch, port, hostname }, (info) => {
    console.log(`[server] pi-agent-server ${version} listening on http://${info.address}:${info.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`[server] received ${signal}, shutting down`);
    server.close(() => process.exit(0));
    // Force-exit if lingering connections (e.g. open SSE streams) block close.
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  return server;
}

startServer();
