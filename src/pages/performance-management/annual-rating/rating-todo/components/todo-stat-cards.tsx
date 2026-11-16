import type { RatingTodoStatistics } from "#src/api/performance-management/todo";
import type { StatCardItem } from "#src/pages/performance-management/annual-rating/components/stat-card-grid";

import AuditApprovedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import AuditPendingReviewStatusIcon from "#src/assets/svg/audit_pending_review_status.svg?react";
import AuditRejectedStatusIcon from "#src/assets/svg/audit_rejected_status.svg?react";
import { StatCardGrid } from "#src/pages/performance-management/annual-rating/components/stat-card-grid";

/**
 * 统计卡片组件属性
 */
interface TodoStatCardsProps {
	/** 统计数据 */
	statistics: RatingTodoStatistics;
	/** 卡片间距类名 */
	className?: string;
}

/**
 * 评级待办顶部统计卡片
 *
 * 展示待完成、被驳回、已提交、已完成四个维度的待办统计，
 * 图标复用标签审核模块的同款状态图标，保持视觉一致。
 *
 * @param props - 组件属性
 * @param props.statistics - 统计数据
 * @param props.className - 卡片间距类名
 * @returns 统计卡片组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function TodoStatCards({ statistics, className }: TodoStatCardsProps) {
	const {
		pendingCount,
		rejectedCount,
		submittedCount,
		completedCount,
		rejectedTodayCount,
		completedTodayCount,
	} = statistics;

	const cardItems: StatCardItem[] = [
		{
			title: "待完成",
			value: pendingCount,
			hint: "请及时处理",
			hintColor: "#FF7D00",
			icon: <AuditPendingReviewStatusIcon className="size-7" />,
		},
		{
			title: "被驳回",
			value: rejectedCount,
			hint: `本日新增${rejectedTodayCount}个`,
			hintColor: "#F5222D",
			icon: <AuditRejectedStatusIcon className="size-7" />,
		},
		{
			title: "已提交",
			value: submittedCount,
			hint: "请持续关注",
			hintColor: "#14B968",
			icon: <AuditApprovedStatusIcon className="size-7" />,
		},
		{
			title: "已完成",
			value: completedCount,
			hint: `本日新增${completedTodayCount}个`,
			hintColor: "#14B968",
			icon: <AuditApprovedStatusIcon className="size-7" />,
		},
	];

	return <StatCardGrid items={cardItems} className={className} />;
}
