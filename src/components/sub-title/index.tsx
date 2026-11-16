import type { CSSProperties, ReactNode } from "react";
import SubTitleIcon from "#src/assets/svg/sub-title.svg?react";

interface SectionTitleProps {
	title?: ReactNode;
	style?: CSSProperties;
	className?: string;
}

export function SubTitle({ title, style, className }: SectionTitleProps) {
	return (
		<div className={`flex items-center ${className}`} style={style}>
			<SubTitleIcon />
			<div className="text-xs font-medium md:text-sm">{title}</div>
		</div>
	);
}
