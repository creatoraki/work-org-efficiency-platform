/**
 * 绩效管理 · 年度评级 · 评级计划（页面私有类型）
 */

/** 列表行操作类型 */
export enum PlanActionType {
	/** 查看（人员清单 / 分析报表） */
	VIEW = "view",
	/** 权限编辑 */
	PERMISSION_EDIT = "permission-edit",
}

/** 列表行操作 */
export interface PlanAction {
	/** 操作类型 */
	type: PlanActionType;
	/** 操作文案 */
	label: string;
}

/** 查看抽屉的 Tab 标识 */
export type PlanViewTab = "people" | "analysis";
