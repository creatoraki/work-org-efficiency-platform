import type { IndicatorConfPageParams } from "#src/api/strategy";
import type { FetchDataParams, PlanRow } from "./types";
import { USERS } from "./config/constants";

/**
 * 构建后端请求 payload
 */
export function buildFetchPayload(
	params: FetchDataParams,
	currentTab: string,
): IndicatorConfPageParams {
	const pageSize = params.pageSize || 10;

	const payload: IndicatorConfPageParams = {
		pageNum: params.pageNum || 1,
		pageSize,
		name: params.name ?? params.planName ?? undefined,
		preciseNameFlag: params.preciseNameFlag ?? undefined,
		responsibleUserName: params.owner ?? undefined,
		updateByName: params.updateByName ?? undefined,
		year: params.subperiod ? String(params.subperiod[0] ?? "") || undefined : undefined,
		subperiod: params.subperiod ? (params.subperiod[1] ?? undefined) : undefined,
		status: params.status ?? undefined,
		effTaskIndicatorConfId: params.effTaskIndicatorConfId ?? undefined,
		queryModelType: currentTab === "0" ? undefined : Number(currentTab),
		sortItemList: [
			{
				isAsc: false,
				column: "update_time",
			},
		],
	};

	if (params.period) payload.period = params.period;
	if (params.owner) payload.owner = params.owner;

	return payload;
}

/**
 * 过滤本地数据（fallback）
 */
export function filterLocalData(
	data: PlanRow[],
	params: FetchDataParams,
	currentTab: string,
	planType: string,
): PlanRow[] {
	let result = data.slice();

	// 按 Tab 过滤
	if (currentTab === "main") result = result.filter((d) => d.owner === USERS[0].label);
	else if (currentTab === "collab") result = result.filter((d, idx) => idx % 2 === 1);

	// 按参数过滤
	if (params.planName)
		result = result.filter((d) =>
			(d.targetPlanName ?? d.planName ?? "").includes(params.planName!),
		);
	if (params.period) result = result.filter((d) => (d.period ?? d.targetCycle) === params.period);
	if (typeof params.status !== "undefined")
		result = result.filter((d) => Number(d.status) === Number(params.status));
	if (params.owner)
		result = result.filter((d) => (d.owner ?? d.responsibleUserName) === params.owner);

	// 按 planType 过滤
	if (planType === "notSubmitted") result = result.filter((d) => (d.fillingStatus ?? 0) === 0);
	else if (planType === "inProgress") result = result.filter((d) => (d.fillingStatus ?? 0) === 1);
	else if (planType === "finished") result = result.filter((d) => (d.fillingStatus ?? 0) === 2);
	else if (planType === "disabled") result = result.filter((d) => (d.fillingStatus ?? 0) === 3);

	return result;
}

/**
 * 分页处理
 */
export function paginate<T>(data: T[], page: number, pageSize: number): T[] {
	const start = (page - 1) * pageSize;
	return data.slice(start, start + pageSize);
}

/**
 * 从 API 响应中提取选项
 */
export function extractSelectOptions(
	data: any[],
	key: string,
): Array<{ label: string; value: string }> {
	const set = new Set(data.map((item: any) => item[key]).filter(Boolean));
	return Array.from(set).map((n) => ({ label: n as string, value: n as string }));
}
