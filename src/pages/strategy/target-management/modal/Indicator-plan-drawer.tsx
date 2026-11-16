import { fetchApplicationPlanList } from "#src/api/strategy/index";
import { ConfigProvider, Drawer, Table } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import { commonDrawerProps } from "../constants/base";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
}

export default function IndicatorPlanDrawer({ open, record, onClose }: Props) {
	const [loading, setLoading] = React.useState(false);
	const [data, setData] = React.useState<any[]>([]);
	const [total, setTotal] = React.useState(0);
	const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });

	const fetchData = React.useCallback(async () => {
		if (!record?.id) return;
		setLoading(true);
		try {
			const res = await fetchApplicationPlanList({
				pageNum: pagination.current,
				pageSize: pagination.pageSize,
				indicatorId: record.id,
				searchCount: true,
			});
			setData(res?.data?.list || []);
			setTotal(res?.data?.total || 0);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, [record, pagination]);

	React.useEffect(() => {
		if (open) {
			fetchData();
		}
	}, [open, fetchData]);

	const columns = [
		{ title: "计划名称", dataIndex: "name", key: "name" },
		{
			title: "状态",
			dataIndex: "statusStr",
			key: "statusStr",
			render: (text: string, record: any) => {
				const color =
					record?.status === 1 ? "rgba(0, 117, 255, 1)" : "rgba(192, 196, 204, 1)";
				return (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							color: record?.status === 1 ? "#000" : color,
						}}
					>
						<span
							style={{
								width: 6,
								height: 6,
								borderRadius: "50%",
								backgroundColor: color,
								marginRight: 8,
							}}
						/>
						{text}
					</div>
				);
			},
		},
	];

	const tablePagination = {
		current: pagination.current,
		pageSize: pagination.pageSize,
		total,
		size: "default" as const,
		showQuickJumper: false,
		showTotal: (t: number) => <span className="text-gray-500">共{t} 条</span>,
		showSizeChanger: true,
		pageSizeOptions: ["10", "20", "50"],
		onChange: (page: number, size: number) => {
			setPagination({ current: page, pageSize: size });
		},
	};

	return (
		<Drawer
			title="应用计划"
			placement="right"
			width={640}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<ConfigProvider locale={zhCN}>
				<Table
					columns={columns}
					dataSource={data}
					rowKey="name"
					pagination={tablePagination}
					loading={loading}
				/>
			</ConfigProvider>
		</Drawer>
	);
}
