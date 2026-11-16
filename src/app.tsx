import { AntdApp, JSSThemeProvider } from "#src/components";
import { Curtain } from "#src/components/curtain";

import ModalProvider, { ModalHost } from "#src/components/modal-manager";
import { ProfilerWrapper } from "#src/components/profiler-wrapper";
import { usePreferences, useScrollToHash } from "#src/hooks";
import { AppVersionMonitor } from "#src/layout/widgets/version-monitor";
import { ANT_DESIGN_LOCALE } from "#src/locales";
import { theme as antdTheme, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import { Suspense, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router/dom";
import { router } from "./router";
import { customAntdDarkTheme, customAntdLightTheme } from "./styles/theme/antd/antd-theme";
import "dayjs/locale/zh-cn";

export default function App() {
	const { i18n } = useTranslation();
	const {
		language,
		isDark,
		theme,
		themeColorPrimary,
		colorBlindMode,
		colorGrayMode,
		themeRadius,
		changeSiteTheme,

		enableCheckUpdates,
		checkUpdatesInterval,
		sideCollapsedWidth,
	} = usePreferences();

	useScrollToHash();

	/**
	 * ant design internationalization
	 * @link https://ant.design/docs/react/i18n
	 */
	const getAntdLocale = () => {
		// Force Ant Design components to use Chinese locale globally
		return ANT_DESIGN_LOCALE["zh-CN"];
	};

	/**
	 * day.js internationalization
	 * @link https://day.js.org/docs/en/installation/installation
	 */
	useEffect(() => {
		if (language === "en-US") {
			dayjs.locale("en");
		} else if (language === "zh-CN") {
			dayjs.locale("zh-cn");
		}
	}, [language]);

	/**
	 * react-i18next internationalization
	 * @link https://www.i18next.com/overview/api#changelanguage
	 */
	useEffect(() => {
		i18n.changeLanguage(language);
	}, [language, i18n.changeLanguage]);

	/**
	 * Change theme when the system theme changes
	 */
	const setEmulateTheme = useCallback(
		// eslint-disable-next-line unused-imports/no-unused-vars
		(dark?: boolean) => {
			changeSiteTheme("auto");
		},
		[changeSiteTheme],
	);

	/**
	 * Watch system theme change
	 */
	useEffect(() => {
		if (theme === "auto") {
			// https://developer.chrome.com/docs/devtools/rendering/emulate-css/
			const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

			function matchMode(e: MediaQueryListEvent) {
				setEmulateTheme(e.matches);
			}

			setEmulateTheme(darkModeMediaQuery.matches);
			darkModeMediaQuery.addEventListener("change", matchMode);
			return () => {
				darkModeMediaQuery.removeEventListener("change", matchMode);
			};
		}
	}, [theme, setEmulateTheme]);

	/**
	 * 更新页面颜色模式（灰色、色弱）
	 */
	const updateColorMode = () => {
		const dom = document.documentElement;
		const COLOR_BLIND = "color-blind-mode";
		const COLOR_GRAY = "gray-mode";
		colorBlindMode ? dom.classList.add(COLOR_BLIND) : dom.classList.remove(COLOR_BLIND);
		colorGrayMode ? dom.classList.add(COLOR_GRAY) : dom.classList.remove(COLOR_GRAY);
	};

	useEffect(() => {
		updateColorMode();
	}, [colorBlindMode, colorGrayMode]);

	return (
		<ConfigProvider
			input={{ autoComplete: "off" }}
			/**
			 * 抽屉关闭按钮统一在头部右侧（antd 官方 ConfigProvider.drawer 全局配置）。
			 * 注意：antd 5.29 的 DrawerPanel 只从组件 props 读取 closable.placement，
			 * 该全局配置暂不改变位置，视觉部分由 styles/global.css 中的
			 * .ant-drawer-header-title > .ant-drawer-close 规则补齐。
			 */
			drawer={{ closable: { placement: "end" } }}
			locale={getAntdLocale() || zhCN}
			theme={{
				cssVar: true,
				hashed: false,
				algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
				...(isDark ? customAntdDarkTheme : customAntdLightTheme),
				token: {
					...(isDark ? customAntdDarkTheme.token : customAntdLightTheme.token),
					borderRadius: themeRadius,
					colorPrimary: themeColorPrimary,
					// 启用 wireframe 模式，Modal 等组件会显示边框和更清晰的分隔线
					wireframe: true,
				},
				components: {
					...(isDark ? customAntdDarkTheme.components : customAntdLightTheme.components),
					Menu: {
						darkItemBg: "#141414",
						// 在浅色主题下，让选中项背景色直接使用主题色而不是算法生成的浅色版本
						...(!isDark && {
							itemSelectedBg: themeColorPrimary,
							itemSelectedColor: "#fff",
							subMenuItemSelectedColor: "black",
							itemActiveBg: themeColorPrimary,
						}),
						...(isDark
							? customAntdDarkTheme.components?.Menu
							: customAntdLightTheme.components?.Menu),
						collapsedWidth: sideCollapsedWidth,
					},
					Tabs: {
						horizontalMargin: "0",
					},
				},
			}}
		>
			<AntdApp>
				<ModalProvider>
					<JSSThemeProvider>
						<Suspense fallback={null}>
							{enableCheckUpdates ? (
								<AppVersionMonitor checkUpdatesInterval={checkUpdatesInterval} />
							) : null}
							<ProfilerWrapper name="App">
								<RouterProvider router={router} />
							</ProfilerWrapper>
							<Curtain />
							<ModalHost />
						</Suspense>
					</JSSThemeProvider>
				</ModalProvider>
			</AntdApp>
		</ConfigProvider>
	);
}
