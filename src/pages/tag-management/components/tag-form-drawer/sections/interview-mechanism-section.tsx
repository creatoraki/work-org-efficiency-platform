/**
 * 标签表单抽屉面谈机制区块。
 *
 * 仅人才标签库下的手工标签展示面谈相关字段，与打标审核机制相互独立。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { FormInstance, RadioChangeEvent } from "antd";
import type { FORM_MODE } from "../constants";
import type { MaintainerRoleOption } from "../types";
import { SectionTitle } from "#src/components/section-title";
import {
	IS_REQUIRED_OPTIONS,
	TAG_RULE_TYPE_DICT,
	TAG_TYPE,
} from "#src/pages/tag-management/config";
import { ProFormDependency, ProFormRadio, ProFormSelect } from "@ant-design/pro-components";
import { isTagType } from "../utils";

/**
 * 面谈机制表单组件属性。
 *
 * @author 王善能
 * @since 2026-06-11
 */
interface InterviewMechanismSectionProps {
	/** 表单实例 */
	form: FormInstance;
	/** 模式 */
	mode: FORM_MODE;
	/** 标签库类型 */
	tagLibraryType: TAG_RULE_TYPE_DICT;
	/** 是否需要面谈 */
	needInterview: boolean;
	/** 面谈更新频次选项 */
	ftfInterviewUpdFreqOptions: Array<{ label: string; value: string }>;
	/** 维护人角色选项 */
	maintainerRoleOptions: MaintainerRoleOption[];
	/** 处理是否需要面谈变化的回调 */
	handleNeedInterviewChange: (e: RadioChangeEvent) => void;
	/** 处理面谈人变化的回调 */
	handleFtfInterviewerChange: (value: string) => void;
}

/**
 * 面谈机制表单组件（仅用于人才标签的手工标签）
 *
 * 包含以下字段：
 * - 是否需面谈
 * - 面谈更新频次
 * - 面谈人
 *
 * 注意：面谈机制与打标审核机制是两个独立的机制，可以同时使用
 *
 * @param props - 组件属性
 * @returns 面谈机制表单 JSX
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function InterviewMechanismSection({
	form,
	mode,
	tagLibraryType,
	needInterview,
	ftfInterviewUpdFreqOptions,
	maintainerRoleOptions,
	handleNeedInterviewChange,
	handleFtfInterviewerChange,
}: InterviewMechanismSectionProps) {
	// 仅人才标签显示
	if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
		return null;
	}

	return (
		<ProFormDependency name={["tagType"]}>
			{({ tagType: currentTagType }) => {
				// 使用 isTagType 兼容表单 tagType 的 number/string 差异
				if (!isTagType(currentTagType, TAG_TYPE.MANUAL)) {
					return null;
				}

				return (
					<div>
						<SectionTitle title="面谈机制（无需打标审核）" className="mb-4" />

						{/* 是否需面谈 */}
						<ProFormRadio.Group
							name="isFtfInterview"
							label="是否需面谈"
							rules={[{ required: true, message: "请选择是否需面谈" }]}
							options={IS_REQUIRED_OPTIONS}
							fieldProps={{
								onChange: handleNeedInterviewChange,
							}}
							disabled={mode === "edit"}
						/>

						{/* 面谈更新频次 */}
						{needInterview && (
							<ProFormSelect
								name="ftfInterviewUpdFreq"
								label="面谈更新频次"
								placeholder="请选择面谈更新频次"
								rules={[{ required: true, message: "请选择面谈更新频次" }]}
								options={ftfInterviewUpdFreqOptions}
								fieldProps={{
									onChange: (value: string) => {
										// 强制保持一致：如果面谈更新频次被手动修改，同步回更新频次
										const currentUpdateFrequency =
											form.getFieldValue("updateFrequency");
										if (value && value !== currentUpdateFrequency) {
											form.setFieldValue("updateFrequency", value);
										}
									},
								}}
							/>
						)}

						{/* 面谈人 */}
						{needInterview && (
							<ProFormSelect
								name="ftfInterviewer"
								label="面谈人"
								placeholder="请选择面谈人"
								rules={[{ required: true, message: "请选择面谈人" }]}
								options={maintainerRoleOptions}
								disabled={mode === "readonly"}
								fieldProps={{
									onChange: handleFtfInterviewerChange,
								}}
							/>
						)}
					</div>
				);
			}}
		</ProFormDependency>
	);
}
