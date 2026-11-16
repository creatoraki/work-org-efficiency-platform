import type { DictDataItem } from "./types";
import { request } from "#src/utils";

export * from "./types";

/**
 * 根据字典类型获取字典数据
 * @param dictType 字典类型
 * @returns 字典数据列表
 */
export function fetchDictDataByType(dictType: string): Promise<ApiResponse<DictDataItem[]>> {
	return request
		.get<
			ApiResponse<DictDataItem[]>
		>(`system/dict/data/type/${dictType}`, { ignoreLoading: true })
		.json();
}
