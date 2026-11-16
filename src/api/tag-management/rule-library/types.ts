import type { TagPositionNode } from "../tag-center/types";

/**
 * 标签规则库列表项（接口返回格式）
 */
export interface TagRuleLibraryApiItem {
	/** 主键ID，自增 */
	id: string;
	/** 规则名称（必填） */
	ruleName: string;
	/** 规则定义（长度限制 0-100 字符，必填） */
	ruleDefinition: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType: string;
	/** 配置方式名称 */
	configTypeName: string;
	/** 数据源（数据开发模式下必填） */
	dataSource: string;
	/** 字段（数据开发模式下必填） */
	fields: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule: string;
	/** 更新频次（如"日""周"等） */
	updateFrequency: string;
	/** 更新频次名称 */
	updateFrequencyName: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus: string;
	/** 上线状态名称 */
	onlineStatusName: string;
	/** 标签id */
	tagId: string;
	/** 标签名称 */
	tagName: string;
	/** 标签规则库类型（1:组织标签规则库，2:人才标签规则库） */
	type: string;
	/** 创建人 */
	createBy: string;
	/** 更新人 */
	updateBy: string;
	/** 创建人姓名 */
	createByName: string;
	/** 更新人姓名 */
	updateByName: string;
	/** 创建时间 */
	createTime: string;
	/** 更新时间 */
	updateTime: string;
	/** 标签规则-职位关联表（详情接口返回） */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type: string;
	}>;
	/** 标签规则库类型名称（详情接口返回） */
	typeName?: string;
}

/**
 * 规则库列表查询参数
 */
export interface RuleLibraryListParams {
	/** 主键ID，自增 */
	id?: string;
	/** 规则名称（必填） */
	ruleName?: string;
	/** 规则定义（长度限制 0-100 字符，必填） */
	ruleDefinition?: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType?: string;
	/** 数据源（"数据开发"模式下必填） */
	dataSource?: string;
	/** 字段（"数据开发"模式下必填） */
	fields?: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule?: string;
	/** 更新频次（如"日""周"等） */
	updateFrequency?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus?: string;
	/** 标签id */
	tagId?: string;
	/** 标签名称 */
	tagName?: string;
	/** 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库） */
	type: string;
	/** 创建人ID */
	createBy?: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人ID */
	updateBy?: string;
	/** 更新人姓名 */
	updateByName?: string;
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
}

/**
 * 规则库创建参数
 */
export interface RuleLibraryCreateParams {
	/** 规则名称（必填） */
	ruleName: string;
	/** 规则定义（长度限制 0-100 字符，必填） */
	ruleDefinition: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType: string;
	/** 数据源（"数据开发"模式下必填） */
	dataSource?: string;
	/** 字段（"数据开发"模式下必填） */
	fields?: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule?: string;
	/** 更新频次（如"日""周"等） */
	updateFrequency?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus?: string;
	/** 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库） */
	type: string;
	/** 岗位职位列表 */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id?: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type?: string;
	}>;
}

/**
 * 规则库更新参数
 */
export interface RuleLibraryUpdateParams {
	/** 主键ID */
	id: string;
	/** 规则名称（必填） */
	ruleName: string;
	/** 规则定义（长度限制 0-100 字符，必填） */
	ruleDefinition: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType: string;
	/** 数据源（"数据开发"模式下必填） */
	dataSource?: string;
	/** 字段（"数据开发"模式下必填） */
	fields?: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule?: string;
	/** 更新频次（如"日""周"等） */
	updateFrequency?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus?: string;
	/** 标签规则库类型（必填，'1': 组织标签规则库，'2': 人才标签规则库） */
	type: string;
	/** 创建人 */
	createBy?: string;
	/** 更新人 */
	updateBy?: string;
	/** 标签规则-职位关联列表 */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id?: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type?: string;
	}>;
}

/**
 * 批量修改状态参数
 */
export interface BatchUpdateStatusParams {
	/** 标签规则ID列表 */
	ids: string[];
	/** 上线状态（1:开发中，2:已上线，3:已下线） */
	onlineStatus: string;
}

/**
 * 搜索选项响应数据
 */
export interface SearchOptionsResponse {
	/** 关联标签列表 */
	tagOptions: Array<{
		/** 标签ID */
		tagId: string;
		/** 标签名称 */
		tagName: string;
	}>;
	/** 创建人列表 */
	createByOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
	/** 更新人列表 */
	updateByOptions: Array<{
		/** 用户ID */
		userId: string;
		/** 用户姓名 */
		userName: string;
	}>;
}

/**
 * 岗位职位树节点
 */
export interface JobPositionTreeNode {
	/** 节点ID */
	id: string;
	/** 父节点ID */
	parentId: string;
	/** 父节点名称 */
	parentLabel: string;
	/** 父岗位名称 */
	parentName?: string;
	/** 节点名称 */
	label: string;
	/** 职级 */
	postGrade: number;
	/** 职级名称 */
	postGradeName: string;
	/** 族群名称 */
	ethnicName?: string;
	/** 节点类型: root-根节点, job-岗位, position-职位 */
	type: string;
	/** 子节点列表 */
	children?: JobPositionTreeNode[];
}

/**
 * 校验标签规则名称是否重复的请求参数
 */
export interface CheckDuplicateNameParams {
	/** 规则ID（编辑时传入，新增时可不传） */
	id?: string;
	/** 规则名称，不能为空 */
	name: string;
	/** 标签规则库类型（'1': 组织标签规则库，'2': 人才标签规则库） */
	type: string;
}

/**
 * 未关联标签的规则项
 */
export interface UnassociatedRuleItem {
	/** 规则ID */
	id: string;
	/** 规则名称 */
	ruleName: string;
	/** 标签值 */
	tagValue?: string;
	/** 标签规则-职位关联表 */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type: string;
	}>;
}

/**
 * 人才标签规则数据项
 */
export interface TalentTagRuleDataItem {
	/** 员工工号 */
	empBadge: string;
	/** 姓名 */
	name: string;
	/** 标签值 */
	tagValue: string;
	/** 部门全编码 */
	deptFullCode: string;
	/** 部门全名称 */
	deptFullName: string;
	/** 岗位ID；当前明细查询接口可能不返回 */
	jobId?: number;
	/** 岗位名称；当前明细查询接口可能不返回 */
	jobName?: string;
	/** 职位ID；当前明细查询接口可能不返回 */
	positionId?: number;
	/** 职位名称；当前明细查询接口可能不返回 */
	positionName?: string;
	/** 入职时间；当前明细查询接口可能不返回 */
	entryTime?: string;
}

/**
 * 人才标签规则列表查询参数
 */
export interface TalentTagRuleListParams {
	/** 标签规则ID（必填） */
	tagRuleId: string;
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
	/** 排序字段集合 */
	sortItemList?: {
		/** true正序|false倒序 */
		isAsc: boolean;
		/** 排序字段 */
		column: string;
	}[];
	/** 岗位职位列表 */
	jobPositionList?: TagPositionNode[];
}

/**
 * 组织标签规则数据项
 */
export interface OrgTagRuleDataItem {
	/** 组织全编码 */
	ancestorcode: string;
	/** 组织全名称 */
	ancestorname: string;
	/** 组织类型 */
	orgType: string;
	/** 标签值 */
	tagValue: string;
}

/**
 * 组织标签规则列表查询参数
 */
export interface OrgTagRuleListParams {
	/** 标签规则ID（必填） */
	tagRuleId: string;
	/** 页码(不能为空) */
	pageNum: number;
	/** 每页数量(不能为空) */
	pageSize: number;
	/** 是否查询总条数 */
	searchCount?: boolean;
	/** 排序字段集合 */
	sortItemList?: {
		/** true正序|false倒序 */
		isAsc: boolean;
		/** 排序字段 */
		column: string;
	}[];
}
