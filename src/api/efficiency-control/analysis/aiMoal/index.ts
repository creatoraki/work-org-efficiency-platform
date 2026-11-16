import type {
	ComparedProjCodeRes,
	FuzzyAIMatchingParam,
	MatchingsProjectsRes,
	ProjResultOfContrastParam,
	ProjResultOfContrastRes,
} from "./types";
import { request } from "#src/utils";

export * from "./types";
/* 获取所有匹配的标杆项目 */
export function getAllMatchingProjs(noBenchmarkProjCode: string) {
	return request
		.get<
			ApiListResponse<MatchingsProjectsRes[]>
		>(`hreg/getAllMatchingBenchmarkProjects?noBenchmarkProjCode=${noBenchmarkProjCode}`, { ignoreLoading: true })
		.json();
}

/* 非标杆项目与指定标杆项目对比详情 */
export function getAIComparedProjectDetail(projCode: string) {
	return request
		.get<
			ApiListResponse<ComparedProjCodeRes>
		>("hreg/getAIComparedProjectDetailByBenchmarkProjCode", { searchParams: { projCode } })
		.json();
}

/* 非标杆项目与指定标杆项目对比详情 */
export function getAIDataWithProgress(params: ProjResultOfContrastParam, options?: any) {
	return request
		.post<
			ApiListResponse<ProjResultOfContrastRes>
		>("hreg/getAIProjResultOfContrast", { timeout: 3 * 60 * 1000, json: params, ignoreLoading: true, ...options })
		.json();
}

/* 模糊搜索项目 */
export function getFuzzyAIMatchingProjects(params: FuzzyAIMatchingParam) {
	return request
		.post<
			ApiListResponse<ProjResultOfContrastRes[]>
		>("hreg/fuzzyAIMatchingProjects", { json: params, ignoreLoading: true })
		.json();
}
