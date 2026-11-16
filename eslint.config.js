import antfu from "@antfu/eslint-config";

export default antfu({
	react: true,
	/**
	 * ESLint 仅负责代码质量规则，格式统一交给 Prettier 处理，
	 * 避免引号、分号、缩进等规则与 prettier-plugin-tailwindcss 发生职责重叠。
	 */
	stylistic: false,
	rules: {
		"react-hooks/exhaustive-deps": "off",
		"style/multiline-ternary": "off",
		"no-use-before-define": "off",
		"ts/no-use-before-define": "off",
		"react-hooks-extra/no-direct-set-state-in-use-effect": "off",
	},
	ignores: ["**/*.md", "**/*.css"],
});
