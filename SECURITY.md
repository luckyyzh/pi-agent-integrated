# Security policy / 安全说明

Pi Agent Integrated is currently a local, single-user application. The default `npm run dev` and `npm run start` commands bind to `127.0.0.1`. LAN commands intentionally bind to all interfaces and should only be used on trusted networks.

Pi Agent Integrated 当前定位为本地单用户应用。默认启动命令仅监听 `127.0.0.1`；带 `:lan` 的命令会监听所有网卡，只应在可信局域网使用。

Do not expose this application directly to the public internet. Agent tools can read and modify files in their selected workspace, run commands, access configured services, and invoke MCP servers. Review provider, extension, and MCP configuration before sharing an instance.

不要将应用直接暴露到公网。Agent 工具能够在所选工作目录内读写文件、执行命令、访问已配置服务并调用 MCP；共享实例前应审核模型、扩展和 MCP 配置。

Secrets belong in `.env`, environment variables, or the ignored `data/` profile. Never place real credentials in `config/`, `resources/`, screenshots, issues, or logs intended for publication.

密钥应放在 `.env`、系统环境变量或被忽略的 `data/` Profile 中，不要写入公开配置、资源、截图、Issue 或日志。

Report vulnerabilities through GitHub private vulnerability reporting when available: <https://github.com/luckyyzh/pi-agent-new/security/advisories/new>. Do not include active secrets in a public issue.
