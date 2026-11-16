import type {
	YearlyReportFolder,
	YearlyReportItem,
	YearlyReportListQuery,
	YearlyReportOrgNode,
	YearlyReportStatisticsQuery,
	YearlyReportStatus,
} from "#src/api/performance-management/yearly-performance";
import type { CollisionDetection, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { PersonCardAction } from "./components/person-card";
import type { FolderModalState, ReportFilterValues } from "./types";

import { YEARLY_REPORT_FOLDER_ALL } from "#src/api/performance-management/yearly-performance";
import { BasicContent } from "#src/components";
import { cn } from "#src/utils";
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
import { CardBoard } from "./components/card-board";
import { FOLDER_DROP_PREFIX, FolderPanel } from "./components/folder-panel";
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
	PRIMARY_COLOR,
	SIDE_PANEL_DEFAULT_WIDTH,
} from "./constants";
import { DetailPanel } from "./detail/detail-panel";
import {
	useFolderOrgOptions,
	useManagerCategoryOptions,
	useYearlyReportFolderTree,
	useYearlyReportList,
	useYearlyReportMutations,
	useYearlyReportOrgTree,
	useYearlyReportStatistics,
} from "./hooks/use-yearly-report-queries";
import styles from "./index.module.css";
import { BatchMoveModal } from "./modals/batch-move-modal";
import { FolderFormModal } from "./modals/folder-form-modal";

/** 详情面板状态 */
interface DetailState {
	/** 是否展开 */
	open: boolean;
	/** 是否全屏 */
	fullscreen: boolean;
	/** 打开时默认查看的步骤 */
	initialStep?: DetailStep;
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
 * 查找组织在树中的路径（根 → 目标）
 *
 * @param nodes - 组织树
 * @param orgId - 目标组织
 * @returns 组织路径，未找到为空数组
 */
function findOrgChain(nodes: YearlyReportOrgNode[], orgId?: string): YearlyReportOrgNode[] {
	for (const node of nodes) {
		if (node.orgId === orgId) {
			return [node];
		}
		const chain = findOrgChain(node.children ?? [], orgId);
		if (chain.length) {
			return [node, ...chain];
		}
	}
	return [];
}

/**
 * 筛选表单值 → 接口参数（不含状态与分页）
 *
 * @param filter - 已生效筛选
 * @returns 接口参数片段
 */
function toFilterParams(filter: ReportFilterValues) {
	const [start, end] = filter.reportTimeRange ?? [];
	return {
		employeeName: filter.employeeName?.trim() || undefined,
		managerCategory: filter.managerCategory?.length ? filter.managerCategory : undefined,
		reportTimeStart: start?.format("YYYY-MM-DD HH:mm"),
		reportTimeEnd: end?.format("YYYY-MM-DD HH:mm"),
	};
}

/**
 * 绩效管理 · 年终述职
 *
 * 页面结构：左侧「组织架构 + 文件夹」面板（可收起、可拖拽宽度）→ 主区域（概览与筛选、批量操作、人员卡片、分页）
 * → 右侧述职详情（三步流程，可全屏）。
 *
 * 交互要点：
 * - 数据卡片与「述职状态」筛选联动，再次点击取消；
 * - 点击卡片 / 姓名展开详情，展开时自动收起左侧面板，给卡片区让出宽度；
 * - 卡片可拖拽排序，或拖到文件夹归档（拖拽已勾选卡片时整批移动）；多选后可批量移动至文件夹。
 *
 * 后端接口未就绪，数据来自 src/api/performance-management/yearly-performance 的本地模拟。
 *
 * @returns 年终述职页面
 *
 * @since 2026-11-16
 */
export default function YearlyPerformancePage() {
	const { message, modal } = App.useApp();

	/* ------------------------------ 页面状态 ------------------------------ */
	const [orgId, setOrgId] = useState<string>();
	const [folderId, setFolderId] = useState(YEARLY_REPORT_FOLDER_ALL);
	const [folderKeyword, setFolderKeyword] = useState("");
	const debouncedFolderKeyword = useDebounce(folderKeyword, { wait: 300 });
	const [filterDraft, setFilterDraft] = useState<ReportFilterValues>({});
	const [appliedFilter, setAppliedFilter] = useState<ReportFilterValues>({});
	const [pagination, setPagination] = useState({ pageNum: 1, pageSize: DEFAULT_PAGE_SIZE });
	const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
	const [activeItem, setActiveItem] = useState<YearlyReportItem>();
	const [detail, setDetail] = useState<DetailState>({ open: false, fullscreen: false });
	const [panelCollapsed, setPanelCollapsed] = useState(false);
	const [panelWidth, setPanelWidth] = useState(SIDE_PANEL_DEFAULT_WIDTH);
	const [overviewCollapsed, setOverviewCollapsed] = useState(false);
	const [folderModal, setFolderModal] = useState<FolderModalState>(null);
	const [localOrder, setLocalOrder] = useState<string[] | null>(null);
	const [draggingItem, setDraggingItem] = useState<YearlyReportItem>();

	const mainRef = useRef<HTMLDivElement>(null);
	const mainSize = useSize(mainRef);
	const compact = Boolean(mainSize?.width && mainSize.width < COMPACT_MAIN_WIDTH);

	/* ------------------------------ 数据查询 ------------------------------ */
	const orgTreeQuery = useYearlyReportOrgTree();
	const orgNodes = useMemo(() => orgTreeQuery.data?.nodes ?? [], [orgTreeQuery.data]);
	// 默认选中根组织（当前用户可见的全部范围）
	const effectiveOrgId = orgId ?? orgNodes[0]?.orgId;

	const folderTreeQuery = useYearlyReportFolderTree(
		{ orgId: effectiveOrgId, keyword: debouncedFolderKeyword.trim() || undefined },
		Boolean(effectiveOrgId),
	);

	const statisticsQuery = useMemo<YearlyReportStatisticsQuery>(
		() => ({ orgId: effectiveOrgId, folderId, ...toFilterParams(appliedFilter) }),
		[effectiveOrgId, folderId, appliedFilter],
	);
	const listQuery = useMemo<YearlyReportListQuery>(
		() => ({ ...statisticsQuery, status: appliedFilter.status, ...pagination }),
		[statisticsQuery, appliedFilter.status, pagination],
	);
	const statisticsResult = useYearlyReportStatistics(statisticsQuery);
	const listResult = useYearlyReportList(listQuery);
	const { data: managerCategoryOptions = [] } = useManagerCategoryOptions();
	const { data: folderOrgOptions = [] } = useFolderOrgOptions();
	const mutations = useYearlyReportMutations();

	const serverItems = useMemo(() => listResult.data?.list ?? [], [listResult.data]);
	// 拖拽排序后先按本地顺序展示，接口刷新后以服务端顺序为准
	const items = useMemo(() => {
		if (!localOrder || localOrder.length !== serverItems.length) {
			return serverItems;
		}
		const byId = new Map(serverItems.map((item) => [item.reportId, item]));
		const ordered = localOrder.map((id) => byId.get(id));
		return ordered.every(Boolean) ? (ordered as YearlyReportItem[]) : serverItems;
	}, [localOrder, serverItems]);

	useEffect(() => {
		setLocalOrder(null);
	}, [listResult.data]);

	// 列表刷新后同步详情头部数据（状态流转、重排序号）
	useEffect(() => {
		if (!activeItem) {
			return;
		}
		const latest = serverItems.find((item) => item.reportId === activeItem.reportId);
		if (latest && latest !== activeItem) {
			// 状态流转后（如结束录音）详情回到新状态的当前步骤，不再沿用打开时指定的步骤
			if (latest.status !== activeItem.status) {
				setDetail((prev) => ({ ...prev, initialStep: undefined }));
			}
			setActiveItem(latest);
		}
	}, [serverItems, activeItem]);

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

	/** 当前选中组织对应的「所属组织」级联路径（仅可建文件夹的二级组织可回显） */
	const defaultOrgPath = useMemo(() => {
		const chain = findOrgChain(orgNodes, effectiveOrgId);
		const target = chain[chain.length - 1];
		return target?.folderEnabled && chain.length >= 2
			? [chain[chain.length - 2].orgId, target.orgId]
			: undefined;
	}, [orgNodes, effectiveOrgId]);

	/* ------------------------------ 交互处理 ------------------------------ */
	const resetPaging = useCallback(() => {
		setPagination((prev) => ({ ...prev, pageNum: 1 }));
		setCheckedIds(new Set());
	}, []);

	const handleOrgSelect = (nextOrgId: string) => {
		setOrgId(nextOrgId);
		setFolderId(YEARLY_REPORT_FOLDER_ALL);
		resetPaging();
	};

	const handleFolderSelect = (nextFolderId: string) => {
		setFolderId(nextFolderId);
		resetPaging();
	};

	const handleStatusCardClick = (status: YearlyReportStatus) => {
		const next = appliedFilter.status === status ? undefined : status;
		setFilterDraft((prev) => ({ ...prev, status: next }));
		setAppliedFilter((prev) => ({ ...prev, status: next }));
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

	const openDetail = (item: YearlyReportItem, initialStep?: DetailStep) => {
		setActiveItem(item);
		// 从关闭到展开时自动收起左侧面板（设计稿 04），用户可再手动展开（设计稿 18）
		if (!detail.open) {
			setPanelCollapsed(true);
		}
		setDetail((prev) => ({ open: true, fullscreen: prev.fullscreen, initialStep }));
	};

	const closeDetail = () => setDetail({ open: false, fullscreen: false });

	const handleToggleDetail = () => {
		if (!activeItem) {
			return;
		}
		if (detail.open) {
			closeDetail();
		} else {
			openDetail(activeItem);
		}
	};

	const handleCheckedChange = (reportId: string, checked: boolean) => {
		setCheckedIds((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(reportId);
			} else {
				next.delete(reportId);
			}
			return next;
		});
	};

	const allChecked = items.length > 0 && items.every((item) => checkedIds.has(item.reportId));
	const handleCheckAll = () => {
		setCheckedIds(allChecked ? new Set() : new Set(items.map((item) => item.reportId)));
	};

	const finishRecording = (item: YearlyReportItem) => {
		modal.confirm({
			title: "确认结束录音？",
			content: "结束后录音与转写将上传存档，评分报告 T+1 生成并自动推送参会人员。",
			okText: "结束录音",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: () =>
				mutations.finishRecording.mutateAsync(item.reportId).then(() => {
					message.success("录音已结束，评分报告生成中");
				}),
		});
	};

	const handleCardAction = (item: YearlyReportItem, action: PersonCardAction) => {
		switch (action) {
			case "start":
				mutations.startReport.mutate(item.reportId, {
					onSuccess: () => {
						message.success(`${item.userName} 已开始述职，录音实时转写中`);
						openDetail(item, DetailStep.RECORDING);
					},
					onError: (error) => message.error(error.message),
				});
				break;
			case "finish":
				finishRecording(item);
				break;
			default:
				openDetail(item, DetailStep.REPORT);
		}
	};

	const handleBatchMove = () => {
		if (!checkedIds.size) {
			message.warning("请先勾选需要移动的述职人员");
			return;
		}
		setFolderModal({ type: "move" });
	};

	const moveToFolder = (
		reportIds: string[],
		folder: Pick<YearlyReportFolder, "folderId" | "folderName" | "orgId">,
	) => {
		mutations.moveReports.mutate(
			{ reportIds, folderId: folder.folderId },
			{
				onSuccess: () => {
					message.success(`已移动 ${reportIds.length} 人至「${folder.folderName}」`);
					setFolderModal(null);
					// 移动成功后高亮目标文件夹并展示其中人员，清空勾选（设计稿 15）
					const visible = folderTreeQuery.data?.folders.some(
						(item) => item.folderId === folder.folderId,
					);
					if (!visible) {
						setOrgId(folder.orgId);
					}
					setFolderId(folder.folderId);
					resetPaging();
				},
				onError: (error) => message.error(error.message),
			},
		);
	};

	const handleDeleteFolder = (folder: YearlyReportFolder) => {
		modal.confirm({
			title: `确认删除文件夹「${folder.folderName}」？`,
			content: "删除后文件夹内的述职人员将回到「未归入文件夹」。",
			okText: "删除",
			okButtonProps: { danger: true },
			cancelText: "取消",
			onOk: () =>
				mutations.deleteFolder.mutateAsync(folder.folderId).then(() => {
					message.success("删除成功");
					if (folderId === folder.folderId) {
						setFolderId(YEARLY_REPORT_FOLDER_ALL);
						resetPaging();
					}
				}),
		});
	};

	/* ------------------------------ 拖拽 ------------------------------ */
	const sensors = useSensors(
		// 5px 位移阈值：区分点击（展开详情）与拖拽
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragStart = ({ active }: DragStartEvent) => {
		setDraggingItem(items.find((item) => item.reportId === active.id));
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setDraggingItem(undefined);
		if (!over) {
			return;
		}
		const activeId = String(active.id);
		const overId = String(over.id);
		if (overId.startsWith(FOLDER_DROP_PREFIX)) {
			const targetId = overId.slice(FOLDER_DROP_PREFIX.length);
			const folder = folderTreeQuery.data?.folders.find((item) => item.folderId === targetId);
			if (!folder) {
				return;
			}
			// 拖拽的是已勾选卡片时，连同其他已勾选卡片一起移动
			const reportIds = checkedIds.has(activeId) ? [...checkedIds] : [activeId];
			moveToFolder(reportIds, folder);
			return;
		}
		if (activeId === overId) {
			return;
		}
		const ids = items.map((item) => item.reportId);
		const next = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId));
		setLocalOrder(next);
		mutations.sortReports.mutate(
			{ orgId: effectiveOrgId, folderId, reportIds: next },
			{ onError: (error) => message.error(error.message || "排序失败") },
		);
	};

	/* ------------------------------ 渲染 ------------------------------ */
	const folderTree = folderTreeQuery.data;
	const total = listResult.data?.total ?? 0;
	const detailOpen = detail.open && Boolean(activeItem);
	const detailPanel =
		detailOpen && activeItem ? (
			<DetailPanel
				item={activeItem}
				fullscreen={detail.fullscreen}
				initialStep={detail.initialStep}
				finishing={mutations.finishRecording.isPending}
				onFullscreenChange={(fullscreen) => setDetail((prev) => ({ ...prev, fullscreen }))}
				onClose={closeDetail}
				onFinishRecording={finishRecording}
			/>
		) : null;

	return (
		<ConfigProvider theme={PAGE_THEME} button={PAGE_BUTTON_CONFIG}>
			<DndContext
				sensors={sensors}
				collisionDetection={collisionDetection}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragCancel={() => setDraggingItem(undefined)}
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
									totalCount={orgTreeQuery.data?.totalCount ?? 0}
									selectedOrgId={effectiveOrgId}
									onSelect={handleOrgSelect}
								/>
							}
							right={
								<FolderPanel
									totalCount={folderTree?.totalCount ?? 0}
									unfiledCount={folderTree?.unfiledCount ?? 0}
									folders={folderTree?.folders ?? []}
									selectedFolderId={folderId}
									keyword={folderKeyword}
									onKeywordChange={setFolderKeyword}
									onSelect={handleFolderSelect}
									onCreate={() => setFolderModal({ type: "create" })}
									onRename={(folder) =>
										setFolderModal({
											type: "rename",
											folderId: folder.folderId,
											folderName: folder.folderName,
										})
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
								statistics={statisticsResult.data}
								activeStatus={appliedFilter.status}
								onStatusCardClick={handleStatusCardClick}
								filterValue={filterDraft}
								onFilterChange={setFilterDraft}
								managerCategoryOptions={managerCategoryOptions}
								onSearch={handleSearch}
								onReset={handleReset}
								compact={compact}
							/>

							{/* 批量操作 */}
							<div className="mt-4 flex h-8 shrink-0 items-center gap-2">
								<Button
									type="primary"
									className="!px-[15px]"
									onClick={handleBatchMove}
								>
									批量移动
								</Button>
								{/* 再次点击取消全选；文案按设计稿固定为「全选」 */}
								<Button onClick={handleCheckAll}>全选</Button>
								<span className="min-w-0 flex-1 truncate text-sm text-[#606266]">
									拖拽人员卡片可排序或归入文件夹，多选后可批量移动至文件夹；点击文件夹查看其中的述职人
								</span>
								<button
									type="button"
									disabled={!activeItem}
									onClick={handleToggleDetail}
									className={cn(
										"flex shrink-0 items-center gap-1 border-none bg-transparent p-0 text-base leading-6",
										activeItem
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
									items={items}
									loading={listResult.isFetching}
									checkedIds={checkedIds}
									activeReportId={activeItem?.reportId}
									pendingReportId={
										mutations.startReport.isPending
											? mutations.startReport.variables
											: undefined
									}
									onCheckedChange={handleCheckedChange}
									onOpen={(item) => openDetail(item)}
									onAction={handleCardAction}
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
					{draggingItem ? (
						<div className="flex w-max items-center gap-2 rounded border border-solid border-[#0075FF] bg-white px-3 py-2 shadow-[0_6px_16px_0_rgba(0,0,0,0.12)]">
							<PersonAvatar name={draggingItem.userName} src={draggingItem.avatar} />
							<span className="text-base text-[#0075FF]">
								{draggingItem.userName}
							</span>
							<StatusTag status={draggingItem.status} />
							{checkedIds.has(draggingItem.reportId) && checkedIds.size > 1 ? (
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
					orgOptions={folderOrgOptions}
					defaultOrgPath={defaultOrgPath}
					defaultFolderName={
						folderModal?.type === "rename" ? folderModal.folderName : undefined
					}
					confirmLoading={
						mutations.createFolder.isPending || mutations.renameFolder.isPending
					}
					onCancel={() => setFolderModal(null)}
					onSubmit={(values) => {
						if (folderModal?.type === "rename") {
							mutations.renameFolder.mutate(
								{ folderId: folderModal.folderId, folderName: values.folderName },
								{
									onSuccess: () => {
										message.success("保存成功");
										setFolderModal(null);
									},
									onError: (error) => message.error(error.message),
								},
							);
							return;
						}
						const targetOrgId = values.orgPath?.[values.orgPath.length - 1];
						if (!targetOrgId || !values.reportDate) {
							return;
						}
						mutations.createFolder.mutate(
							{
								orgId: targetOrgId,
								reportDate: values.reportDate.format("YYYY-MM-DD"),
								folderName: values.folderName,
							},
							{
								onSuccess: () => {
									message.success("新增成功");
									setFolderModal(null);
								},
								onError: (error) => message.error(error.message),
							},
						);
					}}
				/>
				<BatchMoveModal
					open={folderModal?.type === "move"}
					selectedCount={checkedIds.size}
					orgOptions={folderOrgOptions}
					defaultOrgPath={defaultOrgPath}
					confirmLoading={mutations.moveReports.isPending}
					onCancel={() => setFolderModal(null)}
					onSubmit={(folder) => moveToFolder([...checkedIds], folder)}
				/>
			</DndContext>
		</ConfigProvider>
	);
}
