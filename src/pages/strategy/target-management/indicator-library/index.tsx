import type { Indicator } from "./types";
import { confirm } from "#src/components/custom-confirm/index.js";
import { BasicButton } from "#src/components/index.js";
import { useModal } from "#src/components/modal-manager";
import SearchableTable from "#src/components/searchable-table";
import { request } from "#src/utils/request";
import { DownOutlined } from "@ant-design/icons";
import { Button, Dropdown, theme } from "antd";
import React, { useCallback, useMemo } from "react";
import { INDICATOR_TYPES, ONLINE_STATUS, RESPONSIBLE_DEPARTMENTS } from "../constants/indicator";
import { getColumns } from "./config/columns";
import { useIndicatorActions } from "./hooks";
import { getPermissionMatrix } from "./utils";

export default function IndicatorLibrary() {
	const { token } = theme.useToken();
	const modal = useModal();

	// 状态管理
	const [reloadSignal, setReloadSignal] = React.useState(0);
	const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

	// 刷新表格
	const refreshTable = useCallback(() => setReloadSignal((s) => s + 1), []);

	// 新增指标
	const onCreate = useCallback(() => {
		modal.open("indicator.drawer", { record: null, afterClose: refreshTable });
	}, [modal, refreshTable]);

	// 获取操作 Hooks
	const {
		handleDelete,
		handleStatusChange,
		batchChangeStatus,
		onEdit,
		handlePermissions,
		handleHistory,
	} = useIndicatorActions(refreshTable);

	// 搜索表单配置
	const searchSchema = useMemo(
		() => [
			{
				name: "name",
				label: "指标名称",
				type: "input",
				fieldProps: { allowClear: true, placeholder: "请输入" },
			},
			{
				name: "responsibleDepartmentCode",
				label: "主责部门",
				type: "select",
				options: RESPONSIBLE_DEPARTMENTS,
			},
			{ name: "type", label: "指标类型", type: "select", options: INDICATOR_TYPES },
			{ name: "onlineStatus", label: "上线状态", type: "select", options: ONLINE_STATUS },
			{
				name: "createByName",
				label: "创建人",
				type: "input",
				fieldProps: { allowClear: true, placeholder: "请输入" },
			},
			{
				name: "updateByName",
				label: "更新人",
				type: "input",
				fieldProps: { allowClear: true, placeholder: "请输入" },
			},
		],
		[],
	);

	// 数据获取
	const fetchData = useCallback(async (params: any) => {
		const { pageNum = 1, pageSize = 10, ...restParams } = params;
		const payload = {
			pageNum,
			pageSize,
			searchCount: true,
			sortItemList: [{ isAsc: false, column: "update_time" }],
			name: restParams.name,
			responsibleDepartmentCode: restParams.responsibleDepartmentCode,
			type: restParams.type,
			onlineStatus: restParams.onlineStatus,
			createByName: restParams.createByName,
			updateByName: restParams.updateByName,
		};

		try {
			const resp: any = await request
				.post("indicator/page", { json: payload, ignoreLoading: true })
				.json();
			const list = resp?.data?.list || (Array.isArray(resp?.data) ? resp.data : []);
			const total = resp?.data?.total ?? resp?.total ?? 0;
			return { data: list, total };
		} catch (e) {
			console.error("fetch indicator/page failed", e);
			return { data: [], total: 0 };
		}
	}, []);

	// 查看指标详情
	const onViewDetail = useCallback(
		(record: Indicator) => {
			modal.open("indicator.edit", { record, readonly: true });
		},
		[modal],
	);

	// 查看应用计划
	const onViewPlans = useCallback(
		(record: Indicator) => {
			modal.open("indicator.plan", { record, readonly: true });
		},
		[modal],
	);

	// 获取表格列配置
	const columns = useMemo(
		() => getColumns(onViewDetail, onViewPlans),
		[onViewDetail, onViewPlans],
	);

	// 渲染行操作按钮
	const renderRowActions = useCallback(
		(record: Indicator) => {
			// 按钮定义
			const buttons: Record<string, React.ReactNode> = {
				online: (
					<Button
						key="publish"
						size="small"
						type="link"
						onClick={() => handleStatusChange(record, 1)}
					>
						上线
					</Button>
				),
				offline: (
					<Button
						key="unpublish"
						size="small"
						type="link"
						onClick={() => handleStatusChange(record, 0)}
					>
						下线
					</Button>
				),
				indicatorEdit: (
					<Button key="edit" size="small" type="link" onClick={() => onEdit(record)}>
						指标编辑
					</Button>
				),
				permissionEdit: (
					<Button
						key="perm"
						size="small"
						type="link"
						onClick={() => handlePermissions(record)}
					>
						权限编辑
					</Button>
				),
				delete: (
					<Button
						key="delete"
						size="small"
						type="link"
						onClick={() => handleDelete(record)}
					>
						删除
					</Button>
				),
				operationLog: (
					<Button
						key="history"
						size="small"
						type="link"
						onClick={() => handleHistory(record)}
					>
						操作记录
					</Button>
				),
			};

			// 权限矩阵：根据状态和应用计划数判断可用操作
			const isOnline = record.onlineStatus === 1;
			const hasPlan = (record.applicationPlanCount || 0) > 0;
			const statusKey = isOnline ? "online" : "offline";
			const planKey = hasPlan ? "hasPlan" : "noPlan";

			const matrix = getPermissionMatrix();
			const permKey = (record.perm ?? 2) as 0 | 1 | 2;
			const allowedActions = matrix[permKey]?.[statusKey]?.[planKey] || [];

			// 组合按钮
			const actionNodes = allowedActions.map((action) => buttons[action]).filter(Boolean);

			// 确保操作记录在最后（如果存在）
			const historyBtn = buttons.operationLog;
			const finalActions = [
				...actionNodes.filter((btn) => btn !== historyBtn),
				actionNodes.includes(historyBtn) ? historyBtn : null,
			].filter(Boolean) as React.ReactNode[];

			return finalActions;
		},
		[handleStatusChange, handleDelete, onEdit, handlePermissions, handleHistory],
	);

	return (
		<div
			className="rounded p-6 pb-0"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<SearchableTable<Indicator>
				rowKey="id"
				rowSelection={{
					selectedRowKeys,
					onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
				}}
				reloadSignal={reloadSignal}
				bottomOffset={470}
				columns={columns}
				searchSchema={searchSchema}
				fetchData={fetchData}
				renderRowActions={renderRowActions}
				pageSize={10}
				toolbarActions={
					<>
						<BasicButton type="primary" onClick={onCreate} auth="indicator:create">
							新增指标
						</BasicButton>
						<Dropdown
							menu={{
								items: [
									{
										key: "online",
										label: "批量上线",
										disabled: selectedRowKeys.length === 0,
									},
									{
										key: "offline",
										label: "批量下线",
										disabled: selectedRowKeys.length === 0,
									},
								],
								onClick: async ({ key }) => {
									const isOnline = key === "online";
									confirm({
										title: `确认将所选指标批量${isOnline ? "上线" : "下线"}吗？`,
										icon: isOnline ? "blue" : "yellow",
										centered: true,
										onOk: async () => batchChangeStatus(selectedRowKeys),
									});
								},
							}}
						>
							<BasicButton type="default" className="ml-2">
								批量操作 <DownOutlined />
							</BasicButton>
						</Dropdown>
					</>
				}
			/>
		</div>
	);
}
