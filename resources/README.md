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
