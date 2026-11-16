/**
 * 组织大脑 - 人员档案页面
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type {
	PersonnelArchiveItem,
	PersonnelArchiveListParams,
} from "#src/api/org-brain/personnel-archive";
import type { ProFormInstance } from "@ant-design/pro-components";
import { exportPersonnelArchiveExcel } from "#src/api/org-brain/personnel-archive";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { CollapsiblePanel } from "#src/components/gs/collapsible-panel";
import { useJobCascadeOptions } from "#src/hooks";
import { DownloadOutlined } from "@ant-design/icons";
import {
	ProFormDateRangePicker,
	ProFormSelect,
	ProFormText,
	QueryFilter,
} from "@ant-design/pro-components";
import { App, Button, Empty, Radio } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EmployeeCardView } from "./components/EmployeeCardView";
import { getEmployeeTableColumns } from "./components/EmployeeTableColumns";
import { OrgTreePanel } from "./components/OrgTreePanel";
import { TalentArchiveDrawer } from "./components/talent-archive-drawer/index";
import { PERSONNEL_ARCHIVE_TABLE_WIDTH } from "./config";
import { usePersonnelArchiveListQuery } from "./use-personnel-archive-list-query";

type ViewMode = "list" | "card";

/**
 * QueryFilter 表单提交值类型，与 PersonnelArchiveListParams 不完全同构。
 *
 * @author 王善能
 * @since 2026-07-17
 */
interface PersonnelArchiveFormValues {
	employeeName?: string;
	userCode?: string;
	jobIds?: (string | number)[];
	postIds?: (string | number)[];
	postgradeIds?: (string | number)[];
	joinDateRange?: [
		string | { format: (fmt: string) => string },
		string | { format: (fmt: string) => string },
	];
}

/** 人员档案列表视图工具栏。 */
function ViewToolbar({
	viewMode,
	onViewModeChange,
	onExport,
}: {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
	onExport: () => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<Radio.Group
				value={viewMode}
				onChange={(e) => onViewModeChange(e.target.value)}
				buttonStyle="solid"
			>
				<Radio.Button value="list">表格视图</Radio.Button>
				<Radio.Button value="card">卡片视图</Radio.Button>
			</Radio.Group>
			<BasicButton
				htmlType="button"
				icon={<DownloadOutlined />}
				onClick={(event) => {
					event.preventDefault();
					event.stopPropagation();
					onExport();
				}}
			>
				导出
			</BasicButton>
		</div>
	);
}

/**
 * 组织大脑-人员档案页面。
 * 页面职责：
 * - 管理左侧组织树与右侧档案列表的联动筛选。
 * - 支持表格视图与卡片视图切换。
 * - 统一维护查询参数、分页状态和档案抽屉开关。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export default function OrgBrainPersonnelArchive() {
	const { message } = App.useApp();
	const formRef = useRef<ProFormInstance>();
	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [isArchiveDrawerOpen, setIsArchiveDrawerOpen] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState<string>();
	const [panelWidth, setPanelWidth] = useState(380);
	const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
	const [selectedOrgId, setSelectedOrgId] = useState<string>();

	const [queryParams, setQueryParams] = useState<
		Omit<PersonnelArchiveListParams, "pageNum" | "pageSize" | "orgId">
	>({});
	const [paginationState, setPaginationState] = useState({
		current: 1,
		pageSize: 10,
	});

	/** 岗位、职位、职级统一通过公共联动 Hook 查询。 */
	const {
		jobOptions,
		postOptions,
		postgradeOptions,
		handleJobChange,
		handlePostChange,
		resetLinkage,
	} = useJobCascadeOptions({
		sceneKey: "personnel-archive",
		formRef,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});

	/** 表单值与接口查询参数并不完全同构，这里统一做一次提交态转换。 */
	const buildSubmittedQueryParams = useCallback(
		(
			values?: PersonnelArchiveFormValues,
		): Omit<PersonnelArchiveListParams, "pageNum" | "pageSize" | "orgId"> => {
			const [joinDateStart, joinDateEnd] = values?.joinDateRange || [];
			return {
				employeeName: values?.employeeName || undefined,
				userCode: values?.userCode || undefined,
				jobIds:
					Array.isArray(values?.jobIds) && values.jobIds.length > 0
						? values.jobIds.map((item: string | number) => Number(item))
						: undefined,
				postIds:
					Array.isArray(values?.postIds) && values.postIds.length > 0
						? values.postIds.map((item: string | number) => Number(item))
						: undefined,
				postgradeIds:
					Array.isArray(values?.postgradeIds) && values.postgradeIds.length > 0
						? values.postgradeIds.map((item: string | number) => Number(item))
						: undefined,
				joinDateStart: joinDateStart
					? typeof joinDateStart === "string"
						? joinDateStart
						: joinDateStart.format("YYYY-MM-DD")
					: undefined,
				joinDateEnd: joinDateEnd
					? typeof joinDateEnd === "string"
						? joinDateEnd
						: joinDateEnd.format("YYYY-MM-DD")
					: undefined,
			};
		},
		[],
	);

	/** 任一筛选项变化后都回到第一页，同时清空组织树选择避免双重筛选。 */
	const applyQueryParams = useCallback(
		(nextQueryParams: Omit<PersonnelArchiveListParams, "pageNum" | "pageSize" | "orgId">) => {
			setQueryParams(nextQueryParams);
			setSelectedOrgId(undefined);
			setPaginationState((prev) => ({
				...prev,
				current: 1,
			}));
		},
		[],
	);

	const resetQueryFilters = useCallback(() => {
		setSelectedOrgId(undefined);
		resetLinkage();
		setQueryParams({});
		setPaginationState((prev) => ({
			...prev,
			current: 1,
		}));
	}, [resetLinkage]);

	/** 左树组织筛选与表单筛选统一收敛到同一份查询参数。 */
	const activeQueryParams = useMemo(
		() => ({
			...queryParams,
			orgId: selectedOrgId || undefined,
		}),
		[queryParams, selectedOrgId],
	);

	const {
		page: personnelArchivePage,
		viewState: personnelArchiveViewState,
		displayPagination,
		refetch: refetchPersonnelArchive,
	} = usePersonnelArchiveListQuery(paginationState, activeQueryParams);
	const personnelArchiveDataSource = personnelArchivePage?.list || [];
	const personnelArchiveLoading =
		personnelArchiveViewState === "initial-loading" ||
		personnelArchiveViewState === "page-transition";
	const personnelArchiveLoadFailed = personnelArchiveViewState === "load-failed";

	useEffect(() => {
		if (personnelArchiveViewState === "recoverable-error") {
			setPaginationState(displayPagination);
			message.error({
				content: "人员档案加载失败，已恢复上一页",
				key: "personnel-archive-page-load-error",
			});
		} else if (personnelArchiveViewState === "refresh-error") {
			message.error({
				content: "人员档案刷新失败，已保留当前数据",
				key: "personnel-archive-page-load-error",
			});
		}
	}, [displayPagination, message, personnelArchiveViewState]);

	/** 分页切换统一处理，列表视图与卡片视图复用同一逻辑。 */
	const handlePaginationChange = useCallback((page: number, pageSize: number) => {
		setPaginationState({ current: page, pageSize });
	}, []);

	/** 列表视图与卡片视图共享分页配置，避免两处重复声明。 */
	const paginationConfig = useMemo(
		() => ({
			current: displayPagination.current,
			pageSize: displayPagination.pageSize,
			total: personnelArchivePage?.total || 0,
			onChange: handlePaginationChange,
			showSizeChanger: true,
			showQuickJumper: true,
		}),
		[displayPagination, personnelArchivePage?.total, handlePaginationChange],
	);

	/** 左侧组织树切换后重置到第一页，保证右侧列表与树节点保持同步。 */
	const handleOrgSelect = useCallback((orgId: string) => {
		setSelectedOrgId(orgId);
		setPaginationState((prev) => ({
			...prev,
			current: 1,
		}));
	}, []);

	// 处理查看档案
	const handleViewArchive = useCallback((record: PersonnelArchiveItem) => {
		setSelectedUserId(record.userId);
		setIsArchiveDrawerOpen(true);
	}, []);

	/** 导出复用当前筛选条件，保持"所见即所导"。 */
	const handleExportExcel = useCallback(async () => {
		try {
			message.loading({ content: "正在导出...", key: "export" });
			await exportPersonnelArchiveExcel(activeQueryParams);
			message.success({ content: "已加入导出中心", key: "export" });
		} catch {
			message.error({ content: "提交导出任务失败", key: "export" });
		}
	}, [activeQueryParams]);

	// 表格列配置
	const columns = useMemo(
		() =>
			getEmployeeTableColumns({
				onViewArchive: handleViewArchive,
			}),
		[handleViewArchive],
	);

	return (
		<BasicContent className="flex h-full flex-col">
			<div className="flex flex-1 gap-4 overflow-hidden">
				{/* 左侧组织树面板 */}
				<CollapsiblePanel
					width={panelWidth}
					resizable
					minWidth={300}
					maxWidth={480}
					defaultCollapsed={isPanelCollapsed}
					onCollapsedChange={setIsPanelCollapsed}
					onWidthChange={setPanelWidth}
				>
					<div className="h-full">
						<OrgTreePanel selectedOrgId={selectedOrgId} onSelect={handleOrgSelect} />
					</div>
				</CollapsiblePanel>

				{/* 右侧内容区域 */}
				<div className="flex flex-1 flex-col overflow-hidden">
					{/* 搜索表单 */}
					<div className="rounded border-b bg-white pb-4">
						<QueryFilter
							formRef={formRef}
							onFinish={(values) => {
								applyQueryParams(buildSubmittedQueryParams(values));
							}}
							onReset={resetQueryFilters}
							className="!p-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap"
							span={{
								xs: 24, // 超小屏幕（<576px）：一行显示一个字段
								sm: 24, // 小屏幕（≥576px）：一行显示一个字段
								md: 12, // 中等屏幕（≥768px）：一行显示两个字段
								lg: 8, // 大屏幕（≥992px）：一行显示三个字段
								xl: 8, // 超大屏幕（≥1200px）：一行显示三个字段
								xxl: 6, // 超超大屏幕（≥1600px）：一行显示四个字段
							}}
							searchGutter={12}
							defaultCollapsed={false}
							optionRender={(_, formProps) => [
								<Button
									key="submit"
									type="primary"
									onClick={() => formProps.form?.submit()}
								>
									查询
								</Button>,
								<Button
									type="text"
									key="reset"
									onClick={() => {
										formProps.form?.resetFields();
										resetQueryFilters();
									}}
								>
									重置
								</Button>,
							]}
							variant="borderless"
							colon={false}
						>
							<ProFormText
								name="employeeName"
								label="员工名称"
								placeholder="支持模糊搜索"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
							/>
							<ProFormText
								name="userCode"
								label="工号"
								placeholder="支持模糊搜索"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
							/>
							<ProFormSelect
								name="jobIds"
								label="岗位"
								placeholder="请选择岗位"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
								fieldProps={{
									options: jobOptions,
									fieldNames: { label: "displayName", value: "jobId" },
									popupMatchSelectWidth: false,
									showSearch: true,
									allowClear: true,
									mode: "multiple",
									maxTagCount: "responsive",
									onChange: (value: number[] | undefined) => {
										handleJobChange(value || []);
									},
								}}
							/>
							<ProFormSelect
								name="postIds"
								label="职位"
								placeholder="请选择职位"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
								fieldProps={{
									options: postOptions,
									fieldNames: { label: "displayName", value: "postId" },
									popupMatchSelectWidth: false,
									showSearch: true,
									allowClear: true,
									mode: "multiple",
									maxTagCount: "responsive",
									onChange: (value: number[] | undefined) => {
										handlePostChange(value || []);
									},
								}}
							/>
							<ProFormSelect
								name="postgradeIds"
								label="职级"
								placeholder="请选择职级"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
								fieldProps={{
									options: postgradeOptions,
									fieldNames: { label: "postgradeName", value: "postgradeId" },
									popupMatchSelectWidth: false,
									showSearch: true,
									allowClear: true,
									mode: "multiple",
									maxTagCount: "responsive",
								}}
							/>
							<ProFormDateRangePicker
								name="joinDateRange"
								label="入职日期"
								formItemProps={{
									className: "rounded border border-[#DCDFE6]",
								}}
								fieldProps={{
									placeholder: ["开始日期", "结束日期"],
								}}
							/>
						</QueryFilter>
					</div>

					{/* 视图切换工具栏（卡片视图时显示） */}
					{viewMode === "card" && (
						<div className="flex justify-end pt-4">
							<ViewToolbar
								viewMode={viewMode}
								onViewModeChange={setViewMode}
								onExport={handleExportExcel}
							/>
						</div>
					)}

					{/* 内容显示区域 */}
					<div className="flex-1 overflow-hidden">
						{viewMode === "list" ? (
							<BasicTable<PersonnelArchiveItem>
								formRef={formRef}
								columns={columns}
								dataSource={personnelArchiveDataSource}
								loading={personnelArchiveLoading}
								rowKey="userId"
								tableLayout="fixed"
								scroll={{ x: PERSONNEL_ARCHIVE_TABLE_WIDTH }}
								cardBordered={false}
								search={false}
								cardProps={{ bodyStyle: { padding: 0 } }}
								adaptive
								tableAlertRender={false}
								toolBarRender={() => [
									<ViewToolbar
										key="view-toolbar"
										viewMode={viewMode}
										onViewModeChange={setViewMode}
										onExport={handleExportExcel}
									/>,
								]}
								options={{
									reload: false,
									density: false,
									fullScreen: false,
									setting: {
										settingIcon: <Button>列表选项</Button>,
									},
								}}
								className="[&_.ant-pro-table-list-toolbar-setting-item]:ml-0"
								locale={{
									emptyText: personnelArchiveLoadFailed ? (
										<div className="flex h-64 flex-col items-center justify-center gap-3">
											<Empty
												description="人员档案加载失败，请稍后重试"
												image={Empty.PRESENTED_IMAGE_SIMPLE}
											/>
											<Button
												type="primary"
												onClick={() => void refetchPersonnelArchive()}
											>
												重新加载
											</Button>
										</div>
									) : personnelArchiveLoading ? (
										<div className="h-64" />
									) : (
										<Empty
											description="暂无数据"
											image={Empty.PRESENTED_IMAGE_SIMPLE}
										/>
									),
								}}
								pagination={paginationConfig}
							/>
						) : (
							<EmployeeCardView
								dataSource={personnelArchiveDataSource}
								loading={personnelArchiveLoading}
								loadFailed={personnelArchiveLoadFailed}
								onRetry={() => void refetchPersonnelArchive()}
								onViewArchive={handleViewArchive}
								pagination={paginationConfig}
							/>
						)}
					</div>
				</div>
			</div>

			{/* 人员档案抽屉 */}
			<TalentArchiveDrawer
				open={isArchiveDrawerOpen}
				userId={selectedUserId ?? ""}
				onClose={() => {
					setIsArchiveDrawerOpen(false);
					setSelectedUserId(undefined);
				}}
			/>
		</BasicContent>
	);
}
