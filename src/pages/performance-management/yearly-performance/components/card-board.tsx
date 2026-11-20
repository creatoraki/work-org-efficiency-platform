import type { AppraisalUser } from "#src/api/performance-management/yearly-performance";
import type { PersonCardAction } from "./person-card";

import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Empty, Spin } from "antd";
import { PERSON_CARD_MIN_WIDTH } from "../constants";
import { PersonCard } from "./person-card";

interface CardBoardProps {
	/** 当前页人员（已按本地拖拽顺序排列） */
	users: AppraisalUser[];
	/** 加载中 */
	loading: boolean;
	/** 是否允许排序（仅具体文件夹视图） */
	sortable: boolean;
	/** 已勾选 */
	checkedIds: Set<string>;
	/** 当前查看详情 */
	activeUserId?: string;
	/** 正在执行操作的人员 */
	pendingUserId?: string;
	/** 勾选变更 */
	onCheckedChange: (userId: string, checked: boolean) => void;
	/** 展开详情 */
	onOpen: (user: AppraisalUser) => void;
	/** 卡片操作 */
	onAction: (user: AppraisalUser, action: PersonCardAction) => void;
	/** 修改述职顺序 */
	onSortChange: (user: AppraisalUser, position: number) => void;
}

/**
 * 人员卡片网格
 *
 * 列数随主区域宽度自适应（最小卡片宽 360px，列间距 24px、行间距 16px）：
 * 1920 宽三列，详情展开两列，窄屏单列。拖拽上下文由页面统一提供，便于拖入文件夹。
 *
 * @param props - 组件属性
 * @param props.users - 当前页人员
 * @param props.loading - 加载中
 * @param props.sortable - 是否允许排序
 * @param props.checkedIds - 已勾选
 * @param props.activeUserId - 当前查看详情
 * @param props.pendingUserId - 正在执行操作的人员
 * @param props.onCheckedChange - 勾选变更
 * @param props.onOpen - 展开详情
 * @param props.onAction - 卡片操作
 * @param props.onSortChange - 修改述职顺序
 * @returns 卡片网格
 *
 * @since 2026-11-16
 */
export function CardBoard({
	users,
	loading,
	sortable,
	checkedIds,
	activeUserId,
	pendingUserId,
	onCheckedChange,
	onOpen,
	onAction,
	onSortChange,
}: CardBoardProps) {
	if (!users.length) {
		return (
			<div className="flex min-h-[240px] items-center justify-center">
				{loading ? <Spin /> : <Empty description="暂无述职人员" />}
			</div>
		);
	}
	return (
		<Spin spinning={loading} delay={200}>
			<SortableContext
				items={users.map((user) => user.userId)}
				strategy={rectSortingStrategy}
			>
				<div
					className="grid gap-x-6 gap-y-4"
					style={{
						gridTemplateColumns: `repeat(auto-fill, minmax(min(${PERSON_CARD_MIN_WIDTH}px, 100%), 1fr))`,
					}}
				>
					{users.map((user) => (
						<PersonCard
							key={user.userId}
							user={user}
							checked={checkedIds.has(user.userId)}
							active={activeUserId === user.userId}
							sortable={sortable}
							actionLoading={pendingUserId === user.userId}
							onCheckedChange={onCheckedChange}
							onOpen={onOpen}
							onAction={onAction}
							onSortChange={onSortChange}
						/>
					))}
				</div>
			</SortableContext>
		</Spin>
	);
}
