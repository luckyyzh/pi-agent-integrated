/**
 * Core retrieval for docs-search: chunking, BM25, cosine similarity,
 * reciprocal-rank fusion, and index persistence.
 *
 * The index is a plain JSON file on disk (data/docs-index/index.json):
 *   { version, builtAt, embedModel, files: [{ path, hash, chunks: [...] }] }
 *
 * Each chunk: { id, text, filePath, titlePath, vector? }
 * Incremental updates compare file sha256 hashes and only reprocess the
 * files that changed.
 */

import { createHash } from "node:crypto";
import {
	readFileSync,
	readdirSync,
	writeFileSync,
	mkdirSync,
	existsSync,
	statSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";

const CHUNK_TARGET_CHARS = 800;
const CHUNK_OVERLAP_CHARS = 100;
const VECTOR_TOP_K = 10;
const BM25_TOP_K = 10;
const MIN_VECTOR_SCORE = 0.3;
// Minimum fraction of query tokens that must appear in a chunk's text for a
// hit to be reported when the vector leg is unavailable. Blocks Chinese-bigram
// false positives where an unrelated query shares a single common bigram.
const MIN_QUERY_COVERAGE = 0.6;
// Minimum absolute count of matched in-corpus query tokens in the best chunk.
// Together with MIN_QUERY_COVERAGE this rejects queries whose only overlap is
// one common bigram (e.g. 量子计算 → 计算), which would otherwise pass the
// coverage ratio because the corpus contains just one query token.
const MIN_KEYWORD_HITS = 2;

export interface DocChunk {
	id: string;
	text: string;
	filePath: string;
	titlePath: string;
	vector?: number[];
}

export interface IndexFile {
	path: string;
	hash: string;
	chunks: DocChunk[];
}

export interface DocIndex {
	version: number;
	builtAt: string;
	embedModel: string;
	files: IndexFile[];
}

export interface SearchHit {
	text: string;
	filePath: string;
	titlePath: string;
	score: number;
	vectorScore?: number;
}

export function defaultIndexPath(): string {
	const dataDir =
		process.env.PI_AGENT_DATA_DIR?.trim() || join(process.cwd(), "data");
	return join(dataDir, "docs-index", "index.json");
}

// ---------------------------------------------------------------------------
// Hashing & chunking
// ---------------------------------------------------------------------------

export function fileHash(content: string): string {
	return createHash("sha256").update(content).digest("hex");
}

function normalizeContent(content: string): string {
	return content.replace(/\r\n/g, "\n").replace(/\u0000/g, "");
}

/** Split a single file's content into chunks using Markdown heading structure. */
export function chunkMarkdown(
	content: string,
	filePath: string,
): Array<{ text: string; titlePath: string }> {
	const normalized = normalizeContent(content);
	const lines = normalized.split("\n");
	const chunks: Array<{ text: string; titlePath: string }> = [];
	const headings: string[] = [];
	let current: string[] = [];
	let currentTitle = filePath;

	function flush() {
		const text = current.join("\n").trim();
		if (text) chunks.push({ text, titlePath: currentTitle });
		current = [];
	}

	const headingRegex = /^(#{1,4})\s+(.+)$/;
	for (const line of lines) {
		const match = headingRegex.exec(line);
		if (match) {
			flush();
			const level = match[1].length;
			const title = match[2].trim();
			headings.length = level - 1;
			headings.push(title);
			currentTitle = headings.join(" / ");
			current.push(line);
		} else {
			current.push(line);
			if (current.join("\n").length >= CHUNK_TARGET_CHARS) {
				// Split oversized section at paragraph boundary, keeping overlap.
				const text = current.join("\n");
				const paragraphs = text.split(/\n\s*\n/);
				const groups: string[] = [];
				let group = "";
				for (const para of paragraphs) {
					if ((group + "\n\n" + para).length > CHUNK_TARGET_CHARS && group) {
						groups.push(group);
						group = para;
					} else {
						group = group ? group + "\n\n" + para : para;
					}
				}
				if (group) groups.push(group);
				if (groups.length > 1) {
					current = [groups[groups.length - 1]];
					for (const group of groups.slice(0, -1)) {
						chunks.push({ text: group, titlePath: currentTitle });
					}
					continue;
				}
				current = [text.slice(-CHUNK_OVERLAP_CHARS)];
			}
		}
	}
	flush();
	return chunks;
}

// ---------------------------------------------------------------------------
// Tokenization (Chinese-aware bigrams + English words)
// ---------------------------------------------------------------------------

export function tokenize(text: string): string[] {
	const tokens: string[] = [];
	const ascii = text.match(/[a-zA-Z0-9_]+/g) ?? [];
	tokens.push(...ascii.map((t) => t.toLowerCase()));
	const cjk = text.replace(/[^\u4e00-\u9fff]/g, "");
	for (let i = 0; i < cjk.length - 1; i++) {
		tokens.push(cjk.slice(i, i + 2));
	}
	if (cjk.length === 1) tokens.push(cjk);
	return tokens;
}

// ---------------------------------------------------------------------------
// BM25
// ---------------------------------------------------------------------------

interface Bm25Model {
	docFreq: Map<string, number>;
	totalDocs: number;
	avgLen: number;
}

export function buildBm25(chunks: Array<{ text: string }>): Bm25Model {
	const docFreq = new Map<string, number>();
	const lengths: number[] = [];
	for (const chunk of chunks) {
		const terms = new Set(tokenize(chunk.text));
		for (const term of terms) {
			docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
		}
		lengths.push(tokenize(chunk.text).length);
	}
	const totalDocs = chunks.length;
	const avgLen = lengths.length
		? lengths.reduce((a, b) => a + b, 0) / lengths.length
		: 1;
	return { docFreq, totalDocs, avgLen };
}

function bm25Score(
	queryTokens: string[],
	text: string,
	model: Bm25Model,
): number {
	const k1 = 1.5;
	const b = 0.75;
	const docTokens = tokenize(text);
	const docLen = docTokens.length;
	let score = 0;
	for (const term of queryTokens) {
		const tf = docTokens.filter((t) => t === term).length;
		if (tf === 0) continue;
		const df = model.docFreq.get(term) ?? 0;
		const idf = Math.log(1 + (model.totalDocs - df + 0.5) / (df + 0.5));
		score +=
			idf *
			((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * docLen) / model.avgLen)));
	}
	return score;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

export function cosine(a: number[], b: number[]): number {
	if (!a.length || a.length !== b.length) return 0;
	let dot = 0;
	let na = 0;
	let nb = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		na += a[i] * a[i];
		nb += b[i] * b[i];
	}
	const denom = Math.sqrt(na) * Math.sqrt(nb);
	return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Index building & persistence
// ---------------------------------------------------------------------------

export function loadIndex(indexPath: string = defaultIndexPath()): DocIndex {
	if (!existsSync(indexPath)) {
		return { version: 1, builtAt: "", embedModel: "", files: [] };
	}
	try {
		return JSON.parse(readFileSync(indexPath, "utf8")) as DocIndex;
	} catch {
		return { version: 1, builtAt: "", embedModel: "", files: [] };
	}
}

export function saveIndex(
	index: DocIndex,
	indexPath: string = defaultIndexPath(),
): void {
	mkdirSync(dirname(indexPath), { recursive: true });
	writeFileSync(indexPath, JSON.stringify(index), "utf8");
}

function listDocFiles(docsDir: string): string[] {
	const results: string[] = [];
	const stack = [docsDir];
	while (stack.length) {
		const dir = stack.pop()!;
		let entries;
		try {
			entries = readdirSync(dir);
		} catch {
			continue;
		}
		for (const entry of entries) {
			const full = join(dir, entry);
			let stat;
			try {
				stat = statSync(full);
			} catch {
				continue;
			}
			if (stat.isDirectory()) {
				stack.push(full);
			} else if (/\.(md|markdown|txt)$/i.test(entry)) {
				results.push(full);
			}
		}
	}
	return results.sort();
}

export interface BuildResult {
	filesIndexed: number;
	chunksTotal: number;
	updated: string[];
	skipped: number;
	embedModel: string;
	index: DocIndex;
}

/**
 * Build or incrementally update the index for docsDir.
 * When `updateOnly` is true, files whose sha256 matches the existing index
 * are skipped; deleted files are dropped.
 */
export async function buildIndex(
	docsDir: string,
	embedder: { available: boolean; embed(texts: string[]): Promise<number[][]> },
	index: DocIndex,
	updateOnly: boolean,
): Promise<BuildResult> {
	const files = listDocFiles(docsDir);
	const existing = new Map(index.files.map((f) => [f.path, f]));
	const newFiles: IndexFile[] = [];
	const updated: string[] = [];
	let skipped = 0;

	for (const fullPath of files) {
		const relPath = relative(docsDir, fullPath).replace(/\\/g, "/");
		let content: string;
		try {
			content = readFileSync(fullPath, "utf8");
		} catch {
			continue;
		}
		const hash = fileHash(content);
		const prior = existing.get(relPath);
		if (updateOnly && prior && prior.hash === hash) {
			newFiles.push(prior);
			skipped++;
			continue;
		}
		const rawChunks = chunkMarkdown(content, relPath);
		const chunks: DocChunk[] = [];
		for (const { text, titlePath } of rawChunks) {
			chunks.push({
				id: `${relPath}#${hash.slice(0, 8)}#${chunks.length}`,
				text,
				filePath: relPath,
				titlePath,
			});
		}
		newFiles.push({ path: relPath, hash, chunks });
		updated.push(relPath);
	}

	// Drop files no longer on disk.
	for (const path of existing.keys()) {
		if (!files.some((f) => relative(docsDir, f).replace(/\\/g, "/") === path)) {
			updated.push(`${path} (removed)`);
		}
	}

	// Embedding pass: only embed chunks that lack a vector.
	if (embedder.available) {
		const missing: Array<{ chunk: DocChunk; index: number }> = [];
		for (const file of newFiles) {
			file.chunks.forEach((chunk, i) => {
				if (!chunk.vector || chunk.vector.length === 0)
					missing.push({ chunk, index: i });
			});
		}
		const texts = missing.map((m) => m.chunk.text);
		for (let i = 0; i < texts.length; i += 16) {
			const batch = texts.slice(i, i + 16);
			const vectors = await embedder.embed(batch);
			for (let j = 0; j < vectors.length; j++) {
				missing[i + j].chunk.vector = vectors[j];
			}
		}
	}

	const result: DocIndex = {
		version: 1,
		builtAt: new Date().toISOString(),
		embedModel: embedder.available
			? process.env.DOCS_EMBED_MODEL?.trim() || "openai-compatible"
			: "none",
		files: newFiles,
	};
	return {
		filesIndexed: newFiles.length,
		chunksTotal: newFiles.reduce((sum, f) => sum + f.chunks.length, 0),
		updated,
		skipped,
		embedModel: result.embedModel,
		index: result,
	};
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function search(
	index: DocIndex,
	query: string,
	topK: number,
	useVectors: boolean,
): SearchHit[] {
	const queryTokens = tokenize(query);
	const allChunks = index.files.flatMap((f) => f.chunks);
	if (allChunks.length === 0) return [];

	const bm25 = buildBm25(allChunks);

	// BM25 retrieval
	const bm25Scores = allChunks.map((chunk) =>
		bm25Score(queryTokens, chunk.text, bm25),
	);
	const bm25Ranked = allChunks
		.map((chunk, i) => ({ chunk, score: bm25Scores[i] }))
		.filter((h) => h.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, BM25_TOP_K);

	const fused = bm25Ranked.map((hit, rank) => ({
		...hit,
		fusion: 1 / (60 + rank),
	}));

	// RRF: add vector ranks if available
	if (useVectors && fused.length) {
		// vector hits are merged by searchHybrid; this sync path is BM25-only
	}

	return fused
		.sort((a, b) => b.fusion - a.fusion)
		.slice(0, topK)
		.map((hit) => ({
			text: hit.chunk.text,
			filePath: hit.chunk.filePath,
			titlePath: hit.chunk.titlePath,
			score: hit.fusion,
		}));
}

/** Search with an externally-computed query vector (hybrid). */
export async function searchHybrid(
	index: DocIndex,
	query: string,
	topK: number,
	embedder: { available: boolean; embed(texts: string[]): Promise<number[][]> },
): Promise<SearchHit[]> {
	const queryTokens = tokenize(query);
	const allChunks = index.files.flatMap((f) => f.chunks);
	if (allChunks.length === 0) return [];

	const bm25 = buildBm25(allChunks);
	const bm25Ranked = allChunks
		.map((chunk) => ({
			chunk,
			score: bm25Score(queryTokens, chunk.text, bm25),
		}))
		.filter((h) => h.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, BM25_TOP_K);

	const fused = new Map<
		string,
		{ chunk: DocChunk; fusion: number; vectorScore?: number }
	>();
	bm25Ranked.forEach((hit, rank) => {
		fused.set(hit.chunk.id, { chunk: hit.chunk, fusion: 1 / (60 + rank) });
	});

	// Vector leg (optional)
	const vectorizable = allChunks.filter((c) => c.vector && c.vector.length > 0);
	if (embedder.available && vectorizable.length > 0) {
		try {
			const [queryVec] = await embedder.embed([query]);
			const vectorHits = vectorizable
				.map((chunk) => ({ chunk, score: cosine(chunk.vector!, queryVec) }))
				.sort((a, b) => b.score - a.score)
				.slice(0, VECTOR_TOP_K);
			vectorHits.forEach((hit, rank) => {
				const entry = fused.get(hit.chunk.id);
				if (entry) {
					entry.fusion += 1 / (60 + rank);
					entry.vectorScore = hit.score;
				} else {
					fused.set(hit.chunk.id, {
						chunk: hit.chunk,
						fusion: 1 / (60 + rank),
						vectorScore: hit.score,
					});
				}
			});
		} catch {
			// vector leg failed; BM25-only results still returned
		}
	}

	const results = [...fused.values()]
		.sort((a, b) => b.fusion - a.fusion)
		.slice(0, topK);

	// Threshold gate. Two independent signals, either of which can justify a hit:
	//  - vector signal: cosine >= MIN_VECTOR_SCORE (semantic leg)
	//  - keyword coverage: the best chunk must contain a meaningful fraction of
	//    the query's in-corpus tokens (MIN_QUERY_COVERAGE) AND at least
	//    MIN_KEYWORD_HITS of them. The absolute-count condition blocks the
	//    Chinese-bigram false positive where an unrelated query shares one
	//    common bigram (量子计算 → 计算) yet its coverage ratio is 1.0 because
	//    only one query token exists in the corpus at all.
	const inCorpusTokens = queryTokens.filter(
		(t) => (bm25.docFreq.get(t) ?? 0) > 0,
	);
	const bestCoverage = results.reduce((best, r) => {
		const chunkTokens = new Set(tokenize(r.chunk.text));
		const hitTokens = inCorpusTokens.filter((t) => chunkTokens.has(t));
		const coverage =
			inCorpusTokens.length > 0 ? hitTokens.length / inCorpusTokens.length : 0;
		return coverage > best ? coverage : best;
	}, 0);
	const bestHitCount = results.reduce((best, r) => {
		const chunkTokens = new Set(tokenize(r.chunk.text));
		const hitTokens = inCorpusTokens.filter((t) => chunkTokens.has(t));
		return hitTokens.length > best ? hitTokens.length : best;
	}, 0);
	const hasVectorSignal = results.some(
		(r) => (r.vectorScore ?? 0) >= MIN_VECTOR_SCORE,
	);
	const hasKeywordSignal =
		bestCoverage >= MIN_QUERY_COVERAGE && bestHitCount >= MIN_KEYWORD_HITS;
	if (!hasVectorSignal && !hasKeywordSignal) return [];

	return results.map((r) => ({
		text: r.chunk.text,
		filePath: r.chunk.filePath,
		titlePath: r.chunk.titlePath,
		score: r.fusion,
		vectorScore: r.vectorScore,
	}));
}

export function formatResults(hits: SearchHit[]): string {
	if (hits.length === 0) {
		return "No matching documentation found. The answer is not in the indexed docs — say so instead of guessing.";
	}
	return hits
		.map((hit, i) => {
			const lines = [
				`${i + 1}. [${hit.filePath}] ${hit.titlePath !== hit.filePath ? `(${hit.titlePath})` : ""} score=${hit.score.toFixed(3)}`,
			];
			if (hit.vectorScore !== undefined)
				lines.push(`   vector=${hit.vectorScore.toFixed(3)}`);
			lines.push(`   ${hit.text.slice(0, 600).replace(/\n/g, " ")}`);
			return lines.join("\n");
		})
		.join("\n\n");
}
