import type { ReactNode } from "react";

import { cn } from "#src/utils";

/**
 * 述职文档排版基元（原生宽度 880px 下的尺寸，由 ScaledCanvas 统一缩放）
 *
 * 配色取自设计稿：正文深色 #1B1F26 / #2A3647，辅助灰 #8A919F，千问办公紫 #7B5CF5，主蓝 #246AF8。
 */

/** 文档主色 */
export const DOC_COLORS = {
	title: "#1B1F26",
	text: "#2A3647",
	muted: "#8A919F",
	border: "#EBEEF3",
	purple: "#7B5CF5",
	purpleBg: "#F0ECFE",
	blue: "#246AF8",
	green: "#14B968",
	orange: "#F08A24",
} as const;

/** 区块竖条颜色 */
export type DocAccent = "purple" | "blue" | "green" | "orange" | "none";

const ACCENT_COLOR: Record<Exclude<DocAccent, "none">, string> = {
	purple: DOC_COLORS.purple,
	blue: DOC_COLORS.blue,
	green: DOC_COLORS.green,
	orange: DOC_COLORS.orange,
};

interface DocShellProps {
	/** 文档标题 */
	title: string;
	/** 副标题分段（以竖线分隔） */
	subtitleParts: string[];
	/** 正文 */
	children: ReactNode;
	/** 左右内边距：备课材料 44px，评分报告 29px（设计稿两份文档版心不同） */
	paddingX?: number;
}

/**
 * 文档外壳：品牌行 + 居中标题 + 副标题 + 深色渐变粗线
 *
 * @param props - 组件属性
 * @param props.title - 标题
 * @param props.subtitleParts - 副标题分段
 * @param props.children - 正文
 * @param props.paddingX - 左右内边距
 * @returns 文档外壳
 */
export function DocShell({ title, subtitleParts, children, paddingX = 44 }: DocShellProps) {
	return (
		<article
			className="bg-white pb-10 pt-3.5"
			style={{ color: DOC_COLORS.text, paddingLeft: paddingX, paddingRight: paddingX }}
		>
			<div className="text-[11px] font-medium uppercase leading-5 tracking-[1.6px] text-[#C9CED8]">
				Greentown Service · 年终述职
			</div>
			<h1
				className="m-0 mt-[25px] text-center text-[20px] font-semibold leading-8 tracking-[5px]"
				style={{ color: DOC_COLORS.title }}
			>
				{title}
			</h1>
			<div
				className="mt-3 flex items-center justify-center gap-4 text-[13px] leading-5"
				style={{ color: DOC_COLORS.muted }}
			>
				{subtitleParts.map((part, index) => (
					<span key={part} className="flex items-center gap-4">
						{index > 0 ? <span className="text-[#5F6B7D]">|</span> : null}
						{part}
					</span>
				))}
			</div>
			<div className="mt-3 h-[3px] rounded-full bg-gradient-to-r from-[#1B1F26] to-[#6B7587]" />
			{children}
		</article>
	);
}

interface DocSectionProps {
	/** 区块标题 */
	title: ReactNode;
	/** 竖条颜色 */
	accent?: DocAccent;
	/** 标题后的附加说明 / 标签 */
	extra?: ReactNode;
	/** 右侧内容 */
	right?: ReactNode;
	/** 标题字号：一级区块 16px，二级区块 15px */
	size?: "lg" | "md";
	/** 正文 */
	children: ReactNode;
	/** 额外样式 */
	className?: string;
}

/**
 * 文档区块：竖条 + 标题 + 附加说明 + 右侧内容，下方 1.5px 深色分隔线
 *
 * @param props - 组件属性
 * @param props.title - 文档标题
 * @param props.accent - 竖条颜色
 * @param props.extra - 标题后的附加说明 / 标签
 * @param props.right - 右侧内容
 * @param props.size - 标题字号：一级区块 16px，二级区块 15px
 * @param props.children - 正文
 * @param props.className - 额外样式
 * @returns 文档区块
 */
export function DocSection({
	title,
	accent = "blue",
	extra,
	right,
	size = "md",
	children,
	className,
}: DocSectionProps) {
	return (
		<section className={cn("min-w-0", className)}>
			<div className="flex h-8 items-center gap-2 px-3.5">
				{accent === "none" ? null : (
					<span
						className="h-4 w-[3px] shrink-0 rounded-full"
						style={{ backgroundColor: ACCENT_COLOR[accent] }}
					/>
				)}
				<span
					className={cn(
						"shrink-0 font-semibold",
						size === "lg" ? "text-base" : "text-[15px]",
					)}
					style={{ color: DOC_COLORS.title }}
				>
					{title}
				</span>
				{extra}
				<span
					className="ml-auto flex shrink-0 items-center gap-3 text-xs"
					style={{ color: DOC_COLORS.muted }}
				>
					{right}
				</span>
			</div>
			<div className="mt-2 h-[1.5px] bg-[#1B1F26]" />
			{children}
		</section>
	);
}

/**
 * 千问办公紫色标签
 *
 * @param props - 组件属性
 * @param props.children - 标签文案
 * @returns 标签
 */
export function PurpleTag({ children }: { children: ReactNode }) {
	return (
		<span
			className="inline-flex h-6 shrink-0 items-center rounded px-2 text-xs font-medium"
			style={{ color: DOC_COLORS.purple, backgroundColor: DOC_COLORS.purpleBg }}
		>
			{children}
		</span>
	);
}

/**
 * 加粗「」包裹的片段（设计稿中引用的关键词加粗展示）
 *
 * @param props - 组件属性
 * @param props.text - 原文
 * @returns 渲染节点
 */
export function QuotedText({ text }: { text: string }) {
	// 按「」切分后片段顺序固定，用累计偏移量作为稳定 key
	let offset = 0;
	const parts = text.split(/(「[^」]*」)/g).map((part) => {
		const key = offset;
		offset += part.length;
		return { key, part };
	});
	return (
		<>
			{parts.map(({ key, part }) =>
				part.startsWith("「") ? (
					<strong key={key} className="font-semibold" style={{ color: DOC_COLORS.title }}>
						{part}
					</strong>
				) : (
					<span key={key}>{part}</span>
				),
			)}
		</>
	);
}
