import type { SelfEvalSubmitPayload } from "#src/api/performance-management/self-eval";

import {
	fetchSelfEvalDetail,
	saveSelfEvalDraft,
	submitSelfEval,
} from "#src/api/performance-management/self-eval";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 请求实例替身
 *
 * 详情 / 暂存 / 提交均已接入真实请求，这里按后端语义维护一份最小状态：
 * - 暂存：写 tempScore，保留 score
 * - 提交：写 score，清空 tempScore
 */
const { requestMock } = vi.hoisted(() => ({
	requestMock: {
		get: vi.fn(),
		put: vi.fn(),
	},
}));

vi.mock("#src/utils", () => ({
	request: requestMock,
}));

/** 单条评分记录的模拟状态 */
interface MockResultState {
	/** 正式自评分 */
	score: number | null;
	/** 临时自评分 */
	tempScore: number | null;
	/** 备注 */
	remark: string;
}

/** 评分记录 id */
const RESULT_ID = 101;
/** 任务 id */
const TASK_ID = "131071";

/**
 * 构造详情响应
 *
 * @param state - 评分记录状态
 * @param indicatorType - 指标维度
 * @returns 请求响应替身
 */
function detailResponse(state: MockResultState, indicatorType = "文化认同") {
	return {
		json: async () => ({
			code: 200,
			data: {
				taskInfo: {
					id: Number(TASK_ID),
					planName: "2026年度评级",
					periodName: "2026年度",
					evaluationType: 1,
					nodeType: 1,
					dealUserName: "吴梦颜",
					finishTime: "2026-12-15 00:00:00",
					status: "0",
				},
				userInfo: {
					username: "吴梦颜",
					userCode: "E1001",
					belongOrgName: "善数创新部",
					jobName: "产品经理",
					jobTypeName: "职能员工",
					postGrade: "P5",
				},
				resultList: [
					{
						id: RESULT_ID,
						indicatorId: 1,
						indicatorType,
						indicatorName: "文化认同",
						indicatorWeight: 10,
						indicatorRule: [
							{ ruleContent: "优秀", rule_min: 4, rule_max: 5 },
							{ ruleContent: "合格", rule_min: 1, rule_max: 3 },
						],
						score: state.score,
						tempScore: state.tempScore,
						remark: state.remark,
					},
				],
			},
		}),
	};
}

describe("自评填报详情：score / tempScore 回显", () => {
	let state: MockResultState;

	beforeEach(() => {
		vi.clearAllMocks();
		state = { score: null, tempScore: null, remark: "" };

		requestMock.get.mockImplementation(() => detailResponse(state));
		requestMock.put.mockImplementation(
			(
				url: string,
				options: {
					json: {
						taskId: number;
						itemList: Array<{ id: number; score: number; remark?: string }>;
					};
				},
			) => {
				const item = options.json.itemList.find((row) => row.id === RESULT_ID);
				if (item) {
					if (url.endsWith("/tempSave")) {
						state.tempScore = item.score;
					} else {
						state.score = item.score;
						state.tempScore = null;
					}
					state.remark = item.remark ?? "";
				}
				return { json: async () => ({ code: 200, data: 1 }) };
			},
		);
	});

	it("暂存后详情回显 tempScore", async () => {
		const before = await fetchSelfEvalDetail({ todoId: TASK_ID });
		expect(before.scores?.[String(RESULT_ID)]).toBeUndefined();

		await saveSelfEvalDraft({ todoId: TASK_ID, scores: { [String(RESULT_ID)]: 4 } });

		const after = await fetchSelfEvalDetail({ todoId: TASK_ID });
		expect(after.scores?.[String(RESULT_ID)]).toBe(4);
		// 暂存不影响正式分
		expect(state.score).toBeNull();
	});

	it("提交后详情回显 score，且 tempScore 已清空", async () => {
		await saveSelfEvalDraft({ todoId: TASK_ID, scores: { [String(RESULT_ID)]: 4 } });
		await submitSelfEval({ todoId: TASK_ID, scores: { [String(RESULT_ID)]: 5 } });

		expect(state.tempScore).toBeNull();
		const after = await fetchSelfEvalDetail({ todoId: TASK_ID });
		expect(after.scores?.[String(RESULT_ID)]).toBe(5);
	});

	it("tempScore 与 score 同时存在时优先 tempScore（0 分不回落）", async () => {
		state = { score: 3, tempScore: 0, remark: "" };
		const data = await fetchSelfEvalDetail({ todoId: TASK_ID });
		expect(data.scores?.[String(RESULT_ID)]).toBe(0);
	});

	it("暂存/提交载荷按后端表单组装，且跳过未填写的指标", async () => {
		const payload: SelfEvalSubmitPayload = {
			todoId: TASK_ID,
			scores: { [String(RESULT_ID)]: 4 },
			bonusIndicatorId: "201",
			bonusScore: 2,
			bonusRemark: "跨部门协作",
		};

		await saveSelfEvalDraft(payload);

		expect(requestMock.put).toHaveBeenCalledWith(`annualevaluation/fill/tempSave`, {
			json: {
				taskId: Number(TASK_ID),
				itemList: [
					{ id: RESULT_ID, score: 4 },
					{ id: 201, score: 2, remark: "跨部门协作" },
				],
			},
		});
	});

	it("满分取评分细则上限，而非指标权重", async () => {
		const data = await fetchSelfEvalDetail({ todoId: TASK_ID });
		const indicator = data.dimensions[0]?.indicators[0];
		// 规则上限为 5，权重为 10
		expect(indicator?.fullScore).toBe(5);
		expect(indicator?.levels.map((level) => level.max)).toEqual([5, 3]);
	});

	it("加分项 / 扣分项按维度名称拆出独立输入区", async () => {
		requestMock.get.mockImplementation(() => {
			const response = detailResponse(state);
			return {
				json: async () => {
					const body = await response.json();
					body.data.resultList.push({
						id: 201,
						indicatorId: 2,
						indicatorType: "加分项",
						indicatorName: "突出贡献",
						indicatorWeight: 5,
						indicatorRule: [{ ruleContent: "0-5", rule_min: 0, rule_max: 5 }],
						score: null,
						tempScore: 2,
						remark: "跨部门协作",
					});
					return body;
				},
			};
		});

		const data = await fetchSelfEvalDetail({ todoId: TASK_ID });
		expect(data.bonusIndicatorId).toBe("201");
		expect(data.bonusScore).toBe(2);
		expect(data.bonusRemark).toBe("跨部门协作");
	});
});
