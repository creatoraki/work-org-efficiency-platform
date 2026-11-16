import type { ConfirmPageParams } from "#src/api/strategy/target-confirm/types";
import type { ConfirmCounts } from "../types";
import { fetchConfirmPage, fetchTargetConfirmStatistics } from "#src/api/strategy/target-confirm";
import { useCallback } from "react";
import { mapTaskRowData } from "../utils";

export function useTargetConfirmActions(
	reloadTick: number,
	onCountsChange: (counts: ConfirmCounts) => void,
) {
	/**
	 * 获取统计数据
	 */
	const getCount = useCallback(async () => {
		try {
			const res = await fetchTargetConfirmStatistics();
			if (res && res.code === 200 && res.data) {
				const data = res.data;
				onCountsChange({
					totalNum: data.totalCount ?? 0,
					unconfirmedNum: data.waitConfirmedCount ?? 0,
					rejectedNum: data.rejectedCount ?? 0,
					confirmedNum: data.confirmedCount ?? 0,
				});
			}
		} catch (e) {
			console.error("fetchTargetConfirmStatistics failed", e);
		}
	}, [onCountsChange]);

	/**
	 * 获取列表数据
	 */
	const fetchData = useCallback(
		async (params: any, currentTab: string) => {
			const pageSize = params.pageSize || 10;

			const payload: ConfirmPageParams = {
				pageNum: params.pageNum,
				pageSize,
				...params,
				stepStatus: params.status,
				sortItemList: [
					{
						isAsc: false,
						column: "issue_time",
					},
				],
			};

			// 处理周期参数
			if (params.subperiod) {
				payload.targetPlanYear = params.subperiod[0];
				payload.targetPlanPeriod = params.subperiod[1];
			}
			delete payload.status;

			// 处理标签页切换时的状态
			if (currentTab !== "all") {
				if (!payload.status) {
					if (currentTab === "unconfirmed") payload.status = 1;
					else if (currentTab === "rejected") payload.status = 0;
					else if (currentTab === "confirmed") payload.status = 2;
				}
			}

			// 处理状态字符串到数字的转换
			if (payload.status === "unconfirmed") payload.status = 1;
			else if (payload.status === "rejected") payload.status = 0;
			else if (payload.status === "confirmed") payload.status = 2;

			try {
				const res = await fetchConfirmPage(payload);
				const { list, total } = res.data || [];
				const mapped = mapTaskRowData(list);
				return {
					data: mapped,
					total: total || 0,
				};
			} catch (e) {
				console.error("fetchTargetDisassembleConfirmList failed", e);
				return { data: [], total: 0 };
			}
		},
		[reloadTick],
	);

	return {
		getCount,
		fetchData,
	};
}
