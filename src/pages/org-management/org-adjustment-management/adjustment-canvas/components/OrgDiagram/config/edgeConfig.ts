/**
 * 边配置 - 完全复刻 demo.js
 */

import type { EdgeOptions } from "@antv/g6";

const ACTIVE_COLOR = "rgba(0, 117, 255, 1)";
const EDGE_RADIUS = 16;
const LEVEL_1_TO_2_EDGE_RADIUS = 14;

export function getEdgeConfig(): EdgeOptions {
	return {
		animation: false,
		style: {
			lineWidth: 1,
			zIndex: -1,
			radius: (d: any) => {
				const sourceLevel = Number(d.data?.sourceLevel ?? 0);
				const targetLevel = Number(d.data?.targetLevel ?? 0);
				if (sourceLevel === 1 && targetLevel === 2) {
					return LEVEL_1_TO_2_EDGE_RADIUS;
				}
				return EDGE_RADIUS;
			},
			stroke: "#8b9baf",
			endArrow: false,
			labelText: (d: any) => d.data?.text || "",
			labelFill: "#8b9baf",
			labelFontWeight: 600,
			labelBackground: true,
			labelBackgroundFill: "#f8f8f8",
			labelBackgroundOpacity: 1,
			labelBackgroundLineWidth: 3,
			labelBackgroundStroke: "#8b9baf",
			labelPadding: [1, 10],
			labelBackgroundRadius: 4,
			router: false,
		},
		state: {
			active: {
				stroke: ACTIVE_COLOR,
				labelBackgroundStroke: ACTIVE_COLOR,
				halo: false,
			},
			selected: {
				stroke: ACTIVE_COLOR,
				lineWidth: 2,
				labelFill: ACTIVE_COLOR,
				labelBackgroundStroke: ACTIVE_COLOR,
				halo: false,
			},
		},
	};
}
