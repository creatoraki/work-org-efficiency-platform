/**
 * 标签表单抽屉 - 自定义 Hooks
 */

import type { FormInstance } from "antd";
import type { MaintainerRoleOption, TagCenterItem } from "./types";
import { checkDuplicateName } from "#src/api/tag-management/tag-center";
import { Form } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { DEFAULT_FTF_INTERVIEWER_DICT_CODE, TAG_RULE_TYPE_DICT, TAG_TYPE } from "../../config";
import { FORM_MODE, RULE_SOURCE_VALUES } from "./constants";
import { normalizeTagType } from "./utils";

const FTF_INTERVIEWER_DICT_CODES = new Set([205, 206]);
const DEFAULT_DUPLICATE_NAME_ERROR_MESSAGE = "标签名称已存在，请使用其他名称";

export const INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE =
	"智能标签中文名与已有标签重复，请点击标签右侧删除按钮处理，当前暂不支持改名";

export const INTELLIGENT_SINGLE_TAG_DUPLICATE_NAME_ERROR_MESSAGE =
	"智能标签中文名与已有标签重复，当前不支持改名，请重新向 AI 描述标签。";

interface TagNameDuplicateValidationParams {
	currentTagDetail?: Partial<TagCenterItem>;
	tagLibraryType: TAG_RULE_TYPE_DICT;
	tagName?: string;
	tagType?: string;
	isExisting?: boolean;
}

interface IntelligentTagDuplicateValidationItem {
	tempId: string;
	values: TagCenterItem;
	isExisting?: boolean;
}

export interface IntelligentTagDuplicateValidationResult {
	tempId: string;
	valid: boolean;
	errors: Record<string, string[]>;
}

export interface IntelligentTagDuplicateValidationSummary {
	results: IntelligentTagDuplicateValidationResult[];
	firstInvalid?: {
		tempId: string;
		field: "tagName";
		message: string;
	};
}

/**
 * 判断当前标签是否应跳过中文名重名校验。
 *
 * 当前规则下，tagName 是否参与重名校验只取决于 `isExisting`：
 * - `isExisting = true`：跳过校验
 * - `isExisting = false`：参与校验
 *
 * @param params - 校验上下文
 * @param params.isExisting - 是否为 AI 返回的已存在标签
 * @returns 是否跳过中文名重名校验
 *
 * @author 王善能
 * @since 2026-06-24
 */
export function shouldSkipTagNameDuplicateCheck(params: {
	tagType?: string;
	isExisting?: boolean;
}): boolean {
	return Boolean(params.isExisting);
}

function getDuplicateNameErrorMessage(params: { tagType?: string; isBatchTask?: boolean }): string {
	if (params.tagType === TAG_TYPE.INTELLIGENT) {
		return getIntelligentTagDuplicateValidationMessage({
			isBatchTask: Boolean(params.isBatchTask),
		});
	}

	return DEFAULT_DUPLICATE_NAME_ERROR_MESSAGE;
}

export function getIntelligentTagDuplicateValidationMessage(params: {
	isBatchTask: boolean;
}): string {
	return params.isBatchTask
		? INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE
		: INTELLIGENT_SINGLE_TAG_DUPLICATE_NAME_ERROR_MESSAGE;
}

/**
 * 远程校验标签中文名是否与标签中心重名。
 *
 * 智能标签场景下，若当前 tab 已被 AI 标记为“已存在”，则直接跳过；
 * 否则命中重名时统一返回“只能删除 tab item”的业务提示。
 *
 * @param params - 校验参数
 * @param params.currentTagDetail - 当前标签详情，用于编辑态排除自身 id
 * @param params.tagLibraryType - 标签库类型
 * @param params.tagName - 当前待校验中文标签名
 * @param params.tagType - 当前标签类型
 * @param params.isExisting - 当前标签是否为已存在标签
 * @returns 命中重名时返回错误文案，否则返回 undefined
 *
 * @author 王善能
 * @since 2026-06-24
 */
export async function getTagNameDuplicateValidationMessage(
	params: TagNameDuplicateValidationParams,
): Promise<string | undefined> {
	const { currentTagDetail, tagLibraryType, tagName, tagType, isExisting } = params;
	const trimmedTagName = tagName?.trim();
	if (!trimmedTagName) {
		return undefined;
	}

	if (shouldSkipTagNameDuplicateCheck({ tagType, isExisting })) {
		return undefined;
	}

	try {
		const isDuplicate = await checkDuplicateName({
			id: currentTagDetail?.id,
			name: trimmedTagName,
			type: tagLibraryType,
		});
		if (isDuplicate === true) {
			return getDuplicateNameErrorMessage({
				tagType,
				isBatchTask: true,
			});
		}
	} catch (error) {
		// 网络错误时跳过验证，避免影响用户继续补充其他字段。
		console.error("重名校验失败:", error);
	}

	return undefined;
}

/**
 * 批量校验 AI 多标签任务中的中文名重名问题。
 *
 * 该校验只针对智能标签场景，且逐个 tab 判断是否为已存在标签，
 * 避免把整个任务“一刀切”地全部跳过或全部拦截。
 *
 * @param items - 待校验的 AI 标签页签
 * @param tagLibraryType - 标签库类型
 * @returns 批量重名校验结果
 *
 * @author 王善能
 * @since 2026-06-24
 */
export async function validateIntelligentTagDuplicateNames(
	items: IntelligentTagDuplicateValidationItem[],
	tagLibraryType: TAG_RULE_TYPE_DICT,
): Promise<IntelligentTagDuplicateValidationSummary> {
	const results = await Promise.all(
		items.map(async (item) => {
			const message = await getTagNameDuplicateValidationMessage({
				tagLibraryType,
				tagName: item.values.tagName,
				tagType: item.values.tagType,
				isExisting: item.isExisting,
			});
			const errors: Record<string, string[]> = message ? { tagName: [message] } : {};
			return {
				tempId: item.tempId,
				valid: !message,
				errors,
			};
		}),
	);

	const firstInvalid = results.find((result) => !result.valid);
	return {
		results,
		firstInvalid: firstInvalid
			? {
					tempId: firstInvalid.tempId,
					field: "tagName",
					message:
						firstInvalid.errors.tagName?.[0] ||
						INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE,
				}
			: undefined,
	};
}

/**
 * 维护人角色工具函数 Hook
 *
 * 提供维护人角色相关的工具函数，包括默认面谈人值、角色标签与值的转换等
 *
 * @param maintainerRoleOptions - 维护人角色选项数组
 * @param getMaintainerRoleLabel - 根据值获取标签的函数
 * @param getMaintainerRoleValue - 根据标签获取值的函数
 * @returns 工具函数集合，包含：
 *   - defaultFtfInterviewerValue: 默认面谈人值（字典编码匹配 DEFAULT_FTF_INTERVIEWER_DICT_CODE）
 *   - getRoleLabelByValue: 根据角色值获取标签的函数
 *   - getRoleValueByLabel: 根据角色标签获取值的函数
 *   - approverRoleOptions: 审批人角色选项（过滤掉"员工自我维护"）
 *   - interviewerRoleOptions: 面谈人角色选项（仅保留指定两个角色）
 */
export function useMaintainerRoleUtils(
	maintainerRoleOptions: MaintainerRoleOption[],
	getMaintainerRoleLabel: (value: string) => string | undefined,
	getMaintainerRoleValue: (label: string) => string | undefined,
) {
	/**
	 * 默认面谈人值
	 *
	 * 从维护人角色选项中查找字典编码为 DEFAULT_FTF_INTERVIEWER_DICT_CODE 的角色值
	 */
	const defaultFtfInterviewerValue = useMemo(() => {
		const target = maintainerRoleOptions.find((option) => {
			const dictCode =
				typeof option.dictCode === "number" ? option.dictCode : Number(option.dictCode);
			return dictCode === DEFAULT_FTF_INTERVIEWER_DICT_CODE;
		});
		return target?.value as string | undefined;
	}, [maintainerRoleOptions]);

	/**
	 * 根据角色值获取角色标签
	 *
	 * @param value - 角色值（可选）
	 * @returns 角色标签，如果值为空或未找到则返回 undefined
	 */
	const getRoleLabelByValue = useCallback(
		(value?: string | null) => {
			if (value === undefined || value === null || value === "") {
				return undefined;
			}
			return (
				getMaintainerRoleLabel(String(value)) ||
				maintainerRoleOptions.find((opt) => opt.value === value)?.label
			);
		},
		[getMaintainerRoleLabel, maintainerRoleOptions],
	);

	/**
	 * 根据角色标签获取角色值
	 *
	 * @param label - 角色标签（可选）
	 * @returns 角色值，如果标签为空或未找到则返回 undefined
	 */
	const getRoleValueByLabel = useCallback(
		(label?: string | null) => {
			if (!label) {
				return undefined;
			}
			return (
				getMaintainerRoleValue(label) ||
				maintainerRoleOptions.find((opt) => opt.label === label)?.value
			);
		},
		[getMaintainerRoleValue, maintainerRoleOptions],
	);

	/**
	 * 审批人角色选项
	 *
	 * 过滤掉"员工自我维护"（value 为 "1"）后的维护人角色选项
	 */
	const approverRoleOptions = useMemo(() => {
		return maintainerRoleOptions.filter((option) => option.value !== "1");
	}, [maintainerRoleOptions]);

	const interviewerRoleOptions = useMemo(() => {
		return maintainerRoleOptions.filter((option) => {
			const dictCode =
				typeof option.dictCode === "number" ? option.dictCode : Number(option.dictCode);
			return FTF_INTERVIEWER_DICT_CODES.has(dictCode);
		});
	}, [maintainerRoleOptions]);

	return {
		defaultFtfInterviewerValue,
		getRoleLabelByValue,
		getRoleValueByLabel,
		approverRoleOptions,
		interviewerRoleOptions,
	};
}

/**
 * 标签名称验证器 Hook
 *
 * 纯 async 远程重名校验，防抖由 Form.Item 的 validateDebounce 承担；
 * 触发时机由 rules.validateTrigger 控制（编辑 onBlur，新增 onBlur + onSubmit）。
 *
 * @param currentTagDetail - 当前标签详情（编辑模式下传入 id 以排除自身）
 * @param tagLibraryType - 标签库类型
 * @returns Ant Design 表单验证器函数
 */
export function useTagNameValidator(
	form: FormInstance,
	currentTagDetail: Partial<TagCenterItem> | undefined,
	tagLibraryType: TAG_RULE_TYPE_DICT,
	isBatchTask = false,
) {
	return useCallback(
		async (_rule: unknown, value: string) => {
			const errorMessage = await getTagNameDuplicateValidationMessage({
				currentTagDetail,
				tagLibraryType,
				tagName: value,
				tagType: form.getFieldValue("tagType"),
				isExisting: Boolean(form.getFieldValue("isExisting")),
			});
			if (errorMessage) {
				if (
					form.getFieldValue("tagType") === TAG_TYPE.INTELLIGENT &&
					!isBatchTask &&
					errorMessage === INTELLIGENT_TAG_DUPLICATE_NAME_ERROR_MESSAGE
				) {
					throw new Error(INTELLIGENT_SINGLE_TAG_DUPLICATE_NAME_ERROR_MESSAGE);
				}
				throw new Error(errorMessage);
			}
		},
		[form, currentTagDetail?.id, isBatchTask, tagLibraryType],
	);
}

/**
 * 同步面谈更新频次与更新频次（手动调用版本）
 *
 * 当更新频次变化时，如果面谈机制开启，手动调用此函数同步面谈更新频次
 * 仅在人才标签类型下生效
 *
 * @param form - 表单实例
 * @param tagLibraryType - 标签库类型
 * @returns 同步函数，调用时将 updateFrequency 同步到 ftfInterviewUpdFreq
 */
export function useSyncFtfInterviewUpdFreq(form: FormInstance, tagLibraryType: TAG_RULE_TYPE_DICT) {
	return useCallback(() => {
		if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
			return;
		}
		const updateFrequency = form.getFieldValue("updateFrequency");
		const isFtfInterview = form.getFieldValue("isFtfInterview");
		if (isFtfInterview === "1" && updateFrequency) {
			form.setFieldValue("ftfInterviewUpdFreq", updateFrequency);
		}
	}, [form, tagLibraryType]);
}

/**
 * 自动同步面谈更新频次 Effect Hook
 *
 * 监听表单的 updateFrequency 字段变化，当面谈机制开启时，自动将更新频次同步到面谈更新频次字段
 * 仅在人才标签类型、抽屉打开、面谈开启时生效
 *
 * @param form - 表单实例
 * @param tagLibraryType - 标签库类型
 * @param open - 抽屉是否打开，仅在打开状态下生效
 */
export function useSyncFtfInterviewUpdFreqEffect(
	form: FormInstance,
	tagLibraryType: TAG_RULE_TYPE_DICT,
	open: boolean,
) {
	const updateFrequency = Form.useWatch("updateFrequency", form);
	const isFtfInterview = Form.useWatch("isFtfInterview", form);

	useEffect(() => {
		// 仅在抽屉打开、人才标签、面谈开启时同步
		if (!open || tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT || isFtfInterview !== "1") {
			return;
		}

		if (!updateFrequency) {
			return;
		}

		const currentFtfInterviewUpdFreq = form.getFieldValue("ftfInterviewUpdFreq");
		if (updateFrequency !== currentFtfInterviewUpdFreq) {
			form.setFieldValue("ftfInterviewUpdFreq", updateFrequency);
		}
	}, [open, tagLibraryType, isFtfInterview, updateFrequency, form]);
}

/**
 * 人员范围联动处理 Effect Hook（仅新增模式）。
 *
 * 监听标签类型和规则选取类型变化，自动设置或清空人员范围字段（useScope）。
 * 仅在新增模式下生效，编辑/只读模式保留后端返回的人员范围，不做联动处理。
 * 按 tagType 分支处理，通过 normalizeTagType 兼容表单值的类型差异。
 *
 * 联动规则：
 * - 智能标签或系统标签+自定义规则：清空 useScope（使用规则命中的人员范围）
 * - 系统标签+从规则库选取 或 手工标签：默认选择全部人员（["0"]）
 *
 * @param form - 表单实例
 * @param tagLibraryType - 标签库类型
 * @param mode - 表单模式
 * @param open - 抽屉是否打开，仅在打开状态下生效
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function useUseScopeLinkageEffect(
	form: FormInstance,
	tagLibraryType: TAG_RULE_TYPE_DICT,
	mode: FORM_MODE,
	open: boolean,
) {
	const tagType = Form.useWatch("tagType", form);
	const ruleSelectionType = Form.useWatch("ruleSelectionType", form);

	useEffect(() => {
		// 仅在抽屉打开、人才标签时处理
		if (!open || tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
			return;
		}

		// 编辑/只读模式：保留后端返回的人员范围，不做联动处理
		if (mode === FORM_MODE.EDIT || mode === FORM_MODE.READONLY) {
			return;
		}

		// 以下为新增模式的联动逻辑
		const isFromLibrary = ruleSelectionType === RULE_SOURCE_VALUES.FROM_LIBRARY;
		const isCustomRule = ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;

		switch (normalizeTagType(tagType)) {
			case TAG_TYPE.INTELLIGENT:
				// 智能标签：使用规则命中的人员范围
				form.setFieldValue("useScope", undefined);
				break;
			case TAG_TYPE.SYSTEM:
				if (isCustomRule) {
					form.setFieldValue("useScope", undefined);
				} else if (isFromLibrary) {
					const currentUseScope = form.getFieldValue("useScope");
					if (!currentUseScope?.length) {
						form.setFieldValue("useScope", ["0"]);
					}
				}
				break;
			case TAG_TYPE.MANUAL:
				// 手工标签：默认选择全部人员
				{
					const currentUseScope = form.getFieldValue("useScope");
					if (!currentUseScope?.length) {
						form.setFieldValue("useScope", ["0"]);
					}
				}
				break;
			default:
				break;
		}
	}, [open, tagType, ruleSelectionType, form, tagLibraryType, mode]);
}
