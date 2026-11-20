import type { KeyboardEvent, SyntheticEvent } from "react";

import { cn } from "#src/utils";
import { Tooltip } from "antd";
import { useState } from "react";

interface SortNoBoxProps {
	/** 述职顺序号，未排序时为空 */
	value?: number;
	/** 是否可编辑（仅在具体文件夹内可调整顺序） */
	editable: boolean;
	/** 不可编辑时的悬浮提示 */
	disabledTip?: string;
	/** 提交新序号（从 1 开始，已去掉未变化的情况） */
	onCommit: (position: number) => void;
}

/** 阻止事件冒泡：序号框区域不触发展开详情与卡片拖拽 */
const stop = (event: SyntheticEvent) => event.stopPropagation();

/**
 * 述职顺序号框（设计稿 24 左栏）
 *
 * 默认：#F5F7FA 底、#EBEEF5 描边；悬浮：#5CA7FF 描边；点击：#0075FF 描边并进入输入态；
 * 输入：宽度随位数自适应（1 位 / 3 位见设计稿 30 / 31），回车或失焦提交，Esc 取消。
 *
 * @param props - 组件属性
 * @param props.value - 述职顺序号
 * @param props.editable - 是否可编辑
 * @param props.disabledTip - 不可编辑时的悬浮提示
 * @param props.onCommit - 提交新序号
 * @returns 序号框
 *
 * @since 2026-11-20
 */
export function SortNoBox({ value, editable, disabledTip, onCommit }: SortNoBoxProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const boxClass =
		"inline-flex h-[26px] min-w-[26px] shrink-0 items-center justify-center rounded-sm border border-solid px-[5px] text-xl leading-[26px] text-[#323233]";

	const commit = () => {
		const next = Number(draft);
		setDraft(null);
		if (draft && Number.isInteger(next) && next > 0 && next !== value) {
			onCommit(next);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		event.stopPropagation();
		if (event.key === "Enter") {
			commit();
		} else if (event.key === "Escape") {
			setDraft(null);
		}
	};

	if (draft !== null) {
		return (
			<input
				autoFocus
				aria-label="述职顺序"
				inputMode="numeric"
				value={draft}
				onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
				onBlur={commit}
				onKeyDown={handleKeyDown}
				onClick={stop}
				onPointerDown={stop}
				className={cn(boxClass, "border-[#0075FF] bg-white font-[inherit] outline-none")}
				style={{ width: `calc(${Math.max(draft.length, 1)}ch + 12px)` }}
			/>
		);
	}

	const box = (
		<span
			role={editable ? "button" : undefined}
			tabIndex={editable ? 0 : undefined}
			onPointerDown={editable ? stop : undefined}
			onClick={(event) => {
				if (!editable) {
					return;
				}
				event.stopPropagation();
				setDraft(value ? String(value) : "");
			}}
			onKeyDown={(event) => {
				if (editable && event.key === "Enter") {
					event.stopPropagation();
					setDraft(value ? String(value) : "");
				}
			}}
			className={cn(
				boxClass,
				"border-[#EBEEF5] bg-[#F5F7FA] transition-colors",
				editable && "cursor-text hover:border-[#5CA7FF]",
			)}
		>
			{value ?? "-"}
		</span>
	);

	return editable || !disabledTip ? box : <Tooltip title={disabledTip}>{box}</Tooltip>;
}
