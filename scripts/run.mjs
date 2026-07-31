import { spawn } from "node:child_process";
import { join } from "node:path";
import { configurePiMemory } from "./configure-pi-memory.mjs";
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
const memoryConfiguration = configurePiMemory({ quiet: true });
if (memoryConfiguration.status === "missing") {
  console.warn("[memory] pi-memory is not installed; run npm run setup to enable managed memory");
}
if (await isLocalPortListening(30141)) {
  console.log("[storage] skipped automatic maintenance because Pi Web is already running");
} else {
  printMaintenanceResult(maintainStorage({ mode: "auto", env: childEnvironment }));
}

const child = spawn(
  process.execPath,
  [npmCliPath, "--prefix", join(rootDir, "pi-web"), "run", target],
  {
    cwd: rootDir,
    env: childEnvironment,
    stdio: "inherit",
  },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (!signal && code === 0 && target === "build") {
    printMaintenanceResult(maintainStorage({ mode: "auto", env: childEnvironment }));
  }
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
