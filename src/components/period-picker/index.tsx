import { PERIOD_ITEMS } from "#src/pages/strategy/target-management/constants/plan";
import { CloseCircleFilled, DownOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { AnimatePresence, motion } from "motion/react";
import React from "react";

// #region 类型定义
interface PeriodPickerProps {
	/** 当前选中值 [年份, 周期值] */
	value?: [number, number] | null;
	/** 值变化回调 */
	onChange?: (v: [number, number] | null) => void;
	/** 父级弹窗打开状态（用于重置年份） */
	parentOpen?: boolean;
	/** 是否无边框模式 */
	borderless?: boolean;
	/** 是否禁用 */
	disabled?: boolean;
	/** 是否允许清空 */
	allowClear?: boolean;
}
// #endregion

const PeriodPicker: React.FC<PeriodPickerProps> = ({
	value,
	onChange,
	parentOpen,
	borderless = false,
	disabled = false,
	allowClear = true,
}) => {
	// #region 状态管理
	const [openPanel, setOpenPanel] = React.useState(false);
	const [hovering, setHovering] = React.useState(false);
	const nowYear = new Date().getFullYear();
	const [year, setYear] = React.useState<number>(nowYear);
	// 动画方向：1 表示下一年（右滑），-1 表示上一年（左滑）
	const [direction, setDirection] = React.useState(0);
	// 内部选中状态 [year, period]
	const [selection, setSelection] = React.useState<[number, number] | null>(value ?? null);
	const triggerRef = React.useRef<HTMLDivElement | null>(null);
	// #endregion

	// #region 副作用
	// 当父级弹窗打开时，重置年份为当前年
	React.useEffect(() => {
		setYear(nowYear);
	}, [parentOpen, nowYear]);

	// 同步外部 value 到内部 selection
	React.useEffect(() => {
		if (Array.isArray(value) && value.length === 2) {
			setSelection([value[0], value[1]]);
			setYear(value[0]);
		} else if (value === null) {
			setSelection(null);
		}
	}, [value]);
	// #endregion

	// #region 事件处理
	const changeYear = (newYear: number) => {
		setDirection(newYear > year ? 1 : -1);
		setYear(newYear);
	};

	const handleSelect = (sel: { year: number; period: number }) => {
		if (disabled) return;
		const arr: [number, number] = [sel.year, sel.period];
		setSelection(arr);
		onChange?.(arr);
		setOpenPanel(false);
	};

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (disabled) return;
		setSelection(null);
		onChange?.(null);
	};
	// #endregion

	// #region 渲染辅助
	const displayLabel = () => {
		if (!selection) return "全部";
		const item = PERIOD_ITEMS.find((it) => it.value === selection[1]);
		return `${selection[0]}-${item ? item.label : selection[1]}`;
	};

	const animationVariants = {
		enter: (dir: number) => ({
			x: dir > 0 ? 240 : -240,
			opacity: 0,
		}),
		center: {
			x: 0,
			opacity: 1,
		},
		exit: (dir: number) => ({
			x: dir < 0 ? 240 : -240,
			opacity: 0,
		}),
	};

	const renderPanel = (
		<div className="w-[360px]">
			{/* 头部年份切换 */}
			<div className="flex items-center justify-between p-2">
				<button
					className="cursor-pointer rounded border border-transparent bg-white px-2 py-1 text-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:font-bold hover:text-white"
					onClick={() => changeYear(year - 1)}
				>
					{"<"}
				</button>
				<div className="relative h-6 w-24 overflow-hidden font-semibold">
					<AnimatePresence initial={false} custom={direction} mode="popLayout">
						<motion.div
							key={year}
							custom={direction}
							variants={animationVariants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.3 }}
							className="absolute inset-0 flex items-center justify-center"
						>
							{year} 年
						</motion.div>
					</AnimatePresence>
				</div>
				<button
					className="cursor-pointer rounded border border-transparent bg-white px-2 py-1 text-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:font-bold hover:text-white"
					onClick={() => changeYear(year + 1)}
				>
					{">"}
				</button>
			</div>

			<div className="my-2 h-px bg-[rgba(220,223,230,1)]" />

			{/* 周期选择网格 */}
			<div className="relative min-h-[160px] overflow-hidden">
				<AnimatePresence initial={false} custom={direction} mode="popLayout">
					<motion.div
						key={year}
						custom={direction}
						variants={animationVariants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={{ duration: 0.3 }}
						className="grid grid-cols-4 gap-2 p-2"
					>
						{PERIOD_ITEMS.map((it) => {
							const isSelected =
								selection?.[1] === it.value && selection?.[0] === year;
							return (
								<div key={it.value}>
									<div
										role="button"
										className={`cursor-pointer rounded border-2 py-2 text-center font-bold ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-transparent text-gray-700 hover:border-blue-500 hover:bg-gray-50"}`}
										onClick={() => handleSelect({ year, period: it.value })}
									>
										{it.label}
									</div>
								</div>
							);
						})}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
	// #endregion

	return (
		<Popover
			content={renderPanel}
			trigger="click"
			open={disabled ? false : openPanel}
			onOpenChange={(o) => !disabled && setOpenPanel(o)}
		>
			<div
				ref={triggerRef}
				role="button"
				onMouseEnter={() => setHovering(true)}
				onMouseLeave={() => setHovering(false)}
				onClick={() => !disabled && setOpenPanel(true)}
				className={`flex min-h-[32px] w-full items-center justify-between rounded px-[11px] py-1 transition-colors ${
					borderless ? "border-none" : "border border-[#d9d9d9]"
				} ${
					disabled
						? "cursor-not-allowed bg-[rgba(0,0,0,0.04)] text-[rgba(0,0,0,0.25)]"
						: "cursor-pointer bg-white text-inherit"
				}`}
			>
				<div
					className={
						!selection ? "text-[#bfbfbf]" : disabled ? "text-[rgba(0,0,0,0.25)]" : ""
					}
				>
					{displayLabel()}
				</div>
				{allowClear && selection && !disabled && hovering ? (
					<CloseCircleFilled
						className="text-[rgba(0,0,0,0.25)] transition-colors hover:text-[rgba(0,0,0,0.45)]"
						onClick={handleClear}
					/>
				) : (
					<DownOutlined
						className={disabled ? "text-[rgba(0,0,0,0.25)]" : "text-[rgba(0,0,0,0.25)]"}
					/>
				)}
			</div>
		</Popover>
	);
};

export { PeriodPicker };
export default PeriodPicker;
