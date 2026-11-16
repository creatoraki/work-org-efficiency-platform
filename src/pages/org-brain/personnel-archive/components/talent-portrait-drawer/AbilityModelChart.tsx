/**
 * 能力模型图表组件
 * 展示人才画像的五大能力模块：服务心、本体力、运营力、数智力、市场力
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentPortraitTagItem } from "#src/api/org-brain/personnel-archive";
import talentPortraitPie2x from "#src/assets/talent-portrait-pie@2x.png";
import { getPersonnelArchiveTagDisplayName } from "#src/pages/org-brain/personnel-archive/components/tag-display";
import { cn } from "#src/utils/index.js";
import { CaretDownOutlined } from "@ant-design/icons";
import { List, Popover, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

// 使用稳定常量避免默认参数创建新数组，触发不必要的引用变化。
const EMPTY_TAGS: TalentPortraitTagItem[] = [];

/**
 * 能力模块数据
 */
interface AbilityModule {
	/** 模块名称 */
	name: string;
	/** 模块标签列表 */
	tags: TalentPortraitTagItem[];
	/** 定位位置（相对于容器的百分比） */
	position: {
		/** 水平位置（0-100） */
		x: number;
		/** 垂直位置（0-100） */
		y: number;
	};
}

/**
 * 能力模型图表组件属性
 */
interface AbilityModelChartProps {
	/** 服务心标签列表 */
	serviceHeartTags?: TalentPortraitTagItem[];
	/** 本体力标签列表 */
	bodyForceTags?: TalentPortraitTagItem[];
	/** 运营力标签列表 */
	operationTags?: TalentPortraitTagItem[];
	/** 数智力标签列表 */
	intelligenceTags?: TalentPortraitTagItem[];
	/** 市场力标签列表 */
	marketTags?: TalentPortraitTagItem[];
	/** 类名 */
	className?: string;
}

/**
 * 能力模型图表组件。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function AbilityModelChart({
	serviceHeartTags = EMPTY_TAGS,
	bodyForceTags = EMPTY_TAGS,
	operationTags = EMPTY_TAGS,
	intelligenceTags = EMPTY_TAGS,
	marketTags = EMPTY_TAGS,
	className,
}: AbilityModelChartProps) {
	// 五个能力模块的弹层状态独立维护，避免共享开关导致联动闪烁。
	const [isServiceHeartPopoverOpen, setIsServiceHeartPopoverOpen] = useState(false);
	const [isBodyForcePopoverOpen, setIsBodyForcePopoverOpen] = useState(false);
	const [isOperationPopoverOpen, setIsOperationPopoverOpen] = useState(false);
	const [isIntelligencePopoverOpen, setIsIntelligencePopoverOpen] = useState(false);
	const [isMarketPopoverOpen, setIsMarketPopoverOpen] = useState(false);

	// 模块坐标与底图视觉稿一一对应，不建议在渲染层再做二次推导。
	const abilityModules: AbilityModule[] = [
		{
			name: "服务心",
			tags: serviceHeartTags,
			position: { x: 49.5, y: 9 },
		},
		{
			name: "本体力",
			tags: bodyForceTags,
			position: { x: 83, y: 40 },
		},
		{
			name: "运营力",
			tags: operationTags,
			position: { x: 78, y: 86 },
		},
		{
			name: "数智力",
			tags: intelligenceTags,
			position: { x: 20, y: 86 },
		},
		{
			name: "市场力",
			tags: marketTags,
			position: { x: 16, y: 40 },
		},
	];

	const renderAbilityModule = (module: AbilityModule, index: number) => {
		const { name, tags, position } = module;
		const hasMoreTags = tags.length > 2;
		const displayTags = tags.slice(0, 2);
		const remainingCount = tags.length - 2;

		// 渲染顺序与状态数组顺序保持一致，避免模块标题与弹层状态错位。
		const popoverStates = [
			{ isOpen: isServiceHeartPopoverOpen, setIsOpen: setIsServiceHeartPopoverOpen },
			{ isOpen: isBodyForcePopoverOpen, setIsOpen: setIsBodyForcePopoverOpen },
			{ isOpen: isOperationPopoverOpen, setIsOpen: setIsOperationPopoverOpen },
			{ isOpen: isIntelligencePopoverOpen, setIsOpen: setIsIntelligencePopoverOpen },
			{ isOpen: isMarketPopoverOpen, setIsOpen: setIsMarketPopoverOpen },
		];
		const { isOpen, setIsOpen } = popoverStates[index];

		const content = (
			<div className="max-w-xs">
				<Text strong className="mb-2 block text-base">
					{name}
				</Text>
				<div className="custom-scrollbar max-h-48 overflow-y-auto pr-1">
					<List
						size="small"
						bordered={false}
						split={false}
						dataSource={tags}
						renderItem={(tag) => (
							<List.Item className="flex items-center !px-0 !py-1">
								<span className="mr-2 inline-block h-1.5 w-1.5 flex-shrink-0 translate-y-[-2px] rounded-full bg-blue-500" />
								{getPersonnelArchiveTagDisplayName(tag)}
							</List.Item>
						)}
					/>
				</div>
			</div>
		);

		return (
			<div
				key={name}
				className="absolute z-20"
				style={{
					left: `${position.x}%`,
					top: `${position.y}%`,
					transform: "translate(-50%, -50%)",
				}}
			>
				<div className="flex flex-col items-center gap-1">
					{displayTags.length > 0 && (
						<div className="flex w-[200px] flex-wrap items-center gap-1 rounded border border-white bg-white/50 p-1.5 shadow-[inset_0_0_2px_0_rgba(255,255,255,0.25)]">
							{displayTags.map((tag) => (
								<div
									key={tag.tagId}
									className="flex items-center justify-center gap-2.5 rounded bg-[#EBEEF5] px-2 py-0.5"
								>
									<Text className="whitespace-nowrap text-xs">
										{getPersonnelArchiveTagDisplayName(tag)}
									</Text>
								</div>
							))}
							{hasMoreTags && (
								<Popover
									content={content}
									open={isOpen}
									onOpenChange={setIsOpen}
									trigger="hover"
									placement="top"
									overlayInnerStyle={{ maxHeight: "400px", overflow: "hidden" }}
								>
									<Text className="group inline-flex cursor-pointer items-center gap-1 text-xs text-[#0075FF]">
										等{remainingCount}
										项
										<CaretDownOutlined className="transition-transform duration-300 group-hover:rotate-180" />
									</Text>
								</Popover>
							)}
						</div>
					)}
				</div>
			</div>
		);
	};

	return (
		<div
			className={cn(
				"relative flex h-full min-h-0 w-full items-center justify-center",
				className,
			)}
		>
			<img
				src={talentPortraitPie2x}
				alt="能力模型图表"
				className="absolute bottom-0 left-1/2 h-[100%] w-auto -translate-x-1/2 select-none object-contain"
			/>

			{abilityModules.map((module, index) => renderAbilityModule(module, index))}
		</div>
	);
}
