/**
 * 组织调整模块工具函数
 */

import type {
	OrgAdjustmentTaskListItem,
	OrgAdjustmentTaskListParams,
} from "#src/api/org-management/org-adjustment-management/org-adjustment";
import type { SearchField } from "#src/components/searchable-table";
import type {
	BuildTaskSearchSchemaParams,
	OrgAdjustmentTaskSearchOptionsState,
	OrgAdjustmentTaskStatisticsState,
	OrgAdjustmentTaskTableRow,
} from "./types";
import { ORG_ADJUSTMENT_TAB_STATUS_MAP } from "./config/constants";
import { searchSchema } from "./config/searchSchema";

/**
 * 默认统计数据
 */
export const DEFAULT_TASK_STATISTICS: OrgAdjustmentTaskStatisticsState = {
	totalCount: 0,
	doingCount: 0,
	doneCount: 0,
};

/**
 * 默认搜索选项
 */
export const DEFAULT_TASK_SEARCH_OPTIONS: OrgAdjustmentTaskSearchOptionsState = {
	taskNameOptions: [],
	createByOptions: [],
	updateByOptions: [],
};

/**
 * 统一格式化接口返回的时间字段
 */
export function formatDateTime(value: Record<string, unknown> | string | null | undefined) {
	if (!value) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	const dateValue = value as { time?: number; timestamp?: number; epochMilli?: number };
	const timestamp = dateValue.time ?? dateValue.timestamp ?? dateValue.epochMilli;
	if (typeof timestamp === "number") {
		return new Date(timestamp).toLocaleString("zh-CN");
	}

	return String(value);
}

/**
 * 将接口列表项转换为表格展示数据
 */
export function mapTaskListItemToTableRow(
	item: OrgAdjustmentTaskListItem,
): OrgAdjustmentTaskTableRow {
	return {
		id: item.id,
		taskName: item.taskName,
		status: item.status,
		createByName: item.createByName,
		updateByName: item.updateByName,
		createTime: formatDateTime(item.createTime),
		updateTime: formatDateTime(item.updateTime),
		remark: item.remark,
	};
}

/**
 * 将表格查询参数转换为后端列表接口参数
 */
export function buildTaskListParams(params: any): OrgAdjustmentTaskListParams {
	const tabStatusValues = ORG_ADJUSTMENT_TAB_STATUS_MAP[Number(params.activeTab)];
	const selectedStatus = params.status ? String(params.status) : undefined;
	const statusList = selectedStatus
		? [selectedStatus]
		: tabStatusValues?.length
			? tabStatusValues
			: undefined;

	return {
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 10,
		searchCount: true,
		sortItemList: [
			{
				isAsc: false,
				column: "update_time",
			},
		],
		statusList,
		taskName: params.taskName || undefined,
		createBy: params.creatorName || undefined,
		updateBy: params.updateName || undefined,
	};
}

/**
 * 构建页面搜索项配置
 */
export function buildTaskSearchSchema({
	taskSearchOptions,
	taskStatusOptions,
}: BuildTaskSearchSchemaParams): SearchField[] {
	return searchSchema.map((item) => {
		if (item.name === "taskName") {
			return {
				...item,
				type: "select",
				options: taskSearchOptions.taskNameOptions.map((option) => ({
					label: option,
					value: option,
				})),
				fieldProps: {
					allowClear: true,
					placeholder: "请选择",
					showSearch: true,
					optionFilterProp: "label",
				},
			};
		}

		if (item.name === "creatorName") {
			return {
				...item,
				type: "select",
				options: taskSearchOptions.createByOptions.map((option) => ({
					label: option.userName,
					value: option.userName,
				})),
				fieldProps: {
					allowClear: true,
					placeholder: "请选择",
					showSearch: true,
					optionFilterProp: "label",
				},
			};
		}

		if (item.name === "updateName") {
			return {
				...item,
				type: "select",
				options: taskSearchOptions.updateByOptions.map((option) => ({
					label: option.userName,
					value: option.userName,
				})),
				fieldProps: {
					allowClear: true,
					placeholder: "请选择",
					showSearch: true,
					optionFilterProp: "label",
				},
			};
		}

		if (item.name === "status") {
			return {
				...item,
				options: taskStatusOptions,
				fieldProps: {
					allowClear: true,
					placeholder: "请选择",
					showSearch: true,
					optionFilterProp: "label",
				},
			};
		}

		return item;
	});
}
