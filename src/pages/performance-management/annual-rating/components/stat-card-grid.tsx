import type { ReactNode } from "react";

import { cn } from "#src/utils";

/** 单张统计卡片配置 */
export interface StatCardItem {
	/** 卡片标题 */
	title: string;
	/** 统计数值 */
	value: number;
	/** 右侧提示文案 */
	hint: string;
	/** 提示文案颜色 */
	hintColor: string;
	/** 右上角图标 */
	icon: ReactNode;
}

interface StatCardGridProps {
	/** 卡片数据 */
	items: StatCardItem[];
	/** 卡片间距类名 */
	className?: string;
	/** 是否补充隐藏占位以维持四列布局 */
	placeholder?: boolean;
}

/**
 * 年度评级统计卡片栅格。
 *
 * @param props - 组件属性
 * @param props.items - 卡片数据
 * @param props.className - 卡片间距类名
 * @param props.placeholder - 是否补充隐藏占位
 * @returns 统计卡片栅格
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function StatCardGrid({ items, className, placeholder = false }: StatCardGridProps) {
	return (
		<div className={cn("grid grid-cols-4 gap-6", className)}>
			{items.map((item) => (
				<div
					key={item.title}
					className="flex flex-col gap-[6px] rounded bg-[#F5F7FA] px-[42px] py-4"
				>
					<div className="flex items-center justify-between">
						<span className="text-sm leading-[22px] text-[#323233]">{item.title}</span>
						{item.icon}
					</div>
					<div className="flex items-center justify-between">
						<span className="text-[26px] font-medium leading-[34px] text-[#323233]">
							{item.value}
						</span>
						<span
							className="whitespace-nowrap text-sm leading-[22px]"
							style={{ color: item.hintColor }}
						>
							{item.hint}
						</span>
					</div>
				</div>
			))}
			{placeholder ? <div aria-hidden="true" className="invisible" /> : null}
		</div>
	);
}
