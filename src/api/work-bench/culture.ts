import type { CourseItem, CoursePageListParams } from "./types";
import { request } from "#src/utils";

export type { CourseItem, CoursePageListParams } from "./types";

// 课程列表分页查询
export async function getCoursePageList(params: CoursePageListParams) {
	const url = "course/page/list";
	const resp: ApiListResponse<CourseItem> = await request
		.post(url, {
			json: params,
			errorMessage: true,
		})
		.json();
	return resp;
}

// 课程播放地址查询
export async function getCourseUrl(kngId: string) {
	const url = `course/url/${kngId}`;
	const resp: ApiResponse<string> = await request
		.get(url, {
			errorMessage: true,
		})
		.json();
	return resp;
}

// 课程全量同步（超管权限）
export async function syncAllCourses() {
	const url = "course/sync/all";
	const resp: ApiResponse<boolean> = await request
		.get(url, {
			errorMessage: true,
		})
		.json();
	return resp;
}

// 最新课程列表查询
export async function getLatestCourseList() {
	const url = "course/latest/list";
	const resp: ApiResponse<CourseItem[]> = await request
		.get(url, {
			errorMessage: true,
		})
		.json();
	return resp;
}
