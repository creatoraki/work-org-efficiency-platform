import type { AppRouteRecordRaw } from "#src/router/types";

export interface AuthType {
	token: string;
	refreshToken: string;
}

export interface UserInfoType {
	id: string;
	avatar: string;
	username: string;
	nickName: string;
	email: string;
	phoneNumber: string;
	description: string;
	roles: any[];
	// 路由可以在此处动态添加
	menus?: AppRouteRecordRaw[];
	deptName: string;
	staffJobName: string;
	dept: {
		deptName: string;
	};
	perms: string[];
	admin?: boolean; // 是否为管理员
	userCode: string; // 用户工号
}

export interface AuthListProps {
	label: string;
	name: string;
	auth: string[];
}

export interface GetCrmTokenByDingDingRes {
	/* */
	error: boolean;

	/* */
	success: boolean;

	/* */
	warn: boolean;

	/* */
	empty: boolean;

	/* token信息 */
	data?: {
		token: string;
	};

	/* 错误信息 */
	message?: string;
}
