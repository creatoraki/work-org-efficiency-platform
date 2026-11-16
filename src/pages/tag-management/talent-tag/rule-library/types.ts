/**
 * 组织标签规则库数据项接口（直接使用后端字段名）
 */
export interface TagRuleLibraryItem {
	/** 主键ID，自增 */
	id: string;
	/** 规则名称 */
	ruleName: string;
	/** 规则定义 */
	ruleDefinition: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType: string;
	/** 配置方式名称 */
	configTypeName?: string;
	/** 数据源（数据开发模式下必填） */
	dataSource?: string;
	/** 字段（数据开发模式下必填） */
	fields?: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 更新频次名称 */
	updateFrequencyName?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus: string;
	/** 上线状态名称 */
	onlineStatusName?: string;
	/** 标签id */
	tagId?: string;
	/** 标签名称 */
	tagName?: string;
	/** 创建人ID */
	createBy?: string;
	/** 更新人ID */
	updateBy?: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人姓名 */
	updateByName?: string;
	/** 创建时间 */
	createTime?: string;
	/** 更新时间 */
	updateTime?: string;
	/** 标签规则-职位关联表 */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type: string;
	}>;
}

/**
 * 标签规则表单数据接口
 */
export interface TagRuleFormData {
	/** 规则名称 */
	ruleName: string;
	/** 规则定义 */
	ruleDefinition: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType: string;
	/** 数据源（数据开发模式下必填） */
	dataSource?: string;
	/** 字段（数据开发模式下必填） */
	fields?: string;
	/** 配置规则，存储具体口径或具体规则 */
	configRule?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus?: string;
	/** 标签id */
	tagId?: string;
	/** 标签名称 */
	tagName?: string;
	/** 岗位职位列表 */
	tagRulePositionList?: Array<{
		/** 节点ID */
		id?: string;
		/** 节点类型: root-根节点, job-岗位, position-职位 */
		type?: string;
	}>;
}

/**
 * 标签规则查询表单接口
 */
export interface TagRuleSearchForm {
	/** 规则名称 */
	ruleName?: string;
	/** 规则定义 */
	ruleDefinition?: string;
	/** 配置方式（1:数据开发，2:现有标签配置） */
	configType?: string;
	/** 更新频次 */
	updateFrequency?: string;
	/** 上线状态（0:未上线，1:开发中，2:已上线，3:已下线） */
	onlineStatus?: string;
	/** 标签名称 */
	tagName?: string;
	/** 创建人姓名 */
	createByName?: string;
	/** 更新人姓名 */
	updateByName?: string;
}

/**
 * 批量操作类型
 */
export type BatchOperationType = "online" | "offline" | "delete";

/**
 * 操作按钮类型
 */
export type OperationButtonType = "edit" | "delete" | "online" | "offline";
