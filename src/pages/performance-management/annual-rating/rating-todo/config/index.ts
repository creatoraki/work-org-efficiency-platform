/**
 * 绩效管理 · 年度评级 · 评级待办
 *
 * 模块常量：下拉选项、状态视觉映射、节点类型与操作的映射规则。
 */

import type { RatingAction } from "#src/api/performance-management/todo";

import {
	RatingNodeType,
	RatingTodoAction,
	RatingTodoStatus,
} from "#src/api/performance-management/todo/types";

/**
 * 状态圆点与文本配色
 *
 * 待完成/被驳回为暖色提示，已完成/已提交为成功色。
 */
export const STATUS_COLOR_MAP: Record<string, string> = {
	[RatingTodoStatus.PENDING]: "#FF7D00",
	[RatingTodoStatus.COMPLETED]: "#14B968",
	[RatingTodoStatus.SUBMITTED]: "#14B968",
	[RatingTodoStatus.REJECTED]: "#F5222D",
};

/** 查看操作 */
const VIEW_ACTION: RatingAction = { type: RatingTodoAction.VIEW, label: "查看" };

/** 查看 + 提交版本（审批 / 审定节点提交后） */
const APPROVAL_DONE_ACTIONS: RatingAction[] = [
	VIEW_ACTION,
	{ type: RatingTodoAction.SUBMIT_VERSION, label: "提交版本" },
];

/**
 * 节点类型与可执行操作的映射规则
 *
 * 规则来源：设计稿「评级待办列表」逐行核对，按「节点类型 × 状态」取操作；
 * 未命中的组合统一只给「查看」。
 * - 自评：待完成=填报，已完成=查看
 * - 确认：待完成=确认，已提交/已完成=查看
 * - 申诉：待完成=处理，已完成=查看
 * - 提报：待完成/被驳回=填报，已提交/已完成=查看
 * - 审批 / 审定：待完成/被驳回=填报，已提交/已完成=查看+提交版本
 */
export const NODE_TYPE_ACTION_MAP: Record<
	RatingNodeType,
	Partial<Record<RatingTodoStatus, RatingAction[]>>
> = {
	[RatingNodeType.SELF_EVAL]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.FILL, label: "填报" }],
	},
	[RatingNodeType.CONFIRM]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.CONFIRM, label: "确认" }],
	},
	[RatingNodeType.APPEAL]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.HANDLE, label: "处理" }],
	},
	[RatingNodeType.SUBMIT]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.FILL, label: "填报" }],
		[RatingTodoStatus.REJECTED]: [{ type: RatingTodoAction.FILL, label: "填报" }],
	},
	[RatingNodeType.APPROVE]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.FILL, label: "填报" }],
		[RatingTodoStatus.REJECTED]: [{ type: RatingTodoAction.FILL, label: "填报" }],
		[RatingTodoStatus.SUBMITTED]: APPROVAL_DONE_ACTIONS,
		[RatingTodoStatus.COMPLETED]: APPROVAL_DONE_ACTIONS,
	},
	// 审定节点（4）与审批节点规则一致
	[RatingNodeType.FINALIZE]: {
		[RatingTodoStatus.PENDING]: [{ type: RatingTodoAction.FILL, label: "填报" }],
		[RatingTodoStatus.REJECTED]: [{ type: RatingTodoAction.FILL, label: "填报" }],
		[RatingTodoStatus.SUBMITTED]: APPROVAL_DONE_ACTIONS,
		[RatingTodoStatus.COMPLETED]: APPROVAL_DONE_ACTIONS,
	},
};

/**
 * 表格列宽配置（单位 px）。全部列宽合计 1696px，用于计算表格横向滚动宽度。
 * 操作列 129px = 左右内边距 24px +「查看 | 提交版本」（28 + 10 + 1 + 10 + 56）。
 */
export const TABLE_COLUMN_WIDTH = {
	planName: 144,
	cycle: 144,
	assessType: 110,
	nodeType: 110,
	role: 122,
	executeScope: 184,
	executor: 245,
	headCount: 76,
	validDate: 153,
	status: 120,
	lastSubmitTime: 159,
	action: 129,
} as const;

/**
 * 按节点类型 + 状态推导行操作
 *
 * 命中节点级规则时返回对应操作；未命中（如自评/申诉的已提交等）默认只看「查看」。
 *
 * @param nodeType - 节点类型
 * @param status - 待办状态
 * @returns 行操作列表
 */
export function resolveTodoActions(
	nodeType: RatingNodeType,
	status: RatingTodoStatus,
): RatingAction[] {
	return NODE_TYPE_ACTION_MAP[nodeType]?.[status] ?? [VIEW_ACTION];
}

/**
 * 列设置可切换的列（操作列固定展示，不参与显隐）
 */
export const COLUMN_SETTING_OPTIONS = [
	{ key: "planName", label: "计划名称" },
	{ key: "cycle", label: "周期" },
	{ key: "assessType", label: "考核类型" },
	{ key: "nodeType", label: "节点类型" },
	{ key: "role", label: "角色" },
	{ key: "executeScope", label: "执行范围" },
	{ key: "executor", label: "执行人" },
	{ key: "headCount", label: "人数(人)" },
	{ key: "validDate", label: "有效期" },
	{ key: "status", label: "状态" },
	{ key: "lastSubmitTime", label: "最近提交时间" },
];
