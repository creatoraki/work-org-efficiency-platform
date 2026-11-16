import type { StatisticsData } from "../types";
import { fetchSubmitUserStatistics } from "#src/api/strategy/target-filling";
import { useEffect, useState } from "react";

export function useStatistics(reloadTick: number) {
	const [statistics, setStatistics] = useState<StatisticsData>({});

	useEffect(() => {
		if (reloadTick > -1) {
			fetchSubmitUserStatistics().then((res: any) => {
				setStatistics(res || {});
			});
		}
	}, [reloadTick]);

	return { statistics };
}
