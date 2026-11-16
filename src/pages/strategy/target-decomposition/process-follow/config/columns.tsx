import type { ProcessListItem } from "#src/api/strategy/target-confirm";
import PeriodPicker from "#src/components/period-picker";
import { Typography } from "antd";
import React from "react";

/**
 * 流程列表表格列配置
 */
export function getColumns(handleOpenApprovalProcess: (fdId?: string) => void) {
	return [
		{
			title: "目标周期",
			dataIndex: "subperiod",
			key: "subperiod",
			hideInTable: true,
			hideInSearch: false,
			renderFormItem: (_: any) => {
				return <PeriodPicker parentOpen={false} borderless />;
			},
		},
		{
			title: "流程编号",
			width: 300,
			dataIndex: "approvalCode",
			key: "approvalCode",
			render: (text: string, record: any) => (
				<Typography.Text
					style={{ color: "#1677ff", width: "100%", cursor: "pointer" }}
					ellipsis={{ tooltip: true }}
					onClick={() => handleOpenApprovalProcess(record.approvalFdId)}
				>
					{text}
				</Typography.Text>
			),
		},
		{
			title: "任务名称",
			width: 240,
			ellipsis: true,
			dataIndex: "name",
			key: "name",
		},
		{ title: "版本号", dataIndex: "submitVersion", key: "submitVersion" },
		{ title: "计划名称", dataIndex: "targetPlanName", key: "targetPlanName" },
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (val: number, record: ProcessListItem) => {
				const map: Record<number, { text: string; color: string }> = {
					0: { text: "流程中", color: "rgba(0, 117, 255, 1)" },
					1: { text: "已中止", color: "#ff4d4f" },
					2: { text: "已结束", color: "rgba(192, 196, 204, 1)" },
				};
				const config = map[record.status] || {
					text: "未知",
					color: "rgba(192, 196, 204, 1)",
				};
				return (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
						<span
							aria-hidden
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: config.color,
								display: "inline-block",
							}}
						/>
						<span>{config.text}</span>
					</span>
				);
			},
		},
		{ title: "当前审批人", dataIndex: "curAuditName", key: "curAuditName" },
		{ title: "发起人", dataIndex: "submitUserName", key: "submitUserName" },
		{ title: "发起日期", dataIndex: "submitDate", key: "submitDate" },
		// {
		// 	title: "操作",
		// 	key: "actions",
		// 	render: (_: any, record: ProcessListItem) => (
		// 		<>
		// 			<Button
		// 				type="link"
		// 				size="small"
		// 				disabled={record.status !== 0}
		// 				onClick={() => {
		// 					Modal.confirm({
		// 						title: "催办确认",
		// 						content: "确认要催办该流程吗？",
		// 						onOk: () => {
		// 							// TODO: send催办请求
		// 							message.success("催办已发送");
		// 						},
		// 					});
		// 				}}
		// 			>
		// 				催办
		// 			</Button>
		// 		</>
		// 	),
		// },
	];
}
