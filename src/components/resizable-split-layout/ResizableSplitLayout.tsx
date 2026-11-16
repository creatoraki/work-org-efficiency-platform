import type { CSSProperties, ReactNode } from "react";

import { cn } from "#src/utils/cn";
import { GripVertical } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

export interface ResizableSplitLayoutProps {
	/** 左侧内容 */
	left: ReactNode;
	/** 右侧内容 */
	right: ReactNode;
	/** Group id，用于 react-resizable-panels 与布局缓存 */
	groupId: string;
	leftPanelId: string;
	rightPanelId: string;
	/** 是否持久化分栏比例 */
	persistLayout?: boolean;
	/** 左栏默认占比（0–100） */
	defaultLeftSize?: number;
	/** Group 容器 className，由场景自行决定高度与对齐方式 */
	groupClassName?: string;
	/** Group 容器 style，用于覆盖 react-resizable-panels 默认高度等内联样式 */
	groupStyle?: CSSProperties;
	/** 左右 Panel 公共 className */
	panelClassName?: string;
	/** 左右 Panel 内容包裹层公共 className */
	panelContentClassName?: string;
	/** 中间拖拽分隔条 className */
	separatorClassName?: string;
}

const LAYOUT_STORAGE_PREFIX = "resizable-split-layout";

/**
 * 读取本地缓存的双栏布局比例。
 */
function readStoredLayout(
	storageKey: string,
	leftPanelId: string,
	rightPanelId: string,
): Record<string, number> | undefined {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) {
			return undefined;
		}
		const parsed = JSON.parse(raw) as Record<string, number>;
		if (typeof parsed[leftPanelId] === "number" && typeof parsed[rightPanelId] === "number") {
			return parsed;
		}
	} catch {
		// 忽略损坏的缓存
	}
	return undefined;
}

/**
 * 分隔条拖拽把手。
 */
function ResizeHandle() {
	return (
		<div
			className={cn("flex h-14 w-7 items-center justify-center rounded-full text-[#909399]")}
			aria-hidden
		>
			<GripVertical className="size-4" strokeWidth={2} />
		</div>
	);
}

/**
 * 左右可拖拽分栏布局。
 * 纯布局组件，不包含业务语义。
 *
 * @param props - 组件属性
 * @param props.left - 左侧内容
 * @param props.right - 右侧内容
 * @param props.groupId - Group id
 * @param props.leftPanelId - 左 Panel id
 * @param props.rightPanelId - 右 Panel id
 * @param props.persistLayout - 是否持久化分栏比例
 * @param props.defaultLeftSize - 左栏默认占比
 * @param props.groupClassName - Group 容器 className
 * @param props.groupStyle - Group 容器 style
 * @param props.panelClassName - 左右 Panel 公共 className
 * @param props.panelContentClassName - 左右 Panel 内容包裹层公共 className
 * @param props.separatorClassName - 中间拖拽分隔条 className
 * @returns 可拖拽双栏布局
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function ResizableSplitLayout({
	left,
	right,
	groupId,
	leftPanelId,
	rightPanelId,
	persistLayout = true,
	defaultLeftSize = 50,
	groupClassName,
	groupStyle,
	panelClassName,
	panelContentClassName,
	separatorClassName,
}: ResizableSplitLayoutProps) {
	const storageKey = `${LAYOUT_STORAGE_PREFIX}:${groupId}`;
	const defaultRightSize = 100 - defaultLeftSize;

	const defaultLayout = useMemo(
		() => ({
			[leftPanelId]: defaultLeftSize,
			[rightPanelId]: defaultRightSize,
		}),
		[leftPanelId, rightPanelId, defaultLeftSize, defaultRightSize],
	);
	const storedLayout = persistLayout
		? readStoredLayout(storageKey, leftPanelId, rightPanelId)
		: undefined;

	const handleLayoutChanged = useCallback(
		(layout: Record<string, number>) => {
			if (!persistLayout) {
				return;
			}
			try {
				localStorage.setItem(storageKey, JSON.stringify(layout));
			} catch {
				// 忽略存储失败
			}
		},
		[persistLayout, storageKey],
	);

	return (
		<Group
			id={groupId}
			className={groupClassName}
			style={groupStyle}
			defaultLayout={storedLayout ?? defaultLayout}
			onLayoutChanged={handleLayoutChanged}
		>
			<Panel
				id={leftPanelId}
				defaultSize={defaultLayout[leftPanelId]}
				minSize={18}
				className={panelClassName}
			>
				<div className={panelContentClassName}>{left}</div>
			</Panel>

			<Separator
				className={cn(
					"relative z-10 flex w-5 items-center justify-center self-stretch bg-transparent",
					separatorClassName,
				)}
			>
				<ResizeHandle />
			</Separator>

			<Panel
				id={rightPanelId}
				defaultSize={defaultLayout[rightPanelId]}
				minSize={28}
				className={panelClassName}
			>
				<div className={panelContentClassName}>{right}</div>
			</Panel>
		</Group>
	);
}
