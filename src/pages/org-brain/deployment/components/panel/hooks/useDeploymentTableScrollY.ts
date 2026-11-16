import { useLayoutEffect, useRef, useState } from "react";

import {
	DEPLOYMENT_ANT_TABLE_HEADER_HEIGHT,
	DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y,
	DEPLOYMENT_TABLE_MIN_SCROLL_Y,
} from "../constants";

/**
 * 从 DOM 实测表格宿主高度与表头高度，计算 scroll.y。
 * 宿主容器已处于 flex 布局中，边距由布局自然体现，无需再手动扣减常量。
 *
 * @param host - 表格宿主元素
 * @returns 表体 scroll.y；高度不足时返回 undefined
 * @author 王善能
 * @since 2026-06-11
 */
export function measureDeploymentTableScrollY(host: HTMLElement): number | undefined {
	const hostHeight = host.clientHeight;
	if (hostHeight <= 0) {
		return DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y;
	}

	const thead = host.querySelector(".ant-table-thead");
	const headerHeight =
		thead instanceof HTMLElement
			? thead.getBoundingClientRect().height
			: DEPLOYMENT_ANT_TABLE_HEADER_HEIGHT;
	const footer = host.querySelector(".ant-table-footer");
	const footerHeight = footer instanceof HTMLElement ? footer.getBoundingClientRect().height : 0;
	const bodyHeight = Math.floor(hostHeight - headerHeight - footerHeight);
	if (bodyHeight < DEPLOYMENT_TABLE_MIN_SCROLL_Y) {
		return undefined;
	}

	return bodyHeight;
}

/**
 * 监听表格宿主容器尺寸，动态同步 scroll.y。
 *
 * @param enabled - 是否启用表体内滚
 * @param rowCount - 行数变化时触发重算
 * @returns 表格宿主 ref 与 scroll.y
 * @author 王善能
 * @since 2026-06-11
 */
export function useDeploymentTableScrollY(enabled: boolean, rowCount: number) {
	const tableHostRef = useRef<HTMLDivElement>(null);
	const [scrollY, setScrollY] = useState<number | undefined>(
		enabled ? DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y : undefined,
	);

	useLayoutEffect(() => {
		if (!enabled) {
			setScrollY(undefined);
			return;
		}

		const host = tableHostRef.current;
		if (!host) {
			return;
		}

		const syncScrollY = () => {
			const nextScrollY = measureDeploymentTableScrollY(host);
			setScrollY((current) => (current === nextScrollY ? current : nextScrollY));
		};

		syncScrollY();
		// 表头 / footer 在 Table 首帧渲染后才挂载，延迟再同步
		const rafId = requestAnimationFrame(() => {
			syncScrollY();
			requestAnimationFrame(syncScrollY);
		});

		const resizeObserver = new ResizeObserver(() => {
			syncScrollY();
		});
		resizeObserver.observe(host);

		// 监听表格 DOM 结构变化（如 footer 挂载），避免 scroll.y 少扣 footer 高度
		const mutationObserver = new MutationObserver(() => {
			syncScrollY();
		});
		mutationObserver.observe(host, { childList: true, subtree: true });

		return () => {
			cancelAnimationFrame(rafId);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [enabled, rowCount]);

	return {
		tableHostRef,
		scrollY: enabled ? scrollY : undefined,
	};
}
