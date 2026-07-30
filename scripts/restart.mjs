import { spawn, spawnSync } from "node:child_process";
import { platform } from "node:os";
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

if (platform() !== "win32") {
  console.error("npm run restart currently supports Windows only. Stop the existing dev process and run npm run dev.");
  process.exit(1);
}

stopWindowsDevelopmentProcesses();

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
