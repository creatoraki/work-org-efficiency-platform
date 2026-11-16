import { SectionTitle } from "#src/components/section-title/index.js";
import { request } from "#src/utils/request";
import {
	Button,
	Drawer,
	Form,
	Input,
	InputNumber,
	message,
	Popconfirm,
	Radio,
	Select,
	Space,
	Spin,
	Table,
} from "antd";
import React from "react";
import { commonDrawerProps } from "../constants/base";
import {
	RESPONSIBLE_DEPARTMENTS,
	UNIT_OPTIONS_NUMBER,
	UNIT_OPTIONS_PERCENT,
} from "../constants/indicator";

const years = (() => {
	const y = new Date().getFullYear();
	return Array.from({ length: 6 }).map((_, i) => ({ label: `${y - i}`, value: String(y - i) }));
})();

const periods = [
	{ label: "日", value: "day" },
	{ label: "周", value: "week" },
	{ label: "月", value: "month" },
	{ label: "季度", value: "quarter" },
	{ label: "年", value: "year" },
];

const appTargets = [
	{ label: "全公司", value: "all" },
	{ label: "产品部", value: "product" },
	{ label: "研发部", value: "engineering" },
	{ label: "市场部", value: "marketing" },
];

interface Props {
	open: boolean;
	record?: any;
	readonly?: boolean;
	onClose: (result?: any) => void;
}

function TextDisplay({ value, options }: { value?: any; options?: any[] }) {
	if (value === undefined || value === null || value === "") return "-";
	if (options) {
		const opt = options.find((o) => o.value === value);
		return opt ? (opt.label ?? opt.name) : value;
	}
	return value;
}

export default function IndicatorDrawer({ open, record, readonly, onClose }: Props) {
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = React.useState(false);
	const [, setActiveKey] = React.useState<string>("1");
	const [sourceDrawerOpen, setSourceDrawerOpen] = React.useState<boolean>(false);

	const dataType = Form.useWatch("dataType", form);

	const isEdit = Boolean(record?.id || record?.key);
	const isLimitedEdit = isEdit && Number(record?.applicationPlanCount ?? 0) > 0;
	const canEditField = React.useCallback(
		(
			field:
				| "type"
				| "definition"
				| "remark"
				| "name"
				| "responsibleDepartmentCode"
				| "dataType"
				| "decimalDigits"
				| "unit"
				| "dataRange",
		) => {
			if (readonly) return false;
			if (!isLimitedEdit) return true;
			return field === "type" || field === "definition" || field === "remark";
		},
		[readonly, isLimitedEdit],
	);

	React.useEffect(() => {
		if (dataType === 1) {
			form.setFieldsValue({ unit: 99, unitName: "%" });
		}
	}, [dataType, form]);

	const [dsForm] = Form.useForm();
	const sourceType = Form.useWatch("sourceType", dsForm) || "manual";

	React.useEffect(() => {
		if (record) form.setFieldsValue(record);
	}, [record, form]);

	// 当抽屉打开且不是编辑模式时，为表单字段设置默认值（仅当表单当前未设置值时）
	React.useEffect(() => {
		if (!open) return;
		// 如果存在 record（编辑模式），detail 请求会设置表单，这里跳过
		if (record) return;
		const toSet: any = {};
		if (form.getFieldValue("type") === undefined) toSet.type = 0;
		if (form.getFieldValue("responsibleDepartmentCode") === undefined)
			toSet.responsibleDepartmentCode = 1;
		if (Object.keys(toSet).length > 0) {
			form.setFieldsValue(toSet);
		}
	}, [open, record, form]);

	const [loadingDetail, setLoadingDetail] = React.useState(false);
	React.useEffect(() => {
		if (!open) return;
		const id = record?.id ?? record?.key ?? null;
		if (!id) return;
		let mounted = true;
		setLoadingDetail(true);
		request
			.get(`indicator/basic/${id}`, { ignoreLoading: true })
			.json()
			.then((resp: any) => {
				if (!mounted) return;
				const data = resp?.data ?? resp;
				if (data) {
					form.setFieldsValue({
						id: data.id,
						type: data.type,
						name: data.name,
						responsibleDepartmentCode:
							data.responsibleDepartmentCode ?? data.responsibleDepartment,
						definition: data.definition,
						remark: data.remark,
						dataType: data.dataType,
						decimalDigits: data.decimalDigits ?? data.decimals,
						unit: data.unit ?? data.unitName,
						dataRangeStart: data.dataRangeStart ?? data.dataRange?.min,
						dataRangeEnd: data.dataRangeEnd ?? data.dataRange?.max,
						synVersion: data.synVersion ?? data.synVersion,
						values: data.values,
					});
				}
			})
			.catch((e) => {
				console.error("failed to fetch indicator detail for edit", e);
			})
			.finally(() => {
				if (mounted) setLoadingDetail(false);
			});

		return () => {
			mounted = false;
		};
	}, [open, record, form]);

	const handleCancel = () => {
		form.resetFields();
		setActiveKey("1");
		onClose(null);
	};

	const handleCreate = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);
			const payload: any = {
				type: values.type,
				name: values.name,
				responsibleDepartmentCode: values.responsibleDepartmentCode,
				definition: values.definition,
				remark: values.remark || "",
				dataType: values.dataType,
				decimalDigits: values.decimalDigits,
				unit: values.unit,
				dataRangeStart: values.dataRangeStart,
				dataRangeEnd: values.dataRangeEnd,
				// 保底：优先使用表单值，其次 fallback 到 record（来自打开抽屉时的 detail），最后使用 0
				synVersion: values.synVersion ?? record?.synVersion ?? 0,
			};

			// 编辑模式（由 isEdit 判断）
			if (isEdit) {
				// 优先使用表单 id，没有则回退到传入的 record.id
				payload.id = values.id ?? record?.id;
				// 调用编辑接口
				const resp: any = await request
					.put("indicator/basic/edit", { json: payload })
					.json();
				const data = resp && typeof resp === "object" ? (resp.data ?? resp) : resp;
				message.success("编辑成功");
				form.resetFields();
				setActiveKey("1");
				onClose(data ?? resp);
				return;
			}

			// 创建模式
			const resp: any = await request.post("indicator/createBasic", { json: payload }).json();
			const data = resp && typeof resp === "object" ? (resp.data ?? resp) : resp;
			message.success("创建成功");
			form.resetFields();
			setActiveKey("1");
			onClose(data ?? resp);
		} catch (e: any) {
			console.error("create indicator failed", e);
		} finally {
			setSubmitting(false);
		}
	};

	// const renderValuesTable = (fields: any[], operations: any) => {
	// 	const dataSource = fields.map(f => ({ key: String(f.key), field: f }));
	// 	const columns = [
	// 		{
	// 			title: "应用年份",
	// 			width: 140,
	// 			render: (_: any, _row: any, idx: number) => {
	// 				const f = fields[idx];
	// 				return (<Form.Item name={[f.name, "year"]} noStyle><Select options={years as any} style={{ width: 120 }} /></Form.Item>);
	// 			},
	// 		},
	// 		{
	// 			title: "应用周期",
	// 			width: 120,
	// 			render: (_: any, _row: any, idx: number) => {
	// 				const f = fields[idx];
	// 				return (<Form.Item name={[f.name, "period"]} noStyle><Select options={periods as any} style={{ width: 100 }} /></Form.Item>);
	// 			},
	// 		},
	// 		{
	// 			title: "指标名称",
	// 			width: 200,
	// 			render: (_: any, _row: any, idx: number) => {
	// 				const f = fields[idx];
	// 				return (<Form.Item name={[f.name, "metricName"]} noStyle><Select options={[{ label: "指标A", value: "A" }, { label: "指标B", value: "B" }]} style={{ width: 180 }} /></Form.Item>);
	// 			},
	// 		},
	// 		{
	// 			title: "应用对象",
	// 			width: 200,
	// 			render: (_: any, _row: any, idx: number) => {
	// 				const f = fields[idx];
	// 				return (<Form.Item name={[f.name, "targets"]} noStyle><Select mode="multiple" options={appTargets as any} style={{ minWidth: 200 }} /></Form.Item>);
	// 			},
	// 		},
	// 		{
	// 			title: "数据来源",
	// 			width: 120,
	// 			render: (_: any, _row: any, idx: number) => {
	// 				const f = fields[idx];
	// 				return (
	// 					<Form.Item name={[f.name, "source"]} noStyle>
	// 						<Space>
	// 							<Button
	// 								type="link"
	// 								onClick={(e) => {
	// 									e.stopPropagation();
	// 									setSourceDrawerOpen(true);
	// 								}}
	// 							>
	// 								数据来源
	// 							</Button>
	// 						</Space>
	// 					</Form.Item>
	// 				);
	// 			},
	// 		},
	// 		{ title: "操作", key: "actions", width: 100, render: (_: any, _row: any, idx: number) => (<Space><Popconfirm title="确认删除？" onConfirm={() => operations.remove(idx)}><Button type="link" danger>删除</Button></Popconfirm></Space>) },
	// 	];

	// 	const totalW = columns.reduce((s, c) => s + (c.width || 120), 0);

	// 	return (
	// 		<Table
	// 			dataSource={dataSource}
	// 			columns={columns as any}
	// 			pagination={{ pageSize: 5 }}
	// 			rowKey={r => r.key}
	// 			bordered
	// 			size="small"
	// 			scroll={{ x: Math.max(totalW, 600) }}
	// 			tableLayout="fixed"
	// 			footer={() => (
	// 				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
	// 					<div>
	// 						<Button onClick={() => operations.add({ year: years[0]?.value, period: periods.find(p => p.value === "month")?.value })} type="link">+ 新增</Button>
	// 					</div>
	// 				</div>
	// 			)}
	// 		/>
	// 	);
	// };

	return (
		<Drawer
			title={isEdit ? (readonly ? "指标详情" : "指标编辑") : "新增指标"}
			placement="right"
			width={680}
			open={open}
			{...commonDrawerProps(onClose)}
			footer={
				readonly ? null : (
					<div className="flex w-full gap-4">
						<Button className="ml-auto" onClick={handleCancel}>
							取消
						</Button>
						<Button type="primary" loading={submitting} onClick={handleCreate}>
							确定
						</Button>
					</div>
				)
			}
		>
			<Spin spinning={loadingDetail}>
				<style>
					{`
						.readonly-form .ant-form-item {
							margin-bottom: 8px !important;
						}
						.readonly-form .ant-form-item-label > label {
							color: rgba(96, 98, 102, 1) !important;
						}
						.readonly-form .ant-form-item-label > label.ant-form-item-required::before {
							display: none !important;
						}
					`}
				</style>
				<Form
					className={readonly ? "readonly-form" : ""}
					form={form}
					layout="horizontal"
					labelCol={{ span: 5 }}
					wrapperCol={{ span: 16 }}
					colon={false}
				>
					<Form.Item name="synVersion" hidden>
						<Input />
					</Form.Item>
					{/* <Tabs
						activeKey={activeKey}
						onChange={k => setActiveKey(String(k))}
						items={[
							// {
							// 	key: "1",
							// 	label: "基础设置",
							// 	children: (

							// 	),
							// },
							// {
							// 	key: "2",
							// 	label: "完成值设置",
							// 	children: (
							// 		<>
							// 			<Form.List name="values">
							// 				{(fields, operations) => (
							// 					<div>
							// 						{renderValuesTable(fields, operations)}
							// 					</div>
							// 				)}
							// 			</Form.List>
							// 		</>
							// 	),
							// },
						]}
					/> */}
					<>
						<SectionTitle
							className="mb-4"
							title={<div className="text-base">基础信息</div>}
						/>
						{/* 指标类型：基础指标 / 复合指标 */}
						<Form.Item
							name="type"
							label="指标类型"
							rules={[{ required: true, message: "请选择指标类型" }]}
						>
							{readonly ? (
								<TextDisplay
									options={[
										{ label: "基础指标", value: 0 },
										{
											label: "复合指标（基于基础指标，通过一定计算逻辑产生）",
											value: 1,
										},
									]}
								/>
							) : (
								<Radio.Group
									disabled={!canEditField("type")}
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 8,
										marginTop: 4,
									}}
								>
									<Radio value={0}>基础指标</Radio>
									<Radio value={1}>
										复合指标（基于基础指标，通过一定计算逻辑产生）
									</Radio>
								</Radio.Group>
							)}
						</Form.Item>

						{/* 指标名称 */}
						<Form.Item
							name="name"
							label="指标名称"
							rules={[{ required: true, message: "请输入指标名称" }]}
						>
							{readonly ? (
								<TextDisplay />
							) : (
								<Input placeholder="请输入" disabled={!canEditField("name")} />
							)}
						</Form.Item>

						{/* 主责部门 */}
						<Form.Item
							name="responsibleDepartmentCode"
							label="主责部门"
							rules={[{ required: true, message: "请选择主责部门" }]}
						>
							{readonly ? (
								<TextDisplay options={RESPONSIBLE_DEPARTMENTS as any} />
							) : (
								<Select
									placeholder="请选择"
									options={RESPONSIBLE_DEPARTMENTS as any}
									disabled={!canEditField("responsibleDepartmentCode")}
								/>
							)}
						</Form.Item>

						{/* 指标定义及口径 */}
						<Form.Item
							name="definition"
							label="指标定义及口径"
							rules={[{ required: true, message: "请输入指标定义及口径" }]}
						>
							{readonly ? (
								<TextDisplay />
							) : (
								<Input.TextArea
									rows={4}
									placeholder="请输入"
									disabled={!canEditField("definition")}
								/>
							)}
						</Form.Item>

						{/* 指标说明 */}
						<Form.Item name="remark" label="指标说明">
							{readonly ? (
								<TextDisplay />
							) : (
								<Input.TextArea
									rows={3}
									placeholder="请输入"
									disabled={!canEditField("remark")}
								/>
							)}
						</Form.Item>

						<SectionTitle
							className="mb-4"
							title={<div className="text-base">指标属性</div>}
						/>
						{/* 数据类型 */}
						<Form.Item
							name="dataType"
							label="数据类型"
							rules={[{ required: true, message: "请选择数据类型" }]}
						>
							{readonly ? (
								<TextDisplay
									options={[
										{ label: "数值", value: 0 },
										{ label: "百分比", value: 1 },
									]}
								/>
							) : (
								<Select
									placeholder="请选择"
									options={[
										{ label: "数值", value: 0 },
										{ label: "百分比", value: 1 },
									]}
									disabled={!canEditField("dataType")}
								/>
							)}
						</Form.Item>

						{/* 小数位数 */}
						<Form.Item
							name="decimalDigits"
							label="小数位数"
							rules={[{ required: true, message: "请输入小数位数" }]}
						>
							{readonly ? (
								<TextDisplay />
							) : (
								<InputNumber
									min={0}
									max={10}
									style={{ width: 120 }}
									placeholder="请输入"
									disabled={!canEditField("decimalDigits")}
								/>
							)}
						</Form.Item>

						{/* 数据单位 */}
						<Form.Item
							name="unit"
							label="数据单位"
							rules={[{ required: true, message: "请输入数据单位" }]}
						>
							{readonly ? (
								<TextDisplay
									options={
										dataType === 1 ? UNIT_OPTIONS_PERCENT : UNIT_OPTIONS_NUMBER
									}
								/>
							) : (
								<Select
									placeholder="请选择"
									options={
										dataType === 1 ? UNIT_OPTIONS_PERCENT : UNIT_OPTIONS_NUMBER
									}
									allowClear
									disabled={!canEditField("unit")}
								/>
							)}
						</Form.Item>

						{/* 数据范围：一行 label，内部两个输入，中间用 - 分隔 */}
						<Form.Item label="数据范围" shouldUpdate>
							{() => {
								if (readonly) {
									const start = form.getFieldValue("dataRangeStart");
									const end = form.getFieldValue("dataRangeEnd");
									return (
										<span>
											{start ?? "-"} - {end ?? "-"}
										</span>
									);
								}
								return (
									<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
										<Form.Item name="dataRangeStart" noStyle>
											<InputNumber
												placeholder="最小值"
												style={{ width: 240 }}
												disabled={!canEditField("dataRange")}
											/>
										</Form.Item>
										<span style={{ margin: "0 8px", color: "#666" }}>-</span>
										<Form.Item name="dataRangeEnd" noStyle>
											<InputNumber
												placeholder="最大值"
												style={{ width: 240 }}
												disabled={!canEditField("dataRange")}
											/>
										</Form.Item>
									</div>
								);
							}}
						</Form.Item>
					</>
				</Form>

				<Drawer
					title="数据来源"
					placement="right"
					width={1000}
					onClose={() => setSourceDrawerOpen(false)}
					open={sourceDrawerOpen}
				>
					<Form form={dsForm} initialValues={{ sourceType: "manual" }} layout="vertical">
						<Form.Item
							label={<span style={{ fontWeight: 600 }}>数据来源</span>}
							name="sourceType"
						>
							<Radio.Group>
								<Radio value="manual">手工录入</Radio>
								<Radio value="asset">数据资产</Radio>
							</Radio.Group>
						</Form.Item>

						{sourceType === "manual" && (
							<>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: 8,
									}}
								>
									<SectionTitle title="手工录入" />
									<div>
										<Button style={{ marginRight: 8 }}>导出模板</Button>
										<Button>导入</Button>
									</div>
								</div>

								<Form.List name="sourceValues">
									{(fields, { add, remove }) => {
										const dataSource2 = fields.map((f) => ({
											key: String(f.key),
											field: f,
										}));
										const cols = [
											{
												title: "应用年份",
												width: 120,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item name={[f.name, "year"]} noStyle>
															<Select
																options={years as any}
																style={{ width: 120 }}
															/>
														</Form.Item>
													);
												},
											},
											{
												title: "应用周期",
												width: 100,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item
															name={[f.name, "period"]}
															noStyle
														>
															<Select
																options={periods as any}
																style={{ width: 100 }}
															/>
														</Form.Item>
													);
												},
											},
											{
												title: "主数据编码",
												width: 140,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item
															name={[f.name, "mdCode"]}
															noStyle
														>
															<Select
																options={[
																	{
																		label: "MD-001",
																		value: "MD-001",
																	},
																	{
																		label: "MD-002",
																		value: "MD-002",
																	},
																]}
																style={{ width: 150 }}
															/>
														</Form.Item>
													);
												},
											},
											{
												title: "应用对象",
												width: 140,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item
															name={[f.name, "targets"]}
															noStyle
														>
															<Select
																mode="multiple"
																options={appTargets as any}
																style={{ minWidth: 150 }}
															/>
														</Form.Item>
													);
												},
											},
											{
												title: "指标名称",
												width: 140,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item
															name={[f.name, "metricName"]}
															noStyle
														>
															<Select
																options={[
																	{ label: "指标A", value: "A" },
																	{ label: "指标B", value: "B" },
																]}
																style={{ width: 180 }}
															/>
														</Form.Item>
													);
												},
											},
											{
												title: "实际值",
												width: 140,
												render: (_: any, _r: any, idx: number) => {
													const f = fields[idx];
													return (
														<Form.Item
															name={[f.name, "actual"]}
															noStyle
														>
															<Input style={{ width: 120 }} />
														</Form.Item>
													);
												},
											},
											{
												title: "操作",
												key: "actions",
												width: 100,
												render: (_: any, _r: any, idx: number) => (
													<Space>
														<Popconfirm
															title="确认删除？"
															onConfirm={() => remove(idx)}
														>
															<Button type="link" danger>
																删除
															</Button>
														</Popconfirm>
													</Space>
												),
											},
										];

										const totalW = cols.reduce(
											(s, c) => s + (c.width || 120),
											0,
										);

										return (
											<Table
												dataSource={dataSource2}
												columns={cols as any}
												pagination={{ pageSize: 5 }}
												rowKey={(r) => r.key}
												bordered
												size="small"
												scroll={{ x: Math.max(totalW, 800) }}
												tableLayout="fixed"
												footer={() => (
													<div
														style={{
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
														}}
													>
														<div>
															<Button
																type="primary"
																onClick={() =>
																	add({
																		year: years[0]?.value,
																		period: periods.find(
																			(p) =>
																				p.value === "month",
																		)?.value,
																	})
																}
															>
																新增一行
															</Button>
														</div>
														<div
															style={{ color: "#888", fontSize: 12 }}
														>
															每页显示 5 行
														</div>
													</div>
												)}
											/>
										);
									}}
								</Form.List>
							</>
						)}

						{sourceType === "asset" && (
							<div style={{ marginTop: 16 }}>
								<SectionTitle title="数据资产" />
								<Form.Item
									label="任务表名称"
									name={["asset", "taskTableName"]}
									rules={[{ required: true, message: "请输入任务表名称" }]}
								>
									<Input />
								</Form.Item>

								<Form.List name={["asset", "mappings"]}>
									{(groups, { add: addGroup, remove: removeGroup }) => (
										<div>
											<div style={{ marginBottom: 8 }}>
												<Button
													type="dashed"
													onClick={() =>
														addGroup({ groupName: "新组", items: [{}] })
													}
												>
													新增组
												</Button>
											</div>

											<table
												style={{
													width: "100%",
													borderCollapse: "collapse",
												}}
											>
												<thead>
													<tr style={{ background: "#F0F2F5" }}>
														<th
															style={{
																padding: 8,
																border: "1px solid #e8e8e8",
															}}
														>
															字段
														</th>
														<th
															style={{
																padding: 8,
																border: "1px solid #e8e8e8",
															}}
														>
															映射字段
														</th>
														<th
															style={{
																padding: 8,
																border: "1px solid #e8e8e8",
															}}
														>
															映射值
														</th>
														<th
															style={{
																padding: 8,
																border: "1px solid #e8e8e8",
															}}
														>
															操作
														</th>
													</tr>
												</thead>
												<tbody>
													{groups.map((g, gi) => (
														<Form.List
															key={g.key}
															name={[g.name, "items"]}
														>
															{(
																items,
																{
																	add: addItem,
																	remove: removeItem,
																},
															) => (
																<React.Fragment>
																	{items.length === 0 && (
																		<tr>
																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Form.Item
																					name={[
																						g.name,
																						"groupName",
																					]}
																					initialValue={
																						g.name
																					}
																					noStyle
																				>
																					<Input placeholder="组名称" />
																				</Form.Item>
																			</td>
																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Button
																					type="link"
																					onClick={() =>
																						addItem({})
																					}
																				>
																					新增子项
																				</Button>
																			</td>
																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			/>
																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Button
																					type="link"
																					danger
																					onClick={() =>
																						removeGroup(
																							gi,
																						)
																					}
																				>
																					删除组
																				</Button>
																			</td>
																		</tr>
																	)}

																	{items.map((it, ii) => (
																		<tr key={it.key}>
																			{ii === 0 ? (
																				<td
																					rowSpan={
																						items.length
																					}
																					style={{
																						padding: 8,
																						border: "1px solid #e8e8e8",
																						verticalAlign:
																							"top",
																					}}
																				>
																					<Form.Item
																						name={[
																							g.name,
																							"groupName",
																						]}
																						noStyle
																					>
																						<Input
																							style={{
																								width: 160,
																							}}
																						/>
																					</Form.Item>
																				</td>
																			) : null}

																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Form.Item
																					name={[
																						g.name,
																						"items",
																						ii,
																						"mappedField",
																					]}
																					noStyle
																				>
																					<Select
																						style={{
																							width: 200,
																						}}
																						options={[
																							{
																								label: "字段A",
																								value: "A",
																							},
																							{
																								label: "字段B",
																								value: "B",
																							},
																						]}
																					/>
																				</Form.Item>
																			</td>

																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Form.Item
																					name={[
																						g.name,
																						"items",
																						ii,
																						"mappedValue",
																					]}
																					noStyle
																				>
																					<Input
																						style={{
																							width: 200,
																						}}
																					/>
																				</Form.Item>
																			</td>

																			<td
																				style={{
																					padding: 8,
																					border: "1px solid #e8e8e8",
																				}}
																			>
																				<Button
																					type="link"
																					danger
																					onClick={() =>
																						removeItem(
																							ii,
																						)
																					}
																				>
																					删除
																				</Button>
																			</td>
																		</tr>
																	))}
																</React.Fragment>
															)}
														</Form.List>
													))}
												</tbody>
											</table>
										</div>
									)}
								</Form.List>
							</div>
						)}

						<div style={{ marginTop: 24, textAlign: "right" }}>
							<Button
								style={{ marginRight: 8 }}
								onClick={() => setSourceDrawerOpen(false)}
							>
								取消
							</Button>
							<Button
								type="primary"
								onClick={() => {
									dsForm
										.validateFields()
										.then(() => {
											setSourceDrawerOpen(false);
										})
										.catch(() => {});
								}}
							>
								保存
							</Button>
						</div>
					</Form>
				</Drawer>
			</Spin>
		</Drawer>
	);
}
