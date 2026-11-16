import type { DeployCandidateItem } from "#src/api/org-brain/candidate";
import type { DeploymentPlanStaffConfigItem } from "#src/api/org-brain/deployment";

import { SelectedCandidatesModal } from "#src/pages/org-brain/components";
import { Button, Drawer, Typography } from "antd";
import message from "antd/es/message";
import { useCallback, useEffect, useState } from "react";

import { DeploymentCandidateListHeader, DeploymentCandidateListSection } from "../candidate-pool";

const { Text } = Typography;

const EMPTY_CANDIDATES: DeployCandidateItem[] = [];
const EMPTY_STAFF_CONFIGS: DeploymentPlanStaffConfigItem[] = [];

/** 候选人抽屉所需的节点数据（从 DeploymentNodeData 精简） */
export interface DeploymentCandidateDrawerNodeData {
	positionName?: string;
	staffCount?: number;
	staffConfigList?: DeploymentPlanStaffConfigItem[];
	candidates?: DeployCandidateItem[];
	departmentLine?: string;
	name?: string;
}

interface DeploymentCandidateDrawerProps {
	open: boolean;
	nodeData: DeploymentCandidateDrawerNodeData | null;
	candidatesLoading?: boolean;
	onClose: () => void;
	onConfirm: (staffConfigList: DeploymentPlanStaffConfigItem[]) => void;
	onViewArchive?: (candidate: DeployCandidateItem, candidates: DeployCandidateItem[]) => void;
}

function buildStaffConfigFromCandidate(
	candidate: DeployCandidateItem,
	existing?: DeploymentPlanStaffConfigItem,
): DeploymentPlanStaffConfigItem {
	return {
		...existing,
		empCode: candidate.empCode,
		empName: candidate.username?.trim() || candidate.empCode,
		recommendId: candidate.id ?? existing?.recommendId,
		jobName: candidate.jobName,
		positionName: candidate.positionName,
		positionLevel: candidate.positionLevel ?? "",
		departmentLine: existing?.departmentLine,
		jobCode: existing?.jobCode ?? candidate.jobCode,
		positionCode: existing?.positionCode ?? candidate.positionCode,
		matchScore: candidate.matchScore,
	};
}

/**
 * 排兵布阵候选人选择抽屉。
 */
export function DeploymentCandidateDrawer({
	open,
	nodeData,
	candidatesLoading = false,
	onClose,
	onConfirm,
	onViewArchive,
}: DeploymentCandidateDrawerProps) {
	const candidates = nodeData?.candidates ?? EMPTY_CANDIDATES;
	const maxCount = nodeData?.staffCount ?? candidates.length;
	const existingConfigs = nodeData?.staffConfigList ?? EMPTY_STAFF_CONFIGS;

	const [selectedCandidates, setSelectedCandidates] = useState<DeployCandidateItem[]>([]);
	const [headerCandidate, setHeaderCandidate] = useState<DeployCandidateItem | null>(null);
	const [isSelectedCandidatesModalOpen, setIsSelectedCandidatesModalOpen] = useState(false);

	useEffect(() => {
		if (!open) {
			setSelectedCandidates((prev) => (prev.length === 0 ? prev : []));
			setHeaderCandidate((prev) => (prev === null ? prev : null));
			return;
		}
		if (candidates.length === 0) {
			return;
		}

		const selectedEmpCodes = new Set(
			existingConfigs.map((config) => config.empCode).filter(Boolean),
		);
		const matchedFromConfig =
			selectedEmpCodes.size > 0
				? candidates.filter(
						(candidate) => candidate.empCode && selectedEmpCodes.has(candidate.empCode),
					)
				: [];
		const initialSelected =
			matchedFromConfig.length > 0
				? matchedFromConfig.slice(0, maxCount)
				: candidates.slice(0, maxCount);

		setSelectedCandidates(initialSelected);
		setHeaderCandidate(initialSelected[0] ?? null);
	}, [open, existingConfigs, candidates, maxCount]);

	const selectCandidate = useCallback(
		(candidate: DeployCandidateItem) => {
			setHeaderCandidate(candidate);
			setSelectedCandidates((prev) => {
				if (prev.some((item) => item.empCode === candidate.empCode)) {
					return prev.filter((item) => item.empCode !== candidate.empCode);
				}
				if (prev.length >= maxCount) {
					message.warning(`已选满 ${maxCount} 人，如需更换请先取消已选人员`);
					return prev;
				}
				return [...prev, candidate];
			});
		},
		[maxCount],
	);

	const drawerTitle = nodeData
		? `${nodeData.positionName}（${nodeData.staffCount ?? 0}岗）候选池`
		: "候选池";

	const headerSelectedCandidate =
		(headerCandidate &&
		selectedCandidates.some((item) => item.empCode === headerCandidate.empCode)
			? headerCandidate
			: null) ??
		selectedCandidates[0] ??
		null;

	const isSelectionCountValid = selectedCandidates.length === maxCount;
	const selectionSummary = `已选 ${selectedCandidates.length}/${maxCount} 人`;

	return (
		<>
			<Drawer
				open={open}
				onClose={onClose}
				title={drawerTitle}
				width={1032}
				closable={{ placement: "end" }}
				styles={{ body: { padding: 0 } }}
				footer={
					<div className="flex items-center justify-between gap-4">
						<div className="min-w-0">
							<Text className="text-sm text-[#606266]">{selectionSummary}</Text>
							{!isSelectionCountValid && (
								<Text className="ml-3 text-sm text-[#F5222D]">
									需与岗位所需人数保持一致后才可保存
								</Text>
							)}
						</div>
						<div className="flex justify-end gap-2">
							<Button onClick={onClose}>取消</Button>
							<Button
								type="primary"
								disabled={!isSelectionCountValid}
								onClick={() => {
									const staffConfigList = selectedCandidates.map(
										(candidate, index) =>
											buildStaffConfigFromCandidate(
												candidate,
												existingConfigs[index],
											),
									);
									onConfirm(staffConfigList);
								}}
							>
								保存
							</Button>
						</div>
					</div>
				}
			>
				<div className="flex h-full min-w-0 flex-col">
					<div className="shrink-0 px-6 pb-2 pt-4">
						<DeploymentCandidateListHeader
							selectedCount={selectedCandidates.length}
							onViewSelected={() => setIsSelectedCandidatesModalOpen(true)}
						/>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
						<DeploymentCandidateListSection
							candidates={candidates}
							selectedCandidate={headerSelectedCandidate}
							hasMatched
							isMatching={candidatesLoading}
							onSelectCandidate={selectCandidate}
							onViewArchive={onViewArchive}
							showHeader={false}
							onViewSelected={() => setIsSelectedCandidatesModalOpen(true)}
							getIsSelected={(candidate) =>
								selectedCandidates.some(
									(item) => item.empCode === candidate.empCode,
								)
							}
						/>
					</div>
				</div>
			</Drawer>

			<SelectedCandidatesModal
				open={isSelectedCandidatesModalOpen}
				selectedCandidates={selectedCandidates}
				onCancel={() => setIsSelectedCandidatesModalOpen(false)}
				onViewArchive={
					onViewArchive
						? (candidate) => onViewArchive(candidate, selectedCandidates)
						: undefined
				}
				onDeselectCandidate={selectCandidate}
			/>
		</>
	);
}
