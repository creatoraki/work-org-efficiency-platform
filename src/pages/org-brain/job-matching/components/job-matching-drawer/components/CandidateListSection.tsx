import type { JobMatchCandidateItem } from "#src/api/org-brain/candidate";

import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import { SectionTitle } from "#src/components/section-title";
import { CandidateCard } from "#src/pages/org-brain/components";
import { Empty, Skeleton, Typography } from "antd";
import { memo } from "react";

const { Text } = Typography;

/**
 * 生成候选人卡片的稳定唯一 key。
 *
 * 优先使用后端返回的业务主键组合；若单个字段可能重复，则按固定顺序拼接多个稳定字段，
 * 避免 React 在同批候选人里出现 duplicate key 警告。
 *
 * @param candidate - 候选人数据
 * @param index - 当前列表下标，仅作为所有业务字段都缺失时的兜底后缀
 * @returns React 列表 key
 * @author 王善能
 * @since 2026-07-09
 */
function buildCandidateCardKey(candidate: JobMatchCandidateItem, index: number): string {
	const stableSegments = [
		candidate.requestId != null ? `request:${candidate.requestId}` : null,
		candidate.userId != null ? `user:${candidate.userId}` : null,
		candidate.empCode ? `emp:${candidate.empCode}` : null,
		candidate.aiRequestId ? `ai:${candidate.aiRequestId}` : null,
		candidate.id != null ? `id:${candidate.id}` : null,
		candidate.matchRound != null ? `round:${candidate.matchRound}` : null,
		candidate.jobId != null ? `job:${candidate.jobId}` : null,
		candidate.postId != null ? `post:${candidate.postId}` : null,
		candidate.postgradeId ? `grade:${candidate.postgradeId}` : null,
	].filter((segment): segment is string => Boolean(segment));

	if (stableSegments.length > 0) {
		return stableSegments.join("|");
	}

	return `candidate:fallback:${index}`;
}

interface CandidateListSectionProps {
	candidates: JobMatchCandidateItem[];
	selectedCandidates: JobMatchCandidateItem[];
	hasMatched: boolean;
	loading?: boolean;
	errorMessage?: string;
	isMatching: boolean;
	onSelectCandidate: (candidate: JobMatchCandidateItem) => void;
	onViewArchive?: (candidate: JobMatchCandidateItem, candidates: JobMatchCandidateItem[]) => void;
	onViewSelected?: () => void;
	showHeader?: boolean;
	readonly?: boolean;
}

/**
 * 候选人列表加载骨架。
 *
 * 复用真实卡片的双列结构与头部高度，降低匹配请求返回前后的布局跳动。
 *
 * @returns 候选人列表骨架 JSX
 * @author 王善能
 * @since 2026-07-09
 */
function CandidateListLoading() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
			{Array.from({ length: 2 }, (_, index) => `candidate-skeleton-${index + 1}`).map(
				(key) => (
					<div
						key={key}
						className="min-h-[164px] rounded-lg border border-[#e6e8eb] bg-white px-4 pb-8 pt-3.5"
					>
						<div className="mb-3 flex min-h-[56px] items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								<Skeleton.Avatar active size={42} shape="circle" />
								<div className="flex flex-col gap-2">
									<Skeleton.Input
										active
										size="small"
										style={{ width: 96, height: 24 }}
									/>
									<Skeleton.Input
										active
										size="small"
										style={{ width: 140, height: 16 }}
									/>
								</div>
							</div>
							<Skeleton.Button
								active
								size="small"
								shape="round"
								style={{ width: 72 }}
							/>
						</div>

						<div className="mb-3 border-b border-[#f0f1f3] pb-3">
							<div className="mb-1.5 flex items-center justify-between gap-3">
								<Skeleton.Input
									active
									size="small"
									style={{ width: 52, height: 16 }}
								/>
								<Skeleton.Input
									active
									size="small"
									style={{ width: 76, height: 24 }}
								/>
							</div>
							<Skeleton.Input active size="small" block style={{ height: 4 }} />
						</div>

						<div className="grid grid-cols-2 gap-x-8 gap-y-3">
							{Array.from(
								{ length: 5 },
								(_, index) => `candidate-field-${index + 1}`,
							).map((fieldKey) => (
								<Skeleton.Input
									key={fieldKey}
									active
									size="small"
									style={{ width: "100%", height: 16 }}
								/>
							))}
							<Skeleton.Input
								active
								size="small"
								style={{ width: "100%", height: 16, gridColumn: "span 2" }}
							/>
						</div>
					</div>
				),
			)}
		</div>
	);
}

/**
 * 匹配候选人列表区块组件
 *
 * 负责承接匹配中的加载态、已匹配候选人卡片列表以及空状态提示。
 *
 * @param props - 候选人列表区块属性
 * @param props.candidates - 候选人列表
 * @param props.selectedCandidates - 当前多选候选人列表
 * @param props.hasMatched - 是否已经执行过匹配
 * @param props.loading - 是否处于详情初始化加载中
 * @param props.errorMessage - 加载失败提示
 * @param props.isMatching - 是否处于匹配中
 * @param props.onSelectCandidate - 切换当前候选人回调
 * @param props.onViewArchive - 查看人才档案回调
 * @param props.onViewSelected - 查看已选候选人回调
 * @param props.showHeader - 是否显示标题区
 * @param props.readonly - 是否只读
 * @returns 匹配候选人列表区块 JSX
 * @author 王善能
 * @since 2026-06-08
 */
function CandidateListSectionInner({
	candidates,
	selectedCandidates,
	hasMatched,
	loading = false,
	errorMessage,
	isMatching,
	onSelectCandidate,
	onViewArchive,
	onViewSelected,
	showHeader = true,
	readonly = false,
}: CandidateListSectionProps) {
	const isContentLoading = loading || isMatching;
	const hasSelectedCandidates = selectedCandidates.length > 0;

	return (
		<div className="job-matching-candidate-section">
			{showHeader && (
				<SectionTitle
					title="匹配候选人"
					className="mb-3"
					extra={
						<div className="flex min-h-[22px] items-center justify-end">
							{hasSelectedCandidates ? (
								<div className="flex items-center justify-end gap-3 whitespace-nowrap text-sm">
									<Text className="!text-[#4b5563]">
										已选候选人
										<Text strong className="mx-1 !text-[#1f2329]">
											{selectedCandidates.length}
										</Text>
										人
									</Text>
									{onViewSelected && (
										<Typography.Link
											className="text-sm"
											onClick={onViewSelected}
										>
											查看已选 &gt;
										</Typography.Link>
									)}
								</div>
							) : null}
						</div>
					}
				/>
			)}

			{isContentLoading ? (
				<div className="min-h-[320px]">
					<CandidateListLoading />
				</div>
			) : errorMessage ? (
				<div className="flex flex-col items-center justify-center py-16 text-gray-400">
					<Empty image={EmptyDataSvg} description="加载失败" />
					<Text className="mt-2">{errorMessage}</Text>
				</div>
			) : hasMatched && candidates.length > 0 ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					{candidates.map((candidate, index) => (
						<CandidateCard
							key={buildCandidateCardKey(candidate, index)}
							candidate={candidate}
							isSelected={selectedCandidates.some((item) => {
								if (item.userId != null && candidate.userId != null) {
									return item.userId === candidate.userId;
								}
								return (
									item.empCode &&
									candidate.empCode &&
									item.empCode === candidate.empCode
								);
							})}
							compact
							readonly={readonly}
							onViewArchive={
								onViewArchive && candidate.userId != null
									? (currentCandidate) =>
											onViewArchive(currentCandidate, candidates)
									: undefined
							}
							onClick={readonly ? undefined : onSelectCandidate}
						/>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-gray-400">
					<Empty image={EmptyDataSvg} description="暂无数据" />
					<Text className="mt-2">
						{readonly
							? "当前任务暂无匹配候选人"
							: "请设置「人岗匹配基本信息」，再进行「结果匹配」"}
					</Text>
				</div>
			)}
		</div>
	);
}

/**
 * 匹配候选人区块记忆化组件。
 *
 * 将基础表单字段输入与候选人卡片渲染隔离，避免表单输入过程中
 * 大量候选人卡片随父级重复刷新，提升抽屉交互流畅度。
 *
 * @author 王善能
 * @since 2026-07-09
 */
export const CandidateListSection = memo(CandidateListSectionInner);

CandidateListSection.displayName = "CandidateListSection";
