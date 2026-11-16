/**
 * 导出模板配置页面工具函数
 */

/**
 * 将 JSON 数组转换为表单数组格式
 * @param jsonArray JSON 数组,如 [{key: "name", label: "姓名"}]
 * @returns 表单数组格式(保持不变,直接返回)
 */
export function convertJsonToFormArray(jsonArray?: Record<string, any>[]): Record<string, any>[] {
	if (!jsonArray || !Array.isArray(jsonArray)) {
		return [];
	}
	return jsonArray;
}

/**
 * 将表单数组格式转换为 JSON 数组
 * @param formArray 表单数组
 * @returns JSON 数组
 */
export function convertFormArrayToJson(formArray?: Record<string, any>[]): Record<string, any>[] {
	if (!formArray || !Array.isArray(formArray)) {
		return [];
	}
	// 过滤掉空值项
	return formArray.filter((item) => {
		return Object.values(item).some((v) => v !== "" && v != null);
	});
}

/**
 * 格式化日期时间
 * @param dateTime 日期时间
 * @returns 格式化后的字符串
 */
export function formatDateTime(dateTime: Date | string): string {
	if (!dateTime) return "-";
	const date = typeof dateTime === "string" ? new Date(dateTime) : dateTime;
	return date.toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}
