/**
 * 部门树管理 Hook
 */

import type { OrganizationTreeNode } from "#src/api/common";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getParentKey } from "../utils";

/**
 * 部门数据项接口
 */
interface DeptDataItem {
	/** 部门编码 */
	key: string;
	/** 部门名称 */
	name: string;
}

/**
 * 部门树管理 Hook
 *
 * @param treeData - 组织树数据（固定数据，所有 tab 共享）
 * @param isActive - 是否为激活状态（用于控制是否自动展开第一个节点）
 * @returns 部门树管理相关的状态和方法
 */
export function useDepartmentTree(treeData: OrganizationTreeNode[], isActive = false) {
	const [selectedDeptCode, setSelectedDeptCode] = useState("");
	const [deptSearchValue, setDeptSearchValue] = useState("");
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const [isAutoExpandParent, setIsAutoExpandParent] = useState(true);

	const hasInitializedRef = useRef(false);

	const localTreeData = useMemo(() => {
		return Array.isArray(treeData) ? treeData : [];
	}, [treeData]);

	// 扁平化的部门数据列表，用于快速搜索
	const deptDataList = useMemo(() => {
		const list: DeptDataItem[] = [];
		const generateList = (data: OrganizationTreeNode[]) => {
			for (let i = 0; i < data.length; i++) {
				const node = data[i];
				if (node.code && node.name) {
					list.push({ key: node.code, name: node.name });
				}
				if (node.children) {
					generateList(node.children);
				}
			}
		};
		generateList(localTreeData);
		return list;
	}, [localTreeData]);

	// 保持原始数据结构，不转换

	// 处理搜索输入变化
	const handleDeptSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { value } = e.target;
			const newExpandedKeys = deptDataList
				.map((item) => {
					if (item.name.includes(value)) {
						return getParentKey(item.key, localTreeData);
					}
					return null;
				})
				.filter((item, i, self): item is string => !!(item && self.indexOf(item) === i));
			setExpandedKeys(newExpandedKeys);
			setDeptSearchValue(value);
			setIsAutoExpandParent(true);
		},
		[deptDataList, localTreeData],
	);

	// 处理展开
	const handleExpand = useCallback((keys: React.Key[]) => {
		setExpandedKeys(keys);
		setIsAutoExpandParent(false);
	}, []);

	// 处理部门树节点选择
	const handleDeptSelect = useCallback((selectedKeys: React.Key[], info: any) => {
		if (selectedKeys.length === 0) {
			return;
		}

		const node = info.node as any;
		const deptCode = (selectedKeys[0] as string) || node.code || "";

		if (!deptCode) {
			console.warn("未找到部门编码 code，请检查数据结构");
			return;
		}

		setSelectedDeptCode(deptCode);
	}, []);

	// 初始化时自动展开第一个树节点（仅首次）
	useLayoutEffect(() => {
		const shouldExpand =
			isActive &&
			localTreeData.length > 0 &&
			expandedKeys.length === 0 &&
			!deptSearchValue &&
			!hasInitializedRef.current;

		if (shouldExpand) {
			const firstNodeKey = localTreeData[0]?.code;
			if (firstNodeKey) {
				// 初始化展开第一个节点
				setExpandedKeys([firstNodeKey]);
				hasInitializedRef.current = true;
			}
		}
	}, [isActive, localTreeData, expandedKeys.length, deptSearchValue]);

	// 重置部门树状态（仅重置选中和搜索，保持展开状态）
	const resetState = useCallback(() => {
		setSelectedDeptCode("");
		setDeptSearchValue("");
	}, []);

	return {
		// 状态
		selectedDeptCode,
		deptSearchValue,
		expandedKeys,
		isAutoExpandParent,
		localTreeData,

		// 方法
		setSelectedDeptCode,
		setExpandedKeys,
		setIsAutoExpandParent,
		handleDeptSearchChange,
		handleDeptSelect,
		handleExpand,
		resetState,
	};
}
