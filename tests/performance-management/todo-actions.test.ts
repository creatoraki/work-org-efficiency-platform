import { RatingNodeType, RatingTodoStatus } from "#src/api/performance-management/todo/types";
import { resolveTodoActions } from "#src/pages/performance-management/annual-rating/rating-todo/config";
import { describe, expect, it } from "vitest";

/**
 * 取行操作文案
 *
 * @param nodeType - 节点类型
 * @param status - 待办状态
 * @returns 操作文案列表
 */
function labels(nodeType: RatingNodeType, status: RatingTodoStatus): string[] {
	return resolveTodoActions(nodeType, status).map((action) => action.label);
}

describe("评级待办行操作映射（对齐设计稿）", () => {
	it("自评节点：待完成填报，已完成查看", () => {
		expect(labels(RatingNodeType.SELF_EVAL, RatingTodoStatus.PENDING)).toEqual(["填报"]);
		expect(labels(RatingNodeType.SELF_EVAL, RatingTodoStatus.COMPLETED)).toEqual(["查看"]);
	});

	it("确认节点：待完成确认，已提交/已完成查看", () => {
		expect(labels(RatingNodeType.CONFIRM, RatingTodoStatus.PENDING)).toEqual(["确认"]);
		expect(labels(RatingNodeType.CONFIRM, RatingTodoStatus.SUBMITTED)).toEqual(["查看"]);
		expect(labels(RatingNodeType.CONFIRM, RatingTodoStatus.COMPLETED)).toEqual(["查看"]);
	});

	it("申诉节点：待完成处理，已完成查看", () => {
		expect(labels(RatingNodeType.APPEAL, RatingTodoStatus.PENDING)).toEqual(["处理"]);
		expect(labels(RatingNodeType.APPEAL, RatingTodoStatus.COMPLETED)).toEqual(["查看"]);
	});

	it("提报节点：待完成/被驳回填报，已提交/已完成查看", () => {
		expect(labels(RatingNodeType.SUBMIT, RatingTodoStatus.PENDING)).toEqual(["填报"]);
		expect(labels(RatingNodeType.SUBMIT, RatingTodoStatus.REJECTED)).toEqual(["填报"]);
		expect(labels(RatingNodeType.SUBMIT, RatingTodoStatus.SUBMITTED)).toEqual(["查看"]);
		expect(labels(RatingNodeType.SUBMIT, RatingTodoStatus.COMPLETED)).toEqual(["查看"]);
	});

	it("审批/审定节点：待完成/被驳回填报，已提交/已完成查看 + 提交版本", () => {
		for (const node of [RatingNodeType.APPROVE, RatingNodeType.FINALIZE]) {
			expect(labels(node, RatingTodoStatus.PENDING)).toEqual(["填报"]);
			expect(labels(node, RatingTodoStatus.REJECTED)).toEqual(["填报"]);
			expect(labels(node, RatingTodoStatus.SUBMITTED)).toEqual(["查看", "提交版本"]);
			expect(labels(node, RatingTodoStatus.COMPLETED)).toEqual(["查看", "提交版本"]);
		}
	});

	it("设计稿未覆盖的组合默认仅查看", () => {
		expect(labels(RatingNodeType.SELF_EVAL, RatingTodoStatus.SUBMITTED)).toEqual(["查看"]);
		expect(labels(RatingNodeType.APPEAL, RatingTodoStatus.REJECTED)).toEqual(["查看"]);
	});
});
