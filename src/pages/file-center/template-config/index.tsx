/**
 * 导出模板配置管理页面
 * 用于管理和维护 Excel 导出模板配置
 */

import type { ColumnsType } from "antd/es/table";
import type { DrawerState, ExcelConfigItem } from "./types";
import { deleteExcelConfig, fetchExcelConfigList } from "#src/api/file/export-config";
import { confirm } from "#src/components/custom-confirm/index.js";
import SearchableTable from "#src/components/searchable-table";
import { Button, Space } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { ConfigDrawer } from "./components";
import { COLUMN_WIDTHS, MODULE_OPTIONS } from "./constants";
import { formatDateTime } from "./utils";

export default function TemplateConfigPage() {
	const [drawerState, setDrawerState] = useState<DrawerState>({
		visible: false,
		mode: "create",
	});
	const [reloadSignal, setReloadSignal] = useState(0);

	// 搜索表单配置
	const searchSchema = useMemo(
		() => [
			{
				name: "fileName",
				label: "文件名",
				type: "input" as const,
				fieldProps: { placeholder: "请输入文件名", allowClear: true },
			},
			{
				name: "module",
				label: "所属模块",
				type: "select" as const,
				options: MODULE_OPTIONS,
				fieldProps: { placeholder: "请选择模块", allowClear: true },
			},
		],
		[],
	);

	// 表格列配置
	const columns = useMemo<ColumnsType<ExcelConfigItem>>(
		() => [
			{
				title: "模板id",
				dataIndex: "excelId",
				key: "excelId",
				width: COLUMN_WIDTHS.id,
			},
			{
				title: "文件名",
				dataIndex: "fileName",
				key: "fileName",
				width: COLUMN_WIDTHS.fileName,
				ellipsis: true,
			},
			{
				title: "所属模块",
				dataIndex: "module",
				key: "module",
				width: COLUMN_WIDTHS.module,
			},
			{
				title: "数据URL",
				dataIndex: "dataReqUrl",
				key: "dataReqUrl",
				width: COLUMN_WIDTHS.dataReqUrl,
				ellipsis: true,
				render: (url: string) => <span title={url}>{url}</span>,
			},
			{
				title: "创建时间",
				dataIndex: "createTime",
				key: "createTime",
				width: COLUMN_WIDTHS.createTime,
				render: (time: Date | string) => formatDateTime(time),
			},
		],
		[],
	);

	// 数据加载函数
	const fetchData = useCallback(async (params: any) => {
		const { page = 1, pageSize = 10, fileName, module } = params;

		const resp = await fetchExcelConfigList({
			pageNum: page,
			pageSize,
			searchCount: true,
		});

		// 过滤
		let filteredData = resp.data.list;

		if (fileName) {
			filteredData = filteredData.filter((item) =>
				item.fileName.toLowerCase().includes(fileName.toLowerCase()),
			);
		}

		if (module) {
			filteredData = filteredData.filter((item) => item.module === module);
		}

		return {
			data: filteredData,
			total: resp.data.total,
		};
	}, []);

	// 新增按钮
	const handleCreate = useCallback(() => {
		setDrawerState({ visible: true, mode: "create" });
	}, []);

	// 编辑按钮
	const handleEdit = useCallback((record: ExcelConfigItem) => {
		setDrawerState({ visible: true, mode: "edit", record });
	}, []);

	// 删除按钮
	const handleDelete = useCallback((record: ExcelConfigItem) => {
		confirm({
			title: "确认删除",
			content: `确定要删除模板"${record.fileName}"吗?此操作不可恢复。`,
			onOk: async () => {
				await deleteExcelConfig(record.id);
				setReloadSignal((s) => s + 1); // 刷新列表
			},
		});
	}, []);

	// Drawer 关闭回调
	const handleDrawerClose = useCallback((saved?: boolean) => {
		setDrawerState({ visible: false, mode: "create" });
		if (saved) {
			setReloadSignal((s) => s + 1);
		}
	}, []);

	// 渲染操作列
	const renderRowActions = useCallback(
		(record: ExcelConfigItem) => (
			<Space>
				<Button type="link" size="small" onClick={() => handleEdit(record)}>
					编辑
				</Button>
				<Button type="link" size="small" danger onClick={() => handleDelete(record)}>
					删除
				</Button>
			</Space>
		),
		[handleEdit, handleDelete],
	);

	return (
		<div className="p-6 pb-0">
			<SearchableTable<ExcelConfigItem>
				rowKey="id"
				columns={columns}
				searchSchema={searchSchema}
				fetchData={fetchData}
				reloadSignal={reloadSignal}
				renderRowActions={renderRowActions}
				toolbarActions={
					<Button type="primary" onClick={handleCreate}>
						新增模板
					</Button>
				}
				pageSize={10}
			/>

			<ConfigDrawer
				visible={drawerState.visible}
				mode={drawerState.mode}
				record={drawerState.record}
				onClose={handleDrawerClose}
			/>
		</div>
	);
}
