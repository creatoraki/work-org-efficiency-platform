import type { YearlyReportItem } from "#src/api/performance-management/yearly-performance";
import type { PersonCardAction } from "./person-card";

import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Empty, Spin } from "antd";
import { PERSON_CARD_MIN_WIDTH } from "../constants";
import { PersonCard } from "./person-card";

interface CardBoardProps {
	/** 当前页人员（已按本地拖拽顺序排列） */
	items: YearlyReportItem[];
	/** 加载中 */
	loading: boolean;
	/** 已勾选 */
	checkedIds: Set<string>;
	/** 当前查看详情 */
	activeReportId?: string;
	/** 正在执行操作的记录 */
	pendingReportId?: string;
	/** 勾选变更 */
	onCheckedChange: (reportId: string, checked: boolean) => void;
	/** 展开详情 */
	onOpen: (item: YearlyReportItem) => void;
	/** 卡片操作 */
	onAction: (item: YearlyReportItem, action: PersonCardAction) => void;
}

/**
 * 人员卡片网格
 *
 * 列数随主区域宽度自适应（最小卡片宽 360px，列间距 24px、行间距 16px）：
 * 1920 宽三列，详情展开两列，窄屏单列。卡片支持拖拽排序（拖拽上下文由页面统一提供，便于拖入文件夹）。
 *
 * @param props - 组件属性
 * @param props.items - 当前页人员（已按本地拖拽顺序排列）
 * @param props.loading - 加载中
 * @param props.checkedIds - 已勾选
 * @param props.activeReportId - 当前查看详情
 * @param props.pendingReportId - 正在执行操作的记录
 * @param props.onCheckedChange - 勾选变更
 * @param props.onOpen - 展开详情
 * @param props.onAction - 卡片操作
 * @returns 卡片网格
 *
 * @since 2026-11-16
 */
export function CardBoard({
	items,
	loading,
	checkedIds,
	activeReportId,
	pendingReportId,
	onCheckedChange,
	onOpen,
	onAction,
}: CardBoardProps) {
	if (!items.length) {
		return (
			<div className="flex min-h-[240px] items-center justify-center">
				{loading ? <Spin /> : <Empty description="暂无述职人员" />}
			</div>
		);
	}
	return (
		<Spin spinning={loading} delay={200}>
			<SortableContext
				items={items.map((item) => item.reportId)}
				strategy={rectSortingStrategy}
			>
				<div
					className="grid gap-x-6 gap-y-4"
					style={{
						gridTemplateColumns: `repeat(auto-fill, minmax(min(${PERSON_CARD_MIN_WIDTH}px, 100%), 1fr))`,
					}}
				>
					{items.map((item) => (
						<PersonCard
							key={item.reportId}
							item={item}
							checked={checkedIds.has(item.reportId)}
							active={activeReportId === item.reportId}
							actionLoading={pendingReportId === item.reportId}
							onCheckedChange={onCheckedChange}
							onOpen={onOpen}
							onAction={onAction}
						/>
					))}
				</div>
			</SortableContext>
		</Spin>
	);
}
