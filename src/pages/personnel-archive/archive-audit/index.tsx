import type { JobOptionItem, OrganizationTreeNode, PositionOptionItem } from "#src/api/common";
import type { ArchiveAuditItem } from "#src/api/personnel-archive/archive-audit";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";

import { fetchOrganizationTree } from "#src/api/common";
import {
	fetchArchiveAuditList,
	fetchArchiveAuditStats,
	getArchiveAuditSearchOptions,
} from "#src/api/personnel-archive/archive-audit";
import { fetchApprovalNodeList } from "#src/api/personnel-archive/common";
import AuditApprovedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import AuditPendingReviewStatusIcon from "#src/assets/svg/audit_pending_review_status.svg?react";
import AuditRejectedStatusIcon from "#src/assets/svg/audit_rejected_status.svg?react";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { useDict, useJobCascadeOptions } from "#src/hooks";
import ArchiveDetail from "#src/pages/personnel-archive/components/archive-detail";
import { AuditProcessModal } from "#src/pages/personnel-archive/components/audit-process-modal";
import { useRequest } from "ahooks";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Divider,
	Space,
	Statistic,
	Tooltip,
	TreeSelect,
	Typography,
} from "antd";
import { useEffectOnActive } from "keepalive-for-react";
import { useCallback, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { TagsCell } from "../components/tags-cell";
import {
	ARCHIVE_AUDIT_OPERATION_BUTTON_MAPPING,
	ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT,
	CACHE_TIME,
	PERSONNEL_ARCHIVE_DICT_KEYS,
	PERSONNEL_ARCHIVE_PERMISSIONS,
	TABLE_CONFIG,
} from "../config";

const { Text } = Typography;

/**
 * 表格列操作处理器接口
 */
interface ArchiveAuditColumnHandlers {
	onAudit: (record: ArchiveAuditItem) => void;
	onViewDetail: (record: ArchiveAuditItem) => void;
	onViewProcess: (record: ArchiveAuditItem) => void;
}

/**
 * 搜索选项数据接口
 */
interface ArchiveAuditSearchOptions {
	organizationTreeData?: OrganizationTreeNode | null;
	postOptions: PositionOptionItem[];
	jobOptions: JobOptionItem[];
	approveTagIdOptions: Array<{ tagId: number; tagName: string }>;
	approvedTagIdOptions: Array<{ tagId: number; tagName: string }>;
	submitUserOptions: Array<{ userId: number; userName: string }>;
	approverOptions: Array<{ userId: number; userName: string }>;
	onJobChange: (jobIds: Array<string | number>) => void;
}

const { Link } = Typography;

/**
 * 获取档案审核表格列配置
 */
function getArchiveAuditColumns(
	handlers: ArchiveAuditColumnHandlers,
	searchOptions: ArchiveAuditSearchOptions,
	auditStatusValueMap: Map<string, { dictLabel?: string; listClass?: string | null }>,
	auditStatusOptions: Array<{ label: string; value: string }>,
	_translateStatus: (value: string | null | undefined) => string | undefined,
): ProColumns<ArchiveAuditItem>[] {
	return [
		{
			title: "员工名称",
			dataIndex: "name",
			width: 150,
			key: "name",
			hideInSearch: false,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
			},
			fieldProps: {
				variant: "borderless",
				placeholder: "支持姓名/工号模糊搜索",
			},
			render: (_, record) => (
				<div className="flex flex-shrink-0 items-center gap-1">
					<Avatar
						size="small"
						className="flex-shrink-0 border border-[rgb(var(--oo-colorPrimaryHover))] [&_img]:object-cover [&_img]:object-center"
						src={(record as any).avatar}
						style={{
							backgroundColor: "rgb(var(--oo-colorPrimary) / 0.12)",
							color: "rgb(var(--oo-colorPrimary))",
						}}
					>
						{record.name?.[0]}
					</Avatar>
					<div className="flex-shrink-0">
						<div>{record.name}</div>
						<div className="text-xs text-gray-500">
							工号：
							{record.userCode}
						</div>
					</div>
				</div>
			),
		},
		{
			title: "所属组织",
			dataIndex: "orgName",
			width: 150,
			key: "orgName",
			hideInSearch: false,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "orgId",
			},
			renderFormItem: () => {
				return (
					<TreeSelect
						treeData={
							searchOptions.organizationTreeData
								? [searchOptions.organizationTreeData]
								: []
						}
						fieldNames={{ label: "name", value: "id", children: "children" }}
						treeNodeFilterProp="name"
						showSearch
						allowClear
						variant="borderless"
						placeholder="请选择所属组织"
						styles={{
							popup: {
								root: { minWidth: "26rem" },
							},
						}}
					/>
				);
			},
			render: (text, record) => {
				return (
					<Tooltip title={record.orgFullName || text}>
						<Text ellipsis>{text}</Text>
					</Tooltip>
				);
			},
		},
		{
			title: "岗位",
			dataIndex: "jobName",
			key: "jobName",
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "jobId",
			},
			fieldProps: {
				options: searchOptions.jobOptions,
				popupMatchSelectWidth: false,
				showSearch: true,
				allowClear: true,
				fieldNames: { label: "displayName", value: "jobId" },
				variant: "borderless",
				onChange: (value: unknown) => {
					searchOptions.onJobChange(
						typeof value === "string" || typeof value === "number" ? [value] : [],
					);
				},
			},
		},
		{
			title: "职位",
			dataIndex: "postName",
			key: "postName",
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "postId",
			},
			fieldProps: {
				options: searchOptions.postOptions,
				popupMatchSelectWidth: false,
				showSearch: true,
				allowClear: true,
				fieldNames: { label: "displayName", value: "postId" },
				variant: "borderless",
			},
		},
		{
			title: "入职时间",
			dataIndex: "joinDate",
			key: "joinDate",
			width: 120,
			valueType: "date",
			hideInSearch: true,
			fieldProps: {
				format: "YYYY-MM-DD",
			},
		},
		{
			title: "待审核标签",
			dataIndex: "approveTags",
			width: 120,
			key: "approveTags",
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "6rem" },
				name: "approveTagId",
			},
			fieldProps: {
				options: searchOptions.approveTagIdOptions,
				fieldNames: { label: "tagName", value: "tagId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "tagName",
				variant: "borderless",
			},
			render: (_: any, record: ArchiveAuditItem) => {
				return <TagsCell tagsText={record.approveTags} separator="、" />;
			},
		},
		{
			title: "已审核标签",
			dataIndex: "approvedTags",
			width: 180,
			key: "approvedTags",
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "6rem" },
				name: "approvedTagId",
			},
			fieldProps: {
				options: searchOptions.approvedTagIdOptions,
				fieldNames: { label: "tagName", value: "tagId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "tagName",
				variant: "borderless",
			},
			render: (_: any, record: ArchiveAuditItem) => {
				return <TagsCell tagsText={record.approvedTags} separator="、" />;
			},
		},
		{
			title: "状态",
			dataIndex: "status",
			key: "status",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				initialValue: "2",
			},
			fieldProps: {
				options: auditStatusOptions || [],
				variant: "borderless",
			},
			render: (_, record) => {
				const dictItem = auditStatusValueMap.get(record.status);
				const status = dictItem?.listClass as
					| "default"
					| "success"
					| "processing"
					| "error"
					| "warning"
					| undefined;
				return <Badge status={status} text={dictItem?.dictLabel || record.status} />;
			},
		},
		{
			title: "提交人",
			dataIndex: "submitUserName",
			key: "submitUserName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "submitUser",
			},
			fieldProps: {
				options: searchOptions.submitUserOptions,
				fieldNames: { label: "userName", value: "userId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				variant: "borderless",
			},
			render: (_: any, record: ArchiveAuditItem) => {
				return <TagsCell tagsText={record.submitUserName} separator="," />;
			},
		},
		{
			title: "审核人",
			dataIndex: "approverName",
			key: "approverName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "approver",
			},
			fieldProps: {
				options: searchOptions.approverOptions,
				fieldNames: { label: "userName", value: "userId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				variant: "borderless",
			},
		},
		{
			title: "更新时间",
			dataIndex: "updateTime",
			key: "updateTime",
			width: 160,
			valueType: "dateTime",
			hideInSearch: true,
		},
		{
			title: "操作",
			key: "action",
			valueType: "option",
			width: 200,
			fixed: "right",
			render: (_, record) => {
				const operations = ARCHIVE_AUDIT_OPERATION_BUTTON_MAPPING[record.status] || [];

				const items: Array<{ label: string; onClick: () => void }> = [];

				// 判断是否有已审核/已拒绝的标签（通过判断 approvedTags 是否有值）
				const hasApprovedTags = record.approvedTags && record.approvedTags.trim() !== "";

				operations.forEach((operation) => {
					switch (operation) {
						case "audit":
							items.push({
								label: ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT.audit,
								onClick: () => handlers.onAudit(record),
							});
							break;
						case "viewDetail":
							// 只有存在已审核/已拒绝标签时才显示审核详情
							if (hasApprovedTags) {
								items.push({
									label: ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT.viewDetail,
									onClick: () => handlers.onViewDetail(record),
								});
							}
							break;
						case "viewProcess":
							items.push({
								label: ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT.viewProcess,
								onClick: () => handlers.onViewProcess(record),
							});
							break;
					}
				});

				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{items.map((item) => {
							// 审核按钮需要权限控制
							if (item.label === ARCHIVE_AUDIT_OPERATION_BUTTON_TEXT.audit) {
								return (
									<BasicButton
										key={`${record.id}-${item.label}`}
										type="link"
										onClick={item.onClick}
										auth={PERSONNEL_ARCHIVE_PERMISSIONS.ARCHIVE_APPROVE}
										className="px-0"
									>
										{item.label}
									</BasicButton>
								);
							}
							// 其他按钮保持原样
							return (
								<Link key={`${record.id}-${item.label}`} onClick={item.onClick}>
									{item.label}
								</Link>
							);
						})}
					</Space>
				);
			},
		},
	];
}

/**
 * 人员档案 - 档案审核
 */
const ArchiveAudit: React.FC = () => {
	const actionRef = useRef<ActionType>();
	const formRef = useRef<ProFormInstance>();

	const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
	const [auditDrawerMode, setAuditDrawerMode] = useState<"edit" | "readonly">("edit");
	const [currentRecord, setCurrentRecord] = useState<ArchiveAuditItem | null>(null);

	// 审核进程弹窗状态
	const [isAuditProcessModalOpen, setIsAuditProcessModalOpen] = useState(false);
	const [processRecord, setProcessRecord] = useState<ArchiveAuditItem | null>(null);

	const { jobOptions, postOptions, handleJobChange, resetLinkage } = useJobCascadeOptions({
		sceneKey: "archive-audit",
		formRef,
		jobFieldName: "jobId",
		postFieldName: "postId",
	});

	// 获取审核节点列表数据（在父组件中请求，避免子组件闪动）
	const { data: approvalNodeList = [], loading: approvalNodeLoading } = useRequest(
		async () => {
			const userId = processRecord?.userId ?? processRecord?.id;
			if (!userId) {
				return [];
			}
			const res = await fetchApprovalNodeList(Number(userId));
			return res ?? [];
		},
		{
			ready: isAuditProcessModalOpen && !!(processRecord?.userId ?? processRecord?.id),
			refreshDeps: [isAuditProcessModalOpen, processRecord?.userId, processRecord?.id],
		},
	);

	// 计算默认选中的标签ID（第一项）
	const defaultTagId = useMemo(() => {
		if (approvalNodeList.length > 0) {
			const firstTag = approvalNodeList[0];
			return firstTag?.tagId ?? undefined;
		}
		return undefined;
	}, [approvalNodeList]);

	// 获取组织树数据（带缓存）
	const { data: organizationTreeData } = useRequest(
		async () => {
			const result = await fetchOrganizationTree();
			return result ?? null;
		},
		{
			cacheKey: "archive-audit-organization-tree",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
		},
	);

	// 处理重置表单
	const handleReset = useCallback(
		async (searchConfig?: { form?: ProFormInstance }) => {
			resetLinkage();
			// 重置表单字段
			searchConfig?.form?.resetFields();
			// 重置后提交表单以刷新表格数据
			setTimeout(() => {
				searchConfig?.form?.submit();
			}, 0);
		},
		[resetLinkage],
	);

	// 获取搜索选项数据（带缓存）
	const {
		data: {
			approveTagIdOptions = [],
			approvedTagIdOptions = [],
			submitUserOptions = [],
			approverOptions = [],
		} = {},
		refresh: refreshSearchOptions,
	} = useRequest(
		async () => {
			const res = await getArchiveAuditSearchOptions();
			return res || {};
		},
		{
			cacheKey: "archive-audit-search-options",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
			onError: (error) => {
				console.error("加载选项数据失败:", error);
			},
		},
	);

	// 加载统计数据（使用 useRequest）
	const { data: statsData, refresh: refreshStatistics } = useRequest(
		async () => {
			const res = await fetchArchiveAuditStats();
			return res;
		},
		{
			onError: (error) => {
				console.error("加载统计数据失败:", error);
			},
		},
	);

	const {
		approveNum = 0,
		passedNum = 0,
		monthPassedNum = 0,
		refusedNum = 0,
		monthRefusedNum = 0,
	} = statsData || {};

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表、统计和搜索选项，
	 * 避免审核流转后仍展示旧的待审数量和筛选口径。
	 *
	 * @returns void
	 * @author 王善能
	 * @since 2026-07-07
	 */
	useEffectOnActive(
		() => {
			actionRef.current?.reload();
			refreshStatistics();
			refreshSearchOptions();
		},
		[],
		true,
	);

	// 处理搜索
	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const { current = 1, pageSize = 10, orgId, ...restParams } = params;

			// 处理组织选择器：如果 orgId 是数组，取最后一个值；否则直接使用
			const finalOrgId = (() => {
				if (!orgId) return undefined;
				const idValue = Array.isArray(orgId) ? orgId.at(-1) : orgId;
				const id = Number(idValue);
				return Number.isNaN(id) ? undefined : id;
			})();

			const searchParams = {
				pageNum: current,
				pageSize,
				...restParams,
				...(finalOrgId !== undefined && { orgId: finalOrgId }),
				sortItemList: [
					{
						isAsc: false,
						column: "update_time",
					},
				],
			};

			const response = await fetchArchiveAuditList(searchParams);

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取档案审核列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 处理审核（打开编辑模式抽屉）
	const handleAudit = (record: ArchiveAuditItem) => {
		setCurrentRecord(record);
		setAuditDrawerMode("edit");
		setIsAuditDrawerOpen(true);
	};

	// 处理查看详情（打开只读模式抽屉）
	const handleViewDetail = (record: ArchiveAuditItem) => {
		setCurrentRecord(record);
		setAuditDrawerMode("readonly");
		setIsAuditDrawerOpen(true);
	};

	// 处理查看审核进程
	const handleViewProcess = (record: ArchiveAuditItem) => {
		setProcessRecord(record);
		setIsAuditProcessModalOpen(true);
	};

	// 处理刷新
	const handleRefresh = () => {
		actionRef.current?.reload();
		refreshStatistics(); // 刷新统计数据
		refreshSearchOptions();
	};

	// 处理关闭审核抽屉
	const handleCloseAuditDrawer = () => {
		setIsAuditDrawerOpen(false);
		setCurrentRecord(null);
	};

	// 获取档案审核状态字典
	const {
		valueMap: auditStatusValueMap,
		options: auditStatusOptions,
		translate: translateStatus,
	} = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.ARCHIVE_APPROVAL_STATUS_FOR_APPROVAL);

	// 表格列配置
	const columns = getArchiveAuditColumns(
		{
			onAudit: handleAudit,
			onViewDetail: handleViewDetail,
			onViewProcess: handleViewProcess,
		},
		{
			organizationTreeData,
			postOptions,
			jobOptions,
			approveTagIdOptions,
			approvedTagIdOptions,
			submitUserOptions,
			approverOptions,
			onJobChange: handleJobChange,
		},
		auditStatusValueMap,
		auditStatusOptions || [],
		translateStatus,
	);

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 统计卡片 */}
			<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{[
					{
						title: "待审核档案",
						value: approveNum,
						icon: <AuditPendingReviewStatusIcon className="h-7 w-7" />,
						color: "#FF7D00",
						bgColor: "#F5F7FA",
						description: "请及时处理",
						showTrend: false,
						trendValue: 0,
					},
					{
						title: "已通过档案",
						value: passedNum,
						icon: <AuditApprovedStatusIcon className="h-7 w-7" />,
						color: "#14B968",
						bgColor: "#F5F7FA",
						description: "审核通过",
						showTrend: true,
						trendValue: monthPassedNum,
					},
					{
						title: "已拒绝档案",
						value: refusedNum,
						icon: <AuditRejectedStatusIcon className="h-7 w-7" />,
						color: "#F5222D",
						bgColor: "#F5F7FA",
						description: "审核拒绝",
						showTrend: true,
						trendValue: monthRefusedNum,
					},
				].map((item) => (
					<Card
						key={item.title}
						className="h-full transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
						style={{
							borderRadius: "8px",
							border: "none",
							backgroundColor: item.bgColor,
						}}
						styles={{ body: { padding: "16px" } }}
					>
						{/* 顶部：标题 + 图标 */}
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">{item.title}</span>
							<div>{item.icon}</div>
						</div>

						{/* 底部：大数字 + 右侧趋势信息 */}
						<div className="flex items-end justify-between">
							{/* 左侧大数字 */}
							<div>
								<Statistic
									value={item.value}
									valueStyle={{
										fontSize: "26px",
										fontWeight: "bold",
										lineHeight: 1,
									}}
									formatter={(value) => (
										<CountUp
											start={0}
											end={value as number}
											duration={2}
											separator=","
										/>
									)}
								/>
							</div>

							{/* 右侧趋势信息 */}
							<div className="text-right">
								{item.showTrend ? (
									<Statistic
										value={item.trendValue}
										precision={0}
										valueStyle={{
											fontSize: "14px",
											color: item.color,
											fontWeight: "500",
											lineHeight: 1,
										}}
										prefix={
											<span
												className="mt-1 text-sm"
												style={{ color: item.color }}
											>
												{" "}
												本月新增
											</span>
										}
										suffix={
											<span
												className="mt-1 text-sm"
												style={{ color: item.color }}
											>
												{" "}
												个
											</span>
										}
									/>
								) : (
									<span
										className="text-sm text-gray-500"
										style={{ color: item.color }}
									>
										{item.description}
									</span>
								)}
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* 表格容器 */}
			<div className="flex-1">
				<BasicTable<ArchiveAuditItem>
					actionRef={actionRef}
					formRef={formRef}
					columns={columns}
					request={handleSearch}
					rowKey={(record) =>
						`${record.id}-${record.approveTags}-${record.approvedTags}-${record.updateTime}`
					}
					cardBordered={false}
					toolbar={{
						className: "border-t",
					}}
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
					form={{
						className: "!p-0 !pb-4",
					}}
					cardProps={{
						bodyStyle: {
							padding: 0,
						},
					}}
					adaptive
					scroll={{ x: "1600" }}
					tableAlertRender={false}
					options={{
						...TABLE_CONFIG.OPTIONS,
						setting: {
							settingIcon: <BasicButton>列表选项</BasicButton>,
						},
					}}
					pagination={TABLE_CONFIG.PAGINATION}
				/>
			</div>

			{/* 审核/审核详情通用档案详情抽屉 */}
			{isAuditDrawerOpen && (
				<ArchiveDetail
					open={isAuditDrawerOpen}
					userId={currentRecord?.userId ?? currentRecord?.id ?? ""}
					mode={auditDrawerMode === "edit" ? "audit" : "auditView"}
					approver={currentRecord?.approver}
					onClose={handleCloseAuditDrawer}
					onRefresh={handleRefresh}
				/>
			)}

			{/* 审核进程弹窗 */}
			{isAuditProcessModalOpen && (
				<AuditProcessModal
					open={isAuditProcessModalOpen}
					approvalNodeList={approvalNodeList}
					loading={approvalNodeLoading}
					defaultTagId={defaultTagId}
					onClose={() => {
						setIsAuditProcessModalOpen(false);
						setProcessRecord(null);
					}}
				/>
			)}
		</BasicContent>
	);
};

export default ArchiveAudit;
