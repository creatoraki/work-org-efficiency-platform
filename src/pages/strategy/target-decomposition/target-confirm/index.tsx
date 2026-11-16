import type { ConfirmCounts, TaskRow } from "./types";
import { useModal } from "#src/components/modal-manager";
import SearchableTable from "#src/components/searchable-table";
import { useWorkBenchStore } from "#src/store/workbench";
import { Button, theme } from "antd";
import React, { useEffect } from "react";
import { createColumns, createSearchSchema } from "./config";
import { useTargetConfirmActions } from "./hooks";

export default function TargetConfirmPage() {
	const { token } = theme.useToken();
	const modal = useModal();
	const consumePendingLinkQuery = useWorkBenchStore((state) => state.consumePendingLinkQuery);
	const [workbenchQuery] = React.useState<Record<string, string> | null>(() =>
		useWorkBenchStore
			.getState()
			.getPendingLinkQuery("/strategy/target-decomposition/target-confirm"),
	);

	const [reloadTick, setReloadTick] = React.useState(0);
	const [, setCounts] = React.useState<ConfirmCounts>({
		totalNum: 0,
		unconfirmedNum: 0,
		rejectedNum: 0,
		confirmedNum: 0,
	});

	// 业务逻辑 Hook
	const { getCount, fetchData } = useTargetConfirmActions(reloadTick, setCounts);

	const refreshTable = React.useCallback(() => {
		setReloadTick((s) => s + 1);
		getCount();
	}, [getCount]);

	useEffect(() => {
		getCount();
	}, [getCount]);

	useEffect(() => {
		consumePendingLinkQuery("/strategy/target-decomposition/target-confirm");
	}, [consumePendingLinkQuery]);

	// 搜索配置
	const searchSchema = React.useMemo(() => createSearchSchema(), []);
	const pendingRecordIdRef = React.useRef<number | undefined>(
		workbenchQuery?.id ? Number(workbenchQuery.id) : undefined,
	);
	const shouldAutoOpenSingleResultRef = React.useRef(Boolean(pendingRecordIdRef.current));

	const openTaskDetail = React.useCallback(
		(record: TaskRow) => {
			modal.open("task.detail", {
				record: { ...record, hideAction: false },
				afterClose: () => refreshTable(),
			});
		},
		[modal, refreshTable],
	);

	// 表格列配置
	const columns = React.useMemo(
		() =>
			createColumns({
				onTaskClick: (record) => {
					modal.open("task.detail", {
						record: { ...record, hideAction: true },
					});
				},
				onDetailClick: (record) => {
					openTaskDetail(record);
				},
				onHistoryClick: (record) => {
					modal.open("plan.history", {
						record,
						bizCode: "TARGET_CONFIRM",
					});
				},
			}),
		[modal, openTaskDetail],
	);

	const renderRowActions = React.useCallback(
		(record: TaskRow) => {
			return [
				<Button
					key="detail"
					type="link"
					size="small"
					onClick={(e) => {
						e.stopPropagation();
						openTaskDetail(record);
					}}
				>
					{record.stepStatus === 0 ? "确认" : "查看详情"}
				</Button>,
				<Button
					key="history"
					type="link"
					size="small"
					onClick={() =>
						modal.open("plan.history", { record, bizCode: "TARGET_CONFIRM" })
					}
				>
					确认记录
				</Button>,
			];
		},
		[modal, refreshTable],
	);

	const [activeTab] = React.useState<string>("all");

	return (
		<div
			className="rounded px-6 pt-6"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<SearchableTable<TaskRow>
				columns={columns}
				searchSchema={searchSchema}
				fetchData={(params: any) => {
					const recordId = pendingRecordIdRef.current;
					if (recordId) {
						pendingRecordIdRef.current = undefined;
					}

					return fetchData(
						{
							...params,
							stepConfirmationRecordId: recordId || undefined,
						},
						activeTab,
					).then((result) => {
						if (shouldAutoOpenSingleResultRef.current) {
							shouldAutoOpenSingleResultRef.current = false;
							if (result.data.length === 1) {
								openTaskDetail(result.data[0]);
							}
						}

						return result;
					});
				}}
				toolbarActions={<Button type="primary">导出</Button>}
				reloadSignal={reloadTick}
				renderRowActions={renderRowActions}
			/>
		</div>
	);
}
