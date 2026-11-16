// ─────────────────────────────────────────────────────────────────────────────
// 文件类型判断
// ─────────────────────────────────────────────────────────────────────────────

/** 获取文件名的扩展名（小写，不含点） */
export function getFileExtension(fileName?: string): string {
	if (!fileName) return "";
	const idx = fileName.lastIndexOf(".");
	return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

const IMAGE_EXTENSIONS = new Set(["bmp", "gif", "jpg", "jpeg", "png", "webp"]);
const PDF_EXTENSIONS = new Set(["pdf"]);

/** 支持上传的文件扩展名 */
export const SUPPORTED_UPLOAD_EXTENSIONS = new Set([
	"xls",
	"xlsx",
	"csv",
	"ppt",
	"pptx",
	"doc",
	"docx",
	"pdf",
	"bmp",
	"gif",
	"jpg",
	"jpeg",
	"png",
	"zip",
	"rar",
]);

export function isImageFile(fileName?: string): boolean {
	return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

export function isPdfFile(fileName?: string): boolean {
	return PDF_EXTENSIONS.has(getFileExtension(fileName));
}

/** 是否可直接在浏览器预览（图片或 PDF） */
export function isPreviewableFile(fileName?: string): boolean {
	return isImageFile(fileName) || isPdfFile(fileName);
}

// ─────────────────────────────────────────────────────────────────────────────
// 文件下载
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 下载 Blob 文件
 * @param blob 文件 Blob 对象
 * @param filename 下载的文件名
 */
export function downloadBlob(blob: Blob, filename: string) {
	// 创建下载链接
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();

	// 清理
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * 下载 Blob 文件（带时间戳）
 * @param blob 文件 Blob 对象
 * @param baseFilename 基础文件名（不含扩展名）
 * @param extension 文件扩展名（如 'xlsx', 'pdf'）
 */
export function downloadBlobWithTimestamp(blob: Blob, baseFilename: string, extension: string) {
	const timestamp = Date.now();
	const filename = `${baseFilename}_${timestamp}.${extension}`;
	downloadBlob(blob, filename);
}
