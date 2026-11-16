// 表格列配置

import type { Plan } from "../types";
import PeriodPicker from "#src/components/period-picker";
import React from "react";
import { renderStatusBadge } from "../utils";

/**
 * 获取表格列配置
 */
export function getColumns(onEdit: (record: Plan) => void, canView: (record: Plan) => boolean) {
	return [
		{
			title: "目标周期",
			dataIndex: "subperiod",
			key: "subperiod",
			hideInTable: true,
			hideInSearch: false,
			renderFormItem: () => {
				return <PeriodPicker parentOpen={false} borderless />;
			},
		},
		{
			title: "计划名称",
			dataIndex: "name",
			key: "name",
			width: 250,
			render: (_: any, record: Plan) => (
				<span
					className={
						canView(record)
							? "inline-block cursor-pointer truncate text-blue-600"
							: "inline-block truncate text-gray-500"
					}
					style={{ maxWidth: 230 }}
					title={String(record.name ?? "")}
					onClick={() => {
						if (canView(record)) onEdit(record);
					}}
				>
					{record.name}
				</span>
			),
		},
		{ title: "目标周期", dataIndex: "targetCycle", key: "targetCycle", width: 150 },
		{
			title: "计划状态",
			dataIndex: "statusStr",
			key: "statusStr",
			width: 120,
			render: (v: any, r: Plan) => renderStatusBadge(r.status, v),
		},
		{ title: "创建人", dataIndex: "createByName", key: "createByName", width: 120 },
		{ title: "创建日期", dataIndex: "createTime", key: "createTime", width: 180 },
		{ title: "更新人", dataIndex: "updateByName", key: "updateByName", width: 120 },
		{ title: "更新时间", dataIndex: "updateTime", key: "updateTime", width: 180 },
	];
}
