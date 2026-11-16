// 工具函数

import { Button, Dropdown, Space } from "antd";
import React from "react";

/**
 * 状态颜色映射
 */
const STATUS_COLORS: Record<number, string> = {
	1: "rgba(0, 117, 255, 1)", // 进行中
	0: "rgba(96, 98, 102, 1)", // 未发布
	2: "rgba(192, 196, 204, 1)", // 已结束
};

/**
 * 获取状态颜色
 */
export function getStatusColor(status: number): string {
	return STATUS_COLORS[status] || "rgba(96,98,102,1)";
}

/**
 * 渲染状态徽章（带颜色圆点）
 */
export function renderStatusBadge(status: number, statusStr: string): React.ReactNode {
	const dotColor = getStatusColor(status);
	const textStyle: React.CSSProperties = {};
	if (status === 2) textStyle.color = "rgba(192, 196, 204, 1)";

	return (
		<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: 8,
					background: dotColor,
					display: "inline-block",
				}}
			/>
			<span style={textStyle}>{statusStr}</span>
		</span>
	);
}

/**
 * 渲染操作按钮组（支持折叠）
 * 当按钮数量 > 2 时，前 2 个直接显示，其余折叠到 ··· 菜单中
 */
export function renderActionButtons(actions: React.ReactNode[]): React.ReactNode {
	const ordered = actions.filter(Boolean);
	const splitNode = (
		<span
			style={{
				display: "inline-block",
				width: 1,
				height: 14,
				background: "rgba(235,238,245,1)",
			}}
		/>
	);

	// 少于等于 2 个按钮，直接显示
	if (ordered.length <= 2) {
		return <Space split={splitNode}>{ordered}</Space>;
	}

	// 超过 2 个按钮，前 2 个直接显示，其余折叠
	const first = ordered.slice(0, 2);
	const rest = ordered.slice(2);

	// 构建 Dropdown 菜单项
	const handlers: Record<string, (...args: any[]) => any> = {};
	const menuItems = rest.map((n, idx) => {
		const key = (n as any)?.key ?? `more-${idx}`;
		let label: React.ReactNode = n;
		let onClickFn: ((...args: any[]) => any) | undefined;
		if (React.isValidElement(n)) {
			const props = (n as any).props || {};
			label = props.children ?? n;
			onClickFn = props.onClick;
		}
		handlers[key] = onClickFn || (() => undefined);
		return {
			key,
			label: <div style={{ textAlign: "left" }}>{label}</div>,
			className: "plan-dropdown-item",
		};
	});

	const dropdownTrigger = (
		<Dropdown
			key="more"
			menu={{
				items: menuItems,
				onClick: ({ key }) => {
					const fn = handlers[key as string];
					if (fn) fn();
				},
			}}
			trigger={["hover"]}
			placement="top"
		>
			<span className="inline-flex h-full items-center">
				<Button
					type="link"
					style={{
						fontSize: 20,
						height: 24,
						lineHeight: 1,
						padding: "0 0 8px 0",
						display: "flex",
						alignItems: "center",
					}}
				>
					···
				</Button>
			</span>
		</Dropdown>
	);

	const inlineNodes = [...first, dropdownTrigger];

	return <Space split={splitNode}>{inlineNodes}</Space>;
}
