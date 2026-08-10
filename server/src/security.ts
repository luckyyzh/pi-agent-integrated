import type { MiddlewareHandler } from "hono";
import { isApiRequestAllowed } from "./lib/request-security.js";

// Same gate pi-web's proxy middleware applied to /api/*: loopback/IP-literal
// hosts plus same-origin checks. The frontend proxies /api here server-side,
// so Host/Origin headers arrive unchanged from the browser.
export const securityMiddleware: MiddlewareHandler = async (c, next) => {
  if (!isApiRequestAllowed(c.req.raw)) {
    return c.json({ error: "Untrusted API request" }, 403);
  }
  await next();
};
