import Icon1 from "#src/assets/small-icons/target-filling/sub-1.svg?react";
import Icon2 from "#src/assets/small-icons/target-filling/sub-2.svg?react";
import Icon3 from "#src/assets/small-icons/target-filling/sub-3.svg?react";
import Icon4 from "#src/assets/small-icons/target-filling/sub-4.svg?react";
import Icon5 from "#src/assets/small-icons/target-filling/sub-5.svg?react";
import { addThousand } from "#src/utils/add-thousand";
import { Tooltip } from "antd";
import React from "react";

export interface StatsCardsProps {
	boxHeight: number;
	fieldObj: string;
	fieldSubLeft: string;
	fieldIndicator: string;
	fieldTarget: string;
	fieldGap: string;
	fieldGapDesc: string;
	unitName?: string;
}

// 卡片外层样式：flex:1 + minWidth:0，避免长内容把方块撑开
const cardStyle: React.CSSProperties = {
	flex: 1,
	minWidth: 0,
	background: "rgba(245,247,250,1)",
	padding: 8,
	borderRadius: 6,
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
};

// 单行省略样式
const ellipsisStyle: React.CSSProperties = {
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
};

/**
 * 顶部统计卡片组件（六个方块）
 */
export const StatsCards: React.FC<StatsCardsProps> = React.memo(
	({
		boxHeight,
		fieldObj,
		fieldSubLeft,
		fieldIndicator,
		fieldTarget,
		fieldGap,
		fieldGapDesc,
		unitName = "",
	}) => {
		const hasFieldGap = fieldGap.trim() !== "";
		const gapNumber = hasFieldGap ? Number(fieldGap) || 0 : 0;
		const gapDisplay = hasFieldGap ? addThousand(gapNumber) : "--";

		return (
			<div style={{ display: "flex", gap: 12 }}>
				{/* 拆解对象 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span>拆解对象</span>
						<Icon1 />
					</div>
					<Tooltip title={fieldObj || "未填写"}>
						<div
							style={{
								marginTop: 6,
								fontSize: 14,
								fontWeight: 600,
								...ellipsisStyle,
							}}
						>
							{fieldObj || "未填写"}
						</div>
					</Tooltip>
				</div>

				{/* 拆解子目标 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span>拆解子目标</span>
						<Icon2 style={{ transform: "translateY(4px)" }} />
					</div>
					<Tooltip title={fieldSubLeft || "未填写"}>
						<div style={{ marginTop: 6, fontSize: 14, ...ellipsisStyle }}>
							{fieldSubLeft || "未填写"}
						</div>
					</Tooltip>
				</div>

				{/* 指标 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span>指标</span>
						<Icon3 />
					</div>
					<Tooltip title={fieldIndicator || "未填写"}>
						<div style={{ marginTop: 6, fontSize: 14, ...ellipsisStyle }}>
							{fieldIndicator || "未填写"}
						</div>
					</Tooltip>
				</div>

				{/* 目标值 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span style={ellipsisStyle}>
							目标值(
							{unitName})
						</span>
						<Icon4 />
					</div>
					<Tooltip title={fieldTarget || "0"}>
						<div style={{ marginTop: 6, fontSize: 14, ...ellipsisStyle }}>
							{fieldTarget || "0"}
						</div>
					</Tooltip>
				</div>

				{/* 缺口 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span style={ellipsisStyle}>
							缺口(
							{unitName})
						</span>
						<Icon5 />
					</div>
					<Tooltip title={gapDisplay}>
						<div
							style={{
								marginTop: 6,
								fontSize: 14,
								color: gapNumber <= 0 ? "black" : "red",
								...ellipsisStyle,
							}}
						>
							{gapDisplay}
						</div>
					</Tooltip>
				</div>

				{/* 缺口说明 */}
				<div style={{ ...cardStyle, height: boxHeight }}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							fontSize: 14,
							color: "rgba(96,98,102,1)",
						}}
					>
						<span>
							{gapNumber > 0 && (
								<span style={{ color: "red", marginRight: 4 }}>*</span>
							)}
							缺口说明
						</span>
					</div>
					<Tooltip title={fieldGapDesc || "无"}>
						<div style={{ marginTop: 6, fontSize: 14, ...ellipsisStyle }}>
							{fieldGapDesc || "无"}
						</div>
					</Tooltip>
				</div>
			</div>
		);
	},
);

StatsCards.displayName = "StatsCards";
