import type { OrganizationTreeNode } from "./types";
import { request } from "#src/utils/axios-request";

/**
 * 获取组织树。
 *
 * 说明：
 * - `/dept/tree` 属于低频变更基础数据，缓存策略由调用方通过 React Query 控制。
 * - `orgLevel` 为空时返回默认组织树。
 */
export async function fetchOrganizationTree(orgLevel?: string): Promise<OrganizationTreeNode> {
	const params: Record<string, string> = {};
	if (orgLevel) {
		params.orgLevel = orgLevel;
	}

	return request.get<OrganizationTreeNode>("dept/tree", {
		params,
		showLoading: false,
	});
}

/**
 * 根据部门 ID 查询用户分页列表。
 */
export function fetchUsersByDeptId(
	deptId: string | number,
	query?: Record<string, any>,
	options?: any,
) {
	const url = "sys/user/page";
	return request.get(url, {
		params: { ...query, deptCode: deptId },
		...options,
		ignoreLoading: true,
	});
}
