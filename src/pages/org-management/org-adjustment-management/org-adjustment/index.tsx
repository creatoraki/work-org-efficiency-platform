import type { TabType } from "#src/pages/strategy/target-decomposition/target-filling/types.js";
import type { OrgAdjustmentTaskTableRow } from "./types";
import {
	createOrgAdjustmentTask,
	editOrgAdjustmentTask,
	removeOrgAdjustmentTask,
} from "#src/api/org-management/org-adjustment-management/org-adjustment";
import { confirm } from "#src/components/custom-confirm";
import { SearchableTable } from "#src/components/searchable-table";
import { Button, Space, Tabs } from "antd";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import ProgressFollowDrawer from "./components/ProgressFollowDrawer";
import TaskFormModal from "./components/TaskFormModal";
import { getColumns } from "./config/columns";
import { ORG_ADJUSTMENT_TASK_ACTION_MAP } from "./config/constants";
import { useOrgAdjustmentPageData } from "./hooks/useOrgAdjustmentPageData";

export default function OrgAdjustment() {
	/** 表格列配置保持稳定，避免每次渲染都重新创建 */
	const columns = useMemo(() => getColumns(), []);
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<OrgAdjustmentTaskTableRow | null>(null);
	const [activeTab, setActiveTab] = useState(0);
	const [progressOpen, setProgressOpen] = useState(false);
	const [progressRecord, setProgressRecord] = useState<OrgAdjustmentTaskTableRow | null>(null);
	const { reloadSignal, taskStatistics, tableSearchSchema, fetchTaskList, refreshAfterMutation } =
		useOrgAdjustmentPageData();

	const navigate = useNavigate();

	/** 打开新增弹窗 */
	const handleCreate = () => {
		setEditing(null);
		setOpen(true);
	};

	/** 打开编辑弹窗 */
	const handleEdit = (record: OrgAdjustmentTaskTableRow) => {
		setEditing(record);
		setOpen(true);
	};

	/** 进入组织调整画布 */
	const handleAdjust = (record: OrgAdjustmentTaskTableRow) => {
		navigate(`/org-management/org-adjustment-management/adjustment-canvas?id=${record.id}`);
	};

	/**
	 * 查看任务详情。
	 * 在新浏览器标签中打开组织调整报告页面，通过 taskId 查询参数加载报告数据。
	 */
	const handleView = (record: OrgAdjustmentTaskTableRow) => {
		// BASE_URL 已带尾部斜杠，需拼接应用的公共基础路径，避免跳出 base 导致 404
		window.open(
			`${import.meta.env.BASE_URL}/#/adjustment-report?taskId=${record.id}`,
			"_blank",
		);
	};

	/** 删除确认 */
	const handleDelete = (record: OrgAdjustmentTaskTableRow) => {
		confirm({
			icon: "yellow",
			title: "请确认是否删除",
			content: `确认删除【${record.taskName}】吗？删除后数据将无法恢复`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			async onOk() {
				await removeOrgAdjustmentTask([record.id]);
				await refreshAfterMutation();
			},
		});
	};

	/**
	 * 提交任务表单。
	 * 新增与编辑均走真实后端接口，成功后刷新列表与顶部统计。
	 */
	const handleSubmit = async (values: { taskName?: string; remark?: string }) => {
		if (editing) {
			await editOrgAdjustmentTask({
				id: Number(editing.id),
				taskName: values.taskName,
				remark: values.remark,
			});
			await refreshAfterMutation();
		} else {
			await createOrgAdjustmentTask({
				taskName: values.taskName,
				remark: values.remark,
			});
			await refreshAfterMutation();
		}
		setOpen(false);
	};

	/** 顶部 tab 数量展示 */
	const tabItems = useMemo(
		() => [
			{
				key: "0",
				label: `全部 (${taskStatistics.totalCount})`,
			},
			{
				key: "1",
				label: `进行中 (${taskStatistics.doingCount})`,
			},
			{
				key: "2",
				label: `已结束 (${taskStatistics.doneCount})`,
			},
		],
		[taskStatistics],
	);

	/**
	 * 顶部 tab 同时承担状态分组筛选职责。
	 * 这里将当前 tab 注入表格查询参数，交给统一参数构建逻辑处理。
	 */
	const fetchTaskListByTab = useCallback(
		(params: any) => {
			return fetchTaskList({
				...params,
				activeTab,
			});
		},
		[activeTab, fetchTaskList],
	);

	/**
	 * 切换顶部 tab 后立即刷新列表与统计。
	 */
	const handleTabChange = async (key: string) => {
		setActiveTab(Number(key) as TabType);
		await refreshAfterMutation();
	};

	/**
	 * 根据任务状态生成对应的行操作按钮。
	 */
	const renderRowActions = (record: OrgAdjustmentTaskTableRow) => {
		const actionTypes = ORG_ADJUSTMENT_TASK_ACTION_MAP[String(record.status)] || [];

		return (
			<Space size="small">
				{actionTypes.includes("adjust") && (
					<Button type="link" size="small" onClick={() => handleAdjust(record)}>
						调整
					</Button>
				)}
				{/* {actionTypes.includes("archive") && (
					<Button type="link" size="small">
						存档列表
					</Button>
				)} */}
				{actionTypes.includes("edit") && (
					<Button type="link" size="small" onClick={() => handleEdit(record)}>
						编辑
					</Button>
				)}
				{actionTypes.includes("delete") && (
					<Button type="link" size="small" onClick={() => handleDelete(record)}>
						删除
					</Button>
				)}
				{actionTypes.includes("view") && (
					<Button type="link" size="small" onClick={() => handleView(record)}>
						查看
					</Button>
				)}
				{actionTypes.includes("progress") && (
					<Button
						type="link"
						size="small"
						onClick={() => {
							setProgressRecord(record);
							setProgressOpen(true);
						}}
					>
						进度跟进
					</Button>
				)}
			</Space>
		);
	};

	return (
		<div className="rounded px-6">
			<Tabs activeKey={String(activeTab)} onChange={handleTabChange} items={tabItems} />
			<SearchableTable<OrgAdjustmentTaskTableRow>
				className="mt-3"
				columns={columns}
				searchSchema={tableSearchSchema}
				fetchData={fetchTaskListByTab}
				pageSize={10}
				reloadSignal={reloadSignal}
				renderRowActions={renderRowActions}
				toolbarActions={
					<Button type="primary" onClick={handleCreate}>
						新增组织调整任务
					</Button>
				}
			/>
			<TaskFormModal
				open={open}
				editingTask={editing}
				onSubmit={handleSubmit}
				onCancel={() => {
					setOpen(false);
					setEditing(null);
				}}
			/>
			<ProgressFollowDrawer
				open={progressOpen}
				record={progressRecord}
				onClose={() => {
					setProgressOpen(false);
					setProgressRecord(null);
				}}
			/>
		</div>
	);
}
