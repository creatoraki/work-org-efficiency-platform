/**
 * 标签管理通用API接口
 */

import type { PagedData } from "#src/utils/axios-request";
import type { DeptTreeNode, PageUserListParams, UserInfo } from "./types";
import { request } from "#src/utils/axios-request";

// 导出类型，方便外部使用
export type { DeptTreeNode, UserInfo } from "./types";

/**
 * 分页查询用户列表
 *
 * @param params - 查询参数
 * @returns 用户列表数据
 */
export async function pageUserList(params: PageUserListParams): Promise<PagedData<UserInfo>> {
	return request.get<PagedData<UserInfo>>("sys/user/page", {
		params,
		showLoading: false,
	});
}

/**
 * 获取用户部门树结构
 *
 * @returns 部门树结构数据
 */
export async function getDeptTree(): Promise<DeptTreeNode[]> {
	return request.get<DeptTreeNode[]>("sys/user/getDeptTree", {
		showLoading: false,
	});
}
