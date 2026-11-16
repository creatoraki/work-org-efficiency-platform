import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming";

const theme = create({
	base: "light",
	brandTitle: "绿城科技 · 善数研发",
});

addons.setConfig({
	theme,
	showToolbar: true,
	enableShortcuts: true,
});
