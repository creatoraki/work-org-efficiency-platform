/**
 * 绩效管理 · 年度评级 · 自评填报
 *
 * 类型定义：评价量表数据模型、评分细则与提交载荷。
 * 字段命名以后端真实字段为准，展示别名只在 API 映射层处理。
 */

import type { RatingAssessType, RatingNodeType } from "#src/api/performance-management/todo/types";

/** 评分细则档位 */
export interface ScoreLevel {
	/** 分值上限 */
	max: number;
	/** 分值下限 */
	min: number;
	/** 细则描述 */
	description: string;
}

/** 评价指标 */
export interface ScoreIndicator {
	/** 指标标识 */
	id: string;
	/** 指标名称 */
	name: string;
	/** 权重占比，如 10% */
	weight: string;
	/** 满分（自评分输入上限） */
	fullScore: number;
	/** 评分细则档位，按分值降序 */
	levels: ScoreLevel[];
}

/** 评价维度 */
export interface ScoreDimension {
	/** 维度标识 */
	id: string;
	/** 维度名称 */
	name: string;
	/** 权重占比 */
	weight: string;
	/** 维度下的指标 */
	indicators: ScoreIndicator[];
}

/** 评级信息 */
export interface RatingInfo {
	/** 计划名称 */
	planName: string;
	/** 周期 */
	cycle: string;
	/** 考核类型 */
	assessType?: RatingAssessType;
	/** 节点类型 */
	nodeType?: RatingNodeType;
	/** 执行人 */
	executor: string;
	/** 有效期 */
	validDate: string;
	/** 状态 */
	status: string;
}

/** 基础信息 */
export interface EmployeeInfo {
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

/** 自评填报数据 */
export interface SelfEvalData {
	/** 评级信息 */
	ratingInfo: RatingInfo;
	/** 基础信息 */
	employeeInfo: EmployeeInfo;
	/** 评价量表 */
	dimensions: ScoreDimension[];
	/** 已填自评分，key 为评分记录 id（即暂存/提交的 itemList[].id，回显用） */
	scores?: Record<string, number>;
	/** 加分项对应的评分记录 id */
	bonusIndicatorId?: string;
	/** 加分项得分 */
	bonusScore?: number;
	/** 加分项备注 */
	bonusRemark?: string;
	/** 扣分项对应的评分记录 id */
	deductIndicatorId?: string;
	/** 扣分项得分 */
	deductScore?: number;
	/** 扣分项备注 */
	deductRemark?: string;
	/** 是否一票否决 */
	vetoed?: boolean;
}

/** 自评查询参数 */
export interface SelfEvalQueryParams {
	/** 待办标识 */
	todoId: string;
}

/** 自评提交载荷 */
export interface SelfEvalSubmitPayload {
	/** 待办标识 */
	todoId: string;
	/** 各指标自评分，key 为评分记录 id */
	scores: Record<string, number>;
	/** 加分项对应的评分记录 id */
	bonusIndicatorId?: string;
	/** 加分项得分 */
	bonusScore?: number;
	/** 加分项备注 */
	bonusRemark?: string;
	/** 扣分项对应的评分记录 id */
	deductIndicatorId?: string;
	/** 扣分项得分 */
	deductScore?: number;
	/** 扣分项备注 */
	deductRemark?: string;
	/** 是否一票否决 */
	vetoed?: boolean;
}

/** 自评提交响应 */
export interface SelfEvalSubmitResult {
	/** 自评得分 */
	totalScore: number;
}
