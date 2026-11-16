import {
	ApprovalAuditAction,
	auditApprovalDetail,
	fetchApprovalDetail,
	submitApproval,
} from "#src/api/performance-management/approval";
import { fetchPlanAnalysisRows, fetchPlanEmployeeList } from "#src/api/performance-management/plan";
import { fetchSelfEvalDetail, saveSelfEvalDraft } from "#src/api/performance-management/self-eval";
import { fetchSubmitDetail, saveSubmitDraft } from "#src/api/performance-management/submit";
import { RatingTodoStatus } from "#src/api/performance-management/todo";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** 请求实例替身：自评接口已接入真实请求 */
const { requestMock } = vi.hoisted(() => ({
	requestMock: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
	},
}));

vi.mock("#src/utils", () => ({
	request: requestMock,
}));

/**
 * 构造 ky 响应替身
 *
 * @param payload - 响应体
 * @returns 带 json() 的响应对象
 */
function jsonResponse(payload: unknown) {
	return { json: async () => payload };
}

describe("年度评级 API 数据流", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("人员清单按真实岗位分类和在职状态过滤", async () => {
		const result = await fetchPlanEmployeeList({
			positionCategory: "项目员工(安全)",
			employmentStatus: "在职",
		});
		expect(result.data).toHaveLength(2);
		expect(
			result.data.every(
				(item) =>
					item.positionCategory === "项目员工(安全)" && item.employmentStatus === "在职",
			),
		).toBe(true);
	});

	it("分析报表按正常和异常语义过滤", async () => {
		const abnormal = await fetchPlanAnalysisRows({ checkResult: "异常" });
		const normal = await fetchPlanAnalysisRows({ checkResult: "正常" });
		expect(abnormal.data.length).toBeGreaterThan(0);
		expect(
			abnormal.data.every((item) =>
				Object.values(item.check).some((value) => value !== "正常"),
			),
		).toBe(true);
		expect(
			normal.data.every((item) =>
				Object.values(item.check).every((value) => value === "正常"),
			),
		).toBe(true);
	});

	it("审核驳回后保存状态和驳回原因", async () => {
		await auditApprovalDetail("11", "d1", ApprovalAuditAction.REJECT, "分布不符合评级要求");
		const data = await fetchApprovalDetail({ todoId: "11" });
		const detail = data.details.find((item) => item.key === "d1");
		expect(detail?.status).toBe(RatingTodoStatus.REJECTED);
		expect(detail?.rejectReason).toBe("分布不符合评级要求");
	});

	it("自评详情按任务详情接口映射维度、回显分数与加分项", async () => {
		requestMock.get.mockReturnValueOnce(
			jsonResponse({
				data: {
					taskInfo: {
						id: 1,
						planName: "2026年度评级",
						periodName: "2026年度",
						evaluationType: 1,
						nodeType: 1,
						dealUserName: "吴梦颜",
						finishTime: "2026-12-15 00:00:00",
						status: "0",
					},
					userInfo: {
						username: "张江慧",
						userCode: "61002",
						belongOrgName: "萧山创新部",
						jobName: "研发",
						jobTypeName: "研发",
						postGrade: "P4",
					},
					resultList: [
						{
							id: 101,
							indicatorType: "文化认同",
							indicatorName: "文化认同(10%)",
							indicatorWeight: 10,
							indicatorRule: [
								{ ruleContent: "优秀", rule_min: 9, rule_max: 10 },
								{ ruleContent: "合格", rule_min: 7, rule_max: 8 },
							],
							tempScore: 7,
						},
						{
							id: 102,
							indicatorType: "加分项",
							indicatorName: "加分项",
							indicatorWeight: 5,
							score: 1,
							remark: "跨部门协作",
						},
					],
				},
			}),
		);

		const data = await fetchSelfEvalDetail({ todoId: "1" });
		expect(data.scores?.["101"]).toBe(7);
		expect(data.employeeInfo.name).toBe("张江慧");
		expect(data.dimensions.map((dimension) => dimension.id)).toEqual(["dim-0", "bonus"]);
		expect(data.dimensions[0].indicators[0].levels[0]).toMatchObject({
			min: 9,
			max: 10,
		});
		expect(data.bonusIndicatorId).toBe("102");
		expect(data.bonusScore).toBe(1);
		expect(data.bonusRemark).toBe("跨部门协作");
	});

	it("自评暂存按评分记录 id 组装 itemList", async () => {
		requestMock.put.mockReturnValueOnce(jsonResponse({ data: 2 }));

		await saveSelfEvalDraft({
			todoId: "1",
			scores: { "101": 7 },
			bonusIndicatorId: "102",
			bonusScore: 1,
			bonusRemark: "跨部门协作",
		});

		expect(requestMock.put).toHaveBeenCalledWith("annualevaluation/fill/tempSave", {
			json: {
				taskId: 1,
				itemList: [
					{ id: 101, score: 7 },
					{ id: 102, score: 1, remark: "跨部门协作" },
				],
			},
		});
	});

	it("提报暂存后重新查询仍能读取名单和分布说明", async () => {
		await saveSubmitDraft({
			todoId: "8",
			collaborator: "李丽颖、赵鹏",
			distributionExceptionNote: "提报分布异常说明",
			employees: [
				{ id: "E1001", submitScore: 88, submitLevel: "B", exceptionNote: "已复核" },
			],
		});
		const data = await fetchSubmitDetail({ todoId: "8" });
		expect(data.collaborator).toBe("李丽颖、赵鹏");
		expect(data.distributionExceptionNote).toBe("提报分布异常说明");
		expect(data.employees.find((item) => item.id === "E1001")).toMatchObject({
			submitScore: 88,
			submitLevel: "B",
			exceptionNote: "已复核",
		});
	});

	it("审批提交后保存协作人、分布说明和员工评分", async () => {
		await submitApproval({
			todoId: "11",
			distributionExceptionNote: "审批分布异常说明",
			collaborators: ["周祥"],
			employees: [{ id: "e1", submitScore: 91, submitLevel: "A", exceptionNote: "已复核" }],
		});
		const data = await fetchApprovalDetail({ todoId: "11" });
		expect(data.ratingInfo.collaborators).toEqual(["周祥"]);
		expect(data.distributionExceptionNote).toBe("审批分布异常说明");
		expect(data.employees.find((item) => item.id === "e1")).toMatchObject({
			submitScore: 91,
			submitLevel: "A",
			exceptionNote: "已复核",
		});
	});
});
