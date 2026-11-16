/**
 * 金字塔组件
 * 展示层级金字塔结构，支持点击查看详情
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { EChartsOption } from "echarts";
import type { ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

/**
 * 默认层级数组
 */
const DEFAULT_LEVEL_LIST: PyramidLevel[] = [];

/**
 * 金字塔层级配置
 */
interface PyramidLevel {
	/** 层级唯一标识 */
	key: string;
	/** 层级高度（px） */
	height: number;
	/** 分数显示文本 */
	score: string;
	/** 标签文本 */
	label: string;
	/** 标签宽度（px） */
	labelWidth: number;
}

/**
 * 金字塔组件属性
 */
interface PyramidProps {
	/** 层级配置数组 */
	levelList?: PyramidLevel[];
	/** 金字塔宽度（px） */
	width?: number;
	/** 当前激活的层级 key */
	activeKey?: string | null;
	/** 金字塔类型：performance-绩效，education-学历 */
	type?: "performance" | "education";
	/** 顶部摘要信息 */
	summary?: ReactNode;
}

/**
 * 金字塔组件
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function Pyramid({
	levelList = DEFAULT_LEVEL_LIST,
	width: _width = 700,
	activeKey = null,
	summary = null,
}: PyramidProps) {
	const totalHeight = levelList.reduce(
		(sum, level, index) => sum + level.height + (index < levelList.length - 1 ? 2 : 0),
		0,
	);
	const chartHeight = Math.max(280, totalHeight + 20);

	const chartOption = useMemo<EChartsOption>(() => {
		if (!levelList.length) {
			return {};
		}

		const funnelData = levelList.map((level, index) => {
			const isActive = level.key === activeKey;
			return {
				name: level.label || level.score,
				value: index + 1,
				isActive,
				score: level.score,
				itemStyle: {
					color: isActive ? "#0075FF" : "rgba(0, 117, 255, 0.14)",
					borderColor: "#FFFFFF",
					borderWidth: 1,
				},
				label: {
					color: isActive ? "#FFFFFF" : "#3A4A63",
					fontWeight: isActive ? 600 : 400,
				},
			};
		});
		const rightLabelData = funnelData.map((item) => ({
			...item,
			label: {
				color: item.isActive ? "#FFFFFF" : "#4B5B76",
				fontWeight: item.isActive ? 600 : 400,
				backgroundColor: item.isActive ? "#0075FF" : "rgba(240, 247, 255, 0.9)",
			},
			labelLine: {
				lineStyle: {
					color: item.isActive ? "#0075FF" : "#D5E3F7",
				},
			},
		}));

		return {
			animation: false,
			grid: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				containLabel: true,
			},
			tooltip: {
				show: false,
			},
			series: [
				{
					type: "funnel",
					sort: "ascending",
					left: "5%",
					width: "80%",
					top: 0,
					bottom: 0,
					minSize: "0%",
					maxSize: "95%",
					gap: 2,
					label: {
						show: true,
						position: "inside",
						formatter: (params: any) => params?.data?.score ?? "",
						fontSize: 14,
					},
					emphasis: {
						disabled: true,
					},
					data: funnelData,
				},
				{
					type: "funnel",
					sort: "ascending",
					left: "5%",
					width: "80%",
					top: 0,
					bottom: 0,
					minSize: "0%",
					maxSize: "95%",
					gap: 2,
					z: 1,
					label: {
						show: true,
						position: "right",
						color: "#4B5B76",
						fontSize: 14,
						formatter: "{b}",
						padding: [8, 12, 8, 12],
						backgroundColor: "rgba(240, 247, 255, 0.9)",
						borderRadius: 14,
					},
					labelLine: {
						show: true,
						length: 30,
						length2: 18,
						lineStyle: {
							color: "#D5E3F7",
							width: 1,
						},
					},
					itemStyle: {
						color: "transparent",
						borderColor: "transparent",
					},
					emphasis: {
						disabled: true,
					},
					data: rightLabelData,
				},
			],
		};
	}, [activeKey, levelList]);

	return (
		<div className="overflow-hidden rounded-lg bg-white">
			{summary}

			<div className="p-6">
				<ReactECharts
					option={chartOption}
					style={{ width: "100%", height: `${chartHeight}px` }}
					opts={{ renderer: "canvas" }}
				/>
			</div>
		</div>
	);
}

export default Pyramid;
