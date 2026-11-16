/**
 * 任务标签页组件
 * 用于显示和管理多个转派任务
 */

import { cn } from "#src/utils/cn";
import { CloseOutlined, LeftOutlined, PlusOutlined, RightOutlined } from "@ant-design/icons";
import { Badge, Button, theme } from "antd";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * 任务标签页属性接口
 */
interface TaskTabsProps {
	/** Form.List 的 fields */
	fields: Array<{ key: React.Key; name: number }>;
	/** 当前激活的任务索引 */
	activeTaskIndex: number;
	/** 设置激活任务索引 */
	setActiveTaskIndex: (index: number) => void;
	/** 校验任务是否有效 */
	validateTask: (index: number) => boolean;
	/** 添加任务 */
	onAdd: () => void;
	/** 删除任务 */
	onRemove: (name: number, index: number) => void;
}

/**
 * 任务标签页组件
 *
 * @param props - 组件属性
 */
export function TaskTabs({
	fields,
	activeTaskIndex,
	setActiveTaskIndex,
	validateTask,
	onAdd,
	onRemove,
}: TaskTabsProps) {
	const { token } = theme.useToken();
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(false);
	const [isOverflowing, setIsOverflowing] = useState(false);
	const shouldScrollToEndRef = useRef(false);
	const prevFieldsLengthRef = useRef(fields.length);

	/**
	 * 检查滚动状态
	 */
	const checkScrollStatus = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			setIsOverflowing(false);
			return;
		}
		const { scrollLeft, scrollWidth, clientWidth } = container;
		const overflowing = scrollWidth > clientWidth;
		setIsOverflowing(overflowing);
		setCanScrollLeft(scrollLeft > 0);
		setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
	}, []);

	/**
	 * 添加拉动动画
	 *
	 * @param direction - 拉动方向
	 */
	const addShakeAnimation = useCallback((direction: "left" | "right") => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}
		// 移除之前的动画类
		container.classList.remove("shake-left", "shake-right");
		// 添加新的动画类
		container.classList.add(`shake-${direction}`);
		// 动画结束后移除类
		setTimeout(() => {
			container.classList.remove(`shake-${direction}`);
		}, 500);
	}, []);

	/**
	 * 处理左滚动
	 */
	const handleScrollLeft = useCallback(() => {
		const container = scrollContainerRef.current;
		if (container) {
			if (canScrollLeft) {
				container.scrollBy({ left: -200, behavior: "smooth" });
			} else {
				// 已经在最左侧，添加拉动动画
				addShakeAnimation("left");
			}
		}
	}, [canScrollLeft, addShakeAnimation]);

	/**
	 * 处理右滚动
	 */
	const handleScrollRight = useCallback(() => {
		const container = scrollContainerRef.current;
		if (container) {
			if (canScrollRight) {
				container.scrollBy({ left: 200, behavior: "smooth" });
			} else {
				// 已经在最右侧，添加拉动动画
				addShakeAnimation("right");
			}
		}
	}, [canScrollRight, addShakeAnimation]);

	/**
	 * 处理鼠标滚轮水平滚动
	 *
	 * @param e - 滚轮事件
	 */
	const handleWheel = useCallback((e: WheelEvent) => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}
		// 检查是否有水平滚动空间
		const { scrollWidth, clientWidth } = container;
		const canScrollHorizontally = scrollWidth > clientWidth;
		// 如果 deltaY 不为 0 且可以水平滚动，则转换为水平滚动
		if (e.deltaY !== 0 && canScrollHorizontally) {
			// 将垂直滚动转换为水平滚动
			container.scrollLeft += e.deltaY;
			// 阻止默认的垂直滚动行为
			e.preventDefault();
		}
	}, []);

	// 监听滚动和鼠标滚轮
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) {
			return;
		}
		checkScrollStatus();
		container.addEventListener("scroll", checkScrollStatus, { passive: true });
		container.addEventListener("wheel", handleWheel, { passive: false });
		const resizeObserver = new ResizeObserver(() => {
			checkScrollStatus();
		});
		resizeObserver.observe(container);
		return () => {
			container.removeEventListener("scroll", checkScrollStatus);
			container.removeEventListener("wheel", handleWheel);
			resizeObserver.disconnect();
		};
	}, [checkScrollStatus, handleWheel, fields.length]);

	/**
	 * 处理删除任务
	 *
	 * @param e - 鼠标事件
	 * @param name - 任务名称（索引）
	 * @param index - 任务索引
	 */
	const handleRemove = useCallback(
		(e: React.MouseEvent, name: number, index: number) => {
			e.stopPropagation();
			// 如果删除后没有任务了，创建一个新任务
			if (fields.length === 1) {
				onRemove(name, index);
				onAdd();
				setActiveTaskIndex(0);
				return;
			}
			// 如果删除的是当前激活的任务，需要确定新的激活索引
			if (activeTaskIndex === index) {
				// 如果删除的不是第一个任务，激活前一个任务
				if (index > 0) {
					setActiveTaskIndex(index - 1);
				}
				// 如果删除的是第一个任务，删除后新的第一个任务索引仍然是0
				else {
					setActiveTaskIndex(0);
				}
			}
			// 如果删除的是当前激活任务之前的任务，需要调整激活索引
			else if (activeTaskIndex > index) {
				setActiveTaskIndex(activeTaskIndex - 1);
			}
			// 执行删除操作
			onRemove(name, index);
		},
		[activeTaskIndex, fields.length, onAdd, onRemove, setActiveTaskIndex],
	);

	/**
	 * 处理添加任务
	 */
	const handleAdd = useCallback(() => {
		onAdd();
		setActiveTaskIndex(fields.length);
		// 标记需要滚动到最右侧
		shouldScrollToEndRef.current = true;
	}, [fields.length, onAdd, setActiveTaskIndex]);

	// 监听 fields 变化，在渲染完成后立即滚动
	useLayoutEffect(() => {
		if (shouldScrollToEndRef.current && fields.length > prevFieldsLengthRef.current) {
			const container = scrollContainerRef.current;
			if (container) {
				// 使用 requestAnimationFrame 确保 DOM 已更新
				requestAnimationFrame(() => {
					container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
				});
			}
			shouldScrollToEndRef.current = false;
		}
		prevFieldsLengthRef.current = fields.length;
	}, [fields.length]);

	return (
		<div className="mb-6 border-b">
			<div className="relative flex items-center gap-2">
				{/* 左箭头 - 绝对定位，不占位，高度占满，背景不透明 */}
				<div
					className={cn(
						"absolute bottom-0 left-0 top-0 z-10 flex h-full items-center justify-center bg-white transition-all duration-300 ease-in-out",
						isOverflowing && canScrollLeft
							? "pointer-events-auto opacity-100"
							: "pointer-events-none opacity-0",
					)}
				>
					<span
						onClick={handleScrollLeft}
						className="mr-1 inline-flex cursor-pointer items-center rounded p-1 text-base transition-colors hover:bg-gray-100"
					>
						<LeftOutlined />
					</span>
				</div>

				{/* 标签页容器 */}
				<div
					ref={scrollContainerRef}
					className="scrollbar-hide flex flex-1 items-center gap-8 overflow-x-auto transition-transform duration-300 ease-out"
					style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
				>
					{fields.map((field, index) => {
						const isValid = validateTask(index);
						const isActive = activeTaskIndex === index;
						return (
							<div
								key={field.key}
								className="flex flex-shrink-0 cursor-pointer items-center gap-1 border-b-2 py-2 transition-colors"
								style={{
									borderBottomColor: isActive
										? token.colorPrimary
										: "transparent",
								}}
								onClick={() => setActiveTaskIndex(index)}
							>
								<Badge dot={!isValid} color="red">
									<span
										style={{
											color: isActive ? token.colorPrimary : undefined,
										}}
									>
										转派任务
										{index + 1}
									</span>
								</Badge>
								<Button
									type="text"
									size="small"
									icon={<CloseOutlined />}
									onClick={(e) => handleRemove(e, field.name, index)}
									className="ml-1 flex-shrink-0"
									style={{
										color: isActive ? token.colorPrimary : undefined,
										fontSize: 12,
									}}
								/>
							</div>
						);
					})}
				</div>

				{/* 右箭头 - 绝对定位，不占位，高度占满，背景不透明 */}
				<div
					className={cn(
						"absolute bottom-0 right-[78px] top-0 z-10 flex h-full items-center justify-center bg-white transition-all duration-300 ease-in-out",
						isOverflowing && canScrollRight
							? "pointer-events-auto opacity-100"
							: "pointer-events-none opacity-0",
					)}
				>
					<span
						onClick={handleScrollRight}
						className="ml-1 inline-flex cursor-pointer items-center rounded p-1 text-base transition-colors hover:bg-gray-100"
					>
						<RightOutlined />
					</span>
				</div>

				{/* 新增按钮 */}
				<div className="flex-shrink-0">
					<Button type="link" icon={<PlusOutlined />} onClick={handleAdd}>
						新增
					</Button>
				</div>
			</div>
		</div>
	);
}
