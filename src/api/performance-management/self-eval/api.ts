import type {
	ScoreDimension,
	ScoreLevel,
	SelfEvalData,
	SelfEvalQueryParams,
	SelfEvalSubmitPayload,
	SelfEvalSubmitResult,
} from "./types";

import { RatingAssessType, RatingNodeType } from "#src/api/performance-management/todo";
import { request } from "#src/utils";
import dayjs from "dayjs";

/**
 * 绩效管理 · 年度评级 · 自评填报
 *
 * 真实接口：
 * - GET annualevaluation/userTask/detail/{id}  填报任务详情（任务 / 用户 / 评分记录）
 * - PUT annualevaluation/fill/tempSave         暂存（写临时自评分）
 * - PUT annualevaluation/fill/submit           提交（写正式自评分并完成任务）
 *
 * 评分记录以 resultList[].id 作为前端评分项的 key，暂存 / 提交时原样回传。
 */

/** 后端评分细则 */
interface ResultRuleBO {
	/** 指标维度 */
	type?: string;
	/** 指标名称 */
	name?: string;
	/** 规则内容 */
	ruleContent?: string;
	/** 分值下限 */
	rule_min?: number;
	/** 分值上限 */
	rule_max?: number;
}

/** 后端评分记录 */
interface ResultItemBO {
	/** 评分记录id */
	id?: number;
	/** 指标id */
	indicatorId?: number;
	/** 指标维度 */
	indicatorType?: string;
	/** 指标名称 */
	indicatorName?: string;
	/** 指标权重 */
	indicatorWeight?: number;
	/** 指标评分规则 */
	indicatorRule?: ResultRuleBO[];
	/** 自评分 */
	score?: number;
	/** 临时自评分 */
	tempScore?: number;
	/** 直属领导评分 */
	superiorScore?: number;
	/** 备注 */
	remark?: string;
}

/** 后端填报任务详情 */
interface TaskDetailBO {
	/** 任务信息 */
	taskInfo?: {
		/** 任务id */
		id?: number;
		/** 任务编号 */
		taskCode?: string;
		/** 计划名称 */
		planName?: string;
		/** 周期 */
		periodName?: string;
		/** 考核类型 */
		evaluationType?: number;
		/** 节点类型 */
		nodeType?: number;
		/** 执行人 */
		dealUserName?: string;
		/** 人数 */
		userCount?: number;
		/** 有效期 */
		finishTime?: string;
		/** 状态 */
		status?: string;
	};
	/** 用户信息 */
	userInfo?: {
		/** 姓名 */
		username?: string;
		/** 工号 */
		userCode?: string;
		/** 部门 */
		belongOrgName?: string;
		/** 岗位 */
		jobName?: string;
		/** 岗位分类 */
		jobTypeName?: string;
		/** 职级 */
		postGrade?: string;
	};
	/** 评分记录 */
	resultList?: ResultItemBO[];
}

/** 加分项维度标识 */
const BONUS_DIMENSION_ID = "bonus";
/** 扣分项维度标识 */
const DEDUCT_DIMENSION_ID = "deduct";

/** 合法考核类型字典码 */
const ASSESS_TYPE_VALUES: RatingAssessType[] = [RatingAssessType.STAFF, RatingAssessType.MANAGER];

/** 合法节点类型字典码（自评节点不会出现审定，仍纳入校验以兼容字典全量） */
const NODE_TYPE_VALUES: RatingNodeType[] = [
	RatingNodeType.SELF_EVAL,
	RatingNodeType.SUBMIT,
	RatingNodeType.APPROVE,
	RatingNodeType.CONFIRM,
	RatingNodeType.APPEAL,
	RatingNodeType.FINALIZE,
];

/**
 * 考核类型字典码校验
 *
 * @param value - 后端 evaluationType
 * @returns 命中的枚举值，未知时为 undefined
 */
function toAssessType(value?: number | string | null): RatingAssessType | undefined {
	const normalized = Number(value);
	return ASSESS_TYPE_VALUES.includes(normalized as RatingAssessType)
		? (normalized as RatingAssessType)
		: undefined;
}

/**
 * 节点类型字典码校验
 *
 * @param value - 后端 nodeType
 * @returns 命中的枚举值，未知时为 undefined
 */
function toNodeType(value?: number | string | null): RatingNodeType | undefined {
	const normalized = Number(value);
	return NODE_TYPE_VALUES.includes(normalized as RatingNodeType)
		? (normalized as RatingNodeType)
		: undefined;
}

/**
 * 识别维度标识
 *
 * 加分项 / 扣分项使用固定标识，供页面拆分独立输入区。
 *
 * @param name - 指标维度名称
 * @param index - 维度序号
 * @returns 维度标识
 */
function resolveDimensionId(name: string, index: number): string {
	if (name.includes("加分")) {
		return BONUS_DIMENSION_ID;
	}
	if (name.includes("扣分")) {
		return DEDUCT_DIMENSION_ID;
	}
	return `dim-${index}`;
}

/**
 * 取评分记录当前分数：暂存值优先，其次正式值
 *
 * @param item - 评分记录
 * @returns 分数，未填时为 undefined
 */
function resolveScore(item: ResultItemBO): number | undefined {
	const raw = item.tempScore ?? item.score;
	if (raw === undefined || raw === null) {
		return undefined;
	}
	return Number(raw);
}

/**
 * 评分细则转换
 *
 * @param rules - 后端评分规则
 * @returns 按分值降序的评分档位
 */
function mapLevels(rules?: ResultRuleBO[]): ScoreLevel[] {
	return (rules ?? [])
		.map((rule) => ({
			min: Number(rule.rule_min ?? 0),
			max: Number(rule.rule_max ?? 0),
			description: rule.ruleContent ?? "",
		}))
		.sort((a, b) => b.max - a.max);
}

/**
 * 评分记录按维度分组并转换为页面量表
 *
 * @param resultList - 后端评分记录
 * @returns 维度列表（含各维度下指标）
 */
function mapDimensions(resultList: ResultItemBO[]): ScoreDimension[] {
	const groups = new Map<string, { name: string; items: ResultItemBO[] }>();
	for (const item of resultList) {
		const name = item.indicatorType?.trim() || "其他";
		const group = groups.get(name) ?? { name, items: [] };
		group.items.push(item);
		groups.set(name, group);
	}

	return Array.from(groups.values()).map((group, index) => {
		const weight = group.items.reduce(
			(sum, item) => sum + Number(item.indicatorWeight ?? 0),
			0,
		);
		return {
			id: resolveDimensionId(group.name, index),
			name: group.name,
			weight: weight > 0 ? `${weight}%` : "",
			indicators: group.items.map((item) => {
				const levels = mapLevels(item.indicatorRule);
				// 满分取评分细则上限（如「1-5」→5）；细则未识别出数值时退回指标权重
				const ruleMax = levels.reduce((max, level) => Math.max(max, level.max), 0);
				return {
					id: String(item.id ?? item.indicatorId ?? ""),
					name: item.indicatorName ?? "",
					weight:
						item.indicatorWeight === undefined || item.indicatorWeight === null
							? ""
							: `${item.indicatorWeight}%`,
					fullScore: ruleMax > 0 ? ruleMax : Number(item.indicatorWeight ?? 0),
					levels,
				};
			}),
		};
	});
}

/**
 * 详情转换为页面模型
 *
 * @param detail - 后端填报任务详情
 * @returns 自评填报数据
 */
function mapSelfEvalData(detail: TaskDetailBO): SelfEvalData {
	const taskInfo = detail.taskInfo ?? {};
	const userInfo = detail.userInfo ?? {};
	const resultList = detail.resultList ?? [];
	const dimensions = mapDimensions(resultList);

	const scores: Record<string, number> = {};
	for (const item of resultList) {
		const score = resolveScore(item);
		if (item.id !== undefined && item.id !== null && score !== undefined) {
			scores[String(item.id)] = score;
		}
	}

	const bonusGroup = dimensions.find((dimension) => dimension.id === BONUS_DIMENSION_ID);
	const deductGroup = dimensions.find((dimension) => dimension.id === DEDUCT_DIMENSION_ID);
	const bonusIndicatorId = bonusGroup?.indicators[0]?.id;
	const deductIndicatorId = deductGroup?.indicators[0]?.id;
	const bonusItem = resultList.find((item) => String(item.id) === bonusIndicatorId);
	const deductItem = resultList.find((item) => String(item.id) === deductIndicatorId);

	return {
		ratingInfo: {
			planName: taskInfo.planName ?? "",
			cycle: taskInfo.periodName ?? "",
			assessType: toAssessType(taskInfo.evaluationType),
			nodeType: toNodeType(taskInfo.nodeType),
			executor: taskInfo.dealUserName ?? "",
			validDate: taskInfo.finishTime ? dayjs(taskInfo.finishTime).format("YYYY-MM-DD") : "",
			status: String(taskInfo.status ?? ""),
		},
		employeeInfo: {
			name: userInfo.username ?? "",
			employeeNo: userInfo.userCode ?? "",
			department: userInfo.belongOrgName ?? "",
			position: userInfo.jobName ?? "",
			positionCategory: userInfo.jobTypeName ?? "",
			jobLevel: userInfo.postGrade ?? "",
		},
		dimensions,
		scores,
		bonusIndicatorId,
		bonusScore: bonusItem ? resolveScore(bonusItem) : undefined,
		bonusRemark: bonusItem?.remark ?? "",
		deductIndicatorId,
		deductScore: deductItem ? resolveScore(deductItem) : undefined,
		deductRemark: deductItem?.remark ?? "",
		// 后端评分记录暂无一票否决字段，提交时该状态不会持久化
		vetoed: false,
	};
}

/**
 * 计算自评总分
 *
 * 总分 = 各指标自评分之和 + 加分项 - 扣分项；
 * 一票否决时总分归零（按 PRD 口径）。
 *
 * @param scores - 各指标自评分
 * @param bonusScore - 加分项得分
 * @param deductScore - 扣分项得分
 * @param vetoed - 是否一票否决
 * @returns 自评总分
 */
export function calcTotalScore(
	scores: Record<string, number>,
	bonusScore?: number,
	deductScore?: number,
	vetoed?: boolean,
): number {
	if (vetoed) {
		return 0;
	}
	const base = Object.values(scores).reduce((sum, v) => sum + (v || 0), 0);
	return Math.max(0, base + (bonusScore || 0) - (deductScore || 0));
}

/**
 * 组装暂存 / 提交明细
 *
 * @param payload - 提交载荷
 * @returns 后端 itemList
 */
function buildItemList(payload: SelfEvalSubmitPayload) {
	const items: Array<{ id: number; score: number; remark?: string }> = [];
	for (const [key, score] of Object.entries(payload.scores)) {
		const id = Number(key);
		if (!Number.isFinite(id) || score === undefined || score === null) {
			continue;
		}
		items.push({ id, score });
	}

	const bonusId = Number(payload.bonusIndicatorId);
	if (payload.bonusIndicatorId && Number.isFinite(bonusId) && payload.bonusScore !== undefined) {
		items.push({
			id: bonusId,
			score: payload.bonusScore,
			remark: payload.bonusRemark || undefined,
		});
	}

	const deductId = Number(payload.deductIndicatorId);
	if (
		payload.deductIndicatorId &&
		Number.isFinite(deductId) &&
		payload.deductScore !== undefined
	) {
		items.push({
			id: deductId,
			score: payload.deductScore,
			remark: payload.deductRemark || undefined,
		});
	}
	return items;
}

/**
 * 查询自评填报详情
 *
 * @param params - 查询参数
 * @returns 自评填报数据
 */
export async function fetchSelfEvalDetail(params: SelfEvalQueryParams): Promise<SelfEvalData> {
	const response = await request
		.get(`annualevaluation/userTask/detail/${params.todoId}`)
		.json<ApiResponse<TaskDetailBO>>();
	if (!response?.data) {
		throw new Error("评级任务详情为空");
	}
	return mapSelfEvalData(response.data);
}

/**
 * 调用暂存 / 提交接口
 *
 * @param path - 接口路径
 * @param payload - 提交载荷
 * @returns 提交结果
 */
async function saveSelfEval(
	path: "tempSave" | "submit",
	payload: SelfEvalSubmitPayload,
): Promise<SelfEvalSubmitResult> {
	await request
		.put(`annualevaluation/fill/${path}`, {
			json: {
				taskId: Number(payload.todoId),
				itemList: buildItemList(payload),
			},
		})
		.json<ApiResponse<number>>();
	return {
		totalScore: calcTotalScore(
			payload.scores,
			payload.bonusScore,
			payload.deductScore,
			payload.vetoed,
		),
	};
}

/**
 * 提交自评
 *
 * @param payload - 提交载荷
 * @returns 提交结果
 */
export async function submitSelfEval(
	payload: SelfEvalSubmitPayload,
): Promise<SelfEvalSubmitResult> {
	return saveSelfEval("submit", payload);
}

/**
 * 暂存自评
 *
 * @param payload - 提交载荷
 * @returns 暂存结果
 */
export async function saveSelfEvalDraft(
	payload: SelfEvalSubmitPayload,
): Promise<SelfEvalSubmitResult> {
	return saveSelfEval("tempSave", payload);
}
