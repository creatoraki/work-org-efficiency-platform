/**
 * 组织大脑 - 人岗匹配页面
 *
 * 功能说明：
 * 1. 列表展示人岗匹配任务
 * 2. 支持新增/编辑人岗匹配任务
 * 3. 支持查看人岗匹配任务
 * 4. 支持配置匹配模型和执行AI匹配
 */

import type {
	JobOptionItem,
	OrganizationTreeNode,
	PositionOptionItem,
	PostgradeOptionItem,
} from "#src/api/common";
import type { JobMatchCandidateItem } from "#src/api/org-brain/candidate";
import type {
	ApiSearchOptions,
	JobMatchingDetail,
	JobMatchingItem,
	SaveJobMatchingCandidateItem,
	SaveJobMatchingParams,
} from "#src/api/org-brain/job-matching";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";

import type { JobMatchingDrawerSubmitValues } from "./components";
import { fetchOrganizationTree } from "#src/api/common";
import {
	createJobMatching,
	deleteJobMatching,
	fetchJobMatchingList,
	fetchJobMatchingSearchOptions,
	updateJobMatching,
} from "#src/api/org-brain/job-matching";
import { getJobPositionTree } from "#src/api/tag-management/rule-library";
import { BasicButton, BasicContent, BasicTable, MatchRateCell } from "#src/components";
import { useJobCascadeOptions } from "#src/hooks";
import { TalentArchiveDrawer } from "#src/pages/org-brain/personnel-archive/components/talent-archive-drawer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App, Button, Divider, Modal, Space, Tooltip, TreeSelect, Typography } from "antd";
import { findIndex } from "lodash-es";
import { useCallback, useMemo, useRef, useState } from "react";
import { JobMatchingDrawer } from "./components";
import {
	buildJobPostTreeSelectData,
	createJobPostNodeMap,
} from "./components/job-matching-drawer/components/job-post-tree";
import { CACHE_TIME, JOB_MATCHING_QUERY_KEYS } from "./config";

const { Link, Text } = Typography;

/**
 * 根据组织编码从组织树中查找节点。
 *
 * @param treeData - 组织树根节点
 * @param orgCode - 组织编码
 * @returns 命中的组织节点；未命中时返回 null
 * @author 王善能
 * @since 2026-06-22
 */
function findOrganizationNode(
	treeData: OrganizationTreeNode | null | undefined,
	orgCode: string | number | undefined,
): OrganizationTreeNode | null {
	if (!treeData || orgCode == null) {
		return null;
	}
	if (String(treeData.code) === String(orgCode)) {
		return treeData;
	}
	for (const child of treeData.children ?? []) {
		const matchedNode = findOrganizationNode(child, orgCode);
		if (matchedNode) {
			return matchedNode;
		}
	}
	return null;
}

/**
 * 表格列操作处理器接口
 */
interface JobMatchingColumnHandlers {
	onView: (record: JobMatchingItem) => void;
	onEdit: (record: JobMatchingItem) => void;
	onDelete: (record: JobMatchingItem) => void;
}

/**
 * 搜索选项数据接口
 */
interface JobMatchingPageSearchOptions {
	organizationTreeData?: OrganizationTreeNode | null;
	jobOptions: JobOptionItem[];
	postOptions: PositionOptionItem[];
	postgradeOptions: PostgradeOptionItem[];
	modelOptions: Array<{ value: string; label: string }>;
	candidateOptions: Array<{ value: string; label: string }>;
	operatorOptions: Array<{ value: string; label: string }>;
	// 岗位变更回调
	onJobChange?: (jobIds: number[]) => void;
	// 职位变更回调
	onPostChange?: (postIds: Array<string | number>) => void;
}

/**
 * 将页面候选人卡片数据转换为后端保存表单需要的 CandidateItem。
 *
 * @param params - 转换上下文
 * @param params.candidates - 当前候选人列表
 * @param params.selectedCandidates - 当前多选候选人列表
 * @param params.selectedCandidate - 当前选中的候选人
 * @param params.orgCode - 任务所属组织编码
 * @param params.orgName - 任务所属组织名称
 * @param params.jobId - 岗位ID
 * @param params.jobName - 岗位名称
 * @param params.postId - 职位ID
 * @param params.postName - 职位名称
 * @param params.postgradeId - 职级ID
 * @param params.postgradeName - 职级名称
 * @returns 后端保存候选人列表
 * @author 王善能
 * @since 2026-06-23
 */
function buildSaveCandidates(params: {
	candidates?: JobMatchCandidateItem[];
	selectedCandidates?: JobMatchCandidateItem[];
	selectedCandidate?: JobMatchCandidateItem | null;
	orgCode: string;
	orgName: string;
	jobId: string;
	jobName: string;
	postId: string;
	postName: string;
	postgradeId?: string;
	postgradeName?: string;
}): SaveJobMatchingCandidateItem[] | undefined {
	const candidateList = params.candidates ?? [];
	if (candidateList.length === 0) {
		return undefined;
	}

	return candidateList
		.filter((candidate) => Boolean(candidate.empCode))
		.map((candidate) => {
			const isSelected =
				params.selectedCandidates?.some((selectedItem) => {
					if (selectedItem.userId != null && candidate.userId != null) {
						return selectedItem.userId === candidate.userId;
					}
					return (
						selectedItem.empCode != null &&
						candidate.empCode != null &&
						selectedItem.empCode === candidate.empCode
					);
				}) ??
				(params.selectedCandidate?.empCode != null &&
					candidate.empCode != null &&
					params.selectedCandidate.empCode === candidate.empCode);

			const {
				username,
				positionCode,
				remark,
				empBadge,
				empName,
				postName,
				postgradeName,
				jobId,
				postId,
				...restCandidate
			} = candidate;

			return {
				...restCandidate,
				empCode: candidate.empCode!,
				userName: username,
				orgCode: params.orgCode,
				orgName: candidate.orgName || params.orgName,
				jobCode: Number(params.jobId),
				jobName: candidate.jobName || params.jobName,
				postCode: Number(params.postId),
				positionName: candidate.positionName || params.postName,
				positionLevel: candidate.positionLevel || params.postgradeName,
				isSelected,
			};
		});
}

/**
 * 组装后端多选筛选参数。
 *
 * 当前分页接口使用数组承接多选条件；空数组不传，避免生成无意义的 IN 条件。
 *
 * @param value - 表单字段值
 * @returns 数组筛选参数
 */
function getMultiValueSearchParam<T>(value: T | T[] | undefined): T[] | undefined {
	if (Array.isArray(value)) {
		const filteredValue = value.filter(
			(item) => item !== undefined && item !== null && item !== "",
		);
		return filteredValue.length > 0 ? filteredValue : undefined;
	}
	if (value === undefined || value === null || value === "") {
		return undefined;
	}
	return [value];
}

/**
 * 将多选字段显式转换为数字数组，避免运行时 string / number 混用导致后端绑定不稳定。
 *
 * @param value - 单值或多值表单字段
 * @returns 数字数组；当值为空或转换失败时返回 undefined
 * @author 王善能
 * @since 2026-06-24
 */
function getNumberMultiValueSearchParam(
	value: string | number | Array<string | number> | undefined,
): number[] | undefined {
	const values = getMultiValueSearchParam(value);
	if (!values?.length) {
		return undefined;
	}
	const result = values.map((item) => Number(item)).filter((item) => !Number.isNaN(item));
	return result.length > 0 ? result : undefined;
}

/**
 * 获取人岗匹配表格列配置
 *
 * 负责统一定义列表页列渲染、搜索项与列内操作行为
 *
 * @param handlers - 列操作回调集合
 * @param searchOptions - 搜索区和列渲染依赖的选项数据
 * @returns 人岗匹配列表列配置
 * @author 王善能
 * @since 2026-06-08
 */
function getJobMatchingColumns(
	handlers: JobMatchingColumnHandlers,
	searchOptions: JobMatchingPageSearchOptions,
): ProColumns<JobMatchingItem>[] {
	return [
		{
			title: "人岗匹配任务名称",
			dataIndex: "taskName",
			key: "taskName",
			width: 200,
			ellipsis: true,
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				labelCol: { flex: "8.5rem" },
			},
			fieldProps: {
				variant: "borderless",
				placeholder: "支持模糊搜索",
			},
			render: (_, record) => (
				<Link onClick={() => handlers.onView(record)}>{record.taskName}</Link>
			),
		},
		{
			title: "所属组织",
			dataIndex: "orgName",
			key: "orgName",
			width: 180,
			ellipsis: true,
			hideInSearch: false,
			formItemProps: {
				label: "所属组织",
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "orgCode",
			},
			renderFormItem: () => {
				return (
					<TreeSelect
						placeholder="请选择"
						treeData={
							searchOptions.organizationTreeData
								? [searchOptions.organizationTreeData]
								: []
						}
						fieldNames={{ label: "name", value: "code", children: "children" }}
						treeNodeFilterProp="name"
						showSearch
						allowClear
						variant="borderless"
						popupMatchSelectWidth={416}
					/>
				);
			},
			render: (_, record) => (
				<Tooltip title={record.orgFullName || record.orgFullPath || record.orgName}>
					<Text ellipsis className="max-w-[160px]">
						{record.orgName}
					</Text>
				</Tooltip>
			),
		},
		{
			title: "岗位",
			dataIndex: "jobName",
			ellipsis: true,
			key: "jobName",
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				label: "岗位",
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "jobIds",
			},
			fieldProps: {
				options: searchOptions.jobOptions,
				fieldNames: { label: "displayName", value: "jobId" },
				popupMatchSelectWidth: false,
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: "responsive",
				onChange: (values: number[]) => {
					searchOptions.onJobChange?.(values || []);
				},
			},
		},
		{
			title: "职位",
			dataIndex: "postName",
			key: "postName",
			ellipsis: true,
			width: 120,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "postIds",
			},
			fieldProps: {
				options: searchOptions.postOptions,
				fieldNames: { label: "displayName", value: "postId" },
				popupMatchSelectWidth: false,
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: "responsive",
				onChange: (values: number[]) => {
					searchOptions.onPostChange?.(values || []);
				},
			},
		},
		{
			title: "职级",
			dataIndex: "postgradeName",
			key: "postgradeName",
			ellipsis: true,
			width: 60,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "postgradeIds",
			},
			fieldProps: {
				options: searchOptions.postgradeOptions,
				fieldNames: { label: "postgradeName", value: "postgradeId" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: "responsive",
			},
			render: (_, record) => record.postgradeName || "-",
		},
		{
			title: "匹配模型",
			dataIndex: "modelName",
			key: "modelName",
			width: 120,
			ellipsis: true,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "modelIds",
			},
			fieldProps: {
				options: searchOptions.modelOptions,
				fieldNames: { label: "label", value: "value" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "第一候选人",
			dataIndex: "candidateName",
			key: "candidateName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "candidates",
				labelCol: { flex: "6rem" },
			},
			fieldProps: {
				options: searchOptions.candidateOptions,
				fieldNames: { label: "label", value: "value" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
			render: (_, record) => record.candidateName || "-",
		},
		{
			title: "人岗匹配度",
			dataIndex: "matchScore",
			key: "matchScore",
			width: 140,
			hideInSearch: true,
			render: (_, record) => <MatchRateCell value={record.matchScore} />,
		},
		{
			title: "操作人",
			dataIndex: "operatorName",
			key: "operatorName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "operatorAccounts",
			},
			fieldProps: {
				options: searchOptions.operatorOptions,
				fieldNames: { label: "label", value: "value" },
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				mode: "multiple",
				maxTagCount: 1,
			},
		},
		{
			title: "操作时间",
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
			width: 120,
			fixed: "right",
			render: (_, record) => (
				<Space size={0} split={<Divider type="vertical" />}>
					<Link onClick={() => handlers.onEdit(record)}>编辑</Link>
					<Link onClick={() => handlers.onDelete(record)}>删除</Link>
				</Space>
			),
		},
	];
}

/**
 * 人岗匹配页面组件
 *
 * 负责承接任务列表、搜索筛选、新增编辑抽屉、详情抽屉和人才档案抽屉的整体编排
 *
 * @returns 人岗匹配页面 JSX
 * @author 王善能
 * @since 2026-06-08
 */
export default function JobMatchingPage() {
	const { message } = App.useApp();
	const actionRef = useRef<ActionType>();
	const formRef = useRef<ProFormInstance>();
	const queryClient = useQueryClient();

	// 抽屉状态
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<"add" | "edit" | "view">("add");
	const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
	const [drawerPreviewRecord, setDrawerPreviewRecord] = useState<JobMatchingItem | null>(null);
	const [currentDetailData, setCurrentDetailData] = useState<JobMatchingDetail | null>(null);
	const [detailReloadKey, setDetailReloadKey] = useState(0);

	// 人才档案抽屉状态
	const [isArchiveOpen, setIsArchiveOpen] = useState(false);
	const [archiveCandidateId, setArchiveCandidateId] = useState<string | null>(null);
	const [archiveCandidateIds, setArchiveCandidateIds] = useState<string[]>([]);
	const [archiveCandidates, setArchiveCandidates] = useState<JobMatchCandidateItem[]>([]);

	// 获取组织树
	const { data: organizationTreeData, isLoading: organizationTreeLoading } = useQuery({
		queryKey: JOB_MATCHING_QUERY_KEYS.organizationTree,
		queryFn: () => fetchOrganizationTree(),
		staleTime: CACHE_TIME,
		gcTime: CACHE_TIME,
	});

	const { data: jobPositionTreeData, isLoading: jobPositionTreeLoading } = useQuery({
		queryKey: JOB_MATCHING_QUERY_KEYS.jobPositionTree,
		queryFn: () => getJobPositionTree(),
		staleTime: CACHE_TIME,
		gcTime: CACHE_TIME,
	});
	const jobPostTreeData = useMemo(
		() => buildJobPostTreeSelectData(jobPositionTreeData ?? []),
		[jobPositionTreeData],
	);
	const jobPostNodeMap = useMemo(() => createJobPostNodeMap(jobPostTreeData), [jobPostTreeData]);

	const {
		jobOptions,
		postOptions,
		postgradeOptions,
		handleJobChange,
		handlePostChange,
		resetLinkage,
	} = useJobCascadeOptions({
		sceneKey: "job-matching",
		formRef,
		staleTime: CACHE_TIME,
		gcTime: CACHE_TIME,
	});

	// 获取搜索选项（匹配模型、候选人、操作人等）
	const { data: apiSearchOptions } = useQuery<ApiSearchOptions>({
		queryKey: JOB_MATCHING_QUERY_KEYS.searchOptions,
		queryFn: fetchJobMatchingSearchOptions,
		staleTime: CACHE_TIME,
		gcTime: CACHE_TIME,
	});

	// 处理查询
	const handleSearch = async (params: any) => {
		try {
			const { current = 1, pageSize = 10, ...restParams } = params;
			const {
				jobIds,
				postIds,
				postgradeIds,
				modelIds,
				candidates,
				operatorAccounts,
				...baseParams
			} = restParams;

			// 后端分页接口使用数组承接多选条件，空数组统一清理为 undefined。
			const queryParams = {
				...baseParams,
				jobIds: getNumberMultiValueSearchParam(jobIds),
				postIds: getNumberMultiValueSearchParam(postIds),
				postgradeIds: getMultiValueSearchParam(postgradeIds),
				modelIds: getNumberMultiValueSearchParam(modelIds),
				candidates: getMultiValueSearchParam(candidates),
				operatorAccounts: getMultiValueSearchParam(operatorAccounts),
			};

			const result = await fetchJobMatchingList({
				pageNum: current,
				pageSize,
				...queryParams,
			});

			return {
				data: result.list,
				success: true,
				total: result.total,
			};
		} catch (error) {
			console.error("获取人岗匹配列表失败:", error);
			return { data: [], success: false, total: 0 };
		}
	};

	/**
	 * 从首页列表打开人岗匹配抽屉。
	 *
	 * 三个入口统一走同一套传参规范：
	 * 1. `add` 不传任务 ID；
	 * 2. `edit` / `view` 必须透传首页列表行的任务 ID；
	 * 3. 抽屉内部再根据 `mode + recordId` 决定是否请求详情。
	 *
	 * @param mode - 抽屉模式
	 * @param record - 当前列表行；新增模式下可不传
	 * @returns 无返回值
	 * @author 王善能
	 * @since 2026-06-26
	 */
	const openJobMatchingDrawer = useCallback(
		(mode: "add" | "edit" | "view", record?: JobMatchingItem) => {
			setDrawerMode(mode);
			setCurrentRecordId(mode === "add" ? null : (record?.id ?? null));
			setDrawerPreviewRecord(mode === "add" ? null : (record ?? null));
			setIsDrawerOpen(true);
		},
		[],
	);

	// 处理新增
	const handleCreate = useCallback(() => {
		openJobMatchingDrawer("add");
	}, [openJobMatchingDrawer]);

	// 处理编辑
	const handleEdit = useCallback(
		(record: JobMatchingItem) => {
			openJobMatchingDrawer("edit", record);
		},
		[openJobMatchingDrawer],
	);

	const handleDetailChange = useCallback((detail: JobMatchingDetail | null) => {
		setCurrentDetailData(detail);
	}, []);

	// 处理查看详情
	const handleView = useCallback(
		(record: JobMatchingItem) => {
			openJobMatchingDrawer("view", record);
		},
		[openJobMatchingDrawer],
	);

	// 处理保存
	const handleSave = useCallback(
		async (values: JobMatchingDrawerSubmitValues) => {
			try {
				const organizationNode = values.orgCode
					? findOrganizationNode(organizationTreeData, values.orgCode)
					: null;
				const jobName = values.jobName ?? "";
				const postName = values.postName ?? "";
				const postgradeName = values.postgradeName ?? "";
				const payload: SaveJobMatchingParams = {
					id: values.id,
					taskName: values.taskName,
					orgCode: values.orgCode ?? "",
					orgName: organizationNode?.name ?? "",
					orgFullPath: values.orgFullPath ?? organizationNode?.ancestors ?? "",
					orgFullName: values.orgFullName ?? organizationNode?.fullname ?? "",
					jobId: values.jobId,
					jobName,
					postId: values.postId,
					postName,
					postgradeId: values.postgradeId,
					postgradeName,
					modelId: values.modelId,
					modelName: values.modelName ?? "",
					modelSnapshot: values.modelSnapshot,
					modelSnapshotHash: values.modelSnapshotHash,
					candidates: buildSaveCandidates({
						candidates: values.candidateList,
						selectedCandidates: values.selectedCandidates,
						selectedCandidate: values.selectedCandidate,
						orgCode: values.orgCode ?? "",
						orgName: organizationNode?.name ?? "",
						jobId: values.jobId,
						jobName,
						postId: values.postId,
						postName,
						postgradeId: values.postgradeId,
						postgradeName,
					}),
					refreshModelSnapshot: values.refreshModelSnapshot,
				};

				if (drawerMode === "add") {
					await createJobMatching(payload);
				} else {
					await updateJobMatching(payload);
					if (values.id) {
						await queryClient.invalidateQueries({
							queryKey: JOB_MATCHING_QUERY_KEYS.detail({ recordId: values.id }),
							exact: true,
						});
					}
				}
				message.success(drawerMode === "add" ? "新增成功" : "编辑成功");
				setIsDrawerOpen(false);
				if (drawerMode === "edit") {
					setDetailReloadKey((prev) => prev + 1);
				}
				// 刷新首页筛选项与列表。
				queryClient.invalidateQueries({ queryKey: JOB_MATCHING_QUERY_KEYS.searchOptions });
				actionRef.current?.reload();
			} catch (error) {
				console.error("保存失败:", error);
				message.error("保存失败");
			}
		},
		[drawerMode, organizationTreeData, queryClient],
	);

	// 处理查看档案
	const handleViewArchive = useCallback(
		(currentCandidate: JobMatchCandidateItem, candidates: JobMatchCandidateItem[]) => {
			const candidateUserIds = candidates
				.map((candidate) => candidate.userId)
				.filter((userId): userId is number => userId != null)
				.map(String);
			setArchiveCandidateId(
				currentCandidate.userId != null ? String(currentCandidate.userId) : null,
			);
			setArchiveCandidateIds(candidateUserIds);
			setArchiveCandidates(candidates);
			setIsArchiveOpen(true);
		},
		[],
	);

	const archiveCandidateIndex = useMemo(
		() =>
			archiveCandidateId
				? findIndex(archiveCandidateIds, (code) => code === archiveCandidateId)
				: -1,
		[archiveCandidateId, archiveCandidateIds],
	);
	const archiveCurrentCandidate = useMemo(
		() =>
			archiveCandidateId
				? (archiveCandidates.find(
						(candidate) =>
							candidate.userId != null &&
							String(candidate.userId) === archiveCandidateId,
					) ?? null)
				: null,
		[archiveCandidateId, archiveCandidates],
	);

	// 删除 mutation
	const { mutate: deleteMutate } = useMutation({
		mutationFn: deleteJobMatching,
		onSuccess: () => {
			message.success("删除成功");
			queryClient.invalidateQueries({ queryKey: JOB_MATCHING_QUERY_KEYS.searchOptions });
			actionRef.current?.reload();
		},
		onError: (error) => {
			console.error("删除失败:", error);
			message.error("删除失败");
		},
	});

	// 处理删除
	const handleDelete = useCallback(
		(record: JobMatchingItem) => {
			Modal.confirm({
				title: "确认删除",
				content: `确定要删除人岗匹配任务"${record.taskName}"吗？`,
				okText: "确定",
				cancelText: "取消",
				centered: true,
				onOk: () => deleteMutate(record.id),
			});
		},
		[deleteMutate],
	);

	// 表格列配置
	const columns = useMemo(
		() =>
			getJobMatchingColumns(
				{
					onView: handleView,
					onEdit: handleEdit,
					onDelete: handleDelete,
				},
				{
					organizationTreeData,
					jobOptions,
					postOptions,
					postgradeOptions,
					modelOptions: apiSearchOptions?.modelOptions ?? [],
					candidateOptions: apiSearchOptions?.candidateOptions ?? [],
					operatorOptions: apiSearchOptions?.operatorOptions ?? [],
					onJobChange: handleJobChange,
					onPostChange: handlePostChange,
				},
			),
		[
			handleView,
			handleEdit,
			handleDelete,
			organizationTreeData,
			jobOptions,
			postOptions,
			postgradeOptions,
			apiSearchOptions,
			handleJobChange,
			handlePostChange,
		],
	);

	// 处理重置
	const handleReset = useCallback(
		(searchConfig?: { form?: ProFormInstance }) => {
			searchConfig?.form?.resetFields();
			resetLinkage();
			setTimeout(() => {
				searchConfig?.form?.submit();
			}, 0);
		},
		[resetLinkage],
	);

	return (
		<BasicContent className="flex h-full flex-col">
			<BasicTable<JobMatchingItem>
				actionRef={actionRef}
				formRef={formRef}
				columns={columns}
				request={handleSearch}
				rowKey="id"
				cardBordered={false}
				toolbar={{ className: "border-t" }}
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
						<Button type="text" key="reset" onClick={() => handleReset(searchConfig)}>
							重置
						</Button>,
					],
				}}
				form={{ className: "!p-0 !pb-4" }}
				cardProps={{ bodyStyle: { padding: 0 } }}
				adaptive
				scroll={{ x: "1600" }}
				tableAlertRender={false}
				headerTitle={
					<BasicButton key="add" type="primary" onClick={handleCreate}>
						新增
					</BasicButton>
				}
				toolBarRender={() => []}
				options={{
					reload: false,
					density: false,
					fullScreen: false,
					setting: {
						settingIcon: <BasicButton>列表选项</BasicButton>,
					},
				}}
				pagination={{
					defaultPageSize: 10,
					showSizeChanger: true,
					showQuickJumper: true,
				}}
			/>

			{/* 新增/编辑/查看抽屉 */}
			<JobMatchingDrawer
				open={isDrawerOpen}
				mode={drawerMode}
				recordId={currentRecordId}
				initialPreviewData={drawerPreviewRecord}
				organizationTreeData={organizationTreeData}
				organizationTreeLoading={organizationTreeLoading}
				jobPositionTreeData={jobPositionTreeData}
				jobPostTreeData={jobPostTreeData}
				jobPostNodeMap={jobPostNodeMap}
				jobPositionTreeLoading={jobPositionTreeLoading}
				detailReloadKey={detailReloadKey}
				onDetailChange={handleDetailChange}
				onClose={() => {
					setIsDrawerOpen(false);
					setDrawerPreviewRecord(null);
					setCurrentDetailData(null);
				}}
				onSave={handleSave}
				onViewArchive={handleViewArchive}
			/>

			{/* 人员档案抽屉 */}
			<TalentArchiveDrawer
				open={isArchiveOpen}
				userId={archiveCandidateId ?? ""}
				matchRate={archiveCurrentCandidate?.matchScore}
				isCandidateMode
				isCurrent={
					archiveCandidateId != null &&
					String(currentDetailData?.selectedCandidate?.userId) === archiveCandidateId
				}
				currentIndex={archiveCandidateIndex >= 0 ? archiveCandidateIndex + 1 : 0}
				totalCount={archiveCandidateIds.length}
				canPrevious={archiveCandidateIndex > 0}
				canNext={
					archiveCandidateIndex >= 0 &&
					archiveCandidateIndex < archiveCandidateIds.length - 1
				}
				onPrevious={() => {
					if (archiveCandidateIndex > 0) {
						setArchiveCandidateId(
							archiveCandidateIds[archiveCandidateIndex - 1] ?? null,
						);
					}
				}}
				onNext={() => {
					if (
						archiveCandidateIndex >= 0 &&
						archiveCandidateIndex < archiveCandidateIds.length - 1
					) {
						setArchiveCandidateId(
							archiveCandidateIds[archiveCandidateIndex + 1] ?? null,
						);
					}
				}}
				onClose={() => {
					setIsArchiveOpen(false);
					setArchiveCandidateId(null);
					setArchiveCandidateIds([]);
					setArchiveCandidates([]);
				}}
			/>
		</BasicContent>
	);
}
