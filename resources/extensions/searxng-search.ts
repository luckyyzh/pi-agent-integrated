/**
 * Repository-local SearXNG web search extension.
 *
 * Required environment:
 *   SEARXNG_URL=https://search.example.com/search
 *   SEARXNG_TOKEN=<X-Search-Token value>
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const DEFAULT_NUM_RESULTS = 10;
const MAX_NUM_RESULTS = 20;
const MAX_SNIPPET_LENGTH = 2_500;
const MAX_OUTPUT_LENGTH = 20_000;
const REQUEST_TIMEOUT_MS = 30_000;

const searchParams = Type.Object({
	query: Type.String({
		description: "Specific, keyword-focused web search query",
		minLength: 1,
		maxLength: 500,
	}),
	num_results: Type.Optional(
		Type.Integer({
			description: `Maximum results to return (default ${DEFAULT_NUM_RESULTS}, maximum ${MAX_NUM_RESULTS})`,
			minimum: 1,
			maximum: MAX_NUM_RESULTS,
		}),
	),
	engines: Type.Optional(
		Type.Array(Type.String({ minLength: 1, maxLength: 50 }), {
			description: "Search engines to use, for example google, bing, duckduckgo, wikipedia, or github",
			minItems: 1,
			maxItems: 10,
		}),
	),
	language: Type.Optional(
		Type.String({
			description: "Result language, for example zh-CN or en",
			minLength: 2,
			maxLength: 20,
		}),
	),
	page: Type.Optional(
		Type.Integer({
			description: "Result page number (default 1)",
			minimum: 1,
			maximum: 50,
		}),
	),
	time_range: Type.Optional(
		Type.Union(
			[Type.Literal("day"), Type.Literal("week"), Type.Literal("month"), Type.Literal("year")],
			{ description: "Optional recency filter" },
		),
	),
});

interface SearxngResult {
	title?: string;
	url?: string;
	content?: string;
	engine?: string;
	engines?: string[];
	publishedDate?: string;
	score?: number;
}

interface SearxngResponse {
	query?: string;
	results?: SearxngResult[];
	answers?: string[];
	suggestions?: string[];
}

function compactText(value: string, maxLength: number): string {
	const compacted = value.replace(/\s+/g, " ").trim();
	return compacted.length <= maxLength ? compacted : `${compacted.slice(0, maxLength)}…`;
}

function formatResults(data: SearxngResponse, maxResults: number): string {
	const sections: string[] = [];

	if (data.answers && data.answers.length > 0) {
		sections.push(`## Answers\n${data.answers.map((answer) => compactText(answer, MAX_SNIPPET_LENGTH)).join("\n")}`);
	}

	const results = (data.results ?? []).slice(0, maxResults);
	if (results.length > 0) {
		const formatted = results.map((result, index) => {
			const lines = [`${index + 1}. ${compactText(result.title ?? "(no title)", 500)}`];
			if (result.url) lines.push(`   URL: ${result.url}`);
			let engines = result.engines && result.engines.length > 0 ? result.engines : [];
			if (engines.length === 0 && result.engine) engines = [result.engine];
			if (engines.length > 0) lines.push(`   Engines: ${engines.join(", ")}`);
			if (result.publishedDate) lines.push(`   Published: ${result.publishedDate}`);
			if (result.content) lines.push(`   ${compactText(result.content, MAX_SNIPPET_LENGTH)}`);
			return lines.join("\n");
		});
		sections.push(`## Results (${results.length})\n${formatted.join("\n\n")}`);
	}

	if (data.suggestions && data.suggestions.length > 0) {
		sections.push(
			`## Suggestions\n${data.suggestions.map((suggestion) => compactText(suggestion, 500)).join(", ")}`,
		);
	}

	const text = sections.length > 0 ? sections.join("\n\n") : "No results found.";
	return text.length <= MAX_OUTPUT_LENGTH ? text : `${text.slice(0, MAX_OUTPUT_LENGTH)}\n\n[Truncated]`;
}

function configuredEndpoint(): string {
	const endpoint = process.env.SEARXNG_URL?.trim();
	if (!endpoint) {
		throw new Error(
			"SEARXNG_URL is not available to the Pi process. Set it in .env or the environment and restart Pi Agent Integrated.",
		);
	}
	return endpoint;
}

export default function searxngSearchExtension(pi: ExtensionAPI) {
	pi.registerTool({
		name: "web_search",
		label: "Web Search",
		description:
			"Search the current web through the application's configured SearXNG service. Returns result titles, URLs, engines, dates, and snippets. Use it for recent or time-sensitive information, current software documentation and versions, unfamiliar errors, explicit lookup requests, and verifiable facts you are uncertain about. By default verify anything that may have changed within the last year.",
		promptSnippet: "Search the current web through the configured SearXNG service",
		promptGuidelines: [
			"Use web_search when the user asks to search or verify online, or when information may have changed recently.",
			"Search by default for ANY question that involves software/library versions, APIs, error messages, tutorials, news, events, prices, or facts that may have changed within the last ~year — verify these with a live search rather than answering from training-data memory.",
			"Search when the user cites a source, reference, claim, or asks you to check something online or if something is true/current.",
			"When genuinely uncertain whether information is current or correct, search instead of guessing.",
			"You MAY skip searching only when fully confident the answer cannot have changed (pure math, static language syntax, facts local to this codebase) or the user clearly wants a purely local/codebase answer.",
			"Prefer focused queries. If results are weak, refine the query or select suitable engines and try again.",
			"Do not search for information already available in the opened codebase, conversation, or provided files.",
			"When presenting search findings, retain the result URLs so the user can inspect the sources.",
		],
		parameters: searchParams,
		executionMode: "parallel",
		async execute(_toolCallId, params, signal) {
			const token = process.env.SEARXNG_TOKEN?.trim();
			if (!token) {
				throw new Error(
					"SEARXNG_TOKEN is not available to the Pi process. Set it in the environment and restart Pi Agent Integrated.",
				);
			}

			const query = params.query.trim();
			if (!query) throw new Error("Search query must not be empty");

			const maxResults = params.num_results ?? DEFAULT_NUM_RESULTS;
			const endpoint = configuredEndpoint();
			const url = new URL(endpoint);
			url.searchParams.set("q", query);
			url.searchParams.set("format", "json");

			const engines = params.engines?.map((engine) => engine.trim()).filter(Boolean);
			if (engines && engines.length > 0) url.searchParams.set("engines", engines.join(","));
			if (params.language) url.searchParams.set("language", params.language);
			if (params.page) url.searchParams.set("pageno", String(params.page));
			if (params.time_range) url.searchParams.set("time_range", params.time_range);

			const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
			const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Accept: "application/json",
					"X-Search-Token": token,
				},
				signal: requestSignal,
			});

			if (!response.ok) {
				throw new Error(`SearXNG request failed: HTTP ${response.status} ${response.statusText}`);
			}

			const body = await response.text();
			let data: SearxngResponse;
			try {
				data = JSON.parse(body) as SearxngResponse;
			} catch {
				throw new Error("SearXNG returned a non-JSON response");
			}

			const resultCount = Math.min(data.results?.length ?? 0, maxResults);
			return {
				content: [{ type: "text", text: formatResults(data, maxResults) }],
				details: {
					query,
					endpoint,
					resultCount,
				},
			};
		},
	});
}
