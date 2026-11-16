import type { DeptTreeNode, PageUserListParams, UserInfo } from "./types";
import { request } from "#src/utils/request";

/**
 * 分页查询用户列表
 *
 * @param params - 查询参数
 * @returns 用户列表数据
 */
export function pageUserList(params: PageUserListParams): Promise<ApiListResponse<UserInfo>> {
	const searchParams: Record<string, any> = {
		account: params.account || undefined,
		name: params.name || undefined,
		mobileNum: params.mobileNum || undefined,
		status: params.status || undefined,
		jobStatus: params.jobStatus || undefined,
		deptId: params.deptId || undefined,
		deptCode: params.deptCode || undefined,
		pageNum: params.pageNum,
		pageSize: params.pageSize,
		sortItemList: params.sortItemList || undefined,
		userType: params.userType || undefined,
	};

	// 过滤掉 undefined 值
	const filteredParams = Object.fromEntries(
		Object.entries(searchParams).filter(([_, value]) => value !== undefined),
	);

	const queryString = new URLSearchParams(
		Object.entries(filteredParams).reduce((acc, [key, value]) => {
			if (Array.isArray(value)) {
				value.forEach((item) => {
					acc.append(key, String(item));
				});
			} else {
				acc.append(key, String(value));
			}
			return acc;
		}, new URLSearchParams()),
	).toString();

	return request.get(`sys/user/page?${queryString}`).json<ApiListResponse<UserInfo>>();
}

/**
 * 获取用户部门树结构
 *
 * @returns 部门树结构数据
 */
export function getDeptTree(): Promise<ApiResponse<DeptTreeNode[]>> {
	return request.get("sys/user/getDeptTree").json<ApiResponse<DeptTreeNode[]>>();
}

/**
 * 获取用户数据权限范围树
 *
 * @returns 用户数据权限范围树结构
 */
export function getUserDataScopeTree(): Promise<ApiResponse<DeptTreeNode[]>> {
	return request.get("sys/user/getUserDataScopeTree").json<ApiResponse<DeptTreeNode[]>>();
}

// 导出类型
export type { DeptTreeNode, PageUserListParams, UserInfo } from "./types";
