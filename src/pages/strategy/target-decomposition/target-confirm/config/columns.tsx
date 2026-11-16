import type { TaskRow } from "../types";
import PeriodPicker from "#src/components/period-picker";
import { Typography } from "antd";
import { renderStatusIndicator } from "../utils";

/**
 * 创建表格列配置
 */
export function createColumns(callbacks: {
	onTaskClick: (record: TaskRow) => void;
	onDetailClick: (record: TaskRow) => void;
	onHistoryClick: (record: TaskRow) => void;
}) {
	return [
		{
			title: "任务名称",
			dataIndex: "name",
			key: "name",
			width: 240,
			render: (text: string, record: TaskRow) => (
				<Typography.Text
					style={{
						color: "#1677ff",
						width: "100%",
						cursor: "pointer",
					}}
					ellipsis={{ tooltip: true }}
					onClick={(e) => {
						e.stopPropagation();
						callbacks.onTaskClick(record);
					}}
				>
					{text}
				</Typography.Text>
			),
		},
		{
			title: "拆解对象",
			dataIndex: "targetOrgName",
			key: "targetOrgName",
		},
		{
			title: "版本号",
			dataIndex: "submitVersion",
			key: "submitVersion",
		},
		{
			title: "计划名称",
			dataIndex: "targetPlanName",
			key: "targetPlanName",
			render: (text: string) => (
				<Typography.Text
					style={{ width: "100%", cursor: "pointer" }}
					ellipsis={{ tooltip: true }}
				>
					{text}
				</Typography.Text>
			),
		},
		{
			title: "目标周期",
			dataIndex: "subperiod",
			key: "subperiod",
			hideInTable: true,
			renderFormItem: () => <PeriodPicker parentOpen={false} borderless />,
		},
		{
			title: "目标周期",
			dataIndex: "targetCycle",
			key: "targetCycle",
			renderFormItem: () => <PeriodPicker parentOpen={false} borderless />,
		},
		{
			title: "下发人",
			dataIndex: "submitUserName",
			key: "submitUserName",
		},
		{
			title: "下发日期",
			dataIndex: "issueTime",
			key: "issueTime",
			width: 220,
		},
		{
			title: "确认人",
			dataIndex: "confirmUserName",
			key: "confirmUserName",
			ellipsis: true,
		},
		{
			title: "指标数量",
			dataIndex: "confirmationIndicatorCount",
			key: "confirmationIndicatorCount",
		},
		{
			title: "状态",
			dataIndex: "stepStatus",
			key: "stepStatus",
			render: (_: any, record: TaskRow) => renderStatusIndicator(record),
		},
	];
}
