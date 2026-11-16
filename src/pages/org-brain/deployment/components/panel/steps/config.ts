import type { DeploymentStepItem } from "./types";

/**
 * 排兵布阵步骤 Key（用于逻辑判断，避免 magic number）
 * - matrix: StepConfigMatrix
 * - deploy: StepAIDeployment
 * - selection: StepPlanSelection
 */
export type DeploymentStepKey = "matrix" | "deploy" | "selection";

export type DeploymentHeaderMode = "plain" | "collapsible";

/**
 * 步骤定义：步骤条展示 + 布局元数据
 * 新增/调整步骤只需修改此配置，并在 DeploymentPanel.renderStepContent 中补充对应 case
 */
export interface DeploymentStepDefinition extends DeploymentStepItem {
	key: DeploymentStepKey;
	/** 头部模式：plain 仅展示步骤条；collapsible 展示带边框的步骤条+基础信息并支持展开收起 */
	headerMode?: DeploymentHeaderMode;
}

/** 步骤条项（用于 DeploymentSteps 组件） */
export type StepBarItem = Pick<DeploymentStepDefinition, "key" | "title" | "subtitle">;

/** 排兵布阵步骤配置（单一数据源） */
export const DEPLOYMENT_STEP_DEFINITIONS: DeploymentStepDefinition[] = [
	{
		key: "matrix",
		title: "根据标杆，配置岗位矩阵",
		headerMode: "plain",
	},
	{
		key: "deploy",
		title: "一键排兵布阵",
		headerMode: "collapsible",
	},
	{
		key: "selection",
		title: "方案总览与选择",
		headerMode: "collapsible",
	},
];

/** 步骤条展示数据（从 definitions 派生） */
export const DEPLOYMENT_STEP_BAR_ITEMS: StepBarItem[] = DEPLOYMENT_STEP_DEFINITIONS.map(
	({ key, title, subtitle }) => ({ key, title, subtitle }),
);

/** 步骤条容器布局 class（90% 宽、最大 1400px） */
export const STEP_BAR_LAYOUT_CLASS = "mx-auto w-[90%] max-w-[1400px]";

/** 初始步骤索引（0=matrix, 1=deploy, 2=selection） */
export const INITIAL_STEP_INDEX = 0;

/** 画布 fitView 内边距 [top, right, bottom, left]，预留悬浮方案条、右侧缩放工具栏 */
export const FIT_VIEW_PADDING: [number, number, number, number] = [64, 80, 40, 64];
