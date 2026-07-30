import { NextResponse } from "next/server";
import { mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { getManagedRuntimePaths, isManagedRuntime } from "@/lib/app-runtime";
import { allowFileRoot } from "@/lib/file-access";

// POST /api/default-cwd
// Managed app: creates <dataDir>/workspaces/default.
// Standalone pi-web: preserves the upstream ~/pi-cwd-<YYYYMMDD> behavior.
export async function POST() {
  try {
    const dir = isManagedRuntime()
      ? join(getManagedRuntimePaths().dataDir, "workspaces", "default")
      : join(
          homedir(),
          `pi-cwd-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
        );
    mkdirSync(dir, { recursive: true });
    allowFileRoot(dir);
    return NextResponse.json({ cwd: dir });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
