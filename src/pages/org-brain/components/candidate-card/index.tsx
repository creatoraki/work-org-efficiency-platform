/**
 * 候选人卡片组件
 *
 * 直接消费候选人推荐结果字段，人岗匹配与排兵布阵共用。
 */

import type { OrgBrainCandidateItem } from "#src/api/org-brain/candidate";

import type { CandidateCardProps } from "./types";

import { cn } from "#src/utils";
import { CheckOutlined, RightOutlined } from "@ant-design/icons";
import { Avatar, Descriptions, Progress, Typography } from "antd";
import { useMemo } from "react";

const { Text } = Typography;
export { SelectedCandidatesModal } from "./selected-candidates-modal";

interface CandidatePostgradeFields {
	postgradeId?: string;
	postgradeName?: string;
	positionLevel?: string;
}

/**
 * 统一解析候选人卡片中的职级展示文案。
 *
 * 优先展示后端显式返回的 postgradeName，其次回退到 postgradeId，
 * 最后再使用存量的 positionLevel 兼容字段；三者均缺失时展示 "/".
 *
 * @param candidate - 候选人职级相关字段
 * @returns 职级展示文案
 * @author 王善能
 * @since 2026-07-08
 */
function resolveCandidatePostgradeText(candidate: CandidatePostgradeFields) {
	return candidate.postgradeName || candidate.postgradeId || candidate.positionLevel || "/";
}

/**
 * 统一解析候选人卡片中的组织展示文案。
 *
 * 排兵布阵候选池接口已补充 orgFullName，需要优先展示完整组织名称；
 * 其他场景继续兼容存量 orgName 字段，两者都缺失时展示 "/".
 *
 * @param candidate - 候选人组织相关字段
 * @returns 组织展示文案
 * @author 王善能
 * @since 2026-07-10
 */
function resolveCandidateOrgText(
	candidate: Pick<OrgBrainCandidateItem, "orgFullName" | "orgName">,
) {
	return candidate.orgFullName || candidate.orgName || "/";
}

/**
 * 根据匹配度百分比返回视觉分级配置
 *
 * @param matchProgressPercent - 归一化后的匹配度百分比
 * @returns 文案、字体颜色和背景色配置
 * @author 王善能
 * @since 2026-06-08
 */
function getMatchRateLevel(matchProgressPercent: number): {
	text: string;
	color: string;
	bgColor: string;
} {
	if (matchProgressPercent <= 60) {
		return { text: "低", color: "#F5222D", bgColor: "#FFF1F0" };
	}
	if (matchProgressPercent <= 80) {
		return { text: "中", color: "#2077FF", bgColor: "#E4EFFF" };
	}
	return { text: "高", color: "#14B968", bgColor: "#E6F7ED" };
}

/**
 * 紧凑版候选人卡片
 *
 * 用于人岗匹配和排兵布阵候选池的高密度展示场景，保留核心字段、匹配度与选择态。
 *
 * @param props - 紧凑卡片属性
 * @param props.candidate - 当前候选人
 * @param props.isSelected - 当前卡片是否已选中
 * @param props.readonly - 是否为只读展示
 * @param props.displayRank - 当前卡片展示序号
 * @param props.onViewArchive - 查看候选人档案回调
 * @param props.onClick - 点击卡片时回传候选人
 * @returns 紧凑版候选人卡片 JSX
 * @author 王善能
 * @since 2026-06-08
 */
function CompactCandidateCard<T extends OrgBrainCandidateItem>({
	candidate,
	isSelected,
	readonly,
	displayRank,
	onViewArchive,
	onClick,
}: Pick<
	CandidateCardProps<T>,
	"candidate" | "isSelected" | "readonly" | "displayRank" | "onViewArchive" | "onClick"
>) {
	const displayName = candidate.username?.trim() || candidate.empCode || "/";
	const matchProgressPercent = candidate.matchScore;
	const matchLevel = getMatchRateLevel(matchProgressPercent);
	const rankNumber = displayRank ?? candidate.recommendRank ?? 1;
	const rankLabel = `TOP${rankNumber}`;
	const entryDateText = candidate.entryDate || "/";
	const orgText = resolveCandidateOrgText(candidate);

	return (
		<div
			className={cn(
				"group relative min-h-[164px] overflow-hidden rounded-lg border bg-white px-4 pb-8 pt-3.5",
				"transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(31,35,41,0.08)]",
				!readonly && "cursor-pointer",
				readonly && "cursor-default",
				isSelected
					? "border-[#4096ff] bg-[#f7fbff] shadow-[0_0_0_1px_rgba(64,150,255,0.14)]"
					: "border-[#e6e8eb]",
			)}
			onClick={() => {
				if (!readonly) {
					onClick?.(candidate);
				}
			}}
		>
			<div className="mb-3 flex min-h-[56px] items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<Avatar
						size={42}
						className={cn(
							"shrink-0 border transition-all duration-200",
							isSelected ? "border-[#4096ff]" : "border-[#cfe2ff]",
						)}
						style={{
							backgroundColor: isSelected ? "#dfeeff" : "#eef5ff",
							color: "#1677ff",
							fontSize: 20,
						}}
					>
						{displayName[displayName.length - 1] || "U"}
					</Avatar>
					<div className="flex flex-1 flex-col gap-1 pt-0.5">
						<Text
							strong
							className={cn(
								"block truncate text-[20px] leading-6",
								isSelected && "!text-[#1677ff]",
							)}
						>
							{displayName}
						</Text>
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#909399]">
							<Text className="text-xs !text-[#909399]">
								工号：{candidate.empCode || "/"}
							</Text>
							<Text className="text-xs !text-[#909399]">
								性别：{candidate.sex || "/"}
							</Text>
						</div>
					</div>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-2">
					{!readonly && (
						<button
							type="button"
							className={cn(
								"flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-all duration-200",
								isSelected && "border-[#69b1ff] bg-white text-[#1677ff]",
								!isSelected &&
									"border-[#d9d9d9] bg-white text-[#606266] hover:border-[#91caff] hover:text-[#1677ff]",
							)}
							onClick={(event) => {
								event.stopPropagation();
								onClick?.(candidate);
							}}
						>
							<span
								className={cn(
									"mr-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border text-[9px] leading-none transition-all duration-200",
									isSelected
										? "border-[#1677ff] bg-[#1677ff] text-white"
										: "border-[#c9cdd4] bg-white text-transparent",
								)}
							>
								<CheckOutlined />
							</span>
							<span>{isSelected ? "已选" : "选择"}</span>
						</button>
					)}
					{onViewArchive && (
						<Typography.Link
							className="flex items-center gap-1 text-xs !text-[#1f6feb]"
							onClick={(event) => {
								event.stopPropagation();
								onViewArchive(candidate);
							}}
						>
							查看档案
							<RightOutlined className="text-[10px]" />
						</Typography.Link>
					)}
				</div>
			</div>

			<div className="mb-3 border-b border-[#f0f1f3] pb-3">
				<div className="mb-1.5 flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span
							className="h-1.5 w-1.5 rounded-full"
							style={{ backgroundColor: matchLevel.color }}
						/>
						<Text className="text-xs !text-[#909399]">匹配度</Text>
					</div>
					<div className="flex items-center gap-2">
						<Text
							strong
							className="text-[18px] leading-none tracking-[0.01em]"
							style={{ color: matchLevel.color }}
						>
							{matchProgressPercent}%
						</Text>
						<span
							className="rounded-full px-1.5 py-0.5 text-[11px] leading-none"
							style={{
								color: matchLevel.color,
								backgroundColor: matchLevel.bgColor,
							}}
						>
							{matchLevel.text}
						</span>
					</div>
				</div>
				<Progress
					percent={matchProgressPercent}
					showInfo={false}
					strokeColor={matchLevel.color}
					trailColor="#edf1f5"
					size={["100%", 4]}
				/>
			</div>

			<Descriptions
				column={2}
				size="small"
				className="[&_.ant-descriptions-item-content]:text-[#303133] [&_.ant-descriptions-item-label]:pr-2 [&_.ant-descriptions-item-label]:text-[#909399] [&_.ant-descriptions-row>td]:pb-2 [&_.ant-descriptions-row>th]:pb-2 [&_.ant-descriptions-view]:border-0"
				items={[
					{
						label: "岗位",
						children: (
							<Text ellipsis={{ tooltip: candidate.jobName ?? undefined }}>
								{candidate.jobName || "/"}
							</Text>
						),
					},
					{
						label: "职位",
						children: (
							<Text ellipsis={{ tooltip: candidate.positionName ?? undefined }}>
								{candidate.positionName || "/"}
							</Text>
						),
					},
					{
						label: "职级",
						children: (
							<>
								{resolveCandidatePostgradeText(
									candidate as CandidatePostgradeFields,
								)}
							</>
						),
					},
					{
						label: "入职",
						children: (
							<Text ellipsis={{ tooltip: entryDateText }}>{entryDateText}</Text>
						),
					},
					{
						label: "组织",
						span: 2,
						children: (
							<Text
								className="block min-w-0 !text-[#606266]"
								ellipsis={{ tooltip: orgText === "/" ? undefined : orgText }}
							>
								{orgText}
							</Text>
						),
					},
				]}
			/>

			<div
				className={cn(
					"pointer-events-none absolute bottom-0 right-0 flex h-6 min-w-[74px] items-center justify-center rounded-tl-[10px] px-2.5 text-[12px] font-medium leading-none",
					isSelected ? "bg-[#4e8df7] text-white" : "bg-[#e8f1ff] text-[#2f7cff]",
				)}
			>
				{rankLabel}
			</div>
		</div>
	);
}

/**
 * 候选人卡片组件
 *
 * 同时兼容标准版与紧凑版布局，供人岗匹配与排兵布阵等候选人场景复用。
 *
 * @param props - 候选人卡片属性
 * @param props.candidate - 当前候选人数据
 * @param props.isSelected - 当前卡片是否已选中
 * @param props.compact - 是否使用紧凑版布局
 * @param props.readonly - 是否为只读展示
 * @param props.displayRank - 当前卡片展示序号
 * @param props.onViewArchive - 查看候选人档案回调
 * @param props.onClick - 点击卡片时回传候选人
 * @returns 候选人卡片 JSX
 * @author 王善能
 * @since 2026-06-08
 */
export function CandidateCard<T extends OrgBrainCandidateItem = OrgBrainCandidateItem>({
	candidate,
	isSelected = false,
	compact = false,
	readonly = false,
	displayRank,
	onViewArchive,
	onClick,
}: CandidateCardProps<T>) {
	const displayName = candidate.username?.trim() || candidate.empCode || "/";
	const matchProgressPercent = candidate.matchScore;
	const orgText = resolveCandidateOrgText(candidate);
	const matchLevel = useMemo(
		() => getMatchRateLevel(matchProgressPercent),
		[matchProgressPercent],
	);

	if (compact) {
		return (
			<CompactCandidateCard
				candidate={candidate}
				isSelected={isSelected}
				readonly={readonly}
				displayRank={displayRank}
				onViewArchive={onViewArchive}
				onClick={onClick}
			/>
		);
	}

	return (
		<div
			className={cn(
				"group relative rounded-lg border p-4",
				"transition-all duration-200 ease-out",
				!readonly && "cursor-pointer",
				readonly && "cursor-default",
				isSelected
					? "border-[rgb(var(--oo-colorPrimary))] bg-[rgb(var(--oo-colorPrimary)/0.04)] shadow-md"
					: [
							"border-gray-200 bg-white",
							"hover:border-[rgb(var(--oo-colorPrimaryHover))]",
							"hover:-translate-y-1 hover:shadow-lg",
							"hover:bg-[rgb(var(--oo-colorPrimary)/0.02)]",
						],
			)}
			onClick={() => {
				if (!readonly) {
					onClick?.(candidate);
				}
			}}
		>
			{isSelected && (
				<div className="absolute -right-px -top-px flex items-center gap-1 rounded-bl-lg rounded-tr-lg bg-[rgb(var(--oo-colorPrimary))] px-2 py-0.5 text-xs text-white shadow-sm">
					<CheckOutlined />
					<span>已选中</span>
				</div>
			)}

			<div className="mb-3 flex items-start gap-3">
				<Avatar
					size={40}
					className={cn(
						"shrink-0 border transition-colors duration-200",
						isSelected
							? "border-[rgb(var(--oo-colorPrimary))]"
							: "border-[rgb(var(--oo-colorPrimaryHover))] group-hover:border-[rgb(var(--oo-colorPrimary))]",
					)}
					style={{
						backgroundColor: "rgb(var(--oo-colorPrimary) / 0.12)",
						color: "rgb(var(--oo-colorPrimary))",
					}}
				>
					{displayName[displayName.length - 1] || "U"}
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<Text
							strong
							className={cn(
								"truncate text-base",
								isSelected && "text-[rgb(var(--oo-colorPrimary))]",
							)}
						>
							{displayName}
						</Text>
						<Text type="secondary" className="text-xs">
							{candidate.sex}
						</Text>
					</div>
					<Text type="secondary" className="text-xs">
						工号：{candidate.empCode}
					</Text>
				</div>
			</div>

			<div className="mb-3">
				<div className="mb-1 flex items-center justify-between">
					<Text type="secondary" className="text-xs">
						人岗匹配度
					</Text>
					<div className="flex items-center gap-1">
						<Text strong className="text-sm" style={{ color: matchLevel.color }}>
							{matchProgressPercent}%
						</Text>
						<span
							className="rounded px-1.5 py-0.5 text-xs transition-all duration-200"
							style={{
								color: matchLevel.color,
								backgroundColor: matchLevel.bgColor,
							}}
						>
							{matchLevel.text}
						</span>
					</div>
				</div>
				<Progress
					percent={matchProgressPercent}
					showInfo={false}
					strokeColor={matchLevel.color}
					trailColor="#F0F2F5"
					size={["100%", 6]}
				/>
			</div>

			<Descriptions
				column={2}
				size="small"
				items={[
					{
						label: "岗位",
						children: (
							<Text ellipsis={{ tooltip: candidate.jobName }}>
								{candidate.jobName || "/"}
							</Text>
						),
					},
					{
						label: "职位",
						children: (
							<Text ellipsis={{ tooltip: candidate.positionName }}>
								{candidate.positionName || "/"}
							</Text>
						),
					},
					{
						label: "职级",
						children: (
							<>
								{resolveCandidatePostgradeText(
									candidate as CandidatePostgradeFields,
								)}
							</>
						),
					},
					{
						label: "入职时间",
						children: (
							<Text ellipsis={{ tooltip: candidate.entryDate }}>
								{candidate.entryDate || "/"}
							</Text>
						),
					},
					{
						label: "所属组织",
						span: 2,
						children: (
							<Text
								className="block min-w-0 overflow-hidden"
								ellipsis={{ tooltip: orgText === "/" ? undefined : orgText }}
							>
								{orgText}
							</Text>
						),
					},
				]}
			/>
		</div>
	);
}

export type { CandidateCardProps } from "./types";
