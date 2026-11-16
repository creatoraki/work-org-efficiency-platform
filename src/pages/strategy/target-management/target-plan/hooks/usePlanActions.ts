// 计划操作业务逻辑

import type { Plan } from "../types";
import { confirm } from "#src/components/custom-confirm/index.js";
import { useModal } from "#src/components/modal-manager";
import { request } from "#src/utils/request";
import { message } from "antd";
import { useCallback } from "react";

export function usePlanActions(refreshTable: () => void) {
	const modal = useModal();

	// 删除计划
	const handleDelete = useCallback(
		(record: Plan) => {
			confirm({
				title: "请确认是否删除",
				centered: true,
				content: "删除后不可再恢复",
				onOk: async () => {
					try {
						const id = (record as any).id || (record as any).targetPlanEntityId;
						if (!id) throw new Error("找不到计划 id");
						const res: any = await request.delete(`target/plan/${id}`).json();
						if (res && res.code === 200) {
							message.success(res.msg || "删除成功");
							refreshTable();
						} else {
							message.error(res?.msg || "删除失败");
						}
					} catch (e) {
						message.error(`删除失败，${e}`);
					}
				},
			});
		},
		[refreshTable],
	);

	// 结束计划
	const handleEnd = useCallback(
		(record: Plan) => {
			confirm({
				title: "请确认是否结束",
				content: "结束后，该计划不可再进行修改。",
				centered: true,
				onOk: async () => {
					try {
						const id = (record as any).id || (record as any).targetPlanEntityId;
						if (!id) throw new Error("找不到计划 id");
						const payload = {
							id,
							status: 2,
							synVersion: (record as any).synVersion ?? 0,
						};
						await request.put("target/plan/upStatus", { json: payload }).json();
						refreshTable();
					} catch (e) {
						message.error(`操作失败${e}`);
					}
				},
			});
		},
		[refreshTable],
	);

	// 撤销结束
	const handleUndoEnd = useCallback(
		(record: Plan) => {
			confirm({
				title: "请确认是否撤销结束",
				icon: "blue",
				centered: true,
				onOk: async () => {
					try {
						const id = (record as any).id || (record as any).targetPlanEntityId;
						if (!id) throw new Error("找不到计划 id");
						const payload = {
							id,
							status: 1,
							synVersion: (record as any).synVersion ?? 0,
						};
						await request.put("target/plan/upStatus", { json: payload }).json();
						refreshTable();
					} catch (e) {
						message.error(`操作失败${e}`);
					}
				},
			});
		},
		[refreshTable],
	);

	// 打开查看数据弹窗
	const handleViewData = useCallback(
		(record: Plan) => {
			modal.open("plan.viewData", { record, afterClose: refreshTable, type: 2 });
		},
		[modal, refreshTable],
	);

	// 打开流程配置弹窗
	const handleFlow = useCallback(
		(record: Plan) => {
			modal.open("plan.flow", { record, afterClose: refreshTable }).then();
		},
		[modal, refreshTable],
	);

	// 打开权限编辑弹窗
	const handlePermissions = useCallback(
		(record: Plan) => {
			modal
				.open("plan.permissions", { record, dataType: 1, afterClose: refreshTable })
				.then();
		},
		[modal, refreshTable],
	);

	// 打开操作记录弹窗
	const handleHistory = useCallback(
		(record: Plan) => {
			modal.open("plan.history", { record, afterClose: refreshTable }).then();
		},
		[modal, refreshTable],
	);

	return {
		handleDelete,
		handleEnd,
		handleUndoEnd,
		handleViewData,
		handleFlow,
		handlePermissions,
		handleHistory,
	};
}
