/**
 * 绩效弹窗
 * 展示绩效金字塔和当前评分
 *
 * @author 王善能
 * @date 2026-04-16
 */

import SuccessAlertIcon from "#src/assets/small-icons/talent-archive/success-alert.svg?react";
import { useDict } from "#src/hooks";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "#src/pages/personnel-archive/config";
import { Modal } from "antd";
import { Pyramid } from "./Pyramid";

interface PerformanceDetailModalProps {
	/** 是否打开 */
	open: boolean;
	/** 当前分数 */
	score: number;
	/** 当前绩效等级描述 */
	gradeLabel: string;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 根据分数获取对应的层级 key
 */
function getActiveKeyByScore(score: number, levels: any[]): string | null {
	const level = levels.find((level) => level.score === `${score}分`);
	return level?.key || null;
}

/**
 * 绩效弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function PerformanceDetailModal({
	open,
	score,
	gradeLabel,
	onClose,
}: PerformanceDetailModalProps) {
	const { data: performanceData = [] } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.PERFORMANCE);

	const performanceLevels = performanceData.map((item) => ({
		key: `level-${item.dictValue}`,
		height: 73,
		score: `${item.dictValue}分`,
		label: item.dictLabel,
		labelWidth: 138,
	}));

	const activeKey = getActiveKeyByScore(score, performanceLevels);
	const currentScore = `${score}分`;
	const performanceSummary = (
		<div className="flex gap-2 px-4 py-2" style={{ background: "var(---G1, #E3F7ED)" }}>
			<div className="mt-[3px] shrink-0">
				<SuccessAlertIcon />
			</div>
			<div className="space-y-2 text-sm leading-6 text-[#1F2D3D]">
				<div>
					当前评分：
					<span className="ml-1 font-medium">
						{currentScore}
						{gradeLabel ? `（${gradeLabel}）` : ""}
					</span>
				</div>
			</div>
		</div>
	);

	return (
		<Modal
			open={open}
			title="绩效"
			onCancel={onClose}
			footer={null}
			centered
			width={800}
			styles={{
				body: {
					padding: 0,
				},
			}}
		>
			<Pyramid
				levelList={performanceLevels}
				activeKey={activeKey}
				summary={performanceSummary}
			/>
		</Modal>
	);
}
