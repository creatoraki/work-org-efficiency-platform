import type { ImportStatus } from "./types";

/**
 * 状态映射 - Badge 组件
 */
export const STATUS_BADGE_MAP: Record<
	ImportStatus,
	"error" | "default" | "processing" | "success"
> = {
	0: "default",
	1: "processing",
	2: "success",
	3: "error",
	6: "default",
};

/**
 * 状态映射 - 文本颜色
 */
export const STATUS_COLOR_MAP: Record<ImportStatus, string> = {
	0: "#909399",
	1: "#1890ff",
	2: "#52c41a",
	3: "#ff4d4f",
	6: "#909399",
};

/**
 * 状态选项 - 用于筛选下拉框
 */
export const STATUS_OPTIONS: { label: string; value: number }[] = [
	{ label: "排队中", value: 0 },
	{ label: "进行中", value: 1 },
	{ label: "成功", value: 2 },
	{ label: "失败", value: 3 },
	{ label: "取消", value: 6 },
];

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION = {
	current: 1,
	pageSize: 10,
	total: 0,
};

/**
 * WebSocket 消息类型
 */
export const WS_MESSAGE_TYPE = {
	/** 单条记录更新 */
	UPDATE_RECORD: 1,
	/** 全表刷新 */
	REFRESH_ALL: 500,
};

/**
 * API 端点
 */
export const API_ENDPOINTS = {
	/** 获取导入记录列表 */
	GET_LIST: "/file/info",
	/** 取消导入任务 */
	CANCEL_TASK: "/file/info",
	/** 下载文件 */
	DOWNLOAD: "/file/oss/download",
	/** 获取模块字典 */
	GET_MODULE_DICT: "/sys/dict/getData/395e8b25f81a43c68146bb07a38446b7",
	/** 获取状态字典 */
	GET_STATUS_DICT: "/sys/dict/getData/9b54235b1991410d8eefa02dff38e2ce",
};
