import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Type } from "typebox";

const WEB_BASE_URL =
	process.env.PI_AGENT_WEB_URL?.trim() || "http://127.0.0.1:30141";
const REQUEST_FILE_NAME = "restart-request.json";
const REQUEST_VERSION = 1;
const IDLE_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 150;

type RestartRequest = {
	version: number;
	requestId: string;
	sessionId: string;
	cwd: string;
	testInstructions: string;
	state: "requested" | "ready";
	createdAt: string;
	readyAt?: string;
};

type AgentStateResponse = {
	running?: boolean;
	state?: {
		isStreaming?: boolean;
		isPromptRunning?: boolean;
		isCompacting?: boolean;
		isBashRunning?: boolean;
	};
};

function projectRoot(): string {
	return process.env.PI_AGENT_APP_ROOT?.trim() || process.cwd();
}

function restartRequestPath(): string {
	return join(projectRoot(), "data", "agent", REQUEST_FILE_NAME);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
	await mkdir(join(projectRoot(), "data", "agent"), { recursive: true });
	const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
	await writeFile(temporaryPath, JSON.stringify(value, null, 2), "utf8");
	try {
		await rename(temporaryPath, filePath);
	} catch (error) {
		await unlink(filePath).catch(() => undefined);
		await rename(temporaryPath, filePath).catch(() => {
			throw error;
		});
	}
}

async function readRestartRequest(): Promise<RestartRequest | null> {
	try {
		const parsed = JSON.parse(
			await readFile(restartRequestPath(), "utf8"),
		) as Partial<RestartRequest>;
		if (
			parsed.version !== REQUEST_VERSION ||
			typeof parsed.requestId !== "string" ||
			typeof parsed.sessionId !== "string" ||
			typeof parsed.cwd !== "string" ||
			typeof parsed.testInstructions !== "string" ||
			(parsed.state !== "requested" && parsed.state !== "ready")
		) {
			return null;
		}
		return parsed as RestartRequest;
	} catch {
		return null;
	}
}

async function markRestartReady(sessionId: string): Promise<void> {
	const request = await readRestartRequest();
	if (!request || request.sessionId !== sessionId || request.state !== "requested") {
		return;
	}
	await writeJsonAtomically(restartRequestPath(), {
		...request,
		state: "ready",
		readyAt: new Date().toISOString(),
	});
}

function sessionIdFromContext(ctx: {
	sessionManager: { getSessionId(): string };
}): string {
	const sessionId = ctx.sessionManager.getSessionId();
	if (!sessionId) throw new Error("The current Pi session has no session ID.");
	return sessionId;
}

function requireRpcMode(ctx: { mode: string }): void {
	if (ctx.mode !== "rpc") {
		throw new Error(
			"Runtime control is available in Pi Web only; use the local /reload command in TUI mode.",
		);
	}
}

async function postAgentCommand(
	sessionId: string,
	command: Record<string, unknown>,
): Promise<unknown> {
	const response = await fetch(
		`${WEB_BASE_URL}/api/agent/${encodeURIComponent(sessionId)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(command),
		},
	);
	if (!response.ok) {
		const detail = (await response.text().catch(() => "")).slice(0, 300);
		throw new Error(
			`Pi Web command failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
		);
	}
	return response.json().catch(() => undefined);
}

async function waitForAgentIdle(sessionId: string): Promise<void> {
	const deadline = Date.now() + IDLE_TIMEOUT_MS;
	while (Date.now() < deadline) {
		const response = await fetch(
			`${WEB_BASE_URL}/api/agent/${encodeURIComponent(sessionId)}`,
		);
		if (!response.ok) throw new Error(`Pi Web state failed with HTTP ${response.status}`);
		const data = (await response.json()) as AgentStateResponse;
		const state = data.state;
		if (
			!data.running ||
			!state ||
			(!state.isStreaming &&
				!state.isPromptRunning &&
				!state.isCompacting &&
				!state.isBashRunning)
		) {
			return;
		}
		await sleep(POLL_INTERVAL_MS);
	}
	throw new Error("Timed out waiting for the current Agent turn to finish.");
}

function scheduleRuntimeReload(
	sessionId: string,
	testInstructions: string,
): void {
	void (async () => {
		try {
			await waitForAgentIdle(sessionId);
			await postAgentCommand(sessionId, { type: "reload" });
			if (testInstructions) {
				await postAgentCommand(sessionId, {
					type: "prompt",
					message:
						"[Pi 运行时已重新加载]\n\n" +
						"请继续验证刚才的修改，不要重复编辑。测试要求：\n" +
						testInstructions,
				});
			}
		} catch (error) {
			const cause = error instanceof Error ? error.message : String(error);
			try {
				await postAgentCommand(sessionId, {
					type: "prompt",
					message:
						"[Pi 运行时重载失败]\n\n" +
						`请先检查运行时状态。失败原因：${cause}`,
				});
			} catch {
				// The Web process may be unavailable; the failure is still visible in
				// the extension/runtime logs when the session can be recovered.
			}
		}
	})();
}

export default function runtimeControlExtension(pi: ExtensionAPI): void {
	pi.registerCommand("reload-runtime", {
		description: "重新加载 Pi 扩展、skills、prompts 和配置",
		handler: async (_args, ctx) => {
			await ctx.reload();
		},
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		await markRestartReady(ctx.sessionManager.getSessionId());
	});

	pi.registerTool({
		name: "reload_runtime",
		label: "Reload Pi runtime",
		description:
			"重新加载 Pi 的扩展、skills、prompts 和运行时配置，不重启 Web 服务。" +
			"修改 resources/extensions、skills、prompts 或视觉配置后使用。" +
			"可选地在重载完成后自动继续执行测试。",
		promptSnippet: "Reload Pi runtime after extension or resource changes",
		promptGuidelines: [
			"修改 Pi 扩展、skills、prompts 或视觉配置后，优先使用 reload_runtime。",
			"reload_runtime 不会重启 Web 服务；如果需要测试，可填写 testInstructions。",
			"不要为了扩展修改直接执行 npm run restart 或 pi-agent-public.ps1。",
		],
		parameters: Type.Object({
			testInstructions: Type.Optional(
				Type.String({
					description: "重载完成后需要继续执行的测试说明",
					maxLength: 4000,
				}),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			requireRpcMode(ctx);
			const sessionId = sessionIdFromContext(ctx);
			const testInstructions =
				typeof params.testInstructions === "string"
					? params.testInstructions.trim()
					: "";
			scheduleRuntimeReload(sessionId, testInstructions);
			return {
				content: [
					{
						type: "text",
						text: testInstructions
							? "已安排运行时重载。重载完成后会自动继续执行测试。"
							: "已安排运行时重载。",
					},
				],
				details: { mode: "reload", sessionId },
				terminate: true,
			};
		},
	});

	pi.registerTool({
		name: "restart_web_and_test",
		label: "Restart Pi Web and test",
		description:
			"通过外部 supervisor 重启 Pi Web，并在服务恢复后自动恢复当前会话、继续执行测试。" +
			"这是终止当前 Agent 回合的操作；只用于 Web 服务、依赖、环境变量或 Pi 核心代码必须重启的情况。",
		promptSnippet: "Schedule a supervised Pi Web restart and resume testing",
		promptGuidelines: [
			"只有修改 Web 服务、Node 依赖、环境变量或 Pi 核心代码时才使用 restart_web_and_test。",
			"restart_web_and_test 会短暂断开 Web，但会保存并恢复当前会话。",
			"不要直接通过 bash 执行 npm run restart 或 pi-agent-public.ps1。",
			"必须在 testInstructions 中说明 Web 恢复后需要执行的验证步骤。",
		],
		parameters: Type.Object({
			testInstructions: Type.String({
				description: "Pi Web 重启完成后，Agent 应继续执行的测试说明",
				minLength: 1,
				maxLength: 4000,
			}),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			requireRpcMode(ctx);
			const sessionId = sessionIdFromContext(ctx);
			const testInstructions = params.testInstructions.trim();
			const existing = await readRestartRequest();
			if (existing && (existing.state === "requested" || existing.state === "ready")) {
				throw new Error(
					`A Web restart is already pending (${existing.requestId}). Wait for it to finish.`,
				);
			}

			const request: RestartRequest = {
				version: REQUEST_VERSION,
				requestId: randomUUID(),
				sessionId,
				cwd: ctx.cwd,
				testInstructions,
				state: "requested",
				createdAt: new Date().toISOString(),
			};
			await writeJsonAtomically(restartRequestPath(), request);
			ctx.shutdown();
			return {
				content: [
					{
						type: "text",
						text:
							"已请求外部 supervisor 重启 Pi Web。当前回合将结束，服务恢复后会自动继续测试。",
					},
				],
				details: {
					mode: "restart",
					requestId: request.requestId,
				},
				terminate: true,
			};
		},
	});
}
