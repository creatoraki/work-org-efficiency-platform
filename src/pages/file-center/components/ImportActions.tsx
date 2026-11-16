import type { ImportRecord } from "../types";
import { message, Typography } from "antd";
import React from "react";
import { ImportStatus } from "../types";

interface ImportActionsProps {
	record: ImportRecord;
	onActionComplete: () => void;
}

/**
 * 导入记录操作列组件
 */
export const ImportActions: React.FC<ImportActionsProps> = React.memo(
	({ record, onActionComplete }) => {
		const { status, name } = record;

		/**
		 * 下载文件 (Mock 实现)
		 */
		const handleDownload = async () => {
			try {
				// TODO: 替换为真实 API
				message.success(`下载文件: ${name}`);
			} catch (error) {
				console.error("handleDownload failed", error);
				message.error("下载失败");
			}
		};

		/**
		 * 取消任务 (Mock 实现)
		 */
		const handleCancel = async () => {
			try {
				// TODO: 换为真实 API
				message.success("任务已取消");
				onActionComplete();
			} catch (error) {
				console.error("handleCancel failed", error);
				message.error("取消失败");
			}
		};

		// 成功状态 - 显示下载按钮
		if (status === ImportStatus.SUCCESS) {
			return <Typography.Link onClick={handleDownload}>下载</Typography.Link>;
		}

		// 导出中/处理中 - 显示取消按钮
		if (status === ImportStatus.IN_PROGRESS) {
			return <Typography.Link onClick={handleCancel}>取消</Typography.Link>;
		}

		// 其他状态 - 无操作
		return <span style={{ color: "#909399" }}>--</span>;
	},
);

ImportActions.displayName = "ImportActions";
