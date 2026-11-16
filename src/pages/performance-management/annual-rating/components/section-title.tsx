import type { ReactNode } from "react";

interface SectionTitleProps {
	/** 区块标题 */
	title: ReactNode;
	/** 紧随标题的附加标签，如「校验异常」 */
	badge?: ReactNode;
	/** 右侧附加内容，如统计文案或操作按钮 */
	extra?: ReactNode;
}

/**
 * 区块标题
 *
 * 蓝色竖条 4×16 + 16px 中粗标题，标题与内容间距 12px。
 * 年度评级各抽屉、弹窗、计划详情统一复用该组件，避免各处重复维护标题样式。
 *
 * @param props - 组件属性
 * @param props.title - 区块标题
 * @param props.badge - 紧随标题的附加标签
 * @param props.extra - 右侧附加内容
 * @returns 区块标题元素
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function SectionTitle({ title, badge, extra }: SectionTitleProps) {
	return (
		<div className="mb-3 flex items-center justify-between">
			<div className="flex items-center gap-2">
				<span className="h-4 w-1 shrink-0 bg-[#0075FF]" aria-hidden />
				<span className="text-base font-medium leading-6 text-black">{title}</span>
				{badge}
			</div>
			{extra}
		</div>
	);
}
