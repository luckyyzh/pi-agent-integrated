export const MAX_ATTACHED_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHED_IMAGES = 10;

/** 上传时自动压缩：长边超过此像素的 JPEG 缩到此边长（相机照片主场景，视觉模型输入上限 ~1344px，1600 无损）。 */
export const MAX_IMAGE_EDGE_PX = 1600;
/** JPEG 重编码质量：避免伪影糊掉边缘/小字。 */
export const IMAGE_JPEG_QUALITY = 0.85;

export interface Base64ImageAttachment {
	data: string;
	mimeType: string;
}

function isBase64DataChar(code: number): boolean {
	return (
		(code >= 0x41 && code <= 0x5a) ||
		(code >= 0x61 && code <= 0x7a) ||
		(code >= 0x30 && code <= 0x39) ||
		code === 0x2b ||
		code === 0x2f
	);
}

export function getBase64DecodedByteLength(data: string): number | null {
	if (!data || data.length % 4 !== 0) return null;
	const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
	const dataEnd = data.length - padding;
	for (let index = 0; index < dataEnd; index += 1) {
		if (!isBase64DataChar(data.charCodeAt(index))) return null;
	}
	for (let index = dataEnd; index < data.length; index += 1) {
		if (data[index] !== "=") return null;
	}
	return (data.length / 4) * 3 - padding;
}

export function isBase64ImageWithinLimits(
	value: unknown,
): value is Base64ImageAttachment {
	if (!value || typeof value !== "object") return false;
	const image = value as Partial<Base64ImageAttachment>;
	if (
		typeof image.data !== "string" ||
		typeof image.mimeType !== "string" ||
		!image.mimeType.startsWith("image/")
	) {
		return false;
	}
	const bytes = getBase64DecodedByteLength(image.data);
	return bytes !== null && bytes <= MAX_ATTACHED_IMAGE_BYTES;
}

/**
 * 上传前压缩：JPEG 和 PNG 且长边超过 MAX_IMAGE_EDGE_PX 时缩放并统一转 JPEG。
 * PNG 截图（代码编辑器/UI）通常无透明通道，转 JPEG 体积大幅减小。
 * WebP/GIF 原样返回（WebP 已经高效；GIF 可能是动画）。
 * 重编码无收益（更小或失败）时退回原文件。
 */
export async function compressImageFile(file: File): Promise<File> {
	// 仅压缩 JPEG 和 PNG（最常见的截图/照片格式）
	if (
		!file.type ||
		!(file.type.startsWith("image/jpeg") || file.type.startsWith("image/png"))
	) {
		return file;
	}
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return file; // 解码失败退化为原文件
	}
	try {
		const edge = Math.max(bitmap.width, bitmap.height);
		if (edge <= MAX_IMAGE_EDGE_PX) return file; // 本就不大，避免无谓重编码
		const scale = MAX_IMAGE_EDGE_PX / edge;
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return file;
		ctx.drawImage(bitmap, 0, 0, width, height);
		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/jpeg", IMAGE_JPEG_QUALITY),
		);
		if (!blob || blob.size >= file.size) return file; // 重编码无收益则用原文件
		return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
			type: "image/jpeg",
		});
	} finally {
		bitmap.close();
	}
}

/** Return an API-safe error for prompt, steering, and follow-up image arrays. */
export function validateAgentImages(value: unknown): string | null {
	if (value === undefined) return null;
	if (!Array.isArray(value)) return "images must be an array";
	if (value.length > MAX_ATTACHED_IMAGES) {
		return `A message can include at most ${MAX_ATTACHED_IMAGES} images`;
	}
	for (const image of value) {
		if (
			!image ||
			typeof image !== "object" ||
			(image as { type?: unknown }).type !== "image"
		) {
			return "Each attachment must be an image";
		}
		if (!isBase64ImageWithinLimits(image)) {
			return `Each image must be valid base64 image data of ${MAX_ATTACHED_IMAGE_BYTES / (1024 * 1024)}MB or smaller`;
		}
	}
	return null;
}
