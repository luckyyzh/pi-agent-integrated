# Contributing / 贡献指南

Contributions are welcome. The project is Windows-first and keeps Pi, Pi Web, managed runtime data, and version-controlled resources as separate layers.

欢迎提交改进。本项目以 Windows 为首要平台，并明确区分 Pi 源码、Pi Web 源码、运行时数据与可版本化资源。

## Development setup / 开发环境

```powershell
git clone https://github.com/luckyyzh/pi-agent-new.git
cd pi-agent-new
npm run setup
npm run dev
```

Before submitting a change, run:

```powershell
npm run check
npm run check:profile
npm run typecheck
npm run test:managed
```

提交前请运行以上检查。它们不会发起付费模型请求。

## Repository rules / 仓库约定

- Never commit `.env`, `data/`, credentials, sessions, memory, browser output, or local model/provider configuration.
- 不要提交 `.env`、`data/`、凭据、会话、记忆、浏览器输出或本地模型配置。
- Put shareable defaults under `config/` and shareable skills, extensions, prompts, or themes under `resources/`.
- 可共享缺省配置放在 `config/`，可共享 Skill、扩展、提示词和主题放在 `resources/`。
- Keep runtime package versions pinned in `config/settings.default.json` and update the plugin table and `THIRD_PARTY_NOTICES.md` together.
- 更新运行时插件时必须固定版本，并同步 README 与第三方声明。
- Preserve upstream licenses and record Pi/Pi Web baseline commits when synchronizing source.
- 合并上游源码时保留许可证，并更新基线提交信息。
