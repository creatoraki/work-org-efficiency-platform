import { TAG_TYPE } from "#src/pages/tag-management/config";
import { describe, expect, it } from "vitest";
import { FORM_MODE } from "../constants";
import { shouldValidateTagNameDuplicate } from "./basic-info-section-utils";

/**
 * 基础信息区块标签名称重名校验规则单测。
 *
 * 聚焦智能标签“新增重名要挂、已存在不挂”的业务边界，
 * 避免提交时 tagName 的错误态被表单重新校验冲掉。
 *
 * @author 王善能
 * @since 2026-07-06
 */
describe("shouldValidateTagNameDuplicate", () => {
	it("智能标签新增且非已存在时，应继续挂重名校验", () => {
		expect(
			shouldValidateTagNameDuplicate({
				mode: FORM_MODE.ADD,
				tagNameEditable: false,
				tagType: TAG_TYPE.INTELLIGENT,
				isExisting: false,
			}),
		).toBe(true);
	});

	it("智能标签已存在时，不应挂重名校验", () => {
		expect(
			shouldValidateTagNameDuplicate({
				mode: FORM_MODE.ADD,
				tagNameEditable: false,
				tagType: TAG_TYPE.INTELLIGENT,
				isExisting: true,
			}),
		).toBe(false);
	});

	it("普通可编辑标签名称，应继续挂重名校验", () => {
		expect(
			shouldValidateTagNameDuplicate({
				mode: FORM_MODE.ADD,
				tagNameEditable: true,
				tagType: TAG_TYPE.MANUAL,
				isExisting: false,
			}),
		).toBe(true);
	});

	it("只读模式下，不应挂重名校验", () => {
		expect(
			shouldValidateTagNameDuplicate({
				mode: FORM_MODE.READONLY,
				tagNameEditable: false,
				tagType: TAG_TYPE.INTELLIGENT,
				isExisting: false,
			}),
		).toBe(false);
	});
});
