/**
 * 组织基础管理 API
 * TODO: 补充组织档案相关接口
 */

import type {
	GetArchiveProjectTagRes,
	GetArchiveUserListParams,
	GetArchiveUserListRes,
	GetOrgFileInfoRes,
	GetOrgScaleListParams,
	GetOrgScaleListRes,
	OrgState,
} from "./types";
import { request } from "#src/utils/request";

// 组织档案-组织树
export function fetchOrgTree() {
	return request
		.post<ApiResponse<OrgState[]>>("org/archive/list", { ignoreLoading: true })
		.json();
}

// 组织档案详情接口
export function fetchOrgFileInfo(id: string) {
	return request
		.get<ApiResponse<GetOrgFileInfoRes>>(`org/archive/${id}`, { ignoreLoading: true })
		.json();
}

// 组织在职员工列表查询接口
export function fetchProjScale(params: GetOrgScaleListParams) {
	return request
		.post<
			ApiResponse<GetOrgScaleListRes>
		>("org/archive/scale/list", { json: params, ignoreLoading: true })
		.json();
}

// 组织规模列表查询接口
export function fetchProjInformation(params: GetArchiveUserListParams) {
	return request
		.post<
			ApiResponse<GetArchiveUserListRes>
		>("org/archive/user/list", { json: params, ignoreLoading: true })
		.json();
}

// 组织画像查询接口
export function fetchOrgPortrait(id: string) {
	return request
		.get<
			ApiResponse<GetArchiveProjectTagRes>
		>(`org/archive/project/tag/${id}`, { ignoreLoading: true })
		.json();
}
