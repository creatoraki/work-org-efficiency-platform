/**
 * org-management API 接口实现 (Mock)
 */

import type { TaskCounts } from "#src/pages/org-management/org-adjustment-management/org-adjustment/types";
import type {
	AdjustmentTask,
	ChangeOperation,
	ValidationError,
	ValidationWarning,
} from "#src/pages/org-management/types";
import type {
	CreateTaskRequest,
	// DeleteOrgRequest,
	FetchApprovalListParams,
	FetchApprovalListResponse,
	// FetchImpactRangeRequest,
	FetchImpactRangeResponse,
	FetchTaskDetailResponse,
	FetchTaskListParams,
	FetchTaskListResponse,
	FetchVersionHistoryResponse,
	MergeOrgRequest,
	MoveOrgRequest,
	RollbackVersionRequest,
	SaveVersionRequest,
	// SendReminderRequest,
	SplitOrgRequest,
	SubmitApprovalRequest,
	UpdateTaskRequest,
	// ValidateRequest,
	ValidateResponse,
} from "./types";
import {
	ChangeOperationType,
	OrgNodeType,
	TASK_STATUS_TEXT,
	TaskStatus,
} from "#src/pages/org-management/types";
import {
	mockApprovalFlows,
	mockOperations,
	mockOrgTree,
	mockTaskList,
	mockVersionHistory,
} from "./mock-data";

/**
 * 获取任务列表
 */
export async function fetchTaskList(
	params: FetchTaskListParams,
): Promise<ApiResponse<FetchTaskListResponse>> {
	// 模拟网络延迟
	await new Promise((resolve) => setTimeout(resolve, 300));

	let list = [...mockTaskList];

	// 搜索过滤
	if (params.taskName) {
		list = list.filter((task) => task.taskName.includes(params.taskName!));
	}
	if (params.status !== undefined) {
		list = list.filter((task) => task.status === params.status);
	}
	if (params.creatorName) {
		list = list.filter((task) => task.creatorName.includes(params.creatorName!));
	}

	// 分页
	const total = list.length;
	const start = (params.pageNum - 1) * params.pageSize;
	const end = start + params.pageSize;
	const pageList = list.slice(start, end);

	return {
		code: 0,
		msg: "成功",
		data: {
			list: pageList,
			total,
		},
	};
}

/**
 * 创建任务
 */
export async function createTask(request: CreateTaskRequest): Promise<ApiResponse<AdjustmentTask>> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const newTask: AdjustmentTask = {
		id: String(mockTaskList.length + 1),
		taskName: request.taskName,
		taskCode: `TASK_${String(mockTaskList.length + 1).padStart(3, "0")}`,
		status: TaskStatus.Draft,
		statusStr: TASK_STATUS_TEXT[TaskStatus.Draft],
		createTime: new Date().toLocaleString("zh-CN"),
		updateTime: new Date().toLocaleString("zh-CN"),
		creatorName: "当前用户",
		creatorId: "current_user",
		description: request.description,
		effectiveDate: request.effectiveDate,
		lockStatus: 0,
		version: 1,
		perm: 2,
	};

	mockTaskList.push(newTask);

	return {
		code: 0,
		msg: "成功",
		data: newTask,
	};
}

/**
 * 编辑任务
 */
export async function updateTask(
	taskId: string | number,
	request: UpdateTaskRequest,
): Promise<ApiResponse<AdjustmentTask>> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const task = mockTaskList.find((t) => t.id === taskId);
	if (!task) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	if (request.taskName) {
		task.taskName = request.taskName;
	}
	if (request.description !== undefined) {
		task.description = request.description;
	}
	if (request.effectiveDate) {
		task.effectiveDate = request.effectiveDate;
	}
	task.updateTime = new Date().toLocaleString("zh-CN");

	return {
		code: 0,
		msg: "成功",
		data: task,
	};
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string | number): Promise<ApiResponse<null>> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const index = mockTaskList.findIndex((t) => t.id === taskId);
	if (index === -1) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	mockTaskList.splice(index, 1);

	return {
		code: 0,
		msg: "成功",
		data: null,
	};
}

/**
 * 获取任务详情
 */
export async function fetchTaskDetail(
	taskId: string | number,
): Promise<ApiResponse<FetchTaskDetailResponse>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const task = mockTaskList.find((t) => t.id === taskId);
	if (!task) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	const currentVersion = task.version || 1;

	return {
		code: 0,
		msg: "成功",
		data: {
			task,
			orgTree: mockOrgTree,
			operations: mockOperations,
			currentVersion,
		},
	};
}

/**
 * 平移组织
 */
export async function moveOrg(request: MoveOrgRequest): Promise<ApiResponse<ChangeOperation>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const newOperation: ChangeOperation = {
		id: `op_${Date.now()}`,
		type: ChangeOperationType.Move,
		operationTime: new Date().toLocaleString("zh-CN"),
		operatorName: "当前用户",
		operatorId: "current_user",
		targetNode: {
			id: request.sourceOrgId,
			name: "移动节点",
			code: "MOVED_NODE",
			type: OrgNodeType.Department,
			level: 1,
			fullPath: "集团总部/移动节点",
		},
		originalParent: {
			id: "1",
			name: "集团总部",
			code: "GROUP_HQ",
			type: OrgNodeType.Department,
			level: 0,
			fullPath: "集团总部",
		},
		description: "平移组织节点",
	};

	mockOperations.push(newOperation);

	return {
		code: 0,
		msg: "成功",
		data: newOperation,
	};
}

/**
 * 合并组织
 */
export async function mergeOrg(request: MergeOrgRequest): Promise<ApiResponse<ChangeOperation>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const sourceNodeNames = request.sourceOrgIds.map((id) => `组织${id}`).join("、");

	const newOperation: ChangeOperation = {
		id: `op_${Date.now()}`,
		type: ChangeOperationType.Merge,
		operationTime: new Date().toLocaleString("zh-CN"),
		operatorName: "当前用户",
		operatorId: "current_user",
		targetNode: {
			id: request.targetOrgId,
			name: request.targetOrgName,
			code: "MERGED_TARGET",
			type: OrgNodeType.Department,
			level: 1,
			fullPath: `集团总部/${request.targetOrgName}`,
		},
		sourceNodes: request.sourceOrgIds.map((id) => ({
			id,
			name: `组织${id}`,
			code: `ORG_${id}`,
			type: OrgNodeType.Department,
			level: 1,
			fullPath: `集团总部/组织${id}`,
		})),
		description: `合并${sourceNodeNames}到${request.targetOrgName}`,
	};

	mockOperations.push(newOperation);

	return {
		code: 0,
		msg: "成功",
		data: newOperation,
	};
}

/**
 * 拆分组织
 */
export async function splitOrg(request: SplitOrgRequest): Promise<ApiResponse<ChangeOperation>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const splitTargetsStr = request.splitTargets.map((t) => t.name).join("、");

	const newOperation: ChangeOperation = {
		id: `op_${Date.now()}`,
		type: ChangeOperationType.Split,
		operationTime: new Date().toLocaleString("zh-CN"),
		operatorName: "当前用户",
		operatorId: "current_user",
		targetNode: {
			id: request.sourceOrgId,
			name: "拆分来源",
			code: "SPLIT_SOURCE",
			type: OrgNodeType.Department,
			level: 1,
			fullPath: "集团总部/拆分来源",
		},
		description: `拆分为${splitTargetsStr}`,
	};

	mockOperations.push(newOperation);

	return {
		code: 0,
		msg: "成功",
		data: newOperation,
	};
}

/**
 * 删除组织
 */
export async function deleteOrg(): Promise<ApiResponse<null>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	return {
		code: 0,
		msg: "成功",
		data: null,
	};
}

/**
 * 校验任务
 */
export async function validateTask(): Promise<ApiResponse<ValidateResponse>> {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	// 模拟一些校验规则
	// 实际应该根据任务的组织树数据进行校验

	const response: ValidateResponse = {
		isValid: errors.length === 0,
		errors,
		warnings,
		timestamp: new Date().toISOString(),
	};

	return {
		code: 0,
		msg: "成功",
		data: response,
	};
}

/**
 * 获取影响范围
 */
export async function fetchImpactRange(): Promise<ApiResponse<FetchImpactRangeResponse>> {
	await new Promise((resolve) => setTimeout(resolve, 800));

	const response: FetchImpactRangeResponse = {
		affectedPersonCount: 234,
		affectedDepartmentCount: 12,
		affectedRoleCount: 8,
		affectedSystemCount: 5,
		details: {
			persons: [
				{
					personId: "p_001",
					personName: "张三",
					originalOrg: "华东区域",
					newOrg: "华北区域",
					changeType: "部门变更",
				},
				{
					personId: "p_002",
					personName: "李四",
					originalOrg: "上海项目群",
					newOrg: "杭州项目群",
					changeType: "部门变更",
				},
			],
			departments: [
				{
					deptId: "d_001",
					deptName: "上海项目群",
					changeType: "平移",
					childCount: 3,
				},
				{
					deptId: "d_002",
					deptName: "杭州项目群",
					changeType: "平移",
					childCount: 2,
				},
			],
			roles: [
				{
					roleId: "r_001",
					roleName: "项目经理",
					affectedCount: 45,
				},
				{
					roleId: "r_002",
					roleName: "技术主管",
					affectedCount: 23,
				},
			],
			systems: [
				{
					systemId: "s_001",
					systemName: "OA系统",
					syncStatus: "pending",
				},
				{
					systemId: "s_002",
					systemName: "EHR系统",
					syncStatus: "synced",
					syncTime: new Date().toLocaleString("zh-CN"),
				},
			],
		},
	};

	return {
		code: 0,
		msg: "成功",
		data: response,
	};
}

/**
 * 保存版本
 */
export async function saveVersion(request: SaveVersionRequest): Promise<ApiResponse<number>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const task = mockTaskList.find((t) => t.id === request.taskId);
	if (!task) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	const newVersion = (task.version || 1) + 1;
	task.version = newVersion;
	task.updateTime = new Date().toLocaleString("zh-CN");

	return {
		code: 0,
		msg: "成功",
		data: newVersion,
	};
}

/**
 * 获取版本历史
 */
export async function fetchVersionHistory(): Promise<ApiResponse<FetchVersionHistoryResponse>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const response: FetchVersionHistoryResponse = {
		versions: mockVersionHistory,
	};

	return {
		code: 0,
		msg: "成功",
		data: response,
	};
}

/**
 * 回滚版本
 */
export async function rollbackVersion(request: RollbackVersionRequest): Promise<ApiResponse<null>> {
	await new Promise((resolve) => setTimeout(resolve, 500));

	const task = mockTaskList.find((t) => t.id === request.taskId);
	if (!task) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	task.version = request.version;
	task.updateTime = new Date().toLocaleString("zh-CN");

	return {
		code: 0,
		msg: "成功",
		data: null,
	};
}

/**
 * 获取审核列表
 */
export async function fetchApprovalList(
	params: FetchApprovalListParams,
): Promise<ApiResponse<FetchApprovalListResponse>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	let list = [...mockApprovalFlows];

	// 搜索过滤
	if (params.flowCode) {
		list = list.filter((flow) => flow.flowCode.includes(params.flowCode!));
	}
	if (params.taskName) {
		list = list.filter((flow) => flow.taskName.includes(params.taskName!));
	}
	if (params.status) {
		list = list.filter((flow) => flow.status === params.status);
	}
	if (params.currentApprover) {
		list = list.filter((flow) => flow.currentApprover?.includes(params.currentApprover!));
	}
	if (params.initiator) {
		list = list.filter((flow) => flow.initiator.includes(params.initiator!));
	}

	// 分页
	const total = list.length;
	const start = (params.pageNum - 1) * params.pageSize;
	const end = start + params.pageSize;
	const pageList = list.slice(start, end);

	return {
		code: 0,
		msg: "成功",
		data: {
			list: pageList,
			total,
		},
	};
}

/**
 * 提交审核
 */
export async function submitApproval(request: SubmitApprovalRequest): Promise<ApiResponse<null>> {
	await new Promise((resolve) => setTimeout(resolve, 300));

	const task = mockTaskList.find((t) => t.id === request.taskId);
	if (!task) {
		return {
			code: -1,
			msg: "任务不存在",
		} as any;
	}

	task.status = TaskStatus.Submitted;
	task.statusStr = TASK_STATUS_TEXT[TaskStatus.Submitted];
	task.updateTime = new Date().toLocaleString("zh-CN");

	return {
		code: 0,
		msg: "成功",
		data: null,
	};
}

/**
 * 发送催办提醒
 */
export async function sendReminder(): Promise<ApiResponse<null>> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	return {
		code: 0,
		msg: "催办消息已发送",
		data: null,
	};
}

/**
 * 获取任务统计
 */
export async function fetchTaskCounts(): Promise<TaskCounts> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	const totalNum = mockTaskList.length;
	const draftNum = mockTaskList.filter((task) => task.status === TaskStatus.Draft).length;
	const inProgressNum = mockTaskList.filter(
		(task) => task.status === TaskStatus.InProgress,
	).length;
	const completedNum = mockTaskList.filter(
		(task) => task.status === TaskStatus.Executed || task.status === TaskStatus.Approved,
	).length;

	return {
		totalNum,
		draftNum,
		inProgressNum,
		completedNum,
	};
}
