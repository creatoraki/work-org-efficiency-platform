// 指标操作业务逻辑

import type { Indicator } from "../types";
import { confirm } from "#src/components/custom-confirm/index.js";
import { useModal } from "#src/components/modal-manager";
import { request } from "#src/utils/request";
import { message } from "antd";
import React, { useCallback } from "react";

import { fetchSynVersion } from "../utils";

export function useIndicatorActions(refreshTable: () => void) {
	const modal = useModal();

	// 删除指标
	const handleDelete = useCallback(
		async (record: Indicator) => {
			confirm({
				title: "请确认是否删除",
				icon: "yellow",
				content: "删除后不可再恢复",
				centered: true,
				onOk: async () => {
					try {
						const { code, msg }: any = await request
							.delete(`indicator/byId/${record.id}`)
							.json();
						if (code === 305) {
							message.error(msg);
						} else {
							message.success(msg);
							refreshTable();
						}
					} catch (e) {
						console.error("delete indicator failed", e);
						message.error("删除失败");
					}
				},
			});
		},
		[refreshTable],
	);

	// 上线/下线状态切换
	const handleStatusChange = useCallback(
		async (record: Indicator, status: 0 | 1) => {
			const isPublish = status === 1;
			confirm({
				title: isPublish ? "请确认是否上线" : "请确认是否下线",
				icon: isPublish ? "blue" : "yellow",
				content: isPublish ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							minHeight: 64,
						}}
					>
						上线指标名称必须唯一。若与已上线指标重名，则上线失败。
					</div>
				) : (
					"下线后指标将无法在指标配置中选择"
				),
				centered: true,
				modalRender: (node) =>
					React.cloneElement(node as any, { style: { borderRadius: 0 } }),
				onOk: async () => {
					try {
						const synVersion = (await fetchSynVersion(record.id)) || record.synVersion;
						const payload = { id: record.id, onlineStatus: status, synVersion };
						const resp: any = await request
							.put("indicator/upOnlineStatus", { json: payload })
							.json();
						const msg =
							resp?.msg ??
							(typeof resp === "string" ? resp : isPublish ? "上线成功" : "操作成功");

						if (resp && typeof resp === "object" && resp.code && resp.code !== 200) {
							if (isPublish) {
								confirm({
									title: "上线失败",
									icon: "yellow",
									content: msg || "上线失败",
									centered: true,
									onOk: () => {},
								});
							} else {
								message.error(msg || "下线失败");
							}
						} else {
							message.success(isPublish ? "上线成功" : "下线成功");
							refreshTable();
						}
					} catch (e) {
						console.error(
							`upOnlineStatus ${isPublish ? "publish" : "unpublish"} failed`,
							e,
						);
						message.error(isPublish ? "上线失败" : "下线失败");
					}
				},
			});
		},
		[refreshTable],
	);

	// 批量修改状态
	const batchChangeStatus = useCallback(async (ids: React.Key[]) => {
		if (!ids || ids.length === 0) return;
		// 目前后端接口未就绪，仅做提示
		message.success("批量接口后端还没出");
	}, []);

	// 打开编辑弹窗
	const onEdit = useCallback(
		(record: Indicator) => {
			modal.open("indicator.edit", { record, afterClose: refreshTable });
		},
		[modal, refreshTable],
	);

	// 打开权限编辑弹窗
	const handlePermissions = useCallback(
		(record: Indicator) => {
			modal.open("indicator.permissions", { record, afterClose: refreshTable });
		},
		[modal, refreshTable],
	);

	// 打开操作记录弹窗
	const handleHistory = useCallback(
		(record: Indicator) => {
			modal.open("plan.history", { record, bizCode: "INDICATOR_LIBRARY" });
		},
		[modal],
	);

	return {
		handleDelete,
		handleStatusChange,
		batchChangeStatus,
		onEdit,
		handlePermissions,
		handleHistory,
	};
}
