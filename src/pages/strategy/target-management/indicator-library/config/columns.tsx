// 表格列配置

import type { Indicator } from "../types";
import { Typography } from "antd";
import React from "react";
import { renderOnlineStatus } from "../utils";

/**
 * 获取表格列配置
 */
export function getColumns(
	onViewDetail: (record: Indicator) => void,
	onViewPlans: (record: Indicator) => void,
) {
	return [
		{
			title: "指标名称",
			dataIndex: "name",
			key: "name",
			width: 300,
			render: (text: string, record: Indicator) => (
				<Typography.Text
					style={{ color: "#1677ff", width: "100%", cursor: "pointer" }}
					ellipsis={{ tooltip: true }}
					onClick={() => onViewDetail(record)}
				>
					{text}
				</Typography.Text>
			),
		},
		{ title: "主责部门", dataIndex: "responsibleDepartment", key: "responsibleDepartment" },
		{ title: "指标类型", dataIndex: "typeStr", key: "typeStr" },
		{
			title: "上线状态",
			dataIndex: "onlineStatus",
			key: "onlineStatus",
			render: (_: any, record: Indicator) => renderOnlineStatus(record.onlineStatus),
		},
		{
			title: "应用计划",
			dataIndex: "applicationPlanCount",
			key: "applicationPlanCount",
			render: (text: number, record: Indicator) =>
				text > 0 ? (
					<Typography.Text
						style={{ color: "#1677ff", width: "100%", cursor: "pointer" }}
						ellipsis={{ tooltip: true }}
						onClick={() => onViewPlans(record)}
					>
						{text}
					</Typography.Text>
				) : (
					0
				),
		},
		{ title: "创建人", dataIndex: "createByName", key: "createByName" },
		{ title: "更新人", dataIndex: "updateByName", key: "updateByName" },
		{ title: "更新时间", dataIndex: "updateTime", key: "updateTime" },
	];
}
