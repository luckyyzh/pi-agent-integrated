# Managed profile defaults

`settings.default.json` and `models.example.json` seed a new local profile.
The launcher copies them into `data/agent/` only when the destination file is
missing, so upgrades never overwrite a user's settings or model configuration.
