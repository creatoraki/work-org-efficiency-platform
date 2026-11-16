/**
 * 绩效管理 · 年度评级 · 评级计划
 *
 * 模块常量：下拉选项、状态视觉映射、表格列宽。
 */

import type { PlanAction } from "../types";

import { RatingPlanStatus } from "#src/api/performance-management/plan";
import { RatingTodoStatus } from "#src/api/performance-management/todo";
import { PlanActionType } from "../types";

/**
 * 周期下拉选项
 */
export const CYCLE_OPTIONS = [
	{ label: "2026年度", value: "2026年度" },
	{ label: "2025年度", value: "2025年度" },
];

/**
 * 计划状态下拉选项
 */
export const PLAN_STATUS_OPTIONS = [
	{ label: "未开始", value: RatingPlanStatus.NOT_STARTED },
	{ label: "进行中", value: RatingPlanStatus.IN_PROGRESS },
	{ label: "已归档", value: RatingPlanStatus.ARCHIVED },
];

/**
 * 计划状态圆点配色
 *
 * 未开始为暖色提示、进行中为主色、已归档为成功色。
 */
export const PLAN_STATUS_COLOR_MAP: Record<string, string> = {
	[RatingPlanStatus.NOT_STARTED]: "#FF7D00",
	[RatingPlanStatus.IN_PROGRESS]: "#0075FF",
	[RatingPlanStatus.ARCHIVED]: "#14B968",
};

/**
 * 人员清单状态圆点配色（字典 annual_evaluation_task_status）
 */
export const EMPLOYEE_STATUS_COLOR_MAP: Record<string, string> = {
	[RatingTodoStatus.PENDING]: "#FF7D00",
	[RatingTodoStatus.REJECTED]: "#F5222D",
	[RatingTodoStatus.SUBMITTED]: "#0075FF",
	[RatingTodoStatus.COMPLETED]: "#14B968",
};

/**
 * 等级分布异常校验文案配色
 *
 * 「正常」为成功色，其余（超/少 N 人）为错误色。
 */
export const CHECK_TEXT_COLOR = {
	normal: "#14B968",
	abnormal: "#F5222D",
};

/**
 * 岗位类别选项（人员清单 / 分析报表筛选用）
 */
export const POSITION_CATEGORY_OPTIONS = [
	{ label: "职能员工", value: "职能员工" },
	{ label: "项目员工(其他)", value: "项目员工(其他)" },
	{ label: "项目员工(安全)", value: "项目员工(安全)" },
	{ label: "项目员工(保洁绿化)", value: "项目员工(保洁绿化)" },
	{ label: "业务员工", value: "业务员工" },
	{ label: "三级及以上管理者", value: "三级及以上管理者" },
];

/**
 * 人员清单筛选项
 */
export const EMPLOYMENT_STATUS_OPTIONS = [
	{ label: "在职", value: "在职" },
	{ label: "离职", value: "离职" },
];

export const SUBMIT_GRADE_OPTIONS = [
	{ label: "A", value: "A" },
	{ label: "B+", value: "B+" },
	{ label: "B", value: "B" },
	{ label: "C/D", value: "C/D" },
];

export const CHECK_STATUS_OPTIONS = [
	{ label: "正常", value: "正常" },
	{ label: "预警/差2级", value: "预警/差2级" },
];

/**
 * 分析报表筛选项
 */
export const ORG_NAME_OPTIONS = [
	{ label: "杭西地区", value: "杭西地区" },
	{ label: "科技集团", value: "科技集团" },
];

export const CHECK_RESULT_OPTIONS = [
	{ label: "正常", value: "正常" },
	{ label: "异常", value: "异常" },
];

/**
 * 列表行操作（查看 / 权限编辑）
 */
export const PLAN_ACTIONS: PlanAction[] = [
	{ type: PlanActionType.VIEW, label: "查看" },
	{ type: PlanActionType.PERMISSION_EDIT, label: "权限编辑" },
];

/**
 * 操作列固定宽度，用于容纳「查看 | 权限编辑」两个动作。
 */
export const PLAN_COLUMN_WIDTH = {
	action: 129,
} as const;

/**
 * 列设置可切换的列（操作列固定展示，不参与显隐）
 */
export const COLUMN_SETTING_OPTIONS = [
	{ key: "planName", label: "计划名称" },
	{ key: "cycle", label: "周期" },
	{ key: "headCount", label: "参与人数(人)" },
	{ key: "owner", label: "主责人" },
	{ key: "validPeriod", label: "有效期" },
	{ key: "status", label: "状态" },
];
