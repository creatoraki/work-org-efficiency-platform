import type { PlanRow } from "./types";
import { submitIndicatorConfSubmit } from "#src/api/strategy/target-filling";
import { useModal } from "#src/components/modal-manager";
import PeriodPicker from "#src/components/period-picker";
import SearchableTable from "#src/components/searchable-table";
import { useWorkBenchStore } from "#src/store/workbench";
import { Button, Modal, Tabs, theme } from "antd";
import dayjs from "dayjs";
import React from "react";
import { createTableColumns } from "./config/columns";
import { createSearchSchema } from "./config/searchSchema";
import { useStats, useTableData } from "./hooks";

export default function IndicatorConfigPage() {
	const { token } = theme.useToken();
	const modal = useModal();
	const consumePendingLinkQuery = useWorkBenchStore((state) => state.consumePendingLinkQuery);

	const plansRef = React.useRef<PlanRow[]>([]);
	const [workbenchQuery] = React.useState<Record<string, string> | null>(() =>
		useWorkBenchStore
			.getState()
			.getPendingLinkQuery("/strategy/target-decomposition/indicator-config"),
	);
	const [reloadTick, setReloadTick] = React.useState(-1);
	const [activeTab, setActiveTab] = React.useState<string>("0");
	const [planType] = React.useState<string>("");
	const pendingConfIdRef = React.useRef<number | undefined>(
		workbenchQuery?.id ? Number(workbenchQuery.id) : undefined,
	);
	const shouldAutoOpenSingleResultRef = React.useRef(Boolean(pendingConfIdRef.current));

	React.useEffect(() => {
		consumePendingLinkQuery("/strategy/target-decomposition/indicator-config");
	}, [consumePendingLinkQuery]);

	// 生成搜索表单配置
	const searchSchema = React.useMemo(() => createSearchSchema(), []);

	const handleResetSearch = React.useCallback(() => {
		pendingConfIdRef.current = undefined;
		shouldAutoOpenSingleResultRef.current = false;
	}, []);

	const openIndicatorConfig = React.useCallback(
		(record: PlanRow) => {
			modal.open("indicator.config", { record }).then();
		},
		[modal],
	);

	const openPrimaryAction = React.useCallback(
		(record: PlanRow) => {
			const deadlineText =
				typeof record.deadline === "string"
					? record.deadline
					: record.validity?.split(" ~ ")[1] || "";
			const isOverdue = deadlineText && dayjs(deadlineText).isBefore(dayjs(), "day");
			if (isOverdue) {
				return;
			}

			openIndicatorConfig(record);
		},
		[openIndicatorConfig],
	);

	// 获取表格数据
	const { fetchData } = useTableData(plansRef, planType);

	// 获取统计数据
	const { stats } = useStats();

	// 表格列配置
	const columns = React.useMemo(() => createTableColumns(modal), [modal]);

	const renderRowActions = React.useCallback(
		(record: PlanRow) => {
			const deadlineText =
				typeof record.deadline === "string"
					? record.deadline
					: record.validity?.split(" ~ ")[1] || "";
			const isOverdue = deadlineText && dayjs(deadlineText).isBefore(dayjs(), "day");
			const actions: React.ReactNode[] = [];

			if (!isOverdue) {
				actions.push(
					<Button
						key="config"
						type="link"
						size="small"
						onClick={() => openPrimaryAction(record)}
					>
						指标配置
					</Button>,
				);
			}

			if (record.submissionStatus === 1) {
				actions.push(
					<Button
						key="history"
						type="link"
						size="small"
						onClick={() =>
							modal.open("plan.history", {
								record: { ...record },
								bizCode: "INDICATOR_CONF_DETAILS",
							})
						}
					>
						操作记录
					</Button>,
				);
			}

			if (!isOverdue) {
				actions.push(
					<Button
						key="submit"
						type="link"
						size="small"
						onClick={() => {
							Modal.confirm({
								title: "提交确认",
								content: "确认要提交该计划的指标配置吗？",
								onOk: async () => {
									const { data } = await submitIndicatorConfSubmit(record.id);
									if (data) {
										setReloadTick((t) => t + 1);
									}
								},
							});
						}}
					>
						提交
					</Button>,
				);
			}

			return actions;
		},
		[openPrimaryAction],
	);

	const tabItems = React.useMemo(
		() => [
			{
				key: "0",
				label: `总计划 (${stats.targetPlanTotal ?? 0})`,
			},
			{
				key: "1",
				label: `主责计划 (${stats.primaryPlanTotal ?? 0})`,
			},
			{
				key: "2",
				label: `协作计划 (${stats.collaborationPlanTotal ?? 0})`,
			},
		],
		[stats.targetPlanTotal, stats.primaryPlanTotal, stats.collaborationPlanTotal],
	);

	// Tab 变化时刷新数据
	React.useEffect(() => {
		setReloadTick((t) => t + 1);
	}, [activeTab]);

	return (
		<div
			className="rounded px-6"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)} items={tabItems} />
			<SearchableTable<PlanRow>
				className="mt-3"
				columns={React.useMemo(
					() => [
						{
							title: "目标周期",
							dataIndex: "subperiod",
							key: "subperiod",
							hideInTable: true,
							hideInSearch: false,
							renderFormItem: () => <PeriodPicker parentOpen={false} borderless />,
						},
						...columns,
					],
					[columns],
				)}
				searchSchema={searchSchema}
				fetchData={(params: any) => {
					const confId = pendingConfIdRef.current;
					if (confId) {
						pendingConfIdRef.current = undefined;
					}

					return fetchData(
						{
							...params,
							effTaskIndicatorConfId: confId || undefined,
						},
						activeTab,
					).then((result) => {
						if (shouldAutoOpenSingleResultRef.current) {
							shouldAutoOpenSingleResultRef.current = false;
							if (result.data.length === 1) {
								openPrimaryAction(result.data[0]);
							}
						}

						return result;
					});
				}}
				pageSize={10}
				reloadSignal={reloadTick}
				onResetSearch={handleResetSearch}
				renderRowActions={renderRowActions}
			/>
		</div>
	);
}
