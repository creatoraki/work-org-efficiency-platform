/**
 * 绩效管理 · 年度评级 · 评级计划
 *
 * 接口类型：计划列表、计划统计、查看（人员清单 / 分析报表）、权限编辑。
 * 后端接口就绪前由 api.ts 返回本地模拟数据，类型与真实契约保持一致。
 */

/** 计划状态 */
export enum RatingPlanStatus {
	/** 未开始 */
	NOT_STARTED = "未开始",
	/** 进行中 */
	IN_PROGRESS = "进行中",
	/** 已归档 */
	ARCHIVED = "已归档",
}

/** 组织单位类型枚举（与字典 annual_evaluation_owner_unit_type 对齐） */
export enum RatingOwnerUnitType {
	/** 地区公司 */
	REGION_COMPANY = 1,
	/** 业务集团 */
	BUSINESS_GROUP = 2,
	/** 服务集团职能 */
	SERVICE_GROUP_FUNCTION = 3,
}

/** 组织单位类型文案 */
export const RATING_OWNER_UNIT_TYPE_LABEL: Record<string, string> = {
	[RatingOwnerUnitType.REGION_COMPANY]: "地区公司",
	[RatingOwnerUnitType.BUSINESS_GROUP]: "业务集团",
	[RatingOwnerUnitType.SERVICE_GROUP_FUNCTION]: "服务集团职能",
};

/** 成员权限等级枚举 */
export enum PlanPermission {
	/** 管理 */
	MANAGE = "管理",
	/** 查看 */
	VIEW = "查看",
}

/**
 * 分布校验结果字典
 *
 * 异常值形如「超2 / 少1」，仅「正常」为通过。
 */
export const PLAN_CHECK_RESULT = {
	/** 正常 */
	NORMAL: "正常",
} as const;

/** 评级计划列表项 */
export interface RatingPlanItem {
	/** 计划标识 */
	id: string;
	/** 计划名称 */
	planName: string;
	/** 周期 */
	cycle: string;
	/** 参与人数 */
	headCount: number;
	/** 主责人 */
	owner: string;
	/** 有效期开始 */
	validStart: string;
	/** 有效期结束 */
	validEnd: string;
	/** 计划状态 */
	status: RatingPlanStatus;
}

/** 列表查询参数 */
export interface RatingPlanQuery {
	/** 计划名称（模糊） */
	planName?: string;
	/** 周期 */
	cycle?: string;
	/** 主责人（模糊） */
	owner?: string;
	/** 状态 */
	status?: string;
}

/** 计划统计 */
export interface RatingPlanStatistics {
	/** 计划总数 */
	totalCount: number;
	/** 进行中数量 */
	inProgressCount: number;
	/** 已归档数量 */
	archivedCount: number;
	/** 本日新增归档数量 */
	archivedTodayCount: number;
}

/** 等级档位 */
export type GradeLevel = "A" | "B+" | "B" | "C/D";

/** 组织树节点（人员清单左侧树） */
export interface PlanOrgNode {
	/** 节点标识 */
	key: string;
	/** 节点名称 */
	title: string;
	/** 负责人（部门节点展示，如「何思远」） */
	owner?: string;
	/** 子节点 */
	children?: PlanOrgNode[];
}

/** 人员清单顶部统计范围 */
export type PlanViewScope = "全部" | "基层员工" | "管理者";

/** 人员清单顶部统计 */
export interface PlanViewSummary {
	/** 考核人数 */
	totalCount: number;
	/** 待确认人数 */
	pendingCount: number;
	/** 已提交-申诉中人数 */
	submittedCount: number;
	/** 已归档人数 */
	archivedCount: number;
	/** 等级分布行 */
	gradeRows: GradeDistributionRow[];
}

/** 等级分布行 */
export interface GradeDistributionRow {
	/** 行标识 */
	key: string;
	/** 组织类型（分析报表列） */
	orgType?: string;
	/** 组织名称（分析报表列） */
	orgName?: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 人数 */
	headCount: number;
	/** 标准人数分布 */
	standard: Record<GradeLevel, number>;
	/** 实际人数分布 */
	actual: Record<GradeLevel, number>;
	/** 异常校验文案 */
	check: Record<GradeLevel, string>;
	/** 异常情况说明 */
	abnormalNote?: string;
	/** 是否为合计行 */
	isTotal?: boolean;
}

/** 人员清单筛选参数 */
export interface PlanEmployeeQuery {
	/** 姓名 / 工号（模糊） */
	keyword?: string;
	/** 岗位类别 */
	positionCategory?: string;
	/** 在职状态 */
	employmentStatus?: string;
	/** 提报等级 */
	submitGrade?: string;
	/** 校验情况 */
	checkStatus?: string;
	/** 状态 */
	status?: string;
}

/** 人员清单行 */
export interface PlanEmployeeRow {
	/** 行标识 */
	key: string;
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
	/** 在职状态 */
	employmentStatus: string;
	/** 自评分 */
	selfScore: number;
	/** 提报评分 */
	submitScore: number;
	/** 一级部门排名（如 1/3） */
	rank: string;
	/** 建议等级 */
	suggestGrade: string;
	/** 提报等级 */
	submitGrade: string;
	/** 校验情况 */
	checkStatus: string;
	/** 异常情况说明 */
	abnormalNote?: string;
	/** 填报人 */
	submitter: string;
	/** 状态 */
	status: string;
}

/** 分析报表筛选参数 */
export interface PlanAnalysisQuery {
	/** 组织类型 */
	orgType?: string;
	/** 组织名称 */
	orgName?: string;
	/** 岗位分类 */
	positionCategory?: string;
	/** 异常校验 */
	checkResult?: string;
}

/** 权限成员 */
export interface PlanPermissionMember {
	/** 人员标识 */
	id: string;
	/** 姓名 */
	name: string;
	/** 工号 */
	employeeNo: string;
	/** 所属部门 */
	department: string;
	/** 操作权限 */
	permission?: PlanPermission;
}

/** 列表分页响应 */
export interface PlanListResult<T> {
	/** 数据 */
	data: T[];
	/** 总数 */
	total: number;
}

/** 保存权限入参 */
export interface SavePlanPermissionPayload {
	/** 计划标识 */
	planId: string;
	/** 成员权限列表 */
	members: PlanPermissionMember[];
}
