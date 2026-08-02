"use client";

import { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useI18n } from "@/hooks/useI18n";

interface VisionConfigFile {
	backend?: "ollama" | "openai";
	ollama?: { host?: string; model?: string };
	openai?: { baseUrl?: string; apiKey?: string; model?: string };
}

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

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
			<label
				style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}
			>
				{label}
			</label>
			{children}
		</div>
	);
}

function TextInput({
	value,
	onChange,
	placeholder,
	mono,
	type,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	mono?: boolean;
	type?: string;
}) {
	return (
		<input
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			type={type ?? "text"}
			style={{
				...inputStyle,
				fontFamily: mono ? "var(--font-mono)" : "inherit",
			}}
		/>
	);
}

const saveButtonStyle = (primary: boolean): React.CSSProperties => ({
	padding: "6px 14px",
	borderRadius: 6,
	fontSize: 12,
	fontWeight: 600,
	cursor: "pointer",
	border: "1px solid var(--border)",
	background: primary ? "var(--accent)" : "var(--bg-panel)",
	color: primary ? "#fff" : "var(--text)",
});

/**
 * Vision backend settings (backend picker + fields + save), without modal
 * chrome. Embedded in the Models config panel and reused by the standalone
 * modal below.
 */
export function VisionConfigContent() {
	const { t } = useI18n();
	const [config, setConfig] = useState<VisionConfigFile>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [savedOk, setSavedOk] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		setSaveError(null);
		try {
			const res = await fetch("/api/vision-config");
			const data = (await res.json()) as {
				config?: VisionConfigFile;
				error?: string;
			};
			if (!res.ok || data.error)
				throw new Error(data.error ?? `HTTP ${res.status}`);
			setConfig(data.config ?? {});
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : String(e));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const save = useCallback(async () => {
		setSaving(true);
		setSaveError(null);
		setSavedOk(false);
		try {
			const res = await fetch("/api/vision-config", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(config),
			});
			const data = (await res.json()) as { success?: boolean; error?: string };
			if (!res.ok || !data.success)
				throw new Error(data.error ?? `HTTP ${res.status}`);
			setSavedOk(true);
		} catch (e) {
			setSaveError(e instanceof Error ? e.message : String(e));
		} finally {
			setSaving(false);
		}
	}, [config]);

	const backend = config.backend ?? "ollama";
	const ollama = config.ollama ?? {};
	const openai = config.openai ?? {};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: 14,
				padding: "14px 18px",
				flex: 1,
				overflow: "auto",
			}}
		>
			{loading ? (
				<div style={{ fontSize: 12, color: "var(--text-muted)" }}>
					{t("vision.loading")}
				</div>
			) : (
				<>
					{/* Backend picker */}
					<div style={{ display: "flex", gap: 8 }}>
						{(["ollama", "openai"] as const).map((b) => (
							<button
								key={b}
								onClick={() => setConfig((prev) => ({ ...prev, backend: b }))}
								style={{
									flex: 1,
									padding: "10px 12px",
									borderRadius: 8,
									cursor: "pointer",
									textAlign: "left",
									border: `1px solid ${backend === b ? "var(--accent)" : "var(--border)"}`,
									background:
										backend === b
											? "color-mix(in srgb, var(--accent) 8%, var(--bg-panel))"
											: "var(--bg-panel)",
									display: "flex",
									flexDirection: "column",
									gap: 3,
								}}
							>
								<span
									style={{
										fontSize: 13,
										fontWeight: 600,
										color: "var(--text)",
									}}
								>
									{b === "ollama"
										? t("vision.backend.ollama")
										: t("vision.backend.openai")}
								</span>
								<span
									style={{
										fontSize: 11,
										color: "var(--text-muted)",
										lineHeight: 1.4,
									}}
								>
									{b === "ollama"
										? t("vision.backend.ollamaHint")
										: t("vision.backend.openaiHint")}
								</span>
							</button>
						))}
					</div>

					{/* Ollama settings */}
					{backend === "ollama" && (
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<Field label={t("vision.ollama.host")}>
								<TextInput
									value={ollama.host ?? ""}
									onChange={(v) =>
										setConfig((prev) => ({
											...prev,
											ollama: { ...prev.ollama, host: v },
										}))
									}
									placeholder={t("vision.ollama.hostPlaceholder")}
									mono
								/>
							</Field>
							<Field label={t("vision.ollama.model")}>
								<TextInput
									value={ollama.model ?? ""}
									onChange={(v) =>
										setConfig((prev) => ({
											...prev,
											ollama: { ...prev.ollama, model: v },
										}))
									}
									placeholder={t("vision.ollama.modelPlaceholder")}
									mono
								/>
							</Field>
						</div>
					)}

					{/* OpenAI-compatible settings */}
					{backend === "openai" && (
						<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
							<Field label={t("vision.openai.baseUrl")}>
								<TextInput
									value={openai.baseUrl ?? ""}
									onChange={(v) =>
										setConfig((prev) => ({
											...prev,
											openai: { ...prev.openai, baseUrl: v },
										}))
									}
									placeholder={t("vision.openai.baseUrlPlaceholder")}
									mono
								/>
							</Field>
							<Field label={t("vision.openai.apiKey")}>
								<TextInput
									value={openai.apiKey ?? ""}
									onChange={(v) =>
										setConfig((prev) => ({
											...prev,
											openai: { ...prev.openai, apiKey: v },
										}))
									}
									type="password"
									mono
								/>
							</Field>
							<Field label={t("vision.openai.model")}>
								<TextInput
									value={openai.model ?? ""}
									onChange={(v) =>
										setConfig((prev) => ({
											...prev,
											openai: { ...prev.openai, model: v },
										}))
									}
									placeholder={t("vision.openai.modelPlaceholder")}
									mono
								/>
							</Field>
						</div>
					)}

					<div
						style={{
							fontSize: 11,
							color: "var(--text-muted)",
							lineHeight: 1.5,
							borderTop: "1px solid var(--border)",
							paddingTop: 10,
						}}
					>
						{t("vision.effective")}
					</div>
				</>
			)}

			{saveError && (
				<div style={{ fontSize: 11, color: "var(--danger, #e5484d)" }}>
					{t("vision.loadFailed")}: {saveError}
				</div>
			)}
			{savedOk && (
				<div style={{ fontSize: 11, color: "var(--success, #30a46c)" }}>
					{t("vision.saved")}
				</div>
			)}

			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
					gap: 8,
					marginTop: "auto",
				}}
			>
				<button
					onClick={save}
					disabled={saving || loading}
					style={{
						...saveButtonStyle(true),
						opacity: saving || loading ? 0.6 : 1,
					}}
				>
					{t("vision.save")}
				</button>
			</div>
		</div>
	);
}

/** Standalone modal wrapper (kept for backward compatibility). */
export function VisionConfig({ onClose }: { onClose: () => void }) {
	const isMobile = useIsMobile();
	const { t } = useI18n();
	const [configPath, setConfigPath] = useState("");

	useEffect(() => {
		fetch("/api/vision-config")
			.then((r) => r.json())
			.then((d: { path?: string }) => setConfigPath(d.path ?? ""))
			.catch(() => {});
	}, []);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.45)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
				padding: 8,
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					width: isMobile ? "calc(100vw - 16px)" : 560,
					maxWidth: "calc(100vw - 16px)",
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
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "12px 18px",
						borderBottom: "1px solid var(--border)",
						flexShrink: 0,
					}}
				>
					<div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
						<span
							style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
						>
							{t("vision.title")}
						</span>
						<code
							style={{
								fontSize: 11,
								color: "var(--text-muted)",
								fontFamily: "var(--font-mono)",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{configPath || "data/agent/vision.json"}
						</code>
					</div>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							color: "var(--text-muted)",
							cursor: "pointer",
							fontSize: 20,
							lineHeight: 1,
							padding: "2px 6px",
						}}
					>
						×
					</button>
				</div>
				<VisionConfigContent />
			</div>
		</div>
	);
}
