import { request } from "#src/utils";

// 目标计划>新增计划(重名校验)
export async function checkPlanName(params?: { name?: string; id?: string | number }) {
	const url = "target/plan/checkName";
	try {
		const resp: any = await request
			.get(url, { searchParams: params, ignoreLoading: true })
			.json();
		if (!resp) return { exists: false };
		return resp.data ?? resp;
	} catch (e) {
		console.error("checkPlanName failed", e);
		return { exists: false };
	}
}

// put target/plan
export async function updateTargetPlan(payload: Record<string, any>) {
	const url = "target/plan";
	try {
		const resp: any = await request.put(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp ?? resp;
	} catch (e) {
		console.error("updateTargetPlan failed", e);
		return null;
	}
}
