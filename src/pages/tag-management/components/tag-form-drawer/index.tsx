/**
 * 标签表单抽屉。
 *
 * 承载标签新增、编辑与只读查看，组织/人才标签共用表单骨架并按库类型裁剪字段。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { LabelMetaItem } from "#src/api/tag-management/tag-center/ai-tag";
import type { RadioChangeEvent } from "antd";
import type { AiSmartTagsReturnedPayload, TagGenerationSubmittedPayload } from "../shared";
import type { AiTagValidationContext } from "./ai-tag-form-schema";
import type {
	AiTagResultContext,
	AiTagTabState,
	MaintainerSelectorValue,
	TagCenterItem,
	TagFormDrawerProps,
	TagFormInteractionMode,
} from "./types";
import { getJobPositionTree } from "#src/api/tag-management/rule-library";
import {
	createTagCenter,
	fetchTagCenterDetail,
	updateTagCenter,
} from "#src/api/tag-management/tag-center";
import {
	batchUpdateLabelMetaStatus,
	deleteSmartTag,
	fetchLabelData,
	fetchLabelMeta,
	fetchLabelMetaBySession,
} from "#src/api/tag-management/tag-center/ai-tag";
import { useDict } from "#src/hooks";
import { processJobPositionTreeData } from "#src/utils";
import { DrawerForm } from "@ant-design/pro-components";
import { useQuery } from "@tanstack/react-query";
import { useRequest } from "ahooks";
import { Alert, Button, Drawer, Form, message, Modal, Spin, Tabs, Typography } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TAG_DICT_KEYS, TAG_RULE_TYPE_DICT, TAG_TYPE } from "../../config";
import { buildDictTree } from "../../utils";
import {
	AiTagIframeModal,
	ViewOrgTagRuleDrawer,
	ViewTalentAiTagModal,
	ViewTalentTagRuleDrawer,
} from "../shared";
import { toAiTagSubmitPayload, validateAllAiTagTabs } from "./ai-tag-form-schema";
import { AiTagScrollTabs } from "./components/ai-tag-scroll-tabs";
import { MaintainerSelectorModal } from "./components/maintainer-selector-modal";
import {
	AI_TAG_IFRAME_URL,
	FORM_MODE,
	RULE_SOURCE_VALUES,
	TAG_DRAWER_BODY_STYLES,
	TAG_DRAWER_CONTENT_CLASS,
} from "./constants";
import {
	getIntelligentTagDuplicateValidationMessage,
	useMaintainerRoleUtils,
	useSyncFtfInterviewUpdFreq,
	useSyncFtfInterviewUpdFreqEffect,
	useTagNameValidator,
	useUseScopeLinkageEffect,
	validateIntelligentTagDuplicateNames,
} from "./hooks";
import {
	getDrawerCloseCleanupDecision,
	getRuleSourceSwitchDecision,
	getTagTypeSwitchDecision,
} from "./interaction-decisions";
import {
	AuditMechanismSection,
	BasicInfoSection,
	InterviewMechanismSection,
	TaggingAuditSection,
	TagPresentationSection,
	UseScopeSection,
} from "./sections";
import { toTagFormFieldErrors } from "./tag-form-schema";
import { toCreateTagSubmitPayloads } from "./tag-form-submit";
import {
	collectAiTagLifecycleCodesToOffline,
	submitSingleTagDraft,
} from "./tag-form-submit-controller";
import { useAddSingleTagDraftForm } from "./use-add-single-tag-draft-form";
import { useAiTagTabsForm } from "./use-ai-tag-tabs-form";
import { useEditTagDraftForm } from "./use-edit-tag-draft-form";
import {
	buildAiTagDraftTabs,
	buildDefaultTagDraft,
	buildJobPositionNodeMap,
	buildTagGenerationIframeUrl,
	convertLabelMetaListToAiSmartTags,
	convertUseScopeToJobPositionList,
	getAiTaskInstructionText,
	normalizeTagDraftValues,
} from "./utils";

const TAG_FORM_DRAWER_WIDTH = 800;
const DETAIL_LOADING_MIN_DURATION = 300;
const RULE_DERIVED_FIELD_NAMES = [
	"aliTagCode",
	"tagRulesId",
	"tagName",
	"tagValue",
	"tagDescription",
	"businessCategory",
	"sensitivityLevel",
	"updateFrequency",
	"isExisting",
] as const;
const TAG_PRESENTATION_FIELD_NAMES = ["tagVisibility", "tagDistributionModule"] as const;

interface SmartTagDeletePayload {
	sessionId: string;
	newTagCodes: string[];
	existingTagCodes: string[];
}

/**
 * 构建智能标签删除请求载荷。
 *
 * @param params - 删除参数
 * @param params.sessionId - AI 会话 ID
 * @param params.newTagCodes - 新增标签编码
 * @param params.existingTagCodes - 已存在标签编码
 * @returns 删除请求载荷；无 sessionId 或无编码时返回 undefined
 *
 * @author 王善能
 * @since 2026-07-06
 */
function buildSmartTagDeletePayload(params: {
	sessionId?: string;
	newTagCodes?: string[];
	existingTagCodes?: string[];
}): SmartTagDeletePayload | undefined {
	const sessionId = String(params.sessionId || "").trim();
	const newTagCodes = (params.newTagCodes || []).filter(Boolean);
	const existingTagCodes = (params.existingTagCodes || []).filter(Boolean);

	if (!sessionId || (newTagCodes.length === 0 && existingTagCodes.length === 0)) {
		return undefined;
	}

	return {
		sessionId,
		newTagCodes,
		existingTagCodes,
	};
}

/**
 * 解析智能标签删除编码。
 *
 * 新增标签优先使用 tagId；已有标签优先使用 existingTagId，缺失时回退到 tagId。
 *
 * @param params - 标签信息
 * @param params.isExisting - 是否为已存在标签
 * @param params.tagId - 标签 ID
 * @param params.existingTagId - 已存在标签 ID
 * @returns 标签删除编码
 *
 * @author 王善能
 * @since 2026-07-06
 */
function resolveSmartTagDeleteCode(params: {
	isExisting?: boolean;
	tagId?: string;
	existingTagId?: string;
}) {
	if (params.isExisting) {
		return params.existingTagId || params.tagId;
	}

	return params.tagId;
}

/**
 * 收集智能标签删除协议所需的标签分组编码。
 *
 * @param params - 删除源数据
 * @param params.tabs - AI 多标签页签
 * @param params.singleDraft - 单标签草稿
 * @param params.includeSingleDraft - 是否纳入单标签草稿
 * @returns 删除协议编码分组
 *
 * @author 王善能
 * @since 2026-07-06
 */
function collectSmartTagDeleteCodes(params: {
	tabs?: AiTagTabState[];
	singleDraft?: TagCenterItem;
	includeSingleDraft?: boolean;
}) {
	const sourceTabs = params.tabs || [];
	const sourceItems: Array<{
		isExisting?: boolean;
		tagId?: string;
		existingTagId?: string;
	}> = sourceTabs.map((tab) => ({
		isExisting: tab.isExisting,
		tagId: tab.tagId ? String(tab.tagId) : undefined,
		existingTagId: tab.existingTagId ? String(tab.existingTagId) : undefined,
	}));

	if (params.includeSingleDraft && params.singleDraft?.tagId) {
		sourceItems.push({
			isExisting: params.singleDraft.isExisting,
			tagId: String(params.singleDraft.tagId),
			existingTagId: params.singleDraft.existingTagId
				? String(params.singleDraft.existingTagId)
				: undefined,
		});
	}

	return sourceItems.reduce(
		(result, item) => {
			const deleteCode = resolveSmartTagDeleteCode(item);
			if (!deleteCode) {
				return result;
			}

			if (item.isExisting) {
				result.existingTagCodes.push(String(deleteCode));
				return result;
			}

			result.newTagCodes.push(String(deleteCode));
			return result;
		},
		{
			newTagCodes: [] as string[],
			existingTagCodes: [] as string[],
		},
	);
}

/**
 * 打印批量状态流转日志。
 *
 * @param params - 日志参数
 * @param params.title - 日志标题
 * @param params.api - 接口路径
 * @param params.optType - 生命周期操作类型
 * @param params.codes - 标签编码列表
 * @param params.extra - 补充上下文
 *
 * @author 王善能
 * @since 2026-07-06
 */
function logLifecycleBatchAction(params: {
	title: string;
	api: string;
	optType: string;
	codes: string[];
	extra?: Record<string, unknown>;
}) {
	console.warn(params.title, {
		api: params.api,
		optType: params.optType,
		codes: params.codes,
		...(params.extra || {}),
	});
}

/**
 * 打印智能标签删除日志。
 *
 * @param payload - 智能标签删除协议
 *
 * @author 王善能
 * @since 2026-07-06
 */
function logSmartTagDeleteAction(payload: SmartTagDeletePayload) {
	console.warn("[智能标签][delete]", {
		api: "/hrbrain/label/smartTag/delete",
		sessionId: payload.sessionId,
		newTagCodes: payload.newTagCodes,
		existingTagCodes: payload.existingTagCodes,
	});
}

/**
 * 解析当前智能标签可查看结果的 labelCode。
 *
 * 创建态的 AI 多标签任务优先使用 AI 返回的 `tagId`；
 * 编辑/只读态的已落库智能标签优先使用后端详情稳定返回的 `aliTagCode`。
 *
 * @param params - 解析参数
 * @param params.draft - 单标签草稿
 * @param params.tab - 多标签页签状态
 * @returns 可用于查询 AI 结果的 labelCode
 *
 * @author 王善能
 * @since 2026-06-18
 */
function resolveAiTagResultLabelCode(params: {
	draft?: Record<string, unknown> | null;
	tab?: { tagId?: string; values?: Record<string, unknown> } | null;
}) {
	const { draft, tab } = params;

	const tabAliTagCode = tab?.values?.aliTagCode;
	if (typeof tabAliTagCode === "string" && tabAliTagCode) {
		return tabAliTagCode;
	}

	if (typeof tab?.tagId === "string" && tab.tagId) {
		return tab.tagId;
	}

	const draftAliTagCode = draft?.aliTagCode;
	if (typeof draftAliTagCode === "string" && draftAliTagCode) {
		return draftAliTagCode;
	}

	const draftTagId = draft?.tagId;
	if (typeof draftTagId === "string" && draftTagId) {
		return draftTagId;
	}

	return undefined;
}

/**
 * 规范化抽屉内部使用的标签详情快照。
 *
 * 后端详情类型相对宽泛，这里统一收敛成抽屉内部使用的 `TagCenterItem`，
 * 让“接口详情 -> 表单草稿”的中间层语义更明确。
 *
 * @param detail - 后端返回的标签详情
 * @returns 规范化后的抽屉详情快照
 *
 * @author 王善能
 * @since 2026-06-24
 */
function normalizeDrawerTagDetail(detail: Record<string, unknown>): Partial<TagCenterItem> {
	return normalizeTagDraftValues({
		...(detail as Partial<TagCenterItem>),
	});
}

/**
 * 标签表单抽屉组件。
 *
 * 支持新增、编辑、只读三种模式，覆盖组织标签与人才标签。
 * 复合规则通过 hrbrain iframe 承载，只读模式以 readonly 参数打开查看页。
 *
 * @param props - 组件属性
 * @param props.open - 是否显示抽屉
 * @param props.onClose - 关闭回调
 * @param props.onSubmitSuccess - 提交成功后的回调
 * @param props.defaultValues - 新增模式默认值
 * @param props.tagSummary - 编辑/只读模式的最小标签摘要
 * @param props.title - 抽屉标题
 * @param props.mode - 表单模式（add / edit / readonly）
 * @param props.tagLibraryType - 标签库类型
 * @returns 标签表单抽屉
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function TagFormDrawer({
	open,
	onClose,
	onSubmitSuccess,
	defaultValues,
	tagSummary,
	title,
	mode = FORM_MODE.EDIT,
	tagLibraryType,
}: TagFormDrawerProps) {
	const [form] = Form.useForm();
	const { runAsync: submitDrawerForm, loading: submitDrawerFormLoading } = useRequest(
		async (values: any) => {
			if (mode === FORM_MODE.EDIT && tagSummary?.id) {
				await updateTagCenter(String(tagSummary.id), {
					...values,
					type: tagLibraryType,
				});
				message.success("标签更新成功");
				await onSubmitSuccess?.();
				return;
			}

			const createPayload = (Array.isArray(values) ? values : [values]).map((item) => ({
				...item,
				type: tagLibraryType,
			}));
			await createTagCenter(createPayload);
			message.success("标签创建成功");
			await onSubmitSuccess?.();
		},
		{
			manual: true,
		},
	);

	// 字典数据
	const { options: tagTypeOptions } = useDict(TAG_DICT_KEYS.TAG_TYPE);
	const businessCategoryDictKey =
		tagLibraryType === TAG_RULE_TYPE_DICT.ORG
			? TAG_DICT_KEYS.ORG_BUSINESS_CATEGORY
			: TAG_DICT_KEYS.BUSINESS_CATEGORY;
	const { data: businessCategoryData } = useDict(businessCategoryDictKey);
	const { options: sensitivityLevelOptions } = useDict(TAG_DICT_KEYS.SENSITIVITY_LEVEL);
	const { options: updateFrequencyOptions } = useDict(TAG_DICT_KEYS.UPDATE_FREQUENCY);
	const { options: ftfInterviewUpdFreqOptions } = useDict(
		TAG_DICT_KEYS.FTF_INTERVIEW_UPDATE_FREQUENCY,
	);
	const { options: auditorOptions } = useDict(TAG_DICT_KEYS.CENTER_AUDITOR);
	const {
		options: maintainerRoleOptions = [],
		getLabel: getMaintainerRoleLabel,
		getValue: getMaintainerRoleValue,
	} = useDict(TAG_DICT_KEYS.MAINTAINER_ROLE);

	// 维护人角色工具函数
	const {
		defaultFtfInterviewerValue,
		getRoleLabelByValue,
		getRoleValueByLabel,
		approverRoleOptions,
		interviewerRoleOptions,
	} = useMaintainerRoleUtils(
		maintainerRoleOptions,
		getMaintainerRoleLabel,
		getMaintainerRoleValue,
	);

	// 状态管理
	const [isAiTagRuleOpen, setIsAiTagRuleOpen] = useState<boolean>(false);
	const [isAiTagRuleModalOpen, setIsAiTagRuleModalOpen] = useState<boolean>(false);
	const [aiTagRulePage, setAiTagRulePage] = useState({ pageNum: 1, pageSize: 20 });
	const [isApproverModalOpen, setIsApproverModalOpen] = useState<boolean>(false);
	const [isAiTagModalOpen, setIsAiTagModalOpen] = useState<boolean>(false);
	const [isTagGenerationModalOpen, setIsTagGenerationModalOpen] = useState<boolean>(false);
	const [needInterview, setNeedInterview] = useState<boolean>(false);
	const [needAttachment, setNeedAttachment] = useState<boolean>(false);
	const [isMaintainerModalOpen, setIsMaintainerModalOpen] = useState<boolean>(false);
	const [currentMaintainerValue, setCurrentMaintainerValue] = useState<
		MaintainerSelectorValue | undefined
	>(undefined);
	const [isTagRuleDrawerOpen, setIsTagRuleDrawerOpen] = useState<boolean>(false);
	const [tagRuleDrawerTagRuleId, setTagRuleDrawerTagRuleId] = useState<string | undefined>(
		undefined,
	);
	const [tagRuleDrawerJobPositionList, setTagRuleDrawerJobPositionList] = useState<
		Array<{
			id?: string;
			type?: string;
		}>
	>([{ id: "0", type: "root" }]);
	const [isOrgTagRuleDrawerOpen, setIsOrgTagRuleDrawerOpen] = useState<boolean>(false);
	const [orgTagRuleDrawerTagRuleId, setOrgTagRuleDrawerTagRuleId] = useState<string | undefined>(
		undefined,
	);
	const [addTaskMode, setAddTaskMode] = useState<TagFormInteractionMode>("single");
	const [tagFormDebugOpen, setTagFormDebugOpen] = useState(false);
	const [currentApproverValue, setCurrentApproverValue] = useState<
		MaintainerSelectorValue | undefined
	>(undefined);
	const [currentApproverFieldPath, setCurrentApproverFieldPath] = useState<string[]>([]);
	const [isDetailLoadingVisible, setIsDetailLoadingVisible] = useState(false);

	// 标记是否通过提交关闭（用于区分提交和手动关闭）
	const isSubmittingRef = useRef<boolean>(false);
	const drawerOpenVersionRef = useRef(0);
	const detailLoadingStartedAtRef = useRef<number | null>(null);

	// 计算属性（useMemo）
	const filteredTagTypeOptions = useMemo(() => {
		if (tagLibraryType === TAG_RULE_TYPE_DICT.ORG) {
			return tagTypeOptions?.filter((option) => option.value === TAG_TYPE.SYSTEM) || [];
		}
		return tagTypeOptions || [];
	}, [tagTypeOptions, tagLibraryType]);

	const initialTagType = useMemo(
		() => filteredTagTypeOptions?.[0]?.value || "",
		[filteredTagTypeOptions],
	);

	const businessCategoryOptions = useMemo(
		() => buildDictTree(businessCategoryData),
		[businessCategoryData],
	);

	const { data: jobPositionTreeData, loading: jobPositionLoading } = useRequest(
		getJobPositionTree,
		{
			ready: open && tagLibraryType === TAG_RULE_TYPE_DICT.TALENT,
			cacheKey: "tag-form-drawer-job-position-tree",
			cacheTime: 60 * 1000, // 1 分钟缓存保留时间
			staleTime: 60 * 1000, // 1 分钟数据新鲜时间
		},
	);

	// 计算属性（依赖 useRequest 数据）
	const jobPositionNodeMap = useMemo(() => {
		return buildJobPositionNodeMap(
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT ? jobPositionTreeData : undefined,
		);
	}, [jobPositionTreeData, tagLibraryType]);

	const aiTagValidationContext = useMemo<AiTagValidationContext>(() => {
		return {
			tagLibraryType,
			jobPositionNodeMap,
		};
	}, [jobPositionNodeMap, tagLibraryType]);

	const {
		singleDraft: addSingleDraft,
		applySingleDraft: applyAddSingleDraft,
		syncSingleDraftFromForm: syncAddSingleDraftFromForm,
		mergeSingleDraft: mergeAddSingleDraft,
		resetSingleDraft: resetAddSingleDraft,
	} = useAddSingleTagDraftForm({
		form,
		tagLibraryType,
		initialTagType,
	});

	const { editDraft, applyEditDraft, syncEditDraftFromForm, mergeEditDraft, resetEditDraft } =
		useEditTagDraftForm({
			form,
		});

	const {
		tabs: aiTagTabs,
		activeTabKey,
		initializeTabs,
		resetTabs,
		switchTab,
		removeTab,
		syncActiveTabValues,
		validateAllTabs: validateAiTagTabs,
		activateTab,
		replaceTabs,
		handleFormValuesChange,
	} = useAiTagTabsForm(form);

	const aiTagTabDisplayItems = useMemo(() => {
		return aiTagTabs.map((tab) => ({
			tempId: tab.tempId,
			tagName: tab.values.tagName,
			isExisting: tab.isExisting,
			errorCount: Object.values(tab.errors).reduce(
				(total, messages) => total + messages.length,
				0,
			),
		}));
	}, [aiTagTabs]);

	const isAddMode = mode === FORM_MODE.ADD;
	const isEditMode = mode === FORM_MODE.EDIT;
	const isReadonlyMode = mode === FORM_MODE.READONLY;
	const isDetailMode = isEditMode || isReadonlyMode;
	const currentTagId = tagSummary?.id ? String(tagSummary.id) : undefined;
	const {
		data: currentTagDetail,
		isLoading: isTagDetailLoading,
		isFetching: isTagDetailFetching,
		isError: isTagDetailError,
		refetch: refetchTagDetail,
	} = useQuery({
		queryKey: ["tag-management", "tag-form-drawer-detail", tagLibraryType, mode, currentTagId],
		queryFn: async () => {
			const detailData = await fetchTagCenterDetail(String(currentTagId));
			return normalizeDrawerTagDetail(detailData as unknown as Record<string, unknown>);
		},
		enabled: open && isDetailMode && Boolean(currentTagId),
		staleTime: 0,
		gcTime: 5 * 60 * 1000,
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
		retry: 1,
	});
	const isDetailLoading =
		isDetailMode && !currentTagDetail && (isTagDetailLoading || isTagDetailFetching);
	const isDetailLoadFailed = isDetailMode && !currentTagDetail && isTagDetailError;
	const isDetailReady = !isDetailMode || Boolean(currentTagDetail);
	const currentSingleDraft = isDetailMode ? editDraft : addSingleDraft;
	const hasBatchAiTagTask = isAddMode && addTaskMode === "batch" && aiTagTabs.length > 0;
	const activeAiTagTab = useMemo(() => {
		if (!hasBatchAiTagTask) {
			return undefined;
		}

		return aiTagTabs.find((tab) => tab.tempId === activeTabKey) || aiTagTabs[0];
	}, [activeTabKey, aiTagTabs, hasBatchAiTagTask]);

	const hasSingleAiTagResult = useMemo(() => {
		return (
			!hasBatchAiTagTask &&
			isAiTagRuleOpen &&
			currentSingleDraft?.tagType === TAG_TYPE.INTELLIGENT &&
			Boolean(resolveAiTagResultLabelCode({ draft: currentSingleDraft }))
		);
	}, [currentSingleDraft, hasBatchAiTagTask, isAiTagRuleOpen]);

	const hasAiTagTaskResult = hasBatchAiTagTask || hasSingleAiTagResult;
	const shouldShowAiTaskBanner =
		currentSingleDraft?.tagType === TAG_TYPE.INTELLIGENT &&
		(isAiTagRuleOpen || hasAiTagTaskResult);

	const currentAiTagResultContext = useMemo<AiTagResultContext>(() => {
		if (hasBatchAiTagTask) {
			return {
				labelCode: resolveAiTagResultLabelCode({ tab: activeAiTagTab }),
				tagDescription: activeAiTagTab?.values.tagDescription,
			};
		}

		return {
			labelCode: resolveAiTagResultLabelCode({ draft: currentSingleDraft }),
			tagDescription: currentSingleDraft?.tagDescription,
		};
	}, [activeAiTagTab, currentSingleDraft, hasBatchAiTagTask]);

	useEffect(() => {
		if (open) {
			drawerOpenVersionRef.current += 1;
		}
	}, [open]);

	/**
	 * 控制编辑/只读详情加载态的最短展示时长，避免接口极快返回时出现闪烁。
	 *
	 * @author 王善能
	 * @since 2026-06-24
	 */
	useEffect(() => {
		if (!open) {
			setIsDetailLoadingVisible(false);
			detailLoadingStartedAtRef.current = null;
			return;
		}

		if (isDetailLoading) {
			detailLoadingStartedAtRef.current = Date.now();
			setIsDetailLoadingVisible(true);
			return;
		}

		if (!isDetailLoadingVisible) {
			return;
		}

		const loadingStartedAt = detailLoadingStartedAtRef.current;
		if (!loadingStartedAt) {
			setIsDetailLoadingVisible(false);
			return;
		}

		const elapsed = Date.now() - loadingStartedAt;
		const remaining = DETAIL_LOADING_MIN_DURATION - elapsed;
		if (remaining <= 0) {
			setIsDetailLoadingVisible(false);
			detailLoadingStartedAtRef.current = null;
			return;
		}

		const timer = window.setTimeout(() => {
			setIsDetailLoadingVisible(false);
			detailLoadingStartedAtRef.current = null;
		}, remaining);

		return () => {
			window.clearTimeout(timer);
		};
	}, [isDetailLoading, isDetailLoadingVisible, open]);

	const canViewAiTagResult = Boolean(currentAiTagResultContext.labelCode);
	const canStartAiDescription = isAddMode && !hasBatchAiTagTask;
	const showAiDescriptionButton = canStartAiDescription;
	const aiDescriptionButtonText = hasAiTagTaskResult ? "重新向AI描述标签" : "开始向AI描述标签";

	const { data: aiTagRulePageData, loading: aiTagRuleLoading } = useRequest(
		async () => {
			if (!currentAiTagResultContext.labelCode) {
				return undefined;
			}

			return await fetchLabelData({
				labelCode: currentAiTagResultContext.labelCode,
				pageNum: aiTagRulePage.pageNum,
				pageSize: aiTagRulePage.pageSize,
			});
		},
		{
			ready:
				isAiTagRuleModalOpen &&
				tagLibraryType === TAG_RULE_TYPE_DICT.TALENT &&
				Boolean(currentAiTagResultContext.labelCode),
			refreshDeps: [
				isAiTagRuleModalOpen,
				aiTagRulePage.pageNum,
				aiTagRulePage.pageSize,
				currentAiTagResultContext.labelCode,
			],
		},
	);

	/**
	 * single 模式下同步程序性表单写入后的真相源。
	 *
	 * 某些联动通过 `setFieldValue / setFieldsValue` 直接修改 Form，
	 * 不应依赖 antd 事件回调是否触发来侥幸同步状态。
	 *
	 * @author 王善能
	 * @since 2026-06-17
	 */
	const syncSingleDraftAfterProgrammaticChange = useCallback(() => {
		if (hasBatchAiTagTask) {
			return;
		}
		if (isEditMode) {
			syncEditDraftFromForm();
			return;
		}
		syncAddSingleDraftFromForm();
	}, [hasBatchAiTagTask, isEditMode, syncAddSingleDraftFromForm, syncEditDraftFromForm]);

	const clearFieldState = useCallback(
		(fieldNames: readonly string[], patch?: Record<string, unknown>) => {
			const clearedValues = Object.fromEntries(
				fieldNames.map((fieldName) => [fieldName, undefined]),
			);
			const nextValues = {
				...clearedValues,
				...(patch || {}),
			};
			form.setFieldsValue(nextValues);
			form.setFields(
				fieldNames.map((fieldName) => ({
					name: fieldName,
					errors: [],
				})),
			);
			if (isEditMode) {
				mergeEditDraft(nextValues);
				return;
			}
			mergeAddSingleDraft(nextValues);
		},
		[form, isEditMode, mergeAddSingleDraft, mergeEditDraft],
	);

	const processedJobPositionTreeData = useMemo(() => {
		return processJobPositionTreeData(
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT ? jobPositionTreeData : undefined,
		);
	}, [jobPositionTreeData, tagLibraryType]);

	// 表单验证器和其他工具 hooks
	const tagNameValidator = useTagNameValidator(
		form,
		currentTagDetail,
		tagLibraryType,
		hasBatchAiTagTask,
	);
	const syncFtfInterviewUpdFreq = useSyncFtfInterviewUpdFreq(form, tagLibraryType);

	/**
	 * 处理人员范围（仅人才标签）
	 *
	 * 注意：返回字符串数组，因为 antd Tree 组件需要 string 类型
	 */
	const processUseScope = useCallback(
		(currentTagType: TAG_TYPE): string[] | undefined => {
			if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
				return undefined;
			}

			if (currentTagDetail?.tagPositionList?.length) {
				return currentTagDetail.tagPositionList.map(
					(item: { id: string; type: string }) => {
						return String(item.id || "0");
					},
				);
			}

			// 新增模式：手工标签和系统标签默认为全部人员
			if (currentTagType === TAG_TYPE.MANUAL || currentTagType === TAG_TYPE.SYSTEM) {
				return ["0"];
			}

			return undefined;
		},
		[tagLibraryType, currentTagDetail],
	);

	/**
	 * 处理维护人（仅人才标签）
	 */
	const processMaintainer = useCallback((): MaintainerSelectorValue | undefined => {
		if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT || !currentTagDetail?.maintainer) {
			return undefined;
		}

		const maintainerStr = String(currentTagDetail.maintainer);
		const roleValue = getRoleValueByLabel(maintainerStr);

		if (roleValue) {
			return { type: "role" as const, typeValue: "2" as const, role: roleValue };
		}

		const match = maintainerStr.match(/^([^(]+)\(([^)]+)\)$/);
		if (match) {
			return {
				type: "person" as const,
				typeValue: "1" as const,
				person: {
					id: "0",
					name: match[1],
					deptPath: match[2],
				},
			};
		}

		return undefined;
	}, [tagLibraryType, currentTagDetail, getRoleValueByLabel]);

	/**
	 * 处理审核流程数据（仅人才标签）
	 */
	const processAuditProcess = useCallback(
		(isAddMode: boolean): any => {
			if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
				return undefined;
			}

			const auditProcessTagging = currentTagDetail?.auditProcessTagging;

			// 新增模式且无数据：初始化默认步骤
			if (isAddMode && !auditProcessTagging) {
				return [{ step: 1, stepName: "步骤一", approver: "", type: "1", approverName: "" }];
			}

			// 编辑/只读模式：解析 JSON 字符串
			if (auditProcessTagging && typeof auditProcessTagging === "string") {
				try {
					const parsedData = JSON.parse(auditProcessTagging);
					if (Array.isArray(parsedData) && parsedData.length > 0) {
						const stepNumbers = [
							"一",
							"二",
							"三",
							"四",
							"五",
							"六",
							"七",
							"八",
							"九",
							"十",
						];
						return parsedData.map((item: any, index: number) => ({
							step: index + 1,
							stepName: item.stepName || `步骤${stepNumbers[index] || index + 1}`,
							approver: item.approver,
							type: item.type || "1",
							approverName: item.approverName || "",
						}));
					}
				} catch {
					return [
						{ step: 1, stepName: "步骤一", approver: "", type: "1", approverName: "" },
					];
				}
			}

			return auditProcessTagging;
		},
		[tagLibraryType, currentTagDetail],
	);

	/**
	 * 新增模式初始化
	 */
	const initAddMode = useCallback(() => {
		const currentTagType = initialTagType as TAG_TYPE;
		const useScope = processUseScope(currentTagType);
		const auditProcessTagging = processAuditProcess(true);
		const formValues: any = {
			...buildDefaultTagDraft(tagLibraryType, currentTagType),
			...defaultValues,
			tagType: currentTagType,
		};

		// 人才标签特有字段
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			if (useScope) {
				formValues.useScope = useScope;
			}
			if (auditProcessTagging) {
				formValues.auditProcessTagging = auditProcessTagging;
			}
		}

		const normalizedFormValues = normalizeTagDraftValues(formValues);
		setAddTaskMode("single");
		applyAddSingleDraft(normalizedFormValues);

		// 设置状态（仅人才标签）
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			setNeedInterview(false);
			setNeedAttachment(true);
		}

		setIsAiTagRuleOpen(false);
	}, [
		applyAddSingleDraft,
		initialTagType,
		defaultValues,
		tagLibraryType,
		processUseScope,
		processAuditProcess,
	]);

	/**
	 * 根据目标标签类型构建新增模式默认表单值。
	 *
	 * 标签类型切换后应回到该类型的干净初始态，避免继续保留上一种类型下的填写内容。
	 *
	 * @param nextTagType - 目标标签类型
	 * @returns 切换后的默认草稿
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const buildAddModeDefaultValuesByTagType = useCallback(
		(nextTagType: TAG_TYPE) => {
			const useScope = processUseScope(nextTagType);
			const auditProcessTagging = processAuditProcess(true);
			const formValues: any = {
				...buildDefaultTagDraft(tagLibraryType, nextTagType),
				...defaultValues,
				tagType: nextTagType,
			};

			if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
				if (useScope) {
					formValues.useScope = useScope;
				}
				if (auditProcessTagging) {
					formValues.auditProcessTagging = auditProcessTagging;
				}
			}

			return normalizeTagDraftValues(formValues);
		},
		[defaultValues, processAuditProcess, processUseScope, tagLibraryType],
	);

	/**
	 * 切换标签类型后，清空当前已填写内容并回到目标类型默认态。
	 *
	 * @param nextTagType - 目标标签类型
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const resetAddFormForTagTypeSwitch = useCallback(
		(nextTagType: TAG_TYPE) => {
			const currentValues = form.getFieldsValue(true);
			const clearedValues = Object.fromEntries(
				Object.keys(currentValues).map((fieldName) => [fieldName, undefined]),
			);
			const nextValues = buildAddModeDefaultValuesByTagType(nextTagType);
			form.setFieldsValue({
				...clearedValues,
				...nextValues,
			});
			form.setFields(
				Object.keys(currentValues).map((fieldName) => ({
					name: fieldName,
					errors: [],
				})),
			);
			applyAddSingleDraft(nextValues);
			resetTabs();
			setIsAiTagRuleOpen(false);
			setAddTaskMode("single");

			if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
				setNeedInterview(false);
				setNeedAttachment(true);
			}
		},
		[applyAddSingleDraft, buildAddModeDefaultValuesByTagType, form, resetTabs, tagLibraryType],
	);

	/**
	 * 编辑模式初始化。
	 *
	 * 回显列表/详情数据至表单，并将 tagType 规范为字符串以匹配 ProFormDependency 分支判断。
	 *
	 * @author 王善能
	 * @since 2026-06-11
	 */
	const initEditMode = useCallback(() => {
		const currentTagType = (currentTagDetail?.tagType || initialTagType) as TAG_TYPE;
		const useScope = processUseScope(currentTagType);
		const maintainerValue = processMaintainer();
		const auditProcessTagging = processAuditProcess(false);

		// 处理面谈相关字段（仅人才标签）
		const isFtfInterviewValue =
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT
				? currentTagDetail?.isFtfInterview || "0"
				: undefined;
		const ftfInterviewerValue =
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT
				? currentTagDetail?.ftfInterviewer ||
					(isFtfInterviewValue === "1" ? defaultFtfInterviewerValue : undefined)
				: undefined;

		// 确定更新频次默认值（编辑模式）
		const updateFrequencyValue =
			currentTagType === TAG_TYPE.SYSTEM
				? currentTagDetail?.updateFrequency || undefined
				: currentTagDetail?.updateFrequency || "1";

		// 面谈更新频次与更新频次保持一致（仅人才标签）
		let ftfInterviewUpdFreqValue = currentTagDetail?.ftfInterviewUpdFreq;
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && isFtfInterviewValue === "1") {
			if (!ftfInterviewUpdFreqValue) {
				ftfInterviewUpdFreqValue =
					updateFrequencyValue || currentTagDetail?.updateFrequency;
			}
		}

		// 设置表单初始值
		const formValues: any = {
			...buildDefaultTagDraft(tagLibraryType, currentTagType),
			...currentTagDetail,
			// 与 isTagType / normalizeTagType 保持一致，避免 number/string 导致手工标签区块不渲染
			tagType: String(currentTagType),
			...(updateFrequencyValue !== undefined && { updateFrequency: updateFrequencyValue }),
			...(currentTagDetail?.tagRulesId !== undefined && {
				tagRulesId: String(currentTagDetail.tagRulesId),
			}),
		};

		// 人才标签特有字段
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			formValues.isFtfInterview = isFtfInterviewValue;

			// 始终设置 useScope 以便回显
			if (useScope) {
				formValues.useScope = useScope;
			}
			if (auditProcessTagging) {
				formValues.auditProcessTagging = auditProcessTagging;
			}
			if (ftfInterviewerValue) {
				formValues.ftfInterviewer = ftfInterviewerValue;
			}
			if (ftfInterviewUpdFreqValue) {
				formValues.ftfInterviewUpdFreq = ftfInterviewUpdFreqValue;
			}
		}

		const normalizedFormValues = normalizeTagDraftValues(formValues);
		setAddTaskMode("single");
		applyEditDraft(normalizedFormValues);

		// 设置维护人状态
		if (maintainerValue) {
			setCurrentMaintainerValue(maintainerValue);
		}

		// 启用面谈时自动更新维护人（仅人才标签）
		if (
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT &&
			isFtfInterviewValue === "1" &&
			ftfInterviewerValue
		) {
			const roleLabel = getRoleLabelByValue(ftfInterviewerValue);
			if (roleLabel) {
				form.setFieldsValue({
					maintainer: ftfInterviewerValue,
					maintainerName: roleLabel,
					maintainerType: "2",
				});
				setCurrentMaintainerValue({
					type: "role",
					typeValue: "2",
					role: ftfInterviewerValue,
				});
			}
		}

		// 设置状态（仅人才标签）
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			const isAttProofTaggingValue = currentTagDetail?.isAttProofTagging || "1";
			setNeedInterview(isFtfInterviewValue === "1");
			setNeedAttachment(isAttProofTaggingValue === "1");
		}

		setIsAiTagRuleOpen(false);
	}, [
		currentTagDetail,
		initialTagType,
		tagLibraryType,
		defaultFtfInterviewerValue,
		applyEditDraft,
		processUseScope,
		processMaintainer,
		processAuditProcess,
		getRoleLabelByValue,
	]);

	/**
	 * 只读模式初始化
	 */
	const initReadonlyMode = useCallback(() => {
		const currentTagType = (currentTagDetail?.tagType || initialTagType) as TAG_TYPE;
		const useScope = processUseScope(currentTagType);
		const maintainerValue = processMaintainer();
		const auditProcessTagging = processAuditProcess(false);

		// 处理面谈相关字段（仅人才标签）
		const isFtfInterviewValue =
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT
				? currentTagDetail?.isFtfInterview || "0"
				: undefined;
		const ftfInterviewerValue =
			tagLibraryType === TAG_RULE_TYPE_DICT.TALENT
				? currentTagDetail?.ftfInterviewer
				: undefined;

		// 确定更新频次默认值
		const updateFrequencyValue = currentTagDetail?.updateFrequency;

		// 面谈更新频次
		const ftfInterviewUpdFreqValue = currentTagDetail?.ftfInterviewUpdFreq;

		// 设置表单初始值
		const formValues: any = {
			...buildDefaultTagDraft(tagLibraryType, currentTagType),
			...currentTagDetail,
			tagType: currentTagType,
			...(updateFrequencyValue && { updateFrequency: updateFrequencyValue }),
			...(currentTagDetail?.tagRulesId !== undefined && {
				tagRulesId: String(currentTagDetail.tagRulesId),
			}),
		};

		// 人才标签特有字段
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			formValues.isFtfInterview = isFtfInterviewValue;

			// 始终设置 useScope 以便回显
			if (useScope) {
				formValues.useScope = useScope;
			}
			if (auditProcessTagging) {
				formValues.auditProcessTagging = auditProcessTagging;
			}
			if (ftfInterviewerValue) {
				formValues.ftfInterviewer = ftfInterviewerValue;
			}
			if (ftfInterviewUpdFreqValue) {
				formValues.ftfInterviewUpdFreq = ftfInterviewUpdFreqValue;
			}
		}

		const normalizedFormValues = normalizeTagDraftValues(formValues);
		setAddTaskMode("single");
		applyEditDraft(normalizedFormValues);

		// 设置维护人状态
		if (maintainerValue) {
			setCurrentMaintainerValue(maintainerValue);
		}

		// 设置状态（仅人才标签）
		if (tagLibraryType === TAG_RULE_TYPE_DICT.TALENT) {
			const isAttProofTaggingValue = currentTagDetail?.isAttProofTagging || "0";
			setNeedInterview(isFtfInterviewValue === "1");
			setNeedAttachment(isAttProofTaggingValue === "1");
		}

		// 只读模式允许查看规则标签
		setIsAiTagRuleOpen(true);
	}, [
		currentTagDetail,
		initialTagType,
		tagLibraryType,
		applyEditDraft,
		processUseScope,
		processMaintainer,
		processAuditProcess,
	]);

	// 表单初始化逻辑
	useEffect(() => {
		if (!open) {
			// 抽屉关闭时重置表单，确保下次打开时不会有残留数据
			form.resetFields();
			// 重置相关状态
			resetTabs();
			setIsAiTagRuleOpen(false);
			setAddTaskMode("single");
			resetAddSingleDraft();
			resetEditDraft();
			// 重置提交标志
			isSubmittingRef.current = false;
			return;
		}

		/**
		 * 编辑/只读必须等待详情真值返回后再初始化。
		 *
		 * 这样可以避免先拿最小摘要渲染出一版空表单，再被详情二次覆盖，
		 * 也让“父层只传 id，抽屉内部拉详情”的职责边界更稳定。
		 */
		if (isDetailMode && !isDetailReady) {
			return;
		}

		// 抽屉打开时，先重置表单再初始化
		form.resetFields();
		// 重置提交标志
		isSubmittingRef.current = false;

		// 根据 mode 调用对应的初始化方法
		switch (mode) {
			case FORM_MODE.ADD:
				initAddMode();
				break;
			case FORM_MODE.EDIT:
				initEditMode();
				break;
			case FORM_MODE.READONLY:
				initReadonlyMode();
				break;
			default:
				console.warn(`未知的 mode: ${mode}`);
		}
	}, [
		open,
		mode,
		form,
		initAddMode,
		initEditMode,
		initReadonlyMode,
		resetAddSingleDraft,
		resetEditDraft,
		resetTabs,
		isDetailMode,
		isDetailReady,
	]);

	useSyncFtfInterviewUpdFreqEffect(form, tagLibraryType, open);
	useUseScopeLinkageEffect(form, tagLibraryType, mode, open);

	/**
	 * 删除已生成的复合规则标签元数据
	 * 调用 batchUpdateLabelMetaStatus 接口删除，并重置相关状态
	 */
	const deleteTagGenerationLabel = useCallback(async () => {
		const aliTagCode = String(
			form.getFieldValue("aliTagCode") || currentSingleDraft?.aliTagCode || "",
		).trim();
		if (!aliTagCode) {
			return;
		}

		try {
			logLifecycleBatchAction({
				title: "[复合规则][delete]",
				api: "/hrbrain/label/meta/batchUpdateStatus",
				optType: "delete",
				codes: [aliTagCode],
			});
			await batchUpdateLabelMetaStatus({
				codes: [aliTagCode],
				optType: "delete",
			});

			// 重置字段
			form.setFieldsValue({
				aliTagCode: undefined,
				isExisting: false,
			});
			mergeAddSingleDraft({
				aliTagCode: undefined,
				isExisting: false,
			});
		} catch (error) {
			console.error("[复合规则] 删除标签元数据失败:", error);
		}
	}, [currentSingleDraft?.aliTagCode, form, mergeAddSingleDraft]);

	/**
	 * 触发智能标签删除协议回调。
	 *
	 * 调用智能标签删除接口，按 sessionId 与新增/已有标签分组删除当前 AI 任务结果。
	 *
	 * @param payload - 智能标签删除协议
	 * @param options - 删除提示选项
	 * @param options.showSuccessMessage - 是否展示成功提示
	 * @returns Promise<void>
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const notifySmartTagDelete = useCallback(
		async (
			payload: SmartTagDeletePayload,
			options?: {
				showSuccessMessage?: boolean;
			},
		) => {
			logSmartTagDeleteAction(payload);
			await deleteSmartTag(payload);
			if (options?.showSuccessMessage) {
				message.success("调用成功");
			}
		},
		[],
	);

	/**
	 * 组装当前抽屉内智能标签删除协议。
	 *
	 * @param options - 删除上下文
	 * @param options.targetTab - 单独删除的目标页签；不传则按当前抽屉全部 AI 标签组装
	 * @returns 删除协议；无 sessionId 或无有效 code 时返回 undefined
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const getSmartTagDeletePayload = useCallback(
		(options?: { targetTab?: AiTagTabState }) => {
			if (options?.targetTab) {
				const targetCode = resolveSmartTagDeleteCode({
					isExisting: options.targetTab.isExisting,
					tagId: options.targetTab.tagId ? String(options.targetTab.tagId) : undefined,
					existingTagId: options.targetTab.existingTagId
						? String(options.targetTab.existingTagId)
						: undefined,
				});
				return buildSmartTagDeletePayload({
					sessionId:
						options.targetTab.values.aiSessionId ||
						currentSingleDraft?.aiSessionId ||
						form.getFieldValue("aiSessionId"),
					newTagCodes:
						!options.targetTab.isExisting && targetCode ? [String(targetCode)] : [],
					existingTagCodes:
						options.targetTab.isExisting && targetCode ? [String(targetCode)] : [],
				});
			}

			const deleteCodes = collectSmartTagDeleteCodes({
				tabs: aiTagTabs,
				singleDraft: currentSingleDraft || undefined,
				includeSingleDraft: hasSingleAiTagResult,
			});
			return buildSmartTagDeletePayload({
				sessionId: currentSingleDraft?.aiSessionId || form.getFieldValue("aiSessionId"),
				newTagCodes: deleteCodes.newTagCodes,
				existingTagCodes: deleteCodes.existingTagCodes,
			});
		},
		[aiTagTabs, currentSingleDraft, form, hasSingleAiTagResult],
	);

	/**
	 * 删除智能标签元数据（批量删除）
	 * 用于重新描述、切换标签类型或关闭抽屉时清理当前智能标签任务
	 */
	const deleteAiSmartTagLabels = useCallback(async () => {
		if (!hasAiTagTaskResult) {
			return;
		}

		try {
			const payload = getSmartTagDeletePayload();
			if (payload) {
				await notifySmartTagDelete(payload);
			}

			// 重置状态
			resetTabs();
			setIsAiTagRuleOpen(false);
			const nextSingleDraft = normalizeTagDraftValues({
				...(currentSingleDraft || form.getFieldsValue(true)),
				tagName: undefined,
				tagValue: undefined,
				tagDescription: undefined,
				aiSessionId: undefined,
				tagId: undefined,
				existingTagId: undefined,
				isExisting: undefined,
			});
			setAddTaskMode("single");
			applyAddSingleDraft(nextSingleDraft);
		} catch (error) {
			console.error("[智能标签] 删除标签元数据失败:", error);
		}
	}, [
		applyAddSingleDraft,
		currentSingleDraft,
		form,
		getSmartTagDeletePayload,
		hasAiTagTaskResult,
		notifySmartTagDelete,
		resetTabs,
	]);

	/**
	 * 处理标签类型变化
	 * 切换前先二次确认；若涉及 AI 或复合规则中间产物，需先清理后再真正切换。
	 */
	const handleTagTypeChange = useCallback(
		async (nextTagType: TAG_TYPE) => {
			const currentTagType = String(form.getFieldValue("tagType") || "") as TAG_TYPE;
			const decision = getTagTypeSwitchDecision({
				mode,
				currentTagType,
				nextTagType,
				currentRuleSelectionType: String(form.getFieldValue("ruleSelectionType") || ""),
				values: form.getFieldsValue(true),
				aliTagCode: String(form.getFieldValue("aliTagCode") || ""),
				hasAiTagTaskResult,
			});
			if (decision.shouldIgnore) {
				return;
			}

			const executeSwitch = async () => {
				if (decision.shouldDeleteSmartTagResult) {
					await deleteAiSmartTagLabels();
				}

				if (decision.shouldDeleteRuleMeta) {
					await deleteTagGenerationLabel();
				}

				resetAddFormForTagTypeSwitch(nextTagType);
			};

			if (!(form.isFieldsTouched() || decision.shouldConfirm)) {
				await executeSwitch();
				return;
			}

			Modal.confirm({
				title: "确认切换标签类型",
				content: "切换标签类型后，当前已填写的表单内容将被清空，是否继续？",
				centered: true,
				onOk: executeSwitch,
			});
		},
		[
			deleteAiSmartTagLabels,
			deleteTagGenerationLabel,
			form,
			mode,
			hasAiTagTaskResult,
			resetAddFormForTagTypeSwitch,
		],
	);

	/**
	 * 处理是否需要审核变化（仅人才标签）
	 */
	const handleNeedReviewChange = useCallback(
		(e: RadioChangeEvent) => {
			const value = e.target.value === "1";
			const oppositeValue = value ? "0" : "1";
			setNeedInterview(!value);
			form.setFieldValue("isFtfInterview", oppositeValue);
			if (value) {
				form.setFieldValue("ftfInterviewUpdFreq", undefined);
				form.setFieldValue("ftfInterviewer", undefined);
			} else {
				form.setFieldValue("auditProcessTagging", []);
				if (!value && defaultFtfInterviewerValue) {
					form.setFieldValue("ftfInterviewer", defaultFtfInterviewerValue);
					const roleLabel = getRoleLabelByValue(defaultFtfInterviewerValue);
					if (roleLabel) {
						form.setFieldsValue({
							maintainer: defaultFtfInterviewerValue,
							maintainerName: roleLabel,
							maintainerType: "2",
						});
						setCurrentMaintainerValue({
							type: "role",
							typeValue: "2",
							role: defaultFtfInterviewerValue,
						});
					}
				}
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[
			form,
			defaultFtfInterviewerValue,
			getRoleLabelByValue,
			syncSingleDraftAfterProgrammaticChange,
		],
	);

	/**
	 * 处理更新频次变化
	 */
	const handleUpdateFrequencyChange = useCallback(
		(value: string) => {
			if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
				return;
			}
			const isFtfInterview = form.getFieldValue("isFtfInterview");
			if (isFtfInterview === "1" && value) {
				form.setFieldValue("ftfInterviewUpdFreq", value);
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[form, syncSingleDraftAfterProgrammaticChange, tagLibraryType],
	);

	/**
	 * 处理是否需要面谈变化（仅人才标签）
	 */
	const handleNeedInterviewChange = useCallback(
		(e: RadioChangeEvent) => {
			const value = e.target.value === "1";
			setNeedInterview(value);
			const oppositeValue = value ? "0" : "1";
			form.setFieldValue("isAuditTagging", oppositeValue);
			if (value) {
				form.setFieldValue("auditProcessTagging", []);
				if (defaultFtfInterviewerValue) {
					form.setFieldValue("ftfInterviewer", defaultFtfInterviewerValue);
					const roleLabel = getRoleLabelByValue(defaultFtfInterviewerValue);
					if (roleLabel) {
						form.setFieldsValue({
							maintainer: defaultFtfInterviewerValue,
							maintainerName: roleLabel,
							maintainerType: "2",
						});
						setCurrentMaintainerValue({
							type: "role",
							typeValue: "2",
							role: defaultFtfInterviewerValue,
						});
					}
				}
				syncFtfInterviewUpdFreq();
			} else {
				form.setFieldValue("ftfInterviewUpdFreq", undefined);
				form.setFieldValue("ftfInterviewer", undefined);
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[
			form,
			syncFtfInterviewUpdFreq,
			getRoleLabelByValue,
			defaultFtfInterviewerValue,
			syncSingleDraftAfterProgrammaticChange,
		],
	);

	/**
	 * 处理面谈人变化
	 *
	 * 面谈机制开启时，维护人与面谈人保持一致同步。
	 */
	const handleFtfInterviewerChange = useCallback(
		(value: string) => {
			if (!value) {
				return;
			}

			const roleLabel = getRoleLabelByValue(value) || value;
			form.setFieldsValue({
				ftfInterviewer: value,
				maintainer: value,
				maintainerName: roleLabel,
				maintainerType: "2",
			});
			setCurrentMaintainerValue({
				type: "role",
				typeValue: "2",
				role: value,
			});
			syncSingleDraftAfterProgrammaticChange();
		},
		[form, getRoleLabelByValue, syncSingleDraftAfterProgrammaticChange],
	);

	/**
	 * 处理是否需要附件证明变化（仅人才标签）
	 */
	const handleNeedAttachmentChange = useCallback(
		(e: RadioChangeEvent) => {
			const value = e.target.value === "1";
			setNeedAttachment(value);
			if (!value) {
				form.setFieldValue("attProofReqsTagging", "");
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[form, syncSingleDraftAfterProgrammaticChange],
	);

	/**
	 * 打开 AI 对话弹窗。
	 *
	 * 当当前表单中已经存在 AI 生成结果时，先确认是否清空旧结果，
	 * 避免用户误覆盖已识别但尚未提交的标签数据。
	 */
	const handleStartAiDescription = useCallback(() => {
		if (hasAiTagTaskResult) {
			Modal.confirm({
				title: "确认重新描述",
				content: "重新向 AI 描述标签将删除当前已生成的标签，是否继续？",
				okText: "确定",
				cancelText: "取消",
				centered: true,
				onOk: async () => {
					await deleteAiSmartTagLabels();
					setIsAiTagModalOpen(true);
				},
			});
		} else {
			setIsAiTagModalOpen(true);
		}
	}, [deleteAiSmartTagLabels, hasAiTagTaskResult]);

	/**
	 * 处理 AI 智能标签返回结果。
	 *
	 * 将 AI 识别结果转为抽屉内部 tab 状态，并回填首个标签到当前表单，
	 * 供用户继续补充基础信息或校验已有标签。
	 *
	 * @param payload - AI 智能标签回显负载
	 */
	const handleAiSmartTagsReturned = useCallback(
		async (payload: AiSmartTagsReturnedPayload) => {
			const { tags, newTagCount, existingTagCount } = payload;

			if (tags.length === 0) {
				message.warning("AI 未识别到任何标签");
				return;
			}

			const tips: string[] = [];
			if (newTagCount > 0) {
				tips.push(`识别到${newTagCount}个新增标签`);
			}
			if (existingTagCount > 0) {
				tips.push(`${existingTagCount}个标签已存在（带已有标识）`);
			}

			message.success(`根据AI结果，${tips.join("，")}`);

			const currentFormValues = syncAddSingleDraftFromForm();
			const tabItems = buildAiTagDraftTabs({
				tags,
				tagLibraryType,
				currentFormValues,
				sessionId: currentFormValues.aiSessionId,
			});

			if (tabItems.length > 1) {
				setAddTaskMode("batch");
				initializeTabs(tabItems);

				const duplicateNameValidation = await validateIntelligentTagDuplicateNames(
					tabItems.map((tab) => ({
						tempId: tab.tempId,
						values: tab,
						isExisting: Boolean(tab.isExisting),
					})),
					tagLibraryType,
				);

				if (duplicateNameValidation.firstInvalid) {
					const nextTabs: AiTagTabState[] = tabItems.map((tab) => {
						const duplicateErrors =
							duplicateNameValidation.results.find(
								(result) => result.tempId === tab.tempId,
							)?.errors || {};
						return {
							...tab,
							isExisting: Boolean(tab.isExisting),
							values: normalizeTagDraftValues({
								...tab,
								isExisting: Boolean(tab.isExisting),
							}),
							errors: duplicateErrors,
							dirty: false,
						};
					});
					replaceTabs(nextTabs);
					activateTab(duplicateNameValidation.firstInvalid.tempId, nextTabs);
				}
			} else {
				const { tempId: _tempId, ...singleAiDraftValues } = tabItems[0] || {};
				const singleAiDraft = normalizeTagDraftValues(
					singleAiDraftValues || currentFormValues || {},
				);
				setAddTaskMode("single");
				applyAddSingleDraft(singleAiDraft);
				resetTabs();

				const duplicateNameValidation = await validateIntelligentTagDuplicateNames(
					[
						{
							tempId: "__single__",
							values: singleAiDraft,
							isExisting: Boolean(singleAiDraft.isExisting),
						},
					],
					tagLibraryType,
				);

				form.setFields([
					{
						name: "tagName",
						errors: duplicateNameValidation.firstInvalid
							? [getIntelligentTagDuplicateValidationMessage({ isBatchTask: false })]
							: [],
					},
				]);
			}

			setIsAiTagRuleOpen(true);

			// eslint-disable-next-line no-console
			console.log("[智能标签] AI返回标签数据:", tabItems);
		},
		[
			applyAddSingleDraft,
			initializeTabs,
			resetTabs,
			syncAddSingleDraftFromForm,
			tagLibraryType,
		],
	);

	/**
	 * 根据 sessionId 拉取 AI 标签并回显到表单。
	 *
	 * @param sessionId - AI 对话完成后的会话 ID
	 */
	const applyAiTagsFromSession = useCallback(
		async (sessionId: string) => {
			const requestVersion = drawerOpenVersionRef.current;
			const labelMetaList = await fetchLabelMetaBySession({ sessionId });
			if (!open || drawerOpenVersionRef.current !== requestVersion) {
				return;
			}

			if (!labelMetaList?.length) {
				message.warning("AI 未识别到任何标签");
				return;
			}

			handleAiSmartTagsReturned(convertLabelMetaListToAiSmartTags(labelMetaList, sessionId));
		},
		[handleAiSmartTagsReturned, open],
	);

	/**
	 * 处理复合规则提交后的表单回填。
	 *
	 * 开发态允许直接传入 mock labelMeta，复用与真实接口完全一致的回填链路。
	 *
	 * @param payload - 复合规则提交载荷
	 * @param options - 可选 mock 数据
	 * @param options.labelMetaList - 开发态 mock 标签元数据
	 * @returns Promise<void>
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const applyTagGenerationSubmittedResult = useCallback(
		async (
			payload: TagGenerationSubmittedPayload,
			options?: {
				labelMetaList?: LabelMetaItem[];
			},
		) => {
			const requestVersion = drawerOpenVersionRef.current;
			const labelMeta: LabelMetaItem[] =
				options?.labelMetaList || (await fetchLabelMeta({ labelCode: payload.code }));
			if (!open || drawerOpenVersionRef.current !== requestVersion) {
				return;
			}

			const firstLabelMeta: LabelMetaItem = labelMeta[0] || ({} as LabelMetaItem);
			const sensitivityLevel = firstLabelMeta.isSensitive ? "2" : "1";

			form.setFieldsValue({
				aliTagCode: payload.code,
				tagName: firstLabelMeta.labelName,
				tagValue: firstLabelMeta.labelValue,
				tagDescription: firstLabelMeta.labelDescription,
				businessCategory: firstLabelMeta.labelCategoryCode,
				isExisting: firstLabelMeta.isExist,
				sensitivityLevel,
			});

			form.validateFields(["tagName"]).catch(() => {
				// 重名等校验错误直接留在表单上展示即可。
			});
			syncSingleDraftAfterProgrammaticChange();
			setIsTagGenerationModalOpen(false);
		},
		[form, open, syncSingleDraftAfterProgrammaticChange],
	);

	/**
	 * 删除 AI 标签页签。
	 *
	 * @param targetKey - 待删除标签对应的临时标识
	 */
	const handleRemoveTab = useCallback(
		(targetKey: string) => {
			const targetTab = aiTagTabs.find((tab) => tab.tempId === targetKey);
			if (!targetTab) {
				return;
			}

			const confirmMessage = targetTab.isExisting
				? "是否确认取消已有标签的打标数据更新？"
				: "是否确认删除标签？";

			Modal.confirm({
				title: "确认操作",
				content: confirmMessage,
				centered: true,
				onOk: async () => {
					try {
						const payload = getSmartTagDeletePayload({
							targetTab,
						});
						if (payload) {
							await notifySmartTagDelete(payload, {
								showSuccessMessage: true,
							});
						}
					} catch (error) {
						console.error("[智能标签] 删除标签元数据失败:", error);
						message.error("删除标签失败");
						throw error;
					}

					const newTabs = removeTab(targetKey);

					if (newTabs.length === 0) {
						setIsAiTagRuleOpen(false);
						setAddTaskMode("single");
						applyAddSingleDraft(
							normalizeTagDraftValues({
								...buildDefaultTagDraft(tagLibraryType, initialTagType as TAG_TYPE),
								...form.getFieldsValue(true),
								tagName: undefined,
								tagValue: undefined,
								tagDescription: undefined,
								aiSessionId: undefined,
								aliTagCode: undefined,
								tagId: undefined,
								existingTagId: undefined,
								isExisting: undefined,
							}),
						);
					}
				},
			});
		},
		[
			aiTagTabs,
			applyAddSingleDraft,
			form,
			getSmartTagDeletePayload,
			initialTagType,
			notifySmartTagDelete,
			removeTab,
			tagLibraryType,
		],
	);

	/**
	 * 切换 AI 标签页签。
	 *
	 * 切换前先缓存当前页签表单值，再恢复目标页签对应的数据，
	 * 避免多标签场景下用户修改内容被覆盖。
	 *
	 * @param newActiveKey - 新激活标签的临时标识
	 */
	const handleTabChange = useCallback(
		(newActiveKey: string) => {
			switchTab(newActiveKey);
		},
		[switchTab],
	);

	/**
	 * 打开复合规则 iframe 弹窗。
	 */
	const handleStartTagGeneration = useCallback(() => {
		setIsTagGenerationModalOpen(true);
	}, []);

	/**
	 * 清空规则来源派生字段
	 *
	 * 规则库选取、AI 标签、自定义复合规则都会回填标签基础信息。
	 * 当用户切换规则来源时，必须清空这些派生值，避免旧规则脏数据通过必填校验。
	 */
	const clearRuleDerivedFields = useCallback(
		(patch?: Record<string, unknown>) => {
			clearFieldState(RULE_DERIVED_FIELD_NAMES, patch);
		},
		[clearFieldState],
	);

	/**
	 * 处理系统标签下规则来源切换。
	 *
	 * 规则库与自定义复合规则共用一套标签基础字段回填。
	 * 切换来源前若已有回填内容，需要先确认清空，再完成删除与切换。
	 *
	 * @param nextRuleSelectionType - 目标规则来源
	 *
	 * @author 王善能
	 * @since 2026-07-06
	 */
	const handleRuleSelectionTypeChange = useCallback(
		async (nextRuleSelectionType: string) => {
			const decision = getRuleSourceSwitchDecision({
				currentRuleSelectionType: String(
					form.getFieldValue("ruleSelectionType") || RULE_SOURCE_VALUES.FROM_LIBRARY,
				),
				nextRuleSelectionType,
				values: form.getFieldsValue(true),
				aliTagCode: String(form.getFieldValue("aliTagCode") || ""),
			});
			if (decision.shouldIgnore) {
				return;
			}

			const executeSwitch = async () => {
				if (decision.shouldDeleteRuleMeta) {
					await deleteTagGenerationLabel();
				}

				clearRuleDerivedFields({
					ruleSelectionType: nextRuleSelectionType,
				});
				syncSingleDraftAfterProgrammaticChange();
			};

			if (!decision.shouldConfirm) {
				await executeSwitch();
				return;
			}

			Modal.confirm({
				title: "确认切换规则来源",
				content: "切换规则来源后，当前规则回填的内容将被清空，是否继续？",
				centered: true,
				onOk: executeSwitch,
			});
		},
		[
			clearRuleDerivedFields,
			deleteTagGenerationLabel,
			form,
			syncSingleDraftAfterProgrammaticChange,
		],
	);

	/**
	 * 查看 AI 识别结果详情抽屉。
	 */
	const handleViewAiTagRule = useCallback(() => {
		if (!currentAiTagResultContext.labelCode) {
			message.warning("暂无可查看的 AI 标签结果");
			return;
		}

		setAiTagRulePage({ pageNum: 1, pageSize: 20 });
		setIsAiTagRuleModalOpen(true);
	}, [currentAiTagResultContext.labelCode]);

	const handleDisplayInOrgBrainChange = useCallback(
		(value: boolean) => {
			if (value === false) {
				clearFieldState(TAG_PRESENTATION_FIELD_NAMES, {
					tagVisibility: undefined,
					tagDistributionModule: undefined,
				});
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[clearFieldState, syncSingleDraftAfterProgrammaticChange],
	);

	const handleTagVisibilityChange = useCallback(
		(value: string) => {
			if (value === "1") {
				clearFieldState(["tagDistributionModule"]);
			}
			syncSingleDraftAfterProgrammaticChange();
		},
		[clearFieldState, syncSingleDraftAfterProgrammaticChange],
	);

	/**
	 * 查看规则标签抽屉。
	 *
	 * 根据标签库类型切换到组织标签或人才标签对应的规则查看组件。
	 */
	const handleViewTagRule = useCallback(() => {
		const tagRulesId = form.getFieldValue("tagRulesId");
		if (!tagRulesId) {
			return;
		}

		if (tagLibraryType === TAG_RULE_TYPE_DICT.ORG) {
			setOrgTagRuleDrawerTagRuleId(String(tagRulesId));
			setIsOrgTagRuleDrawerOpen(true);
		} else {
			setTagRuleDrawerTagRuleId(String(tagRulesId));
			const useScope = form.getFieldValue("useScope") || [];
			const jobPositionList = convertUseScopeToJobPositionList(useScope, jobPositionNodeMap);
			setTagRuleDrawerJobPositionList(jobPositionList);
			setIsTagRuleDrawerOpen(true);
		}
	}, [form, jobPositionNodeMap, tagLibraryType]);

	/**
	 * 处理维护人选择确认。
	 *
	 * 将人员或角色选择结果回写 maintainer 相关隐藏字段，供提交接口使用。
	 *
	 * @param value - 维护人选择器返回值
	 *
	 * @author 王善能
	 * @since 2026-06-11
	 */
	const handleMaintainerConfirm = useCallback(
		(value: MaintainerSelectorValue) => {
			setCurrentMaintainerValue(value);
			if (value.type === "person" && value.person) {
				const displayName = `${value.person.name}(${value.person.deptPath})`;
				form.setFieldsValue({
					maintainer: value.person.id,
					maintainerName: displayName,
					maintainerType: value.typeValue,
				});
			} else if (value.type === "role" && value.role) {
				const roleLabel = getRoleLabelByValue(value.role) || value.role;
				form.setFieldsValue({
					maintainer: value.role,
					maintainerName: roleLabel,
					maintainerType: value.typeValue,
				});
			}
			setIsMaintainerModalOpen(false);
			syncSingleDraftAfterProgrammaticChange();
		},
		[form, getRoleLabelByValue, syncSingleDraftAfterProgrammaticChange],
	);

	/**
	 * 处理打标审核流程审批人选择确认。
	 *
	 * 根据 currentApproverFieldPath 定位 Form.List 中的审批步骤，回写审批人 id、展示名与类型。
	 *
	 * @param value - 审批人选择器返回值
	 *
	 * @author 王善能
	 * @since 2026-06-11
	 */
	const handleApproverConfirm = useCallback(
		(value: MaintainerSelectorValue) => {
			setCurrentApproverValue(value);
			if (currentApproverFieldPath.length >= 2) {
				const [parentField, index, fieldName] = currentApproverFieldPath;
				if (value.type === "person" && value.person) {
					const displayName = `${value.person.name}(${value.person.deptPath})`;
					form.setFieldValue([parentField, index, fieldName], value.person.id);
					form.setFieldValue([parentField, index, "approverName"], displayName);
					form.setFieldValue([parentField, index, "type"], value.typeValue);
				} else if (value.type === "role" && value.role) {
					const roleLabel = getRoleLabelByValue(value.role) || value.role;
					form.setFieldValue([parentField, index, fieldName], value.role);
					form.setFieldValue([parentField, index, "approverName"], roleLabel);
					form.setFieldValue([parentField, index, "type"], value.typeValue);
				}
			}
			setIsApproverModalOpen(false);
			setCurrentApproverFieldPath([]);
			syncSingleDraftAfterProgrammaticChange();
		},
		[
			form,
			currentApproverFieldPath,
			getRoleLabelByValue,
			syncSingleDraftAfterProgrammaticChange,
		],
	);

	/**
	 * 打开审批人选择弹窗。
	 *
	 * 根据当前步骤已选值反解 MaintainerSelectorValue，用于弹窗回显。
	 *
	 * @param fieldPath - 审批人字段在 Form.List 中的路径
	 * @param currentValue - 当前审批人 id 或角色值
	 * @param currentName - 当前审批人展示名
	 * @param currentType - 当前审批人类型（1 人员 / 2 角色）
	 *
	 * @author 王善能
	 * @since 2026-06-11
	 */
	const handleOpenApproverModal = useCallback(
		(fieldPath: string[], currentValue: any, currentName: any, currentType: any) => {
			setCurrentApproverFieldPath(fieldPath);
			let approverValue: MaintainerSelectorValue | undefined;
			if (currentValue) {
				if (currentType === "2") {
					const roleLabel = getRoleLabelByValue(currentValue);
					if (roleLabel) {
						approverValue = {
							type: "role" as const,
							typeValue: "2" as const,
							role: String(currentValue),
						};
					}
				} else {
					const nameStr = String(currentName || "");
					const match = nameStr.match(/^([^(]+)\(([^)]+)\)$/);
					if (match) {
						approverValue = {
							type: "person" as const,
							typeValue: "1" as const,
							person: {
								id: String(currentValue),
								name: match[1],
								deptPath: match[2],
							},
						};
					}
				}
			}
			setCurrentApproverValue(approverValue);
			setIsApproverModalOpen(true);
		},
		[getRoleLabelByValue],
	);

	/**
	 * 提交表单
	 */
	const handleFinish = useCallback(
		async (values: any) => {
			if (isDetailMode && !isDetailReady) {
				message.warning(
					isDetailLoadFailed
						? "标签详情加载失败，请先重新加载"
						: "标签详情加载中，请稍候",
				);
				return false;
			}

			// 获取当前标签类型
			const currentTagType = form.getFieldValue("tagType");
			const currentRuleSelectionType = form.getFieldValue("ruleSelectionType");
			const currentAliTagCode = form.getFieldValue("aliTagCode");

			if (
				currentTagType === TAG_TYPE.SYSTEM &&
				currentRuleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE &&
				!currentAliTagCode
			) {
				message.error("请先新建复合规则");
				form.setFields([{ name: "aliTagCode", errors: ["请先新建复合规则"] }]);
				return false;
			}

			// 智能标签批量任务场景
			if (hasBatchAiTagTask) {
				const validation = validateAiTagTabs(aiTagValidationContext);
				if (validation.firstInvalid) {
					activateTab(validation.firstInvalid.tempId, validation.tabs);
					message.warning("请完善必填信息");
					return false;
				}

				const duplicateNameValidation = await validateIntelligentTagDuplicateNames(
					validation.tabs,
					tagLibraryType,
				);
				if (duplicateNameValidation.firstInvalid) {
					const nextTabs = validation.tabs.map((tab) => {
						const duplicateErrors =
							duplicateNameValidation.results.find(
								(result) => result.tempId === tab.tempId,
							)?.errors || {};
						return {
							...tab,
							errors: {
								...tab.errors,
								...duplicateErrors,
							},
						};
					});
					replaceTabs(nextTabs);
					const firstInvalidTab = duplicateNameValidation.firstInvalid.tempId;
					activateTab(firstInvalidTab, nextTabs);
					message.warning(duplicateNameValidation.firstInvalid.message);
					return false;
				}

				const allTagsData = validation.tabs
					.filter((tab) => !tab.isExisting)
					.map((tab) => toAiTagSubmitPayload(tab, aiTagValidationContext));

				// 调用 batchUpdateLabelMetaStatus 下线接口（AI 返回的标签必定有 tagId）
				const codesToOffline = collectAiTagLifecycleCodesToOffline(validation.tabs);

				if (codesToOffline.length > 0) {
					try {
						logLifecycleBatchAction({
							title: "[智能标签][offline]",
							api: "/hrbrain/label/meta/batchUpdateStatus",
							optType: "offline",
							codes: codesToOffline,
						});
						await batchUpdateLabelMetaStatus({
							codes: codesToOffline,
							optType: "offline",
						});
					} catch (error) {
						console.error("[智能标签] 下线标签元数据失败:", error);
						message.error("下线智能标签失败");
						return false;
					}
				}

				// 标记为提交关闭，避免在关闭时调用删除接口
				if (allTagsData.length > 0) {
					await submitDrawerForm(allTagsData);
				} else {
					await onSubmitSuccess?.();
				}
				isSubmittingRef.current = true;
				return true;
			}

			const latestSingleDraft = isEditMode
				? syncEditDraftFromForm(values)
				: syncAddSingleDraftFromForm(values);
			if (isAddMode && latestSingleDraft.tagType === TAG_TYPE.INTELLIGENT) {
				const duplicateNameValidation = await validateIntelligentTagDuplicateNames(
					[
						{
							tempId: "__single__",
							values: latestSingleDraft,
							isExisting: latestSingleDraft.isExisting,
						},
					],
					tagLibraryType,
				);
				if (duplicateNameValidation.firstInvalid) {
					form.setFields([
						{
							name: "tagName",
							errors: [
								getIntelligentTagDuplicateValidationMessage({
									isBatchTask: false,
								}),
							],
						},
					]);
					message.warning(
						getIntelligentTagDuplicateValidationMessage({
							isBatchTask: false,
						}),
					);
					return false;
				}
			}
			const singleSubmitResult = await submitSingleTagDraft({
				mode,
				latestDraft: latestSingleDraft,
				context: {
					tagLibraryType,
					jobPositionNodeMap,
				},
				onSubmit: submitDrawerForm,
				onOfflineLifecycleCode: async (code) => {
					try {
						logLifecycleBatchAction({
							title: "[标签生命周期][offline]",
							api: "/hrbrain/label/meta/batchUpdateStatus",
							optType: "offline",
							codes: [code],
							extra: {
								tagType: latestSingleDraft.tagType,
							},
						});
						await batchUpdateLabelMetaStatus({
							codes: [code],
							optType: "offline",
						});
					} catch (error) {
						console.error(
							latestSingleDraft.tagType === TAG_TYPE.INTELLIGENT
								? "[智能标签] 下线标签元数据失败:"
								: "[复合规则] 下线标签元数据失败:",
							error,
						);
						message.error(
							latestSingleDraft.tagType === TAG_TYPE.INTELLIGENT
								? "下线智能标签失败"
								: "下线复合规则失败",
						);
						throw error;
					}
				},
			});

			if (!singleSubmitResult.ok) {
				form.setFields(toTagFormFieldErrors(singleSubmitResult.validation.errors));
				message.warning("请完善必填信息");
				return false;
			}

			// 标记为提交关闭，避免在关闭时调用删除接口
			isSubmittingRef.current = true;
			return true;
		},
		[
			isEditMode,
			tagLibraryType,
			form,
			aiTagValidationContext,
			validateAiTagTabs,
			activateTab,
			mode,
			jobPositionNodeMap,
			isAddMode,
			syncAddSingleDraftFromForm,
			syncEditDraftFromForm,
			replaceTabs,
			isDetailLoadFailed,
			isDetailMode,
			isDetailReady,
		],
	);

	/**
	 * 处理抽屉关闭
	 *
	 * 新增模式下：
	 * 1. 如果存在已生成的复合规则但未提交，删除后再关闭
	 * 2. 如果存在已生成的智能标签但未提交，删除后再关闭
	 * 编辑/只读模式：直接关闭，不删除已存在的标签
	 *
	 * 注意：如果是通过提交关闭的（点击确定/更新按钮），不调用删除接口
	 */
	const handleDrawerClose = useCallback(async () => {
		// 如果是通过提交关闭的，不调用删除接口
		if (isSubmittingRef.current) {
			isSubmittingRef.current = false;
			onClose();
			return;
		}

		// 仅在新增模式下执行清理逻辑
		if (mode === FORM_MODE.ADD) {
			const cleanupDecision = getDrawerCloseCleanupDecision({
				mode,
				currentTagType: String(form.getFieldValue("tagType") || "") as TAG_TYPE,
				currentRuleSelectionType: String(
					form.getFieldValue("ruleSelectionType") || RULE_SOURCE_VALUES.FROM_LIBRARY,
				),
				aliTagCode: String(form.getFieldValue("aliTagCode") || ""),
				hasAiTagTaskResult,
			});
			if (cleanupDecision.shouldDeleteRuleMeta) {
				await deleteTagGenerationLabel();
			}

			if (cleanupDecision.shouldDeleteSmartTagResult) {
				await deleteAiSmartTagLabels();
			}
		}
		onClose();
	}, [mode, form, deleteTagGenerationLabel, deleteAiSmartTagLabels, hasAiTagTaskResult, onClose]);

	const handleOpenTagFormDebug = useCallback(() => {
		if (hasBatchAiTagTask) {
			syncActiveTabValues();
		} else if (isEditMode) {
			syncEditDraftFromForm();
		} else {
			syncAddSingleDraftFromForm();
		}
		setTagFormDebugOpen(true);
	}, [
		hasBatchAiTagTask,
		isEditMode,
		syncActiveTabValues,
		syncAddSingleDraftFromForm,
		syncEditDraftFromForm,
	]);

	const handleDrawerValuesChange = useCallback(
		(changedValues: Record<string, unknown>) => {
			handleFormValuesChange(changedValues);
			if (hasBatchAiTagTask) {
				return;
			}

			if (isEditMode) {
				mergeEditDraft(changedValues);
				return;
			}
			mergeAddSingleDraft(changedValues);
		},
		[
			handleFormValuesChange,
			hasBatchAiTagTask,
			isEditMode,
			mergeAddSingleDraft,
			mergeEditDraft,
		],
	);

	const tagFormDebugPayload = useMemo(() => {
		const currentFormValues = normalizeTagDraftValues(form.getFieldsValue(true));
		const currentSingleDraftForDebug = currentSingleDraft || currentFormValues;
		const submitPayloads = toCreateTagSubmitPayloads({
			formMode: hasBatchAiTagTask ? "batch" : "single",
			singleDraft: currentSingleDraftForDebug,
			batchTabs: aiTagTabs,
			context: {
				tagLibraryType,
				jobPositionNodeMap,
			},
		});
		return {
			formMode: hasBatchAiTagTask ? "batch" : "single",
			drawerMode: mode,
			activeTabKey,
			currentFormValues,
			singleDraft: currentSingleDraft,
			aiTagTabs,
			validationResults: hasBatchAiTagTask
				? validateAllAiTagTabs(aiTagTabs, aiTagValidationContext)
				: undefined,
			submitPayloads,
		};
	}, [
		activeTabKey,
		aiTagTabs,
		aiTagValidationContext,
		form,
		jobPositionNodeMap,
		currentSingleDraft,
		tagLibraryType,
		mode,
	]);

	const handleRetryLoadDetail = useCallback(() => {
		void refetchTagDetail();
	}, [refetchTagDetail]);

	return (
		<>
			<DrawerForm
				title={title}
				width={TAG_FORM_DRAWER_WIDTH}
				open={open}
				onOpenChange={(isOpen) => {
					if (!isOpen) {
						handleDrawerClose();
					}
				}}
				form={form}
				layout="horizontal"
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 20 }}
				colon={false}
				readonly={mode === FORM_MODE.READONLY}
				scrollToFirstError
				onValuesChange={handleDrawerValuesChange}
				onFinish={handleFinish}
				onFinishFailed={() => {
					message.warning("请完善必填信息");
				}}
				drawerProps={{
					closable: { placement: "end" },
					destroyOnHidden: true,
					loading: isDetailLoadingVisible,
					placement: "right",
					styles: TAG_DRAWER_BODY_STYLES,
				}}
				submitter={{
					render: (props) => {
						if (mode === FORM_MODE.READONLY) {
							return null;
						}
						return (
							<div className="flex w-full items-center justify-between">
								<div>
									{import.meta.env.DEV ? (
										<Button onClick={handleOpenTagFormDebug}>调试 JSON</Button>
									) : null}
								</div>
								<div className="text-right">
									<Button
										onClick={handleDrawerClose}
										className="mr-2"
										disabled={submitDrawerFormLoading}
									>
										取消
									</Button>
									<Button
										type="primary"
										onClick={() => props.submit?.()}
										loading={submitDrawerFormLoading}
										disabled={
											submitDrawerFormLoading ||
											(isEditMode && !isDetailReady)
										}
									>
										{mode === FORM_MODE.ADD
											? hasBatchAiTagTask
												? "提交全部标签"
												: "确定"
											: "更新"}
									</Button>
								</div>
							</div>
						);
					},
				}}
			>
				{/* 驳回原因 banner 贴边展示，其余表单位于内容区内边距中 */}
				{currentTagDetail?.auditComment && (
					<Alert
						banner
						message={`驳回原因：${currentTagDetail?.auditComment}`}
						type="error"
						showIcon
					/>
				)}

				{/* 智能标签任务说明 banner 贴边展示 */}
				{shouldShowAiTaskBanner && (
					<Alert
						banner
						type="info"
						showIcon
						message="AI 识别任务说明："
						description={
							<div className="text-sm">
								{hasBatchAiTagTask ? (
									<Typography.Text>
										1、根据AI结果，已为您新增
										{aiTagTabs.filter((t) => !t.isExisting).length}
										个标签
										{aiTagTabs.filter((t) => t.isExisting).length > 0 && (
											<>
												，{aiTagTabs.filter((t) => t.isExisting).length}
												个标签已存在（带已有标识）
											</>
										)}
									</Typography.Text>
								) : (
									<Typography.Text>
										1、当前智能标签结果已回填，请继续补充剩余基础信息。
									</Typography.Text>
								)}
								<br />
								<Typography.Text>
									2、
									{getAiTaskInstructionText({ isBatchTask: hasBatchAiTagTask })}
								</Typography.Text>
							</div>
						}
					/>
				)}

				<div className={TAG_DRAWER_CONTENT_CLASS}>
					{isDetailLoadFailed ? (
						<TagFormDrawerLoadErrorState
							description="详情获取失败，请重新加载后再编辑或查看。"
							onRetry={handleRetryLoadDetail}
						/>
					) : (
						<Spin spinning={isDetailLoadingVisible} tip="详情加载中...">
							<div className="min-h-[520px]">
								{/* 智能标签多标签 Tabs */}
								{hasBatchAiTagTask && (
									<AiTagScrollTabs
										tabs={aiTagTabDisplayItems}
										activeKey={activeTabKey}
										onChange={handleTabChange}
										onRemove={handleRemoveTab}
										onStartAiDescription={handleStartAiDescription}
									/>
								)}

								{/* 基础信息表单 */}
								<BasicInfoSection
									form={form}
									mode={mode}
									tagLibraryType={tagLibraryType}
									filteredTagTypeOptions={filteredTagTypeOptions}
									businessCategoryOptions={businessCategoryOptions}
									sensitivityLevelOptions={sensitivityLevelOptions || []}
									updateFrequencyOptions={updateFrequencyOptions || []}
									tagNameValidator={tagNameValidator}
									onTagTypeChange={handleTagTypeChange}
									onStartAiDescription={handleStartAiDescription}
									onViewAiTagRule={handleViewAiTagRule}
									onViewTagRule={handleViewTagRule}
									onStartTagGeneration={handleStartTagGeneration}
									onUpdateFrequencyChange={handleUpdateFrequencyChange}
									onRuleLibrarySelectionSync={
										syncSingleDraftAfterProgrammaticChange
									}
									onRuleSelectionTypeChange={handleRuleSelectionTypeChange}
									showAiDescriptionButton={showAiDescriptionButton}
									canStartAiDescription={canStartAiDescription}
									canViewAiTagResult={canViewAiTagResult}
									aiDescriptionButtonText={aiDescriptionButtonText}
								/>

								{/* 审核机制表单 */}
								<AuditMechanismSection
									mode={mode}
									tagLibraryType={tagLibraryType}
									auditorOptions={auditorOptions || []}
									needInterview={needInterview}
									onMaintainerModalOpen={() => setIsMaintainerModalOpen(true)}
								/>

								{/* 打标审核机制表单（仅人才标签的手工标签） */}
								<TaggingAuditSection
									form={form}
									mode={mode}
									tagLibraryType={tagLibraryType}
									needAttachment={needAttachment}
									handleNeedReviewChange={handleNeedReviewChange}
									handleNeedAttachmentChange={handleNeedAttachmentChange}
									onOpenApproverModal={handleOpenApproverModal}
									getRoleLabelByValue={getRoleLabelByValue}
								/>

								{/* 面谈机制表单（仅人才标签的手工标签） */}
								<InterviewMechanismSection
									form={form}
									mode={mode}
									tagLibraryType={tagLibraryType}
									needInterview={needInterview}
									ftfInterviewUpdFreqOptions={ftfInterviewUpdFreqOptions || []}
									maintainerRoleOptions={interviewerRoleOptions || []}
									handleNeedInterviewChange={handleNeedInterviewChange}
									handleFtfInterviewerChange={handleFtfInterviewerChange}
								/>

								{/* 使用范围表单（仅人才标签） */}
								<UseScopeSection
									mode={mode}
									tagLibraryType={tagLibraryType}
									processedJobPositionTreeData={processedJobPositionTreeData}
									jobPositionTreeData={jobPositionTreeData}
									jobPositionLoading={jobPositionLoading}
								/>

								{/* 标签呈现表单（仅人才标签） */}
								<TagPresentationSection
									tagLibraryType={tagLibraryType}
									onDisplayInOrgBrainChange={handleDisplayInOrgBrainChange}
									onTagVisibilityChange={handleTagVisibilityChange}
								/>
							</div>
						</Spin>
					)}
				</div>
			</DrawerForm>

			{import.meta.env.DEV ? (
				<TagFormDebugDrawer
					open={tagFormDebugOpen}
					onClose={() => setTagFormDebugOpen(false)}
					payload={tagFormDebugPayload}
				/>
			) : null}

			{/* 查看人才 AI 打标人员弹窗 */}
			{tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && (
				<ViewTalentAiTagModal
					open={isAiTagRuleModalOpen}
					onClose={() => {
						setIsAiTagRuleModalOpen(false);
					}}
					tagDescription={currentAiTagResultContext.tagDescription}
					dataSource={aiTagRulePageData?.list || []}
					total={aiTagRulePageData?.total || 0}
					pageNum={aiTagRulePage.pageNum}
					pageSize={aiTagRulePage.pageSize}
					loading={aiTagRuleLoading}
					onPageChange={(pageNum, pageSize) => {
						setAiTagRulePage({ pageNum, pageSize });
					}}
				/>
			)}

			{/* 维护人选择弹窗 */}
			{tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && (
				<MaintainerSelectorModal
					open={isMaintainerModalOpen}
					onClose={() => setIsMaintainerModalOpen(false)}
					onConfirm={handleMaintainerConfirm}
					value={currentMaintainerValue}
					roleOptions={maintainerRoleOptions}
					title="维护人"
				/>
			)}

			{/* 审批人选择弹窗 */}
			{tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && (
				<MaintainerSelectorModal
					open={isApproverModalOpen}
					onClose={() => {
						setIsApproverModalOpen(false);
						setCurrentApproverFieldPath([]);
					}}
					onConfirm={handleApproverConfirm}
					value={currentApproverValue}
					roleOptions={approverRoleOptions}
					title="审批人"
				/>
			)}

			{/* AI 对话 iframe */}
			<AiTagIframeModal
				open={isAiTagModalOpen}
				onClose={() => {
					setIsAiTagModalOpen(false);
				}}
				url={AI_TAG_IFRAME_URL[tagLibraryType]}
				libraryType={tagLibraryType}
				title="AI 对话"
				onConversationCreated={(payload) => {
					// 保存 sessionId，供提交后按会话拉取 AI 标签结果使用。
					form.setFieldValue("aiSessionId", payload.sessionId);
					console.warn("AI 会话已创建:", payload.sessionId);
				}}
				onConversationSubmitted={async (payload) => {
					const sessionId = payload.sessionId || form.getFieldValue("aiSessionId");
					if (!sessionId) {
						message.warning("提交失败，请重新创建会话");
						return;
					}

					// iframe 提交成功后立即关闭对话弹窗，后续结果回填在抽屉外异步完成。
					setIsAiTagModalOpen(false);

					try {
						await applyAiTagsFromSession(sessionId);
					} catch (error) {
						console.error("获取 AI 标签数据失败:", error);
						message.error("获取 AI 标签数据失败，请重试");
					}
				}}
			/>

			{/* 复合规则 iframe */}
			<AiTagIframeModal
				open={isTagGenerationModalOpen}
				onClose={() => {
					setIsTagGenerationModalOpen(false);
				}}
				url={buildTagGenerationIframeUrl(
					form.getFieldValue("tagName") || "",
					form.getFieldValue("aliTagCode"),
					mode === FORM_MODE.READONLY ? "readonly" : "edit",
				)}
				libraryType={tagLibraryType}
				title={
					form.getFieldValue("aliTagCode")
						? mode === FORM_MODE.READONLY
							? "查看复合规则"
							: "查看 | 编辑复合规则"
						: "新建复合规则"
				}
				onTagGenerationSubmitted={applyTagGenerationSubmittedResult}
			/>

			{/* 查看人才系统标签抽屉 */}
			{tagLibraryType === TAG_RULE_TYPE_DICT.TALENT && (
				<ViewTalentTagRuleDrawer
					open={isTagRuleDrawerOpen}
					onClose={() => {
						setIsTagRuleDrawerOpen(false);
						setTagRuleDrawerTagRuleId(undefined);
						setTagRuleDrawerJobPositionList([{ id: "0", type: "root" }]);
					}}
					tagRuleId={tagRuleDrawerTagRuleId}
					jobPositionList={tagRuleDrawerJobPositionList}
				/>
			)}

			{/* 查看组织系统标签抽屉 */}
			{tagLibraryType === TAG_RULE_TYPE_DICT.ORG && (
				<ViewOrgTagRuleDrawer
					open={isOrgTagRuleDrawerOpen}
					onClose={() => {
						setIsOrgTagRuleDrawerOpen(false);
						setOrgTagRuleDrawerTagRuleId(undefined);
					}}
					tagRuleId={orgTagRuleDrawerTagRuleId}
				/>
			)}
		</>
	);
}

interface TagFormDebugDrawerProps {
	open: boolean;
	onClose: () => void;
	payload: Record<string, unknown>;
}

/**
 * 开发环境调试抽屉：预览标签表单当前值、AI 多 tab 状态和提交聚合数据。
 *
 * @param props - 组件属性
 * @param props.open - 是否打开
 * @param props.onClose - 关闭回调
 * @param props.payload - 调试 JSON 数据
 * @returns 标签表单调试抽屉
 *
 * @author 王善能
 * @since 2026-06-17
 */
function TagFormDebugDrawer({ open, onClose, payload }: TagFormDebugDrawerProps) {
	const tabItems = [
		{
			key: "all",
			label: "全部数据",
			children: <TagFormDebugJsonPreview data={payload} />,
		},
		{
			key: "tabs",
			label: "AI Tabs",
			children: <TagFormDebugJsonPreview data={payload.aiTagTabs} />,
		},
		{
			key: "payloads",
			label: "提交 Payload",
			children: <TagFormDebugJsonPreview data={payload.submitPayloads} />,
		},
		{
			key: "validation",
			label: "校验结果",
			children: <TagFormDebugJsonPreview data={payload.validationResults} />,
		},
	];

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title="标签表单调试 JSON"
			placement="left"
			width={560}
			destroyOnClose
			footer={
				<div className="flex justify-end">
					<Button onClick={onClose}>关闭</Button>
				</div>
			}
		>
			<Tabs items={tabItems} />
		</Drawer>
	);
}

interface TagFormDrawerLoadErrorStateProps {
	description?: string;
	onRetry: () => void;
}

/**
 * 标签详情加载失败提示。
 *
 * 保持抽屉可见并提供重试入口，避免用户在详情缺失时继续编辑导致状态不一致。
 *
 * @param props - 组件属性
 * @param props.description - 失败提示文案
 * @param props.onRetry - 重新加载详情
 * @returns 详情加载失败态
 *
 * @author 王善能
 * @since 2026-06-24
 */
function TagFormDrawerLoadErrorState({
	description = "详情获取失败，请重新加载后再继续操作。",
	onRetry,
}: TagFormDrawerLoadErrorStateProps) {
	return (
		<Alert
			type="error"
			showIcon
			message="标签详情加载失败"
			description={description}
			action={
				<Button size="small" type="primary" onClick={onRetry}>
					重新加载
				</Button>
			}
		/>
	);
}

function TagFormDebugJsonPreview({ data }: { data: unknown }) {
	const jsonText = JSON.stringify(data, null, 2);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(jsonText);
			message.success("已复制调试 JSON");
		} catch {
			message.warning("复制失败，请手动选择复制");
		}
	};

	return (
		<div className="flex min-h-0 flex-col gap-3">
			<div className="flex justify-end">
				<Button size="small" onClick={() => void handleCopy()}>
					复制
				</Button>
			</div>
			<pre className="custom-scrollbar max-h-[calc(100vh-220px)] overflow-auto rounded border bg-[#fafafa] p-3 text-xs leading-5">
				{jsonText}
			</pre>
		</div>
	);
}
