/**
 * pi-ai vision passthrough patch.
 *
 * Pi-ai's `transform-messages.js` replaces image parts with a text placeholder
 * ("(image omitted: model does not support images)") for text-only models BEFORE
 * the before_provider_request hook runs, so the vision extension's automatic
 * transcription hook can never see the image. This patch adds an opt-in switch:
 * when PI_VISION_PASSTHROUGH_IMAGES=1 (set by the vision extension at load),
 * user-message image parts are kept intact so the vision hook can transcribe
 * them; without the env var the original placeholder behavior is preserved
 * (safe for users without the vision extension).
 *
 * Idempotent, replayed by run.mjs and install-managed-packages.mjs, mirroring
 * configure-pi-memory.mjs.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const supportedVersion = "0.83.0";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;

  const first = source.indexOf(before);
  const last = source.lastIndexOf(before);
  if (first < 0 || first !== last) {
    throw new Error(`Cannot apply pi-ai vision patch: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

export function patchPiAiSource(input) {
  let source = input.replaceAll("\r\n", "\n");

  source = replaceOnce(
    source,
    `    return messages.map((msg) => {
        if (msg.role === "user" && Array.isArray(msg.content)) {
            return {
                ...msg,
                content: replaceImagesWithPlaceholder(msg.content, NON_VISION_USER_IMAGE_PLACEHOLDER),
            };
        }`,
    `    const keepUserImages =
        typeof process !== "undefined" && process.env?.PI_VISION_PASSTHROUGH_IMAGES === "1";
    return messages.map((msg) => {
        if (msg.role === "user" && Array.isArray(msg.content) && !keepUserImages) {
            return {
                ...msg,
                content: replaceImagesWithPlaceholder(msg.content, NON_VISION_USER_IMAGE_PLACEHOLDER),
            };
        }`,
    "downgradeUnsupportedImages user-image passthrough switch",
  );

  return source;
}

export function isPiAiVisionConfigured(source) {
  return source.includes("PI_VISION_PASSTHROUGH_IMAGES === \"1\"");
}

export function defaultPiAiDir() {
  // Managed installs place packages under <agentDir>/npm/node_modules; pi-ai is
  // also a direct dependency of pi-web, which wins in dev. Prefer pi-web's copy.
  const candidates = [
    resolve(process.cwd(), "pi-web", "node_modules", "@earendil-works", "pi-ai"),
    resolve(process.cwd(), "node_modules", "@earendil-works", "pi-ai"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "package.json"))) return candidate;
  }
  throw new Error("pi-ai package not found under pi-web/node_modules or node_modules");
}

export function configurePiAiVision({ piAiDir = defaultPiAiDir(), quiet = false } = {}) {
  const packageJsonPath = join(piAiDir, "package.json");
  const sourcePath = join(piAiDir, "dist", "api", "transform-messages.js");

  if (!existsSync(packageJsonPath) || !existsSync(sourcePath)) {
    return { status: "missing", sourcePath };
  }

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${packageJsonPath}: ${error.message}`);
  }
  if (packageJson.version !== supportedVersion) {
    throw new Error(
      `Unsupported pi-ai version ${packageJson.version ?? "unknown"}; expected ${supportedVersion}.`,
    );
  }

  const source = readFileSync(sourcePath, "utf8");
  const patched = patchPiAiSource(source);
  if (patched === source) {
    if (!quiet) console.log("pi-ai vision passthrough ready.");
    return { status: "ready", sourcePath };
  }

  writeFileSync(sourcePath, patched, "utf8");
  if (!quiet) console.log("Configured pi-ai vision passthrough.");
  return { status: "patched", sourcePath };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = configurePiAiVision();
    if (result.status === "missing") {
      console.error("pi-ai is not installed. Run npm run setup first.");
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
