import type { ReactNode } from "react";

/**
 * 可折叠面板组件属性
 */
export interface CollapsiblePanelProps {
	/** 面板内容 */
	children: ReactNode;
	/** 初始是否折叠 */
	defaultCollapsed?: boolean;
	/** 面板宽度，支持数字(px)或字符串(带单位) */
	width?: number | string;
	/** 自定义类名 */
	className?: string;
	/** 折叠状态变化回调 */
	onCollapsedChange?: (isCollapsed: boolean) => void;
	/** 是否启用拖拽调整宽度功能 */
	resizable?: boolean;
	/** 最小宽度限制（像素） */
	minWidth?: number;
	/** 最大宽度限制（像素） */
	maxWidth?: number;
	/** 宽度变化回调 */
	onWidthChange?: (width: number) => void;
}

/**
 * 折叠切换按钮属性
 */
export interface CollapseToggleButtonProps {
	/** 是否已折叠 */
	isCollapsed: boolean;
	/** 点击切换回调 */
	onToggle: () => void;
}

/**
 * 拖拽调整宽度手柄属性
 */
export interface ResizeHandleProps {
	/** 是否正在拖拽 */
	isResizing: boolean;
	/** 鼠标按下回调 */
	onMouseDown: (e: React.MouseEvent) => void;
}

/**
 * useResize Hook 参数
 */
export interface UseResizeOptions {
	/** 初始宽度 */
	initialWidth: number;
	/** 最小宽度 */
	minWidth: number;
	/** 最大宽度 */
	maxWidth: number;
	/** 是否禁用拖拽 */
	disabled?: boolean;
	/** 宽度变化回调 */
	onWidthChange?: (width: number) => void;
}

/**
 * useResize Hook 返回值
 */
export interface UseResizeReturn {
	/** 当前宽度 */
	currentWidth: number;
	/** 是否正在拖拽 */
	isResizing: boolean;
	/** 鼠标按下处理函数 */
	handleMouseDown: (e: React.MouseEvent) => void;
	/** 设置宽度 */
	setWidth: (width: number) => void;
}
