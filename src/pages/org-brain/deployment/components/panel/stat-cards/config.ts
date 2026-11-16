import type { ProjectStatistics } from "#src/api/org-brain/deployment";

import iconCleaning from "#src/assets/svg/cleaning.svg";
import iconCollectionRate from "#src/assets/svg/collection-rate.svg";
import iconElevator from "#src/assets/svg/elevator.svg";
import iconGate from "#src/assets/svg/gate.svg";
import iconGreening from "#src/assets/svg/greening.svg";
import iconLaborCostRatio from "#src/assets/svg/labor-cost-ratio.svg";
import iconProfitRate from "#src/assets/svg/profit-rate.svg";

/** 统计卡片配置：iconBg 为对应 SVG 主色的 rgba */
export const STAT_CARD_CONFIG: Array<{
	key: keyof ProjectStatistics;
	label: string;
	unit: string;
	format?: boolean;
	iconSrc?: string;
	iconBg?: string;
}> = [
	{
		key: "gateCount",
		label: "门岗数",
		unit: "个",
		iconSrc: iconGate,
		iconBg: "rgba(0, 117, 255, 0.15)",
	},
	{
		key: "greenArea",
		label: "绿化面积",
		unit: "㎡",
		format: true,
		iconSrc: iconGreening,
		iconBg: "rgba(20, 185, 104, 0.15)",
	},
	{
		key: "cleaningArea",
		label: "保洁面积",
		unit: "㎡",
		format: true,
		iconSrc: iconCleaning,
		iconBg: "rgba(20, 185, 104, 0.15)",
	},
	{
		key: "elevatorCount",
		label: "电梯数",
		unit: "部",
		iconSrc: iconElevator,
		iconBg: "rgba(0, 117, 255, 0.15)",
	},
	{
		key: "laborCostRatio",
		label: "人力成本占比",
		unit: "%",
		format: true,
		iconSrc: iconLaborCostRatio,
		iconBg: "rgba(20, 185, 104, 0.15)",
	},
	{
		key: "profitRate",
		label: "利润率",
		unit: "%",
		format: true,
		iconSrc: iconProfitRate,
		iconBg: "rgba(255, 125, 0, 0.15)",
	},
	{
		key: "collectionRate",
		label: "综合收缴率",
		unit: "%",
		format: true,
		iconSrc: iconCollectionRate,
		iconBg: "rgba(255, 125, 0, 0.15)",
	},
];
