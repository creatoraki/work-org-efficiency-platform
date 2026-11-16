import type { RatingPlanItem } from "#src/api/performance-management/plan";
import type { ProColumns } from "@ant-design/pro-components";
import type { ReactNode } from "react";
import type { PlanAction } from "../types";

import TableColumnSettingIcon from "#src/assets/svg/table-column-setting.svg?react";
import { ColumnSetting } from "#src/pages/performance-management/annual-rating/components/column-setting";
import {
	COLUMN_SETTING_OPTIONS,
	PLAN_ACTIONS,
	PLAN_COLUMN_WIDTH,
	PLAN_STATUS_COLOR_MAP,
} from "./index";

/**
 * 评级计划表格列配置
 *
 * 列顺序：计划名称、周期、参与人数、主责人、有效期、状态、操作。
 *
 * @param onAction - 点击行操作回调
 * @param columnSetting - 列设置状态（隐藏列与变更回调）
 * @param columnSetting.hiddenKeys - 已隐藏的列 key
 * @param columnSetting.onChange - 隐藏列变更回调
 * @returns 表格列配置数组
 */
export function getPlanColumns(
	onAction: (record: RatingPlanItem, action: PlanAction) => void,
	columnSetting?: { hiddenKeys: string[]; onChange: (keys: string[]) => void },
): ProColumns<RatingPlanItem>[] {
	return [
		{
			title: "计划名称",
			dataIndex: "planName",
			key: "planName",
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "周期",
			dataIndex: "cycle",
			key: "cycle",
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "参与人数(人)",
			dataIndex: "headCount",
			key: "headCount",
			hideInSearch: true,
			render: (_text: ReactNode, record: RatingPlanItem) => (
				<span className="text-sm leading-[22px] text-[#606266]">
					{record.headCount.toLocaleString()}
				</span>
			),
		},
		{
			title: "主责人",
			dataIndex: "owner",
			key: "owner",
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "有效期",
			dataIndex: "validStart",
			key: "validPeriod",
			hideInSearch: true,
			render: (_text: ReactNode, record: RatingPlanItem) => (
				<span className="flex flex-nowrap items-center gap-1.5 whitespace-nowrap text-sm leading-[22px] text-[#606266]">
					<span>{record.validStart}</span>
					<span>至</span>
					<span>{record.validEnd}</span>
				</span>
			),
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			hideInSearch: true,
			render: (text: ReactNode) => (
				<div className="flex items-center gap-1">
					<span
						className="size-1.5 shrink-0 rounded-full"
						style={{
							backgroundColor: PLAN_STATUS_COLOR_MAP[String(text)] ?? "#C0C4CC",
						}}
					/>
					<span className="text-sm leading-[22px] text-[#606266]">{text}</span>
				</div>
			),
		},
		{
			title: (
				<div className="flex items-center gap-1">
					<span>操作</span>
					{columnSetting ? (
						<ColumnSetting
							options={COLUMN_SETTING_OPTIONS}
							hiddenKeys={columnSetting.hiddenKeys}
							onChange={columnSetting.onChange}
						>
							<TableColumnSettingIcon className="size-4 cursor-pointer" />
						</ColumnSetting>
					) : (
						<TableColumnSettingIcon className="size-4" />
					)}
				</div>
			),
			dataIndex: "action",
			key: "action",
			width: PLAN_COLUMN_WIDTH.action,
			hideInSearch: true,
			fixed: "right",
			render: (_text: ReactNode, record: RatingPlanItem) => (
				<span className="flex flex-nowrap items-center gap-2.5 whitespace-nowrap">
					{PLAN_ACTIONS.map((action, index) => (
						<span key={action.type} className="flex items-center gap-2.5">
							{index > 0 ? <span className="h-3.5 w-px bg-[#EBEEF5]" /> : null}
							<button
								type="button"
								className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
								onClick={() => onAction(record, action)}
							>
								{action.label}
							</button>
						</span>
					))}
				</span>
			),
		},
	];
}
