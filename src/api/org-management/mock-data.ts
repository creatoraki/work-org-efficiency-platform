/**
 * org-management 模块 Mock 数据
 */

import type {
	AdjustmentTask,
	ApprovalFlow,
	ChangeOperation,
	OrgNode,
	VersionHistory,
} from "#src/pages/org-management/types";
import { ChangeOperationType, OrgNodeType, TaskStatus } from "#src/pages/org-management/types";

/**
 * Mock 组织树数据
 */
export const mockOrgTree: OrgNode[] = [
	{
		id: "1",
		name: "集团总部",
		code: "GROUP_HQ",
		type: OrgNodeType.Department,
		level: 0,
		fullPath: "集团总部",
		children: [
			{
				id: "2",
				name: "华东区域",
				code: "AREA_EAST",
				parentId: "1",
				type: OrgNodeType.Department,
				level: 1,
				fullPath: "集团总部/华东区域",
				children: [
					{
						id: "4",
						name: "上海项目群",
						code: "SH_PROJECT_GROUP",
						parentId: "2",
						type: OrgNodeType.Department,
						level: 2,
						fullPath: "集团总部/华东区域/上海项目群",
					},
					{
						id: "5",
						name: "杭州项目群",
						code: "HZ_PROJECT_GROUP",
						parentId: "2",
						type: OrgNodeType.Department,
						level: 2,
						fullPath: "集团总部/华东区域/杭州项目群",
					},
				],
			},
			{
				id: "3",
				name: "华北区域",
				code: "AREA_NORTH",
				parentId: "1",
				type: OrgNodeType.Department,
				level: 1,
				fullPath: "集团总部/华北区域",
				children: [
					{
						id: "6",
						name: "北京项目群",
						code: "BJ_PROJECT_GROUP",
						parentId: "3",
						type: OrgNodeType.Department,
						level: 2,
						fullPath: "集团总部/华北区域/北京项目群",
					},
				],
			},
		],
	},
];

/**
 * Mock 任务列表数据
 */
export const mockTaskList: AdjustmentTask[] = [
	{
		id: "1",
		taskName: "2025年组织架构调整",
		taskCode: "TASK_001",
		status: TaskStatus.Draft,
		statusStr: "未提交",
		createTime: "2025-01-10 10:30:00",
		updateTime: "2025-01-14 14:20:00",
		creatorName: "张三",
		creatorId: "user_001",
		description: "根据业务发展调整东区域组织结构",
		lockStatus: 0,
		version: 1,
		perm: 2,
	},
	{
		id: "2",
		taskName: "上海市场部重组",
		taskCode: "TASK_002",
		status: TaskStatus.InProgress,
		statusStr: "进行中",
		createTime: "2025-01-08 09:15:00",
		updateTime: "2025-01-13 16:45:00",
		creatorName: "李四",
		creatorId: "user_002",
		description: "市场部业务拆分，成立新的销售中心",
		lockStatus: 1,
		lockedBy: "user_001",
		lockedByName: "张三",
		version: 3,
		perm: 1,
	},
	{
		id: "3",
		taskName: "研发中心组织优化",
		taskCode: "TASK_003",
		status: TaskStatus.Validated,
		statusStr: "校验通过",
		createTime: "2025-01-05 13:20:00",
		updateTime: "2025-01-12 11:00:00",
		creatorName: "王五",
		creatorId: "user_003",
		description: "研发中心拆分为多个产品线",
		lockStatus: 0,
		version: 2,
		perm: 2,
	},
];

/**
 * Mock 操作历史
 */
export const mockOperations: ChangeOperation[] = [
	{
		id: "op_001",
		type: ChangeOperationType.Move,
		operationTime: "2025-01-14 14:20:00",
		operatorName: "张三",
		operatorId: "user_001",
		targetNode: {
			id: "2",
			name: "华东区域",
			code: "AREA_EAST",
			type: OrgNodeType.Department,
			level: 1,
			fullPath: "集团总部/华东区域",
		},
		originalParent: {
			id: "1",
			name: "集团总部",
			code: "GROUP_HQ",
			type: OrgNodeType.Department,
			level: 0,
			fullPath: "集团总部",
		},
		description: "将华东区域平移到华北区域下",
	},
	{
		id: "op_002",
		type: ChangeOperationType.Merge,
		operationTime: "2025-01-14 10:15:00",
		operatorName: "李四",
		operatorId: "user_002",
		targetNode: {
			id: "4",
			name: "上海项目群",
			code: "SH_PROJECT_GROUP",
			type: OrgNodeType.Department,
			level: 2,
			fullPath: "集团总部/华东区域/上海项目群",
		},
		sourceNodes: [
			{
				id: "7",
				name: "浦东项目部",
				code: "PD_PROJECT",
				type: OrgNodeType.Department,
				level: 3,
				fullPath: "集团总部/华东区域/上海项目群/浦东项目部",
			},
		],
		description: "合并浦东项目部到上海项目群",
	},
];

/**
 * Mock 版本历史
 */
export const mockVersionHistory: VersionHistory[] = [
	{
		version: 3,
		createTime: "2025-01-14 14:20:00",
		creatorName: "张三",
		creatorId: "user_001",
		description: "最新版本",
		operationCount: 2,
		operations: mockOperations,
		isCurrent: true,
	},
	{
		version: 2,
		createTime: "2025-01-13 16:45:00",
		creatorName: "李四",
		creatorId: "user_002",
		description: "第二个版本",
		operationCount: 1,
		operations: [mockOperations[1]],
		isCurrent: false,
	},
];

/**
 * Mock 审核流程
 */
export const mockApprovalFlows: ApprovalFlow[] = [
	{
		id: "flow_001",
		flowCode: "FLOW_2025_001",
		taskId: "1",
		taskName: "2025年组织架构调整",
		version: 1,
		status: "in_progress",
		currentApprover: "审核主任",
		currentApproverId: "user_audit_001",
		initiateTime: "2025-01-14 14:30:00",
		initiator: "张三",
		initiatorId: "user_001",
	},
	{
		id: "flow_002",
		flowCode: "FLOW_2025_002",
		taskId: "2",
		taskName: "上海市场部重组",
		version: 3,
		status: "completed",
		initiateTime: "2025-01-10 09:00:00",
		completedTime: "2025-01-12 17:30:00",
		initiator: "李四",
		initiatorId: "user_002",
	},
];
