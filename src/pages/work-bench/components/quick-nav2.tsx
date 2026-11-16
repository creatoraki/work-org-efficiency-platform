import type { ReactNode } from "react";

export interface QuickNavItem {
	icon: ReactNode;
	label: ReactNode;
	onClick?: () => void;
}

export interface QuickNavListProps {
	items: QuickNavItem[];
	className?: string;
	style?: React.CSSProperties;
}

export function QuickNavList({ items, className = "", style }: QuickNavListProps) {
	return (
		<div
			className={`custom-scrollbar mt-1 flex min-h-0 w-full flex-wrap items-start gap-10 overflow-auto ${className}`}
			style={style}
		>
			{items.map((item) => (
				<div
					key={item.label as string}
					className="group flex cursor-pointer select-none flex-col items-center justify-center rounded-md px-2 transition-colors"
					onClick={item.onClick}
				>
					{item.icon}
					<span className="[@media(min-height:1000px)]:mt-2wo1 mt-0.5 whitespace-nowrap text-center text-xs font-medium leading-none text-gray-700 transition-colors group-hover:text-blue-600">
						{item.label}
					</span>
				</div>
			))}
		</div>
	);
}
