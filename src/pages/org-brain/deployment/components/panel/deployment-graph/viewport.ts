import type { Graph } from "@antv/g6";
import { FIT_VIEW_OPTIONS, FIT_VIEW_RETRY_DELAYS_MS, VIEWPORT_ANIMATION } from "./constants";

/** 视口中心对应的画布坐标 */
export type ViewportAnchor = [number, number];

const ANCHOR_EPSILON = 0.5;

function waitForPaintFrames(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});
}

/**
 * 初次进入画布时自适应整图视野。
 * 分次重试以等待布局与节点边界计算完成。
 */
export async function fitInitialView(graph: Graph): Promise<void> {
	for (const delay of FIT_VIEW_RETRY_DELAYS_MS) {
		if (delay > 0) {
			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});
		} else {
			await waitForPaintFrames();
		}
		try {
			await graph.fitView(FIT_VIEW_OPTIONS, false);
			const zoom = graph.getZoom();
			if (typeof zoom === "number" && Number.isFinite(zoom) && zoom > 0) {
				return;
			}
		} catch {
			// 视口调整失败时进入下一次重试
		}
	}
}

/** 记录当前视口中心在画布坐标系中的锚点 */
export function captureViewportAnchor(graph: Graph): ViewportAnchor {
	const [x, y] = graph.getViewportCenter();
	return [x, y];
}

/**
 * 将锚点重新对齐到新视口中心，保持缩放不变。
 * 用于容器尺寸变化（如头部展开/收起）后锁定用户当前焦点。
 */
export async function alignViewportToAnchor(
	graph: Graph,
	anchor: ViewportAnchor,
	width: number,
	height: number,
	animated = true,
): Promise<void> {
	await waitForPaintFrames();
	const [vx, vy] = graph.getViewportByCanvas(anchor);
	const dx = width / 2 - vx;
	const dy = height / 2 - vy;
	if (Math.abs(dx) < ANCHOR_EPSILON && Math.abs(dy) < ANCHOR_EPSILON) {
		return;
	}
	await graph.translateBy([dx, dy], animated ? VIEWPORT_ANIMATION : false);
}
