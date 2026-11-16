import type { TalentArchiveEducationItem } from "#src/api/org-brain/personnel-archive";
import type { StepProps } from "antd";

import { SectionTitle } from "#src/components";
import { Steps, Typography } from "antd";

import { useMemo } from "react";
import { SectionEmptyHint } from "./SectionEmptyHint";

const { Text } = Typography;

interface EducationSectionProps {
	/** 教育经历数据 */
	data: TalentArchiveEducationItem[];
}

/**
 * 教育经历区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function EducationSection({ data }: EducationSectionProps) {
	// 转换为 Steps 组件需要的格式
	const stepsItems = useMemo(
		() =>
			data.map((item) => ({
				title: (
					<div className="grid w-full grid-cols-3 items-center gap-4">
						<Text>
							{item.startDate && item.endDate
								? `${item.startDate} 至 ${item.endDate}`
								: "/"}
						</Text>
						<Text>{item.school}</Text>
						<Text>{item.degree}</Text>
					</div>
				),
				status: "finish",
			})),
		[data],
	);

	if (data.length === 0) {
		return (
			<div>
				<SectionTitle
					title="教育经历"
					titleExtra={<SectionEmptyHint text="暂无教育经历数据" />}
					className="mb-3"
				/>
			</div>
		);
	}

	return (
		<div>
			<SectionTitle title="教育经历" className="mb-3" />
			<div className="rounded border border-gray-200 p-4 pb-0 [&_.ant-steps-item-title]:!flex [&_.ant-steps-item-title]:h-8 [&_.ant-steps-item-title]:items-center">
				<Steps
					direction="vertical"
					progressDot
					current={0}
					items={stepsItems as StepProps[]}
				/>
			</div>
		</div>
	);
}
