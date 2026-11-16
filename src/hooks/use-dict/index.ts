import type { DictDataItem, DictOption } from "#src/api/system/dict/types";
import type { UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { fetchDictDataByType } from "#src/api/system/dict";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DICT_DEFAULT_CONFIG } from "./config";

/**
 * 字典 Hook 选项
 */
export interface UseDictOptions extends Omit<
	UseQueryOptions<DictDataItem[]>,
	"queryKey" | "queryFn"
> {
	/**
	 * 是否禁用所有选项（默认：false）
	 */
	disabled?: boolean;
}

/**
 * 字典 Hook 返回值
 */
export interface UseDictReturn {
	/**
	 * 原始字典数据数组（React Query 标准字段）
	 */
	data: DictDataItem[] | undefined;
	/**
	 * 转换后的选项数组（用于 Select 等组件，保留所有原始字段 + label/value）
	 */
	options: DictOption[] | undefined;
	/**
	 * 根据 value 查找字典项的 Map
	 */
	valueMap: Map<string, DictDataItem>;
	/**
	 * 根据 label 查找字典项的 Map
	 */
	labelMap: Map<string, DictDataItem>;
	/**
	 * 根据 dictCode 查找字典项的 Map
	 */
	codeMap: Map<number, DictDataItem>;
	/**
	 * 根据 value 获取 label
	 */
	getLabel: (value: string) => string | undefined;
	/**
	 * 根据 label 获取 value
	 */
	getValue: (label: string) => string | undefined;
	/**
	 * 根据 value 获取完整的字典项
	 */
	getItem: (value: string) => DictDataItem | undefined;
	/**
	 * 根据 dictCode 获取字典项
	 */
	getItemByCode: (code: number) => DictDataItem | undefined;
	/**
	 * 根据 label 获取字典项
	 */
	getItemByLabel: (label: string) => DictDataItem | undefined;
	/**
	 * 根据 value 查找字典项（数组方法）
	 */
	findByValue: (value: string) => DictDataItem | undefined;
	/**
	 * 根据 label 查找字典项（数组方法）
	 */
	findByLabel: (label: string) => DictDataItem | undefined;
	/**
	 * 根据 dictCode 查找字典项
	 */
	findByCode: (code: number) => DictDataItem | undefined;
	/**
	 * 翻译方法：根据 value 获取 label（用于列表渲染）
	 */
	translate: (value: string | null | undefined) => string | undefined;
	/**
	 * 批量翻译：根据 value 数组获取 label 数组
	 */
	translateBatch: (values: (string | null | undefined)[]) => (string | undefined)[];
	/**
	 * 表格列渲染函数：直接用于 Table Columns 的 render
	 * 适配 antd Table Columns render 签名：(value, record, index) => ReactNode
	 * 第一个参数 value 就是字段值（当设置了 dataIndex 时）
	 */
	renderLabel: (value: any, record?: any, index?: number) => React.ReactNode;
	/**
	 * React Query 标准属性
	 */
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => void;
	[key: string]: unknown;
}

/**
 * 将字典数据转换为选项格式
 * 保留所有原始字段，并添加 label 和 value 字段
 */
export function transformDictToOptions(
	data: DictDataItem[] | undefined,
	disabled = false,
): DictOption[] | undefined {
	if (!data) {
		return undefined;
	}
	return data.map((item) => ({
		...item,
		label: item.dictLabel,
		value: item.dictValue,
		disabled: disabled || item.status !== DICT_DEFAULT_CONFIG.ENABLED_STATUS,
	}));
}

/**
 * 创建字典查找 Map
 */
export function createDictMaps(data: DictDataItem[] | undefined) {
	const valueMap = new Map<string, DictDataItem>();
	const labelMap = new Map<string, DictDataItem>();
	const codeMap = new Map<number, DictDataItem>();

	if (data) {
		for (const item of data) {
			valueMap.set(item.dictValue, item);
			labelMap.set(item.dictLabel, item);
			codeMap.set(item.dictCode, item);
		}
	}

	return { valueMap, labelMap, codeMap };
}

/**
 * 获取字典数据的 Hook
 *
 * 提供丰富的字典数据访问和操作方法，包括：
 * - 原始数据访问（data）
 * - 转换后的选项（options，保留所有原始字段 + label/value）
 * - 快速查找 Map（valueMap, labelMap, codeMap）
 * - 便捷查找方法（getLabel, getValue, getItem 等）
 *
 * @param dictType - 字典类型
 * @param options - 可选配置项
 * @returns 字典数据及相关工具方法
 *
 * @see README.md 查看详细使用文档和示例
 */
export function useDict(
	dictType: string | undefined | null,
	options?: UseDictOptions,
): UseDictReturn {
	const {
		disabled = false,
		enabled = true,
		staleTime = DICT_DEFAULT_CONFIG.STALE_TIME,
		gcTime = DICT_DEFAULT_CONFIG.GC_TIME,
		...restOptions
	} = options || {};

	const queryResult = useQuery<DictDataItem[]>({
		queryKey: ["dict", dictType],
		queryFn: async () => {
			if (!dictType) {
				return [];
			}
			const response = await fetchDictDataByType(dictType);
			return response.data || [];
		},
		enabled: enabled && !!dictType,
		staleTime,
		gcTime,
		refetchOnWindowFocus: DICT_DEFAULT_CONFIG.REFETCH_ON_WINDOW_FOCUS,
		refetchOnReconnect: DICT_DEFAULT_CONFIG.REFETCH_ON_RECONNECT,
		...restOptions,
	});

	const processedData = queryResult.data;

	// 转换后的选项
	const dictOptions = useMemo(
		() => transformDictToOptions(processedData, disabled),
		[processedData, disabled],
	);

	// 创建查找 Map
	const { valueMap, labelMap, codeMap } = useMemo(
		() => createDictMaps(processedData),
		[processedData],
	);

	// 便捷方法
	const getLabel = useMemo(() => (value: string) => valueMap.get(value)?.dictLabel, [valueMap]);

	const getValue = useMemo(() => (label: string) => labelMap.get(label)?.dictValue, [labelMap]);

	const getItem = useMemo(() => (value: string) => valueMap.get(value), [valueMap]);

	const getItemByCode = useMemo(() => (code: number) => codeMap.get(code), [codeMap]);

	const getItemByLabel = useMemo(() => (label: string) => labelMap.get(label), [labelMap]);

	const findByValue = useMemo(
		() => (value: string) => processedData?.find((item) => item.dictValue === value),
		[processedData],
	);

	const findByLabel = useMemo(
		() => (label: string) => processedData?.find((item) => item.dictLabel === label),
		[processedData],
	);

	const findByCode = useMemo(
		() => (code: number) => processedData?.find((item) => item.dictCode === code),
		[processedData],
	);

	// 翻译方法（用于列表渲染）
	const translate = useMemo(
		() => (value: string | null | undefined) => {
			if (!value) {
				return undefined;
			}
			return valueMap.get(value)?.dictLabel;
		},
		[valueMap],
	);

	// 批量翻译
	const translateBatch = useMemo(
		() => (values: (string | null | undefined)[]) => {
			return values.map((value) => translate(value));
		},
		[translate],
	);

	// 表格列渲染函数（适配 antd Table Columns render 签名）
	// 适配 antd Table Columns render: (value, record, index) => ReactNode
	// 第一个参数 value 就是字段值（当设置了 dataIndex 时）
	const renderLabel = useMemo(
		() =>
			(value: any, _record?: any, _index?: number): ReactNode => {
				// 将 value 转换为字符串（处理 null、undefined、数字等情况）
				const dictValue =
					value === null || value === undefined
						? undefined
						: typeof value === "string"
							? value
							: String(value);
				const label = translate(dictValue);
				return label ?? dictValue ?? DICT_DEFAULT_CONFIG.EMPTY_VALUE_DISPLAY;
			},
		[translate],
	);

	return {
		...queryResult,
		data: processedData,
		options: dictOptions,
		valueMap,
		labelMap,
		codeMap,
		getLabel,
		getValue,
		getItem,
		getItemByCode,
		getItemByLabel,
		findByValue,
		findByLabel,
		findByCode,
		translate,
		translateBatch,
		renderLabel,
	};
}
