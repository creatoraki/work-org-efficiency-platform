import type { DeploymentDetail, DeploymentItem } from "#src/api/org-brain/deployment";

/**
 * 排兵布阵面板模式
 * - create: 首次排兵布阵
 * - edit: 调整排兵布阵
 * - review: 预览抽屉只读对比，双栏等高、矩阵表固定内滚高度
 */
export type DeploymentPanelMode = "create" | "edit" | "review";

/**
 * 排兵布阵面板组件属性
 */
export interface DeploymentPanelProps {
	/** 面板模式 */
	mode: DeploymentPanelMode;
	/** 列表行对应的项目数据 */
	project: DeploymentItem;
	/** 排兵布阵详情数据 */
	detail?: DeploymentDetail | null;
	/** 是否加载中 */
	loading?: boolean;
	/** 是否正在寻找标杆项目 */
	findingBenchmark?: boolean;
	/** 返回列表回调 */
	onBack: () => void;
	/** 寻找标杆项目 */
	onFindBenchmarkProject: () => void;
}
