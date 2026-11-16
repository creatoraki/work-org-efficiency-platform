/**
 * 标签表单抽屉 - 类型定义
 */

import type { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import type { FORM_MODE } from "./constants";

/**
 * 标签中心数据项类型（通用）
 */
export interface TagCenterItem {
	id?: string;
	tagType?: TAG_TYPE;
	tagName?: string;
	tagRulesId?: string;
	tagRulesName?: string;
	tagValue?: string;
	tagDescription?: string;
	aiTagDescription?: string;
	businessCategory?: string | string[];
	isRequired?: string;
	sensitivityLevel?: string;
	existenceCycle?: string;
	updateFrequency?: string;
	auditor?: string;
	auditComment?: string;
	maintainer?: string;
	maintainerName?: string;
	maintainerType?: string;
	isAuditTagging?: string;
	auditProcessTagging?:
		| string
		| Array<{
				step: string | number;
				stepName: string;
				approver: string | number;
				type: string;
				approverName?: string;
		  }>;
	isAttProofTagging?: string;
	attProofReqsTagging?: string;
	isFtfInterview?: string;
	ftfInterviewUpdFreq?: string;
	ftfInterviewer?: string;
	tagPositionList?: Array<{
		id: string;
		type: string;
	}>;
	/** 标签是否已存在（来自 AI 返回） */
	isExisting?: boolean;
	/** 在组织大脑呈现 */
	isDisplayInOrgBrain?: boolean;
	/** 标签显隐情况 */
	tagVisibility?: string;
	/** 标签分布模块 */
	tagDistributionModule?: string;
	[key: string]: unknown;
}

/**
 * 智能标签数据项
 *
 * 说明：
 * - AI 对话无论返回单个还是多个标签，每个标签的数据结构都使用此类型
 * - 单个标签：AiTagTabItem
 * - 多个标签：AiTagTabItem[]
 * - 继承 TagCenterItem 所有字段，确保与表单数据结构一致
 */
export interface AiTagTabItem extends Omit<TagCenterItem, "id"> {
	/** 临时唯一标识（用于 Tab 管理，前端生成） */
	tempId: string;
	/** 标签ID（AI 返回，新增和已存在的标签都有） */
	tagId?: string;
	/** 已存在标签的ID（AI 返回，仅已存在标签有） */
	existingTagId?: string;
}

/**
 * AI 智能标签页签状态。
 *
 * 该结构用于隔离多标签编辑态：顶层字段承载页签身份和后端生命周期信息，
 * values 仅保存用户可编辑表单快照，避免表单字段与删除/下线所需 code 混在一起。
 */
export interface AiTagTabState {
	/** 临时唯一标识，仅用于前端 tab 切换和定位 */
	tempId: string;
	/** AI 标签元数据 code，用于删除、下线等后端状态流转 */
	tagId?: string;
	/** 已存在标签 code，用于提交时关联原标签 */
	existingTagId?: string;
	/** 是否为已存在标签，影响删除文案、提交语义和 tab 展示 */
	isExisting?: boolean;
	/** 当前页签可编辑表单快照 */
	values: TagCenterItem;
	/** 当前页签提交前业务校验错误 */
	errors: Record<string, string[]>;
	/** 是否被用户修改过，用于后续扩展离开提示或完成态判断 */
	dirty: boolean;
}

/**
 * 新增入口的单标签草稿。
 *
 * 仅服务 add + single 场景，允许从默认值模板起步并持续补齐创建所需字段。
 */
export type AddSingleTagDraft = TagCenterItem;

/**
 * 编辑入口的单标签草稿。
 *
 * 仅服务 edit 场景，必须保持与后端详情回显语义一致，
 * 不再复用新增默认值模板的生命周期字段。
 */
export type EditTagDraft = TagCenterItem;

/**
 * AI 结果查看上下文。
 *
 * 统一封装“是否可查看”所需的 labelCode 与展示描述，避免 UI 和点击事件各自重复判断。
 */
export interface AiTagResultContext {
	labelCode?: string;
	tagDescription?: string;
}

/**
 * 标签表单提交值。
 *
 * 新增创建统一走数组 body，编辑更新继续沿用单对象。
 */
export type TagFormSubmitValues = TagCenterItem | TagCenterItem[];

/**
 * 新增标签抽屉交互模式。
 *
 * single 表示单标签编辑心智，batch 表示一次 AI 多标签任务。
 */
export type TagFormInteractionMode = "single" | "batch";

/**
 * 标签抽屉最小摘要上下文。
 *
 * 父层在编辑/只读场景只需要提供“当前要操作哪一个标签”的最小标识，
 * 详情真值统一由抽屉内部自行拉取，避免把列表半详情对象误当成表单初始值。
 */
export interface TagFormDrawerTagSummary {
	/** 标签主键 ID，供抽屉内部拉取详情与更新时定位目标 */
	id: string;
	/** 标签名称，仅用于补充上下文或后续扩展，不参与表单初始化 */
	tagName?: string;
	/** 列表中的标签类型快照，仅用于补充上下文，不参与表单初始化 */
	tagType?: TAG_TYPE;
}

/**
 * 标签表单抽屉组件属性。
 */
interface TagFormDrawerBaseProps {
	/** 是否显示抽屉 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 提交成功后的回调 */
	onSubmitSuccess?: () => void | Promise<void>;
	/** 标题 */
	title: string;
	/** 标签库类型 */
	tagLibraryType: TAG_RULE_TYPE_DICT;
}

export type TagFormDrawerProps =
	| (TagFormDrawerBaseProps & {
			/** 新增模式 */
			mode: FORM_MODE.ADD;
			/** 新增模式的默认表单值，仅 add 场景使用 */
			defaultValues?: Partial<TagCenterItem>;
			/** 新增模式不传详情摘要 */
			tagSummary?: never;
	  })
	| (TagFormDrawerBaseProps & {
			/** 编辑模式 */
			mode: FORM_MODE.EDIT;
			/** 编辑模式不使用新增默认值 */
			defaultValues?: never;
			/** 编辑模式的最小标签摘要，仅用于定位详情 */
			tagSummary: TagFormDrawerTagSummary;
	  })
	| (TagFormDrawerBaseProps & {
			/** 只读模式 */
			mode: FORM_MODE.READONLY;
			/** 只读模式不使用新增默认值 */
			defaultValues?: never;
			/** 只读模式的最小标签摘要，仅用于定位详情 */
			tagSummary: TagFormDrawerTagSummary;
	  });

/**
 * 维护人/审批人选择器值类型
 */
export interface MaintainerSelectorValue {
	type: "person" | "role";
	typeValue: "1" | "2";
	person?: {
		id: string;
		name: string;
		deptPath: string;
	};
	role?: string;
}

/**
 * 维护人角色字典选项。
 */
export interface MaintainerRoleOption {
	value: string;
	label: string;
	dictCode?: string | number;
}
