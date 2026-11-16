import type { RatingAction, RatingTodoItem } from "#src/api/performance-management/todo";
import type { ProColumns } from "@ant-design/pro-components";
import type { ReactNode } from "react";

import TableColumnSettingIcon from "#src/assets/svg/table-column-setting.svg?react";
import { ColumnSetting } from "#src/pages/performance-management/annual-rating/components/column-setting";
import { Tooltip } from "antd";
import {
	COLUMN_SETTING_OPTIONS,
	resolveTodoActions,
	STATUS_COLOR_MAP,
	TABLE_COLUMN_WIDTH,
} from "./index";

/**
 * 字典文案翻译方法（由 useDict 提供，字典不可用时自动回退本地文案）
 */
export interface TodoColumnLabels {
	/** 状态文案 */
	statusLabel: (value?: string | number | null) => string;
	/** 节点类型文案 */
	nodeTypeLabel: (value?: string | number | null) => string;
	/** 考核类型文案 */
	assessTypeLabel: (value?: string | number | null) => string;
}

/**
 * 评级待办表格列配置
 *
 * 列顺序与列宽依次为：
 * 计划名称 / 周期 / 考核类型 / 节点类型 / 角色 / 执行范围 / 执行人 /
 * 人数(人) / 有效期 / 状态 / 最近提交时间 / 操作。
 *
 * @param onAction - 点击行操作回调
 * @param columnSetting - 列设置状态（隐藏列与变更回调）
 * @param columnSetting.hiddenKeys - 已隐藏的列 key
 * @param columnSetting.onChange - 隐藏列变更回调
 * @param labels - 字典文案翻译方法
 * @returns 表格列配置数组
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function getTodoColumns(
	onAction: (record: RatingTodoItem, action: RatingAction) => void,
	columnSetting: { hiddenKeys: string[]; onChange: (keys: string[]) => void } | undefined,
	labels: TodoColumnLabels,
): ProColumns<RatingTodoItem>[] {
	return [
		{
			title: "计划名称",
			dataIndex: "planName",
			key: "planName",
			width: TABLE_COLUMN_WIDTH.planName,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "周期",
			dataIndex: "cycle",
			key: "cycle",
			width: TABLE_COLUMN_WIDTH.cycle,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "考核类型",
			dataIndex: "assessType",
			key: "assessType",
			width: TABLE_COLUMN_WIDTH.assessType,
			ellipsis: true,
			hideInSearch: true,
			// ProTable 在 ellipsis 列会把 dom 包成元素，这里统一从 record 取原始字典值
			render: (_dom: ReactNode, record: RatingTodoItem) =>
				labels.assessTypeLabel(record.assessType),
		},
		{
			title: "节点类型",
			dataIndex: "nodeType",
			key: "nodeType",
			width: TABLE_COLUMN_WIDTH.nodeType,
			ellipsis: true,
			hideInSearch: true,
			render: (_dom: ReactNode, record: RatingTodoItem) =>
				labels.nodeTypeLabel(record.nodeType),
		},
		{
			title: "角色",
			dataIndex: "role",
			key: "role",
			width: TABLE_COLUMN_WIDTH.role,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "执行范围",
			dataIndex: "executeScope",
			key: "executeScope",
			width: TABLE_COLUMN_WIDTH.executeScope,
			ellipsis: true,
			hideInSearch: true,
			/**
			 * 执行范围默认只显示末级组织，悬浮显示完整层级路径；无完整路径时回退当前值。
			 * AntD 的 Tooltip title 直接承载全路径，无需额外 CSS。
			 */
			render: (text: ReactNode, record: RatingTodoItem) => (
				<Tooltip
					placement="top"
					overlayStyle={{ maxWidth: 336 }}
					overlayInnerStyle={{
						backgroundColor: "rgba(0, 0, 0, 0.7)",
						borderRadius: 3,
						padding: "5px 8px",
						fontSize: 14,
						lineHeight: "22px",
					}}
					title={record.executeScopePath || record.executeScope}
				>
					<span className="block w-full truncate">{record.executeScope}</span>
				</Tooltip>
			),
		},
		{
			title: "执行人",
			dataIndex: "executor",
			key: "executor",
			width: TABLE_COLUMN_WIDTH.executor,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			title: "人数(人)",
			dataIndex: "headCount",
			key: "headCount",
			width: TABLE_COLUMN_WIDTH.headCount,
			hideInSearch: true,
		},
		{
			title: "有效期",
			dataIndex: "validDate",
			key: "validDate",
			width: TABLE_COLUMN_WIDTH.validDate,
			hideInSearch: true,
			render: (text: ReactNode, record: RatingTodoItem) => (
				<div className="flex flex-nowrap items-center gap-2.5 whitespace-nowrap">
					<span className="text-sm leading-[22px] text-[#606266]">{text}</span>
					{record.overdue ? (
						<span className="rounded-[3px] bg-[#FEE4E6] px-2 text-xs leading-5 text-[#F5222D]">
							逾期
						</span>
					) : null}
				</div>
			),
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: TABLE_COLUMN_WIDTH.status,
			hideInSearch: true,
			render: (_dom: ReactNode, record: RatingTodoItem) => (
				<div className="flex items-center gap-1">
					<span
						className="size-1.5 shrink-0 rounded-full"
						style={{
							backgroundColor: STATUS_COLOR_MAP[String(record.status)] ?? "#C0C4CC",
						}}
					/>
					<span className="text-sm leading-[22px] text-[#606266]">
						{labels.statusLabel(record.status)}
					</span>
				</div>
			),
		},
		{
			title: "最近提交时间",
			dataIndex: "lastSubmitTime",
			key: "lastSubmitTime",
			width: TABLE_COLUMN_WIDTH.lastSubmitTime,
			ellipsis: true,
			hideInSearch: true,
		},
		{
			/**
			 * 操作列表头采用左文右图标，标题容器撑满单元格并使用两端对齐。
			 */
			title: (
				<div className="flex w-full items-center justify-between gap-1">
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
			width: TABLE_COLUMN_WIDTH.action,
			hideInSearch: true,
			fixed: "right",
			render: (_text: ReactNode, record: RatingTodoItem) => (
				<span className="flex flex-nowrap items-center gap-2.5 whitespace-nowrap">
					{resolveTodoActions(record.nodeType, record.status).map((action, index) => (
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
