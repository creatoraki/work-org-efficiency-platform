import { request } from "#src/utils";

// 目标确认任务统计接口
export async function fetchConfirmCount() {
	const url = "targetdisassemble/confirm/count";
	const resp: any = await request.post(url, { ignoreLoading: true }).json();
	if (!resp) return {};
	const data = resp.data || {};
	return data;
}

// 目标确认流程任务统计接口
export async function fetchProcessCount() {
	const url = "targetdisassemble/process/count";
	const resp: any = await request.post(url, { ignoreLoading: true }).json();
	if (!resp) return {};
	const data = resp.data || {};
	return data;
}
