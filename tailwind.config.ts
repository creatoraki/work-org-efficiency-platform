import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

import { getColorPalettes } from "./src/styles/theme/antd/css-variables";

export default {
	darkMode: "class",
	corePlugins: {
		preflight: false,
	},
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		/**
		 * @see https://tailwindcss.com/docs/customizing-colors#using-css-variables
		 */
		colors: {
			/**
			 * 使用 Ant Design 的颜色系统来替代 Tailwind CSS 默认的颜色配置
			 * 说明：对于亮色和暗色模式，除基础色板外的颜色会自动适配主题，无需额外配置（例如：bg-colorBorderSecondary）
			 * 但基础色板（如 bg-cyan-100）仍需手动设置暗色模式样式
			 * @see https://ant.design/docs/spec/colors
			 */
			...getColorPalettes,
		},
		/**
		 * Use ant design breakpoints
		 * @see https://tailwindcss.com/docs/breakpoints
		 * @see https://ant.design/components/layout-cn#breakpoint-width
		 */
		screens: {
			xs: "480px",
			sm: "576px",
			md: "768px",
			lg: "992px",
			xl: "1200px",
			"2xl": "1600px",
			"3xl": "1920px",
			"4xl": "2560px",
		},
		extend: {
			colors: {
				primary: "#1677ff", // 主题蓝色（链接、按钮）
				danger: "#ff4d4f", // 错误/徽章红色
				"text-secondary": "rgba(96, 98, 102, 1)",
			},
			fontSize: {
				xs: "12px",
				sm: "14px",
				base: "16px",
				lg: "18px",
				xl: "20px",
				"2xl": "22px",
				"3xl": "26px",
				// 你可以继续添加自定义
			},
			gridTemplateRows: {
				"workbench-left": "auto 2.5fr 2fr",
				"workbench-right": "3fr 2.5fr 1.5fr",
			},
			backgroundImage: {
				"quick-nav-gradient":
					"linear-gradient(182.13deg, rgba(32, 119, 255, 0.36) 1.99%, rgba(3, 101, 255, 0) 70.59%)",
				"warning-gradient":
					"linear-gradient(190.59deg, #f9dedf 2.3%, rgba(255, 255, 255, 0.5) 81.31%)",
			},
			keyframes: {
				wiggle: {
					"0%, 100%": { "transform-origin": "top" },
					"15%": { transform: "rotateZ(10deg)" },
					"30%": { transform: "rotateZ(-10deg)" },
					"45%": { transform: "rotateZ(5deg)" },
					"60%": { transform: "rotateZ(-5deg)" },
					"75%": { transform: "rotateZ(2deg)" },
				},
				bounceInDownOutUp: {
					"0%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-20px)" },
					"100%": { transform: "translateY(0)" },
				},
			},
			animation: {
				wiggle: "wiggle 1s both",
				bounceInDownOutUp: "bounceInDownOutUp 4s ease-in-out 0ms infinite",
			},
		},
	},
	plugins: [
		plugin(({ addVariant }) => {
			const languages = ["en-US", "zh-CN"];
			/**
			 * 添加 lang 伪类选择器
			 *
			 * @example
			 * ```
			 * en-US:text-white
			 * ```
			 */

			for (const lang of languages) {
				addVariant(`${lang}`, `&:lang(${lang})`);
			}
		}),
		plugin(({ addComponents }) => {
			addComponents({
				".compact-table .ant-table-cell": {
					// "@apply": "px-3.5 py-1 text-xs",
					padding: "4px 14px !important",
					fontSize: "13px !important",
				},
				".hide-scrollbar": {
					"-ms-overflow-style": "none",
					"scrollbar-width": "none",
					"&::-webkit-scrollbar": {
						display: "none",
					},
				},
				".custom-scrollbar": {
					// "scrollbar-width": "thin",
					// "scrollbar-color": "rgba(228, 231, 237, 1) transparent",
					"&::-webkit-scrollbar": {
						width: "6px",
						height: "6px",
					},
					"&::-webkit-scrollbar-track": {
						background: "#f5f7fa",
						"border-radius": "2px",
					},
					"&::-webkit-scrollbar-thumb": {
						"background-color": "#e4e7ed",
						"border-radius": "6px",
					},
					"&::-webkit-scrollbar-thumb:hover": {
						"background-color": "#c0c4cc",
					},
					"&::-webkit-scrollbar-thumb:horizontal:hover": {
						cursor: "ew-resize",
					},
					"&::-webkit-scrollbar-thumb:vertical:hover": {
						cursor: "ns-resize",
					},
				},
			});
		}),
	],
} satisfies Config;
