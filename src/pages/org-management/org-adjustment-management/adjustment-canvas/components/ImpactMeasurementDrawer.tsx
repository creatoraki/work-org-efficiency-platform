import type {
	GetComparisonOrgCalculationOfInfluenceScopeListItem,
	InfluenceScopeBasicInfo,
	InfluenceScopeKpiValueItem,
	InfluenceScopeValueObject,
	InfluenceScopeWrappedValueObject,
	OrgAdjustmentTaskOrgItem,
	PageForTargetPlanItem,
	TargetPlanPageItem,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { ColumnsType } from "antd/es/table";
import {
	fetchTargetPlanPage,
	getComparisonOrgCalculationOfInfluenceScopeList,
	pageForTargetPlan,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import blankImage from "#src/assets/small-icons/org-management/blank.png";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { CloseOutlined, DownOutlined, InfoCircleFilled } from "@ant-design/icons";
import { App, Button, Drawer, Input, Modal, Select, Space, Spin, Table, Tag } from "antd";
import React, { useEffect, useMemo, useState } from "react";

interface ImpactMeasurementDrawerProps {
	open: boolean;
	onClose: () => void;
	onSubmit?: (payload: ImpactMeasurementSubmitPayload) => void;
	taskId?: number | null;
	txtVer?: string;
	taskDetail?: {
		orgList?: OrgAdjustmentTaskOrgItem[];
	} | null;
}

export interface ImpactMeasurementSubmitPayload {
	selectedPlanId?: number;
	selectedPlanLabel?: string;
	selectedOrgList: OrgAdjustmentTaskOrgItem[];
	measurementResults: GetComparisonOrgCalculationOfInfluenceScopeListItem[];
}

interface PlanOption {
	label: string;
	value: number;
	plan: TargetPlanPageItem;
}

interface TargetPlanTableState {
	list: PageForTargetPlanItem[];
	total: number;
	pageNum: number;
	pageSize: number;
}

function getMeasurementOrgOptions(orgList: OrgAdjustmentTaskOrgItem[] | undefined) {
	return (orgList ?? [])
		.filter((item) => item.childrenModified)
		.map((item) => ({
			label: item.orgName,
			value: String(item.orgId),
			orgId: item.orgId,
			orgName: item.orgName,
		}));
}

function formatOrgPath(path: string | null | undefined) {
	return String(path ?? "")
		.replaceAll(",", ">")
		.trim();
}

function buildOrgDisplayPath(
	org: OrgAdjustmentTaskOrgItem,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
) {
	const visited = new Set<string>();
	const segments: string[] = [];
	let current: OrgAdjustmentTaskOrgItem | undefined = org;

	while (current && !visited.has(String(current.orgId))) {
		visited.add(String(current.orgId));
		if (current.orgName) {
			segments.unshift(current.orgName);
		}
		const currentParentOrgId: string = current.parentOrgId ? `${current.parentOrgId}` : "";
		current = currentParentOrgId ? orgMap.get(currentParentOrgId) : undefined;
	}

	return segments.join(">");
}

function getMeasurementDisplayPath(
	measurementResult: GetComparisonOrgCalculationOfInfluenceScopeListItem,
	matchedOrg: OrgAdjustmentTaskOrgItem | undefined,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
) {
	const backendPath = formatOrgPath(measurementResult.orgInfo.orgPath);
	if (backendPath && backendPath !== measurementResult.orgInfo.orgName) {
		return backendPath;
	}

	if (matchedOrg) {
		const localPath = buildOrgDisplayPath(matchedOrg, orgMap);
		if (localPath) {
			return localPath;
		}
	}

	return backendPath || measurementResult.orgInfo.orgName;
}

// function getChangeTypeLabel(org: OrgAdjustmentTaskOrgItem) {
// 	const beforeCount = org.compareMeta?.beforeChildIds?.length ?? 0;
// 	const afterCount = org.compareMeta?.afterChildIds?.length ?? 0;
// 	if (!beforeCount && afterCount) {
// 		return "新增子节点";
// 	}
// 	if (beforeCount && !afterCount) {
// 		return "移除子节点";
// 	}
// 	if (beforeCount !== afterCount) {
// 		return "子节点数量变化";
// 	}
// 	return "子节点结构变化";
// }

// function getDataTypeLabel(dataType: number) {
// 	return dataType === 1 ? "百分比" : "数值";
// }

// const DEFAULT_VALUE_CONFIG = {
// 	keyComparator: "",
// 	ignoreError: false,
// 	ignoreCase: false,
// 	dateFormat: "yyyy-MM-dd",
// 	ignoreNullValue: false,
// 	transientSupport: false,
// 	stripTrailingZeros: false,
// 	checkDuplicate: false,
// 	writeLongAsString: false,
// 	order: false,
// };

function getPagedListData<T>(
	response: { data?: { list?: T[]; total?: number } } | null | undefined,
) {
	return {
		list: Array.isArray(response?.data?.list) ? response.data.list : [],
		total: Number(response?.data?.total ?? 0),
	};
}

function buildPlanOption(plan: TargetPlanPageItem): PlanOption {
	return {
		label: `${plan.name}${plan.year ? ` (${plan.year})` : ""}`,
		value: plan.id,
		plan,
	};
}

function formatDisplayValue(value: unknown): string {
	if (value === null || value === undefined || value === "") {
		return "-";
	}
	if (typeof value === "number") {
		return Number.isFinite(value) ? `${value}` : "-";
	}
	if (typeof value === "boolean") {
		return value ? "是" : "否";
	}
	if (Array.isArray(value)) {
		return value.length ? value.map((item) => formatDisplayValue(item)).join("、") : "-";
	}
	if (typeof value === "object") {
		return JSON.stringify(value);
	}
	return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}

interface GroupMetricItem {
	label: string;
	value?: string;
	children?: Array<{
		label: string;
		value: string;
	}>;
}

interface GroupSectionItem {
	groupName: string;
	inline: boolean;
	metrics: GroupMetricItem[];
}

interface GroupMetricDefinition {
	label: string;
	childLabels?: string[];
}

interface GroupSectionDefinition {
	groupName: string;
	inline: boolean;
	metrics: GroupMetricDefinition[];
}

function isWrappedInfluenceScopeValueObject(
	value: InfluenceScopeValueObject,
): value is InfluenceScopeWrappedValueObject {
	return isPlainObject(value) && "raw" in value && "empty" in value && isPlainObject(value.raw);
}

function isInfluenceScopeKpiValueItem(value: unknown): value is InfluenceScopeKpiValueItem {
	return (
		isPlainObject(value) &&
		typeof value.kpisName === "string" &&
		(typeof value.kpisValue === "string" || "kpisAll" in value)
	);
}

function isInfluenceScopeKpiValueList(value: unknown): value is InfluenceScopeKpiValueItem[] {
	return Array.isArray(value) && value.every(isInfluenceScopeKpiValueItem);
}

function getInfluenceScopeRawValue(valueObject: InfluenceScopeValueObject) {
	if (!valueObject) {
		return null;
	}

	if (isWrappedInfluenceScopeValueObject(valueObject)) {
		if (valueObject.empty) {
			return null;
		}
		return valueObject.raw;
	}

	return isPlainObject(valueObject) ? valueObject : null;
}

function getGroupSectionItems(valueObject: InfluenceScopeValueObject): GroupSectionItem[] {
	const rawValue = getInfluenceScopeRawValue(valueObject);
	if (!rawValue) {
		return [];
	}

	return Object.entries(rawValue).map(([groupName, groupValue]) => {
		if (isInfluenceScopeKpiValueList(groupValue)) {
			// 新格式：包含 kpisAll/kpisCur/kpisCurExist/kpisAllExist/kpisUnitName
			const hasNewFormat = groupValue.some((item) => "kpisAll" in item);
			if (hasNewFormat) {
				return {
					groupName,
					inline: false,
					metrics: groupValue.map((item) => {
						const unitSuffix = item.kpisUnitName ? `(${item.kpisUnitName})` : "";
						const childItems: { label: string; value: string }[] = [];

						childItems.push({
							label: `当前层级${unitSuffix}`,
							value:
								item.kpisCurExist === false
									? "-"
									: formatDisplayValue(item.kpisCur),
						});
						childItems.push({
							label: `项目汇总${unitSuffix}`,
							value:
								item.kpisAllExist === false
									? "-"
									: formatDisplayValue(item.kpisAll),
						});

						return {
							label: item.kpisName || item.kpisKey || "",
							children: childItems,
						};
					}),
				};
			}

			// 旧格式：kpisValue
			return {
				groupName,
				inline: false,
				metrics: groupValue.map((item) => ({
					label: item.kpisName || item.kpisKey || "",
					value: formatDisplayValue(item.kpisValue),
				})),
			};
		}

		if (!isPlainObject(groupValue)) {
			return {
				groupName,
				inline: false,
				metrics: [{ label: groupName, value: formatDisplayValue(groupValue) }],
			};
		}

		const entries = Object.entries(groupValue);
		const firstMetricValue = entries[0]?.[1];
		const isInlineMetricGroup = entries.every(
			([label, value]) => ["当前层级", "项目汇总"].includes(label) && !isPlainObject(value),
		);
		const hasSingleHierarchicalMetric =
			entries.length === 1 &&
			isPlainObject(firstMetricValue) &&
			Object.entries(firstMetricValue).every(
				([childLabel, childValue]) =>
					["当前层级", "项目汇总"].includes(childLabel) && !isPlainObject(childValue),
			);

		return {
			groupName,
			inline: isInlineMetricGroup || hasSingleHierarchicalMetric,
			metrics: isInlineMetricGroup
				? [
						{
							label: groupName,
							children: entries.map(([label, value]) => ({
								label,
								value: formatDisplayValue(value),
							})),
						},
					]
				: hasSingleHierarchicalMetric
					? [
							{
								label: groupName,
								children: Object.entries(
									firstMetricValue as Record<string, unknown>,
								).map(([childLabel, childValue]) => ({
									label: childLabel,
									value: formatDisplayValue(childValue),
								})),
							},
						]
					: entries.map(([label, value]) => {
							if (isPlainObject(value)) {
								return {
									label,
									children: Object.entries(value).map(
										([childLabel, childValue]) => ({
											label: childLabel,
											value: formatDisplayValue(childValue),
										}),
									),
								};
							}

							return {
								label,
								value: formatDisplayValue(value),
							};
						}),
		};
	});
}

function getGroupedSectionDefinitions(valueObjects: InfluenceScopeValueObject[]) {
	const orderMap = new Map<string, GroupSectionDefinition>();

	valueObjects.forEach((valueObject) => {
		getGroupSectionItems(valueObject).forEach((groupItem) => {
			const currentGroup = orderMap.get(groupItem.groupName) ?? {
				groupName: groupItem.groupName,
				inline: groupItem.inline,
				metrics: [],
			};

			groupItem.metrics.forEach((metric) => {
				const existingMetric = currentGroup.metrics.find(
					(item) => item.label === metric.label,
				);
				if (!existingMetric) {
					currentGroup.metrics.push({
						label: metric.label,
						childLabels: metric.children?.map((item) => item.label),
					});
					return;
				}

				if (metric.children?.length) {
					const childLabels = existingMetric.childLabels ?? [];
					metric.children.forEach((child) => {
						if (!childLabels.includes(child.label)) {
							childLabels.push(child.label);
						}
					});
					existingMetric.childLabels = childLabels;
				}
			});

			orderMap.set(groupItem.groupName, currentGroup);
		});
	});

	return Array.from(orderMap.values());
}

function getMetricItem(
	valueObject: InfluenceScopeValueObject,
	groupName: string,
	metricLabel: string,
) {
	const groupItem = getGroupSectionItems(valueObject).find(
		(item) => item.groupName === groupName,
	);
	return groupItem?.metrics.find((item) => item.label === metricLabel);
}

function getMetricDisplayValue(
	valueObject: InfluenceScopeValueObject,
	groupName: string,
	metricLabel: string,
) {
	return getMetricItem(valueObject, groupName, metricLabel)?.value ?? "-";
}

function getMetricChildDisplayValue(
	valueObject: InfluenceScopeValueObject,
	groupName: string,
	metricLabel: string,
	childLabel: string,
) {
	const metricItem = getMetricItem(valueObject, groupName, metricLabel);
	return metricItem?.children?.find((item) => item.label === childLabel)?.value ?? "-";
}

function cloneUnknownValue<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => cloneUnknownValue(item)) as T;
	}

	if (isPlainObject(value)) {
		const clonedValue: Record<string, unknown> = {};
		Object.entries(value).forEach(([key, item]) => {
			clonedValue[key] = cloneUnknownValue(item);
		});
		return clonedValue as T;
	}

	return value;
}

function normalizeEditableMetricChildLabel(childLabel?: string) {
	if (!childLabel) {
		return undefined;
	}

	if (childLabel.startsWith("当前层级")) {
		return "当前层级";
	}

	if (childLabel.startsWith("项目汇总")) {
		return "项目汇总";
	}

	return childLabel;
}

function isFlatMetricChildMap(value: unknown): value is Record<string, unknown> {
	return (
		isPlainObject(value) &&
		Object.keys(value).length > 0 &&
		Object.entries(value).every(([key, item]) => {
			const normalizedKey = normalizeEditableMetricChildLabel(key);
			return ["当前层级", "项目汇总"].includes(normalizedKey ?? "") && !isPlainObject(item);
		})
	);
}

function buildInfluenceScopeValueObject(
	baseValueObject: InfluenceScopeValueObject,
	nextRawValue: Record<string, unknown>,
): InfluenceScopeValueObject {
	if (isWrappedInfluenceScopeValueObject(baseValueObject)) {
		return {
			...baseValueObject,
			raw: nextRawValue,
			empty: false,
		};
	}

	return nextRawValue;
}

function buildKpiMetricTemplateItem(
	metricLabel: string,
	childLabel?: string,
): InfluenceScopeKpiValueItem {
	const normalizedChildLabel = normalizeEditableMetricChildLabel(childLabel);
	if (normalizedChildLabel) {
		return {
			kpisName: metricLabel,
			kpisCur: "-",
			kpisAll: "-",
			kpisCurExist: true,
			kpisAllExist: true,
		};
	}

	return {
		kpisName: metricLabel,
		kpisValue: "-",
	};
}

function updateInfluenceScopeMetricValue(
	valueObject: InfluenceScopeValueObject,
	templateValueObject: InfluenceScopeValueObject,
	groupName: string,
	metricLabel: string,
	nextValue: string,
	childLabel?: string,
): InfluenceScopeValueObject {
	const currentRawValue = getInfluenceScopeRawValue(valueObject);
	const templateRawValue = getInfluenceScopeRawValue(templateValueObject);
	const nextRawValue = isPlainObject(currentRawValue) ? cloneUnknownValue(currentRawValue) : {};
	const currentGroupValue = isPlainObject(nextRawValue) ? nextRawValue[groupName] : undefined;
	const templateGroupValue = isPlainObject(templateRawValue)
		? templateRawValue[groupName]
		: undefined;
	const normalizedChildLabel = normalizeEditableMetricChildLabel(childLabel);

	if (Array.isArray(currentGroupValue) || Array.isArray(templateGroupValue)) {
		const sourceGroupValue = Array.isArray(currentGroupValue)
			? cloneUnknownValue(currentGroupValue)
			: Array.isArray(templateGroupValue)
				? cloneUnknownValue(templateGroupValue)
				: [];
		const nextGroupValue = sourceGroupValue.map((item) => {
			if (!isInfluenceScopeKpiValueItem(item)) {
				return item;
			}

			if ("kpisAll" in item || "kpisCur" in item) {
				return {
					...item,
					kpisCur: item.kpisCur ?? "-",
					kpisAll: item.kpisAll ?? "-",
					kpisCurExist: item.kpisCurExist ?? true,
					kpisAllExist: item.kpisAllExist ?? true,
				};
			}

			return {
				...item,
				kpisValue: item.kpisValue ?? "-",
			};
		});

		let targetItemIndex = nextGroupValue.findIndex(
			(item) =>
				isInfluenceScopeKpiValueItem(item) &&
				(item.kpisName === metricLabel || item.kpisKey === metricLabel),
		);
		if (targetItemIndex < 0) {
			nextGroupValue.push(buildKpiMetricTemplateItem(metricLabel, normalizedChildLabel));
			targetItemIndex = nextGroupValue.length - 1;
		}

		const targetItem = nextGroupValue[targetItemIndex];
		if (isInfluenceScopeKpiValueItem(targetItem)) {
			if (normalizedChildLabel === "当前层级") {
				targetItem.kpisCur = nextValue;
				targetItem.kpisCurExist = nextValue !== "-";
			} else if (normalizedChildLabel === "项目汇总") {
				targetItem.kpisAll = nextValue;
				targetItem.kpisAllExist = nextValue !== "-";
			} else {
				targetItem.kpisValue = nextValue;
			}
		}

		nextRawValue[groupName] = nextGroupValue;
		return buildInfluenceScopeValueObject(valueObject ?? templateValueObject, nextRawValue);
	}

	if (normalizedChildLabel) {
		const hasFlatMetricChildMap =
			isFlatMetricChildMap(currentGroupValue) || isFlatMetricChildMap(templateGroupValue);
		if (hasFlatMetricChildMap) {
			const nextGroupValue = isFlatMetricChildMap(currentGroupValue)
				? cloneUnknownValue(currentGroupValue)
				: isFlatMetricChildMap(templateGroupValue)
					? {}
					: {};
			nextGroupValue[normalizedChildLabel] = nextValue;
			nextRawValue[groupName] = nextGroupValue;
			return buildInfluenceScopeValueObject(valueObject ?? templateValueObject, nextRawValue);
		}

		const baseGroupValue = isPlainObject(currentGroupValue)
			? cloneUnknownValue(currentGroupValue)
			: isPlainObject(templateGroupValue)
				? {}
				: {};
		const metricKey =
			isPlainObject(baseGroupValue) && isFlatMetricChildMap(baseGroupValue[metricLabel])
				? metricLabel
				: (Object.keys(baseGroupValue).find((key) =>
						isFlatMetricChildMap(baseGroupValue[key]),
					) ??
					(isPlainObject(templateGroupValue)
						? Object.keys(templateGroupValue).find((key) =>
								isFlatMetricChildMap(templateGroupValue[key]),
							)
						: undefined) ??
					metricLabel);
		const nextMetricValue = isFlatMetricChildMap(baseGroupValue[metricKey])
			? cloneUnknownValue(baseGroupValue[metricKey])
			: {};

		nextMetricValue[normalizedChildLabel] = nextValue;
		baseGroupValue[metricKey] = nextMetricValue;
		nextRawValue[groupName] = baseGroupValue;
		return buildInfluenceScopeValueObject(valueObject ?? templateValueObject, nextRawValue);
	}

	if (isPlainObject(currentGroupValue) || isPlainObject(templateGroupValue)) {
		const nextGroupValue = isPlainObject(currentGroupValue)
			? cloneUnknownValue(currentGroupValue)
			: {};
		nextGroupValue[metricLabel] = nextValue;
		nextRawValue[groupName] = nextGroupValue;
		return buildInfluenceScopeValueObject(valueObject ?? templateValueObject, nextRawValue);
	}

	nextRawValue[groupName] = nextValue;
	return buildInfluenceScopeValueObject(valueObject ?? templateValueObject, nextRawValue);
}

const FIELD_TEXT_COMMON_STYLE: React.CSSProperties = {
	fontFamily: "PingFang SC, sans-serif",
	fontWeight: 400,
	fontStyle: "normal",
	letterSpacing: 0,
};

function renderAlignedFieldRow(label: string, value: React.ReactNode) {
	return (
		<div className="grid grid-cols-2 gap-3 text-sm leading-5">
			<span
				className="text-right"
				style={{ ...FIELD_TEXT_COMMON_STYLE, color: "rgba(96, 98, 102, 0.7)" }}
			>
				{label}
			</span>
			<div
				className="text-left"
				style={{ ...FIELD_TEXT_COMMON_STYLE, color: "rgba(0, 0, 0, 0.8)" }}
			>
				{value}
			</div>
		</div>
	);
}

function renderMetricTitleRow(label: string) {
	return (
		<div
			className="text-left text-sm leading-5"
			style={{ ...FIELD_TEXT_COMMON_STYLE, color: "rgba(50, 50, 51, 1)" }}
		>
			{label}
		</div>
	);
}

function renderEditableMetricValueInput(value: string, onChange: (nextValue: string) => void) {
	return (
		<div className="w-[10ch] max-w-full border-b border-[#D0D5DD] transition-colors focus-within:border-[#1677FF] hover:border-[#1677FF]">
			<Input
				variant="borderless"
				value={value}
				onFocus={(event) => event.target.select()}
				onChange={(event) => {
					const nextValue = event.target.value.replace(/\s+/g, "");
					if (!nextValue) {
						onChange("-");
						return;
					}

					if (
						nextValue === "-" ||
						/^\d+(?:\.\d*)?$/.test(nextValue) ||
						/^\.\d*$/.test(nextValue)
					) {
						onChange(nextValue);
					}
				}}
				className="h-6 rounded-none bg-transparent px-0 shadow-none"
				styles={{ input: { padding: 0, textAlign: "left", color: "rgba(0, 0, 0, 0.8)" } }}
			/>
		</div>
	);
}

interface RenderMergedMetricCellOptions {
	editable?: boolean;
	templateValueObject?: InfluenceScopeValueObject;
	onMetricValueChange?: (
		groupName: string,
		metricLabel: string,
		nextValue: string,
		childLabel?: string,
	) => void;
}

function renderMergedMetricCell(
	valueObject: InfluenceScopeValueObject,
	groupName: string,
	metrics: GroupMetricDefinition[],
	options?: RenderMergedMetricCellOptions,
) {
	return (
		<div className="space-y-1 text-left">
			{metrics.map((metric) => (
				<div key={`${groupName}-${metric.label}`} className="space-y-1">
					{metric.childLabels?.length ? (
						<>
							{renderMetricTitleRow(metric.label)}
							<div className="space-y-1">
								{metric.childLabels.map((childLabel) => {
									const canEditChildValue =
										options?.editable &&
										normalizeEditableMetricChildLabel(childLabel) !==
											"项目汇总";

									return (
										<div key={`${metric.label}-${childLabel}`}>
											{renderAlignedFieldRow(
												childLabel,
												canEditChildValue
													? renderEditableMetricValueInput(
															getMetricChildDisplayValue(
																valueObject,
																groupName,
																metric.label,
																childLabel,
															),
															(nextValue) =>
																options.onMetricValueChange?.(
																	groupName,
																	metric.label,
																	nextValue,
																	childLabel,
																),
														)
													: getMetricChildDisplayValue(
															valueObject,
															groupName,
															metric.label,
															childLabel,
														),
											)}
										</div>
									);
								})}
							</div>
						</>
					) : (
						renderAlignedFieldRow(
							metric.label,
							options?.editable
								? renderEditableMetricValueInput(
										getMetricDisplayValue(valueObject, groupName, metric.label),
										(nextValue) =>
											options.onMetricValueChange?.(
												groupName,
												metric.label,
												nextValue,
											),
									)
								: getMetricDisplayValue(valueObject, groupName, metric.label),
						)
					)}
				</div>
			))}
		</div>
	);
}

function renderBasicInfoContent(basicInfo: InfluenceScopeBasicInfo) {
	const items = [
		{ label: "在管项目", value: basicInfo.projectNum },
		{ label: "计划交付项目", value: basicInfo.planDeliveryProjectNum },
		{ label: "当拓当交项目", value: basicInfo.expandDeliveryProjectNum },
	];

	return (
		<div className="space-y-1">
			{items.map((item) => (
				<div key={item.label}>
					{renderAlignedFieldRow(item.label, formatDisplayValue(item.value))}
				</div>
			))}
		</div>
	);
}

function renderAdjustmentStageTag(type: "before" | "after") {
	const isBefore = type === "before";
	return (
		<Tag
			bordered={false}
			className="m-0 inline-flex items-center rounded px-2 py-[1px] text-xs font-medium leading-5"
			style={{
				color: isBefore ? "rgba(32, 119, 255, 1)" : "rgba(255, 125, 0, 1)",
				backgroundColor: isBefore ? "#DBEAFE" : "#FFEDD5",
			}}
		>
			{isBefore ? "调整前" : "调整后"}
		</Tag>
	);
}

const TARGET_PLAN_TABLE_COLUMNS: ColumnsType<PageForTargetPlanItem> = [
	{
		title: "指标名称",
		dataIndex: "name",
		key: "name",
		width: 200,
		ellipsis: true,
	},
	{
		title: "主责部门",
		dataIndex: "responsibleDepartment",
		key: "responsibleDepartment",
		width: 150,
		ellipsis: true,
	},
	{
		title: "数据类型",
		dataIndex: "dataType",
		key: "dataType",
		width: 120,
		render: (value) => (Number(value) === 1 ? "百分比" : "数值"),
	},
	{
		title: "单位",
		dataIndex: "unitName",
		key: "unitName",
		width: 90,
	},
	{
		title: "指标定义及口径",
		dataIndex: "definition",
		key: "definition",
		ellipsis: true,
	},
];

interface ImpactMeasurementComparisonTableProps {
	measurementResults: GetComparisonOrgCalculationOfInfluenceScopeListItem[];
	selectedOrgList: OrgAdjustmentTaskOrgItem[];
	allOrgList: OrgAdjustmentTaskOrgItem[];
	editableCurrentYearAfter?: boolean;
	onMeasurementResultsChange?: (
		results: GetComparisonOrgCalculationOfInfluenceScopeListItem[],
	) => void;
}

export const ImpactMeasurementComparisonTable: React.FC<ImpactMeasurementComparisonTableProps> = ({
	measurementResults,
	selectedOrgList,
	allOrgList,
	editableCurrentYearAfter = false,
	onMeasurementResultsChange,
}) => {
	const orgMap = useMemo(
		() => new Map(allOrgList.map((item) => [String(item.orgId), item])),
		[allOrgList],
	);
	const canEditCurrentYearAfter =
		editableCurrentYearAfter && typeof onMeasurementResultsChange === "function";
	const measurementDisplayItems = useMemo(() => {
		return measurementResults.map((result, index) => {
			const fallbackOrg = selectedOrgList[index];
			const sameNameOrgs = selectedOrgList.filter(
				(item) => item.orgName === result.orgInfo.orgName,
			);
			const matchedOrg =
				sameNameOrgs.length === 1
					? sameNameOrgs[0]
					: fallbackOrg?.orgName === result.orgInfo.orgName
						? fallbackOrg
						: undefined;

			const displayOrgPath = getMeasurementDisplayPath(result, matchedOrg, orgMap);

			return {
				result,
				displayOrgPath,
				displayKey: `${result.orgInfo.orgName}-${displayOrgPath || index}-${index}`,
			};
		});
	}, [measurementResults, orgMap, selectedOrgList]);
	const comparisonValueObjects = useMemo(() => {
		return measurementResults.flatMap((item) => [item.lastYearOldValue, item.lastYearNewValue]);
	}, [measurementResults]);
	const currentYearValueObjects = useMemo(() => {
		return measurementResults.flatMap((item) => [
			item.currentYearOldValue,
			item.currentYearNewValue,
		]);
	}, [measurementResults]);
	const lastYearGroupDefinitions = useMemo(
		() => getGroupedSectionDefinitions(comparisonValueObjects),
		[comparisonValueObjects],
	);
	const currentYearGroupDefinitions = useMemo(
		() => getGroupedSectionDefinitions(currentYearValueObjects),
		[currentYearValueObjects],
	);
	const hasCurrentYearGroups = currentYearGroupDefinitions.length > 0;

	const handleCurrentYearAfterValueChange = (
		resultIndex: number,
		groupName: string,
		metricLabel: string,
		nextValue: string,
		childLabel?: string,
	) => {
		if (!canEditCurrentYearAfter || !onMeasurementResultsChange) {
			return;
		}

		const nextResults = measurementResults.map((item, index) => {
			if (index !== resultIndex) {
				return item;
			}

			return {
				...item,
				currentYearNewValue: updateInfluenceScopeMetricValue(
					item.currentYearNewValue,
					item.currentYearOldValue,
					groupName,
					metricLabel,
					nextValue,
					childLabel,
				),
			};
		});

		onMeasurementResultsChange(nextResults);
	};

	const renderGroupedSectionRows = (
		sectionLabel: string,
		groupDefinitions: GroupSectionDefinition[],
		getValueObjects: (
			item: GetComparisonOrgCalculationOfInfluenceScopeListItem,
		) => [InfluenceScopeValueObject, InfluenceScopeValueObject],
	) => {
		const totalRowCount = groupDefinitions.reduce(
			(count, group) => count + (group.inline ? 1 : 2),
			0,
		);
		let isFirstRow = true;

		return groupDefinitions.map((group) => {
			const rows: React.ReactNode[] = [];

			if (group.inline) {
				rows.push(
					<tr key={`${sectionLabel}-${group.groupName}-inline`}>
						{isFirstRow ? (
							<td
								rowSpan={totalRowCount}
								className="sticky left-0 z-[1] border border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-4 align-middle font-medium text-[#303133]"
							>
								{sectionLabel}
							</td>
						) : null}
						{measurementDisplayItems.map(({ result, displayKey }, resultIndex) => {
							const [oldValueObject, newValueObject] = getValueObjects(result);
							return (
								<React.Fragment key={`${displayKey}-${group.groupName}-inline`}>
									<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
										{renderMergedMetricCell(
											oldValueObject,
											group.groupName,
											group.metrics,
										)}
									</td>
									<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
										{renderMergedMetricCell(
											newValueObject,
											group.groupName,
											group.metrics,
											sectionLabel === "当年度目标值"
												? {
														editable: canEditCurrentYearAfter,
														templateValueObject: oldValueObject,
														onMetricValueChange: (
															nextGroupName,
															metricLabel,
															nextValue,
															childLabel,
														) =>
															handleCurrentYearAfterValueChange(
																resultIndex,
																nextGroupName,
																metricLabel,
																nextValue,
																childLabel,
															),
													}
												: undefined,
										)}
									</td>
								</React.Fragment>
							);
						})}
					</tr>,
				);
				isFirstRow = false;
				return rows;
			}

			rows.push(
				<tr key={`${sectionLabel}-${group.groupName}-header`}>
					{isFirstRow ? (
						<td
							rowSpan={totalRowCount}
							className="sticky left-0 z-[1] border border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-4 align-middle font-medium text-[#303133]"
						>
							{sectionLabel}
						</td>
					) : null}
					<td
						colSpan={measurementResults.length * 2}
						className="border border-[#EBEEF5] bg-white px-4 py-2.5 text-left text-sm font-medium text-[#303133]"
					>
						{group.groupName}
					</td>
				</tr>,
			);

			isFirstRow = false;

			rows.push(
				<tr key={`${sectionLabel}-${group.groupName}-content`}>
					{measurementDisplayItems.map(({ result, displayKey }, resultIndex) => {
						const [oldValueObject, newValueObject] = getValueObjects(result);
						return (
							<React.Fragment key={`${displayKey}-${group.groupName}-content`}>
								<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
									{renderMergedMetricCell(
										oldValueObject,
										group.groupName,
										group.metrics,
									)}
								</td>
								<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
									{renderMergedMetricCell(
										newValueObject,
										group.groupName,
										group.metrics,
										sectionLabel === "当年度目标值"
											? {
													editable: canEditCurrentYearAfter,
													templateValueObject: oldValueObject,
													onMetricValueChange: (
														nextGroupName,
														metricLabel,
														nextValue,
														childLabel,
													) =>
														handleCurrentYearAfterValueChange(
															resultIndex,
															nextGroupName,
															metricLabel,
															nextValue,
															childLabel,
														),
												}
											: undefined,
									)}
								</td>
							</React.Fragment>
						);
					})}
				</tr>,
			);

			return rows;
		});
	};

	return (
		<table className="w-max min-w-full border-separate border-spacing-0 text-left text-sm text-[#606266]">
			<thead>
				<tr>
					<th
						rowSpan={2}
						className="sticky left-0 z-10 border border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-3 text-left font-medium text-[#303133]"
					>
						变动组织
					</th>
					{measurementDisplayItems.map(({ result, displayKey, displayOrgPath }) => (
						<th
							key={displayKey}
							colSpan={2}
							className="min-w-[260px] border border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-3 text-left font-medium text-[#303133]"
						>
							<div className="leading-6">{result.orgInfo.orgName}</div>
							<div className="mt-2 text-sm font-normal leading-6 text-[#909399]">
								{displayOrgPath.replaceAll("|", ">")}
							</div>
						</th>
					))}
				</tr>
				<tr>
					{measurementDisplayItems.map(({ displayKey }) => (
						<React.Fragment key={`${displayKey}-sub`}>
							<th className="border border-t-0 border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-2 text-left">
								{renderAdjustmentStageTag("before")}
							</th>
							<th className="border border-t-0 border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-2 text-left">
								{renderAdjustmentStageTag("after")}
							</th>
						</React.Fragment>
					))}
				</tr>
			</thead>
			<tbody>
				<tr>
					<td className="sticky left-0 z-[1] border border-[#EBEEF5] bg-[rgba(240,242,245,1)] px-4 py-4 align-middle font-medium text-[#303133]">
						基本信息
					</td>
					{measurementDisplayItems.map(({ result, displayKey }) => (
						<React.Fragment key={`${displayKey}-basic`}>
							<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
								{renderBasicInfoContent(result.oldBasicInfo)}
							</td>
							<td className="min-w-[130px] border border-[#EBEEF5] bg-white px-4 py-2 text-left align-top">
								{renderBasicInfoContent(result.newBasicInfo)}
							</td>
						</React.Fragment>
					))}
				</tr>
				{renderGroupedSectionRows("上年度实际值", lastYearGroupDefinitions, (item) => [
					item.lastYearOldValue,
					item.lastYearNewValue,
				])}
				{hasCurrentYearGroups
					? renderGroupedSectionRows(
							"当年度目标值",
							currentYearGroupDefinitions,
							(item) => [item.currentYearOldValue, item.currentYearNewValue],
						)
					: null}
			</tbody>
		</table>
	);
};

export const ImpactMeasurementDrawer: React.FC<ImpactMeasurementDrawerProps> = ({
	open,
	onClose,
	onSubmit,
	taskId,
	txtVer,
	taskDetail,
}) => {
	const { message } = App.useApp();
	const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
	const [selectedPlanId, setSelectedPlanId] = useState<number | undefined>();
	const [selectedPlanLabel, setSelectedPlanLabel] = useState<string | undefined>();
	const [targetValueModalOpen, setTargetValueModalOpen] = useState(false);
	const [planOptionsLoading, setPlanOptionsLoading] = useState(false);
	const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
	const [draftPlanId, setDraftPlanId] = useState<number | undefined>();
	const [targetPlanTableLoading, setTargetPlanTableLoading] = useState(false);
	const [targetPlanTableState, setTargetPlanTableState] = useState<TargetPlanTableState>({
		list: [],
		total: 0,
		pageNum: 1,
		pageSize: 10,
	});
	const [measurementLoading, setMeasurementLoading] = useState(false);
	const [measurementResults, setMeasurementResults] = useState<
		GetComparisonOrgCalculationOfInfluenceScopeListItem[]
	>([]);
	const [measured, setMeasured] = useState(false);

	const orgOptions = useMemo(
		() => getMeasurementOrgOptions(taskDetail?.orgList),
		[taskDetail?.orgList],
	);
	const selectedPlan = useMemo(
		() => planOptions.find((item) => item.value === selectedPlanId),
		[planOptions, selectedPlanId],
	);
	const draftPlan = useMemo(
		() => planOptions.find((item) => item.value === draftPlanId),
		[draftPlanId, planOptions],
	);
	const normalizedTxtVer = txtVer?.trim();
	const selectedOrgList = useMemo(() => {
		const selectedIdSet = new Set(selectedOrgIds);
		return (taskDetail?.orgList ?? []).filter((item) => selectedIdSet.has(String(item.orgId)));
	}, [selectedOrgIds, taskDetail?.orgList]);
	const targetPlanFieldText = selectedPlanLabel ?? selectedPlan?.label ?? "请选择";

	const loadPlanOptions = async () => {
		setPlanOptionsLoading(true);
		try {
			const response = await fetchTargetPlanPage({
				pageNum: 1,
				pageSize: 500,
			});
			const nextOptions = getPagedListData<TargetPlanPageItem>(response)
				.list.slice(0, 500)
				.map(buildPlanOption);
			setPlanOptions(nextOptions);
		} catch {
			setPlanOptions([]);
			message.error("目标计划加载失败");
		} finally {
			setPlanOptionsLoading(false);
		}
	};

	const loadTargetPlanTable = async (planId: number, pageNum: number, pageSize: number) => {
		setTargetPlanTableLoading(true);
		try {
			const response = await pageForTargetPlan({
				pageNum,
				pageSize,
				targetPlanId: planId,
			});
			const { list, total } = getPagedListData<PageForTargetPlanItem>(response);
			setTargetPlanTableState((prev) => ({
				...prev,
				list,
				total,
				pageNum,
				pageSize,
			}));
		} catch {
			setTargetPlanTableState((prev) => ({
				...prev,
				list: [],
				total: 0,
				pageNum,
				pageSize,
			}));
			message.error("目标值列表加载失败");
		} finally {
			setTargetPlanTableLoading(false);
		}
	};

	useEffect(() => {
		if (!open) {
			setSelectedOrgIds([]);
			setSelectedPlanId(undefined);
			setSelectedPlanLabel(undefined);
			setTargetValueModalOpen(false);
			setDraftPlanId(undefined);
			setTargetPlanTableState({
				list: [],
				total: 0,
				pageNum: 1,
				pageSize: 10,
			});
			setMeasurementResults([]);
			setMeasured(false);
		}
	}, [open]);

	useEffect(() => {
		if (!targetValueModalOpen) {
			return;
		}

		void loadPlanOptions();
	}, [targetValueModalOpen]);

	useEffect(() => {
		if (!targetValueModalOpen) {
			return;
		}

		setDraftPlanId(selectedPlanId);
		setTargetPlanTableState((prev) => ({
			...prev,
			pageNum: 1,
		}));
	}, [selectedPlanId, targetValueModalOpen]);

	useEffect(() => {
		if (!targetValueModalOpen || !draftPlanId) {
			return;
		}

		void loadTargetPlanTable(
			draftPlanId,
			targetPlanTableState.pageNum,
			targetPlanTableState.pageSize,
		);
	}, [
		draftPlanId,
		targetPlanTableState.pageNum,
		targetPlanTableState.pageSize,
		targetValueModalOpen,
	]);

	const handleReset = () => {
		setSelectedOrgIds([]);
		setSelectedPlanId(undefined);
		setSelectedPlanLabel(undefined);
		setDraftPlanId(undefined);
		setTargetPlanTableState({
			list: [],
			total: 0,
			pageNum: 1,
			pageSize: 10,
		});
		setMeasurementResults([]);
		setMeasured(false);
	};

	const handleOpenTargetValueModal = () => {
		setDraftPlanId(selectedPlanId);
		setTargetPlanTableState((prev) => ({
			...prev,
			pageNum: 1,
		}));
		setTargetValueModalOpen(true);
	};

	const handleConfirmTargetValue = () => {
		if (!draftPlanId) {
			message.warning("请选择目标计划");
			return;
		}

		setSelectedPlanId(draftPlanId);
		setSelectedPlanLabel(draftPlan?.label);
		setMeasurementResults([]);
		setMeasured(false);
		setTargetValueModalOpen(false);
	};

	const handleMeasure = async () => {
		if (!selectedOrgIds.length) {
			message.warning("请选择对比组织");
			return;
		}
		if (!taskId || !normalizedTxtVer) {
			message.warning("当前任务信息不完整，无法测算");
			return;
		}

		setMeasurementLoading(true);
		try {
			const nextResults = await getComparisonOrgCalculationOfInfluenceScopeList({
				taskId,
				txtVer: normalizedTxtVer,
				effTargetPlanId: selectedPlanId,
				ehrOrgIdList: selectedOrgList.map((item) => String(item.orgId)),
			});
			setMeasurementResults(Array.isArray(nextResults?.data) ? nextResults.data : []);
			setMeasured(true);
		} catch {
			setMeasurementResults([]);
			setMeasured(true);
		} finally {
			setMeasurementLoading(false);
		}
	};

	const handleSubmit = () => {
		if (!measurementResults.length) {
			message.warning("请先完成测算");
			return;
		}

		onSubmit?.({
			selectedPlanId,
			selectedPlanLabel: selectedPlanLabel ?? selectedPlan?.label,
			selectedOrgList,
			measurementResults,
		});

		if (!onSubmit) {
			onClose();
		}
	};

	return (
		<>
			<Drawer
				open={open}
				placement="right"
				width={1200}
				title="影响范围测算"
				footer={
					<div className="flex items-center justify-end gap-3 px-1">
						<Button onClick={onClose}>取消</Button>
						<Button type="primary" onClick={handleSubmit}>
							提交
						</Button>
					</div>
				}
				destroyOnHidden
				styles={{
					header: { padding: "16px 20px", borderBottom: "1px solid #F0F2F5" },
					body: { padding: "16px 20px 20px" },
					footer: { padding: "12px 20px", borderTop: "1px solid #F0F2F5" },
				}}
				{...commonDrawerProps(onClose)}
			>
				<div className="flex h-full flex-col gap-2">
					<div className="flex items-start gap-6">
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<span className="w-[72px] shrink-0 whitespace-nowrap pt-1 text-right text-sm text-[#606266]">
								<span className="mr-1 text-[#f56c6c]">*</span>
								对比组织
							</span>
							<Select
								mode="multiple"
								showSearch
								optionFilterProp="label"
								value={selectedOrgIds}
								onChange={(value) => setSelectedOrgIds(value)}
								placeholder={
									orgOptions.length
										? "请选择"
										: "当前暂无子元素变化的组织可供选择"
								}
								style={{ width: "100%" }}
								maxTagCount="responsive"
								allowClear
								options={orgOptions}
							/>
						</div>

						<div className="flex min-w-0 flex-1 items-center gap-3">
							<span className="w-[92px] shrink-0 whitespace-nowrap pt-1 text-right text-sm text-[#606266]">
								<span className="mr-1 text-[#f56c6c]">*</span>
								当年度目标值
							</span>
							<button
								type="button"
								onClick={handleOpenTargetValueModal}
								className="flex h-8 w-full items-center justify-between rounded-md border border-[#DCDFE6] bg-white px-3 text-left text-sm text-[#303133] transition-colors hover:border-[#409EFF]"
							>
								<span
									className={
										selectedPlanId
											? "truncate text-[#303133]"
											: "truncate text-[#C0C4CC]"
									}
								>
									{targetPlanFieldText}
								</span>
								<DownOutlined style={{ color: "#909399", fontSize: 12 }} />
							</button>
						</div>

						<Space size={8}>
							<Button type="primary" onClick={handleMeasure}>
								测算
							</Button>
							<Button type="text" onClick={handleReset}>
								重置
							</Button>
						</Space>
					</div>

					<div className="h-px bg-[#EBEEF5]" />

					<div className="flex min-h-0 flex-1 flex-col rounded bg-white">
						{measurementResults.length > 0 ? (
							<Spin
								spinning={measurementLoading}
								wrapperClassName="flex-1 min-h-0 flex flex-col [&>.ant-spin-container]:flex-1 [&>.ant-spin-container]:min-h-0 [&>.ant-spin-container]:flex [&>.ant-spin-container]:flex-col"
							>
								<div className="min-h-0 flex-1 overflow-auto">
									<div className="min-w-max pr-4 pt-2">
										<ImpactMeasurementComparisonTable
											measurementResults={measurementResults}
											selectedOrgList={selectedOrgList}
											allOrgList={taskDetail?.orgList ?? []}
											editableCurrentYearAfter
											onMeasurementResultsChange={setMeasurementResults}
										/>
									</div>
								</div>
							</Spin>
						) : measurementLoading ? (
							<div className="flex min-h-0 flex-1 items-center justify-center">
								<Spin spinning />
							</div>
						) : (
							<div className="flex min-h-0 flex-1 items-center justify-center">
								<div className="flex flex-col items-center justify-center text-center">
									<img
										src={blankImage}
										alt="暂无数据"
										width={196}
										height={196}
										className="block h-[196px] w-[196px] object-contain"
									/>
									<div
										className="mt-3 text-sm leading-5"
										style={{ color: "rgba(144, 147, 153, 1)" }}
									>
										暂无数据
									</div>
									<div className="mt-2 text-sm leading-5 text-[#606266]">
										{measured
											? "当前暂无测算结果"
											: "请选择“对比组织”，再进行“测算”"}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</Drawer>

			<Modal
				open={targetValueModalOpen}
				title="当年度目标值"
				onCancel={() => setTargetValueModalOpen(false)}
				onOk={handleConfirmTargetValue}
				okText="确定"
				cancelText="取消"
				width={856}
				destroyOnHidden
				styles={{
					header: {
						padding: "14px 20px",
						borderBottom: "1px solid #EBEEF5",
						marginBottom: 0,
					},
					body: { padding: 0 },
					footer: { padding: "10px 20px", borderTop: "1px solid #EBEEF5" },
				}}
			>
				<div className="flex items-center justify-between border-b border-[#D9ECFF] bg-[#ECF5FF] px-4 py-[9px] text-sm leading-5 text-[#606266]">
					<div className="flex items-center gap-2 text-[#606266]">
						<InfoCircleFilled style={{ color: "#409EFF", fontSize: 14 }} />
						<span>
							提醒:数值类型指标可查看当前层级及下级汇总数据，百分比指标仅可查看当前层级数据
						</span>
					</div>
					<CloseOutlined style={{ color: "#909399", fontSize: 12 }} />
				</div>
				<div className="px-5 py-4">
					<div className="flex items-center gap-3 pb-3">
						<span className="w-[84px] shrink-0 text-right text-sm leading-8 text-[#606266]">
							<span className="mr-1 text-[#f56c6c]">*</span>
							目标计划
						</span>
						<Select
							showSearch
							optionFilterProp="label"
							placeholder="请选择目标计划"
							value={draftPlanId}
							loading={planOptionsLoading}
							style={{ width: "100%" }}
							options={planOptions.reverse()}
							onChange={(value) => {
								setDraftPlanId(value);
								setTargetPlanTableState((prev) => ({ ...prev, pageNum: 1 }));
							}}
						/>
					</div>

					<div className="overflow-hidden border border-[#EBEEF5]">
						<Table<PageForTargetPlanItem>
							rowKey="id"
							size="small"
							className="target-plan-table"
							loading={targetPlanTableLoading}
							columns={TARGET_PLAN_TABLE_COLUMNS}
							dataSource={targetPlanTableState.list}
							scroll={{ x: 720, y: 280 }}
							locale={{
								emptyText: draftPlanId ? "暂无目标值数据" : "请选择目标计划",
							}}
							pagination={{
								current: targetPlanTableState.pageNum,
								pageSize: targetPlanTableState.pageSize,
								total: targetPlanTableState.total,
								showSizeChanger: true,
								showTotal: (total) => `共 ${total} 条`,
								size: "default",
								onChange: (page, pageSize) => {
									setTargetPlanTableState((prev) => ({
										...prev,
										pageNum: page,
										pageSize,
									}));
								},
							}}
						/>
					</div>
				</div>
			</Modal>
		</>
	);
};

export default ImpactMeasurementDrawer;
