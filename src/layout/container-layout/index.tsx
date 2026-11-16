import {
	useDeviceType,
	useLayoutFooterStyle,
	useLayoutHeaderStyle,
	useTaskWebSocket,
} from "#src/hooks";
import { usePreferencesStore, useTabsStore, useUserStore } from "#src/store";
import { cn } from "#src/utils";

import { RocketOutlined } from "@ant-design/icons";
import { FloatButton, Grid, Watermark } from "antd";
import dayjs from "dayjs";

import { useEffect, useMemo } from "react";
import { ELEMENT_ID_MAIN_CONTENT, footerHeight, headerHeight, tabbarHeight } from "../constants";
import { useLayout } from "../hooks";
import LayoutContent from "../layout-content";
import LayoutFooter from "../layout-footer";
import LayoutHeader from "../layout-header";
import LayoutMenu from "../layout-menu";
import { useMenu } from "../layout-menu/use-menu";
import LayoutMixedSidebar from "../layout-mixed-sidebar";
import LayoutMobileMenu from "../layout-mobile-menu";
import LayoutSidebar from "../layout-sidebar";
import LayoutTabbar from "../layout-tabbar";
import { BreadcrumbViews, Logo } from "../widgets";

const { useBreakpoint } = Grid;

/**
 * 全局水印必须覆盖抽屉、弹窗以及页面内 sticky 区块。
 * Ant Design Watermark 默认 zIndex 为 9，低于 Drawer/Modal 弹层和部分业务 sticky 头部。
 */
const GLOBAL_WATERMARK_Z_INDEX = 9999;

/**
 * Please do not use this component through lazy, otherwise the switching routing page will flash.
 * 请不要通过 lazy 使用这个组件，否则切换路由页面会发生闪动。
 *
 * NO:
 * const ContainerLayout = lazy(() => import("#src/layout/container-layout"));
 *
 * YES:
 * import { ContainerLayout } from "#src/layout";
 */
export default function ContainerLayout() {
	useTaskWebSocket();
	const screens = useBreakpoint();
	const {
		isTopNav,
		isTwoColumnNav,
		isMixedNav,
		sidebarWidth,
		sideCollapsedWidth,
		firstColumnWidthInTwoColumnNavigation,
	} = useLayout();
	const isMaximize = useTabsStore((state) => state.isMaximize);
	const {
		enableFooter,
		fixedFooter,
		enableBackTopButton,
		tabbarEnable,
		sidebarEnable,
		sidebarCollapsed,
		setPreferences,
	} = usePreferencesStore();
	const { isMobile } = useDeviceType();
	const { sideNavItems, topNavItems, handleMenuSelect, sideNavMenuKeyInSplitMode } = useMenu();
	const user = useUserStore();
	const waterMarkContent = useMemo(() => {
		return `${user.userCode ? user.userCode : ""} ${user.nickName} ${dayjs().format("YYYY-MM-DD")}`;
	}, [user]);

	const { setLayoutHeaderHeight } = useLayoutHeaderStyle();
	const { setLayoutFooterHeight } = useLayoutFooterStyle();

	useEffect(() => {
		/* iPad */
		if (screens.lg && !screens.xl) {
			setPreferences("sidebarCollapsed", true);
		} else if (screens.xl) {
			/* PC */
			setPreferences("sidebarCollapsed", false);
		} else if (screens.xs || (screens.sm && !screens.md)) {
			/* Mobile */
			setPreferences("sidebarCollapsed", false);
		}
	}, [screens]);

	const sidebarEnableState = useMemo(() => !isTopNav && sidebarEnable, [isTopNav, sidebarEnable]);
	const computedSidebarWidth = useMemo(() => {
		if (isMaximize || isMobile) {
			return 0;
		}
		const currentSidebarWidth = sidebarCollapsed ? sideCollapsedWidth : sidebarWidth;
		if (isTwoColumnNav) {
			/* 双列导航，第一列默认宽度 */
			return currentSidebarWidth + (firstColumnWidthInTwoColumnNavigation ?? 0);
		}
		if (sidebarEnableState) {
			return currentSidebarWidth;
		}
		return 0;
	}, [
		// Mobile
		isMobile,
		isMaximize,
		isTwoColumnNav,
		sidebarEnableState,
		sidebarWidth,
		sidebarCollapsed,
		sideCollapsedWidth,
		firstColumnWidthInTwoColumnNavigation,
	]);

	/**
	 * @zh 计算 header 和 tabbar 的高度
	 * @en Calculate the height of header and tabbar
	 */
	const headerWrapperHeight = useMemo(() => {
		let height = headerHeight;
		if (tabbarEnable) {
			height += tabbarHeight;
		}
		return height;
	}, [tabbarEnable, tabbarHeight]);

	useEffect(() => {
		setLayoutHeaderHeight(isMaximize ? tabbarHeight : headerWrapperHeight);
	}, [headerWrapperHeight, isMaximize]);

	useEffect(() => {
		setLayoutFooterHeight(footerHeight);
	}, []);

	return (
		<Watermark content={waterMarkContent} zIndex={GLOBAL_WATERMARK_Z_INDEX}>
			<section
				style={{
					paddingLeft: computedSidebarWidth,
				}}
				className={cn("flex h-screen flex-col transition-all")}
			>
				<LayoutHeader>
					{isTopNav || isMixedNav ? (
						<>
							{isTopNav ? <Logo sidebarCollapsed={false} className="mr-8" /> : null}
							<LayoutMenu
								mode="horizontal"
								menus={topNavItems}
								handleMenuSelect={handleMenuSelect}
							/>
						</>
					) : (
						<BreadcrumbViews />
					)}
				</LayoutHeader>
				{tabbarEnable ? <LayoutTabbar /> : null}

				{/* Mobile Menu */}
				<LayoutMobileMenu />

				{/* PC */}
				{sidebarEnableState && !isTwoColumnNav ? (
					<LayoutSidebar computedSidebarWidth={computedSidebarWidth}>
						<LayoutMenu
							autoExpandCurrentMenu
							menus={sideNavItems}
							handleMenuSelect={handleMenuSelect}
						/>
					</LayoutSidebar>
				) : null}
				{isTwoColumnNav ? (
					<LayoutMixedSidebar
						sideNavMenuKeyInSplitMode={sideNavMenuKeyInSplitMode}
						computedSidebarWidth={computedSidebarWidth}
						sideNavItems={sideNavItems}
						topNavItems={topNavItems}
						handleMenuSelect={handleMenuSelect}
					/>
				) : null}

				<LayoutContent />

				{enableFooter && fixedFooter ? (
					<LayoutFooter className="bg-colorBgContainer" />
				) : null}
				{enableBackTopButton ? (
					<FloatButton.BackTop
						icon={<RocketOutlined />}
						target={() =>
							(document.querySelector(
								`#${ELEMENT_ID_MAIN_CONTENT} .simplebar-content-wrapper`,
							) as HTMLElement) || document
						}
					/>
				) : null}
			</section>
		</Watermark>
	);
}
