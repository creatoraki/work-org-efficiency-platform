/**
 * 雷达图组件
 * 展示学历、资历、绩效三个维度的雷达图，支持点击标签查看详情
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type {
	TalentPortraitEducationDetail,
	TalentPortraitPerformanceDetail,
	TalentPortraitQualificationDetail,
	TalentPortraitRadarData,
} from "#src/api/org-brain/personnel-archive";
import type { EChartsOption } from "echarts";
import RadarLabelChevronRightIcon from "#src/assets/small-icons/talent-portrait/radar-label-chevron-right.svg?react";
import { cn } from "#src/utils/index.js";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

// 雷达图颜色严格对齐 Figma 人才画像图表节点。
const RADAR_PRIMARY_COLOR = "#0075FF";
const RADAR_BORDER_COLOR = "#E4E7ED";
const RADAR_SHADOW_COLOR = "rgba(0, 51, 255, 0.16)";
const RADAR_BACKGROUND_LEVELS = [5, 4, 3, 2, 1] as const;

/**
 * 雷达图组件属性
 */
interface RadarChartProps {
	/** 雷达图数据 */
	radarData?: TalentPortraitRadarData;
	/** 学历详情 */
	educationDetail?: TalentPortraitEducationDetail;
	/** 资历详情 */
	qualificationDetail?: TalentPortraitQualificationDetail;
	/** 绩效详情 */
	performanceDetail?: TalentPortraitPerformanceDetail;
	/** 点击学历标签回调 */
	onEducationClick?: () => void;
	/** 点击资历标签回调 */
	onQualificationClick?: () => void;
	/** 点击绩效标签回调 */
	onPerformanceClick?: () => void;
	/** 类名 */
	className?: string;
}

/**
 * 雷达图维度分数标签属性。
 *
 * @author 王善能
 * @since 2026-07-15
 */
interface RadarScoreLabelProps {
	/** 维度名称 */
	label: string;
	/** 维度分数 */
	score: number;
	/** 定位样式 */
	className: string;
	/** 点击标签回调 */
	onClick?: () => void;
}

/**
 * 雷达图维度分数标签。
 *
 * 按照人才画像设计稿渲染胶囊标签与独立 chevron 图标，并承接详情点击事件。
 *
 * @param props - 组件属性
 * @param props.label - 维度名称
 * @param props.score - 维度分数
 * @param props.className - 标签在雷达图中的定位样式
 * @param props.onClick - 点击标签回调
 * @returns 雷达图维度分数标签
 *
 * @author 王善能
 * @since 2026-07-15
 */
function RadarScoreLabel({ label, score, className, onClick }: RadarScoreLabelProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"absolute z-10 inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[#0075FF] px-[10px] py-[3px] text-base leading-6 tracking-[0px] text-white",
				className,
			)}
		>
			<span>{`${label}:${score}分`}</span>
			<RadarLabelChevronRightIcon className="size-4 shrink-0" aria-hidden="true" />
		</button>
	);
}

/**
 * 雷达图组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function RadarChart({
	radarData,
	educationDetail,
	qualificationDetail,
	performanceDetail,
	onEducationClick,
	onQualificationClick,
	onPerformanceClick,
	className,
}: RadarChartProps) {
	// 雷达图配置
	const radarOption: EChartsOption | undefined = useMemo(() => {
		if (!radarData || !educationDetail || !qualificationDetail || !performanceDetail) {
			return undefined;
		}

		const { education, qualification, performance } = radarData;
		const backgroundSeries = RADAR_BACKGROUND_LEVELS.map((level) => ({
			type: "radar" as const,
			data: [{ value: [level, level, level] }],
			animation: false,
			silent: true,
			z: 1,
			areaStyle: {
				color: "#FFFFFF",
				opacity: 1,
				shadowBlur: 20,
				shadowColor: RADAR_SHADOW_COLOR,
			},
			lineStyle: { color: RADAR_BORDER_COLOR, width: 1 },
			symbol: "none" as const,
		}));

		return {
			radar: {
				z: 10,
				indicator: [
					{ name: "", max: 5 },
					{ name: "", max: 5 },
					{ name: "", max: 5 },
				],
				radius: "100%",
				center: ["50%", "65%"],
				splitNumber: 5,
				splitArea: { show: false },
				splitLine: { show: false },
				axisTick: {
					show: false,
				},
				axisLine: {
					show: false,
				},
				// 显示刻度值（不显示 0）
				axisLabel: {
					show: true,
					color: "#323233",
					fontSize: 12,
					align: "left",
					margin: 0,
					padding: [0, 0, 0, -5],
					formatter: (value: number) => (value === 0 ? "" : String(value)),
				},
				axisName: { show: false },
			},
			series: [
				...backgroundSeries,
				{
					type: "radar",
					data: [{ value: [education, qualification, performance] }],
					z: 2,
					areaStyle: { color: RADAR_PRIMARY_COLOR, opacity: 0.18 },
					lineStyle: { color: RADAR_PRIMARY_COLOR, width: 2 },
					symbol: "none",
				},
			],
		} as EChartsOption;
	}, [radarData, educationDetail, qualificationDetail, performanceDetail]);

	return (
		<div
			className={cn(
				"relative flex h-full min-h-0 w-full items-center justify-center",
				className,
			)}
		>
			{radarOption && educationDetail && qualificationDetail && performanceDetail && (
				<>
					<ReactECharts
						option={radarOption}
						style={{ width: "100%", height: "100%" }}
						opts={{ renderer: "canvas" }}
					/>
					<RadarScoreLabel
						label="学历"
						score={educationDetail.score}
						className="left-1/2 top-4 -translate-x-1/2"
						onClick={onEducationClick}
					/>
					<RadarScoreLabel
						label="资历"
						score={qualificationDetail.score}
						className="bottom-6 left-[13%]"
						onClick={onQualificationClick}
					/>
					<RadarScoreLabel
						label="绩效"
						score={performanceDetail.score}
						className="bottom-6 right-[13%]"
						onClick={onPerformanceClick}
					/>
				</>
			)}
		</div>
	);
}
