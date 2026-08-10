import type { Hono } from "hono";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { Readable } from "node:stream";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import { allowFileRoot } from "../lib/allowed-roots";
import {
  MAX_INLINE_BASH_OUTPUT_BYTES,
  openRegularFileNoFollow,
  readUtf8FileWithinLimit,
  resolveBashOutputPath,
} from "../lib/bash-output";
import {
  getRpcSession,
  getRunningRpcSessionIds,
  startRpcSession,
  subscribeRunningSessions,
} from "../lib/rpc-manager";
import { isBashOutputPathReferencedBySession } from "../lib/session-file-references";
import { invalidateSessionListCache, resolveSessionPath } from "../lib/session-reader";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

export function registerAgentRoutes(app: Hono): void {
  // POST /api/agent/new  body: { cwd: string; type: string; message?: string; ... }
  // Spawns a brand-new pi session. Most calls immediately send the first command;
  // type:"ensure_session" only creates the runtime so clients can query commands.
  // Returns { sessionId, data } where sessionId is pi's real session id.
  app.post("/api/agent/new", async (c) => {
    try {
      const body = (await c.req.json()) as { cwd?: string; [key: string]: unknown };
      const { cwd, ...command } = body;

      if (!cwd || typeof cwd !== "string") {
        return c.json({ error: "cwd is required" }, 400);
      }
      if (!existsSync(cwd)) {
        return c.json({ error: `Directory does not exist: ${cwd}` }, 400);
      }

      // Use a one-time key so startRpcSession's lock doesn't conflict with real session ids
      const { provider, modelId, toolNames, thinkingLevel, ...promptCommand } = command as { provider?: string; modelId?: string; toolNames?: string[]; thinkingLevel?: string; [key: string]: unknown };

      // Must be unique per request: startRpcSession coalesces concurrent callers
      // that share a key onto one session. Date.now() (ms resolution) collides for
      // requests in the same millisecond, merging two new sessions into one.
      const tempKey = `__new__${randomUUID()}`;
      const { session, realSessionId } = await startRpcSession(tempKey, "", cwd, toolNames);

      // Keep the files-route allowed-roots cache in sync so the new cwd is
      // immediately readable via /api/files. Without this, a file request under
      // a brand-new cwd would 403 for up to the cache TTL.
      allowFileRoot(cwd);
      invalidateSessionListCache();

      // Apply pre-selected model before sending the prompt
      if (provider && modelId) {
        await session.send({ type: "set_model", provider, modelId });
      }

      // Apply pre-selected thinking level before sending the prompt
      if (thinkingLevel) {
        await session.send({ type: "set_thinking_level", level: thinkingLevel });
      }

      if (promptCommand.type === "ensure_session") {
        return c.json({ success: true, sessionId: realSessionId, data: null });
      }

      const result = await session.send(promptCommand);

      return c.json({ success: true, sessionId: realSessionId, data: result });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // GET /api/agent/running/events - SSE stream of the set of currently-running
  // session ids. Pushes an update whenever any session starts or stops working,
  // so the sidebar never has to poll.
  app.get("/api/agent/running/events", (c) => {
    const signal = c.req.raw.signal;
    const stream = new ReadableStream({
      start(controller) {
        const encode = (data: unknown) => {
          const text = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(text));
        };

        // Subscribe BEFORE taking the initial snapshot so no state change can slip
        // through the gap between snapshot and subscription.
        const unsubscribe = subscribeRunningSessions((ids) => {
          try {
            encode({ type: "running", runningSessionIds: ids });
          } catch {
            // controller already closed
          }
        });

        // Initial snapshot so the client renders the correct state immediately.
        // (A duplicate frame here is harmless: the client just sets the same set.)
        encode({ type: "running", runningSessionIds: getRunningRpcSessionIds() });

        // Heartbeat to keep the connection alive through proxies/timeouts.
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(":\n\n"));
          } catch {
            // controller already closed
          }
        }, 30_000);

        const cleanup = () => {
          clearInterval(heartbeat);
          unsubscribe();
          try { controller.close(); } catch { /* already closed */ }
        };

        signal?.addEventListener("abort", cleanup);
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  });

  // GET /api/agent/:id/events - SSE stream of agent events
  app.get("/api/agent/:id/events", async (c) => {
    const id = c.req.param("id");

    // Fast path: already-running session
    let session = getRpcSession(id);
    if (!session || !session.isAlive()) {
      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return new Response("Session not found", { status: 404 });
      }
      const cwd = SessionManager.open(filePath).getHeader()?.cwd ?? process.cwd();
      try {
        ({ session } = await startRpcSession(id, filePath, cwd));
      } catch (error) {
        return new Response(`Failed to start agent: ${error}`, { status: 500 });
      }
    }

    const signal = c.req.raw.signal;
    const stream = new ReadableStream({
      start(controller) {
        const encode = (data: unknown) => {
          const text = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(text));
        };

        // Send initial connected event
        encode({ type: "connected", sessionId: id });

        const unsubscribe = session.onEvent((event) => {
          encode(event);
        });

        // Heartbeat to keep the connection alive through proxies/timeouts.
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(":\n\n"));
          } catch {
            // controller already closed
          }
        }, 30_000);

        // Cleanup when client disconnects
        const cleanup = () => {
          clearInterval(heartbeat);
          unsubscribe();
          controller.close();
        };

        // Detect client disconnect via abort signal
        signal?.addEventListener("abort", cleanup);
      },
    });

    return new Response(stream, { headers: SSE_HEADERS });
  });

  // GET /api/agent/:id/bash-output?path=<absPath>
  // Reads a bash output temp file referenced by this session. Inline display is
  // size-limited; download responses stream the file without buffering it.
  app.get("/api/agent/:id/bash-output", async (c) => {
    const id = c.req.param("id");
    const path = c.req.query("path");
    const download = c.req.query("download") === "1";

    if (!path) {
      return c.json({ error: "path required" }, 400);
    }

    const resolved = resolveBashOutputPath(path, tmpdir());
    if (!resolved) {
      return c.json({ error: "invalid path" }, 400);
    }

    if (!(await isBashOutputPathReferencedBySession(resolved, id))) {
      return c.json({ error: "forbidden" }, 403);
    }

    try {
      if (download) {
        const { handle } = await openRegularFileNoFollow(resolved);
        const stream = Readable.toWeb(handle.createReadStream()) as ReadableStream<Uint8Array>;
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": "attachment; filename=\"bash-output.log\"",
            "Cache-Control": "no-store",
          },
        });
      }

      const result = await readUtf8FileWithinLimit(resolved);
      if (result.tooLarge) {
        return c.json({
          error: `Full output is too large to display (limit ${MAX_INLINE_BASH_OUTPUT_BYTES} bytes)`,
          data: { size: result.size, maxBytes: MAX_INLINE_BASH_OUTPUT_BYTES },
        }, 413);
      }
      return c.json({ success: true, data: { output: result.content } });
    } catch {
      return c.json({ error: "full output unavailable" }, 404);
    }
  });

  // POST /api/agent/:id - Send a command to an existing session
  app.post("/api/agent/:id", async (c) => {
    const id = c.req.param("id");

    try {
      const body = (await c.req.json()) as { type: string; [key: string]: unknown };

      // Fast path: already-running session
      const existing = getRpcSession(id);
      if (existing?.isAlive()) {
        const result = await existing.send(body);
        return c.json({ success: true, data: result });
      }

      const filePath = await resolveSessionPath(id);
      if (!filePath) {
        return c.json({ error: "Session not found" }, 404);
      }

      const cwd = SessionManager.open(filePath).getHeader()?.cwd ?? process.cwd();

      const { session } = await startRpcSession(id, filePath, cwd);
      const result = await session.send(body);

      return c.json({ success: true, data: result });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // GET /api/agent/:id - Get current agent state
  app.get("/api/agent/:id", async (c) => {
    const id = c.req.param("id");

    try {
      const session = getRpcSession(id);
      if (!session || !session.isAlive()) {
        return c.json({ running: false });
      }

      const state = await session.send({ type: "get_state" });
      return c.json({ running: true, state });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
}
