/**
 * G6 扩展统一注册
 * 注册 ReactNode 节点类型和自定义行为
 */

import { ExtensionCategory, register } from "@antv/g6";
import { ReactNode } from "@antv/g6-extension-react";
import { HoverActivateElement } from "./behaviors/HoverActivateElement";
import { RoundedOrthPolyline } from "./edges/RoundedOrthPolyline";

let registered = false;

/**
 * 注册所有 OrgDiagram 需要的 G6 扩展
 * 使用标志位防止重复注册
 */
export function registerOrgDiagramExtensions(): void {
	if (registered) return;

	// 注册 React 节点类型
	register(ExtensionCategory.NODE, "react", ReactNode);
	register(ExtensionCategory.EDGE, "rounded-orth-polyline", RoundedOrthPolyline);

	// 注册自定义悬停高亮行为
	register(ExtensionCategory.BEHAVIOR, "hover-element", HoverActivateElement);

	registered = true;
}
