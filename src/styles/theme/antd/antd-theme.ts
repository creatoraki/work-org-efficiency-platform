import type { ThemeConfig } from "antd";

/**
 * 自定义的Ant Design浅色主题配置
 *
 * English: Custom Ant Design light theme configuration
 *
 * @see https://ant.design/theme-editor-cn (中文版)
 * @see https://ant.design/docs/react/customize-theme-cn (中文版配置指南)
 * @see https://ant.design/theme-editor (English version)
 * @see https://ant.design/docs/react/customize-theme (English version configuration guide)
 */
export const customAntdLightTheme: ThemeConfig = {
	token: {
		// 页面整体背景色改为白色
		colorBgLayout: "#fff",
	},
	components: {
		Menu: {
			// 菜单背景色改为浅灰色
			itemBg: "rgba(240, 242, 245, 0.8)",
			// 确保子菜单也使用相同背景色
			subMenuItemBg: "rgba(240, 242, 245, 0.8)",
		},
		Descriptions: {
			// Descriptions label 颜色
			labelColor: "#6B7280",
			// Descriptions 内容颜色
			contentColor: "#323233",
		},
	},
};

/**
 * 自定义的Ant Design深色主题配置
 *
 * English: Custom Ant Design dark theme configuration
 *
 * @see https://ant.design/theme-editor-cn (中文版)
 * @see https://ant.design/docs/react/customize-theme-cn (中文版配置指南)
 * @see https://ant.design/theme-editor (English version)
 * @see https://ant.design/docs/react/customize-theme (English version configuration guide)
 */
export const customAntdDarkTheme: ThemeConfig = {
	token: {},
	components: {},
};

/**
 * Layout Tabbar 背景色配置
 * 仅用于 layout-tabbar 组件，不影响全局 Tabs 组件
 * 黑白主题暂时设置为浅灰色，后续再调整
 *
 * @param isDark - 是否为深色主题
 * @returns 背景色值
 */
export function getTabbarBackgroundColor(isDark: boolean): string {
	// 浅色：浅灰；深色：深蓝黑（与黑蓝主调统一）
	return isDark ? "#0a1628" : "rgba(240, 242, 245, 0.8)";
}

/**
 * Layout Tabbar 非激活标签背景色
 *
 * @param isDark - 是否为深色主题
 * @returns 背景色值
 */
export function getTabbarInactiveTabColor(isDark: boolean): string {
	// 浅色：浅灰蓝；深色：中度深蓝
	return isDark ? "#1a2c47" : "#e4e7ed";
}
