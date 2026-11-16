import type { ImportRecord } from "./types";

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串 (如 "1.23 MB")
 */
export function formatFileSize(bytes: number | undefined | null): string {
	if (bytes === undefined || bytes === null || typeof bytes !== "number") return "--";

	const units = ["B", "KB", "MB", "GB", "TB"];
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 下载文件
 * @param blob Blob 对象
 * @param filename 文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * 更新表格数据中的单条记录
 * @param tableData 原表格数据
 * @param updatedRecord 更新的记录
 * @returns 新的表格数据
 */
export function updateRecordInTable(
	tableData: ImportRecord[],
	updatedRecord: ImportRecord,
): ImportRecord[] {
	return tableData.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
}

/**
 * 验证日期范围格式
 * @param dateRange Form 表单中的日期范围
 * @returns 包含 startTime 和 endTime 的对象
 */
export function formatDateRange(dateRange: any): {
	startTime?: string;
	endTime?: string;
} {
	if (!dateRange || !Array.isArray(dateRange) || dateRange.length !== 2) {
		return {};
	}

	return {
		startTime: dateRange[0]?.format("YYYY-MM-DD HH:mm:ss"),
		endTime: dateRange[1]?.format("YYYY-MM-DD 23:59:59"),
	};
}
