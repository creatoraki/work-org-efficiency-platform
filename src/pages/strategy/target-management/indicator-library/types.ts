// 指标类型定义

export interface Indicator {
	id: string;
	name: string;
	responsibleDepartmentCode: number;
	type: string;
	onlineStatus: number;
	createByName: string;
	updateByName: string;
	applicationPlanCount: number;
	synVersion?: number;
	perm?: number;
}
