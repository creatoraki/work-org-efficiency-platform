/**
 * 标签抽屉交互决策工具。
 *
 * 把标签类型切换、规则来源切换、关闭抽屉时的业务判断抽离成纯函数，
 * 方便单测覆盖，也避免页面组件里散落重复的条件分支。
 *
 * @author 王善能
 * @since 2026-07-06
 */

import type { TAG_TYPE } from "../../config";
import type { FORM_MODE } from "./constants";
import { TAG_TYPE as TagTypeEnum } from "../../config";
import { RULE_SOURCE_VALUES } from "./constants";

const TAG_TYPE_SWITCH_FIELD_NAMES = [
	"tagName",
	"tagValue",
	"tagDescription",
	"businessCategory",
	"sensitivityLevel",
	"existenceCycle",
	"maintainer",
	"maintainerName",
	"tagRulesId",
	"useScope",
	"auditProcessTagging",
	"attProofReqsTagging",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
] as const;

const RULE_SOURCE_SWITCH_FIELD_NAMES = [
	"tagRulesId",
	"tagName",
	"tagValue",
	"tagDescription",
	"businessCategory",
	"sensitivityLevel",
] as const;

type InteractionFormValues = Record<string, unknown>;

/**
 * 判断字段集中是否存在已填写内容。
 *
 * @param values - 当前表单值快照
 * @param fieldNames - 需要检查的字段名列表
 * @returns 是否存在有效内容
 *
 * @author 王善能
 * @since 2026-07-06
 */
function hasAnyFilledField(values: InteractionFormValues, fieldNames: readonly string[]): boolean {
	return fieldNames.some((fieldName) => {
		const fieldValue = values[fieldName];
		if (Array.isArray(fieldValue)) {
			return fieldValue.length > 0;
		}
		return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
	});
}

interface TagTypeSwitchDecisionParams {
	mode: FORM_MODE;
	currentTagType?: TAG_TYPE | "";
	nextTagType?: TAG_TYPE | "";
	currentRuleSelectionType?: string;
	values: InteractionFormValues;
	aliTagCode?: string;
	hasAiTagTaskResult: boolean;
}

interface TagTypeSwitchDecisionResult {
	shouldIgnore: boolean;
	shouldConfirm: boolean;
	shouldDeleteRuleMeta: boolean;
	shouldDeleteSmartTagResult: boolean;
}

/**
 * 计算标签类型切换时的交互决策。
 *
 * @param params - 切换上下文
 * @returns 是否忽略、是否确认，以及需清理的中间产物类型
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function getTagTypeSwitchDecision(
	params: TagTypeSwitchDecisionParams,
): TagTypeSwitchDecisionResult {
	const shouldIgnore = !params.nextTagType || params.nextTagType === params.currentTagType;
	const shouldDeleteRuleMeta =
		params.mode === "add" &&
		params.currentTagType === TagTypeEnum.SYSTEM &&
		params.currentRuleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE &&
		Boolean(params.aliTagCode);
	const hasMeaningfulContent = hasAnyFilledField(params.values, TAG_TYPE_SWITCH_FIELD_NAMES);

	return {
		shouldIgnore,
		shouldConfirm:
			!shouldIgnore &&
			(hasMeaningfulContent || shouldDeleteRuleMeta || params.hasAiTagTaskResult),
		shouldDeleteRuleMeta: !shouldIgnore && shouldDeleteRuleMeta,
		shouldDeleteSmartTagResult: !shouldIgnore && params.hasAiTagTaskResult,
	};
}

interface RuleSourceSwitchDecisionParams {
	currentRuleSelectionType?: string;
	nextRuleSelectionType?: string;
	values: InteractionFormValues;
	aliTagCode?: string;
}

interface RuleSourceSwitchDecisionResult {
	shouldIgnore: boolean;
	shouldConfirm: boolean;
	shouldDeleteRuleMeta: boolean;
}

/**
 * 计算系统标签规则来源切换时的交互决策。
 *
 * @param params - 切换上下文
 * @returns 是否忽略、是否确认，以及是否需要删除复合规则中间产物
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function getRuleSourceSwitchDecision(
	params: RuleSourceSwitchDecisionParams,
): RuleSourceSwitchDecisionResult {
	const currentRuleSelectionType =
		params.currentRuleSelectionType || RULE_SOURCE_VALUES.FROM_LIBRARY;
	const shouldIgnore =
		!params.nextRuleSelectionType || params.nextRuleSelectionType === currentRuleSelectionType;
	const hasRuleDerivedContent = hasAnyFilledField(params.values, RULE_SOURCE_SWITCH_FIELD_NAMES);
	const shouldDeleteRuleMeta =
		currentRuleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE && Boolean(params.aliTagCode);

	return {
		shouldIgnore,
		shouldConfirm:
			!shouldIgnore &&
			(params.nextRuleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE ||
				hasRuleDerivedContent ||
				shouldDeleteRuleMeta),
		shouldDeleteRuleMeta: !shouldIgnore && shouldDeleteRuleMeta,
	};
}

interface DrawerCloseCleanupDecisionParams {
	mode: FORM_MODE;
	currentTagType?: TAG_TYPE | "";
	currentRuleSelectionType?: string;
	aliTagCode?: string;
	hasAiTagTaskResult: boolean;
}

interface DrawerCloseCleanupDecisionResult {
	shouldDeleteRuleMeta: boolean;
	shouldDeleteSmartTagResult: boolean;
}

/**
 * 计算关闭抽屉时需要清理的中间产物。
 *
 * @param params - 关闭上下文
 * @returns 智能标签与复合规则的清理决策
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function getDrawerCloseCleanupDecision(
	params: DrawerCloseCleanupDecisionParams,
): DrawerCloseCleanupDecisionResult {
	if (params.mode !== "add") {
		return {
			shouldDeleteRuleMeta: false,
			shouldDeleteSmartTagResult: false,
		};
	}

	return {
		shouldDeleteRuleMeta:
			params.currentTagType === TagTypeEnum.SYSTEM &&
			params.currentRuleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE &&
			Boolean(params.aliTagCode),
		shouldDeleteSmartTagResult:
			params.currentTagType === TagTypeEnum.INTELLIGENT && params.hasAiTagTaskResult,
	};
}
