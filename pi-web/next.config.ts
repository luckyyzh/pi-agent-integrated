import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const { version } = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8")) as { version: string };
let piVersion = "unknown";
try {
  const piPkgPath = join(__dirname, "..", "server", "node_modules", "@earendil-works", "pi-coding-agent", "package.json");
  piVersion = (JSON.parse(readFileSync(piPkgPath, "utf8")) as { version: string }).version;
} catch { /* package not found, use default */ }

const allowedDevOrigins = [
  "192.168.*.*",
  ...(process.env.PI_WEB_ALLOWED_HOSTS?.split(",") ?? []),
].map((origin) => origin.trim()).filter(Boolean);

// All /api routes are served by the standalone backend (pi-agent-server) so
// agent sessions and server state survive frontend recompiles and restarts.
const serverOrigin = `http://127.0.0.1:${process.env.PI_SERVER_PORT ?? "30142"}`;

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins,
  async rewrites() {
    // beforeFiles is required: default (afterFiles) rewrites lose to the
    // existing app/api route handlers in dev, so the migrated routes
    // would keep hitting the local copies instead of the backend.
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${serverOrigin}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "private, no-cache, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_PI_VERSION: piVersion,
  },
};

export default nextConfig;
