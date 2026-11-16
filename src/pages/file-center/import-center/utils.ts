import type { ImportTaskListItem } from "#src/api/file/import-task/types";
import type { ImportRecord } from "../types";
import { IMPORT_STATUS_OPTIONS } from "./config/status";

const statusLabelMap = new Map<number, string>(
	IMPORT_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

export function getImportStatusLabel(status: number): string {
	return statusLabelMap.get(status) ?? "未知";
}

export function getImportStatusBadgeStatus(
	status: number,
): "error" | "default" | "processing" | "success" {
	switch (status) {
		case 1:
			return "processing";
		case 2:
			return "success";
		case 3:
			return "error";
		case 0:
		case 6:
			return "default";
		default:
			return "default";
	}
}

export function formatApiTime(value: any): string {
	if (!value) return "--";
	if (typeof value === "string") return value;
	if (typeof value === "number") return new Date(value).toLocaleString("zh-CN");
	if (value instanceof Date) return value.toLocaleString("zh-CN");

	const timeValue = value.time ?? value.timestamp ?? value.value ?? value.dateTime ?? value.date;
	if (timeValue) return formatApiTime(timeValue);

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export function calcProgress(item: ImportTaskListItem): number | undefined {
	if (!item.totalNum || item.totalNum <= 0) return undefined;
	const progress = Math.round((item.completedTotalNum / item.totalNum) * 100);
	return Math.min(100, Math.max(0, progress));
}

export function mapImportTaskItem(item: ImportTaskListItem): ImportRecord {
	return {
		id: item.id,
		name: item.taskName,
		module: item.moduleName,
		fileSize: item.fileSize,
		status: item.status,
		statusFormat: getImportStatusLabel(item.status),
		progress: calcProgress(item),
		sourceFile: item.sourceFile,
		errorFile: item.errorFile,
		completedTotalNum: item.completedTotalNum,
		totalNum: item.totalNum,
		updateTime: formatApiTime(item.endTime ?? item.startTime),
		remark: item.remark,
	};
}
