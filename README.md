# Pi Agent Integrated

[中文](#中文) · [English](#english)

An integrated, repository-local distribution of [Pi](https://github.com/earendil-works/pi) and [Pi Web](https://github.com/agegr/pi-web).

---

## 中文

Pi Agent Integrated 将 Pi 后端运行时与 Pi Web 浏览器前端整合为一个可独立克隆、配置和运行的项目。项目采用前后端分离结构，但通过根目录脚本统一安装、构建和启动。

运行时状态、会话、认证、Skill、扩展、提示词和主题均可保存在项目目录内，不依赖用户全局的 `~/.pi/agent` 或 `~/.agents`，也不会自动加载所打开工作区中的 `.pi` / `.agents` 资源。

### 当前状态

- Pi 基线：`0.83.0`，上游提交 `bb226f9`
- Pi Web 基线：`0.8.4`，上游提交 `c9b47e4`
- 已在 Windows 10、Node.js 22 环境验证
- 其他操作系统理论上可通过 Node.js 脚本运行，但尚未完成实机验证
- 当前为命令行启动的 Web 应用，不包含桌面客户端或安装器

### 项目结构

```text
pi/                         Pi 后端、Agent 运行时及 CLI/TUI 源码
pi-web/                     Web 前端与 HTTP/SSE 服务
config/                     可共享的默认配置
resources/skills/           纳入版本控制的应用 Skill
resources/extensions/       纳入版本控制的 Pi 扩展
resources/prompts/          纳入版本控制的提示词模板
resources/themes/           纳入版本控制的主题
data/agent/                 会话、认证、模型配置、运行时包与工具
data/skills-home/           Skill CLI 使用的隔离目录
data/state/                 Skill 更新锁及其他可变状态
scripts/                    安装、启动、迁移与验收脚本
```

`data/` 包含设备和用户相关的运行数据，因此不会提交到 Git。需要分享和长期维护的自定义内容应放入 `config/` 或 `resources/`。

### 环境要求

- Node.js 22.19.0 或更高版本
- npm
- 首次安装时可访问 npm registry

### 快速开始

```powershell
git clone https://github.com/luckyyzh/pi-agent-new.git
cd pi-agent-new
npm run setup
npm run dev
```

浏览器打开 <http://127.0.0.1:30141>。

`npm run setup` 会安装两个子项目的依赖、构建本地 Pi 包，将 Pi Agent、AI、Coding Agent 和 TUI 包接入 Pi Web，并检查版本与构建产物。修改 Pi 源码或任一 lockfile 后应重新执行该命令。

安装脚本默认忽略子进程中的 `HTTP_PROXY` 和 `HTTPS_PROXY`，避免失效的本地代理阻塞 npm。如果当前网络必须使用代理，请先设置 `PI_SETUP_USE_PROXY=1`。

### 项目内 Profile

只初始化或修复项目内的空白 Profile，不安装依赖：

```powershell
npm run profile:init
```

现有 Pi 数据不会自动导入。需要复制当前用户的 Pi Profile 和全局 Skill 时，可显式运行：

```powershell
npm run profile:migrate
```

迁移只复制、不删除源数据，并默认保留目标目录中已存在的文件。其他用法：

```powershell
npm run profile:migrate -- --dry-run
npm run profile:migrate -- --force
npm run profile:migrate -- --from D:\old-pi\agent --skills-from D:\old-skills
```

迁移程序会移除指向项目外部的绝对资源路径，维持运行环境闭环。

### 常用命令

```powershell
npm run dev              # 仅本机访问的开发服务
npm run dev:lan          # 局域网可访问的开发服务
npm run start            # 启动已构建服务
npm run start:lan        # 在局域网启动已构建服务
npm run check            # 检查整合结构与构建产物
npm run typecheck        # TypeScript 类型检查
npm run lint             # 前端代码检查
npm run test:managed     # 项目内 Profile 与资源隔离测试
npm run smoke            # 运行中的服务冒烟测试
npm run smoke:isolation  # 外部 Skill/扩展隔离测试
```

`smoke` 和 `smoke:isolation` 需要开发服务已启动。测试不会发起付费模型请求。

### 上游与许可证

本项目基于以下项目维护整合版本：

- [earendil-works/pi](https://github.com/earendil-works/pi)，基线提交 `bb226f9c1f38d3c029156a690e97bbfc602336b9`
- [agegr/pi-web](https://github.com/agegr/pi-web)，基线提交 `c9b47e4543b11ce61e5c49c6bf02cea80aa975f6`

对应许可证保留在 `pi/LICENSE` 与 `pi-web/LICENSE`。后续更新由本仓库自行评估、合并和发布。

---

## English

Pi Agent Integrated combines the Pi backend runtime with the Pi Web browser frontend in a single project that can be cloned, configured, and run independently. The backend and frontend remain separate source trees, while root-level scripts provide one installation, build, and launch workflow.

Runtime state, sessions, authentication, skills, extensions, prompts, and themes can all live inside the repository. The managed launcher does not depend on the user's global `~/.pi/agent` or `~/.agents` directories and does not automatically load `.pi` or `.agents` resources from an opened workspace.

### Status

- Pi baseline: `0.83.0`, upstream commit `bb226f9`
- Pi Web baseline: `0.8.4`, upstream commit `c9b47e4`
- Validated on Windows 10 with Node.js 22
- The Node.js scripts are intended to be portable, but other operating systems have not been tested yet
- This is currently a command-line-launched web application, without a desktop client or installer

### Repository layout

```text
pi/                         Pi backend, agent runtime, and CLI/TUI source
pi-web/                     Web frontend and HTTP/SSE service
config/                     Shareable default configuration
resources/skills/           Version-controlled application skills
resources/extensions/       Version-controlled Pi extensions
resources/prompts/          Version-controlled prompt templates
resources/themes/           Version-controlled themes
data/agent/                 Sessions, auth, model config, packages, and tools
data/skills-home/           Isolated home used by the skills CLI
data/state/                 Skill update locks and other mutable state
scripts/                    Setup, launch, migration, and verification scripts
```

`data/` contains machine- and user-specific runtime data and is excluded from Git. Put custom resources that should be shared and maintained under `config/` or `resources/`.

### Requirements

- Node.js 22.19.0 or newer
- npm
- npm registry access during the first setup

### Quick start

```powershell
git clone https://github.com/luckyyzh/pi-agent-new.git
cd pi-agent-new
npm run setup
npm run dev
```

Open <http://127.0.0.1:30141>.

`npm run setup` installs dependencies for both source trees, builds the local Pi packages, connects the Pi Agent, AI, Coding Agent, and TUI packages to Pi Web, and verifies their versions and build output. Run it again after changing Pi source or either lockfile.

The setup script ignores `HTTP_PROXY` and `HTTPS_PROXY` for child processes by default so that a stale local proxy cannot stall npm. Set `PI_SETUP_USE_PROXY=1` first when npm registry access requires your proxy.

### Repository-local profile

Initialize or repair an empty managed profile without installing dependencies:

```powershell
npm run profile:init
```

Existing Pi data is never imported automatically. To copy the current user's Pi profile and global skills explicitly, run:

```powershell
npm run profile:migrate
```

Migration copies data without deleting its source and preserves existing destination files by default. Other options are:

```powershell
npm run profile:migrate -- --dry-run
npm run profile:migrate -- --force
npm run profile:migrate -- --from D:\old-pi\agent --skills-from D:\old-skills
```

The migrator removes absolute resource paths that point outside the repository, keeping the managed environment self-contained.

### Commands

```powershell
npm run dev              # Local-only development server
npm run dev:lan          # LAN-accessible development server
npm run start            # Start a production build
npm run start:lan        # Start a production build on the LAN
npm run check            # Verify integration layout and build artifacts
npm run typecheck        # TypeScript type checking
npm run lint             # Frontend linting
npm run test:managed     # Managed-profile and resource-isolation tests
npm run smoke            # Smoke-test a running server
npm run smoke:isolation  # Verify external skills/extensions stay isolated
```

`smoke` and `smoke:isolation` require a running development server. They do not make a paid model request.

### Upstream projects and licenses

This repository maintains an integrated distribution based on:

- [earendil-works/pi](https://github.com/earendil-works/pi), baseline commit `bb226f9c1f38d3c029156a690e97bbfc602336b9`
- [agegr/pi-web](https://github.com/agegr/pi-web), baseline commit `c9b47e4543b11ce61e5c49c6bf02cea80aa975f6`

The corresponding license files remain at `pi/LICENSE` and `pi-web/LICENSE`. Future upstream updates are evaluated, merged, and released from this repository.
