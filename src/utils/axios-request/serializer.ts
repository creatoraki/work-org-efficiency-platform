import type { RequestOptions } from "./types";

/**
 * 序列化配置
 */
export interface SerializerConfig {
	/** 是否启用自定义序列化 */
	enable?: boolean;
	/** 数组参数序列化策略 */
	arrayFormat?: "indices" | "brackets" | "repeat" | "comma";
	/** 是否序列化日期为 ISO 字符串 */
	serializeDate?: boolean;
	/** 自定义序列化函数 */
	customSerializer?: (params: Record<string, unknown>) => Record<string, unknown>;
	/** 自定义参数处理函数 */
	paramsProcessor?: (params: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * 默认序列化配置
 */
const DEFAULT_CONFIG: Required<Omit<SerializerConfig, "customSerializer" | "paramsProcessor">> = {
	enable: true,
	arrayFormat: "indices",
	serializeDate: true,
};

/**
 * 序列化日期
 *
 * @param value - 日期值
 * @returns 序列化后的字符串
 */
function serializeDateValue(value: Date): string {
	return value.toISOString();
}

/**
 * 序列化数组参数
 *
 * @param key - 参数键
 * @param value - 数组值
 * @param format - 序列化格式
 * @returns 序列化后的参数对象
 */
function serializeArray(
	key: string,
	value: unknown[],
	format: SerializerConfig["arrayFormat"] = "indices",
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	switch (format) {
		case "indices":
			// a[0]=1&a[1]=2
			value.forEach((item, index) => {
				result[`${key}[${index}]`] = item;
			});
			break;
		case "brackets":
			// a[]=1&a[]=2
			value.forEach((item) => {
				const existingKey = `${key}[]`;
				if (result[existingKey] === undefined) {
					result[existingKey] = item;
				} else {
					// 如果已存在，转换为数组
					const existing = result[existingKey];
					if (Array.isArray(existing)) {
						existing.push(item);
					} else {
						result[existingKey] = [existing, item];
					}
				}
			});
			break;
		case "repeat":
			// a=1&a=2
			value.forEach((item) => {
				result[key] = result[key] ? [result[key], item].flat() : item;
			});
			break;
		case "comma":
			// a=1,2
			result[key] = value.join(",");
			break;
		default:
			result[key] = value;
	}

	return result;
}

/**
 * 序列化对象参数
 *
 * @param params - 参数对象
 * @param config - 序列化配置
 * @returns 序列化后的参数对象
 */
function serializeParams(
	params: Record<string, unknown>,
	config: SerializerConfig,
): Record<string, unknown> {
	const { arrayFormat, serializeDate, customSerializer, paramsProcessor } = {
		...DEFAULT_CONFIG,
		...config,
	};

	// 如果提供了自定义序列化函数，直接使用
	if (customSerializer) {
		return customSerializer(params);
	}

	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(params)) {
		// 处理 null 和 undefined
		if (value === null || value === undefined) {
			result[key] = value;
			continue;
		}

		// 处理日期
		if (serializeDate && value instanceof Date) {
			result[key] = serializeDateValue(value as Date);
			continue;
		}

		// 处理数组
		if (Array.isArray(value)) {
			const serialized = serializeArray(key, value, arrayFormat);
			Object.assign(result, serialized);
			continue;
		}

		// 处理嵌套对象
		if (typeof value === "object" && value !== null && !(value instanceof Date)) {
			// 递归序列化嵌套对象
			const nested = serializeParams(value as Record<string, unknown>, config);
			for (const [nestedKey, nestedValue] of Object.entries(nested)) {
				result[`${key}.${nestedKey}`] = nestedValue;
			}
			continue;
		}

		// 其他类型直接赋值
		result[key] = value;
	}

	// 如果提供了参数处理函数，应用处理
	if (paramsProcessor) {
		return paramsProcessor(result);
	}

	return result;
}

/**
 * 应用序列化配置到请求配置
 *
 * @param config - 请求配置
 * @returns 处理后的请求配置
 */
export function applySerializer(config: RequestOptions): RequestOptions {
	const serializerConfig: SerializerConfig | undefined =
		typeof config.serializer === "boolean"
			? config.serializer
				? {}
				: undefined
			: config.serializer;

	if (!serializerConfig || !serializerConfig.enable) {
		return config;
	}

	const newConfig = { ...config };

	// 处理 params
	if (config.params && typeof config.params === "object") {
		newConfig.params = serializeParams(
			config.params as Record<string, unknown>,
			serializerConfig,
		) as typeof config.params;
	}

	// 处理 data（如果是对象）
	if (
		config.data &&
		typeof config.data === "object" &&
		!(config.data instanceof FormData) &&
		!(config.data instanceof Blob)
	) {
		newConfig.data = serializeParams(
			config.data as Record<string, unknown>,
			serializerConfig,
		) as typeof config.data;
	}

	return newConfig;
}
