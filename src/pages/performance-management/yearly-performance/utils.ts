import dayjs from "dayjs";

/** 星期文案（不依赖 dayjs 全局语言，避免切换英文时出现「Tue」） */
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/**
 * 头像占位文字
 *
 * 规则与档案管理一致：未上传头像时，中文名取最后一个字，英文名取首字母（大写）。
 *
 * @param name - 姓名
 * @returns 占位文字
 */
export function getAvatarText(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}
	if (/^[a-z]/i.test(trimmed)) {
		return trimmed[0].toUpperCase();
	}
	return Array.from(trimmed).pop() ?? "";
}

/**
 * 格式化日期为「MM-DD 周X」
 *
 * @param value - 日期，YYYY-MM-DD 或 YYYY-MM-DD HH:mm
 * @returns 格式化文案
 */
export function formatDateWithWeekday(value: string): string {
	const date = dayjs(value);
	if (!date.isValid()) {
		return value;
	}
	return `${date.format("MM-DD")} ${WEEKDAY_LABELS[date.day()]}`;
}

/**
 * 格式化述职时间段为「11-03 周二 15:00—15:30」
 *
 * @param start - 开始时间，YYYY-MM-DD HH:mm
 * @param end - 结束时间，YYYY-MM-DD HH:mm
 * @returns 格式化文案
 */
export function formatReportTimeRange(start: string, end: string): string {
	const startDate = dayjs(start);
	const endDate = dayjs(end);
	if (!startDate.isValid() || !endDate.isValid()) {
		return [start, end].filter(Boolean).join("—");
	}
	return `${formatDateWithWeekday(start)} ${startDate.format("HH:mm")}—${endDate.format("HH:mm")}`;
}

/**
 * 秒数格式化为「HH:mm:ss」
 *
 * @param totalSeconds - 秒数
 * @returns 格式化文案
 */
export function formatDuration(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}
