/**
 * 绩效管理 · 年度评级 · 确认
 *
 * 类型定义：确认详情、确认流程节点、考评结果与申诉提交载荷。
 * 字段命名以后端真实字段为准，展示别名只在 API 映射层处理。
 */

import type { RatingAssessType, RatingNodeType } from "#src/api/performance-management/todo/types";

/** 确认流程节点类型 */
export enum ConfirmFlowType {
	/** 申诉 */
	APPEAL = "申诉",
	/** 拒绝 */
	REJECT = "拒绝",
	/** 通过 */
	APPROVE = "通过",
	/** 确认 */
	CONFIRM = "确认",
}

/** 确认流程节点 */
export interface ConfirmFlowItem {
	/** 节点标识 */
	id: string;
	/** 节点类型 */
	type: ConfirmFlowType;
	/** 申诉编号（可跳转 OA） */
	appealNo?: string;
	/** 申诉类型，如 集团本体 / 业务/地区本体 */
	appealType?: string;
	/** 提交人（申诉节点） */
	submitter?: string;
	/** 执行人（拒绝/通过节点） */
	executor?: string;
	/** 申诉得分 */
	appealScore?: number;
	/** 申诉等级 */
	appealLevel?: string;
	/** 确认得分 */
	confirmScore?: number;
	/** 确认等级 */
	confirmLevel?: string;
	/** 岗位分类 */
	positionCategory?: string;
	/** 职级 */
	jobLevel?: string;
	/** 驳回原因（拒绝节点） */
	rejectReason?: string;
	/** 日期，格式 YYYY-MM-DD */
	date: string;
}

/** 考评结果 */
export interface ConfirmEvalResult {
	/** 自评得分（基层员工卡片） */
	selfScore?: number;
	/** KPI 得分（管理者卡片） */
	kpiScore?: number;
	/** 述职/重点工作得分（管理者卡片） */
	reportScore?: number;
	/** 考评得分 */
	evalScore: number;
	/** 考评等级 */
	evalLevel: string;
}

/** 评级信息 */
export interface ConfirmRatingInfo {
	/** 计划名称 */
	planName: string;
	/** 周期 */
	cycle: string;
	/** 考核类型 */
	assessType: RatingAssessType;
	/** 节点类型 */
	nodeType: RatingNodeType;
	/** 执行人 */
	executor: string;
	/** 有效期 */
	validDate: string;
	/** 状态 */
	status: string;
}

/** 基础信息 */
export interface ConfirmEmployeeInfo {
	/** 姓名 */
	name: string;
	/** 工号 */
	employeeNo: string;
	/** 部门 */
	department: string;
	/** 岗位 */
	position: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 职级 */
	jobLevel: string;
}

/** 确认详情数据 */
export interface ConfirmData {
	/** 待办标识 */
	todoId: string;
	/** 评级信息 */
	ratingInfo: ConfirmRatingInfo;
	/** 基础信息 */
	employeeInfo: ConfirmEmployeeInfo;
	/** 考评结果 */
	evalResult: ConfirmEvalResult;
	/** 确认流程（无申诉时仅含确认节点） */
	flowItems: ConfirmFlowItem[];
	/** 是否已完成（只读） */
	finished: boolean;
}

/** 确认查询参数 */
export interface ConfirmQueryParams {
	/** 待办标识 */
	todoId: string;
}

/** 确认提交载荷 */
export interface ConfirmSubmitPayload {
	/** 待办标识 */
	todoId: string;
}

/** 发起申诉载荷 */
export interface AppealFilingPayload {
	/** 待办标识 */
	todoId: string;
	/** 申诉类型：集团本体 / 业务地区本体 */
	appealType: string;
	/** 申诉得分 */
	appealScore: number;
	/** 申诉等级 */
	appealLevel: string;
	/** 申诉原因（不少于 10 字） */
	appealReason: string;
	/** 佐证材料格式：照片 / 附件 */
	materialType: "photo" | "attachment";
	/** 佐证材料文件标识列表 */
	materialFileIds: string[];
}

/** 提交结果 */
export interface ConfirmSubmitResult {
	/** 是否成功 */
	success: boolean;
}

/** 佐证材料条目 */
export interface AppealMaterial {
	/** 材料标识 */
	id: string;
	/** 文件名或图片名 */
	name: string;
	/** 图片/文件地址（照片模式下用于预览） */
	url?: string;
}

/** 申诉详情（点击申诉编号查看） */
export interface AppealFilingDetail {
	/** 考评得分 */
	evalScore: number;
	/** 考评等级 */
	evalLevel: string;
	/** 申诉得分 */
	appealScore: number;
	/** 申诉等级 */
	appealLevel: string;
	/** 申诉类型 */
	appealType: string;
	/** 申诉流程编号 */
	appealNo: string;
	/** 申诉原因 */
	appealReason: string;
	/** 佐证材料格式：照片 / 附件 */
	materialType: "photo" | "attachment";
	/** 佐证材料列表 */
	materials: AppealMaterial[];
}

/** 申诉详情查询参数 */
export interface AppealFilingDetailQueryParams {
	/** 待办标识 */
	todoId: string;
	/** 申诉流程编号 */
	appealNo: string;
}
