import type { ReactNode } from "react";

/** 单步配置 */
export interface DeploymentStepItem {
	/** 步骤唯一 key（用于列表 key，不传则用 title 字符串或索引） */
	key?: string;
	/** 步骤标题 */
	title: ReactNode;
	/** 步骤副标题（可选） */
	subtitle?: ReactNode;
}

/** 步骤条布局 */
export type DeploymentStepsLayout = "horizontal" | "vertical";

/** 步骤条组件 props */
export interface DeploymentStepsProps {
	/** 当前步骤索引（从 0 开始） */
	current: number;
	/** 步骤项配置（title、subtitle） */
	items: DeploymentStepItem[];
	/** 布局：水平 / 垂直，默认 horizontal */
	layout?: DeploymentStepsLayout;
	/** 标题区域最大宽度（水平布局时生效），默认 140 */
	titleMaxWidth?: number;
}
