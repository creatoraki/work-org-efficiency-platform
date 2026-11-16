/**
 * 人员选择器组件
 * 用于选择转派人员，支持部门树浏览、人员搜索和滚动加载
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { UserInfo } from "#src/api/personnel-archive/common";

import { useCallback } from "react";
import { DepartmentTree, SelectedUserPanel, UserListPanel } from "./components";
import { usePersonnelSelector } from "./hooks";

/**
 * 人员选择器属性接口
 */
interface PersonnelSelectorProps {
	/** 当前任务的 name（Form.List 提供的索引） */
	taskName: number;
	/** 当前选中的人员ID */
	currentPersonnelId?: number;
	/** 已选中的用户信息 */
	selectedUser?: UserInfo;
	/** 组织树数据 */
	treeData: OrganizationTreeNode[];
	/** 构建部门路径的函数 */
	buildDeptPath: (deptId: number, nodes: OrganizationTreeNode[]) => string;
	/** 选择人员的回调 */
	onUserSelect: (user: UserInfo, taskName: number) => void;
	/** 清空选择的回调 */
	onClearSelected: (taskName: number) => void;
	/** 是否为激活状态 */
	isActive?: boolean;
}

/**
 * 人员选择器组件
 *
 * @param props - 组件属性
 * @param props.taskName - 当前任务的 name（Form.List 提供的索引）
 * @param props.currentPersonnelId - 当前选中的人员ID
 * @param props.selectedUser - 已选中的用户信息
 * @param props.treeData - 组织树数据
 * @param props.buildDeptPath - 构建部门路径的函数
 * @param props.onUserSelect - 选择人员的回调
 * @param props.onClearSelected - 清空选择的回调
 * @param props.isActive - 是否为激活状态
 */
export function PersonnelSelector({
	taskName,
	currentPersonnelId,
	selectedUser,
	treeData,
	buildDeptPath,
	onUserSelect,
	onClearSelected,
	isActive = true,
}: PersonnelSelectorProps) {
	const { departmentTree, userList } = usePersonnelSelector(treeData, taskName, isActive, false);

	const handleUserSelect = useCallback(
		(user: UserInfo) => {
			onUserSelect(user, taskName);
		},
		[onUserSelect, taskName],
	);

	const handleClearSelected = useCallback(() => {
		onClearSelected(taskName);
	}, [onClearSelected, taskName]);

	return (
		<div className="flex h-[500px] gap-4">
			{/* 左侧：部门树 */}
			<DepartmentTree
				searchValue={departmentTree.deptSearchValue}
				onSearchChange={departmentTree.handleDeptSearchChange}
				treeData={departmentTree.localTreeData}
				selectedKeys={
					departmentTree.selectedDeptCode ? [departmentTree.selectedDeptCode] : []
				}
				onSelect={departmentTree.handleDeptSelect}
				expandedKeys={departmentTree.expandedKeys}
				onExpand={departmentTree.handleExpand}
				autoExpandParent={departmentTree.isAutoExpandParent}
			/>

			{/* 右侧：添加成员（包含人员列表和已选人员） */}
			<div className="flex min-h-0 flex-1 flex-col rounded border border-gray-200">
				<div className="flex h-12 items-center bg-gray-50 px-4 font-semibold">添加成员</div>
				<div className="flex min-h-0 flex-1 gap-4 p-4">
					{/* 中间：人员列表 */}
					<UserListPanel
						taskName={taskName}
						searchValue={userList.userSearchValue}
						onSearchChange={userList.handleUserSearchChange}
						userList={userList.allUserList}
						loading={userList.userListLoading}
						total={userList.userListTotal}
						onLoadMore={userList.loadMoreUserData}
						selectedUserId={currentPersonnelId}
						onSelectUser={handleUserSelect}
					/>

					{/* 右侧：已选人员 */}
					<SelectedUserPanel
						selectedUser={selectedUser}
						onClear={handleClearSelected}
						buildDeptPath={buildDeptPath}
						treeData={treeData}
					/>
				</div>
			</div>
		</div>
	);
}
