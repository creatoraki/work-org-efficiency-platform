import {
	fetchConfirmTargetFollowUpConfirmed,
	targetFollowUpConfirmedStatistics,
} from "#src/api/strategy/target-filling";
import { Button, Divider, Drawer, Form, Input, Space, Table, Tabs } from "antd";
import { useEffect, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import PlanHistoryDrawer from "../../target-management/modal/Plan-history-drawer";
import AdjustIndicatorModal from "./AdjustIndicatorModal";
import ConfirmedIndicatorDrawer from "./ConfirmedIndicatorDrawer";

interface Props {
	open: boolean;
	onClose: () => void;
	effTaskSubmissionId?: string | number;
	step?: string | number;
}

export default function TargetConfirmDetailDrawer({
	open,
	onClose,
	effTaskSubmissionId,
	step,
}: Props) {
	const [activeTab, setActiveTab] = useState("all");
	const [form] = Form.useForm();
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
	const [statistics, setStatistics] = useState({
		total: 0,
		notStarted: 0,
		unconfirmed: 0,
		rejected: 0,
		confirmed: 0,
	});
	const [indicatorDrawerOpen, setIndicatorDrawerOpen] = useState(false);
	const [adjustModalOpen, setAdjustModalOpen] = useState(false);
	const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<any>(null);

	const loadStatistics = async () => {
		if (
			effTaskSubmissionId === undefined ||
			effTaskSubmissionId === null ||
			step === undefined ||
			step === null
		)
			return;
		try {
			const res: any = await targetFollowUpConfirmedStatistics({
				effTaskSubmissionId: Number(effTaskSubmissionId),
				step: Number(step),
			});
			if (res && res.code === 200 && res.data) {
				setStatistics(res.data);
			}
		} catch (e) {
			console.error(e);
		}
	};

	const loadData = async (page = 1, size = 10) => {
		if (
			effTaskSubmissionId === undefined ||
			effTaskSubmissionId === null ||
			step === undefined ||
			step === null
		) {
			return;
		}
		setLoading(true);
		try {
			const values = await form.validateFields();
			const payload = {
				pageNum: page,
				pageSize: size,
				responsiblePersonName: values.manager || "",
				targetOrgName: values.objectName || "",
				// indicatorListOverviewIds: indicatorListOverviewIds || [],
				effTaskSubmissionId: Number(effTaskSubmissionId),
				step: Number(step),
			};

			const res: any = await fetchConfirmTargetFollowUpConfirmed(payload);
			if (res) {
				const list = Array.isArray(res.data) ? res.data : res.data?.list || [];
				const total = res.total || res.data?.total || list.length || 0;

				setData(
					list.map((item: any) => ({
						...item,
						__uid: Math.random().toString(36).slice(2),
					})),
				);
				setPagination({
					current: page,
					pageSize: size,
					total,
				});
			} else {
				setData([]);
				setPagination({ current: 1, pageSize: 10, total: 0 });
			}
		} catch (e) {
			console.error(e);
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			loadData(1, 10);
			loadStatistics();
		}
	}, [open, effTaskSubmissionId, step]);

	const handleSearch = () => {
		loadData(1, pagination.pageSize);
	};

	const handleReset = () => {
		form.resetFields();
		loadData(1, pagination.pageSize);
	};
	const columns = [
		{ title: "拆解对象", dataIndex: "targetOrgName", key: "targetOrgName" },
		{ title: "负责人", dataIndex: "responsiblePersonName", key: "responsiblePersonName" },
		{
			title: "确认指标数",
			dataIndex: "number",
			key: "number",
			render: (text: number, record: any) => (
				<Button
					type="link"
					onClick={() => {
						setSelectedRecord(record);
						setIndicatorDrawerOpen(true);
					}}
				>
					{text}
				</Button>
			),
		},
		{
			title: "状态",
			dataIndex: "statusStr",
			key: "statusStr",
			render: (text: string) => {
				const map: Record<string, string> = {
					未开始: "rgba(192, 196, 204, 1)",
					未确认: "rgba(192, 196, 204, 1)",
					已确认: "#52c41a",
					被驳回: "#ff4d4f",
				};
				const color = map[text] || "rgba(192, 196, 204, 1)";
				const isGray = text === "未确认" || text === "未开始";
				return (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
						<span
							aria-hidden
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: color,
								display: "inline-block",
							}}
						/>
						<span style={{ color: isGray ? color : undefined }}>{text}</span>
					</span>
				);
			},
		},
		{
			title: "操作",
			key: "action",
			width: 160,
			render: (_: any, record: any) => (
				<Space size={0} split={<Divider type="vertical" />}>
					{record.statusStr === "未确认" && (
						<Button type="link" size="small">
							催办
						</Button>
					)}
					{record.statusStr === "被驳回" && (
						<Button
							type="link"
							size="small"
							onClick={() => {
								setSelectedRecord(record);
								setAdjustModalOpen(true);
							}}
						>
							调整
						</Button>
					)}
					<Button
						type="link"
						size="small"
						onClick={() => {
							setSelectedRecord(record);
							setHistoryDrawerOpen(true);
						}}
					>
						确认记录
					</Button>
				</Space>
			),
		},
	];

	const items = [
		{ key: "all", label: `总确认数 (${statistics.total ?? 0})` },
		{ key: "notStarted", label: `未开始 (${statistics.notStarted ?? 0})` },
		{ key: "unconfirmed", label: `未确认 (${statistics.unconfirmed ?? 0})` },
		{ key: "rejected", label: `被驳回 (${statistics.rejected ?? 0})` },
		{ key: "confirmed", label: `已确认 (${statistics.confirmed ?? 0})` },
	];

	return (
		<Drawer
			title={<span style={{ color: "rgba(50, 50, 51, 1)" }}>各组织负责人目标值确认</span>}
			placement="right"
			width={800}
			open={open}
			{...commonDrawerProps(onClose)}
			styles={{
				body: {
					paddingTop: 0,
				},
			}}
		>
			<Tabs
				activeKey={activeTab}
				onChange={setActiveTab}
				items={items}
				className="mb-4 font-semibold"
			/>

			<Form form={form} layout="inline" className="mb-4 w-full">
				<Form.Item name="objectName">
					<Input placeholder="支持模糊搜索" prefix="拆解对象" />
				</Form.Item>
				<Form.Item name="manager">
					<Input placeholder="支持模糊搜索" prefix="负责人" />
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

			<Table
				columns={columns}
				dataSource={data}
				loading={loading}
				size="small"
				className="[&_.ant-table-cell]:text-[rgba(96,98,102,1)]"
				rowKey="__uid"
				pagination={{
					current: pagination.current,
					pageSize: pagination.pageSize,
					total: pagination.total,
					onChange: (p, s) => loadData(p, s),
					showSizeChanger: true,
					showTotal: (t) => `共 ${t} 条`,
				}}
			/>
			<ConfirmedIndicatorDrawer
				open={indicatorDrawerOpen}
				onClose={() => setIndicatorDrawerOpen(false)}
				record={selectedRecord}
				effTaskSubmissionId={effTaskSubmissionId}
			/>
			<AdjustIndicatorModal
				open={adjustModalOpen}
				onClose={() => setAdjustModalOpen(false)}
				record={selectedRecord}
				effTaskSubmissionId={effTaskSubmissionId}
				onSuccess={() => loadData(pagination.current, pagination.pageSize)}
			/>
			<PlanHistoryDrawer
				open={historyDrawerOpen}
				onClose={() => setHistoryDrawerOpen(false)}
				record={{ ...selectedRecord, id: selectedRecord?.effStepConfirmationRecordId }}
				bizCode="TARGET_CONFIRM"
			/>
		</Drawer>
	);
}
