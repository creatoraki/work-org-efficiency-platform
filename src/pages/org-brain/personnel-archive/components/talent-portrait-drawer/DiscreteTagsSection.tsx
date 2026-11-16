import type { TalentPortraitTagItem } from "#src/api/org-brain/personnel-archive";
import { getPersonnelArchiveTagDisplayName } from "#src/pages/org-brain/personnel-archive/components/tag-display";
import { cn } from "#src/utils/index.js";
import { Divider, Tooltip, Typography } from "antd";

const { Text } = Typography;

/**
 * 离散标签展示组件属性
 */
interface DiscreteTagsSectionProps {
	/** 标题 */
	title: string;
	/** 标签列表 */
	tags: TalentPortraitTagItem[];
	/** 类名 */
	className?: string;
}

/**
 * 离散标签展示组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function DiscreteTagsSection({ title, tags, className }: DiscreteTagsSectionProps) {
	return (
		<div
			className={cn(
				"flex min-h-0 flex-col overflow-hidden rounded border bg-white p-2",
				className,
			)}
		>
			<Text strong className="flex-shrink-0 text-base">
				{title}
			</Text>

			<Divider className="my-3 flex-shrink-0" />

			<div className="custom-scrollbar flex min-h-0 flex-1 flex-wrap content-start items-start gap-2 overflow-y-auto overflow-x-hidden">
				{tags.length > 0 ? (
					tags.map((tag) => (
						<Tooltip key={tag.tagId} title={tag.tagName}>
							<span className="inline-flex min-w-0 max-w-full items-center self-start whitespace-normal break-words rounded bg-[#EBEEF5] px-3 py-1.5 leading-5">
								{getPersonnelArchiveTagDisplayName(tag)}
							</span>
						</Tooltip>
					))
				) : (
					<Text type="secondary">{`暂无${title}`}</Text>
				)}
			</div>
		</div>
	);
}
