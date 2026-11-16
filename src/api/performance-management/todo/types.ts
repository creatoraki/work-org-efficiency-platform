/**
 * 绩效管理 · 年度评级 · 评级待办
 *
 * 接口类型：列表行、筛选条件、统计卡片与相关枚举。
 * 页面与组件直接引用本模块，避免重复定义页面影子类型。
 */

/** 节点类型枚举（与字典 annual_evaluation_node_type 对齐：1 自评 / 2 提报 / 3 审批 / 4 审定 / 5 确认 / 6 申诉） */
export enum RatingNodeType {
	/** 自评 */
	SELF_EVAL = 1,
	/** 提报 */
	SUBMIT = 2,
	/** 审批 */
	APPROVE = 3,
	/** 审定 */
	FINALIZE = 4,
	/** 确认 */
	CONFIRM = 5,
	/** 申诉 */
	APPEAL = 6,
}

/** 节点类型文案 */
export const RATING_NODE_TYPE_LABEL: Record<string, string> = {
	[RatingNodeType.SELF_EVAL]: "自评",
	[RatingNodeType.SUBMIT]: "提报",
	[RatingNodeType.APPROVE]: "审批",
	[RatingNodeType.FINALIZE]: "审定",
	[RatingNodeType.CONFIRM]: "确认",
	[RatingNodeType.APPEAL]: "申诉",
};

/** 待办状态枚举（与字典 annual_evaluation_task_status 对齐：0 待完成 / 1 被驳回 / 2 已提交 / 3 已完成） */
export enum RatingTodoStatus {
	/** 待完成 */
	PENDING = "0",
	/** 被驳回 */
	REJECTED = "1",
	/** 已提交 */
	SUBMITTED = "2",
	/** 已完成 */
	COMPLETED = "3",
}

/** 待办状态文案 */
export const RATING_TODO_STATUS_LABEL: Record<string, string> = {
	[RatingTodoStatus.PENDING]: "待完成",
	[RatingTodoStatus.REJECTED]: "被驳回",
	[RatingTodoStatus.SUBMITTED]: "已提交",
	[RatingTodoStatus.COMPLETED]: "已完成",
};

/** 考核类型枚举（与字典 annual_evaluation_form_type 对齐：1 基层员工 / 2 管理者） */
export enum RatingAssessType {
	/** 基层员工 */
	STAFF = 1,
	/** 管理者 */
	MANAGER = 2,
}

/** 考核类型文案 */
export const RATING_ASSESS_TYPE_LABEL: Record<string, string> = {
	[RatingAssessType.STAFF]: "基层员工",
	[RatingAssessType.MANAGER]: "管理者",
};

/**
 * 取节点类型展示文案
 *
 * @param value - 节点类型字典值
 * @returns 节点类型文案，未命中时回退原始值
 */
export function getNodeTypeLabel(value?: string | number | null): string {
	if (value === undefined || value === null || value === "") return "";
	return RATING_NODE_TYPE_LABEL[String(value)] ?? String(value);
}

/**
 * 取待办状态展示文案
 *
 * @param value - 状态字典值
 * @returns 状态文案，未命中时回退原始值
 */
export function getTodoStatusLabel(value?: string | number | null): string {
	if (value === undefined || value === null || value === "") return "";
	return RATING_TODO_STATUS_LABEL[String(value)] ?? String(value);
}

/**
 * 取考核类型展示文案
 *
 * @param value - 考核类型字典值
 * @returns 考核类型文案，未命中时回退原始值
 */
export function getAssessTypeLabel(value?: string | number | null): string {
	if (value === undefined || value === null || value === "") return "";
	return RATING_ASSESS_TYPE_LABEL[String(value)] ?? String(value);
}

/** 角色枚举（与字典 annual_evaluation_role_type 对齐） */
export enum RatingRole {
	/** 员工本人 */
	EMPLOYEE = 1,
	/** 一级部门负责人 */
	FIRST_DEPT_LEADER = 2,
	/** 项目群群主 */
	PROJECT_GROUP_LEADER = 3,
	/** 事业部负责人 */
	BUSINESS_DEPT_LEADER = 4,
	/** 地区本体 */
	REGION_MAIN = 5,
	/** 业务集团本体 */
	BUSINESS_GROUP_MAIN = 6,
	/** 智能中心负责人 */
	SMART_CENTER_LEADER = 7,
	/** 集团运营 */
	GROUP_OPERATIONS = 8,
	/** 集团客服 */
	GROUP_CUSTOMER_SERVICE = 9,
	/** 集团市场 */
	GROUP_MARKETING = 10,
	/** 集团安全 */
	GROUP_SECURITY = 11,
	/** 集团本体 */
	GROUP_MAIN = 12,
}

/** 角色文案 */
export const RATING_ROLE_LABEL: Record<string, string> = {
	[RatingRole.EMPLOYEE]: "员工本人",
	[RatingRole.FIRST_DEPT_LEADER]: "一级部门负责人",
	[RatingRole.PROJECT_GROUP_LEADER]: "项目群群主",
	[RatingRole.BUSINESS_DEPT_LEADER]: "事业部负责人",
	[RatingRole.REGION_MAIN]: "地区本体",
	[RatingRole.BUSINESS_GROUP_MAIN]: "业务集团本体",
	[RatingRole.SMART_CENTER_LEADER]: "智能中心负责人",
	[RatingRole.GROUP_OPERATIONS]: "集团运营",
	[RatingRole.GROUP_CUSTOMER_SERVICE]: "集团客服",
	[RatingRole.GROUP_MARKETING]: "集团市场",
	[RatingRole.GROUP_SECURITY]: "集团安全",
	[RatingRole.GROUP_MAIN]: "集团本体",
};

/**
 * 取角色展示文案
 *
 * @param value - 角色字典值
 * @returns 角色文案，未命中时回退原始值
 */
export function getRoleLabel(value?: string | number | null): string {
	if (value === undefined || value === null || value === "") return "";
	return RATING_ROLE_LABEL[String(value)] ?? String(value);
}

/** 操作类型枚举 */
export enum RatingTodoAction {
	/** 填报 */
	FILL = "填报",
	/** 确认 */
	CONFIRM = "确认",
	/** 处理 */
	HANDLE = "处理",
	/** 查看 */
	VIEW = "查看",
	/** 提交版本 */
	SUBMIT_VERSION = "提交版本",
}

/**
 * 单条行操作
 */
export interface RatingAction {
	/** 操作标识 */
	type: RatingTodoAction;
	/** 操作文案 */
	label: string;
}

/**
 * 评级待办列表行数据
 */
export interface RatingTodoItem {
	/** 主键 */
	id: string;
	/** 计划名称 */
	planName: string;
	/** 周期 */
	cycle: string;
	/** 考核类型 */
	assessType: RatingAssessType;
	/** 节点类型 */
	nodeType: RatingNodeType;
	/** 待办状态 */
	status: RatingTodoStatus;
	/** 角色 */
	role: string;
	/** 执行人 */
	executor: string;
	/** 执行范围，只显示末级组织名 */
	executeScope: string;
	/** 执行范围完整层级路径，悬浮时展示 */
	executeScopePath: string;
	/** 人数 */
	headCount: number;
	/** 有效期，格式 YYYY-MM-DD */
	validDate: string;
	/** 是否已逾期 */
	overdue: boolean;
	/** 最近提交时间，格式 YYYY-MM-DD HH:mm:ss */
	lastSubmitTime: string;
}

/**
 * 评级待办筛选条件
 */
export interface RatingTodoQuery {
	/** 计划id（计划下拉由年度评级计划全量列表提供） */
	planId?: number;
	/** 周期（年份，如 2026；后端拼「年度」后匹配） */
	cycle?: string;
	/** 考核类型 */
	assessType?: RatingAssessType;
	/** 节点类型 */
	nodeType?: RatingNodeType;
	/** 执行组织code（查询条件接口下发） */
	dealOrgCode?: string;
	/** 执行人工号（查询条件接口下发） */
	dealUserCode?: string;
	/** 状态（字典值：0 待完成 / 1 被驳回 / 2 已提交 / 3 已完成） */
	status?: string;
	/** 页码 */
	pageNum?: number;
	/** 每页条数 */
	pageSize?: number;
}

/**
 * 评级任务列表行（后端 EffAnnualEvaluationUserTaskPageListBO）
 */
export interface RatingTodoTaskRow {
	/** 主键 */
	id?: number;
	/** 任务编号 */
	taskCode?: string;
	/** 计划id */
	planId?: number;
	/** 计划名称 */
	planName?: string;
	/** 周期 */
	periodName?: string;
	/** 有效期 */
	finishTime?: string;
	/** 考核类型 */
	evaluationType?: number;
	/** 节点类型 */
	nodeType?: number;
	/** 角色 */
	roleType?: number;
	/** 执行组织code */
	dealOrgCode?: string;
	/** 执行组织名称 */
	dealOrgName?: string;
	/** 执行组织名称路径 */
	dealOrgNamePath?: string;
	/** 执行人 */
	dealUserName?: string;
	/** 执行人工号 */
	dealUserCode?: string;
	/** 协作人 */
	dealCoUserName?: string;
	/** 协作人工号 */
	dealCoUserCode?: string;
	/** 人数 */
	userCount?: number;
	/** 提交时间 */
	submitTime?: string;
	/** 状态 */
	status?: string;
}

/**
 * 评级任务列表查询条件（后端 EffAnnualEvaluationUserTaskSearchOptionsBO）
 */
export interface RatingTodoSearchOptions {
	/** 执行组织选项（后端契约保留；当前 UI 走 org/list/all） */
	dealOrgOptions?: Array<{
		/** 执行组织code */
		dealOrgCode: string;
		/** 执行组织名称 */
		dealOrgName: string;
		/** 执行组织名称路径 */
		dealOrgNamePath?: string;
	}>;
	/** 执行人选项 */
	dealUserOptions?: Array<{
		/** 执行人工号 */
		dealUserCode: string;
		/** 执行人姓名 */
		dealUserName: string;
	}>;
}

/**
 * 评级组织树节点（组织树接口返回的展示子集）
 */
export interface RatingOrgNode {
	/** 节点标识 */
	id: string;
	/** 节点名称 */
	name: string;
	/** 子节点 */
	children?: RatingOrgNode[];
}

/**
 * 评级待办统计卡片数据
 */
export interface RatingTodoStatistics {
	/** 全部任务数量 */
	totalCount?: number;
	/** 待完成数量 */
	pendingCount: number;
	/** 被驳回数量 */
	rejectedCount: number;
	/** 已提交数量 */
	submittedCount: number;
	/** 已完成数量 */
	completedCount: number;
	/** 被驳回今日新增数量 */
	rejectedTodayCount: number;
	/** 已完成今日新增数量 */
	completedTodayCount: number;
}
