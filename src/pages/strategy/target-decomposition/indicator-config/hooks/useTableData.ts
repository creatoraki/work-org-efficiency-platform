import type { FetchDataParams, PlanRow } from "../types";
import { fetchIndicatorConfPage } from "#src/api/strategy";
import React from "react";
import { buildFetchPayload, filterLocalData, paginate } from "../utils";

interface UseTableDataReturn {
	fetchData: (
		params: FetchDataParams,
		currentTab: string,
	) => Promise<{ data: PlanRow[]; total: number }>;
}

/**
 * 表格数据获取 Hook
 */
export function useTableData(
	plansRef: React.MutableRefObject<PlanRow[]>,
	planType: string,
): UseTableDataReturn {
	const fetchData = React.useCallback(
		async (params: FetchDataParams, currentTab: string) => {
			const payload = buildFetchPayload(params, currentTab);

			try {
				const resp = await fetchIndicatorConfPage(payload);
				if (resp && Array.isArray(resp.data)) {
					return resp;
				}
			} catch (e) {
				console.error("fetchIndicatorConfPage failed, falling back to mock", e);
			}

			// Fallback: 本地数据过滤
			const filteredData = filterLocalData(plansRef.current, params, currentTab, planType);

			const pageSize = params.pageSize || 10;
			const total = filteredData.length;
			const pageData = paginate(filteredData, params.pageNum || 1, pageSize);

			return Promise.resolve({ data: pageData, total });
		},
		[plansRef, planType],
	);

	return { fetchData };
}
