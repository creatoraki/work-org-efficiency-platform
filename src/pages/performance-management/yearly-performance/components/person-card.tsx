import type { AppraisalUser } from "#src/api/performance-management/yearly-performance";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

import { AppraisalStatus } from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Checkbox, Typography } from "antd";
import { formatDateWithWeekday } from "../utils";
import { MicIcon, NoteIcon, PowerIcon } from "./icons";
import { PersonAvatar } from "./person-avatar";
import { SortNoBox } from "./sort-no-box";
import { StatusTag } from "./status-tag";

/** 卡片操作 */
export type PersonCardAction = "start" | "finish" | "progress" | "report";

interface PersonCardProps {
	/** 述职人员 */
	user: AppraisalUser;
	/** 是否勾选 */
	checked: boolean;
	/** 是否为当前查看详情的卡片 */
	active: boolean;
	/** 是否允许在卡片之间排序（仅具体文件夹视图） */
	sortable: boolean;
	/** 勾选变更 */
	onCheckedChange: (userId: string, checked: boolean) => void;
	/** 点击卡片 / 姓名，展开详情 */
	onOpen: (user: AppraisalUser) => void;
	/** 底部操作按钮 */
	onAction: (user: AppraisalUser, action: PersonCardAction) => void;
	/** 修改述职顺序（序号输入） */
	onSortChange: (user: AppraisalUser, position: number) => void;
	/** 操作按钮 loading */
	actionLoading?: boolean;
}

interface InfoRowProps {
	/** 字段名 */
	label: string;
	/** 字段值 */
	value: ReactNode;
	/** 字段值是否单行省略（悬浮显示全部） */
	ellipsis?: boolean;
	/** 额外样式 */
	className?: string;
}

/**
 * 卡片信息行：字段名固定 6 个汉字宽并右对齐，使「管理者类别：」「组织架构：」「述职日期：」冒号对齐
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.ellipsis - 是否单行省略
 * @param props.className - 额外样式
 * @returns 信息行
 */
function InfoRow({ label, value, ellipsis, className }: InfoRowProps) {
	return (
		<div className={cn("flex min-w-0 items-center text-sm leading-[22px]", className)}>
			<span className="w-[84px] shrink-0 text-right text-[#606266]">{label}：</span>
			{ellipsis && typeof value === "string" ? (
				<Typography.Text
					className="min-w-0 flex-1 !text-sm !leading-[22px] !text-[#323233]"
					ellipsis={{ tooltip: value }}
				>
					{value}
				</Typography.Text>
			) : (
				<span className="min-w-0 flex-1 truncate text-[#323233]">{value}</span>
			)}
		</div>
	);
}

/** 按钮公共样式：32px 高、左右 11px、图标与文字间距 4px（设计稿按钮总宽 98px） */
const ACTION_BUTTON_CLASS = "!h-8 !gap-1 !px-[11px] !text-sm [&_svg]:size-3.5";

/**
 * 卡片底部操作按钮（设计稿 22）
 *
 * 待述职 → 开始述职；述职中 → 结束录音；报告生成中 → 查看进度；报告已生成 → 查看报告。
 *
 * @param props - 组件属性
 * @param props.status - 述职状态
 * @param props.loading - 是否 loading
 * @param props.onClick - 点击回调
 * @returns 操作按钮
 */
function ActionButton({
	status,
	loading,
	onClick,
}: {
	status: AppraisalStatus;
	loading?: boolean;
	onClick: (action: PersonCardAction) => void;
}) {
	const handle = (action: PersonCardAction) => (event: MouseEvent) => {
		// 操作按钮不触发卡片的「展开详情」
		event.stopPropagation();
		onClick(action);
	};
	switch (status) {
		case AppraisalStatus.PENDING:
			return (
				<Button
					type="primary"
					className={ACTION_BUTTON_CLASS}
					icon={<MicIcon />}
					loading={loading}
					onClick={handle("start")}
				>
					开始述职
				</Button>
			);
		case AppraisalStatus.IN_PROGRESS:
			return (
				<Button
					danger
					className={cn(ACTION_BUTTON_CLASS, "!border-[#F5222D] !text-[#F5222D]")}
					icon={<PowerIcon />}
					loading={loading}
					onClick={handle("finish")}
				>
					结束录音
				</Button>
			);
		case AppraisalStatus.GENERATING:
			return (
				<Button
					className={cn(ACTION_BUTTON_CLASS, "!text-[#323233]")}
					icon={<NoteIcon />}
					onClick={handle("progress")}
				>
					查看进度
				</Button>
			);
		default:
			return (
				<Button
					className={cn(ACTION_BUTTON_CLASS, "!text-[#323233]")}
					icon={<NoteIcon />}
					onClick={handle("report")}
				>
					查看报告
				</Button>
			);
	}
}

/**
 * 述职人员卡片（设计稿 30 / 31 母组件）
 *
 * 结构（自上而下，内边距 12px）：勾选框 · 序号框 · 头像 · 姓名 · 状态标签 / 管理者类别 / 组织架构 / 分隔线 / 述职日期 · 操作按钮。
 * 交互：
 * - 姓名或整张卡片点击展开详情（勾选框、序号框区域除外）；
 * - 默认 #DCDFE6 描边，悬浮 #5CA7FF，按下 #0062D6，当前查看 #0075FF；
 * - 整张卡片可拖拽：拖到左侧文件夹归档；在具体文件夹内还可在卡片之间排序，或点击序号直接输入新顺序。
 *
 * @param props - 组件属性
 * @param props.user - 述职人员
 * @param props.checked - 是否勾选
 * @param props.active - 是否为当前查看详情的卡片
 * @param props.sortable - 是否允许排序
 * @param props.onCheckedChange - 勾选变更
 * @param props.onOpen - 点击卡片 / 姓名，展开详情
 * @param props.onAction - 底部操作按钮
 * @param props.onSortChange - 修改述职顺序
 * @param props.actionLoading - 操作按钮 loading
 * @returns 人员卡片
 *
 * @since 2026-11-16
 */
export function PersonCard({
	user,
	checked,
	active,
	sortable,
	onCheckedChange,
	onOpen,
	onAction,
	onSortChange,
	actionLoading,
}: PersonCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: user.userId,
		data: { type: "person", user },
		// 非文件夹视图只允许拖入文件夹，不参与卡片间排序（避免拖拽时其他卡片让位造成误解）
		disabled: { draggable: false, droppable: !sortable },
	});

	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			role="button"
			tabIndex={0}
			onClick={() => onOpen(user)}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					onOpen(user);
				}
			}}
			className={cn(
				"group relative flex min-w-0 cursor-pointer flex-col rounded border border-solid bg-white px-3 pb-[11px] pt-3 outline-none transition-[border-color,box-shadow] duration-200",
				"hover:border-[#5CA7FF] hover:shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] active:border-[#0062D6]",
				active
					? "border-[#0075FF] shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]"
					: "border-[#DCDFE6]",
				isDragging && "z-10 opacity-60",
			)}
		>
			{/* 头部：勾选框 / 序号 / 头像 / 姓名 / 状态 */}
			<div className="flex h-[26px] items-center">
				{/* 勾选框区域不触发展开详情与拖拽 */}
				<span
					className="flex h-full shrink-0 items-center"
					onClick={(event) => event.stopPropagation()}
					onPointerDown={(event) => event.stopPropagation()}
				>
					<Checkbox
						checked={checked}
						onChange={(event) => onCheckedChange(user.userId, event.target.checked)}
					/>
				</span>
				<span className="ml-2 flex shrink-0">
					<SortNoBox
						value={user.sort}
						editable={sortable}
						disabledTip="选择文件夹后可调整述职顺序"
						onCommit={(position) => onSortChange(user, position)}
					/>
				</span>
				<PersonAvatar className="ml-2" name={user.userName} />
				<span className="ml-2 min-w-0 flex-1 truncate text-xl leading-[26px] text-[#0075FF]">
					{user.userName}
				</span>
				<StatusTag className="ml-2" status={user.appraisalStatus} />
			</div>

			<InfoRow
				className="mt-[13px]"
				label="管理者类别"
				value={user.jobType || "-"}
				ellipsis
			/>
			<InfoRow className="mt-1" label="组织架构" value={user.orgName || "-"} ellipsis />

			<div className="mt-3 h-px bg-[#EBEEF5]" />

			<div className="mt-3 flex h-8 items-center justify-between gap-2">
				<InfoRow
					className="min-w-0 flex-1"
					label="述职日期"
					value={formatDateWithWeekday(user.appraisalDate)}
				/>
				<span className="shrink-0" onPointerDown={(event) => event.stopPropagation()}>
					<ActionButton
						status={user.appraisalStatus}
						loading={actionLoading}
						onClick={(action) => onAction(user, action)}
					/>
				</span>
			</div>
		</div>
	);
}
