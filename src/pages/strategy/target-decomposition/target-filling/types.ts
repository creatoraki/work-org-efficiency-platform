export type FillingStatus = 0 | 1 | 2 | 3 | 4;

export interface StatisticsData {
	total?: number;
	ownAll?: number;
	otherAll?: number;
	ownUnSubmitCount?: number;
	ownProcessingCount?: number;
	ownCompletedCount?: number;
	ownTopCount?: number;
	otherUnSubmitCount?: number;
	otherProcessingCount?: number;
	otherCompletedCount?: number;
	otherTopCount?: number;
}

export type TabType = 0 | 1 | 2;

export type PlanTypeKey = "all" | "notSubmitted" | "inProgress" | "finished" | "disabled";
