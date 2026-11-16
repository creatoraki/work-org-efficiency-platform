import { YearlyReportStatus } from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { YEARLY_REPORT_STATUS_META } from "../constants";

interface StatusTagProps {
	/** 述职状态 */
	status: YearlyReportStatus;
	/** 额外样式 */
	className?: string;
}

/**
 * 述职状态标签
 *
 * 24px 高、12px 字号、左右 8px 内边距；「述职中」带 6px 实心圆点 + 1px 浅色光圈，表示录音进行中。
 *
 * @param props - 组件属性
 * @param props.status - 述职状态
 * @param props.className - 额外样式
 * @returns 状态标签
 *
 * @since 2026-11-16
 */
export function StatusTag({ status, className }: StatusTagProps) {
	const meta = YEARLY_REPORT_STATUS_META[status];
	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 text-xs leading-6",
				className,
			)}
			style={{ color: meta.color, backgroundColor: meta.bgColor }}
		>
			{status === YearlyReportStatus.IN_PROGRESS ? (
				<span
					className="mx-px size-1.5 rounded-full"
					style={{ backgroundColor: meta.color, boxShadow: `0 0 0 1px ${meta.color}66` }}
					aria-hidden
				/>
			) : null}
			{meta.label}
		</span>
	);
}
