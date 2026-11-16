import type { JobBasicDescription, JobDescriptionEntry } from "./management/types";

/**
 * 将描述字符串解析为对象
 */
export function parseDescriptionField(desc?: string | null): JobBasicDescription {
	if (!desc) {
		return {};
	}

	try {
		const parsed = JSON.parse(desc) as JobDescriptionEntry[] | Record<string, string | null>;
		if (Array.isArray(parsed)) {
			return parsed.reduce<JobBasicDescription>((acc, item, index) => {
				const key = item.dimension?.trim() || `字段${index + 1}`;
				if (key) {
					acc[key] = item.content?.trim() || "";
				}
				return acc;
			}, {});
		}
		if (parsed && typeof parsed === "object") {
			return parsed as JobBasicDescription;
		}
	} catch (error) {
		console.warn("解析岗位描述字段失败", error);
	}

	return {};
}

/**
 * 将描述对象序列化为字符串
 */
export function stringifyDescriptionField(description?: JobBasicDescription): string {
	if (!description || typeof description !== "object") {
		return "[]";
	}
	const list = Object.entries(description).map(([dimension, content]) => ({
		dimension,
		content: content ?? "",
	}));
	return JSON.stringify(list);
}

function buildDescriptionParts(desc?: string | null): string[] {
	const description = parseDescriptionField(desc);
	return Object.keys(description).reduce<string[]>((acc, key, index) => {
		const value = description[key];
		const displayValue = value && value.trim() ? value.trim() : "-";
		acc.push(`${index + 1}. ${key}: ${displayValue}`);
		return acc;
	}, []);
}

/**
 * 构建简短描述文本（以分号分隔）
 */
export function formatDescription(desc?: string | null): string {
	const parts = buildDescriptionParts(desc);
	return parts.length > 0 ? parts.join("; ") : "-";
}

/**
 * 构建 tooltip 描述文本（以换行分隔）
 */
export function formatDescriptionForTooltip(desc?: string | null): string {
	const parts = buildDescriptionParts(desc);
	return parts.length > 0 ? parts.join("\n") : "-";
}
