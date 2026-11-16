import { renderDeadlineColumn, renderStatusColumn } from "../utils";

export function createColumns() {
	return [
		{ title: "任务名称", width: 240, dataIndex: "name", key: "name", ellipsis: true },
		{
			title: "计划名称",
			width: 240,
			dataIndex: "targetPlanName",
			key: "targetPlanName",
			ellipsis: true,
		},
		{ title: "目标周期", dataIndex: "targetCycle", key: "targetCycle", width: 180 },
		{
			title: "状态",
			dataIndex: "fillingStatusStr",
			key: "fillingStatusStr",
			width: 120,
			render: renderStatusColumn,
		},
		{
			title: "有效期",
			dataIndex: "deadline",
			width: 220,
			key: "deadline",
			render: renderDeadlineColumn,
		},
		{
			title: "主责人",
			dataIndex: "responsibleUserName",
			key: "responsibleUserName",
			width: 100,
		},
		{ title: "更新时间", dataIndex: "updateTime", key: "updateTime", width: 180 },
	];
}
