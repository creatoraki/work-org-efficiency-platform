import type { ReactNode } from "react";
import { Typography } from "antd";

const { Text } = Typography;

interface StatCardProps {
	label: string;
	value?: number | string;
	unit?: string;
	iconSrc?: string;
	iconBg?: string;
	/** 数字右侧展示的对比标杆差距等 */
	extra?: ReactNode;
}

export function StatCard({ label, value, unit, iconSrc, iconBg, extra }: StatCardProps) {
	const iconBgStyle = iconBg ? { backgroundColor: iconBg } : undefined;
	return (
		<div className="flex min-w-[100px] shrink-0 flex-col justify-center rounded border bg-gray-50 px-3 py-1.5 transition-colors duration-150 hover:border-gray-200 hover:bg-gray-100">
			<Text type="secondary" className="flex items-center gap-1 text-sm">
				<span>
					{label}
					{unit ? `(${unit})` : ""}
				</span>
				<span
					className="flex items-center justify-center rounded p-0.5"
					style={iconBgStyle}
				>
					{iconSrc && <img src={iconSrc} alt="" className="size-4 object-contain" />}
				</span>
			</Text>
			<div className="flex flex-wrap items-baseline gap-1">
				<Text strong className="text-base">
					{value ?? "/"}
				</Text>
				{extra}
			</div>
		</div>
	);
}
