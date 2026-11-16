/**
 * 接口管理列表表格列配置
 */

import type { ColumnsType } from "antd/es/table";
import type { InterfaceTask } from "../types";
import { Button } from "antd";
import React from "react";

const STATUS_LABELS = ["流程中", "已结束", "已中止"];

export function getColumns(): ColumnsType<InterfaceTask> {
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
			title: "流程编号",
			dataIndex: "processNo",
			key: "processNo",
			width: 180,
			ellipsis: true,
			render: (text: string) => (
				<Button type="link" size="small" style={{ padding: 0 }}>
					<span title={text}>{text}</span>
				</Button>
			),
		},
		{
			title: "业务系统",
			dataIndex: "businessSystem",
			key: "businessSystem",
			width: 160,
			ellipsis: true,
			render: (text: string) => <span title={text}>{text}</span>,
		},
		{
			title: "生效时间",
			dataIndex: "effectiveTime",
			key: "effectiveTime",
			width: 180,
			render: (text: string) => <span className="text-xs text-gray-500">{text}</span>,
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 120,
			render: (value: InterfaceTask["status"]) => {
				if (typeof value === "string") return value;
				const idx = Number.isFinite(Number(value))
					? Number(value) % STATUS_LABELS.length
					: 0;
				return STATUS_LABELS[idx];
			},
		},
	];
}
