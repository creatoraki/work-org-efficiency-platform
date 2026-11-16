import type {
	DeploymentDetail,
	DeploymentItem,
	DeploymentListParams,
	DeploymentSearchOptions,
} from "#src/api/org-brain/deployment";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";

import type { ReactNode } from "react";
import type { DeploymentPanelMode } from "./components";
import {
	createDeploymentPositionMatrix,
	fetchDeploymentList,
	fetchDeploymentPlanStaffDetail,
	fetchDeploymentPositionMatrix,
	fetchDeploymentSearchOptions,
	markDeploymentOfflineDeployed,
} from "#src/api/org-brain/deployment";
import { BasicContent, BasicTable } from "#src/components";
import { useDict } from "#src/hooks";
import { useUserStore } from "#src/store/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Divider, Modal, Space, Typography } from "antd";
import message from "antd/es/message";
import { useCallback, useMemo, useRef, useState } from "react";
import { DeploymentPanel, DeploymentPreviewDrawer } from "./components";
import {
	canViewDeployment,
	DEPLOYMENT_DICT_KEYS,
	DEPLOYMENT_PROJECT_TYPE_OPTIONS,
	DEPLOYMENT_SEARCH_OPTIONS_STALE_TIME,
	DeploymentDeliveryStatusEnum,
	DeploymentStatusEnum,
} from "./config";

const { Link } = Typography;

/** 交付状态 Badge 映射 */
const DELIVERY_BADGE_STATUS: Record<string, "success" | "error" | "processing" | "default"> = {
	[DeploymentDeliveryStatusEnum.DELIVERED]: "success",
	[DeploymentDeliveryStatusEnum.PENDING]: "error",
	[DeploymentDeliveryStatusEnum.RESERVE_EXIT]: "default",
	[DeploymentDeliveryStatusEnum.MANAGED_EXIT]: "default",
};

/** 排布状态 Badge 映射 */
const DEPLOYMENT_BADGE_STATUS: Record<string, "success" | "error" | "processing"> = {
	[DeploymentStatusEnum.DEPLOYED]: "success",
	[DeploymentStatusEnum.PENDING]: "error",
	[DeploymentStatusEnum.OFFLINE_DEPLOYED]: "processing",
	[DeploymentStatusEnum.DEPLOYING]: "processing",
};

/**
 * 组织大脑 - 排兵布阵页面
 *
 * @returns 排兵布阵页面组件
 */
/** 视图模式：列表 | 面板 */
type ViewMode = "list" | "panel";

export default function OrgBrainDeployment() {
	const actionRef = useRef<ActionType>();
	const formRef = useRef<ProFormInstance>();
	const queryClient = useQueryClient();
	const userId = useUserStore((state) => state.id);

	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [panelMode, setPanelMode] = useState<DeploymentPanelMode>("create");
	const [panelRecord, setPanelRecord] = useState<DeploymentItem | null>(null);
	const [previewRecord, setPreviewRecord] = useState<DeploymentItem | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [activeDetailProjectId, setActiveDetailProjectId] = useState<string | null>(null);
	const [panelDetailOverride, setPanelDetailOverride] = useState<DeploymentDetail | null>(null);

	const { options: deliveryStatusOptions = [], getLabel: getDeliveryStatusLabel } = useDict(
		DEPLOYMENT_DICT_KEYS.DELIVERY_STATUS,
	);
	const { options: deploymentStatusOptions = [], getLabel: getDeploymentStatusLabel } = useDict(
		DEPLOYMENT_DICT_KEYS.DEPLOYMENT_STATUS,
	);

	// 搜索选项：按用户维度缓存，避免换账号串数据
	const { data: searchOptionsData } = useQuery<DeploymentSearchOptions>({
		queryKey: ["deployment-search-options", userId],
		queryFn: fetchDeploymentSearchOptions,
		enabled: !!userId,
		staleTime: DEPLOYMENT_SEARCH_OPTIONS_STALE_TIME,
		gcTime: DEPLOYMENT_SEARCH_OPTIONS_STALE_TIME,
	});

	const searchOptions = useMemo<DeploymentSearchOptions>(
		() => ({
			projectOptions: searchOptionsData?.projectOptions ?? [],
			projectGroupOptions: searchOptionsData?.projectGroupOptions ?? [],
			areaRegionOptions: searchOptionsData?.areaRegionOptions ?? [],
			areaOptions: searchOptionsData?.areaOptions ?? [],
			propertyTypeOptions: searchOptionsData?.propertyTypeOptions ?? [],
			deployerOptions: searchOptionsData?.deployerOptions ?? [],
		}),
		[searchOptionsData],
	);

	// 详情数据（面板 / 预览抽屉共用）
	const {
		data: detailData,
		isLoading: detailLoading,
		isFetching: detailFetching,
	} = useQuery({
		queryKey: [
			"deployment-panel-detail",
			previewOpen ? "preview" : panelMode,
			activeDetailProjectId,
		],
		queryFn: () => {
			if (previewOpen) {
				return fetchDeploymentPlanStaffDetail(activeDetailProjectId!);
			}
			return fetchDeploymentPositionMatrix(activeDetailProjectId!);
		},
		enabled: !!activeDetailProjectId && (viewMode === "panel" || previewOpen),
	});

	const { mutate: findBenchmarkProject, isPending: findingBenchmark } = useMutation({
		mutationFn: (projectId: string) => createDeploymentPositionMatrix(projectId),
		onSuccess: (data) => {
			setPanelDetailOverride(data);
		},
	});

	// 列表查询
	const handleSearch = useCallback(async (params: any) => {
		try {
			const { current = 1, pageSize = 10, planDeliveryDateRange, ...restParams } = params;

			const listParams: DeploymentListParams = {
				pageNum: current,
				pageSize,
				...restParams,
			};

			if (Array.isArray(planDeliveryDateRange) && planDeliveryDateRange.length === 2) {
				const formatDate = (d: any) =>
					typeof d === "string" ? d : (d?.format?.("YYYY-MM-DD") ?? String(d));
				listParams.planDeliveryStart = formatDate(planDeliveryDateRange[0]);
				listParams.planDeliveryEnd = formatDate(planDeliveryDateRange[1]);
			}

			const result = await fetchDeploymentList(listParams);

			return {
				data: result.list,
				success: true,
				total: result.total,
			};
		} catch (error) {
			console.error("获取排兵布阵列表失败:", error);
			return { data: [], success: false, total: 0 };
		}
	}, []);

	/**
	 * 刷新排兵布阵首页列表与搜索选项。
	 *
	 * 方案保存后返回首页、以及首页特殊状态更新成功后，
	 * 需要同时刷新列表和首页筛选项，确保页面口径一致。
	 *
	 * @author 王善能
	 * @since 2026-07-10
	 */
	const refreshPageData = useCallback(() => {
		actionRef.current?.reload();
		void queryClient.invalidateQueries({
			queryKey: ["deployment-search-options", userId],
		});
	}, [queryClient, userId]);

	const openPanel = useCallback((mode: DeploymentPanelMode, record: DeploymentItem) => {
		setPanelMode(mode);
		setPanelRecord(record);
		setActiveDetailProjectId(record.id);
		setPanelDetailOverride(null);
		setViewMode("panel");
	}, []);

	const handleBackToList = useCallback(() => {
		setViewMode("list");
		setPanelRecord(null);
		setActiveDetailProjectId(null);
		setPanelDetailOverride(null);
		refreshPageData();
	}, [refreshPageData]);

	const handleFindBenchmarkProject = useCallback(() => {
		if (!activeDetailProjectId) {
			return;
		}
		findBenchmarkProject(activeDetailProjectId);
	}, [findBenchmarkProject, activeDetailProjectId]);

	const handleDeploy = useCallback(
		(record: DeploymentItem) => {
			openPanel("create", record);
		},
		[openPanel],
	);

	const handleAdjust = useCallback(
		(record: DeploymentItem) => {
			openPanel("edit", record);
		},
		[openPanel],
	);

	const handleView = useCallback((record: DeploymentItem) => {
		setPreviewRecord(record);
		setActiveDetailProjectId(record.id);
		setPreviewOpen(true);
	}, []);

	const handleClosePreview = useCallback(() => {
		setPreviewOpen(false);
		setPreviewRecord(null);
		setActiveDetailProjectId(null);
	}, []);

	const handleMarkOfflineDeployed = useCallback(
		(record: DeploymentItem) => {
			Modal.confirm({
				title: "特殊排布状态更新",
				content: `识别到${record.projectName}项目存在实际交付日期，但未完成排兵布阵，请确认线下是否已完成团队矩阵配置与候选人搭配，确认可更新「待排布」状态为「线下已排布」`,
				okText: "确认",
				cancelText: "取消",
				centered: true,
				onOk: async () => {
					await markDeploymentOfflineDeployed(record.id);
					message.success("已更新为线下已排布");
					refreshPageData();
				},
			});
		},
		[refreshPageData],
	);

	// 表格列配置
	const columns: ProColumns<DeploymentItem>[] = [
		{
			title: "项目名称",
			dataIndex: "projectName",
			key: "projectName",
			width: 220,
			ellipsis: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
			},
			fieldProps: {
				variant: "borderless",
				placeholder: "支持模糊搜索",
			},
			render: (_, record) => record.projectName,
		},
		{
			title: "所属项目群",
			dataIndex: "projectGroupName",
			key: "projectGroupName",
			width: 180,
			ellipsis: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "projectGroupCodes",
				labelCol: { flex: "5.8rem" },
				wrapperCol: { flex: "auto" },
			},
			valueType: "select",
			fieldProps: {
				options: searchOptions.projectGroupOptions,
				fieldNames: { label: "name", value: "id" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "所属地区",
			dataIndex: "areaRegionName",
			key: "areaRegionName",
			width: 160,
			ellipsis: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "areaRegionCodes",
			},
			valueType: "select",
			fieldProps: {
				options: searchOptions.areaRegionOptions,
				fieldNames: { label: "name", value: "id" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "所属区域",
			dataIndex: "areaName",
			key: "areaName",
			width: 160,
			ellipsis: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "areaCodes",
			},
			valueType: "select",
			fieldProps: {
				options: searchOptions.areaOptions,
				fieldNames: { label: "name", value: "id" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "计划交付日期",
			dataIndex: "planDeliveryDate",
			key: "planDeliveryDate",
			width: 160,
			valueType: "date",
			hideInSearch: true,
		},
		{
			title: "计划交付日期",
			dataIndex: "planDeliveryDateRange",
			key: "planDeliveryDateRange",
			valueType: "dateRange",
			hideInTable: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "planDeliveryDateRange",
				labelCol: { flex: "6.6rem" },
			},
			fieldProps: {
				allowClear: true,
				variant: "borderless",
				style: { width: "100%" },
			},
		},
		{
			title: "待交付面积(㎡)",
			dataIndex: "deliveryArea",
			key: "deliveryArea",
			width: 140,
			hideInSearch: true,
		},
		{
			title: "项目类型",
			dataIndex: "projectTypeName",
			key: "projectTypeName",
			width: 100,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "projectTypeCodes",
			},
			fieldProps: {
				options: DEPLOYMENT_PROJECT_TYPE_OPTIONS,
				mode: "multiple",
				allowClear: true,
				variant: "borderless",
				maxTagCount: 1,
			},
		},
		{
			title: "物业类型",
			dataIndex: "propertyTypeName",
			key: "propertyTypeName",
			ellipsis: true,
			width: 140,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "propertyTypeCodes",
			},
			fieldProps: {
				options: searchOptions.propertyTypeOptions,
				fieldNames: { label: "name", value: "id" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "交付状态",
			dataIndex: "deliveryStateCode",
			key: "deliveryStateCode",
			width: 100,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "deliveryStateCodes",
			},
			fieldProps: {
				options: deliveryStatusOptions,
				mode: "multiple",
				allowClear: true,
				variant: "borderless",
				maxTagCount: 1,
			},
			render: (_, record) => (
				<Badge
					status={DELIVERY_BADGE_STATUS[record.deliveryStateCode] ?? "default"}
					text={
						record.deliveryStateName ??
						getDeliveryStatusLabel(record.deliveryStateCode) ??
						"/"
					}
				/>
			),
		},
		{
			title: "排布状态",
			dataIndex: "deployStatusCode",
			key: "deployStatusCode",
			width: 120,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "deployStatusCodes",
			},
			fieldProps: {
				options: deploymentStatusOptions,
				mode: "multiple",
				allowClear: true,
				variant: "borderless",
				maxTagCount: 1,
			},
			render: (_, record) => (
				<Badge
					status={DEPLOYMENT_BADGE_STATUS[record.deployStatusCode] ?? "default"}
					text={
						record.deployStatusName ??
						getDeploymentStatusLabel(record.deployStatusCode) ??
						"/"
					}
				/>
			),
		},
		{
			title: "排布人",
			dataIndex: "deployerName",
			key: "deployerName",
			width: 120,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "deployerCodes",
			},
			fieldProps: {
				options: searchOptions.deployerOptions,
				fieldNames: { label: "name", value: "id" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "质量分（分）",
			dataIndex: "matchScore",
			key: "matchScore",
			width: 120,
			valueType: "digit",
			hideInSearch: true,
		},
		{
			title: "排布时间",
			dataIndex: "lastDeployTime",
			key: "lastDeployTime",
			width: 160,
			valueType: "date",
			hideInSearch: true,
			render: (_, record) => {
				if (record.deployStatusCode === DeploymentStatusEnum.PENDING) return "/";
				return record.lastDeployTime ?? "/";
			},
		},
		{
			title: "操作",
			key: "action",
			valueType: "option",
			width: 220,
			fixed: "right",
			render: (_, record) => {
				const { deliveryStateCode, deployStatusCode } = record;
				let actions: ReactNode[] = [];

				if (
					deliveryStateCode === DeploymentDeliveryStatusEnum.PENDING &&
					(deployStatusCode === DeploymentStatusEnum.PENDING ||
						deployStatusCode === DeploymentStatusEnum.DEPLOYING)
				) {
					actions = [
						<Link
							key="create"
							className="select-none"
							onClick={() => handleDeploy(record)}
						>
							排兵布阵
						</Link>,
					];
				} else if (
					deliveryStateCode === DeploymentDeliveryStatusEnum.PENDING &&
					deployStatusCode === DeploymentStatusEnum.DEPLOYED
				) {
					actions = [
						<Link
							key="edit"
							className="select-none"
							onClick={() => handleAdjust(record)}
						>
							调整排兵布阵
						</Link>,
					];
				} else if (
					deliveryStateCode === DeploymentDeliveryStatusEnum.DELIVERED &&
					deployStatusCode === DeploymentStatusEnum.PENDING
				) {
					actions = [
						<Link
							key="offline"
							className="select-none"
							onClick={() => handleMarkOfflineDeployed(record)}
						>
							线下已排布
						</Link>,
					];
				} else if (canViewDeployment(deliveryStateCode, deployStatusCode)) {
					actions = [
						<Link key="view" className="select-none" onClick={() => handleView(record)}>
							查看排兵布阵
						</Link>,
					];
				}

				if (actions.length === 0) {
					return "";
				}
				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{actions}
					</Space>
				);
			},
		},
	];

	// 重置查询条件
	const handleReset = useCallback((searchConfig?: { form?: ProFormInstance }) => {
		searchConfig?.form?.resetFields();
		setTimeout(() => {
			searchConfig?.form?.submit();
		}, 0);
	}, []);

	const panelDetail = panelDetailOverride ?? detailData ?? null;

	return (
		<div className="relative h-full">
			<BasicContent className="flex h-full flex-col">
				<BasicTable<DeploymentItem, DeploymentListParams>
					actionRef={actionRef}
					formRef={formRef}
					columns={columns}
					request={handleSearch}
					rowKey="id"
					cardBordered={false}
					toolbar={{ className: "border-t" }}
					className="[&_.ant-pro-table-list-toolbar-setting-item]:ml-0"
					search={{
						filterType: "query",
						className:
							"!mb-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap",
						searchGutter: 12,
						defaultCollapsed: false,
						optionRender: (searchConfig) => [
							<Button
								key="submit"
								type="primary"
								onClick={() => searchConfig.form?.submit()}
							>
								查询
							</Button>,
							<Button
								type="text"
								key="reset"
								onClick={() => handleReset(searchConfig)}
							>
								重置
							</Button>,
						],
					}}
					form={{ className: "!p-0 !pb-4" }}
					cardProps={{ bodyStyle: { padding: 0 } }}
					adaptive
					scroll={{ x: "1600" }}
					tableAlertRender={false}
					toolBarRender={() => []}
					options={{
						reload: false,
						density: false,
						fullScreen: false,
						setting: {
							settingIcon: <Button>列表选项</Button>,
						},
					}}
					pagination={{
						defaultPageSize: 10,
						showSizeChanger: true,
						showQuickJumper: true,
					}}
				/>
				{previewRecord ? (
					<DeploymentPreviewDrawer
						open={previewOpen}
						detail={detailData ?? null}
						project={previewRecord}
						onClose={handleClosePreview}
						dataMode="view"
						title="查看排兵布阵"
					/>
				) : null}
			</BasicContent>
			{viewMode === "panel" && panelRecord ? (
				<div className="absolute inset-0 z-10 flex min-h-0 flex-col overflow-hidden bg-white">
					<DeploymentPanel
						mode={panelMode}
						project={panelRecord}
						detail={panelDetail}
						loading={detailLoading || detailFetching}
						findingBenchmark={findingBenchmark}
						onBack={handleBackToList}
						onFindBenchmarkProject={handleFindBenchmarkProject}
					/>
				</div>
			) : null}
		</div>
	);
}
