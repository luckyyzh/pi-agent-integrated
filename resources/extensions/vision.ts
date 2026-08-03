/**
 * Vision extension: describe images for text-only main models (e.g. DeepSeek).
 *
 * Two interchangeable backends, selected by VISION_BACKEND. No backend is
 * preconfigured — users must pick one (Web UI vision panel or env vars):
 *   - "ollama": local Ollama vision model via the native /api/chat endpoint.
 *       OLLAMA_HOST          (default http://localhost:11434)
 *       OLLAMA_VISION_MODEL  (required, e.g. qwen3-vl:8b)
 *   - "openai": any OpenAI-compatible vision API (cloud or self-hosted).
 *       VISION_OPENAI_BASE_URL  e.g. https://api.openai.com/v1
 *       VISION_OPENAI_API_KEY
 *       VISION_OPENAI_MODEL     e.g. gpt-4o-mini, glm-4.5v, qwen-vl-max
 *
 * Why not Ollama's OpenAI-compatible /v1 endpoint: it moves qwen3-family
 * reasoning output into the `reasoning` field with an empty `content`, which Pi
 * treats as an empty reply. The native /api/chat with `think: false` returns a
 * normal textual answer, so the Ollama backend deliberately bypasses /v1.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { Type } from "typebox";

const REQUEST_TIMEOUT_MS = 180_000;
const MAX_IMAGE_BYTES = 7 * 1024 * 1024; // Ollama's built-in per-image limit
const DEFAULT_MAX_TOKENS = 4096; // generous: thinking-based APIs spend budget on reasoning first

const DEFAULT_PROMPT = [
	"请详细描述这张图片，输出要求：",
	"1. 完整 OCR：按阅读顺序逐字转录所有可见文字（含 UI 标签、按钮、错误信息、代码、数字、日期），保留版式线索。",
	"2. 版式与视觉结构：区域、颜色、形状；UI 截图、图表（坐标轴/数值/趋势）、表格用 markdown 重建、流程图（节点/连线/方向）。",
	"3. 语义总结：2-3 句概括图片内容与关键信息。",
	"4. 模糊/截断/有歧义处明确说明，不要猜测。",
	"5. 多张图片时，分别描述每张，用【图片1】【图片2】…标注。",
	"主模型看不到图，完全依赖你的转录，文字务必穷尽。",
].join("\n");

/** Hook transcription prompt: the automatic Web-UI-image pipeline. Kept short
 *  on purpose — each run is ~15s of Ollama time and the text is injected into
 *  the main model's context every turn, so verbosity costs both latency and
 *  tokens. The `vision` tool keeps the detailed DEFAULT_PROMPT above. */
const HOOK_PROMPT = [
	"用中文简要描述这张图片（主模型依赖此转录理解图片，需准确但精简）：",
	"1. 所有可见文字：按阅读顺序转录（含标签、数字、按钮、代码），无文字则写“无”。",
	"2. 图片内容：主体、场景、布局，2-3 句。",
	"总长约 100 字，不要分节模板，直接输出。",
].join("\n");

const visionParams = Type.Object({
	image_paths: Type.Array(
		Type.String({
			description: "图片文件路径（绝对或相对路径），至少一个",
			minLength: 1,
		}),
		{ minItems: 1, maxItems: 8 },
	),
	backend: Type.Optional(
		Type.Union([Type.Literal("ollama"), Type.Literal("openai")], {
			description:
				"视觉后端：ollama（本地）或 openai（OpenAI 兼容 API）。默认取 VISION_BACKEND 环境变量，未配置时报错",
		}),
	),
	model: Type.Optional(
		Type.String({
			description:
				"视觉模型 tag/ID，默认取后端对应环境变量（OLLAMA_VISION_MODEL 或 VISION_OPENAI_MODEL）",
		}),
	),
	prompt: Type.Optional(
		Type.String({
			description: `自定义识图指令，默认：${DEFAULT_PROMPT.split("\n")[0]}`,
		}),
	),
});

function envOr(name: string, fallback: string): string {
	const value = process.env[name]?.trim();
	return value && value.length > 0 ? value : fallback;
}

function mimeFromPath(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
	switch (ext) {
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "webp":
			return "image/webp";
		case "gif":
			return "image/gif";
		case "bmp":
			return "image/bmp";
		default:
			return "application/octet-stream";
	}
}

interface LoadedImage {
	base64: string;
	mime: string;
}

async function loadImages(imagePaths: string[]): Promise<LoadedImage[]> {
	const images: LoadedImage[] = [];
	for (const filePath of imagePaths) {
		const fileStat = await stat(filePath).catch(() => null);
		if (!fileStat) throw new Error(`vision: file not found: ${filePath}`);
		if (!fileStat.isFile())
			throw new Error(`vision: not a regular file: ${filePath}`);
		if (fileStat.size === 0) throw new Error(`vision: empty file: ${filePath}`);
		if (fileStat.size > MAX_IMAGE_BYTES) {
			throw new Error(
				`vision: ${filePath} is ${fileStat.size} bytes, exceeding the ${MAX_IMAGE_BYTES} byte limit. Resize or compress the image first.`,
			);
		}
		const buffer = await readFile(filePath);
		images.push({
			base64: buffer.toString("base64"),
			mime: mimeFromPath(filePath),
		});
	}
	return images;
}

function requestSignal(signal: AbortSignal | undefined): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
	return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function describeWithOllama(
	baseUrl: string,
	model: string,
	prompt: string,
	images: LoadedImage[],
	signal: AbortSignal | undefined,
): Promise<string> {
	// Ollama defaults to a small num_ctx (4096 on this setup); multi-image
	// requests blow past it. Raise explicitly — the model supports 262k.
	const numCtx = parseInt(envOr("OLLAMA_NUM_CTX", "16384"), 10) || 16384;
	// Keep the vision model resident in VRAM: system OLLAMA_KEEP_ALIVE is 30s on
	// this machine, so every transcribe would cold-load 7.7GB otherwise. -1 =
	// stay loaded until memory pressure evicts it (numeric -1, not "-1").
	const keepAliveRaw = envOr("OLLAMA_VISION_KEEP_ALIVE", "-1");
	const keepAlive: number | string = keepAliveRaw === "-1" ? -1 : keepAliveRaw;
	const body = {
		model,
		messages: [
			{
				role: "user",
				content: prompt,
				images: images.map((img) => img.base64),
			},
		],
		stream: false,
		think: false,
		keep_alive: keepAlive,
		options: { temperature: 0, num_ctx: numCtx },
	};

	let response: Response;
	try {
		response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/chat`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal: requestSignal(signal),
		});
	} catch (error) {
		const cause = error instanceof Error ? error.message : String(error);
		throw new Error(
			`vision: cannot reach Ollama at ${baseUrl} (${cause}). Is Ollama running?`,
		);
	}

	if (!response.ok) {
		const detail = (await response.text().catch(() => "")).slice(0, 500);
		throw new Error(
			`vision: Ollama returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
		);
	}

	const data = (await response.json()) as { message?: { content?: string } };
	const content = data.message?.content?.trim();
	if (!content) {
		throw new Error(
			`vision: Ollama model ${model} returned an empty response. ` +
				"Check the model tag and that it supports vision.",
		);
	}
	return content;
}

async function describeWithOpenAI(
	baseUrl: string,
	apiKey: string,
	model: string,
	prompt: string,
	images: LoadedImage[],
	signal: AbortSignal | undefined,
): Promise<string> {
	const body = {
		model,
		messages: [
			{
				role: "user",
				content: [
					{ type: "text", text: prompt },
					...images.map((img) => ({
						type: "image_url",
						image_url: { url: `data:${img.mime};base64,${img.base64}` },
					})),
				],
			},
		],
		max_tokens: DEFAULT_MAX_TOKENS,
		temperature: 0,
	};

	let response: Response;
	try {
		response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(body),
			signal: requestSignal(signal),
		});
	} catch (error) {
		const cause = error instanceof Error ? error.message : String(error);
		throw new Error(`vision: cannot reach ${baseUrl} (${cause}).`);
	}

	if (!response.ok) {
		const detail = (await response.text().catch(() => "")).slice(0, 500);
		throw new Error(
			`vision: API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}. ` +
				"Check VISION_OPENAI_BASE_URL / VISION_OPENAI_API_KEY / VISION_OPENAI_MODEL.",
		);
	}

	const data = (await response.json()) as {
		choices?: Array<{
			message?: {
				content?: string;
				reasoning_content?: string;
				reasoning?: string;
			};
			finish_reason?: string;
		}>;
	};
	const choice = data.choices?.[0];
	const content = choice?.message?.content?.trim();
	if (content) return content;

	const reasoning =
		choice?.message?.reasoning_content || choice?.message?.reasoning;
	const finish = choice?.finish_reason ?? "unknown";
	if (reasoning) {
		throw new Error(
			`vision: model ${model} returned only reasoning (finish=${finish}). ` +
				"If it is a thinking model, pick a non-thinking vision model or raise max_tokens.",
		);
	}
	throw new Error(
		`vision: model ${model} returned an empty response (finish=${finish}).`,
	);
}

interface DescribeOptions {
	backend?: string;
	model?: string;
	prompt?: string;
	signal?: AbortSignal;
}

/**
 * Optional file-based configuration, edited from the Web UI vision panel
 * (writes `$PI_CODING_AGENT_DIR/vision.json`). Environment variables and
 * per-call parameters take precedence over this file; every read is fresh, so
 * saving the panel takes effect on the next image request without a restart.
 */
interface VisionFileConfig {
	backend?: "ollama" | "openai";
	ollama?: { host?: string; model?: string };
	openai?: { baseUrl?: string; apiKey?: string; model?: string };
}

function visionConfigPath(): string {
	const agentDir = process.env.PI_CODING_AGENT_DIR?.trim();
	return (
		(agentDir && agentDir.length > 0
			? agentDir
			: join(homedir(), ".pi", "agent")) + "/vision.json"
	);
}

async function loadVisionFileConfig(): Promise<VisionFileConfig> {
	try {
		const raw = await readFile(visionConfigPath(), "utf8");
		const parsed = JSON.parse(raw) as VisionFileConfig;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

async function describeImages(
	images: LoadedImage[],
	options: DescribeOptions,
): Promise<string> {
	const fileConfig = await loadVisionFileConfig();
	const backend =
		options.backend ?? envOr("VISION_BACKEND", fileConfig.backend ?? "");
	if (backend !== "ollama" && backend !== "openai") {
		throw new Error(
			"vision: no vision backend configured. Pick one in the Web UI vision panel " +
				"(lower-left → Models → Vision) or set VISION_BACKEND=ollama|openai plus " +
				"the backend's address/model (see the OLLAMA_* / VISION_OPENAI_* env vars).",
		);
	}
	const prompt = options.prompt ?? DEFAULT_PROMPT;
	if (backend === "ollama") {
		const baseUrl = envOr(
			"OLLAMA_HOST",
			fileConfig.ollama?.host ?? "http://localhost:11434",
		);
		const model =
			options.model ??
			envOr("OLLAMA_VISION_MODEL", fileConfig.ollama?.model ?? "");
		if (!model) {
			throw new Error(
				"vision: the ollama backend needs a vision model. Set it in the Web UI " +
					"vision panel or via OLLAMA_VISION_MODEL (pull one first, e.g. " +
					"`ollama pull qwen3-vl:8b`).",
			);
		}
		return describeWithOllama(baseUrl, model, prompt, images, options.signal);
	}
	const baseUrl = envOr(
		"VISION_OPENAI_BASE_URL",
		fileConfig.openai?.baseUrl ?? "",
	);
	const apiKey = envOr(
		"VISION_OPENAI_API_KEY",
		fileConfig.openai?.apiKey ?? "",
	);
	const model =
		options.model ??
		envOr("VISION_OPENAI_MODEL", fileConfig.openai?.model ?? "");
	if (!baseUrl || !apiKey || !model) {
		throw new Error(
			"vision: the openai backend needs a base URL, API key and model. " +
				"Configure them in the Web UI vision panel (lower-left) or via " +
				"VISION_OPENAI_BASE_URL / VISION_OPENAI_API_KEY / VISION_OPENAI_MODEL. " +
				"Example: https://api.openai.com/v1 + gpt-4o-mini.",
		);
	}
	return describeWithOpenAI(
		baseUrl,
		apiKey,
		model,
		prompt,
		images,
		options.signal,
	);
}

/**
 * Description cache, persisted to disk so restarts don't force re-transcribing
 * the whole conversation's history. Each entry is ~300B; capped at 64.
 */
const IMAGE_DESCRIPTION_CACHE = new Map<string, string>();
const CACHE_MAX_ENTRIES = 64;
let cacheLoaded = false;

function visionCachePath(): string {
	const agentDir = process.env.PI_CODING_AGENT_DIR?.trim();
	return (
		(agentDir && agentDir.length > 0
			? agentDir
			: join(homedir(), ".pi", "agent")) + "/vision-cache.json"
	);
}

async function loadDescriptionCache(): Promise<void> {
	if (cacheLoaded) return;
	cacheLoaded = true;
	try {
		const parsed = JSON.parse(
			await readFile(visionCachePath(), "utf8"),
		) as Record<string, string>;
		for (const [key, value] of Object.entries(parsed)) {
			if (typeof value === "string") IMAGE_DESCRIPTION_CACHE.set(key, value);
		}
	} catch {
		/* no cache file yet, or corrupt — start empty */
	}
}

function persistDescriptionCache(): void {
	void writeFile(
		visionCachePath(),
		JSON.stringify(Object.fromEntries(IMAGE_DESCRIPTION_CACHE)),
		"utf8",
	).catch(() => {
		/* disk cache is best-effort; failures must never break transcription */
	});
}

function dataUrlToLoadedImage(url: string): LoadedImage | null {
	const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(url);
	if (!match) return null;
	return { base64: match[2], mime: match[1] };
}

function imageCacheKey(image: LoadedImage): string {
	// Whole-image hash: PNG/JPG headers repeat for same dimensions, so a short
	// prefix would collide across different images of the same size.
	return createHash("md5").update(image.base64).digest("hex");
}

/**
 * Per-image description cache. Every request rebuilds the payload from the
 * session file, which keeps the original image parts, so without this cache
 * the whole conversation's images would be re-transcribed every turn and
 * eventually exceed Ollama's context window. Single-image granularity means
 * only genuinely new images hit the vision model.
 */
async function getImageDescription(
	image: LoadedImage,
	prompt: string,
	signal: AbortSignal | undefined,
): Promise<string> {
	const key = imageCacheKey(image);
	await loadDescriptionCache();
	const cached = IMAGE_DESCRIPTION_CACHE.get(key);
	if (cached) return cached;
	const description = await describeImages([image], { prompt, signal });
	IMAGE_DESCRIPTION_CACHE.set(key, description);
	if (IMAGE_DESCRIPTION_CACHE.size > CACHE_MAX_ENTRIES) {
		const oldest = IMAGE_DESCRIPTION_CACHE.keys().next().value;
		if (oldest !== undefined) IMAGE_DESCRIPTION_CACHE.delete(oldest);
	}
	persistDescriptionCache();
	return description;
}

function isTextOnlyModel(model: unknown): boolean {
	const input = (model as { input?: string[] } | undefined)?.input;
	return Array.isArray(input) && !input.includes("image");
}

export default function visionExtension(pi: ExtensionAPI) {
	// Keep user-message images intact for text-only models so the hook below can
	// transcribe them (pi-ai would otherwise replace them with a text placeholder
	// before before_provider_request runs). The matching pi-ai patch is applied
	// and replayed by scripts/configure-pi-ai-vision.mjs.
	process.env.PI_VISION_PASSTHROUGH_IMAGES = "1";
	pi.registerTool({
		name: "vision",
		label: "Vision (image description)",
		description:
			"用视觉模型描述本地图片并返回详细文本（完整 OCR、版式结构、语义总结）。" +
			"适用于主模型不支持图片输入（如 DeepSeek）时查看截图/图表/文档/照片。" +
			"后端可配置：ollama（本地）或 openai（任意 OpenAI 兼容视觉 API），初始未配置需先设置：" +
			"WebUI 视觉面板（左下角→模型→视觉）或环境变量（VISION_BACKEND + 对应地址/模型/密钥）。",
		promptSnippet:
			"Describe local images using a vision model (Ollama or OpenAI-compatible)",
		promptGuidelines: [
			"Use vision when the user asks you to look at an image (screenshot, diagram, chart, document, photo) and the current model cannot receive image attachments.",
			"Pass image file paths that exist on disk; the tool reads and encodes them itself.",
			"One call can describe up to 8 images; prefer batching related images into a single call.",
			"The returned text is the vision model's transcription — relay it faithfully, quoting OCR text verbatim.",
			"If the call fails because no vision backend is configured, report the missing environment variables.",
		],
		parameters: visionParams,
		executionMode: "sequential",
		async execute(_toolCallId, params, signal) {
			const prompt = params.prompt ?? DEFAULT_PROMPT;
			const images = await loadImages(params.image_paths);
			const content = await describeImages(images, {
				backend: params.backend,
				model: params.model,
				prompt,
				signal,
			});

			return {
				content: [{ type: "text", text: content }],
				details: {
					backend: params.backend ?? envOr("VISION_BACKEND", ""),
					model: params.model ?? undefined,
					imageCount: images.length,
				},
			};
		},
	});

	// --- Automatic image transcription for text-only main models ---
	// Web UI image uploads arrive as base64 image_url parts in the user message.
	// A text-only model (e.g. DeepSeek) cannot receive them — DeepSeek rejects
	// the request with HTTP 400. This hook transcribes the images through the
	// configured vision backend and replaces them with text before the request
	// is sent, so the main model keeps working seamlessly.
	pi.on("before_provider_request", async (event, ctx) => {
		const payload = event.payload as
			| { messages?: Array<{ role?: string; content?: unknown }> }
			| undefined;
		const messages = payload?.messages;
		if (!Array.isArray(messages) || messages.length === 0) return;
		if (!isTextOnlyModel(ctx.model)) return; // vision-capable models pass through untouched

		// Collect images and replace each with a numbered text placeholder.
		const images: LoadedImage[] = [];
		let dirty = false;
		for (const msg of messages) {
			if (msg?.role !== "user" || !Array.isArray(msg.content)) continue;
			const newContent: unknown[] = [];
			for (const part of msg.content) {
				const p = part as { type?: string; image_url?: { url?: string } };
				if (p?.type === "image_url" && typeof p.image_url?.url === "string") {
					const img = dataUrlToLoadedImage(p.image_url.url);
					if (img) {
						images.push(img);
						newContent.push({ type: "text", text: `[图片 ${images.length}]` });
						dirty = true;
					} else {
						newContent.push(part);
					}
				} else {
					newContent.push(part);
				}
			}
			msg.content = newContent;
		}
		if (!dirty || images.length === 0) return;

		// Transcribe per image: only genuinely new images hit the vision model
		// (history resolves from cache), so one request never re-batches the
		// whole conversation's images and exceeds Ollama's context window.
		const transcribed: string[] = [];
		for (let i = 0; i < images.length; i++) {
			try {
				const desc = await getImageDescription(
					images[i],
					HOOK_PROMPT,
					ctx.signal,
				);
				transcribed.push(`【图片${i + 1}】\n${desc}`);
			} catch (error) {
				const cause = error instanceof Error ? error.message : String(error);
				transcribed.push(`【图片${i + 1}】\n[图片处理失败：${cause}]`);
			}
		}
		const description = transcribed.join("\n\n");

		// Place the full transcription on the LAST image-carrying message (the one
		// the model is actively processing); earlier image messages reference it.
		// Putting it on the first message instead hid it in history.
		const targets: Array<{ part: { type?: string; text?: string } }> = [];
		for (const msg of messages) {
			if (msg?.role !== "user" || !Array.isArray(msg.content)) continue;
			for (const part of msg.content) {
				const p = part as { type?: string; text?: string };
				if (
					p?.type === "text" &&
					typeof p.text === "string" &&
					p.text.startsWith("[图片 ")
				) {
					targets.push({ part: p });
				}
			}
		}
		const lastTarget = targets[targets.length - 1];
		if (lastTarget) {
			lastTarget.part.text = `[用户上传了 ${images.length} 张图片，以下为视觉模型转录的文本描述]\n\n${description}`;
		}
		for (const { part } of targets) {
			if (part !== lastTarget?.part) {
				part.text = "（图片描述见最新消息中的综合转录）";
			}
		}
		return payload;
	});
}
