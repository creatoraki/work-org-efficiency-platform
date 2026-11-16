import type {
	PrepMaterial,
	PrepMaterialAbility,
	PrepMaterialFile,
} from "#src/api/performance-management/yearly-performance";

import { cn } from "#src/utils";
import { DOC_COLORS, DocSection, DocShell, PurpleTag, QuotedText } from "./doc-primitives";

interface PrepMaterialDocumentProps {
	/** 备课材料 */
	material: PrepMaterial;
}

/** 绩效等级徽标配色：A+ 绿、其余蓝 */
function gradeStyle(grade: string) {
	return grade.includes("+")
		? { color: DOC_COLORS.green, backgroundColor: "#E7F7EF" }
		: { color: DOC_COLORS.blue, backgroundColor: "#EAF1FE" };
}

/** 文件类型徽标 */
const FILE_BADGE: Record<PrepMaterialFile["fileType"], { label: string; color: string }> = {
	ppt: { label: "PPT", color: "#EE893D" },
	pdf: { label: "PDF", color: "#DE4A44" },
	xls: { label: "XLS", color: "#2A9D60" },
};

/**
 * 能力素质雷达图（SVG，缩放后保持清晰）
 *
 * @param props - 组件属性
 * @param props.abilities - 维度得分
 * @returns 雷达图
 */
function AbilityRadar({ abilities }: { abilities: PrepMaterialAbility[] }) {
	const size = 168;
	const center = size / 2;
	const radius = 58;
	const count = abilities.length;
	const point = (index: number, ratio: number) => {
		const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
		return [
			center + radius * ratio * Math.cos(angle),
			center + radius * ratio * Math.sin(angle),
		];
	};
	const polygon = (ratio: number | ((index: number) => number)) =>
		abilities
			.map((_, index) =>
				point(index, typeof ratio === "number" ? ratio : ratio(index)).join(","),
			)
			.join(" ");
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0 overflow-visible"
		>
			{[1, 0.75, 0.5, 0.25].map((ratio) => (
				<polygon
					key={ratio}
					points={polygon(ratio)}
					fill="none"
					stroke="#D9E1EE"
					strokeWidth={1}
				/>
			))}
			{abilities.map((item, index) => {
				const [x, y] = point(index, 1);
				return (
					<line key={item.name} x1={center} y1={center} x2={x} y2={y} stroke="#E3E9F3" />
				);
			})}
			<polygon
				points={polygon((index) => abilities[index].score / 100)}
				fill="#DEE9FE"
				fillOpacity={0.85}
				stroke={DOC_COLORS.blue}
				strokeWidth={1.5}
			/>
			{abilities.map((item, index) => {
				const [x, y] = point(index, item.score / 100);
				return <circle key={item.name} cx={x} cy={y} r={2.5} fill={DOC_COLORS.blue} />;
			})}
			{abilities.map((item, index) => {
				const [x, y] = point(index, 1.22);
				return (
					<text
						key={item.name}
						x={x}
						y={y}
						fontSize={10}
						fill={DOC_COLORS.muted}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						{item.name}
					</text>
				);
			})}
		</svg>
	);
}

/**
 * 述职备课材料文档（千问办公生成）
 *
 * 版式按设计稿：人员基本信息表 → 材料提取要点 / 近三年绩效 → 能力素质画像 / 过往汇报材料 → 上一年度述职结论回顾。
 *
 * @param props - 组件属性
 * @param props.material - 备课材料
 * @returns 文档
 *
 * @since 2026-11-16
 */
export function PrepMaterialDocument({ material }: PrepMaterialDocumentProps) {
	const { basicInfo } = material;
	const infoRows: Array<[string, string, string, string]> = [
		["姓名 / 工号", basicInfo.nameAndCode, "岗位分类", basicInfo.positionCategory],
		["所属组织", basicInfo.orgName, "现任职务", basicInfo.currentPosition],
		["入职时间 / 司龄", basicInfo.entryAndTenure, "直接上级", basicInfo.directLeader],
		["述职形式", basicInfo.reportForm, "应到评委", basicInfo.judges],
	];

	return (
		<DocShell
			title="述职备课材料"
			subtitleParts={[material.subtitle, material.meetingName, material.meetingTime]}
		>
			<DocSection
				className="mt-[35px]"
				size="lg"
				accent="purple"
				title="一、人员基本信息"
				extra={<PurpleTag>千问办公 生成</PurpleTag>}
				right={
					<>
						<span>同步于 {material.syncTime}</span>
						<span className="cursor-pointer" style={{ color: DOC_COLORS.text }}>
							重新拉取
						</span>
					</>
				}
			>
				<div className="mt-4 overflow-hidden rounded-md border border-solid border-[#EBEEF3]">
					{infoRows.map(([leftLabel, leftValue, rightLabel, rightValue], index) => (
						<div
							key={leftLabel}
							className={cn(
								"grid h-[42px] grid-cols-2 text-[13px]",
								index > 0 && "border-0 border-t border-solid border-[#EBEEF3]",
							)}
						>
							<div className="flex items-center gap-2.5 px-3.5">
								<span style={{ color: DOC_COLORS.muted }}>{leftLabel}</span>
								<span className="font-semibold" style={{ color: DOC_COLORS.title }}>
									{leftValue}
								</span>
							</div>
							<div className="flex items-center gap-2.5 border-0 border-l border-solid border-[#EBEEF3] px-3.5">
								<span style={{ color: DOC_COLORS.muted }}>{rightLabel}</span>
								<span className="font-semibold" style={{ color: DOC_COLORS.title }}>
									{rightValue}
								</span>
							</div>
						</div>
					))}
				</div>
			</DocSection>

			<div className="mt-3.5 grid grid-cols-2 gap-3">
				{/* 材料提取要点 */}
				<div className="rounded-md border border-solid border-[#ECE7FD] bg-[#F8F6FE] px-3.5 pb-3.5 pt-3">
					<div
						className="flex items-center gap-1.5 text-[13px] font-semibold"
						style={{ color: DOC_COLORS.purple }}
					>
						<span className="flex size-3.5 items-center justify-center rounded-full border border-solid border-current text-[8px]">
							≡
						</span>
						千问办公 · 材料提取要点
					</div>
					<ol className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0">
						{material.highlights.map((text, index) => (
							<li key={text} className="flex gap-2 text-sm leading-[23px]">
								<span
									className="mt-[3px] flex size-[15px] shrink-0 items-center justify-center rounded-full text-[10px]"
									style={{ color: DOC_COLORS.purple, backgroundColor: "#ECE6FE" }}
								>
									{index + 1}
								</span>
								<span>
									<QuotedText text={text} />
								</span>
							</li>
						))}
					</ol>
					<div className="mt-3 border-0 border-t border-dashed border-[#E3DCFB] pt-3">
						<div className="flex flex-wrap gap-2">
							{material.focusTags.map((tag) => (
								<span
									key={tag}
									className="rounded-md border border-solid border-[#E3DCFB] bg-white px-2.5 py-1 text-xs"
									style={{ color: DOC_COLORS.purple }}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				</div>

				{/* 近三年绩效成绩 */}
				<div>
					<div className="flex h-7 items-center gap-2">
						<span
							className="text-[13px] font-semibold"
							style={{ color: DOC_COLORS.title }}
						>
							近三年绩效成绩
						</span>
						<span className="text-[11px]" style={{ color: DOC_COLORS.muted }}>
							数据来源：绩效系统
						</span>
					</div>
					<table className="mt-1.5 w-full border-collapse text-sm">
						<thead>
							<tr
								className="h-[36px] bg-[#FAFBFC] text-left text-[13px]"
								style={{ color: DOC_COLORS.muted }}
							>
								<th className="pl-2.5 font-normal">考核周期</th>
								<th className="font-normal">绩效等级</th>
								<th className="font-normal">综合得分</th>
								<th className="font-normal">部门排名</th>
							</tr>
						</thead>
						<tbody>
							{material.performance.map((row) => (
								<tr
									key={row.cycle}
									className="h-[43px] border-0 border-b border-solid border-[#EEF0F4]"
								>
									<td className="pl-2.5">{row.cycle}</td>
									<td>
										<span
											className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded px-1.5 text-xs font-semibold"
											style={gradeStyle(row.grade)}
										>
											{row.grade}
										</span>
									</td>
									<td
										className="font-semibold"
										style={{ color: DOC_COLORS.title }}
									>
										{row.score}
									</td>
									<td>{row.rank}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-2 gap-3">
				<DocSection
					title="能力素质画像"
					extra={
						<span className="text-xs" style={{ color: DOC_COLORS.muted }}>
							（近 2 年 360 评估均值）
						</span>
					}
				>
					<div className="mt-3 flex items-center gap-3">
						<AbilityRadar abilities={material.abilities} />
						<div className="flex min-w-0 flex-1 flex-col gap-3">
							{material.abilities.map((item) => (
								<div key={item.name} className="flex items-center gap-3 text-xs">
									<span
										className="w-12 shrink-0"
										style={{ color: DOC_COLORS.text }}
									>
										{item.name}
									</span>
									<span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F6]">
										<span
											className="block h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#246AF8]"
											style={{ width: `${item.score}%` }}
										/>
									</span>
									<span
										className="w-5 shrink-0 text-right font-semibold"
										style={{ color: DOC_COLORS.title }}
									>
										{item.score}
									</span>
								</div>
							))}
						</div>
					</div>
				</DocSection>

				<DocSection
					title="过往汇报材料"
					extra={
						<span className="text-[11px]" style={{ color: DOC_COLORS.muted }}>
							企业知识库
						</span>
					}
					right={`共 ${material.files.length} 份`}
				>
					<ul className="m-0 mt-4 flex list-none flex-col gap-[22px] p-0 pl-3.5">
						{material.files.map((file) => (
							<li key={file.fileName} className="flex items-center gap-3">
								<span
									className="flex size-7 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
									style={{ backgroundColor: FILE_BADGE[file.fileType].color }}
								>
									{FILE_BADGE[file.fileType].label}
								</span>
								<span className="flex min-w-0 flex-col">
									<span
										className="truncate text-[15px] leading-[22px]"
										style={{ color: DOC_COLORS.title }}
									>
										{file.fileName}
									</span>
									<span
										className="mt-1 text-[13px]"
										style={{ color: DOC_COLORS.muted }}
									>
										{file.fileSize}
										{" · "}
										{file.uploadDate}
									</span>
								</span>
							</li>
						))}
					</ul>
				</DocSection>
			</div>

			<DocSection className="mt-12" accent="orange" title="上一年度述职结论回顾">
				<ul className="m-0 mt-5 flex list-none flex-col gap-4 p-0 pl-3.5">
					{material.reviews.map((review) => (
						<li key={review.date} className="flex items-center gap-3 text-sm leading-5">
							<span
								className={cn(
									"size-2 shrink-0 rounded-full",
									review.primary
										? "bg-[#246AF8]"
										: "border border-solid border-[#B7CCF8] bg-white",
								)}
							/>
							<span className="min-w-0 flex-1">
								<QuotedText text={review.content} />
							</span>
							<span
								className="shrink-0 pr-3.5 text-xs"
								style={{ color: DOC_COLORS.muted }}
							>
								{review.date}
							</span>
						</li>
					))}
				</ul>
			</DocSection>
		</DocShell>
	);
}
