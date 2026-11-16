/**
 * org-efficiency-platform 标准 Prettier 配置
 *
 * 说明：
 * 1. 格式规则统一交给 Prettier，避免与 ESLint 职责重叠。
 * 2. 保持项目既有缩进口径：tab + 4，避免引入大规模无效 diff。
 * 3. 通过 prettier-plugin-tailwindcss 自动排序 Tailwind className。
 */
export default {
	printWidth: 100,
	useTabs: true,
	tabWidth: 4,
	semi: true,
	singleQuote: false,
	jsxSingleQuote: false,
	quoteProps: "as-needed",
	trailingComma: "all",
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: "always",
	endOfLine: "lf",
	singleAttributePerLine: false,
	htmlWhitespaceSensitivity: "css",
	proseWrap: "preserve",
	plugins: ["prettier-plugin-tailwindcss"],
};
