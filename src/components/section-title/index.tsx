import type { CSSProperties, ReactNode } from "react";
import { theme } from "antd";

interface SectionTitleProps {
	title?: ReactNode;
	titleExtra?: ReactNode;
	extra?: ReactNode;
	style?: CSSProperties;
	className?: string;
}

export function SectionTitle({ title, titleExtra, extra, style, className }: SectionTitleProps) {
	const { token } = theme.useToken();
	return (
		<div
			className={`flex items-center justify-between gap-2 ${className} w-full`}
			style={style}
		>
			<div className="flex shrink-0 items-center gap-2">
				<div
					style={{
						width: 4,
						height: 14,
						backgroundColor: token.colorPrimary,
						opacity: 1,
						borderRadius: 2,
					}}
				/>
				<div className="font-bold">{title}</div>
				{titleExtra}
			</div>
			{extra}
		</div>
	);
}
