/**
 * 组织调整页面数据 Hook
 *
 * 负责：
 * 1. 页面基础数据初始化（统计、搜索选项）
 * 2. 表格查询请求
 * 3. 搜索 schema 动态组装
 * 4. 创建成功后的刷新控制
 */

import type {
	OrgAdjustmentTaskSearchOptionsState,
	OrgAdjustmentTaskStatisticsState,
	OrgAdjustmentTaskTableRow,
} from "../types";
import {
	fetchOrgAdjustmentTaskList,
	fetchOrgAdjustmentTaskSearchOptions,
	fetchOrgAdjustmentTaskStatistics,
} from "#src/api/org-management/org-adjustment-management/org-adjustment";
import { useDict } from "#src/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ORG_ADJUSTMENT_DICT_KEYS } from "../config/constants";
import {
	buildTaskListParams,
	buildTaskSearchSchema,
	DEFAULT_TASK_SEARCH_OPTIONS,
	DEFAULT_TASK_STATISTICS,
	mapTaskListItemToTableRow,
} from "../utils";

export function useOrgAdjustmentPageData() {
	const [reloadSignal, setReloadSignal] = useState(0);
	const [taskStatistics, setTaskStatistics] =
		useState<OrgAdjustmentTaskStatisticsState>(DEFAULT_TASK_STATISTICS);
	const [taskSearchOptions, setTaskSearchOptions] = useState<OrgAdjustmentTaskSearchOptionsState>(
		DEFAULT_TASK_SEARCH_OPTIONS,
	);
	const { options: taskStatusOptions = [] } = useDict(ORG_ADJUSTMENT_DICT_KEYS.TASK_STATUS);

	/**
	 * 刷新页面基础信息。
	 * 这里并行请求，避免串行等待造成不必要的加载时长。
	 */
	const refreshPageBaseData = useCallback(async () => {
		const [statisticsResponse, searchOptionsResponse] = await Promise.all([
			fetchOrgAdjustmentTaskStatistics(),
			fetchOrgAdjustmentTaskSearchOptions(),
		]);

		if (statisticsResponse?.data) {
			setTaskStatistics(statisticsResponse.data);
		}

		if (searchOptionsResponse?.data) {
			setTaskSearchOptions(searchOptionsResponse.data);
		}
	}, []);

	/** 首次进入页面时初始化基础数据 */
	useEffect(() => {
		refreshPageBaseData();
	}, [refreshPageBaseData]);

	/**
	 * 动态构建搜索项，避免在页面组件中堆积大量条件分支。
	 */
	const tableSearchSchema = useMemo(() => {
		return buildTaskSearchSchema({
			taskSearchOptions,
			taskStatusOptions,
		});
	}, [taskSearchOptions, taskStatusOptions]);

	/**
	 * 查询表格列表。
	 * 对外直接返回 SearchableTable 需要的数据结构。
	 */
	const fetchTaskList = useCallback(async (params: any) => {
		const response = await fetchOrgAdjustmentTaskList(buildTaskListParams(params));

		return {
			data: (response.data?.list || []).map((item) =>
				mapTaskListItemToTableRow(item),
			) as OrgAdjustmentTaskTableRow[],
			total: response.data?.total || 0,
		};
	}, []);

	/**
	 * 数据变更成功后刷新页面。
	 * - 刷新统计与筛选项
	 * - 推动表格重新请求
	 */
	const refreshAfterMutation = useCallback(async () => {
		await refreshPageBaseData();
		setReloadSignal((prev) => prev + 1);
	}, [refreshPageBaseData]);

	return {
		reloadSignal,
		taskStatistics,
		tableSearchSchema,
		fetchTaskList,
		refreshAfterMutation,
	};
}
