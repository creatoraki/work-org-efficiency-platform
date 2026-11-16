import { usePreferences } from "#src/hooks";
import { cn } from "#src/utils";

import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

import { siderTriggerHeight } from "../../constants";

interface SiderTriggerProps {
	className?: string;
}

export function SiderTrigger({ className }: SiderTriggerProps) {
	const { sidebarCollapsed, setPreferences, sidebarTheme } = usePreferences();

	return (
		<div
			style={{
				height: siderTriggerHeight,
			}}
			onClick={() => setPreferences("sidebarCollapsed", !sidebarCollapsed)}
			className={cn(
				"flex w-full items-center justify-center rounded-none !border-r border-t",
				className,
				sidebarTheme === "dark" ? "border-t-[#303030]" : "border-t",
			)}
		>
			{sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
		</div>
	);
}
