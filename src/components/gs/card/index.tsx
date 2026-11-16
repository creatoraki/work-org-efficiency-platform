import type { CardProps } from "antd";
import { Card } from "antd";
import clsx from "clsx";
import React from "react";

import "./card.css";

export type GSCardVariant = "default" | "bordered" | "shadow";

export interface GSCardProps extends Omit<CardProps, "variant"> {
	/** 卡片变体样式 */
	variant?: GSCardVariant;
	/** 是否可悬浮（当 variant 为 shadow 时默认启用） */
	hoverable?: boolean;
}

/**
 * GSCard 卡片组件封装
 *
 * GS = 绿城科技 善数研发，统一卡片样式与交互体验。
 *
 * @param props - 透传 antd CardProps，支持 variant、hoverable 额外配置
 * @returns 统一风格的 Card 组件
 */
const GSCard = React.forwardRef<HTMLDivElement, GSCardProps>((props, ref) => {
	const { variant = "default", hoverable, className, bordered, ...rest } = props;

	const resolvedBordered = bordered ?? variant === "bordered";
	const resolvedHoverable = hoverable ?? variant === "shadow";

	return (
		<Card
			{...rest}
			ref={ref}
			bordered={resolvedBordered}
			hoverable={resolvedHoverable}
			className={clsx("gs-card", `gs-card--${variant}`, className)}
		/>
	);
});

GSCard.displayName = "GSCard";

export { GSCard };
export default GSCard;
