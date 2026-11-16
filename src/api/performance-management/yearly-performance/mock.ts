/**
 * 年终述职 · 本地模拟数据
 *
 * 后端接口尚未提供，先以内存数据支撑页面渲染与交互（文件夹增删改、批量移动、拖拽排序、状态流转）。
 * 数据按设计稿「年终述职UI设计稿2026-11-14」构造：17 名述职人，待述职 13 / 述职中 1 / 报告生成中 1 / 报告已生成 2，
 * 其中杭州区域公司 5 人，与设计稿文件夹视图一致。
 *
 * 接口就绪后：删除本文件，并把 api.ts 中各函数改为真实请求。
 */

import type {
	PrepMaterial,
	ReportTranscript,
	ScoreReport,
	YearlyReportDetail,
	YearlyReportFolder,
	YearlyReportItem,
	YearlyReportOrgNode,
} from "./types";
import { YearlyReportStatus } from "./types";

/** 模拟组织（二级组织带上级名称，便于拼接组织路径） */
interface MockOrg {
	orgId: string;
	orgName: string;
	parentName: string;
}

/** 一级组织 */
const MOCK_ORG_GROUPS = [
	{
		orgId: "service-group",
		orgName: "服务集团",
		children: [{ orgId: "service-function", orgName: "服务集团职能" }],
	},
	{
		orgId: "region-company",
		orgName: "地区公司",
		children: [
			{ orgId: "hangzhou", orgName: "杭州区域公司" },
			{ orgId: "jiangsu", orgName: "江苏区域公司" },
			{ orgId: "huanan", orgName: "华南区域公司" },
			{ orgId: "shanghai", orgName: "上海区域公司" },
			{ orgId: "zhedong", orgName: "浙东区域公司" },
		],
	},
	{
		orgId: "business-group",
		orgName: "业务集团",
		children: [
			{ orgId: "marketing", orgName: "营销集团" },
			{ orgId: "technology", orgName: "科技集团" },
			{ orgId: "consulting", orgName: "咨询集团" },
		],
	},
];

/** 根组织 ID */
export const MOCK_ROOT_ORG_ID = "greentown-service";

/** 二级组织索引 */
const MOCK_ORG_MAP = new Map<string, MockOrg>(
	MOCK_ORG_GROUPS.flatMap((group) =>
		group.children.map((child) => [
			child.orgId,
			{ orgId: child.orgId, orgName: child.orgName, parentName: group.orgName },
		]),
	),
);

/**
 * 获取组织（含所有下级）的二级组织 ID 集合
 *
 * @param orgId - 组织 ID，空或根组织表示全部
 * @returns 二级组织 ID 集合
 */
export function resolveLeafOrgIds(orgId?: string): Set<string> {
	if (!orgId || orgId === MOCK_ROOT_ORG_ID) {
		return new Set(MOCK_ORG_MAP.keys());
	}
	const group = MOCK_ORG_GROUPS.find((item) => item.orgId === orgId);
	if (group) {
		return new Set(group.children.map((child) => child.orgId));
	}
	return new Set(MOCK_ORG_MAP.has(orgId) ? [orgId] : []);
}

/** 人员种子数据：[姓名, 工号, 二级组织, 管理者类别, 述职顺序, 述职日期, 状态, 现任职务, 头像] */
type MockPersonSeed = [
	string,
	string,
	string,
	string,
	number,
	string,
	YearlyReportStatus,
	string,
	string?,
];

/** 内置头像（SVG 占位人像，避免依赖外部图片服务） */
const MOCK_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#F5F5F3"/><ellipse cx="32" cy="27" rx="13" ry="15" fill="#2B2B2B"/><ellipse cx="32" cy="29" rx="9.5" ry="11.5" fill="#F3D3BE"/><path d="M10 64c2-13 11-19 22-19s20 6 22 19z" fill="#1F1F1F"/><path d="M27 46l5 9 5-9z" fill="#FFFFFF"/></svg>',
)}`;

const STAFF_SEEDS: MockPersonSeed[] = [
	[
		"YOUHUI",
		"E128601",
		"hangzhou",
		"地区公司>地区经营班子/群主",
		1,
		"2026-11-03",
		YearlyReportStatus.IN_PROGRESS,
		"区域总经理",
	],
	[
		"李彤运",
		"E128676",
		"jiangsu",
		"地区公司>职能系统部门负责人(本体)",
		1,
		"2026-11-03",
		YearlyReportStatus.PENDING,
		"人力资源部总经理",
		MOCK_AVATAR,
	],
	[
		"何宏伟",
		"E128602",
		"huanan",
		"地区公司>地区经营班子/群主",
		1,
		"2026-11-03",
		YearlyReportStatus.PENDING,
		"区域副总经理",
	],
	[
		"冯毅炎",
		"E128603",
		"hangzhou",
		"地区公司>地区经营班子/群主",
		2,
		"2026-11-03",
		YearlyReportStatus.PENDING,
		"项目群总经理",
	],
	[
		"郑志强",
		"E128604",
		"shanghai",
		"地区公司>职能系统部门负责人(运营)",
		2,
		"2026-11-04",
		YearlyReportStatus.PENDING,
		"运营管理部总经理",
	],
	[
		"郑雅婷",
		"E128605",
		"jiangsu",
		"地区公司>地区经营班子/群主",
		2,
		"2026-11-04",
		YearlyReportStatus.PENDING,
		"项目群总经理",
	],
	[
		"冯艳",
		"E128606",
		"zhedong",
		"地区公司>职能系统部门负责人(安全)",
		2,
		"2026-11-04",
		YearlyReportStatus.PENDING,
		"安全管理部总经理",
	],
	[
		"周维佳",
		"E128607",
		"hangzhou",
		"地区公司>地区经营班子/群主",
		3,
		"2026-11-03",
		YearlyReportStatus.PENDING,
		"项目群总经理",
	],
	[
		"王唯依",
		"E128608",
		"shanghai",
		"地区公司>地区经营班子/群主",
		3,
		"2026-11-03",
		YearlyReportStatus.PENDING,
		"项目群副总经理",
	],
	[
		"吴萍兰",
		"E128609",
		"hangzhou",
		"地区公司>地区经营班子/群主",
		3,
		"2026-11-04",
		YearlyReportStatus.GENERATING,
		"项目群总经理",
	],
	[
		"周小艺",
		"E128610",
		"hangzhou",
		"地区公司>地区经营班子/群主",
		3,
		"2026-11-04",
		YearlyReportStatus.READY,
		"项目群副总经理",
	],
	[
		"李珍",
		"E128611",
		"zhedong",
		"地区公司>地区经营班子/群主",
		3,
		"2026-11-04",
		YearlyReportStatus.READY,
		"项目群总经理",
	],
	[
		"林晚晴",
		"E128612",
		"service-function",
		"服务集团>三级及以上管理者",
		4,
		"2026-11-05",
		YearlyReportStatus.PENDING,
		"人力资源部总经理",
	],
	[
		"陈思远",
		"E128613",
		"service-function",
		"服务集团>三级以下管理者",
		4,
		"2026-11-05",
		YearlyReportStatus.PENDING,
		"财务管理部副总经理",
	],
	[
		"韩烁",
		"E128614",
		"marketing",
		"业务集团>三级以下管理者",
		4,
		"2026-11-05",
		YearlyReportStatus.PENDING,
		"大区销售总监",
	],
	[
		"沈嘉禾",
		"E128615",
		"technology",
		"业务集团>三级以下管理者",
		5,
		"2026-11-06",
		YearlyReportStatus.PENDING,
		"产品研发部总监",
	],
	[
		"唐宁",
		"E128616",
		"consulting",
		"业务集团>三级以下管理者",
		5,
		"2026-11-06",
		YearlyReportStatus.PENDING,
		"咨询事业部总监",
	],
];

/** 述职人员额外信息（职务），详情文档使用 */
const MOCK_POSITION_MAP = new Map<string, string>();

/** 述职人员内存表（按展示顺序排列，拖拽排序直接调整数组顺序） */
export const mockReports: YearlyReportItem[] = STAFF_SEEDS.map(
	(
		[userName, userCode, orgId, managerCategory, sortNo, date, status, position, avatar],
		index,
	) => {
		const org = MOCK_ORG_MAP.get(orgId);
		const reportId = `R${String(index + 1).padStart(4, "0")}`;
		MOCK_POSITION_MAP.set(reportId, position);
		return {
			reportId,
			userCode,
			userName,
			avatar,
			sortNo,
			managerCategory,
			orgPath: `${org?.parentName ?? ""}>${org?.orgName ?? ""}`,
			orgId,
			reportStartTime: `${date} 15:00`,
			reportEndTime: `${date} 15:30`,
			status,
		};
	},
);

/** 文件夹内存表，初始无文件夹（与设计稿初始界面一致） */
export const mockFolders: YearlyReportFolder[] = [];

/** 自增序列，用于生成文件夹 ID */
let folderSeq = 0;

/**
 * 生成文件夹 ID
 *
 * @returns 新文件夹 ID
 */
export function nextMockFolderId() {
	folderSeq += 1;
	return `F${String(folderSeq).padStart(4, "0")}`;
}

/**
 * 构造组织架构树（人数按当前内存数据实时统计）
 *
 * @returns 组织树节点
 */
export function buildMockOrgTree(): YearlyReportOrgNode[] {
	const countOf = (orgIds: Set<string>) =>
		mockReports.filter((item) => orgIds.has(item.orgId)).length;
	return [
		{
			orgId: MOCK_ROOT_ORG_ID,
			orgName: "绿城服务集团",
			headCount: mockReports.length,
			children: MOCK_ORG_GROUPS.map((group) => ({
				orgId: group.orgId,
				orgName: group.orgName,
				headCount: countOf(resolveLeafOrgIds(group.orgId)),
				children: group.children.map((child) => ({
					orgId: child.orgId,
					orgName: child.orgName,
					headCount: countOf(new Set([child.orgId])),
					folderEnabled: true,
				})),
			})),
		},
	];
}

/* ------------------------------------------------------------------ */
/* 述职详情文档模板                                                       */
/* ------------------------------------------------------------------ */

/**
 * 构造备课材料（模板内容来自设计稿，人员信息按当前述职人替换）
 *
 * @param item - 述职人员
 * @returns 备课材料
 */
function buildPrepMaterial(item: YearlyReportItem): PrepMaterial {
	const position = MOCK_POSITION_MAP.get(item.reportId) ?? "";
	const orgName = item.orgPath.split(">").pop() ?? "";
	return {
		subtitle: `${item.userName} · ${item.userCode} · ${position}`,
		meetingName: "绿城服务集团 2025 年度述职",
		meetingTime: "11-11 09:30",
		syncTime: "2026-11-05 09:12",
		basicInfo: {
			nameAndCode: `${item.userName} · ${item.userCode}`,
			positionCategory: "管理层",
			orgName: `${orgName} · ${orgName}`,
			currentPosition: position,
			entryAndTenure: "2018-03-12 · 8.6 年",
			directLeader: "王振国 · 区域总经理",
			reportForm: "现场述职 · 30 分钟",
			judges: "3 人（分管领导 / HRBP / 直属上级）",
		},
		highlights: [
			"连续三年绩效评定为 A / A+，2024 年度排名部门第 2，绩效稳定性强。",
			"负责业务板块营收 12.4 亿，同比增长 18.6%，超额完成年度目标 105%。",
			"过往述职中两次提及「干部梯队不足」，本次建议重点追问培养动作与结果。",
		],
		focusTags: [
			"建议关注 · 干部梯队",
			"建议关注 · 存量客户经营",
			"建议关注 · 人效提升",
			"建议关注 · 新市场拓展",
		],
		performance: [
			{ cycle: "2023 年度", grade: "A", score: "92.0", rank: "3 / 28" },
			{ cycle: "2024 年度", grade: "A+", score: "95.4", rank: "2 / 28" },
			{ cycle: "2025 年度", grade: "A", score: "93.1", rank: "2 / 26" },
		],
		abilities: [
			{ name: "业绩达成", score: 86 },
			{ name: "团队管理", score: 78 },
			{ name: "专业能力", score: 82 },
			{ name: "协同影响", score: 74 },
			{ name: "创新变革", score: 66 },
		],
		files: [
			{
				fileName: "2025 年度工作汇报.pptx",
				fileType: "ppt",
				fileSize: "4.2 MB",
				uploadDate: "2026-01-12",
			},
			{
				fileName: "2024 年度述职报告.pdf",
				fileType: "pdf",
				fileSize: "1.8 MB",
				uploadDate: "2025-01-08",
			},
			{
				fileName: "2025 年度绩效成绩单.xlsx",
				fileType: "xls",
				fileSize: "286 KB",
				uploadDate: "2026-02-20",
			},
		],
		reviews: [
			{
				content:
					"上年度综合评级 A，评委认可业务结果，建议加强「干部梯队」与「存量客户深耕」。",
				date: "2025-01",
				primary: true,
			},
			{
				content: "发展计划：培养 2 名后备干部，实际完成 3 名，继任率 80%。",
				date: "2025-06",
			},
			{
				content: "半年度复盘：新市场拓展节奏偏慢，储备项目转化率 32%，低于目标 45%。",
				date: "2025-12",
			},
		],
	};
}

/**
 * 构造录音转写
 *
 * @param item - 述职人员
 * @returns 录音转写
 */
function buildTranscript(item: YearlyReportItem): ReportTranscript {
	return {
		durationSeconds: 14,
		inputVolume: 0.08,
		segments: [
			{
				time: "00:06",
				speaker: item.userName,
				role: "述职人",
				text: "各位评委下午好，我是营销集团大区销售总监，负责华东大区销售管理，团队 126 人。",
			},
			{
				time: "00:34",
				speaker: item.userName,
				role: "述职人",
				text: "本年度大区签约额 12.4 亿，同比增长 18.6%，完成年度目标 105%。",
			},
			{
				time: "01:02",
				speaker: item.userName,
				role: "述职人",
				text: "结构上存量客户续约率 91%，新客户贡献 2.8 亿，占比从 15% 提升到 22%。",
			},
			{
				time: "01:41",
				speaker: item.userName,
				role: "述职人",
				text: "团队方面完成 3 名后备干部培养，关键岗位继任率 80%，比去年提升 12 个百分点。",
			},
		],
		summaries: [
			{
				title: "会议主题",
				content: `2025 年度述职 · 业务集团营销集团 · 大区销售总监 ${item.userName}`,
			},
			{
				title: "关键数据",
				content: "签约额 12.4 亿，同比 +18.6%，目标完成率 105%；存量续约率 91%。",
			},
		],
	};
}

/**
 * 构造评分报告
 *
 * @param item - 述职人员
 * @returns 评分报告
 */
function buildScoreReport(item: YearlyReportItem): ScoreReport {
	const position = MOCK_POSITION_MAP.get(item.reportId) ?? "";
	return {
		subtitle: `${item.userName} · ${item.userCode} · ${position}`,
		meetingName: "绿城服务集团 2025 年度述职",
		meetingTime: "11-04 14:00",
		generatedText: "11-05 10:12 生成 · 录音结束 T+1",
		personTitle: `${item.userName} · ${position}`,
		suggestedGrade: "B",
		totalScore: 77.6,
		conclusion:
			"综合得分在同层级（三级以下管理者）中位于 前 18%。绩效稳定在 A 档，现场述职数据引用准确；在新市场拓展与干部梯队落地动作上回答深度不足。",
		rankPercent: "18",
		recordDuration: "14:36",
		aiNoteCount: 21,
		followUpCount: 5,
		components: [
			{ name: "业绩达成", weight: "30%", score: 89 },
			{ name: "能力素质", weight: "25%", score: 85 },
			{ name: "现场表现", weight: "25%", score: 83 },
			{ name: "发展潜力", weight: "20%", score: 88 },
		],
		highlights: [
			"业务数据引用准确，营收、满意度均有量化支撑",
			"团队梯队有明确培养名单与继任率结果",
		],
		improvements: ["新市场拓展进度落后，缺少可执行补救方案", "储备项目转化率差距未做归因分析"],
		comments: [
			"该述职人近三年绩效稳定在 A 档，业务结果达成度高。本次述职对所辖区域营收 12.4 亿（同比 +18.6%）、客户满意度 92.3 分等核心指标掌握准确，说明对业务基本盘有清晰经营视角。",
			"答辩环节暴露两个短板：新市场拓展节奏偏慢（储备项目转化率 32%，目标 45%），且未给出可落地的补正计划；「人效提升 8%」缺测算口径与实现路径。",
			"建议下一考核周期将「存量客户深耕」与「干部梯队继任率」作为关键跟踪项，并在半年度复盘时对照本次述职承诺逐项确认。",
		],
		keyNodeTotal: 21,
		keyNodes: [
			{ content: "述职开始，介绍业务板块与团队规模（126 人）", time: "00:12", primary: true },
			{
				content: "营收 12.4 亿，同比 +18.6%，超额完成目标 105%",
				time: "00:48",
				primary: true,
			},
			{ content: "评委追问储备项目转化率，回答未给出明确补救动作", time: "02:15" },
			{ content: "结束述职 · 录音时长 14:36", time: "14:36" },
		],
	};
}

/**
 * 构造述职详情
 *
 * @param item - 述职人员
 * @returns 述职详情
 */
export function buildMockDetail(item: YearlyReportItem): YearlyReportDetail {
	const started = item.status !== YearlyReportStatus.PENDING;
	const ended =
		item.status === YearlyReportStatus.GENERATING || item.status === YearlyReportStatus.READY;
	return {
		...item,
		prepMaterial: buildPrepMaterial(item),
		transcript: started ? buildTranscript(item) : undefined,
		generating: ended
			? { expectFinishTime: "11-06 12:00", uploadFinishTime: "11-05 10:32" }
			: undefined,
		scoreReport: item.status === YearlyReportStatus.READY ? buildScoreReport(item) : undefined,
	};
}
