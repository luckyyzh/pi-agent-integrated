# Managed profile defaults

`settings.default.json` and `models.example.json` seed a new local profile.
`mcp.default.json` is the Windows MCP profile; `mcp.macos.default.json` leaves
Playwright opt-in on macOS. The launcher copies the platform-appropriate files
into `data/agent/` only when the destination is missing, so upgrades never
overwrite a user's settings, model configuration, or custom MCP configuration.
