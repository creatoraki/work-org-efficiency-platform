/**
 * 导出任务管理相关类型定义
 */

import type { PageParams } from "../types";

/**
 * 导入任务列表查询参数
 */
export interface ImportTaskListParams extends PageParams {
	/** 任务名称 */
	taskName?: string;
	/** 任务状态 */
	status?: number;
	/** 模块名称 */
	moduleName?: string;
}

/**
 * 导入任务列表项
 */
export interface ImportTaskListItem {
	/** 任务ID */
	id: number;
	/** 任务编码 */
	taskCode: string;
	/** 任务名称 */
	taskName: string;
	/** 任务状态 */
	status: number;
	/** 成功数量 */
	successNum: number;
	/** 失败数量 */
	errorNum: number;
	/** 已完成总数 */
	completedTotalNum: number;
	/** 总数 */
	totalNum: number;
	/** 源文件 */
	sourceFile: string;
	/** 失败反馈文件 */
	errorFile: string;
	/** 耗时,单位毫秒 */
	spendTime: number;
	/** 耗时,单位秒 */
	spendTimeStr: string;
	/** 任务开始时间 */
	startTime: Record<string, unknown>;
	/** 任务结束时间 */
	endTime: Record<string, unknown>;
	/** 模块名称 */
	moduleName: string;
	/** 文件大小 */
	fileSize: number;
	/** 文件大小（带单位） */
	fileSizeStr: string;
	/** 备注 */
	remark: string;
}

/**
 * 下载导入任务结果响应
 */
export interface DownloadRes extends Blob {}

/**
 * 导入任务详情
 */
export interface ImportTaskDetail {
	/** 创建者 */
	createBy: string;
	/** 创建时间 */
	createTime: Record<string, unknown>;
	/** 更新者 */
	updateBy: string;
	/** 更新时间 */
	updateTime: Record<string, unknown>;
	/** 备注 */
	remark: string;
	/** 创建者姓名 */
	createByName: string;
	/** 更新者姓名 */
	updateByName: string;
	/** 任务ID */
	id: number;
	/** 任务编码 */
	taskCode: string;
	/** 任务名称 */
	taskName: string;
	/** 任务状态 0排队中，1进行中，2成功，3失败，4审批中，5审批拒绝 */
	status: number;
	/** 成功数量 */
	successNum: number;
	/** 失败数量 */
	errorNum: number;
	/** 已完成总数 */
	completedTotalNum: number;
	/** 总数 */
	totalNum: number;
	/** 上下文信息 */
	contextInfo: string;
	/** 源文件 */
	sourceFile: string;
	/** 失败反馈文件 */
	errorFile: string;
	/** 耗时,单位秒 */
	spendTime: number;
	/** 任务开始时间 */
	startTime: Record<string, unknown>;
	/** 任务结束时间 */
	endTime: Record<string, unknown>;
	/** 模块名称 */
	moduleName: string;
	/** 菜单名称 */
	menuName: string;
	/** 文件大小 */
	fileSize: number;
	/** 失败原因 */
	failureReason: string;
	/** 失败原因详情 */
	detailFailureReason: string;
}

/**
 * 新增导入任务响应
 */
export interface ImportDataRes extends ApiResponse<boolean> {}
