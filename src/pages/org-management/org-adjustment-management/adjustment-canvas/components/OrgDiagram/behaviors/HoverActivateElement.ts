/**
 * 自定义悬停高亮行为
 * 悬停节点时高亮关联边，悬停边时高亮关联节点
 * 参照 G6 官方 demo 实现
 */

import { HoverActivate, idOf } from "@antv/g6";

export class HoverActivateElement extends HoverActivate {
	getActiveIds(event: any): string[] {
		const { model, graph } = this.context;
		const { targetType, target } = event;
		const targetId = target.id;

		const ids: string[] = [targetId];

		if (targetType === "edge") {
			// 悬停边时，高亮边两端的节点
			const edge = model.getEdgeDatum(targetId);
			ids.push(edge.source as string, edge.target as string);
		} else if (targetType === "node") {
			// 悬停节点时，高亮关联的所有边
			ids.push(...model.getRelatedEdgesData(targetId).map(idOf));
		}

		// 将高亮元素提到最前面
		graph.frontElement(ids);

		return ids;
	}
}

export default HoverActivateElement;
