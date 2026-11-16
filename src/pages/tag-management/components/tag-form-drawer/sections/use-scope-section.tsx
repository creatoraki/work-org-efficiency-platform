import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import { SectionTitle } from "#src/components/section-title";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { ProFormDependency, ProFormItem } from "@ant-design/pro-components";
import { TreeSelect } from "antd";
import { FORM_MODE, RULE_SOURCE_VALUES } from "../constants";

/**
 * 使用范围表单组件属性
 */
interface UseScopeSectionProps {
	/** 模式 */
	mode: FORM_MODE;
	/** 标签库类型 */
	tagLibraryType: TAG_RULE_TYPE_DICT;
	/** 岗位-职位树数据（处理后的） */
	processedJobPositionTreeData: Array<JobPositionTreeNode & { title: string }>;
	/** 岗位-职位树数据（原始） */
	jobPositionTreeData?: JobPositionTreeNode[];
	/** 岗位-职位树加载状态 */
	jobPositionLoading: boolean;
}

/**
 * 使用范围表单组件（仅用于人才标签）
 *
 * 包含以下字段：
 * - 人员范围（树形选择器）
 *
 * 根据标签类型和规则选取类型显示不同的内容：
 * - 智能标签：显示"以规则命中的人员范围为准"
 * - 系统标签+自定义规则：显示"以规则命中的人员范围为准"
 * - 其他情况：显示树形选择器
 *
 * @param props - 组件属性
 * @returns 使用范围表单 JSX
 */
export function UseScopeSection({
	mode,
	tagLibraryType,
	processedJobPositionTreeData,
	jobPositionTreeData,
	jobPositionLoading,
}: UseScopeSectionProps) {
	// 仅人才标签显示
	if (tagLibraryType !== TAG_RULE_TYPE_DICT.TALENT) {
		return null;
	}

	return (
		<ProFormDependency name={["tagType", "ruleSelectionType"]}>
			{({ tagType: currentTagType, ruleSelectionType }) => {
				const isSystemTag = currentTagType === TAG_TYPE.SYSTEM;
				const shouldUseRuleScope =
					(isSystemTag && ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE) ||
					currentTagType === TAG_TYPE.INTELLIGENT;

				return (
					<div>
						<SectionTitle title="人员范围" className="mb-4" />

						{shouldUseRuleScope ? (
							<ProFormItem name="useScope" label="人员范围">
								<span>以规则命中的人员范围为准</span>
							</ProFormItem>
						) : (
							<ProFormItem
								name="useScope"
								label="人员范围"
								rules={[{ required: true, message: "请选择人员范围" }]}
								convertValue={(value) => {
									if (!Array.isArray(value)) {
										return [];
									}
									if (
										value.length > 0 &&
										typeof value[0] === "object" &&
										value[0] !== null
									) {
										return value.map((item: { id: string | number }) => {
											return String(item.id || "0");
										});
									}
									return value;
								}}
								transform={(value) => {
									if (!Array.isArray(value) || value.length === 0) {
										return { tagPositionList: [{ id: "0", type: "root" }] };
									}

									if (
										value.length > 0 &&
										typeof value[0] === "object" &&
										value[0] !== null &&
										"id" in value[0] &&
										"type" in value[0]
									) {
										return {
											tagPositionList: value.map(
												(item: { id: string | number; type: string }) => ({
													id: String(item.id || "0"),
													type: item.type,
												}),
											),
										};
									}

									// 正常情况：value 是字符串数组（Tree 组件返回的）
									const findNodeType = (
										id: string,
										nodes: JobPositionTreeNode[],
									): string => {
										for (const node of nodes) {
											if (String(node.id) === id) return node.type;
											if (node.children?.length) {
												const type = findNodeType(id, node.children);
												if (type) return type;
											}
										}
										return "root";
									};

									const treeData = jobPositionTreeData || [];
									return {
										tagPositionList: value.map((id: string) => ({
											id: String(id || "0"),
											type: findNodeType(id, treeData),
										})),
									};
								}}
							>
								<TreeSelect
									variant="outlined"
									treeData={processedJobPositionTreeData}
									multiple
									treeCheckable
									showSearch
									treeNodeFilterProp="label"
									maxTagCount="responsive"
									showCheckedStrategy={TreeSelect.SHOW_PARENT}
									loading={jobPositionLoading}
									placeholder="请选择人员范围"
									disabled={mode === FORM_MODE.READONLY}
									fieldNames={{
										label: "title",
										value: "id",
										children: "children",
									}}
								/>
							</ProFormItem>
						)}
					</div>
				);
			}}
		</ProFormDependency>
	);
}
