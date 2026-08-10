import { spawn, spawnSync } from "node:child_process";
import { platform } from "node:os";
import { join } from "node:path";
import { configurePiMemory } from "./configure-pi-memory.mjs";
import { configurePiAiVision } from "./configure-pi-ai-vision.mjs";
import { managedEnvironment, rootDir } from "./profile.mjs";
import {
  isLocalPortListening,
  maintainStorage,
  printMaintenanceResult,
} from "./storage-maintenance.mjs";

const target = process.argv[2] ?? "dev";
const allowedTargets = new Set(["build", "dev", "dev:lan", "start", "start:lan"]);
if (!allowedTargets.has(target)) {
  console.error(`Unsupported Pi Web script: ${target}`);
  process.exit(2);
}

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  console.error("Run the integrated application through npm.");
  process.exit(1);
}

const childEnvironment = managedEnvironment();
const serverPort = Number(childEnvironment.PI_SERVER_PORT ?? "30142");
const memoryConfiguration = configurePiMemory({ quiet: true });
if (memoryConfiguration.status === "missing") {
  console.warn("[memory] pi-memory is not installed; run npm run setup to enable managed memory");
}
try {
  configurePiAiVision({ quiet: true });
} catch (error) {
  console.warn(`[vision] pi-ai passthrough patch skipped: ${error.message}`);
}
if (await isLocalPortListening(30141)) {
  console.log("[storage] skipped automatic maintenance because Pi Web is already running");
} else {
  printMaintenanceResult(maintainStorage({ mode: "auto", env: childEnvironment }));
}

const children = [];
let shuttingDown = false;

function spawnPackageScript(packageDir, script) {
  return spawn(
    process.execPath,
    [npmCliPath, "--prefix", join(rootDir, packageDir), "run", script],
    {
      cwd: rootDir,
      env: childEnvironment,
      stdio: "inherit",
    },
  );
}

function killChild(child, signal) {
  if (child.killed || child.exitCode !== null) return;
  if (platform() === "win32") {
    // Windows has no process groups: killing the npm wrapper leaves the
    // real workers (tsx watch / next dev) orphaned and holding their ports.
    // taskkill /T terminates the whole tree instead.
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
  } else {
    child.kill(signal);
  }
}

function stopAll(signal) {
  shuttingDown = true;
  for (const child of children) {
    killChild(child, signal);
  }
}

// TCP listening alone is not enough: an orphaned backend from a previous run
// can hold the port. Verify identity through the health endpoint instead.
async function isBackendHealthy() {
  try {
    const response = await fetch(`http://127.0.0.1:${serverPort}/api/health`, {
      signal: AbortSignal.timeout(750),
    });
    if (!response.ok) return false;
    const body = await response.json();
    return body?.name === "pi-agent-server";
  } catch {
    return false;
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopAll(signal));
}

if (target === "build") {
  // Sequential builds: the backend is independent, the frontend only needs
  // the shared types package, so order matters only for readable logs.
  const serverBuild = spawnPackageScript("server", "build");
  serverBuild.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
  serverBuild.on("exit", (code, signal) => {
    if (signal || code !== 0) process.exit(code ?? 1);
    const webBuild = spawnPackageScript("pi-web", "build");
    webBuild.on("error", (error) => {
      console.error(error);
      process.exit(1);
    });
    webBuild.on("exit", (code, signal) => {
      if (!signal && code === 0) {
        printMaintenanceResult(maintainStorage({ mode: "auto", env: childEnvironment }));
      }
      if (signal) process.kill(process.pid, signal);
      process.exit(code ?? 1);
    });
  });
} else {
  // Backend first: agent sessions live in pi-agent-server, and Pi Web's
  // /api rewrites need it listening before the first request arrives.
  if (await isLocalPortListening(serverPort)) {
    console.error(
      `[run] port ${serverPort} is already in use (possibly an orphaned backend). ` +
        `Find it with: netstat -ano | findstr :${serverPort}`,
    );
    process.exit(1);
  }
  const serverScript = target.startsWith("dev") ? "dev" : "start";
  const server = spawnPackageScript("server", serverScript);
  children.push(server);
  server.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
  server.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[run] backend exited (${code ?? signal}); shutting down Pi Web`);
    stopAll(signal ?? "SIGTERM");
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });

  const startWeb = () => {
    const web = spawnPackageScript("pi-web", target);
    children.push(web);
    web.on("error", (error) => {
      console.error(error);
      process.exit(1);
    });
    web.on("exit", (code, signal) => {
      stopAll(signal ?? "SIGTERM");
      if (signal) process.kill(process.pid, signal);
      process.exit(code ?? 1);
    });
  };

  let webStarted = false;
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null || server.killed) break;
    if (await isBackendHealthy()) {
      webStarted = true;
      startWeb();
      break;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  if (!webStarted) {
    console.error(`[run] backend did not become ready on port ${serverPort} within 30s`);
    stopAll("SIGTERM");
    process.exit(1);
  }
}
