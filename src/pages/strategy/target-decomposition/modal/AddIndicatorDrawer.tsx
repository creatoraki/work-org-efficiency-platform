import { indicatorConfDetailsAdd } from "#src/api/strategy";
import { pageRetrieveConfDetailsSelected } from "#src/api/strategy/indicator-config";
import {
	Button,
	Col,
	ConfigProvider,
	Form,
	Input,
	message,
	Modal,
	Row,
	Select,
	Space,
	Table,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import React, { useState } from "react";
import { RESPONSIBLE_DEPARTMENTS } from "../../target-management/constants/indicator";
import { IndicatorContext } from "./IndicatorConfigDrawer";

interface Props {
	open: boolean;
	onClose: (res?: any) => void;
	effTaskIndicatorConfId?: string | number;
	isSelectionOnly?: boolean;
	title?: string;
	customFetch?: (params: any) => Promise<any>;
	/** customFetch 是否启用分页，默认 false（兼容历史全量场景） */
	customFetchPagination?: boolean;
	customSubmit?: (keys: React.Key[], rows: any[]) => Promise<any>;
	defaultSelected?: any[] | Record<string, any>;
	type?: 0 | 1;
}

interface Item {
	key: string;
	name: string;
	dept: string;
	unit: string;
	definition: string;
}

// data will be loaded from backend via pageRetrieveConfDetailsSelected

export default function AddIndicatorDrawer({
	open,
	onClose,
	effTaskIndicatorConfId,
	isSelectionOnly,
	title,
	customFetch,
	customFetchPagination = false,
	customSubmit,
	defaultSelected = [],
	type,
}: Props) {
	const [form] = Form.useForm();
	const indicatorContext = React.useContext(IndicatorContext);
	const [data, setData] = React.useState<Item[]>([]);
	const [, setFiltered] = React.useState<Item[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [total, setTotal] = React.useState(0);

	const [page, setPage] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);

	const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>([]);
	const [selectedRows, setSelectedRows] = React.useState<Item[]>([]);

	const defaultSelectedKey = React.useMemo(() => {
		return JSON.stringify(defaultSelected || []);
	}, [defaultSelected]);

	React.useEffect(() => {
		if (open) {
			if (Array.isArray(defaultSelected) && defaultSelected.length > 0) {
				const normalized = defaultSelected.map((i: any) => ({
					...i,
					key: String(i.id || i.indicatorId || i.key),
				}));
				const keys = normalized.map((i: any) => String(i.id || i.indicatorId || i.key));
				setSelectedKeys(keys);
				setSelectedRows(normalized);
			} else if (
				defaultSelected &&
				typeof defaultSelected === "object" &&
				!Array.isArray(defaultSelected)
			) {
				const normalized: any[] = [];
				const keys: React.Key[] = [];
				Object.entries(defaultSelected).forEach(([k, v]) => {
					normalized.push({
						key: String(k),
						indicatorId: String(k),
						id: String(k),
						name: v,
					});
					keys.push(String(k));
				});
				setSelectedKeys(keys);
				setSelectedRows(normalized);
			} else {
				setSelectedKeys([]);
				setSelectedRows([]);
			}
		}
	}, [open, defaultSelectedKey]);

	React.useEffect(() => setFiltered(data), [data]);

	const effTargetPlanIdFromContext = React.useMemo(() => {
		const info = indicatorContext.indicatorConfigInfo;
		if (!info) return undefined;
		if (typeof info.targetPlanId === "number") return info.targetPlanId;
		return undefined;
	}, [indicatorContext.indicatorConfigInfo]);

	// loader used by search and when drawer opens
	const loadIndicators = React.useCallback(
		async (params?: {
			name?: string;
			responsibleDepartmentCode?: number;
			pageNum: number;
			pageSize: number;
			effTargetPlanId?: number;
		}) => {
			setLoading(true);
			try {
				const resolvedEffTargetPlanId =
					params && typeof params.effTargetPlanId === "number"
						? params.effTargetPlanId
						: effTargetPlanIdFromContext;
				const fetchParams = { ...params, effTargetPlanId: resolvedEffTargetPlanId, type };
				const resp: any = customFetch
					? await customFetch(fetchParams)
					: await pageRetrieveConfDetailsSelected((fetchParams ?? {}) as any);

				const list: any[] = Array.isArray(resp?.data?.list) ? resp.data.list : [];
				setData(list);
				setTotal(resp?.data?.total || list.length || 0);
				if (params?.pageNum) {
					setPage(params.pageNum);
				}
			} catch (e) {
				console.error("load indicators failed", e);
			} finally {
				setLoading(false);
			}
		},
		[customFetch, effTargetPlanIdFromContext, type],
	);

	React.useEffect(() => {
		if (open) loadIndicators({ pageNum: 1, pageSize: 10 });
	}, [open, loadIndicators]);

	const handleSearch = () => {
		const vals = form.getFieldsValue();
		const name = (vals.name || "").trim();
		const payload = {
			name,
			responsibleDepartmentCode: vals.responsibleDepartmentCode,
			pageNum: 1,
			pageSize,
		};
		loadIndicators(payload);
	};

	const handleReset = () => {
		form.resetFields();
		loadIndicators({ pageNum: 1, pageSize });
	};

	const columns = [
		{ title: "指标名称", dataIndex: "name", key: "name", ellipsis: true },
		{
			title: "主责部门",
			width: 120,
			dataIndex: "responsibleDepartment",
			key: "responsibleDepartment",
			ellipsis: true,
		},
		{ title: "单位", width: 50, dataIndex: "unitName", key: "unitName" },
		{ title: "指标定义及口径", dataIndex: "definition", key: "definition", ellipsis: true },
	];

	const shouldShowPagination = !customFetch || customFetchPagination;

	const rowSelection = {
		selectedRowKeys: selectedKeys,
		preserveSelectedRowKeys: true,
		onChange: (keys: React.Key[], rows: Item[]) => {
			const map = new Map<string, Item>();
			// 存入旧的选中行
			selectedRows.forEach((r) => {
				if (r) {
					const k = String((r as any).id || (r as any).indicatorId || r.key);
					map.set(k, r);
				}
			});
			// 存入当前页选中的行（覆盖旧的）
			rows.forEach((r) => {
				if (r) {
					const k = String((r as any).id || (r as any).indicatorId || r.key);
					map.set(k, { ...r, key: k });
				}
			});

			const nextRows: Item[] = [];
			keys.forEach((k) => {
				const keyStr = String(k);
				if (map.has(keyStr)) {
					nextRows.push(map.get(keyStr)!);
				}
			});

			setSelectedKeys(keys);
			setSelectedRows(nextRows);
		},
	};

	const removeSelected = (key: string) => {
		const nextKeys = selectedKeys.filter((k) => k !== key);
		const nextRows = selectedRows.filter((r) => r.key !== key);
		setSelectedKeys(nextKeys);
		setSelectedRows(nextRows);
	};

	const clearSelected = () => {
		setSelectedKeys([]);
		setSelectedRows([]);
	};

	const handleOk = async () => {
		if (!selectedKeys || selectedKeys.length === 0) {
			message.warning("请先选择要添加的指标");
			return;
		}

		if (customSubmit) {
			setConfirmLoading(true);
			try {
				const success = await customSubmit(selectedKeys, selectedRows);
				if (success) {
					onClose?.({ saved: true });
				}
			} catch (e) {
				console.error(e);
				message.error("操作失败");
			} finally {
				setConfirmLoading(false);
			}
			return;
		}

		if (isSelectionOnly) {
			onClose?.({ saved: true, selectedKeys, selectedRows });
			return;
		}

		const payload = {
			effTaskIndicatorConfId,
			indicatorIds: selectedKeys,
		} as any;

		setConfirmLoading(true);
		try {
			const resp = await indicatorConfDetailsAdd(payload);
			if (resp) {
				onClose?.({ saved: true, data: resp });
			} else {
				message.error("添加失败，请重试");
			}
		} catch (e) {
			console.error(e);
			message.error("添加失败，请检查控制台错误");
		} finally {
			setConfirmLoading(false);
		}
	};

	return (
		<Modal
			title={title || "新增指标"}
			width={856}
			open={open}
			onCancel={() => {
				onClose();
			}}
			onOk={handleOk}
			confirmLoading={confirmLoading}
		>
			<Form form={form} layout="inline" className="mb-4 w-full">
				<Form.Item name="name" label={null} className="flex-1">
					<Input placeholder=" 支持模糊搜索" prefix="指标名称" />
				</Form.Item>

				<Form.Item name="responsibleDepartmentCode">
					<Select
						prefix="主责部门"
						allowClear
						placeholder=" 全部"
						style={{ minWidth: 260 }}
						options={RESPONSIBLE_DEPARTMENTS}
					></Select>
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
								rowKey={(r: any) => String(r.id || r.indicatorId || r.key)}
								columns={columns}
								dataSource={data}
								loading={loading}
								rowSelection={rowSelection}
								scroll={{ y: 360 }}
								pagination={
									shouldShowPagination
										? {
												current: page,
												pageSize,
												total,
												showSizeChanger: true,
												onChange: (p, ps) => {
													const vals = form.getFieldsValue();
													const name = (vals.name || "").trim();
													loadIndicators({
														name,
														responsibleDepartmentCode:
															vals.responsibleDepartmentCode,
														pageNum: p,
														pageSize: ps || pageSize,
													});
													if (ps && ps !== pageSize) setPageSize(ps);
												},
												showTotal: (total) =>
													`已选 ${selectedRows.length} / 共 ${total} 条`,
											}
										: false
								}
								size="small"
							/>
						</ConfigProvider>
					</div>
				</Col>

				<Col span={8}>
					<div
						className="flex h-full flex-col rounded border border-gray-200 p-3"
						style={{ maxHeight: 500 }}
					>
						<div className="mb-3 flex flex-shrink-0 items-center justify-between">
							<div className="font-medium">
								已选(
								{selectedRows.length})
							</div>
							<Button size="small" onClick={clearSelected} type="link">
								清空
							</Button>
						</div>

						<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
							{selectedRows.length === 0 && (
								<div className="text-sm text-gray-500">未选中任何指标</div>
							)}
							{selectedRows.map((r) => (
								<div
									key={r.key}
									className="flex flex-shrink-0 items-center rounded bg-[rgba(240,242,245,1)] px-2 py-1"
								>
									<div className="mr-2 text-sm">{r.name}</div>
									<Button
										className="ml-auto text-sm"
										size="small"
										type="text"
										onClick={() => removeSelected(r.key)}
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
