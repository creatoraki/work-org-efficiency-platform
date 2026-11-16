import type { RatingPlanStatistics } from "#src/api/performance-management/plan";
import type { StatCardItem } from "#src/pages/performance-management/annual-rating/components/stat-card-grid";

import ArchivedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import PlanInProgressStatusIcon from "#src/assets/svg/plan_in_progress_status.svg?react";
import PlanTotalStatusIcon from "#src/assets/svg/plan_total_status.svg?react";
import { StatCardGrid } from "#src/pages/performance-management/annual-rating/components/stat-card-grid";
import { cn } from "#src/utils";

/**
 * 统计卡片组件属性
 */
interface PlanStatCardsProps {
	/** 统计数据 */
	statistics: RatingPlanStatistics;
	/** 卡片间距类名 */
	className?: string;
}

/**
 * 评级计划顶部统计卡片
 *
 * 展示计划总数、进行中、已归档三项统计；
 * 通过隐藏占位保持四列栅格宽度，因此渲染三张卡片和一个占位单元格。
 *
 * @param props - 组件属性
 * @param props.statistics - 统计数据
 * @param props.className - 卡片间距类名
 * @returns 统计卡片组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function PlanStatCards({ statistics, className }: PlanStatCardsProps) {
	const { totalCount, inProgressCount, archivedCount, archivedTodayCount } = statistics;

	const cardItems: StatCardItem[] = [
		{
			title: "计划总数",
			value: totalCount,
			hint: "请持续关注",
			hintColor: "#0075FF",
			// 设计稿为 28×28 浅蓝底片 + 24×24 图标
			icon: (
				<span className="flex size-7 items-center justify-center rounded-[3px] bg-[#E0EEFF]">
					<PlanTotalStatusIcon className="size-6" />
				</span>
			),
		},
		{
			title: "进行中",
			value: inProgressCount,
			hint: "请及时处理",
			hintColor: "#0075FF",
			icon: (
				<span className="flex size-7 items-center justify-center rounded-[3px] bg-[#E0EEFF]">
					<PlanInProgressStatusIcon className="size-6" />
				</span>
			),
		},
		{
			title: "已归档",
			value: archivedCount,
			hint: `本日新增${archivedTodayCount}个`,
			hintColor: "#14B968",
			// 已归档图标自带 28×28 #E3F7ED 底片
			icon: <ArchivedStatusIcon className="size-7" />,
		},
	];

	// 设计稿三张卡片定宽约 340px，第四列为不可见占位
	return (
		<StatCardGrid
			items={cardItems}
			className={cn("grid-cols-[repeat(4,340px)]", className)}
			placeholder
		/>
	);
}
