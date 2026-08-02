#!/usr/bin/env node
/**
 * pi-agent-integrated 缓存/会话清理脚本
 *
 * 背景：会话 jsonl 内嵌上传图片的 base64（单张相机照片可达 5.7MB），
 * 每次 WebUI 加载会话要整体读出+序列化+前端解码渲染 → 加载变慢；
 * opengrep/npm 缓存占磁盘数 GB。
 *
 * 用法：node scripts/cleanup-cache.mjs [--apply] [--target all|sessions|strip-images|npm|opengrep|artifacts] [--days N] [--keep N] [--purge] [--yes]
 *
 *  --target        all (默认) | sessions(移走旧会话) | strip-images(旧会话图片替换为占位，保留对话文本) |
 *                  npm(清 cache/npm) | opengrep(清 AppData/Local/opengrep) | artifacts(清旧子代理产物)
 *  --days N        会话保留 N 天内的 (默认 7)；配合 --target sessions/strip-images
 *  --keep N        额外保留最近 N 个会话文件 (默认 0)
 *  --apply         真正执行；缺省为 dry-run 只预览
 *  --purge         同时删除回收目录中 30 天前的备份（默认只清理，不删回收站）
 *  --yes           跳过确认（--apply 时）
 *
 * 安全边界：永不触碰 agent/npm(扩展安装)、.pi-lens/tools、.pi-lens/bin、memory(记忆仓库)。
 * 所有删除 = 先移入回收目录 data/agent/tmp/session-trash/<时间戳>/，--purge 才清旧备份。
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "data");
const SESSIONS_DIR = path.join(DATA, "agent", "sessions");
const TRASH_ROOT = path.join(DATA, "agent", "tmp", "session-trash");
const NPM_CACHE = path.join(DATA, "cache", "npm");
const OPENGREP = path.join(DATA, "home", "AppData", "Local", "opengrep");
const CUTOFF_DAYS = () => Date.now() - opt.days * 86400_000;

const args = process.argv.slice(2);
const opt = {
  apply: args.includes("--apply"),
  purge: args.includes("--purge"),
  yes: args.includes("--yes"),
  days: 7,
  keep: 0,
  target: "all",
};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--days") opt.days = parseInt(args[++i], 10);
  if (args[i] === "--keep") opt.keep = parseInt(args[++i], 10);
  if (args[i] === "--target") opt.target = args[++i];
}
if (isNaN(opt.days) || opt.days < 0) opt.days = 7;
const TARGETS = ["all", "sessions", "strip-images", "npm", "opengrep", "artifacts"];
if (!TARGETS.includes(opt.target)) {
  console.error(`未知 --target: ${opt.target}（可选 ${TARGETS.join(" / ")}）`);
  process.exit(1);
}
const want = (t) => opt.target === "all" || opt.target === t;

const mode = opt.apply ? "执行" : "预览(dry-run)";
console.log(`[cleanup-cache] ${mode} | target=${opt.target} | 会话保留 ${opt.days} 天${opt.keep ? ` + 最近 ${opt.keep} 个` : ""}\n`);

let freed = 0;
const actions = [];
const note = (s) => console.log("  " + s);
const planned = (file, size, why) => {
  freed += size;
  actions.push({ file, why });
  note(`- ${why}: ${file} (${fmtSize(size)})`);
};
function fmtSize(n) {
  if (n >= 1 << 30) return (n / (1 << 30)).toFixed(2) + " GB";
  if (n >= 1 << 20) return (n / (1 << 20)).toFixed(1) + " MB";
  if (n >= 1 << 10) return (n / (1 << 10)).toFixed(0) + " KB";
  return n + " B";
}
function dirSize(p) {
  if (!fs.existsSync(p)) return 0;
  let total = 0;
  const st = fs.statSync(p);
  if (st.isFile()) return st.size;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    total += dirSize(path.join(p, e.name));
  }
  return total;
}
function moveToTrash(p) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(TRASH_ROOT, stamp, path.basename(p));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(p, dest);
  return dest;
}
function countImages(file) {
  let n = 0;
  let bytes = 0;
  try {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (const line of lines) {
      if (!line || !line.includes('"image"')) continue;
      let e;
      try { e = JSON.parse(line); } catch { continue; }
      if (e?.type !== "message" || !Array.isArray(e.message?.content)) continue;
      for (const b of e.message.content) {
        if (b?.type !== "image") continue;
        const data = typeof b.data === "string" ? b.data
          : b.source?.type === "base64" ? b.source.data : null;
        n++;
        if (data) {
          const pad = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
          bytes += Math.floor((data.length * 3) / 4) - pad;
        }
      }
    }
  } catch { /* skip */ }
  return { n, bytes };
}
function stripImagesInPlace(file) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let stripped = 0;
  let bytes = 0;
  const out = [];
  for (const line of lines) {
    if (!line || !line.includes('"image"')) { out.push(line); continue; }
    try {
      const e = JSON.parse(line);
      if (e?.type === "message" && Array.isArray(e.message?.content)
          && (e.message.role === "user" || e.message.role === "toolResult")) {
        const content = [];
        for (const b of e.message.content) {
          if (b?.type === "image") {
            const data = typeof b.data === "string" ? b.data
              : b.source?.type === "base64" ? b.source.data : null;
            const pad = data?.endsWith("==") ? 2 : data?.endsWith("=") ? 1 : 0;
            bytes += data ? Math.floor((data.length * 3) / 4) - pad : 0;
            stripped++;
            content.push({ type: "text", text: "[图片已由 cleanup-cache 替换为占位，原始数据已移入回收目录]" });
          } else content.push(b);
        }
        e.message.content = content;
        out.push(JSON.stringify(e));
        continue;
      }
    } catch { /* keep as-is */ }
    out.push(line);
  }
  if (stripped > 0) {
    fs.writeFileSync(file, out.join("\n"));
  }
  return { stripped, bytes };
}
function listSessionFiles() {
  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "subagent-artifacts") continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".jsonl")) files.push(p);
    }
  };
  walk(SESSIONS_DIR);
  return files;
}
function sessionInfo(file) {
  const st = fs.statSync(file);
  const { n, bytes } = countImages(file);
  return { file, size: st.size, mtime: st.mtimeMs, images: n, imgBytes: bytes };
}

// ---------- 1. sessions / strip-images ----------
if (want("sessions") || want("strip-images")) {
  console.log(`[会话] 目录 ${SESSIONS_DIR}`);
  const infos = listSessionFiles().map(sessionInfo).sort((a, b) => b.mtime - a.mtime);
  if (infos.length === 0) { console.log("  (无会话文件)"); }
  const cutoff = CUTOFF_DAYS();
  const keepIdx = Math.min(opt.keep, infos.length);
  const doomed = infos.filter((s, i) => s.mtime < cutoff && i >= keepIdx);
  if (want("sessions")) {
    for (const s of doomed) {
      planned(s.file, s.size, s.images > 0 ? `旧会话(含 ${s.images} 图)` : "旧会话");
    }
    if (doomed.length === 0) console.log(`  (最近 ${opt.days} 天内无会话需要移走)`);
  }
  if (want("strip-images")) {
    for (const s of doomed) {
      if (s.images === 0) continue;
      note(`- 图片瘦身: ${path.basename(s.file)} (${s.images} 图, ~${fmtSize(s.imgBytes)} 将替换为占位)`);
      freed += s.imgBytes;
    }
    const recent = infos.filter((s, i) => !(s.mtime < cutoff && i >= keepIdx));
    for (const s of recent) {
      if (s.images === 0) continue;
      note(`- 图片瘦身(最近窗口, 可选): ${path.basename(s.file)} (${s.images} 图, ~${fmtSize(s.imgBytes)})`);
    }
  }
  console.log();
}

// ---------- 2. npm cache ----------
if (want("npm")) {
  const sz = dirSize(NPM_CACHE);
  if (sz > 0) planned(NPM_CACHE, sz, "npm 缓存(_cacache/_npx/_logs)");
  else console.log("[npm] 缓存已空");
}

// ---------- 3. opengrep ----------
if (want("opengrep")) {
  const sz = dirSize(OPENGREP);
  if (sz > 0) planned(OPENGREP, sz, "opengrep 语义扫描缓存");
  else console.log("[opengrep] 缓存已空");
}

// ---------- 4. artifacts ----------
if (want("artifacts")) {
  const dirs = [];
  const findArtifactDirs = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "subagent-artifacts") dirs.push(p);
        else findArtifactDirs(p);
      }
    }
  };
  findArtifactDirs(SESSIONS_DIR);
  let cnt = 0;
  let sz = 0;
  const files = [];
  for (const d of dirs) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      const st = fs.statSync(p);
      if (st.mtimeMs < CUTOFF_DAYS()) { cnt++; sz += st.size; files.push(p); }
    }
  }
  if (cnt > 0) { note(`- ${cnt} 个旧子代理产物文件 (~${fmtSize(sz)})`); for (const f of files) planned(f, fs.statSync(f).size, "旧子代理产物"); }
  else console.log("[artifacts] 无旧产物");
}

// ---------- 汇总 ----------
console.log(`\n合计可释放: ${fmtSize(freed)}`);
if (!opt.apply) {
  console.log("\n以上为预览。加 --apply 真正执行（删除前先移入回收目录）。");
  process.exit(0);
}
if (!opt.yes) {
  console.log(`\n确认执行 ${actions.length} 项清理？输入 yes 继续:`);
  const readline = (await import("node:readline")).default;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise((r) => rl.question("> ", r));
  rl.close();
  if (ans.trim().toLowerCase() !== "yes") { console.log("已取消。"); process.exit(1); }
}

for (const a of actions) {
  try {
    if (a.file.includes("opengrep") || a.file === NPM_CACHE) {
      fs.rmSync(a.file, { recursive: true, force: true });
      console.log(`已删除 ${a.file}`);
    } else {
      const dest = moveToTrash(a.file);
      console.log(`已移入回收目录 ${dest}`);
    }
  } catch (err) {
    console.error(`失败: ${a.file}: ${err.message}`);
  }
}

if (want("strip-images")) {
  const infos = listSessionFiles().map(sessionInfo).sort((a, b) => b.mtime - a.mtime);
  const keepIdx = Math.min(opt.keep, infos.length);
  const cutoff = CUTOFF_DAYS();
  for (const s of infos) {
    if (s.images === 0) continue;
    const i = infos.indexOf(s);
    if (!(s.mtime < cutoff && i >= keepIdx)) continue;
    const backup = moveToTrash(s.file);
    const { stripped, bytes } = stripImagesInPlace(s.file);
    console.log(`图片瘦身完成: ${path.basename(s.file)} (${stripped} 图, ~${fmtSize(bytes)}, 原备份 ${backup})`);
  }
}

if (opt.purge) {
  const purged = [];
  const old = Date.now() - 30 * 86400_000;
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        const st = fs.statSync(p);
        if (st.mtimeMs < old) { fs.rmSync(p, { recursive: true, force: true }); purged.push(p); }
        else walk(p);
      }
    }
  };
  walk(TRASH_ROOT);
  console.log(purged.length ? `回收目录已清旧备份: ${purged.join(", ")}` : "回收目录无 30 天前备份");
}

console.log(`\n完成。释放 ${fmtSize(freed)}。注意：当前正在使用的会话若被移走会丢失历史——建议先退出 pi 再执行。`);
