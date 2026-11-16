import type { ProcessListItem } from "#src/api/strategy/target-confirm";

/**
 * 流程统计数据
 */
export interface ProcessCounts {
	totalNum: number;
	activeNum: number;
	completeNum: number;
	abortNum: number;
}

/**
 * 流程列表查询参数
 */
export interface ProcessListQueryParams {
	page?: number;
	pageSize?: number;
	approvalCode?: string;
	name?: string;
	targetPlanName?: string;
	targetPlanPeriod?: string | [string, string];
	status?: "inProgress" | "finished" | "aborted" | undefined;
	approvalUserId?: string;
	submitUserName?: string;
}

/**
 * API 请求的 payload 结构
 */
export interface ProcessListPayload {
	pageNum: number;
	pageSize: number;
	searchCount: boolean;
	approvalCode?: string;
	name?: string;
	targetPlanName?: string;
	targetPlanPeriod?: string;
	year?: string;
	status?: string;
	approvalUserId?: string;
	submitUserName?: string;
	tab?: string;
	sortItemList: Array<{
		isAsc: boolean;
		column: string;
	}>;
}

/**
 * 列表响应数据
 */
export interface ProcessListResponse {
	data: ProcessListItem[];
	total: number;
}

// 重新导出便利类型
export type { ProcessListItem };
