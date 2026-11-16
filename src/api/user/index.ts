import type { PasswordLoginFormType } from "#src/pages/login/components/password-login";
import type { AppRouteRecordRaw } from "#src/router/types";
import type { AuthType, GetCrmTokenByDingDingRes, UserInfoType } from "./types";
import { request } from "#src/utils";

export * from "./types";

export function fetchLogin(data: PasswordLoginFormType) {
	return request.post("login", { json: data }).json<ApiResponse<AuthType>>();
}

export function fetchLogout() {
	return request.post("logout").json();
}

export function fetchAsyncRoutes() {
	return request.get("user/getRouters").json<ApiResponse<AppRouteRecordRaw[]>>();
}

export function fetchUserInfo() {
	return request.get("user/getInfo").json<ApiResponse<UserInfoType>>();
}

export function fetchUserPerm() {
	return request.get("user/getPerms").json<ApiResponse<UserInfoType>>();
}
export interface RefreshTokenResult {
	token: string;
	refreshToken: string;
}

/**
 * getCrmTokenByDingDing
 * @param {string} ticket
 * @param {string} service - URL编码后的完整路径
 * @param {string} type
 * @returns
 */
export function getCrmTokenByDingDing(ticket: string, service: string) {
	return request
		.get(`authorizationUser/getCrmTokenByDingDing?ticket=${ticket}&service=${service}`)
		.json<GetCrmTokenByDingDingRes>();
}

export const refreshTokenPath = "refresh-token";
export function fetchRefreshToken(data: { readonly refreshToken: string }) {
	return request.post(refreshTokenPath, { json: data }).json<ApiResponse<RefreshTokenResult>>();
}
