import type { Hono } from "hono";
import type { AuthEvent, AuthPrompt } from "@earendil-works/pi-ai";
import { ModelRuntime } from "@earendil-works/pi-coding-agent";
import { invalidateModelsCache } from "../lib/models-cache";

// In-memory registry: loginToken -> resolve/reject for the manualCodeInput promise.
// Module-level in the backend process (globalThis in the Next.js original).
const loginCallbacks = new Map<string, { resolve: (v: string) => void; reject: (e: Error) => void }>();

export function registerAuthRoutes(app: Hono): void {
  // GET /api/auth/providers — OAuth-capable providers and login state
  app.get("/api/auth/providers", async (c) => {
    const modelRuntime = await ModelRuntime.create();
    const credentials = await modelRuntime.listCredentials();
    const loggedInProviders = new Set(
      credentials.filter((credential) => credential.type === "oauth").map((credential) => credential.providerId),
    );
    const providers = modelRuntime.getProviders().filter((provider) => provider.auth.oauth);

    const EXCLUDED = new Set(["anthropic"]);
    const DISPLAY_NAMES: Record<string, string> = {
      "openai-codex": "ChatGPT Plus/Pro",
      "github-copilot": "GitHub Copilot",
    };

    const result = await Promise.all(
      providers
        .filter((p) => !EXCLUDED.has(p.id))
        .map(async (p) => {
          return {
            id: p.id,
            name: DISPLAY_NAMES[p.id] ?? p.name,
            usesCallbackServer: false,
            loggedIn: loggedInProviders.has(p.id),
          };
        })
    );

    return c.json({ providers: result });
  });

  // GET /api/auth/all-providers — API-key providers (non-OAuth, non-custom)
  app.get("/api/auth/all-providers", async (c) => {
    // Providers that use OAuth — handled separately via /api/auth/providers
    const OAUTH_PROVIDER_IDS = new Set(["anthropic", "github-copilot", "openai-codex"]);

    const modelRuntime = await ModelRuntime.create();
    const all = modelRuntime.getModels();

    // Deduplicate by provider, skip OAuth-only providers and custom providers (source=models_json_key)
    const seen = new Set<string>();
    const result: {
      id: string;
      displayName: string;
      configured: boolean;
      source?: string;
      modelCount: number;
    }[] = [];

    for (const provider of modelRuntime.getProviders()) {
      if (seen.has(provider.id)) continue;
      seen.add(provider.id);
      if (OAUTH_PROVIDER_IDS.has(provider.id) || !provider.auth.apiKey?.login) continue;
      const status = modelRuntime.getProviderAuthStatus(provider.id);
      // Skip providers whose key comes from models.json (those are custom providers)
      if (status.source === "models_json_key") continue;
      const modelCount = all.filter((model) => model.provider === provider.id).length;
      result.push({
        id: provider.id,
        displayName: provider.name,
        configured: status.configured,
        source: status.source,
        modelCount,
      });
    }

    return c.json({ providers: result });
  });

  // POST /api/auth/login/:provider — frontend sends redirect URL or auth code
  app.post("/api/auth/login/:provider", async (c) => {
    const provider = c.req.param("provider");
    const { token, code } = (await c.req.json()) as { token?: string; code?: string };

    if (!token || !code) {
      return c.json({ error: "token and code required" }, 400);
    }

    const callbacks = loginCallbacks.get(token);
    if (!callbacks) {
      return c.json({ error: "No pending login for token" }, 404);
    }
    // Verify token belongs to this provider (token format: "<provider>-<ts>-<random>")
    if (!token.startsWith(`${provider}-`)) {
      return c.json({ error: "Token does not match provider" }, 400);
    }

    callbacks.resolve(code);
    loginCallbacks.delete(token);
    return c.json({ ok: true, provider });
  });

  // GET /api/auth/login/:provider — SSE stream for OAuth flow
  app.get("/api/auth/login/:provider", (c) => {
    const provider = c.req.param("provider");

    const encoder = new TextEncoder();
    const send = (controller: ReadableStreamDefaultController, data: unknown) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // AbortController propagates client disconnect into ModelRuntime.login().
    const abort = new AbortController();
    c.req.raw.signal.addEventListener("abort", () => abort.abort());

    const stream = new ReadableStream({
      async start(controller) {
        const modelRuntime = await ModelRuntime.create();
        if (!modelRuntime.getProvider(provider)?.auth.oauth) {
          send(controller, { type: "error", message: `Unknown provider: ${provider}` });
          controller.close();
          return;
        }

        const activeTokens = new Set<string>();
        let pendingManualRequest: { token: string; promise: Promise<string> } | undefined;

        const createClientInputRequest = () => {
          const token = `${provider}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          activeTokens.add(token);

          const promise = new Promise<string>((resolve, reject) => {
            loginCallbacks.set(token, {
              resolve: (value) => {
                activeTokens.delete(token);
                loginCallbacks.delete(token);
                resolve(value);
              },
              reject: (error) => {
                activeTokens.delete(token);
                loginCallbacks.delete(token);
                reject(error);
              },
            });
          });

          return { token, promise };
        };

        const getManualInputRequest = () => {
          if (!pendingManualRequest) {
            pendingManualRequest = createClientInputRequest();
            pendingManualRequest.promise
              .finally(() => {
                pendingManualRequest = undefined;
              })
              .catch(() => {});
          }
          return pendingManualRequest;
        };

        // Cleanup: remove pending token and abort any waiting promise
        const cleanup = () => {
          for (const token of activeTokens) {
            loginCallbacks.get(token)?.reject(new Error("Login cancelled"));
            loginCallbacks.delete(token);
          }
          activeTokens.clear();
        };

        // Also cancel on client disconnect
        abort.signal.addEventListener("abort", cleanup);

        try {
          await modelRuntime.login(provider, "oauth", {
            prompt: async (prompt: AuthPrompt) => {
              const request = prompt.type === "manual_code"
                ? getManualInputRequest()
                : createClientInputRequest();
              if (prompt.type === "select") {
                send(controller, {
                  type: "select_request",
                  message: prompt.message,
                  options: prompt.options,
                  token: request.token,
                });
              } else {
                send(controller, {
                  type: "prompt_request",
                  message: prompt.message,
                  placeholder: prompt.placeholder ?? null,
                  token: request.token,
                });
              }
              return request.promise;
            },
            notify: (event: AuthEvent) => {
              if (event.type === "auth_url") {
                const request = getManualInputRequest();
                send(controller, {
                  type: "auth",
                  url: event.url,
                  instructions: event.instructions ?? null,
                  token: request.token,
                });
              } else if (event.type === "device_code") {
                send(controller, {
                  type: "device_code",
                  userCode: event.userCode,
                  verificationUri: event.verificationUri,
                  intervalSeconds: event.intervalSeconds ?? null,
                  expiresInSeconds: event.expiresInSeconds ?? null,
                });
              } else {
                send(controller, { type: "progress", message: event.message });
              }
            },
            signal: abort.signal,
          });

          invalidateModelsCache();
          send(controller, { type: "success" });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg !== "Login cancelled") {
            send(controller, { type: "error", message: msg });
          } else {
            send(controller, { type: "cancelled" });
          }
        } finally {
          cleanup();
          controller.close();
        }
      },
      cancel() {
        abort.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  // POST /api/auth/logout/:provider
  app.post("/api/auth/logout/:provider", async (c) => {
    const provider = c.req.param("provider");
    const modelRuntime = await ModelRuntime.create();
    if (!modelRuntime.getProvider(provider)?.auth.oauth) {
      return c.json({ error: `Unknown provider: ${provider}` }, 400);
    }
    await modelRuntime.logout(provider);
    invalidateModelsCache();
    return c.json({ ok: true });
  });

  // GET /api/auth/api-key/:provider — returns auth status (never returns the actual key)
  app.get("/api/auth/api-key/:provider", async (c) => {
    const provider = c.req.param("provider");
    const modelRuntime = await ModelRuntime.create();
    const status = modelRuntime.getProviderAuthStatus(provider);
    const displayName = modelRuntime.getProvider(provider)?.name ?? provider;
    const models = modelRuntime.getModels(provider).length;
    return c.json({ provider, displayName, configured: status.configured, source: status.source, models });
  });

  // POST /api/auth/api-key/:provider  body: { apiKey: string }
  app.post("/api/auth/api-key/:provider", async (c) => {
    const provider = c.req.param("provider");
    try {
      const { apiKey } = await c.req.json() as { apiKey?: string };
      if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
        return c.json({ error: "apiKey is required" }, 400);
      }
      const modelRuntime = await ModelRuntime.create();
      let keySubmitted = false;
      await modelRuntime.login(provider, "api_key", {
        notify: () => {},
        prompt: async (prompt) => {
          if (prompt.type === "select") {
            const keyOption = prompt.options.find((option) => option.id === "api-key" || option.id === "bearer-token");
            if (keyOption) return keyOption.id;
            throw new Error(`${provider} requires interactive authentication setup`);
          }
          if (!keySubmitted && prompt.type === "secret") {
            keySubmitted = true;
            return apiKey.trim();
          }
          throw new Error(`${provider} requires additional authentication settings`);
        },
      });
      invalidateModelsCache();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });

  // DELETE /api/auth/api-key/:provider — removes stored API key
  app.delete("/api/auth/api-key/:provider", async (c) => {
    const provider = c.req.param("provider");
    try {
      const modelRuntime = await ModelRuntime.create();
      await modelRuntime.logout(provider);
      invalidateModelsCache();
      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: String(error) }, 500);
    }
  });
}
