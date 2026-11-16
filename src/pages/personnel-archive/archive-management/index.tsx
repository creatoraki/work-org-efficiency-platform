import type { JobOptionItem, OrganizationTreeNode, PositionOptionItem } from "#src/api/common";
import type { StrictOptionType } from "#src/api/types/antd";
import type { BusinessTagTreeNode } from "#src/pages/tag-management/tag-matching/model/types";
import type { PagedData } from "#src/utils/axios-request";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";
import type { SelectProps } from "antd";
import type { ArchiveDetailDrawerHostRef } from "./components/archive-detail-drawer-host";
import type { ArchiveManagementItem, TagOption } from "./types";
import { fetchOrganizationTree } from "#src/api/common";

import {
	fetchArchiveManagementList,
	fetchArchiveManagementStats,
	fetchMaintainerOptions,
	getArchiveManagementSearchOptions,
} from "#src/api/personnel-archive/archive-management";
import { fetchApprovalNodeList } from "#src/api/personnel-archive/common";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { useDict, useJobCascadeOptions } from "#src/hooks";
import { AuditProcessModal } from "#src/pages/personnel-archive/components/audit-process-modal";
import { UploadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useRequest } from "ahooks";
import {
	Alert,
	Avatar,
	Badge,
	Button,
	Divider,
	Modal,
	Progress,
	Space,
	Tooltip,
	TreeSelect,
	Typography,
} from "antd";
import { useEffectOnActive } from "keepalive-for-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { TagsCell } from "../components/tags-cell";
import { CACHE_TIME, PERSONNEL_ARCHIVE_PERMISSIONS, TABLE_CONFIG } from "../config";
import ArchiveDetailDrawerHost from "./components/archive-detail-drawer-host";
import { ImportArchiveModal } from "./components/import-archive-modal";

const { Text } = Typography;

/**
 * 表格列操作处理器接口
 */
interface ArchiveManagementColumnHandlers {
	/** 预取编辑档案详情 */
	onPrefetchEdit: (record: ArchiveManagementItem) => void;
	/** 预取查看详情数据 */
	onPrefetchViewDetail: (record: ArchiveManagementItem) => void;
	/** 打开编辑档案 */
	onEdit: (record: ArchiveManagementItem) => void;
	/** 打开查看详情 */
	onViewDetail: (record: ArchiveManagementItem) => void;
	/** 打开审核进程 */
	onViewAuditProcess: (record: ArchiveManagementItem) => void;
}

/**
 * 搜索选项数据接口
 */
interface ArchiveManagementSearchOptions {
	/** 岗位选项。 */
	jobOptions: JobOptionItem[];
	/** 职位选项。 */
	postOptions: PositionOptionItem[];
	/** 组织树数据。 */
	organizationTreeData?: OrganizationTreeNode | null;
	/** 岗位变更处理器。 */
	onJobChange: (jobIds: Array<string | number>) => void;
	maintainerFieldProps: SelectProps;
	maintainerOptions: Array<{ userId: number; userName: string }>;
	tagIdOptions: Array<{ tagId: number; tagName: string }>;
	fetchMaintainerOptions: (params: {
		keyword?: string;
		deptId?: string;
		pageNum: number;
		pageSize: number;
	}) => Promise<PagedData<StrictOptionType>>;
}

const { Link } = Typography;

/**
 * 将业务标签树扁平化为下拉选项
 */
export function buildTagOptionsFromTree(nodes: BusinessTagTreeNode[]): TagOption[] {
	const traverse = (
		nodeList: BusinessTagTreeNode[],
		parentLabels: string[] = [],
	): TagOption[] => {
		return nodeList.flatMap((node) => {
			const currentPath = node.label ? [...parentLabels, node.label] : parentLabels;
			const children = node.children?.length ? traverse(node.children, currentPath) : [];
			if (node.isTag) {
				return [
					{
						label: currentPath.join(" / "),
						value: node.value,
					},
					...children,
				];
			}
			return children;
		});
	};
	return traverse(nodes);
}

/**
 * 维护完善度单元格组件
 */
interface PerfectDegreeCellProps {
	value: number;
}

const PerfectDegreeCell: React.FC<PerfectDegreeCellProps> = ({ value }) => {
	// 根据百分比判断等级：低(30%以下)、中(30%-70%)、高(70%以上)
	const getLevel = (percent: number) => {
		if (percent < 30) {
			return { text: "低", color: "#ff4d4f" }; // 红色
		}
		if (percent < 70) {
			return { text: "中", color: "#1890ff" }; // 蓝色
		}
		return { text: "高", color: "#52c41a" }; // 绿色
	};

	const level = getLevel(value);
	const percent = Math.round(value || 0);

	return (
		<div className="w-full">
			<div className="mb-[-0.5rem] flex items-center justify-between">
				<span className="text-sm">{percent}%</span>
				<span className="text-sm font-medium" style={{ color: level.color }}>
					{level.text}
				</span>
			</div>
			<Progress
				percent={percent}
				showInfo={false}
				strokeColor="#1890ff"
				trailColor="#f0f0f0"
				strokeLinecap="butt"
				size={["100%", 4]}
			/>
		</div>
	);
};

const MAINTAINER_PAGE_SIZE = 10;

interface MaintainerPageInfo {
	pageNum: number;
	pageSize: number;
	total: number;
}

const DEFAULT_MAINTAINER_PAGE_INFO: MaintainerPageInfo = {
	pageNum: 1,
	pageSize: MAINTAINER_PAGE_SIZE,
	total: 0,
};

interface MaintainerSelectFieldParams {
	fetchMaintainerOptions: ArchiveManagementSearchOptions["fetchMaintainerOptions"];
}

function useMaintainerSelectFieldProps({
	fetchMaintainerOptions,
}: MaintainerSelectFieldParams): SelectProps {
	const [options, setOptions] = useState<StrictOptionType[]>([]);
	const [pageInfo, setPageInfo] = useState(DEFAULT_MAINTAINER_PAGE_INFO);
	const [hasMore, setHasMore] = useState(false);
	const keywordRef = useRef<string>("");
	const requestIdRef = useRef(0);

	const { loading, runAsync: fetchMaintainerList } = useRequest(
		async ({ keyword, pageNum }: { keyword: string; pageNum: number }) =>
			fetchMaintainerOptions({
				keyword,
				pageNum,
				pageSize: MAINTAINER_PAGE_SIZE,
			}),
		{
			manual: true,
			debounceWait: 300,
			refreshDeps: [fetchMaintainerOptions],
		},
	);

	const mergeOptions = useCallback((prev: StrictOptionType[], next: StrictOptionType[]) => {
		const map = new Map<string, StrictOptionType>();
		for (const item of [...prev, ...next]) {
			if (item.value !== undefined && item.value !== null) {
				map.set(String(item.value), item);
			}
		}
		return Array.from(map.values());
	}, []);

	const loadOptions = useCallback(
		async ({
			keyword,
			pageNum = 1,
			append = false,
		}: {
			keyword?: string;
			pageNum?: number;
			append?: boolean;
		} = {}) => {
			const actualKeyword = keyword ?? keywordRef.current ?? "";
			if (keyword != null) {
				keywordRef.current = keyword;
			}

			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;
			try {
				const result = await fetchMaintainerList({
					keyword: actualKeyword,
					pageNum,
				});
				if (requestId !== requestIdRef.current) {
					return;
				}
				const list = result.list || [];
				setOptions((prev) => (append ? mergeOptions(prev, list) : list));

				const currentPageNum = result.pageNum ?? pageNum;
				const currentPageSize = result.pageSize ?? MAINTAINER_PAGE_SIZE;
				const total = result.total ?? list.length;

				setPageInfo({
					pageNum: currentPageNum,
					pageSize: currentPageSize,
					total,
				});
				setHasMore(currentPageNum * currentPageSize < total);
			} catch (error) {
				if (requestId !== requestIdRef.current) {
					return;
				}
				console.error("获取维护人列表失败:", error);
				setOptions([]);
				setHasMore(false);
				setPageInfo(DEFAULT_MAINTAINER_PAGE_INFO);
			}
		},
		[fetchMaintainerList, mergeOptions],
	);

	const handleSearch = useCallback(
		(searchValue: string) => {
			void loadOptions({ keyword: searchValue, pageNum: 1, append: false });
		},
		[loadOptions],
	);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				keywordRef.current = "";
				setOptions([]);
				setHasMore(false);
				setPageInfo(DEFAULT_MAINTAINER_PAGE_INFO);
				void loadOptions({ keyword: "", pageNum: 1, append: false });
			}
		},
		[loadOptions],
	);

	const handlePopupScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			if (!hasMore || loading) {
				return;
			}
			const target = e.target as HTMLDivElement;
			if (target.scrollHeight - target.scrollTop - target.clientHeight <= 8) {
				void loadOptions({
					pageNum: pageInfo.pageNum + 1,
					append: true,
				});
			}
		},
		[hasMore, loading, loadOptions, pageInfo.pageNum],
	);

	const notFoundContent = loading ? "加载中..." : hasMore ? "下滑加载更多" : "暂无数据";

	return useMemo(
		() => ({
			variant: "borderless",
			showSearch: true,
			allowClear: true,
			filterOption: false,
			options,
			loading,
			placeholder: "请选择维护人",
			notFoundContent,
			onSearch: handleSearch,
			onOpenChange: handleOpenChange,
			onPopupScroll: handlePopupScroll,
		}),
		[handleOpenChange, handlePopupScroll, handleSearch, loading, notFoundContent, options],
	);
}

/**
 * 获取档案管理表格列配置
 */
function getArchiveManagementColumns(
	handlers: ArchiveManagementColumnHandlers,
	searchOptions: ArchiveManagementSearchOptions,
	auditStatusValueMap: Map<string, { dictLabel?: string; listClass?: string | null }>,
	auditStatusOptions: Array<{ label: string; value: string }>,
): ProColumns<ArchiveManagementItem>[] {
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
						src={record.avatar}
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
			render: (text, record) => (
				<Tooltip title={record.orgFullName || text}>
					<Text ellipsis>{text}</Text>
				</Tooltip>
			),
		},
		{
			title: "岗位",
			dataIndex: "jobName",
			width: 120,
			key: "jobName",
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
			title: "维护标签",
			dataIndex: "manageTags",
			width: 180,
			key: "manageTags",
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "tagId",
			},
			fieldProps: {
				options: searchOptions.tagIdOptions,
				fieldNames: { label: "tagName", value: "tagId" },
				showSearch: true,
				allowClear: true,
				optionFilterProp: "tagName",
				variant: "borderless",
			},
			ellipsis: true,
			render: (_: any, record: ArchiveManagementItem) => {
				return <TagsCell tagsText={record.manageTags} separator="," />;
			},
		},
		{
			title: "待补充标签",
			dataIndex: "needTagTags",
			key: "needTagTags",
			width: 100,
			hideInSearch: true,
			// 接口文档返回的是字符串，显示数量
			render: (_: any, record: ArchiveManagementItem) => {
				const text = record.needTagTags;
				if (!text || typeof text !== "string") {
					return "0";
				}
				return String(text.split(",").filter((tag: string) => tag.trim()).length);
			},
		},
		{
			title: (_, type) => {
				// 搜索表单中的标题显示为"维护完善度(等级)≤"，表格中显示为"维护完善度"
				if (type === "form") {
					return "维护完善度(等级)≤";
				}
				return "维护完善度";
			},
			dataIndex: "perfectDegree",
			key: "perfectDegree",
			width: 140,
			hideInSearch: false,
			valueType: "digit",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "8.7rem" },
			},
			fieldProps: {
				variant: "borderless",
				min: 0,
				max: 100,
			},
			render: (_, record) => {
				return <PerfectDegreeCell value={record.perfectDegree || 0} />;
			},
		},
		{
			title: "维护人",
			dataIndex: "maintainerName",
			key: "maintainerName",
			width: 100,
			ellipsis: true,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				name: "maintainer",
			},
			fieldProps: {
				options: searchOptions.maintainerOptions.map((item) => ({
					...item,
					value: String(item.userId),
				})),
				fieldNames: { label: "userName", value: "value" },
				showSearch: true,
				allowClear: true,
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
			title: "档案审核状态",
			dataIndex: "status",
			key: "status",
			width: 140,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "6.7rem" },
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
			title: "操作",
			key: "action",
			valueType: "option",
			width: 230,
			fixed: "right",
			render: (_, record) => {
				// 直接创建操作按钮数组，避免不必要的计算
				const operations: Array<{
					key: string;
					label: string;
					onClick: () => void;
					onMouseEnter?: () => void;
				}> = [
					{
						key: "edit",
						label: "编辑档案",
						onClick: () => handlers.onEdit(record),
						onMouseEnter: () => handlers.onPrefetchEdit(record),
					},
					{
						key: "detail",
						label: "查看详情",
						onClick: () => handlers.onViewDetail(record),
						onMouseEnter: () => handlers.onPrefetchViewDetail(record),
					},
				];

				if (record.status !== "待维护") {
					operations.push({
						key: "process",
						label: "审核进程",
						onClick: () => handlers.onViewAuditProcess(record),
					});
				}

				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{operations.map((operation) => (
							<Link
								key={`${record.id}-${operation.key}`}
								onClick={operation.onClick}
								onMouseEnter={operation.onMouseEnter}
							>
								{operation.label}
							</Link>
						))}
					</Space>
				);
			},
		},
	];
}

/**
 * 人员档案 - 档案管理
 */
const ArchiveManagement: React.FC = () => {
	const actionRef = useRef<ActionType>();
	const formRef = useRef<ProFormInstance>();
	const archiveDetailDrawerRef = useRef<ArchiveDetailDrawerHostRef>(null);

	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [isAuditProcessModalOpen, setIsAuditProcessModalOpen] = useState(false);
	const [isNoDataTipModalOpen, setIsNoDataTipModalOpen] = useState(false);
	const [currentRecord, setCurrentRecord] = useState<ArchiveManagementItem | null>(null);

	const { jobOptions, postOptions, handleJobChange, resetLinkage } = useJobCascadeOptions({
		sceneKey: "archive-management",
		formRef,
		jobFieldName: "jobId",
		postFieldName: "postId",
	});

	// 获取审核节点列表数据（在父组件中请求，避免子组件闪动）
	const { data: approvalNodeList = [], loading: approvalNodeLoading } = useRequest(
		async () => {
			if (!currentRecord?.id) {
				return [];
			}
			const res = await fetchApprovalNodeList(currentRecord.id);
			return res ?? [];
		},
		{
			ready: isAuditProcessModalOpen && !!currentRecord?.id,
			refreshDeps: [isAuditProcessModalOpen, currentRecord?.id],
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
			cacheKey: "archive-management-organization-tree",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
		},
	);

	// 获取搜索选项数据（维护人、标签ID、员工选项等）
	const {
		data: { maintainerOptions = [], tagIdOptions = [] } = {},
		refresh: refreshSearchOptions,
	} = useRequest(
		async () => {
			const res = await getArchiveManagementSearchOptions();
			return res || {};
		},
		{
			cacheKey: "archive-management-search-options",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
			onError: (error) => {
				console.error("加载搜索选项数据失败:", error);
			},
		},
	);

	/** 页面顶部统计口径使用 TanStack Query 管理，便于切回缓存页时统一 refetch。 */
	const {
		data: {
			needTagUserCount: pendingEmployeeCount = 0,
			needTagCount: pendingTagCount = 0,
		} = {},
		refetch: refetchStats,
	} = useQuery({
		queryKey: ["archive-management-stats"],
		queryFn: fetchArchiveManagementStats,
	});

	/**
	 * 页面从其他标签页切回当前缓存页时，主动刷新列表、统计和搜索选项，
	 * 避免档案维护结果已变化但页面仍停留在旧口径。
	 *
	 * @returns void
	 * @author 王善能
	 * @since 2026-07-07
	 */
	useEffectOnActive(
		() => {
			actionRef.current?.reload();
			void refetchStats();
			refreshSearchOptions();
		},
		[],
		true,
	);

	/**
	 * 刷新档案管理页的列表、统计与搜索选项。
	 *
	 * 档案抽屉保存、导入等变更成功后，顶部统计、筛选下拉以及列表数据都可能发生变化，
	 * 因此统一通过此回调刷新当前页面口径。
	 *
	 * @author 王善能
	 * @since 2026-07-10
	 */
	const refreshPageData = useCallback(() => {
		actionRef.current?.reload();
		void refetchStats();
		refreshSearchOptions();
	}, [refetchStats, refreshSearchOptions]);

	// 处理搜索
	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const { current = 1, pageSize = 10, orgId, ...restParams } = params;

			// 处理联级选择器：如果 orgId 是数组，取最后一个值
			const finalOrgId = (() => {
				if (!orgId) return undefined;
				const idValue = Array.isArray(orgId) ? orgId.at(-1) : orgId;
				const id = Number(idValue);
				return Number.isNaN(id) ? undefined : id;
			})();

			const response = await fetchArchiveManagementList({
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
			});

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取档案管理列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	// 处理编辑档案
	const handleEdit = useCallback((record: ArchiveManagementItem) => {
		archiveDetailDrawerRef.current?.openEdit(record);
	}, []);

	// 处理查看详情（只读模式）
	const handleViewDetail = useCallback((record: ArchiveManagementItem) => {
		archiveDetailDrawerRef.current?.openReadonly(record);
	}, []);

	// 预取编辑档案详情，利用鼠标悬停到点击前的短时间提前发起请求
	const handlePrefetchEdit = useCallback((record: ArchiveManagementItem) => {
		archiveDetailDrawerRef.current?.prefetchEdit(record);
	}, []);

	// 预取查看详情数据，避免只读抽屉打开后才开始等待接口
	const handlePrefetchViewDetail = useCallback((record: ArchiveManagementItem) => {
		archiveDetailDrawerRef.current?.prefetchReadonly(record);
	}, []);

	// 处理刷新（刷新表格数据）
	const handleRefresh = useCallback(() => {
		refreshPageData();
	}, [refreshPageData]);

	// 处理查看审核进程（带预检查）
	const handleViewAuditProcess = useCallback(async (record: ArchiveManagementItem) => {
		setCurrentRecord(record);
		setIsAuditProcessModalOpen(true);

		try {
			// 预检查：先获取审核节点列表
			const approvalNodeList = await fetchApprovalNodeList(record.id);
			const validTags =
				approvalNodeList?.filter(
					(item) =>
						item.tagId != null &&
						item.tagName != null &&
						(item.nodeList?.length ?? 0) > 0,
				) ?? [];

			// 如果没有有效的审核数据，显示友好提示
			if (validTags.length === 0) {
				setIsAuditProcessModalOpen(false);
				setIsNoDataTipModalOpen(true);
			}
		} catch (error) {
			console.error("检查审核数据失败:", error);
			// 即使出错也打开弹窗，让弹窗内部处理错误状态
		}
	}, []);

	// 处理导入档案
	const handleImport = () => {
		setIsImportModalOpen(true);
	};

	// 处理导入成功
	const handleImportSuccess = () => {
		refreshPageData();
	};

	const fetchMaintainerOptionList = useCallback(
		(params: { keyword?: string; deptId?: string; pageNum: number; pageSize: number }) =>
			fetchMaintainerOptions({
				keyword: params.keyword,
				deptId: params.deptId,
				pageNum: params.pageNum,
				pageSize: params.pageSize,
			}),
		[fetchMaintainerOptions],
	);

	const maintainerFieldProps = useMaintainerSelectFieldProps({
		fetchMaintainerOptions: fetchMaintainerOptionList,
	});

	// 获取档案审核状态字典
	const { valueMap: auditStatusValueMap, options: auditStatusOptions } = useDict(
		"user_tag_approval_status",
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

	// 表格列配置
	const columns = getArchiveManagementColumns(
		{
			onPrefetchEdit: handlePrefetchEdit,
			onPrefetchViewDetail: handlePrefetchViewDetail,
			onEdit: handleEdit,
			onViewDetail: handleViewDetail,
			onViewAuditProcess: handleViewAuditProcess,
		},
		{
			organizationTreeData,
			jobOptions,
			postOptions,
			fetchMaintainerOptions: fetchMaintainerOptionList,
			maintainerFieldProps,
			maintainerOptions,
			tagIdOptions,
			onJobChange: handleJobChange,
		},
		auditStatusValueMap,
		auditStatusOptions || [],
	);

	// 列表视图
	return (
		<BasicContent className="flex h-full flex-col">
			{/* 提示横幅 - 放在表单最上方 */}
			{pendingEmployeeCount > 0 || pendingTagCount > 0 ? (
				<Alert
					message={
						<span>
							您还有
							<strong className="mx-1 text-[rgb(var(--oo-colorPrimary))]">
								{pendingEmployeeCount}
							</strong>
							位员工信息,
							<strong className="mx-1 text-[rgb(var(--oo-colorPrimary))]">
								{pendingTagCount}
							</strong>
							条标签待完善,请在下方表格及时处理
						</span>
					}
					type="info"
					showIcon
					closable
					className="mb-4"
				/>
			) : null}

			{/* 表格容器 */}
			<div className="flex-1">
				<BasicTable<ArchiveManagementItem>
					actionRef={actionRef}
					formRef={formRef}
					columns={columns}
					request={handleSearch}
					rowKey={(record) =>
						`${record.id}-${record.manageTags}-${record.needTagTags}-${record.updateTime}`
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
						// 自定义查询和重置按钮
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
					toolBarRender={() => [
						<BasicButton
							key="import"
							onClick={handleImport}
							icon={<UploadOutlined />}
							auth={PERSONNEL_ARCHIVE_PERMISSIONS.ARCHIVE_IMPORT}
						>
							导入档案
						</BasicButton>,
					]}
					options={{
						...TABLE_CONFIG.OPTIONS,
						setting: {
							settingIcon: <BasicButton>列表选项</BasicButton>,
						},
					}}
					pagination={TABLE_CONFIG.PAGINATION}
				/>
			</div>

			{/* 导入档案弹窗 */}
			<ImportArchiveModal
				open={isImportModalOpen}
				onCancel={() => {
					setIsImportModalOpen(false);
				}}
				onSuccess={handleImportSuccess}
				maintainerFieldProps={maintainerFieldProps}
			/>

			{/* 审核进程弹窗 */}
			<AuditProcessModal
				open={isAuditProcessModalOpen}
				approvalNodeList={approvalNodeList}
				loading={approvalNodeLoading}
				defaultTagId={defaultTagId}
				onClose={() => {
					setIsAuditProcessModalOpen(false);
					setCurrentRecord(null);
				}}
			/>

			{/* 无数据提示弹窗 */}
			<Modal
				title="提示"
				open={isNoDataTipModalOpen}
				onCancel={() => {
					setIsNoDataTipModalOpen(false);
					setCurrentRecord(null);
				}}
				onOk={() => {
					setIsNoDataTipModalOpen(false);
					setCurrentRecord(null);
				}}
				centered
				width={480}
				okText="我知道了"
				cancelText="关闭"
			>
				<div className="py-4">
					<Alert
						message={
							<div className="flex flex-col gap-2">
								<Typography.Text strong>该员工暂无审核进程数据</Typography.Text>
								<Typography.Text type="secondary" className="text-sm">
									{currentRecord?.status === "待维护"
										? "该员工档案状态为「待维护」，请先完善档案信息后再查看审核进程。"
										: "该员工暂无审核标签或审核流程尚未启动，请等待审核流程启动后再查看。"}
								</Typography.Text>
							</div>
						}
						type="info"
						showIcon
					/>
				</div>
			</Modal>

			{/* 档案详情抽屉常驻挂载，避免点击编辑/查看时才初始化复杂表单与标签树导致弹出延迟。 */}
			<ArchiveDetailDrawerHost ref={archiveDetailDrawerRef} onRefresh={handleRefresh} />
		</BasicContent>
	);
};

export default ArchiveManagement;
