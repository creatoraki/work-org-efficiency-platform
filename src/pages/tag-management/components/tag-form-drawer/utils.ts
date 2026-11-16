/**
 * 标签表单抽屉工具函数。
 *
 * 封装复合规则 iframe URL 构建、业务类别路径解析、人员范围转换，
 * 以及编辑/查看抽屉共用的标签类型判断与审核区块标题逻辑。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { LabelMetaItem } from "#src/api/tag-management/tag-center/ai-tag";
import type { AiSmartTagsReturnedPayload } from "../shared";
import type { AiTagTabItem, TagCenterItem } from "./types";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import dayjs from "dayjs";
import { DEFAULT_IS_REQUIRED, RULE_SOURCE_VALUES } from "./constants";

const STRING_SELECT_FIELD_NAMES = [
	"tagType",
	"isRequired",
	"sensitivityLevel",
	"updateFrequency",
	"auditor",
	"maintainer",
	"maintainerType",
	"isAuditTagging",
	"isAttProofTagging",
	"isFtfInterview",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
	"tagVisibility",
	"tagDistributionModule",
	"ruleSelectionType",
] as const;

const ARRAY_STRING_FIELD_NAMES = ["useScope"] as const;

/**
 * 业务类别 Cascader 选项
 */
export interface BusinessCategoryOption {
	label: string;
	value: string;
	children?: BusinessCategoryOption[];
}

/**
 * 获取智能标签任务说明文案。
 *
 * 单标签与多标签都展示统一说明区，但错误处理提示按交互模式区分：
 * - 单标签：重名后不支持改名，应重新向 AI 描述标签
 * - 多标签：新增标签重名后应删除对应 tab item
 *
 * @param params - 说明文案参数
 * @param params.isBatchTask - 是否为多标签任务
 * @returns 智能标签任务说明文案
 *
 * @author 王善能
 * @since 2026-06-25
 */
export function getAiTaskInstructionText(params: { isBatchTask: boolean }): string {
	if (params.isBatchTask) {
		return "新增标签请补充剩余基础信息，已有标签可查看最新结果。确定后将完成新增和已有标签最新结果的更新，点击标签的“x”将取消新增或者更新。";
	}

	return "请补充剩余基础信息；若智能标签中文名与已有标签重复，当前不支持改名，请重新向 AI 描述标签。";
}

/**
 * 将字典类字段统一规范为字符串，避免 Select 显示值与真实状态值类型漂移。
 *
 * @param values - 待规范化的表单草稿
 * @returns 规范化后的草稿对象
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function normalizeTagDraftValues<T extends TagCenterItem>(values: T): T {
	const nextValues = { ...values } as Record<string, unknown>;

	// 后端详情接口对「当前标签类型不适用」的字段返回 null（如智能标签的 maintainer、ruleSelectionType），
	// 而 zod 的 optional string 只接受 undefined。入库前统一清理，避免误报校验失败。
	Object.keys(nextValues).forEach((fieldName) => {
		if (nextValues[fieldName] === null) {
			delete nextValues[fieldName];
		}
	});

	STRING_SELECT_FIELD_NAMES.forEach((fieldName) => {
		const value = nextValues[fieldName];
		if (value !== undefined && value !== null && value !== "") {
			nextValues[fieldName] = String(value);
		}
	});

	ARRAY_STRING_FIELD_NAMES.forEach((fieldName) => {
		const value = nextValues[fieldName];
		if (Array.isArray(value)) {
			nextValues[fieldName] = value.map((item) => String(item));
		}
	});

	if (nextValues.businessCategory !== undefined && nextValues.businessCategory !== null) {
		nextValues.businessCategory = Array.isArray(nextValues.businessCategory)
			? nextValues.businessCategory.map((item) => String(item))
			: String(nextValues.businessCategory);
	}

	if (Array.isArray(nextValues.tagPositionList)) {
		nextValues.tagPositionList = nextValues.tagPositionList.map((item) => ({
			id: String(item?.id || "0"),
			type: String(item?.type || "root"),
		}));
	}

	return nextValues as T;
}

/**
 * 构建标签表单默认草稿。
 *
 * 单标签与智能标签多 tab 初始化都基于同一套默认值生成，保证真相源从创建时就是完整草稿。
 *
 * @param tagLibraryType - 标签库类型
 * @param tagType - 标签类型
 * @returns 默认草稿
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function buildDefaultTagDraft(
	tagLibraryType: TAG_RULE_TYPE_DICT,
	tagType: TAG_TYPE,
): TagCenterItem {
	const baseDraft: TagCenterItem = normalizeTagDraftValues({
		tagType,
		isRequired: DEFAULT_IS_REQUIRED,
		ruleSelectionType:
			tagType === TAG_TYPE.SYSTEM ? RULE_SOURCE_VALUES.FROM_LIBRARY : undefined,
		updateFrequency: tagType === TAG_TYPE.SYSTEM ? undefined : "1",
	});

	if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
		return baseDraft;
	}

	return normalizeTagDraftValues({
		...baseDraft,
		isAuditTagging: "1",
		isFtfInterview: "0",
		isAttProofTagging: "1",
		isDisplayInOrgBrain: true,
		tagVisibility: "1",
	});
}

/**
 * 构建 AI 智能标签 tab 草稿。
 *
 * AI 返回字段会与默认草稿、当前抽屉表单已填公共字段合并，确保每个 tab 初始化即拥有完整提交语义。
 *
 * @param params - 构建参数
 * @param params.tags - AI 返回标签列表
 * @param params.tagLibraryType - 标签库类型
 * @param params.currentFormValues - 当前表单公共字段快照
 * @returns 完整 tab 草稿列表
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function buildAiTagDraftTabs(params: {
	tags: AiSmartTagsReturnedPayload["tags"];
	tagLibraryType: TAG_RULE_TYPE_DICT;
	currentFormValues?: Partial<TagCenterItem>;
	sessionId?: string;
}): AiTagTabItem[] {
	const { tags, tagLibraryType, currentFormValues, sessionId } = params;
	const baseDraft = buildDefaultTagDraft(tagLibraryType, TAG_TYPE.INTELLIGENT);
	const normalizedCurrentValues = normalizeTagDraftValues({
		...currentFormValues,
		tagType: TAG_TYPE.INTELLIGENT,
		aiSessionId: sessionId || currentFormValues?.aiSessionId,
	});

	return tags.map((tag) =>
		normalizeTagDraftValues({
			...baseDraft,
			...normalizedCurrentValues,
			tempId: tag.tempId,
			tagType: TAG_TYPE.INTELLIGENT,
			tagName: tag.tagName,
			tagValue: tag.tagValue,
			tagDescription: tag.tagDescription,
			businessCategory: tag.businessCategory,
			sensitivityLevel: tag.sensitivityLevel || baseDraft.sensitivityLevel,
			aliTagCode: tag.aliTagCode || tag.tagId,
			aiSessionId: tag.aiSessionId || sessionId || normalizedCurrentValues.aiSessionId,
			isExisting: tag.isExisting,
			tagId: tag.tagId,
			existingTagId: tag.existingTagId,
		}),
	);
}

/**
 * 构建系统标签复合规则 iframe URL（仅人才标签）。
 *
 * 通过 hrbrain 页面承载复合规则的新建、编辑与只读查看，viewType 映射为 URL 查询参数 type。
 *
 * @param tagName - 标签名称，写入 label 查询参数
 * @param code - 复合规则 aliTagCode，存在时进入编辑或只读模式
 * @param viewType - 页面模式，edit 可编辑，readonly 仅查看
 * @returns 复合规则 iframe 完整 URL
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function buildTagGenerationIframeUrl(
	tagName: string,
	code?: string,
	viewType: "edit" | "readonly" = "edit",
): string {
	const baseUrl = "https://hrbrain.dingtalk.com/hrbrain/talent/auto-tag/create-auto-tag";
	const params = new URLSearchParams({
		hideMenu: "true",
	});

	if (tagName) {
		params.set("label", tagName);
	}

	// 如果存在规则 code，则进入编辑或只读模式
	if (code) {
		params.set("type", viewType);
		params.set("id", code);
	}

	return `${baseUrl}?${params.toString()}`;
}

/**
 * 根据业务类别的值查找在树形结构中的路径
 *
 * @param value - 业务类别的值（如 "0101"）
 * @param options - 业务类别树形选项
 * @returns 路径数组（如 ["01", "0101"]），如果未找到则返回 undefined
 */
export function findBusinessCategoryPath(
	value: string | string[] | undefined,
	options: BusinessCategoryOption[],
): string[] | undefined {
	if (!value) {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value;
	}

	const targetValue = String(value);

	/**
	 * 递归查找路径
	 *
	 * @param nodes - 当前层级的节点
	 * @param currentPath - 当前路径
	 * @returns 找到的路径，如果未找到则返回 undefined
	 */
	const findPath = (
		nodes: BusinessCategoryOption[],
		currentPath: string[] = [],
	): string[] | undefined => {
		for (const node of nodes) {
			const newPath = [...currentPath, node.value];

			if (node.value === targetValue) {
				return newPath;
			}

			if (node.children && node.children.length > 0) {
				const found = findPath(node.children, newPath);
				if (found) {
					return found;
				}
			}
		}

		return undefined;
	};

	return findPath(options);
}

/**
 * 提取业务类别叶子编码。
 *
 * @param value - 级联路径数组或叶子编码
 * @returns 后端需要的叶子编码
 */
export function getBusinessCategoryLeafCode(
	value: string | string[] | undefined,
): string | undefined {
	if (!value) {
		return undefined;
	}
	if (Array.isArray(value)) {
		const leafValue = value[value.length - 1];
		return leafValue ? String(leafValue) : undefined;
	}
	return String(value);
}

/**
 * 将业务类别表单值格式化为可读的级联中文路径
 *
 * @param value - 级联路径数组或叶子编码
 * @param options - 业务类别树形选项
 * @returns 中文路径（如 "一级 / 二级 / 三级"）
 */
export function formatBusinessCategoryDisplay(
	value: string | string[] | undefined,
	options: BusinessCategoryOption[],
): string {
	if (!value) {
		return "";
	}

	const path = Array.isArray(value) ? value : findBusinessCategoryPath(value, options);

	if (!path || path.length === 0) {
		return typeof value === "string" ? value : "";
	}

	const labels: string[] = [];
	let nodes = options;

	for (const segment of path) {
		const node = nodes.find((n) => n.value === segment);
		if (!node) {
			return typeof value === "string" ? value : path.join(" / ");
		}
		labels.push(node.label);
		nodes = (node.children ?? []) as typeof options;
	}

	return labels.join(" / ");
}

/**
 * 将 useScope (字符串数组) 转换为 jobPositionList (对象数组，id 为 number)
 *
 * @param useScope - 人员范围字符串数组
 * @param jobPositionNodeMap - 岗位职位节点映射表
 * @returns 岗位职位列表对象数组（id 为 number）
 */
export function convertUseScopeToJobPositionList(
	useScope: string[],
	jobPositionNodeMap: Map<string, JobPositionTreeNode>,
): Array<{ id?: string; type?: string }> {
	if (!useScope || useScope.length === 0) {
		return [{ id: "0", type: "root" }];
	}

	const jobPositionList: Array<{ id?: string; type?: string }> = [];
	useScope.forEach((idStr: string) => {
		const node = jobPositionNodeMap.get(String(idStr));
		if (node) {
			jobPositionList.push({
				id: String(node.id) || "0",
				type: node.type,
			});
		}
	});

	return jobPositionList.length > 0 ? jobPositionList : [{ id: "0", type: "root" }];
}

/**
 * 将审核流程字段序列化为后端创建接口需要的字符串。
 *
 * 表单编辑态使用数组更适合驱动可视化配置，但创建接口合同要求 `auditProcessTagging`
 * 为字符串，因此提交前需要统一收口为 JSON 字符串或 `undefined`。
 *
 * @param value - 表单中的审核流程值
 * @returns 后端可接收的审核流程字符串
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function normalizeAuditProcessTaggingForSubmit(
	value: TagCenterItem["auditProcessTagging"],
): string | undefined {
	if (typeof value === "string") {
		const trimmedValue = value.trim();
		return trimmedValue.length > 0 ? trimmedValue : undefined;
	}

	if (Array.isArray(value)) {
		return value.length > 0 ? JSON.stringify(value) : undefined;
	}

	return undefined;
}

/**
 * 将到期时间格式化为后端 `LocalDate` 需要的 `YYYY-MM-DD`。
 *
 * AntD DatePicker、详情回填和 AI 初始化可能带来 string、Date 或 dayjs-like 值，
 * 提交层统一在这里消化，避免页面层重复判断日期类型。
 *
 * @param value - 表单中的到期时间
 * @returns 后端可接收的日期字符串
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function normalizeExistenceCycleForSubmit(value: unknown): string | undefined {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const parsedValue = dayjs(value as dayjs.ConfigType);
	if (!parsedValue.isValid()) {
		return undefined;
	}

	return parsedValue.format("YYYY-MM-DD");
}

/**
 * 构建扁平化 Map：id -> node
 * 用于快速查找节点，在提交时将 string[] 转换为后端格式
 *
 * @param jobPositionTreeData - 岗位职位树数据
 * @returns 节点映射表
 */
export function buildJobPositionNodeMap(
	jobPositionTreeData: JobPositionTreeNode[] | undefined,
): Map<string, JobPositionTreeNode> {
	const nodeMap = new Map<string, JobPositionTreeNode>();

	if (!jobPositionTreeData) {
		return nodeMap;
	}

	const buildNodeMap = (nodes: JobPositionTreeNode[]) => {
		nodes.forEach((node) => {
			nodeMap.set(String(node.id), node);
			if (node.children?.length) {
				buildNodeMap(node.children);
			}
		});
	};

	buildNodeMap(jobPositionTreeData);
	return nodeMap;
}

/**
 * 将标签类型规范为字符串，供 switch 分支与枚举比较使用。
 *
 * 表单 ProFormDependency 与接口返回值可能存在 number/string 差异。
 *
 * @param tagType - 待规范化的标签类型
 * @returns 规范化后的标签类型字符串
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function normalizeTagType(tagType: unknown): string {
	return String(tagType ?? "");
}

/**
 * 判断标签类型是否匹配目标枚举值。
 *
 * @param tagType - 待判断的标签类型
 * @param expected - 目标标签类型枚举
 * @returns 是否匹配
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function isTagType(tagType: unknown, expected: TAG_TYPE): boolean {
	return normalizeTagType(tagType) === expected;
}

/**
 * 判断是否为人才标签库下的手工标签。
 *
 * @param tagLibraryType - 标签库类型
 * @param tagType - 标签类型
 * @returns 是否为人才手工标签
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function isTalentManualTag(tagLibraryType: string, tagType: unknown): boolean {
	return tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && isTagType(tagType, TAG_TYPE.MANUAL);
}

/**
 * 获取审核机制区块标题。
 *
 * 人才手工标签为「标签维护与审核」，组织标签及系统/智能标签为「标签审核」，
 * 供 AuditMechanismSection 与 TagViewDrawer 共用，避免编辑/查看文案分叉。
 *
 * @param tagLibraryType - 标签库类型（'1' 组织，'2' 人才）
 * @param tagType - 标签类型
 * @returns 区块标题文案
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function getAuditMechanismSectionTitle(tagLibraryType: string, tagType: unknown): string {
	return isTalentManualTag(tagLibraryType, tagType) ? "标签维护与审核" : "标签审核";
}

/**
 * 将标签元数据列表转换为 AI 智能标签回显结构。
 *
 * 统一 bySession 与本地 mock 的转换逻辑，避免页面层重复组装 tab 展示字段、已有标签标识与统计数量。
 *
 * @param labelMetaList - bySession 接口返回的标签元数据列表
 * @returns AI 智能标签回显负载
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function convertLabelMetaListToAiSmartTags(
	labelMetaList: LabelMetaItem[],
	sessionId?: string,
): AiSmartTagsReturnedPayload {
	const tags = labelMetaList.map((item, index) => ({
		tempId: `ai-tag-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`,
		tagName: item.labelName,
		tagValue: item.labelValue,
		tagDescription: item.labelDescription,
		businessCategory: item.labelCategoryCode || undefined,
		sensitivityLevel: item.isSensitive ? "2" : "1",
		isExisting: item.isExist,
		tagId: item.labelCode,
		existingTagId: item.isExist ? item.labelCode : undefined,
		aliTagCode: item.labelCode,
		aiSessionId: sessionId,
	}));

	return {
		tags,
		newTagCount: tags.filter((tag) => !tag.isExisting).length,
		existingTagCount: tags.filter((tag) => tag.isExisting).length,
	};
}
