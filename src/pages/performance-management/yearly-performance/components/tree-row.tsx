import type { ReactNode } from "react";

import { cn } from "#src/utils";
import { CaretDownIcon } from "./icons";

interface TreeRowProps {
	/** 层级，从 0 开始，每级缩进 16px */
	level: number;
	/** 标题 */
	title: string;
	/** 右侧人数，不传则不展示 */
	count?: number;
	/** 是否选中（标题主色） */
	selected?: boolean;
	/** 是否展示展开三角 */
	showSwitcher?: boolean;
	/** 是否展开（控制三角方向） */
	expanded?: boolean;
	/** 点击三角 */
	onToggle?: () => void;
	/** 点击行 */
	onClick?: () => void;
	/** 悬浮时替换人数展示的操作区（如文件夹的编辑 / 删除） */
	hoverActions?: ReactNode;
	/** 是否为拖拽放置目标高亮 */
	dropActive?: boolean;
	/** 是否禁用（无数据权限的组织节点：可展开，不可选中） */
	disabled?: boolean;
	/** 额外样式 */
	className?: string;
}

/**
 * 树行
 *
 * 32px 行高；左内边距 8px + 层级缩进，16px 三角区 + 4px 间距后为标题；人数 #606266 右对齐（右内边距 4px）。
 * 悬浮时标题与操作区出现 #F5F7FA 底（三角区除外），有 hoverActions 时人数替换为操作图标（设计稿 24）。
 *
 * @param props - 组件属性
 * @param props.level - 层级，从 0 开始，每级缩进 16px
 * @param props.title - 标题
 * @param props.count - 右侧人数，不传则不展示
 * @param props.selected - 是否选中（标题主色）
 * @param props.showSwitcher - 是否展示展开三角
 * @param props.expanded - 是否展开（控制三角方向）
 * @param props.onToggle - 点击三角
 * @param props.onClick - 点击行
 * @param props.hoverActions - 悬浮时替换人数展示的操作区（如文件夹的编辑 / 删除）
 * @param props.dropActive - 是否为拖拽放置目标高亮
 * @param props.disabled - 是否禁用
 * @param props.className - 额外样式
 * @returns 树行
 *
 * @since 2026-11-16
 */
export function TreeRow({
	level,
	title,
	count,
	selected,
	showSwitcher,
	expanded = true,
	onToggle,
	onClick,
	hoverActions,
	dropActive,
	disabled,
	className,
}: TreeRowProps) {
	return (
		<div
			className={cn("group/row flex h-8 items-center text-sm", className)}
			style={{ paddingLeft: 8 + level * 16 }}
		>
			<span
				className={cn(
					"flex h-full w-4 shrink-0 items-center justify-center text-[#606266]",
					showSwitcher && onToggle && "cursor-pointer",
				)}
				onClick={(event) => {
					event.stopPropagation();
					onToggle?.();
				}}
			>
				{showSwitcher ? (
					<CaretDownIcon
						className={cn("transition-transform", !expanded && "-rotate-90")}
					/>
				) : null}
			</span>
			<div
				role="button"
				tabIndex={disabled ? -1 : 0}
				aria-disabled={disabled || undefined}
				onClick={disabled ? undefined : onClick}
				onKeyDown={(event) => {
					if (!disabled && event.key === "Enter") {
						onClick?.();
					}
				}}
				className={cn(
					"ml-0.5 flex h-7 min-w-0 flex-1 items-center gap-2 rounded pl-0.5 pr-1 outline-none transition-colors",
					disabled ? "cursor-default" : "cursor-pointer hover:bg-[#F5F7FA]",
					dropActive && "bg-[#E0EEFF] outline-dashed outline-1 outline-[#0075FF]",
				)}
			>
				<span
					className={cn(
						"min-w-0 flex-1 truncate",
						disabled
							? "text-[#909399]"
							: selected
								? "text-[#0075FF]"
								: "text-[#323233]",
					)}
					title={title}
				>
					{title}
				</span>
				{count === undefined ? null : (
					<span
						className={cn(
							"shrink-0 text-[#606266]",
							hoverActions && "group-hover/row:hidden",
						)}
					>
						{count}
					</span>
				)}
				{hoverActions ? (
					<span className="hidden shrink-0 items-center gap-2.5 group-hover/row:flex">
						{hoverActions}
					</span>
				) : null}
			</div>
		</div>
	);
}
