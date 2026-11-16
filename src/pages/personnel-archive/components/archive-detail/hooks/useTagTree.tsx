/**
 * 标签树处理 Hook
 *
 * 负责树形数据的处理、过滤和转换
 */

import type { TreeTagItem, TreeTagNode } from "#src/api/personnel-archive/archive-management";
import { Tag } from "antd";
import React, { useCallback, useMemo } from "react";

/**
 * useTagTree 参数
 */
interface UseTagTreeParams {
	/** 原始树形数据 */
	rawTreeData: TreeTagNode[];
	/** 可见状态列表 */
	visibleStatuses: string[];
	/** 标签名称筛选 */
	tagNameFilter: string;
	/** 状态筛选 */
	statusFilter: string | undefined;
	/** 是否为审核模式 */
	isAuditMode: boolean;
	/** 获取审核状态标签 */
	getApprovalStatusLabel: (status: string) => string | undefined;
	/** 获取审核状态字典项 */
	getApprovalStatusItem: (status: string) => { listClass?: string | null } | undefined;
	/** 获取标签状态标签 */
	getTagStatusLabel: (status: string) => string | undefined;
	/** 获取标签状态字典项 */
	getTagStatusItem: (status: string) => { listClass?: string | null } | undefined;
}

/**
 * useTagTree 返回值
 */
interface UseTagTreeReturn {
	/** 过滤后的树形数据 */
	filteredTreeData: TreeTagNode[];
	/** 用于显示的树形数据（Tree 组件格式） */
	treeData: any[];
	/** 判断标签是否符合筛选条件 */
	matchesFilter: (tag: TreeTagItem) => boolean;
}

/**
 * 根据状态列表过滤树节点中的标签
 *
 * @param nodes - 树形节点数组
 * @param visibleStatuses - 可见的状态列表（空数组表示不过滤）
 * @returns 过滤后的树形节点数组
 */
function filterTreeNodesByStatus(nodes: TreeTagNode[], visibleStatuses: string[]): TreeTagNode[] {
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
			? node.children.map(filterNode).filter((child): child is TreeTagNode => child !== null)
			: undefined;

		// 如果节点没有标签且没有子节点，则过滤掉该节点
		if (filteredTags.length === 0 && (!filteredChildren || filteredChildren.length === 0)) {
			return null;
		}

		return {
			...node,
			tags: filteredTags.length > 0 ? filteredTags : undefined,
			children: filteredChildren,
		};
	};

	return nodes.map(filterNode).filter((node): node is TreeTagNode => node !== null);
}

/**
 * 标签树处理 Hook
 */
export function useTagTree({
	rawTreeData,
	visibleStatuses,
	tagNameFilter,
	statusFilter,
	isAuditMode,
	getApprovalStatusLabel,
	getApprovalStatusItem,
	getTagStatusLabel,
	getTagStatusItem,
}: UseTagTreeParams): UseTagTreeReturn {
	/**
	 * 根据 status 过滤树形数据
	 */
	const filteredTreeData = useMemo(() => {
		if (!rawTreeData.length) {
			return [] as TreeTagNode[];
		}
		return filterTreeNodesByStatus(rawTreeData, visibleStatuses);
	}, [rawTreeData, visibleStatuses]);

	/**
	 * 判断标签是否符合筛选条件
	 */
	const matchesFilter = useCallback(
		(tag: TreeTagItem): boolean => {
			// 标签名称筛选
			if (tagNameFilter) {
				const tagName = tag.tagName || "";
				if (!tagName.toLowerCase().includes(tagNameFilter.toLowerCase())) {
					return false;
				}
			}

			// 状态筛选
			if (statusFilter) {
				const tagStatus = String(tag.status || "1");
				if (tagStatus !== statusFilter) {
					return false;
				}
			}

			return true;
		},
		[tagNameFilter, statusFilter],
	);

	/**
	 * 转换树形数据为 Tree 组件格式
	 */
	const treeData = useMemo(() => {
		const convertNode = (node: TreeTagNode): any => {
			const result: any = {
				id: node.id,
				name: node.name,
				children: undefined,
			};

			// 处理标签：为每个标签创建一个子节点
			if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
				const tagNodes = node.tags.filter(matchesFilter).map((tag) => {
					const tagId = (tag as any).tagId;
					const status = String(tag.status || "1");
					const dictItem = isAuditMode
						? getApprovalStatusItem(status)
						: getTagStatusItem(status);
					const label = isAuditMode
						? getApprovalStatusLabel(status)
						: getTagStatusLabel(status);

					return {
						id: String(tagId),
						name: (
							<div className="flex items-center gap-2">
								<span>{tag.tagName}</span>
								{dictItem?.listClass && (
									<Tag color={dictItem.listClass} bordered={false}>
										{label || status}
									</Tag>
								)}
							</div>
						),
						children: undefined,
					};
				});

				// 如果有标签节点，将它们作为子节点
				if (tagNodes.length > 0) {
					result.children = tagNodes;
				}
			}

			// 递归处理子节点
			if (node.children && Array.isArray(node.children) && node.children.length > 0) {
				const childNodes = node.children.map(convertNode).filter((child: any) => {
					// 保留有标签子节点或有子节点的节点
					return child.children && child.children.length > 0;
				});

				if (childNodes.length > 0) {
					// 如果当前节点已有标签子节点，将分类子节点也加入
					if (result.children && result.children.length > 0) {
						result.children = [...result.children, ...childNodes];
					} else {
						result.children = childNodes;
					}
				}
			}

			return result;
		};

		return filteredTreeData.map(convertNode).filter((node: any) => {
			// 只保留有子节点的节点（包括标签节点和分类节点）
			return node.children && node.children.length > 0;
		});
	}, [
		filteredTreeData,
		matchesFilter,
		isAuditMode,
		getApprovalStatusLabel,
		getApprovalStatusItem,
		getTagStatusLabel,
		getTagStatusItem,
	]);

	return {
		filteredTreeData,
		treeData,
		matchesFilter,
	};
}
