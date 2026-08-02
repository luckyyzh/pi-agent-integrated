import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

interface VisionConfigFile {
  backend?: "ollama" | "openai";
  ollama?: { host?: string; model?: string };
  openai?: { baseUrl?: string; apiKey?: string; model?: string };
}

function getVisionPath(): string {
  return join(getAgentDir(), "vision.json");
}

function readVisionJson(): VisionConfigFile {
  const path = getVisionPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as VisionConfigFile;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function writeVisionJson(data: VisionConfigFile): void {
  const path = getVisionPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function GET() {
  return NextResponse.json({ config: readVisionJson(), path: getVisionPath() });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as VisionConfigFile;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "body must be an object" }, { status: 400 });
    }
    const out: VisionConfigFile = {};
    if (body.backend === "ollama" || body.backend === "openai") out.backend = body.backend;
    if (body.ollama && typeof body.ollama === "object") {
      out.ollama = {};
      if (typeof body.ollama.host === "string" && body.ollama.host.trim()) out.ollama.host = body.ollama.host.trim();
      if (typeof body.ollama.model === "string" && body.ollama.model.trim()) out.ollama.model = body.ollama.model.trim();
    }
    if (body.openai && typeof body.openai === "object") {
      out.openai = {};
      if (typeof body.openai.baseUrl === "string" && body.openai.baseUrl.trim()) out.openai.baseUrl = body.openai.baseUrl.trim();
      if (typeof body.openai.apiKey === "string" && body.openai.apiKey.trim()) out.openai.apiKey = body.openai.apiKey.trim();
      if (typeof body.openai.model === "string" && body.openai.model.trim()) out.openai.model = body.openai.model.trim();
    }
    writeVisionJson(out);
    return NextResponse.json({ success: true, path: getVisionPath() });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
