import type { MenuProps } from "antd";

import { cn } from "#src/utils";
import { Button, Dropdown } from "antd";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/** 批量操作项 */
export type BatchAction = "move" | "download";

/** 下拉菜单项（设计稿 22：批量移动 / 批量下载） */
const MENU_ITEMS: MenuProps["items"] = [
	{ key: "move", label: "批量移动" },
	{ key: "download", label: "批量下载" },
];

interface BatchActionsProps {
	/** 执行中（批量下载逐份进行时禁用再次触发） */
	loading?: boolean;
	/** 选择操作 */
	onAction: (action: BatchAction) => void;
}

/**
 * 批量操作下拉
 *
 * 默认按钮 + 下拉箭头，展开时箭头朝上；点击菜单项后由页面校验勾选并执行。
 *
 * @param props - 组件属性
 * @param props.loading - 执行中
 * @param props.onAction - 选择操作
 * @returns 批量操作下拉
 *
 * @since 2026-11-20
 */
export function BatchActions({ loading, onAction }: BatchActionsProps) {
	const [open, setOpen] = useState(false);
	return (
		<Dropdown
			open={open}
			onOpenChange={setOpen}
			trigger={["click"]}
			menu={{
				items: MENU_ITEMS,
				onClick: ({ key }) => {
					setOpen(false);
					onAction(key as BatchAction);
				},
			}}
		>
			<Button className="!gap-1 !px-[15px]" loading={loading}>
				批量操作
				<ChevronDown
					className={cn("size-3.5 transition-transform", open && "rotate-180")}
					strokeWidth={2}
				/>
			</Button>
		</Dropdown>
	);
}
