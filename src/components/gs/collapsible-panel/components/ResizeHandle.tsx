import type { ResizeHandleProps } from "../types";

import { memo, useState } from "react";

/**
 * 拖拽调整宽度手柄组件
 *
 * @param props - 组件属性
 * @returns 拖拽手柄元素
 */
export const ResizeHandle = memo(({ isResizing, onMouseDown }: ResizeHandleProps) => {
	const [isHovering, setIsHovering] = useState(false);

	// 判断是否激活状态（悬停或拖拽中）
	const isActive = isHovering || isResizing;

	return (
		<div
			className={`flex h-6 w-6 cursor-ew-resize items-center justify-center text-[#909399] transition-all duration-200 ease-in-out focus:rounded-full focus:outline-2 focus:outline-offset-2 focus:outline-[#0075ff]`}
			onMouseDown={onMouseDown}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => setIsHovering(false)}
			role="slider"
			aria-label="拖拽调整面板宽度"
			aria-valuenow={0}
			tabIndex={0}
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
					d="M10 9L7 12L10 15M14 9L17 12L14 15"
					stroke={isActive ? "#0075ff" : "currentColor"}
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
