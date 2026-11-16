/**
 * 任务表单组件
 * 包含转派标签和转派人员的表单字段
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { UserInfo } from "#src/api/personnel-archive/common";
import type { UserInterviewTagItem } from "#src/api/personnel-archive/interview-management";

import { Form, Input, Select } from "antd";
import { useCallback } from "react";
import { PersonnelSelector } from "./personnel-selector";

/**
 * 任务表单属性接口
 */
interface TaskFormProps {
	/** 当前任务的 name（Form.List 提供的索引） */
	taskName: number;
	/** 表单实例 */
	form: any;
	/** 当前选中的人员ID */
	currentPersonnelId?: number;
	/** 已选中的用户信息 */
	selectedUser?: UserInfo;
	/** 组织树数据 */
	treeData: OrganizationTreeNode[];
	/** 构建部门路径的函数 */
	buildDeptPath: (deptId: number, nodes: OrganizationTreeNode[]) => string;
	/** 可用的标签选项 */
	availableTagOptions: UserInterviewTagItem[];
	/** 选择人员的回调 */
	onUserSelect: (user: UserInfo, taskName: number) => void;
	/** 清空选择的回调 */
	onClearSelected: (taskName: number) => void;
	/** 是否为激活状态 */
	isActive?: boolean;
}

/**
 * 任务表单组件
 *
 * @param props - 组件属性
 * @param props.taskName - 当前任务的 name（Form.List 提供的索引）
 * @param props.form - 表单实例
 * @param props.currentPersonnelId - 当前选中的人员ID
 * @param props.selectedUser - 已选中的用户信息
 * @param props.treeData - 组织树数据
 * @param props.buildDeptPath - 构建部门路径的函数
 * @param props.availableTagOptions - 可用的标签选项
 * @param props.onUserSelect - 选择人员的回调
 * @param props.onClearSelected - 清空选择的回调
 * @param props.isActive - 是否为激活状态
 */
export function TaskForm({
	taskName,
	form,
	currentPersonnelId,
	selectedUser,
	treeData,
	buildDeptPath,
	availableTagOptions,
	onUserSelect,
	onClearSelected,
	isActive,
}: TaskFormProps) {
	// 处理标签变化：确保任务有唯一的 Symbol ID
	const handleTagChange = useCallback(
		(values: number[]) => {
			if (values && values.length > 0) {
				const currentId = form.getFieldValue(["tasks", taskName, "id"]);
				if (!currentId || typeof currentId !== "symbol") {
					form.setFieldValue(["tasks", taskName, "id"], Symbol("task"));
				}
			}
		},
		[form, taskName],
	);

	return (
		<div className="flex-1">
			{/* Hidden id 字段 */}
			<Form.Item name={[taskName, "id"]} hidden>
				<Input type="hidden" />
			</Form.Item>

			{/* 转派标签 */}
			<Form.Item
				name={[taskName, "tagIds"]}
				label="转派标签"
				required
				rules={[{ required: true, message: "请选择转派标签" }]}
			>
				<Select
					mode="multiple"
					placeholder="请选择转派标签"
					onChange={handleTagChange}
					options={availableTagOptions}
					fieldNames={{ label: "tagName", value: "tagId" }}
					showSearch
					optionFilterProp="tagName"
					allowClear
					className="w-full"
				/>
			</Form.Item>

			{/* 转派人员 */}
			<Form.Item
				name={[taskName, "personnelId"]}
				label="转派人员"
				required
				rules={[{ required: true, message: "请选择转派人员" }]}
			>
				<PersonnelSelector
					taskName={taskName}
					currentPersonnelId={currentPersonnelId}
					selectedUser={selectedUser}
					treeData={treeData}
					buildDeptPath={buildDeptPath}
					onUserSelect={onUserSelect}
					onClearSelected={onClearSelected}
					isActive={isActive}
				/>
			</Form.Item>
		</div>
	);
}
