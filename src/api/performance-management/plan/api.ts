import type {
	GradeDistributionRow,
	PlanAnalysisQuery,
	PlanEmployeeQuery,
	PlanEmployeeRow,
	PlanListResult,
	PlanOrgNode,
	PlanPermissionMember,
	PlanViewScope,
	PlanViewSummary,
	RatingPlanItem,
	RatingPlanQuery,
	RatingPlanStatistics,
	SavePlanPermissionPayload,
} from "./types";

import { RatingTodoStatus } from "#src/api/performance-management/todo";
import { request } from "#src/utils";
import { PLAN_CHECK_RESULT, PlanPermission, RatingPlanStatus } from "./types";

/**
 * 评级计划模拟数据源
 *
 * 后端接口尚未提供，先以本地模拟数据支撑页面渲染与交互。
 * 接口就绪后：把以下 fetch / save 函数内部改为 request.get / request.post
 * 真实请求即可，调用方无需改动。
 */
const MOCK_PLAN_LIST: RatingPlanItem[] = [
	{
		id: "1",
		planName: "2026年度评级",
		cycle: "2026年度",
		headCount: 1643,
		owner: "赵海洲",
		validStart: "2026-11-08",
		validEnd: "2026-12-08",
		status: RatingPlanStatus.NOT_STARTED,
	},
	{
		id: "2",
		planName: "2026年度评级",
		cycle: "2026年度",
		headCount: 1643,
		owner: "李婧妍",
		validStart: "2026-11-08",
		validEnd: "2026-12-08",
		status: RatingPlanStatus.IN_PROGRESS,
	},
	{
		id: "3",
		planName: "2026年度评级",
		cycle: "2026年度",
		headCount: 1643,
		owner: "何风景",
		validStart: "2026-11-08",
		validEnd: "2026-12-08",
		status: RatingPlanStatus.ARCHIVED,
	},
];

/** 计划统计 */
const MOCK_PLAN_STATISTICS: RatingPlanStatistics = {
	totalCount: 5,
	inProgressCount: 5,
	archivedCount: 5,
	archivedTodayCount: 1,
};

/** 人员清单左侧组织树 */
const MOCK_ORG_TREE: PlanOrgNode[] = [
	{
		key: "green-town",
		title: "绿城服务集团",
		children: [
			{
				key: "region",
				title: "区域公司",
				children: [
					{
						key: "zhejiang",
						title: "浙江区域公司",
						children: [
							{ key: "dept-benti", title: "本体建设部(4人)", owner: "何思远" },
							{ key: "dept-yunying", title: "运营管控部(84人)", owner: "何思远" },
							{ key: "dept-shichang", title: "市场发展部(84人)", owner: "何思远" },
							{ key: "wenzhou", title: "温州地区" },
							{
								key: "zhoushan",
								title: "舟山地区",
								children: [
									{ key: "dinghai", title: "定海项目群" },
									{ key: "xiushuiwan", title: "舟山秀水湾度假村服务中心" },
									{ key: "daihai-lan", title: "岱山海蓝置业服务中心" },
									{ key: "daihai-shengshi", title: "岱山盛世豪庭生活服务中心" },
									{ key: "dongfang", title: "东方蜜月城生活服务中心" },
									{ key: "ziweifu", title: "岱山紫薇府生活服务中心" },
									{ key: "yuhua", title: "岱山御化工厂、星浦小区项目点" },
									{ key: "donghai", title: "东海郊野公园景区管理服务点" },
									{ key: "shengshi-yi", title: "岱山盛世一家庭生活服务中心" },
									{ key: "lvrun", title: "舟山市绿润生活服务中心" },
								],
							},
							{ key: "ningbo", title: "宁波地区" },
							{ key: "taizhou", title: "台州地区" },
						],
					},
					{ key: "shandong", title: "山东区域公司" },
					{ key: "beifang", title: "北方区域公司" },
					{ key: "huanan", title: "华南区域公司" },
					{ key: "huaxi", title: "华西区域公司" },
					{ key: "shanghai", title: "上海区域公司" },
					{ key: "shiyebu", title: "事业部(329人)", owner: "李豫卓" },
					{ key: "lianying", title: "联营公司(256人)", owner: "李豫卓" },
					{ key: "sheshang", title: "社商集团(462人)", owner: "李昀泽" },
				],
			},
		],
	},
];

/** 等级分布（人员清单 tab） */
const MOCK_GRADE_ROWS: GradeDistributionRow[] = [
	{
		key: "1",
		positionCategory: "职能员工",
		headCount: 300,
		standard: { A: 0, "B+": 100, B: 200, "C/D": 0 },
		actual: { A: 200, "B+": 100, B: 0, "C/D": 0 },
		check: { A: "超200", "B+": "正常", B: "少200", "C/D": "正常" },
	},
	{
		key: "2",
		positionCategory: "项目员工(其他)",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 2, "C/D": 0 },
		actual: { A: 100, "B+": 100, B: 0, "C/D": 0 },
		check: { A: "正常", "B+": "超100", B: "少100", "C/D": "正常" },
	},
	{
		key: "3",
		positionCategory: "项目员工(安全)",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 100, "C/D": 0 },
		check: { A: "正常", "B+": "正常", B: "正常", "C/D": "正常" },
	},
	{
		key: "4",
		positionCategory: "项目员工(保洁绿化)",
		headCount: 100,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 0, "C/D": 100 },
		check: { A: "正常", "B+": "正常", B: "少100", "C/D": "超100" },
	},
	{
		key: "total",
		positionCategory: "合计",
		headCount: 800,
		standard: { A: 0, "B+": 100, B: 600, "C/D": 0 },
		actual: { A: 200, "B+": 200, B: 200, "C/D": 100 },
		check: { A: "超200", "B+": "超100", B: "少300", "C/D": "超100" },
		isTotal: true,
	},
];

/** 人员清单顶部统计（按范围区分） */
const MOCK_VIEW_SUMMARY: Record<PlanViewScope, Omit<PlanViewSummary, "gradeRows">> = {
	全部: { totalCount: 890, pendingCount: 103, submittedCount: 103, archivedCount: 84 },
	基层员工: { totalCount: 790, pendingCount: 90, submittedCount: 96, archivedCount: 72 },
	管理者: { totalCount: 100, pendingCount: 13, submittedCount: 7, archivedCount: 12 },
};

/** 人员清单行 */
const MOCK_EMPLOYEE_ROWS: PlanEmployeeRow[] = [
	{
		key: "1",
		name: "冯丽妍",
		employeeNo: "E1001",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "职能员工",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "1/3",
		suggestGrade: "B+",
		submitGrade: "B+",
		checkStatus: "正常",
		abnormalNote: "不符合要求",
		submitter: "吴梦颜",
		status: RatingTodoStatus.SUBMITTED,
	},
	{
		key: "2",
		name: "钱虹君",
		employeeNo: "E1002",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "职能员工",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "2/3",
		suggestGrade: "B+",
		submitGrade: "B+",
		checkStatus: "正常",
		submitter: "吴梦颜",
		status: RatingTodoStatus.REJECTED,
	},
	{
		key: "3",
		name: "郑以轩",
		employeeNo: "E1003",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "职能员工",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "3/3",
		suggestGrade: "B+",
		submitGrade: "B+",
		checkStatus: "正常",
		submitter: "吴梦颜",
		status: RatingTodoStatus.PENDING,
	},
	{
		key: "4",
		name: "赵海",
		employeeNo: "E1004",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "项目员工(其他)",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "1/2",
		suggestGrade: "B",
		submitGrade: "B",
		checkStatus: "正常",
		abnormalNote: "不符合要求",
		submitter: "吴梦颜",
		status: RatingTodoStatus.PENDING,
	},
	{
		key: "5",
		name: "赵轩海",
		employeeNo: "E1005",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "项目员工(其他)",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "2/2",
		suggestGrade: "A",
		submitGrade: "B",
		checkStatus: "预警/差2级",
		abnormalNote: "不符合集团...",
		submitter: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
	{
		key: "6",
		name: "李雨颖",
		employeeNo: "E1006",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "项目员工(安全)",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "1/2",
		suggestGrade: "B",
		submitGrade: "B",
		checkStatus: "正常",
		abnormalNote: "不符合要求",
		submitter: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
	{
		key: "7",
		name: "郑轩",
		employeeNo: "E1007",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "项目员工(安全)",
		employmentStatus: "在职",
		selfScore: 90,
		submitScore: 90,
		rank: "2/2",
		suggestGrade: "B",
		submitGrade: "B",
		checkStatus: "正常",
		abnormalNote: "不符合要求",
		submitter: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
	{
		key: "8",
		name: "李丽",
		employeeNo: "E1008",
		department: "善数创新部",
		position: "岗1",
		positionCategory: "项目员工(保洁绿化)",
		employmentStatus: "离职",
		selfScore: 90,
		submitScore: 90,
		rank: "1/1",
		suggestGrade: "B",
		submitGrade: "B",
		checkStatus: "正常",
		abnormalNote: "不符合要求",
		submitter: "吴梦颜",
		status: RatingTodoStatus.COMPLETED,
	},
];

/** 分析报表行（按组织合并异常情况说明） */
const MOCK_ANALYSIS_ROWS: GradeDistributionRow[] = [
	{
		key: "a1",
		orgType: "地区公司",
		orgName: "杭西地区",
		positionCategory: "职能员工",
		headCount: 300,
		standard: { A: 0, "B+": 100, B: 200, "C/D": 0 },
		actual: { A: 200, "B+": 100, B: 0, "C/D": 0 },
		check: { A: "超200", "B+": "正常", B: "少200", "C/D": "正常" },
		abnormalNote:
			"A档实际高于标准：全年承接2个集团级专项、客户满意度96分，已在地区审批环节说明。",
	},
	{
		key: "a2",
		orgType: "地区公司",
		orgName: "杭西地区",
		positionCategory: "项目员工(其他)",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 2, "C/D": 0 },
		actual: { A: 0, "B+": 100, B: 100, "C/D": 0 },
		check: { A: "正常", "B+": "超100", B: "少100", "C/D": "正常" },
	},
	{
		key: "a3",
		orgType: "地区公司",
		orgName: "杭西地区",
		positionCategory: "项目员工(安全)",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 100, "C/D": 0 },
		check: { A: "正常", "B+": "正常", B: "正常", "C/D": "正常" },
	},
	{
		key: "a4",
		orgType: "地区公司",
		orgName: "杭西地区",
		positionCategory: "项目员工(保洁绿化)",
		headCount: 100,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 0, "C/D": 100 },
		check: { A: "正常", "B+": "正常", B: "少100", "C/D": "超100" },
	},
	{
		key: "a-total",
		orgType: "地区公司",
		orgName: "杭西地区",
		positionCategory: "合计",
		headCount: 800,
		standard: { A: 0, "B+": 100, B: 600, "C/D": 0 },
		actual: { A: 200, "B+": 200, B: 200, "C/D": 100 },
		check: { A: "超200", "B+": "超100", B: "少300", "C/D": "超100" },
		isTotal: true,
	},
	{
		key: "b1",
		orgType: "业务集团",
		orgName: "科技集团",
		positionCategory: "业务员工",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 2, "C/D": 0 },
		actual: { A: 100, "B+": 100, B: 0, "C/D": 0 },
		check: { A: "正常", "B+": "超100", B: "少100", "C/D": "正常" },
		abnormalNote: "项目员工(安全)条线业绩整体偏低，C/D档不足标准，已提交专项整改计划。",
	},
	{
		key: "b2",
		orgType: "业务集团",
		orgName: "科技集团",
		positionCategory: "职能员工",
		headCount: 200,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 100, "C/D": 0 },
		check: { A: "正常", "B+": "正常", B: "正常", "C/D": "正常" },
	},
	{
		key: "b3",
		orgType: "业务集团",
		orgName: "科技集团",
		positionCategory: "三级及以上管理者",
		headCount: 100,
		standard: { A: 0, "B+": 0, B: 1, "C/D": 0 },
		actual: { A: 0, "B+": 0, B: 100, "C/D": 0 },
		check: { A: "正常", "B+": "正常", B: "少100", "C/D": "超100" },
	},
	{
		key: "b-total",
		orgType: "业务集团",
		orgName: "科技集团",
		positionCategory: "合计",
		headCount: 800,
		standard: { A: 0, "B+": 100, B: 600, "C/D": 0 },
		actual: { A: 200, "B+": 200, B: 200, "C/D": 100 },
		check: { A: "超200", "B+": "超100", B: "少300", "C/D": "超100" },
		isTotal: true,
	},
];

/** 权限成员 */
const MOCK_PERMISSION_MEMBERS: Record<string, PlanPermissionMember[]> = {
	"1": [
		{
			id: "m1",
			name: "冯毅滟",
			employeeNo: "E192346",
			department: "善数创新部",
			permission: PlanPermission.MANAGE,
		},
		{ id: "m2", name: "王琪逸", employeeNo: "E192346", department: "善数创新部" },
	],
	"2": [
		{
			id: "m1",
			name: "冯毅滟",
			employeeNo: "E192346",
			department: "善数创新部",
			permission: PlanPermission.MANAGE,
		},
	],
	"3": [],
};

/** 模拟接口延迟 */
function delay(ms = 200) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * 查询计划统计
 *
 * @returns 统计卡片数据
 */
export async function fetchPlanStatistics(): Promise<RatingPlanStatistics> {
	await delay(150);
	return { ...MOCK_PLAN_STATISTICS };
}

/**
 * 查询评级计划列表
 *
 * @param query - 筛选与分页参数
 * @returns 分页列表
 */
export async function fetchPlanList(
	query: RatingPlanQuery & { pageNum?: number; pageSize?: number } = {},
): Promise<PlanListResult<RatingPlanItem>> {
	await delay();
	const { planName, cycle, owner, status, pageNum = 1, pageSize = 20 } = query;
	const filtered = MOCK_PLAN_LIST.filter(
		(item) =>
			(!planName || item.planName.includes(planName)) &&
			(!cycle || item.cycle === cycle) &&
			(!owner || item.owner.includes(owner)) &&
			(!status || item.status === status),
	);
	const start = (pageNum - 1) * pageSize;
	return {
		data: filtered.slice(start, start + pageSize),
		total: filtered.length,
	};
}

/**
 * 查询人员清单左侧组织树
 *
 * @returns 组织树
 */
export async function fetchPlanOrgTree(): Promise<PlanOrgNode[]> {
	await delay(120);
	return MOCK_ORG_TREE;
}

/**
 * 查询人员清单顶部统计与等级分布
 *
 * @param scope - 统计范围（全部 / 基层员工 / 管理者）
 * @returns 统计与等级分布
 */
export async function fetchPlanViewSummary(
	scope: PlanViewScope = "全部",
): Promise<PlanViewSummary> {
	await delay(150);
	return {
		...(MOCK_VIEW_SUMMARY[scope] ?? MOCK_VIEW_SUMMARY.全部),
		gradeRows: MOCK_GRADE_ROWS,
	};
}

/**
 * 查询人员清单列表
 *
 * @param query - 筛选参数
 * @returns 人员清单
 */
export async function fetchPlanEmployeeList(
	query: PlanEmployeeQuery = {},
): Promise<PlanListResult<PlanEmployeeRow>> {
	await delay();
	const { keyword, positionCategory, employmentStatus, submitGrade, checkStatus, status } = query;
	const filtered = MOCK_EMPLOYEE_ROWS.filter(
		(item) =>
			(!keyword || item.name.includes(keyword) || item.employeeNo.includes(keyword)) &&
			(!positionCategory || item.positionCategory === positionCategory) &&
			(!employmentStatus || item.employmentStatus === employmentStatus) &&
			(!submitGrade || item.submitGrade === submitGrade) &&
			(!checkStatus || item.checkStatus === checkStatus) &&
			(!status || item.status === status),
	);
	return { data: filtered, total: filtered.length };
}

/**
 * 查询分析报表数据
 *
 * @param query - 筛选参数
 * @returns 分析报表行
 */
export async function fetchPlanAnalysisRows(
	query: PlanAnalysisQuery = {},
): Promise<PlanListResult<GradeDistributionRow>> {
	await delay(200);
	const { orgType, orgName, positionCategory, checkResult } = query;
	const filtered = MOCK_ANALYSIS_ROWS.filter(
		(item) =>
			(!orgType || item.orgType === orgType) &&
			(!orgName || item.orgName === orgName) &&
			(!positionCategory || item.positionCategory === positionCategory) &&
			(!checkResult ||
				(checkResult === PLAN_CHECK_RESULT.NORMAL
					? Object.values(item.check).every((value) => value === PLAN_CHECK_RESULT.NORMAL)
					: Object.values(item.check).some(
							(value) => value !== PLAN_CHECK_RESULT.NORMAL,
						))),
	);
	return { data: filtered, total: filtered.length };
}

/**
 * 查询计划权限成员
 *
 * @param planId - 计划标识
 * @returns 权限成员列表
 */
export async function fetchPlanPermissionList(planId: string): Promise<PlanPermissionMember[]> {
	await delay(150);
	return (MOCK_PERMISSION_MEMBERS[planId] ?? []).map((item) => ({ ...item }));
}

/**
 * 保存计划权限
 *
 * @param payload - 计划标识与成员权限
 * @returns 保存结果
 */
export async function savePlanPermissions(
	payload: SavePlanPermissionPayload,
): Promise<{ success: boolean }> {
	await delay(250);
	MOCK_PERMISSION_MEMBERS[payload.planId] = payload.members.map((item) => ({ ...item }));
	return { success: true };
}

/** 计划下拉项 */
export interface PlanSelectOption {
	/** 计划id */
	id: number;
	/** 计划名称 */
	planName: string;
	/** 周期 */
	periodName?: string;
}

/** 计划全量列表行（后端 EffAnnualEvaluationPlanPageListBO 的展示子集） */
interface PlanListRow {
	/** 计划id */
	id?: number;
	/** 计划名称 */
	planName?: string;
	/** 周期 */
	periodName?: string;
}

/**
 * 查询计划下拉选项
 *
 * 评级待办筛选区「计划名称」下拉数据源。
 *
 * @returns 计划选项
 */
export async function fetchPlanOptions(): Promise<PlanSelectOption[]> {
	const response = await request
		.post("annualevaluation/plan/list/all")
		.json<ApiResponse<PlanListRow[]>>();
	return (response?.data ?? [])
		.filter((row) => row.id !== undefined && row.id !== null)
		.map((row) => ({
			id: Number(row.id),
			planName: row.planName ?? "",
			periodName: row.periodName,
		}));
}
