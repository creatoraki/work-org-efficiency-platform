import type { StatsData } from "../types";
import { fetchIndicatorConfStatistics } from "#src/api/strategy";
import React from "react";

const defaultStats: StatsData = {
	targetPlanTotal: 0,
	targetPlanTotalNoSubmit: 0,
	targetPlanTotalSubmit: 0,
	primaryPlanTotal: 0,
	primaryPlanNoSubmit: 0,
	primaryPlanSubmit: 0,
	collaborationPlanTotal: 0,
	collaborationPlanNoSubmit: 0,
	collaborationPlanSubmit: 0,
};

interface UseStatsReturn {
	stats: StatsData;
}

/**
 * 统计数据加载 Hook
 */
export function useStats(): UseStatsReturn {
	const [stats, setStats] = React.useState<StatsData>(defaultStats);

	React.useEffect(
		() => {
			let mounted = true;

			fetchIndicatorConfStatistics()
				.then((res: any) => {
					if (!mounted) return;
					setStats(res || defaultStats);
				})
				.catch((e) => {
					console.error("load stats failed", e);
				});

			return () => {
				mounted = false;
			};
		},
		[
			/* run once on mount */
		],
	);

	return { stats };
}
