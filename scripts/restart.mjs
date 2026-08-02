import { spawn, spawnSync } from "node:child_process";
import { platform } from "node:os";
import { isLocalPortListening } from "./storage-maintenance.mjs";
import { rootDir } from "./profile.mjs";

const DEV_PORT = 30141;

function stopWindowsDevelopmentProcesses() {
  const projectRootLiteral = rootDir.replaceAll("'", "''");
  const script = `
$projectRoot = '${projectRootLiteral}'
$currentProcessId = ${process.pid}
$excludedProcessIds = [Collections.Generic.HashSet[int]]::new()
$ancestorProcessId = $currentProcessId

while ($ancestorProcessId -gt 0 -and $excludedProcessIds.Add($ancestorProcessId)) {
  $ancestor = Get-CimInstance Win32_Process -Filter "ProcessId = $ancestorProcessId" -ErrorAction SilentlyContinue
  if (-not $ancestor) {
    break
  }
  $ancestorProcessId = [int]$ancestor.ParentProcessId
}

$targets = Get-CimInstance Win32_Process | Where-Object {
  -not $excludedProcessIds.Contains([int]$_.ProcessId) -and
  $_.CommandLine -and
  $_.CommandLine.IndexOf($projectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
  $_.Name -in @('node.exe', 'cmd.exe')
}

foreach ($target in $targets) {
  Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 500
$listener = Get-NetTCPConnection -LocalPort ${DEV_PORT} -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  throw "Port ${DEV_PORT} is still occupied by PID $($listener[0].OwningProcess)"
}

exit 0
`;

  const result = spawnSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
    { cwd: rootDir, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readMacListenerPids() {
  const result = spawnSync(
    "lsof",
    ["-nP", "-t", `-iTCP:${DEV_PORT}`, "-sTCP:LISTEN"],
    { cwd: rootDir, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  const output = result.stdout ?? "";
  if (result.status !== 0 && !output.trim()) return [];

  return [...new Set(
    output
      .trim()
      .split(/\s+/)
      .map((value) => Number.parseInt(value, 10))
      .filter((pid) => Number.isInteger(pid) && pid > 0),
  )];
}

function readMacProcessCommand(pid) {
  const result = spawnSync("ps", ["-p", String(pid), "-o", "command="], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  return result.status === 0 ? (result.stdout ?? "").trim() : "";
}

function signalProcess(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function waitForPortClosed(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (await isLocalPortListening(DEV_PORT)) {
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return true;
}

async function stopMacDevelopmentProcesses() {
  const listenerPids = readMacListenerPids();
  if (listenerPids.length === 0) return;

  const projectPids = listenerPids.filter((pid) => readMacProcessCommand(pid).includes(rootDir));
  const foreignPids = listenerPids.filter((pid) => !projectPids.includes(pid));
  if (foreignPids.length > 0 || projectPids.length === 0) {
    const pids = foreignPids.length > 0 ? foreignPids : listenerPids;
    throw new Error(`Port ${DEV_PORT} is occupied by a process that does not belong to this project (PID ${pids.join(", ")}).`);
  }

  for (const pid of projectPids) signalProcess(pid, "SIGTERM");
  if (await waitForPortClosed(3000)) return;

  for (const pid of projectPids) signalProcess(pid, "SIGKILL");
  if (!(await waitForPortClosed(1000))) {
    throw new Error(`Port ${DEV_PORT} is still occupied by this project after termination (PID ${projectPids.join(", ")}).`);
  }
}

try {
  if (platform() === "win32") {
    stopWindowsDevelopmentProcesses();
  } else if (platform() === "darwin") {
    await stopMacDevelopmentProcesses();
  } else {
    throw new Error("npm run restart currently supports Windows and macOS only. Stop the existing dev process and run npm run dev.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const npmCliPath = process.env.npm_execpath;
if (!npmCliPath) {
  console.error("Run this command through npm: npm run restart");
  process.exit(1);
}

console.log(`Restarting Pi Agent Integrated at http://127.0.0.1:${DEV_PORT}`);
const child = spawn(process.execPath, [npmCliPath, "run", "dev"], {
  cwd: rootDir,
  env: process.env,
  stdio: "inherit",
});

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
