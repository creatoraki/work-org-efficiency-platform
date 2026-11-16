import type {
	CollaboratorRow,
	FillerPickerData,
	SubmitDetailData,
	SubmitDetailQueryParams,
	SubmitPayload,
} from "./types";

import {
	getMockTodoStatus,
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
	updateMockTodoStatus,
} from "#src/api/performance-management/todo";

import { SubmitCheckStatus } from "./types";

/**
 * 提报详情模拟数据源
 *
 * 后端接口尚未提供，先以本地模拟数据支撑页面渲染与交互。
 * 接口就绪后：把 fetchSubmitDetail / saveSubmitDraft / submitRating 内部
 * 改为 request.get / request.post 真实请求即可，调用方无需改动。
 */
const MOCK_SUBMIT_DETAIL: Record<string, SubmitDetailData> = {
	"submit-1": {
		todoId: "8",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.SUBMIT,
			executeScope: "善数创新部",
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.PENDING,
		},
		totalCount: 8,
		collaboratorOptions: [
			{ label: "吴梦颜", value: "wumengyan" },
			{ label: "钱虹君", value: "qianhongjun" },
			{ label: "郑以轩", value: "zhengyixuan" },
		],
		collaborator: undefined,
		distributionExceptionNote: "",
		distributionAbnormal: true,
		filledCount: 1,
		distributionRows: [
			{
				key: "fn",
				positionCategory: "职能员工",
				totalCount: 3,
				standard: { a: 0, bPlus: 1, b: 2, cd: 0 },
				actual: { a: 2, bPlus: 1, b: 0, c: 0, d: 0 },
				check: { a: "超2", bPlus: "正常", b: "少2", cd: "正常" },
			},
			{
				key: "other",
				positionCategory: "项目员工(其他)",
				totalCount: 2,
				standard: { a: 0, bPlus: 0, b: 2, cd: 0 },
				actual: { a: 0, bPlus: 1, b: 1, c: 0, d: 0 },
				check: { a: "正常", bPlus: "超1", b: "少1", cd: "正常" },
			},
			{
				key: "security",
				positionCategory: "项目员工(安全)",
				totalCount: 2,
				standard: { a: 0, bPlus: 0, b: 1, cd: 0 },
				actual: { a: 0, bPlus: 0, b: 1, c: 0, d: 0 },
				check: { a: "正常", bPlus: "正常", b: "正常", cd: "正常" },
			},
			{
				key: "cleaning",
				positionCategory: "项目员工(保洁绿化)",
				totalCount: 1,
				standard: { a: 0, bPlus: 0, b: 1, cd: 0 },
				actual: { a: 0, bPlus: 0, b: 0, c: 1, d: 0 },
				check: { a: "正常", bPlus: "正常", b: "少1", cd: "超1" },
			},
			{
				key: "total",
				positionCategory: "合计",
				totalCount: 8,
				standard: { a: 0, bPlus: 1, b: 6, cd: 0 },
				actual: { a: 2, bPlus: 2, b: 2, c: 1, d: 0 },
				check: { a: "超2", bPlus: "超1", b: "少3", cd: "超1" },
				isTotal: true,
			},
		],
		employees: [
			{
				id: "E1001",
				name: "冯丽妍",
				employeeNo: "E1001",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "职能员工",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: undefined,
				departmentRank: "-/3",
				suggestLevel: undefined,
				checkStatus: SubmitCheckStatus.PENDING,
			},
			{
				id: "E1002",
				name: "钱虹君",
				employeeNo: "E1002",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "职能员工",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				departmentRank: "-/3",
				suggestLevel: undefined,
				checkStatus: SubmitCheckStatus.PENDING,
			},
			{
				id: "E1003",
				name: "郑以轩",
				employeeNo: "E1003",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "职能员工",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				submitScore: 88.0,
				departmentRank: "1/3",
				suggestLevel: "B+",
				submitLevel: "A",
				checkStatus: SubmitCheckStatus.NORMAL,
			},
			{
				id: "E1004",
				name: "赵海",
				employeeNo: "E1004",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "项目员工(其他)",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				submitScore: 88.0,
				departmentRank: "1/2",
				suggestLevel: "B",
				submitLevel: "A",
				checkStatus: SubmitCheckStatus.WARNING,
				checkDiff: "差2级",
				exceptionNote: "",
				exceptionNoteRequired: true,
			},
			{
				id: "E1005",
				name: "赵轩海",
				employeeNo: "E1005",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "项目员工(其他)",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				departmentRank: "2/2",
				suggestLevel: undefined,
				checkStatus: SubmitCheckStatus.PENDING,
			},
			{
				id: "E1006",
				name: "李丽颖",
				employeeNo: "E1006",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "项目员工(安全)",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				departmentRank: "1/2",
				suggestLevel: "B",
				checkStatus: SubmitCheckStatus.PENDING,
				exceptionNoteRequired: true,
			},
			{
				id: "E1007",
				name: "郑轩",
				employeeNo: "E1007",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "项目员工(安全)",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				departmentRank: "2/2",
				suggestLevel: "B",
				checkStatus: SubmitCheckStatus.PENDING,
				exceptionNoteRequired: true,
			},
			{
				id: "E1008",
				name: "李丽",
				employeeNo: "E1008",
				department: "善数创新部",
				position: "岗位",
				positionCategory: "项目员工(保洁绿化)",
				jobLevel: "4",
				employmentStatus: "在职",
				selfScore: 90.0,
				departmentRank: "1/1",
				suggestLevel: "B",
				submitLevel: "C",
				checkStatus: SubmitCheckStatus.NORMAL,
				exceptionNoteRequired: true,
			},
		],
	},
};

/**
 * 查询提报详情
 *
 * @param params - 查询参数
 * @returns 提报详情数据
 */
export async function fetchSubmitDetail(
	params: SubmitDetailQueryParams,
): Promise<SubmitDetailData> {
	// TODO(接口就绪): 改为 request.get(`performance/submit/${params.todoId}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	// todoId 25 演示「协作人视角」：不可再添加协作人，其余回落默认详情
	if (params.todoId === "25") {
		return { ...MOCK_SUBMIT_DETAIL["submit-1"], todoId: params.todoId, collaboratorMode: true };
	}
	// todoId 27 演示「提报/被驳回-填报」形态（含驳回原因），其余回落默认详情
	if (params.todoId === "27") {
		const base = MOCK_SUBMIT_DETAIL["submit-1"];
		return {
			...base,
			todoId: params.todoId,
			ratingInfo: { ...base.ratingInfo, status: RatingTodoStatus.REJECTED },
			rejectReason: "不符合集团年度评级要求，应XXX，修正后请重新提报",
		};
	}
	const detail = MOCK_SUBMIT_DETAIL[params.todoId] ?? MOCK_SUBMIT_DETAIL["submit-1"];
	// 详情与列表状态保持一致（列表里的已完成/已提交行打开后回显对应状态）
	const listStatus = getMockTodoStatus(params.todoId);
	return listStatus
		? {
				...detail,
				todoId: params.todoId,
				ratingInfo: { ...detail.ratingInfo, status: listStatus },
			}
		: detail;
}

/**
 * 将提报表单写回 mock 详情，保证暂存和提交后重新打开仍能回显。
 *
 * @param payload - 提报载荷
 * @param completed - 是否完成提交
 * @returns 是否写入成功
 */
function writeSubmitPayload(payload: SubmitPayload, completed: boolean): boolean {
	if (!payload.todoId) return false;
	const data = MOCK_SUBMIT_DETAIL["submit-1"];
	data.collaborator = payload.collaborator;
	data.distributionExceptionNote = payload.distributionExceptionNote;
	data.employees = data.employees.map((employee) => {
		const input = payload.employees.find((item) => item.id === employee.id);
		return input ? { ...employee, ...input } : employee;
	});
	data.filledCount = data.employees.filter(
		(item) => item.submitScore !== undefined && item.submitLevel,
	).length;
	if (completed) {
		data.ratingInfo = { ...data.ratingInfo, status: RatingTodoStatus.COMPLETED };
	}
	return true;
}

/**
 * 暂存提报
 *
 * @param payload - 提报载荷
 * @returns 保存结果
 */
export async function saveSubmitDraft(payload: SubmitPayload): Promise<boolean> {
	// TODO(接口就绪): 改为 request.post("performance/submit/draft", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	return writeSubmitPayload(payload, false);
}

/**
 * 提交提报
 *
 * @param payload - 提报载荷
 * @returns 提交结果
 */
export async function submitRating(payload: SubmitPayload): Promise<boolean> {
	// TODO(接口就绪): 改为 request.post("performance/submit/submit", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	// mock 阶段回写列表状态，便于前端联调演示「提交后刷新列表」
	const success = writeSubmitPayload(payload, true);
	if (success) {
		updateMockTodoStatus(payload.todoId, RatingTodoStatus.SUBMITTED);
	}
	return success;
}

/**
 * 协作人配置模拟数据
 *
 * 仅「项目员工(安全)」「项目员工(保洁绿化)」可配置填报人，
 * 与 PRD 中协作人配置范围一致。
 */
const MOCK_COLLABORATOR_ROWS: CollaboratorRow[] = [
	{
		key: "c-1",
		positionCategory: "项目员工(安全)",
		count: 10,
		status: RatingTodoStatus.PENDING,
		fillerId: "f-1",
		fillerName: "李丽颖",
	},
	{
		key: "c-2",
		positionCategory: "项目员工(保洁绿化)",
		count: 20,
		status: RatingTodoStatus.PENDING,
	},
];

/**
 * 填报人选择模拟数据
 */
const MOCK_FILLER_PICKER: FillerPickerData = {
	orgTree: [
		{
			key: "org-1",
			title: "善数创新部",
			children: [
				{
					key: "org-1-1",
					title: "服务集团职能",
					children: [
						{
							key: "org-1-1-1",
							title: "区域公司",
							children: [
								{
									key: "org-1-1-1-1",
									title: "杭州区域公司",
									children: [{ key: "org-1-1-1-1-1", title: "浙东区域公司" }],
								},
							],
						},
					],
				},
				{
					key: "org-1-2",
					title: "舟山地区",
					children: [
						{ key: "org-1-2-1", title: "舟山西部项目群" },
						{ key: "org-1-2-2", title: "岱山项目群" },
						{ key: "org-1-2-3", title: "定海项目群" },
					],
				},
			],
		},
	],
	candidates: [
		{
			id: "u-1",
			name: "钱一唯",
			departmentPath:
				"善数创新部>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
		},
		{
			id: "u-2",
			name: "周祥",
			departmentPath:
				"善数创新部>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
		},
		{
			id: "u-3",
			name: "周海迪",
			departmentPath:
				"善数创新部>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
		},
		{
			id: "u-4",
			name: "赵鹏",
			departmentPath:
				"善数创新部>区域公司>浙东区域公司>舟山西部项目群>舟山秀水湾度假村服务中心",
		},
		{
			id: "u-5",
			name: "李政斌",
			departmentPath: "善数创新部>区域公司>杭州区域公司>第一分公司>绿城玫瑰园",
		},
		{
			id: "u-6",
			name: "戴佳欣",
			departmentPath: "善数创新部>区域公司>杭州区域公司>第一分公司>绿城玫瑰园",
		},
		{
			id: "u-7",
			name: "李杰",
			departmentPath: "善数创新部>区域公司>杭州区域公司>第一分公司>绿城玫瑰园",
		},
	],
	selectedIds: ["u-1", "u-5", "u-6"],
};

/**
 * 查询协作人配置
 *
 * @returns 协作人配置行
 */
export async function fetchCollaboratorRows(): Promise<CollaboratorRow[]> {
	// TODO(接口就绪): 改为 request.get("performance/submit/collaborators").json()
	await new Promise((resolve) => setTimeout(resolve, 200));
	return MOCK_COLLABORATOR_ROWS;
}

/**
 * 保存协作人配置
 *
 * @param rows - 协作人配置行
 * @returns 是否成功
 */
export async function saveCollaboratorRows(rows: CollaboratorRow[]): Promise<boolean> {
	// TODO(接口就绪): 改为 request.post("performance/submit/collaborators", { json: rows }).json()
	await new Promise((resolve) => setTimeout(resolve, 200));
	MOCK_COLLABORATOR_ROWS.splice(
		0,
		MOCK_COLLABORATOR_ROWS.length,
		...rows.map((row) => ({ ...row })),
	);
	return true;
}

/**
 * 查询填报人选择数据
 *
 * @returns 组织树、候选成员与已选成员
 */
export async function fetchFillerPickerData(): Promise<FillerPickerData> {
	// TODO(接口就绪): 改为 request.get("performance/submit/fillers").json()
	await new Promise((resolve) => setTimeout(resolve, 200));
	return MOCK_FILLER_PICKER;
}
