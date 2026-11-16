import type {
	ApprovalData,
	ApprovalDetailQuery,
	ApprovalEmployee,
	ApprovalEmployeeQuery,
	ApprovalFillerCandidate,
	ApprovalOrgNode,
	ApprovalQueryParams,
	ApprovalSubmitPayload,
	ApprovalSubmitResult,
} from "./types";

import {
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
	updateMockTodoStatus,
} from "#src/api/performance-management/todo";

import { ApprovalAuditAction, ApprovalCheckStatus, ApprovalTab } from "./types";

/** 组织树 mock */
const ORG_TREE = [
	{
		id: "ds-pq",
		name: "岱山项目群",
		children: [
			{ id: "zssw", name: "舟山秀水湾度假村服务中心服务中心" },
			{ id: "dswl", name: "岱山蔚蓝公寓服务中心" },
			{ id: "dsss", name: "岱山盛世豪庭生活服务中心" },
			{ id: "dfmy", name: "东方蜜月城堡生活服务中心" },
			{ id: "dszf", name: "岱山紫宸府生活服务中心" },
			{ id: "dscf", name: "岱山孵化厂房、星浦小区项目点" },
			{ id: "dhjy", name: "东海郊野公园景区管理服务点" },
			{ id: "dssy", name: "岱山盛世一家庭生活服务中心" },
			{ id: "zslh", name: "舟山市绿澜生活服务中心" },
		],
	},
];

/** 完成明细 mock */
const DETAILS = [
	{
		key: "d1",
		orgName: "舟山秀水湾度假村服务中心服务中心",
		submitter: "孙正云",
		totalCount: 400,
		position: "岗位",
		distribution: "A:140 B+:320 B:1200 C:680 D:120",
		exceptionNote: "不符合要求",
		status: RatingTodoStatus.SUBMITTED,
		lastSubmitTime: "2026-12-15 12:11",
		processNo: "UY13894718461816256",
		action: "audit" as const,
	},
	{
		key: "d2",
		orgName: "岱山蔚蓝公寓服务中心",
		submitter: "郑鲜丹",
		totalCount: 32,
		position: "岗位",
		distribution: "A:94 B+:62 B:320 C:48 D:32",
		exceptionNote: "不符合集团年度评级要求，应...",
		rejectReason: "不符合集团年度评级要求，应XXX，修正后请重新提报",
		status: RatingTodoStatus.REJECTED,
		lastSubmitTime: "2026-12-15 12:11",
		processNo: "UY13894718461816235",
		action: "view" as const,
	},
	{
		key: "d3",
		orgName: "岱山盛世豪庭生活服务中心",
		submitter: "郑海鹰",
		totalCount: 156,
		position: "岗位",
		distribution: "A:54 B+:62 B:120 C:88 D:22",
		exceptionNote: "不符合要求",
		status: RatingTodoStatus.PENDING,
		lastSubmitTime: "2026-12-15 12:11",
		action: "view" as const,
	},
	{
		key: "d4",
		orgName: "东方蜜月城堡生活服务中心",
		submitter: "郑鲜丹",
		totalCount: 456,
		position: "岗位",
		distribution: "A:140 B+:320 B:1200 C:680 D:120",
		exceptionNote: "不符合要求",
		status: RatingTodoStatus.PENDING,
		lastSubmitTime: "2026-12-15 12:11",
		action: "view" as const,
	},
	{
		key: "d5",
		orgName: "岱山盛世一家庭生活服务中心",
		submitter: "孙桂林",
		totalCount: 156,
		position: "岗位",
		distribution: "A:54 B+62 B:120 C:88 D:22",
		exceptionNote: "不符合要求",
		status: RatingTodoStatus.COMPLETED,
		lastSubmitTime: "2026-12-15 12:11",
		action: "view" as const,
	},
];

/** 等级分布 mock */
const DISTRIBUTION_ROWS = [
	{
		key: "r1",
		positionCategory: "职能员工",
		totalCount: 300,
		standard: { a: 0, bPlus: 100, b: 200, cd: 0 },
		actual: { a: 200, bPlus: 100, b: 0, c: 0, d: 0 },
		check: { a: "超200", bPlus: "正常", b: "少200", cd: "正常" },
	},
	{
		key: "r2",
		positionCategory: "项目员工(其他)",
		totalCount: 200,
		standard: { a: 0, bPlus: 0, b: 2, cd: 0 },
		actual: { a: 0, bPlus: 100, b: 100, c: 0, d: 0 },
		check: { a: "正常", bPlus: "超100", b: "少100", cd: "正常" },
	},
	{
		key: "r3",
		positionCategory: "项目员工(安全)",
		totalCount: 200,
		standard: { a: 0, bPlus: 0, b: 1, cd: 0 },
		actual: { a: 0, bPlus: 0, b: 100, c: 0, d: 0 },
		check: { a: "正常", bPlus: "正常", b: "正常", cd: "正常" },
	},
	{
		key: "r4",
		positionCategory: "项目员工(保洁绿化)",
		totalCount: 100,
		standard: { a: 0, bPlus: 0, b: 1, cd: 0 },
		actual: { a: 0, bPlus: 0, b: 0, c: 0, d: 0 },
		check: { a: "正常", bPlus: "正常", b: "少100", cd: "超100" },
	},
	{
		key: "r-total",
		positionCategory: "合计",
		totalCount: 800,
		standard: { a: 0, bPlus: 100, b: 600, cd: 0 },
		actual: { a: 200, bPlus: 200, b: 200, c: 100, d: 0 },
		check: { a: "超200", bPlus: "超100", b: "少300", cd: "超100" },
		isTotal: true,
	},
];

/** 审批名单 mock */
const EMPLOYEES: ApprovalEmployee[] = [
	{
		id: "e1",
		name: "冯丽妍",
		employeeNo: "E1001",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "1/3",
		suggestLevel: "B+",
		submitLevel: "B+",
		checkStatus: ApprovalCheckStatus.NORMAL,
		exceptionNote: "不符合要求",
		exceptionNoteRequired: true,
		filler: "吴梦颜",
		status: RatingTodoStatus.SUBMITTED,
	},
	{
		id: "e2",
		name: "钱虹君",
		employeeNo: "E1002",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "2/3",
		suggestLevel: "B+",
		submitLevel: "B+",
		checkStatus: ApprovalCheckStatus.NORMAL,
		filler: "吴梦颜",
		status: RatingTodoStatus.REJECTED,
	},
	{
		id: "e3",
		name: "郑以轩",
		employeeNo: "E1003",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "3/3",
		suggestLevel: "B+",
		submitLevel: "B+",
		checkStatus: ApprovalCheckStatus.NORMAL,
		filler: "吴梦颜",
		status: RatingTodoStatus.PENDING,
	},
	{
		id: "e4",
		name: "赵海",
		employeeNo: "E1004",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "1/2",
		suggestLevel: "B",
		submitLevel: "B",
		checkStatus: ApprovalCheckStatus.NORMAL,
		exceptionNote: "不符合要求",
		exceptionNoteRequired: true,
		filler: "吴梦颜",
		status: RatingTodoStatus.PENDING,
	},
	{
		id: "e5",
		name: "赵轩海",
		employeeNo: "E1005",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "2/2",
		suggestLevel: "A",
		submitLevel: "B",
		checkStatus: ApprovalCheckStatus.WARNING,
		checkDiff: "差2级",
		exceptionNote: "不符合集团...",
		exceptionNoteRequired: true,
		filler: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
	{
		id: "e6",
		name: "李丽颖",
		employeeNo: "E1006",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "1/2",
		suggestLevel: "B",
		submitLevel: "B",
		checkStatus: ApprovalCheckStatus.NORMAL,
		exceptionNote: "不符合要求",
		exceptionNoteRequired: true,
		filler: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
	{
		id: "e7",
		name: "郑轩",
		employeeNo: "E1007",
		department: "善数创新部",
		position: "岗位",
		positionCategory: "职能员工",
		jobLevel: "P4",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		departmentRank: "2/2",
		suggestLevel: "B",
		submitLevel: "B",
		checkStatus: ApprovalCheckStatus.NORMAL,
		filler: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
];

/** 默认审批数据 */
const DEFAULT_APPROVAL_DATA: ApprovalData = {
	todoId: "",
	ratingInfo: {
		planName: "2026年度评级",
		cycle: "2026年度",
		assessType: RatingAssessType.STAFF,
		nodeType: RatingNodeType.APPROVE,
		executeScope: "岱山项目群",
		executor: "项目群群主",
		validDate: "2026-12-15",
		status: RatingTodoStatus.PENDING,
		collaborators: ["吴梦颜", "赵海"],
	},
	orgTree: ORG_TREE,
	tabCounts: {
		[ApprovalTab.SHOULD_FINISH]: 1200,
		[ApprovalTab.PENDING]: 602,
		[ApprovalTab.SUBMITTED]: 15,
		[ApprovalTab.REJECTED]: 32,
		[ApprovalTab.FINISHED]: 156,
	},
	totalCount: 1200,
	filledCount: 1200,
	details: DETAILS,
	distributionRows: DISTRIBUTION_ROWS,
	employees: EMPLOYEES,
	versions: [],
	currentVersionId: "",
	readonly: false,
};

/**
 * 多版本 mock：同一待办存在多个版本时，抽屉标题右侧展示版本切换
 */
const MULTI_VERSION_DATA: ApprovalData = {
	...DEFAULT_APPROVAL_DATA,
	versions: [
		{ id: "v1", name: "V1" },
		{ id: "v2", name: "V2" },
	],
	currentVersionId: "v2",
};

/**
 * 查询审批详情
 *
 * @param params - 查询参数
 * @returns 审批详情数据
 */
export async function fetchApprovalDetail(params: ApprovalQueryParams): Promise<ApprovalData> {
	// TODO(接口就绪): 改为 request.get(`performance/approval/${params.todoId}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	// 待办 id 为 12 时演示多版本形态
	const base = params.todoId === "12" ? MULTI_VERSION_DATA : DEFAULT_APPROVAL_DATA;
	return {
		...base,
		todoId: params.todoId,
		currentVersionId: params.versionId ?? base.currentVersionId,
	};
}

/**
 * 过滤完成明细
 *
 * @param rows - 明细行
 * @param query - 查询条件
 * @returns 过滤后的明细行
 */
export function filterApprovalDetails(rows: ApprovalData["details"], query: ApprovalDetailQuery) {
	return rows.filter(
		(row) =>
			(!query.submitter || row.submitter.includes(query.submitter)) &&
			(!query.status || row.status === query.status),
	);
}

/**
 * 过滤审批名单
 *
 * @param rows - 员工行
 * @param query - 查询条件
 * @returns 过滤后的员工行
 */
export function filterApprovalEmployees(rows: ApprovalEmployee[], query: ApprovalEmployeeQuery) {
	return rows.filter(
		(row) =>
			(!query.keyword ||
				row.name.includes(query.keyword) ||
				row.employeeNo.includes(query.keyword)) &&
			(!query.positionCategory || row.positionCategory === query.positionCategory) &&
			(!query.employmentStatus || row.employmentStatus === query.employmentStatus) &&
			(!query.submitLevel || row.submitLevel === query.submitLevel) &&
			(!query.checkStatus || row.checkStatus === query.checkStatus) &&
			(!query.status || row.status === query.status),
	);
}

/**
 * 审核单条明细（通过 / 驳回）
 *
 * @param todoId - 待办标识
 * @param rowKey - 明细行标识
 * @param action - 审核动作
 * @param reason - 驳回原因
 * @returns 提交结果
 */
export async function auditApprovalDetail(
	todoId: string,
	rowKey: string,
	action: ApprovalAuditAction,
	reason?: string,
): Promise<ApprovalSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/approval/audit", { json: { todoId, rowKey, action, reason } }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	const data = todoId === "12" ? MULTI_VERSION_DATA : DEFAULT_APPROVAL_DATA;
	const detail = data.details.find((item) => item.key === rowKey);
	if (detail) {
		detail.status =
			action === ApprovalAuditAction.PASS
				? RatingTodoStatus.COMPLETED
				: RatingTodoStatus.REJECTED;
		detail.action = "view";
		if (action === ApprovalAuditAction.REJECT) {
			detail.rejectReason = reason;
		}
	}
	return { success: true };
}

/**
 * 将审批表单写回当前 mock 详情，保证暂存和提交后重新打开仍能回显。
 *
 * @param payload - 审批表单载荷
 * @param completed - 是否完成提交
 */
function writeApprovalPayload(payload: ApprovalSubmitPayload, completed: boolean) {
	const data = payload.todoId === "12" ? MULTI_VERSION_DATA : DEFAULT_APPROVAL_DATA;
	data.employees = data.employees.map((employee) => {
		const input = payload.employees.find((item) => item.id === employee.id);
		return input ? { ...employee, ...input } : employee;
	});
	data.distributionExceptionNote = payload.distributionExceptionNote;
	if (payload.collaborators) {
		data.ratingInfo = { ...data.ratingInfo, collaborators: payload.collaborators };
	}
	if (completed) {
		data.ratingInfo = { ...data.ratingInfo, status: RatingTodoStatus.COMPLETED };
		data.readonly = true;
	}
}

/**
 * 暂存审批
 *
 * @param payload - 提交载荷
 * @returns 提交结果
 */
export async function saveApprovalDraft(
	payload: ApprovalSubmitPayload,
): Promise<ApprovalSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/approval/draft", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	writeApprovalPayload(payload, false);
	return { success: true };
}

/**
 * 提交审批
 *
 * @param payload - 提交载荷
 * @returns 提交结果
 */
export async function submitApproval(
	payload: ApprovalSubmitPayload,
): Promise<ApprovalSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/approval/submit", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	writeApprovalPayload(payload, true);
	updateMockTodoStatus(payload.todoId, RatingTodoStatus.SUBMITTED);
	return { success: true };
}

/**
 * 发起 OA
 *
 * @param todoId - 待办标识
 * @returns 提交结果
 */
export async function startApprovalOa(todoId: string): Promise<ApprovalSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/approval/oa", { json: { todoId } }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	void todoId;
	return { success: true };
}

/** 填报人选择器：组织树 */
const APPROVAL_FILLER_TREE: ApprovalOrgNode[] = [
	{
		id: "f-green-town",
		name: "绿城服务集团",
		children: [
			{
				id: "f-region",
				name: "区域公司",
				children: [
					{ id: "f-hangzhou", name: "杭州区域公司" },
					{
						id: "f-zhedong",
						name: "浙东区域公司",
						children: [
							{
								id: "f-zhoushan",
								name: "舟山地区",
								children: [
									{ id: "f-xibu", name: "舟山西部项目群" },
									{ id: "f-daishan", name: "岱山项目群" },
									{ id: "f-dinghai", name: "定海项目群" },
									{ id: "f-dinghai1", name: "定海项目1群" },
									{ id: "f-dinghai2", name: "定海项目2群" },
									{ id: "f-dinghai3", name: "定海项目3群" },
								],
							},
						],
					},
				],
			},
		],
	},
];

/** 填报人选择器：候选成员 */
const APPROVAL_FILLER_CANDIDATES: ApprovalFillerCandidate[] = [
	{
		id: "fc-1",
		name: "钱一唯",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山地区>舟山西部项目群>舟山秀水湾度假村服务中心",
		disabled: true,
	},
	{
		id: "fc-2",
		name: "周祥",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
	{
		id: "fc-3",
		name: "周海迪",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
	{
		id: "fc-4",
		name: "赵鹏",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
	{
		id: "fc-5",
		name: "李政斌",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
];

/** 填报人选择器：已选成员 */
const APPROVAL_FILLER_SELECTED: ApprovalFillerCandidate[] = [
	{
		id: "fs-1",
		name: "周祥",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
	{
		id: "fs-2",
		name: "赵鹏",
		path: "绿城服务集团>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
	},
	{ id: "fs-3", name: "周周", path: "绿城服务集团>区域公司>杭州区域公司>第一分公司>绿城玫瑰园" },
	{
		id: "fs-4",
		name: "戴佳欣",
		path: "绿城服务集团>区域公司>杭州区域公司>第一分公司>绿城玫瑰园",
	},
	{ id: "fs-5", name: "李杰", path: "绿城服务集团>区域公司>杭州区域公司>第一分公司>绿城玫瑰园" },
];

/**
 * 查询填报人选择器数据
 *
 * @returns 组织树、候选成员与已选成员
 */
export async function fetchApprovalFillerPickerData(): Promise<{
	tree: ApprovalOrgNode[];
	candidates: ApprovalFillerCandidate[];
	selected: ApprovalFillerCandidate[];
}> {
	await new Promise((resolve) => setTimeout(resolve, 150));
	return {
		tree: APPROVAL_FILLER_TREE,
		candidates: APPROVAL_FILLER_CANDIDATES,
		selected: APPROVAL_FILLER_SELECTED,
	};
}
