import type {
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
} from "#src/api/performance-management/todo/types";

/**
 * 绩效管理 · 年度评级 · 提报
 *
 * 类型定义：提报评级信息、等级分布校验、提报名单数据模型。
 * 字段命名以后端真实字段为准，展示别名只在 API 映射层处理。
 */

/** 评级信息 */
export interface SubmitRatingInfo {
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
	status: RatingTodoStatus;
}

/** 等级分布——标准人数 */
export interface StandardLevelCount {
	/** A 档人数 */
	a: number;
	/** B+ 档人数 */
	bPlus: number;
	/** B 档人数 */
	b: number;
	/** C、D 档人数（合并统计） */
	cd: number;
}

/** 等级分布——实际人数 */
export interface ActualLevelCount {
	/** A 档人数 */
	a: number;
	/** B+ 档人数 */
	bPlus: number;
	/** B 档人数 */
	b: number;
	/** C 档人数 */
	c: number;
	/** D 档人数 */
	d: number;
}

/** 等级分布——异常校验 */
export interface LevelCheckResult {
	/** A 档校验结果，如 超2 / 少1 / 正常 */
	a: string;
	/** B+ 档校验结果 */
	bPlus: string;
	/** B 档校验结果 */
	b: string;
	/** C、D 档校验结果 */
	cd: string;
}

/** 等级分布行（按岗位分类汇总） */
export interface LevelDistributionRow {
	/** 行标识 */
	key: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 人数 */
	totalCount: number;
	/** 标准人数 */
	standard: StandardLevelCount;
	/** 实际人数 */
	actual: ActualLevelCount;
	/** 异常校验 */
	check: LevelCheckResult;
	/** 是否为合计行 */
	isTotal?: boolean;
}

/** 校验情况枚举 */
export enum SubmitCheckStatus {
	/** 待填 */
	PENDING = "待填",
	/** 正常 */
	NORMAL = "正常",
	/** 预警 */
	WARNING = "预警",
}

/** 提报名单·员工填报状态枚举（设计稿「状态」列） */
export enum SubmitEmployeeStatus {
	/** 未开始 */
	NOT_STARTED = "未开始",
	/** 未填报 */
	NOT_FILLED = "未填报",
	/** 已填报 */
	FILLED = "已填报",
	/** 已锁定 */
	LOCKED = "已锁定",
}

/** 提报名单员工 */
export interface SubmitEmployee {
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
	/** 一级部门排名，如 1/3 */
	departmentRank?: string;
	/** 建议等级 */
	suggestLevel?: string;
	/** 提报等级 */
	submitLevel?: string;
	/** 校验情况 */
	checkStatus: SubmitCheckStatus;
	/** 校验差异描述，如 差2级 */
	checkDiff?: string;
	/** 异常情况说明 */
	exceptionNote?: string;
	/** 异常情况说明是否必填 */
	exceptionNoteRequired?: boolean;
	/** 填报人 */
	filler?: string;
	/** 状态 */
	status?: SubmitEmployeeStatus;
}

/** 提报详情数据 */
export interface SubmitDetailData {
	/** 待办标识 */
	todoId: string;
	/** 评级信息 */
	ratingInfo: SubmitRatingInfo;
	/** 总人数 */
	totalCount: number;
	/** 协作人选项 */
	collaboratorOptions: Array<{ label: string; value: string }>;
	/** 已选协作人 */
	collaborator?: string;
	/** 分布异常说明 */
	distributionExceptionNote?: string;
	/** 等级分布校验是否异常 */
	distributionAbnormal: boolean;
	/** 已填报人数 */
	filledCount: number;
	/** 驳回原因（被驳回态展示） */
	rejectReason?: string;
	/** 是否为协作人视角（协作人不可再添加协作人） */
	collaboratorMode?: boolean;
	/** 等级分布 */
	distributionRows: LevelDistributionRow[];
	/** 提报名单 */
	employees: SubmitEmployee[];
}

/** 提报查询参数 */
export interface SubmitDetailQueryParams {
	/** 待办标识 */
	todoId: string;
}

/** 提报名单筛选条件 */
export interface SubmitEmployeeQuery {
	/** 姓名/工号，支持模糊搜索 */
	keyword?: string;
	/** 岗位分类 */
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

/** 提报保存/提交载荷 */
export interface SubmitPayload {
	/** 待办标识 */
	todoId: string;
	/** 协作人 */
	collaborator?: string;
	/** 分布异常说明 */
	distributionExceptionNote?: string;
	/** 提报名单填写结果 */
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

/** 协作人配置行（协作人弹窗） */
export interface CollaboratorRow {
	/** 行标识 */
	key: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 人数 */
	count: number;
	/** 状态 */
	status: string;
	/** 填报人标识 */
	fillerId?: string;
	/** 填报人姓名 */
	fillerName?: string;
}

/** 组织树节点（填报人选择） */
export interface FillerOrgNode {
	/** 节点标识 */
	key: string;
	/** 节点名称 */
	title: string;
	/** 子节点 */
	children?: FillerOrgNode[];
}

/** 候选填报人 */
export interface FillerCandidate {
	/** 员工标识 */
	id: string;
	/** 姓名 */
	name: string;
	/** 部门全路径 */
	departmentPath: string;
}

/** 填报人选择数据 */
export interface FillerPickerData {
	/** 组织树 */
	orgTree: FillerOrgNode[];
	/** 候选成员 */
	candidates: FillerCandidate[];
	/** 已选成员标识 */
	selectedIds: string[];
}
