/**
 * 人员档案面谈管理页面。
 */

import type { JobOptionItem, OrganizationTreeNode, PositionOptionItem } from "#src/api/common";
import type { InterviewItem } from "#src/api/personnel-archive/interview-management";
import type { StrictOptionType } from "#src/api/types/antd";
import type { UserInfoType } from "#src/api/user/types.js";
import type { BusinessTagTreeNode } from "#src/pages/tag-management/tag-matching/model/types";
import type { PagedData } from "#src/utils/axios-request";
import type { ActionType, ProColumns, ProFormInstance } from "@ant-design/pro-components";
import type { SelectProps } from "antd";

import type { AssignTaskData } from "./components/assign-modal";
import { fetchOrganizationTree } from "#src/api/common";
import { fetchMaintainerOptions } from "#src/api/personnel-archive/archive-management";
import {
	assignInterview,
	fetchInterviewList,
	fetchInterviewStats,
	getInterviewManagementSearchOptions,
} from "#src/api/personnel-archive/interview-management";
import {
	convertUserTagTreeToBusinessTagTree,
	fetchUserTagTree,
} from "#src/api/tag-management/tag-matching/model";
import AuditApprovedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import AuditPendingReviewStatusIcon from "#src/assets/svg/audit_pending_review_status.svg?react";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { useDict, useJobCascadeOptions } from "#src/hooks";
import { useUserStore } from "#src/store/user";
import { useRequest } from "ahooks";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Divider,
	message,
	Space,
	Statistic,
	Tooltip,
	Typography,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { useSearchParams } from "react-router";
import { TagsCell } from "../components/tags-cell";
import { CACHE_TIME, TABLE_CONFIG } from "../config";

import { AssignModal } from "./components/assign-modal";
import { InterviewDetailDrawer } from "./components/interview-detail-drawer";
import { InterviewRecordDrawer } from "./components/interview-record-drawer";

const { Text } = Typography;

/**
 * 类型守卫和验证工具
 */
const validators = {
	/**
	 * 验证面谈记录（用于开始面谈）
	 *
	 * @param record - 面谈记录
	 * @returns 是否为有效的面谈记录
	 */
	interview: (record: InterviewItem): record is InterviewItem & { id: number } => {
		if (!record.id) {
			message.error("数据错误：用户ID不能为空");
			return false;
		}
		return true;
	},

	/**
	 * 验证面谈记录（用于查看记录）
	 *
	 * @param record - 面谈记录
	 * @returns 是否为有效的面谈记录
	 */
	viewRecord: (
		record: InterviewItem,
	): record is InterviewItem & Required<Pick<InterviewItem, "interviewUserId" | "id">> => {
		if (!record.interviewUserId) {
			message.error("数据错误：面谈人ID不能为空");
			return false;
		}
		if (!record.id) {
			message.error("数据错误：用户ID不能为空");
			return false;
		}
		return true;
	},

	/**
	 * 验证记录（用于转派）
	 *
	 * @param record - 记录
	 * @returns 是否为有效的面谈记录
	 */
	assign: (record: InterviewItem): record is InterviewItem & { id: number } => {
		if (!record.id) {
			message.error("数据错误：记录ID不能为空，无法转派");
			return false;
		}
		return true;
	},

	/**
	 * 验证记录列表（用于批量转派）
	 *
	 * @param records - 记录列表
	 * @returns 是否为有效的记录列表
	 */
	batchAssign: (records: InterviewItem[]): records is InterviewItem[] => {
		if (records.length === 0) {
			message.warning("请先选择要转派的记录");
			return false;
		}
		const validRecords = records.filter((record) => record.id);
		if (validRecords.length === 0) {
			message.error("数据错误：所选记录无效，无法转派");
			return false;
		}
		return true;
	},
} as const;

/**
 * 表格列操作处理器接口
 */
interface InterviewColumnHandlers {
	/** 开始面谈回调 */
	onInterview: (record: InterviewItem) => void;
	/** 转派回调 */
	onAssign: (record: InterviewItem) => void;
	/** 查看记录回调 */
	onViewRecord: (record: InterviewItem) => void;
}

/**
 * 搜索选项数据接口
 */
interface InterviewSearchOptions {
	/** 岗位选项 */
	jobOptions: JobOptionItem[];
	/** 职位选项 */
	postOptions: PositionOptionItem[];
	/** 组织树数据 */
	organizationTreeData?: OrganizationTreeNode | null;
	/** 标签树数据 */
	tagTreeData: BusinessTagTreeNode[];
	/** 待面谈标签选项 */
	interviewTagIdOptions: Array<{ tagId: number; tagName: string }>;
	/** 已面谈标签选项 */
	interviewedTagIdOptions: Array<{ tagId: number; tagName: string }>;
	/** 面谈人选项 */
	interviewerOptions: Array<{ userId: number; userName: string }>;
	/** 转派面谈人选项 */
	assignInterviewerOptions: Array<{ userId: number; userName: string }>;
	/** 岗位变更处理器 */
	onJobChange: (jobIds: Array<string | number>) => void;
	/** 维护人字段属性 */
	maintainerFieldProps: SelectProps;
	/** 获取维护人选项函数 */
	fetchMaintainerOptions: (params: {
		keyword?: string;
		deptId?: string;
		pageNum: number;
		pageSize: number;
	}) => Promise<PagedData<StrictOptionType>>;
}

const MAINTAINER_PAGE_SIZE = 10;

/**
 * 维护人分页信息接口
 */
interface MaintainerPageInfo {
	/** 页码 */
	pageNum: number;
	/** 每页数量 */
	pageSize: number;
	/** 总数 */
	total: number;
}

const DEFAULT_MAINTAINER_PAGE_INFO: MaintainerPageInfo = {
	pageNum: 1,
	pageSize: MAINTAINER_PAGE_SIZE,
	total: 0,
};

const { Link } = Typography;

/**
 * 维护人选择字段参数接口
 */
interface MaintainerSelectFieldParams {
	/** 获取维护人选项函数 */
	fetchMaintainerOptions: InterviewSearchOptions["fetchMaintainerOptions"];
}

/**
 * 维护人远程搜索下拉框属性 Hook。
 *
 * @param params - 参数对象
 * @param params.fetchMaintainerOptions - 获取维护人选项函数
 * @returns 下拉框属性配置
 */
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
			if (item.value != null) {
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
				console.error("获取面谈人列表失败:", error);
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
			placeholder: "请选择转派面谈人",
			notFoundContent,
			onSearch: handleSearch,
			onOpenChange: handleOpenChange,
			onPopupScroll: handlePopupScroll,
		}),
		[handleOpenChange, handlePopupScroll, handleSearch, loading, notFoundContent, options],
	);
}

/**
 * 获取面谈管理表格列配置
 *
 * @param handlers - 操作处理器
 * @param searchOptions - 搜索选项数据
 * @param interviewStatusValueMap - 面谈状态值映射
 * @param interviewStatusOptions - 面谈状态选项
 * @param currentUserId - 当前登录用户ID
 * @returns 表格列配置
 */
function getInterviewColumns(
	handlers: InterviewColumnHandlers,
	searchOptions: InterviewSearchOptions,
	interviewStatusValueMap: Map<string, { dictLabel?: string; listClass?: string | null }>,
	interviewStatusOptions: Array<{ label: string; value: string }>,
	currentUserId: string,
	userInfo: UserInfoType,
): ProColumns<InterviewItem>[] {
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
			valueType: "treeSelect",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "orgId",
			},
			fieldProps: {
				treeData: searchOptions.organizationTreeData
					? [searchOptions.organizationTreeData]
					: [],
				fieldNames: { label: "name", value: "id", children: "children" },
				treeNodeFilterProp: "name",
				showSearch: true,
				allowClear: true,
				variant: "borderless",
				styles: {
					popup: {
						root: { minWidth: "26rem" },
					},
				},
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
			title: "待面谈标签",
			dataIndex: "interviewTags",
			key: "interviewTags",
			width: 180,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "6rem" },
				name: "interviewTagId",
			},
			fieldProps: {
				options: searchOptions.interviewTagIdOptions,
				fieldNames: { label: "tagName", value: "tagId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "tagName",
				variant: "borderless",
			},
			render: (_: any, record: InterviewItem) => {
				return <TagsCell tagsText={record.interviewTags} separator="," />;
			},
		},
		{
			title: "已面谈标签",
			dataIndex: "interviewedTags",
			key: "interviewedTags",
			width: 180,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				labelCol: { flex: "6rem" },
				name: "interviewedTagId",
			},
			fieldProps: {
				options: searchOptions.interviewedTagIdOptions,
				fieldNames: { label: "tagName", value: "tagId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "tagName",
				variant: "borderless",
			},
			render: (_: any, record: InterviewItem) => {
				return <TagsCell tagsText={record.interviewedTags} separator="," />;
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
			},
			fieldProps: {
				options: interviewStatusOptions || [],
				variant: "borderless",
			},
			render: (_, record) => {
				const dictItem = interviewStatusValueMap.get(record.status);
				const status = dictItem?.listClass as
					| "default"
					| "success"
					| "processing"
					| "error"
					| "warning"
					| undefined;
				return (
					<Badge
						status={status}
						text={record.statusName || dictItem?.dictLabel || record.status}
					/>
				);
			},
		},
		{
			title: "面谈人",
			dataIndex: "interviewUserName",
			key: "interviewUserName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "interviewer",
			},
			fieldProps: {
				options: searchOptions.interviewerOptions,
				fieldNames: { label: "userName", value: "userId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				variant: "borderless",
			},
		},
		{
			title: "转派面谈人",
			dataIndex: "assignInterviewUserName",
			key: "assignInterviewUserName",
			width: 100,
			hideInSearch: false,
			valueType: "select",
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6]",
				name: "assignInterviewer",
				labelCol: { flex: "5.8rem" },
			},
			fieldProps: {
				options: searchOptions.assignInterviewerOptions,
				fieldNames: { label: "userName", value: "userId" },
				allowClear: true,
				showSearch: true,
				optionFilterProp: "userName",
				variant: "borderless",
			},
			// assignInterviewUserName | assignInterviewUserId 有值时，显示其中一个
			render: (_: any, record: InterviewItem) => {
				if (record.assignInterviewUserName) {
					return record.assignInterviewUserName;
				}
				if (record.assignInterviewUserId) {
					return record.assignInterviewUserId;
				}
				return "-";
			},
		},
		{
			title: "最新触发面谈时间",
			dataIndex: "updateTime",
			key: "updateTime",
			width: 160,
			valueType: "dateTime",
			hideInSearch: true,
		},
		{
			title: "完成面谈时间",
			dataIndex: "endTime",
			key: "endTime",
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
				const isInterviewed = record.status === "1";

				// 构建操作配置数组
				const operations: Array<{ key: string; label: string; onClick: () => void }> = [];

				/**
				 * 开始面谈显示条件
				 *
				 * 1. 前提条件：未面谈
				 * 2. 条件1：admin 忽略其他规则
				 * 3. 条件2：判断是否分配给当前用户：转派ID为空时判断面谈人ID，转派ID不为空时判断转派面谈人ID
				 */

				// 判断是否为超管
				const isAdmin = userInfo.roles.includes("admin");
				// 判断是否分配给当前用户：转派ID为空时判断面谈人ID，转派ID不为空时判断转派面谈人ID
				const isAssignedToCurrentUser = record.assignInterviewUserId
					? record.assignInterviewUserId === currentUserId
					: record.interviewUserId === currentUserId;
				// 开始面谈条件：未面谈 && (超管 || 分配给当前用户)
				const canStartInterview = !isInterviewed && (isAdmin || isAssignedToCurrentUser);

				/**
				 * 转派显示条件
				 *
				 * 1. 未面谈
				 * 2. 转派面谈人ID为空
				 */
				const canShowAssign = !isInterviewed && !record.assignInterviewUserId;

				// 开始面谈按钮
				if (canStartInterview) {
					operations.push({
						key: "interview",
						label: "开始面谈",
						onClick: () => handlers.onInterview(record),
					});
				}

				// 转派按钮
				if (canShowAssign) {
					operations.push({
						key: "assign",
						label: "转派",
						onClick: () => handlers.onAssign(record),
					});
				}

				operations.push({
					key: "record",
					label: "面谈记录",
					onClick: () => handlers.onViewRecord(record),
				});

				return (
					<Space size={0} split={<Divider type="vertical" />}>
						{operations.map((operation) => (
							<Link
								key={`${record.id}-${operation.key}`}
								onClick={(e) => {
									e.stopPropagation();
									operation.onClick();
								}}
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
 * URL 操作类型枚举
 */
enum UrlActionType {
	/** 开始面谈 */
	START = "start",
	/** 查看面谈记录 */
	RECORD = "record",
}

/**
 * URL 参数类型
 */
interface UrlActionParams {
	/** 操作类型 */
	action: UrlActionType;
	/** 被面谈用户ID */
	userId: number;
	/** 面谈人ID（可选） */
	interviewUserId?: number;
	/** 转派面谈人ID（可选） */
	assignInterviewUserId?: number;
}

/**
 * 解析 URL 参数
 *
 * @param searchParams - URL 查询参数
 * @returns 解析后的参数对象
 */
function parseUrlActionParams(searchParams: URLSearchParams): UrlActionParams {
	const action = searchParams.get("action") as UrlActionType;
	const userIdStr = searchParams.get("userId");
	const interviewUserIdStr = searchParams.get("interviewUserId");
	const assignInterviewUserIdStr = searchParams.get("assignInterviewUserId");

	return {
		action,
		userId: Number(userIdStr),
		interviewUserId: interviewUserIdStr ? Number(interviewUserIdStr) : undefined,
		assignInterviewUserId: assignInterviewUserIdStr
			? Number(assignInterviewUserIdStr)
			: undefined,
	};
}

/**
 * 人员档案 - 面谈管理
 */
const InterviewManagement: React.FC = () => {
	const actionRef = useRef<ActionType>();
	const formRef = useRef<ProFormInstance>();
	const [searchParams, setSearchParams] = useSearchParams();

	const { jobOptions, postOptions, handleJobChange, resetLinkage } = useJobCascadeOptions({
		sceneKey: "interview-management",
		formRef,
		jobFieldName: "jobId",
		postFieldName: "postId",
	});

	// 获取用户信息
	const { getUserInfo, ...userInfo } = useUserStore();

	// 标签树选项数据
	const [tagTreeData, setTagTreeData] = useState<BusinessTagTreeNode[]>([]);

	// 抽屉和弹窗状态
	const [isInterviewDrawerOpen, setIsInterviewDrawerOpen] = useState(false);
	const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
	const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
	const [currentRecord, setCurrentRecord] = useState<InterviewItem | null>(null);
	const [selectedRecords, setSelectedRecords] = useState<InterviewItem[]>([]);

	// 表格勾选状态
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [selectedRows, setSelectedRows] = useState<InterviewItem[]>([]);

	// 获取组织树数据（带缓存）
	const { data: organizationTreeData } = useRequest(
		async () => {
			const result = await fetchOrganizationTree();
			return result ?? null;
		},
		{
			cacheKey: "interview-management-organization-tree",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
		},
	);

	// 获取标签树数据（tagType=1）
	useRequest(
		async () => {
			const result = await fetchUserTagTree("1");
			return convertUserTagTreeToBusinessTagTree(result ?? []);
		},
		{
			onSuccess: (treeNodes) => {
				setTagTreeData(treeNodes);
			},
			onError: (error) => {
				console.error("获取标签选项失败:", error);
				setTagTreeData([]);
			},
		},
	);

	// 获取搜索选项数据（带缓存）
	const {
		data: {
			interviewTagIdOptions = [],
			interviewedTagIdOptions = [],
			interviewerOptions = [],
			assignInterviewerOptions = [],
		} = {},
	} = useRequest(
		async () => {
			const res = await getInterviewManagementSearchOptions();
			return res || {};
		},
		{
			cacheKey: "interview-management-search-options",
			cacheTime: CACHE_TIME.ORGANIZATION_TREE,
			staleTime: CACHE_TIME.ORGANIZATION_TREE,
			onError: (error) => {
				console.error("加载选项数据失败:", error);
			},
		},
	);

	// 加载统计数据（使用 useRequest 管理加载状态和数据）
	const {
		data: { interviewNum = 0, interviewedNum = 0, monthInterviewedNum = 0 } = {},
		loading: statsLoading,
		refresh: refreshStats,
	} = useRequest(async () => await fetchInterviewStats());

	/**
	 * 处理 URL 参数跳转
	 * URL 格式：/personnel-archive/interview-management?action=start&userId=xxx
	 * 可选参数：interviewUserId, assignInterviewUserId
	 *
	 * 支持的操作类型：
	 * - start: 开始面谈，打开 InterviewDetailDrawer
	 * - record: 查看面谈记录，打开 InterviewRecordDrawer
	 */
	useEffect(() => {
		const actionStr = searchParams.get("action");
		const userIdStr = searchParams.get("userId");

		// 验证必要参数：必须有 action 和 userId
		if (!actionStr || !userIdStr) {
			return;
		}

		const urlParams = parseUrlActionParams(searchParams);

		// 验证 userId 是否为有效数字
		if (Number.isNaN(urlParams.userId)) {
			return;
		}

		// 构造记录数据用于打开抽屉
		const recordFromUrl: InterviewItem = {
			id: urlParams.userId,
			interviewUserId: urlParams.interviewUserId
				? String(urlParams.interviewUserId)
				: undefined,
			assignInterviewUserId: urlParams.assignInterviewUserId
				? String(urlParams.assignInterviewUserId)
				: undefined,
		} as InterviewItem;

		setCurrentRecord(recordFromUrl);

		// 根据操作类型打开对应的抽屉
		switch (urlParams.action) {
			case UrlActionType.START:
				setIsInterviewDrawerOpen(true);
				break;
			case UrlActionType.RECORD:
				setIsRecordDrawerOpen(true);
				break;
		}

		// 清除 URL 参数，避免刷新页面重复打开
		setSearchParams({}, { replace: true });
	}, [searchParams, setSearchParams]);

	/**
	 * 处理搜索
	 *
	 * @param params - 搜索参数
	 * @returns 搜索结果
	 */
	const handleSearch = async (params: any) => {
		try {
			// 解构搜索参数
			const { current = 1, pageSize = 10, orgId, ...restParams } = params;

			// 处理树形选择器：如果 orgId 是字符串，转换为数字
			const finalOrgId = (() => {
				if (!orgId) return undefined;
				const id = Number(orgId);
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

			const response = await fetchInterviewList(searchParams);

			return {
				data: response.list || [],
				success: true,
				total: response.total || 0,
			};
		} catch (error) {
			console.error("获取面谈列表失败:", error);
			return {
				data: [],
				success: false,
				total: 0,
			};
		}
	};

	/**
	 * 处理面谈
	 *
	 * @param record - 面谈记录
	 */
	const handleInterview = useCallback((record: InterviewItem) => {
		if (!validators.interview(record)) {
			return;
		}
		setCurrentRecord(record);
		setIsInterviewDrawerOpen(true);
	}, []);

	/**
	 * 处理批量转派
	 */
	const handleBatchAction = useCallback(() => {
		if (!validators.batchAssign(selectedRows)) {
			return;
		}
		setSelectedRecords(selectedRows.filter((record) => record.id));
		setIsAssignModalOpen(true);
	}, [selectedRows]);

	/**
	 * 处理转派（单条）
	 *
	 * @param record - 面谈记录
	 */
	const handleAssign = useCallback((record: InterviewItem) => {
		if (!validators.assign(record)) {
			return;
		}
		setSelectedRecords([record]);
		setIsAssignModalOpen(true);
	}, []);

	/**
	 * 处理确认转派
	 *
	 * @param data - 转派数据（按任务分组）
	 */
	const handleConfirmAssign = async (data: AssignTaskData[]) => {
		if (data.length === 0) {
			message.warning("没有可转派的记录");
			return;
		}

		try {
			// 按任务分组构建接口参数，每个任务对应一条转派记录（不合并）
			const paramsList: Array<{
				userId: number;
				interviewUserId: number;
				assignInterviewUserId: number;
				tagIds: number[];
			}> = [];

			data.forEach((taskData) => {
				taskData.recordIds.forEach((recordId) => {
					const record = selectedRecords.find((r) => r.id === recordId);
					if (!record) {
						console.error("找不到对应的记录:", recordId);
						return;
					}

					paramsList.push({
						userId: recordId,
						interviewUserId: Number(record.interviewUserId),
						assignInterviewUserId: taskData.personnelId,
						tagIds: [...taskData.tagIds],
					});
				});
			});

			await assignInterview(paramsList);
			message.success(`成功转派${data.length}个任务`);
			setIsAssignModalOpen(false);
			setCurrentRecord(null);
			setSelectedRecords([]);
			setSelectedRowKeys([]);
			setSelectedRows([]);
			actionRef.current?.reload();
			// 重新加载统计数据
			refreshStats();
		} catch (error) {
			console.error("转派失败:", error);
			message.error("转派失败，请重试");
		}
	};

	/**
	 * 处理查看记录
	 *
	 * @param record - 面谈记录
	 */
	const handleViewRecord = useCallback((record: InterviewItem) => {
		if (!validators.viewRecord(record)) {
			return;
		}
		setCurrentRecord(record);
		setIsRecordDrawerOpen(true);
	}, []);

	/**
	 * 处理关闭面谈抽屉
	 *
	 * @param shouldRefresh - 是否刷新表格和统计数据
	 */
	const handleCloseInterviewDrawer = useCallback((shouldRefresh?: boolean) => {
		setIsInterviewDrawerOpen(false);
		setCurrentRecord(null);
		// 只有提交成功时才刷新
		if (shouldRefresh) {
			actionRef.current?.reload();
			// 重新加载统计数据
			refreshStats();
		}
	}, []);

	/**
	 * 处理关闭转派弹窗
	 */
	const handleCloseAssignModal = useCallback(() => {
		setIsAssignModalOpen(false);
		setCurrentRecord(null);
		setSelectedRecords([]);
	}, []);

	/**
	 * 处理关闭记录抽屉
	 */
	const handleCloseRecordDrawer = useCallback(() => {
		setIsRecordDrawerOpen(false);
		setCurrentRecord(null);
	}, []);

	const fetchMaintainerOptionList = useCallback(
		(params: { keyword?: string; deptId?: string; pageNum: number; pageSize: number }) =>
			fetchMaintainerOptions({
				keyword: params.keyword,
				deptId: params.deptId,
				pageNum: params.pageNum,
				pageSize: params.pageSize,
			}),
		[],
	);

	const maintainerFieldProps = useMaintainerSelectFieldProps({
		fetchMaintainerOptions: fetchMaintainerOptionList,
	});

	// 获取面谈状态字典
	const { valueMap: interviewStatusValueMap, options: interviewStatusOptions } =
		useDict("user_interview_status");

	/**
	 * 处理重置表单
	 *
	 * @param searchConfig - 搜索配置，包含表单实例
	 */
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
	const columns = getInterviewColumns(
		{
			onInterview: handleInterview,
			onAssign: handleAssign,
			onViewRecord: handleViewRecord,
		},
		{
			organizationTreeData: organizationTreeData ?? null,
			jobOptions,
			postOptions,
			tagTreeData,
			interviewTagIdOptions,
			interviewedTagIdOptions,
			interviewerOptions,
			assignInterviewerOptions,
			fetchMaintainerOptions: fetchMaintainerOptionList,
			maintainerFieldProps,
			onJobChange: handleJobChange,
		},
		interviewStatusValueMap,
		interviewStatusOptions || [],
		userInfo.id,
		userInfo,
	);

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 统计卡片 */}
			<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{[
					{
						title: "待我面谈员工",
						value: interviewNum,
						icon: <AuditPendingReviewStatusIcon className="h-7 w-7" />,
						color: "#FF7D00",
						bgColor: "#F5F7FA",
						description: "请及时处理",
						showTrend: false,
						trendValue: 0,
					},
					{
						title: "已面谈员工",
						value: interviewedNum,
						icon: <AuditApprovedStatusIcon className="h-7 w-7" />,
						color: "#14B968",
						bgColor: "#F5F7FA",
						description: "面谈完成",
						showTrend: true,
						trendValue: monthInterviewedNum,
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
						loading={statsLoading}
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
				<BasicTable<InterviewItem>
					actionRef={actionRef}
					formRef={formRef}
					columns={columns}
					request={handleSearch}
					rowKey={(record) =>
						`${record.id}-${record.interviewTags}-${record.interviewedTags}-${record.updateTime}`
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
					headerTitle={
						<Button onClick={handleBatchAction} disabled={selectedRowKeys.length === 0}>
							批量转派
						</Button>
					}
					rowSelection={{
						selectedRowKeys,
						onChange: (keys, rows) => {
							setSelectedRowKeys(keys);
							setSelectedRows(rows);
						},
						getCheckboxProps: (record) => {
							// 判断是否为已面谈状态
							const isInterviewed = record.status === "1";
							// 判断是否可以转派：assignInterviewUserId 为空时才能转派
							const canAssign = !record.assignInterviewUserId;
							// 没有转派按钮的行（已面谈或已转派）不能选中
							const hasAssignButton = !isInterviewed && canAssign;
							return {
								disabled: !hasAssignButton,
							};
						},
					}}
					options={{
						...TABLE_CONFIG.OPTIONS,
						setting: {
							settingIcon: <BasicButton>列表选项</BasicButton>,
						},
					}}
					pagination={TABLE_CONFIG.PAGINATION}
				/>
			</div>

			{/* 面谈抽屉 */}
			{currentRecord?.id && (
				<InterviewDetailDrawer
					open={isInterviewDrawerOpen}
					userId={currentRecord.id}
					interviewUserId={currentRecord.interviewUserId}
					assignInterviewUserId={currentRecord.assignInterviewUserId}
					onClose={handleCloseInterviewDrawer}
				/>
			)}

			{/* 转派弹窗 */}
			{selectedRecords.length > 0 && (
				<AssignModal
					open={isAssignModalOpen}
					onClose={handleCloseAssignModal}
					onConfirm={handleConfirmAssign}
					records={selectedRecords}
					title={`转派${selectedRecords.length > 1 ? `（${selectedRecords.length}条）` : ""}`}
					organizationTreeData={organizationTreeData}
				/>
			)}

			{/* 面谈记录抽屉 */}
			{currentRecord?.interviewUserId &&
				currentRecord?.id &&
				(() => {
					const record = currentRecord;
					return (
						<InterviewRecordDrawer
							open={isRecordDrawerOpen}
							interviewId={record.interviewId}
							interviewUserId={record.interviewUserId}
							assignInterviewUserId={record.assignInterviewUserId}
							userId={record.id}
							onClose={handleCloseRecordDrawer}
						/>
					);
				})()}
		</BasicContent>
	);
};

export default InterviewManagement;
