import type { SVGProps } from "react";

/**
 * 年终述职页面私有图标
 *
 * 设计稿中的概览卡片图标、卡片操作图标在 antd / lucide 中没有完全一致的形态，
 * 这里按设计稿手绘为线性 SVG：统一 24 视口、currentColor 描边，尺寸由 font-size / width 控制。
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * 线性图标外壳
 *
 * @param props - SVG 属性
 * @param props.size - 图标尺寸，默认 1em
 * @param props.children - 图形内容
 * @returns SVG 元素
 */
function LineIcon({ size, children, ...rest }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			width={size ?? "1em"}
			height={size ?? "1em"}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
			{...rest}
		>
			{children}
		</svg>
	);
}

/** 待述职：人像 + 声波 */
export function UserVoiceIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<circle cx="9.5" cy="8" r="4" />
			<path d="M2.5 20.25v-1.1c0-1.6 1.3-2.9 2.9-2.9h8.2c1.6 0 2.9 1.3 2.9 2.9v1.1z" />
			<path d="M16.2 5.4a4.2 4.2 0 0 1 0 5.2" />
			<path d="M18.9 3a7.6 7.6 0 0 1 0 10" />
		</LineIcon>
	);
}

/** 述职中：麦克风 */
export function MicIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<rect x="8.75" y="2.75" width="6.5" height="11.5" rx="3.25" />
			<path d="M5 11a7 7 0 0 0 14 0" />
			<path d="M12 18v3.25" />
			<path d="M8.5 21.25h7" />
		</LineIcon>
	);
}

/** 报告生成中：文件 + 时钟 */
export function FileClockIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<path d="M10.5 21.25H6.25a1.5 1.5 0 0 1-1.5-1.5V4.25a1.5 1.5 0 0 1 1.5-1.5h7.5l5.5 5.5v2.5" />
			<path d="M13.75 2.75v5.5h5.5" />
			<circle cx="16.5" cy="17" r="4.25" />
			<path d="M16.5 15v2.2h1.8" />
		</LineIcon>
	);
}

/** 报告已生成：折角文件 + 对勾 */
export function FileDoneIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<path d="M15.75 21.25H5.25a1.5 1.5 0 0 1-1.5-1.5V4.25a1.5 1.5 0 0 1 1.5-1.5h13.5a1.5 1.5 0 0 1 1.5 1.5v12.5z" />
			<path d="M15.75 21.25v-3a1.5 1.5 0 0 1 1.5-1.5h3" />
			<path d="m8 11.5 3 3 5.25-5.5" />
		</LineIcon>
	);
}

/** 查看进度 / 查看报告：便签 */
export function NoteIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<rect x="3.75" y="3.75" width="16.5" height="16.5" rx="1.5" />
			<path d="M8 9.25h8" />
			<path d="M8 14.25h4.5" />
		</LineIcon>
	);
}

/** 结束录音：电源 */
export function PowerIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<path d="M12 3v8" />
			<path d="M7.05 6.05a8 8 0 1 0 9.9 0" />
		</LineIcon>
	);
}

/** 详情：侧栏展开 */
export function PanelDetailIcon(props: IconProps) {
	return (
		<LineIcon {...props}>
			<rect x="3" y="3" width="18" height="18" rx="1.5" />
			<path d="M9 3v18" />
			<path d="m13.5 9 3 3-3 3" />
		</LineIcon>
	);
}

/** 树节点展开三角（实心） */
export function CaretDownIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 8 8" width="8" height="8" fill="currentColor" aria-hidden {...props}>
			<path d="M0.5 2h7L4 6.5z" />
		</svg>
	);
}
