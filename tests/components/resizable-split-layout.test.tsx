import { ResizableSplitLayout } from "#src/components/resizable-split-layout";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("resizableSplitLayout", () => {
	it("允许场景通过 groupStyle 覆盖默认高度", () => {
		const { container } = render(
			<ResizableSplitLayout
				groupId="test-auto-group"
				leftPanelId="test-auto-left"
				rightPanelId="test-auto-right"
				groupStyle={{ height: "auto" }}
				left={<div>左侧内容</div>}
				right={<div>右侧内容</div>}
				persistLayout={false}
			/>,
		);

		expect(screen.getByText("左侧内容")).toBeInTheDocument();
		expect(screen.getByText("右侧内容")).toBeInTheDocument();

		const group = container.firstElementChild;
		expect(group).toHaveStyle({ height: "auto" });
	});

	it("允许场景通过 className 控制占满父容器与内容包裹层高度", () => {
		const { container } = render(
			<ResizableSplitLayout
				groupId="test-fill-group"
				leftPanelId="test-fill-left"
				rightPanelId="test-fill-right"
				groupClassName="h-full min-h-0"
				panelClassName="min-h-0"
				panelContentClassName="h-full min-h-0"
				left={<div>左侧内容</div>}
				right={<div>右侧内容</div>}
				persistLayout={false}
			/>,
		);

		const group = container.firstElementChild;
		expect(group).toHaveClass("h-full");

		const leftPanelContent = screen.getByText("左侧内容").parentElement;
		const rightPanelContent = screen.getByText("右侧内容").parentElement;

		expect(leftPanelContent).toHaveClass("h-full");
		expect(rightPanelContent).toHaveClass("h-full");
	});
});
