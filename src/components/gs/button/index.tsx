import type { ButtonProps } from "antd";
import { useUserStore } from "#src/store/user.js";
import { Button } from "antd";
import clsx from "clsx";

import React from "react";
import "./button.css";

export type GSButtonTone = "primary" | "secondary" | "ghost" | "text";

export interface GSButtonProps extends ButtonProps {
	/** 组件预设的色调风格 */
	tone?: GSButtonTone;
	/** 是否铺满父容器宽度 */
	fullWidth?: boolean;
	/** 权限码，如果有值则进行权限校验，校验不通过不渲染 */
	auth?: string;
}

const toneToType: Record<GSButtonTone, ButtonProps["type"]> = {
	primary: "primary",
	secondary: "default",
	ghost: "default",
	text: "text",
};

/**
 * GSButton 按钮组件封装
 *
 * GS = 绿城科技 善数研发，统一按钮样式与交互体验。
 *
 * @param props - 透传 antd ButtonProps，支持 tone、fullWidth 额外配置
 * @returns 统一风格的 Button 组件
 */
const GSButton = React.forwardRef<HTMLButtonElement, GSButtonProps>((props, ref) => {
	const { tone = "primary", fullWidth, className, type, ghost, block, auth, ...rest } = props;
	const perms = useUserStore((state) => state.perms);

	if (auth) {
		const hasPermission = perms.includes("*") || perms.includes(auth);
		if (!hasPermission) return null;
	}

	const resolvedType: ButtonProps["type"] = type ?? toneToType[tone];
	const resolvedGhost = ghost ?? tone === "ghost";
	const resolvedBlock = fullWidth ?? block;

	return (
		<Button
			{...rest}
			ref={ref}
			type={resolvedType}
			ghost={resolvedGhost}
			block={resolvedBlock}
			className={clsx(
				"gs-button",
				`gs-button--${tone}`,
				resolvedBlock && "gs-button--block",
				className,
			)}
		/>
	);
});

GSButton.displayName = "GSButton";

export { GSButton };
export default GSButton;
