# Application resources

This directory is the version-controlled resource layer for the integrated app.

- `skills/` contains authored or reviewed skills.
- `extensions/` contains Pi extensions.
- `prompts/` contains prompt templates.
- `themes/` contains custom Pi themes.

The managed launcher loads these directories for every workspace. Project-local
`.pi` and `.agents` resources from an opened workspace are not loaded.
