import type { FORM_MODE as FormModeType } from "../constants";
import { TAG_TYPE } from "#src/pages/tag-management/config";
import { FORM_MODE } from "../constants";

/**
 * 判断标签名称是否需要继续挂载重名校验。
 *
 * 智能标签在新增场景下虽然名称不可编辑，但如果当前结果不是“已存在标签”，
 * 仍需保留重名校验，避免提交时把手动注入的错误态冲掉。
 *
 * @param params - 判断参数
 * @param params.mode - 表单模式
 * @param params.tagNameEditable - 标签名称是否可编辑
 * @param params.tagType - 当前标签类型
 * @param params.isExisting - 是否为已存在标签
 * @returns 是否需要挂载 tagNameValidator
 *
 * @author 王善能
 * @since 2026-07-06
 */
export function shouldValidateTagNameDuplicate(params: {
	mode: FormModeType;
	tagNameEditable: boolean;
	tagType?: string;
	isExisting?: boolean;
}): boolean {
	if (params.mode === FORM_MODE.READONLY) {
		return false;
	}

	if (params.tagNameEditable) {
		return true;
	}

	return params.tagType === TAG_TYPE.INTELLIGENT && !params.isExisting;
}
