import type { TalentArchiveDevelopmentItem } from "#src/api/org-brain/personnel-archive";

import DoubleChevronRightIcon from "#src/assets/small-icons/talent-archive/double-chevron-right.svg?react";
import { SectionTitle } from "#src/components";
import { Typography } from "antd";

import { SectionEmptyState } from "./SectionEmptyState";

const { Text } = Typography;

interface DevelopmentSectionProps {
	/** 发展规划数据 */
	data: TalentArchiveDevelopmentItem[];
}

/**
 * 发展规划区块组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function DevelopmentSection({ data }: DevelopmentSectionProps) {
	if (data.length === 0) {
		return (
			<div>
				<SectionTitle title="发展规划" className="mb-3" />
				<SectionEmptyState description="暂无发展规划数据" />
			</div>
		);
	}

	return (
		<div>
			<SectionTitle title="发展规划" className="mb-3" />
			<div className="rounded border border-gray-200 p-4 pb-1">
				<div className="overflow-x-auto pb-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
					<div className="flex min-w-max">
						{data?.map((item, index) => (
							<div key={item.year} className="min-w-[200px] flex-1">
								{/* 图标和连接线 */}
								<div className="mb-2 flex items-center">
									<div
										className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
										style={{ backgroundColor: "#0075FF" }}
									>
										<DoubleChevronRightIcon />
									</div>
									{index < data.length - 1 && (
										<div
											className="h-0 flex-1 border-t-2 border-dashed"
											style={{ borderColor: "#0075FF" }}
										/>
									)}
								</div>
								{/* 内容 */}
								<div className="pr-4">
									<Text strong className="block">
										{item.year}
									</Text>
									<Text type="secondary" className="text-sm">
										{item.target}
									</Text>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
