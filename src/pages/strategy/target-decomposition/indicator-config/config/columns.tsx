import type { PlanRow, Status } from "../types";
import { Tag, Typography } from "antd";
import dayjs from "dayjs";
import { STATUS_MAP } from "./constants";

interface TableModalActions {
	open: (type: string, options: Record<string, any>) => Promise<void>;
}

/**
 * 生成表格列配置
 */
export function createTableColumns(
	modal: TableModalActions,
	// onSubmitSuccess: () => void,
) {
	return [
		{
			title: "计划名称",
			dataIndex: "targetPlanName",
			key: "targetPlanName",
			width: 300,
			render: (text: string, record: PlanRow) => (
				<Typography.Text
					style={{ color: "#1677ff", width: "100%", cursor: "pointer" }}
					ellipsis={{ tooltip: true }}
					onClick={() =>
						modal.open("indicator.config", { record, readonly: true }).then()
					}
				>
					{text}
				</Typography.Text>
			),
		},
		{
			title: "目标周期",
			dataIndex: "targetCycle",
			key: "targetCycle",
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			render: (_: Status, record: PlanRow) => {
				const v = typeof record.submissionStatus === "number" ? record.submissionStatus : 0;
				const statusInfo = STATUS_MAP[v];
				return (
					<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
						<span
							aria-hidden
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								background: statusInfo.color,
								display: "inline-block",
							}}
						/>
						<span>{statusInfo.text}</span>
					</span>
				);
			},
		},
		{
			title: "有效期",
			dataIndex: "deadline",
			key: "deadline",
			render: (_: any, record: any) => {
				const start = record.startTime ? record.startTime.split(" ")[0] : "";
				const end = record.deadline ? record.deadline.split(" ")[0] : "";
				const isOverdue =
					record.deadline && dayjs(record.deadline).isBefore(dayjs(), "day");
				const text = start && end ? `${start} ~ ${end}` : start || end || "-";
				return (
					<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
						<span>{text}</span>
						{isOverdue && (
							<Tag color="error" style={{ margin: 0 }}>
								逾期
							</Tag>
						)}
					</div>
				);
			},
		},
		{
			title: "主责人",
			dataIndex: "responsibleUserName",
			key: "responsibleUserName",
		},
		{
			title: "更新时间",
			dataIndex: "subTaskChangeTime",
			key: "subTaskChangeTime",
		},
	];
}
