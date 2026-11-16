import { fetchReferenceTargetOrg } from "#src/api/strategy";
import { Button, Col, ConfigProvider, Form, Input, message, Modal, Row, Space, Table } from "antd";
import zhCN from "antd/locale/zh_CN";
import React, { useState } from "react";

interface Props {
	open: boolean;
	onClose: (res?: any) => void;
	effTaskIndicatorConfDetailsId?: string | number;
	effTaskIndicatorConfDetailsReferenceId?: string | number;
	disabledKeys?: React.Key[];
	excludeIndicators?: any[];
}

interface Item {
	key: string;
	name: string;
	dept: string;
	unit: string;
	definition: string;
	[key: string]: any;
}

export default function AddManualImportModal({
	open,
	onClose,
	effTaskIndicatorConfDetailsReferenceId,
	disabledKeys = [],
	excludeIndicators,
}: Props) {
	const [form] = Form.useForm();

	const [data, setData] = React.useState<Item[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [total, setTotal] = React.useState(0);

	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
	const [selectedRows, setSelectedRows] = React.useState<Item[]>([]);

	const [suspendedVersion, setSuspendedVersion] = React.useState<string>("");
	const [importDelIds] = React.useState<string[]>([]);

	const genSuspendedVersion = () =>
		`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	const loadData = React.useCallback(
		async (
			p = 1,
			size = 10,
			_overrideDelIds?: string[],
			_suspendedVersionOverride?: string,
		) => {
			setLoading(true);
			try {
				if (!effTaskIndicatorConfDetailsReferenceId) {
					setData([]);
					setTotal(0);
					return;
				}
				const resp: any = await fetchReferenceTargetOrg({
					effTaskIndicatorConfDetailsReferenceId,
					pageNum: p,
					pageSize: size,
					excludeIndicators,
					...form.getFieldsValue(),
				});

				let list: any[] = [];
				let totalCount = 0;

				if (!resp) {
					list = [];
				} else if (Array.isArray(resp)) {
					list = resp;
					totalCount = resp.length;
				} else {
					if (Array.isArray(resp.list)) list = resp.list;
					else if (Array.isArray(resp.data)) list = resp.data;

					totalCount = resp.total || resp.totalCount || list.length || 0;
				}

				const items = list.map((it: any) => ({
					...it,
					key: it.id || it.key || Math.random().toString(),
					name: it.name || it.orgName || it.targetOrgDesc || "",
				}));

				setData(items);
				setTotal(totalCount);
				setPage(p);
				setPageSize(size);
			} catch (e) {
				console.error("load data failed", e);
			} finally {
				setLoading(false);
			}
		},
		[effTaskIndicatorConfDetailsReferenceId, form, excludeIndicators],
	);

	React.useEffect(() => {
		if (open) {
			setSelectedKeys([]);
			setSelectedRows([]);
			// Generate new suspendedVersion if not exists?
			// Or just load. PlanPermissionsDrawer generates it if empty.
			let sv = suspendedVersion;
			if (!sv) {
				sv = genSuspendedVersion();
				setSuspendedVersion(sv);
			}
			loadData(1, 10, undefined, sv);
		}
	}, [open]);

	const handleSearch = () => {
		loadData(1, pageSize);
	};

	const handleReset = () => {
		form.resetFields();
		loadData(1, pageSize);
	};

	const columns = [
		{ title: "主数据编码", dataIndex: "targetOrgCode", key: "targetOrgCode", ellipsis: true },
		// Adjust columns based on actual data
		{ title: "组织名称", dataIndex: "targetOrgName", key: "targetOrgName", ellipsis: true },
	];

	const rowSelection = {
		selectedRowKeys: selectedKeys,
		preserveSelectedRowKeys: true,
		onChange: (keys: React.Key[], rows: Item[]) => {
			setSelectedKeys(keys);
			setSelectedRows((prev) => {
				const newRows: Item[] = [];
				const seenKeys = new Set<React.Key>();

				prev.forEach((row) => {
					if (keys.includes(row.targetOrgCode)) {
						newRows.push(row);
						seenKeys.add(row.targetOrgCode);
					}
				});

				rows.forEach((row) => {
					if (!seenKeys.has(row.targetOrgCode)) {
						newRows.push(row);
						seenKeys.add(row.targetOrgCode);
					}
				});

				return newRows;
			});
		},
		getCheckboxProps: (record: Item) => {
			return {
				disabled: disabledKeys.includes(record.targetOrgCode),
			};
		},
	};

	const removeSelected = (targetOrgCode: string) => {
		const nextKeys = selectedKeys.filter((k) => k !== targetOrgCode);
		const nextRows = selectedRows.filter((r) => r.targetOrgCode !== targetOrgCode);
		setSelectedKeys(nextKeys);
		setSelectedRows(nextRows);
	};

	const clearSelected = () => {
		setSelectedKeys([]);
		setSelectedRows([]);
	};

	const handleOk = async () => {
		if (!selectedKeys || selectedKeys.length === 0) {
			message.warning("请先选择要添加的数据");
			return;
		}

		setConfirmLoading(true);

		// Return selected rows and suspendedVersion info
		setConfirmLoading(false);
		onClose?.({
			saved: true,
			data: selectedRows,
			suspendedVersion,
			importDelIds,
		});
	};

	return (
		<Modal
			title="新增"
			width={856}
			open={open}
			onCancel={() => {
				onClose();
			}}
			onOk={handleOk}
			confirmLoading={confirmLoading}
			destroyOnHidden
		>
			<Form form={form} layout="inline" className="mb-4 w-full">
				<Form.Item name="name" label={null} className="flex-1">
					<Input
						placeholder="组织名称"
						addonBefore={<span className="mr-1">组织名称</span>}
					/>
				</Form.Item>

				<Form.Item className="ml-auto">
					<Space>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</Space>
				</Form.Item>
			</Form>

			<Row gutter={16}>
				<Col span={16}>
					<div className="rounded bg-white">
						<ConfigProvider locale={zhCN}>
							<Table
								rowKey="targetOrgCode"
								columns={columns}
								dataSource={data}
								loading={loading}
								rowSelection={rowSelection}
								pagination={{
									current: page,
									pageSize,
									total,
									showSizeChanger: true,
									onChange: (p, ps) => {
										loadData(p, ps || pageSize);
									},
									showTotal: (total) =>
										`已选 ${selectedRows.length} / 共 ${total} 条`,
								}}
								size="small"
							/>
						</ConfigProvider>
					</div>
				</Col>

				<Col span={8}>
					<div className="flex h-full flex-col rounded border border-gray-200 p-3">
						<div className="mb-3 flex shrink-0 items-center justify-between">
							<div className="font-medium">
								已选(
								{selectedRows.length})
							</div>
							<Button size="small" onClick={clearSelected} type="link">
								清空
							</Button>
						</div>

						<div
							className="flex flex-1 flex-col gap-2 overflow-y-auto"
							style={{ maxHeight: 400 }}
						>
							{selectedRows.length === 0 && (
								<div className="text-sm text-gray-500">未选中任何数据</div>
							)}
							{selectedRows.map((r) => (
								<div
									key={r.key}
									className="flex shrink-0 items-center rounded bg-[rgba(240,242,245,1)] px-2 py-1"
								>
									<div className="mr-2 text-sm">{r.targetOrgName}</div>
									<Button
										className="ml-auto text-sm"
										size="small"
										type="text"
										onClick={() => removeSelected(r.targetOrgCode)}
									>
										X
									</Button>
								</div>
							))}
						</div>
					</div>
				</Col>
			</Row>
		</Modal>
	);
}
