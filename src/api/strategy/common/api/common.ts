import type * as Types from "../types";
import { request } from "#src/utils";

// 分页：目标计划 > 流程配置 > 目标分解 > 主责人（submitUser 列表）
export async function fetchSubmitUserSubmitPage(payload?: Record<string, any>) {
	const url = "indicator/submit/submitUser/page";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return { data: [], total: 0 };
		if (Array.isArray(resp.data))
			return { data: resp.data, total: resp.total ?? resp.data.length ?? 0 };
		if (resp.data && Array.isArray(resp.data.list))
			return { data: resp.data.list, total: resp.data.total ?? 0 };
		return { data: [], total: 0 };
	} catch (e) {
		console.error("fetchSubmitUserSubmitPage failed", e);
		return { data: [], total: 0 };
	}
}

// com/enums/{value} get
export async function fetchDataDimOepOrgList() {
	const url = "com/enums/ProjectStatusEnum";
	try {
		const resp: any = await request.get(url, { ignoreLoading: true }).json();
		if (!resp) return { data: [] };
		return resp.data ?? resp;
	} catch (e) {
		console.error("fetchEnumValues failed", e);
		return { data: [] };
	}
}

export async function fetchEnum(enumName: string) {
	const url = `com/enums/${enumName}`;
	const resp: any = await request.get(url, { ignoreLoading: true }).json();
	return resp;
}

// dataDimOepOrg/tree/{id} get
export async function fetchDataDimOepOrgTree(): Promise<
	Types.DataDimOepOrgTreeNode | Types.DataDimOepOrgTreeNode[]
> {
	const url = "dataDimOepOrg/tree";
	const resp: ApiResponse<Types.DataDimOepOrgTreeNode> = await request
		.get(url, { ignoreLoading: true })
		.json();
	return (resp.data ?? resp) as Types.DataDimOepOrgTreeNode | Types.DataDimOepOrgTreeNode[];
}

// indicator/conf/reference/disassembleObjects post
export async function addDisassembleObjects(payload: Record<string, any>) {
	const url = "indicator/conf/reference/disassembleObjects";
	try {
		const resp: any = await request.post(url, { json: payload, ignoreLoading: true }).json();
		if (!resp) return null;
		return resp.data ?? resp;
	} catch (e) {
		console.error("addDisassembleObjects failed", e);
		return null;
	}
}
