import type { OperationLogItem } from "#src/api/strategy/target-confirm";
import { fetchOperationLogList } from "#src/api/strategy/target-confirm";
import BlankSvg from "#src/assets/svg/blank.svg";
import { ConfigProvider, Drawer, Table } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import { commonDrawerProps } from "../constants/base";

interface Props {
	open: boolean;
	record?: any;
	bizCode?: string;
	onClose: (res?: any) => void;
}

export default function PlanHistoryDrawer({ open, record, bizCode, onClose }: Props) {
	const [items, setItems] = React.useState<Array<OperationLogItem>>([]);
	const [current, setCurrent] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);
	const [total, setTotal] = React.useState(0);
	const [loading, setLoading] = React.useState(false);

	const load = async (p = 1, size = pageSize) => {
		if (!record?.id || bizCode === undefined) return;
		setLoading(true);
		try {
			const res = await fetchOperationLogList({
				bizId: record.id,
				bizCode,
			});
			const list = res;
			const totalCount = (res as any)?.data?.total || 0;

			setItems(list);
			setTotal(totalCount);
			setCurrent(p);
			setPageSize(size);
		} catch (e) {
			console.error("load history failed", e);
			setItems([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	};

	React.useEffect(() => {
		if (open && record && bizCode !== undefined) {
			load(1);
		}
	}, [open, record, bizCode]);

	const columns = [
		{
			title: "操作时间",
			dataIndex: "operateTime",
			key: "operateTime",
			render: (t: string) => (t ? new Date(t).toLocaleString() : "-"),
			width: 200,
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "操作人",
			dataIndex: ["operator", "name"],
			key: "operatorName",
			width: 120,
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "操作模块",
			dataIndex: ["bizObject", "objName"],
			key: "module",
			width: 140,
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "操作内容",
			dataIndex: "content",
			key: "content",
			render: (content: OperationLogItem["content"]) => (
				<div style={{ whiteSpace: "pre-wrap" }}>
					{content?.options?.map((opt) => opt.data.text).join(" ") || "-"}
				</div>
			),
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
	];

	const pagination = {
		size: "default" as const,
		current,
		pageSize,
		total,
		showQuickJumper: false,
		showTotal: (t: number) => <span className="text-gray-500">共{t} 条</span>,
		onChange: (p: number) => load(p),
		showSizeChanger: true,
		pageSizeOptions: ["10", "20", "50"],
		onShowSizeChange: (_current: number, size: number) => {
			setPageSize(size);
			load(1, size);
		},
	};

	return (
		<Drawer
			title="操作记录"
			placement="right"
			width={720}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<ConfigProvider
				locale={zhCN}
				renderEmpty={() => (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							padding: "32px 0",
						}}
					>
						<img src={BlankSvg} alt="" />
						<span style={{ color: "rgba(0, 0, 0, 0.25)", marginTop: 8 }}>暂无数据</span>
					</div>
				)}
			>
				<Table
					columns={columns as any}
					dataSource={items.map((it, idx) => ({ key: it.id || idx, ...it }))}
					rowKey="id"
					pagination={pagination}
					size="small"
					loading={loading}
				/>
			</ConfigProvider>
		</Drawer>
	);
}
