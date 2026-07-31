import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { agentDir as defaultAgentDir } from "./profile.mjs";

const supportedVersion = "0.4.0";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;

  const first = source.indexOf(before);
  const last = source.lastIndexOf(before);
  if (first < 0 || first !== last) {
    throw new Error(`Cannot apply pi-memory lightweight patch: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function patchPiMemorySource(input) {
  let source = input.replaceAll("\r\n", "\n");

  source = replaceOnce(
    source,
    `\t\tqmdAvailable = await detectQmd();
\t\tif (!qmdAvailable) {
\t\t\tif (ctx.hasUI) {
\t\t\t\tctx.ui.notify(qmdInstallInstructions(), "info");
\t\t\t}
\t\t\trefreshMemorySnapshot("session_start");
\t\t\treturn;
\t\t}`,
    `\t\tconst searchEnabled = process.env.PI_MEMORY_NO_SEARCH !== "1";
\t\tqmdAvailable = searchEnabled ? await detectQmd() : false;
\t\tif (!qmdAvailable) {
\t\t\tif (ctx.hasUI && searchEnabled) {
\t\t\t\tctx.ui.notify(qmdInstallInstructions(), "info");
\t\t\t}
\t\t\trefreshMemorySnapshot("session_start");
\t\t\treturn;
\t\t}`,
    "session-start qmd probe",
  );

  source = replaceOnce(
    source,
    `\t\t\tsnapshotCaveat =
\t\t\t\t\`Snapshot \${snapshotReason} at \${snapshotTakenAt}. \` +
\t\t\t\t"Use memory_read / memory_search for the authoritative latest state; " +
\t\t\t\t"recent writes may also be visible in tool-call history.";`,
    `\t\t\tsnapshotCaveat =
\t\t\t\t\`Snapshot \${snapshotReason} at \${snapshotTakenAt}. \` +
\t\t\t\t(process.env.PI_MEMORY_NO_SEARCH === "1"
\t\t\t\t\t? "Use memory_read for the authoritative latest state; "
\t\t\t\t\t: "Use memory_read / memory_search for the authoritative latest state; ") +
\t\t\t\t"recent writes may also be visible in tool-call history.";`,
    "snapshot search guidance",
  );

  source = replaceOnce(
    source,
    `\t\t\t"- Things to fix later or keep in mind \\u2192 scratchpad tool",
\t\t\t"- Use memory_search to find past context across all memory files (keyword, semantic, or deep search).",
\t\t\t"- Use #tags (e.g. #decision, #preference) and [[links]] (e.g. [[auth-strategy]]) in memory content to improve future search recall.",
\t\t\t'- If someone says "remember this," write it immediately.',`,
    `\t\t\t"- Things to fix later or keep in mind \\u2192 scratchpad tool",
\t\t\t...(process.env.PI_MEMORY_NO_SEARCH === "1"
\t\t\t\t? []
\t\t\t\t: [
\t\t\t\t\t\t"- Use memory_search to find past context across all memory files (keyword, semantic, or deep search).",
\t\t\t\t\t\t"- Use #tags (e.g. #decision, #preference) and [[links]] (e.g. [[auth-strategy]]) in memory content to improve future search recall.",
\t\t\t\t\t]),
\t\t\t'- If someone says "remember this," write it immediately.',`,
    "memory prompt search guidance",
  );

  source = replaceOnce(
    source,
    `\t// --- memory_search tool ---
\tpi.registerTool({`,
    `\t// --- memory_search tool (optional in lightweight mode) ---
\tif (process.env.PI_MEMORY_NO_SEARCH !== "1") {
\t\tpi.registerTool({`,
    "memory_search registration start",
  );

  source = replaceOnce(
    source,
    `\t\t\t\t\tisError: true,
\t\t\t\t\tdetails: {},
\t\t\t\t};
\t\t\t}
\t\t},
\t});

\t// --- memory_status tool (doctor) ---`,
    `\t\t\t\t\tisError: true,
\t\t\t\t\tdetails: {},
\t\t\t\t};
\t\t\t}
\t\t\t},
\t\t});
\t}

\t// --- memory_status tool (doctor) ---`,
    "memory_search registration end",
  );

  source = replaceOnce(
    source,
    `\t\t\tconst qmdOk = qmdAvailable || (await detectQmd());`,
    `\t\t\tconst searchEnabled = process.env.PI_MEMORY_NO_SEARCH !== "1";
\t\t\tconst qmdOk = searchEnabled && (qmdAvailable || (await detectQmd()));`,
    "memory status qmd probe",
  );

  source = replaceOnce(
    source,
    `\t\t\t\t"## Search (qmd)",
\t\t\t\t\`- qmd available: \${mark(qmdOk)}\`,
\t\t\t];

\t\t\tif (qmdOk) {`,
    `\t\t\t\t"## Search (qmd)",
\t\t\t\tsearchEnabled
\t\t\t\t\t? \`- qmd available: \${mark(qmdOk)}\`
\t\t\t\t\t: "- Disabled by PI_MEMORY_NO_SEARCH=1 (lightweight mode)",
\t\t\t];

\t\t\tif (!searchEnabled) {
\t\t\t\t// Core Markdown memory remains fully available in lightweight mode.
\t\t\t} else if (qmdOk) {`,
    "memory status lightweight result",
  );

  source = replaceOnce(
    source,
    `\t\t\t\t\`- PI_MEMORY_QMD_UPDATE: \${getQmdUpdateMode()}\`,
\t\t\t\t\`- PI_MEMORY_DIR: \${process.env.PI_MEMORY_DIR ? "set" : "default"}\`,`,
    `\t\t\t\t\`- PI_MEMORY_NO_SEARCH: \${process.env.PI_MEMORY_NO_SEARCH ?? "0"}\`,
\t\t\t\t\`- PI_MEMORY_QMD_UPDATE: \${getQmdUpdateMode()}\`,
\t\t\t\t\`- PI_MEMORY_DIR: \${process.env.PI_MEMORY_DIR ? "set" : "default"}\`,`,
    "memory status configuration",
  );

  return source;
}

export function isPiMemoryLiteConfigured(source) {
  return (
    source.includes('qmdAvailable = searchEnabled ? await detectQmd() : false;') &&
    source.includes('if (process.env.PI_MEMORY_NO_SEARCH !== "1") {\n\t\tpi.registerTool({') &&
    source.includes("Disabled by PI_MEMORY_NO_SEARCH=1 (lightweight mode)")
  );
}

export function configurePiMemory({ agentDir = defaultAgentDir, quiet = false } = {}) {
  const packageDir = join(agentDir, "npm", "node_modules", "pi-memory");
  const packageJsonPath = join(packageDir, "package.json");
  const sourcePath = join(packageDir, "index.ts");

  if (!existsSync(packageJsonPath) || !existsSync(sourcePath)) {
    return { status: "missing", sourcePath };
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (packageJson.version !== supportedVersion) {
    throw new Error(
      `Unsupported pi-memory version ${packageJson.version ?? "unknown"}; expected ${supportedVersion}.`,
    );
  }

  const source = readFileSync(sourcePath, "utf8");
  const patched = patchPiMemorySource(source);
  if (patched === source) {
    if (!quiet) console.log("pi-memory lightweight integration ready.");
    return { status: "ready", sourcePath };
  }

  writeFileSync(sourcePath, patched, "utf8");
  if (!quiet) console.log("Configured pi-memory lightweight integration.");
  return { status: "patched", sourcePath };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = configurePiMemory();
  if (result.status === "missing") {
    console.error("pi-memory is not installed. Run npm run setup first.");
    process.exit(1);
  }
}
