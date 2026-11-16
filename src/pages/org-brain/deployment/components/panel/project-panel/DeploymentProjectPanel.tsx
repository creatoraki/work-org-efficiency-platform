import type { ReactNode } from "react";

import { cn } from "#src/utils";
import { Typography } from "antd";

const { Text } = Typography;

export type DeploymentProjectPanelLayoutMode = "fill" | "auto";

interface DeploymentProjectPanelProps {
	title: ReactNode;
	headClassName: string;
	infoSection: ReactNode;
	matrixSection: ReactNode;
	layoutMode: DeploymentProjectPanelLayoutMode;
}

/**
 * 排兵布阵项目面板。
 *
 * 统一承载单栏的头部、基础信息与岗位矩阵区域，
 * 由上层场景决定使用固定高度还是自然高度。
 *
 * @param props - 组件属性
 * @param props.title - 面板标题
 * @param props.headClassName - 头部背景样式
 * @param props.infoSection - 基础信息区域
 * @param props.matrixSection - 岗位矩阵区域
 * @param props.layoutMode - 面板布局模式
 * @returns 项目面板
 * @author 王善能
 * @since 2026-07-01
 */
export function DeploymentProjectPanel({
	title,
	headClassName,
	infoSection,
	matrixSection,
	layoutMode,
}: DeploymentProjectPanelProps) {
	const isFillLayout = layoutMode === "fill";

	return (
		<div
			className={cn(
				"flex flex-col rounded border bg-white pb-4 shadow-sm",
				isFillLayout ? "h-full min-h-0 overflow-hidden" : "h-auto gap-4",
			)}
		>
			<div
				className={cn(
					"flex h-10 shrink-0 items-center justify-center rounded-tl rounded-tr px-4",
					headClassName,
				)}
			>
				<Text className="text-base font-medium leading-normal !text-white">{title}</Text>
			</div>

			<div
				className={cn(
					"px-4",
					isFillLayout && "custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto",
				)}
			>
				<div className="mb-4 flex shrink-0 flex-col gap-3">{infoSection}</div>

				<div className={cn("mt-0 flex flex-col", isFillLayout && "min-h-0 flex-1")}>
					{matrixSection}
				</div>
			</div>
		</div>
	);
}
