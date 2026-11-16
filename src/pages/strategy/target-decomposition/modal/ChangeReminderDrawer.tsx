import { Button, Drawer, Space, Table } from "antd";
import { commonDrawerProps } from "../../target-management/constants/base";

export interface ChangeReminderItem {
	id: number | string;
	// 变更类型 0：目标计划变更 1：上级目标值变动 2：组织变动-停用 3：组织变动-调整
	changeType?: number;
	// 变更类型说明
	changeTypeStr?: string;
	// 指标名称
	indicatorName?: string;
	// 变更内容
	changeRemark?: string;
	// 变更时间
	changeTime?: string | Record<string, unknown>;
}

interface Props {
	open: boolean;
	onClose: () => void;
	planId?: string | number;
	// 列表数据（外部传入，便于灵活控制；若未传则用内部默认空列表）
	dataSource?: ChangeReminderItem[];
	loading?: boolean;
	// 点击底部"变动"按钮回调
	onChange?: (selectedRows: ChangeReminderItem[]) => void;
}

export default function ChangeReminderDrawer({
	open,
	onClose,
	dataSource,
	loading,
	onChange,
}: Props) {
	const list = dataSource ?? [];

	const columns = [
		{
			title: "变更类型",
			dataIndex: "changeTypeStr",
			key: "changeTypeStr",
			width: 140,
			ellipsis: true,
		},
		{
			title: "指标名称",
			dataIndex: "indicatorName",
			key: "indicatorName",
			ellipsis: true,
		},
		{
			title: "变更内容",
			dataIndex: "changeRemark",
			key: "changeRemark",
			ellipsis: true,
		},
		{
			title: "变更时间",
			dataIndex: "changeTime",
			key: "changeTime",
			width: 170,
			render: (val: unknown) => (typeof val === "string" ? val : val ? String(val) : ""),
		},
	];

	const handleChange = () => {
		onChange?.(list);
	};

	return (
		<Drawer
			title="变动提醒"
			width={720}
			open={open}
			{...commonDrawerProps(onClose)}
			footer={
				<div style={{ display: "flex", justifyContent: "flex-end" }}>
					<Space>
						<Button onClick={onClose}>关闭</Button>
						<Button type="primary" onClick={handleChange}>
							变动
						</Button>
					</Space>
				</div>
			}
		>
			<Table<ChangeReminderItem>
				rowKey="id"
				size="small"
				bordered
				loading={loading}
				columns={columns}
				dataSource={list}
				pagination={false}
			/>
		</Drawer>
	);
}
