/**
 * 标签匹配管理 - 匹配模型类型定义
 */

/**
 * 岗位职位节点数据结构（用于表单提交和接口返回）
 */
export interface JobPostNode {
	/** 节点ID */
	id: string;
	/** 节点名称 */
	label: string;
	/** 父节点ID */
	parentId: string | null;
	/** 父节点名称 */
	parentLabel: string | null;
	/** 职级 */
	postGrade: number | null;
	/** 职级名称 */
	postGradeName: string | null;
	/** 族群名称 */
	ethnicName?: string | null;
	/** 节点类型: root-根节点, job-岗位, position-职位 */
	type: string;
}

/**
 * 匹配模型数据项接口
 */
export interface MatchingModelItem {
	/** 岗位id */
	jobId?: number;
	/** 岗位名称 */
	jobName?: string;
	/** 所属组织（逗号拼接的字符串） */
	orgId?: string;
	/** 所属组织名称 */
	orgName?: string;
	/** 职位id */
	postId?: number;
	/** 职位名称 */
	postName?: string;
	/** 职级id */
	postgradeId?: number;
	/** 职级名称 */
	postgradeName?: string;
	/** 主键id */
	id: string;
	/** 匹配模型名称 */
	name: string;
	/** 匹配模型说明 */
	remark?: string;
	/** 匹配组织层次 */
	orgLevel: string;
	/** 默认基础标签 */
	defaultBaseTag?: string;
	/** 状态 */
	status: string;
	/** 状态名称 */
	statusName?: string;
	/** 创建者 */
	createBy?: string;
	/** 创建者姓名 */
	createByName?: string;
	/** 更新者 */
	updateBy?: string;
	/** 更新者姓名 */
	updateByName?: string;
	/** 标签权重 */
	weightList?: Array<{
		/** 主键id */
		id: string;
		/** 匹配模型id */
		matchModelId: number;
		/** 标签id */
		tagId: number;
		/** 标签名称 */
		tagName: string;
		/** 权重 */
		weight: number;
		/** 是否一票否决: 0-否, 1-是 */
		veto: number;
		/** 一票否决标签值（逗号分隔的字符串） */
		vetoTagValue?: string;
	}>;
	/** 岗位职位节点列表（节点对象数组） */
	jobPostIdList?: JobPostNode[];
	/** 匹配规则列表 */
	modelRuleList?: Array<{
		/** 主键id */
		id: string;
		/** 规则名称 */
		ruleName: string;
		/** 标签匹配规则明细 */
		details: Array<{
			/** 所属组织（逗号拼接的字符串） */
			orgId: string;
			/** 所属组织名称 */
			orgName: string;
			/** 岗位id */
			jobId?: number;
			/** 岗位名称 */
			jobName?: string;
			/** 职位id */
			postId?: number;
			/** 职位名称 */
			postName?: string;
			/** 主键id */
			id: string;
			/** 规则id */
			ruleId: number;
			/** 组织标签id */
			orgTagId: number;
			/** 组织标签名称 */
			orgTagName: string;
			/** 规则结果值 */
			ruleValue: string;
		}>;
	}>;
	/** 匹配规则名称列表 */
	modelRuleNameList?: string[];
}

/**
 * 匹配模型搜索表单接口
 */
export interface MatchingModelSearchForm {
	/** 匹配模型名称 */
	name?: string;
	/** 匹配模型说明 */
	remark?: string;
	/** 匹配组织层次 */
	orgLevel?: string;
	/** 匹配组织（逗号拼接的字符串） */
	orgId?: string;
	/** 匹配组织编码（同时向上查找） */
	orgMatchId?: string;
	/** 匹配组织名称（逗号拼接的字符串） */
	orgName?: string;
	/** 岗位id数组 */
	jobIds?: string[];
	/** 职位id数组 */
	postIds?: string[];
	/** 职级id数组 */
	postLevelIds?: string[];
	/** 状态 */
	status?: string;
	/** 创建者 */
	createBy?: string;
	/** 更新者 */
	updateBy?: string;
}

/**
 * 匹配模型列表查询参数
 */
export interface MatchingModelListParams extends MatchingModelSearchForm {
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
	/** 排序字段集合 */
	sortItemList?: Array<{
		/** 排序字段 */
		column: string;
		/** 是否正序：true-正序，false-倒序 */
		isAsc: boolean;
	}>;
}

/**
 * 匹配模型选项查询参数
 */
export interface MatchingModelOptionQueryParams {
	/** 搜索关键词 */
	q?: string;
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
}

/**
 * 级联选项数据结构
 */
export interface CascaderOption {
	label: string;
	value: string;
	children?: CascaderOption[];
}

/**
 * 匹配模型操作接口
 */
export interface MatchingModelOperation {
	/** 模型ID */
	id: string;
	/** 操作类型 */
	operation: "online" | "offline" | "delete";
	/** 操作原因 */
	reason?: string;
}

/**
 * 规则条件项
 */
export interface RuleCondition {
	/** 唯一标识 */
	id: string;
	/** 组织标签id */
	orgTagId?: string;
	/** 组织标签值（表单中使用数组，保存时转换为逗号拼接的字符串） */
	orgTagValue?: string | string[];
	/** 岗位职位id */
	jobPostId?: string;
	/** 规则结果值 */
	ruleValue?: string;
	/** 人才标签id */
	userTagId?: string;
	/** 人才标签值 */
	userTagValue?: string;
	/** 删除标志 */
	delFlag?: string;
	/** 组织标签名称（用于显示） */
	organizationTag?: string;
}

/**
 * 规则项
 */
export interface RuleItem {
	/** 唯一标识 */
	id: string;
	/** 规则名称 */
	ruleName: string;
	/** 具体规则条件列表 */
	conditions: RuleCondition[];
	/** 删除标志 */
	delFlag?: string;
}

/**
 * 规则库表单数据
 */
export interface RuleLibraryFormData {
	/** 规则列表 */
	rules: RuleItem[];
}

/**
 * 默认模型标签类型
 */
export enum DefaultModelTagType {
	/** 默认基础标签 */
	BASIC = "basic",
	/** 能力标签 */
	ABILITY = "ability",
}

/**
 * 默认模型标签项
 */
export interface DefaultModelTag {
	/** 标签ID */
	id: string;
	/** 标签名称 */
	tagName: string;
	/** 标签类型 */
	tagType?: DefaultModelTagType;
	/** 标签描述 */
	tagDescription?: string;
}

/**
 * 业务类型/标签树节点
 */
export interface BusinessTagTreeNode {
	/** 节点ID */
	id: string;
	/** 节点标签 */
	label: string;
	/** 节点值 */
	value: string;
	/** 是否为标签（叶子节点） */
	isTag?: boolean;
	/** 业务类型 */
	businessType?: string;
	/** 标签值（逗号分隔的字符串，仅标签节点有） */
	tagValue?: string;
	/** 子节点 */
	children?: BusinessTagTreeNode[];
}

/**
 * TreeSelect 树节点类型（使用 label/value/children 格式，与 Cascader 兼容）
 */
export interface TreeSelectNode {
	/** 节点标签 */
	label: string;
	/** 节点值 */
	value: string;
	/** 子节点 */
	children?: TreeSelectNode[];
	/** 是否禁用 */
	disabled?: boolean;
}

/**
 * 标签权重配置项
 */
export interface TagWeightItem {
	/** 唯一标识 */
	id: string;
	/** 标签ID */
	tagId: string;
	/** 标签名称 */
	tagName: string;
	/** 业务类型路径 */
	businessTypePath?: string[];
	/** 权重（0-100） */
	weight: number;
	/** 是否一票否决 */
	isVeto: boolean;
	/** 一票否决标签值（逗号分隔的字符串） */
	vetoTagValue?: string;
	/** 排序顺序 */
	order: number;
}

/**
 * 匹配模型表单数据
 */
export interface MatchingModelFormData {
	/** 匹配模型名称 */
	name: string;
	/** 匹配模型说明 */
	remark?: string;
	/** 匹配组织层次（逗号拼接的字符串） */
	orgLevel: string;
	/** 匹配组织（逗号拼接的字符串） */
	orgId?: string;
	/** 匹配组织名称（逗号拼接的字符串） */
	orgName?: string;
	/** 岗位职位节点ID列表（string[] 格式，用于表单存储） */
	jobPostIdList?: string[];
	/** 匹配规则id列表 */
	modelRuleIdList?: string[];
	/** 默认基础标签 */
	defaultBaseTag?: string;
	/** 标签权重 */
	details?: Array<{
		/** 主键id */
		id?: number;
		/** 匹配模型id */
		matchModelId?: number;
		/** 标签id */
		tagId: number;
		/** 标签名称 */
		tagName: string;
		/** 权重 */
		weight: number;
		/** 是否一票否决: 0-否, 1-是 */
		veto: number;
		/** 一票否决标签值（逗号分隔的字符串） */
		vetoTagValue?: string;
	}>;
}

/**
 * 创建匹配模型参数
 */
export interface CreateMatchingModelParams extends Omit<MatchingModelFormData, "jobPostIdList"> {
	/** 主键id（新增时不需要） */
	id?: string;
	/** 岗位职位节点列表（节点对象数组，提交时使用） */
	jobPostIdList?: JobPostNode[];
}

/**
 * 更新匹配模型参数
 */
export interface UpdateMatchingModelParams extends Omit<CreateMatchingModelParams, "id"> {
	/** 模型ID */
	id: string;
}

/**
 * 匹配模型详情响应（字段与后端接口保持一致）
 */
export interface MatchingModelDetailResponse extends MatchingModelItem {
	/** 匹配规则id数组 */
	modelRuleIdList?: number[];
}
