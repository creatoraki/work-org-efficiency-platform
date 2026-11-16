/**
 * 组织管理模块 - 全局类型定义
 */

/**
 * 组织节点类型枚举
 */
export enum OrgNodeType {
	Department = "department", // 部门
	Position = "position", // 岗位
	Virtual = "virtual", // 虚拟组织
}

/**
 * 组织节点结构
 */
export interface OrgNode {
	/** 组织ID */
	id: string | number;
	/** 组织名称 */
	name: string;
	/** 组织代码 */
	code: string;
	/** 父级ID */
	parentId?: string | number;
	/** 组织类型 */
	type: OrgNodeType;
	/** 层级数字（0为根节点） */
	level: number;
	/** 完整路径 */
	fullPath: string;
	/** 子节点 */
	children?: OrgNode[];
	/** 是否已锁定 */
	isLocked?: boolean;
	/** 锁定人 */
	lockedBy?: string;
	/** 操作状态 */
	status?: "add" | "delete" | "modify" | "move" | "merge" | "split";
}

/**
 * 调整任务状态枚举
 */
export enum TaskStatus {
	Draft = 0, // 草稿
	InProgress = 1, // 进行中
	Validating = 2, // 校验中
	Validated = 3, // 校验通过
	ValidationFailed = 4, // 校验失败
	Submitted = 5, // 已提交
	Approved = 6, // 已审核
	Rejected = 7, // 已驳回
	Executed = 8, // 已执行
}

/**
 * 任务状态显示文本
 */
export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
	[TaskStatus.Draft]: "未提交",
	[TaskStatus.InProgress]: "进行中",
	[TaskStatus.Validating]: "校验中",
	[TaskStatus.Validated]: "校验通过",
	[TaskStatus.ValidationFailed]: "校验失败",
	[TaskStatus.Submitted]: "已提交",
	[TaskStatus.Approved]: "已审核",
	[TaskStatus.Rejected]: "已驳回",
	[TaskStatus.Executed]: "已执行",
};

/**
 * 调整任务基础信息
 */
export interface AdjustmentTask {
	/** 任务ID */
	id: string | number;
	/** 任务名称 */
	taskName: string;
	/** 任务代码 */
	taskCode: string;
	/** 任务状态 */
	status: TaskStatus;
	/** 状态显示文本 */
	statusStr: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 创建人名称 */
	creatorName: string;
	/** 创建人ID */
	creatorId?: string | number;
	/** 生效日期 */
	effectiveDate?: string;
	/** 备注说明 */
	description?: string;
	/** 锁定状态（0-未锁定 1-已锁定） */
	lockStatus?: number;
	/** 锁定人 */
	lockedBy?: string;
	/** 锁定人名称 */
	lockedByName?: string;
	/** 版本号 */
	version?: number;
	/** 权限（0-查看 1-编辑 2-管理） */
	perm?: number;
}

/**
 * 变动操作类型
 */
export enum ChangeOperationType {
	Add = "add", // 新增
	Delete = "delete", // 删除
	Move = "move", // 平移
	Merge = "merge", // 合并
	Split = "split", // 拆分
	Rename = "rename", // 重命名
	Modify = "modify", // 修改属性
}

/**
 * 变动操作类型显示文本
 */
export const OPERATION_TYPE_TEXT: Record<ChangeOperationType, string> = {
	[ChangeOperationType.Add]: "新增",
	[ChangeOperationType.Delete]: "删除",
	[ChangeOperationType.Move]: "平移",
	[ChangeOperationType.Merge]: "合并",
	[ChangeOperationType.Split]: "拆分",
	[ChangeOperationType.Rename]: "重命名",
	[ChangeOperationType.Modify]: "修改",
};

/**
 * 变动操作记录
 */
export interface ChangeOperation {
	/** 操作ID */
	id: string;
	/** 操作类型 */
	type: ChangeOperationType;
	/** 操作时间 */
	operationTime: string;
	/** 操作人名称 */
	operatorName: string;
	/** 操作人ID */
	operatorId?: string | number;
	/** 目标节点 */
	targetNode: OrgNode;
	/** 源节点（合并时） */
	sourceNodes?: OrgNode[];
	/** 原上级节点 */
	originalParent?: OrgNode;
	/** 新上级节点 */
	newParent?: OrgNode;
	/** 属性变更 */
	changes?: Record<string, any>;
	/** 操作描述 */
	description?: string;
}

/**
 * 影响范围数据
 */
export interface ImpactRange {
	/** 受影响人数 */
	affectedPersonCount: number;
	/** 受影响部门数 */
	affectedDepartmentCount: number;
	/** 受影响角色数 */
	affectedRoleCount: number;
	/** 受影响系统数 */
	affectedSystemCount: number;
	/** 详细信息 */
	details: {
		persons: PersonImpact[];
		departments: DepartmentImpact[];
		roles: RoleImpact[];
		systems: SystemImpact[];
	};
}

/**
 * 人员影响信息
 */
export interface PersonImpact {
	/** 人员ID */
	personId: string;
	/** 人员名称 */
	personName: string;
	/** 原组织 */
	originalOrg: string;
	/** 新组织 */
	newOrg: string;
	/** 变动类型 */
	changeType: string;
}

/**
 * 部门影响信息
 */
export interface DepartmentImpact {
	/** 部门ID */
	deptId: string;
	/** 部门名称 */
	deptName: string;
	/** 变动类型 */
	changeType: string;
	/** 子部门数 */
	childCount: number;
}

/**
 * 角色影响信息
 */
export interface RoleImpact {
	/** 角色ID */
	roleId: string;
	/** 角色名称 */
	roleName: string;
	/** 受影响人数 */
	affectedCount: number;
}

/**
 * 系统影响信息
 */
export interface SystemImpact {
	/** 系统ID */
	systemId: string;
	/** 系统名称 */
	systemName: string;
	/** 同步状态 */
	syncStatus: "pending" | "synced" | "failed";
	/** 同步时间 */
	syncTime?: string;
	/** 错误信息 */
	errorMsg?: string;
}

/**
 * 校验错误
 */
export interface ValidationError {
	/** 规则代码 */
	ruleCode: string;
	/** 规则名称 */
	ruleName: string;
	/** 错误等级 */
	level: "error" | "critical";
	/** 节点ID */
	nodeId: string;
	/** 节点名称 */
	nodeName: string;
	/** 错误信息 */
	message: string;
	/** 修复建议 */
	suggestion?: string;
}

/**
 * 校验警告
 */
export interface ValidationWarning {
	/** 规则代码 */
	ruleCode: string;
	/** 规则名称 */
	ruleName: string;
	/** 节点ID */
	nodeId: string;
	/** 节点名称 */
	nodeName: string;
	/** 警告信息 */
	message: string;
}

/**
 * 校验结果
 */
export interface ValidationResult {
	/** 是否通过验证 */
	isValid: boolean;
	/** 错误列表 */
	errors: ValidationError[];
	/** 警告列表 */
	warnings: ValidationWarning[];
	/** 校验时间戳 */
	timestamp: string;
}

/**
 * 版本历史
 */
export interface VersionHistory {
	/** 版本号 */
	version: number;
	/** 创建时间 */
	createTime: string;
	/** 创建人名称 */
	creatorName: string;
	/** 创建人ID */
	creatorId?: string | number;
	/** 版本描述 */
	description: string;
	/** 操作数量 */
	operationCount: number;
	/** 操作列表 */
	operations: ChangeOperation[];
	/** 是否为当前版本 */
	isCurrent?: boolean;
}

/**
 * 审核流程信息
 */
export interface ApprovalFlow {
	/** 流程ID */
	id: string | number;
	/** 流程编号 */
	flowCode: string;
	/** 关联任务ID */
	taskId: string | number;
	/** 任务名称 */
	taskName: string;
	/** 版本号 */
	version: number;
	/** 流程状态 */
	status: "in_progress" | "completed" | "rejected" | "cancelled";
	/** 当前审批人 */
	currentApprover?: string;
	/** 当前审批人ID */
	currentApproverId?: string;
	/** 发起日期 */
	initiateTime: string;
	/** 发起人 */
	initiator: string;
	/** 发起人ID */
	initiatorId?: string | number;
	/** 完成日期 */
	completedTime?: string;
	/** 备注 */
	remark?: string;
}

/**
 * 表格请求参数基础类型
 */
export interface TableRequestParams {
	pageNum: number;
	pageSize: number;
	searchCount?: boolean;
}

/**
 * 表格响应数据基础类型
 */
export interface TableResponse<T> {
	list: T[];
	total: number;
}
