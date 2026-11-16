import type { CollapseToggleButtonProps } from "../types";

import { memo, useState } from "react";

/**
 * 折叠切换按钮组件
 *
 * @param props - 组件属性
 * @returns 切换按钮元素
 */
export const CollapseToggleButton = memo(({ isCollapsed, onToggle }: CollapseToggleButtonProps) => {
	const [isHovering, setIsHovering] = useState(false);

	return (
		<div
			className={`flex h-6 w-6 cursor-pointer items-center justify-center text-[#909399] transition-all duration-300 ease-in-out focus:rounded-full focus:outline-2 focus:outline-offset-2 focus:outline-[#0075ff] ${!isCollapsed ? "rotate-180" : ""} `}
			onClick={onToggle}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			role="button"
			tabIndex={0}
			aria-label={isCollapsed ? "展开面板" : "收起面板"}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggle();
				}
			}}
		>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle
					cx="12"
					cy="12"
					r="11.625"
					fill="white"
					stroke="#DCDFE6"
					strokeWidth="0.75"
					className="transition-[stroke] duration-300 ease-in-out"
				/>
				<path
					d="M9 9L12 12L9 15M13 9L16 12L13 15"
					stroke={isHovering ? "#0075ff" : "currentColor"}
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
					className="transition-[stroke] duration-300 ease-in-out"
				/>
			</svg>
		</div>
	);
});
