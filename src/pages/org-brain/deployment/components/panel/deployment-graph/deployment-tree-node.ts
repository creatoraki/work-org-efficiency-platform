import type { LabelStyleProps, RectStyleProps } from "@antv/g6";
import type { DeploymentNodeData } from "./types";
import { ExtensionCategory, Label, Rect, register } from "@antv/g6";

export const DEPLOYMENT_TREE_NODE = "deployment-tree-node";

const NODE_WIDTH = 248;
const ROOT_NODE_SIZE: [number, number] = [NODE_WIDTH, 56];
const LINE_NODE_SIZE: [number, number] = [224, 56];
const LEAF_PREVIEW_LIMIT = 10;
const LEAF_PADDING = 12;
const LEAF_HEADER_HEIGHT = 36;
const LEAF_ROW_HEIGHT = 36;
const LEAF_ROW_GAP = 8;
const LEAF_BOTTOM_BUFFER = 12;

type ParsedDeploymentNodeStyle = Required<RectStyleProps>;

function calcLeafPreviewRowCount(staffConfigList: DeploymentNodeData["staffConfigList"]): number {
	const selectedCount = staffConfigList?.length ?? 0;
	if (selectedCount === 0) {
		return 1;
	}
	return (
		Math.min(selectedCount, LEAF_PREVIEW_LIMIT) + (selectedCount > LEAF_PREVIEW_LIMIT ? 1 : 0)
	);
}

export function calcDeploymentLeafNodeSize(previewRowCount: number): [number, number] {
	const rows = Math.max(previewRowCount, 1);
	return [
		NODE_WIDTH,
		LEAF_PADDING * 2 +
			LEAF_HEADER_HEIGHT +
			rows * LEAF_ROW_HEIGHT +
			Math.max(rows - 1, 0) * LEAF_ROW_GAP +
			LEAF_BOTTOM_BUFFER,
	];
}

export function resolveDeploymentNodeSize(nodeData: DeploymentNodeData): [number, number] {
	if (nodeData.kind === "root") {
		return ROOT_NODE_SIZE;
	}
	if (nodeData.kind === "line") {
		return LINE_NODE_SIZE;
	}
	return calcDeploymentLeafNodeSize(calcLeafPreviewRowCount(nodeData.staffConfigList));
}

/**
 * 排兵布阵组织树原生节点。
 * 使用 G6 Rect + Label 在 Canvas 上绘制，避免 React/HTML 节点缩放发糊。
 */
class DeploymentTreeNode extends Rect {
	get deploymentData(): DeploymentNodeData {
		return this.context.model.getElementDataById(this.id).data as unknown as DeploymentNodeData;
	}

	/** 复用节点 key 矩形的 @antv/g Rect 构造器，避免额外声明 @antv/g 依赖 */
	private getNativeRectCtor() {
		const keyShape = this.getShape("key");
		if (!keyShape?.constructor) {
			return null;
		}
		type KeyShape = typeof keyShape;
		return keyShape.constructor as new (...args: unknown[]) => KeyShape;
	}

	protected getKeyStyle(attributes: ParsedDeploymentNodeStyle) {
		const [width, height] = this.getSize(attributes);
		const kind = this.deploymentData.kind;
		return {
			...super.getKeyStyle(attributes),
			width,
			height,
			x: -width / 2,
			y: -height / 2,
			fill: "#fff",
			stroke: "#E4E7ED",
			lineWidth: 1,
			radius: 16,
			shadowBlur: kind === "leaf" ? 20 : 16,
			shadowColor: "rgba(0, 0, 0, 0.06)",
			shadowOffsetY: kind === "leaf" ? 8 : 6,
		};
	}

	protected getLabelStyle(_attributes: ParsedDeploymentNodeStyle): false | LabelStyleProps {
		if (this.deploymentData.kind !== "root") {
			return false;
		}
		return {
			text: this.deploymentData.name,
			fill: "#323233",
			fontSize: 16,
			fontWeight: 600,
			textAlign: "center",
			textBaseline: "middle",
			transform: [["translate", 0, 0]],
		};
	}

	private drawLineContent(container: typeof this) {
		const data = this.deploymentData;
		const [width] = this.getSize(this.parsedAttributes);
		const halfWidth = width / 2;

		this.upsert(
			"line-name",
			Label,
			{
				text: data.name,
				fill: "#323233",
				fontSize: 15,
				fontWeight: 600,
				textAlign: "left",
				textBaseline: "middle",
				wordWrap: true,
				wordWrapWidth: width - 88,
				transform: [["translate", -halfWidth + 20, 0]],
			},
			container,
		);

		this.upsert(
			"line-count",
			Label,
			data.lineCount == null
				? false
				: {
						text: `${data.lineCount}人`,
						fill: "#606266",
						fontSize: 14,
						textAlign: "right",
						textBaseline: "middle",
						transform: [["translate", halfWidth - 20, 0]],
					},
			container,
		);
	}

	private drawLeafRow(
		container: typeof this,
		index: number,
		rowTop: number,
		rowLeft: number,
		rowWidth: number,
		options: {
			name: string;
			suffix?: string;
			variant?: "default" | "ellipsis";
		},
	) {
		const { name, suffix = "›", variant = "default" } = options;
		const isEllipsis = variant === "ellipsis";
		const rowCenterY = rowTop + LEAF_ROW_HEIGHT / 2;
		const bgKey = `leaf-row-bg-${index}`;
		const nameKey = `leaf-row-name-${index}`;
		const suffixKey = `leaf-row-suffix-${index}`;
		const RectCtor = this.getNativeRectCtor();
		if (!RectCtor) {
			return;
		}

		this.upsert(
			bgKey,
			RectCtor,
			{
				x: rowLeft,
				y: rowTop,
				width: rowWidth,
				height: LEAF_ROW_HEIGHT,
				fill: isEllipsis ? "#fff" : "#F7F8FA",
				stroke: isEllipsis ? "#DCE3EC" : "#EDEFF2",
				lineWidth: 1,
				lineDash: isEllipsis ? [4, 4] : undefined,
				radius: 8,
			},
			container,
		);

		this.upsert(
			nameKey,
			Label,
			{
				text: name,
				fill: isEllipsis ? "#909399" : "#606266",
				fontSize: isEllipsis ? 12 : 13,
				textAlign: "left",
				textBaseline: "middle",
				wordWrap: true,
				wordWrapWidth: rowWidth - 40,
				transform: [["translate", rowLeft + 12, rowCenterY]],
			},
			container,
		);

		this.upsert(
			suffixKey,
			Label,
			{
				text: suffix,
				fill: isEllipsis ? "#909399" : "#B0B7C3",
				fontSize: isEllipsis ? 12 : 14,
				textAlign: "right",
				textBaseline: "middle",
				transform: [["translate", rowLeft + rowWidth - 12, rowCenterY]],
			},
			container,
		);
	}

	private clearLeafRow(container: typeof this, index: number) {
		const RectCtor = this.getNativeRectCtor();
		if (!RectCtor) {
			return;
		}
		this.upsert(`leaf-row-bg-${index}`, RectCtor, false, container);
		this.upsert(`leaf-row-name-${index}`, Label, false, container);
		this.upsert(`leaf-row-suffix-${index}`, Label, false, container);
	}

	private drawLeafContent(container: typeof this) {
		const data = this.deploymentData;
		const [width, height] = this.getSize(this.parsedAttributes);
		const halfWidth = width / 2;
		const top = -height / 2;
		const staffConfigs = data.staffConfigList ?? [];
		const requiredCount = data.staffCount ?? 1;
		const visibleStaffConfigs = staffConfigs.slice(0, LEAF_PREVIEW_LIMIT);
		const hiddenCount = Math.max(staffConfigs.length - LEAF_PREVIEW_LIMIT, 0);
		const previewRows =
			visibleStaffConfigs.length > 0
				? visibleStaffConfigs.map((config) => config.empName || "待选择")
				: ["点击配置候选人"];
		const rowStartY = top + LEAF_PADDING + LEAF_HEADER_HEIGHT + 12;
		const rowWidth = width - LEAF_PADDING * 2;
		const rowLeft = -halfWidth + LEAF_PADDING;

		this.upsert(
			"leaf-title",
			Label,
			{
				text: data.positionName ?? "",
				fill: "#323233",
				fontSize: 15,
				fontWeight: 600,
				textAlign: "left",
				textBaseline: "top",
				wordWrap: true,
				wordWrapWidth: rowWidth - 56,
				transform: [["translate", rowLeft, top + LEAF_PADDING]],
			},
			container,
		);

		this.upsert(
			"leaf-count",
			Label,
			{
				text: `${requiredCount}人`,
				fill: "#606266",
				fontSize: 14,
				textAlign: "right",
				textBaseline: "top",
				transform: [["translate", halfWidth - LEAF_PADDING, top + LEAF_PADDING]],
			},
			container,
		);

		for (let index = 0; index < LEAF_PREVIEW_LIMIT + 1; index += 1) {
			if (index < previewRows.length) {
				const rowTop = rowStartY + index * (LEAF_ROW_HEIGHT + LEAF_ROW_GAP);
				this.drawLeafRow(container, index, rowTop, rowLeft, rowWidth, {
					name: previewRows[index],
				});
				continue;
			}

			if (index === previewRows.length && hiddenCount > 0) {
				const rowTop = rowStartY + index * (LEAF_ROW_HEIGHT + LEAF_ROW_GAP);
				this.drawLeafRow(container, index, rowTop, rowLeft, rowWidth, {
					name: "...",
					suffix: `共 ${staffConfigs.length} 人`,
					variant: "ellipsis",
				});
				continue;
			}

			this.clearLeafRow(container, index);
		}
	}

	public render(attributes = this.parsedAttributes, container: typeof this = this) {
		super.render(attributes, container);
		const kind = this.deploymentData.kind;
		if (kind === "line") {
			this.drawLineContent(container);
		}
		if (kind === "leaf") {
			this.drawLeafContent(container);
		}
	}
}

let deploymentTreeNodeRegistered = false;

export function registerDeploymentTreeNode() {
	if (deploymentTreeNodeRegistered) {
		return;
	}
	register(ExtensionCategory.NODE, DEPLOYMENT_TREE_NODE, DeploymentTreeNode);
	deploymentTreeNodeRegistered = true;
}
