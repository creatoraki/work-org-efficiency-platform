import type { ProcessCounts, ProcessListResponse } from "../types";
import { fetchProcessList } from "#src/api/strategy/target-confirm";
import { useCallback, useState } from "react";
import { convertParamsToPayload, parseProcessListResponse } from "../utils";

/**
 * 管理流程跟踪的业务逻辑
 */
export function useProcessFollow() {
	const [reloadTick, setReloadTick] = useState(0);
	const [activeTab, setActiveTab] = useState<string>("all");
	const [counts] = useState<ProcessCounts>({
		totalNum: 0,
		activeNum: 0,
		completeNum: 0,
		abortNum: 0,
	});

	/**
	 * 获取流程统计数据
	 */
	const getCount = useCallback(async () => {
		// try {
		// 	const res = await fetchOaProcessStatistics();
		// 	const data = res.data;
		// 	if (data) {
		// 		setCounts({
		// 			totalNum: Number(data.totalCount ?? 0),
		// 			activeNum: Number(data.processingCount ?? 0),
		// 			completeNum: Number(data.finishedCount ?? 0),
		// 			abortNum: Number(data.terminatedCount ?? 0),
		// 		});
		// 	}
		// }
		// catch (e) {
		// 	console.error("fetchOaProcessStatistics failed", e);
		// }
	}, []);

	/**
	 * 获取流程列表数据
	 */
	const fetchData = useCallback(
		async (params: any): Promise<ProcessListResponse> => {
			try {
				// if (reloadTick <= 0) {
				// 	return Promise.resolve({ data: [], total: 0 });
				// }
				const payload = convertParamsToPayload(params);
				const resp = await fetchProcessList(payload);
				const { list, total } = parseProcessListResponse(resp);
				return { data: list, total };
			} catch (e) {
				console.error("fetchProcessList error", e);
				return Promise.resolve({ data: [], total: 0 });
			}
		},
		[reloadTick],
	);

	return {
		counts,
		getCount,
		fetchData,
		reloadTick,
		setReloadTick,
		activeTab,
		setActiveTab,
	};
}
