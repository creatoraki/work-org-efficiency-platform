import type { DictDataItem } from "#src/api/system/dict/types";
import { fetchDictDataByType } from "#src/api/system/dict";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface DictSelectOption {
	label: string;
	value: string;
	disabled?: boolean;
}

/**
 * 轻量级字典选项 Hook
 * 专注于为 Select/Radio 等组件提供 options 数据
 *
 * @param dictType 字典类型编码
 * @returns { options, isLoading } — options 可直接传给 antd Select
 */
export function useDictOptions(dictType: string | undefined | null) {
	const { data, isLoading } = useQuery<DictDataItem[]>({
		queryKey: ["dict", dictType],
		queryFn: async () => {
			const response = await fetchDictDataByType(dictType!);
			return response.data || [];
		},
		enabled: !!dictType,
		staleTime: 30 * 60 * 1000, // 30 分钟，字典数据极少变动
		gcTime: 60 * 60 * 1000, // 1 小时缓存
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const options = useMemo<DictSelectOption[]>(() => {
		if (!data) {
			return [];
		}
		return data
			.filter((item) => item.status === "0")
			.map((item) => ({
				label: item.dictLabel,
				value: item.dictValue,
			}));
	}, [data]);

	return { options, isLoading };
}
