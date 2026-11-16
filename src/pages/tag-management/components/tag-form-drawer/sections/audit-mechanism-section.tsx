/**
 * 标签表单抽屉审核机制区块。
 *
 * 按标签库类型与标签类型决定区块标题及维护人字段展示，与查看抽屉 Descriptions 对齐。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import type { FORM_MODE } from "../constants";
import { SectionTitle } from "#src/components/section-title";
import { TAG_TYPE } from "#src/pages/tag-management/config";
import { ProFormDependency, ProFormItem, ProFormSelect } from "@ant-design/pro-components";
import { Input } from "antd";
import { getAuditMechanismSectionTitle, isTagType, isTalentManualTag } from "../utils";

/**
 * 审核机制表单组件属性。
 *
 * @author 王善能
 * @since 2026-06-11
 */
interface AuditMechanismSectionProps {
	/** 表单模式 */
	mode: FORM_MODE;
	/** 标签库类型（组织 / 人才） */
	tagLibraryType: TAG_RULE_TYPE_DICT;
	/** 审核人下拉选项 */
	auditorOptions: any[];
	/** 是否已启用面谈（启用时维护人不可改） */
	needInterview: boolean;
	/** 打开维护人选择弹窗 */
	onMaintainerModalOpen: () => void;
}

/**
 * 审核机制表单组件。
 *
 * 人才手工标签展示「标签维护与审核」及维护人；其余类型仅展示「标签审核」与审核人。
 *
 * @param props - 组件属性
 * @returns 审核机制表单 JSX
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function AuditMechanismSection({
	mode,
	tagLibraryType,
	auditorOptions,
	needInterview,
	onMaintainerModalOpen,
}: AuditMechanismSectionProps) {
	return (
		<ProFormDependency name={["tagType"]}>
			{({ tagType: currentTagType }) => {
				// 与查看抽屉共用工具函数，保证编辑/查看标题与维护人展示一致
				const sectionTitle = getAuditMechanismSectionTitle(tagLibraryType, currentTagType);
				const showMaintainer = isTalentManualTag(tagLibraryType, currentTagType);
				return (
					<div>
						<SectionTitle title={sectionTitle} className="mb-4" />

						{/* 手工标签的维护人（仅人才标签） */}
						{showMaintainer && (
							<ProFormDependency name={["maintainerName"]}>
								{({ maintainerName }) => (
									<>
										<ProFormItem
											name="maintainer"
											label="维护人"
											rules={[
												{
													required: isTagType(
														currentTagType,
														TAG_TYPE.MANUAL,
													),
													message: "请选择维护人",
												},
											]}
										>
											<Input
												placeholder="请选择人员/角色"
												value={maintainerName}
												readOnly
												onClick={() => {
													// 如果启用面谈，维护人禁止修改
													if (mode !== "readonly" && !needInterview) {
														onMaintainerModalOpen();
													}
												}}
												style={{
													cursor:
														mode === "readonly" || needInterview
															? "default"
															: "pointer",
												}}
												disabled={mode === "readonly" || needInterview} // 启用面谈时禁止修改
											/>
										</ProFormItem>
										<ProFormItem name="maintainerType" hidden>
											<Input />
										</ProFormItem>
										<ProFormItem name="maintainerName" hidden>
											<Input />
										</ProFormItem>
									</>
								)}
							</ProFormDependency>
						)}

						{/* 审核人 - 所有标签类型都显示 */}
						<ProFormSelect
							name="auditor"
							label="审核人"
							placeholder="请选择审核人"
							rules={[{ required: true, message: "请选择审核人" }]}
							options={auditorOptions}
							disabled={mode === "readonly"}
						/>
					</div>
				);
			}}
		</ProFormDependency>
	);
}
