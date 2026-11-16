import type {
	OrgAdjustmentTaskCompareMeta,
	OrgAdjustmentTaskOrgItem,
	OrgAdjustmentTaskSettings,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas/types";
import type { ColumnsType } from "antd/es/table";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Drawer, Empty, Table } from "antd";
import React, { useMemo } from "react";
import { DISPLAY_FIELD_CONFIG } from "../settings";
import { normalizeCompareMeta } from "../utils";

interface ChildrenChangeCompareModalProps {
	open: boolean;
	onClose: () => void;
	org?: OrgAdjustmentTaskOrgItem;
	orgList: OrgAdjustmentTaskOrgItem[];
	settings?: OrgAdjustmentTaskSettings;
}

interface CompareFieldConfig {
	key:
		| "saturatedRevenue"
		| "targetRevenue"
		| "targetProfit"
		| "employeeNum"
		| "childNodeNum"
		| "projectNum"
		| "planDeliveryProjectNum"
		| "expandDeliveryProjectNum";
	label: string;
}

interface CompareTableRow {
	key: CompareFieldConfig["key"];
	label: string;
	beforeValue: number;
	afterValue: number;
	diffValue: number;
	changed: boolean;
}

function sumFieldValue(
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
	childIds: string[],
	fieldKey: CompareFieldConfig["key"],
) {
	if (fieldKey === "childNodeNum") {
		return childIds.length;
	}

	return childIds.reduce((total, childId) => {
		const currentOrg = orgMap.get(String(childId));
		const currentValue = Number(currentOrg?.[fieldKey] ?? 0);
		return total + (Number.isFinite(currentValue) ? currentValue : 0);
	}, 0);
}

function formatValue(value: number) {
	return value.toLocaleString("zh-CN");
}

function getSafeCompareMeta(compareMeta: OrgAdjustmentTaskCompareMeta | null | undefined) {
	return (
		normalizeCompareMeta(compareMeta) ?? {
			beforeChildIds: [],
			afterChildIds: [],
			beforeEffectiveChildIds: [],
			afterEffectiveChildIds: [],
		}
	);
}

function getVisibleCompareFields(settings?: OrgAdjustmentTaskSettings) {
	if (!settings?.showMoreInfo) {
		return [] as CompareFieldConfig[];
	}

	return DISPLAY_FIELD_CONFIG.filter((item) => Boolean(settings[item.settingKey])).map(
		(item) => ({
			key: item.propertyKey as CompareFieldConfig["key"],
			label: item.label,
		}),
	);
}

export const ChildrenChangeCompareModal: React.FC<ChildrenChangeCompareModalProps> = ({
	open,
	onClose,
	org,
	orgList,
	settings,
}) => {
	const compareResult = useMemo(() => {
		const orgMap = new Map(orgList.map((item) => [String(item.orgId), item]));
		const compareMeta = getSafeCompareMeta(org?.compareMeta);
		const beforeChildIds = compareMeta.beforeEffectiveChildIds ?? compareMeta.beforeChildIds;
		const afterChildIds = compareMeta.afterEffectiveChildIds ?? compareMeta.afterChildIds;
		const visibleFields = getVisibleCompareFields(settings);

		const rows = visibleFields.map((field) => {
			const beforeValue = sumFieldValue(orgMap, beforeChildIds, field.key);
			const afterValue = sumFieldValue(orgMap, afterChildIds, field.key);
			return {
				key: field.key,
				label: field.label,
				beforeValue,
				afterValue,
				diffValue: afterValue - beforeValue,
				changed: beforeValue !== afterValue,
			};
		});

		return {
			beforeChildIds,
			afterChildIds,
			rows,
			hasData: (beforeChildIds.length > 0 || afterChildIds.length > 0) && rows.length > 0,
		};
	}, [org, orgList, settings]);

	const columns = useMemo<ColumnsType<CompareTableRow>>(() => {
		return [
			{
				title: "指标名称",
				dataIndex: "label",
				key: "label",
				width: 140,
			},
			{
				title: "调整前",
				dataIndex: "beforeValue",
				key: "beforeValue",
				width: 110,
				render: (value) => formatValue(Number(value ?? 0)),
			},
			{
				title: "调整后",
				dataIndex: "afterValue",
				key: "afterValue",
				width: 110,
				render: (value) => formatValue(Number(value ?? 0)),
			},
			{
				title: "差值",
				dataIndex: "diffValue",
				key: "diffValue",
				width: 110,
				render: (value: number, record) => (
					<span
						style={{
							color: record.changed
								? "rgba(96, 98, 102, 1)"
								: "rgba(144, 147, 153, 1)",
						}}
					>
						{value > 0 ? `+${formatValue(value)}` : formatValue(value)}
					</span>
				),
			},
		];
	}, []);

	return (
		<Drawer
			open={open}
			placement="right"
			width={460}
			title={org ? `${org.orgName}对比调整详情` : "对比调整详情"}
			destroyOnHidden
			styles={{
				header: { padding: "14px 20px", borderBottom: "1px solid rgba(235, 238, 245, 1)" },
				body: { padding: "12px 20px 16px" },
			}}
			{...commonDrawerProps(onClose)}
		>
			{compareResult.hasData ? (
				<Table
					rowKey="key"
					columns={columns}
					dataSource={compareResult.rows}
					size="small"
					pagination={{
						pageSize: 20,
						showSizeChanger: true,
						pageSizeOptions: ["20", "50", "100"],
						showTotal: (total) => `共${total}条`,
					}}
				/>
			) : (
				<Empty
					description="当前未配置可展示的对比字段或暂无可对比数据"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				/>
			)}
		</Drawer>
	);
};
