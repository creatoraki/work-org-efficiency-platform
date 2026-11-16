import { getCrmTokenByDingDing } from "#src/api/user";

function decodeQueryValue(value: string | null): string | null {
	if (!value) {
		return null;
	}

	try {
		return decodeURIComponent(value.replace(/\+/g, " "));
	} catch {
		return value;
	}
}

function getHashQueryString(hash: string): string {
	const queryStartIndex = hash.indexOf("?");
	if (queryStartIndex === -1) {
		return "";
	}

	return hash.slice(queryStartIndex + 1);
}

function getHashPath(hash: string): string {
	const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
	const queryStartIndex = normalizedHash.indexOf("?");
	if (queryStartIndex === -1) {
		return normalizedHash;
	}

	return normalizedHash.slice(0, queryStartIndex);
}

function matchLooseQueryParam(queryString: string, paramName: string): string | null {
	if (!queryString) {
		return null;
	}

	const escapedParamName = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const matched = queryString.match(new RegExp(`(?:^|[?&])${escapedParamName}=([^&#]*)`, "i"));
	return decodeQueryValue(matched?.[1] ?? null);
}

function matchRedirectParam(queryString: string): string | null {
	if (!queryString) {
		return null;
	}

	const matched = queryString.match(/(?:^|[?&])redirect=([\s\S]*?)(?=[?&](?:ticket|type)=|$)/i);
	return decodeQueryValue(matched?.[1] ?? null);
}

function getPreHashQueryString(href: string): string {
	const beforeHash = href.split("#")[0] ?? href;
	const queryStartIndex = beforeHash.indexOf("?");
	if (queryStartIndex === -1) {
		return "";
	}

	return beforeHash.slice(queryStartIndex + 1);
}

export interface ParsedSSOParams {
	ticket: string | null;
	type: string;
	redirect: string | null;
}

export function parseSSOParams(
	search: string,
	hash: string,
	href = window.location.href,
): ParsedSSOParams {
	const normalizedSearch = search.startsWith("?") ? search.slice(1) : search;
	const hashQueryString = getHashQueryString(hash);
	const preHashQueryString = getPreHashQueryString(href);
	const searchParams = new URLSearchParams(normalizedSearch);
	const hashParams = new URLSearchParams(hashQueryString);
	const preHashParams = new URLSearchParams(preHashQueryString);

	const ticket =
		searchParams.get("ticket") ??
		hashParams.get("ticket") ??
		preHashParams.get("ticket") ??
		matchLooseQueryParam(hashQueryString, "ticket") ??
		matchLooseQueryParam(normalizedSearch, "ticket") ??
		matchLooseQueryParam(preHashQueryString, "ticket");

	const type =
		searchParams.get("type") ??
		hashParams.get("type") ??
		preHashParams.get("type") ??
		matchLooseQueryParam(hashQueryString, "type") ??
		matchLooseQueryParam(normalizedSearch, "type") ??
		matchLooseQueryParam(preHashQueryString, "type") ??
		"";

	const redirect =
		matchRedirectParam(hashQueryString) ??
		matchRedirectParam(normalizedSearch) ??
		matchRedirectParam(preHashQueryString) ??
		hashParams.get("redirect") ??
		searchParams.get("redirect") ??
		preHashParams.get("redirect");

	return {
		ticket,
		type,
		redirect,
	};
}

function normalizeSSOQueryString(queryString: string): string {
	if (!queryString) {
		return "";
	}

	const normalizedQuery = queryString.startsWith("?") ? queryString.slice(1) : queryString;
	const params = new URLSearchParams(normalizedQuery);
	const redirect = matchRedirectParam(normalizedQuery) ?? params.get("redirect");

	params.delete("ticket");
	params.delete("type");

	if (redirect) {
		// redirect 值中可能包含嵌套的 query string（如 ?id=501323&linkType=filling），
		// URLSearchParams 会将嵌套参数误解析为顶层参数，需要清除这些幽灵参数
		const redirectQueryIndex = redirect.indexOf("?");
		if (redirectQueryIndex !== -1) {
			const innerParams = new URLSearchParams(redirect.slice(redirectQueryIndex + 1));
			innerParams.forEach((_, key) => {
				params.delete(key);
			});
		}
		params.set("redirect", redirect);
	} else {
		params.delete("redirect");
	}

	return params.toString();
}

export function sanitizeSSORedirectPath(rawPath: string): string {
	if (!rawPath) {
		return rawPath;
	}

	try {
		const url = new URL(rawPath, window.location.origin);
		const cleanedSearch = normalizeSSOQueryString(url.search);
		const hashPath = getHashPath(url.hash);
		const cleanedHashQuery = normalizeSSOQueryString(getHashQueryString(url.hash));

		url.search = cleanedSearch ? `?${cleanedSearch}` : "";
		url.hash = hashPath ? `#${hashPath}${cleanedHashQuery ? `?${cleanedHashQuery}` : ""}` : "";

		const sanitizedPath = `${url.pathname}${url.search}${url.hash}`;
		return rawPath.startsWith("/") ? sanitizedPath : sanitizedPath.slice(1);
	} catch {
		return rawPath;
	}
}

export function buildCleanSSOServiceUrl(rawUrl: string): string {
	const url = new URL(rawUrl);
	const cleanedSearch = normalizeSSOQueryString(url.search);
	const hashPath = getHashPath(url.hash);
	const cleanedHashQuery = normalizeSSOQueryString(getHashQueryString(url.hash));

	url.search = cleanedSearch ? `?${cleanedSearch}` : "";
	url.hash = hashPath ? `#${hashPath}${cleanedHashQuery ? `?${cleanedHashQuery}` : ""}` : "";

	return url.toString();
}

interface PerformSSOLoginOptions {
	ticket: string;
	type?: string;
	redirect?: string | null;
	hasActiveToken: () => string;
	navigateBeforeSetToken?: boolean;
	logout: () => Promise<void>;
	reset: () => void;
	setToken: (token: string) => void;
	setRedirectPath: (redirectPath: string) => void;
	navigate: (to: string, options?: { replace?: boolean }) => void;
}

interface PerformSSOLoginResult {
	success: boolean;
	errorMessage?: string;
}

export async function performSSOLogin({
	ticket,
	// type = "",
	redirect,
	hasActiveToken,
	navigateBeforeSetToken = false,
	logout,
	reset,
	setToken,
	setRedirectPath,
	navigate,
}: PerformSSOLoginOptions): Promise<PerformSSOLoginResult> {
	try {
		const latestToken = hasActiveToken();
		if (latestToken) {
			try {
				await logout();
			} catch (logoutError) {
				console.error("SSO登录前注销当前用户失败，改为强制清理本地登录态:", logoutError);
				reset();
			}
		}

		const cleanedUrl = buildCleanSSOServiceUrl(window.location.href);
		const encodedService = encodeURIComponent(cleanedUrl.replaceAll("#/login", ""));
		const response = await getCrmTokenByDingDing(ticket, encodedService);

		if (!response.data?.token) {
			return { success: false, errorMessage: "SSO登录失败" };
		}

		window.history.replaceState(window.history.state, document.title, cleanedUrl);

		const redirectPath = sanitizeSSORedirectPath(
			redirect || import.meta.env.VITE_BASE_HOME_PATH,
		);
		const normalizedRedirectPath = redirectPath.startsWith("/")
			? redirectPath
			: `/${redirectPath}`;
		setRedirectPath(normalizedRedirectPath);

		if (navigateBeforeSetToken) {
			navigate(import.meta.env.VITE_BASE_HOME_PATH, { replace: true });
			await new Promise((resolve) => setTimeout(resolve, 50));
			setToken(response.data.token);
		} else {
			setToken(response.data.token);
			navigate(import.meta.env.VITE_BASE_HOME_PATH, { replace: true });
		}

		return { success: true };
	} catch {
		return { success: false, errorMessage: "SSO登录线路出错，请重试" };
	}
}
