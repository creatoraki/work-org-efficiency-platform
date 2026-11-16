import { fetchRefreshToken } from "#src/api/user";
import { useAuthStore } from "#src/store";
import { goLogin } from "#src/utils/request/go-login";

/**
 * 刷新访问令牌
 *
 * @returns 新的访问令牌
 * @throws {Error} 当刷新令牌不存在时抛出错误
 */
export async function refreshToken(): Promise<string> {
	const { refreshToken: storedRefreshToken } = useAuthStore.getState();
	if (!storedRefreshToken) {
		goLogin();
		throw new Error("Missing refresh token");
	}
	const res = await fetchRefreshToken({ refreshToken: storedRefreshToken });
	useAuthStore.setState({ token: res.data.token, refreshToken: res.data.refreshToken });
	return res.data.token;
}
