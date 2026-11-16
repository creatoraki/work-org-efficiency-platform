import { SectionTitle } from "#src/components/section-title/index.js";
import { request } from "#src/utils/request";
import { ConfigProvider, Drawer, Empty, Form, Spin, Table, Tabs } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import { commonDrawerProps } from "../constants/base";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
}

export default function IndicatorDetailDrawer({ open, record, onClose }: Props) {
	const [activeKey, setActiveKey] = React.useState<string>("1");
	const [displayRecord, setDisplayRecord] = React.useState<any>(record);
	const [loading, setLoading] = React.useState<boolean>(false);

	function makeMockDetail(id = "demo") {
		const now = new Date();
		return {
			id,
			name: "示例指标 A",
			indicatorType: "base",
			department: "product",
			definition: "示例：计算过去 30 天内的活跃用户数",
			description: "这是一个用于演示的指标说明，包含计算口径与注意事项。",
			dataType: "number",
			decimals: 0,
			unit: "次",
			dataRange: { min: 0, max: 100000 },
			plan: "计划 1",
			creator: "张三",
			updater: "李四",
			updatedAt: now.toISOString().replace("T", " ").slice(0, 19),
			remark: "此为模拟数据，仅供展示",
			values: [
				{
					year: "2025",
					period: "month",
					metricName: "指标A-1",
					targets: ["全公司"],
					source: "手工",
					extra: "默认完成值：100",
				},
				{
					year: "2025",
					period: "quarter",
					metricName: "指标A-2",
					targets: ["产品部", "研发部"],
					source: "数据资产",
					extra: "映射表：task_table.task_value",
				},
				{
					year: "2024",
					period: "year",
					metricName: "指标A-历史",
					targets: ["市场部"],
					source: "手工",
					extra: "历史口径调整：已合并",
				},
			],
		};
	}

	React.useEffect(() => {
		if (!open) return;
		// when opening, prefer to fetch details from backend if we have an id
		const id = record?.id ?? record?.key ?? null;
		if (!id) {
			setDisplayRecord(record ?? makeMockDetail());
			return;
		}

		let mounted = true;
		setLoading(true);
		request
			.get(`indicator/basic/${id}`, { ignoreLoading: true })
			.json()
			.then((resp: any) => {
				if (!mounted) return;
				const data = resp?.data ?? resp;
				if (data) {
					setDisplayRecord({
						...data,
						indicatorType:
							data.typeStr ??
							(data.indicatorType || (data.type === 1 ? "composite" : "base")),
						department: data.responsibleDepartment ?? data.department,
						dataType: data.dataTypeStr ?? data.dataType,
						decimals: data.decimalDigits ?? data.decimals,
						unit: data.unitName ?? data.unit,
						dataRange: {
							min: data.dataRangeStart ?? data.dataRange?.min,
							max: data.dataRangeEnd ?? data.dataRange?.max,
						},
					});
				}
			})
			.catch((e) => {
				console.error("failed to fetch indicator detail", e);
				setDisplayRecord(record ?? makeMockDetail(id));
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, [open, record]);

	const values =
		displayRecord?.values && displayRecord.values.length > 0
			? displayRecord.values
			: [
					{
						year: "2025",
						period: "month",
						metricName: "示例-月度",
						targets: ["全公司"],
						source: "手工",
						extra: "默认示例完成值",
					},
					{
						year: "2025",
						period: "quarter",
						metricName: "示例-季度",
						targets: ["产品部"],
						source: "数据资产",
						extra: "示例映射",
					},
				];
	const pagination = {
		size: "default" as const,
		showQuickJumper: false,
		showTotal: (t: number) => <span className="text-gray-500">共{t} 条</span>,
		showSizeChanger: true,
		pageSizeOptions: ["10", "20", "50"],
	};
	const renderValuesTable = () => {
		if (!values || values.length === 0) return <Empty description="暂无完成值设置" />;

		const columns = [
			{ title: "应用年份", dataIndex: "year", width: 120, key: "year" },
			{ title: "应用周期", dataIndex: "period", width: 120, key: "period" },
			{ title: "指标名称", dataIndex: "metricName", width: 120, key: "metricName" },
			{
				title: "应用对象",
				dataIndex: "targets",
				key: "targets",
				width: 120,
				render: (t: any) => (Array.isArray(t) ? t.join(", ") : t),
			},
			{ title: "数据来源", dataIndex: "source", key: "source", width: 160 },
		];

		return (
			<Table
				columns={columns as any}
				dataSource={values.map((v: any, idx: number) => ({ key: String(idx), ...v }))}
				pagination={pagination}
				rowKey="key"
				size="small"
				bordered
				tableLayout="fixed"
			/>
		);
	};

	return (
		<Drawer
			title={displayRecord ? `${displayRecord.name || displayRecord.id}` : "指标详情"}
			placement="right"
			width={680}
			open={open}
			styles={{
				body: { paddingTop: 0 },
			}}
			{...commonDrawerProps(onClose)}
		>
			<ConfigProvider locale={zhCN}>
				<Form
					layout="horizontal"
					colon={false}
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 16 }}
				>
					<Spin spinning={loading}>
						<Tabs
							activeKey={activeKey}
							onChange={(k) => setActiveKey(String(k))}
							items={[
								{
									key: "1",
									label: "基础设置",
									children: (
										<>
											<SectionTitle
												className="mb-4"
												title={<div className="text-base">基础信息</div>}
											/>
											<Form.Item label="指标类型" style={{ marginBottom: 8 }}>
												<div>
													{displayRecord?.indicatorType === "composite"
														? "复合指标"
														: (displayRecord?.indicatorType ??
															displayRecord?.typeStr ??
															"基础指标")}
												</div>
											</Form.Item>

											<Form.Item label="指标名称" style={{ marginBottom: 8 }}>
												<div style={{ fontWeight: 600 }}>
													{displayRecord?.name || "-"}
												</div>
											</Form.Item>

											<Form.Item label="主责部门" style={{ marginBottom: 8 }}>
												<div>
													{displayRecord?.responsibleDepartment ?? "-"}
												</div>
											</Form.Item>

											<Form.Item
												label="指标定义及口径"
												style={{ marginBottom: 8 }}
											>
												<div style={{ whiteSpace: "pre-wrap" }}>
													{displayRecord?.definition ?? "-"}
												</div>
											</Form.Item>

											<Form.Item label="指标说明" style={{ marginBottom: 8 }}>
												<div style={{ whiteSpace: "pre-wrap" }}>
													{displayRecord?.remark ??
														displayRecord?.description ??
														"-"}
												</div>
											</Form.Item>

											<SectionTitle
												className="mb-4"
												title={<div className="text-base">指标属性</div>}
											/>

											<Form.Item label="数据类型" style={{ marginBottom: 8 }}>
												<div>
													{displayRecord?.dataType ??
														displayRecord?.dataTypeStr ??
														"-"}
												</div>
											</Form.Item>

											<Form.Item label="小数位数" style={{ marginBottom: 8 }}>
												<div>
													{displayRecord?.decimalDigits ??
														displayRecord?.decimals ??
														"-"}
												</div>
											</Form.Item>

											<Form.Item label="数据单位" style={{ marginBottom: 8 }}>
												<div>
													{displayRecord?.unitName ??
														displayRecord?.unitName ??
														"-"}
												</div>
											</Form.Item>

											<Form.Item label="数据范围" style={{ marginBottom: 8 }}>
												<div>{`${displayRecord?.dataRangeStart ?? displayRecord?.dataRange?.min ?? "未配置"} - ${displayRecord?.dataRangeEnd ?? displayRecord?.dataRange?.max ?? "未配置"}`}</div>
											</Form.Item>
										</>
									),
								},
								{
									key: "2",
									label: "完成值设置",
									children: <>{renderValuesTable()}</>,
								},
							]}
						/>
					</Spin>
				</Form>
			</ConfigProvider>
		</Drawer>
	);
}
