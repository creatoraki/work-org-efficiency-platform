import AiIcon from "#src/assets/svg/ai-icon.svg?react";
import { CloseOutlined } from "@ant-design/icons";
import { Button, theme } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * AI 智能标签可滚动 Tabs 展示项。
 */
export interface AiTagScrollTabItem {
	/** 临时唯一标识 */
	tempId: string;
	/** 标签名称 */
	tagName?: string;
	/** 是否为已存在标签 */
	isExisting?: boolean;
	/** 错误数量 */
	errorCount?: number;
}

/**
 * AI 智能标签可滚动 Tabs 组件属性。
 */
export interface AiTagScrollTabsProps {
	/** 标签列表 */
	tabs: AiTagScrollTabItem[];
	/** 当前激活标签 key */
	activeKey: string;
	/** 切换标签回调 */
	onChange: (key: string) => void;
	/** 删除标签回调 */
	onRemove: (tempId: string) => void;
	/** 重新向 AI 描述标签回调 */
	onStartAiDescription: () => void;
}

const SCROLL_ARROW_BUTTON_CLASS =
	"pointer-events-auto border border-[#d9d9d9] bg-white text-[#606266] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1677ff]/20";

/**
 * AI 智能标签可滚动 Tabs。
 *
 * 标签过多时左右箭头控制横向滚动：最左侧仅显示右箭头，中间显示双箭头，最右侧仅显示左箭头。
 *
 * @param props - 组件属性
 * @param props.tabs - 标签列表
 * @param props.activeKey - 当前激活标签 key
 * @param props.onChange - 切换标签回调
 * @param props.onRemove - 删除标签回调
 * @param props.onStartAiDescription - 重新向 AI 描述标签回调
 * @returns 可滚动 Tabs 组件
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function AiTagScrollTabs({
	tabs,
	activeKey,
	onChange,
	onRemove,
	onStartAiDescription,
}: AiTagScrollTabsProps) {
	const { token } = theme.useToken();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [hasOverflow, setHasOverflow] = useState(false);

	const checkScrollStatus = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			setHasOverflow(false);
			return;
		}

		const { scrollLeft, scrollWidth, clientWidth } = container;
		const maxScrollLeft = scrollWidth - clientWidth;
		setHasOverflow(maxScrollLeft > 4);
		setCanScrollLeft(scrollLeft > 4);
		setCanScrollRight(maxScrollLeft - scrollLeft > 4);
	}, []);

	const handleScroll = useCallback((direction: "left" | "right") => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		const distance = Math.max(container.clientWidth * 0.72, 160);
		container.scrollBy({
			left: direction === "left" ? -distance : distance,
			behavior: "smooth",
		});
	}, []);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}

		checkScrollStatus();
		container.addEventListener("scroll", checkScrollStatus, { passive: true });

		const resizeObserver = new ResizeObserver(() => {
			checkScrollStatus();
		});
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener("scroll", checkScrollStatus);
			resizeObserver.disconnect();
		};
	}, [checkScrollStatus, tabs.length]);

	useEffect(() => {
		const activeTab = tabRefs.current[activeKey];
		activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
		checkScrollStatus();
	}, [activeKey, checkScrollStatus, tabs.length]);

	return (
		<div className="mb-4 border-b border-[#f0f0f0]">
			<div className="flex h-10 items-center gap-2">
				<div className="relative h-10 min-w-0 flex-1">
					<div
						ref={scrollContainerRef}
						className="scrollbar-hide flex h-10 items-stretch gap-2 overflow-x-auto"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{tabs.map((tab) => {
							const isActive = tab.tempId === activeKey;
							return (
								<div
									key={tab.tempId}
									ref={(node) => {
										tabRefs.current[tab.tempId] = node;
									}}
									className="relative flex h-10 shrink-0 cursor-pointer items-center gap-1 px-2 transition-colors duration-200"
									style={{
										color: isActive
											? token.colorPrimary
											: token.colorTextSecondary,
										fontWeight: isActive ? 500 : 400,
									}}
									onClick={() => onChange(tab.tempId)}
								>
									<span className="whitespace-nowrap leading-none">
										{tab.tagName}
										{tab.isExisting && "(已有)"}
									</span>
									<span
										className="ml-0.5 inline-flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded-[5px] transition-colors duration-200 hover:text-red-500"
										style={{
											color: isActive
												? token.colorPrimary
												: token.colorTextTertiary,
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.backgroundColor =
												token.colorFillSecondary;
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.backgroundColor = "transparent";
										}}
										onClick={(e) => {
											e.stopPropagation();
											onRemove(tab.tempId);
										}}
									>
										<CloseOutlined className="text-[10px] leading-none" />
									</span>
									<span
										className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full"
										style={{
											backgroundColor: isActive
												? token.colorPrimary
												: "transparent",
										}}
									/>
								</div>
							);
						})}
					</div>

					{canScrollLeft && (
						<div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-gradient-to-r from-white via-white/95 to-transparent pr-3">
							<Button
								type="text"
								shape="circle"
								size="small"
								icon={<ChevronLeft size={14} strokeWidth={2} />}
								className={SCROLL_ARROW_BUTTON_CLASS}
								aria-label="向左滚动标签"
								onClick={() => handleScroll("left")}
							/>
						</div>
					)}

					{hasOverflow && (
						<div
							className={`pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-gradient-to-l from-white via-white/95 to-transparent pl-3 ${canScrollRight ? "" : "invisible"}`}
						>
							<Button
								type="text"
								shape="circle"
								size="small"
								icon={<ChevronRight size={14} strokeWidth={2} />}
								className={SCROLL_ARROW_BUTTON_CLASS}
								aria-label="向右滚动标签"
								onClick={() => handleScroll("right")}
							/>
						</div>
					)}
				</div>

				<div className="flex h-10 shrink-0 items-center gap-1">
					<span
						onClick={onStartAiDescription}
						className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap px-1 text-[13px] leading-none"
						style={{ color: token.colorPrimary, fontWeight: 500 }}
					>
						<AiIcon className="h-4 w-4 shrink-0" />
						重新向AI描述标签
					</span>
				</div>
			</div>
		</div>
	);
}
