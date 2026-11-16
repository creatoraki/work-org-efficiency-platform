import type {
	ConfirmUserIdsIndicatorCountHisAdjustReferenceValue,
	ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes,
} from "#src/api/strategy/target-filling/types";
import {
	confirmUserIdsIndicatorCountHisAdjustReferenceValue,
	confirmUserIdsIndicatorCountHisAdjustReferenceValueCal,
	confirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkage,
} from "#src/api/strategy/target-filling";
import { SectionTitle } from "#src/components/index.js";
import { addThousand } from "#src/utils/add-thousand";
import { Button, Descriptions, Drawer, InputNumber, message, Space, Table } from "antd";
import React, { useEffect, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import { AdjustHistoryContext } from "./AdjustHistoryContext";

interface Props {
	open: boolean;
	onClose: () => void;
	listOverviewHisId: number | null;
	targetOrgCode: string;
	indicatorName: string;
	unitName: string;
	initialReferenceValue: number;
	cachedBasicIndicatorMap: Record<string, string>;
	sameTargetOrgRows: Array<{
		id: number;
		samePeriodValue: number;
		referenceValue: number;
		annualTargetValue: number;
	}>;
	onSave: (
		basicIndicatorMap: Record<string, unknown>,
		linkageData?: ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes,
	) => void;
}

export default function AdjustReferenceValueDrawer({
	open,
	onClose,
	listOverviewHisId,
	// targetOrgCode,
	indicatorName,
	unitName,
	initialReferenceValue,
	cachedBasicIndicatorMap,
	sameTargetOrgRows,
	onSave,
}: Props) {
	const { currentIndicatorListId } = React.useContext(AdjustHistoryContext);
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [details, setDetails] =
		useState<ConfirmUserIdsIndicatorCountHisAdjustReferenceValue | null>(null);
	const [currentReferenceValue, setCurrentReferenceValue] =
		useState<number>(initialReferenceValue);

	useEffect(() => {
		if (open && listOverviewHisId) {
			// 初始化显示传入的参考值
			setCurrentReferenceValue(initialReferenceValue);
			setLoading(true);
			confirmUserIdsIndicatorCountHisAdjustReferenceValue(listOverviewHisId)
				.then((res) => {
					if (res && res.data) {
						setDetails(res.data);
						const isFloatMode = res.data.targetMethod === 2;

						if (isFloatMode && res.data.floatingRatioReferenceValueInner) {
							const floatItem = res.data.floatingRatioReferenceValueInner;
							// 查找对应的基础指标id
							const basicIndicatorId = res.data.basicIndicatorInnerList?.[0]?.id;
							const cachedValue = cachedBasicIndicatorMap[String(basicIndicatorId)];
							setData([
								{
									key: basicIndicatorId ?? "floatingRatio",
									name: floatItem.basicIndicatorName,
									unit: floatItem.unitName || unitName,
									value:
										cachedValue !== undefined
											? Number(cachedValue)
											: floatItem.value,
									id: basicIndicatorId,
									supportAdjustment: floatItem.supportAdjustment,
								},
							]);
							return;
						}

						// 普通基础指标模式
						const list = (res.data.basicIndicatorInnerList || []).map((item) => {
							const cachedValue = cachedBasicIndicatorMap[String(item.id)];
							return {
								key: item.id,
								name: item.basicIndicatorName,
								unit: item.unitName || unitName,
								value: cachedValue !== undefined ? Number(cachedValue) : item.value,
								id: item.id,
								supportAdjustment: item.supportAdjustment,
							};
						});
						setData(list);
					}
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [open, listOverviewHisId, unitName, cachedBasicIndicatorMap, initialReferenceValue]);

	const handleSave = async () => {
		// 校验必填
		for (const item of data) {
			if (item.value === undefined || item.value === null) {
				message.error(`请填写${item.name}的填报值`);
				return;
			}
		}

		setLoading(true);
		try {
			if (!listOverviewHisId) {
				message.error("缺少必要参数");
				return;
			}

			// 构造 map 参数
			const map: Record<string, unknown> = {};
			data.forEach((item) => {
				map[String(item.id)] = item.value;
			});

			// 构造 basicIndicatorMap 参数
			const basicIndicatorMap: Record<string, unknown> = { ...cachedBasicIndicatorMap };
			data.forEach((item) => {
				basicIndicatorMap[String(item.id)] = item.value;
			});

			// 构造 calLinkageInnerMap 参数
			const calLinkageInnerMap: Record<
				number,
				{
					listOverviewHisId?: number;
					samePeriodValue?: number;
					referenceValue?: number;
					annualTargetValue?: number;
				}
			> = {};

			sameTargetOrgRows.forEach((row) => {
				calLinkageInnerMap[row.id] = {
					listOverviewHisId: row.id,
					samePeriodValue: row.samePeriodValue,
					referenceValue: row.referenceValue,
					annualTargetValue: row.annualTargetValue,
				};
			});

			// 调用联动接口
			const res = await confirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkage({
				listOverviewHisId,
				map,
				basicIndicatorMap,
				calLinkageInnerMap,
			});

			if (res && res.code === 200) {
				const matchId = currentIndicatorListId ?? String(listOverviewHisId);
				const currentData = res.data?.[String(matchId)];
				// 更新缓存的 basicIndicatorMap
				onSave(currentData?.basicIndicatorMap || basicIndicatorMap, res.data);
				message.success("保存成功");
				onClose();
			}
		} finally {
			setLoading(false);
		}
	};

	const columns = [
		{ title: "指标名称", dataIndex: "name", key: "name" },
		{ title: "单位", dataIndex: "unit", key: "unit" },
		{
			title: (
				<span>
					<span style={{ color: "red" }}>* </span>
					填报值
				</span>
			),
			dataIndex: "value",
			key: "value",
			render: (val: any, row: any, index: number) => (
				<InputNumber
					style={{ width: "100%" }}
					value={val}
					disabled={row.supportAdjustment !== 1}
					onChange={(v) => {
						const newData = [...data];
						newData[index].value = v;
						setData(newData);

						if (!listOverviewHisId || v === null || v === undefined) {
							return;
						}

						// 调用计算接口更新参考值显示
						const map: Record<string, unknown> = {};
						newData.forEach((item) => {
							map[String(item.id)] = item.value;
						});

						confirmUserIdsIndicatorCountHisAdjustReferenceValueCal({
							listOverviewHisId,
							map,
						}).then((res) => {
							if (res && res.code === 200) {
								setCurrentReferenceValue(res.data);
								setDetails((prev) => {
									if (!prev) return prev;
									return { ...prev, referenceValue: res.data };
								});
							}
						});
					}}
				/>
			),
		},
	];

	return (
		<Drawer
			title="参考值"
			width={680}
			open={open}
			{...commonDrawerProps(onClose)}
			footer={
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<Space>
						<Button onClick={onClose}>取消</Button>
						<Button type="primary" onClick={handleSave} loading={loading}>
							确定
						</Button>
					</Space>
				</div>
			}
		>
			<div className="reference-drawer-desc">
				<style>
					{`
						.reference-drawer-desc .ant-descriptions-item-label {
							text-align: right !important;
							justify-content: flex-end !important;
						}
					`}
				</style>
				<Descriptions
					column={1}
					colon={false}
					styles={{
						label: { width: "20%", color: "rgba(96, 98, 102, 1)", paddingRight: 12 },
						content: { width: "80%", color: "rgba(0, 0, 0, 1)" },
					}}
				>
					<Descriptions.Item label="拆解对象">
						{details?.targetOrgName || "-"}
					</Descriptions.Item>
					<Descriptions.Item label="指标">
						{details?.indicatorName || indicatorName}
					</Descriptions.Item>
					<Descriptions.Item label="计算公式">
						{details?.formulaBO?.formulaSDesc || details?.formulaBO?.formulaS || "-"}
					</Descriptions.Item>
					{details?.formulaBO?.formulaTDesc || details?.formulaBO?.formulaT ? (
						<Descriptions.Item label="平铺公式">
							{details?.formulaBO?.formulaTDesc || details?.formulaBO?.formulaT}
						</Descriptions.Item>
					) : null}
				</Descriptions>
			</div>

			<SectionTitle title="参考值" style={{ marginTop: 24, marginBottom: 12 }} />
			<div
				style={{
					background: "#F5F7FA",
					padding: "24px",
					textAlign: "center",
					borderRadius: 4,
					margin: "24px 0",
				}}
			>
				<div style={{ fontSize: 24, fontWeight: 600, color: "#303133" }}>
					{addThousand(currentReferenceValue ?? "-")}
				</div>
			</div>
			<SectionTitle title="基础指标" style={{ marginTop: 24, marginBottom: 12 }} />
			<div>
				<Table
					rowKey="key"
					columns={columns}
					dataSource={data}
					pagination={false}
					size="small"
					bordered
				/>
			</div>
		</Drawer>
	);
}
