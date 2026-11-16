/**
 * 区域 API
 */

import type * as Types from "./types";
import { request } from "#src/utils";

/**
 * 获取省市区信息
 */
export async function getArea(params: Types.GetAreaParams) {
	const url = "area/getArea";
	const resp: Types.GetAreaResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
