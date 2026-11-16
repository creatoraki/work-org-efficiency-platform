/**
 * 配置统一导出 - 完全复刻 demo.js 的 Graph 配置
 */

import type { GraphOptions } from "@antv/g6";
import { getBehaviors } from "./behaviorConfig";
import { getEdgeConfig } from "./edgeConfig";
import { getLayoutConfig } from "./layoutConfig";
import { getNodeConfig } from "./nodeConfig";

export function buildGraphOptions(container: HTMLElement): GraphOptions {
	return {
		container,
		animation: false,
		autoFit: "view",
		node: getNodeConfig(),
		edge: getEdgeConfig(),
		layout: getLayoutConfig(),
		behaviors: getBehaviors(container),
	};
}
