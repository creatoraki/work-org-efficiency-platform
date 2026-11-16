/**
 * 转派弹窗组件
 * 支持多任务转派，每个任务可以独立配置标签和人员
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { UserInfo } from "#src/api/personnel-archive/common";
import type {
	InterviewItem,
	UserInterviewTagItem,
} from "#src/api/personnel-archive/interview-management";

import { getUserInterviewTags } from "#src/api/personnel-archive/interview-management";
import { CloseOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, Form, Modal } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTaskStateCache } from "./hooks";
import { TaskForm } from "./task-form";
import { TaskTabs } from "./task-tabs";
import { buildDeptPath, getTaskSymbol } from "./utils";

const { useWatch } = Form;

/**
 * 转派任务数据接口（按任务分组）
 * 用于提交转派请求时的数据结构
 */
export interface AssignTaskData {
	/** 任务索引（从 0 开始） */
	taskIndex: number;
	/** 转派的人员ID */
	personnelId: number;
	/** 转派的标签ID列表 */
	tagIds: number[];
	/** 转派的记录ID列表（支持批量转派） */
	recordIds: number[];
}

/**
 * 转派弹窗属性接口
 */
interface AssignModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 确认回调，按任务分组的数据 */
	onConfirm: (data: AssignTaskData[]) => void;
	/** 转派的记录（单个或批量） */
	records: InterviewItem[];
	/** 弹窗标题 */
	title?: string;
	/** 组织树数据（从父组件传入） */
	organizationTreeData?: OrganizationTreeNode | null;
}

/**
 * 转派弹窗组件
 *
 * @param props - 组件属性
 * @param props.open - 是否显示弹窗
 * @param props.onClose - 关闭回调
 * @param props.onConfirm - 确认回调，按任务分组的数据
 * @param props.records - 转派的记录（单个或批量）
 * @param props.title - 弹窗标题
 * @param props.organizationTreeData - 组织树数据（从父组件传入）
 */
export function AssignModal({
	open,
	onClose,
	onConfirm,
	records,
	title = "转派",
	organizationTreeData,
}: AssignModalProps) {
	const [form] = Form.useForm();
	const [activeTaskIndex, setActiveTaskIndex] = useState(0);

	// 任务状态缓存管理
	const { getOrCreateTaskState, updateTaskState, clearCache } = useTaskStateCache();

	// 组织树数据：封装为数组格式
	const treeData = useMemo<OrganizationTreeNode[]>(() => {
		return organizationTreeData ? [organizationTreeData] : [];
	}, [organizationTreeData]);

	// 加载可用的标签选项
	const { data: allTagOptions = [] } = useRequest(
		async () => {
			if (records.length === 0) {
				return [];
			}

			const paramsList = records.map((record) => ({
				userId: record.id,
				interviewUserId: record.interviewUserId
					? Number(record.interviewUserId)
					: undefined,
			}));

			return await getUserInterviewTags(paramsList);
		},
		{
			ready: open && records.length > 0,
		},
	);

	// 监听所有任务的数据变化
	const allTasks = useWatch("tasks", form) || [];

	// 检查所有任务是否填写完整
	const isAllTasksValid = useMemo(() => {
		return (
			allTasks.length > 0 &&
			allTasks.every((task: any) => {
				return task?.tagIds?.length > 0 && !!task.personnelId;
			})
		);
	}, [allTasks]);

	// 获取任务的 Symbol 标识符
	const getTaskSymbolByIndex = useCallback(
		(taskIndex: number): symbol | undefined => {
			const tasks = form.getFieldsValue().tasks || [];
			return getTaskSymbol(tasks, taskIndex);
		},
		[form],
	);

	// 计算当前任务可用的标签选项（排除已被其他任务选中的标签）
	const getAvailableTagOptions = useCallback(
		(currentTaskIndex: number): UserInterviewTagItem[] => {
			const tasks = form.getFieldsValue().tasks || [];
			const selectedTagIds = new Set<number>();

			tasks.forEach((task: any, index: number) => {
				if (index !== currentTaskIndex && task?.tagIds?.length > 0) {
					task.tagIds.forEach((tagId: number) => selectedTagIds.add(tagId));
				}
			});

			return allTagOptions.filter((tag) => !selectedTagIds.has(tag.tagId));
		},
		[allTagOptions, form],
	);

	// 校验任务是否有效（用于标签页 Badge 显示）
	const validateTask = useCallback(
		(taskIndex: number): boolean => {
			const tasks = form.getFieldsValue().tasks || [];
			const task = tasks[taskIndex];
			return task?.tagIds?.length > 0 && !!task.personnelId;
		},
		[form],
	);

	// 处理人员选择
	const handleUserSelect = useCallback(
		(user: UserInfo, taskName: number) => {
			const taskSymbol = getTaskSymbolByIndex(taskName);
			if (taskSymbol) {
				updateTaskState(taskSymbol, { selectedUser: user });
			}
			form.setFieldValue(["tasks", taskName, "personnelId"], user.id);
			form.validateFields([["tasks", taskName, "personnelId"]]).catch(() => {
				// 忽略校验错误
			});
		},
		[form, getTaskSymbolByIndex, updateTaskState],
	);

	// 清空已选人员
	const handleClearSelected = useCallback(
		(taskName: number) => {
			const taskSymbol = getTaskSymbolByIndex(taskName);
			if (taskSymbol) {
				updateTaskState(taskSymbol, { selectedUser: undefined });
			}
			form.setFieldValue(["tasks", taskName, "personnelId"], undefined);
			form.validateFields([["tasks", taskName, "personnelId"]]).catch(() => {
				// 忽略校验错误
			});
		},
		[form, getTaskSymbolByIndex, updateTaskState],
	);

	const handleConfirm = useCallback(async () => {
		try {
			await form.validateFields();
		} catch {
			return;
		}

		const values = form.getFieldsValue();
		const tasks = values.tasks || [];
		const recordIds = records.map((record) => record.id);

		const submitData: AssignTaskData[] = tasks
			.map((task: any, taskIndex: number) => {
				if (task.tagIds?.length > 0 && task.personnelId) {
					return {
						taskIndex,
						personnelId: task.personnelId,
						tagIds: task.tagIds,
						recordIds,
					};
				}
				return null;
			})
			.filter((item: AssignTaskData | null): item is AssignTaskData => item !== null);

		onConfirm(submitData);
	}, [records, onConfirm, form]);

	const handleCancel = useCallback(() => {
		onClose();
	}, [onClose]);

	// 弹窗关闭时重置状态
	useEffect(() => {
		if (!open) {
			const timer = setTimeout(() => {
				setActiveTaskIndex(0);
				clearCache();
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [open, clearCache]);

	// ==================== 渲染 ====================
	return (
		<Modal
			title={title}
			open={open}
			onCancel={handleCancel}
			centered
			width={1000}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					取消
				</Button>,
				<Button
					key="confirm"
					type="primary"
					onClick={handleConfirm}
					disabled={!isAllTasksValid}
				>
					转派
				</Button>,
			]}
			closeIcon={<CloseOutlined />}
		>
			<Form
				form={form}
				layout="horizontal"
				colon={false}
				preserve={false}
				initialValues={{
					tasks: [
						{
							id: Symbol("task"),
							tagIds: [],
							personnelId: undefined,
						},
					],
				}}
			>
				<Form.List name="tasks">
					{(fields, { add, remove }) => {
						const handleAddTask = () => {
							add({
								id: Symbol("task"),
								tagIds: [],
								personnelId: undefined,
							});
						};

						return (
							<div className="flex h-[630px] flex-col">
								{/* 任务标签页区域 */}
								<TaskTabs
									fields={fields}
									activeTaskIndex={activeTaskIndex}
									setActiveTaskIndex={setActiveTaskIndex}
									validateTask={validateTask}
									onAdd={handleAddTask}
									onRemove={remove}
								/>

								{/* 任务表单区域：使用 visibility + 绝对定位保持 DOM 不销毁 */}
								<div className="relative min-h-0 flex-1">
									{fields.map((field, index) => {
										const { name } = field;
										const task = allTasks[index];
										const taskSymbol = getTaskSymbolByIndex(index);
										const taskPersonnelId = task?.personnelId;
										const cachedState = taskSymbol
											? getOrCreateTaskState(taskSymbol)
											: undefined;
										const taskSelectedUser = cachedState?.selectedUser;
										const isActive = index === activeTaskIndex;

										return (
											<div
												key={field.key}
												className="absolute inset-0 flex flex-col"
												style={{
													visibility: isActive ? "visible" : "hidden",
													pointerEvents: isActive ? "auto" : "none",
												}}
											>
												<TaskForm
													taskName={name}
													form={form}
													currentPersonnelId={taskPersonnelId}
													selectedUser={taskSelectedUser}
													treeData={treeData}
													buildDeptPath={buildDeptPath}
													availableTagOptions={getAvailableTagOptions(
														index,
													)}
													onUserSelect={handleUserSelect}
													onClearSelected={handleClearSelected}
													isActive={isActive}
												/>
											</div>
										);
									})}
								</div>
							</div>
						);
					}}
				</Form.List>
			</Form>
		</Modal>
	);
}
