/**
 * 排兵布阵组件层 - 公共 API
 * 仅导出面板入口、预览抽屉与类型，内部结构不对外暴露
 */
export { DeploymentPanel } from "./panel/index";
export type { DeploymentPanelMode, DeploymentPanelProps } from "./panel/index";
export { DeploymentPreviewDrawer } from "./panel/views";
