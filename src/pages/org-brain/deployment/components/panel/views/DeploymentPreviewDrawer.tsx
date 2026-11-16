/**
 * 排兵布阵预览抽屉
 *
 * 通过独立预览视图展示标杆项目与分析项目双栏对比
 * 下方展示实际矩阵及差异、最终方案选择
 */

import type { DeploymentDetail, DeploymentItem } from "#src/api/org-brain/deployment";
import type { ColumnsType } from "antd/es/table";
import type {
	ActualMatrixRow,
	SchemePersonnelRow,
	WorkExperienceItem,
} from "./deployment-preview-rows";

import {
	buildDeploymentSolutionStaffPayload,
	fetchDeploymentPlanPreviewDetail,
	formatDeploymentQualityScore,
} from "#src/api/org-brain/deployment";
import { message } from "#src/utils/static-antd";
import { useQuery } from "@tanstack/react-query";
import { Button, Drawer, Empty, Steps, Table, Tooltip, Typography } from "antd";

import { useMemo, useState } from "react";

import {
	FULLY_MERGEABLE_MATRIX_ELIGIBILITY,
	getMatrixMergeCellProps,
	getMatrixRowSpans,
	groupMatrixRowsForMerge,
} from "../config-matrix";
import { buildMatrixJobPositionSelectionLabel } from "../config-matrix/matrixJobPositionUtils";
import { SCHEME_LABEL } from "../constants";
import { submitDeploymentPlanPdfExport } from "./deployment-plan-pdf-export";
import {
	buildDeploymentPreviewSnapshot,
	resolveDeploymentPreviewOriginMatrixList,
} from "./deployment-preview-rows";
import { DeploymentMatrixPreviewView } from "./DeploymentMatrixPreviewView";

const { Text } = Typography;

/** 预览抽屉空状态最小高度（px），保证无数据时 Empty 组件垂直居中可感知 */
const PREVIEW_EMPTY_MIN_HEIGHT_PX = 400;

interface DeploymentPreviewDrawerProps {
	open: boolean;
	detail?: DeploymentDetail | null;
	project: DeploymentItem;
	onClose: () => void;
	/** 数据模式：preview 读取步骤流上下文；view 直接读取查看详情接口 */
	dataMode?: "preview" | "view";
	/** 抽屉标题，外部传入。默认「排兵布阵预览」 */
	title?: string;
}

/**
 * 渲染人员内部工作经历时间线。
 *
 * @param props - 组件属性
 * @param props.items - 已按预览口径归一化的工作经历列表
 * @returns 工作经历时间线节点
 * @author 王善能
 * @since 2026-06-12
 */
function WorkExperienceSteps({ items }: { items: WorkExperienceItem[] }) {
	if (!items?.length) return <Text type="secondary">/</Text>;
	return (
		<Steps
			direction="vertical"
			size="small"
			progressDot
			className="[&_.ant-steps-item-title]:!w-full [&_.ant-steps-item:last-child_.ant-steps-item-content]:!min-h-0"
			current={items.length}
			items={items.map((item, i) => ({
				key: i,
				title: (
					<div className="flex w-full items-start gap-2 text-xs">
						<span className="w-52 shrink-0 text-sm leading-5">
							{item.effectDate}至{item.endEffectDate}
						</span>
						<Tooltip title={item.deptfullname || item.firstDeptname || "/"}>
							<Text className="min-w-0 flex-1 text-sm leading-5" ellipsis>
								所属组织：
								{item.firstDeptname || "/"}
							</Text>
						</Tooltip>
						<Text
							className="w-40 shrink-0 text-sm leading-5"
							ellipsis={{ tooltip: item.postname || "/" }}
						>
							职位：
							{item.postname || "/"}
						</Text>
					</div>
				),
			}))}
		/>
	);
}

export function DeploymentPreviewDrawer({
	open,
	detail,
	project,
	onClose,
	dataMode = "preview",
	title = "排兵布阵预览",
}: DeploymentPreviewDrawerProps) {
	const [exportingPdf, setExportingPdf] = useState(false);
	const matrixConfig = detail?.projectPositionMatrixList ?? [];
	const directStaffList = detail?.staffList ?? [];
	const shouldUseDirectDetail = dataMode === "view";
	const selectedSolution = detail?.solutions?.find((solution) => solution.choice);
	const finalMatchScore = shouldUseDirectDetail
		? detail?.matchScore
		: selectedSolution?.matchScore;
	const previewStaffPayload = useMemo(() => {
		if (!selectedSolution) {
			return [];
		}
		return buildDeploymentSolutionStaffPayload(selectedSolution);
	}, [selectedSolution]);

	const previewStaffQueryEnabled =
		!shouldUseDirectDetail &&
		open &&
		!!detail?.requestId &&
		selectedSolution?.solutionNo != null &&
		previewStaffPayload.length > 0;
	const { data: previewDetail, isFetching: previewStaffLoading } = useQuery({
		queryKey: [
			"deployment-plan-preview-detail",
			project.id,
			detail?.requestId,
			selectedSolution?.solutionNo,
			previewStaffPayload,
		],
		queryFn: () =>
			fetchDeploymentPlanPreviewDetail(
				project.id,
				detail!.requestId!,
				selectedSolution!.solutionNo,
				previewStaffPayload,
			),
		enabled: previewStaffQueryEnabled,
	});
	const originMatrixList = useMemo(
		() =>
			resolveDeploymentPreviewOriginMatrixList(
				detail?.originProjectPositionMatrixList ?? [],
				previewDetail,
			),
		[detail?.originProjectPositionMatrixList, previewDetail],
	);
	const previewSnapshot = useMemo(
		() =>
			buildDeploymentPreviewSnapshot({
				matrixConfig,
				originMatrixList,
				selectedSolution,
				staffPreviewList: shouldUseDirectDetail
					? directStaffList
					: previewDetail?.staffList,
			}),
		[
			directStaffList,
			matrixConfig,
			originMatrixList,
			selectedSolution,
			previewDetail?.staffList,
			shouldUseDirectDetail,
		],
	);
	const schemePersonnelRows = previewSnapshot.schemePersonnelRows;
	// 后端 init 数据不保证按条线、编制分组连续排列，先做一次稳定分组排序，
	// 保证展示顺序与 rowSpan 合并算法所需的物理相邻前提一致
	const actualRows = useMemo(
		() => groupMatrixRowsForMerge(previewSnapshot.actualMatrixRows),
		[previewSnapshot.actualMatrixRows],
	);
	const spans = useMemo(
		() => getMatrixRowSpans(actualRows, FULLY_MERGEABLE_MATRIX_ELIGIBILITY),
		[actualRows],
	);

	const hasPreviewDetail = !!detail;

	const actualColumns: ColumnsType<ActualMatrixRow> = [
		{
			title: "条线",
			dataIndex: "departmentLine",
			width: 120,
			onCell: (_, i) => getMatrixMergeCellProps(spans, "departmentLine", i),
		},
		{
			title: "编制岗位",
			dataIndex: "authorizedJobName",
			width: 120,
			onCell: (_, i) => getMatrixMergeCellProps(spans, "authorizedJobName", i),
			render: (value) => value || "/",
		},
		{
			title: "岗位-职位-职级",
			key: "jobPositionLabel",
			width: 260,
			render: (_, row) => buildMatrixJobPositionSelectionLabel(row) || "/",
		},
		{ title: "人数（人）", dataIndex: "requiredCount", width: 100 },
		{
			title: "差异(实际-编制)",
			key: "diff",
			width: 120,
			render: (_, row) => {
				const d = row._diff ?? 0;
				if (d === 0) return <Text>0人</Text>;
				const isPos = d > 0;
				return (
					<Text style={{ color: isPos ? "#52c41a" : "#ff4d4f" }}>
						{isPos ? "+" : ""}
						{d}人
					</Text>
				);
			},
		},
	];

	const schemeColumns: ColumnsType<SchemePersonnelRow> = [
		{ title: "条线", dataIndex: "departmentLine", width: 120, ellipsis: true },
		{
			title: "编制岗位",
			dataIndex: "authorizedJobName",
			width: 120,
			ellipsis: true,
			render: (value) => value || "/",
		},
		{
			title: "岗位-职位-职级",
			key: "jobPositionLabel",
			width: 240,
			ellipsis: true,
			render: (_, row) => buildMatrixJobPositionSelectionLabel(row) || "/",
		},
		{ title: "人数（人）", dataIndex: "staffCount", width: 120 },
		{ title: "人员", dataIndex: "empName", width: 100 },
		{ title: "司龄", dataIndex: "cyear", width: 80 },
		{ title: "年龄", dataIndex: "age", width: 80 },
		{ title: "毕业学校", dataIndex: "graduationSchool", width: 150, ellipsis: true },
		{ title: "学历", dataIndex: "education", width: 100, ellipsis: true },
		{
			title: "工作经历(内部)",
			key: "workExperience",
			width: 800,
			render: (_, row) => <WorkExperienceSteps items={row.workExperience} />,
		},
	];

	/**
	 * 提交 PDF 导出任务。
	 *
	 * 只要当前预览存在方案数据即可导出。
	 * 方案人员明细允许为空，保持与预览展示口径一致。
	 *
	 * @returns Promise<void>
	 * @author 王善能
	 * @since 2026-06-12
	 */
	const handleDownloadPdf = async (): Promise<void> => {
		if (!detail) {
			message.warning("暂无可导出的方案数据");
			return;
		}
		setExportingPdf(true);
		try {
			await submitDeploymentPlanPdfExport(detail, project, dataMode, previewDetail);
			message.success("已加入导出中心，请到【文件中心】-【导出中心】查看进度");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "提交导出任务失败，请稍后重试";
			message.error(msg);
		} finally {
			setExportingPdf(false);
		}
	};

	return (
		<Drawer
			open={open}
			onClose={onClose}
			title={title}
			width="min(95vw, 1536px)"
			closable={{ placement: "end" }}
			styles={{ body: { padding: "24px", overflow: "auto" } }}
			footer={
				<div className="flex justify-end gap-2">
					<Button onClick={onClose}>关闭</Button>
					{hasPreviewDetail ? (
						<Button
							type="primary"
							loading={exportingPdf}
							onClick={() => void handleDownloadPdf()}
						>
							导出
						</Button>
					) : null}
				</div>
			}
		>
			{hasPreviewDetail ? (
				<>
					<DeploymentMatrixPreviewView
						detail={detail}
						project={project}
						matrix={previewSnapshot.matrixConfigRows}
					/>

					<div className="mt-6 space-y-6">
						{/* 实际矩阵及差异 */}
						<div>
							<div className="mb-3 flex items-center gap-2">
								<div className="h-4 w-1 rounded bg-[rgb(var(--oo-colorPrimary))]" />
								<Text strong>实际矩阵及差异</Text>
							</div>
							<Table<ActualMatrixRow>
								dataSource={actualRows}
								columns={actualColumns}
								rowKey="rowKey"
								size="small"
								pagination={false}
								bordered
								scroll={{ x: "max-content" }}
							/>
						</div>

						{/* 最终方案选择 */}
						{(selectedSolution || schemePersonnelRows.length > 0) && (
							<div>
								<div className="mb-3 flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="h-4 w-1 rounded bg-[rgb(var(--oo-colorPrimary))]" />
										<Text strong>
											{shouldUseDirectDetail
												? "最终方案选择"
												: selectedSolution
													? `最终方案选择——方案${
															SCHEME_LABEL[
																selectedSolution.solutionNo
															] ?? selectedSolution.solutionNo
														}`
													: "最终方案选择"}
										</Text>
									</div>
									{finalMatchScore != null ? (
										<Text>
											质量分：
											<Text strong>
												{formatDeploymentQualityScore(finalMatchScore)}
											</Text>
											分
										</Text>
									) : null}
								</div>
								<Table<SchemePersonnelRow>
									dataSource={schemePersonnelRows}
									columns={schemeColumns}
									rowKey="rowKey"
									size="small"
									pagination={false}
									bordered
									loading={previewStaffLoading}
									scroll={{ x: "max-content" }}
								/>
							</div>
						)}
					</div>
				</>
			) : (
				<div
					className="flex items-center justify-center"
					style={{ minHeight: PREVIEW_EMPTY_MIN_HEIGHT_PX }}
				>
					<Empty description="暂无排兵布阵数据" />
				</div>
			)}
		</Drawer>
	);
}
