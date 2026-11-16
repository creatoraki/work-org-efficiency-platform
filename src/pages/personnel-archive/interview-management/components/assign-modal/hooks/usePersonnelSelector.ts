/**
 * 人员选择器状态管理 Hook
 */

import type { OrganizationTreeNode } from "#src/api/common";

import { useCallback, useEffect } from "react";
import { useDepartmentTree } from "./useDepartmentTree";
import { useUserList } from "./useUserList";

/**
 * 人员选择器状态管理 Hook
 *
 * @param treeData - 组织树数据
 * @param taskName - 任务名称
 * @param isActive - 是否为激活状态
 * @param skipInitialize - 跳过自动初始化
 * @returns 人员选择器的所有状态和方法
 */
export function usePersonnelSelector(
	treeData: OrganizationTreeNode[],
	taskName?: number,
	isActive?: boolean,
	skipInitialize = false,
) {
	const departmentTree = useDepartmentTree(treeData, isActive);
	const userList = useUserList(skipInitialize, isActive);

	// 同步部门选择到用户列表
	useEffect(() => {
		if (departmentTree.selectedDeptCode !== userList.selectedDeptCode) {
			userList.setSelectedDeptCode(departmentTree.selectedDeptCode);
		}
	}, [departmentTree.selectedDeptCode, userList]);

	// 自动填充容器高度（当内容不足时自动加载更多）
	const checkAndFillContainer = useCallback(() => {
		if (taskName === undefined || !isActive || userList.userListLoading) {
			return;
		}

		const scrollContainer = document.getElementById(`scrollableUserList-${taskName}`);
		if (!scrollContainer) {
			return;
		}

		const hasMore = userList.allUserList.length < userList.userListTotal;
		const isContentInsufficient = scrollContainer.scrollHeight <= scrollContainer.clientHeight;

		if (isContentInsufficient && hasMore) {
			userList.loadMoreUserData();
		}
	}, [
		taskName,
		isActive,
		userList.allUserList.length,
		userList.userListTotal,
		userList.userListLoading,
		userList.loadMoreUserData,
	]);

	// 监听数据变化，自动填充容器
	useEffect(() => {
		if (!isActive || userList.userListLoading) {
			return;
		}

		const rafId = requestAnimationFrame(() => {
			const timer = setTimeout(() => {
				checkAndFillContainer();
			}, 100);
			return () => clearTimeout(timer);
		});

		return () => cancelAnimationFrame(rafId);
	}, [isActive, userList.allUserList.length, userList.userListLoading, checkAndFillContainer]);

	return {
		// 部门树
		departmentTree,
		// 用户列表
		userList,
	};
}
