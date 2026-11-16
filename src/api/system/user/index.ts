import type {
	AddUserType,
	ListWithRolesRes,
	UserInfoDetailType,
	UserInfoUpdateType,
	UserItemType,
	UserMenuMergeRoleMenuRes,
	UserPermPageType,
	UserResetPwdType,
	UserTreeType,
} from "./types";
import { request } from "#src/utils";

export * from "./types";

/* 获取用户列表 */
export function fetchUserList(data: any, options?: any) {
	return request
		.get<
			ApiListResponse<UserItemType>
		>("sys/user/page", { searchParams: data, ...options, ignoreLoading: true })
		.json();
}

/* 新增用户 */
export function addUserItem(data: AddUserType) {
	return request
		.post<ApiResponse<string>>("sys/user/add", { json: data, ignoreLoading: true })
		.json();
}

/* 关闭用户 */
export function fetchCloseUserItem(integers: number[]) {
	return request.put<ApiResponse<string>>("sys/user/batchDeactivate", { json: integers }).json();
}
/* 激活用户 */
export function fetchActiveUserItem(integers: number[]) {
	return request.put<ApiResponse<string>>("sys/user/batchActivate", { json: integers }).json();
}

/* 删除用户 */
export function fetchDeleteUserItem(integers: number[]) {
	return request
		.delete<
			ApiResponse<string>
		>("sys/user/batchDelete", { json: integers, ignoreLoading: true })
		.json();
}

/* 重置密码 */
export function fetchUserResetPwd(integers: UserResetPwdType) {
	return request
		.put<ApiResponse<string>>("system/user/resetPwd", { json: integers, ignoreLoading: true })
		.json();
}
/* 获取用户部门树 */
export function fetchUserDeptTree() {
	return request
		.get("sys/user/getDeptTree", { ignoreLoading: true })
		.json<ApiResponse<UserTreeType[]>>();
}

/* 获取用户信息 */
export function fetchUserInfoDetail(userId: number) {
	return request
		.get(`sys/user/getUserInfoDetails/${userId}`, { ignoreLoading: true })
		.json<ApiResponse<UserInfoDetailType>>();
}
/* 更新用户信息 */
export function fetchUserInfoUpdate(user: UserInfoUpdateType) {
	return request
		.put("sys/user/update", { json: user, ignoreLoading: true })
		.json<ApiResponse<UserInfoDetailType>>();
}
/* 获取权限数据 */
export function fetchPremPage(data: any) {
	return request
		.post("user/perm/page", { json: data, ignoreLoading: true })
		.json<ApiResponse<UserPermPageType>>();
}

/* 获取角色分类信息树列表（带角色信息） */
export function fetchrolecategory() {
	return request
		.get("sys/rolecategory/listWithRoles", { ignoreLoading: true })
		.json<ApiResponse<ListWithRolesRes[]>>();
}

/* 用户权限配置详情接口（根据角色） */
export function fetchUserMenuByRole(userId: number, roleIdList: string) {
	return request
		.get(`sys/role/menu/user/role/${userId}?roleIdList=${roleIdList}`, { ignoreLoading: true })
		.json<ApiResponse<UserMenuMergeRoleMenuRes>>();
}
