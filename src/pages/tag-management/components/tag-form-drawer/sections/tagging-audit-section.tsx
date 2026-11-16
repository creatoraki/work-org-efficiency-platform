/**
 * 标签表单抽屉打标审核机制区块。
 *
 * 仅人才标签库下的手工标签展示打标审核流程、附件证明等字段。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { FormInstance, RadioChangeEvent } from "antd";
import type { FORM_MODE } from "../constants";
import { SectionTitle } from "#src/components/section-title";
import {
	IS_REQUIRED_OPTIONS,
	TAG_RULE_TYPE_DICT,
	TAG_TYPE,
} from "#src/pages/tag-management/config";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
	ProFormDependency,
	ProFormItem,
	ProFormRadio,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Form, Input, Table } from "antd";
import { APPROVER_TYPE } from "../constants";
import { isTagType } from "../utils";

/**
 * 打标审核机制表单组件属性。
 *
 * @author 王善能
 * @since 2026-06-11
 */
interface TaggingAuditSectionProps {
	/** 表单实例 */
	form: FormInstance;
	/** 模式 */
	mode: FORM_MODE;
	/** 标签库类型 */
	tagLibraryType: TAG_RULE_TYPE_DICT;
	/** 是否需要附件证明 */
	needAttachment: boolean;
	/** 处理是否需要审核变化的回调 */
	handleNeedReviewChange: (e: RadioChangeEvent) => void;
	/** 处理是否需要附件证明变化的回调 */
	handleNeedAttachmentChange: (e: RadioChangeEvent) => void;
	/** 打开审批人选择弹窗的回调 */
	onOpenApproverModal: (
		fieldPath: string[],
		currentValue: any,
		currentName: string,
		currentType: string,
	) => void;
	/** 根据角色值获取角色标签的函数 */
	getRoleLabelByValue: (value?: string | null) => string | undefined;
}

/**
 * 打标审核机制表单组件（仅用于人才标签的手工标签）
 *
 * 包含以下字段：
 * - 是否需审核
 * - 审核流程（表格形式）
 * - 是否附件证明
 * - 附件证明要求
 *
 * @param props - 组件属性
 * @returns 打标审核机制表单 JSX
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function TaggingAuditSection({
	form,
	mode,
	tagLibraryType,
	needAttachment,
	handleNeedReviewChange,
	handleNeedAttachmentChange,
	onOpenApproverModal,
	getRoleLabelByValue,
}: TaggingAuditSectionProps) {
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
						<SectionTitle title="打标审核机制" className="mb-4" />

						{/* 是否需审核 */}
						<ProFormRadio.Group
							name="isAuditTagging"
							label="是否需审核"
							rules={[{ required: true, message: "请选择是否需审核" }]}
							options={IS_REQUIRED_OPTIONS}
							fieldProps={{
								onChange: handleNeedReviewChange,
							}}
							disabled={mode === "edit"}
						/>

						{/* 审核流程 - 使用 ProFormDependency 根据 isAuditTagging 字段值自动显示/隐藏 */}
						<ProFormDependency name={["isAuditTagging"]}>
							{({ isAuditTagging: currentIsAuditTagging }) => {
								const shouldShowAuditProcess = currentIsAuditTagging === "1";
								if (!shouldShowAuditProcess) {
									return null;
								}

								return (
									<>
										<ProFormItem
											name="auditProcessTagging"
											label="审核流程"
											required
											convertValue={(value) => {
												// 将 JSON 字符串转换为数组格式（初始化时）
												if (!value) {
													return [
														{
															step: 1,
															stepName: "步骤一",
															approver: "",
															type: "1",
															approverName: "",
														},
													];
												}
												if (typeof value === "string") {
													try {
														const parsedData = JSON.parse(value);
														let items: Array<{
															approver: any;
															type?: string;
														}> = [];
														if (Array.isArray(parsedData)) {
															if (
																parsedData.length > 0 &&
																typeof parsedData[0] === "object"
															) {
																items = parsedData.filter(
																	(item: any) => item.approver,
																);
															} else {
																items = parsedData
																	.filter((id: any) => id)
																	.map((id: any) => ({
																		approver: id,
																		type: "1",
																	}));
															}
														}
														if (items.length > 0) {
															const stepNumbers = [
																"一",
																"二",
																"三",
																"四",
																"五",
																"六",
																"七",
																"八",
																"九",
																"十",
															];
															return items.map(
																(item: any, index: number) => ({
																	step: index + 1,
																	stepName: `步骤${stepNumbers[index] || index + 1}`,
																	approver: item.approver,
																	type: item.type || "1",
																	approverName:
																		item.approverName || "",
																}),
															);
														}
													} catch {}
												} else if (Array.isArray(value)) {
													return value;
												}
												return [
													{
														step: 1,
														stepName: "步骤一",
														approver: "",
														type: "1",
														approverName: "",
													},
												];
											}}
											transform={(value) => {
												if (
													!value ||
													!Array.isArray(value) ||
													value.length === 0
												) {
													return { auditProcessTagging: undefined };
												}
												const processedData = value
													.filter(
														(item: any) =>
															item &&
															item.approver !== undefined &&
															item.approver !== null &&
															item.approver !== "",
													)
													.map((item: any) => ({
														stepName: item.stepName || "",
														approver: item.approver,
														approverName: item.approverName || "",
														type: item.type || "1", // 默认为 "1"（人员）
													}));
												return {
													auditProcessTagging:
														processedData.length > 0
															? JSON.stringify(processedData)
															: undefined,
												};
											}}
											rules={[
												{
													validator: async () => {
														const auditProcessTagging =
															form.getFieldValue(
																"auditProcessTagging",
															) || [];
														if (auditProcessTagging.length === 0) {
															throw new Error(
																"请至少添加一个审批步骤",
															);
														}
														const incompleteSteps = [];
														for (
															let i = 0;
															i < auditProcessTagging.length;
															i++
														) {
															const step = auditProcessTagging[i];
															if (!step?.approver) {
																incompleteSteps.push(i + 1);
															}
														}
														if (incompleteSteps.length > 0) {
															throw new Error(
																`第${incompleteSteps.join("、")}个审批步骤信息不完整`,
															);
														}
														return Promise.resolve();
													},
												},
											]}
										>
											<Form.List
												name="auditProcessTagging"
												initialValue={[
													{
														step: 1,
														stepName: "步骤1",
														approver: "",
														type: "1",
														approverName: "",
													},
												]}
											>
												{(fields, { add, remove }) => {
													const dataSource = fields.map(
														(field, index) => ({
															key: field.key,
															index: index + 1,
															field,
															stepName: field.name,
															approver: field.name,
														}),
													);

													const columns = [
														{
															title: "审批步骤",
															key: "stepName",
															width: 200,
															className: "drag-visible",
															render: (_: any, record: any) => (
																<Form.Item
																	{...record.field}
																	name={[
																		record.field.name,
																		"stepName",
																	]}
																	className="mb-0"
																	rules={[
																		{
																			required: true,
																			message:
																				"请输入审批步骤名称",
																		},
																		{
																			max: 50,
																			message:
																				"审批步骤名称不能超过50个字符",
																		},
																	]}
																>
																	<Input
																		placeholder="请输入审批步骤名称"
																		size="small"
																	/>
																</Form.Item>
															),
														},
														{
															title: "审批人",
															key: "approver",
															width: 300,
															render: (_: any, record: any) => (
																<Form.Item
																	{...record.field}
																	name={[
																		record.field.name,
																		"approver",
																	]}
																	className="mb-0"
																	rules={[
																		{
																			required: true,
																			message: "请选择审批人",
																		},
																	]}
																>
																	<Form.Item
																		noStyle
																		name={[
																			record.field.name,
																			"type",
																		]}
																		hidden
																	>
																		<Input type="hidden" />
																	</Form.Item>
																	<Form.Item
																		noStyle
																		name={[
																			record.field.name,
																			"approverName",
																		]}
																	>
																		<Input
																			placeholder="请选择人员/角色"
																			readOnly
																			onClick={() => {
																				const fieldPath = [
																					"auditProcessTagging",
																					record.field
																						.name,
																					"approver",
																				];
																				const currentValue =
																					form.getFieldValue(
																						fieldPath,
																					);
																				const currentName =
																					form.getFieldValue(
																						[
																							record
																								.field
																								.name,
																							"approverName",
																						],
																					);
																				const currentType =
																					form.getFieldValue(
																						[
																							record
																								.field
																								.name,
																							"type",
																						],
																					);
																				let approverValue: any;
																				if (currentValue) {
																					if (
																						currentType ===
																						APPROVER_TYPE.ROLE
																					) {
																						const roleLabel =
																							getRoleLabelByValue(
																								currentValue,
																							);
																						if (
																							roleLabel
																						) {
																							approverValue =
																								{
																									type: "role" as const,
																									typeValue:
																										APPROVER_TYPE.ROLE,
																									role: String(
																										currentValue,
																									),
																								};
																						}
																					} else {
																						const nameStr =
																							String(
																								currentName ||
																									"",
																							);
																						const match =
																							nameStr.match(
																								/^([^(]+)\(([^)]+)\)$/,
																							);
																						if (match) {
																							approverValue =
																								{
																									type: "person" as const,
																									typeValue:
																										APPROVER_TYPE.PERSON,
																									person: {
																										id: Number(
																											currentValue,
																										),
																										name: match[1],
																										deptPath:
																											match[2],
																									},
																								};
																						}
																					}
																				}
																				onOpenApproverModal(
																					fieldPath,
																					approverValue,
																					currentName,
																					currentType,
																				);
																			}}
																			className="cursor-pointer"
																			size="small"
																		/>
																	</Form.Item>
																</Form.Item>
															),
														},
														{
															title: "操作",
															key: "action",
															width: 60,
															align: "center" as const,
															render: (_: any, record: any) =>
																(mode === "add" ||
																	mode === "edit") && (
																	<Button
																		type="text"
																		danger
																		icon={<DeleteOutlined />}
																		onClick={() => {
																			if (fields.length > 1) {
																				remove(
																					record.field
																						.name,
																				);
																				setTimeout(() => {
																					form.validateFields(
																						[
																							"auditProcessTagging",
																						],
																					);
																				}, 0);
																			}
																		}}
																		disabled={
																			fields.length <= 1
																		}
																		size="small"
																		title={
																			fields.length <= 1
																				? "至少保留一个审批步骤"
																				: "删除"
																		}
																	/>
																),
														},
													];

													return (
														<div className="w-full">
															<Table
																dataSource={dataSource}
																columns={columns}
																pagination={false}
																size="small"
																scroll={{ y: 320 }}
																className="mb-4"
																bordered
															/>
															{(mode === "add" ||
																mode === "edit") && (
																<Button
																	type="dashed"
																	icon={<PlusOutlined />}
																	onClick={() => {
																		const nextStepNumber =
																			fields.length + 1;
																		add({
																			stepName: `步骤${nextStepNumber}`,
																			approver: "",
																		});
																	}}
																	className="w-full"
																>
																	添加审批步骤
																</Button>
															)}
														</div>
													);
												}}
											</Form.List>
										</ProFormItem>

										{/* 是否附件证明 */}
										<ProFormRadio.Group
											name="isAttProofTagging"
											label="是否附件证明"
											rules={[
												{
													required: true,
													message: "请选择是否需要附件证明",
												},
											]}
											options={IS_REQUIRED_OPTIONS}
											fieldProps={{
												onChange: handleNeedAttachmentChange,
											}}
										/>

										{/* 附件证明要求 */}
										{needAttachment && (
											<ProFormTextArea
												name="attProofReqsTagging"
												label="附件证明要求"
												placeholder="请输入附件证明要求"
												rules={[
													{
														required: true,
														message: "请输入附件证明要求",
													},
												]}
												fieldProps={{
													rows: 1,
												}}
											/>
										)}
									</>
								);
							}}
						</ProFormDependency>
					</div>
				);
			}}
		</ProFormDependency>
	);
}
