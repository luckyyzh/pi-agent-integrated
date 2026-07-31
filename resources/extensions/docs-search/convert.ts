/**
 * docx → Markdown conversion for docs-search.
 *
 * Converts .docx files under <docs>/raw/ into cleaned .md files under
 * <docs>/md/. Inline images and Word anchor noise are stripped so they never
 * pollute the search index. File hashes make the conversion idempotent: a
 * source docx that has not changed is skipped on subsequent runs.
 */

import {
	readFileSync,
	readdirSync,
	writeFileSync,
	existsSync,
	mkdirSync,
	statSync,
} from "node:fs";
import { join, basename, extname } from "node:path";
import mammoth from "mammoth";
import { fileHash } from "./search.js";

// The published Mammoth type declaration omits convertToMarkdown even though
// it exists at runtime; call it through a narrowed local type.
type MammothWithMarkdown = typeof mammoth & {
	convertToMarkdown(
		input: { buffer: Buffer },
		options?: Record<string, unknown>,
	): Promise<{ value: string }>;
};
const mammothApi = mammoth as MammothWithMarkdown;

export interface ConvertResult {
	converted: string[];
	skipped: number;
	failed: string[];
}

function rawDir(docsDir: string): string {
	return join(docsDir, "raw");
}

function mdDir(docsDir: string): string {
	return join(docsDir, "md");
}

/** Strip Word noise: TOC anchors, double-underscore emphasis, image blobs. */
export function cleanMarkdown(text: string): string {
	let cleaned = text;
	cleaned = cleaned.replace(/<a id="[^"]*"><\/a>/g, "");
	cleaned = cleaned.replace(/!\[[^\]]*\]\(data:image[^)]*\)/g, "");
	cleaned = cleaned.replace(/!\[[^\]]*\]\(\)/g, "");
	cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
	cleaned = cleaned.replace(/[ \t]+\n/g, "\n");
	cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
	return cleaned.trim();
}

async function convertOne(sourcePath: string): Promise<string> {
	const buffer = readFileSync(sourcePath);
	const result = await mammothApi.convertToMarkdown({
		buffer,
		convertImage: () => ({ src: "" }),
	} as never);
	return cleanMarkdown(result.value);
}

/**
 * Convert every .docx in <docs>/raw/ to <docs>/md/<stem>.md.
 * Existing .md files whose source hash matches the embedded marker comment
 * are skipped. Returns what was converted / skipped / failed.
 */
export async function convertDocxFiles(
	docsDir: string,
): Promise<ConvertResult> {
	const raw = rawDir(docsDir);
	const out = mdDir(docsDir);
	const converted: string[] = [];
	const failed: string[] = [];
	let skipped = 0;

	if (!existsSync(raw) || !statSync(raw).isDirectory()) {
		return { converted, skipped, failed };
	}
	mkdirSync(out, { recursive: true });

	const docxFiles = readdirSync(raw)
		.filter((f) => extname(f).toLowerCase() === ".docx")
		.sort();

	for (const file of docxFiles) {
		const sourcePath = join(raw, file);
		const targetPath = join(out, `${basename(file, ".docx")}.md`);
		try {
			const sourceHash = fileHash(readFileSync(sourcePath, "utf8"));
			// Marker comment: <!-- src:<hash> --> tracks which docx produced this md.
			const marker = `<!-- src:${sourceHash} -->`;
			if (
				existsSync(targetPath) &&
				readFileSync(targetPath, "utf8").startsWith(marker)
			) {
				skipped++;
				continue;
			}
			const text = await convertOne(sourcePath);
			writeFileSync(targetPath, `${marker}\n${text}`, "utf8");
			converted.push(targetPath);
		} catch (error) {
			failed.push(
				`${file}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	return { converted, skipped, failed };
}
