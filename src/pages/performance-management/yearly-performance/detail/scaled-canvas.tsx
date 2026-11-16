import type { ReactNode } from "react";

import { useSize } from "ahooks";
import { useRef } from "react";

/** 文档原生宽度：按该宽度排版，再按容器宽度等比缩放（设计稿抽屉 0.69 倍、全屏 1.87 倍） */
export const DOCUMENT_NATIVE_WIDTH = 880;

interface ScaledCanvasProps {
	/** 原生宽度下排版的内容 */
	children: ReactNode;
	/**
	 * 是否撑满容器高度
	 *
	 * 录音转写工作区需要铺满抽屉剩余高度（底部固定录音条），
	 * 此时原生最小高度 = 容器高度 / 缩放比；文档类内容按自身高度滚动，不需要撑满。
	 */
	fillHeight?: boolean;
	/** 原生宽度，默认 880 */
	nativeWidth?: number;
}

/**
 * 等比缩放画布
 *
 * 设计稿中备课材料、录音转写、评分报告在抽屉内是「适应宽度」的缩略预览，全屏后同一份内容等比放大。
 * 这里以固定原生宽度排版，读取容器宽度计算缩放比，用 transform 缩放并回写外层高度，保证滚动区域正确。
 *
 * @param props - 组件属性
 * @param props.children - 内容
 * @param props.fillHeight - 是否撑满容器高度
 * @param props.nativeWidth - 原生宽度
 * @returns 缩放画布
 *
 * @since 2026-11-16
 */
export function ScaledCanvas({
	children,
	fillHeight,
	nativeWidth = DOCUMENT_NATIVE_WIDTH,
}: ScaledCanvasProps) {
	const outerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	const outerSize = useSize(outerRef);
	const innerSize = useSize(innerRef);
	const scale = outerSize?.width ? outerSize.width / nativeWidth : 1;
	const minNativeHeight = fillHeight && outerSize?.height ? outerSize.height / scale : undefined;

	return (
		<div
			ref={outerRef}
			className={fillHeight ? "relative h-full w-full overflow-hidden" : "relative w-full"}
			style={
				fillHeight
					? undefined
					: { height: innerSize ? innerSize.height * scale : undefined }
			}
		>
			<div
				ref={innerRef}
				className="absolute left-0 top-0 origin-top-left"
				style={{
					width: nativeWidth,
					minHeight: minNativeHeight,
					height: fillHeight ? minNativeHeight : undefined,
					transform: `scale(${scale})`,
					// 首帧未测量到容器宽度前隐藏，避免出现未缩放的大字号闪烁
					visibility: outerSize?.width ? "visible" : "hidden",
				}}
			>
				{children}
			</div>
		</div>
	);
}
