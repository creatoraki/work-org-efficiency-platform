import type { IndicatorConfPageItem } from "#src/api/strategy";
import type { SelectOption } from "../types";
import { fetchIndicatorConfPage } from "#src/api/strategy";
import React from "react";
import { extractSelectOptions } from "../utils";

interface UseInitOptionsReturn {
	planNameOptions: SelectOption[];
	responsibleUserOptions: SelectOption[];
	updaterOptions: SelectOption[];
}

/**
 * 初始化搜索选项 Hook
 */
export function useInitOptions(): UseInitOptionsReturn {
	const [planNameOptions, setPlanNameOptions] = React.useState<SelectOption[]>([]);
	const [responsibleUserOptions, setResponsibleUserOptions] = React.useState<SelectOption[]>([]);
	const [updaterOptions, setUpdaterOptions] = React.useState<SelectOption[]>([]);

	React.useEffect(() => {
		fetchIndicatorConfPage({ pageNum: 1, pageSize: 500 })
			.then((res) => {
				if (res && Array.isArray(res.data)) {
					const list: IndicatorConfPageItem[] = res.data;
					setPlanNameOptions(extractSelectOptions(list, "targetPlanName"));
					setResponsibleUserOptions(extractSelectOptions(list, "responsibleUserName"));
					setUpdaterOptions(extractSelectOptions(list, "updateByName"));
				}
			})
			.catch((e) => console.error(e));
	}, []);

	return {
		planNameOptions,
		responsibleUserOptions,
		updaterOptions,
	};
}
