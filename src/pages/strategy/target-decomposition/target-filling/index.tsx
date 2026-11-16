import type { SubmitUserTask } from "#src/api/strategy/target-filling/types";
import type { TabType } from "./types";
import { fetchSubmitUserPage } from "#src/api/strategy/target-filling";
import { useModal } from "#src/components/modal-manager";
import PeriodPicker from "#src/components/period-picker";
import { useWorkBenchStore } from "#src/store/workbench";
import { Button, Tabs, theme } from "antd";
import React from "react";
import { useNavigate } from "react-router";
import SearchableTable from "../../../../components/searchable-table";

import TargetFollowDrawer from "../modal/TargetFollowDrawer";
import { createColumns, SEARCH_SCHEMA } from "./config";
import { useStatistics } from "./hooks";
import { buildFillingPageUrl, checkOverdue } from "./utils";

// 临时兼容逻辑：仅在开发环境（本地 dev 或 development 模式构建）放开"进行中且逾期"任务的填报入口，
// 影响范围为目标填报列表"进行中且逾期"行的操作按钮，生产环境保持原有行为。
// 待需求确认全量放开后，可移除该开关及对应分支。
const IS_DEV_ENV = import.meta.env.DEV || import.meta.env.MODE === "development";

export default function TargetFillingPage() {
	const { token } = theme.useToken();
	const modal = useModal();
	const navigate = useNavigate();
	const consumePendingLinkQuery = useWorkBenchStore((state) => state.consumePendingLinkQuery);
	const [workbenchQuery] = React.useState<Record<string, string> | null>(() =>
		useWorkBenchStore
			.getState()
			.getPendingLinkQuery("/strategy/target-decomposition/target-filling"),
	);

	const [followDrawerOpen, setFollowDrawerOpen] = React.useState(false);
	const [currentRecord, setCurrentRecord] = React.useState<SubmitUserTask | null>(null);
	const [reloadTick, setReloadTick] = React.useState(-1);

	// 从 workbenchQuery 中取 id 和 linkType，首次查询时携带 submitUserId，并根据 linkType 自动执行操作
	const pendingSubmitUserIdRef = React.useRef<number | undefined>(
		workbenchQuery?.id || workbenchQuery?.effTaskIndicatorSubmitUserId
			? Number(workbenchQuery.id || workbenchQuery.effTaskIndicatorSubmitUserId)
			: undefined,
	);
	const pendingLinkTypeRef = React.useRef<string | undefined>(workbenchQuery?.linkType?.trim());
	const shouldAutoActionRef = React.useRef(Boolean(pendingSubmitUserIdRef.current));

	const refreshTable = React.useCallback(() => {
		// 通过自增 reloadTick 通知子组件重新请求数据（保持当前页）
		setReloadTick((s) => s + 1);
	}, []);

	const [planType] = React.useState<string>("all");
	const [activeTab, setActiveTab] = React.useState<TabType>(0);
	React.useEffect(() => {
		consumePendingLinkQuery("/strategy/target-decomposition/target-filling");
	}, [consumePendingLinkQuery]);

	const openTargetFollow = React.useCallback((record: SubmitUserTask) => {
		setCurrentRecord(record);
		setFollowDrawerOpen(true);
	}, []);

	const openViewData = React.useCallback(
		(record: SubmitUserTask) => {
			modal.open("plan.viewData", { record, afterClose: refreshTable, type: 1 });
		},
		[modal, refreshTable],
	);

	const openPrimaryAction = React.useCallback(
		(record: SubmitUserTask, linkType?: string) => {
			if (linkType === "adjust") {
				openTargetFollow(record);
				return;
			}
			// linkType === "filling"：直接打开填报页
			if (linkType === "filling") {
				navigate(buildFillingPageUrl(record));
			}
		},
		[navigate, openTargetFollow],
	);

	const fetchData = React.useCallback(
		async (params: any) => {
			const pageSize = params.pageSize || 10;
			const submitUserId = pendingSubmitUserIdRef.current;
			const doAutoAction = shouldAutoActionRef.current;
			const linkType = pendingLinkTypeRef.current;
			if (submitUserId) {
				pendingSubmitUserIdRef.current = undefined;
				shouldAutoActionRef.current = false;
			}

			const payload = {
				pageNum: params.pageNum,
				pageSize,
				name: params.name ?? undefined,
				submitUserId: submitUserId || undefined,
				targetPlanName: params.targetPlanName ?? undefined,
				year: params.subperiod ? (params.subperiod[0] ?? undefined) : undefined,
				subperiod: params.subperiod ? (params.subperiod[1] ?? undefined) : undefined,
				targetCycle: params.targetCycle ?? undefined,
				fillingStatus:
					typeof params.fillingStatus !== "undefined" && params.fillingStatus !== ""
						? Number(params.fillingStatus)
						: undefined,
				responsibleUserName: params.responsibleUserName ?? undefined,
				queryModelType: activeTab === 0 ? undefined : activeTab,
				sortItemList: [
					{
						isAsc: false,
						column: "update_time",
					},
				],
			};

			try {
				const resp = await fetchSubmitUserPage(payload);
				const list = resp?.data?.list ?? [];
				const total = resp?.data?.total ?? 0;

				if (doAutoAction && list.length === 1) {
					openPrimaryAction(list[0], linkType);
				}

				return { data: list, total };
			} catch (e) {
				console.error("fetchSubmitUserPage error", e);
				return { data: [], total: 0 };
			}
		},
		[activeTab, openPrimaryAction],
	);

	const { statistics } = useStatistics(reloadTick);

	// 当 activeTab 变化时，重新加载表格数据
	React.useEffect(() => {
		setReloadTick((t) => t + 1);
	}, [activeTab]);

	const columns = React.useMemo(() => {
		const baseColumns = createColumns();

		return [
			{
				title: "目标周期",
				dataIndex: "subperiod",
				key: "subperiod",
				hideInTable: true,
				hideInSearch: false,
				renderFormItem: (_: any) => {
					return <PeriodPicker parentOpen={false} borderless />;
				},
			},
			...baseColumns,
		];
	}, [modal, navigate, refreshTable]);

	const renderRowActions = React.useCallback(
		(record: SubmitUserTask) => {
			const status = record.fillingStatus;
			const isOverdue = checkOverdue(record.deadline);
			const actions: React.ReactNode[] = [];

			let showFill = false;
			let showView = false;
			let showAdjust = false;
			const showFollow = true;

			if (status === 0) {
				if (!isOverdue) {
					showFill = true;
				}
			} else if (status === 1) {
				showView = true;
				if (!isOverdue) {
					showAdjust = true;
				}
				// 开发环境：逾期任务放开填报入口（生产环境保持原逻辑，仅可查看数据）
				else if (IS_DEV_ENV) {
					showFill = true;
				}
			} else if (status === 4) {
				showView = true;
			} else {
				showView = true;
				showFill = true;
			}

			if (showFill) {
				actions.push(
					<Button
						key="fill"
						type="link"
						size="small"
						onClick={() => navigate(buildFillingPageUrl(record))}
					>
						填报
					</Button>,
				);
			}
			if (showView) {
				actions.push(
					<Button
						key="view"
						type="link"
						size="small"
						onClick={() => openViewData(record)}
					>
						查看数据
					</Button>,
				);
			}
			if (showAdjust) {
				actions.push(
					<Button
						key="adjust"
						type="link"
						size="small"
						onClick={() => navigate(buildFillingPageUrl(record))}
					>
						调整目标
					</Button>,
				);
			}
			if (showFollow) {
				actions.push(
					<Button
						key="follow"
						type="link"
						size="small"
						onClick={() => openTargetFollow(record)}
					>
						目标跟进
					</Button>,
				);
			}

			return actions;
		},
		[navigate, openTargetFollow, openViewData],
	);

	const tabItems = React.useMemo(
		() => [
			{
				key: "0",
				label: `总计划 (${statistics.total || 0})`,
			},
			{
				key: "1",
				label: `主责计划 (${statistics.ownAll || 0})`,
			},
			{
				key: "2",
				label: `协作计划 (${statistics.otherAll || 0})`,
			},
		],
		[statistics.total, statistics.ownAll, statistics.otherAll],
	);

	return (
		<div
			className="rounded px-6"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<Tabs
				activeKey={String(activeTab)}
				onChange={(k) => setActiveTab(Number(k) as TabType)}
				items={tabItems}
			/>

			<SearchableTable<SubmitUserTask>
				className="mt-3"
				key={planType}
				columns={columns}
				searchSchema={SEARCH_SCHEMA}
				fetchData={(params: any) => fetchData(params)}
				reloadSignal={reloadTick}
				renderRowActions={renderRowActions}
			/>

			<TargetFollowDrawer
				open={followDrawerOpen}
				record={currentRecord}
				onClose={() => setFollowDrawerOpen(false)}
				onRefresh={refreshTable}
			/>
		</div>
	);
}
