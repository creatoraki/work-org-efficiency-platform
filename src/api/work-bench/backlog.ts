import type { ListForWorkbenchParams, ListForWorkbenchRes } from "./types";
import { request } from "#src/utils";

export type { BacklogItem, ListForWorkbenchParams, ListForWorkbenchRes } from "./types";

// 工作台待办统计
export async function undoPublishFlow(params: ListForWorkbenchParams) {
	const url = "efficiency/backLog/listForWorkbench";
	const resp: ApiResponse<ListForWorkbenchRes> = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
