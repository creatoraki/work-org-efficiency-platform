import ChevronRightIcon from "#src/assets/svg/chevron-right.svg?react";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";

/** 三列字段的左右留白：首列右留白、中列两侧留白、末列左留白 */
const COLUMN_PADDING = ["pr-6", "px-6", "pl-6"] as const;

/**
 * 流程节点字段
 */
export interface FlowField {
	/** 字段名 */
	label: string;
	/** 字段值 */
	value: string;
}

/**
 * 流程节点展示模型
 *
 * 由各业务抽屉把接口数据归一成该结构，时间线组件只负责渲染。
 */
export interface FlowTimelineItem {
	/** 节点标识 */
	id: string;
	/** 节点标题：申诉 / 拒绝 / 通过 / 确认 */
	title: string;
	/** 日期，格式 YYYY-MM-DD */
	date: string;
	/** 申诉编号，存在时渲染为可跳转链接 */
	appealNo?: string;
	/** 节点操作文案，如「去处理」 */
	actionLabel?: string;
	/** 点击操作回调 */
	onAction?: () => void;
	/** 节点字段，按三列顺序逐行排布 */
	fields: FlowField[];
	/** 驳回原因（拒绝节点） */
	rejectReason?: string;
}

interface FlowTimelineProps {
	/** 区块标题 */
	title: string;
	/** 流程节点，为空时不渲染整个区块 */
	items: FlowTimelineItem[];
	/** 点击申诉编号回调 */
	onAppealNoClick?: (appealNo: string) => void;
}

/**
 * 确认流程节点卡片
 *
 * 表头展示节点标题、申诉编号或操作入口、日期；
 * 表体按三列排布字段，字段标签固定 92px 右对齐，保证跨行纵向对齐。
 *
 * @param props - 组件属性
 * @param props.item - 节点展示模型
 * @param props.index - 节点序号，用于首尾圆角与连接线判断
 * @param props.lastIndex - 末节点序号
 * @param props.onAppealNoClick - 点击申诉编号回调
 * @returns 节点卡片元素
 */
function FlowCard({
	item,
	index,
	lastIndex,
	onAppealNoClick,
}: {
	item: FlowTimelineItem;
	index: number;
	lastIndex: number;
	onAppealNoClick?: (appealNo: string) => void;
}) {
	return (
		<div
			className={`min-w-0 flex-1 overflow-hidden border border-[#E4E7ED] bg-white ${index === 0 ? "rounded-t" : "border-t-0"} ${index === lastIndex ? "rounded-b" : ""}`}
		>
			<div className="flex items-center justify-between bg-[#F5F7FA] px-3 py-2">
				<div className="flex min-w-0 items-center gap-6">
					<span className="shrink-0 text-base font-medium leading-6 text-[#323233]">
						{item.title}
					</span>
					{item.appealNo ? (
						<button
							type="button"
							className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-base leading-6 text-[#0075FF]"
							onClick={() => onAppealNoClick?.(item.appealNo!)}
						>
							<span>申诉编号：{item.appealNo}</span>
							<ChevronRightIcon className="size-5 shrink-0" />
						</button>
					) : null}
					{item.actionLabel ? (
						<button
							type="button"
							className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-base leading-6 text-[#0075FF]"
							onClick={item.onAction}
						>
							<span>{item.actionLabel}</span>
							<ChevronRightIcon className="size-5 shrink-0" />
						</button>
					) : null}
				</div>
				<span className="shrink-0 text-base leading-6 text-[#606266]">
					日期：
					{item.date}
				</span>
			</div>
			{item.rejectReason ? (
				<div className="px-3 py-2 text-sm leading-[22px] text-[#606266]">
					驳回原因：
					{item.rejectReason}
				</div>
			) : null}
			<div className="grid grid-cols-3">
				{item.fields.map((field, fieldIndex) => (
					<div
						key={field.label}
						className={`flex h-[34px] items-center gap-6 py-1.5 ${COLUMN_PADDING[fieldIndex % COLUMN_PADDING.length]}`}
					>
						<span className="w-[92px] shrink-0 text-right text-sm leading-[22px] text-[#606266]">
							{field.label}
						</span>
						<span className="min-w-0 flex-1 text-sm leading-[22px] text-black">
							{field.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * 流程时间线
 *
 * 左侧步骤条与节点卡片逐行对应：圆点距卡片顶部 16px，上下各留 6px 间隙，
 * 连接线为 2px 蓝色实线。单节点时不渲染步骤条，直接整宽展示节点卡片。
 *
 * @param props - 组件属性
 * @param props.title - 区块标题，如「申诉流程」
 * @param props.items - 流程节点展示模型
 * @param props.onAppealNoClick - 点击申诉编号回调
 * @returns 流程时间线区块
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function FlowTimeline({ title, items, onAppealNoClick }: FlowTimelineProps) {
	if (items.length === 0) {
		return null;
	}

	// 多节点才展示左侧步骤条，单节点直接整宽展示卡片
	const withTimeline = items.length > 1;
	const lastIndex = items.length - 1;

	return (
		<div className="mb-4">
			<SectionTitle title={title} />
			<div className="flex flex-col">
				{items.map((item, index) => (
					<div key={item.id} className={withTimeline ? "flex gap-2" : undefined}>
						{withTimeline ? (
							<div className="flex w-2 shrink-0 flex-col items-center" aria-hidden>
								{/* 上段线在首节点留白不显示，保证圆点距卡片顶部固定 16px */}
								<span
									className={`h-2.5 w-0.5 shrink-0 ${index === 0 ? "bg-transparent" : "bg-[#0075FF]"}`}
								/>
								<span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#0075FF]" />
								{index < lastIndex ? (
									<span className="mt-1.5 w-0.5 flex-1 bg-[#0075FF]" />
								) : null}
							</div>
						) : null}
						<FlowCard
							item={item}
							index={index}
							lastIndex={lastIndex}
							onAppealNoClick={onAppealNoClick}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
