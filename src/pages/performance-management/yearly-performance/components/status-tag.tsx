import { AppraisalStatus } from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { APPRAISAL_STATUS_META } from "../constants";

interface StatusTagProps {
	/** 述职状态 */
	status: AppraisalStatus;
	/** 额外样式 */
	className?: string;
}

/**
 * 述职状态标签
 *
 * 24px 高、12px 字号、左右 8px 内边距；「述职中」带 6px 实心圆点 + 呼吸动态光圈（设计稿 22），
 * 表示录音进行中；系统开启「减少动态效果」时只保留静态圆点。
 *
 * @param props - 组件属性
 * @param props.status - 述职状态
 * @param props.className - 额外样式
 * @returns 状态标签
 *
 * @since 2026-11-16
 */
export function StatusTag({ status, className }: StatusTagProps) {
	const meta = APPRAISAL_STATUS_META[status] ?? APPRAISAL_STATUS_META[AppraisalStatus.PENDING];
	return (
		<span
			className={cn(
				"inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded px-2 text-xs leading-6",
				className,
			)}
			style={{ color: meta.color, backgroundColor: meta.bgColor }}
		>
			{status === AppraisalStatus.IN_PROGRESS ? (
				<span className="relative mx-px flex size-1.5" aria-hidden>
					<span
						className="absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping"
						style={{ backgroundColor: meta.color }}
					/>
					<span
						className="relative inline-flex size-1.5 rounded-full"
						style={{ backgroundColor: meta.color }}
					/>
				</span>
			) : null}
			{meta.label}
		</span>
	);
}
