/**
 * org-management API 类型定义
 */

import type {
	AdjustmentTask,
	ApprovalFlow,
	ImpactRange,
	TableResponse,
	ValidationResult,
	VersionHistory,
} from "#src/pages/org-management/types";

/**
 * 任务列表请求参数
 */
export interface FetchTaskListParams {
	pageNum: number;
	pageSize: number;
	taskName?: string;
	status?: number;
	creatorName?: string;
	updaterName?: string;
}

/**
 * 任务列表响应
 */
export interface FetchTaskListResponse extends TableResponse<AdjustmentTask> {}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
	taskName: string;
	description?: string;
	effectiveDate?: string;
}

/**
 * 编辑任务请求
 */
export interface UpdateTaskRequest {
	taskName?: string;
	description?: string;
	effectiveDate?: string;
}

/**
 * 任务详情响应
 */
export interface FetchTaskDetailResponse {
	task: AdjustmentTask;
	orgTree: any[]; // OrgNode[]
	operations: any[]; // ChangeOperation[]
	currentVersion: number;
}

/**
 * 组织操作 - 平移请求
 */
export interface MoveOrgRequest {
	taskId: string | number;
	sourceOrgId: string | number;
	targetParentId: string | number;
}

/**
 * 组织操作 - 合并请求
 */
export interface MergeOrgRequest {
	taskId: string | number;
	sourceOrgIds: (string | number)[];
	targetOrgId: string | number;
	targetOrgName: string;
}

/**
 * 组织操作 - 拆分请求
 */
export interface SplitOrgRequest {
	taskId: string | number;
	sourceOrgId: string | number;
	splitTargets: Array<{
		name: string;
		targetParentId: string | number;
	}>;
}

/**
 * 组织操作 - 删除请求
 */
export interface DeleteOrgRequest {
	taskId: string | number;
	orgId: string | number;
}

/**
 * 校验请求
 */
export interface ValidateRequest {
	taskId: string | number;
}

/**
 * 校验响应
 */
export interface ValidateResponse extends ValidationResult {}

/**
 * 影响范围请求
 */
export interface FetchImpactRangeRequest {
	taskId: string | number;
}

/**
 * 影响范围响应
 */
export interface FetchImpactRangeResponse extends ImpactRange {}

/**
 * 保存版本请求
 */
export interface SaveVersionRequest {
	taskId: string | number;
	description: string;
}

/**
 * 获取版本历史响应
 */
export interface FetchVersionHistoryResponse {
	versions: VersionHistory[];
}

/**
 * 回滚版本请求
 */
export interface RollbackVersionRequest {
	taskId: string | number;
	version: number;
}

/**
 * 审核列表请求
 */
export interface FetchApprovalListParams {
	pageNum: number;
	pageSize: number;
	flowCode?: string;
	taskName?: string;
	status?: string;
	currentApprover?: string;
	initiator?: string;
}

/**
 * 审核列表响应
 */
export interface FetchApprovalListResponse extends TableResponse<ApprovalFlow> {}

/**
 * 提交审核请求
 */
export interface SubmitApprovalRequest {
	taskId: string | number;
}

/**
 * 催办请求
 */
export interface SendReminderRequest {
	flowId: string | number;
	message?: string;
}
