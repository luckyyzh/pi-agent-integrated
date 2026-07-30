import { spawn } from "node:child_process";
import { join } from "node:path";
import { managedEnvironment, rootDir } from "./profile.mjs";

const target = process.argv[2] ?? "dev";
const allowedTargets = new Set(["dev", "dev:lan", "start", "start:lan"]);
if (!allowedTargets.has(target)) {
  console.error(`Unsupported Pi Web script: ${target}`);
  process.exit(2);
}

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  console.error("Run the integrated application through npm.");
  process.exit(1);
}

const child = spawn(
  process.execPath,
  [npmCliPath, "--prefix", join(rootDir, "pi-web"), "run", target],
  {
    cwd: rootDir,
    env: managedEnvironment(),
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
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
