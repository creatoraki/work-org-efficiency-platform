import type { ImportRecord } from "../types";
import { cancel } from "#src/api/file/import-task";
import { confirm } from "#src/components/custom-confirm/index.js";
import SearchableTable from "#src/components/searchable-table";
import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, message } from "antd";
import React, { useCallback, useState } from "react";
import { ImportTaskActions } from "./components/ImportTaskActions";
import { ImportTaskDetailDrawer } from "./components/ImportTaskDetailDrawer";
import { createImportTaskColumns } from "./config/columns";
import { SEARCH_SCHEMA } from "./config/search";
import { useImportTaskTable } from "./hooks/useImportTaskTable";

export default function FileCenter() {
	// ============ 状态管理 ============
	const [reloadSignal, setReloadSignal] = useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [detailOpen, setDetailOpen] = useState(false);
	const [detailId, setDetailId] = useState<number | string | undefined>(undefined);
	const { fetchData } = useImportTaskTable();

	const refreshTable = useCallback(() => setReloadSignal((s) => s + 1), []);

	/**
	 * 批量取消任务
	 */
	const batchCancel = useCallback(
		async (ids: React.Key[]) => {
			if (!ids || ids.length === 0) return;

			confirm({
				title: "请确认是否批量取消任务",
				icon: "yellow",
				content: `将取消 ${ids.length} 个任务`,
				centered: true,
				onOk: async () => {
					try {
						const results = await Promise.all(ids.map((id) => cancel(Number(id))));
						const failed = results.filter((r) => r?.code !== 200).length;

						if (failed > 0) {
							message.warning("部分任务取消失败，请稍后重试");
						} else {
							message.success(`已取消 ${ids.length} 个任务`);
						}

						setSelectedRowKeys([]);
						refreshTable();
					} catch (error) {
						message.error("批量取消失败");
						console.error(error);
					}
				},
			});
		},
		[refreshTable],
	);

	const renderRowActions = useCallback(
		(record: ImportRecord) => (
			<ImportTaskActions record={record} onActionComplete={refreshTable} />
		),
		[refreshTable],
	);

	const handleOpenDetail = useCallback((record: ImportRecord) => {
		setDetailId(record.id);
		setDetailOpen(true);
	}, []);

	const columns = React.useMemo(
		() => createImportTaskColumns(handleOpenDetail),
		[handleOpenDetail],
	);

	// ============ 渲染 ============
	return (
		<div className="p-6 pb-0">
			<SearchableTable<ImportRecord>
				rowKey="id"
				rowSelection={{
					selectedRowKeys,
					onChange: (keys) => setSelectedRowKeys(keys),
				}}
				reloadSignal={reloadSignal}
				bottomOffset={470}
				columns={columns}
				searchSchema={SEARCH_SCHEMA}
				fetchData={fetchData}
				renderRowActions={renderRowActions}
				pageSize={10}
				toolbarActions={
					<Dropdown
						menu={{
							items: [
								{
									key: "cancel",
									label: "批量取消",
									disabled: selectedRowKeys.length === 0,
								},
							],
							onClick: async ({ key }) => {
								if (key === "cancel") {
									batchCancel(selectedRowKeys);
								}
							},
						}}
					>
						<Button type="default">
							批量操作 <DownOutlined />
						</Button>
					</Dropdown>
				}
			/>
			<ImportTaskDetailDrawer
				open={detailOpen}
				id={detailId}
				onClose={() => setDetailOpen(false)}
			/>
		</div>
	);
}
