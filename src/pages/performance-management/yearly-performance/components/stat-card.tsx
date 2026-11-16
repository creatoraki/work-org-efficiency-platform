import type { ComponentType, SVGProps } from "react";

import { YearlyReportStatus } from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { YEARLY_REPORT_STATUS_META } from "../constants";
import { FileClockIcon, FileDoneIcon, MicIcon, UserVoiceIcon } from "./icons";

/** 状态 → 概览卡片图标 */
const STATUS_ICON: Record<YearlyReportStatus, ComponentType<SVGProps<SVGSVGElement>>> = {
	[YearlyReportStatus.PENDING]: UserVoiceIcon,
	[YearlyReportStatus.IN_PROGRESS]: MicIcon,
	[YearlyReportStatus.GENERATING]: FileClockIcon,
	[YearlyReportStatus.READY]: FileDoneIcon,
};

interface StatCardProps {
	/** 述职状态 */
	status: YearlyReportStatus;
	/** 人数 */
	count: number;
	/** 是否为当前筛选状态 */
	active: boolean;
	/** 紧凑模式：主区域较窄时内边距 12px（设计稿 18） */
	compact?: boolean;
	/** 点击：切换状态筛选 */
	onClick: (status: YearlyReportStatus) => void;
}

/**
 * 概览数据卡片
 *
 * 76px 高、#F5F7FA 底、左右 32px（紧凑 12px）；上行状态名 + 28px 图标块，下行 28px 人数 + 状态说明。
 * 点击筛选对应状态，选中态 1px 主色描边；文案空间不足时单行省略，不换行。
 *
 * @param props - 组件属性
 * @param props.status - 述职状态
 * @param props.count - 人数
 * @param props.active - 是否选中
 * @param props.compact - 是否紧凑
 * @param props.onClick - 点击回调
 * @returns 数据卡片
 *
 * @since 2026-11-16
 */
export function StatCard({ status, count, active, compact, onClick }: StatCardProps) {
	const meta = YEARLY_REPORT_STATUS_META[status];
	const Icon = STATUS_ICON[status];
	return (
		<button
			type="button"
			onClick={() => onClick(status)}
			aria-pressed={active}
			className={cn(
				"flex h-[76px] min-w-0 cursor-pointer flex-col rounded border border-solid bg-[#F5F7FA] py-[5px] text-left transition-colors",
				compact ? "px-[11px]" : "px-[31px]",
				active ? "border-[#0075FF]" : "border-transparent hover:border-[#5CA7FF]",
			)}
		>
			<div className="flex h-7 w-full items-center justify-between gap-2">
				<span className="min-w-0 truncate text-sm text-[#323233]" title={meta.label}>
					{meta.label}
				</span>
				<span
					className="flex size-7 shrink-0 items-center justify-center rounded"
					style={{ backgroundColor: meta.bgColor, color: meta.color }}
				>
					<Icon width={24} height={24} />
				</span>
			</div>
			<div
				className={cn(
					"flex h-9 w-full items-center gap-2",
					compact ? "justify-start" : "justify-between",
				)}
			>
				<span className="shrink-0 text-[28px] leading-9 text-[#323233]">{count}</span>
				<span
					className="min-w-0 truncate text-sm"
					style={{ color: meta.color }}
					title={meta.description}
				>
					{meta.description}
				</span>
			</div>
		</button>
	);
}
