import type { PopoverProps } from "antd";
import type { ReactNode } from "react";
import { DownOutlined } from "@ant-design/icons";
import { Button, Popover, Tooltip } from "antd";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type OverflowMode = "expand" | "popover";

/** 展开收起配置 */
export interface ExpandConfig {
	/** 展开按钮文本，默认 "展开" */
	expandText?: string;
	/** 收起按钮文本，默认 "收起" */
	collapseText?: string;
	/** 展开/收起状态变化回调 */
	onExpandChange?: (expanded: boolean) => void;
}

/** Popover 配置 */
export interface PopoverConfig {
	/** Popover 触发方式：'click' 点击触发，'hover' 悬浮触发，默认 'click' */
	trigger?: "click" | "hover";
	/** Popover 标题 */
	title?: ReactNode;
	/** Popover 组件的额外配置 */
	props?: Omit<PopoverProps, "content" | "trigger" | "title">;
	/** 自定义溢出标签渲染函数，默认显示 "+N" 格式 */
	overflowRender?: (omittedValues: string[], restCount: number) => ReactNode;
}

export interface TagListProps {
	/** 标签列表 */
	tags: string[];
	/** 标签样式类名 */
	tagClassName?: string;
	/** 标签间距（gap），默认 8px */
	gap?: number;
	/** 最大显示行数，默认 1（单行显示） */
	maxRows?: number;
	/** 最大显示数量（当设置 maxRows 时，此选项无效） */
	maxCount?: number;
	/** 空状态文本，默认 "暂无" */
	emptyText?: ReactNode;
	/** 是否禁用展开功能 */
	disabled?: boolean;
	/** 自定义标签渲染函数 */
	renderTag?: (tag: string, index: number) => ReactNode;
	/** 溢出模式：'expand' 展开收起模式，'popover' Popover 悬浮显示模式，默认 'expand' */
	overflowMode?: OverflowMode;
	/** 展开收起配置（仅在 overflowMode='expand' 时生效） */
	expand?: ExpandConfig;
	/** Popover 配置（仅在 overflowMode='popover' 时生效） */
	popover?: PopoverConfig;
}

/**
 * 标签组件（带省略号处理）
 */
function TagWithEllipsis({ tag, className }: { tag: string; className: string }) {
	const tagRef = useRef<HTMLSpanElement>(null);
	const [showTooltip, setShowTooltip] = useState(false);

	// 检测文本是否溢出
	useEffect(() => {
		if (tagRef.current) {
			const element = tagRef.current;
			setShowTooltip(element.scrollWidth > element.clientWidth);
		}
	}, [tag]);

	const tagElement = (
		<span
			ref={tagRef}
			className={`${className} inline-block flex-shrink-0 whitespace-nowrap`}
			style={{
				maxWidth: "200px",
				overflow: "hidden",
				textOverflow: "ellipsis",
			}}
		>
			{tag}
		</span>
	);

	if (showTooltip) {
		return (
			<Tooltip title={tag} placement="top">
				{tagElement}
			</Tooltip>
		);
	}

	return tagElement;
}

/**
 * 标签列表组件
 * 支持单行/多行显示，自动检测容器宽度，动态计算最多可显示的标签数量
 * 超出部分可通过展开收起或 Popover 显示
 *
 * @example
 * ```tsx
 * // 单行显示（默认展开收起模式）
 * <TagList tags={['标签1', '标签2', '标签3']} />
 *
 * // 默认显示两行
 * <TagList tags={tags} maxRows={2} />
 *
 * // 最大显示数量
 * <TagList tags={tags} maxCount={5} />
 *
 * // 使用展开收起模式（自定义文本）
 * <TagList
 *   tags={tags}
 *   overflowMode="expand"
 *   expand={{
 *     expandText: "查看更多",
 *     collapseText: "收起",
 *     onExpandChange: (expanded) => console.log(expanded)
 *   }}
 * />
 *
 * // 使用 Popover 模式（点击触发，默认显示 +N 格式）
 * <TagList
 *   tags={tags}
 *   overflowMode="popover"
 *   popover={{ trigger: "click" }}
 * />
 *
 * // 使用 Popover 模式（悬浮触发，自定义溢出标签）
 * <TagList
 *   tags={tags}
 *   overflowMode="popover"
 *   popover={{
 *     trigger: "hover",
 *     title: "全部标签",
 *     overflowRender: (omittedValues, restCount) => (
 *       <span className="tag">+{restCount} 个标签</span>
 *     )
 *   }}
 * />
 * ```
 */
export default function TagList({
	tags = [],
	tagClassName = "text-xs px-2 rounded bg-[#EBEEF5] text-[#323233] flex-shrink-0 whitespace-nowrap inline-block",
	gap = 8,
	maxRows = 1,
	maxCount,
	emptyText = "暂无",
	disabled = false,
	renderTag,
	overflowMode = "expand",
	expand,
	popover,
}: TagListProps) {
	// 展开收起配置
	const expandConfig = expand || {};
	const { expandText = "展开", collapseText = "收起", onExpandChange } = expandConfig;

	// Popover 配置
	const popoverConfig = popover || {};
	const {
		trigger: popoverTrigger = "click",
		title: popoverTitle,
		props: popoverProps,
		overflowRender,
	} = popoverConfig;

	const isPopoverMode = overflowMode === "popover";
	const [isExpanded, setIsExpanded] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const tagsContainerRef = useRef<HTMLDivElement>(null);
	const [visibleCount, setVisibleCount] = useState<number>(tags.length);
	const buttonMeasureRef = useRef<HTMLDivElement>(null);

	// 计算多行显示时最多能显示的标签数量
	const calculateOpenCountByRows = useCallback(() => {
		if (!containerRef.current || !measureRef.current || tags.length === 0 || maxRows <= 0) {
			setVisibleCount(tags.length);
			return;
		}

		const measureContainer = measureRef.current;
		const tagElements = measureContainer.children;

		if (tagElements.length === 0) {
			setVisibleCount(tags.length);
			return;
		}

		const containerWidth = containerRef.current.getBoundingClientRect().width;

		// 获取展开按钮的宽度
		// Popover 模式下使用 +N 格式，宽度更小，使用估算值
		let expandButtonWidth = 0;
		if (isPopoverMode) {
			// Popover 模式下，+N 标签大约 40-50px
			expandButtonWidth = 50;
		} else if (buttonMeasureRef.current) {
			expandButtonWidth = buttonMeasureRef.current.getBoundingClientRect().width + gap;
		} else {
			expandButtonWidth = 60;
		}

		// 计算每个标签的宽度
		const tagWidths: number[] = [];
		for (let i = 0; i < tagElements.length; i++) {
			const tagElement = tagElements[i] as HTMLElement;
			const tagWidth = tagElement.getBoundingClientRect().width;
			tagWidths.push(tagWidth + gap);
		}

		// 模拟布局，计算每行的标签
		let visibleCount = 0;
		let currentRow = 0;
		let currentRowWidth = 0;

		for (let i = 0; i < tagWidths.length; i++) {
			const tagWidth = tagWidths[i];
			const isLastTag = i === tagWidths.length - 1;
			const needButton = !isLastTag && currentRow === maxRows - 1;
			const requiredWidth = currentRowWidth + tagWidth + (needButton ? expandButtonWidth : 0);

			// 如果当前行放不下，换行
			if (requiredWidth > containerWidth && currentRowWidth > 0) {
				currentRow++;
				currentRowWidth = tagWidth;

				// 如果超出最大行数，停止
				if (currentRow >= maxRows) {
					break;
				}

				// 检查新行是否能放下当前标签
				const needButtonNewRow = !isLastTag && currentRow === maxRows - 1;
				if (tagWidth + (needButtonNewRow ? expandButtonWidth : 0) <= containerWidth) {
					visibleCount++;
				} else {
					// 如果新行也放不下，至少显示一个
					if (visibleCount === 0) {
						visibleCount = 1;
					}
					break;
				}
			} else {
				// 当前行可以放下
				currentRowWidth += tagWidth;
				visibleCount++;
			}
		}

		setVisibleCount(visibleCount);
	}, [tags.length, gap, maxRows, isPopoverMode]);

	// 计算单行最多能显示的标签数量
	const calculateOpenCountByWidth = useCallback(() => {
		if (!containerRef.current || !measureRef.current || tags.length === 0) {
			setVisibleCount(maxCount || tags.length);
			return;
		}

		const containerWidth = containerRef.current.getBoundingClientRect().width;
		const measureContainer = measureRef.current;
		const tagElements = measureContainer.children;

		if (tagElements.length === 0) {
			setVisibleCount(maxCount || tags.length);
			return;
		}

		// 计算每个标签的宽度（包含 gap）
		const tagWidths: number[] = [];
		for (let i = 0; i < tagElements.length; i++) {
			const tagElement = tagElements[i] as HTMLElement;
			const tagWidth = tagElement.getBoundingClientRect().width;
			tagWidths.push(tagWidth + gap);
		}

		// 获取展开按钮的宽度（从隐藏的测量按钮获取）
		// Popover 模式下使用 +N 格式，宽度更小，使用估算值
		let expandButtonWidth = 0;
		if (isPopoverMode) {
			// Popover 模式下，+N 标签大约 40-50px
			expandButtonWidth = 50;
		} else if (buttonMeasureRef.current) {
			expandButtonWidth = buttonMeasureRef.current.getBoundingClientRect().width + gap;
		} else {
			expandButtonWidth = 60;
		}

		// 计算最多能显示的标签数量
		let totalWidth = 0;
		let count = 0;
		const maxCountLimit = maxCount || tagWidths.length;

		for (let i = 0; i < Math.min(tagWidths.length, maxCountLimit); i++) {
			const currentTagWidth = tagWidths[i];
			const needButton = i < tagWidths.length - 1 && i < maxCountLimit - 1;
			const requiredWidth =
				totalWidth + currentTagWidth + (needButton ? expandButtonWidth : 0);

			if (requiredWidth <= containerWidth) {
				totalWidth += currentTagWidth;
				count++;
			} else {
				if (count === 0) {
					count = 1;
				}
				break;
			}
		}

		// 如果设置了 maxCount，则取较小值
		setVisibleCount(Math.min(count, maxCountLimit));
	}, [tags.length, gap, maxCount, isPopoverMode]);

	// 根据 maxRows 选择计算方式
	const calculateOpenCount = maxRows > 1 ? calculateOpenCountByRows : calculateOpenCountByWidth;

	// 使用 useLayoutEffect 在 DOM 更新后立即测量（避免闪烁）
	useLayoutEffect(() => {
		if (tags.length === 0) {
			setVisibleCount(0);
			return;
		}

		// 延迟一帧确保 DOM 已渲染
		requestAnimationFrame(() => {
			calculateOpenCount();
		});
	}, [tags, tagClassName, gap, maxRows, maxCount, calculateOpenCount]);

	// 监听容器大小变化
	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			calculateOpenCount();
		});

		resizeObserver.observe(containerRef.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, [calculateOpenCount]);

	// 切换展开/收起
	const handleToggle = () => {
		const newExpanded = !isExpanded;
		setIsExpanded(newExpanded);
		onExpandChange?.(newExpanded);
	};

	if (tags.length === 0) {
		return <span className={tagClassName}>{emptyText}</span>;
	}

	// 展开时显示所有标签
	const visibleTags = isExpanded ? tags : tags.slice(0, visibleCount);
	const hiddenTags = tags.slice(visibleCount);
	const hasHiddenTags = hiddenTags.length > 0 && !disabled;

	// 默认标签渲染函数（带省略号处理）
	const defaultRenderTag = (tag: string, index: number) => (
		<TagWithEllipsis key={index} tag={tag} className={tagClassName} />
	);

	const renderTagFunc = renderTag || defaultRenderTag;

	// Popover 内容（显示所有标签，不仅仅是隐藏的）
	const popoverContent = (
		<div
			className="flex flex-wrap items-center gap-2"
			style={{ gap: `${gap}px`, maxWidth: "400px" }}
		>
			{tags.map((tag, index) => renderTagFunc(tag, index))}
		</div>
	);

	// 溢出标签渲染（默认显示 "+N" 格式）
	const renderOverflowTag = () => {
		if (overflowRender) {
			return overflowRender(hiddenTags, hiddenTags.length);
		}
		// 默认显示 "+N" 格式
		return (
			<span className={`${tagClassName} flex-shrink-0 cursor-pointer whitespace-nowrap`}>
				+{hiddenTags.length}
			</span>
		);
	};

	// 展开按钮组件
	const renderExpandButton = () => {
		if (!hasHiddenTags) {
			return null;
		}

		// Popover 模式
		if (isPopoverMode) {
			const overflowTag = renderOverflowTag();
			return (
				<Popover
					content={popoverContent}
					title={popoverTitle}
					trigger={popoverTrigger}
					placement="bottomLeft"
					{...popoverProps}
				>
					{overflowTag}
				</Popover>
			);
		}

		// 展开收起模式
		return (
			<Button
				type="text"
				size="small"
				onClick={handleToggle}
				disabled={disabled}
				className="flex h-auto flex-shrink-0 items-center gap-1 rounded-md px-2 text-xs text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 active:text-blue-800"
			>
				<span>{expandText}</span>
				<DownOutlined className="transition-transform" />
			</Button>
		);
	};

	// 收起按钮组件
	const renderCollapseButton = () => {
		if (!isPopoverMode && isExpanded && hasHiddenTags) {
			return (
				<Button
					type="text"
					size="small"
					onClick={handleToggle}
					disabled={disabled}
					className="flex h-auto flex-shrink-0 items-center gap-1 rounded-md px-2 text-xs text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 active:text-blue-800"
				>
					<span>{collapseText}</span>
					<DownOutlined className="rotate-180 transition-transform" />
				</Button>
			);
		}
		return null;
	};

	return (
		<div ref={containerRef} className="relative w-full">
			{/* 隐藏的测量容器，用于测量每个标签的实际宽度 */}
			<div
				ref={measureRef}
				className="invisible absolute flex items-center"
				style={{
					gap: `${gap}px`,
					flexWrap: maxRows > 1 ? "wrap" : "nowrap",
				}}
			>
				{tags.map((tag, index) => renderTagFunc(tag, index))}
			</div>

			{/* 隐藏的测量按钮，用于测量展开按钮的宽度 */}
			<div ref={buttonMeasureRef} className="invisible absolute">
				<Button
					type="text"
					size="small"
					className="flex h-auto flex-shrink-0 items-center gap-1 rounded-md px-2 text-xs text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 active:text-blue-800"
				>
					<span>{expandText}</span>
					<DownOutlined className="transition-transform" />
				</Button>
			</div>

			{/* 标签和按钮容器 - 按钮紧跟在标签后面 */}
			<div
				ref={tagsContainerRef}
				className={`flex items-center ${isExpanded || maxRows > 1 ? "flex-wrap" : "overflow-hidden"}`}
				style={{ gap: `${gap}px` }}
			>
				{visibleTags.map((tag, index) => renderTagFunc(tag, index))}

				{/* 展开按钮 */}
				{!isExpanded && renderExpandButton()}

				{/* 收起按钮（仅展开收起模式） */}
				{renderCollapseButton()}
			</div>
		</div>
	);
}
