import type {
	AppraisalFolder,
	AppraisalStatus,
	AppraisalUser,
	AppraisalUserFilter,
	AppraisalUserQuery,
} from "#src/api/performance-management/yearly-performance";
import type { CollisionDetection, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { BatchAction } from "./components/batch-actions";
import type { PersonCardAction } from "./components/person-card";
import type { PresentationHandlers } from "./detail/detail-panel";
import type { FolderModalState, ReportFilterValues } from "./types";

import { BasicContent } from "#src/components";
import { cn } from "#src/utils";
import { ExclamationCircleFilled } from "@ant-design/icons";
import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useDebounce, useSize } from "ahooks";
import { App, Button, ConfigProvider, Pagination } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BatchActions } from "./components/batch-actions";
import { CardBoard } from "./components/card-board";
import { FOLDER_DROP_PREFIX, FOLDER_ROW_ATTR, FolderPanel } from "./components/folder-panel";
import { PanelDetailIcon } from "./components/icons";
import { OrgTreePanel } from "./components/org-tree-panel";
import { OverviewSection } from "./components/overview-section";
import { PersonAvatar } from "./components/person-avatar";
import { SidePanel } from "./components/side-panel";
import { StatusTag } from "./components/status-tag";
import {
	COMPACT_MAIN_WIDTH,
	DEFAULT_PAGE_SIZE,
	DetailStep,
	FOLDER_ALL,
	FOLDER_CREATED_TOAST_SECONDS,
	PRIMARY_COLOR,
	SIDE_PANEL_DEFAULT_WIDTH,
} from "./constants";
import { DetailPanel } from "./detail/detail-panel";
import {
	useAppraisalFolders,
	useAppraisalMutations,
	useAppraisalOrgTree,
	useAppraisalStatistics,
	useAppraisalUserPage,
	useBatchReportDownload,
} from "./hooks/use-yearly-report-queries";
import styles from "./index.module.css";
import { BatchMoveModal } from "./modals/batch-move-modal";
import { FolderFormModal } from "./modals/folder-form-modal";
import {
	buildOrgCascaderOptions,
	findCascaderLabels,
	isRealFolder,
	toApiDateTime,
	toOrgCascaderPath,
	toUserFilter,
} from "./utils";

/** 详情面板状态 */
interface DetailState {
	/** 是否展开 */
	open: boolean;
	/** 是否全屏 */
	fullscreen: boolean;
	/** 打开时默认查看的步骤 */
	initialStep?: DetailStep;
}

/** 待定位的文件夹（新增成功提示中点击文件夹名称） */
interface LocateTarget {
	/** 所属组织 */
	orgCode?: string;
	/** 文件夹 ID（新增接口未返回时为空，按名称回查） */
	folderId?: string;
	/** 文件夹名称 */
	name: string;
}

/** 页面局部主题：与设计稿配色对齐，不跟随全局主题色 */
const PAGE_THEME = {
	token: {
		colorPrimary: PRIMARY_COLOR,
		colorText: "#323233",
		colorTextPlaceholder: "#C0C4CC",
		colorBorder: "#DCDFE6",
		borderRadius: 4,
	},
	components: {
		Button: { primaryShadow: "none", defaultShadow: "none", dangerShadow: "none" },
		Pagination: { itemActiveBg: "#FFFFFF" },
	},
};

/**
 * 分页局部主题
 *
 * 全局主题开启了 wireframe（app.tsx），分页会带上 bordered 样式（上一页 / 下一页带描边）；
 * 设计稿为无描边箭头，仅对分页关闭 wireframe，避免影响弹窗等组件的分隔线。
 */
const PAGINATION_THEME = { token: { wireframe: false } };

/** 设计稿按钮文案「查询」「全选」中间无空格，关闭 antd 双汉字自动补空格 */
const PAGE_BUTTON_CONFIG = { autoInsertSpace: false };

/**
 * 分页每页条数选项：设计稿文案为「20条/页」
 *
 * rc-pagination 固定以「数字 + 空格 + 文案」拼接且不透传 buildOptionText，
 * 这里通过 showSizeChanger 的 Select 配置整体覆盖 options。
 */
const PAGE_SIZE_CHANGER = {
	options: [20, 50, 100].map((value) => ({ value, label: `${value}条/页` })),
};

/** 防重复录制提示弹窗图标（设计稿 02 / 22：橙色感叹号） */
const WARNING_ICON = <ExclamationCircleFilled style={{ color: "#FF7D00" }} />;

/**
 * 确认弹窗按钮：modal.confirm 渲染在页面 ConfigProvider 之外，
 * 需逐个关闭双汉字自动补空格，保持「取消」「确认」与设计稿一致
 */
const CONFIRM_BUTTON_PROPS = {
	okButtonProps: { autoInsertSpace: false },
	cancelButtonProps: { autoInsertSpace: false },
};

/**
 * 文件夹拖放优先：指针落在文件夹上时只命中文件夹；否则在卡片之间按中心距离排序
 *
 * @param args - dnd-kit 碰撞检测参数
 * @returns 命中结果
 */
const collisionDetection: CollisionDetection = (args) => {
	const folderHit = pointerWithin(args).find((collision) =>
		String(collision.id).startsWith(FOLDER_DROP_PREFIX),
	);
	if (folderHit) {
		return [folderHit];
	}
	return closestCenter({
		...args,
		droppableContainers: args.droppableContainers.filter(
			(container) => !String(container.id).startsWith(FOLDER_DROP_PREFIX),
		),
	});
};

/**
 * 统计人数求和
 *
 * @param statistics - 各状态人数
 * @returns 总人数，未加载时为 undefined
 */
function sumStatistics(statistics?: Record<AppraisalStatus, number>) {
	return statistics
		? Object.values(statistics).reduce((sum, count) => sum + count, 0)
		: undefined;
}

/**
 * 绩效管理 · 年终述职（左侧菜单「述职管理」，页签「年终述职」）
 *
 * 页面结构：左侧「组织架构 + 文件夹」面板（可收起、可拖拽宽度）→ 主区域（概览与筛选、批量操作、人员卡片、分页）
 * → 右侧述职详情（三步流程，可全屏）。
 *
 * 交互要点：
 * - 数据卡片与「述职状态」筛选联动，再次点击取消；
 * - 点击卡片 / 姓名展开详情，展开时自动收起左侧面板，给卡片区让出宽度；
 * - 卡片可拖到文件夹归档（拖拽已勾选卡片时整批移动）；具体文件夹内可拖拽或输入序号调整述职顺序；
 * - 开始述职需人员已归入文件夹（述职会）；防重复录制由后端校验，前端以确认弹窗展示后端文案。
 *
 * 接口见 src/api/performance-management/yearly-performance，对接说明见 docs/swagger/yearly-performance-api.md。
 *
 * @returns 年终述职页面
 *
 * @since 2026-11-16
 */
export default function YearlyPerformancePage() {
	const { message, modal } = App.useApp();

	/* ------------------------------ 页面状态 ------------------------------ */
	const [orgCode, setOrgCode] = useState<string>();
	const [folderId, setFolderId] = useState(FOLDER_ALL);
	const [folderKeyword, setFolderKeyword] = useState("");
	const debouncedFolderKeyword = useDebounce(folderKeyword, { wait: 300 });
	const [filterDraft, setFilterDraft] = useState<ReportFilterValues>({});
	const [appliedFilter, setAppliedFilter] = useState<ReportFilterValues>({});
	const [pagination, setPagination] = useState({ pageNum: 1, pageSize: DEFAULT_PAGE_SIZE });
	const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
	const [activeUser, setActiveUser] = useState<AppraisalUser>();
	const [detail, setDetail] = useState<DetailState>({ open: false, fullscreen: false });
	const [panelCollapsed, setPanelCollapsed] = useState(false);
	const [panelWidth, setPanelWidth] = useState(SIDE_PANEL_DEFAULT_WIDTH);
	const [overviewCollapsed, setOverviewCollapsed] = useState(false);
	const [folderModal, setFolderModal] = useState<FolderModalState>(null);
	const [localOrder, setLocalOrder] = useState<string[] | null>(null);
	const [draggingUser, setDraggingUser] = useState<AppraisalUser>();
	const [locateTarget, setLocateTarget] = useState<LocateTarget>();

	const mainRef = useRef<HTMLDivElement>(null);
	const mainSize = useSize(mainRef);
	const compact = Boolean(mainSize?.width && mainSize.width < COMPACT_MAIN_WIDTH);

	/* ------------------------------ 数据查询 ------------------------------ */
	const orgTreeQuery = useAppraisalOrgTree();
	const orgNodes = useMemo(() => orgTreeQuery.data ?? [], [orgTreeQuery.data]);
	const orgCascaderOptions = useMemo(() => buildOrgCascaderOptions(orgNodes), [orgNodes]);
	// 默认选中根组织（当前用户可见的全部范围）
	const effectiveOrgCode = orgCode ?? orgNodes[0]?.code;
	// 选中根组织等同于「全部可见范围」：不传组织条件，避免根节点无权限时被后端过滤为空
	const scopeOrgCode = orgNodes.some((node) => node.code === effectiveOrgCode)
		? undefined
		: effectiveOrgCode;
	const sortable = isRealFolder(folderId);

	// 组织树加载前 scopeOrgCode 同样为空（等同根组织），查询无需等待组织树
	const foldersQuery = useAppraisalFolders({
		belongToOrgCode: scopeOrgCode,
		name: debouncedFolderKeyword.trim() || undefined,
	});
	const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);

	const baseFilter = useMemo<AppraisalUserFilter>(
		() => toUserFilter({ orgCode: scopeOrgCode, folderId, filter: appliedFilter }),
		[scopeOrgCode, folderId, appliedFilter],
	);
	const listQuery = useMemo<AppraisalUserQuery>(
		() => ({ ...baseFilter, appraisalStatus: appliedFilter.appraisalStatus, ...pagination }),
		[baseFilter, appliedFilter.appraisalStatus, pagination],
	);
	const statisticsQuery = useAppraisalStatistics(baseFilter);
	// 「全部」人数：当前组织范围、不带文件夹与筛选；与概览统计条件相同时共用同一请求
	const scopeStatisticsQuery = useAppraisalStatistics(
		toUserFilter({ orgCode: scopeOrgCode, folderId: FOLDER_ALL, filter: {} }),
	);
	// 「组织架构 · 总人数」：当前用户可见的全部范围
	const totalStatisticsQuery = useAppraisalStatistics(
		toUserFilter({ folderId: FOLDER_ALL, filter: {} }),
	);
	const listResult = useAppraisalUserPage(listQuery);
	const mutations = useAppraisalMutations();
	const batchDownload = useBatchReportDownload();

	const serverUsers = useMemo(() => listResult.data?.list ?? [], [listResult.data]);
	// 拖拽排序后先按本地顺序展示，接口刷新后以服务端顺序为准
	const users = useMemo(() => {
		if (!localOrder || localOrder.length !== serverUsers.length) {
			return serverUsers;
		}
		const byId = new Map(serverUsers.map((user) => [user.userId, user]));
		const ordered = localOrder.map((id) => byId.get(id));
		return ordered.every(Boolean) ? (ordered as AppraisalUser[]) : serverUsers;
	}, [localOrder, serverUsers]);

	useEffect(() => {
		setLocalOrder(null);
	}, [listResult.data]);

	// 列表刷新后同步详情头部数据（状态流转、重排序号）
	useEffect(() => {
		if (!activeUser) {
			return;
		}
		const latest = serverUsers.find((user) => user.userId === activeUser.userId);
		if (latest && latest !== activeUser) {
			// 状态流转后（如结束述职）详情回到新状态的当前步骤，不再沿用打开时指定的步骤
			if (latest.appraisalStatus !== activeUser.appraisalStatus) {
				setDetail((prev) => ({ ...prev, initialStep: undefined }));
			}
			setActiveUser(latest);
		}
	}, [serverUsers, activeUser]);

	// 全屏时 Esc 退出全屏
	useEffect(() => {
		if (!detail.fullscreen) {
			return undefined;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setDetail((prev) => ({ ...prev, fullscreen: false }));
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [detail.fullscreen]);

	// 新增文件夹后「定位至该文件夹」：文件夹列表刷新后选中并滚动到可视区
	useEffect(() => {
		// 等待清空后的搜索关键字（防抖）生效、文件夹列表按新组织刷新完成
		if (!locateTarget || foldersQuery.isFetching || debouncedFolderKeyword !== folderKeyword) {
			return;
		}
		const target = folders.find((folder) =>
			locateTarget.folderId
				? folder.id === locateTarget.folderId
				: folder.name === locateTarget.name,
		);
		setLocateTarget(undefined);
		if (!target) {
			return;
		}
		setFolderId(target.id);
		setPagination((prev) => ({ ...prev, pageNum: 1 }));
		setCheckedIds(new Set());
		requestAnimationFrame(() => {
			document
				.querySelector(`[${FOLDER_ROW_ATTR}="${CSS.escape(target.id)}"]`)
				?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		});
	}, [locateTarget, folders, foldersQuery.isFetching, debouncedFolderKeyword, folderKeyword]);

	/** 当前选中组织对应的「所属组织」级联路径（新增文件夹 / 批量移动默认回显） */
	const defaultOrgPath = useMemo(
		() => toOrgCascaderPath(orgNodes, effectiveOrgCode),
		[orgNodes, effectiveOrgCode],
	);

	/* ------------------------------ 交互处理 ------------------------------ */
	const resetPaging = useCallback(() => {
		setPagination((prev) => ({ ...prev, pageNum: 1 }));
		setCheckedIds(new Set());
	}, []);

	const handleOrgSelect = (nextOrgCode: string) => {
		setOrgCode(nextOrgCode);
		setFolderId(FOLDER_ALL);
		resetPaging();
	};

	const handleFolderSelect = (nextFolderId: string) => {
		setFolderId(nextFolderId);
		resetPaging();
	};

	const handleStatusCardClick = (status: AppraisalStatus) => {
		const next = appliedFilter.appraisalStatus === status ? undefined : status;
		setFilterDraft((prev) => ({ ...prev, appraisalStatus: next }));
		setAppliedFilter((prev) => ({ ...prev, appraisalStatus: next }));
		resetPaging();
	};

	const handleSearch = () => {
		setAppliedFilter(filterDraft);
		resetPaging();
	};

	const handleReset = () => {
		setFilterDraft({});
		setAppliedFilter({});
		resetPaging();
	};

	const openDetail = (user: AppraisalUser, initialStep?: DetailStep) => {
		setActiveUser(user);
		// 从关闭到展开时自动收起左侧面板（设计稿 05），用户可再手动展开（设计稿 15）
		if (!detail.open) {
			setPanelCollapsed(true);
		}
		setDetail((prev) => ({ open: true, fullscreen: prev.fullscreen, initialStep }));
	};

	const closeDetail = () => setDetail({ open: false, fullscreen: false });

	const handleToggleDetail = () => {
		if (!activeUser) {
			return;
		}
		if (detail.open) {
			closeDetail();
		} else {
			openDetail(activeUser);
		}
	};

	const handleCheckedChange = (userId: string, checked: boolean) => {
		setCheckedIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(userId);
			} else {
				next.delete(userId);
			}
			return next;
		});
	};

	const allChecked = users.length > 0 && users.every((user) => checkedIds.has(user.userId));
	const handleCheckAll = () => {
		setCheckedIds(allChecked ? new Set() : new Set(users.map((user) => user.userId)));
	};

	/* ------------------------------ 述职流程 ------------------------------ */
	/**
	 * 业务冲突提示（设计稿 02 / 22）
	 *
	 * 「【XX】已开启该人员的述职，请勿重复录制」「你正在录制【XX】的述职过程……」均由后端校验返回，
	 * 前端不自行判断录制归属，只以确认弹窗原样展示后端文案。
	 *
	 * @param error - 接口错误
	 */
	const showConflict = (error: Error) => {
		modal.confirm({
			title: error.message || "操作失败，请稍后重试",
			icon: WARNING_ICON,
			closable: true,
			okText: "确认",
			cancelText: "取消",
			...CONFIRM_BUTTON_PROPS,
		});
	};

	/**
	 * 校验人员已归入文件夹：述职接口以「文件夹 + 人员」定位一场述职
	 *
	 * @param user - 述职人员
	 * @returns 文件夹 ID，未归入时提示并返回 undefined
	 */
	const requireFolder = (user: AppraisalUser) => {
		if (!user.folderId) {
			message.warning("请先将该人员归入文件夹（述职会）后再开始述职");
		}
		return user.folderId;
	};

	const startPresentation = (user: AppraisalUser, append = false) => {
		const targetFolderId = requireFolder(user);
		if (!targetFolderId) {
			return;
		}
		mutations.start.mutate(
			{ folderId: targetFolderId, userId: user.userId },
			{
				onSuccess: () => {
					message.success(
						append
							? "已追加录音，请在钉钉闪记中继续录制"
							: `${user.userName} 已开始述职，请在钉钉闪记中录制`,
					);
					openDetail(user, DetailStep.RECORDING);
				},
				onError: showConflict,
			},
		);
	};

	const redoPresentation = (user: AppraisalUser) => {
		const targetFolderId = requireFolder(user);
		if (!targetFolderId) {
			return;
		}
		modal.confirm({
			title: "确认重新开启述职录制？",
			content: "重新开启后将丢弃已生成的闪记，并重新开始录制。",
			okText: "重新开启",
			cancelText: "取消",
			...CONFIRM_BUTTON_PROPS,
			onOk: () =>
				mutations.redo
					.mutateAsync({ folderId: targetFolderId, userId: user.userId })
					.then(() => message.success("已重新开启，请在钉钉闪记中录制"))
					.catch(showConflict),
		});
	};

	const endPresentation = (user: AppraisalUser) => {
		const targetFolderId = requireFolder(user);
		if (!targetFolderId) {
			return;
		}
		modal.confirm({
			title: "确认结束述职并提交？",
			content:
				"提交后录音与转写将上传存档，千问办公结合「备课材料+录音转写+AI笔记」T+1 生成评分报告，并由绿小服自动推送。",
			okText: "提交",
			cancelText: "取消",
			...CONFIRM_BUTTON_PROPS,
			onOk: () =>
				mutations.end
					.mutateAsync({ folderId: targetFolderId, userId: user.userId })
					.then(() => {
						message.success("述职已结束，评分报告生成中");
					}),
		});
	};

	const presentationHandlers: PresentationHandlers = {
		onStart: (user) => startPresentation(user),
		onAppend: (user) => startPresentation(user, true),
		onRedo: redoPresentation,
		onEnd: endPresentation,
		starting: mutations.start.isPending,
		redoing: mutations.redo.isPending,
		ending: mutations.end.isPending,
	};

	const { invalidateAll } = mutations;
	const handleStatusDrift = useCallback(
		(status: AppraisalStatus) => {
			setActiveUser((prev) => (prev ? { ...prev, appraisalStatus: status } : prev));
			invalidateAll();
		},
		[invalidateAll],
	);

	const handleCardAction = (user: AppraisalUser, action: PersonCardAction) => {
		switch (action) {
			case "start":
				startPresentation(user);
				break;
			case "finish":
				endPresentation(user);
				break;
			default:
				openDetail(user, DetailStep.REPORT);
		}
	};

	/* ------------------------------ 文件夹 ------------------------------ */
	const moveToFolder = (userIds: string[], folder: AppraisalFolder) => {
		mutations.moveUsers.mutate(
			{ folderId: folder.id, userIds },
			{
				onSuccess: () => {
					message.success(`已移动 ${userIds.length} 人至「${folder.name}」`);
					setFolderModal(null);
					// 移动成功后高亮目标文件夹并展示其中人员，清空勾选（设计稿 12）
					if (!folders.some((item) => item.id === folder.id)) {
						setOrgCode(folder.belongToOrgCode);
						setFolderKeyword("");
					}
					setFolderId(folder.id);
					resetPaging();
				},
			},
		);
	};

	const handleBatchAction = (action: BatchAction) => {
		if (!checkedIds.size) {
			message.warning(`请先勾选需要${action === "move" ? "移动" : "下载"}的述职人员`);
			return;
		}
		if (action === "move") {
			setFolderModal({ type: "move" });
			return;
		}
		const checkedUsers = users.filter((user) => checkedIds.has(user.userId));
		batchDownload.mutate(checkedUsers, {
			onSuccess: ({ downloaded, skipped }) => {
				if (!downloaded) {
					message.warning("所选人员暂无已生成的评分报告");
					return;
				}
				message.success(
					skipped
						? `已下载 ${downloaded} 份评分报告，${skipped} 人报告未生成已跳过`
						: `已下载 ${downloaded} 份评分报告`,
				);
			},
		});
	};

	const handleDeleteFolder = (folder: AppraisalFolder) => {
		modal.confirm({
			title: `确认删除文件夹「${folder.name}」？`,
			content: "删除后文件夹内的述职人员将移出该文件夹。",
			okText: "删除",
			okButtonProps: { ...CONFIRM_BUTTON_PROPS.okButtonProps, danger: true },
			cancelText: "取消",
			cancelButtonProps: CONFIRM_BUTTON_PROPS.cancelButtonProps,
			onOk: () =>
				mutations.deleteFolder.mutateAsync(folder.id).then(() => {
					message.success("删除成功");
					if (folderId === folder.id) {
						setFolderId(FOLDER_ALL);
						resetPaging();
					}
				}),
		});
	};

	/**
	 * 新增文件夹成功提示（设计稿 09）：3 秒消失，点击蓝色文件夹名称定位至该文件夹
	 *
	 * @param target - 新文件夹
	 * @param groupLabel - 所属组织一级分组名称（如「地区公司」）
	 */
	const showFolderCreated = (target: LocateTarget, groupLabel: string) => {
		const key = `folder-created-${Date.now()}`;
		message.open({
			key,
			type: "success",
			duration: FOLDER_CREATED_TOAST_SECONDS,
			content: (
				<span>
					文件夹
					<button
						type="button"
						className="cursor-pointer border-none bg-transparent p-0 text-[#0075FF]"
						onClick={() => {
							message.destroy(key);
							setPanelCollapsed(false);
							setOrgCode(target.orgCode);
							setFolderKeyword("");
							setLocateTarget(target);
						}}
					>
						【{target.name}】
					</button>
					已新增在【{groupLabel}】下，可拖动人员归入
				</span>
			),
		});
	};

	/* ------------------------------ 拖拽 ------------------------------ */
	const sensors = useSensors(
		// 5px 位移阈值：区分点击（展开详情）与拖拽
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragStart = ({ active }: DragStartEvent) => {
		setDraggingUser(users.find((user) => user.userId === active.id));
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setDraggingUser(undefined);
		if (!over) {
			return;
		}
		const activeId = String(active.id);
		const overId = String(over.id);
		if (overId.startsWith(FOLDER_DROP_PREFIX)) {
			const targetId = overId.slice(FOLDER_DROP_PREFIX.length);
			const folder = folders.find((item) => item.id === targetId);
			if (!folder) {
				return;
			}
			// 拖拽的是已勾选卡片时，连同其他已勾选卡片一起移动
			const userIds = checkedIds.has(activeId) ? [...checkedIds] : [activeId];
			moveToFolder(userIds, folder);
			return;
		}
		if (!isRealFolder(folderId) || activeId === overId) {
			return;
		}
		const ids = users.map((user) => user.userId);
		setLocalOrder(arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId)));
		mutations.reorder.mutate({ folderId, userId: activeId, target: { overUserId: overId } });
	};

	const handleSortChange = (user: AppraisalUser, position: number) => {
		if (!isRealFolder(folderId)) {
			return;
		}
		mutations.reorder.mutate(
			{ folderId, userId: user.userId, target: { position } },
			{ onSuccess: () => message.success(`已将 ${user.userName} 调整至第 ${position} 位`) },
		);
	};

	/* ------------------------------ 渲染 ------------------------------ */
	const total = listResult.data?.total ?? 0;
	const detailOpen = detail.open && Boolean(activeUser);
	const detailPanel =
		detailOpen && activeUser ? (
			<DetailPanel
				user={activeUser}
				fullscreen={detail.fullscreen}
				initialStep={detail.initialStep}
				handlers={presentationHandlers}
				onStatusDrift={handleStatusDrift}
				onFullscreenChange={(fullscreen) => setDetail((prev) => ({ ...prev, fullscreen }))}
				onClose={closeDetail}
			/>
		) : null;

	return (
		<ConfigProvider theme={PAGE_THEME} button={PAGE_BUTTON_CONFIG}>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setDraggingUser(undefined)}
			>
				<BasicContent className="relative flex h-full min-h-0 !p-0">
					<div
						className={cn(
							"flex min-h-0 min-w-0 flex-1 py-6 pl-6",
							detailOpen && !detail.fullscreen ? "pr-12" : "pr-6",
						)}
					>
						<SidePanel
							collapsed={panelCollapsed}
							onCollapsedChange={setPanelCollapsed}
							width={panelWidth}
							onWidthChange={setPanelWidth}
							left={
								<OrgTreePanel
									nodes={orgNodes}
									loading={orgTreeQuery.isLoading}
									totalCount={sumStatistics(totalStatisticsQuery.data)}
									selectedCode={effectiveOrgCode}
									onSelect={handleOrgSelect}
								/>
							}
							right={
								<FolderPanel
									totalCount={sumStatistics(scopeStatisticsQuery.data)}
									folders={folders}
									loading={foldersQuery.isFetching}
									selectedFolderId={folderId}
									keyword={folderKeyword}
									onKeywordChange={setFolderKeyword}
									onSelect={handleFolderSelect}
									onCreate={() => setFolderModal({ type: "create" })}
									onRename={(folder) =>
										setFolderModal({ type: "rename", folder })
									}
									onDelete={handleDeleteFolder}
								/>
							}
						/>

						<div
							ref={mainRef}
							className={cn(
								"flex min-h-0 min-w-0 flex-1 flex-col",
								panelCollapsed ? "ml-[38px]" : "ml-6",
							)}
						>
							<OverviewSection
								collapsed={overviewCollapsed}
								onCollapsedChange={setOverviewCollapsed}
								statistics={statisticsQuery.data}
								activeStatus={appliedFilter.appraisalStatus}
								onStatusCardClick={handleStatusCardClick}
								filterValue={filterDraft}
								onFilterChange={setFilterDraft}
								onSearch={handleSearch}
								onReset={handleReset}
								compact={compact}
							/>

							{/* 批量操作 */}
							<div className="mt-4 flex h-8 shrink-0 items-center gap-2">
								<BatchActions
									loading={batchDownload.isPending}
									onAction={handleBatchAction}
								/>
								{/* 再次点击取消全选；文案按设计稿固定为「全选」 */}
								<Button onClick={handleCheckAll}>全选</Button>
								<span className="min-w-0 flex-1 truncate text-sm text-[#606266]">
									拖拽人员卡片可排序或归入文件夹，多选后可批量移动至文件夹；点击文件夹查看其中的述职人
								</span>
								<button
									type="button"
									disabled={!activeUser}
									onClick={handleToggleDetail}
									className={cn(
										"flex shrink-0 items-center gap-1 border-none bg-transparent p-0 text-base leading-6",
										activeUser
											? "cursor-pointer text-[#606266] hover:text-[#0075FF]"
											: "cursor-not-allowed text-[#C0C4CC]",
									)}
								>
									<PanelDetailIcon width={18} height={18} />
									详情
								</button>
							</div>

							{/* 人员卡片 */}
							<div className="mt-4 min-h-0 shrink overflow-y-auto overflow-x-hidden">
								<CardBoard
									users={users}
									loading={listResult.isFetching}
									sortable={sortable}
									checkedIds={checkedIds}
									activeUserId={activeUser?.userId}
									pendingUserId={
										mutations.start.isPending
											? mutations.start.variables?.userId
											: mutations.end.isPending
												? mutations.end.variables?.userId
												: undefined
									}
									onCheckedChange={handleCheckedChange}
									onOpen={(user) => openDetail(user)}
									onAction={handleCardAction}
									onSortChange={handleSortChange}
								/>
							</div>

							{/* 底栏：已选条数 + 分页 */}
							<div className="mt-4 flex h-8 shrink-0 items-center justify-between gap-4">
								<span className="text-sm text-[#323233]">
									{checkedIds.size ? `已选中：${checkedIds.size}` : null}
								</span>
								<ConfigProvider theme={PAGINATION_THEME}>
									<Pagination
										className={styles.pagination}
										current={pagination.pageNum}
										pageSize={pagination.pageSize}
										total={total}
										showSizeChanger={PAGE_SIZE_CHANGER}
										pageSizeOptions={[20, 50, 100]}
										showTotal={(count) => `共${count}条`}
										onChange={(pageNum, pageSize) => {
											setPagination({ pageNum, pageSize });
											setCheckedIds(new Set());
										}}
									/>
								</ConfigProvider>
							</div>
						</div>
					</div>

					{/* 详情：抽屉态与列表并排，右侧、底部贴边 */}
					{detailOpen && !detail.fullscreen ? (
						<div className="mt-6 w-[625px] shrink-0">{detailPanel}</div>
					) : null}
					{/* 详情：全屏态覆盖页面内容区 */}
					{detailOpen && detail.fullscreen ? (
						<div className="absolute inset-x-6 bottom-0 top-6 z-20 shadow-[0_0_12px_0_rgba(0,0,0,0.06)]">
							{detailPanel}
						</div>
					) : null}
				</BasicContent>

				<DragOverlay dropAnimation={null}>
					{draggingUser ? (
						<div className="flex w-max items-center gap-2 rounded border border-solid border-[#0075FF] bg-white px-3 py-2 shadow-[0_6px_16px_0_rgba(0,0,0,0.12)]">
							<PersonAvatar name={draggingUser.userName} />
							<span className="text-base text-[#0075FF]">
								{draggingUser.userName}
							</span>
							<StatusTag status={draggingUser.appraisalStatus} />
							{checkedIds.has(draggingUser.userId) && checkedIds.size > 1 ? (
								<span className="text-sm text-[#606266]">
									等{checkedIds.size}人
								</span>
							) : null}
						</div>
					) : null}
				</DragOverlay>

				<FolderFormModal
					open={folderModal?.type === "create" || folderModal?.type === "rename"}
					mode={folderModal?.type === "rename" ? "rename" : "create"}
					orgOptions={orgCascaderOptions}
					defaultOrgPath={defaultOrgPath}
					defaultName={
						folderModal?.type === "rename" ? folderModal.folder.name : undefined
					}
					confirmLoading={
						mutations.createFolder.isPending || mutations.updateFolder.isPending
					}
					onCancel={() => setFolderModal(null)}
					onSubmit={(values) => {
						if (folderModal?.type === "rename") {
							const { folder } = folderModal;
							mutations.updateFolder.mutate(
								// 修改接口要求 appraisalDate 必传：重命名时原样回传
								{
									id: folder.id,
									name: values.name,
									appraisalDate: folder.appraisalDate ?? "",
								},
								{
									onSuccess: () => {
										message.success("保存成功");
										setFolderModal(null);
									},
								},
							);
							return;
						}
						const belongToOrgCode = values.orgPath?.[values.orgPath.length - 1];
						if (!belongToOrgCode || !values.appraisalDate) {
							return;
						}
						mutations.createFolder.mutate(
							{
								name: values.name,
								appraisalDate: toApiDateTime(values.appraisalDate, "start"),
								belongToOrgCode,
							},
							{
								onSuccess: (newFolderId) => {
									setFolderModal(null);
									// 提示文案取一级分组（如「地区公司」），与设计稿 09 一致
									const [groupLabel = ""] = findCascaderLabels(
										orgCascaderOptions,
										values.orgPath,
									);
									showFolderCreated(
										{
											orgCode: belongToOrgCode,
											folderId: newFolderId,
											name: values.name,
										},
										groupLabel,
									);
								},
							},
						);
					}}
				/>
				<BatchMoveModal
					open={folderModal?.type === "move"}
					selectedCount={checkedIds.size}
					orgOptions={orgCascaderOptions}
					defaultOrgPath={defaultOrgPath}
					confirmLoading={mutations.moveUsers.isPending}
					onCancel={() => setFolderModal(null)}
					onSubmit={(folder) => moveToFolder([...checkedIds], folder)}
				/>
			</DndContext>
		</ConfigProvider>
	);
}
