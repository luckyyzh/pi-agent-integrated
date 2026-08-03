# Pi Agent Integrated

[中文](#中文) · [English](#english)

A Windows/macOS, repository-local distribution that connects the [Pi](https://github.com/earendil-works/pi) agent runtime to the [Pi Web](https://github.com/agegr/pi-web) browser UI and adds a managed plugin/tool ecosystem.

---

## 中文

Pi Agent Integrated 将 Pi 后端与 Pi Web 前端整合成一个可独立克隆、配置和启动的项目。它保留前后端源码边界，通过根目录命令完成依赖安装、Pi 构建、插件安装、Profile 初始化和 Web 启动。

### 与两个源项目有什么不同

| 能力 | Pi | Pi Web | Pi Agent Integrated |
| --- | --- | --- | --- |
| 主要定位 | CLI/TUI Agent 运行时 | Pi 的浏览器 UI | 带 Web UI 的完整本地 Agent 应用 |
| 安装方式 | 安装 CLI 或从源码构建 | 单独连接 Pi 包 | 根目录一次 `npm run setup` |
| 运行数据 | 默认使用用户主目录 | 跟随 Pi Profile | 会话、认证、记忆、插件、缓存全部进入项目 `data/` |
| 默认工作目录 | 当前终端目录 | 在用户主目录创建日期目录 | `data/workspaces/default/` |
| 扩展生态 | 支持 Skill、扩展和包 | 提供管理界面 | 固定版本插件、MCP、Skill、提示词和主题形成项目闭环 |
| 网络搜索 | 无项目专属搜索 | 无项目专属搜索 | 可选 SearXNG `web_search` 扩展 |
| 浏览器自动化 | 需自行接入 | 无默认浏览器 MCP | Windows 默认使用 Edge；macOS 默认不启用，按需配置 |
| 恢复与长期状态 | 会话树与基础状态 | 会话 UI | Rewind 检查点、项目内 Memory、自动重试 |
| 多代理 | 核心能力可扩展 | 展示工具调用 | 配置了自动判断复杂度的 `pi-subagents` 策略 |
| 本项目修复 | 不适用 | 上游行为 | 修复已结束会话状态 404、隐藏 Next.js 开发指示器、增加 Windows/macOS restart |

本仓库不是桌面安装包，也不是公网多用户服务。当前发布目标是：技术用户在 Windows 或 macOS 上克隆仓库、补充自己的模型凭据后，通过命令行启动一个隔离、可扩展的本地 Web Agent。

### 环境要求

- Windows 10/11 或 macOS（Intel/Apple Silicon）
- Node.js `22.19.0` 或更高版本
- npm 与 Git
- 首次安装时可访问 npm registry
- Microsoft Edge（仅 Windows 默认 Playwright 浏览器工具需要；macOS 默认不启用 Playwright，不会自动下载浏览器）
- 至少一个由用户自行配置的模型供应商、订阅登录或兼容 API

### 快速开始

Windows PowerShell：

```powershell
git clone https://github.com/luckyyzh/pi-agent-integrated.git
cd pi-agent-integrated
npm run setup
npm run dev
```

macOS：

```bash
git clone https://github.com/luckyyzh/pi-agent-integrated.git
cd pi-agent-integrated
npm run setup
npm run dev
```

打开 <http://127.0.0.1:30141>。

`npm run setup` 会：

1. 初始化项目内 `data/` Profile；
2. 安装并构建本地 Pi 源码；
3. 安装 Pi Web 并连接本地 Pi 包；
4. 安装、固定并加载检查默认插件；
5. Windows 预缓存 Playwright MCP 包并确认系统 Edge 可用；macOS 跳过 Playwright 安装，浏览器自动化按需配置；
6. 检查前后端版本和构建产物。

安装脚本默认不继承 `HTTP_PROXY` / `HTTPS_PROXY`，避免失效代理阻塞 npm。如果安装必须使用代理，Windows PowerShell 设置 `$env:PI_SETUP_USE_PROXY = "1"`，macOS/Linux 使用 `PI_SETUP_USE_PROXY=1 npm run setup`。

### 首次模型配置

仓库不会附带作者的模型地址、API Key、OAuth Token 或默认模型。应用可以在空模型配置下启动，但发送消息前必须完成以下任一方式：

- 在 Web UI 左下角进入“模型”，为内置供应商登录或填写 API Key；
- 在同一界面添加 Ollama、LM Studio、vLLM 或其他兼容 API；
- 编辑运行时文件 `data/agent/models.json`；
- 使用供应商支持的环境变量，例如 `ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 或 `GEMINI_API_KEY`。

所有设备相关模型配置都位于被 Git 忽略的 `data/` 或 `.env` 中。

### 可选环境变量

需要可选服务时，复制模板：

macOS/Linux：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

根启动器会自动读取 `.env`，已有系统环境变量优先。常用变量如下：

| 变量 | 是否必需 | 用途 |
| --- | --- | --- |
| `SEARXNG_URL` | 使用 SearXNG 时必需 | 用户自己的 JSON 搜索代理端点 |
| `SEARXNG_TOKEN` | 使用 SearXNG 时必需 | 作为 `X-Search-Token` 请求头发送 |
| `CONTEXT7_API_KEY` | 可选 | 提高 Context7 文档查询限额 |
| 模型供应商 API Key | 按供应商 | 模型认证；也可通过 Web UI 配置 |
| `PI_AGENT_DATA_DIR` | 可选 | 将可变数据移动到其他目录 |

不要提交 `.env`、`data/`、真实密钥或包含密钥的截图。

### 项目结构和闭环边界

```text
pi/                         Pi 后端、Agent、CLI/TUI 源码
pi-web/                     Next.js Web 前端与 HTTP/SSE 服务
config/                     可提交的缺省设置、MCP 和子代理策略
resources/skills/           应用级 Skill
resources/extensions/       应用级 Pi 扩展
resources/prompts/          提示词模板
resources/themes/           主题
scripts/                    安装、启动、迁移与验证脚本
data/agent/                 会话、认证、模型、插件、记忆与工具状态
data/home/                  Pi 子进程主目录与 Rewind 检查点
data/cache/                 项目内 npm 缓存
data/workspaces/default/    默认工作目录
```

`data/` 不进入 Git。应随仓库分发的内容放在 `config/` 或 `resources/`；个人会话、记忆、凭据、插件安装结果和模型配置留在 `data/`。打开其他代码目录时，受管运行时不会自动加载其中的 `.pi` / `.agents` 资源，从而避免和其他 Agent 项目耦合。

### 内置插件与工具

版本固定在 `config/` 下的平台默认配置文件中；Windows 使用 `mcp.default.json`，macOS 使用不含 Playwright 的 `mcp.macos.default.json`。

| 插件/工具 | 功能 | 自动行为与用法 |
| --- | --- | --- |
| `pi-mcp-adapter@2.15.0` | 用一个紧凑代理工具接入 MCP | 模型使用 `mcp` 搜索并调用 MCP；`/mcp` 查看状态。外部宿主配置发现默认关闭 |
| `@playwright/mcp@0.0.78` | 真实网页导航、点击、表单、快照和截图 | Windows 通过 MCP 按需启动并使用系统 Edge；macOS 默认不安装，需手动通过 MCP 配置启用 |
| `pi-lens@3.8.73` | LSP、AST、符号检索和项目诊断 | 模型按需激活代码智能工具；可用 `/lens-health`、`/lens-tools`、`/lens-map` 检查 |
| `pi-memory@0.4.0` | Markdown 长期记忆、日志、临时工作区和恢复记录 | 默认轻量模式保留读写、状态和恢复工具，但不注册依赖 qmd 的 `memory_search`；文件位于 `data/agent/memory/` |
| `pi-subagents@0.37.2` | 创建研究、规划或执行子代理 | 简单任务不委派，跨模块或可并行复杂任务自动判断；也可使用 `/run`、`/parallel` |
| `pi-smart-fetch@0.3.17` | 抓取单个或批量 URL 内容 | 模型按需使用 `web_fetch` / `batch_web_fetch`，也提供给研究子代理 |
| `@ayulab/pi-rewind@0.4.6` | 每轮前后创建代码检查点 | `/rewind` 恢复代码、会话或两者；`/checkpoint` 管理存储。自动恢复文件默认关闭 |
| `@upstash/context7-pi@0.1.2` | 查询当前库、框架、SDK 和 API 文档 | 模型先解析库 ID，再按需查询文档；无 Key 可使用公共限额 |
| `@narumitw/pi-retry@0.31.0` | 识别瞬时供应商错误和卡住的流 | 复用 Pi 内置重试；默认 180 秒无事件视为停滞，不增加正常请求的模型调用 |
| `resources/extensions/searxng-search.ts` | 用户自有 SearXNG 的 `web_search` | 配置 `SEARXNG_URL` 与 `SEARXNG_TOKEN` 后，模型对时效性或明确搜索请求自动调用 |
| `resources/extensions/vision.ts` | 文本主模型（如 DeepSeek）的识图工具 `vision`（双后端） | 派 `vision` 子代理或直接让模型调用工具，返回 OCR/版式/语义文本；后端初始未配置（本地 Ollama 或 OpenAI 兼容视觉 API 任选），需在「视觉」标签页或环境变量中自行设置 |

Windows 的 Playwright 不下载独立 Chromium；首次 `setup` 只缓存 MCP 的 Node.js 包，浏览器执行使用系统 Edge。macOS 的 setup 不安装或启用 Playwright；如需浏览器自动化，可在 Web UI 的 MCP 面板中手动添加并配置。

#### 视觉子代理（vision）

DeepSeek 等纯文本模型不能接收图片。仓库内置 `vision` 子代理（`.agents/vision.md`）：它通过 `vision` 工具调用视觉模型读取图片，把完整 OCR、版式结构与语义描述返回给主模型，主模型基于文本继续推理。视觉后端可插拔（本地 Ollama 或任意 OpenAI 兼容视觉 API）——仓库**不预设默认后端**，首次使用前需自行选择并配置。

配置入口：WebUI 左下角「模型」面板内的「视觉」标签页（写入 `data/agent/vision.json`），保存后**下次识图请求立即生效**，无需重启；环境变量优先级高于面板配置。

> 注意：视觉后端初始**未预设默认值**。未配置时识图会报错并提示配置入口；两种后端二选一即可。

**后端一：本地 Ollama（免费私密）**

- 前置：本机安装 [Ollama](https://ollama.com) 并拉取一个支持视觉的模型（如 `ollama pull qwen3-vl:8b`）。
- 环境变量：`OLLAMA_HOST`（默认 `http://localhost:11434`）、`OLLAMA_VISION_MODEL`（**必填**，指定视觉模型）、`OLLAMA_VISION_KEEP_ALIVE`（默认 `-1` 常驻显存，避免每次识图冷加载大模型；也可设 `30m` 等时长）。

**后端二：OpenAI 兼容视觉 API**

- 设置 `VISION_BACKEND=openai`，并配置 `VISION_OPENAI_BASE_URL`（如 `https://api.openai.com/v1`）、`VISION_OPENAI_API_KEY`、`VISION_OPENAI_MODEL`（如 `gpt-4o-mini`、`glm-4.5v`、`qwen-vl-max`）。

**自动转录（WebUI 上传即用）**

纯文本主模型（如 DeepSeek）无法接收图片，直接在 WebUI 上传会让请求失败（DeepSeek API 返回 HTTP 400）。`vision` 扩展注册了 `before_provider_request` 钩子：请求发出前检测到图片附件时，自动调用配置的视觉后端生成文本描述并替换进消息，主模型直接基于描述继续推理——上传即用，无需手动操作。支持图片的主模型则原样透传，不受影响。

描述按**单张图片**缓存并**持久化到磁盘**（`data/agent/vision-cache.json`，上限 64 条）：只有新上传的图片会调用视觉模型，历史图片（含重启后）秒回缓存。自动转录使用**精简模板**（约百字摘要；`vision` 工具仍返回完整 OCR），并显式 `keep_alive: -1` 让模型常驻显存。每轮请求会把历史图片的描述文本一并注入上下文以保持主模型的记忆——上下文体积会随历史图片数增长，属已知取舍（Ollama 端已显式提升 `num_ctx`，DeepSeek 前缀缓存可摊薄费用）。

- WebUI 上传 JPEG 会自动压缩（长边 >1600px 时缩放至 1600px、质量 0.85）：相机照片从数 MB 降到几百 KB，会话文件不膨胀、加载与转录更快；PNG/WebP/GIF 原样保留（无损/动画）。

- 用法：对主模型说“用 vision 子代理看 <图片路径>”即可；也可 `/run vision`（子代理用于主动深度分析多图；上传自动转录已覆盖日常识图）。
- 主会话直用：重启 pi 后 `vision` 工具在主会话也可用，可对磁盘上的图片主动调用。
- 单次调用可覆盖后端与模型：工具参数 `backend`、`model`。

为什么不让 pi 直接连接 Ollama 视觉模型：Ollama 的 OpenAI 兼容端点（`/v1`）会把 qwen3 系列模型的推理内容放进 `reasoning` 字段、`content` 留空，pi 会判定为空回复。Ollama 后端改走原生 `/api/chat` 并传 `think: false` 关闭思考，实测稳定可靠。

MCP 服务器可通过 Web UI 左下角的 MCP 按钮可视化配置（写入 `data/agent/mcp.json`）：支持 stdio（命令 + 参数）与 HTTP（URL + 请求头 + OAuth/Bearer）两种传输、环境变量键值编辑、工作目录、生命周期与超时设置，另保留原始 JSON 编辑兜底。保存后重启 pi（或 /reload）生效。

#### 插件与扩展

Web UI 左下角的「插件」和「扩展」是两个独立面板：插件面板管理 npm/git 插件包的安装、更新和启停；扩展面板只展示直接加载的 `.ts`/`.js` 扩展文件，不展示插件包内的资源。扩展面板会按项目、内置和应用范围显示扩展状态、来源与路径；未信任项目中的 `.pi/extensions` 会标记为阻止而不会执行。共享扩展放在 `resources/extensions/`，项目扩展放在项目的 `.pi/extensions/`，全局扩展位于 Pi Profile 的 `extensions/` 目录。

Web UI 右上角的会话信息栏会汇总 Token 使用情况；当模型返回缓存读写数据时，还会显示按 Token 加权计算的缓存命中率：`cacheRead / (input + cacheRead + cacheWrite)`，不计输出 Token。

#### 记忆模式

默认设置 `PI_MEMORY_NO_SEARCH=1` 和 `PI_MEMORY_QMD_UPDATE=off`。这不会削弱 Markdown 记忆、每日日志、scratchpad 或恢复记录，但会跳过 qmd 探测、安装提示和 `memory_search` 工具，因此全新安装不会自动下载 qmd 的本地模型。集成补丁会在 `setup` 以及每次启动前自动检查并重放，受管插件重装后无需手工修改。

如果确实需要跨全部记忆文件的关键词、语义或深度搜索，请先自行安装并配置 qmd，然后在 `.env` 中设置：

```dotenv
PI_MEMORY_NO_SEARCH=0
PI_MEMORY_QMD_UPDATE=background
```

随后运行 `npm run memory:configure` 或直接重启应用。qmd 及其模型不随本仓库分发。

### Profile、迁移和自定义扩展

只创建缺失的项目 Profile 文件：

```powershell
npm run profile:init
```

显式复制已有 Pi Profile 和全局 Skill：

```powershell
npm run profile:migrate
npm run profile:migrate -- --dry-run
npm run profile:migrate -- --force
npm run profile:migrate -- --from D:\old-pi\agent --skills-from D:\old-skills
```

迁移只复制，不删除源数据，并清理指向仓库外部的绝对资源路径。后续共享扩展放入 `resources/extensions/` 并登记到其 `package.json`；共享 Skill、提示词和主题分别放入对应 `resources/` 目录。

### 常用命令

```powershell
npm run setup           # 完整安装、构建和 Profile 插件校验
npm run profile:packages # 安装缺失或版本不匹配的受管插件
npm run memory:configure # 重新应用受管 pi-memory 轻量集成
npm run dev             # 127.0.0.1:30141 开发服务
npm run restart         # Windows/macOS：停止本项目旧开发进程并重新启动
npm run dev:lan         # 局域网监听；仅在可信网络使用
npm run build           # 构建 Pi Web 生产产物
npm run start           # 启动已构建的本机生产服务
npm run check           # 验证前后端整合结构
npm run check:profile   # 安装/加载并检查受管插件
npm run smoke:fresh-profile # 在临时目录验证全新 Profile 安装后自动清理
npm run typecheck       # Pi Web TypeScript 检查
npm run test:managed    # Profile、隔离、搜索契约等测试
npm run smoke           # 对运行中的 Web 服务做冒烟测试
npm run smoke:isolation # 验证外部 Skill/扩展不会泄漏进来
npm run smoke:search -- "关键词" # 使用真实 SearXNG；需要配置
```

除 `smoke:search` 会访问用户配置的 SearXNG 外，以上验证不会发起付费模型请求。

### 自动磁盘维护

每次 `dev`、`restart`、`build` 或 `start` 在启动 Pi Web 前都会检查项目内的可变数据。维护只在 30141 端口没有运行中的 Pi Web 时执行，并采用以下无损策略：

- `.next/dev`、`.next/cache` 或项目 npm 缓存超过默认上限后才删除；下一次使用时会自动重建；
- Rewind 检查点包含大量松散 Git 对象时自动执行压缩，但保留所有有效检查点；
- 已找不到对应会话的孤儿 Rewind 检查点保留 7 天后自动删除；
- 会话、记忆、凭据、模型配置、已安装插件和仍有关联的检查点不会被自动删除。
- 手动清理：`node scripts/cleanup-cache.mjs`（默认预览，加 `--apply` 执行）——清 npm/opengrep 缓存、按天数移走过期会话、把旧会话图片替换为占位符瘦身；删除先进回收目录。

```powershell
npm run storage:status    # 只查看受管缓存大小
npm run storage:maintain  # 立即执行默认阈值维护
npm run storage:clean     # 清空可重建缓存并删除全部孤儿检查点
```

运行中的服务不会被维护命令修改；如需在重启时自动回收，直接使用 `npm run restart`。可在 `.env` 中通过 `PI_STORAGE_*` 变量调整上限、宽限期或关闭自动维护，缺省值见 `.env.example`。

### 上游、更新和许可证

- Pi 基线：`0.83.0`，提交 `bb226f9c1f38d3c029156a690e97bbfc602336b9`
- Pi Web 基线：`0.8.4`，提交 `c9b47e4543b11ce61e5c49c6bf02cea80aa975f6`

本整合版不自动跟随上游。更新时应分别评估两个源码树，重新执行 `npm run setup`、类型检查和受管测试，再更新这里的基线信息。根目录整合代码采用 MIT；两个源码树和运行时插件保留各自许可证，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。安全边界见 [SECURITY.md](SECURITY.md)，贡献约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## English

Pi Agent Integrated combines the Pi backend and Pi Web frontend into one independently cloneable and runnable repository. It preserves separate source boundaries while root commands handle dependency installation, Pi builds, managed-profile creation, plugin installation, and Web startup.

### How it differs from the two upstream projects

| Capability | Pi | Pi Web | Pi Agent Integrated |
| --- | --- | --- | --- |
| Primary role | CLI/TUI agent runtime | Browser UI for Pi | Complete local agent application with Web UI |
| Installation | Install CLI or build source | Connect Pi packages separately | One root `npm run setup` |
| Mutable state | User home by default | Follows the Pi profile | Sessions, auth, memory, plugins, and caches stay under repository `data/` |
| Default workspace | Current terminal directory | Creates a dated home directory | `data/workspaces/default/` |
| Extension ecosystem | Supports skills, extensions, packages | Management UI | Pinned plugins, MCP, skills, prompts, and themes form a managed ecosystem |
| Web search | No project-specific search | No project-specific search | Optional SearXNG `web_search` extension |
| Browser automation | User-integrated | No default browser MCP | Windows uses Edge by default; macOS leaves Playwright opt-in |
| Recovery and durable context | Session tree and core state | Session UI | Rewind checkpoints, repository-local memory, automatic retry |
| Multi-agent workflow | Extensible core | Renders tool calls | Automatic complexity policy for `pi-subagents` |
| Integration fixes | Not applicable | Upstream behavior | Handles ended-session state 404s, hides Next dev indicators, adds Windows/macOS restart |

This repository is not a desktop installer or a public multi-user service. Its current release target is a technical Windows or macOS user who clones the project, supplies personal model credentials, and starts an isolated, extensible local Web agent from the command line.

### Requirements

- Windows 10/11 or macOS (Intel/Apple Silicon)
- Node.js `22.19.0` or newer
- npm and Git
- npm registry access during initial setup
- Microsoft Edge for the Windows default Playwright browser; macOS leaves Playwright disabled by default and downloads no browser
- At least one user-configured model provider, subscription login, or compatible API

### Quick start

Windows PowerShell or macOS Terminal:

```bash
git clone https://github.com/luckyyzh/pi-agent-integrated.git
cd pi-agent-integrated
npm run setup
npm run dev
```

Open <http://127.0.0.1:30141>.

Setup initializes the repository-local profile, builds Pi, links Pi Web to the local packages, installs and loads the pinned plugins, caches the Playwright MCP Node package and verifies system Edge on Windows, skips Playwright on macOS, and checks integration artifacts.

Child npm operations ignore `HTTP_PROXY` and `HTTPS_PROXY` by default to avoid stale proxy configuration. Set `$env:PI_SETUP_USE_PROXY = "1"` on Windows, or run `PI_SETUP_USE_PROXY=1 npm run setup` on macOS/Linux, when registry access requires the proxy.

### First model configuration

The repository contains no author model endpoint, API key, OAuth token, or default model. The UI starts with an empty model configuration, but one of the following is required before sending a message:

- open Models in the lower-left Web UI and authenticate or enter an API key for a built-in provider;
- add Ollama, LM Studio, vLLM, or another compatible API in the same UI;
- edit the runtime file `data/agent/models.json`;
- set a supported variable such as `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`.

Device-specific model configuration remains in ignored `data/` or `.env` files.

### Optional environment configuration

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The managed launcher automatically reads `.env`, while existing process variables take precedence.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SEARXNG_URL` | When using SearXNG | The user's JSON search proxy endpoint |
| `SEARXNG_TOKEN` | When using SearXNG | Sent as the `X-Search-Token` request header |
| `CONTEXT7_API_KEY` | Optional | Higher Context7 documentation quota |
| Provider API keys | Provider-specific | Model authentication; the Web UI is another option |
| `PI_AGENT_DATA_DIR` | Optional | Relocate mutable runtime data |

Never commit `.env`, `data/`, real credentials, or screenshots containing credentials.

### Repository-local ecosystem

```text
pi/                         Pi backend, agent, and CLI/TUI source
pi-web/                     Next.js frontend and HTTP/SSE service
config/                     Versioned settings, MCP, and subagent policy
resources/skills/           Application skills
resources/extensions/       Application Pi extensions
resources/prompts/          Prompt templates
resources/themes/           Themes
scripts/                    Setup, launch, migration, and verification
data/agent/                 Sessions, auth, models, packages, memory, tools
data/home/                  Pi subprocess home and Rewind checkpoints
data/cache/                 Repository-local npm cache
data/workspaces/default/    Default workspace
```

`data/` is excluded from Git. Shareable defaults belong in `config/` or `resources/`; personal sessions, memory, credentials, installed packages, and model settings remain in `data/`. The managed runtime does not automatically load `.pi` or `.agents` resources from another opened workspace.

### Included plugins and tools

Versions are pinned in the platform defaults under `config/`: Windows uses `mcp.default.json`, while macOS uses `mcp.macos.default.json` without Playwright.

| Plugin/tool | Function | Automatic behavior and usage |
| --- | --- | --- |
| `pi-mcp-adapter@2.15.0` | Compact MCP proxy | The model searches and invokes MCP through `mcp`; `/mcp` shows status. Host-config discovery is off |
| `@playwright/mcp@0.0.78` | Real navigation, clicks, forms, snapshots, screenshots | Windows starts it on demand with isolated headless system Edge; macOS does not install it by default and requires manual MCP configuration |
| `pi-lens@3.8.73` | LSP, AST, symbols, project diagnostics | The model activates code intelligence on demand; inspect with `/lens-health`, `/lens-tools`, `/lens-map` |
| `pi-memory@0.4.0` | Markdown durable facts, logs, scratchpad, recovery | Lightweight mode retains read/write, status, and recovery tools but does not register qmd-dependent `memory_search`; files live under `data/agent/memory/` |
| `pi-subagents@0.37.2` | Research, planning, execution subagents | Simple tasks stay local; complex or parallel work may delegate automatically; `/run` and `/parallel` remain available |
| `pi-smart-fetch@0.3.17` | Single and batched URL retrieval | Provides `web_fetch` and `batch_web_fetch` to the main and research agents |
| `@ayulab/pi-rewind@0.4.6` | Per-turn code checkpoints | `/rewind` restores code, conversation, or both; `/checkpoint` manages storage. Automatic file restore is off |
| `@upstash/context7-pi@0.1.2` | Current library, framework, SDK, API docs | Resolves a library ID and queries docs when needed; public quota works without a key |
| `@narumitw/pi-retry@0.31.0` | Transient provider and stalled-stream classification | Uses Pi's built-in retry path; 180 seconds without events is a stall; no extra normal model calls |
| `resources/extensions/searxng-search.ts` | `web_search` against a user-owned SearXNG proxy | After `SEARXNG_URL` and `SEARXNG_TOKEN` are set, the model calls it for current or explicit search requests |
| `resources/extensions/vision.ts` | `vision` — image description for text-only models (e.g. DeepSeek), dual backend | Ask the `vision` subagent or call the tool directly; returns OCR/layout/semantics as text; no backend is preconfigured (local Ollama or any OpenAI-compatible vision API) — set one in the Vision tab or via env vars |

On Windows, Playwright never downloads a standalone Chromium: setup caches only its Node package and browser execution uses system Edge. On macOS, setup does not install or enable Playwright; add it manually through the MCP panel if browser automation is needed.

#### Vision subagent

Text-only models such as DeepSeek cannot receive image attachments. The repository ships a `vision` subagent (`.agents/vision.md`) that calls a vision model through the `vision` tool and returns a full OCR, layout, and semantic description the main model can reason over. The vision backend is pluggable (local Ollama or any OpenAI-compatible vision API) — the repository does **not** ship a default backend; pick and configure one before first use.

Configuration: the “Vision” tab inside the “Models” panel in the lower-left Web UI (writes `data/agent/vision.json`). Saved config takes effect on the **next image request** — no restart needed; environment variables take precedence over the panel.

> Note: no backend is preconfigured by default. Image requests fail with a configuration hint until you pick one — choose either backend below.

**Backend 1: local Ollama (free and private)**

- Prerequisite: install [Ollama](https://ollama.com) and pull a vision-capable model (e.g. `ollama pull qwen3-vl:8b`).
- Env: `OLLAMA_HOST` (default `http://localhost:11434`), `OLLAMA_VISION_MODEL` (**required** — the vision model), `OLLAMA_VISION_KEEP_ALIVE` (default `-1` — keep the model resident in VRAM to avoid cold-loading it on every transcription; can be set to e.g. `30m`).

**Backend 2: OpenAI-compatible vision API**

- Set `VISION_BACKEND=openai` and configure `VISION_OPENAI_BASE_URL` (e.g. `https://api.openai.com/v1`), `VISION_OPENAI_API_KEY`, `VISION_OPENAI_MODEL` (e.g. `gpt-4o-mini`, `glm-4.5v`, `qwen-vl-max`).

**Automatic transcription (upload-and-go)**

A text-only main model such as DeepSeek cannot receive images — uploading one in the Web UI fails the request (DeepSeek API returns HTTP 400). The `vision` extension registers a `before_provider_request` hook: when it detects image attachments, it transcribes them through the configured vision backend and replaces them with text before the request is sent, so the main model keeps reasoning seamlessly. Vision-capable main models pass through untouched.

Descriptions are cached **per image** and **persisted to disk** (`data/agent/vision-cache.json`, capped at 64 entries): only genuinely new uploads call the vision model, while previously seen images — including after a restart — resolve from cache instantly. The automatic transcription pipeline uses a **concise prompt** (~100-character summary; the `vision` tool still returns full OCR) and sends `keep_alive: -1` so the model stays resident in VRAM. Every request also re-injects the accumulated image descriptions so the main model keeps its memory of them — a known trade-off where context grows with the number of images (the Ollama backend raises `num_ctx` explicitly, and DeepSeek prefix caching keeps the cost modest).

- Web UI uploads auto-compress JPEGs (downscaled to 1600px long edge at quality 0.85 when larger): camera photos drop from several MB to a few hundred KB, so session files stop growing and load/transcribe faster; PNG/WebP/GIF pass through untouched (lossless/animated).

- Usage: ask the main model to “use the vision subagent to look at <path>”, or run `/run vision` (the subagent is for proactive deep analysis of many images; everyday image reading is covered by automatic transcription).
- Main-session use: after restarting pi, the `vision` tool is also available in the main session for images on disk.
- Per-call overrides: tool parameters `backend` and `model`.

Why not point pi directly at an Ollama vision model: Ollama's OpenAI-compatible `/v1` endpoint moves qwen3-family reasoning into the `reasoning` field with an empty `content`, which pi treats as an empty reply. The Ollama backend uses the native `/api/chat` with `think: false` instead, which works reliably.

MCP servers can be configured visually from the MCP button in the lower-left Web UI (writes `data/agent/mcp.json`): stdio (command + args) or HTTP (URL + headers + OAuth/Bearer) transport, environment-variable row editing, working directory, lifecycle and timeout options, plus raw JSON editing as a fallback. Changes take effect after restarting pi (or /reload).

#### Plugins and extensions

The lower-left Web UI has separate “Plugins” and “Extensions” panels. The Plugins panel manages npm/git plugin packages, including install, update, enable, and disable actions. The Extensions panel only lists directly loaded `.ts`/`.js` extension files and never lists resources supplied by plugin packages. It groups extensions by project, built-in, and app scope and shows their status, source, and path; extensions in an untrusted project `.pi/extensions` directory are shown as blocked and are not executed. Shared extensions belong in `resources/extensions/`, project extensions in `.pi/extensions/`, and global extensions in the Pi Profile `extensions/` directory.

The Web UI session-info panel in the upper-right summarizes Token usage. When a model reports cache read/write data, it also shows the token-weighted cache hit rate: `cacheRead / (input + cacheRead + cacheWrite)`, excluding output Tokens.

#### Memory modes

The managed launcher defaults to `PI_MEMORY_NO_SEARCH=1` and `PI_MEMORY_QMD_UPDATE=off`. Markdown memory, daily logs, scratchpad, and recovery stay available, while qmd detection, its installation notice, and the `memory_search` tool are skipped. A deterministic integration patch is checked during setup and before every launch, so reinstalling managed packages needs no manual repair.

To opt into keyword, semantic, or deep search across every memory file, install and configure qmd separately, then add the following to `.env`:

```dotenv
PI_MEMORY_NO_SEARCH=0
PI_MEMORY_QMD_UPDATE=background
```

Run `npm run memory:configure` or restart the application afterward. qmd and its local models are not bundled with this repository.

### Profile, migration, and extension

```powershell
npm run profile:init
npm run profile:migrate
npm run profile:migrate -- --dry-run
npm run profile:migrate -- --force
npm run profile:migrate -- --from D:\old-pi\agent --skills-from D:\old-skills
```

Migration copies without deleting source data and removes absolute resource paths pointing outside the repository. Put future shared extensions in `resources/extensions/` and register them in its `package.json`; use the corresponding `resources/` directories for shared skills, prompts, and themes.

### Commands

```powershell
npm run setup           # Full install, build, and managed-profile validation
npm run profile:packages # Install missing or version-mismatched managed plugins
npm run memory:configure # Reapply the managed pi-memory lightweight integration
npm run dev             # Development server on 127.0.0.1:30141
npm run restart         # Windows/macOS: stop this project's old dev process and restart
npm run dev:lan         # Listen on the LAN; trusted networks only
npm run build           # Build the Pi Web production output
npm run start           # Start an existing local production build
npm run check           # Verify backend/frontend integration
npm run check:profile   # Install/load and verify managed plugins
npm run smoke:fresh-profile # Verify a clean temporary profile, then remove it
npm run typecheck       # Pi Web TypeScript check
npm run test:managed    # Profile, isolation, and search-contract tests
npm run smoke           # Smoke-test a running Web service
npm run smoke:isolation # Verify external skills/extensions remain isolated
npm run smoke:search -- "query" # Real configured SearXNG request
```

Except for `smoke:search`, validation does not make paid model requests.

### Automatic storage maintenance

Before `dev`, `restart`, `build`, or `start` launches Pi Web, the integrated launcher checks repository-local mutable storage. Maintenance runs only when no Pi Web process is listening on port 30141 and follows lossless defaults:

- `.next/dev`, `.next/cache`, and the managed npm cache are removed only after exceeding their size ceilings and are rebuilt on demand;
- Rewind repositories with many loose Git objects are compacted without dropping valid checkpoints;
- orphan Rewind checkpoints whose session no longer exists are removed after a seven-day grace period;
- sessions, memory, credentials, model configuration, installed plugins, and linked checkpoints are never automatically deleted.
- Manual cleanup: `node scripts/cleanup-cache.mjs` (dry-run by default; add `--apply` to execute) — clears npm/opengrep caches, moves expired sessions aside by age, and can shrink old sessions by replacing images with placeholders; deletions go to a trash directory first.

```powershell
npm run storage:status    # Report managed cache sizes without changing data
npm run storage:maintain  # Apply the normal thresholds immediately
npm run storage:clean     # Remove rebuildable caches and all orphan checkpoints
```

Maintenance refuses to modify a running service. Use `npm run restart` to reclaim space safely during a restart. `PI_STORAGE_*` variables in `.env` can tune the ceilings and grace period or disable automatic maintenance; `.env.example` documents the defaults.

### Upstream, updates, and licensing

- Pi baseline: `0.83.0`, commit `bb226f9c1f38d3c029156a690e97bbfc602336b9`
- Pi Web baseline: `0.8.4`, commit `c9b47e4543b11ce61e5c49c6bf02cea80aa975f6`

This integrated distribution does not auto-follow upstream. Update each vendored source tree deliberately, rerun setup, type checking, and managed tests, then update the baseline records above. Root integration code is MIT-licensed; vendored source and runtime plugins retain their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [SECURITY.md](SECURITY.md), and [CONTRIBUTING.md](CONTRIBUTING.md).
