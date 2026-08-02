"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useI18n } from "@/hooks/useI18n";

interface McpServerEntry {
  command?: string;
  args?: string[];
  socket?: string;
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
  auth?: "oauth" | "bearer" | false;
  bearerToken?: string;
  bearerTokenEnv?: string;
  lifecycle?: "keep-alive" | "lazy" | "lazy-keep-alive" | "eager";
  idleTimeout?: number;
  requestTimeoutMs?: number;
  exposeResources?: boolean;
  directTools?: boolean | string[];
  includeTools?: string[];
  excludeTools?: string[];
  debug?: boolean;
  trace?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

interface McpConfigFile {
  mcpServers: Record<string, McpServerEntry>;
  settings?: Record<string, unknown>;
  imports?: string[];
}

type TransportKind = "stdio" | "http";

function entrySummary(entry: McpServerEntry): string {
  if (entry.url) {
    try {
      return new URL(entry.url).host || entry.url;
    } catch {
      return entry.url;
    }
  }
  if (entry.socket) return entry.socket;
  const cmd = entry.command ?? "";
  const args = entry.args?.length ? ` ${entry.args.join(" ")}` : "";
  return `${cmd}${args}`;
}

function transportOf(entry: McpServerEntry): TransportKind {
  return entry.url ? "http" : "stdio";
}

function envToRows(env?: Record<string, string>): Array<{ key: string; value: string }> {
  return Object.entries(env ?? {}).map(([key, value]) => ({ key, value }));
}

function rowsToEnv(rows: Array<{ key: string; value: string }>): Record<string, string> {
  const env: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) env[key] = row.value;
  }
  return env;
}

// ── Form helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: "6px 9px",
  background: "var(--bg-panel)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  color: "var(--text)",
  fontSize: 12,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputStyle, fontFamily: mono ? "var(--font-mono)" : "inherit" }}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      spellCheck={false}
      style={{
        ...inputStyle,
        resize: "vertical",
        lineHeight: 1.5,
        fontFamily: mono ? "var(--font-mono)" : "inherit",
      }}
    />
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  const { t } = useI18n();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, color: value ? "var(--text)" : "var(--text-dim)" }}>
      <option value="">— {t("i18n.default")} —</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function buttonStyle(disabled?: boolean, danger?: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    background: danger ? "rgba(239,68,68,0.08)" : "none",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: danger ? "#ef4444" : "var(--text-muted)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12,
    opacity: disabled ? 0.5 : 1,
  };
}

// ── Env row editor ───────────────────────────────────────────────────────────

function EnvEditor({ rows, onChange }: { rows: Array<{ key: string; value: string }>; onChange: (rows: Array<{ key: string; value: string }>) => void }) {
  const { t } = useI18n();
  const update = (index: number, patch: Partial<{ key: string; value: string }>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 6 }}>
          <input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="NAME"
            spellCheck={false}
            style={{ ...inputStyle, width: "38%", fontFamily: "var(--font-mono)" }}
          />
          <input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value"
            spellCheck={false}
            style={{ ...inputStyle, flex: 1, fontFamily: "var(--font-mono)" }}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            title={t("i18n.remove")}
            style={{ ...buttonStyle(false, true), padding: "0 9px", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { key: "", value: "" }])} style={{ ...buttonStyle(false), alignSelf: "flex-start" }}>
        + {t("mcp.addEnv")}
      </button>
    </div>
  );
}

// ── Server detail form ───────────────────────────────────────────────────────

function ServerDetail({
  name,
  entry,
  onRename,
  onChange,
  onDelete,
}: {
  name: string;
  entry: McpServerEntry;
  onRename: (newName: string) => void;
  onChange: (entry: McpServerEntry) => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const transport = transportOf(entry);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(entry, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [headersDraft, setHeadersDraft] = useState(() => JSON.stringify(entry.headers ?? {}, null, 2));
  const [headersInvalid, setHeadersInvalid] = useState(false);

  const patch = (p: Partial<McpServerEntry>) => onChange({ ...entry, ...p });
  const num = (v: string): number | undefined => (v.trim() === "" ? undefined : Number(v));

  const applyJson = () => {
    try {
      const parsed = JSON.parse(rawJson) as McpServerEntry;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object expected");
      setJsonError(null);
      onChange(parsed);
      setAdvancedOpen(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : String(e));
    }
  };

  const setTransport = (kind: TransportKind) => {
    if (kind === transport) return;
    if (kind === "stdio") {
      const rest: McpServerEntry = { ...entry };
      delete rest.url;
      delete rest.headers;
      delete rest.auth;
      delete rest.bearerToken;
      delete rest.bearerTokenEnv;
      onChange(rest);
    } else {
      onChange({ ...entry, url: entry.url ?? "https://example.com/mcp" });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 680 }}>
      {/* Header row: name + enable + delete */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Field label={t("mcp.serverName")}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={name}
              onChange={(e) => onRename(e.target.value)}
              spellCheck={false}
              style={{ ...inputStyle, width: 200, fontFamily: "var(--font-mono)", fontWeight: 600 }}
            />
            <button type="button" onClick={onDelete} style={{ ...buttonStyle(false, true), flexShrink: 0 }}>
              {t("i18n.remove")}
            </button>
          </div>
        </Field>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{t("mcp.enabled")}</span>
          <input
            type="checkbox"
            checked={!entry.disabled}
            onChange={(e) => patch({ disabled: !e.target.checked })}
            style={{ width: 14, height: 14, accentColor: "var(--accent)", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Transport */}
      <Field label={t("mcp.transport")}>
        <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden", alignSelf: "flex-start" }}>
          {(["stdio", "http"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setTransport(kind)}
              style={{
                padding: "5px 14px",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                background: transport === kind ? "var(--accent)" : "transparent",
                color: transport === kind ? "#fff" : "var(--text-muted)",
              }}
            >
              {kind.toUpperCase()}
            </button>
          ))}
        </div>
      </Field>

      {transport === "stdio" ? (
        <>
          <Field label={t("mcp.command")}>
            <TextInput value={entry.command ?? ""} onChange={(v) => patch({ command: v || undefined })} placeholder="npx" mono />
          </Field>
          <Field label={t("mcp.args")}>
            <TextArea
              value={(entry.args ?? []).join("\n")}
              onChange={(v) => patch({ args: v.split("\n").map((s) => s.trim()).filter(Boolean) })}
              rows={4}
              mono
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={t("mcp.url")}>
            <TextInput value={entry.url ?? ""} onChange={(v) => patch({ url: v || undefined })} placeholder="https://…/mcp" mono />
          </Field>
          <Field label={t("mcp.headers")}>
            <TextArea
              value={headersDraft}
              onChange={(v) => {
                setHeadersDraft(v);
                try {
                  const parsed = JSON.parse(v) as Record<string, string>;
                  setHeadersInvalid(false);
                  patch({ headers: parsed });
                } catch {
                  setHeadersInvalid(true);
                }
              }}
              rows={3}
              mono
            />
            {headersInvalid && <div style={{ fontSize: 11, color: "#ef4444" }}>{t("mcp.invalidJson")}</div>}
          </Field>
          <Field label={t("mcp.auth")}>
            <Select
              value={entry.auth === undefined ? "" : String(entry.auth)}
              onChange={(v) => {
                if (v === "false") patch({ auth: false });
                else if (v === "") patch({ auth: undefined });
                else patch({ auth: v as "oauth" | "bearer" });
              }}
              options={["oauth", "bearer", "false"]}
            />
          </Field>
          {entry.auth === "bearer" && (
            <Field label={t("mcp.bearerToken")}>
              <TextInput value={entry.bearerToken ?? ""} onChange={(v) => patch({ bearerToken: v || undefined })} mono />
            </Field>
          )}
        </>
      )}

      {/* env */}
      <EnvEditor rows={envToRows(entry.env)} onChange={(rows) => patch({ env: rowsToEnv(rows) })} />

      {/* Optional common fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
        <Field label={t("mcp.cwd")}>
          <TextInput value={entry.cwd ?? ""} onChange={(v) => patch({ cwd: v || undefined })} placeholder="${PI_AGENT_APP_ROOT}" mono />
        </Field>
        <Field label={t("mcp.lifecycle")}>
          <Select value={entry.lifecycle ?? ""} onChange={(v) => patch({ lifecycle: (v || undefined) as McpServerEntry["lifecycle"] })} options={["lazy", "keep-alive", "lazy-keep-alive", "eager"]} />
        </Field>
        <Field label={t("mcp.idleTimeout")}>
          <NumInput value={entry.idleTimeout === undefined ? "" : String(entry.idleTimeout)} onChange={(v) => patch({ idleTimeout: num(v) })} placeholder="5" />
        </Field>
        <Field label={t("mcp.requestTimeout")}>
          <NumInput value={entry.requestTimeoutMs === undefined ? "" : String(entry.requestTimeoutMs)} onChange={(v) => patch({ requestTimeoutMs: num(v) })} placeholder="120000" />
        </Field>
      </div>

      {/* Advanced raw JSON */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          style={{ ...buttonStyle(false), alignSelf: "flex-start" }}
        >
          {advancedOpen ? "▾ " : "▸ "} {t("mcp.advanced")}
        </button>
        {advancedOpen && (
          <>
            <TextArea value={rawJson} onChange={(v) => { setRawJson(v); setJsonError(null); }} rows={12} mono />
            {jsonError && <div style={{ fontSize: 11, color: "#ef4444" }}>{t("mcp.invalidJson")}: {jsonError}</div>}
            <div>
              <button type="button" onClick={applyJson} style={{ ...buttonStyle(false), background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>
                {t("mcp.applyJson")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function McpConfig({ onClose }: { onClose: () => void }) {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const [config, setConfig] = useState<McpConfigFile>({ mcpServers: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [configPath, setConfigPath] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/mcp");
      const data = (await res.json()) as { config?: McpConfigFile; path?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      const next = data.config ?? { mcpServers: {} };
      setConfig(next);
      setConfigPath(data.path ?? "");
      setSelected((current) => (current && next.mcpServers[current] ? current : Object.keys(next.mcpServers)[0] ?? null));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateServer = useCallback((name: string, entry: McpServerEntry) => {
    setConfig((prev) => ({ ...prev, mcpServers: { ...prev.mcpServers, [name]: entry } }));
  }, []);

  const renameServer = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setConfig((prev) => {
      if (prev.mcpServers[trimmed]) return prev; // 同名已存在
      const mcpServers = { ...prev.mcpServers };
      mcpServers[trimmed] = mcpServers[oldName];
      delete mcpServers[oldName];
      return { ...prev, mcpServers };
    });
    setSelected(trimmed);
  }, []);

  const deleteServer = useCallback((name: string) => {
    setConfig((prev) => {
      const mcpServers = { ...prev.mcpServers };
      delete mcpServers[name];
      return { ...prev, mcpServers };
    });
    setSelected((current) => {
      if (current !== name) return current;
      const remaining = Object.keys(config.mcpServers).filter((k) => k !== name);
      return remaining[0] ?? null;
    });
  }, [config.mcpServers]);

  const addServer = useCallback(() => {
    let finalName = "new-server";
    let n = 1;
    while (config.mcpServers[finalName]) finalName = `new-server-${n++}`;
    setConfig((prev) => ({ ...prev, mcpServers: { ...prev.mcpServers, [finalName]: {} } }));
    setSelected(finalName);
  }, [config.mcpServers]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);
    try {
      const res = await fetch("/api/mcp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || d.error) setSaveError(d.error ?? `HTTP ${res.status}`);
      else {
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2000);
      }
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  }, [config]);

  const names = useMemo(() => Object.entries(config.mcpServers), [config.mcpServers]);
  const selectedEntry = selected ? config.mcpServers[selected] : undefined;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: isMobile ? "calc(100vw - 16px)" : 860,
          maxWidth: "calc(100vw - 16px)",
          height: isMobile ? "calc(100dvh - 16px)" : "78vh",
          maxHeight: "calc(100dvh - 16px)",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{t("common.mcp")}</span>
            <code style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {configPath || "data/agent/mcp.json"}
            </code>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>
          {/* Left: server list */}
          <div
            style={{
              width: isMobile ? "100%" : 230,
              maxHeight: isMobile ? "40vh" : undefined,
              borderRight: isMobile ? "none" : "1px solid var(--border)",
              borderBottom: isMobile ? "1px solid var(--border)" : "none",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              background: "var(--bg-panel)",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              {loading ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--text-muted)" }}>{t("i18n.loading")}</div>
              ) : names.length === 0 ? (
                <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--text-dim)" }}>{t("mcp.noServers")}</div>
              ) : (
                names.map(([sName, sEntry]) => {
                  const isSelected = selected === sName;
                  return (
                    <div
                      key={sName}
                      onClick={() => setSelected(sName)}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 8px", borderRadius: 5, cursor: "pointer", background: isSelected ? "var(--bg-selected)" : "none" }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "none";
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: sEntry.disabled ? "var(--text-dim)" : "var(--accent)",
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? 600 : 400,
                            color: "var(--text)",
                            fontFamily: "var(--font-mono)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sName}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-dim)",
                            fontFamily: "var(--font-mono)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginTop: 2,
                          }}
                          title={entrySummary(sEntry)}
                        >
                          {entrySummary(sEntry) || (sEntry.disabled ? t("i18n.disabled") : "—")}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Add server */}
            <div style={{ borderTop: "1px solid var(--border)", padding: "8px 6px" }}>
              <button
                type="button"
                onClick={addServer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  width: "100%",
                  padding: "6px 0",
                  background: "none",
                  border: "1px dashed var(--border)",
                  borderRadius: 5,
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                + {t("mcp.addServer")}
              </button>
            </div>
          </div>

          {/* Right: detail */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {loading ? null : selected && selectedEntry ? (
              <ServerDetail
                key={selected}
                name={selected}
                entry={selectedEntry}
                onRename={(n) => renameServer(selected, n)}
                onChange={(entry) => updateServer(selected, entry)}
                onDelete={() => deleteServer(selected)}
              />
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 13 }}>
                {t("mcp.selectServer")}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 18px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1, fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {t("mcp.restartHint")}
          </div>
          {saveError && <span style={{ fontSize: 12, color: "#f87171", flexShrink: 0 }}>{saveError}</span>}
          <button onClick={onClose} style={buttonStyle(false)}>
            {t("i18n.close")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || savedOk}
            style={{
              position: "relative",
              padding: "6px 16px",
              minWidth: 92,
              background: savedOk ? "#16a34a" : saving ? "var(--bg-panel)" : "var(--accent)",
              border: "none",
              borderRadius: 6,
              color: savedOk ? "#fff" : saving ? "var(--text-muted)" : "#fff",
              cursor: saving || savedOk ? "default" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {savedOk && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            <span>{savedOk ? t("i18n.saved") : saving ? t("i18n.saving") : t("i18n.save")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
