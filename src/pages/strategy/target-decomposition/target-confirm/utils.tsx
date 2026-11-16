import type { StatusConfig, TaskRow } from "./types";
import React from "react";

/**
 * 分割线元素 - 操作按钮之间的分割线
 */
export const splitNode = (
	<span
		style={{
			display: "inline-block",
			width: 1,
			height: 14,
			background: "rgba(235,238,245,1)",
		}}
	/>
);

/**
 * 获取状态配置（文本和颜色）
 */
export function getStatusConfig(status: number): StatusConfig {
	const map: Record<number, StatusConfig> = {
		1: { text: "被驳回", color: "#ff4d4f" },
		0: { text: "未确认", color: "rgba(192, 196, 204, 1)" },
		2: { text: "已确认", color: "rgba(20, 185, 104, 1)" },
		5: { text: "废弃", color: "rgba(140, 140, 140, 1)" },
	};
	return map[status] || { text: "未知", color: "#000" };
}

/**
 * 渲染状态指示器
 */
export function renderStatusIndicator(record: TaskRow): React.ReactNode {
	const config = getStatusConfig(record.stepStatus);
	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
			<span
				aria-hidden
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: config.color,
					display: "inline-block",
				}}
			/>
			<span
				style={{
					color: record.stepStatus === 1 ? "rgba(192, 196, 204, 1)" : undefined,
				}}
			>
				{record.stepStatusStr}
			</span>
		</span>
	);
}

/**
 * 处理获取数据的 API 响应
 */
export function mapTaskRowData(list: any[] = []): TaskRow[] {
	return list.map((item: any) => ({
		...item,
		status: Number(item.status),
	}));
}
