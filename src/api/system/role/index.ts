import type {
	Add_10Params,
	AddRoleTreeType,
	AddRoleType,
	EditParams,
	GetNoBindEhrRoleInfoRes,
	RoleInfoDetailType,
	RoleItemType,
	RoleUserListParams,
	RoleUserListRes,
	SaveRoleMenuParams,
	SaveRoleUserParams,
	UnbindRoleUserParams,
	UnbindRoleUserRes,
} from "./types";

import { request } from "#src/utils";

export * from "./types";

/* 获取角色列表 */
export function fetchRoleList(data: any, options?: any) {
	return request
		.post<
			ApiListResponse<RoleItemType>
		>("sys/role/list", { json: data, ...options, ignoreLoading: true })
		.json();
}

/* 新增角色 */
export function fetchAddRoleItem(data: AddRoleType) {
	return request
		.post<ApiResponse<string>>("sys/role", { json: data, ignoreLoading: true })
		.json();
}

/* 修改角色 */
export function fetchUpdateRoleItem(data: EditParams) {
	return request.put<ApiResponse<string>>("sys/role", { json: data, ignoreLoading: true }).json();
}
/* 启用角色 */
export function fetchEnableRoleItem(roleId: number) {
	return request
		.put<ApiResponse<string>>(`sys/role/enable/${roleId}`, { ignoreLoading: true })
		.json();
}
/* 禁用角色 */
export function fetchDisableRoleItem(roleId: number) {
	return request
		.put<ApiResponse<string>>(`sys/role/disable/${roleId}`, { ignoreLoading: true })
		.json();
}

/* 删除角色 */
export function fetchDeleteRoleItem(roleId: number) {
	return request
		.delete<ApiResponse<string>>(`sys/role/${roleId}`, { ignoreLoading: true })
		.json();
}

/* 删除角色 */
export function fetchGetRoleItem(roleId: number) {
	return request
		.get<ApiResponse<AddRoleType>>(`sys/role/${roleId}`, { ignoreLoading: true })
		.json();
}

/* 新增角色分类 */
export function fetchAddRoleTreeItem(data: AddRoleTreeType) {
	return request
		.post<ApiResponse<string>>("sys/rolecategory", { json: data, ignoreLoading: true })
		.json();
}
/* 新增角色分类 */
export function fetchEditRoleTreeItem(data: AddRoleTreeType) {
	return request
		.put<ApiResponse<string>>("sys/rolecategory", { json: data, ignoreLoading: true })
		.json();
}
/* 删除角色分类 */
export function fetchDeleteRoleTreeItem(roleId: number) {
	return request
		.delete<ApiResponse<string>>(`sys/rolecategory/${roleId}`, { ignoreLoading: true })
		.json();
}

/* 查询角色分类信息列表 */
export function fetchRoleCategory() {
	return request
		.get<ApiResponse<RoleItemType[]>>("sys/rolecategory/list", { ignoreLoading: true })
		.json();
}

/* 获取角色配置详情 */
export function fetchRoleDetail(roleId: any) {
	return request
		.get<
			ApiListResponse<RoleInfoDetailType>
		>(`sys/role/menu/role/${roleId}`, { ignoreLoading: true })
		.json();
}

/* 查询角色用户成员列表 */
export function fetchRoleUserList(data: RoleUserListParams) {
	return request
		.post<
			ApiListResponse<RoleUserListRes[]>
		>("sys/role/user/list", { json: data, ignoreLoading: true })
		.json();
}

/* 解绑角色用户成员 */
export function fetchRoleUserunbind(data: UnbindRoleUserParams) {
	return request
		.post<
			ApiListResponse<UnbindRoleUserRes>
		>("sys/role/user/unbind", { json: data, ignoreLoading: true })
		.json();
}

/* 绑定角色用户成员 */
export function fetchRoleUserbind(data: UnbindRoleUserParams) {
	return request
		.post<
			ApiListResponse<UnbindRoleUserRes>
		>("sys/role/user/bind", { json: data, ignoreLoading: true })
		.json();
}

/* 保存角色用户成员 */
export function fetchSaveRoleUser(data: SaveRoleUserParams) {
	return request
		.post<
			ApiListResponse<UnbindRoleUserRes>
		>("sys/role/user/save", { json: data, ignoreLoading: true })
		.json();
}

/* 保存角色权限配置 */
export function fetchSaveRoleSave(data: SaveRoleMenuParams) {
	return request
		.post<
			ApiListResponse<UnbindRoleUserRes>
		>("sys/role/menu/role/save", { json: data, ignoreLoading: true })
		.json();
}

/* 新增ehr角色与系统角色关系映射 */
export function fetchAddEHRRoleMapping(data: Add_10Params) {
	return request
		.post<ApiResponse<string>>("efficiency/mapping", { json: data, ignoreLoading: true })
		.json();
}

/* 修改ehr角色与系统角色关系映射 */
export function fetchEditEHRRoleMapping(data: Add_10Params) {
	return request
		.put<ApiResponse<string>>("efficiency/mapping", { json: data, ignoreLoading: true })
		.json();
}

/* 查询ehr角色与系统角色关系映射 */
export function fetchGetEHRRoleMapping(id: number) {
	return request
		.get<ApiResponse<string>>(`efficiency/mapping/${id}`, { ignoreLoading: true })
		.json();
}

/* 获取未绑定的ehr角色信息 */
export function fetchNoBindEhrRoleInfo() {
	return request
		.get<
			ApiResponse<GetNoBindEhrRoleInfoRes>
		>("dataEhrRole/getAllEhrRoleInfo", { ignoreLoading: true })
		.json();
}
