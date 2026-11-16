/**
 * 行为配置
 * 定义画布交互行为列表
 */

/**
 * 获取默认行为列表
 */
export function getBehaviors(container: HTMLElement) {
	return [
		{
			type: "zoom-canvas" as const,
			// 固定以视口中心缩放，不跟随鼠标位置
			origin: [container.clientWidth / 2, container.clientHeight / 2] as [number, number],
		},
		"drag-canvas",
		"hover-element",
		// "click-select", // 已移除：避免拦截 Checkbox 点击事件，选择功能由 Checkbox 自身处理
	];
}
