import type { ColumnsType } from "antd/es/table";
import { commonExport } from "#src/api/file/export-task/index.js";
import {
	confirmTask as confirmTaskAction,
	fetchConfirmationInstructions,
} from "#src/api/strategy/target-confirm";
import { fetchConfirmPageName, fetchConfirmPageNameHead } from "#src/api/strategy/target-filling";
import { confirm } from "#src/components/custom-confirm/index.js";
import { SectionTitle } from "#src/components/section-title/index.js";
import { Button, Col, Drawer, Input, message, Modal, Row, Table } from "antd";
import React, { useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import { getTitleText } from "../single-filling-page/utils";

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
}

export default function TaskDetailDrawer({ open, record, onClose }: Props) {
	const [loading, setLoading] = React.useState(false);
	const [confirmLoading] = useState(false);
	const [dataSource, setDataSource] = React.useState<any[]>([]);
	const [total, setTotal] = React.useState(0);
	const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10 });
	const [dynamicColumns, setDynamicColumns] = React.useState<ColumnsType<any>>([]);
	const [confirmationInstructions, setConfirmationInstructions] = React.useState<string>("");

	const fetchData = React.useCallback(
		async (page: number, size: number) => {
			if (!record?.id) return;
			setLoading(true);
			try {
				const res = await fetchConfirmPageName({
					id: record.id,
					pageNum: page,
					pageSize: size,
				});
				setDataSource(res.data.list || []);
				setTotal(res.data.total || 0);
				setPagination({ current: page, pageSize: size });
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		},
		[record?.id],
	);

	const fetchHeaders = React.useCallback(async () => {
		if (!record?.id) return;
		try {
			const res = await fetchConfirmPageNameHead(record.id);
			if (res.data) {
				const newCols = res.data.map((item: any) => ({
					title: item.name,
					dataIndex: item.id,
					key: item.id,
					width: 100,
					ellipsis: true,
					render: (_: any, row: any) => {
						const val = row.confirmPeriod?.find(
							(p: any) => p.code === item.id,
						)?.resultValue;
						return val !== null && val !== undefined && val !== ""
							? `${val} ${row.indicatorUnitStr || ""}`
							: "-";
					},
				}));
				setDynamicColumns(newCols);
			}
		} catch (error) {
			console.error(error);
		}
	}, [record?.id]);

	React.useEffect(() => {
		if (open && record?.id) {
			fetchData(1, 10);
			fetchHeaders();
		}
	}, [open, record?.id, fetchData, fetchHeaders]);

	// processType=0(下发前确认) 时拉取确认说明
	React.useEffect(() => {
		if (open && record?.processType === 0 && record?.effTaskSubmissionId) {
			fetchConfirmationInstructions(record.effTaskSubmissionId)
				.then((res) => {
					if (res?.code === 200) {
						setConfirmationInstructions(res.data || "");
					}
				})
				.catch((e) => {
					console.error("fetchConfirmationInstructions failed", e);
				});
		} else {
			setConfirmationInstructions("");
		}
	}, [open, record?.processType, record?.effTaskSubmissionId]);

	const cols: ColumnsType<any> = [
		{ title: "主数据编码", dataIndex: "targetOrgCode", key: "targetOrgName" },
		{ title: "拆解对象", dataIndex: "targetOrgName", key: "targetOrgName" },
		{ title: "负责人", dataIndex: "responsiblePersonName", key: "responsiblePersonName" },
		{ title: "拆解指标", dataIndex: "indicatorName", key: "indicatorName", ellipsis: true },
		{
			title: `${record?.targetCycle ? record.targetCycle.split("-")[1] : "年度"}目标值`,
			dataIndex: "annualTargetValue",
			key: "annualTargetValue",
			ellipsis: true,
			render: (_: any, row: any) => {
				const value = row.annualTargetValue;
				if (value === null || value === undefined) {
					return "-";
				}
				return `${value} ${row.indicatorUnitStr}`;
			},
		},
		...dynamicColumns,
		// {
		// 	title: "状态",
		// 	dataIndex: "statusStr",
		// 	key: "statusStr",
		// },
	];

	const tableCols = cols.map((col) => ({
		...col,
		ellipsis: true,
		onCell: () => ({ style: { whiteSpace: "nowrap" } }),
	}));

	const [objectionVisible, setObjectionVisible] = React.useState(false);
	const [objectionText, setObjectionText] = React.useState("");

	const handleObjectionOk = async () => {
		if (!objectionText || !objectionText.trim()) {
			message.error("请填写异议内容");
			return;
		}
		try {
			const res = await confirmTaskAction({
				id: record.id,
				status: 0,
				confirmationOpinion: objectionText,
			});
			if (res.data) message.success("异议已提交");
			setObjectionVisible(false);
			setObjectionText("");
			onClose(true);
		} catch (error) {
			console.error(error);
		}
	};

	const handleExport = async () => {
		if (!record?.id) {
			message.warning("缺少任务ID，无法导出");
			return;
		}
		// 只取当前表格实际显示的列，不做额外的业务处理（如注入负责人工号、重排列等）
		const dynamicKeys = new Set(dynamicColumns.map((c: any) => String(c?.dataIndex ?? c?.key)));
		const tableHeads = cols.map((col: any) => {
			const rawCode = col?.dataIndex ?? col?.key;
			const tableHeadName = getTitleText(col?.title) || String(rawCode);
			// 动态周期列（如第一季度、第二季度）：tableHeadCode 直接使用 tableHeadName
			const tableHeadCode = dynamicKeys.has(String(rawCode))
				? tableHeadName
				: String(rawCode).startsWith("period_")
					? String(rawCode).replace("period_", "")
					: String(rawCode);
			return { tableHeadCode, tableHeadName };
		});
		const heads = [...tableHeads];
		try {
			await commonExport({
				excelId: 11,
				reqCondition: {
					id: record.id,
				},
				exportTableHead: heads,
			});
		} catch (error) {
			console.error("导出失败:", error);
		}
	};

	const handleConfirmClick = () => {
		confirm({
			title: "确认任务信息",
			width: 380,
			icon: "blue",
			content: (
				<div className="flex flex-col gap-3 pl-6 pt-4">
					<div className="flex items-center text-sm">
						<div className="w-20 text-[#606266] opacity-80">任务名称</div>
						<div className="text-black">{record?.name ?? "-"}</div>
					</div>
					<div className="flex items-center text-sm">
						<div className="w-20 text-[#606266] opacity-80">版本号</div>
						<div className="text-black">{record?.submitVersion ?? "-"}</div>
					</div>
					<div className="flex items-center text-sm">
						<div className="w-20 text-[#606266] opacity-80">拆解对象</div>
						<div className="text-black">{record?.targetOrgName ?? "-"}</div>
					</div>
					<div className="flex items-center text-sm">
						<div className="w-20 text-[#606266] opacity-80">确认人</div>
						<div className="text-black">{record?.confirmUserName ?? "-"}</div>
					</div>
					<div className="flex items-center text-sm">
						<div className="w-20 text-[#606266] opacity-80">指标数量</div>
						<div className="text-black">
							{record?.confirmationIndicatorCount ?? record?.indicatorNum ?? "-"}个
						</div>
					</div>
				</div>
			),
			onOk: async () => {
				const res = await confirmTaskAction({
					id: record.id,
					status: 1,
				});
				if (res.code === 200) {
					onClose();
				}
			},
		});
	};

	const footer = record.hideAction ? null : (
		<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
			<Button>导出</Button>
			{record.stepStatus === 0 && (
				<>
					<Button onClick={() => setObjectionVisible(true)}>提出异议</Button>
					<Button type="primary" onClick={handleConfirmClick}>
						确认任务信息
					</Button>
				</>
			)}
		</div>
	);

	return (
		<Drawer
			title="任务详情"
			placement="right"
			width={900}
			open={open}
			mask={true}
			footer={footer}
			{...commonDrawerProps(onClose)}
		>
			<div style={{ padding: 8 }}>
				<SectionTitle title="基本信息" className="mb-8 text-base" />
				<Row gutter={16} style={{ marginBottom: 12 }}>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>目标周期</div>
							<div>{record?.targetCycle ?? record?.targetCycle ?? "-"}</div>
						</div>
					</Col>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>版本号</div>
							<div>{record?.submitVersion ?? "-"}</div>
						</div>
					</Col>
				</Row>
				<Row gutter={16} style={{ marginBottom: 12 }}>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>拆解对象</div>
							<div>{record?.targetOrgName ?? "-"}</div>
						</div>
					</Col>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>确认人</div>
							<div>{record?.confirmUserName ?? "-"}</div>
						</div>
					</Col>
				</Row>
				<Row gutter={16} style={{ marginBottom: 16 }}>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>指标数量</div>
							<div>
								{record?.confirmationIndicatorCount ?? record?.indicatorNum ?? "-"}
							</div>
						</div>
					</Col>
					<Col span={12}>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ width: 96, fontWeight: 600 }}>状态</div>
							<div>{record?.stepStatusStr ?? record?.stepStatusStr ?? "-"}</div>
						</div>
					</Col>
				</Row>
				{record?.processType === 0 && (
					<Row gutter={16} style={{ marginBottom: 16 }}>
						<Col span={24}>
							<div style={{ display: "flex", alignItems: "flex-start" }}>
								<div style={{ width: 96, fontWeight: 600, flexShrink: 0 }}>
									确认说明
								</div>
								<div style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
									{confirmationInstructions || "-"}
								</div>
							</div>
						</Col>
					</Row>
				)}
				<SectionTitle
					title="拆解详情"
					className="mb-8 mt-12 text-base"
					extra={<Button onClick={handleExport}>导出</Button>}
				/>
				<div style={{ marginTop: 8 }}>
					<Table
						loading={loading}
						columns={tableCols}
						dataSource={dataSource}
						tableLayout="fixed"
						scroll={{ x: "max-content" }}
						pagination={{
							...pagination,
							total,
							onChange: (page, size) => fetchData(page, size),
						}}
						rowKey="id"
					/>
				</div>
			</div>

			{/* 提出异议弹窗 */}
			<Modal
				title="提出异议"
				open={objectionVisible}
				onOk={handleObjectionOk}
				confirmLoading={confirmLoading}
				onCancel={() => setObjectionVisible(false)}
				okText="提交"
				width={380}
				style={{ marginTop: 200 }}
			>
				<Input.TextArea
					rows={4}
					value={objectionText}
					onChange={(e) => setObjectionText(e.target.value)}
					placeholder="请输入异议内容"
				/>
			</Modal>
		</Drawer>
	);
}
