/**
 * OpenAI-compatible embedding client for docs-search.
 *
 * Configure via environment variables:
 *   DOCS_EMBED_BASE_URL  e.g. http://localhost:8000/v1  (OpenAI-compatible)
 *   DOCS_EMBED_MODEL     e.g. qwen3-embedding:4b
 *   DOCS_EMBED_API_KEY   optional bearer token
 *
 * Ollama also exposes an OpenAI-compatible /v1/embeddings endpoint, so the
 * same client works with either backend. When DOCS_EMBED_BASE_URL is unset
 * the embedder reports `available: false` and docs-search degrades to
 * BM25-only keyword retrieval.
 */

const BATCH_SIZE = 16;
const TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

export interface Embedder {
	available: boolean;
	embed(texts: string[]): Promise<number[][]>;
}

function configuredEndpoint(): string | null {
	const base = process.env.DOCS_EMBED_BASE_URL?.trim();
	if (!base) return null;
	return base.replace(/\/+$/, "");
}

export function createEmbedder(): Embedder {
	const endpoint = configuredEndpoint();
	if (!endpoint) {
		return {
			available: false,
			async embed() {
				throw new Error(
					"DOCS_EMBED_BASE_URL is not configured; embedding unavailable",
				);
			},
		};
	}

	const model = process.env.DOCS_EMBED_MODEL?.trim() || "qwen3-embedding:4b";
	const apiKey = process.env.DOCS_EMBED_API_KEY?.trim();

	async function embedOneBatch(texts: string[]): Promise<number[][]> {
		const url = `${endpoint}/embeddings`;
		let lastError: Error | null = null;
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				const response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
					},
					body: JSON.stringify({ model, input: texts }),
					signal: AbortSignal.timeout(TIMEOUT_MS),
				});
				if (!response.ok) {
					const body = await response.text();
					throw new Error(
						`embedding request failed: HTTP ${response.status} ${response.statusText}: ${body.slice(0, 200)}`,
					);
				}
				const data = (await response.json()) as {
					data?: Array<{ embedding?: number[] }>;
				};
				const embeddings = (data.data ?? []).map(
					(item) => item.embedding ?? [],
				);
				if (embeddings.length !== texts.length) {
					throw new Error(
						`embedding response count mismatch: got ${embeddings.length}, expected ${texts.length}`,
					);
				}
				return embeddings;
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (attempt < MAX_RETRIES) {
					await new Promise((resolve) =>
						setTimeout(resolve, 500 * (attempt + 1)),
					);
				}
			}
		}
		throw lastError ?? new Error("embedding request failed");
	}

	return {
		available: true,
		async embed(texts: string[]): Promise<number[][]> {
			const results: number[][] = [];
			for (let i = 0; i < texts.length; i += BATCH_SIZE) {
				const batch = texts.slice(i, i + BATCH_SIZE);
				const embeddings = await embedOneBatch(batch);
				results.push(...embeddings);
			}
			return results;
		},
	};
}
