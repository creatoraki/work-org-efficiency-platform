/**
 * 排兵布阵方案质量分计算。
 *
 * 口径来源：《质量分计算逻辑整理.md》及组织大脑排兵布阵需求说明书。
 *
 * 参与计算的条线（中文，与 EHR jobTypeName 一致）：
 * - 项目管理（项目经理 50%）
 * - 客服 / 工程 / 保洁 / 安全（主管各 5%，客服/工程一线各 15%）
 *
 * 非文档条线（E.O、绿化、其他服务等）不参与质量分计算。
 * 个人 matchScore 与方案质量分统一按 0~100 分制处理。
 *
 * @see 质量分计算逻辑整理.md
 */

import Big from "big.js";

// ---------------------------------------------------------------------------
// 类型定义
// ---------------------------------------------------------------------------

/** 质量分计算所需的人员字段（与方案 staffConfigList 项对齐） */
export interface DeploymentQualityStaffItem {
	departmentLine?: string;
	positionName?: string;
	isManager?: number | boolean | null;
	matchScore?: number;
}

/**
 * 文档定义的参与质量分条线（中文，与 EHR jobTypeName 一致）。
 *
 * 非文档条线（E.O、绿化、其他服务等）不在此枚举内，自然不参与计算。
 */
enum DepartmentLine {
	PROJECT_MANAGEMENT = "项目管理",
	CUSTOMER_SERVICE = "客服",
	ENGINEERING = "工程",
	CLEANING = "保洁",
	SECURITY = "安全",
}

/** 参与质量分的四条业务条线（不含项目管理） */
type QualityBusinessLine =
	| DepartmentLine.CUSTOMER_SERVICE
	| DepartmentLine.ENGINEERING
	| DepartmentLine.CLEANING
	| DepartmentLine.SECURITY;

/** 方案人员分组结果，供场景计算复用 */
interface QualityScoreStaffBuckets {
	projectManagers: DeploymentQualityStaffItem[];
	lineManagers: Record<QualityBusinessLine, DeploymentQualityStaffItem[]>;
	lineStaff: Record<QualityBusinessLine, DeploymentQualityStaffItem[]>;
}

/**
 * 质量分计算场景（与需求文档 ①~⑤ 一一对应）。
 *
 * 判定优先级：⑤ → ③/④ → ② → ①
 */
enum QualityScoreScenario {
	/** ① 标准：PM50% + 主管20% + 客服15% + 工程15% */
	STANDARD = "STANDARD",
	/** ② 无条线主管：各条线 5% 主管权重并入同条线一线 */
	NO_SUPERVISOR = "NO_SUPERVISOR",
	/** ③ 无客服/工程一线：对应 15% 并入主管（客服/工程主管各 20%） */
	NO_CS_ENG_STAFF = "NO_CS_ENG_STAFF",
	/** ④ 无主管且无客服/工程一线：仅 PM50% */
	PM_ONLY = "PM_ONLY",
	/** ⑤ 无项目经理：主管20% + 客服15% + 工程15%（满分 50，不归一化） */
	NO_PROJECT_MANAGER = "NO_PROJECT_MANAGER",
}

// ---------------------------------------------------------------------------
// 常量：权重（百分数）
// ---------------------------------------------------------------------------

/** 质量分权重百分数 */
enum QualityWeightPercent {
	PROJECT_MANAGER = 50,
	LINE_SUPERVISOR = 5,
	CS_ENG_FRONTLINE = 15,
}

/** 客服/工程一线固定权重（保洁/安全无一线权重） */
const LINE_FRONTLINE_WEIGHT_PERCENT: Partial<Record<QualityBusinessLine, QualityWeightPercent>> = {
	[DepartmentLine.CUSTOMER_SERVICE]: QualityWeightPercent.CS_ENG_FRONTLINE,
	[DepartmentLine.ENGINEERING]: QualityWeightPercent.CS_ENG_FRONTLINE,
};

/** 参与主管/一线分组的四条业务条线 */
const QUALITY_BUSINESS_LINES: QualityBusinessLine[] = [
	DepartmentLine.CUSTOMER_SERVICE,
	DepartmentLine.ENGINEERING,
	DepartmentLine.CLEANING,
	DepartmentLine.SECURITY,
];

/** 历史条线别名 → 标准中文名 */
const DEPARTMENT_LINE_ALIASES: Record<
	string,
	QualityBusinessLine | DepartmentLine.PROJECT_MANAGEMENT
> = {
	管家: DepartmentLine.CUSTOMER_SERVICE,
	环境: DepartmentLine.CLEANING,
};

// ---------------------------------------------------------------------------
// 人员识别
// ---------------------------------------------------------------------------

/**
 * 读取个人人岗匹配度。
 *
 * @param score - 后端 matchScore
 * @returns 0~100 区间得分；缺失/NaN/越界时按边界截断
 */
function resolvePersonalMatchScore(score?: number): number {
	if (score == null || Number.isNaN(score)) {
		return 0;
	}
	if (score <= 0) {
		return 0;
	}
	if (score >= 100) {
		return 100;
	}
	return score;
}

/**
 * 归一化条线中文名（兼容历史别名：管家→客服、环境→保洁）。
 *
 * @param departmentLine - 原始条线中文
 * @returns trim 后的标准条线名
 */
function normalizeDepartmentLine(departmentLine?: string): string {
	const line = departmentLine?.trim() ?? "";
	return DEPARTMENT_LINE_ALIASES[line] ?? line;
}

/**
 * 判断是否为主管岗位。
 *
 * @param isManager - 后端 isManager 字段
 * @returns isManager 为 1 或 true 时视为主管
 */
function isSupervisorFlag(isManager?: number | boolean | null): boolean {
	return isManager === 1 || isManager === true;
}

/**
 * 判断是否为项目经理（不计入条线主管 20% 权重桶）。
 *
 * 识别规则（满足任一）：
 * 1. departmentLine 为「项目管理」或「项目经理」
 * 2. positionName 包含「项目经理」（不含「项目助理经理」等不含该子串的岗位）
 *
 * @param staff - 人员配置
 * @returns 是否项目经理
 */
function isProjectManager(staff: DeploymentQualityStaffItem): boolean {
	const line = normalizeDepartmentLine(staff.departmentLine);
	const positionName = staff.positionName?.trim() ?? "";

	if (line === DepartmentLine.PROJECT_MANAGEMENT || line === "项目经理") {
		return true;
	}
	return positionName.includes("项目经理");
}

/**
 * 判断是否为指定条线的条线主管。
 *
 * @param staff - 人员配置
 * @param line - 目标条线
 * @returns 是否该条线主管
 */
function isLineSupervisor(staff: DeploymentQualityStaffItem, line: QualityBusinessLine): boolean {
	if (isProjectManager(staff)) {
		return false;
	}
	return (
		normalizeDepartmentLine(staff.departmentLine) === line && isSupervisorFlag(staff.isManager)
	);
}

/**
 * 判断是否为指定条线的非主管一线人员。
 *
 * @param staff - 人员配置
 * @param line - 目标条线
 * @returns 是否该条线一线人员
 */
function isLineFrontlineStaff(
	staff: DeploymentQualityStaffItem,
	line: QualityBusinessLine,
): boolean {
	if (isProjectManager(staff)) {
		return false;
	}
	return (
		normalizeDepartmentLine(staff.departmentLine) === line && !isSupervisorFlag(staff.isManager)
	);
}

/**
 * 将方案人员按项目经理、条线主管、条线一线分组。
 *
 * @param staffList - 方案内全部已选人员
 * @returns 分组结果
 */
function buildQualityScoreStaffBuckets(
	staffList: DeploymentQualityStaffItem[],
): QualityScoreStaffBuckets {
	const emptyLineRecord = (): Record<QualityBusinessLine, DeploymentQualityStaffItem[]> => ({
		[DepartmentLine.CUSTOMER_SERVICE]: [],
		[DepartmentLine.ENGINEERING]: [],
		[DepartmentLine.CLEANING]: [],
		[DepartmentLine.SECURITY]: [],
	});

	const lineManagers = emptyLineRecord();
	const lineStaff = emptyLineRecord();

	for (const line of QUALITY_BUSINESS_LINES) {
		lineManagers[line] = staffList.filter((staff) => isLineSupervisor(staff, line));
		lineStaff[line] = staffList.filter((staff) => isLineFrontlineStaff(staff, line));
	}

	return {
		projectManagers: staffList.filter(isProjectManager),
		lineManagers,
		lineStaff,
	};
}

// ---------------------------------------------------------------------------
// 权重计算（含通用补充规则：缺岗权重上移/下移/归零）
// ---------------------------------------------------------------------------

/**
 * 计算某一权重桶对总分的贡献。
 *
 * 桶内多人时先求 matchScore 算术平均，再乘以权重百分数。
 *
 * @param staffList - 桶内人员
 * @param weightPercent - 权重百分比（如 50 表示 50%）
 * @returns 加权得分（0~100 量纲）
 */
function contributeBucketScore(
	staffList: DeploymentQualityStaffItem[],
	weightPercent: number,
): number {
	if (staffList.length === 0 || weightPercent <= 0) {
		return 0;
	}

	const averageScore =
		staffList.reduce((sum, staff) => sum + resolvePersonalMatchScore(staff.matchScore), 0) /
		staffList.length;

	return (weightPercent / 100) * averageScore;
}

/**
 * 获取条线主管在「无一线人员」时的合并权重（通用补充规则 1）。
 *
 * 仅客服/工程存在 15% 一线权重，缺一线时并入主管。
 *
 * @param line - 目标条线
 * @returns 主管权重百分数
 */
function resolveSupervisorWeightWhenNoFrontline(line: QualityBusinessLine): number {
	const frontlineWeight = LINE_FRONTLINE_WEIGHT_PERCENT[line] ?? 0;
	return QualityWeightPercent.LINE_SUPERVISOR + frontlineWeight;
}

/**
 * 获取条线一线在「无主管」时的合并权重（通用补充规则 1）。
 *
 * @param line - 目标条线
 * @returns 一线权重百分数
 */
function resolveFrontlineWeightWhenNoSupervisor(line: QualityBusinessLine): number {
	return QualityWeightPercent.LINE_SUPERVISOR + (LINE_FRONTLINE_WEIGHT_PERCENT[line] ?? 0);
}

/**
 * 按条线计算主管/一线权重贡献（场景①/⑤及通用权重转移）。
 *
 * 规则摘要：
 * - 有主管 + 有一线：主管 5% + 一线 15%（客服/工程）或仅主管 5%（保洁/安全）
 * - 有主管 + 无一线：主管吸收一线 15%（客服/工程 → 20%）
 * - 无主管 + 有一线：一线吸收主管 5%（客服/工程 → 20%，保洁/安全 → 5%）
 * - 全无：该条线权重归零
 *
 * @param buckets - 人员分组
 * @param line - 目标条线
 * @returns 该条线加权得分（0~100 量纲）
 */
function contributeLineQualityScore(
	buckets: QualityScoreStaffBuckets,
	line: QualityBusinessLine,
): number {
	const supervisors = buckets.lineManagers[line];
	const frontlineStaff = buckets.lineStaff[line];
	const frontlineWeight = LINE_FRONTLINE_WEIGHT_PERCENT[line] ?? 0;

	if (supervisors.length > 0) {
		const supervisorWeight =
			frontlineStaff.length === 0 && frontlineWeight > 0
				? resolveSupervisorWeightWhenNoFrontline(line)
				: QualityWeightPercent.LINE_SUPERVISOR;

		let score = contributeBucketScore(supervisors, supervisorWeight);

		if (frontlineWeight > 0 && frontlineStaff.length > 0) {
			score += contributeBucketScore(frontlineStaff, frontlineWeight);
		}
		return score;
	}

	if (frontlineStaff.length > 0) {
		return contributeBucketScore(frontlineStaff, resolveFrontlineWeightWhenNoSupervisor(line));
	}

	return 0;
}

// ---------------------------------------------------------------------------
// 场景判定
// ---------------------------------------------------------------------------

/**
 * 按需求文档优先级判定当前方案适用的质量分场景。
 *
 * 判定顺序：
 * 1. 无项目经理 → ⑤
 * 2. 无客服/工程一线 → ③（有主管）或 ④（无主管）
 * 3. 无任一条线主管 → ②
 * 4. 其余 → ①
 *
 * @param buckets - 人员分组
 * @returns 场景编码
 */
function resolveQualityScoreScenario(buckets: QualityScoreStaffBuckets): QualityScoreScenario {
	const hasProjectManager = buckets.projectManagers.length > 0;
	const hasAnySupervisor = QUALITY_BUSINESS_LINES.some(
		(line) => buckets.lineManagers[line].length > 0,
	);
	const hasCustomerServiceFrontline =
		buckets.lineStaff[DepartmentLine.CUSTOMER_SERVICE].length > 0;
	const hasEngineeringFrontline = buckets.lineStaff[DepartmentLine.ENGINEERING].length > 0;

	if (!hasProjectManager) {
		return QualityScoreScenario.NO_PROJECT_MANAGER;
	}
	if (!hasCustomerServiceFrontline && !hasEngineeringFrontline) {
		return hasAnySupervisor
			? QualityScoreScenario.NO_CS_ENG_STAFF
			: QualityScoreScenario.PM_ONLY;
	}
	if (!hasAnySupervisor) {
		return QualityScoreScenario.NO_SUPERVISOR;
	}
	return QualityScoreScenario.STANDARD;
}

// ---------------------------------------------------------------------------
// 场景①~⑤ 计算
// ---------------------------------------------------------------------------

/**
 * ① 标准：PM50% + 主管20% + 客服15% + 工程15%。
 *
 * @param buckets - 人员分组
 * @returns 加权得分（0~100 量纲）
 */
function calculateStandardScenario(buckets: QualityScoreStaffBuckets): number {
	let weightedSum = contributeBucketScore(
		buckets.projectManagers,
		QualityWeightPercent.PROJECT_MANAGER,
	);

	for (const line of QUALITY_BUSINESS_LINES) {
		weightedSum += contributeLineQualityScore(buckets, line);
	}

	return weightedSum;
}

/**
 * ② 无条线主管：PM50% + 客服20% + 工程20% + 保洁5% + 安全5%。
 *
 * @param buckets - 人员分组
 * @returns 加权得分（0~100 量纲）
 */
function calculateNoSupervisorScenario(buckets: QualityScoreStaffBuckets): number {
	let weightedSum = contributeBucketScore(
		buckets.projectManagers,
		QualityWeightPercent.PROJECT_MANAGER,
	);

	for (const line of QUALITY_BUSINESS_LINES) {
		weightedSum += contributeBucketScore(
			buckets.lineStaff[line],
			resolveFrontlineWeightWhenNoSupervisor(line),
		);
	}

	return weightedSum;
}

/**
 * ③ 无客服/工程一线：PM50% + 主管50%（客服/工程主管各20%，保洁/安全各5%）。
 *
 * 仅计主管，保洁/安全一线不参与本场景。
 *
 * @param buckets - 人员分组
 * @returns 加权得分（0~100 量纲）
 */
function calculateNoCsEngStaffScenario(buckets: QualityScoreStaffBuckets): number {
	let weightedSum = contributeBucketScore(
		buckets.projectManagers,
		QualityWeightPercent.PROJECT_MANAGER,
	);

	for (const line of QUALITY_BUSINESS_LINES) {
		const supervisorWeight =
			(LINE_FRONTLINE_WEIGHT_PERCENT[line] ?? 0) > 0
				? resolveSupervisorWeightWhenNoFrontline(line)
				: QualityWeightPercent.LINE_SUPERVISOR;

		weightedSum += contributeBucketScore(buckets.lineManagers[line], supervisorWeight);
	}

	return weightedSum;
}

/** ④ 无主管且无客服/工程一线：仅 PM50%。 */
function calculatePmOnlyScenario(buckets: QualityScoreStaffBuckets): number {
	return contributeBucketScore(buckets.projectManagers, QualityWeightPercent.PROJECT_MANAGER);
}

/**
 * ⑤ 无项目经理：主管20% + 客服15% + 工程15%（满分 50，不归一化至 100）。
 *
 * @param buckets - 人员分组
 * @returns 加权得分（0~100 量纲）
 */
function calculateNoProjectManagerScenario(buckets: QualityScoreStaffBuckets): number {
	let weightedSum = 0;

	for (const line of QUALITY_BUSINESS_LINES) {
		weightedSum += contributeLineQualityScore(buckets, line);
	}

	return weightedSum;
}

/**
 * 按场景编码执行对应计算公式。
 *
 * @param scenario - 场景编码
 * @param buckets - 人员分组
 * @returns 加权得分（0~100 量纲）
 */
function calculateByScenario(
	scenario: QualityScoreScenario,
	buckets: QualityScoreStaffBuckets,
): number {
	switch (scenario) {
		case QualityScoreScenario.STANDARD:
			return calculateStandardScenario(buckets);
		case QualityScoreScenario.NO_SUPERVISOR:
			return calculateNoSupervisorScenario(buckets);
		case QualityScoreScenario.NO_CS_ENG_STAFF:
			return calculateNoCsEngStaffScenario(buckets);
		case QualityScoreScenario.PM_ONLY:
			return calculatePmOnlyScenario(buckets);
		case QualityScoreScenario.NO_PROJECT_MANAGER:
			return calculateNoProjectManagerScenario(buckets);
		default:
			return 0;
	}
}

// ---------------------------------------------------------------------------
// 对外 API
// ---------------------------------------------------------------------------

/**
 * 质量分四舍五入（保留两位小数，禁止 toFixed）。
 *
 * @param score - 原始质量分
 * @returns 保留两位小数的数值
 */
export function roundDeploymentQualityScore(score: number): number {
	return Number(new Big(score).round(2, Big.roundHalfUp).toString());
}

/**
 * 质量分展示格式化（保留两位小数，禁止 toFixed）。
 *
 * @param score - 原始质量分
 * @returns 保留两位小数的字符串
 */
export function formatDeploymentQualityScore(score: number): string {
	return new Big(score).round(2, Big.roundHalfUp).toString();
}

/**
 * 计算排兵布阵方案质量分。
 *
 * @param staffList - 方案内全部已选人员（staffConfigList 扁平列表）
 * @returns 质量分（0~100，保留两位小数）
 */
export function calculateDeploymentQualityScore(staffList: DeploymentQualityStaffItem[]): number {
	const buckets = buildQualityScoreStaffBuckets(staffList);
	const scenario = resolveQualityScoreScenario(buckets);
	const weightedSum = calculateByScenario(scenario, buckets);

	return roundDeploymentQualityScore(weightedSum);
}
