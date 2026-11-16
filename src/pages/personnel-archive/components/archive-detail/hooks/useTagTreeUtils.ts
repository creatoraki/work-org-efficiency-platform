/**
 * 标签树工具函数 Hook
 *
 * 提供树形数据处理的工具函数
 */

import type { TreeTagItem, TreeTagNode } from "#src/api/personnel-archive/archive-management";
import type React from "react";
import { useCallback } from "react";

/**
 * useTagTreeUtils 返回值
 */
interface UseTagTreeUtilsReturn {
	/** 递归收集所有标签及其 tagId */
	collectAllTags: (nodes: TreeTagNode[]) => { tags: TreeTagItem[]; tagIds: Set<string> };
	/** 根据状态列表过滤树节点中的标签 */
	filterTreeNodesByStatus: (nodes: TreeTagNode[], visibleStatuses: string[]) => TreeTagNode[];
	/** 收集所有 tagId 的集合 */
	collectAllTagIds: (nodes: TreeTagNode[]) => Set<string>;
	/** 判断一个 key 是否是标签节点 */
	isTagNodeKey: (key: React.Key, tagIdsSet: Set<string>) => boolean;
	/** 递归收集所有标签节点 key（tagId） */
	collectTagNodeKeys: (node: TreeTagNode, result: string[]) => void;
	/** 递归查找节点 */
	findNode: (nodeId: string, node: TreeTagNode) => TreeTagNode | null;
	/** 在节点树中查找标签 */
	findTagInNode: (node: TreeTagNode, tagId: string) => TreeTagItem | null;
	/** 根据 tagId 查找包含该标签的节点 */
	findNodeByTagId: (tagId: string, nodes: TreeTagNode[]) => TreeTagNode | null;
	/** 获取节点的父节点 key */
	getParentKey: (key: React.Key, tree: TreeTagNode[]) => React.Key | undefined;
	/** 获取节点的所有父节点路径（从根节点到当前节点） */
	getAllParentKeys: (key: React.Key, tree: TreeTagNode[]) => React.Key[];
	/** 收集树形数据中所有实际存在的节点 key */
	collectTreeKeys: (nodes: any[]) => Set<React.Key>;
	/** 过滤掉树中不存在的 keys */
	filterValidKeys: (keys: React.Key[], treeKeys: Set<React.Key>) => React.Key[];
}

/**
 * 标签树工具函数 Hook
 */
export function useTagTreeUtils(): UseTagTreeUtilsReturn {
	/**
	 * 递归收集所有标签及其 tagId
	 *
	 * @param nodes - 树形节点数组
	 * @returns 标签数组和 tagId 集合
	 */
	const collectAllTags = useCallback(
		(nodes: TreeTagNode[]): { tags: TreeTagItem[]; tagIds: Set<string> } => {
			const tags: TreeTagItem[] = [];
			const tagIds = new Set<string>();
			const traverse = (node: TreeTagNode) => {
				if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
					node.tags.forEach((tag) => {
						tags.push(tag);
						const tagId = (tag as any).tagId;
						if (tagId != null) {
							tagIds.add(String(tagId));
						}
					});
				}
				if (node.children && Array.isArray(node.children)) {
					node.children.forEach(traverse);
				}
			};
			nodes.forEach(traverse);
			return { tags, tagIds };
		},
		[],
	);

	/**
	 * 根据状态列表过滤树节点中的标签
	 *
	 * @param nodes - 树形节点数组
	 * @param visibleStatuses - 可见的状态列表（空数组表示不过滤）
	 * @returns 过滤后的树形节点数组
	 */
	const filterTreeNodesByStatus = useCallback(
		(nodes: TreeTagNode[], visibleStatuses: string[]): TreeTagNode[] => {
			// 如果状态列表为空，表示不过滤，返回所有数据
			if (visibleStatuses.length === 0) {
				return nodes;
			}

			const filterNode = (node: TreeTagNode): TreeTagNode | null => {
				// 过滤标签：只保留状态在 visibleStatuses 中的标签
				const filteredTags =
					node.tags?.filter((tag) => visibleStatuses.includes(String(tag.status))) ?? [];

				// 递归过滤子节点
				const filteredChildren = node.children
					? node.children
							.map(filterNode)
							.filter((child): child is TreeTagNode => child !== null)
					: undefined;

				// 如果节点没有标签且没有子节点，则过滤掉该节点
				if (
					filteredTags.length === 0 &&
					(!filteredChildren || filteredChildren.length === 0)
				) {
					return null;
				}

				return {
					...node,
					tags: filteredTags.length > 0 ? filteredTags : undefined,
					children: filteredChildren,
				};
			};

			return nodes.map(filterNode).filter((node): node is TreeTagNode => node !== null);
		},
		[],
	);

	/**
	 * 收集所有 tagId 的集合，用于判断一个 key 是否是标签节点
	 *
	 * @param nodes - 树形节点数组
	 * @returns tagId 集合
	 */
	const collectAllTagIds = useCallback(
		(nodes: TreeTagNode[]): Set<string> => {
			const { tagIds } = collectAllTags(nodes);
			return tagIds;
		},
		[collectAllTags],
	);

	/**
	 * 判断一个 key 是否是标签节点
	 *
	 * @param key - 节点 key
	 * @param tagIdsSet - tagId 集合
	 * @returns 是否是标签节点
	 */
	const isTagNodeKey = useCallback((key: React.Key, tagIdsSet: Set<string>): boolean => {
		return tagIdsSet.has(String(key));
	}, []);

	/**
	 * 递归收集所有标签节点 key（tagId）
	 *
	 * @param node - 树形节点
	 * @param result - 结果数组（用于收集 key）
	 */
	const collectTagNodeKeys = useCallback(
		(node: TreeTagNode, result: string[]) => {
			// 基于 collectAllTagIds 实现，收集当前节点及其子节点的所有 tagId
			const nodeTagIds = collectAllTagIds([node]);
			nodeTagIds.forEach((tagId) => {
				if (!result.includes(tagId)) {
					result.push(tagId);
				}
			});
		},
		[collectAllTagIds],
	);

	/**
	 * 递归查找节点
	 *
	 * @param nodeId - 节点ID
	 * @param node - 当前节点
	 * @returns 找到的节点，如果不存在则返回 null
	 */
	const findNode = useCallback((nodeId: string, node: TreeTagNode): TreeTagNode | null => {
		if (node.id === nodeId) {
			return node;
		}
		if (node.children && Array.isArray(node.children)) {
			for (const child of node.children) {
				const found = findNode(nodeId, child);
				if (found) {
					return found;
				}
			}
		}
		return null;
	}, []);

	/**
	 * 在节点树中查找标签
	 *
	 * @param node - 当前节点
	 * @param tagId - 标签ID
	 * @returns 找到的标签，如果不存在则返回 null
	 */
	const findTagInNode = useCallback((node: TreeTagNode, tagId: string): TreeTagItem | null => {
		if (node.tags && Array.isArray(node.tags)) {
			const tag = node.tags.find((t) => String(t.id) === tagId);
			if (tag) {
				return tag;
			}
		}
		if (node.children && Array.isArray(node.children)) {
			for (const child of node.children) {
				const found = findTagInNode(child, tagId);
				if (found) {
					return found;
				}
			}
		}
		return null;
	}, []);

	/**
	 * 根据 tagId 查找包含该标签的节点
	 *
	 * @param tagId - 标签ID（tag.tagId）
	 * @param nodes - 树形节点数组
	 * @returns 找到的节点，如果不存在则返回 null
	 */
	const findNodeByTagId = useCallback(
		(tagId: string, nodes: TreeTagNode[]): TreeTagNode | null => {
			for (const node of nodes) {
				// 检查当前节点的 tags 中是否包含该 tagId
				if (node.tags && Array.isArray(node.tags)) {
					const tag = node.tags.find((t) => {
						const tTagId = (t as any).tagId;
						return tTagId != null && String(tTagId) === tagId;
					});
					if (tag) {
						return node;
					}
				}
				// 递归查找子节点
				if (node.children && Array.isArray(node.children)) {
					const found = findNodeByTagId(tagId, node.children);
					if (found) {
						return found;
					}
				}
			}
			return null;
		},
		[],
	);

	/**
	 * 获取节点的父节点 key
	 *
	 * @param key - 节点 key
	 * @param tree - 树形数据
	 * @returns 父节点 key，如果不存在则返回 undefined
	 */
	const getParentKey = useCallback(
		(key: React.Key, tree: TreeTagNode[]): React.Key | undefined => {
			for (const node of tree) {
				if (node.children && Array.isArray(node.children)) {
					if (node.children.some((item) => item.id === key)) {
						return node.id;
					}
					const found = getParentKey(key, node.children);
					if (found) {
						return found;
					}
				}
			}
			return undefined;
		},
		[],
	);

	/**
	 * 获取节点的所有父节点路径（从根节点到当前节点）
	 *
	 * @param key - 节点 key
	 * @param tree - 树形数据
	 * @returns 父节点 key 数组
	 */
	const getAllParentKeys = useCallback(
		(key: React.Key, tree: TreeTagNode[]): React.Key[] => {
			const parentKeys: React.Key[] = [];
			let currentKey: React.Key | undefined = key;

			while (currentKey) {
				const parentKey = getParentKey(currentKey, tree);
				if (parentKey) {
					parentKeys.push(parentKey);
					currentKey = parentKey;
				} else {
					break;
				}
			}

			return parentKeys;
		},
		[getParentKey],
	);

	/**
	 * 收集树形数据中所有实际存在的节点 key
	 *
	 * @param nodes - 树形节点数组
	 * @returns 所有节点 key 的集合
	 */
	const collectTreeKeys = useCallback((nodes: any[]): Set<React.Key> => {
		const keys = new Set<React.Key>();
		const traverse = (nodeList: any[]) => {
			for (const node of nodeList) {
				if (node.id) {
					keys.add(node.id);
				}
				if (node.children && Array.isArray(node.children)) {
					traverse(node.children);
				}
			}
		};
		traverse(nodes);
		return keys;
	}, []);

	/**
	 * 过滤掉树中不存在的 keys
	 *
	 * @param keys - 待过滤的 key 数组
	 * @param treeKeys - 树中实际存在的 key 集合
	 * @returns 过滤后的 key 数组
	 */
	const filterValidKeys = useCallback(
		(keys: React.Key[], treeKeys: Set<React.Key>): React.Key[] => {
			return keys.filter((key) => treeKeys.has(key));
		},
		[],
	);

	return {
		collectAllTags,
		filterTreeNodesByStatus,
		collectAllTagIds,
		isTagNodeKey,
		collectTagNodeKeys,
		findNode,
		findTagInNode,
		findNodeByTagId,
		getParentKey,
		getAllParentKeys,
		collectTreeKeys,
		filterValidKeys,
	};
}
