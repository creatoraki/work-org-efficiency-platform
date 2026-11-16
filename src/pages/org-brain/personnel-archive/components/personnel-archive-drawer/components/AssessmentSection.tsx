import type { TalentArchiveAssessmentItem } from "#src/api/org-brain/personnel-archive";

import { SectionTitle } from "#src/components";

import { Tag, Typography } from "antd";

const { Text } = Typography;

interface AssessmentSectionProps {
	/** 考核绩效数据 */
	data: TalentArchiveAssessmentItem[];
}

/**
 * 考核绩效区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function AssessmentSection({ data }: AssessmentSectionProps) {
	return (
		<div>
			<SectionTitle title="考核绩效" className="mb-3" />
			<div className="rounded border border-gray-200 p-4 pb-1">
				<div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
					{data.map((item) => (
						<div
							key={item.year}
							className="relative w-[160px] flex-shrink-0 rounded bg-[#F5F7FA] px-4 py-3 text-center"
						>
							<div className="mb-1 flex items-center justify-center gap-1 text-xl">
								{item.grade}
								{item.isLatest && (
									<Tag color="blue" bordered={false}>
										最新
									</Tag>
								)}
							</div>
							<Text type="secondary" className="text-sm">
								{item.year}
							</Text>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
