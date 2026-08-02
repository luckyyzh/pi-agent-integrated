import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

function getMcpPath(): string {
  return join(getAgentDir(), "mcp.json");
}

interface McpConfigFile {
  mcpServers: Record<string, Record<string, unknown>>;
  settings?: Record<string, unknown>;
  imports?: string[];
}

function readMcpJson(): McpConfigFile {
  const path = getMcpPath();
  if (!existsSync(path)) return { mcpServers: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as McpConfigFile;
    if (!parsed || typeof parsed !== "object" || typeof parsed.mcpServers !== "object") {
      return { mcpServers: {} };
    }
    return parsed;
  } catch {
    return { mcpServers: {} };
  }
}

function writeMcpJson(data: McpConfigFile): void {
  const path = getMcpPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function GET() {
  return NextResponse.json({ config: readMcpJson(), path: getMcpPath() });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as McpConfigFile;
    if (!body || typeof body !== "object" || typeof body.mcpServers !== "object" || body.mcpServers === null) {
      return NextResponse.json({ error: "mcpServers must be an object" }, { status: 400 });
    }
    // 只保留已知顶层字段，避免写入无关键
    const out: McpConfigFile = { mcpServers: body.mcpServers };
    if (body.settings && typeof body.settings === "object") out.settings = body.settings;
    if (Array.isArray(body.imports)) out.imports = body.imports;
    writeMcpJson(out);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
