/**
 * 组织调整任务 API
 */

import type * as Types from "./types";
import { request } from "#src/utils";

/**
 * 组织调整任务统计接口
 */
export async function fetchOrgAdjustmentTaskStatistics() {
	const url = "orgadjustment/orgadjustment/count";
	const resp: Types.OrgAdjustmentTaskStatisticsResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务列表查询条件接口
 */
export async function fetchOrgAdjustmentTaskSearchOptions() {
	const url = "orgadjustment/orgadjustment/search-options";
	const resp: Types.OrgAdjustmentTaskSearchOptionsResponse = await request
		.get(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务列表查询接口
 */
export async function fetchOrgAdjustmentTaskList(params: Types.OrgAdjustmentTaskListParams) {
	const url = "orgadjustment/orgadjustment/list";
	const resp: Types.OrgAdjustmentTaskListResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务创建接口
 */
export async function createOrgAdjustmentTask(params: Types.CreateOrgAdjustmentTaskParams) {
	const url = "orgadjustment/orgadjustment";
	const resp: Types.CreateOrgAdjustmentTaskResponse = await request
		.post(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务编辑接口
 */
export async function editOrgAdjustmentTask(params: Types.EditOrgAdjustmentTaskParams) {
	const url = "orgadjustment/orgadjustment";
	const resp: Types.EditOrgAdjustmentTaskResponse = await request
		.put(url, {
			json: params,
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

/**
 * 组织调整任务删除接口
 */
export async function removeOrgAdjustmentTask(ids: Types.RemoveOrgAdjustmentTaskParams) {
	const url = `orgadjustment/orgadjustment/${ids.join(",")}`;
	const resp: Types.RemoveOrgAdjustmentTaskResponse = await request
		.delete(url, {
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

// ==================== 操作日志相关 ====================

export interface QueryLogRes {
	/** 主键 id */
	id: string;

	/** 业务 id */
	bizId: string;

	/** 业务对象 */
	bizObject: {
		/** 业务编码 */
		bizCode: string;

		/** 对象名称 */
		objName: string;
	};

	/** 标题 */
	title: string;

	/** 操作信息 */
	action: {
		/** 操作文案 */
		value: string;

		/** 可用值: NORMAL, INITIATE, RESULT */
		type: string;

		/** 操作编码 */
		code: string;
	};

	/** 日志内容 */
	content: {
		options: {
			data: Record<string, unknown>;

			style: {
				color: string;
				bold: boolean;
				italic: boolean;
				fontSize: number;
			};
		}[];
	};

	/** 操作人 */
	operator: {
		id: string;
		name: string;
		phone: string;
	};

	/** 组织信息 */
	groupInfo: {
		id: string;
		name: string;
	};

	/** 操作时间 */
	operateTime: Record<string, unknown>;
}

/**
 * 查询操作日志
 */
export async function queryLog(bizId: string, bizCode: string) {
	const url = "log/list";
	const resp: QueryLogRes[] = await request
		.get(url, {
			searchParams: {
				bizId,
				bizCode,
			},
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}

export interface QueryLog2Res {
	/** 返回码 */
	code: number;

	/** 返回码说明 */
	msg: string;

	/** 返回数据 */
	data: QueryLogRes[];
}

/**
 * 查询操作日志 v2
 */
export async function queryLog2(bizId: string, bizCode: string) {
	const url = "log/list/v2";
	const resp: QueryLog2Res = await request
		.get(url, {
			searchParams: {
				bizId,
				bizCode,
			},
			ignoreLoading: true,
			errorMessage: true,
		})
		.json();
	return resp;
}
