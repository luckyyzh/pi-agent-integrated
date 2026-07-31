# Application resources

This directory is the version-controlled resource layer for the integrated app.

- `skills/` contains authored or reviewed skills.
- `extensions/` contains Pi extensions.
- `prompts/` contains prompt templates.
- `themes/` contains custom Pi themes.

The managed launcher loads these directories for every workspace. Project-local
`.pi` and `.agents` resources from an opened workspace are not loaded.

## Included extensions

- `extensions/package.json` is the explicit Pi extension manifest. Add future
  extension entry points to its `pi.extensions` array so the managed loader can
  discover them.
- `extensions/searxng-search.ts` registers the `web_search` tool. It requires
  `SEARXNG_TOKEN` and optionally accepts `SEARXNG_URL` in the Pi process
  environment.
- `extensions/docs-search/` registers the `docs_search` tool and the
  `/docs-index` command. It provides hybrid (BM25 + optional semantic) retrieval
  over project documentation:
  - Documents live in `docs/raw/` (`.docx`, `.md`, `.txt`) and are converted
    to clean Markdown under `docs/md/` before indexing; docx conversion uses
    `mammoth` and is idempotent (content-hash tracked).
  - Run `/docs-index` (or `/docs-index --update`) to build or incrementally
    refresh the index; `/docs-index --status` shows index health.
  - Without `DOCS_EMBED_BASE_URL` the search degrades to BM25 keyword
    retrieval. Set an OpenAI-compatible embeddings endpoint
    (`DOCS_EMBED_BASE_URL`, `DOCS_EMBED_MODEL`, optional `DOCS_EMBED_API_KEY`)
    to enable semantic + keyword hybrid search. `DOCS_DIR` overrides the docs
    location (default `<app root>/docs`).
