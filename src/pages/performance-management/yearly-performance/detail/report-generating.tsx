import { Empty } from "antd";
import { formatShortDateTime } from "../utils";

interface ReportGeneratingProps {
	/** 录音与转写上传存档时间（实际述职结束时间） */
	archivedTime?: string;
}

/**
 * 报告生成中
 *
 * - 已知存档时间（设计稿 19）：说明录音与转写的存档时间，以及千问办公评分、绿小服推送的后续流程；
 * - 存档时间未回传（设计稿 18）：空态插图 +「述职已结束，评分报告正在生成」。
 *
 * @param props - 组件属性
 * @param props.archivedTime - 录音与转写上传存档时间
 * @returns 报告生成中说明
 *
 * @since 2026-11-16
 */
export function ReportGenerating({ archivedTime }: ReportGeneratingProps) {
	const time = formatShortDateTime(archivedTime);
	if (!time) {
		return (
			<div className="flex h-full min-h-[480px] items-start justify-center rounded-md bg-white pt-[260px] shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
				<Empty
					image={Empty.PRESENTED_IMAGE_DEFAULT}
					description={
						<span className="text-base leading-6 text-[#606266]">
							述职已结束，评分报告正在生成
						</span>
					}
				/>
			</div>
		);
	}
	return (
		<div className="h-full min-h-[480px] rounded-md bg-white px-10 pt-[100px] shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
			<p className="m-0 text-base leading-6 text-[#323233]">述职已结束，评分报告正在生成</p>
			<p className="m-0 mt-1.5 text-sm leading-[22px] text-[#909399]">
				录音与转写于{time}
				完成上传存档。千问办公将结合「备课材料+录音转写+AI笔记」进行评分，生成后由绿小服自动推送至对应本体
			</p>
		</div>
	);
}
