import {
	fetchConfirmConfirmationCycle,
	fetchConfirmSubmitVersion,
	fetchSubmitConfirmUserIds,
	fetchSubmitIndicators,
	submitConfirmSubmit,
	userIndicatorListCheckConfDetailGroup,
} from "#src/api/strategy/target-filling";
import { addThousand } from "#src/utils/add-thousand/index.js";
import { EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, message, Radio, Select, Space, Steps, Table } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { commonDrawerProps } from "../../target-management/constants/base";
import PersonCreateModal from "../../target-management/modal/Person-create-modal";
import ConfirmUserDrawer from "./ConfirmUserDrawer";
import DataQuantityDrawer from "./DataQuantityDrawer";
import SubmitIndicatorSelector from "./SubmitIndicatorSelector";

interface Props {
	open: boolean;
	onClose: (res?: any) => void;
	effTaskIndicatorSubmitUserId?: string | number;
	leftTreeSelectedKey: any;
}

export default function SubmitDrawer({
	open,
	onClose,
	effTaskIndicatorSubmitUserId,
	leftTreeSelectedKey,
}: Props) {
	const [searchParams] = useSearchParams();
	const planName = searchParams.get("planName") || "";
	const [current, setCurrent] = useState(0);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [form] = Form.useForm();
	const [allIndicatorsData, setAllIndicatorsData] = useState<any[]>([]);
	const [tableData, setTableData] = useState<any[]>([]);
	const [dataQuantityDrawerOpen, setDataQuantityDrawerOpen] = useState(false);
	const [targetIndicatorId, setTargetIndicatorId] = useState<string | null>(null);
	const [confirmCycles, setConfirmCycles] = useState<any[]>([]);
	const [confirmProcessData, setConfirmProcessData] = useState<any[]>([]);
	const [personModalOpen, setPersonModalOpen] = useState(false);
	const [editingProcessRowKey, setEditingProcessRowKey] = useState<string | null>(null);
	const [confirmUserCount, setConfirmUserCount] = useState<number>(0);
	const [indicatorIds, setIndicatorIds] = useState<any[]>([]);
	const [selectedChildIdsMap, setSelectedChildIdsMap] = useState<Record<string, React.Key[]>>({});
	const [confirmUserDrawerOpen, setConfirmUserDrawerOpen] = useState(false);
	const [confirmUserIdsList, setConfirmUserIdsList] = useState<any[]>([]);
	const [indicatorSelectorOpen, setIndicatorSelectorOpen] = useState(false);
	const [selectedIndicatorIds, setSelectedIndicatorIds] = useState<string[]>([]);

	const handleDataQuantityCommit = (selectedMap: Record<string, React.Key[]>) => {
		setSelectedChildIdsMap((prev) => ({
			...prev,
			...selectedMap,
		}));
	};

	const handleAddConfirmProcessRow = () => {
		const nextIndex = confirmProcessData.length + 1;
		const newRow = {
			key: Date.now().toString(),
			stepName: `步骤${nextIndex}`,
			stepType: 0,
			confirmerName: "",
			confirmerId: "",
		};
		setConfirmProcessData([...confirmProcessData, newRow]);
	};

	const handleDeleteConfirmProcessRow = (key: string) => {
		const newData = confirmProcessData.filter((item) => item.key !== key);
		const renumberedData = newData.map((item, index) => ({
			...item,
			stepName: `步骤${index + 1}`,
		}));
		setConfirmProcessData(renumberedData);
	};

	const updateConfirmProcessRow = (key: string, field: string, value: any) => {
		const newData = confirmProcessData.map((item) => {
			if (item.key === key) {
				return { ...item, [field]: value };
			}
			return item;
		});
		setConfirmProcessData(newData);
	};

	const handlePersonModalClose = (res: any[]) => {
		setPersonModalOpen(false);
		if (res && res.length > 0 && editingProcessRowKey) {
			const person = res[0];
			const newData = confirmProcessData.map((item) => {
				if (item.key === editingProcessRowKey) {
					return {
						...item,
						confirmerName: person.name,
						confirmerId: person.id,
					};
				}
				return item;
			});
			setConfirmProcessData(newData);
		}
		setEditingProcessRowKey(null);
	};

	const confirmProcessColumns = [
		{
			title: "步骤",
			dataIndex: "stepName",
			key: "stepName",
			width: 200,
			render: (text: string, record: any) => (
				<Input
					value={text}
					onChange={(e) =>
						updateConfirmProcessRow(record.key, "stepName", e.target.value)
					}
				/>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					流程
				</span>
			),
			dataIndex: "stepType",
			key: "stepType",
			width: 240,
			render: (value: number, record: any) => (
				<Select
					value={value}
					style={{ width: "100%" }}
					onChange={(val) => updateConfirmProcessRow(record.key, "stepType", val)}
					options={[
						{ label: "下发前确认", value: 0 },
						{ label: "各组织负责人目标值确认", value: 1 },
					]}
				/>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					确认人
				</span>
			),
			dataIndex: "confirmerName",
			width: 140,
			key: "confirmerName",
			render: (text: string, record: any) => {
				if (record.stepType === 1) {
					return (
						<Button type="link" onClick={() => setConfirmUserDrawerOpen(true)}>
							共{confirmUserCount}人
						</Button>
					);
				}
				return (
					<Input
						value={text}
						readOnly
						placeholder="请选择"
						onClick={() => {
							setEditingProcessRowKey(record.key);
							setPersonModalOpen(true);
						}}
						suffix={
							<EditOutlined
								onClick={() => {
									setEditingProcessRowKey(record.key);
									setPersonModalOpen(true);
								}}
							/>
						}
					/>
				);
			},
		},
		{
			title: "操作",
			key: "action",
			render: (_: any, record: any) => (
				<Button type="link" onClick={() => handleDeleteConfirmProcessRow(record.key)}>
					删除
				</Button>
			),
		},
	];

	useEffect(() => {
		if (open && leftTreeSelectedKey) {
			fetchSubmitIndicators({ effTaskIndicatorSubmitUserId }).then((res: any) => {
				const list = Array.isArray(res) ? res : [];
				setAllIndicatorsData(list);

				// 将后端返回的 listOverviewIds 填充到 selectedChildIdsMap 中
				const initialSelectionMap: Record<string, React.Key[]> = {};
				list.forEach((dept: any) => {
					(dept.innerDetailList || []).forEach((item: any) => {
						if (
							item.listOverviewIds &&
							Array.isArray(item.listOverviewIds) &&
							item.listOverviewIds.length > 0
						) {
							initialSelectionMap[String(item.id)] = item.listOverviewIds.map(
								(id: any) => String(id),
							);
						}
					});
				});
				setSelectedChildIdsMap(initialSelectionMap);
			});
			if (effTaskIndicatorSubmitUserId) {
				fetchConfirmSubmitVersion(effTaskIndicatorSubmitUserId).then((res: any) => {
					form.setFieldValue("submitVersion", res.data || res || "V1.0");
				});
			}
			form.setFieldsValue({
				taskName: planName,
				submitTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
			});
		} else {
			setAllIndicatorsData([]);
			setTableData([]);
			setConfirmCycles([]);
			setConfirmProcessData([]);
			setSelectedChildIdsMap({});
			setSelectedIndicatorIds([]);
			form.resetFields();
		}
	}, [open, effTaskIndicatorSubmitUserId, form]);

	useEffect(() => {
		if (current === 1) {
			const ids = tableData.map((item) => item.id);
			if (ids.length > 0) {
				fetchConfirmConfirmationCycle(ids).then((res: any) => {
					const data = res.data || res || {};
					const list = Object.keys(data).map((key) => ({
						id: key,
						name: data[key],
					}));
					setConfirmCycles(list);
				});
			} else {
				setConfirmCycles([]);
			}
			if (effTaskIndicatorSubmitUserId) {
				const allSelectedIds = new Set<React.Key>();
				Object.values(selectedChildIdsMap).forEach((ids) => {
					ids.forEach((id) => allSelectedIds.add(id));
				});
				const indicatorListOverviewIds = Array.from(allSelectedIds);
				setIndicatorIds(indicatorListOverviewIds);
				if (indicatorListOverviewIds.length > 0) {
					fetchSubmitConfirmUserIds(indicatorListOverviewIds).then((res: any) => {
						const data = res.data ?? res;
						if (Array.isArray(data)) {
							setConfirmUserCount(data.length);
							setConfirmUserIdsList(data);
						} else if (typeof data === "number") {
							setConfirmUserCount(data);
							setConfirmUserIdsList([]);
						} else {
							setConfirmUserCount(0);
							setConfirmUserIdsList([]);
						}
					});
				} else {
					setConfirmUserCount(0);
					setConfirmUserIdsList([]);
				}
			}
		}
	}, [current, tableData, effTaskIndicatorSubmitUserId]);

	// 扁平化指标数据，用于传递给 SubmitIndicatorSelector
	const flatIndicatorsList = useMemo(() => {
		const flatList: any[] = [];
		allIndicatorsData.forEach((dept) => {
			(dept.innerDetailList || []).forEach((item: any) => {
				flatList.push({
					...item,
					responsibleDepartment: dept.responsibleDepartment,
				});
			});
		});
		return flatList;
	}, [allIndicatorsData]);

	// 处理指标选择变化
	const handleIndicatorSelectionChange = (selectedIds: string[]) => {
		setSelectedIndicatorIds(selectedIds);

		// 构建 tableData
		const newTableData: any[] = [];
		allIndicatorsData.forEach((dept) => {
			const selectedItems = (dept.innerDetailList || []).filter((item: any) =>
				selectedIds.includes(String(item.id)),
			);
			if (selectedItems.length > 0) {
				selectedItems.forEach((item: any, index: number) => {
					newTableData.push({
						...item,
						responsibleDepartment: dept.responsibleDepartment,
						rowSpan: index === 0 ? selectedItems.length : 0,
					});
				});
			}
		});
		setTableData(newTableData);

		// 更新表单字段，标记为已选择
		form.setFieldValue("indicators", selectedIds.length > 0 ? selectedIds : undefined);
	};

	const columns = [
		{
			title: "主责部门",
			dataIndex: "responsibleDepartment",
			key: "responsibleDepartment",
			onCell: (record: any) => ({
				rowSpan: record.rowSpan,
			}),
		},
		{ title: "指标名称", dataIndex: "name", key: "name" },
		{
			title: "数据量",
			dataIndex: "fillInQuantity",
			key: "fillInQuantity",
		},
		{
			title: "确认条数",
			key: "confirmedCount",
			render: (_: any, record: any) => {
				const selectedCount = selectedChildIdsMap[record.id]?.length || 0;
				return (
					<Button
						type="link"
						onClick={() => {
							setTargetIndicatorId(record.id);
							setDataQuantityDrawerOpen(true);
						}}
					>
						{selectedCount}
					</Button>
				);
			},
		},
	];

	const submitIndicatorsList = useMemo(() => {
		if (!tableData || tableData.length === 0) return [];

		// 按 tag 分组
		const groupMap = new Map<string, any[]>();
		tableData.forEach((item) => {
			const tagKey = item.tag !== undefined ? String(item.tag) : `single_${item.id}`;
			if (!groupMap.has(tagKey)) {
				groupMap.set(tagKey, []);
			}
			groupMap.get(tagKey)!.push(item);
		});

		// 生成显示文本：每组的指标名称
		const displayList: string[] = [];
		groupMap.forEach((items) => {
			// 计算该组的总确认条数
			let totalCount = 0;
			items.forEach((item) => {
				const count = selectedChildIdsMap[item.id]?.length || 0;
				totalCount += count;
			});

			// 显示格式：指标名称1、指标名称2... 共X条
			const names = items.map((item) => item.name).join("、");
			displayList.push(`${names} ${addThousand(totalCount)}条`);
		});

		return displayList;
	}, [tableData, selectedChildIdsMap]);

	const limitIndicatorIds = useMemo(() => {
		return tableData.map((item) => String(item.id));
	}, [tableData]);

	const steps = [
		{
			title: "指标信息",
			content: (
				<div className="px-2">
					{/* 隐藏的表单字段，用于存储实际的指标 ID 值 */}
					<Form.Item
						name="indicators"
						rules={[{ required: true, message: "请选择提交指标" }]}
						hidden
					>
						<Input />
					</Form.Item>

					{/* 显示的表单项，用于展示选中信息 */}
					<Form.Item
						label="提交指标"
						extra={
							<div className="mt-1 flex items-center text-xs text-[#faad14]">
								<ExclamationCircleOutlined className="mr-1" />
								只有解锁状态下的已校验的指标才可以提交
							</div>
						}
					>
						<Input
							readOnly
							placeholder="请选择"
							value={
								selectedIndicatorIds.length > 0
									? `已选择 ${selectedIndicatorIds.length} 个指标`
									: ""
							}
							onClick={() => setIndicatorSelectorOpen(true)}
							style={{ cursor: "pointer" }}
							suffix={
								<Button
									type="link"
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										setIndicatorSelectorOpen(true);
									}}
								>
									选择
								</Button>
							}
						/>
					</Form.Item>
					<Form.Item label="确认数据量">
						<Table
							dataSource={tableData}
							columns={columns}
							rowKey="id"
							pagination={false}
							size="small"
							scroll={{ y: 400 }}
							bordered
						/>
					</Form.Item>
				</div>
			),
		},
		{
			title: "目标确认",
			content: (
				<div className="px-2">
					<Form.Item label="任务名称" name="taskName">
						<Input disabled />
					</Form.Item>
					<Form.Item label="提交时间" name="submitTime">
						<Input disabled />
					</Form.Item>
					<Form.Item label="提交版本" name="submitVersion">
						<Input disabled />
					</Form.Item>
					<Form.Item label="提交指标">
						<Space size={[8, 8]} wrap>
							{submitIndicatorsList.map((text, index) => (
								<span
									key={index}
									style={{
										backgroundColor: "rgba(235, 238, 245, 1)",
										padding: "4px 8px",
										borderRadius: "4px",
									}}
								>
									{text}
								</span>
							))}
						</Space>
					</Form.Item>

					<Form.Item
						label="是否进行确认"
						name="needConfirmation"
						rules={[{ required: true, message: "请选择是否进行确认" }]}
					>
						<Radio.Group>
							<Radio value={1}>是</Radio>
							<Radio value={0}>否</Radio>
						</Radio.Group>
					</Form.Item>

					{/* 确认子周期与「是否进行确认」解耦，默认始终渲染 */}
					<Form.Item label="确认子周期" name="confirmPeriod">
						<Select placeholder="请选择子确认周期" mode="multiple">
							{confirmCycles.map((item: any) => (
								<Select.Option key={item.id} value={item.id}>
									{item.name}
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						noStyle
						shouldUpdate={(prev, curr) =>
							prev.needConfirmation !== curr.needConfirmation
						}
					>
						{({ getFieldValue }) =>
							getFieldValue("needConfirmation") === 1 ? (
								<Form.Item label="确认流程">
									<Table
										dataSource={confirmProcessData}
										columns={confirmProcessColumns}
										rowKey="key"
										pagination={false}
										size="small"
										bordered
										summary={() => (
											<Table.Summary>
												<Table.Summary.Row>
													<Table.Summary.Cell index={0} colSpan={4}>
														<Button
															type="link"
															onClick={handleAddConfirmProcessRow}
														>
															+ 新增
														</Button>
													</Table.Summary.Cell>
												</Table.Summary.Row>
											</Table.Summary>
										)}
									/>
								</Form.Item>
							) : null
						}
					</Form.Item>

					<Form.Item
						label="是否流程报批"
						name="needApproval"
						rules={[{ required: true, message: "请选择是否流程报批" }]}
					>
						<Radio.Group>
							<Radio value={1}>是</Radio>
							<Radio value={0}>否</Radio>
						</Radio.Group>
					</Form.Item>

					<Form.Item
						noStyle
						shouldUpdate={(prev, curr) => prev.needApproval !== curr.needApproval}
					>
						{({ getFieldValue }) =>
							getFieldValue("needApproval") === 1 ? (
								<Form.Item
									label="流程报批类型"
									name="processApprovalType"
									rules={[{ required: true, message: "请选择流程报批类型" }]}
								>
									<Radio.Group>
										<Radio value={0}>集团报批</Radio>
										<Radio value={1}>地区内部报批</Radio>
									</Radio.Group>
								</Form.Item>
							) : null
						}
					</Form.Item>

					<Form.Item
						label="确认说明"
						name="confirmationInstructions"
						rules={[{ required: true, message: "请输入确认说明" }]}
					>
						<Input.TextArea
							rows={4}
							maxLength={500}
							showCount
							placeholder="请输入确认说明"
						/>
					</Form.Item>
				</div>
			),
		},
	];

	const next = () => {
		form.validateFields().then(async () => {
			// 如果是第一步，需要进行校验
			if (current === 0) {
				// 收集所有已选的 indicatorListOverviewIds
				const allSelectedOverviewIds = new Set<React.Key>();
				Object.values(selectedChildIdsMap).forEach((ids) => {
					ids.forEach((id) => allSelectedOverviewIds.add(id));
				});
				const indicatorListOverviewIds = Array.from(allSelectedOverviewIds);

				// 调用校验接口
				try {
					const result = await userIndicatorListCheckConfDetailGroup({
						indicatorListIds: selectedIndicatorIds,
						indicatorListOverviewIds,
					});

					if (result.code === 200 && result.data === true) {
						// 校验通过，进入下一步
						setCurrent(current + 1);
					} else {
						// 校验失败
						message.error(result.msg || "校验失败，请确保已选择完整的联动指标组");
					}
				} catch (error) {
					message.error("校验失败，请重试");
					console.error("校验接口调用失败", error);
				}
			} else {
				// 其他步骤直接进入下一步
				setCurrent(current + 1);
			}
		});
	};

	const prev = () => {
		setCurrent(current - 1);
	};

	const handleClose = () => {
		form.resetFields();
		setConfirmProcessData([]);
		setSelectedChildIdsMap({});
		setTableData([]);
		setSelectedIndicatorIds([]);
		onClose();
		// 重置步骤
		setTimeout(() => setCurrent(0), 300);
	};

	const footer = (
		<div style={{ textAlign: "right" }}>
			<Space>
				<Button onClick={handleClose}>取消</Button>
				{current > 0 && <Button onClick={() => prev()}>上一步</Button>}
				{current < steps.length - 1 && <Button onClick={() => next()}>下一步</Button>}
				{current === steps.length - 1 && (
					<Button
						type="primary"
						loading={confirmLoading}
						onClick={() => {
							form.validateFields()
								.then((values) => {
									setConfirmLoading(true);
									// Collect all selected IDs
									const allSelectedIds = new Set<React.Key>();
									Object.values(selectedChildIdsMap).forEach((ids) => {
										ids.forEach((id) => allSelectedIds.add(id));
									});
									const indicatorListOverviewIds = Array.from(allSelectedIds);

									const workflowDefinition = confirmProcessData.map(
										(item, index) => {
											let confirmUserIds: any[] = [];
											if (item.stepType === 0 && item.confirmerId) {
												confirmUserIds = [
													{
														responsiblePersonId: item.confirmerId,
														targetOrgCode: "123",
													},
												];
											} else if (item.stepType === 1) {
												confirmUserIds = confirmUserIdsList;
											}

											return {
												step: index,
												stepName: item.stepName,
												stepType: item.stepType,
												confirmUserIds,
											};
										},
									);

									const payload = {
										effTaskIndicatorSubmitUserId,
										submitVersion: values.submitVersion,
										submitDate: values.submitTime,
										name: values.taskName,
										submitIndicators: submitIndicatorsList,
										needConfirmation: values.needConfirmation,
										// 确认子周期已与「是否进行确认」解耦，始终提交所选值
										confirmationCycle: values.confirmPeriod,
										needApproval: values.needApproval,
										processApprovalType:
											values.needApproval === 1
												? values.processApprovalType
												: undefined,
										indicatorListOverviewIds,
										workflowDefinition,
										confirmationInstructions: values.confirmationInstructions,
									};

									submitConfirmSubmit(payload)
										.then((res: any) => {
											if (res.code === 200) {
												message.success("提交成功");
												handleClose();
											} else {
												message.error(res.msg || "提交失败");
											}
										})
										.finally(() => {
											setConfirmLoading(false);
										});
								})
								.catch(() => {
									setConfirmLoading(false);
								});
						}}
					>
						确定
					</Button>
				)}
			</Space>
		</div>
	);

	return (
		<Drawer
			title="提交"
			width={800}
			open={open}
			footer={footer}
			{...commonDrawerProps(handleClose)}
		>
			<div className="px-8">
				<div style={{ width: "50%", margin: "0 auto" }}>
					<Steps
						labelPlacement="vertical"
						size="small"
						current={current}
						items={steps.map((item) => ({ key: item.title, title: item.title }))}
					/>
				</div>
				<div style={{ marginTop: 24 }}>
					<Form
						form={form}
						layout="horizontal"
						colon={false}
						labelCol={{ span: 4 }}
						wrapperCol={{ span: 20 }}
					>
						{steps[current].content}
					</Form>
				</div>
			</div>
			<DataQuantityDrawer
				open={dataQuantityDrawerOpen}
				onClose={() => setDataQuantityDrawerOpen(false)}
				onCommit={handleDataQuantityCommit}
				effTaskIndicatorSubmitUserId={effTaskIndicatorSubmitUserId}
				defaultSelectedKey={targetIndicatorId}
				initialSelectedChildIdsMap={selectedChildIdsMap}
				limitIndicatorIds={limitIndicatorIds}
			/>
			<PersonCreateModal
				open={personModalOpen}
				onClose={handlePersonModalClose}
				titleLabel="下发前确认人"
				single={true}
			/>
			<ConfirmUserDrawer
				open={confirmUserDrawerOpen}
				onClose={() => setConfirmUserDrawerOpen(false)}
				ids={indicatorIds}
				subperiods={form.getFieldValue("confirmPeriod")}
			/>
			<SubmitIndicatorSelector
				open={indicatorSelectorOpen}
				onClose={() => setIndicatorSelectorOpen(false)}
				allIndicators={flatIndicatorsList}
				value={selectedIndicatorIds}
				onChange={handleIndicatorSelectionChange}
			/>
		</Drawer>
	);
}
