/**
 * 标签单元格组件（带箭头旋转动画）
 * 供人员档案模块的三个子模块共享使用
 */

import { CaretDownOutlined } from "@ant-design/icons";
import { List, Popover, Typography } from "antd";
import { Fragment, useState } from "react";

const { Text } = Typography;

/**
 * 标签单元格组件属性
 */
export interface TagsCellProps {
	/** 标签文本，使用分隔符连接 */
	tagsText?: string;
	/** 标签数组，优先级高于 tagsText */
	tags?: string[];
	/** 分隔符，默认为逗号（仅当 tagsText 生效时使用） */
	separator?: string;
}

/**
 * 标签单元格组件（带箭头旋转动画）
 */
export const TagsCell: React.FC<TagsCellProps> = ({ tagsText, tags, separator = "," }) => {
	const [isOpen, setIsOpen] = useState(false);

	const resolvedTags = (
		tags && tags.length > 0
			? tags
			: tagsText && tagsText !== "-"
				? tagsText.split(separator)
				: []
	)
		.map((tag) => tag.trim())
		.filter((tag) => tag);

	// 处理空值情况
	if (resolvedTags.length === 0) {
		return <span>-</span>;
	}

	const tagCount = resolvedTags.length;
	const firstTag = resolvedTags[0] ?? "";

	// Popover 内容
	const popoverContent = (
		<div className="max-h-48 overflow-y-auto pr-1">
			<List
				size="small"
				bordered={false}
				split={false}
				dataSource={resolvedTags}
				renderItem={(tag) => (
					<List.Item className="flex items-center !px-0 !py-1">
						<span className="mr-2 inline-block h-1.5 w-1.5 flex-shrink-0 translate-y-[-2px] rounded-full bg-blue-500" />
						{tag}
					</List.Item>
				)}
			/>
		</div>
	);

	// 根据标签数量决定渲染方式
	switch (tagCount) {
		case 0:
			return <span>-</span>;
		case 1:
		case 2:
			// 小于等于2个：直接显示所有标签，不使用 Popover
			return (
				<div className="inline-flex min-w-0 max-w-full items-center gap-1">
					<Text
						ellipsis={{
							tooltip: resolvedTags.join("、"),
						}}
						className="whitespace-nowrap"
					>
						{resolvedTags.map((tag, index) => (
							<Fragment key={tag}>
								{index > 0 && <span className="text-gray-400">、</span>}
								{tag}
							</Fragment>
						))}
					</Text>
				</div>
			);
		default:
			// 大于2个：使用 Popover 显示第一个标签 + "共X项" + 图标
			return (
				<Popover content={popoverContent} trigger="hover" onOpenChange={setIsOpen}>
					<div className="inline-flex max-w-full cursor-pointer items-center gap-1">
						<span className="min-w-0 truncate">{firstTag}</span>
						<span className="inline-flex flex-shrink-0 items-center whitespace-nowrap text-xs text-blue-500">
							共{tagCount}
							项
							<CaretDownOutlined
								className={`text-xs text-blue-500 transition-transform duration-200 ${
									isOpen ? "rotate-180" : ""
								}`}
							/>
						</span>
					</div>
				</Popover>
			);
	}
};
