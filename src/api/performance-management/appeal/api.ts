import type {
	AppealDetailData,
	AppealDetailQueryParams,
	AppealHandleData,
	AppealHandleQueryParams,
} from "./types";

import {
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
} from "#src/api/performance-management/todo";
import { AppealFlowType } from "./types";

/**
 * 申诉处理模拟数据源
 *
 * 后端接口尚未提供，先以本地模拟数据支撑页面渲染与交互。
 * 接口就绪后：把 fetchAppealHandleDetail / fetchAppealDetail 内部改为
 * request.get 真实请求即可，调用方无需改动。
 */
const MOCK_APPEAL_HANDLE: Record<string, AppealHandleData> = {
	"6": {
		todoId: "6",
		ratingInfo: {
			planName: "2026年度评级",
			cycle: "2026年度",
			assessType: RatingAssessType.STAFF,
			nodeType: RatingNodeType.APPEAL,
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
			evalScore: 88.0,
			evalLevel: "B+",
		},
		flowItems: [
			{
				id: "flow-1",
				type: AppealFlowType.APPEAL,
				appealNo: "UY138947184618164716",
				appealType: "集团本体",
				submitter: "李文",
				appealScore: 90.0,
				appealLevel: "A",
				positionCategory: "研发",
				jobLevel: "P4",
				date: "2026-12-09",
			},
			{
				id: "flow-2",
				type: AppealFlowType.REJECT,
				appealType: "集团本体",
				submitter: "李文",
				positionCategory: "研发",
				jobLevel: "P4",
				date: "2026-12-10",
			},
			{
				id: "flow-3",
				type: AppealFlowType.APPEAL,
				appealType: "业务/地区本体",
				executor: "李文",
				appealScore: 90.0,
				appealLevel: "A",
				positionCategory: "研发",
				jobLevel: "P4",
				date: "2026-12-11",
				actionable: true,
			},
		],
	},
};

/**
 * 考评详情量表模拟数据
 *
 * 包含 6 个维度，并同时提供自评得分与考评得分。
 */
function buildAppealDimensions(): AppealDetailData["dimensions"] {
	return [
		{
			id: "culture",
			name: "文化认同",
			weight: "10%",
			indicators: [
				{
					id: "culture-recognition",
					name: "文化认同(10%)",
					weight: "10%",
					levels: [
						{
							min: 9,
							max: 10,
							description:
								"深度认同企业文化，主动践行服务理念，积极带动伙伴做好客户服务",
						},
						{
							min: 7,
							max: 8,
							description: "认同企业文化，服务意识到位，按标准做好对客、对内服务工作",
						},
						{
							min: 5,
							max: 6,
							description: "知晓文化与服务要求，无损害服务口碑、违背价值观的行为",
						},
						{
							min: 3,
							max: 4,
							description: "文化理解不足，服务主动性偏弱，偶有服务疏漏，需整改提升",
						},
						{
							min: 0,
							max: 2,
							description: "不认同文化导向，服务态度消极，存在引发服务投诉的行为",
						},
					],
					selfScore: 8.0,
					evalScore: 9.0,
				},
			],
		},
		{
			id: "performance",
			name: "工作业绩",
			weight: "60%",
			indicators: [
				{
					id: "performance-kpi",
					name: "工作业绩(60%)",
					weight: "60%",
					levels: [
						{
							min: 50,
							max: 60,
							description:
								"一丝不苟，精益求精，经常超出预期目标（KPI得分同类岗位排名10%）",
						},
						{
							min: 40,
							max: 50,
							description:
								"工作认真，能够保质保量完成预期目标（KPI得分同类岗位排名前30%）",
						},
						{
							min: 30,
							max: 40,
							description:
								"工作较认真，能够基本完成工作任务（KPI得分同类岗位排名前60%）",
						},
						{
							min: 10,
							max: 30,
							description: "工作偶有出错，质量不高（KPI得分同类岗位排名前90%）",
						},
						{
							min: 0,
							max: 10,
							description:
								"工作经常出错，无法完成工作任务（KPI得分同类岗位排名末10%）",
						},
					],
					selfScore: 40.5,
					evalScore: 40.0,
				},
			],
		},
		{
			id: "ability",
			name: "工作能力",
			weight: "15%",
			indicators: [
				{
					id: "ability-execution",
					name: "执行能力(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description: "快速制定清晰执行计划，多任务可协同高效推进，超额完成目标",
						},
						{
							min: 4,
							max: 4,
							description: "能制定可执行计划，多任务有序推进，在规定时间内完成目标",
						},
						{
							min: 3,
							max: 3,
							description: "基本按时完成任务，偶有延误经提醒后可加速，不影响工作闭环",
						},
						{
							min: 2,
							max: 2,
							description: "工作计划混乱，经常出现轻微延期，对团队进度有一定影响",
						},
						{
							min: 1,
							max: 1,
							description: "工作拖沓，经多次催促仍无法完成或时间远超规定期限",
						},
					],
					selfScore: 5.0,
					evalScore: 5.0,
				},
				{
					id: "ability-professional",
					name: "专业能力(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description:
								"具有胜任公司内至少两个不同类型岗位的知识及技能，是综合型人才",
						},
						{ min: 4, max: 4, description: "具备的知识和技能完全可以胜任当前岗位" },
						{
							min: 3,
							max: 3,
							description: "具备的知识和技能基本能顺利完成当前岗位的多数任务",
						},
						{ min: 2, max: 2, description: "技能程度稍感不足，工作上常需他人指导" },
						{ min: 1, max: 1, description: "对工作必需技能不熟悉，日常工作难以完成" },
					],
					selfScore: 5.0,
					evalScore: 5.0,
				},
				{
					id: "ability-innovation",
					name: "学习创新(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description: "了解本岗位新知识、新技能，不断创新工作方法、输出优秀经验",
						},
						{
							min: 4,
							max: 4,
							description: "能够学习岗位知识技能和优秀经验，将学习知识运用于工作",
						},
						{
							min: 3,
							max: 3,
							description: "工作中乐于学习优秀经验并应用于实际工作，但缺乏创新性",
						},
						{
							min: 2,
							max: 2,
							description: "工作中有学习意愿，但无法将培训知识有效地运用于实际",
						},
						{
							min: 1,
							max: 1,
							description: "无法完成培训、优秀经验学习，在专业上停滞不前",
						},
					],
					selfScore: 4.0,
					evalScore: 4.0,
				},
			],
		},
		{
			id: "attitude",
			name: "工作态度",
			weight: "15%",
			indicators: [
				{
					id: "attitude-responsibility",
					name: "责任意识(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description:
								"工作开拓进取，勇于协助团队、主动担当，敢于揭发伤害企业利益行为",
						},
						{
							min: 4,
							max: 4,
							description: "责任心较强，能够主动承接领导交办工作，勇于承担自身过失",
						},
						{
							min: 3,
							max: 3,
							description:
								"具备基本工作责任心，不愿承接额外工作或更高责任，主动性一般",
						},
						{
							min: 2,
							max: 2,
							description: "工作中不太愿意担当子，有畏难情绪，责任心不强，主动性缺乏",
						},
						{ min: 1, max: 1, description: "工作敷衍，缺乏责任心，主动性差" },
					],
					selfScore: 5.0,
					evalScore: 5.0,
				},
				{
					id: "attitude-teamwork",
					name: "团队协作(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description:
								"团队意识强，有全局观，不计较个人利益，善于协调本部门及跨部门工作",
						},
						{
							min: 4,
							max: 4,
							description: "团队意识较强，乐于与上下游协作，顺利完成任务",
						},
						{
							min: 3,
							max: 3,
							description:
								"基本能与他人正常协作，即便有矛盾也会就事论事，不影响工作进度",
						},
						{
							min: 2,
							max: 2,
							description: "缺乏协作意识，偶尔会与人产生冲突，需要领导参与协调",
						},
						{
							min: 1,
							max: 1,
							description: "团队意识差，经常与人产生冲突，致使工作无法进行",
						},
					],
					selfScore: 5.0,
					evalScore: 5.0,
				},
				{
					id: "attitude-attendance",
					name: "出勤情况(5%)",
					weight: "5%",
					levels: [
						{
							min: 5,
							max: 5,
							description:
								"提前到岗，经常加班加点，无迟到到早退、脱岗、旷工等非正常出勤情况",
						},
						{
							min: 4,
							max: 4,
							description: "按时上下班，无迟到早退、脱岗、旷工等违规违纪情况",
						},
						{
							min: 3,
							max: 3,
							description: "偶尔出现轻微出勤问题但快速整改，无脱岗、旷工等违纪情况",
						},
						{
							min: 0,
							max: 0,
							description: "经常迟到早退，或年度累计脱岗、旷工3次（日）以上",
						},
					],
					selfScore: 5.0,
					evalScore: 5.0,
				},
			],
		},
		{
			id: "bonus",
			name: "加分项",
			weight: "",
			indicators: [
				{
					id: "bonus-extra",
					name: "加分项",
					weight: "",
					levels: [
						{
							min: 1,
							max: 5,
							description:
								"1.在公司需要时，积极接受外派/身兼多职/承担更重要责任，加1-5分。\n2.个人表现突出，收到外部或上级单位正式表扬、成果奖励，加1-5分。",
						},
					],
					selfScore: 5.0,
					evalScore: 5.0,
					selfRemark: "浙江省杭州市西湖区",
					evalRemark: "浙江省杭州市西湖区文一西路767号绿城西溪国际商务...",
				},
			],
		},
		{
			id: "deduct",
			name: "扣分项",
			weight: "",
			indicators: [
				{
					id: "deduct-extra",
					name: "扣分项",
					weight: "",
					levels: [
						{
							min: 1,
							max: 5,
							description:
								"1.违纪行为、上级检查不达标等，扣1-5分/次或按照上级通报扣分执行。\n2.主要重大客户投诉、安全问题或严重违规。一票否决，年度考评0分。",
						},
					],
					selfScore: 5.0,
					evalScore: 5.0,
					selfRemark: "浙江省杭州市西湖区文一西路767号绿城西溪国际商务...",
				},
			],
		},
	];
}

const MOCK_APPEAL_DETAIL: AppealDetailData = {
	selfScore: 88.5,
	evalScore: 88.0,
	evalLevel: "B+",
	dimensions: buildAppealDimensions(),
};

/**
 * 查询申诉处理详情
 *
 * @param params - 查询参数
 * @returns 申诉处理数据
 */
export async function fetchAppealHandleDetail(
	params: AppealHandleQueryParams,
): Promise<AppealHandleData> {
	// TODO(接口就绪): 改为 request.get(`performance/appeal/handle/${params.todoId}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	return MOCK_APPEAL_HANDLE[params.todoId] ?? MOCK_APPEAL_HANDLE["6"];
}

/**
 * 查询考评详情
 *
 * @param _params - 查询参数（接口就绪后用于按待办标识取数）
 * @returns 考评详情数据
 */
export async function fetchAppealDetail(
	_params: AppealDetailQueryParams,
): Promise<AppealDetailData> {
	// TODO(接口就绪): 改为 request.get(`performance/appeal/detail/${_params.todoId}`).json()
	await new Promise((resolve) => setTimeout(resolve, 300));
	return MOCK_APPEAL_DETAIL;
}
