import type { ColumnsType } from "antd/es/table";
import { Button, Col, Form, Input, List, Modal, Row, Select, Table } from "antd";
import React from "react";

interface Metric {
	id: string;
	name: string;
	ownerDept: string;
	unit: string;
	definition: string;
}

interface Props {
	open: boolean;
	initialSelected?: Metric[];
	onClose: (res?: Metric[] | null) => void;
}

const mockMetrics: Metric[] = [
	{ id: "m1", name: "指标A", ownerDept: "产品部", unit: "人", definition: "指标A的定义与口径" },
	{ id: "m2", name: "指标B", ownerDept: "研发部", unit: "次", definition: "指标B的定义与口径" },
	{ id: "m3", name: "指标C", ownerDept: "财务部", unit: "元", definition: "指标C的定义与口径" },
	{ id: "m4", name: "指标D", ownerDept: "运营部", unit: "笔", definition: "指标D的定义与口径" },
];

const DEFAULT_INITIAL_SELECTED: Metric[] = [];

export default function DecomposeMetricModal({
	open,
	initialSelected = DEFAULT_INITIAL_SELECTED,
	onClose,
}: Props) {
	const [form] = Form.useForm();
	const [data, setData] = React.useState<Metric[]>(mockMetrics);
	// keep keys as strings to avoid type mismatches between table row keys and incoming values
	const [selectedKeys, setSelectedKeys] = React.useState<React.Key[]>(
		initialSelected.map((s) => String(s.id)),
	);

	// synchronize initialSelected into state only when the modal opens
	React.useEffect(() => {
		if (open) {
			setSelectedKeys(initialSelected.map((s) => String(s.id)));
		}
	}, [open]);

	const columns: ColumnsType<Metric> = [
		{ title: "指标名称", dataIndex: "name", key: "name" },
		{ title: "主责部门", dataIndex: "ownerDept", key: "ownerDept" },
		{ title: "单位", dataIndex: "unit", key: "unit" },
		{ title: "指标定义及口径", dataIndex: "definition", key: "definition" },
	];

	const onSearch = () => {
		const v = form.getFieldsValue();
		const name = (v.metricName || "").trim();
		const dept = v.ownerDept;
		const filtered = mockMetrics.filter((m) => {
			if (name && !m.name.includes(name)) return false;
			if (dept && dept !== "all" && m.ownerDept !== dept) return false;
			return true;
		});
		setData(filtered);
	};

	const rowSelection = {
		selectedRowKeys: selectedKeys,
		onChange: (keys: React.Key[]) => {
			setSelectedKeys(keys.map((k) => String(k)));
		},
	};

	const selectedItems = React.useMemo(
		() => mockMetrics.filter((m) => selectedKeys.includes(String(m.id))),
		[selectedKeys],
	);

	const handleOk = () => {
		onClose(selectedItems);
	};

	const handleCancel = () => onClose(null);

	return (
		<Modal
			title="拆解指标"
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			width={900}
			styles={{ body: { padding: "12px 0", minHeight: 600 } }}
		>
			<Form form={form} layout="inline" style={{ marginBottom: 12 }}>
				<Form.Item name="metricName">
					<Input allowClear prefix="指标名称" placeholder="支持模糊搜索" />
				</Form.Item>
				<Form.Item name="ownerDept">
					<Select style={{ width: 200 }} allowClear prefix="主责部门" defaultValue="all">
						<Select.Option value="all">全部</Select.Option>
						<Select.Option value="产品部">产品部</Select.Option>
						<Select.Option value="研发部">研发部</Select.Option>
						<Select.Option value="财务部">财务部</Select.Option>
						<Select.Option value="运营部">运营部</Select.Option>
					</Select>
				</Form.Item>
				<Form.Item style={{ marginLeft: "auto" }}>
					<Button type="primary" onClick={onSearch}>
						查询
					</Button>
					<Button type="link" onClick={onSearch}>
						重置
					</Button>
				</Form.Item>
			</Form>

			<Row gutter={12}>
				<Col span={16}>
					<Table
						rowKey="id"
						dataSource={data}
						columns={columns}
						size="small"
						pagination={{ pageSize: 6 }}
						rowSelection={{ type: "checkbox", ...rowSelection }}
					/>
				</Col>
				<Col span={8}>
					<div style={{ marginBottom: 8, fontWeight: 600 }}>
						已选(
						{selectedItems.length})
					</div>
					<List
						dataSource={selectedItems}
						renderItem={(item) => (
							<List.Item
								style={{
									padding: 6,
									background: "#f0f2f5",
									marginBottom: 4,
									height: 30,
								}}
							>
								<div
									style={{
										display: "flex",
										gap: 8,
										alignItems: "center",
										width: "100%",
									}}
								>
									<div style={{ flex: 1, padding: "8px 10px", borderRadius: 6 }}>
										<div style={{ fontWeight: 600 }}>{item.name}</div>
									</div>
									<Button
										type="link"
										onClick={() =>
											setSelectedKeys((prev) =>
												prev.filter((k) => String(k) !== String(item.id)),
											)
										}
									>
										X
									</Button>
								</div>
							</List.Item>
						)}
					/>
				</Col>
			</Row>
		</Modal>
	);
}
