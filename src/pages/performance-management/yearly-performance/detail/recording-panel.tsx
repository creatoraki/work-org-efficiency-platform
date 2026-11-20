import type { AppraisalRecord } from "#src/api/performance-management/yearly-performance";

import { AppraisalRecordStatus } from "#src/api/performance-management/yearly-performance";
import { Button, Empty } from "antd";
import { RotateCcw, Volume2 } from "lucide-react";
import { formatDuration, formatShortDateTime } from "../utils";

/** AI 听记任务状态文案 */
const RECORD_STATUS_LABEL: Record<string, string> = {
	[AppraisalRecordStatus.INIT]: "待录制",
	[AppraisalRecordStatus.RECORDING]: "录制中",
	[AppraisalRecordStatus.PAUSED]: "已暂停",
	[AppraisalRecordStatus.COMPLETED]: "已完成",
};

/** 设计稿 17 描边按钮：主色描边与文字，16px 字号 */
const OUTLINE_BUTTON_CLASS =
	"!h-8 !border-[#0075FF] !px-[15px] !text-base !text-[#0075FF] [&_svg]:size-4";

interface RecordingPanelProps {
	/** AI 听记记录 */
	records: AppraisalRecord[];
	/** 是否处于「述职中」（可重新开启 / 追加录音） */
	editable: boolean;
	/** 重新开启中 */
	redoing?: boolean;
	/** 追加录音中 */
	appending?: boolean;
	/** 重新开启：丢弃已录制内容重新录制 */
	onRedo: () => void;
	/** 追加录音：在已有闪记基础上继续录制 */
	onAppend: () => void;
}

/**
 * 闪记名称列表文案
 *
 * @param records - 已完成的记录
 * @returns 以顿号分隔的名称
 */
function joinTitles(records: AppraisalRecord[]) {
	return records.map((record) => record.title || "未命名闪记").join("、");
}

/**
 * 述职中 · 录音转写
 *
 * 录音由钉钉 AI 听记（闪记）完成，平台通过回调同步记录，这里只展示录制结果与后续操作：
 * - 述职中且已有录制完成的闪记（设计稿 17）：「已完成并生成闪记，结束可提交，或『重新开启』或『追加录音』」+ 闪记名称；
 * - 述职中但尚无完成的闪记：提示录制进行中，展示当前闪记状态（设计稿未单独出图，沿用 17 的版式）；
 * - 述职结束后回看：展示已归档的闪记列表（时长、起止时间、音频）。
 *
 * @param props - 组件属性
 * @param props.records - AI 听记记录
 * @param props.editable - 是否处于「述职中」
 * @param props.redoing - 重新开启中
 * @param props.appending - 追加录音中
 * @param props.onRedo - 重新开启
 * @param props.onAppend - 追加录音
 * @returns 录音转写面板
 *
 * @since 2026-11-20
 */
export function RecordingPanel({
	records,
	editable,
	redoing,
	appending,
	onRedo,
	onAppend,
}: RecordingPanelProps) {
	const completed = records.filter((record) => record.status === AppraisalRecordStatus.COMPLETED);
	const current = records.find((record) => record.status !== AppraisalRecordStatus.COMPLETED);

	const renderBody = () => {
		if (editable && completed.length) {
			return (
				<>
					<div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-base leading-6 text-[#323233]">
						<span>已完成并生成闪记，结束可提交，或</span>
						<Button
							className={OUTLINE_BUTTON_CLASS}
							icon={<RotateCcw strokeWidth={1.75} />}
							loading={redoing}
							onClick={onRedo}
						>
							重新开启
						</Button>
						<span>或</span>
						<Button
							className={OUTLINE_BUTTON_CLASS}
							icon={<Volume2 strokeWidth={1.75} />}
							loading={appending}
							onClick={onAppend}
						>
							追加录音
						</Button>
					</div>
					<p className="m-0 mt-6 text-base leading-6 text-[#323233]">
						已生成的闪记名称：{joinTitles(completed)}
					</p>
				</>
			);
		}
		if (editable) {
			return (
				<>
					<p className="m-0 text-base leading-6 text-[#323233]">
						AI 听记录制中，录制完成并生成闪记后即可提交
					</p>
					<p className="m-0 mt-2 text-sm leading-[22px] text-[#909399]">
						{current
							? `当前闪记：${current.title || "未命名闪记"}（${RECORD_STATUS_LABEL[current.status ?? ""] ?? "同步中"}）`
							: "正在等待钉钉闪记同步录制状态…"}
					</p>
				</>
			);
		}
		if (!records.length) {
			return <Empty description="暂无录音记录" />;
		}
		return (
			<>
				<p className="m-0 text-base leading-6 text-[#323233]">录音与转写已上传存档</p>
				<ul className="m-0 mt-4 list-none p-0">
					{records.map((record) => (
						<li
							key={record.id}
							className="flex items-center gap-4 border-0 border-b border-solid border-[#EBEEF5] py-3 text-sm leading-[22px]"
						>
							<span
								className="min-w-0 flex-1 truncate text-[#323233]"
								title={record.title}
							>
								{record.title || "未命名闪记"}
							</span>
							<span className="shrink-0 text-[#909399]">
								{[
									formatShortDateTime(record.startTime),
									formatShortDateTime(record.endTime),
								]
									.filter(Boolean)
									.join(" — ")}
							</span>
							<span className="w-16 shrink-0 text-right text-[#606266]">
								{formatDuration(record.duration)}
							</span>
							{record.url ? (
								<a
									className="shrink-0 text-[#0075FF]"
									href={record.url}
									target="_blank"
									rel="noopener noreferrer"
								>
									收听录音
								</a>
							) : null}
						</li>
					))}
				</ul>
			</>
		);
	};

	return (
		<div className="h-full min-h-[480px] rounded-md bg-white px-10 pt-[100px] shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
			{renderBody()}
		</div>
	);
}
