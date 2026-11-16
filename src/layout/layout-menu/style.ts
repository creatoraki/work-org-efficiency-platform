import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles({
	menuIcon: {
		"& .menu-icon": {
			display: "inline-block",
			transition: "filter 0.2s ease",
		},
		"& .ant-menu-item-selected .menu-icon": {
			filter: "brightness(0) invert(1)",
		},
	},
	menuBackgroundColor: {
		"& .ant-menu-submenu-selected .ant-menu-submenu-title": {
			backgroundColor: "var(--ant-menu-item-selected-bg)",
		},
	},
});
