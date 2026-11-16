// 工具函数

import { request } from "#src/utils/request";
import { Button, Dropdown, Space } from "antd";
import React from "react";

/**
 * 获取同步版本号（用于并发控制）
 */
export async function fetchSynVersion(id: string | number) {
	try {
		const resp: any = await request
			.get(`indicator/basic/${id}`, { ignoreLoading: true })
			.json();
		const data = resp?.data ?? resp;
		return data?.synVersion ?? 0;
	} catch (e) {
		console.error("failed to fetch synVersion", e);
		return 0;
	}
}

/**
 * 渲染操作按钮组（支持折叠）
 * 当按钮数量 > 2 时，前 2 个直接显示，其余折叠到 ··· 菜单中
 */
export function renderActionButtons(actions: React.ReactNode[]) {
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

	if (actions.length <= 2) {
		return <Space split={splitNode}>{actions}</Space>;
	}

	const first = actions.slice(0, 2);
	const rest = actions.slice(2);

	// 提取 Dropdown 菜单项
	const handlers: Record<string, () => void> = {};
	const menuItems = rest.map((n, idx) => {
		const key = (n as any)?.key ?? `more-${idx}`;
		let label: React.ReactNode = n;
		let onClickFn: (() => void) | undefined;

		if (React.isValidElement(n)) {
			const props = (n as any).props || {};
			label = props.children ?? n;
			onClickFn = props.onClick;
		}

		// 存储点击处理函数
		handlers[key] = onClickFn || (() => undefined);

		return {
			key,
			label: <div style={{ textAlign: "left" }}>{label}</div>,
			className: "indicator-dropdown-item",
		};
	});

	const dropdownTrigger = (
		<Dropdown
			key="more-actions"
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

	return <Space split={splitNode}>{[...first, dropdownTrigger]}</Space>;
}

/**
 * 渲染上线状态徽章
 */
export function renderOnlineStatus(onlineStatus: number): React.ReactNode {
	const isOnline = onlineStatus === 1;
	const dotStyle: React.CSSProperties = {
		width: 8,
		height: 8,
		borderRadius: 8,
		display: "inline-block",
		marginRight: 8,
		background: isOnline ? "#52c41a" : "#bfbfbf",
	};
	return (
		<span style={{ color: isOnline ? undefined : "rgba(192, 196, 204, 1)" }}>
			<span style={dotStyle} />
			{isOnline ? "已上线" : "未上线"}
		</span>
	);
}

/**
 * 权限矩阵配置
 * 根据上线状态、应用计划数、用户权限(perm)判断可用操作
 * perm: 0=管理, 1=编辑, 2=查看
 */
export function getPermissionMatrix() {
	return {
		0: {
			online: {
				noPlan: ["offline", "operationLog"],
				hasPlan: ["offline", "permissionEdit", "operationLog"],
			},
			offline: {
				noPlan: ["online", "indicatorEdit", "permissionEdit", "delete", "operationLog"],
				hasPlan: ["online", "indicatorEdit", "permissionEdit", "operationLog"],
			},
		},
		1: {
			online: {
				noPlan: ["offline", "operationLog"],
				hasPlan: ["offline", "permissionEdit", "operationLog"],
			},
			offline: {
				noPlan: ["online", "indicatorEdit", "operationLog"],
				hasPlan: ["online", "indicatorEdit", "operationLog"],
			},
		},
		2: {
			online: {
				noPlan: ["operationLog"],
				hasPlan: ["operationLog"],
			},
			offline: {
				noPlan: ["operationLog"],
				hasPlan: ["operationLog"],
			},
		},
	};
}
