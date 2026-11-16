/**
 * AI 多标签页签状态管理。
 *
 * 负责在批量智能标签场景下维护“页签真相源 <-> antd Form”的双向同步，
 * 避免不同 tab 之间的值、错误态和程序性切换状态互相污染。
 *
 * @author 王善能
 * @since 2026-07-06
 */

import type { FormInstance } from "antd";
import type { AiTagValidationContext } from "./ai-tag-form-schema";
import type { AiTagTabItem, AiTagTabState, TagCenterItem } from "./types";
import { useCallback, useState } from "react";
import { validateAllAiTagTabs } from "./ai-tag-form-schema";
import { normalizeTagDraftValues } from "./utils";

const FORM_ONLY_FIELDS = new Set(["aliTagCode", "aiSessionId"]);
const AI_TAG_FORM_FIELD_NAMES = [
	"aliTagCode",
	"aiSessionId",
	"tagName",
	"tagValue",
	"tagDescription",
	"businessCategory",
	"isRequired",
	"sensitivityLevel",
	"existenceCycle",
	"updateFrequency",
	"auditor",
	"maintainer",
	"maintainerName",
	"maintainerType",
	"isAuditTagging",
	"auditProcessTagging",
	"isAttProofTagging",
	"attProofReqsTagging",
	"isFtfInterview",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
	"tagPositionList",
	"useScope",
	"isDisplayInOrgBrain",
	"tagVisibility",
	"tagDistributionModule",
	"isExisting",
] as const;

type AiTagFormFieldName = (typeof AI_TAG_FORM_FIELD_NAMES)[number];

interface AiTagFormFieldState {
	name: AiTagFormFieldName;
	errors: string[];
	touched: boolean;
}

/**
 * 构建 AI 多标签切页时写回表单的完整字段快照。
 *
 * 目标 tab 没填写过的字段必须显式置空，否则 antd `setFieldsValue`
 * 只会做增量覆盖，导致上一个 tab 的值残留到当前 tab。
 *
 * @param tab - 当前激活的标签页签
 * @returns 完整表单快照
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function buildAiTagFormValuesForTab(tab?: AiTagTabState): TagCenterItem {
	const emptyValues = Object.fromEntries(
		AI_TAG_FORM_FIELD_NAMES.map((fieldName) => [fieldName, undefined]),
	) as TagCenterItem;

	if (!tab) {
		return emptyValues;
	}

	return {
		...emptyValues,
		...tab.values,
		isExisting: tab.isExisting,
	};
}

/**
 * 构建 AI 多标签切页时的字段校验状态。
 *
 * 自动切换到首个报错 tab 时，需要把当前 tab 的所有错误字段都标记为 touched，
 * 这样 DatePicker、Select 等组件也会稳定展示错误文案，而不是只剩红框。
 *
 * @param tab - 当前激活的标签页签
 * @returns 可直接用于 form.setFields 的字段状态列表
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function buildAiTagFormFieldStatesForTab(tab?: AiTagTabState): AiTagFormFieldState[] {
	const nextErrors = new Map(Object.entries(tab?.errors || {}));

	return AI_TAG_FORM_FIELD_NAMES.map((name) => {
		const errors = nextErrors.get(name) || [];
		return {
			name,
			errors,
			touched: errors.length > 0,
		};
	});
}

function toTabState(item: AiTagTabItem): AiTagTabState {
	const { tempId, tagId, existingTagId, isExisting, ...values } = item;
	return {
		tempId,
		tagId,
		existingTagId,
		isExisting: Boolean(isExisting),
		values: normalizeTagDraftValues({
			...values,
			isExisting: Boolean(isExisting),
		}),
		errors: {},
		dirty: false,
	};
}

function pickEditableValues(values: Record<string, unknown>): TagCenterItem {
	const editableValues = Object.entries(values).reduce<TagCenterItem>((result, [key, value]) => {
		if (!FORM_ONLY_FIELDS.has(key)) {
			result[key] = value;
		}
		return result;
	}, {});
	return normalizeTagDraftValues(editableValues);
}

function writeTabValuesToForm(form: FormInstance, tab?: AiTagTabState) {
	form.setFieldsValue(buildAiTagFormValuesForTab(tab));
	form.setFields(buildAiTagFormFieldStatesForTab(tab));
}

export function useAiTagTabsForm(form: FormInstance) {
	const [tabs, setTabs] = useState<AiTagTabState[]>([]);
	const [activeTabKey, setActiveTabKey] = useState("");

	const initializeTabs = useCallback(
		(items: AiTagTabItem[]) => {
			const nextTabs = items.map(toTabState);
			setTabs(nextTabs);
			setActiveTabKey(nextTabs[0]?.tempId || "");
			writeTabValuesToForm(form, nextTabs[0]);
		},
		[form],
	);

	const resetTabs = useCallback(() => {
		setTabs((prevTabs) => (prevTabs.length > 0 ? [] : prevTabs));
		setActiveTabKey((prevActiveTabKey) => (prevActiveTabKey ? "" : prevActiveTabKey));
	}, []);

	const syncActiveTabValues = useCallback(() => {
		if (!activeTabKey) {
			return tabs;
		}

		const editableValues = pickEditableValues(form.getFieldsValue());
		const nextTabs = tabs.map((tab) =>
			tab.tempId === activeTabKey
				? {
						...tab,
						values: {
							...tab.values,
							...editableValues,
							isExisting: tab.isExisting,
						},
						dirty: true,
					}
				: tab,
		);
		setTabs(nextTabs);
		return nextTabs;
	}, [activeTabKey, form, tabs]);

	const switchTab = useCallback(
		(nextActiveKey: string) => {
			const nextTabs = syncActiveTabValues();
			setActiveTabKey(nextActiveKey);
			writeTabValuesToForm(
				form,
				nextTabs.find((tab) => tab.tempId === nextActiveKey),
			);
		},
		[form, syncActiveTabValues],
	);

	const removeTab = useCallback(
		(targetKey: string) => {
			const nextTabs = tabs.filter((tab) => tab.tempId !== targetKey);
			setTabs(nextTabs);

			if (activeTabKey === targetKey) {
				const nextActiveTab = nextTabs[0];
				setActiveTabKey(nextActiveTab?.tempId || "");
				writeTabValuesToForm(form, nextActiveTab);
			} else if (nextTabs.length === 1) {
				writeTabValuesToForm(form, nextTabs[0]);
			}

			if (nextTabs.length === 0) {
				writeTabValuesToForm(form);
			}

			return nextTabs;
		},
		[activeTabKey, form, tabs],
	);

	const validateAllTabs = useCallback(
		(context: AiTagValidationContext) => {
			const latestTabs = syncActiveTabValues();
			const validation = validateAllAiTagTabs(latestTabs, context);
			const nextTabs = latestTabs.map((tab) => {
				const result = validation.results.find((item) => item.tempId === tab.tempId);
				return {
					...tab,
					errors: result?.errors || {},
				};
			});
			setTabs(nextTabs);
			return {
				tabs: nextTabs,
				results: validation.results,
				firstInvalid:
					validation.firstInvalidTabId && validation.firstError
						? {
								tempId: validation.firstInvalidTabId,
								firstError: validation.firstError,
							}
						: undefined,
			};
		},
		[syncActiveTabValues],
	);

	const activateTab = useCallback(
		(tempId: string, sourceTabs?: AiTagTabState[]) => {
			setActiveTabKey(tempId);
			writeTabValuesToForm(
				form,
				(sourceTabs || tabs).find((tab) => tab.tempId === tempId),
			);
		},
		[form, tabs],
	);

	const replaceTabs = useCallback((nextTabs: AiTagTabState[]) => {
		setTabs(nextTabs);
	}, []);

	const handleFormValuesChange = useCallback(
		(changedValues: Record<string, unknown>) => {
			const fieldNames = Object.keys(changedValues);
			if (!activeTabKey || fieldNames.length === 0) {
				return;
			}

			const editableChangedValues = pickEditableValues(changedValues);
			setTabs((prevTabs) =>
				prevTabs.map((tab) => {
					if (tab.tempId !== activeTabKey) {
						return tab;
					}

					const nextErrors = { ...tab.errors };
					fieldNames.forEach((fieldName) => {
						delete nextErrors[fieldName];
					});

					return {
						...tab,
						values: {
							...tab.values,
							...editableChangedValues,
							isExisting: tab.isExisting,
						},
						errors: nextErrors,
						dirty: true,
					};
				}),
			);

			form.setFields(
				fieldNames.map((fieldName) => ({
					name: fieldName,
					errors: [],
				})),
			);
		},
		[activeTabKey, form],
	);

	return {
		tabs,
		activeTabKey,
		initializeTabs,
		resetTabs,
		syncActiveTabValues,
		switchTab,
		removeTab,
		validateAllTabs,
		activateTab,
		replaceTabs,
		handleFormValuesChange,
	};
}
