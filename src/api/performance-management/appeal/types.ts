/**
 * 绩效管理 · 年度评级 · 申诉处理
 *
 * 类型定义：申诉流程、考评结果、考评详情量表数据模型。
 * 字段命名以后端真实字段为准，展示别名只在 API 映射层处理。
 */

import type { RatingAssessType, RatingNodeType } from "#src/api/performance-management/todo/types";

/** 申诉流程节点类型 */
export enum AppealFlowType {
	/** 申诉 */
	APPEAL = "申诉",
	/** 拒绝 */
	REJECT = "拒绝",
	/** 通过 */
	APPROVE = "通过",
}

/** 申诉流程节点 */
export interface AppealFlowItem {
	/** 节点标识 */
	id: string;
	/** 节点类型 */
	type: AppealFlowType;
	/** 申诉编号（可跳转 OA） */
	appealNo?: string;
	/** 申诉类型，如 集团本体 / 业务/地区本体 */
	appealType: string;
	/** 提交人 */
	submitter?: string;
	/** 执行人 */
	executor?: string;
	/** 申诉得分 */
	appealScore?: number;
	/** 申诉等级 */
	appealLevel?: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 职级 */
	jobLevel: string;
	/** 日期，格式 YYYY-MM-DD */
	date: string;
	/** 是否可操作（去处理） */
	actionable?: boolean;
}

/** 考评结果 */
export interface AppealEvalResult {
	/** 自评得分 */
	selfScore: number;
	/** 考评得分 */
	evalScore: number;
	/** 考评等级 */
	evalLevel: string;
}

/** 基础信息 */
export interface AppealEmployeeInfo {
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

/** 评级信息 */
export interface AppealRatingInfo {
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

/** 申诉处理数据 */
export interface AppealHandleData {
	/** 待办标识 */
	todoId: string;
	/** 评级信息 */
	ratingInfo: AppealRatingInfo;
	/** 基础信息 */
	employeeInfo: AppealEmployeeInfo;
	/** 考评结果 */
	evalResult: AppealEvalResult;
	/** 申诉流程 */
	flowItems: AppealFlowItem[];
}

/** 申诉处理查询参数 */
export interface AppealHandleQueryParams {
	/** 待办标识 */
	todoId: string;
}

/** 考评详情评分档位 */
export interface AppealScoreLevel {
	/** 分值上限 */
	max: number;
	/** 分值下限 */
	min: number;
	/** 细则描述 */
	description: string;
}

/** 考评详情指标 */
export interface AppealDetailIndicator {
	/** 指标标识 */
	id: string;
	/** 指标名称 */
	name: string;
	/** 权重占比 */
	weight: string;
	/** 评分细则档位 */
	levels: AppealScoreLevel[];
	/** 自评得分 */
	selfScore: number;
	/** 考评得分 */
	evalScore: number;
	/** 自评备注事项 */
	selfRemark?: string;
	/** 考评备注事项 */
	evalRemark?: string;
}

/** 考评详情维度 */
export interface AppealDetailDimension {
	/** 维度标识 */
	id: string;
	/** 维度名称 */
	name: string;
	/** 权重占比 */
	weight: string;
	/** 维度下的指标 */
	indicators: AppealDetailIndicator[];
}

/** 考评详情数据 */
export interface AppealDetailData {
	/** 自评得分 */
	selfScore: number;
	/** 考评得分 */
	evalScore: number;
	/** 考评等级 */
	evalLevel: string;
	/** 评价量表 */
	dimensions: AppealDetailDimension[];
}

/** 考评详情查询参数 */
export interface AppealDetailQueryParams {
	/** 待办标识 */
	todoId: string;
}
