import type {
	AppealFilingDetail,
	AppealFilingDetailQueryParams,
	AppealFilingPayload,
	ConfirmData,
	ConfirmFlowItem,
	ConfirmQueryParams,
	ConfirmSubmitPayload,
	ConfirmSubmitResult,
} from "./types";

import {
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
	updateMockTodoStatus,
} from "#src/api/performance-management/todo";

import { ConfirmFlowType } from "./types";

/**
 * 完整申诉时间线（含两次申诉、拒绝、通过与最终确认）
 *
 * 供「待完成-发起申诉后」与「已完成-发起申诉后」两个场景复用。
 */
/** 再次确认流程（申诉 → 通过 → 确认），用于「再次确认」场景 */
const RECONFIRM_FLOW: ConfirmFlowItem[] = [
	{
		id: "r-1",
		type: ConfirmFlowType.APPEAL,
		appealNo: "UY138947184618164716",
		appealType: "集团本体",
		submitter: "李文",
		appealScore: 90,
		appealLevel: "A",
		positionCategory: "研发",
		jobLevel: "P4",
		date: "2026-12-09",
	},
	{
		id: "r-2",
		type: ConfirmFlowType.APPROVE,
		appealType: "集团本体",
		executor: "李文",
		date: "2026-12-13",
	},
	{
		id: "r-3",
		type: ConfirmFlowType.CONFIRM,
		confirmScore: 90,
		confirmLevel: "A",
		date: "2026-12-14",
	},
];

const APPEAL_FLOW: ConfirmFlowItem[] = [
	{
		id: "f-1",
		type: ConfirmFlowType.APPEAL,
		appealNo: "UY138947184618164716",
		appealType: "集团本体",
		submitter: "李文",
		appealScore: 90,
		appealLevel: "A",
		positionCategory: "研发",
		jobLevel: "P4",
		date: "2026-12-09",
	},
	{
		id: "f-2",
		type: ConfirmFlowType.REJECT,
		appealType: "集团本体",
		executor: "李文",
		rejectReason: "不符合集团年度评级要求，应XXX，修正后请重新提报",
		date: "2026-12-10",
	},
	{
		id: "f-3",
		type: ConfirmFlowType.APPEAL,
		appealNo: "UY13894718461816666",
		appealType: "业务/地区本体",
		submitter: "李文",
		appealScore: 90,
		appealLevel: "A",
		positionCategory: "研发",
		jobLevel: "P4",
		date: "2026-12-11",
	},
	{
		id: "f-4",
		type: ConfirmFlowType.APPROVE,
		appealType: "集团本体",
		executor: "李文",
		date: "2026-12-13",
	},
	{
		id: "f-5",
		type: ConfirmFlowType.CONFIRM,
		confirmScore: 90,
		confirmLevel: "A",
		date: "2026-12-14",
	},
];

/**
 * 确认详情模拟数据源
 *
 * 后端接口尚未提供，先以本地模拟数据支撑页面渲染与交互。
 * 接口就绪后：把 fetchConfirmDetail / submitConfirm / submitAppeal
 * 内部改为 request.get / request.post 真实请求即可，调用方无需改动。
 */
const MOCK_CONFIRM_DATA: Record<string, ConfirmData> = {
	// 确认/待完成-填报（基层员工）
	"3": {
		todoId: "3",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.PENDING,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			selfScore: 88.5,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: [],
		finished: false,
	},
	// 确认/已完成（基层员工，无申诉）
	"4": {
		todoId: "4",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.COMPLETED,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			selfScore: 88.5,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: [
			{
				id: "f-4-1",
				type: ConfirmFlowType.CONFIRM,
				confirmScore: 88,
				confirmLevel: "B+",
				date: "2026-12-14",
			},
		],
		finished: true,
	},
	// 确认/再次确认（基层员工，已提交，含申诉 → 通过 → 确认流程）
	"5": {
		todoId: "5",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.SUBMITTED,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			selfScore: 88.5,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: RECONFIRM_FLOW,
		finished: false,
	},
	// 确认/已完成（管理者，无申诉，4 张卡片）
	"26": {
		todoId: "26",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.MANAGER,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.COMPLETED,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			kpiScore: 88.5,
			reportScore: 88.5,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: [
			{
				id: "f-26-1",
				type: ConfirmFlowType.CONFIRM,
				confirmScore: 88,
				confirmLevel: "B+",
				date: "2026-12-14",
			},
		],
		finished: true,
	},
	// 确认/待完成-发起申诉后（含完整申诉流程时间线）
	"30": {
		todoId: "8",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.PENDING,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			selfScore: 87,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: APPEAL_FLOW,
		finished: false,
	},
	// 确认/已完成-发起申诉后（基层员工，完整申诉时间线）
	"29": {
		todoId: "9",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.CONFIRM,
			executor: "吴梦颜",
			validDate: "2026-12-15",
			status: RatingTodoStatus.COMPLETED,
		},
		employeeInfo: {
			name: "钱虹君",
			employeeNo: "E1002",
			department: "善数创新部",
			position: "研发",
			positionCategory: "研发",
			jobLevel: "P4",
		},
		evalResult: {
			selfScore: 87,
			evalScore: 88,
			evalLevel: "B+",
		},
		flowItems: APPEAL_FLOW,
		finished: true,
	},
};

/** 默认兜底数据（未命中的待办） */
function fallbackConfirmData(todoId: string): ConfirmData {
	return {
		...MOCK_CONFIRM_DATA["3"],
		todoId,
	};
}

/**
 * 查询确认详情
 *
 * @param params - 查询参数
 * @returns 确认详情数据
 */
export async function fetchConfirmDetail(params: ConfirmQueryParams): Promise<ConfirmData> {
	// TODO(接口就绪): 改为 request.get(`performance/confirm/${params.todoId}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	return MOCK_CONFIRM_DATA[params.todoId] ?? fallbackConfirmData(params.todoId);
}

/**
 * 提交确认
 *
 * @param payload - 提交载荷
 * @returns 提交结果
 */
export async function submitConfirm(payload: ConfirmSubmitPayload): Promise<ConfirmSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/confirm/submit", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	// mock 阶段回写列表状态，便于前端联调演示「确认后刷新列表」
	updateMockTodoStatus(payload.todoId, RatingTodoStatus.COMPLETED);
	return { success: true };
}

/**
 * 发起申诉
 *
 * @param payload - 申诉载荷
 * @returns 提交结果
 */
export async function submitAppealFiling(
	payload: AppealFilingPayload,
): Promise<ConfirmSubmitResult> {
	// TODO(接口就绪): 改为 request.post("performance/confirm/appeal", { json: payload }).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	void payload;
	return { success: true };
}

/**
 * 申诉详情模拟数据
 *
 * 照片模式使用内联 SVG 占位图，避免引入外部图片依赖；
 * 接口就绪后由后端返回真实图片/文件地址。
 */
const PHOTO_PLACEHOLDER = (index: number) => {
	const tones = ["#D9E2EC", "#C9D6E3", "#BCC9D8", "#CFD9E4", "#C3D1DF", "#D6DFE9"];
	return `data:image/svg+xml;utf8,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${tones[index % tones.length]}"/><path d="M18 88 L48 58 L66 76 L84 62 L102 88 Z" fill="#9AAEBF"/><rect x="26" y="30" width="26" height="30" fill="#AEC0D0"/></svg>`,
	)}`;
};

/** 佐证材料 mock：照片 6 张 / 附件 3 个 */
const MOCK_MATERIALS = {
	photo: Array.from({ length: 6 }, (_, i) => ({
		id: `photo-${i + 1}`,
		name: `现场照片${i + 1}.jpg`,
		url: PHOTO_PLACEHOLDER(i),
	})),
	attachment: [
		{ id: "file-1", name: "employeeelistoyeeelisto...ist.doc" },
		{ id: "file-2", name: "empist.doc" },
		{ id: "file-3", name: "eight.txt" },
	],
};

/**
 * 查询申诉详情
 *
 * @param params - 查询参数
 * @returns 申诉详情数据
 */
export async function fetchAppealFilingDetail(
	params: AppealFilingDetailQueryParams,
): Promise<AppealFilingDetail> {
	// TODO(接口就绪): 改为 request.get(`performance/appeal/${params.appealNo}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	// 单双号区分照片/附件两种形态，便于演示两种佐证材料渲染
	const isAttachment = params.appealNo.endsWith("6666");
	return {
		evalScore: 88,
		evalLevel: "B+",
		appealScore: 90,
		appealLevel: "A",
		appealType: "集团本体",
		appealNo: params.appealNo,
		appealReason:
			"人生至善，就是对生活乐观，对工作愉快，对事业兴奋。人生至善，就是对生活乐观，对工作愉快，对事业兴奋。——布兰登",
		materialType: isAttachment ? "attachment" : "photo",
		materials: isAttachment ? MOCK_MATERIALS.attachment : MOCK_MATERIALS.photo,
	};
}
