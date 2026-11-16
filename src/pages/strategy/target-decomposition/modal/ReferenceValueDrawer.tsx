import {
	fetchSubmitUserIndicatorBasicDetails,
	submitUserIndicatorBasicUp,
	submitUserIndicatorSpecialCal,
	userIndicatorCal,
} from "#src/api/strategy/target-filling";
import { SectionTitle } from "#src/components/index.js";
import { addThousand } from "#src/utils/add-thousand";
import { Button, Descriptions, Drawer, InputNumber, message, Space, Table } from "antd";
import React, { useEffect, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";

interface Props {
	open: boolean;
	onClose: () => void;
	record: any;
	basicIndicatorConfigs: any[];
	indicatorName: string;
	unitName: string;
	onSave: (updates: any[], options?: { isFloatMode?: boolean }) => Promise<void>;
}

export default function ReferenceValueDrawer({
	open,
	onClose,
	record,
	basicIndicatorConfigs,
	indicatorName,
	unitName,
	onSave,
}: Props) {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [details, setDetails] = useState<any>({});

	useEffect(() => {
		if (open && record?.id) {
			setLoading(true);
			fetchSubmitUserIndicatorBasicDetails(record.id)
				.then((res) => {
					if (res && res.data) {
						setDetails(res.data);
						const floatingRatio = res.data.floatingRatioReferenceValueInner;
						const isFloatMode = res.data.targetMethod === 2;

						if (isFloatMode && floatingRatio) {
							const floatConf = basicIndicatorConfigs.find(
								(conf) => conf.name === floatingRatio.basicIndicatorName,
							);
							const recordItem = floatConf
								? record.basicIndicator?.[floatConf.id]
								: undefined;
							const instanceId = recordItem?.id;
							setData([
								{
									key: floatConf?.id ?? "floatingRatio",
									name: floatingRatio.basicIndicatorName,
									unit: floatingRatio.unitName || unitName,
									value: floatingRatio.value,
									id: instanceId,
									supportAdjustment: floatingRatio.supportAdjustment,
								},
							]);
							return;
						}

						const list = (res.data.basicIndicatorInnerList || []).map((item: any) => ({
							key: item.id,
							name: item.basicIndicatorName,
							unit: item.unitName || unitName,
							value: item.value,
							id: item.id,
							supportAdjustment: item.supportAdjustment,
						}));
						setData(list);
					}
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [open, record, basicIndicatorConfigs, unitName]);

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
			// 构造更新数据，这里假设只需要返回 id 和 value
			const updates = data.map((item) => ({
				id: item.id,
				value: item.value,
			}));
			const isFloatMode = details?.targetMethod === 2;
			const res = await submitUserIndicatorBasicUp({
				effTaskIndicatorSubmitIndicatorListOverviewId: record.id,
				...(isFloatMode
					? { floatValue: Number(updates[0]?.value || 0) }
					: { list: updates.map((u) => ({ id: u.id, value: Number(u.value) })) }),
			});
			if (res && res.code === 200) {
				await onSave(updates, { isFloatMode });
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
						const isFloatMode = details?.targetMethod === 2;
						if (isFloatMode) {
							submitUserIndicatorSpecialCal({
								effTaskIndicatorSubmitIndicatorListOverviewId: record?.id,
								val: Number(v || 0),
							}).then((res) => {
								if (res && res.code === 200) {
									setDetails((prev: any) => ({
										...prev,
										referenceValue: res.data,
									}));
								}
							});
							return;
						}

						const payload = newData.map((item) => ({
							id: item.id,
							value: Number(item.value || 0),
						}));
						userIndicatorCal({
							listOverviewId: Number(record?.id),
							forms: payload,
						}).then((res) => {
							if (res && res.code === 200) {
								setDetails((prev: any) => ({ ...prev, referenceValue: res.data }));
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
						{details.targetOrgName || record?.targetOrgName}
					</Descriptions.Item>
					<Descriptions.Item label="指标">
						{details.indicatorName || indicatorName}
					</Descriptions.Item>
					<Descriptions.Item label="计算公式">
						{details.formulaBO?.formulaSDesc || details.formulaBO?.formulaS || "-"}
					</Descriptions.Item>
					{details.formulaBO?.formulaTDesc || details.formulaBO?.formulaT ? (
						<Descriptions.Item label="平铺公式">
							{details.formulaBO?.formulaTDesc || details.formulaBO?.formulaT}
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
					{addThousand(details.referenceValue ?? record?.referenceValue ?? "-")}
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
