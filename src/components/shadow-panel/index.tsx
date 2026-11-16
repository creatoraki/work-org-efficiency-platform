import type { HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export interface ShadowPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	children?: ReactNode;
	header?: ReactNode;
	icon?: ReactNode;
}

export const ShadowPanel = forwardRef<HTMLDivElement, ShadowPanelProps>((props, ref) => {
	const { children, className = "", style, header, icon, ...rest } = props;

	return (
		<div
			ref={ref}
			className={`z-10 rounded-md border border-white px-3 py-1 ${className} bg-white`}
			style={{
				border: "1px solid rgba(233, 233, 233, 0.94)",
				boxShadow: "0px 8px 16px -8px rgba(44, 44, 44, 0.28)",
				...style,
			}}
			{...rest}
		>
			{(header || icon) && (
				<div
					className="mb-1 flex items-center [@media(min-height:1000px)]:mt-2"
					style={{
						fontFamily: "PingFang SC",
						fontSize: 18,
						fontWeight: 500,
						lineHeight: "28px",
						letterSpacing: 0,
					}}
				>
					{icon && <span className="mr-2 inline-block align-middle">{icon}</span>}
					{header && <span className="w-full align-middle">{header}</span>}
				</div>
			)}
			{children}
		</div>
	);
});
