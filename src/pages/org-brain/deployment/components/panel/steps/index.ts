/** 步骤配置（步骤条 + 布局元数据，单一数据源） */
export {
	DEPLOYMENT_STEP_BAR_ITEMS,
	DEPLOYMENT_STEP_DEFINITIONS,
	FIT_VIEW_PADDING,
	INITIAL_STEP_INDEX,
	STEP_BAR_LAYOUT_CLASS,
} from "./config";
export type { DeploymentStepDefinition, DeploymentStepKey, StepBarItem } from "./config";

/** 步骤条组件（仅 panel 内使用） */
export { DeploymentSteps } from "./DeploymentSteps";
export type { DeploymentStepItem, DeploymentStepsLayout, DeploymentStepsProps } from "./types";
