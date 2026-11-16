import { Scrollbar } from "#src/components";
import { usePreferences } from "#src/hooks";

import { theme as antdTheme, ConfigProvider } from "antd";

import { headerHeight, siderTriggerHeight } from "../constants";
import { Logo, SiderTrigger } from "../widgets";

export interface LayoutSidebarProps {
	children?: React.ReactNode;
	computedSidebarWidth: number;
}

export default function LayoutSidebar({ children, computedSidebarWidth }: LayoutSidebarProps) {
	const { sidebarCollapsed, sidebarTheme, isDark } = usePreferences();
	const {
		token: { Menu },
	} = antdTheme.useToken();

	const isFixedDarkTheme = isDark || sidebarTheme === "dark";

	return (
		<ConfigProvider
			theme={{
				algorithm: isFixedDarkTheme ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
			}}
		>
			<aside
				style={{
					width: computedSidebarWidth,
					backgroundColor: isFixedDarkTheme ? Menu?.darkItemBg : Menu?.itemBg,
				}}
				className="fixed bottom-0 left-0 top-0 overflow-y-auto overflow-x-hidden transition-all"
			>
				<Logo sidebarCollapsed={sidebarCollapsed} />
				<div
					className="overflow-hidden !border-r"
					style={{ height: `calc(100% - ${headerHeight}px - ${siderTriggerHeight}px)` }}
				>
					<Scrollbar>{children}</Scrollbar>
				</div>
				<SiderTrigger />
			</aside>
		</ConfigProvider>
	);
}
