/** 确认任务状态 */
export type Status = number;

/** 确认任务列表行数据 */
export interface TaskRow {
	id: string;
	/** 任务提交表id */
	effTaskSubmissionId?: number;
	name: string;
	targetPlanName: string;
	targetPlanPeriod: string;
	targetOrgName: string;
	submitUserName: string;
	submitDate?: string;
	submitVersion?: string;
	confirmUserName?: string;
	status: Status;
	indicatorNum: number;
	stepStatus: number;
	stepStatusStr?: string;
	confirmationIndicatorCount?: number;
	issueTime?: string;
	targetCycle?: string;
	/** 流程 0:下发前确认 1:各组织负责人目标值确认 */
	processType?: number;
}

/** 统计数据 */
export interface ConfirmCounts {
	totalNum: number;
	unconfirmedNum: number;
	rejectedNum: number;
	confirmedNum: number;
}

/** 状态渲染配置 */
export interface StatusConfig {
	text: string;
	color: string;
}
