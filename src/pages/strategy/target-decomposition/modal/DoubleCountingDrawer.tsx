import { fetchDoubleCountingList, submitDoubleCounting } from "#src/api/strategy/target-filling";
import DoubleCountIcon from "#src/assets/small-icons/target-filling/double-count.svg?react";
import { useGlobalStore } from "#src/store";
import { addThousand } from "#src/utils/add-thousand";
import {
	Button,
	ConfigProvider,
	Drawer,
	Form,
	Input,
	message,
	Space,
	Table,
	TreeSelect,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import React, { useEffect, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";

// 获取树节点的完整路径（从根到该节点）
function getNodeFullPath(treeData: any[], targetKey: string, path: string[] = []): string {
	for (const node of treeData) {
		const currentPath = [...path, node.title];
		if (node.key === targetKey) {
			return currentPath.join("|");
		}
		if (node.children && node.children.length > 0) {
			const result = getNodeFullPath(node.children, targetKey, currentPath);
			if (result) {
				return result;
			}
		}
	}
	return "";
}

// 获取树节点的完整编码路径（从根到该节点）
function getNodeFullCodePath(treeData: any[], targetKey: string, path: string[] = []): string {
	for (const node of treeData) {
		const currentPath = [...path, node.key];
		if (node.key === targetKey) {
			return currentPath.join("|");
		}
		if (node.children && node.children.length > 0) {
			const result = getNodeFullCodePath(node.children, targetKey, currentPath);
			if (result) {
				return result;
			}
		}
	}
	return "";
}

// 获取树节点的 oepOrgUuid
function getNodeOepOrgUuid(treeData: any[], targetKey: string): string | undefined {
	for (const node of treeData) {
		if (node.key === targetKey) {
			return node.oepOrgUuid;
		}
		if (node.children && node.children.length > 0) {
			const result = getNodeOepOrgUuid(node.children, targetKey);
			if (result) {
				return result;
			}
		}
	}
	return undefined;
}

interface Props {
	open: boolean;
	onClose: () => void;
	listOverviewId?: number | string | null;
	targetOrgCodeP?: string;
	// 顶部信息（需要从父组件传入）
	decomposeObject?: string;
	indicator?: string;
	targetValue?: number;
	// 提交后的回调，用于刷新外层列表
	onRefresh?: () => void;
}

export default function DoubleCountingDrawer({
	open,
	onClose,
	listOverviewId,
	targetOrgCodeP,
	decomposeObject,
	indicator,
	targetValue,
	onRefresh,
}: Props) {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [, setRefresh] = useState(0);
	const [delIds, setDelIds] = useState<string[]>([]);
	const { oepOrgTree, loadOepOrgTree } = useGlobalStore();

	useEffect(() => {
		if (!open || listOverviewId === null || listOverviewId === undefined) return;
		setLoading(true);
		setDelIds([]);
		fetchDoubleCountingList({
			listOverviewId: Number(listOverviewId),
			...(targetOrgCodeP ? { targetOrgCodeP } : {}),
		})
			.then((res) => {
				if (res && res.data) {
					form.setFieldValue("items", res.data || []);
				}
			})
			.finally(() => {
				setLoading(false);
			});
	}, [open, listOverviewId, targetOrgCodeP, form]);

	useEffect(() => {
		loadOepOrgTree();
	}, [loadOepOrgTree]);

	const handleConfirm = async () => {
		setSaving(true);
		try {
			// const values = await form.validateFields();
			const items = form.getFieldValue("items") || [];
			const delIdSet = new Set(delIds.map(String));

			// 构建提交参数
			const submitParams = {
				effTaskIndicatorSubmitIndicatorListOverviewId: Number(listOverviewId),
				delIds,
				addRecords: items
					.filter((item: any) => !item.id)
					.map((item: any) => ({
						doubleCounting: item.doubleCounting,
						targetOrgCodeP: item.targetOrgCodeP,
						targetOrgNameP: item.targetOrgNameP,
						ancestorcodep: item.ancestorcodep,
						ancestornamep: item.ancestornamep,
						oepOrgUuidP: item.oepOrgUuidP,
						parentSummaryWeight: Number(item.parentSummaryWeight) || 0,
					})),
				upRecords: items
					.filter((item: any) => item.id && !delIdSet.has(String(item.id)))
					.map((item: any) => ({
						id: item.id,
						oepOrgUuidP: item.oepOrgUuidP,
						parentSummaryWeight: Number(item.parentSummaryWeight) || 0,
					})),
			};

			const res = await submitDoubleCounting(submitParams);
			if (res?.data) {
				message.success("提交成功");
				onClose();
				onRefresh?.();
			}
		} catch (error) {
			console.error("表单验证失败:", error);
		} finally {
			setSaving(false);
		}
	};

	const handleAddRow = () => {
		const items = form.getFieldValue("items") || [];
		form.setFieldValue("items", [...items, { doubleCounting: 0 }]);
		// 触发重新渲染
		setRefresh((prev) => prev + 1);
	};

	const handleDeleteRow = (index: number) => {
		const items = form.getFieldValue("items") || [];
		const current = items[index];
		if (current?.id) {
			setDelIds((prev) => Array.from(new Set([...prev, current.id])));
		}
		form.setFieldValue(
			"items",
			items.filter((_: any, i: number) => i !== index),
		);
		// 触发重新渲染
		setRefresh((prev) => prev + 1);
	};

	const columns = [
		{
			title: "主数据编码",
			dataIndex: ["targetOrgCodeP"],
			key: "targetOrgCodeP",
			width: "12%",
			render: (_: any, record: any, index: number) => (
				<Form.Item name={["items", index, "targetOrgCodeP"]} noStyle>
					<Input disabled className="bg-gray-50" />
				</Form.Item>
			),
		},
		{
			title: "上级归属",
			dataIndex: ["targetOrgNameP"],
			key: "targetOrgNameP",
			width: "20%",
			render: (_: any, record: any, index: number) => (
				<Form.Item
					name={["items", index, "targetOrgCodeP"]}
					initialValue={record.targetOrgCodeP}
					noStyle
				>
					<TreeSelect
						treeData={oepOrgTree}
						fieldNames={{ label: "title", value: "key", children: "children" }}
						placeholder="请选择"
						showSearch
						treeNodeFilterProp="title"
						popupMatchSelectWidth={false}
						disabled={record.doubleCounting === 1}
						style={{ width: "100%" }}
						styles={{
							popup: {
								root: {
									width: 500,
								},
							},
						}}
						onChange={(value) => {
							// 获取选中节点的完整路径（名称和编码）
							const fullPath = getNodeFullPath(oepOrgTree, value);
							const fullCodePath = getNodeFullCodePath(oepOrgTree, value);
							const oepOrgUuid = getNodeOepOrgUuid(oepOrgTree, value);
							// 获取选中节点的名称
							const findNodeTitle = (treeData: any[], targetKey: string): string => {
								for (const node of treeData) {
									if (node.key === targetKey) {
										return node.title;
									}
									if (node.children && node.children.length > 0) {
										const result = findNodeTitle(node.children, targetKey);
										if (result) {
											return result;
										}
									}
								}
								return "";
							};
							const nodeTitle = findNodeTitle(oepOrgTree, value);
							// 更新该行的 targetOrgNameP、ancestornamep、ancestorcodep 和 oepOrgUuidP
							const items = form.getFieldValue("items");
							items[index].targetOrgCodeP = value;
							items[index].targetOrgNameP = nodeTitle;
							items[index].ancestornamep = fullPath;
							items[index].ancestorcodep = fullCodePath;
							items[index].oepOrgUuidP = oepOrgUuid;
							form.setFieldValue("items", [...items]);
							// 触发重新渲染
							setRefresh((prev) => prev + 1);
						}}
					/>
				</Form.Item>
			),
		},
		{
			title: "所属组织",
			dataIndex: ["ancestornamep"],
			key: "ancestornamep",
			render: (_: any, record: any) => (
				<div className="text-sm text-gray-700">{record.ancestornamep || "未选择"}</div>
			),
		},
		{
			title: "权重(%)",
			dataIndex: ["parentSummaryWeight"],
			key: "parentSummaryWeight",
			width: "12%",
			render: (_: any, record: any, index: number) => (
				<Form.Item
					name={["items", index, "parentSummaryWeight"]}
					noStyle
					rules={[
						{ required: true, message: "权重不能为空" },
						{
							pattern: /^(?:\d+(?:\.\d+)?|\.\d+)$/,
							message: "请输入有效的数字",
						},
					]}
				>
					<Input type="number" placeholder="请输入权重" addonAfter="%" />
				</Form.Item>
			),
		},
		{
			title: "操作",
			key: "action",
			width: "8%",
			align: "center" as const,
			render: (_: any, record: any, index: number) => {
				// 第一行（默认行）不可删除，其他行可删除
				const canDelete = record.doubleCounting !== 1;

				return canDelete ? (
					<Button type="link" size="small" onClick={() => handleDeleteRow(index)}>
						删除
					</Button>
				) : null;
			},
		},
	];

	return (
		<Drawer
			title="双算"
			width={1000}
			open={open}
			{...commonDrawerProps(onClose)}
			footer={
				<div className="flex justify-end">
					<Space>
						<Button onClick={onClose}>取消</Button>
						<Button type="primary" onClick={handleConfirm} loading={saving}>
							确定
						</Button>
					</Space>
				</div>
			}
		>
			{/* 顶部信息展示区域 - 参考 StatsCards 样式 */}
			<div className="mb-6 flex gap-3">
				{/* 拆解对象 */}
				<div className="flex flex-1 flex-col justify-center rounded-md bg-[rgba(245,247,250,1)] p-4">
					<div className="flex items-center justify-between text-sm text-[rgba(96,98,102,1)]">
						<span>拆解对象</span>
						<DoubleCountIcon />
					</div>
					<div className="mt-1.5 text-sm font-semibold">
						{decomposeObject || "未填写"}
					</div>
				</div>

				{/* 指标 */}
				<div className="flex flex-1 flex-col justify-center rounded-md bg-[rgba(245,247,250,1)] p-4">
					<div className="flex items-center justify-between text-sm text-[rgba(96,98,102,1)]">
						<span>指标</span>
						<DoubleCountIcon />
					</div>
					<div className="mt-1.5 text-sm">{indicator || "未填写"}</div>
				</div>

				{/* 目标值 */}
				<div className="flex flex-1 flex-col justify-center rounded-md bg-[rgba(245,247,250,1)] p-4">
					<div className="flex items-center justify-between text-sm text-[rgba(96,98,102,1)]">
						<span>目标值(万元)</span>
						<DoubleCountIcon />
					</div>
					<div className="mt-1.5 text-sm">
						{targetValue !== undefined ? addThousand(targetValue) : "0"}
					</div>
				</div>
			</div>

			{/* Table 表格 */}
			<Form form={form} layout="vertical" autoComplete="off" className="w-full">
				<ConfigProvider locale={zhCN}>
					<Table
						dataSource={form.getFieldValue("items") || []}
						columns={columns}
						loading={loading}
						rowKey={(_, index) => String(index)}
						bordered
						size="small"
						pagination={false}
						className="w-full"
						summary={() => (
							<Table.Summary>
								<Table.Summary.Row>
									<Table.Summary.Cell index={0} colSpan={columns.length}>
										<Button type="link" className="pl-0" onClick={handleAddRow}>
											+ 新增
										</Button>
									</Table.Summary.Cell>
								</Table.Summary.Row>
							</Table.Summary>
						)}
					/>
				</ConfigProvider>
			</Form>
		</Drawer>
	);
}
