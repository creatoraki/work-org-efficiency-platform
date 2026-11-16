import type { Preview } from "@storybook/react";
import { ConfigProvider } from "antd";
import React from "react";
import { AntdApp } from "../src/components/antd-app";
import "../src/styles/index.css";

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
	decorators: [
		(Story) => (
			<ConfigProvider>
				<AntdApp>
					<Story />
				</AntdApp>
			</ConfigProvider>
		),
	],
};

export default preview;
