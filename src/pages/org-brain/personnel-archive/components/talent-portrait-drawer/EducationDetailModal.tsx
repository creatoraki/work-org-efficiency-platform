/**
 * 学历详情弹窗
 * 展示学历金字塔和当前评分
 *
 * @author 王善能
 * @date 2026-04-16
 */

import SuccessAlertIcon from "#src/assets/small-icons/talent-archive/success-alert.svg?react";
import { useDict } from "#src/hooks";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "#src/pages/personnel-archive/config";
import { Modal } from "antd";
import { Pyramid } from "./Pyramid";

interface EducationDetailModalProps {
	/** 是否打开 */
	open: boolean;
	/** 当前分数 */
	score: number;
	/** 当前学历刻度描述 */
	scaleLabel: string;
	/** 第一学历 */
	firstDegree?: string;
	/** 第一学历学校 */
	firstDegreeSchool?: string;
	/** 最高学历 */
	highestDegree?: string;
	/** 最高学历学校 */
	highestDegreeSchool?: string;
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
 * 学历详情弹窗组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function EducationDetailModal({
	open,
	score,
	scaleLabel,
	firstDegree,
	firstDegreeSchool,
	highestDegree,
	highestDegreeSchool,
	onClose,
}: EducationDetailModalProps) {
	const { data: educationData = [] } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.EDUCATION);

	const educationLevels = educationData.map((item) => ({
		key: `level-${item.dictValue}`,
		height: 53,
		score: `${item.dictValue}分`,
		label: item.dictLabel,
		labelWidth: 158,
	}));

	const activeKey = getActiveKeyByScore(score, educationLevels);
	const currentScore = `${score}分`;

	// 拼接学校和学历
	const firstDegreeDisplay =
		firstDegreeSchool && firstDegree
			? `${firstDegreeSchool}-${firstDegree}`
			: firstDegree || scaleLabel || "/";

	const highestDegreeDisplay =
		highestDegreeSchool && highestDegree
			? `${highestDegreeSchool}-${highestDegree}`
			: highestDegree || scaleLabel || "/";

	const educationSummary = (
		<div className="flex gap-2 px-4 py-2" style={{ background: "var(---G1, #E3F7ED)" }}>
			<div className="mt-[3px] shrink-0">
				<SuccessAlertIcon />
			</div>
			<div className="space-y-2 text-sm leading-6 text-[#1F2D3D]">
				<div>
					当前评分：
					<span className="ml-1 font-medium">{currentScore}</span>
				</div>
				<div>
					第一学历：
					<span className="ml-1 font-medium">{firstDegreeDisplay}</span>
					<span className="mx-3 text-[#B7C8BC]">;</span>
					最高学历：
					<span className="ml-1 font-medium">{highestDegreeDisplay}</span>
				</div>
			</div>
		</div>
	);

	return (
		<Modal
			open={open}
			title="学历"
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
			<Pyramid levelList={educationLevels} activeKey={activeKey} summary={educationSummary} />
		</Modal>
	);
}
