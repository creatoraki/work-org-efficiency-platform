/**
 * 节点配置
 * 统一使用 OrgNodeCard 蓝白卡片风格
 */

import type { NodeOptions, NodePortStyleProps } from "@antv/g6";
import React from "react";
import { OrgNodeCard } from "../../OrgNodeCard";

const DEFAULT_NODE_SIZE: [number, number] = [154, 53];
const PORT_RADIUS = 10;
const PORT_Z_INDEX = 3;
const PORT_STROKE = "rgba(192, 196, 204, 1)";

function getNodeSize(data: any): [number, number] {
	return [
		Number(data?.nodeWidth ?? DEFAULT_NODE_SIZE[0]),
		Number(data?.nodeHeight ?? DEFAULT_NODE_SIZE[1]),
	];
}

function createPort(
	key: string,
	placement: [number, number],
	options?: Partial<NodePortStyleProps>,
): NodePortStyleProps {
	return {
		key,
		placement,
		r: PORT_RADIUS,
		zIndex: PORT_Z_INDEX,
		fill: "#ffffff",
		stroke: PORT_STROKE,
		lineWidth: 2,
		...options,
	};
}

export function getNodeConfig(): NodeOptions {
	return {
		type: "react",
		style: (d: any) => {
			const size = getNodeSize(d.data);
			const level = Number(d.data?.level ?? 0);
			const ports: NodePortStyleProps[] = [];
			const topPortPlacement: [number, number] = [0.5, -PORT_RADIUS / size[1]];
			const bottomPortPlacement: [number, number] = [0.5, 1 + PORT_RADIUS / size[1]];
			const leftPortPlacement: [number, number] = [-PORT_RADIUS / size[0], 0.5];

			if (level === 1) {
				ports.push(createPort("bottom", bottomPortPlacement, { linkToCenter: true }));
			}

			if (level === 2) {
				ports.push(
					createPort("top", topPortPlacement, { linkToCenter: true }),
					createPort("left", leftPortPlacement, { linkToCenter: true }),
				);
			}

			if (level >= 3) {
				ports.push(createPort("left", leftPortPlacement, { linkToCenter: true }));
			}

			return {
				component: React.createElement(OrgNodeCard, {
					data: {
						id: d.id,
						name: d.data?.name || "未命名",
						newOrg: d.data?.newOrg,
						projOrgStatus: d.data?.projOrgStatus,
						readOnly: d.data?.readOnly,
						disable: d.data?.disable,
						effective: d.data?.effective,
						isStopped: d.data?.isStopped,
						isChanged: d.data?.isChanged,
						childrenModified: d.data?.childrenModified,
						changeHighlightColor: d.data?.changeHighlightColor,
						level: d.data?.level,
						parentId: d.data?.parentId,
						displayFields: d.data?.displayFields,
						hiddenChildCount: d.data?.hiddenChildCount,
						canExpandChildren: d.data?.canExpandChildren,
					},
					width: size[0],
					height: size[1],
				}),
				ports,
				size,
				dx: -size[0] / 2,
				dy: -size[1] / 2,
			};
		},
		state: {
			active: {
				halo: false,
			},
			selected: {
				halo: false,
			},
		},
	};
}
