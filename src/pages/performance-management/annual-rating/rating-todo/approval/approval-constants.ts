import type { ThemeConfig } from "antd";

import { ApprovalCheckStatus } from "#src/api/performance-management/approval";
import { RatingTodoStatus } from "#src/api/performance-management/todo";

/** 岗位类别筛选项 */
export const POSITION_CATEGORY_OPTIONS = [
	"职能员工",
	"项目员工(其他)",
	"项目员工(安全)",
	"项目员工(保洁绿化)",
].map((value) => ({ label: value, value }));

/** 在职状态筛选项 */
export const EMPLOYMENT_OPTIONS = ["在职", "离职"].map((value) => ({ label: value, value }));

/** 提报等级筛选项 */
export const SUBMIT_LEVEL_OPTIONS = ["A", "B+", "B", "C/D"].map((value) => ({
	label: value,
	value,
}));

/** 校验情况筛选项 */
export const CHECK_STATUS_FILTER_OPTIONS = [
	{ label: "正常", value: ApprovalCheckStatus.NORMAL },
	{ label: "预警/差2级", value: ApprovalCheckStatus.WARNING },
];

/**
 * 状态圆点与文字配色
 *
 * 设计稿中「已提交」与「已完成」同为绿色，「被驳回」红色，「待完成」橙色。
 *
 * @param status - 状态文案
 * @returns 十六进制颜色值
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function approvalStatusColor(status: string) {
	if (status === RatingTodoStatus.COMPLETED || status === RatingTodoStatus.SUBMITTED) {
		return "#14B968";
	}
	if (status === RatingTodoStatus.REJECTED) {
		return "#F5222D";
	}
	return "#FF7D00";
}

/**
 * 等级分布异常校验配色
 *
 * 设计稿口径：超X 红色、少X 橙色、正常绿色。
 *
 * @param value - 校验结果文案
 * @returns 十六进制颜色值
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function distributionCheckColor(value: string) {
	if (value.startsWith("超")) {
		return "#F5222D";
	}
	if (value.startsWith("少")) {
		return "#FF7D00";
	}
	return "#14B968";
}

/**
 * 状态标签配色
 *
 * @param status - 状态文案
 * @returns Tailwind 背景与文字色类名
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function approvalStatusTagClass(status: string) {
	if (status === RatingTodoStatus.REJECTED) {
		return "bg-[#FEE4E6] text-[#F5222D]";
	}
	if (status === RatingTodoStatus.COMPLETED || status === RatingTodoStatus.SUBMITTED) {
		return "bg-[#E3F7ED] text-[#14B968]";
	}
	return "bg-[#FFEFE0] text-[#FF7D00]";
}

/** 等级分布基准规则文案（与设计稿逐字一致） */
export const DISTRIBUTION_BASIS_RULE =
	"基准规则：（1）岗位类别人数>7人，为A≤10%、A和B+≤30%、C/D≥10%；（2）岗位类别人数≤7，A≤1,A和B+≤30%，C和D不做强制要求";

/**
 * 审批抽屉内表格的 Ant Design 主题
 *
 * 设计稿口径：行高 36px（14px/22px + 上下 7px）、表头 #323233 Medium、
 * 表体 #606266、边框 #E4E7ED、表头底色 #F0F2F5。
 */
export const APPROVAL_TABLE_THEME: ThemeConfig = {
	components: {
		Table: {
			headerBg: "#F0F2F5",
			headerColor: "#323233",
			borderColor: "#E4E7ED",
			colorText: "#606266",
			cellPaddingBlock: 7,
			cellPaddingBlockMD: 7,
			cellPaddingBlockSM: 7,
			cellPaddingInline: 12,
			cellPaddingInlineMD: 12,
			cellPaddingInlineSM: 12,
		},
	},
};

/** 表头字重统一为 Medium */
export const APPROVAL_TABLE_CLASS =
	"[&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:whitespace-nowrap";
