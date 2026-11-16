/**
 * 人员档案标签展示工具。
 *
 * @author 王善能
 * @date 2026-04-16
 */

interface TagDisplayLike {
	tagName?: string;
	tagValue?: string;
}

const BOOLEAN_TAG_VALUE_SET = new Set(["是", "否"]);

function isBooleanOptionTagValue(tagValue?: string): boolean {
	if (!tagValue) {
		return false;
	}

	return BOOLEAN_TAG_VALUE_SET.has(tagValue.trim());
}

export function getPersonnelArchiveTagDisplayName(tag: TagDisplayLike): string {
	if (isBooleanOptionTagValue(tag.tagValue)) {
		return tag.tagName?.trim() || "/";
	}
	return tag.tagValue?.trim() || tag.tagName?.trim() || "/";
}
