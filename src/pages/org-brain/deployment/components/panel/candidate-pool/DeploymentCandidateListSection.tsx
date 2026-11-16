/**
 * 排兵布阵候选池「匹配候选人」列表区块。
 */

import type { DeployCandidateItem } from "#src/api/org-brain/candidate";

import EmptyDataSvg from "#src/assets/svg/empty-data.svg";
import { SectionTitle } from "#src/components/section-title";
import { CandidateCard } from "#src/pages/org-brain/components";
import { Empty, Spin, Typography } from "antd";

const { Text } = Typography;

interface DeploymentCandidateListSectionProps {
	candidates: DeployCandidateItem[];
	selectedCandidate: DeployCandidateItem | null;
	hasMatched: boolean;
	isMatching: boolean;
	onSelectCandidate: (candidate: DeployCandidateItem) => void;
	onViewArchive?: (candidate: DeployCandidateItem, candidates: DeployCandidateItem[]) => void;
	showHeader?: boolean;
	getIsSelected?: (candidate: DeployCandidateItem) => boolean;
	onViewSelected?: () => void;
}

interface DeploymentCandidateListHeaderProps {
	selectedCount: number;
	onViewSelected?: () => void;
}

export function DeploymentCandidateListHeader({
	selectedCount,
	onViewSelected,
}: DeploymentCandidateListHeaderProps) {
	return (
		<SectionTitle
			title="匹配候选人"
			extra={
				selectedCount > 0 ? (
					<div className="flex items-center justify-end gap-3 whitespace-nowrap text-sm">
						<Text className="!text-[#4b5563]">
							已选候选人
							<Text strong className="mx-1 !text-[#1f2329]">
								{selectedCount}
							</Text>
							人
						</Text>
						{onViewSelected ? (
							<Typography.Link className="text-sm" onClick={onViewSelected}>
								查看已选 &gt;
							</Typography.Link>
						) : null}
					</div>
				) : null
			}
		/>
	);
}

export function DeploymentCandidateListSection({
	candidates,
	selectedCandidate,
	hasMatched,
	isMatching,
	onSelectCandidate,
	onViewArchive,
	showHeader = true,
	getIsSelected,
	onViewSelected,
}: DeploymentCandidateListSectionProps) {
	const selectedCount = candidates.filter((candidate) =>
		getIsSelected ? getIsSelected(candidate) : selectedCandidate?.empCode === candidate.empCode,
	).length;

	const resolveIsSelected = (candidate: DeployCandidateItem) => {
		if (getIsSelected) {
			return getIsSelected(candidate);
		}
		return selectedCandidate?.empCode === candidate.empCode;
	};

	return (
		<div className="deployment-candidate-section">
			{showHeader && (
				<div className="mb-3">
					<DeploymentCandidateListHeader
						selectedCount={selectedCount}
						onViewSelected={onViewSelected}
					/>
				</div>
			)}

			<Spin spinning={isMatching}>
				{hasMatched && candidates.length > 0 ? (
					<div className="grid grid-cols-2 gap-6">
						{candidates.map((candidate, index) => (
							<CandidateCard
								key={candidate.userId ?? candidate.empCode ?? candidate.id}
								candidate={candidate}
								isSelected={resolveIsSelected(candidate)}
								displayRank={index + 1}
								compact
								onViewArchive={
									onViewArchive
										? (currentCandidate) =>
												onViewArchive(currentCandidate, candidates)
										: undefined
								}
								onClick={onSelectCandidate}
							/>
						))}
					</div>
				) : isMatching ? (
					<div className="min-h-60" />
				) : (
					<div className="flex flex-col items-center justify-center py-16 text-gray-400">
						<Empty image={EmptyDataSvg} description="暂无候选人数据" />
					</div>
				)}
			</Spin>
		</div>
	);
}
