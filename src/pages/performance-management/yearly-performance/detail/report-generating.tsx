import type { ReportGenerating as ReportGeneratingData } from "#src/api/performance-management/yearly-performance";

interface ReportGeneratingProps {
	/** 生成说明 */
	generating: ReportGeneratingData;
}

/**
 * 报告生成中说明
 *
 * 述职结束后评分报告 T+1 生成；完成后由绿小服自动推送对应 HRBP，无需人工确认归档。
 *
 * @param props - 组件属性
 * @param props.generating - 生成说明
 * @returns 说明卡片
 *
 * @since 2026-11-16
 */
export function ReportGenerating({ generating }: ReportGeneratingProps) {
	return (
		<div className="h-full min-h-[480px] rounded bg-white px-10 pt-[100px] shadow-[0_0_6px_0_rgba(0,0,0,0.06)]">
			<div className="flex flex-wrap items-center gap-1">
				<span className="text-base leading-6 text-[#323233]">
					述职已结束，评分报告正在生成
				</span>
				<span className="rounded-sm bg-[#F4EEFE] px-2 text-xs leading-6 text-[#A174F6]">
					预计
					{generating.expectFinishTime}
					前完成
				</span>
			</div>
			<p className="m-0 mt-1.5 text-sm leading-[22px] text-[#909399]">
				录音与转写于
				{generating.uploadFinishTime}
				完成上传存档。千问办公将结合「备课材料+录音转写+AI笔记」进行评分，报告为T+1时效、次日生成；生成后由绿小服自动推送至对应HRBP，无需人工确认归档。
			</p>
		</div>
	);
}
