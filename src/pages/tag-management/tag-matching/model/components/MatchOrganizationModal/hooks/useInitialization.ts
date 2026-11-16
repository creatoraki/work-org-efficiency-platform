import type { OrganizationNode } from "../types";
import { compact } from "lodash-es";
import { useEffect } from "react";
import { expandPath, findNodeById, getExpandPathsForNodes } from "../utils/treeUtils";

/**
 * 初始化逻辑管理 Hook
 *
 * 处理弹窗打开时的初始化逻辑，包括回显选中的组织ID和层级
 *
 * @param open - 弹窗是否打开
 * @param isInitializedRef - 初始化标志 ref
 * @param externalTreeData - 外部传入的树数据
 * @param treeData - 处理后的树数据
 * @param initialSelectedOrgId - 初始选中的组织ID（用于回显）
 * @param initialSelectedOrgLevel - 初始选中的组织层级（用于回显）
 * @param nodeIdMap - 节点ID映射表
 * @param levelNodeMap - 层级节点映射表
 * @param parentMap - 父节点映射表
 * @param setCheckedKeys - 设置选中节点 keys 的方法
 * @param setExpandedKeys - 设置展开节点 keys 的方法
 * @param setAutoExpandParent - 设置是否自动展开父节点的方法
 * @param setQuickFilter - 设置快速筛选值的方法
 */
export function useInitialization(
	open: boolean,
	isInitializedRef: React.MutableRefObject<boolean>,
	externalTreeData: any,
	treeData: OrganizationNode[],
	initialSelectedOrgId: string | number | null | undefined,
	initialSelectedOrgLevel: string | null | undefined,
	nodeIdMap: Map<string, OrganizationNode>,
	levelNodeMap: Map<string, Set<string>>,
	parentMap: Map<string, string>,
	setCheckedKeys: (value: React.Key[]) => void,
	setExpandedKeys: (value: React.Key[]) => void,
	setAutoExpandParent: (value: boolean) => void,
	setQuickFilter: (value: string[]) => void,
) {
	useEffect(() => {
		// 重置初始化标志
		if (!open || !externalTreeData || treeData.length === 0) {
			isInitializedRef.current = false;
			return;
		}

		// 已经初始化过，不再重复初始化
		if (isInitializedRef.current) {
			return;
		}

		// 场景1：优先处理 orgId 回显
		if (initialSelectedOrgId) {
			const result = handleOrgIdInitialization(
				initialSelectedOrgId,
				initialSelectedOrgLevel,
				nodeIdMap,
				parentMap,
				setCheckedKeys,
				setExpandedKeys,
				setQuickFilter,
			);

			if (result) {
				isInitializedRef.current = true;
				return;
			}
		}

		// 场景2：只有 orgLevel 回显
		if (initialSelectedOrgLevel) {
			const result = handleOrgLevelInitialization(
				initialSelectedOrgLevel,
				levelNodeMap,
				parentMap,
				setCheckedKeys,
				setQuickFilter,
				setExpandedKeys,
				setAutoExpandParent,
			);

			if (result) {
				isInitializedRef.current = true;
				return;
			}
		}

		// 场景3：默认展开第一个节点
		isInitializedRef.current = true;
		if (treeData.length > 0) {
			setExpandedKeys([treeData[0].id]);
		}
	}, [
		open,
		externalTreeData,
		treeData,
		initialSelectedOrgId,
		initialSelectedOrgLevel,
		nodeIdMap,
		levelNodeMap,
		parentMap,
		isInitializedRef,
		setCheckedKeys,
		setExpandedKeys,
		setAutoExpandParent,
		setQuickFilter,
	]);
}

/**
 * 处理 orgId 初始化
 *
 * @param initialSelectedOrgId - 初始选中的组织ID（逗号分隔）
 * @param initialSelectedOrgLevel - 初始选中的组织层级（逗号分隔）
 * @param nodeIdMap - 节点ID映射表
 * @param parentMap - 父节点映射表
 * @param setCheckedKeys - 设置选中节点 keys 的方法
 * @param setExpandedKeys - 设置展开节点 keys 的方法
 * @param setQuickFilter - 设置快速筛选值的方法
 * @returns 是否成功初始化
 */
function handleOrgIdInitialization(
	initialSelectedOrgId: string | number,
	initialSelectedOrgLevel: string | null | undefined,
	nodeIdMap: Map<string, OrganizationNode>,
	parentMap: Map<string, string>,
	setCheckedKeys: (value: React.Key[]) => void,
	setExpandedKeys: (value: React.Key[]) => void,
	setQuickFilter: (value: string[]) => void,
): boolean {
	const orgIdStr = String(initialSelectedOrgId);
	const orgIds = orgIdStr
		.split(",")
		.map((id) => id.trim())
		.filter((id) => id);

	if (orgIds.length === 0) {
		return false;
	}

	const validIds: string[] = [];
	const expandKeysSet = new Set<React.Key>();

	// 查找所有有效的节点ID并收集展开路径
	for (const orgId of orgIds) {
		const foundNode = findNodeById(nodeIdMap, orgId);
		if (foundNode) {
			const nodeId = String(foundNode.id);
			validIds.push(nodeId);

			// 收集展开路径
			const path = expandPath(parentMap, orgId);
			path.forEach((key) => expandKeysSet.add(key));
		}
	}

	if (validIds.length === 0) {
		return false;
	}

	// 设置选中的节点
	setCheckedKeys(validIds);

	// 展开父节点
	if (expandKeysSet.size > 0) {
		setExpandedKeys(Array.from(expandKeysSet));
	}

	// 设置快速筛选（如果有）
	if (initialSelectedOrgLevel) {
		const levels = compact(
			initialSelectedOrgLevel.split(",").map((l: string) => l.trim()),
		) as string[];
		setQuickFilter(levels);
	}

	return true;
}

/**
 * 处理 orgLevel 初始化
 *
 * @param initialSelectedOrgLevel - 初始选中的组织层级（逗号分隔）
 * @param levelNodeMap - 层级节点映射表
 * @param parentMap - 父节点映射表
 * @param setCheckedKeys - 设置选中节点 keys 的方法
 * @param setQuickFilter - 设置快速筛选值的方法
 * @param setExpandedKeys - 设置展开节点 keys 的方法
 * @param setAutoExpandParent - 设置是否自动展开父节点的方法
 * @returns 是否成功初始化
 */
function handleOrgLevelInitialization(
	initialSelectedOrgLevel: string,
	levelNodeMap: Map<string, Set<string>>,
	parentMap: Map<string, string>,
	setCheckedKeys: (value: React.Key[]) => void,
	setQuickFilter: (value: string[]) => void,
	setExpandedKeys: (value: React.Key[]) => void,
	setAutoExpandParent: (value: boolean) => void,
): boolean {
	const levels = compact(
		initialSelectedOrgLevel.split(",").map((l: string) => l.trim()),
	) as string[];

	if (levels.length === 0) {
		return false;
	}

	// 过滤出在树中存在的层级
	const validLevels = levels.filter((level) => levelNodeMap.has(level));

	if (validLevels.length === 0) {
		return false;
	}

	// 收集所有层级对应的节点ID
	const validIds: string[] = [];
	for (const level of validLevels) {
		const nodeIds = levelNodeMap.get(level);
		if (nodeIds) {
			validIds.push(...Array.from(nodeIds));
		}
	}

	setCheckedKeys(validIds);
	setQuickFilter(validLevels);

	// 展开第一个层级的节点路径
	if (validIds.length > 0 && validLevels.length > 0) {
		const targetLevel = validLevels[0];
		const targetLevelNodeIds = levelNodeMap.get(targetLevel);
		if (targetLevelNodeIds && targetLevelNodeIds.size > 0) {
			const expandKeys = getExpandPathsForNodes(parentMap, Array.from(targetLevelNodeIds));
			if (expandKeys.length > 0) {
				setExpandedKeys(expandKeys);
				setAutoExpandParent(true);
			}
		}
	}

	return true;
}
