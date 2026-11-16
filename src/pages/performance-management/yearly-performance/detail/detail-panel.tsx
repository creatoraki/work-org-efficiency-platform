import type {
	YearlyReportDocumentType,
	YearlyReportItem,
} from "#src/api/performance-management/yearly-performance";

import {
	downloadYearlyReportDocument,
	YearlyReportStatus,
} from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { useMutation } from "@tanstack/react-query";
import { App, Empty, Spin, Typography } from "antd";
import { useState } from "react";
import { PersonAvatar } from "../components/person-avatar";
import { StatusTag } from "../components/status-tag";
import { DetailStep, STATUS_CURRENT_STEP } from "../constants";
import { useYearlyReportDetail } from "../hooks/use-yearly-report-queries";
import { formatReportTimeRange } from "../utils";
import { DetailSteps } from "./detail-steps";
import { DetailToolbar } from "./detail-toolbar";
import { PrepMaterialDocument } from "./prep-material-document";
import { ReportGenerating } from "./report-generating";
import { ScaledCanvas } from "./scaled-canvas";
import { ScoreReportDocument } from "./score-report-document";
import { TranscriptWorkspace } from "./transcript-workspace";

interface DetailPanelProps {
	/** 当前查看的述职人员（列表数据，详情加载前先渲染头部） */
	item: YearlyReportItem;
	/** 是否全屏 */
	fullscreen: boolean;
	/** 切换全屏 */
	onFullscreenChange: (fullscreen: boolean) => void;
	/** 关闭详情 */
	onClose: () => void;
	/** 结束录音 */
	onFinishRecording: (item: YearlyReportItem) => void;
	/** 结束录音提交中 */
	finishing?: boolean;
	/** 打开时默认查看的步骤（如卡片「查看进度 / 查看报告」） */
	initialStep?: DetailStep;
}

interface InfoLineProps {
	/** 字段名 */
	label: string;
	/** 字段值 */
	value: string;
}

/**
 * 头部信息行：16px #606266，单行省略、悬浮显示全部
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @returns 信息行
 */
function InfoLine({ label, value }: InfoLineProps) {
	return (
		<Typography.Text
			className="!text-base !leading-6 !text-[#606266]"
			ellipsis={{ tooltip: `${label}：${value}` }}
		>
			{label}：{value}
		</Typography.Text>
	);
}

/**
 * 述职详情面板
 *
 * - 抽屉态：列表右侧并排展示（宽 625px，左侧 1px 描边），头部 + 三步流程 + 内容区（#F5F7FA 底、10px 内边距）；
 * - 全屏态：覆盖页面内容区，头部信息改为单行四列，流程条居中，内容区 24px 内边距；
 * - 内容区随步骤切换：备课材料 / 录音转写 / 报告生成中 / 评分报告，文档类内容适应宽度等比缩放。
 *
 * @param props - 组件属性
 * @param props.item - 当前查看的述职人员（列表数据，详情加载前先渲染头部）
 * @param props.fullscreen - 是否全屏
 * @param props.onFullscreenChange - 切换全屏
 * @param props.onClose - 关闭详情
 * @param props.onFinishRecording - 结束录音
 * @param props.finishing - 结束录音提交中
 * @param props.initialStep - 打开时默认查看的步骤（如卡片「查看进度 / 查看报告」）
 * @returns 详情面板
 *
 * @since 2026-11-16
 */
export function DetailPanel({
	item,
	fullscreen,
	onFullscreenChange,
	onClose,
	onFinishRecording,
	finishing,
	initialStep,
}: DetailPanelProps) {
	const { message } = App.useApp();
	const { data: detail, isError } = useYearlyReportDetail(item.reportId);
	const currentStep = STATUS_CURRENT_STEP[item.status];
	const finished = item.status === YearlyReportStatus.READY;

	// 查看步骤与「人员 + 状态」绑定：切换人员或状态流转后回到当前步骤
	const viewKey = `${item.reportId}-${item.status}`;
	const [viewing, setViewing] = useState<{ key: string; step: DetailStep }>();
	const viewingStep =
		viewing?.key === viewKey
			? viewing.step
			: (Math.min(initialStep ?? currentStep, currentStep) as DetailStep);

	// 各步骤均可下载：备课材料 / 录音转写；第 3 步报告未生成时下载已归档的录音转写
	const documentType: YearlyReportDocumentType | undefined = !detail
		? undefined
		: viewingStep === DetailStep.PREPARE
			? "prep"
			: viewingStep === DetailStep.REPORT && detail.scoreReport
				? "report"
				: detail.transcript
					? "transcript"
					: undefined;

	const download = useMutation({
		mutationFn: () => downloadYearlyReportDocument(item.reportId, documentType ?? "prep"),
		onSuccess: (fileName) => message.success(`已开始下载：${fileName}`),
		onError: (error: Error) => message.error(error.message || "下载失败"),
	});

	// 详情与列表状态短暂不一致时（如刚开始述职），以详情数据是否齐全兜底
	const renderBody = () => {
		if (isError) {
			return <Empty className="pt-24" description="详情加载失败，请稍后重试" />;
		}
		if (!detail || detail.reportId !== item.reportId) {
			return (
				<div className="flex h-full items-center justify-center">
					<Spin />
				</div>
			);
		}
		if (viewingStep === DetailStep.PREPARE) {
			return (
				<div className="rounded-md bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
					<ScaledCanvas>
						<PrepMaterialDocument material={detail.prepMaterial} />
					</ScaledCanvas>
				</div>
			);
		}
		if (viewingStep === DetailStep.RECORDING) {
			return detail.transcript ? (
				<ScaledCanvas fillHeight>
					<TranscriptWorkspace
						key={item.reportId}
						transcript={detail.transcript}
						recordable={item.status === YearlyReportStatus.IN_PROGRESS}
						finishing={finishing}
						onFinish={() => onFinishRecording(item)}
					/>
				</ScaledCanvas>
			) : (
				<Empty className="pt-24" description="述职尚未开始，暂无录音转写" />
			);
		}
		if (detail.scoreReport) {
			return (
				<div className="rounded-md bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
					<ScaledCanvas>
						<ScoreReportDocument
							report={detail.scoreReport}
							onViewTranscript={() =>
								setViewing({ key: viewKey, step: DetailStep.RECORDING })
							}
						/>
					</ScaledCanvas>
				</div>
			);
		}
		return detail.generating ? <ReportGenerating generating={detail.generating} /> : null;
	};

	const infoItems: InfoLineProps[] = [
		{ label: "管理者类别", value: item.managerCategory },
		{ label: "组织架构", value: item.orgPath },
		{
			label: "述职日期",
			value: formatReportTimeRange(item.reportStartTime, item.reportEndTime),
		},
		{ label: "工号", value: item.userCode },
	];

	return (
		<div
			className={cn(
				"flex h-full min-h-0 flex-col bg-white",
				fullscreen ? "" : "border-0 border-l border-solid border-[#E4E7ED]",
			)}
		>
			<header
				className={cn(
					"shrink-0 px-6 pb-[11px] pt-3",
					fullscreen ? "" : "border-0 border-b border-solid border-[#E4E7ED]",
				)}
			>
				<div className="flex h-8 items-center gap-2">
					<PersonAvatar name={item.userName} src={item.avatar} size={32} fontSize={16} />
					<span className="min-w-0 truncate text-xl font-medium leading-8 text-[#323233]">
						{item.userName}
					</span>
					<StatusTag status={item.status} />
					<span className="flex-1" />
					<DetailToolbar
						fullscreen={fullscreen}
						downloadable={Boolean(documentType)}
						downloading={download.isPending}
						onDownload={() => download.mutate()}
						onToggleFullscreen={() => onFullscreenChange(!fullscreen)}
						onClose={onClose}
					/>
				</div>
				<div
					className={cn(
						"mt-1.5 grid gap-x-6",
						fullscreen ? "grid-cols-4" : "grid-cols-2 gap-y-1.5",
					)}
				>
					{infoItems.map((info) => (
						<InfoLine key={info.label} {...info} />
					))}
				</div>
				<div className="mt-3">
					<DetailSteps
						currentStep={currentStep}
						finished={finished}
						viewingStep={viewingStep}
						onViewStepChange={(step) => setViewing({ key: viewKey, step })}
					/>
				</div>
			</header>
			<div
				className={cn(
					"relative min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA]",
					fullscreen ? "p-6" : "p-2.5",
					// 录音转写工作区自身撑满高度，不需要外层滚动
					viewingStep === DetailStep.RECORDING && "overflow-hidden",
				)}
			>
				{renderBody()}
			</div>
		</div>
	);
}
