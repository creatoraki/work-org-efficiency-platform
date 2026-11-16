import logo from "#src/assets/svg/logo.svg?url";

import { Typography } from "antd";
import { clsx } from "clsx";
import { useNavigate } from "react-router";

import { headerHeight } from "../../constants";

const { Title } = Typography;

export interface LogoProps {
	sidebarCollapsed: boolean;
	className?: string;
}

/**
 * @zh 高度 48px
 * @en The height is 48px
 */
export function Logo({ sidebarCollapsed, className }: LogoProps) {
	const navigate = useNavigate();

	return (
		<div
			style={{ height: headerHeight }}
			className={clsx("flex cursor-pointer items-center justify-center border-b", className)}
			onClick={() => navigate(import.meta.env.VITE_BASE_HOME_PATH)}
		>
			<img src={logo} alt="logo" width={36} height={36} />

			<Title
				level={1}
				ellipsis
				className={clsx("!m-0 !text-base", { hidden: sidebarCollapsed })}
				style={{ color: "rgba(0, 117, 255, 1)" }}
			>
				{import.meta.env.VITE_GLOB_APP_TITLE}
			</Title>
		</div>
	);
}
