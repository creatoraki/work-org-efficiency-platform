/**
 * 绩效管理 · 年度评级 · 审批
 *
 * 类型定义：审批详情、完成明细、等级分布、审批名单与提交载荷。
 * 字段命名以后端真实字段为准，展示别名只在 API 映射层处理。
 */

import type { RatingAssessType, RatingNodeType } from "#src/api/performance-management/todo/types";

/** 审批状态页签 */
export enum ApprovalTab {
	/** 应完成 */
	SHOULD_FINISH = "shouldFinish",
	/** 待完成 */
	PENDING = "pending",
	/** 已提交-待审核 */
	SUBMITTED = "submitted",
	/** 被驳回 */
	REJECTED = "rejected",
	/** 已完成 */
	FINISHED = "finished",
}

/** 审批评级信息 */
export interface ApprovalRatingInfo {
	/** 计划名称 */
	planName: string;
	/** 周期 */
	cycle: string;
	/** 考核类型 */
	assessType: RatingAssessType;
	/** 节点类型 */
	nodeType: RatingNodeType;
	/** 执行范围 */
	executeScope: string;
	/** 执行人 */
	executor: string;
	/** 有效期 */
	validDate: string;
	/** 状态 */
	status: string;
	/** 协作人（逗号分隔展示） */
	collaborators: string[];
}

/** 组织树节点 */
export interface ApprovalOrgNode {
	/** 节点标识 */
	id: string;
	/** 节点名称 */
	name: string;
	/** 子节点 */
	children?: ApprovalOrgNode[];
}

/** 完成明细行（按组织汇总） */
export interface ApprovalDetailRow {
	/** 行标识 */
	key: string;
	/** 组织名称 */
	orgName: string;
	/** 提交人 */
	submitter: string;
	/** 人数 */
	totalCount: number;
	/** 岗位 */
	position: string;
	/** 分布情况，如 A:140 B+:320 ... */
	distribution: string;
	/** 异常情况说明 */
	exceptionNote: string;
	/** 驳回原因 */
	rejectReason?: string;
	/** 状态 */
	status: string;
	/** 最近提交时间 */
	lastSubmitTime?: string;
	/** OA 流程编号 */
	processNo?: string;
	/** 可执行操作：审核 / 查看 */
	action: "audit" | "view";
}

/** 等级分布——标准人数 */
export interface ApprovalStandardCount {
	/** A 档 */
	a: number;
	/** B+ 档 */
	bPlus: number;
	/** B 档 */
	b: number;
	/** C、D 档 */
	cd: number;
}

/** 等级分布——实际人数 */
export interface ApprovalActualCount {
	/** A 档 */
	a: number;
	/** B+ 档 */
	bPlus: number;
	/** B 档 */
	b: number;
	/** C 档 */
	c: number;
	/** D 档 */
	d: number;
}

/** 等级分布——异常校验 */
export interface ApprovalCheckResult {
	/** A 档 */
	a: string;
	/** B+ 档 */
	bPlus: string;
	/** B 档 */
	b: string;
	/** C、D 档 */
	cd: string;
}

/** 等级分布行 */
export interface ApprovalDistributionRow {
	/** 行标识 */
	key: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 人数 */
	totalCount: number;
	/** 标准人数 */
	standard: ApprovalStandardCount;
	/** 实际人数 */
	actual: ApprovalActualCount;
	/** 异常校验 */
	check: ApprovalCheckResult;
	/** 是否合计行 */
	isTotal?: boolean;
}

/** 校验情况枚举 */
export enum ApprovalCheckStatus {
	/** 正常 */
	NORMAL = "正常",
	/** 预警 */
	WARNING = "预警",
	/** 待填 */
	PENDING = "待填",
}

/** 审批名单员工 */
export interface ApprovalEmployee {
	/** 员工标识 */
	id: string;
	/** 员工姓名 */
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
	/** 在职状态 */
	employmentStatus: string;
	/** 自评分 */
	selfScore?: number;
	/** 提报评分 */
	submitScore?: number;
	/** 一级部门排名 */
	departmentRank?: string;
	/** 建议等级 */
	suggestLevel?: string;
	/** 提报等级 */
	submitLevel?: string;
	/** 校验情况 */
	checkStatus: ApprovalCheckStatus;
	/** 校验差异描述 */
	checkDiff?: string;
	/** 异常情况说明 */
	exceptionNote?: string;
	/** 异常情况说明是否必填 */
	exceptionNoteRequired?: boolean;
	/** 填报人 */
	filler?: string;
	/** 状态 */
	status: string;
}

/** 审批版本 */
export interface ApprovalVersion {
	/** 版本标识 */
	id: string;
	/** 版本名称，如 V1 / V2 */
	name: string;
}

/** 审批详情数据 */
export interface ApprovalData {
	/** 待办标识 */
	todoId: string;
	/** 评级信息 */
	ratingInfo: ApprovalRatingInfo;
	/** 组织树 */
	orgTree: ApprovalOrgNode[];
	/** 各页签数量 */
	tabCounts: Record<ApprovalTab, number>;
	/** 总人数 */
	totalCount: number;
	/** 已填报人数 */
	filledCount: number;
	/** 完成明细 */
	details: ApprovalDetailRow[];
	/** 等级分布 */
	distributionRows: ApprovalDistributionRow[];
	/** 分布异常说明 */
	distributionExceptionNote?: string;
	/** 审批名单 */
	employees: ApprovalEmployee[];
	/** 版本列表（多版本时抽屉标题右侧展示切换） */
	versions: ApprovalVersion[];
	/** 当前版本标识 */
	currentVersionId: string;
	/** 是否只读（已完成/查看） */
	readonly: boolean;
	/** 是否已发起 OA */
	oaStarted?: boolean;
	/** OA 流程编号 */
	oaProcessNo?: string;
}

/** 审批查询参数 */
export interface ApprovalQueryParams {
	/** 待办标识 */
	todoId: string;
	/** 版本标识 */
	versionId?: string;
}

/** 完成明细查询条件 */
export interface ApprovalDetailQuery {
	/** 提交人 */
	submitter?: string;
	/** 状态 */
	status?: string;
}

/** 审批名单查询条件 */
export interface ApprovalEmployeeQuery {
	/** 姓名/工号 */
	keyword?: string;
	/** 岗位类别 */
	positionCategory?: string;
	/** 在职状态 */
	employmentStatus?: string;
	/** 提报等级 */
	submitLevel?: string;
	/** 校验情况 */
	checkStatus?: string;
	/** 状态 */
	status?: string;
}

/** 审核动作 */
export enum ApprovalAuditAction {
	/** 通过 */
	PASS = "pass",
	/** 驳回 */
	REJECT = "reject",
}

/** 提交载荷 */
export interface ApprovalSubmitPayload {
	/** 待办标识 */
	todoId: string;
	/** 版本标识 */
	versionId?: string;
	/** 分布异常说明 */
	distributionExceptionNote?: string;
	/** 协作人 */
	collaborators?: string[];
	/** 审批名单填写结果 */
	employees: Array<{
		/** 员工标识 */
		id: string;
		/** 提报评分 */
		submitScore?: number;
		/** 提报等级 */
		submitLevel?: string;
		/** 异常情况说明 */
		exceptionNote?: string;
	}>;
}

/** 提交结果 */
export interface ApprovalSubmitResult {
	/** 是否成功 */
	success: boolean;
}

/** 填报人候选成员（审批/审定的协作人选择器） */
export interface ApprovalFillerCandidate {
	/** 成员标识 */
	id: string;
	/** 姓名 */
	name: string;
	/** 组织路径 */
	path: string;
	/** 是否不可选（已在其他协作人名单） */
	disabled?: boolean;
}

/** 填报人选择器数据 */
export interface ApprovalFillerPickerData {
	/** 组织树 */
	tree: ApprovalOrgNode[];
	/** 候选成员 */
	candidates: ApprovalFillerCandidate[];
	/** 已选成员 */
	selected: ApprovalFillerCandidate[];
}
