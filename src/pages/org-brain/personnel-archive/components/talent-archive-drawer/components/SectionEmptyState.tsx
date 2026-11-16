/**
 * 人才档案区块空态组件
 *
 * @author 王善能
 * @date 2026-04-16
 */

import { InboxOutlined } from "@ant-design/icons";
import { Empty, Typography } from "antd";

const { Paragraph, Text } = Typography;

interface SectionEmptyStateProps {
	/** 标题 */
	title?: string;
	/** 空态文案 */
	description?: string;
}

/**
 * 人才档案区块统一空态
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function SectionEmptyState({
	title,
	description = "当前未返回可展示内容",
}: SectionEmptyStateProps) {
	return (
		<div className="rounded-2xl border border-dashed border-[#D9E1EC] bg-[linear-gradient(180deg,#FCFDFF_0%,#F7FAFF_100%)] px-6 py-8">
			<Empty
				className="my-0"
				image={
					<div className="relative mx-auto h-[92px] w-[120px]">
						<div className="absolute left-1/2 top-1 h-14 w-14 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(22,119,255,0.18)_0%,rgba(22,119,255,0.04)_58%,rgba(22,119,255,0)_100%)]" />
						<div className="absolute inset-x-3 bottom-3 h-9 rounded-full bg-[linear-gradient(90deg,rgba(22,119,255,0.04)_0%,rgba(22,119,255,0.10)_50%,rgba(22,119,255,0.04)_100%)] blur-sm" />
						<div className="absolute inset-x-4 top-7 h-12 rounded-2xl border border-[#D9E6FF] bg-white/95 shadow-[0_10px_28px_rgba(22,119,255,0.08)]" />
						<div className="absolute left-1/2 top-4 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-[18px] border border-[#D6E4FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#F3F8FF_100%)] shadow-[0_12px_32px_rgba(22,119,255,0.14)]">
							<InboxOutlined className="text-[20px] text-[#7AA2FF]" />
						</div>
					</div>
				}
				description={
					<div className="mx-auto max-w-[280px] text-center">
						{title && (
							<Text className="block text-[15px] font-medium text-[#303133]">
								{title}
							</Text>
						)}
						<Paragraph
							className={
								title
									? "mb-0 mt-2 text-sm leading-6 text-[#909399]"
									: "mb-0 text-sm leading-6 text-[#909399]"
							}
						>
							{description}
						</Paragraph>
					</div>
				}
			/>
			<div className="mt-4 flex justify-center">
				<div className="rounded-full border border-white/80 bg-white/70 px-3 py-1 text-xs text-[#A0A8B8] shadow-[0_4px_16px_rgba(15,23,42,0.04)] backdrop-blur-sm">
					等待业务数据返回后自动展示
				</div>
			</div>
		</div>
	);
}
