import type { ScoreReport } from "#src/api/performance-management/yearly-performance";
import type { ReactNode } from "react";

import { cn } from "#src/utils";
import { Check, ChevronRight } from "lucide-react";
import { DOC_COLORS, DocSection, DocShell, PurpleTag } from "./doc-primitives";

interface ScoreReportDocumentProps {
	/** 评分报告 */
	report: ScoreReport;
	/** 点击「查看完整转写」 */
	onViewTranscript?: () => void;
}

/**
 * 综合得分环形图
 *
 * @param props - 组件属性
 * @param props.score - 综合得分（0-100）
 * @returns 环形图
 */
function ScoreRing({ score }: { score: number }) {
	const size = 116;
	const stroke = 9;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	return (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="#EEF2FA"
					strokeWidth={stroke}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={DOC_COLORS.blue}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${(circumference * score) / 100} ${circumference}`}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span
					className="text-[28px] font-semibold leading-8"
					style={{ color: DOC_COLORS.title }}
				>
					{score}
				</span>
				<span className="mt-1 text-xs" style={{ color: DOC_COLORS.muted }}>
					综合得分
				</span>
			</div>
		</div>
	);
}

/**
 * 高亮综合结论中的「前 N%」
 *
 * @param text - 结论原文
 * @returns 渲染节点
 */
function renderConclusion(text: string): ReactNode {
	// 片段顺序固定，用累计偏移量作为稳定 key（片段文本可能重复）
	let offset = 0;
	return text.split(/(前 \d+%)/).map((part) => {
		const key = offset;
		offset += part.length;
		return /^前 \d+%$/.test(part) ? (
			<strong key={key} className="font-semibold" style={{ color: DOC_COLORS.green }}>
				{part}
			</strong>
		) : (
			<span key={key}>{part}</span>
		);
	});
}

/**
 * 述职综合评分报告文档
 *
 * 版式按设计稿：综合评分概览（环形得分 + 结论 + 指标）→ 评分构成 / 述职表现评价 → 千问办公综合评语 → 述职过程关键节点。
 *
 * @param props - 组件属性
 * @param props.report - 评分报告
 * @param props.onViewTranscript - 查看完整转写
 * @returns 文档
 *
 * @since 2026-11-16
 */
export function ScoreReportDocument({ report, onViewTranscript }: ScoreReportDocumentProps) {
	const metrics = [
		{ label: "同层级排名", value: report.rankPercent, unit: "%" },
		{ label: "录音时长", value: report.recordDuration },
		{ label: "AI 笔记", value: String(report.aiNoteCount), unit: " 条" },
		{ label: "评委追问", value: String(report.followUpCount), unit: " 次" },
	];

	return (
		<DocShell
			title="述职综合评分报告"
			subtitleParts={[report.subtitle, report.meetingName, report.meetingTime]}
			paddingX={29}
		>
			<DocSection
				className="mt-[39px]"
				size="lg"
				accent="green"
				title="一、综合评分概览"
				extra={<PurpleTag>千问办公 · 备课材料 + 录音转写</PurpleTag>}
				right={report.generatedText}
			>
				<div className="mt-[45px] flex gap-7 px-4">
					<ScoreRing score={report.totalScore} />
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-3">
							<span
								className="text-[15px] font-semibold"
								style={{ color: DOC_COLORS.title }}
							>
								{report.personTitle}
							</span>
							<span
								className="rounded px-2 py-0.5 text-xs font-semibold"
								style={{ color: DOC_COLORS.green, backgroundColor: "#E7F7EF" }}
							>
								建议评级 {report.suggestedGrade}
							</span>
						</div>
						<p
							className="m-0 mt-2.5 text-[13px] leading-[21px]"
							style={{ color: DOC_COLORS.muted }}
						>
							{renderConclusion(report.conclusion)}
						</p>
						<div className="mt-3 flex gap-8">
							{metrics.map((metric) => (
								<div key={metric.label} className="flex flex-col gap-2">
									<span className="text-xs" style={{ color: DOC_COLORS.muted }}>
										{metric.label}
									</span>
									<span
										className="text-sm font-semibold"
										style={{ color: DOC_COLORS.title }}
									>
										{metric.value}
										{metric.unit ? (
											<span className="text-xs font-normal">
												{metric.unit}
											</span>
										) : null}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</DocSection>

			<div className="mt-12 grid grid-cols-2 gap-3">
				<DocSection title="评分构成" right="满分 100">
					<div className="mt-[31px] flex flex-col gap-4 px-3.5">
						{report.components.map((item) => (
							<div
								key={item.name}
								className="flex h-[21px] items-center gap-4 text-[13px]"
							>
								<span className="w-14 shrink-0" style={{ color: DOC_COLORS.text }}>
									{item.name}
								</span>
								<span
									className="w-8 shrink-0 text-xs"
									style={{ color: DOC_COLORS.muted }}
								>
									{item.weight}
								</span>
								<span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F6]">
									<span
										className="block h-full rounded-full bg-gradient-to-r from-[#5B95FA] to-[#246AF8]"
										style={{ width: `${item.score}%` }}
									/>
								</span>
								<span
									className="w-8 shrink-0 text-right font-semibold"
									style={{ color: DOC_COLORS.title }}
								>
									{item.score}
								</span>
							</div>
						))}
					</div>
				</DocSection>

				<DocSection title="述职表现评价" accent="orange">
					<div className="mt-3.5 grid grid-cols-2">
						{[
							{
								title: "亮点",
								color: DOC_COLORS.green,
								items: report.highlights,
								good: true,
							},
							{
								title: "待改进",
								color: DOC_COLORS.orange,
								items: report.improvements,
								good: false,
							},
						].map((group, groupIndex) => (
							<div
								key={group.title}
								className={cn(
									"px-3.5",
									groupIndex > 0 &&
										"border-0 border-l border-solid border-[#EBEEF3]",
								)}
							>
								<div
									className="text-[13px] font-semibold"
									style={{ color: group.color }}
								>
									{group.title}
								</div>
								<ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
									{group.items.map((text) => (
										<li
											key={text}
											className="flex gap-2 text-[13.5px] leading-[26px]"
										>
											<span
												className="mt-[5px] flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
												style={{
													color: group.color,
													backgroundColor: group.good
														? "#E7F7EF"
														: "#FDF0E3",
												}}
											>
												{group.good ? (
													<Check className="size-2.5" strokeWidth={3} />
												) : (
													"!"
												)}
											</span>
											<span style={{ color: DOC_COLORS.title }}>{text}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</DocSection>
			</div>

			<DocSection
				className="mt-[68px]"
				title="千问办公 · 综合评语"
				right="由 AI 生成，供评委参考"
			>
				<div
					className="mt-7 flex flex-col gap-1 px-3.5 text-[14.5px] leading-[29px]"
					style={{ color: DOC_COLORS.title }}
				>
					{report.comments.map((text) => (
						<p key={text} className="m-0">
							{text}
						</p>
					))}
				</div>
			</DocSection>

			<DocSection
				className="mt-9"
				accent="green"
				title="述职过程关键节点"
				extra={
					<span className="text-xs" style={{ color: DOC_COLORS.muted }}>
						来自录音转写
					</span>
				}
				right={
					<>
						<span>共 {report.keyNodeTotal} 条 ·</span>
						<button
							type="button"
							className="flex cursor-pointer items-center border-none bg-transparent p-0 text-xs"
							style={{ color: DOC_COLORS.text }}
							onClick={onViewTranscript}
						>
							查看完整转写
							<ChevronRight className="size-3" />
						</button>
					</>
				}
			>
				<ul className="m-0 mt-[30px] flex list-none flex-col gap-[18px] p-0 px-3.5">
					{report.keyNodes.map((node) => (
						<li key={node.time} className="flex h-5 items-center gap-3 text-sm">
							<span
								className={cn(
									"size-2 shrink-0 rounded-full",
									node.primary
										? "bg-[#246AF8]"
										: "border border-solid border-[#B7CCF8] bg-white",
								)}
							/>
							<span className="min-w-0 flex-1" style={{ color: DOC_COLORS.title }}>
								{node.content}
							</span>
							<span className="shrink-0 text-xs" style={{ color: DOC_COLORS.muted }}>
								{node.time}
							</span>
						</li>
					))}
				</ul>
			</DocSection>
		</DocShell>
	);
}
