/**
 * 任务列表表格列配置
 */

import type { ColumnsType } from "antd/es/table";
import type { OrgAdjustmentTaskTableRow } from "../types";
import dayjs from "dayjs";
import React from "react";
import { ORG_ADJUSTMENT_TASK_STATUS_MAP } from "./constants";

/**
 * 格式化日期展示，只保留年月日。
 */
function formatTableDate(value?: string | null) {
	if (!value) {
		return "-";
	}

	const date = dayjs(value);
	return date.isValid() ? date.format("YYYY-MM-DD") : value;
}

/**
 * 获取表格列配置
 */
export function getColumns(): ColumnsType<OrgAdjustmentTaskTableRow> {
	return [
		{
			title: "任务名称",
			dataIndex: "taskName",
			key: "taskName",
			width: 200,
			ellipsis: true,
			render: (text: string) => <span title={text}>{text}</span>,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 120,
			render: (_, record: OrgAdjustmentTaskTableRow) => {
				const statusConfig = ORG_ADJUSTMENT_TASK_STATUS_MAP[String(record.status)] || {
					text: String(record.status ?? "-"),
					dotColor: "rgba(255, 125, 0, 1)",
				};
				const dot = (
					<span
						style={{
							width: 8,
							height: 8,
							borderRadius: 8,
							background: statusConfig.dotColor,
							display: "inline-block",
						}}
					/>
				);
				return (
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 8,
							color: statusConfig.textColor,
						}}
					>
						{dot}
						<span>{statusConfig.text}</span>
					</span>
				);
			},
		},
		{
			title: "创建人",
			dataIndex: "createByName",
			key: "createByName",
			width: 120,
		},
		{
			title: "创建日期",
			dataIndex: "createTime",
			key: "createTime",
			width: 160,
			render: (text: string) => <span>{formatTableDate(text)}</span>,
		},

		{
			title: "更新人",
			dataIndex: "updateByName",
			key: "updateByName",
			width: 160,
		},
		{
			title: "更新日期",
			dataIndex: "updateTime",
			key: "updateTime",
			width: 160,
			render: (text: string) => <span>{formatTableDate(text)}</span>,
		},
		{
			title: "备注",
			dataIndex: "remark",
			key: "remark",
			width: 120,
		},
	];
}
