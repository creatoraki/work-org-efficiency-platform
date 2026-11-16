// 计划类型定义

export interface Plan {
	id: number | string;
	name: string;
	year?: string | number;
	subperiod?: number;
	subperiodName?: string;
	targetCycle?: string;
	remark?: string | null;
	status: number; // 1=进行中, 2=已结束, 0=未发布
	statusStr?: string;
	synVersion?: number;
	createByName?: string;
	createTime?: string;
	updateByName?: string;
	updateTime?: string;
	perm?: number;
}
