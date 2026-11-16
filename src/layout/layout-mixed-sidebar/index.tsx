import type { MenuProps } from "antd";
import type { MenuItemType } from "../layout-menu/types";

import { Scrollbar } from "#src/components";
import { usePreferences } from "#src/hooks";

import { theme as antdTheme, ConfigProvider, Typography } from "antd";

import { sidebarTitleHeight, siderTriggerHeight } from "../constants";
import LayoutMenu from "../layout-menu";
import { SiderTrigger } from "../widgets";
import FirstColumnMenu from "./first-column-menu";

interface LayoutMixedSidebarProps {
	computedSidebarWidth?: number;
	topNavItems?: MenuItemType[];
	sideNavItems?: MenuItemType[];
	sideNavMenuKeyInSplitMode?: string;
	handleMenuSelect?: (key: string, mode: MenuProps["mode"]) => void;
}

const emptyArray: MenuItemType[] = [];
const zero = 0;
/**
 * 双列布局侧边栏
 */
export default function LayoutMixedSidebar({
	computedSidebarWidth = zero,
	sideNavItems = emptyArray,
	topNavItems = emptyArray,
	handleMenuSelect,
	sideNavMenuKeyInSplitMode,
}: LayoutMixedSidebarProps) {
	const { isDark, sidebarTheme, sidebarCollapsed, firstColumnWidthInTwoColumnNavigation } =
		usePreferences();
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
				className="fixed bottom-0 left-0 top-0 flex"
				style={{
					backgroundColor: isFixedDarkTheme ? Menu?.darkItemBg : Menu?.itemBg,
					boxShadow: "3px 0 5px 0 rgb(29, 35, 41, 0.05)",
				}}
			>
				<FirstColumnMenu
					sideNavMenuKeyInSplitMode={sideNavMenuKeyInSplitMode}
					menus={topNavItems}
					handleMenuSelect={handleMenuSelect}
				/>
				<div
					style={{ width: computedSidebarWidth - firstColumnWidthInTwoColumnNavigation }}
					className="relative transition-all"
				>
					{!sidebarCollapsed ? (
						<Typography.Title
							level={1}
							ellipsis
							className="!my-0 flex items-center border-b px-3 pl-2 !text-lg"
							style={{ height: sidebarTitleHeight }}
						>
							{import.meta.env.VITE_GLOB_APP_TITLE}
						</Typography.Title>
					) : null}
					<div
						className="overflow-hidden"
						style={{
							height: sidebarCollapsed
								? `calc(100%  - ${siderTriggerHeight}px)`
								: `calc(100% - ${sidebarTitleHeight}px - ${siderTriggerHeight}px)`,
						}}
					>
						<Scrollbar>
							<LayoutMenu
								autoExpandCurrentMenu
								menus={sideNavItems}
								handleMenuSelect={handleMenuSelect}
							/>
						</Scrollbar>
					</div>
					<SiderTrigger />
				</div>
			</aside>
		</ConfigProvider>
	);
}
