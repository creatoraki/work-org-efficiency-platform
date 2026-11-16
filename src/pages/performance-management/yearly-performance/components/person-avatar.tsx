import { cn } from "#src/utils";
import { getAvatarText } from "../utils";

interface PersonAvatarProps {
	/** 姓名 */
	name: string;
	/** 头像地址 */
	src?: string;
	/** 直径，默认 26（设计稿卡片头像 24 + 1px 描边） */
	size?: number;
	/** 占位文字字号 */
	fontSize?: number;
	/** 额外样式 */
	className?: string;
}

/**
 * 人员头像
 *
 * 与档案管理保持一致：未上传头像时取姓名最后一个字 / 英文名首字母，浅蓝底蓝字；
 * 上传头像后居中横向填充（object-cover + object-center）。
 *
 * @param props - 组件属性
 * @param props.name - 姓名
 * @param props.src - 头像地址
 * @param props.size - 直径
 * @param props.fontSize - 占位文字字号
 * @param props.className - 额外样式
 * @returns 头像元素
 *
 * @since 2026-11-16
 */
export function PersonAvatar({
	name,
	src,
	size = 26,
	fontSize = 14,
	className,
}: PersonAvatarProps) {
	return (
		<span
			className={cn(
				"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E0EEFF] text-[#0075FF]",
				className,
			)}
			style={{ width: size, height: size, fontSize, lineHeight: `${size}px` }}
		>
			{src ? (
				<img src={src} alt={name} className="size-full object-cover object-center" />
			) : (
				getAvatarText(name)
			)}
		</span>
	);
}
