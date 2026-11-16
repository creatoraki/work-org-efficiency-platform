/**
 * 人岗匹配度单元格 - 业务组件
 *
 * 用于表格列展示百分比+等级，样式参考档案管理的维护完善度列
 */

import { Progress, Typography } from "antd";

const { Text } = Typography;

/** 等级判断规则：rate ≤ max 时适用 */
export interface LevelRule {
	max: number;
	text: string;
	color: string;
}

export const DEFAULT_LEVEL_RULES: LevelRule[] = [
	{ max: 60, text: "低", color: "#ff4d4f" },
	{ max: 80, text: "中", color: "#1890ff" },
	{ max: 100, text: "高", color: "#52c41a" },
];

export interface MatchRateCellProps {
	value?: string | number;
	levelRules?: LevelRule[];
}

function toNumber(v: string | number): number {
	const n = typeof v === "number" ? v : Number.parseFloat(String(v).trim());
	return Number.isNaN(n) ? Number.NaN : n;
}

function resolveLevel(rate: number, rules: LevelRule[]): LevelRule {
	const sorted = [...rules].sort((a, b) => a.max - b.max);
	return (
		sorted.find((r) => rate <= r.max) ?? sorted.at(-1) ?? { max: 100, text: "-", color: "#999" }
	);
}

export function MatchRateCell({ value, levelRules = DEFAULT_LEVEL_RULES }: MatchRateCellProps) {
	const num = value == null || value === "" ? Number.NaN : toNumber(value);
	if (Number.isNaN(num)) return <Text type="secondary">-</Text>;

	const { text, color } = resolveLevel(num, levelRules);
	const percent = Math.round(num);

	return (
		<div className="w-full">
			<div className="mb-[-0.5rem] flex items-center justify-between">
				<span className="text-sm">{percent}%</span>
				<span className="text-sm font-medium" style={{ color }}>
					{text}
				</span>
			</div>
			<Progress
				percent={percent}
				showInfo={false}
				strokeColor={color}
				trailColor="#f0f0f0"
				strokeLinecap="butt"
				size={["100%", 4]}
			/>
		</div>
	);
}
