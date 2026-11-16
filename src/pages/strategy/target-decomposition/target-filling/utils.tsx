import type { SubmitUserTask } from "#src/api/strategy/target-filling/types";
import type { FillingStatus, PlanTypeKey, StatisticsData, TabType } from "./types";
import { Button, Space, Tag } from "antd";
import dayjs from "dayjs";
import React from "react";

// 状态颜色常量
export const STATUS_COLORS: Record<FillingStatus, string> = {
	0: "rgba(255, 125, 0, 1)", // 未完成
	1: "rgba(0, 117, 255, 1)", // 进行中
	2: "rgba(20, 185, 104, 1)", // 已完成
	3: "rgba(20, 185, 104, 1)", // 已提交
	4: "rgba(192, 196, 204, 1)", // 已停用
};

export const PLAN_TYPE_OPTIONS = [
	{ key: "all", label: "全部" },
	{ key: "notSubmitted", label: "未提交" },
	{ key: "inProgress", label: "进行中" },
	{ key: "finished", label: "已完成" },
	{ key: "disabled", label: "已停用" },
] as const;

function normalizeDateTime(value: string | Record<string, unknown> | undefined): string {
	return typeof value === "string" ? value : "";
}

// 逾期检查
export function checkOverdue(deadline: string | Record<string, unknown> | undefined): boolean {
	const deadlineText = normalizeDateTime(deadline);
	if (!deadlineText) return false;
	return dayjs().startOf("day").isAfter(dayjs(deadlineText).startOf("day"));
}

// 构建填报页面 URL
export function buildFillingPageUrl(record: SubmitUserTask): string {
	const params = new URLSearchParams({
		planId: String(record.id),
		planName: record.name,
		targetCycle: record.targetCycle || "",
		updateTime: normalizeDateTime(record.updateTime),
		remark: record.remark || "",
		responsibleUserId: record.responsibleUserId.toString() || "",
	});
	return `/strategy/target-decomposition/single-filling?${params}`;
}

// 获取统计数量
export function getStatisticCount(
	activeTab: TabType,
	key: PlanTypeKey,
	statistics: StatisticsData,
): number {
	if (activeTab === 1) {
		switch (key) {
			case "all":
				return statistics.ownAll || 0;
			case "notSubmitted":
				return statistics.ownUnSubmitCount || 0;
			case "inProgress":
				return statistics.ownProcessingCount || 0;
			case "finished":
				return statistics.ownCompletedCount || 0;
			case "disabled":
				return statistics.ownTopCount || 0;
			default:
				return 0;
		}
	} else if (activeTab === 2) {
		switch (key) {
			case "all":
				return statistics.otherAll || 0;
			case "notSubmitted":
				return statistics.otherUnSubmitCount || 0;
			case "inProgress":
				return statistics.otherProcessingCount || 0;
			case "finished":
				return statistics.otherCompletedCount || 0;
			case "disabled":
				return statistics.otherTopCount || 0;
			default:
				return 0;
		}
	} else {
		// 总计划
		switch (key) {
			case "all":
				return (statistics.ownAll || 0) + (statistics.otherAll || 0);
			case "notSubmitted":
				return (statistics.ownUnSubmitCount || 0) + (statistics.otherUnSubmitCount || 0);
			case "inProgress":
				return (
					(statistics.ownProcessingCount || 0) + (statistics.otherProcessingCount || 0)
				);
			case "finished":
				return (statistics.ownCompletedCount || 0) + (statistics.otherCompletedCount || 0);
			case "disabled":
				return (statistics.ownTopCount || 0) + (statistics.otherTopCount || 0);
			default:
				return 0;
		}
	}
}

// 渲染状态列
export function renderStatusColumn(v: string, r: SubmitUserTask) {
	const dot = (
		<span
			style={{
				width: 8,
				height: 8,
				borderRadius: 8,
				background: STATUS_COLORS[r.fillingStatus as FillingStatus] || STATUS_COLORS[0],
				display: "inline-block",
			}}
		/>
	);
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: 8,
				color: r.fillingStatus === 4 ? "rgba(192, 196, 204, 1)" : "black",
			}}
		>
			{dot}
			<span>{r.fillingStatusStr}</span>
		</span>
	);
}

// 渲染有效期列
export function renderDeadlineColumn(_: any, record: any) {
	const startTime = normalizeDateTime(record.startTime);
	const deadline = normalizeDateTime(record.deadline);
	const start = startTime ? startTime.split(" ")[0] : "";
	const end = deadline ? deadline.split(" ")[0] : "";
	const isOverdue = checkOverdue(record.deadline);
	const text = start && end ? `${start} ~ ${end}` : start || end || "-";

	return (
		<Space>
			<span>{text}</span>
			{isOverdue && (
				<Tag color="error" style={{ margin: 0 }}>
					逾期
				</Tag>
			)}
		</Space>
	);
}

// 渲染操作按钮
export function renderActionButtons(
	record: SubmitUserTask,
	context: {
		modal: any;
		navigate: any;
		refreshTable: () => void;
		splitNode: React.ReactNode;
		onFollowClick: (record: SubmitUserTask) => void;
	},
) {
	const { modal, navigate, refreshTable, splitNode, onFollowClick } = context;
	const status = record.fillingStatus;
	const isOverdue = checkOverdue(record.deadline);

	let showFill = false;
	let showView = false;
	let showAdjust = false;
	const showFollow = true;

	if (status === 0) {
		// 未提交
		if (!isOverdue) {
			showFill = true;
		}
	} else if (status === 1) {
		// 进行中
		showView = true;
		if (!isOverdue) {
			showAdjust = true;
		}
	} else if (status === 4) {
		// 已停用
		showView = true;
	} else {
		// 已完成/已提交/已停用
		showView = true;
		showFill = true;
	}

	return (
		<Space split={splitNode}>
			{showFill && (
				<Button
					type="link"
					size="small"
					onClick={() => navigate(buildFillingPageUrl(record))}
				>
					填报
				</Button>
			)}
			{showView && (
				<Button
					type="link"
					size="small"
					onClick={() =>
						modal.open("plan.viewData", { record, afterClose: refreshTable, type: 1 })
					}
				>
					查看数据
				</Button>
			)}
			{showAdjust && (
				<Button
					type="link"
					size="small"
					onClick={() => navigate(buildFillingPageUrl(record))}
				>
					调整目标
				</Button>
			)}
			{showFollow && (
				<Button type="link" size="small" onClick={() => onFollowClick(record)}>
					目标跟进
				</Button>
			)}
		</Space>
	);
}
