/**
 * 组织调整模块常量定义
 */

/**
 * 组织调整模块字典 key
 */
export const ORG_ADJUSTMENT_DICT_KEYS = {
	/** 任务状态字典 */
	TASK_STATUS: "org_adjustment_task_status",
} as const;

/**
 * 组织调整任务状态展示配置。
 *
 * 说明：
 * 1. `text` 为表格中展示的状态文案
 * 2. `dotColor` 为状态圆点颜色
 * 3. `textColor` 仅在需要特殊强调时配置，目前只有“已结束”为灰色
 */
export const ORG_ADJUSTMENT_TASK_STATUS_MAP: Record<
	string,
	{ text: string; dotColor: string; textColor?: string }
> = {
	0: { text: "未提交", dotColor: "rgba(255, 125, 0, 1)" },
	1: { text: "已提交", dotColor: "rgba(20, 185, 104, 1)" },
	2: { text: "流程审批中", dotColor: "rgba(0, 117, 255, 1)" },
	3: { text: "流程审批完成", dotColor: "rgba(20, 185, 104, 1)" },
	4: { text: "EHR变更中", dotColor: "rgba(0, 117, 255, 1)" },
	5: { text: "EHR变更完成", dotColor: "rgba(20, 185, 104, 1)" },
	6: { text: "已结束", dotColor: "rgba(192, 196, 204, 1)", textColor: "rgba(192, 196, 204, 1)" },
};

/**
 * 行操作类型。
 */
export type OrgAdjustmentTaskActionType =
	| "adjust"
	| "archive"
	| "edit"
	| "delete"
	| "view"
	| "progress";

/**
 * 不同状态下允许的行操作。
 */
export const ORG_ADJUSTMENT_TASK_ACTION_MAP: Record<string, OrgAdjustmentTaskActionType[]> = {
	0: ["adjust", "archive", "edit", "delete"],
	1: ["view", "progress"],
	2: ["view", "progress"],
	3: ["view", "progress"],
	4: ["view", "progress"],
	5: ["view", "progress"],
	6: ["view", "progress"],
};

/**
 * 顶部 tab 对应的任务状态分组。
 * - 0：全部，不附加状态限制
 * - 1：进行中，排除 EHR变更完成、已结束
 * - 2：已结束，包含 EHR变更完成、已结束
 */
export const ORG_ADJUSTMENT_TAB_STATUS_MAP: Record<number, string[] | undefined> = {
	0: undefined,
	1: ["0", "1", "2", "3", "4"],
	2: ["5", "6"],
};

/**
 * 权限等级映射
 */
export const PERMISSION_LEVEL_MAP: Record<number, string> = {
	0: "查看",
	1: "编辑",
	2: "管理",
};

/**
 * 默认分页大小
 */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * 默认搜索参数
 */
export const DEFAULT_SEARCH_PARAMS = {
	pageNum: 1,
	pageSize: DEFAULT_PAGE_SIZE,
	taskName: "",
	status: undefined,
	creatorName: "",
};
