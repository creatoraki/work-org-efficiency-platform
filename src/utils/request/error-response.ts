import { isObject, message } from "#src/utils";

/**
 * 处理错误响应
 *
 * @param response 响应对象
 * @returns 响应对象
 */
export async function handleErrorResponse(response: Response) {
	// 根据状态码生成兜底错误文案，避免 statusText 为空时什么都不显示
	const fallbackText =
		response.statusText ||
		(response.status >= 500
			? `服务器错误 (${response.status})`
			: response.status >= 400
				? `请求错误 (${response.status})`
				: `请求失败 (${response.status})`);

	// 先以文本形式读取响应体，避免对空 body 调用 response.json() 抛出
	// "Unexpected end of JSON input" 次生错误
	let rawText = "";
	try {
		rawText = await response.text();
	} catch {
		// 读取 body 失败（例如已被消费），直接用兜底文案
		message.error(fallbackText);
		return response;
	}

	// body 为空：常见于 500 且后端未返回任何内容，直接展示兜底文案
	if (!rawText || !rawText.trim()) {
		message.error(fallbackText);
		return response;
	}

	// 尝试将文本解析为 JSON；解析失败时把原始文本作为错误信息兜底显示
	let data: unknown;
	try {
		data = JSON.parse(rawText);
	} catch {
		message.error(rawText.length > 200 ? fallbackText : rawText);
		return response;
	}

	if (isObject(data)) {
		const json = data as { errorMsg?: string; message?: string };
		message.error(json.errorMsg || json.message || fallbackText);
	} else {
		message.error(fallbackText);
	}

	return response;
}
