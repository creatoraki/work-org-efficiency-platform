import type { DictDataItem } from "#src/api/system/dict/types";

/**
 * Cascader 树形选项类型
 */
export interface CascaderOption {
	label: string;
	value: string;
	children?: CascaderOption[];
}

/**
 * 将字典数据构建为树形结构（用于 Cascader 组件）
 *
 * 根据 dictValue 的层级关系构建树：
 * - 一级节点：dictValue 长度为 2（如：01, 02, 03...）
 * - 二级节点：dictValue 长度为 4，以父级 dictValue 开头（如：0101）
 * - 三级节点：dictValue 长度为 6，以父级 dictValue 开头（如：010101）
 *
 * @param dictData - 字典数据数组
 * @returns 树形结构数组
 *
 * @example
 * ```ts
 * const { data } = useDict(TAG_DICT_KEYS.BUSINESS_CATEGORY);
 * const treeOptions = buildDictTree(data);
 * ```
 */
export function buildDictTree(dictData: DictDataItem[] | undefined): CascaderOption[] {
	if (!dictData || dictData.length === 0) {
		return [];
	}

	// 按 dictValue 长度和值排序
	const sortedData = [...dictData].sort((a, b) => {
		const aValue = a.dictValue || "";
		const bValue = b.dictValue || "";
		// 先按长度排序，再按值排序
		if (aValue.length !== bValue.length) {
			return aValue.length - bValue.length;
		}
		return aValue.localeCompare(bValue);
	});

	// 构建树形结构
	const buildTree = (items: typeof sortedData, parentValue = ""): CascaderOption[] => {
		const result: CascaderOption[] = [];

		for (const item of items) {
			const dictValue = item.dictValue || "";
			const dictLabel = item.dictLabel || "";

			// 判断是否为当前层级的子节点
			if (parentValue === "") {
				// 一级节点：dictValue 长度为 2
				if (dictValue.length === 2) {
					const children = buildTree(items, dictValue);
					result.push({
						label: dictLabel,
						value: dictValue,
						children: children.length > 0 ? children : undefined,
					});
				}
			} else {
				// 子节点：dictValue 以 parentValue 开头
				if (
					dictValue.startsWith(parentValue) &&
					dictValue.length === parentValue.length + 2
				) {
					const children = buildTree(items, dictValue);
					result.push({
						label: dictLabel,
						value: dictValue,
						children: children.length > 0 ? children : undefined,
					});
				}
			}
		}

		return result;
	};

	return buildTree(sortedData);
}
