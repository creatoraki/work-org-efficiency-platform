import type {
	RatingAssessType,
	RatingNodeType,
	RatingOrgNode,
	RatingTodoItem,
	RatingTodoQuery,
	RatingTodoSearchOptions,
	RatingTodoStatistics,
	RatingTodoTaskRow,
} from "./types";

import { request } from "#src/utils";
import dayjs from "dayjs";
import { getRoleLabel, RatingTodoStatus } from "./types";

/**
 * 绩效管理 · 年度评级 · 评级待办
 *
 * 真实接口：
 * - GET  annualevaluation/userTask/count           评级待办统计
 * - GET  annualevaluation/userTask/search-options  列表查询条件（执行人）
 * - POST annualevaluation/userTask/list            任务列表（分页）
 * - GET  dataDimOepOrg/tree                        评级组织树
 *
 * 字典编码 → 展示文案的转换仅在本层，页面不感知编码。
 */

/** 待办统计默认值 */
const EMPTY_STATISTICS: RatingTodoStatistics = {
	pendingCount: 0,
	rejectedCount: 0,
	submittedCount: 0,
	completedCount: 0,
	rejectedTodayCount: 0,
	completedTodayCount: 0,
};

/**
 * 列表行转换：后端 BO → 页面展示模型
 *
 * @param row - 后端列表行
 * @returns 页面展示行
 */
function mapTodoRow(row: RatingTodoTaskRow): RatingTodoItem {
	const finishTime = row.finishTime ? dayjs(row.finishTime) : undefined;
	const status = String(row.status ?? "") as RatingTodoStatus;
	return {
		id: String(row.id ?? ""),
		planName: row.planName ?? "",
		cycle: row.periodName ?? "",
		assessType: Number(row.evaluationType ?? 0) as RatingAssessType,
		nodeType: Number(row.nodeType ?? 0) as RatingNodeType,
		status,
		role: getRoleLabel(row.roleType),
		executor: row.dealUserName ?? "",
		executeScope: row.dealOrgName ?? "",
		executeScopePath: row.dealOrgNamePath ?? "",
		headCount: row.userCount ?? 0,
		validDate: finishTime ? finishTime.format("YYYY-MM-DD") : "",
		// 后端未下发逾期标识，按「未完成且有效期已过」推导
		overdue: Boolean(
			finishTime && status !== RatingTodoStatus.COMPLETED && finishTime.isBefore(dayjs()),
		),
		lastSubmitTime: row.submitTime ? dayjs(row.submitTime).format("YYYY-MM-DD HH:mm:ss") : "",
	};
}

/**
 * 查询参数转换：页面筛选条件 → 后端 QueryForm
 *
 * @param params - 页面筛选条件
 * @returns 后端查询表单字段
 */
function toQueryForm(params: RatingTodoQuery) {
	return {
		planId: params.planId,
		periodName: params.cycle?.match(/\d{4}/)?.[0],
		evaluationType: params.assessType,
		nodeType: params.nodeType,
		dealOrgCode: params.dealOrgCode || undefined,
		dealUserCode: params.dealUserCode || undefined,
		status: params.status || undefined,
	};
}

/**
 * 查询评级待办列表
 *
 * @param params - 查询参数
 * @returns 分页数据
 */
export async function fetchTodoList(params: RatingTodoQuery) {
	const { pageNum = 1, pageSize = 20 } = params;
	const response = await request
		.post("annualevaluation/userTask/list", {
			json: { ...toQueryForm(params), pageNum, pageSize },
		})
		.json<ApiResponse<PagedData<RatingTodoTaskRow>>>();
	const page = response?.data;
	return {
		data: (page?.list ?? []).map(mapTodoRow),
		total: Number(page?.total ?? 0),
	};
}

/**
 * 查询评级待办统计数据
 *
 * @returns 统计数据
 */
export async function fetchTodoStatistics(): Promise<RatingTodoStatistics> {
	const response = await request
		.get("annualevaluation/userTask/count")
		.json<ApiResponse<Partial<RatingTodoStatistics>>>();
	const data = response?.data;
	if (!data) {
		return { ...EMPTY_STATISTICS };
	}
	return {
		pendingCount: Number(data.pendingCount ?? 0),
		rejectedCount: Number(data.rejectedCount ?? 0),
		submittedCount: Number(data.submittedCount ?? 0),
		completedCount: Number(data.completedCount ?? 0),
		rejectedTodayCount: Number(data.rejectedTodayCount ?? 0),
		completedTodayCount: Number(data.completedTodayCount ?? 0),
	};
}

/**
 * 查询评级任务列表查询条件
 *
 * 后端当前只下发执行人选项，执行组织选项待接口恢复后可直接使用。
 *
 * @returns 查询条件选项
 */
export async function fetchTodoSearchOptions(): Promise<RatingTodoSearchOptions> {
	const response = await request
		.get("annualevaluation/userTask/search-options")
		.json<ApiResponse<RatingTodoSearchOptions>>();
	return response?.data ?? {};
}

/** 组织树接口返回节点（后端 TreeNode 的展示子集） */
interface OrgTreeResponseNode {
	/** 节点标识 */
	id?: string;
	/** 节点名称 */
	name?: string;
	/** 子节点 */
	children?: OrgTreeResponseNode[];
}

/**
 * 组织树节点转换
 *
 * @param node - 后端组织树节点
 * @returns 评级组织树节点
 */
function mapOrgNode(node: OrgTreeResponseNode): RatingOrgNode {
	return {
		id: String(node.id ?? ""),
		name: node.name ?? "",
		children: node.children?.length ? node.children.map(mapOrgNode) : undefined,
	};
}

/**
 * 查询评级组织树
 *
 * @returns 组织树根节点数组
 */
export async function fetchRatingOrgTree(): Promise<RatingOrgNode[]> {
	const response = await request
		.get("dataDimOepOrg/tree")
		.json<ApiResponse<OrgTreeResponseNode>>();
	const root = response?.data;
	return root ? [mapOrgNode(root)] : [];
}

/**
 * 模拟待办状态存储
 *
 * 提报 / 确认 / 审批 / 申诉仍走本地 mock；接入真实接口后移除。
 */
const MOCK_TODO_STATUS = new Map<string, RatingTodoStatus>();

/**
 * 读取模拟待办状态
 *
 * @param todoId - 待办标识
 * @returns 待办状态，未命中返回 undefined
 */
export function getMockTodoStatus(todoId: string): RatingTodoStatus | undefined {
	return MOCK_TODO_STATUS.get(todoId);
}

/**
 * 更新模拟待办状态
 *
 * @param todoId - 待办标识
 * @param status - 新状态
 */
export function updateMockTodoStatus(todoId: string, status: RatingTodoStatus) {
	MOCK_TODO_STATUS.set(todoId, status);
}
