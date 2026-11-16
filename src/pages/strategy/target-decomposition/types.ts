export type DataNode = any;

export interface BasicIndicatorItem {
	id: number;
	supportAdjustment: 0 | 1;
	value: number;
	adjustmentValue: number;
	dataSourceType: 0 | 1;
}

export interface PeriodicReportingItem {
	id: number;
	periodCode: number;
	resultValue: number;
	supportModify: 0 | 1;
}

export interface Row {
	id: number | string;
	targetOrgCode: string;
	targetOrgName: string;
	children: Row[];
	basicIndicator: Record<string, BasicIndicatorItem>;
	periodicReporting: Record<string, PeriodicReportingItem>;
	responsiblePersonId: number;
	responsiblePersonName: string;
	samePeriodValue: number;
	referenceValue: number;
	annualTargetValue: number;
	deviationValue: number;
	remarks: string;
	treeElement: number;
	status: 0 | 1 | 2 | 3 | 4;
	unit?: string;
	parentSummaryWeight?: number;
	updateBy?: string;
	updateTime?: string;
	isSummary?: boolean;
	isRoot?: boolean;
}
