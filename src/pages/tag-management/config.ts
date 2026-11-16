/**
 * 标签管理模块统一配置
 */

import type { TagCenterStatus } from "#src/api/tag-management/tag-center/types";
import { TAG_CENTER_STATUS_DICT } from "#src/api/tag-management/tag-center/types";

/**
 * 字典数据缓存时间（毫秒）：5分钟
 * 用于组织树、岗位、职位、职级等字典数据的缓存
 */
export const DICT_CACHE_TIME = 5 * 60 * 1000;

/**
 * 数据缓存时间配置（毫秒）
 */
export const CACHE_TIME = {
	/** 组织树数据缓存时间 */
	ORGANIZATION_TREE: DICT_CACHE_TIME,
	/** 岗位字典数据缓存时间 */
	JOB_DICT: DICT_CACHE_TIME,
	/** 职位字典数据缓存时间 */
	POSITION_DICT: DICT_CACHE_TIME,
	/** 职级字典数据缓存时间 */
	JOB_LEVEL_DICT: DICT_CACHE_TIME,
} as const;

/**
 * 标签管理字典 key 统一管理
 */
export const TAG_DICT_KEYS = {
	// 配置方式字典
	CONFIG_TYPE: "tag_rule_config_type",
	// 更新频次字典
	UPDATE_FREQUENCY: "tag_rule_update_frequency",
	// 上线状态字典
	ONLINE_STATUS: "tag_rule_online_status",
	// 标签类型字典
	TAG_TYPE: "tag_type",
	// 标签业务类别字典（人才标签）
	BUSINESS_CATEGORY: "tag_business_category",
	// 组织业务类别字典（组织标签）
	ORG_BUSINESS_CATEGORY: "tag_org_business_category",
	// 标签敏感程度字典
	SENSITIVITY_LEVEL: "tag_sensitivity_level",
	// 标签中心审核人字典
	CENTER_AUDITOR: "tag_center_auditor",
	// 标签审核状态字典
	AUDIT_STATUS: "tag_audit_status",
	// 标签状态字典
	STATUS: "tag_status",
	// 面谈更新频次字典
	FTF_INTERVIEW_UPDATE_FREQUENCY: "tag_ftf_interview_upd_freq",
	// 档案目的字典
	USER_TAG_PURPOSE: "user_tag_purpose",
	// 标签审核状态字典（用户标签）
	USER_TAG_APPROVAL_STATUS: "user_tag_approval_status",
	// 面谈状态字典
	USER_INTERVIEW_STATUS: "user_interview_status",
	// 角色类型字典
	SYS_ROLE_TYPE: "sys_role_type",
	// 角色状态字典
	SYS_ROLE_STATUS: "sys_role_status",
	// 保密等级字典
	CONFIDENTIAL_LEVEL: "confidential_level",
	// 匹配模型状态字典
	MATCHING_MODEL_STATUS: "tag_match_rule_status",
	// 组织层级字典
	ORG_LEVEL: "org_level",
	// 匹配模型组织层级字典
	ORG_LEVEL_FOR_MATCH_MODEL: "org_level_for_match_model",
	// 岗位描述审核部门字典
	JOB_AUDIT_DEPT: "job_audit_dept",
	// 员工标签维护人角色字典
	MAINTAINER_ROLE: "employee_tag_maintainer_role",
	// 标签分布模块字典
	TAG_USER_DISTRIBUTION_MODULE: "tag_user_distribution_module",
} as const;

// 上线状态枚举
export enum OnlineStatus {
	OFFLINE = "offline", // 未上线
	DEVELOPING = "developing", // 开发中
	ONLINE = "online", // 已上线
}

/**
 * 配置方式枚举
 */
export enum ConfigMode {
	DATA_DEVELOPMENT = "data_development", // 数据开发
	EXISTING_TAG_CONFIG = "existing_tag_config", // 现有标签配置
}

// 上线状态标签配置
export const ONLINE_STATUS_TAG_CONFIG = {
	[OnlineStatus.OFFLINE]: {
		color: "orange",
		text: "未上线",
	},
	[OnlineStatus.DEVELOPING]: {
		color: "red",
		text: "开发中",
	},
	[OnlineStatus.ONLINE]: {
		color: "green",
		text: "已上线",
	},
};

/**
 * 配置方式选项
 */
export const CONFIG_MODE_OPTIONS = [
	{ label: "数据开发", value: ConfigMode.DATA_DEVELOPMENT },
	{ label: "现有标签配置", value: ConfigMode.EXISTING_TAG_CONFIG },
];

/**
 * 标签类型枚举
 */
export enum TAG_TYPE {
	/** 手工标签 */
	MANUAL = "1",
	/** 系统标签 */
	SYSTEM = "2",
	/** 智能标签 */
	INTELLIGENT = "3",
}

export enum YES_NO {
	/** 是 */
	YES = "1",
	/** 否 */
	NO = "0",
}

/**
 * 是否必填选项
 */
export const IS_REQUIRED_OPTIONS = [
	{ label: "是", value: YES_NO.YES },
	{ label: "否", value: YES_NO.NO },
];

/**
 * 操作类型
 */
export type OperationType = "edit" | "delete" | "online" | "offline";

// 操作按钮映射规则
export const OPERATION_BUTTON_MAPPING = {
	[OnlineStatus.ONLINE]: ["edit", "delete", "offline"], // 已上线：编辑、删除、下线
	[OnlineStatus.OFFLINE]: ["edit", "delete", "online"], // 未上线：编辑、删除、上线
	[OnlineStatus.DEVELOPING]: [], // 开发中：禁止操作
};

// 操作按钮文本配置
export const OPERATION_BUTTON_TEXT: Record<OperationType, string> = {
	edit: "编辑",
	delete: "删除",
	online: "上线",
	offline: "下线",
};

/**
 * 重要等级选项
 */
export const IMPORTANCE_LEVEL_OPTIONS = [
	{ label: "高", value: "high" },
	{ label: "中", value: "medium" },
	{ label: "低", value: "low" },
];

/**
 * 状态选项
 */
export const STATUS_OPTIONS = [
	{ label: "启用", value: "active" },
	{ label: "禁用", value: "inactive" },
];

/**
 * 批量操作类型枚举
 */
export const BATCH_OPERATION_TYPES = {
	ONLINE: "online",
	OFFLINE: "offline",
	DELETE: "delete",
} as const;

/**
 * 批量操作文本配置
 */
export const BATCH_OPERATION_TEXT = {
	online: "批量上线",
	offline: "批量下线",
	delete: "批量删除",
} satisfies Record<string, string>;

/**
 * 批量操作确认配置
 */
export const BATCH_OPERATION_CONFIRM_CONFIG = {
	online: {
		title: "批量上线确认",
		content: "确定要将选中的 {count} 个项目批量上线吗？",
	},
	offline: {
		title: "批量下线确认",
		content: "确定要将选中的 {count} 个项目批量下线吗？",
	},
	delete: {
		title: "批量删除确认",
		content: "确定要删除选中的 {count} 个项目吗？此操作不可撤销。",
	},
};

/**
 * 标签中心状态字典常量（从 API 层导入）
 */
export { TAG_CENTER_STATUS_DICT };

/**
 * 标签中心状态类型（从 API 层导入）
 */
export type { TagCenterStatus };

/**
 * 标签中心状态选项（使用字典，通过 useDict(TAG_DICT_KEYS.STATUS) 获取）
 * 注意：此配置已废弃，请使用字典获取
 */
export const TAG_CENTER_STATUS_OPTIONS = [
	{ label: "待上线", value: TAG_CENTER_STATUS_DICT.OFFLINE },
	{ label: "审核中", value: TAG_CENTER_STATUS_DICT.REVIEWING },
	{ label: "已上线", value: TAG_CENTER_STATUS_DICT.ONLINE },
	{ label: "已拒绝", value: TAG_CENTER_STATUS_DICT.REJECTED },
	{ label: "已下线", value: TAG_CENTER_STATUS_DICT.OFFLINED },
];

/**
 * 规则库状态枚举
 */
export enum RuleLibraryStatus {
	OFFLINE = "offline", // 未上线
	DEVELOPING = "developing", // 开发中
	ONLINE = "online", // 已上线
	OFFLINED = "offlined", // 已下线
}

/**
 * 审核相关状态枚举
 */
export enum AuditStatus {
	PENDING = "pending", // 待审核
	APPROVED = "approved", // 已通过
	REJECTED = "rejected", // 已拒绝
}

/**
 * 审核状态标签配置
 */
export const AUDIT_STATUS_TAG_CONFIG = {
	[AuditStatus.PENDING]: { color: "#FF7D00", backgroundColor: "#FFEFE0", text: "待审核" },
	[AuditStatus.APPROVED]: { color: "#14B968", backgroundColor: "#E8F5E8", text: "已通过" },
	[AuditStatus.REJECTED]: { color: "#F5222D", backgroundColor: "#FFEBEE", text: "已拒绝" },
};

/**
 * 审核状态选项
 */
export const AUDIT_STATUS_OPTIONS = [
	{ label: "待审核", value: AuditStatus.PENDING },
	{ label: "已通过", value: AuditStatus.APPROVED },
	{ label: "已拒绝", value: AuditStatus.REJECTED },
];

/**
 * 审核类型枚举
 */
export enum AuditType {
	CREATE = "create", // 创建
	UPDATE = "update", // 更新
	DELETE = "delete", // 删除
}

/**
 * 审核类型标签配置
 */
export const AUDIT_TYPE_LABELS = {
	[AuditType.CREATE]: "创建",
	[AuditType.UPDATE]: "更新",
	[AuditType.DELETE]: "删除",
};

/**
 * 审核类型选项
 */
export const AUDIT_TYPE_OPTIONS = [
	{ label: "创建", value: AuditType.CREATE },
	{ label: "更新", value: AuditType.UPDATE },
	{ label: "删除", value: AuditType.DELETE },
];

/**
 * 审核批量操作配置
 */
export const TAG_AUDIT_BATCH_OPERATION_CONFIG = {
	approve: {
		title: "批量通过确认",
		content: "确定要将选中的 {count} 个审核项批量通过吗？",
	},
	reject: {
		title: "批量拒绝确认",
		content: "确定要将选中的 {count} 个审核项批量拒绝吗？",
	},
};

/**
 * 规则库操作按钮映射规则
 */
export const RULE_LIBRARY_OPERATION_BUTTON_MAPPING: Record<RuleLibraryStatus, string[]> = {
	[RuleLibraryStatus.ONLINE]: ["offline"], // 已上线：下线
	[RuleLibraryStatus.OFFLINE]: ["edit", "delete", "online"], // 未上线：编辑、删除、上线
	[RuleLibraryStatus.DEVELOPING]: [], // 开发中：禁止操作
	[RuleLibraryStatus.OFFLINED]: ["edit", "online"], // 已下线：编辑、上线
};

/**
 * 规则库批量操作配置
 */
export const RULE_LIBRARY_BATCH_OPERATION_CONFIG = {
	online: {
		title: "批量上线确认",
		content: "确定要将选中的 {count} 个规则批量上线吗？",
	},
	offline: {
		title: "批量下线确认",
		content: "确定要将选中的 {count} 个规则批量下线吗？",
	},
	delete: {
		title: "批量删除确认",
		content: "确定要删除选中的 {count} 个规则吗？此操作不可撤销。",
	},
};

/**
 * 标签规则库字典定义
 */

/**
 * 配置方式字典 (tag_config_type)
 */
export const TAG_CONFIG_TYPE_DICT = {
	DATA_DEVELOPMENT: "1", // 数据开发
	EXISTING_TAG_CONFIG: "2", // 现有标签配置
} as const;

/**
 * 配置方式字典选项
 */
export const TAG_CONFIG_TYPE_OPTIONS = [
	{ label: "数据开发", value: TAG_CONFIG_TYPE_DICT.DATA_DEVELOPMENT },
	{ label: "现有标签配置", value: TAG_CONFIG_TYPE_DICT.EXISTING_TAG_CONFIG },
];

/**
 * 配置方式字典映射
 */
export const TAG_CONFIG_TYPE_MAP: Record<string, string> = TAG_CONFIG_TYPE_OPTIONS.reduce(
	(acc, opt) => {
		acc[opt.value] = opt.label;
		return acc;
	},
	{} as Record<string, string>,
);

/**
 * 上线状态字典 (tag_rule_online_status)
 */
export const TAG_RULE_ONLINE_STATUS_DICT = {
	NOT_ONLINE: "0", // 未上线
	DEVELOPING: "1", // 开发中
	ONLINE: "2", // 已上线
	OFFLINE: "3", // 已下线
} as const;

/**
 * 上线状态字典选项
 */
export const TAG_RULE_ONLINE_STATUS_OPTIONS = [
	{ label: "未上线", value: TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE },
	{ label: "开发中", value: TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING },
	{ label: "已上线", value: TAG_RULE_ONLINE_STATUS_DICT.ONLINE },
	{ label: "已下线", value: TAG_RULE_ONLINE_STATUS_DICT.OFFLINE },
];

/**
 * 上线状态字典映射
 */
export const TAG_RULE_ONLINE_STATUS_MAP: Record<string, string> =
	TAG_RULE_ONLINE_STATUS_OPTIONS.reduce(
		(acc, opt) => {
			acc[opt.value] = opt.label;
			return acc;
		},
		{} as Record<string, string>,
	);

/**
 * 上线状态徽章配置映射
 */
export const TAG_RULE_ONLINE_STATUS_BADGE_CONFIG = {
	[TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE]: {
		color: "#8C8C8C",
		backgroundColor: "#F5F5F5",
		text: "未上线",
	},
	[TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING]: {
		color: "#0075FF",
		backgroundColor: "#E6F4FF",
		text: "开发中",
	},
	[TAG_RULE_ONLINE_STATUS_DICT.ONLINE]: {
		color: "#14B968",
		backgroundColor: "#E8F5E8",
		text: "已上线",
	},
	[TAG_RULE_ONLINE_STATUS_DICT.OFFLINE]: {
		color: "#FF7D00",
		backgroundColor: "#FFEFE0",
		text: "已下线",
	},
} satisfies Record<string, { color: string; backgroundColor: string; text: string }>;

/**
 * 规则库操作按钮映射规则（基于 TAG_RULE_ONLINE_STATUS_DICT）
 */
export const TAG_RULE_OPERATION_MAPPING: Record<string, readonly OperationType[]> = {
	[TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE]: [
		"online",
		"edit",
		"delete",
	] as const satisfies readonly OperationType[], // 未上线：上线、编辑、删除
	[TAG_RULE_ONLINE_STATUS_DICT.DEVELOPING]: [] as const satisfies readonly OperationType[], // 开发中：无操作（不能编辑、不能删除）
	[TAG_RULE_ONLINE_STATUS_DICT.ONLINE]: ["offline"] as const satisfies readonly OperationType[], // 已上线：下线
	[TAG_RULE_ONLINE_STATUS_DICT.OFFLINE]: [
		"online",
		"edit",
	] as const satisfies readonly OperationType[], // 已下线：上线、编辑
};

/**
 * 规则库批量操作过滤规则（定义哪些状态可以进行哪些批量操作）
 */
export const TAG_RULE_BATCH_OPERATION_FILTER: Record<"online" | "offline" | "delete", string[]> = {
	online: [TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE, TAG_RULE_ONLINE_STATUS_DICT.OFFLINE], // 批量上线：未上线、已下线
	offline: [TAG_RULE_ONLINE_STATUS_DICT.ONLINE], // 批量下线：已上线
	delete: [TAG_RULE_ONLINE_STATUS_DICT.NOT_ONLINE], // 批量删除：未上线
};

/**
 * 标签规则库类型枚举
 */
export enum TAG_RULE_TYPE_DICT {
	/** 组织标签规则库 */
	ORG = "1",
	/** 人才标签规则库 */
	TALENT = "2",
}

/**
 * 标签规则库类型字典文本映射
 */
export const TAG_RULE_TYPE_LABELS = {
	[TAG_RULE_TYPE_DICT.ORG]: "组织标签规则库",
	[TAG_RULE_TYPE_DICT.TALENT]: "人才标签规则库",
} satisfies Record<string, string>;

/**
 * 标签中心状态标签映射
 */
export const TAG_CENTER_STATUS_LABELS: Record<TagCenterStatus, string> = {
	[TAG_CENTER_STATUS_DICT.OFFLINE]: "待上线",
	[TAG_CENTER_STATUS_DICT.REVIEWING]: "审核中",
	[TAG_CENTER_STATUS_DICT.ONLINE]: "已上线",
	[TAG_CENTER_STATUS_DICT.REJECTED]: "已拒绝",
	[TAG_CENTER_STATUS_DICT.OFFLINED]: "已下线",
};

/**
 * 标签中心操作按钮映射规则
 */
export const TAG_CENTER_OPERATION_BUTTON_MAPPING: Record<
	TagCenterStatus,
	readonly OperationType[]
> = {
	[TAG_CENTER_STATUS_DICT.OFFLINE]: [
		"edit",
		"online",
		"delete",
	] as const satisfies readonly OperationType[], // 待上线：编辑、删除、上线
	[TAG_CENTER_STATUS_DICT.REVIEWING]: [] as const satisfies readonly OperationType[], // 审核中：无操作
	[TAG_CENTER_STATUS_DICT.ONLINE]: ["offline"] as const satisfies readonly OperationType[], // 已上线：下线
	[TAG_CENTER_STATUS_DICT.REJECTED]: [
		"edit",
		"online",
		"delete",
	] as const satisfies readonly OperationType[], // 已拒绝：编辑、删除、上线
	[TAG_CENTER_STATUS_DICT.OFFLINED]: [
		"edit",
		"online",
	] as const satisfies readonly OperationType[], // 已下线：编辑、上线
};

/**
 * 标签中心批量操作配置
 */
export const TAG_CENTER_BATCH_OPERATION_CONFIG = {
	online: {
		title: "批量上线确认",
		content: "确定要将选中的 {count} 个标签批量上线吗？",
	},
	offline: {
		title: "批量下线确认",
		content: "确定要将选中的 {count} 个标签批量下线吗？",
	},
	delete: {
		title: "批量删除确认",
		content: "确定要删除选中的 {count} 个标签吗？此操作不可撤销。",
	},
};

/**
 * 表格默认配置
 */
export const TABLE_CONFIG = {
	/** 表格工具栏配置 */
	OPTIONS: {
		reload: false,
		density: false,
		fullScreen: false,
		setting: true,
	},
	/** 分页配置 */
	PAGINATION: {
		defaultPageSize: 10,
		showSizeChanger: true,
		showQuickJumper: true,
		pageSizeOptions: ["10", "20", "50", "100"] satisfies readonly (string | number)[],
		showTotal: (total: number) => `共 ${total} 条`,
	},
} as const;

/**
 * 审核操作按钮映射规则
 */
export const TAG_AUDIT_OPERATION_BUTTON_MAPPING: Record<AuditStatus, string[]> = {
	[AuditStatus.PENDING]: ["approve", "reject", "detail"], // 待审核：通过、拒绝、详情
	[AuditStatus.APPROVED]: ["detail", "records"], // 已通过：详情、记录
	[AuditStatus.REJECTED]: ["detail", "records"], // 已拒绝：详情、记录
};

/**
 * 审核操作按钮文本配置
 */
export const TAG_AUDIT_OPERATION_BUTTON_TEXT = {
	approve: "通过",
	reject: "拒绝",
	detail: "详情",
	records: "记录",
} satisfies Record<string, string>;

/**
 * 审核表格列配置
 */
export const TAG_AUDIT_TABLE_COLUMNS_CONFIG = {
	/** 默认显示的列 */
	defaultColumns: ["tagName", "auditType", "applicant", "applyTime", "auditStatus", "operation"],
	/** 可选择显示的列 */
	optionalColumns: ["auditor", "auditTime", "auditReason"],
};

/**
 * 审核分页配置
 */
export const TAG_AUDIT_PAGINATION_CONFIG = {
	/** 默认页大小 */
	defaultPageSize: 10,
	/** 页大小选项 */
	pageSizeOptions: ["10", "20", "50", "100"],
	/** 显示快速跳转 */
	showQuickJumper: true,
	/** 显示总数 */
	showTotal: (total: number, range: [number, number]) =>
		`第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
};

/**
 * 默认面谈人字典项 code（employee_tag_maintainer_role -> 集团本体负责人）
 */
export const DEFAULT_FTF_INTERVIEWER_DICT_CODE = 205;

/**
 * 表单校验规则
 */
export const FORM_RULES = {
	required: [{ required: true, message: "此字段为必填项" }],
	ruleName: [
		{ required: true, message: "请输入规则名称" },
		{ max: 50, message: "规则名称不能超过50个字符" },
	],
	ruleDefinition: [
		{ required: true, message: "请输入规则定义" },
		{ max: 200, message: "规则定义不能超过200个字符" },
	],
	dataSource: [
		{ required: true, message: "请输入数据源" },
		{ max: 100, message: "数据源不能超过100个字符" },
	],
	field: [
		{ required: true, message: "请输入字段" },
		{ max: 50, message: "字段不能超过50个字符" },
	],
	specificCriteria: [
		{ required: true, message: "请输入具体标准" },
		{ max: 500, message: "具体标准不能超过500个字符" },
	],
	updateFrequency: [{ required: true, message: "请选择更新频次" }],
	configMode: [{ required: true, message: "请选择配置方式" }],
	tagRulePositionList: [
		{
			required: true,
			message: "请选择人员范围",
			validator: (_: any, value: any) => {
				if (!value || (Array.isArray(value) && value.length === 0)) {
					return Promise.reject(new Error("请选择人员范围"));
				}
				return Promise.resolve();
			},
		},
	],
};

/**
 * 标签管理模块权限标识管理
 *
 * 谨慎修改，避免权限失效
 */
export const TAG_MANAGEMENT_PERMISSIONS = {
	/** 标签审核权限：用于组织标签审核和人才标签审核的批量审核、审核按钮 */
	TAG_APPROVE_APPROVE: "tagmanage:tagApprove:approve",
	/** 岗位描述导入权限：用于岗位描述管理的导入岗位描述按钮 */
	JOB_DESCRIPTION_IMPORT: "jobdescription:import",
	/** 岗位描述审核权限：用于岗位描述审核的批量审核、审核按钮 */
	JOB_AUDIT_APPROVE: "jobaudit:approve",
	/** 匹配模型规则库维护权限：用于标签匹配管理的规则库维护按钮 */
	MATCH_MODEL_RULE_CREATE: "matchmodel:rule:create",
} as const;
