import { createUseStyles } from "react-jss";

export const useStyles = createUseStyles(({ token }) => {
	return {
		tabsContainer: {
			backgroundColor: token.colorBgLayout, // 保持与主题色一致，黑白自动切换
		},
	};
});
