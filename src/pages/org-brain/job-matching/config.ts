/**
 * 人岗匹配模块配置
 */

// 缓存时间：10分钟（毫秒）
export const CACHE_TIME = 10 * 60 * 1000;
// 详情短期新鲜时间：5秒，用于减少同任务连续开关抽屉时的重复请求。
export const DETAIL_STALE_TIME = 5 * 1000;

/**
 * 匹配模型选项查询参数。
 */
export interface JobMatchingModelOptionsQueryParams {
	orgCode?: string;
	jobId?: string;
	postId?: string;
	postgradeId?: string;
}

/**
 * 人岗匹配详情查询参数。
 */
export interface JobMatchingDetailQueryParams {
	recordId: string;
}

/**
 * 人岗匹配模块 React Query key 常量。
 *
 * 详情接口复用 React Query 的 key、缓存容器与请求去重，但每次打开抽屉仍会主动拉取最新详情。
 *
 * @author 王善能
 * @since 2026-06-29
 */
export const JOB_MATCHING_QUERY_KEYS = {
	organizationTree: ["job-matching-org-tree"] as const,
	jobPositionTree: ["job-matching-job-position-tree"] as const,
	searchOptions: ["job-matching-search-options"] as const,
	detail: ({ recordId }: JobMatchingDetailQueryParams) =>
		["job-matching-detail", recordId] as const,
	modelOptions: (params: JobMatchingModelOptionsQueryParams) =>
		[
			"job-matching-model-options",
			params.orgCode ?? "",
			params.jobId ?? "",
			params.postId ?? "",
			params.postgradeId ?? "",
		] as const,
	modelOptionsRoot: ["job-matching-model-options"] as const,
};
