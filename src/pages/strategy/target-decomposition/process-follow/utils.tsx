import type { ProcessListItem } from "#src/api/strategy/target-confirm";
import type { ProcessListPayload } from "./types";

/**
 * 将查询参数转换为 API payload
 */
export function convertParamsToPayload(
	params: any,
	// currentTab: string,
	// reloadTick: number,
): ProcessListPayload {
	const pageSize = params.pageSize || 10;

	const [pYear, pPeriod] = Array.isArray(params.targetPlanPeriod)
		? params.targetPlanPeriod
		: [undefined, params.targetPlanPeriod];

	return {
		pageNum: params.pageNum,
		pageSize,
		searchCount: true,
		approvalCode: params.approvalCode ?? params.processId ?? undefined,
		name: params.name ?? params.taskName ?? undefined,
		targetPlanName: params.targetPlanName ?? params.planName ?? undefined,
		targetPlanPeriod: pPeriod ?? params.period ?? undefined,
		year: pYear,
		status:
			typeof params.status !== "undefined" && params.status !== ""
				? params.status
				: undefined,
		approvalUserId:
			typeof params.approvalUserId !== "undefined"
				? params.approvalUserId
				: (params.currentApprover ?? undefined),
		submitUserName: params.submitUserName ?? params.initiator ?? undefined,
		// tab: currentTab,
		sortItemList: [
			{
				isAsc: false,
				column: "submit_date",
			},
		],
	};
}

/**
 * 将原始数据映射为标准的 ProcessListItem
 */
export function transformProcessList(list: any[]): ProcessListItem[] {
	return list.map(
		(it: any) =>
			({
				id: Number(it.id ?? 0),
				curAuditName: it.curAuditName ?? "",
				approvalCode: it.approvalCode ?? "",
				name: it.name ?? "",
				targetPlanName: it.targetPlanName ?? "",
				targetPlanPeriod: Number(it.targetPlanPeriod ?? 0),
				targetPlanYear: it.targetPlanYear ?? "",
				targetCycle: it.targetCycle ?? "",
				submitVersion: it.submitVersion ?? "",
				status: Number(it.status ?? 1),
				statusStr: it.statusStr ?? "",
				submitUserName: it.submitUserName ?? "",
				submitDate: it.submitDate ?? "",
				approvalFdId: it.approvalFdId ?? "",
			}) as ProcessListItem,
	);
}

/**
 * 解析 API 响应数据
 */
export function parseProcessListResponse(resp: any): {
	list: ProcessListItem[];
	total: number;
} {
	let list: any[] = [];
	let total = 0;

	if (resp && Array.isArray(resp.data)) {
		list = resp.data;
		total = (resp as any).total ?? list.length;
	} else if (resp && resp.data && Array.isArray(resp.data.list)) {
		list = resp.data.list;
		total = resp.data.total ?? 0;
	}

	return {
		list: transformProcessList(list),
		total,
	};
}
