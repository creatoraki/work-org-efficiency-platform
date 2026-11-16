import type { Plan } from "./types";
import { BasicButton } from "#src/components/index.js";
import { useModal } from "#src/components/modal-manager";
import SearchableTable from "#src/components/searchable-table";
import { request } from "#src/utils/request";
import { Button, message, theme } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { PERIOD_ITEMS, STATUS_ITEMS } from "../constants/plan";
import { getColumns } from "./config/columns";
import { usePlanActions } from "./hooks";

export default function TargetPlanPage() {
	const { token } = theme.useToken();
	const modal = useModal();

	// 搜索表单配置
	const searchSchema = useMemo(
		() => [
			{
				name: "name",
				label: "计划名称",
				type: "input",
				fieldProps: {
					allowClear: true,
					placeholder: "请输入",
				},
			},
			{ name: "subperiod", label: "目标周期", type: "select", options: PERIOD_ITEMS },
			{ name: "status", label: "计划状态", type: "select", options: STATUS_ITEMS },
			{
				name: "createByName",
				label: "创建人",
				type: "input",
				fieldProps: {
					allowClear: true,
					placeholder: "请输入",
				},
			},
			{
				name: "updateByName",
				label: "更新人",
				type: "input",
				fieldProps: {
					allowClear: true,
					placeholder: "请输入",
				},
			},
		],
		[],
	);

	// 获取数据
	const fetchData = useCallback(async (params: any) => {
		const pageSize = params.pageSize || 10;

		const payload = {
			pageNum: params.pageNum,
			pageSize,
			searchCount: true,
			sortItemList: [
				{
					isAsc: false,
					column: "create_time",
				},
			],
			name: params.name ?? undefined,
			year: params.subperiod ? (params.subperiod[0] ?? undefined) : undefined,
			subperiod: params.subperiod ? (params.subperiod[1] ?? undefined) : undefined,
			status: typeof params.status !== "undefined" ? Number(params.status) : undefined,
			createByName: params.createByName ?? undefined,
			updateByName: params.updateByName ?? undefined,
		};

		try {
			const resp: any = await request
				.post("target/plan/page", { json: payload, ignoreLoading: true })
				.json();
			if (!resp) return { data: [], total: 0 };
			if (Array.isArray(resp.data)) {
				return { data: resp.data, total: resp.total ?? 0 };
			}
			if (resp.data && Array.isArray(resp.data.list))
				return { data: resp.data.list, total: resp.data.total ?? 0 };
			return { data: [], total: 0 };
		} catch (e) {
			message.error(`获取目标计划列表失败${e}`);
			return { data: [], total: 0 };
		}
	}, []);

	// 刷新表格
	const [reloadSignal, setReloadSignal] = useState<number>(0);
	const refreshTable = useCallback(() => {
		setReloadSignal((s) => s + 1);
	}, []);

	// 新增计划
	const onCreate = useCallback(() => {
		modal.open("plan.create", { record: null, afterClose: refreshTable });
	}, [modal, refreshTable]);

	// 编辑计划
	const onEdit = useCallback(
		(record: Plan) => {
			modal.open("plan.create", { record, afterClose: refreshTable }).then();
		},
		[modal, refreshTable],
	);

	// 获取操作 Hooks
	const {
		handleDelete,
		handleEnd,
		handleUndoEnd,
		handleViewData,
		handleFlow,
		handlePermissions,
		handleHistory,
	} = usePlanActions(refreshTable);

	// 渲染行操作按钮
	const renderRowActions = useCallback(
		(record: Plan) => {
			const perm = String((record as any)?.perm ?? "");
			const viewDataButton = (
				<Button
					key="viewdata"
					type="link"
					size="small"
					onClick={() => handleViewData(record)}
				>
					查看数据
				</Button>
			);
			const flowButton = (
				<Button key="flow" type="link" size="small" onClick={() => handleFlow(record)}>
					流程配置
				</Button>
			);
			const permButton = (
				<Button
					key="perm"
					type="link"
					size="small"
					onClick={() => handlePermissions(record)}
				>
					权限编辑
				</Button>
			);
			const historyButton = (
				<Button
					key="history"
					type="link"
					size="small"
					onClick={() => handleHistory(record)}
				>
					操作记录
				</Button>
			);
			const deleteButton = (
				<Button key="delete" type="link" size="small" onClick={() => handleDelete(record)}>
					删除
				</Button>
			);
			const endButton = (
				<Button key="end" type="link" size="small" onClick={() => handleEnd(record)}>
					结束
				</Button>
			);
			const undoEndButton = (
				<Button
					key="undo_end"
					type="link"
					size="small"
					onClick={() => handleUndoEnd(record)}
				>
					撤销结束
				</Button>
			);

			// 权限规则：0=管理 1=编辑 2=查看
			if (perm === "2") {
				return [viewDataButton];
			}
			if (perm === "1") {
				return [flowButton, historyButton, viewDataButton];
			}

			// 管理权限
			if (perm === "0") {
				const actions: React.ReactNode[] = [flowButton, permButton, historyButton];
				// 0=未发布, 1=进行中, 2=已结束
				if (record.status === 0) actions.push(deleteButton);
				else if (record.status === 1) actions.push(endButton);
				else if (record.status === 2) actions.push(undoEndButton);
				actions.push(viewDataButton);
				return actions;
			}

			return [];
		},
		[
			handleDelete,
			handleEnd,
			handleUndoEnd,
			handleViewData,
			handleFlow,
			handlePermissions,
			handleHistory,
		],
	);

	// 获取表格列配置
	const columns = useMemo(
		() =>
			getColumns(onEdit, (record: Plan) => {
				const perm = String((record as any)?.perm ?? "");
				return perm === "0" || perm === "1" || perm === "2";
			}),
		[onEdit],
	);

	return (
		<div
			className="rounded p-6"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<SearchableTable<Plan>
				columns={columns}
				searchSchema={searchSchema}
				fetchData={fetchData}
				reloadSignal={reloadSignal}
				renderRowActions={renderRowActions}
				pageSize={10}
				scroll={{ x: 1300 }}
				toolbarActions={
					<BasicButton type="primary" onClick={onCreate} auth="target:plan:create">
						新增计划
					</BasicButton>
				}
			/>
		</div>
	);
}
