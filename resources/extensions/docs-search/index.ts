/**
 * docs-search: hybrid (BM25 + vector) retrieval over project documentation.
 *
 * Tools:
 *   docs_search   — LLM-callable: search the docs and return snippets + sources
 * Commands:
 *   /docs-index   — build (default), incrementally update (--update), or show
 *                   status (--status) of the docs index
 *
 * Configuration (environment):
 *   DOCS_DIR             docs directory (default: <app root>/docs)
 *   DOCS_EMBED_BASE_URL  OpenAI-compatible embeddings base URL, e.g. http://host:8000/v1
 *   DOCS_EMBED_MODEL     embedding model name (default: qwen3-embedding:4b)
 *   DOCS_EMBED_API_KEY   optional bearer token
 *   DOCS_TOP_K           default result count (default: 3)
 *
 * Without DOCS_EMBED_BASE_URL the search degrades to BM25 keyword retrieval,
 * so the tool still works until an embedding endpoint is configured.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { join } from "node:path";
import { existsSync, statSync } from "node:fs";
import { createEmbedder, type Embedder } from "./embed.js";
import { convertDocxFiles } from "./convert.js";
import {
	buildIndex,
	loadIndex,
	saveIndex,
	searchHybrid,
	formatResults,
	type DocIndex,
	type SearchHit,
} from "./search.js";

let embedder: Embedder | null = null;
let index: DocIndex | null = null;

function resolveDocsDir(): string {
	const configured = process.env.DOCS_DIR?.trim();
	if (configured) return configured;
	const appRoot = process.env.PI_AGENT_APP_ROOT?.trim();
	return appRoot ? join(appRoot, "docs") : join(process.cwd(), "docs");
}

function defaultTopK(): number {
	const raw = Number.parseInt(process.env.DOCS_TOP_K ?? "", 10);
	return Number.isFinite(raw) && raw >= 1 && raw <= 8 ? raw : 3;
}

async function getEmbedder(): Promise<Embedder> {
	embedder ??= createEmbedder();
	return embedder;
}

async function ensureIndex(): Promise<DocIndex> {
	index ??= loadIndex();
	return index;
}

function formatIndexStatus(
	docsDir: string,
	idx: DocIndex,
	embedAvailable: boolean,
): string {
	const chunkCount = idx.files.reduce(
		(sum, file) => sum + file.chunks.length,
		0,
	);
	const vectorCount = idx.files.reduce(
		(sum, file) =>
			sum + file.chunks.filter((c) => c.vector && c.vector.length > 0).length,
		0,
	);
	const lines = [
		`Docs index: ${chunkCount} chunks in ${idx.files.length} files`,
		`  dir:       ${docsDir}`,
		`  built:     ${idx.builtAt || "(empty)"}`,
		`  embed:     ${embedAvailable ? idx.embedModel || "openai-compatible" : "BM25 only (set DOCS_EMBED_BASE_URL for semantic search)"}`,
		`  vectors:   ${vectorCount}/${chunkCount} chunks embedded`,
	];
	return lines.join("\n");
}

export default function docsSearchExtension(pi: ExtensionAPI) {
	// --- /docs-index command ---
	pi.registerCommand("docs-index", {
		description:
			"Build, incrementally update, or inspect the project docs search index. " +
			"Usage: /docs-index [--update|--status]",
		handler: async (args, ctx) => {
			const docsDir = resolveDocsDir();
			const updateOnly = args.includes("--update");
			const statusOnly = args.includes("--status");

			if (!existsSync(docsDir) || !statSync(docsDir).isDirectory()) {
				ctx.ui.notify(`Docs directory not found: ${docsDir}`, "error");
				return;
			}

			if (statusOnly) {
				const idx = await ensureIndex();
				ctx.ui.notify(
					formatIndexStatus(docsDir, idx, (await getEmbedder()).available),
					"info",
				);
				return;
			}

			ctx.ui.setStatus(
				"docs",
				`Indexing ${docsDir} (${updateOnly ? "incremental" : "full"})...`,
			);
			try {
				const emb = await getEmbedder();
				// Convert any new/changed .docx files under docs/raw/ to Markdown
				// under docs/md/ before indexing (idempotent via content hash).
				const conversion = await convertDocxFiles(docsDir);
				if (conversion.converted.length > 0) {
					ctx.ui.notify(
						`Converted ${conversion.converted.length} docx → md (skipped ${conversion.skipped})`,
						"info",
					);
				}
				if (conversion.failed.length > 0) {
					ctx.ui.notify(
						`Docx conversion failures: ${conversion.failed.join("; ")}`,
						"warning",
					);
				}
				const current = await ensureIndex();
				const result = await buildIndex(docsDir, emb, current, updateOnly);
				saveIndex(result.index);
				// keep in-memory index in sync with what was just saved
				index = result.index;
				ctx.ui.notify(
					`Indexed ${result.filesIndexed} files, ${result.chunksTotal} chunks ` +
						`(updated ${result.updated.length}, skipped ${result.skipped})`,
					"info",
				);
			} catch (error) {
				ctx.ui.notify(
					`Indexing failed: ${error instanceof Error ? error.message : String(error)}`,
					"error",
				);
			} finally {
				ctx.ui.setStatus("docs", "");
			}
		},
	});

	// --- docs_search tool ---
	pi.registerTool({
		name: "docs_search",
		label: "Project Docs Search",
		description:
			"Hybrid (semantic + keyword) search over the project documentation directory. " +
			"Returns top matching snippets with file paths, section titles, and scores. " +
			"Use it when the user asks about the project's architecture, configuration, " +
			"API usage, deployment, or anything likely documented in the docs/ directory. " +
			"Exact identifiers (config keys, function names, annotations) are matched by " +
			"keyword search; conceptual questions by semantic search. The tool returns " +
			"'No matching documentation found' when nothing relevant exists — do not " +
			"answer from general knowledge in that case.",
		promptSnippet: "Search the project documentation",
		promptGuidelines: [
			"Use docs_search when the question concerns project-specific documentation, setup, configuration, architecture, or deployment.",
			"Use docs_search when the question asks about exact identifiers (config keys, API names, annotations) that may appear in the docs.",
			"Do not invent documentation content — if docs_search finds nothing, state that the information is not in the docs.",
			"When presenting findings, retain the file paths so the user can verify the sources.",
		],
		parameters: Type.Object({
			query: Type.String({
				description:
					"Search query, e.g. 'Nacos cluster high availability' or '@EnableDiscoveryClient usage'",
				minLength: 1,
				maxLength: 500,
			}),
			top_k: Type.Optional(
				Type.Integer({
					description: "Number of results to return (default 3, max 8)",
					minimum: 1,
					maximum: 8,
				}),
			),
		}),
		executionMode: "parallel",
		async execute(_toolCallId, params) {
			const docsDir = resolveDocsDir();
			const baseDetails = {
				docsDir,
				query: params.query,
				resultCount: 0,
				embeddingAvailable: false,
			};
			if (!existsSync(docsDir) || !statSync(docsDir).isDirectory()) {
				return {
					content: [
						{
							type: "text",
							text: `Docs directory not found: ${docsDir}. Point DOCS_DIR at the documentation folder and run /docs-index.`,
						},
					],
					details: { ...baseDetails, error: "docs directory missing" },
				};
			}

			const idx = await ensureIndex();
			if (idx.files.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `The docs index is empty. Run /docs-index to index ${docsDir} first.`,
						},
					],
					details: { ...baseDetails, error: "empty index" },
				};
			}

			const emb = await getEmbedder();
			const topK = params.top_k ?? defaultTopK();
			const query = params.query.trim();
			if (!query) {
				return {
					content: [{ type: "text", text: "Query must not be empty." }],
					details: baseDetails,
				};
			}

			const hits: SearchHit[] = await searchHybrid(idx, query, topK, emb);
			return {
				content: [{ type: "text", text: formatResults(hits) }],
				details: {
					...baseDetails,
					query,
					resultCount: hits.length,
					embeddingAvailable: emb.available,
				},
			};
		},
	});
}
