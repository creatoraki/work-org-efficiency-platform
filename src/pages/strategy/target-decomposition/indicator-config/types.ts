export type Status = number;

export interface PlanRow {
	id: string | number;
	targetPlanName?: string;
	targetCycle?: string;
	responsibleUserId?: number;
	responsibleUserName?: string;
	startTime?: string | Record<string, unknown>;
	deadline?: string | Record<string, unknown>;
	subTaskChangeTime?: string | Record<string, unknown>;
	perm?: number;
	remark?: string;
	synVersion?: number;
	owner?: string;
	updateByName?: string;
	year?: string;
	subperiod?: number;
	status?: Status;
	planName?: string;
	period?: string;
	validity?: string;
	updatedAt?: string;
	// 0: 未提交, 1: 进行中, 2: 已完成, 3: 已停用
	fillingStatus?: number;
	submissionStatus?: number;
	submissionStatusStr?: string;
	targetPlanId?: string | number;
}

export interface StatsData {
	targetPlanTotal: number;
	targetPlanTotalNoSubmit: number;
	targetPlanTotalSubmit: number;
	primaryPlanTotal: number;
	primaryPlanNoSubmit: number;
	primaryPlanSubmit: number;
	collaborationPlanTotal: number;
	collaborationPlanNoSubmit: number;
	collaborationPlanSubmit: number;
}

export interface SelectOption {
	label: string;
	value: string | number;
}

export interface FetchDataParams {
	pageNum?: number;
	pageSize?: number;
	name?: string;
	planName?: string;
	owner?: string;
	subperiod?: [number, number];
	status?: Status;
	preciseNameFlag?: boolean;
	updateByName?: string;
	period?: string;
	effTaskIndicatorConfId?: number;
}
