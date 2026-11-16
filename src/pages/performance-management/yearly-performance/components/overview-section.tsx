import type {
	YearlyReportCascaderOption,
	YearlyReportStatistics,
} from "#src/api/performance-management/yearly-performance";
import type { ReportFilterValues } from "../types";

import { YearlyReportStatus } from "#src/api/performance-management/yearly-performance";
import { ChevronDown, ChevronUp } from "lucide-react";
import { YEARLY_REPORT_STATUS_ORDER } from "../constants";
import { FilterBar } from "./filter-bar";
import { StatCard } from "./stat-card";

/** 状态 → 统计字段 */
const STATISTICS_FIELD: Record<YearlyReportStatus, keyof YearlyReportStatistics> = {
	[YearlyReportStatus.PENDING]: "pendingCount",
	[YearlyReportStatus.IN_PROGRESS]: "inProgressCount",
	[YearlyReportStatus.GENERATING]: "generatingCount",
	[YearlyReportStatus.READY]: "readyCount",
};

interface OverviewSectionProps {
	/** 是否收起 */
	collapsed: boolean;
	/** 收起 / 展开 */
	onCollapsedChange: (collapsed: boolean) => void;
	/** 概览统计 */
	statistics?: YearlyReportStatistics;
	/** 当前已生效的状态筛选（卡片选中态以已生效条件为准） */
	activeStatus?: YearlyReportStatus;
	/** 点击数据卡片 */
	onStatusCardClick: (status: YearlyReportStatus) => void;
	/** 筛选表单值 */
	filterValue: ReportFilterValues;
	/** 筛选表单值变更 */
	onFilterChange: (value: ReportFilterValues) => void;
	/** 管理者类别选项 */
	managerCategoryOptions: YearlyReportCascaderOption[];
	/** 查询 */
	onSearch: () => void;
	/** 重置 */
	onReset: () => void;
	/** 紧凑模式 */
	compact?: boolean;
}

/**
 * 概览与筛选
 *
 * 标题行（4×16 主色竖条 + 16px 标题 + 14px 说明 + 右侧收起 / 展开）；
 * 展开时依次为数据卡片、筛选区、分隔线，纵向间距 16px；收起时仅保留标题行与分隔线。数据卡片与筛选区「述职状态」联动。
 *
 * @param props - 组件属性
 * @param props.collapsed - 是否收起
 * @param props.onCollapsedChange - 收起 / 展开
 * @param props.statistics - 概览统计
 * @param props.activeStatus - 当前已生效的状态筛选（卡片选中态以已生效条件为准）
 * @param props.onStatusCardClick - 点击数据卡片
 * @param props.filterValue - 筛选表单值
 * @param props.onFilterChange - 筛选表单值变更
 * @param props.managerCategoryOptions - 管理者类别选项
 * @param props.onSearch - 查询
 * @param props.onReset - 重置
 * @param props.compact - 紧凑模式
 * @returns 概览与筛选区
 *
 * @since 2026-11-16
 */
export function OverviewSection({
	collapsed,
	onCollapsedChange,
	statistics,
	activeStatus,
	onStatusCardClick,
	filterValue,
	onFilterChange,
	managerCategoryOptions,
	onSearch,
	onReset,
	compact,
}: OverviewSectionProps) {
	return (
		<section className="flex shrink-0 flex-col">
			<div className="flex h-6 items-center gap-2">
				<span className="h-4 w-1 shrink-0 bg-[#0075FF]" aria-hidden />
				<span className="shrink-0 text-base font-semibold leading-6 text-black">
					概览与筛选
				</span>
				<span className="min-w-0 flex-1 truncate text-sm text-[#606266]">
					点击数据卡片筛选对应状态，再次点击取消筛选
				</span>
				<button
					type="button"
					className="flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-base leading-6 text-[#606266] hover:text-[#0075FF]"
					onClick={() => onCollapsedChange(!collapsed)}
				>
					{collapsed ? (
						<ChevronUp className="size-4" strokeWidth={2} />
					) : (
						<ChevronDown className="size-4" strokeWidth={2} />
					)}
					{collapsed ? "展开" : "收起"}
				</button>
			</div>

			{collapsed ? null : (
				<>
					<div className="mt-4 grid grid-cols-4 gap-6">
						{YEARLY_REPORT_STATUS_ORDER.map((status) => (
							<StatCard
								key={status}
								status={status}
								count={statistics?.[STATISTICS_FIELD[status]] ?? 0}
								active={activeStatus === status}
								compact={compact}
								onClick={onStatusCardClick}
							/>
						))}
					</div>
					<div className="mt-4">
						<FilterBar
							value={filterValue}
							managerCategoryOptions={managerCategoryOptions}
							compact={compact}
							onChange={onFilterChange}
							onSearch={onSearch}
							onReset={onReset}
						/>
					</div>
				</>
			)}
			{/* 收起时分隔线保留（设计稿 06） */}
			<div className="mt-4 h-px bg-[#EBEEF5]" />
		</section>
	);
}
