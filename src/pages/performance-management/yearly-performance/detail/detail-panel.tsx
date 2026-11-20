import type { AppraisalUser } from "#src/api/performance-management/yearly-performance";
import type { DetailFooterState } from "./detail-footer";

import {
	AppraisalRecordStatus,
	AppraisalStatus,
} from "#src/api/performance-management/yearly-performance";
import { cn } from "#src/utils";
import { App, Empty, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { PersonAvatar } from "../components/person-avatar";
import { StatusTag } from "../components/status-tag";
import { DetailStep, STATUS_CURRENT_STEP } from "../constants";
import { useAppraisalUserDetail, useDocumentDownload } from "../hooks/use-yearly-report-queries";
import { formatDateWithWeekday } from "../utils";
import { DetailFooter } from "./detail-footer";
import { DetailSteps } from "./detail-steps";
import { DetailToolbar } from "./detail-toolbar";
import { PdfDocument } from "./pdf-document";
import { RecordingPanel } from "./recording-panel";
import { ReportGenerating } from "./report-generating";

/** 述职流程操作（由页面统一处理文件夹校验、防重复录制弹窗与刷新） */
export interface PresentationHandlers {
	/** 开始述职 */
	onStart: (user: AppraisalUser) => void;
	/** 追加录音 */
	onAppend: (user: AppraisalUser) => void;
	/** 重新开启 */
	onRedo: (user: AppraisalUser) => void;
	/** 结束录音 / 提交 */
	onEnd: (user: AppraisalUser) => void;
	/** 开始 / 追加提交中 */
	starting?: boolean;
	/** 重新开启提交中 */
	redoing?: boolean;
	/** 结束提交中 */
	ending?: boolean;
}

interface DetailPanelProps {
	/** 当前查看的述职人员（列表数据，详情加载前先渲染头部） */
	user: AppraisalUser;
	/** 是否全屏 */
	fullscreen: boolean;
	/** 切换全屏 */
	onFullscreenChange: (fullscreen: boolean) => void;
	/** 关闭详情 */
	onClose: () => void;
	/** 述职流程操作 */
	handlers: PresentationHandlers;
	/** 详情状态与列表不一致（后端已流转）时通知页面同步状态并刷新列表 */
	onStatusDrift: (status: AppraisalStatus) => void;
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
 * - 抽屉态：列表右侧并排展示（宽 625px，左侧 1px 描边），头部 + 三步流程 + 内容区（#F5F7FA 底、10px 内边距）+ 底栏；
 * - 全屏态：覆盖页面内容区，头部信息改为单行四列，流程条居中，内容区 24px 内边距；
 * - 内容随步骤切换：备课材料 PDF / 闪记录制结果 / 报告生成中 / 评分报告 PDF（设计稿 16–20）；
 * - 底栏随状态切换：开始述职 / 上一步 + 提交 / 下载报告，报告生成中无底栏。
 *
 * @param props - 组件属性
 * @param props.user - 当前查看的述职人员
 * @param props.fullscreen - 是否全屏
 * @param props.onFullscreenChange - 切换全屏
 * @param props.onClose - 关闭详情
 * @param props.handlers - 述职流程操作
 * @param props.onStatusDrift - 详情状态与列表不一致时通知页面刷新
 * @param props.initialStep - 打开时默认查看的步骤
 * @returns 详情面板
 *
 * @since 2026-11-16
 */
export function DetailPanel({
	user,
	fullscreen,
	onFullscreenChange,
	onClose,
	handlers,
	onStatusDrift,
	initialStep,
}: DetailPanelProps) {
	const { message } = App.useApp();
	const { data: queried, isError } = useAppraisalUserDetail(user.userId);
	// 切换人员时旧详情仍在缓存中，按 userId 校验避免串数据
	const detail = queried?.userId === user.userId ? queried : undefined;
	const status = detail?.appraisalStatus ?? user.appraisalStatus;
	const currentStep = STATUS_CURRENT_STEP[status];
	const download = useDocumentDownload();

	// 详情轮询发现状态已流转（如闪记回调、报告生成）时，通知页面刷新列表与统计
	useEffect(() => {
		if (detail && detail.appraisalStatus !== user.appraisalStatus) {
			onStatusDrift(detail.appraisalStatus);
		}
	}, [detail, user.appraisalStatus, onStatusDrift]);

	// 查看步骤与「人员 + 状态」绑定：切换人员或状态流转后回到当前步骤
	const viewKey = `${user.userId}-${status}`;
	const [viewing, setViewing] = useState<{ key: string; step: DetailStep }>();
	const viewingStep =
		viewing?.key === viewKey
			? viewing.step
			: (Math.min(initialStep ?? currentStep, currentStep) as DetailStep);
	const viewStep = (step: DetailStep) => setViewing({ key: viewKey, step });

	const reportUrl = detail?.evaluationReportUrl;
	const downloadReport =
		status === AppraisalStatus.READY && reportUrl
			? () =>
					download.mutate(
						{ url: reportUrl, fileName: `${user.userName}-述职综合评分报告.pdf` },
						{ onError: () => message.error("下载失败，请稍后重试") },
					)
			: undefined;

	const recorded = Boolean(
		detail?.appraisalRecords.some(
			(record) => record.status === AppraisalRecordStatus.COMPLETED,
		),
	);

	const footer: DetailFooterState | undefined = (() => {
		if (viewingStep === DetailStep.PREPARE && status === AppraisalStatus.PENDING) {
			return {
				type: "start",
				loading: handlers.starting,
				onStart: () => handlers.onStart(user),
			};
		}
		if (viewingStep === DetailStep.RECORDING && status === AppraisalStatus.IN_PROGRESS) {
			return {
				type: "submit",
				recorded,
				loading: handlers.ending,
				onPrev: () => viewStep(DetailStep.PREPARE),
				onSubmit: () => handlers.onEnd(user),
			};
		}
		if (viewingStep === DetailStep.REPORT && downloadReport) {
			return { type: "download", loading: download.isPending, onDownload: downloadReport };
		}
		return undefined;
	})();

	const renderBody = () => {
		if (isError) {
			return <Empty className="pt-24" description="详情加载失败，请稍后重试" />;
		}
		if (!detail) {
			return (
				<div className="flex h-full items-center justify-center">
					<Spin />
				</div>
			);
		}
		if (viewingStep === DetailStep.PREPARE) {
			return (
				<PdfDocument
					url={detail.materialUrl}
					title={`${user.userName}-述职备课材料`}
					emptyText="备课材料尚未从千问办公同步"
				/>
			);
		}
		if (viewingStep === DetailStep.RECORDING) {
			return (
				<RecordingPanel
					records={detail.appraisalRecords}
					editable={status === AppraisalStatus.IN_PROGRESS}
					redoing={handlers.redoing}
					appending={handlers.starting}
					onRedo={() => handlers.onRedo(user)}
					onAppend={() => handlers.onAppend(user)}
				/>
			);
		}
		if (status === AppraisalStatus.READY) {
			return (
				<PdfDocument
					url={reportUrl}
					title={`${user.userName}-述职综合评分报告`}
					emptyText="评分报告已生成，文件同步中"
				/>
			);
		}
		return <ReportGenerating archivedTime={detail.realEndTime} />;
	};

	const infoItems: InfoLineProps[] = [
		{ label: "管理者类别", value: user.jobType || "-" },
		{ label: "组织架构", value: user.orgName || "-" },
		{
			label: "述职日期",
			value: formatDateWithWeekday(detail?.appraisalDate ?? user.appraisalDate),
		},
		// 契约无工号字段，暂以所属文件夹（述职会）补位，见对接文档
		{ label: "所属文件夹", value: (detail?.folderName ?? user.folderName) || "未归入文件夹" },
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
					<PersonAvatar name={user.userName} size={32} fontSize={16} />
					<span className="min-w-0 truncate text-xl font-medium leading-8 text-[#323233]">
						{user.userName}
					</span>
					<StatusTag status={status} />
					<span className="flex-1" />
					<DetailToolbar
						fullscreen={fullscreen}
						downloading={download.isPending}
						onDownload={downloadReport}
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
						finished={status === AppraisalStatus.READY}
						viewingStep={viewingStep}
						onViewStepChange={viewStep}
					/>
				</div>
			</header>
			<div
				className={cn(
					"relative min-h-0 flex-1 overflow-y-auto bg-[#F5F7FA]",
					fullscreen ? "p-6" : "p-2.5",
				)}
			>
				{renderBody()}
			</div>
			{footer ? <DetailFooter state={footer} /> : null}
		</div>
	);
}
