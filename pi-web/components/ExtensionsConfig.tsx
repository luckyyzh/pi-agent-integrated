"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useI18n } from "@/hooks/useI18n";
import type { ExtensionInfo, ExtensionsResponse } from "@/lib/api-types";

function shortenPath(path: string): string {
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}

function statusColor(status: ExtensionInfo["status"]): string {
  if (status === "enabled") return "var(--accent)";
  if (status === "blocked") return "#d97706";
  return "var(--text-dim)";
}

function statusLabel(status: ExtensionInfo["status"], t: ReturnType<typeof useI18n>["t"]): string {
  if (status === "enabled") return t("extensions.enabled");
  if (status === "blocked") return t("extensions.blocked");
  return t("extensions.disabled");
}

function scopeLabel(scope: ExtensionInfo["scope"], t: ReturnType<typeof useI18n>["t"]): string {
  if (scope === "project") return t("extensions.project");
  if (scope === "builtin") return t("extensions.builtin");
  return t("extensions.app");
}

function extensionKey(extension: ExtensionInfo): string {
  return `${extension.scope}:${extension.path}`;
}

export function ExtensionsConfig({ cwd, onCloseAction }: { cwd: string; onCloseAction: () => void }) {
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const [data, setData] = useState<ExtensionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const loadExtensions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/extensions?cwd=${encodeURIComponent(cwd)}`);
      const next = (await response.json()) as ExtensionsResponse & { error?: string };
      if (!response.ok || next.error) throw new Error(next.error ?? `HTTP ${response.status}`);
      setData(next);
      setSelected((current) => (
        current && next.extensions.some((extension) => extensionKey(extension) === current)
          ? current
          : next.extensions[0] ? extensionKey(next.extensions[0]) : null
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [cwd]);

  useEffect(() => {
    void loadExtensions();
  }, [loadExtensions]);

  const extensions = useMemo(() => data?.extensions ?? [], [data?.extensions]);
  const selectedExtension = extensions.find((extension) => extensionKey(extension) === selected) ?? null;
  const enabledCount = extensions.filter((extension) => extension.status === "enabled").length;
  const blockedCount = extensions.filter((extension) => extension.status === "blocked").length;
  const disabledCount = extensions.filter((extension) => extension.status === "disabled").length;
  const hasBlockedProjectExtensions = blockedCount > 0 && !data?.projectResourcesLoaded;
  const groupedExtensions = useMemo(() => {
    const groups: Array<{ scope: ExtensionInfo["scope"]; extensions: ExtensionInfo[] }> = [];
    for (const scope of ["project", "builtin", "global"] as const) {
      const scoped = extensions.filter((extension) => extension.scope === scope);
      if (scoped.length > 0) groups.push({ scope, extensions: scoped });
    }
    return groups;
  }, [extensions]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCloseAction();
      }}
    >
      <div
        style={{
          width: isMobile ? "calc(100vw - 16px)" : 860,
          maxWidth: "calc(100vw - 16px)",
          height: isMobile ? "calc(100dvh - 16px)" : "76vh",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{t("common.extensions")}</span>
            <code style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shortenPath(cwd)}
            </code>
          </div>
          <button type="button" onClick={onCloseAction} aria-label={t("i18n.close")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}>
            ×
          </button>
        </div>

        {hasBlockedProjectExtensions && (
          <div style={{ padding: "8px 18px", borderBottom: "1px solid var(--border)", color: "#d97706", fontSize: 11 }}>
            {t("extensions.projectResourcesBlocked")}
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden" }}>
          <div style={{ width: isMobile ? "100%" : 245, maxHeight: isMobile ? "40vh" : undefined, borderRight: isMobile ? "none" : "1px solid var(--border)", borderBottom: isMobile ? "1px solid var(--border)" : "none", display: "flex", flexDirection: "column", flexShrink: 0, background: "var(--bg-panel)" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              {loading ? (
                <div style={{ padding: "10px 8px", fontSize: 12, color: "var(--text-muted)" }}>{t("i18n.loading")}</div>
              ) : error ? (
                <div style={{ padding: "10px 8px", fontSize: 11, color: "#ef4444" }}>{error}</div>
              ) : groupedExtensions.length === 0 ? (
                <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--text-dim)" }}>{t("extensions.noExtensions")}</div>
              ) : (
                groupedExtensions.map((group) => (
                  <div key={group.scope} style={{ marginBottom: 6 }}>
                    <div style={{ padding: "4px 8px 3px", fontSize: 10, fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase" }}>
                      {scopeLabel(group.scope, t)}
                    </div>
                    {group.extensions.map((extension) => {
                      const key = extensionKey(extension);
                      const isSelected = selected === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setSelected(key)}
                          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px", borderRadius: 5, cursor: "pointer", background: isSelected ? "var(--bg-selected)" : "none" }}
                          onMouseEnter={(event) => { if (!isSelected) event.currentTarget.style.background = "var(--bg-hover)"; }}
                          onMouseLeave={(event) => { if (!isSelected) event.currentTarget.style.background = "none"; }}
                        >
                          <span style={{ flexShrink: 0, width: 7, height: 7, borderRadius: "50%", background: statusColor(extension.status) }} />
                          <span style={{ minWidth: 0, flex: 1, fontSize: 12, fontWeight: isSelected ? 600 : 400, color: extension.status === "disabled" ? "var(--text-dim)" : "var(--text)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {extension.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {selectedExtension ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(selectedExtension.status) }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-mono)" }}>{selectedExtension.name}</span>
                  <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "rgba(120,120,120,0.12)", color: "var(--text-dim)" }}>{scopeLabel(selectedExtension.scope, t)}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 130px) minmax(0, 1fr)", gap: "9px 14px", fontSize: 12, lineHeight: 1.45 }}>
                  <div style={{ color: "var(--text-dim)" }}>{t("extensions.status")}</div>
                  <div style={{ color: statusColor(selectedExtension.status) }}>{statusLabel(selectedExtension.status, t)}</div>
                  <div style={{ color: "var(--text-dim)" }}>{t("extensions.source")}</div>
                  <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{selectedExtension.source}</div>
                  <div style={{ color: "var(--text-dim)" }}>{t("extensions.path")}</div>
                  <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", overflowWrap: "anywhere" }}>{shortenPath(selectedExtension.path)}</div>
                </div>
              </div>
            ) : !loading && !error ? (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 13 }}>{t("extensions.noExtensions")}</div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ minWidth: 0, flex: 1, fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data ? `${extensions.length} ${t("extensions.total")} · ${enabledCount} ${t("extensions.enabled")} · ${disabledCount} ${t("extensions.disabled")} · ${blockedCount} ${t("extensions.blocked")}${data.diagnostics.length ? ` · ${data.diagnostics.length} ${t("extensions.diagnostics")}` : ""}` : ""}
          </div>
          <button type="button" onClick={() => void loadExtensions()} disabled={loading} style={{ padding: "6px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, fontSize: 12 }}>{t("i18n.refresh")}</button>
          <button type="button" onClick={onCloseAction} style={{ padding: "6px 12px", background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-muted)", cursor: "pointer", fontSize: 12 }}>{t("i18n.close")}</button>
        </div>
      </div>
    </div>
  );
}
