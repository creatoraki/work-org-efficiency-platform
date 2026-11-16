import AuditApprovedStatusIcon from "#src/assets/svg/audit_approved_status.svg?react";
import AuditPendingReviewStatusIcon from "#src/assets/svg/audit_pending_review_status.svg?react";
import AuditRejectedStatusIcon from "#src/assets/svg/audit_rejected_status.svg?react";
import { Card, Statistic } from "antd";
import React from "react";
import CountUp from "react-countup";

/**
 * 统计卡片数据项接口
 */
interface StatisticsCardItem {
	/** 标题 */
	title: string;
	/** 数值 */
	value: number;
	/** 图标 */
	icon: React.ReactNode;
	/** 颜色 */
	color: string;
	/** 背景色 */
	bgColor: string;
	/** 描述 */
	description: string;
	/** 是否显示趋势 */
	showTrend: boolean;
	/** 趋势值 */
	trendValue: number;
}

/**
 * 统计卡片组件属性
 */
interface StatisticsCardsProps {
	/** 待审核数量 */
	pending: number;
	/** 已通过数量 */
	approved: number;
	/** 已拒绝数量 */
	rejected: number;
	/** 本月新增已通过数量 */
	approvedThisMonth: number;
	/** 本月新增已拒绝数量 */
	rejectedThisMonth: number;
}

/**
 * 统计卡片组件
 *
 * 展示标签审核的统计数据，包括待审核、已通过、已拒绝三个维度的统计信息
 *
 * @param props - 组件属性
 * @param props.pending - 待审核数量
 * @param props.approved - 已通过数量
 * @param props.rejected - 已拒绝数量
 * @param props.approvedThisMonth - 本月新增已通过数量
 * @param props.rejectedThisMonth - 本月新增已拒绝数量
 * @returns 统计卡片组件
 */
export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
	pending,
	approved,
	rejected,
	approvedThisMonth,
	rejectedThisMonth,
}) => {
	const cardItems: StatisticsCardItem[] = [
		{
			title: "待审核标签",
			value: pending,
			icon: <AuditPendingReviewStatusIcon className="h-7 w-7" />,
			color: "#FF7D00",
			bgColor: "#F5F7FA",
			description: "请及时处理",
			showTrend: false,
			trendValue: 0,
		},
		{
			title: "已通过标签",
			value: approved,
			icon: <AuditApprovedStatusIcon className="h-7 w-7" />,
			color: "#14B968",
			bgColor: "#F5F7FA",
			description: "审核通过",
			showTrend: true,
			trendValue: approvedThisMonth,
		},
		{
			title: "已拒绝标签",
			value: rejected,
			icon: <AuditRejectedStatusIcon className="h-7 w-7" />,
			color: "#F5222D",
			bgColor: "#F5F7FA",
			description: "审核拒绝",
			showTrend: true,
			trendValue: rejectedThisMonth,
		},
	];

	return (
		<div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{cardItems.map((item) => (
				<Card
					key={item.title}
					className="h-full transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
					style={{
						borderRadius: "8px",
						border: "none",
						backgroundColor: item.bgColor,
					}}
					styles={{ body: { padding: "16px" } }}
				>
					{/* 顶部：标题 + 图标 */}
					<div className="mb-2 flex items-center justify-between">
						<span className="text-sm font-medium text-gray-700">{item.title}</span>
						<div>{item.icon}</div>
					</div>

					{/* 底部：大数字 + 右侧趋势信息 */}
					<div className="flex items-end justify-between">
						{/* 左侧大数字 */}
						<div>
							<Statistic
								value={item.value}
								valueStyle={{
									fontSize: "26px",
									fontWeight: "bold",
									lineHeight: 1,
								}}
								formatter={(value) => (
									<CountUp
										start={0}
										end={value as number}
										duration={2}
										separator=","
									/>
								)}
							/>
						</div>

						{/* 右侧趋势信息 */}
						<div className="text-right">
							{item.showTrend ? (
								<Statistic
									value={item.trendValue}
									precision={0}
									valueStyle={{
										fontSize: "14px",
										color: item.color,
										fontWeight: "500",
										lineHeight: 1,
									}}
									prefix={
										<span
											className="mt-1 text-sm"
											style={{ color: item.color }}
										>
											{" "}
											本月新增
										</span>
									}
									suffix={
										<span
											className="mt-1 text-sm"
											style={{ color: item.color }}
										>
											{" "}
											个
										</span>
									}
								/>
							) : (
								<span
									className="text-sm text-gray-500"
									style={{ color: item.color }}
								>
									{item.description}
								</span>
							)}
						</div>
					</div>
				</Card>
			))}
		</div>
	);
};
