import type { LucideIcon } from "lucide-react";

import { cn } from "#src/utils";
import { Tooltip } from "antd";
import { CircleX, Download, Maximize2, Minimize2 } from "lucide-react";

interface ToolbarButtonProps {
	/** 文字提示 */
	title: string;
	/** 图标 */
	icon: LucideIcon;
	/** 图标尺寸 */
	iconSize?: number;
	/** 是否禁用 */
	disabled?: boolean;
	/** 是否水平镜像 */
	mirrored?: boolean;
	/** 点击 */
	onClick: () => void;
}

/**
 * 工具栏按钮：默认 #323233；悬浮浅主色并出现文字提示；按下深主色（设计稿 11）
 *
 * @param props - 组件属性
 * @param props.title - 文字提示
 * @param props.icon - 图标
 * @param props.iconSize - 图标尺寸
 * @param props.disabled - 是否禁用
 * @param props.mirrored - 是否水平镜像
 * @param props.onClick - 点击
 * @returns 按钮
 */
function ToolbarButton({
	title,
	icon: Icon,
	iconSize = 22,
	disabled,
	mirrored,
	onClick,
}: ToolbarButtonProps) {
	// 设计稿全屏 / 退出全屏图标的箭头位于左上与右下，与 lucide 方向相反，水平镜像
	const iconClassName = mirrored ? "-scale-x-100" : undefined;
	return (
		<Tooltip title={title} placement="top">
			<button
				type="button"
				aria-label={title}
				disabled={disabled}
				onClick={onClick}
				className={cn(
					"flex size-6 items-center justify-center border-none bg-transparent p-0 text-[#323233] transition-colors",
					disabled
						? "cursor-not-allowed opacity-40"
						: "cursor-pointer hover:text-[#5CA7FF] active:text-[#0062D6]",
				)}
			>
				<Icon
					style={{ width: iconSize, height: iconSize }}
					strokeWidth={1.6}
					className={iconClassName}
				/>
			</button>
		</Tooltip>
	);
}

interface DetailToolbarProps {
	/** 是否全屏 */
	fullscreen: boolean;
	/** 是否可下载 */
	downloadable: boolean;
	/** 下载中 */
	downloading?: boolean;
	/** 下载 */
	onDownload: () => void;
	/** 切换全屏 */
	onToggleFullscreen: () => void;
	/** 关闭 */
	onClose: () => void;
}

/**
 * 详情工具栏：下载 / 全屏（退出全屏）/ 关闭，按钮 24px、间距 10px
 *
 * @param props - 组件属性
 * @param props.fullscreen - 是否全屏
 * @param props.downloadable - 是否可下载
 * @param props.downloading - 下载中
 * @param props.onDownload - 下载
 * @param props.onToggleFullscreen - 切换全屏
 * @param props.onClose - 关闭
 * @returns 工具栏
 *
 * @since 2026-11-16
 */
export function DetailToolbar({
	fullscreen,
	downloadable,
	downloading,
	onDownload,
	onToggleFullscreen,
	onClose,
}: DetailToolbarProps) {
	return (
		<div className="flex shrink-0 items-center gap-2.5">
			<ToolbarButton
				title="下载"
				icon={Download}
				disabled={!downloadable || downloading}
				onClick={onDownload}
			/>
			<ToolbarButton
				title={fullscreen ? "退出全屏" : "全屏"}
				icon={fullscreen ? Minimize2 : Maximize2}
				iconSize={20}
				mirrored
				onClick={onToggleFullscreen}
			/>
			<ToolbarButton title="关闭" icon={CircleX} onClick={onClose} />
		</div>
	);
}
