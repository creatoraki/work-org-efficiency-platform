import type { ReportTranscript } from "#src/api/performance-management/yearly-performance";

import { Tooltip } from "antd";
import { FolderClosed, Mic, Pencil, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "../utils";

interface TranscriptWorkspaceProps {
	/** 录音转写数据 */
	transcript: ReportTranscript;
	/** 是否允许录音（仅「述职中」允许，其他状态只读回看） */
	recordable: boolean;
	/** 结束述职录音 */
	onFinish: () => void;
	/** 结束录音提交中 */
	finishing?: boolean;
}

/** 卡片外观：白底 6px 圆角 + 轻投影 */
const PANEL_CLASS = "flex min-h-0 flex-col rounded-md bg-white shadow-[0_0_6px_0_rgba(0,0,0,0.06)]";

/**
 * 述职中 · 录音转写工作区（原生宽度 880px，由 ScaledCanvas 适应宽度缩放）
 *
 * 左侧「转写」实时逐条展示发言（时间 / 发言人 / 角色 / 内容），右侧「实时总结」展示 AI 提炼的要点；
 * 底部悬浮录音条：计时、编辑转写、导入录音、开始 / 结束述职录音。
 *
 * @param props - 组件属性
 * @param props.transcript - 录音转写数据
 * @param props.recordable - 是否允许录音（仅「述职中」允许，其他状态只读回看）
 * @param props.onFinish - 结束述职录音
 * @param props.finishing - 结束录音提交中
 * @returns 录音转写工作区
 *
 * @since 2026-11-16
 */
export function TranscriptWorkspace({
	transcript,
	recordable,
	onFinish,
	finishing,
}: TranscriptWorkspaceProps) {
	const [recording, setRecording] = useState(false);
	const [elapsed, setElapsed] = useState(transcript.durationSeconds);

	useEffect(() => {
		if (!recording) {
			return undefined;
		}
		const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
		return () => window.clearInterval(timer);
	}, [recording]);

	const volumePercent = Math.round(Math.min(1, Math.max(0, transcript.inputVolume)) * 100);

	return (
		<div className="flex h-full flex-col">
			<div className="flex min-h-0 flex-1 gap-4">
				{/* 转写 */}
				<div className={`${PANEL_CLASS} flex-[2.06]`}>
					<div className="flex h-[37px] shrink-0 items-center justify-between border-0 border-b border-solid border-[#EEF0F4] px-[26px] text-[13px]">
						<span className="font-semibold text-[#1B1F26]">转写</span>
						<span className="flex items-center gap-2 text-[11px] text-[#8A919F]">
							输入音量
							<span className="relative h-1 w-[46px] rounded-full bg-[#EEF0F4]">
								<span
									className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-[#14B968]"
									style={{ left: `calc(${volumePercent}% - 3px)` }}
								/>
							</span>
							<span className="ml-2">{transcript.segments.length} 条</span>
						</span>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-4 pt-[18px]">
						{transcript.segments.map((segment) => (
							<div
								key={`${segment.time}-${segment.text}`}
								className="mb-[13px] flex gap-[19px]"
							>
								<span className="w-[26px] shrink-0 pt-px text-[11px] leading-5 text-[#8A919F]">
									{segment.time}
								</span>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2 leading-5">
										<span className="text-xs font-semibold text-[#246AF8]">
											{segment.speaker}
										</span>
										<span className="rounded-sm bg-[#F2F3F5] px-1 text-[10px] leading-4 text-[#8A919F]">
											{segment.role}
										</span>
									</div>
									<p className="m-0 mt-0.5 text-xs leading-5 text-[#1B1F26]">
										{segment.text}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* 实时总结 */}
				<div className={`${PANEL_CLASS} flex-1`}>
					<div className="flex h-[37px] shrink-0 items-center justify-between px-[24px] text-[13px]">
						<span className="font-semibold text-[#1B1F26]">实时总结</span>
						<span className="flex items-center gap-1 rounded bg-[#FDF0E3] px-1.5 text-[11px] font-medium leading-[18px] text-[#F08A24]">
							<span className="size-1 rounded-full bg-current" />
							已生成 {transcript.summaries.length} 条
						</span>
					</div>
					<div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-y-auto px-[20px] pt-[14px]">
						{transcript.summaries.map((summary) => (
							<div
								key={summary.title}
								className="rounded-md border border-solid border-[#EEF0F4] bg-[#FCFCFE] px-5 py-3.5"
							>
								<div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7B5CF5]">
									<span className="flex size-3 items-center justify-center rounded-full border border-solid border-current text-[7px] leading-none">
										≡
									</span>
									{summary.title}
								</div>
								<p className="m-0 mt-2.5 text-xs leading-5 text-[#1B1F26]">
									{summary.content}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* 录音条 */}
			<div className="flex shrink-0 justify-center pb-[78px] pt-4">
				<div className="flex h-14 items-center rounded-full bg-white pl-[21px] pr-[7px] shadow-[0_2px_10px_0_rgba(0,0,0,0.06)]">
					<span className="w-[68px] text-base tabular-nums text-[#606266]">
						{formatDuration(elapsed)}
					</span>
					<Tooltip title="编辑转写">
						<button
							type="button"
							className="ml-[25px] flex size-6 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[#606266] hover:text-[#0075FF]"
						>
							<Pencil className="size-[18px]" strokeWidth={1.5} />
						</button>
					</Tooltip>
					<Tooltip title="导入录音文件">
						<button
							type="button"
							className="ml-6 flex size-6 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[#606266] hover:text-[#0075FF]"
						>
							<FolderClosed className="size-[18px]" strokeWidth={1.5} />
						</button>
					</Tooltip>
					{recording ? (
						<button
							type="button"
							disabled={finishing}
							onClick={onFinish}
							className="ml-[15px] flex h-[39px] w-[169px] cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[#F5222D] text-[15px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Square className="size-3.5" fill="currentColor" strokeWidth={0} />
							结束述职录音
						</button>
					) : (
						<button
							type="button"
							disabled={!recordable}
							onClick={() => setRecording(true)}
							className="ml-[15px] flex h-[39px] w-[169px] cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-[#0075FF] text-[15px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<Mic className="size-4" strokeWidth={2} />
							开始述职录音
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
