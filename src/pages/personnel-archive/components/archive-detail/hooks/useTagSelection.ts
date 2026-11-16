/**
 * 标签选择逻辑 Hook
 *
 * 负责标签节点的选择、展开、勾选等交互逻辑
 */

import type { TreeTagNode } from "#src/api/personnel-archive/archive-management";
import type React from "react";
import { useCallback, useState } from "react";

/**
 * useTagSelection 参数
 */
interface UseTagSelectionParams {
	/** 树形数据 */
	archiveDetailData: TreeTagNode[];
	/** 所有 tagId 集合 */
	tagIdsSet: Set<string>;
	/** 所有分类节点 key 集合 */
	categoryKeysSet: Set<React.Key>;
	/** 判断 key 是否是标签节点 */
	isTagNodeKey: (key: React.Key, tagIdsSet: Set<string>) => boolean;
	/** 查找节点 */
	findNode: (nodeId: string, node: TreeTagNode) => TreeTagNode | null;
	/** 根据 tagId 查找包含该标签的节点 */
	findNodeByTagId: (tagId: string, nodes: TreeTagNode[]) => TreeTagNode | null;
	/** 获取节点的所有父节点路径 */
	getAllParentKeys: (key: React.Key, tree: TreeTagNode[]) => React.Key[];
	/** 收集标签节点 key */
	collectTagNodeKeys: (node: TreeTagNode, result: string[]) => void;
	/** 过滤有效的 keys */
	filterValidKeys: (keys: React.Key[], treeKeys: Set<React.Key>) => React.Key[];
}

/**
 * useTagSelection 返回值
 */
interface UseTagSelectionReturn {
	/** 选中的标签节点 ID 列表 */
	selectedTagNodeIds: string[];
	/** 设置选中的标签节点 ID 列表 */
	setSelectedTagNodeIds: React.Dispatch<React.SetStateAction<string[]>>;
	/** 展开的节点 key 列表 */
	expandedKeys: React.Key[];
	/** 设置展开的节点 key 列表 */
	setExpandedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
	/** 是否自动展开父节点 */
	isAutoExpandParent: boolean;
	/** 设置是否自动展开父节点 */
	setIsAutoExpandParent: React.Dispatch<React.SetStateAction<boolean>>;
	/** 勾选的节点 key 列表 */
	checkedKeys: React.Key[];
	/** 设置勾选的节点 key 列表 */
	setCheckedKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
	/** 处理树节点勾选事件 */
	handleCheck: (
		checkedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
	) => void;
	/** 处理树节点展开事件 */
	handleExpand: (newExpandedKeys: React.Key[]) => void;
	/** 全选树的所有标签节点 */
	selectAllTags: () => void;
}

/**
 * 标签选择逻辑 Hook
 */
export function useTagSelection({
	archiveDetailData,
	tagIdsSet,
	categoryKeysSet,
	isTagNodeKey,
	findNode,
	findNodeByTagId,
	getAllParentKeys,
	collectTagNodeKeys,
	filterValidKeys,
}: UseTagSelectionParams): UseTagSelectionReturn {
	const [selectedTagNodeIds, setSelectedTagNodeIds] = useState<string[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [isAutoExpandParent, setIsAutoExpandParent] = useState(true);
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

	/**
	 * 处理树节点勾选事件
	 *
	 * 核心逻辑：根据勾选的节点，动态更新 selectedTagNodeIds
	 * 确保：tag = 记录 = 表格行一一对应
	 *
	 * @param checkedKeysValue - 勾选的节点 key 数组或对象
	 */
	const handleCheck = useCallback(
		(checkedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
			const keys = Array.isArray(checkedKeysValue)
				? checkedKeysValue
				: checkedKeysValue.checked;

			// 合并分类节点 key 和标签节点 key（tagId）
			// 使用缓存的 categoryKeysSet 和 tagIdsSet，避免重复计算
			const allTreeKeys = new Set<React.Key>([...categoryKeysSet, ...Array.from(tagIdsSet)]);

			const validKeys = filterValidKeys(keys, allTreeKeys);
			setCheckedKeys(validKeys);

			// 数据为空时，清空选中的标签
			if (!archiveDetailData?.length) {
				setSelectedTagNodeIds([]);
				return;
			}

			// 使用缓存的 tagIdsSet，避免重复计算
			// 收集需要展开的节点（选中的节点及其所有父节点）
			const keysToExpand = new Set<React.Key>();
			const newSelectedTagNodeIds: string[] = [];
			const seenIds = new Set<string>();
			const keysSet = new Set(validKeys.map((k) => String(k)));

			// 先处理标签节点（叶子节点），确保它们能被正确识别
			const tagKeys: string[] = [];
			const categoryKeyArray: React.Key[] = [];

			// 分离标签节点和分类节点
			for (const key of validKeys) {
				const keyStr = String(key);
				if (isTagNodeKey(keyStr, tagIdsSet)) {
					tagKeys.push(keyStr);
				} else {
					categoryKeyArray.push(key);
				}
			}

			// 处理标签节点（叶子节点）：直接添加到选中列表
			for (const tagKey of tagKeys) {
				if (!seenIds.has(tagKey)) {
					newSelectedTagNodeIds.push(tagKey);
					seenIds.add(tagKey);

					// 获取该标签节点的所有父节点并添加到展开列表
					// 找到包含该标签的分类节点
					const tagId = tagKey;
					const node = findNodeByTagId(tagId, archiveDetailData);
					if (node) {
						// 找到标签所属的节点，展开该节点及其所有父节点
						const nodeId = node.id;
						const parentKeys = getAllParentKeys(nodeId, archiveDetailData);
						for (const parentKey of parentKeys) {
							keysToExpand.add(parentKey);
						}
						keysToExpand.add(nodeId);
					}
				}
			}

			// 处理分类节点：收集其下所有被选中的标签节点
			for (const key of categoryKeyArray) {
				const keyStr = String(key);

				// 获取该节点的所有父节点并添加到展开列表
				const parentKeys = getAllParentKeys(key, archiveDetailData);
				for (const parentKey of parentKeys) {
					keysToExpand.add(parentKey);
				}

				// 查找节点
				let node: TreeTagNode | null = null;
				for (const rootNode of archiveDetailData) {
					node = findNode(keyStr, rootNode);
					if (node) {
						break;
					}
				}

				// 如果选中的节点有子节点，也需要展开它
				if (node?.children?.length) {
					keysToExpand.add(key);
				}

				if (node) {
					// 如果是分类节点，收集其子标签节点
					// 仅当这些标签节点也在 keys 中（被勾选）时才添加
					const tagIds: string[] = [];
					collectTagNodeKeys(node, tagIds);
					for (const tagId of tagIds) {
						if (keysSet.has(tagId) && !seenIds.has(tagId)) {
							newSelectedTagNodeIds.push(tagId);
							seenIds.add(tagId);
						}
					}
				}
			}

			// 更新展开的节点，保留原有的展开状态，并添加新需要展开的节点
			setExpandedKeys((prevExpandedKeys) => {
				const allExpandedKeys = new Set([...prevExpandedKeys, ...Array.from(keysToExpand)]);
				// 使用缓存的 categoryKeysSet，过滤掉树中不存在的 key
				// 展开的节点只包括分类节点，不包括标签节点
				const validExpandedKeys = filterValidKeys(
					Array.from(allExpandedKeys),
					categoryKeysSet,
				);
				return validExpandedKeys;
			});

			setSelectedTagNodeIds(newSelectedTagNodeIds);
		},
		[
			archiveDetailData,
			categoryKeysSet,
			tagIdsSet,
			filterValidKeys,
			getAllParentKeys,
			findNode,
			collectTagNodeKeys,
			isTagNodeKey,
			findNodeByTagId,
		],
	);

	/**
	 * 处理树节点展开事件
	 *
	 * @param newExpandedKeys - 新的展开节点 key 数组
	 */
	const handleExpand = useCallback(
		(newExpandedKeys: React.Key[]) => {
			// 使用缓存的 categoryKeysSet，避免重复计算
			// 展开的节点只包括分类节点，不包括标签节点
			const validExpandedKeys = filterValidKeys(newExpandedKeys, categoryKeysSet);
			setExpandedKeys(validExpandedKeys);
			setIsAutoExpandParent(false);
		},
		[categoryKeysSet, filterValidKeys],
	);

	/**
	 * 全选树的所有标签节点
	 *
	 * 用于重置筛选条件时，自动选中所有可见的标签节点
	 */
	const selectAllTags = useCallback(() => {
		if (!archiveDetailData?.length) {
			return;
		}

		// 收集所有标签节点 keys
		const rootKeys: React.Key[] = [];
		const tagKeys: string[] = [];
		const seenTagKeys = new Set<string>();

		const collectKeys = (nodes: TreeTagNode[]) => {
			for (const node of nodes) {
				rootKeys.push(node.id);
				if (node.tags?.length) {
					for (const tag of node.tags) {
						const tagId = (tag as any).tagId;
						if (tagId != null) {
							const tagKey = String(tagId);
							if (!seenTagKeys.has(tagKey)) {
								tagKeys.push(tagKey);
								seenTagKeys.add(tagKey);
							}
						}
					}
				}
				if (node.children?.length) {
					collectKeys(node.children);
				}
			}
		};
		collectKeys(archiveDetailData);

		// 设置勾选状态
		setCheckedKeys([...rootKeys, ...tagKeys]);
		setSelectedTagNodeIds(tagKeys);

		// 展开包含标签的节点及其父节点路径
		const keysToExpand = new Set<React.Key>();
		const parentMap = new Map<React.Key, React.Key>();

		const findNodesWithTagsAndBuildParentMap = (
			nodes: TreeTagNode[],
			parentId?: React.Key,
		): TreeTagNode[] => {
			const result: TreeTagNode[] = [];
			nodes.forEach((node) => {
				if (parentId !== undefined) {
					parentMap.set(node.id, parentId);
				}
				if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
					result.push(node);
				}
				if (node.children && Array.isArray(node.children) && node.children.length > 0) {
					result.push(...findNodesWithTagsAndBuildParentMap(node.children, node.id));
				}
			});
			return result;
		};

		const nodesWithTags = findNodesWithTagsAndBuildParentMap(archiveDetailData);

		// 展开包含标签的节点及其所有父节点
		nodesWithTags.forEach((node) => {
			keysToExpand.add(node.id);
			let currentId: React.Key | undefined = node.id;
			while (currentId !== undefined) {
				const parentId = parentMap.get(currentId);
				if (parentId !== undefined) {
					keysToExpand.add(parentId);
					currentId = parentId;
				} else {
					break;
				}
			}
		});

		// 使用缓存的 categoryKeysSet，过滤掉树中不存在的 key
		const validExpandedKeys = filterValidKeys(Array.from(keysToExpand), categoryKeysSet);
		setExpandedKeys(validExpandedKeys);
	}, [
		archiveDetailData,
		categoryKeysSet,
		filterValidKeys,
		setCheckedKeys,
		setSelectedTagNodeIds,
		setExpandedKeys,
	]);

	return {
		selectedTagNodeIds,
		setSelectedTagNodeIds,
		expandedKeys,
		setExpandedKeys,
		isAutoExpandParent,
		setIsAutoExpandParent,
		checkedKeys,
		setCheckedKeys,
		handleCheck,
		handleExpand,
		selectAllTags,
	};
}
