/**
 * 标签表单抽屉基础信息区块。
 *
 * 承载标签类型、规则选取、复合规则入口及标签值等基础字段的渲染与联动。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { UnassociatedRuleItem } from "#src/api/tag-management/rule-library";
import type { FormInstance, SelectProps } from "antd";
import type { FORM_MODE as FormModeType } from "../constants";
import type { BusinessCategoryOption } from "../utils";
import { fetchUnassociatedRules } from "#src/api/tag-management/rule-library";
import AiIcon from "#src/assets/svg/ai-icon.svg?react";
import { SectionTitle } from "#src/components/section-title";
import { TAG_RULE_TYPE_DICT, TAG_TYPE } from "#src/pages/tag-management/config";
import { cn } from "#src/utils";
import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
	ProFormDatePicker,
	ProFormDependency,
	ProFormItem,
	ProFormRadio,
	ProFormSelect,
	ProFormText,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { Button, Divider, Form, Input, Radio, Select, Space } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { FORM_MODE, RULE_SOURCE_VALUES, TAG_VALUE_PLACEHOLDER } from "../constants";
import { shouldValidateTagNameDuplicate } from "./basic-info-section-utils";
import { BusinessCategoryFormItem } from "./business-category-form-item";

/**
 * 判断标签名称是否允许用户编辑。
 *
 * 只读、智能标签、系统标签+自定义规则场景下名称由系统回填或禁止修改，
 * 不应挂载重名校验规则。
 *
 * @param mode - 表单模式
 * @param tagType - 当前标签类型
 * @param ruleSelectionType - 规则选取方式
 * @returns 是否可编辑标签名称
 *
 * @author 王善能
 * @since 2026-06-23
 */
function isTagNameEditable(
	mode: FormModeType,
	tagType?: string,
	ruleSelectionType?: string,
): boolean {
	if (mode === FORM_MODE.READONLY) {
		return false;
	}
	if (tagType === TAG_TYPE.INTELLIGENT) {
		return false;
	}
	if (tagType === TAG_TYPE.SYSTEM && ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE) {
		return false;
	}
	return true;
}

/**
 * 基础信息表单组件属性。
 *
 * @author 王善能
 * @since 2026-06-11
 */
interface BasicInfoSectionProps {
	form: FormInstance;
	mode: FormModeType;
	tagLibraryType: TAG_RULE_TYPE_DICT;
	filteredTagTypeOptions: any[];
	businessCategoryOptions: BusinessCategoryOption[];
	sensitivityLevelOptions: any[];
	updateFrequencyOptions: any[];
	tagNameValidator: (rule: any, value: string) => Promise<void>;
	onTagTypeChange: (nextTagType: TAG_TYPE) => void | Promise<void>;
	onStartAiDescription: () => void;
	onViewAiTagRule: () => void;
	onViewTagRule: () => void;
	onStartTagGeneration: () => void;
	onUpdateFrequencyChange: (value: string) => void;
	onRuleSelectionTypeChange: (nextRuleSelectionType: string) => void | Promise<void>;
	onRuleLibrarySelectionSync?: () => void;
	/** 是否显示 AI 描述入口 */
	showAiDescriptionButton?: boolean;
	/** 是否允许重新向 AI 描述 */
	canStartAiDescription?: boolean;
	/** 是否允许查看 AI 标签结果 */
	canViewAiTagResult?: boolean;
	/** AI 描述按钮文案 */
	aiDescriptionButtonText?: string;
}

/**
 * 根据规则 ID 去重规则下拉选项
 *
 * 查看规则标签抽屉关闭会触发表单重渲染，ProFormSelect 会重新请求并合并当前选中项。
 * 这里以前端做一次稳定去重，避免当前规则在下拉列表中重复出现。
 *
 * @param rules - 接口返回的规则列表
 * @returns 去重后的规则列表
 *
 * @author 王善能
 * @since 2026-06-11
 */
function uniqueRulesById(rules: UnassociatedRuleItem[]) {
	const ruleMap = new Map<string, UnassociatedRuleItem>();
	rules.forEach((rule) => {
		const ruleId = String(rule.id);
		if (!ruleMap.has(ruleId)) {
			ruleMap.set(ruleId, rule);
		}
	});
	return Array.from(ruleMap.values());
}

interface RuleLibrarySelectProps {
	value?: string;
	onChange?: (value?: string) => void;
	form: FormInstance;
	tagLibraryType: TAG_RULE_TYPE_DICT;
	tagRulesId?: string;
	disabled?: boolean;
	style?: SelectProps["style"];
	active?: boolean;
	canView?: boolean;
	onViewTagRule: () => void;
	onAfterProgrammaticChange?: () => void;
}

/**
 * 规则库选择器
 *
 * 使用 antd Select 承接表单字段，避免 ProFormSelect 的 request 缓存与当前选中项合并
 * 在查看规则标签抽屉关闭后的重渲染中产生重复选项。
 *
 * @param props - 组件属性
 * @param props.value - 当前选中的规则 ID
 * @param props.onChange - 表单字段变更回调
 * @param props.form - 表单实例，用于联动回填标签值
 * @param props.tagLibraryType - 标签库类型
 * @param props.tagRulesId - 当前规则 ID，用于接口补回当前选中项
 * @param props.disabled - 是否禁用选择器
 * @param props.style - 选择器样式
 * @param props.active - 是否启用远程规则加载
 * @param props.canView - 是否允许查看规则标签
 * @param props.onViewTagRule - 查看规则标签回调
 * @param props.onAfterProgrammaticChange - 程序化回填后的真相源同步回调
 * @returns 规则库选择器
 *
 * @author 王善能
 * @since 2026-06-11
 */
function RuleLibrarySelect({
	value,
	onChange,
	form,
	tagLibraryType,
	tagRulesId,
	disabled,
	style,
	active = true,
	canView = false,
	onViewTagRule,
	onAfterProgrammaticChange,
}: RuleLibrarySelectProps) {
	const [rules, setRules] = useState<UnassociatedRuleItem[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let ignore = false;

		async function loadRules() {
			if (!active) {
				setRules([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			try {
				const list = await fetchUnassociatedRules({
					type: tagLibraryType,
					id: tagRulesId ? String(tagRulesId) : undefined,
				});
				if (!ignore) {
					setRules(uniqueRulesById(list || []));
				}
			} finally {
				if (!ignore) {
					setLoading(false);
				}
			}
		}

		loadRules();

		return () => {
			ignore = true;
		};
	}, [active, tagLibraryType, tagRulesId]);

	const options = useMemo<SelectProps["options"]>(
		() =>
			rules.map((item) => ({
				label: item.ruleName,
				value: String(item.id),
			})),
		[rules],
	);

	return (
		<Space split={<Divider type="vertical" />}>
			<Select
				allowClear
				showSearch
				value={value}
				options={options}
				loading={loading}
				disabled={disabled}
				style={style}
				placeholder="选取已上线的规则"
				optionFilterProp="label"
				onChange={(nextValue) => {
					onChange?.(nextValue);
					const selectedRule = rules.find(
						(rule) => String(rule.id) === String(nextValue),
					);
					form.setFieldsValue({
						tagValue: selectedRule?.tagValue || "",
						...(nextValue ? {} : { updateFrequency: undefined }),
					});
					onAfterProgrammaticChange?.();
				}}
			/>

			<span
				onClick={canView ? onViewTagRule : undefined}
				className={cn(
					"inline-flex items-center gap-0.5",
					canView ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50",
				)}
				style={{ color: "var(--ant-color-primary)" }}
			>
				<EyeOutlined className="h-4 w-4" />
				查看规则标签
			</span>
		</Space>
	);
}

/**
 * 基础信息表单组件。
 *
 * 根据表单 mode 控制复合规则按钮文案与交互：只读模式仅查看，编辑模式支持查看与编辑。
 *
 * @param props - 组件属性
 * @param props.form - 表单实例
 * @param props.mode - 表单模式（add / edit / readonly）
 * @param props.tagLibraryType - 标签库类型
 * @param props.filteredTagTypeOptions - 可选标签类型
 * @param props.businessCategoryOptions - 业务类别树形选项
 * @param props.sensitivityLevelOptions - 敏感程度选项
 * @param props.updateFrequencyOptions - 更新频次选项
 * @param props.tagNameValidator - 标签名称校验器
 * @param props.onTagTypeChange - 标签类型切换回调
 * @param props.onStartAiDescription - 打开 AI 描述入口
 * @param props.onViewAiTagRule - 查看 AI 标签结果
 * @param props.onViewTagRule - 查看规则标签
 * @param props.onStartTagGeneration - 打开复合规则 iframe 回调
 * @param props.onUpdateFrequencyChange - 更新频次变化回调
 * @param props.onRuleSelectionTypeChange - 规则选取切换回调
 * @param props.onRuleLibrarySelectionSync - 规则库程序化回填后同步单标签真相源
 * @param props.showAiDescriptionButton - 是否显示 AI 描述入口
 * @param props.canStartAiDescription - 是否允许开始或重新描述
 * @param props.canViewAiTagResult - 是否允许查看 AI 标签结果
 * @param props.aiDescriptionButtonText - AI 描述入口按钮文案
 * @returns 基础信息表单区块
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function BasicInfoSection({
	form,
	mode,
	tagLibraryType,
	filteredTagTypeOptions,
	businessCategoryOptions,
	sensitivityLevelOptions,
	updateFrequencyOptions,
	tagNameValidator,
	onTagTypeChange,
	onStartAiDescription,
	onViewAiTagRule,
	onViewTagRule,
	onStartTagGeneration,
	onUpdateFrequencyChange,
	onRuleSelectionTypeChange,
	onRuleLibrarySelectionSync,
	showAiDescriptionButton = false,
	canStartAiDescription = false,
	canViewAiTagResult = false,
	aiDescriptionButtonText = "开始向AI描述标签",
}: BasicInfoSectionProps) {
	const currentTagTypeValue = Form.useWatch("tagType", form);

	/**
	 * 获取复合规则操作按钮文案。
	 *
	 * 未配置 aliTagCode 时引导新建；已配置时按 mode 区分只读查看与编辑入口。
	 *
	 * @param aliTagCode - 复合规则 aliTagCode
	 * @returns 按钮展示文案
	 *
	 * @author 王善能
	 * @since 2026-06-11
	 */
	const getTagGenerationButtonText = (aliTagCode?: string) => {
		if (!aliTagCode) {
			return "新建复合规则";
		}
		return mode === "readonly" ? "查看复合规则" : "查看 | 编辑复合规则";
	};

	return (
		<div>
			<SectionTitle title="基础信息" className="mb-4" />

			{/* 标签类型 */}
			<Form.Item
				name="tagType"
				label="标签类型"
				rules={[{ required: true, message: "请选择标签类型" }]}
				trigger="__manual_tag_type_change__"
			>
				<Radio.Group
					value={currentTagTypeValue}
					onChange={(e) => {
						void onTagTypeChange(String(e.target.value) as TAG_TYPE);
					}}
					disabled={mode === "edit"}
					className="[&_label]:flex [&_label]:h-8 [&_label]:items-center"
				>
					<Space direction="vertical" size={8}>
						{filteredTagTypeOptions?.map((option) => (
							<Radio key={option.value} value={option.value}>
								{option.label}
								{option.remark ? ` (${option.remark})` : ""}
							</Radio>
						))}
					</Space>
				</Radio.Group>
			</Form.Item>

			{/* 标签名称 */}
			<ProFormDependency name={["ruleSelectionType", "tagType", "isExisting"]}>
				{({ ruleSelectionType, tagType: currentTagType, isExisting }) => {
					const tagNameEditable = isTagNameEditable(
						mode,
						currentTagType,
						ruleSelectionType,
					);
					const shouldValidateDuplicateName = shouldValidateTagNameDuplicate({
						mode,
						tagNameEditable,
						tagType: currentTagType,
						isExisting,
					});

					return (
						<ProFormText
							name="tagName"
							label="标签名称"
							placeholder="请输入标签名称"
							validateFirst
							validateDebounce={500}
							rules={[
								{ required: true, message: "请输入标签名称" },
								...(shouldValidateDuplicateName
									? [
											{
												validator: tagNameValidator,
												validateTrigger:
													mode === FORM_MODE.ADD
														? ["onBlur", "onSubmit"]
														: "onBlur",
											},
										]
									: []),
							]}
							disabled={!tagNameEditable}
						/>
					);
				}}
			</ProFormDependency>

			{/* 智能标签特有字段 */}
			<ProFormDependency name={["tagType"]}>
				{({ tagType: currentTagType }) => {
					return (
						<ProFormItem
							name="aiTagDescription"
							label="AI标签"
							rules={[{ required: false, message: "请开始向AI描述标签" }]}
							hidden={currentTagType !== TAG_TYPE.INTELLIGENT}
						>
							<div>
								<Input hidden />
								<div className="flex items-center gap-2">
									{showAiDescriptionButton && (
										<span
											onClick={
												canStartAiDescription
													? onStartAiDescription
													: undefined
											}
											className={cn(
												"inline-flex items-center gap-0.5",
												canStartAiDescription
													? "cursor-pointer hover:opacity-80"
													: "cursor-not-allowed opacity-50",
											)}
											style={{ color: "var(--ant-color-primary)" }}
										>
											<AiIcon className="h-4 w-4" />
											{aiDescriptionButtonText}
										</span>
									)}
									{showAiDescriptionButton && <Divider type="vertical" />}
									<span
										onClick={canViewAiTagResult ? onViewAiTagRule : undefined}
										className={cn(
											"inline-flex items-center gap-0.5",
											canViewAiTagResult
												? "cursor-pointer hover:opacity-80"
												: "cursor-not-allowed opacity-50",
										)}
										style={{ color: "var(--ant-color-primary)" }}
									>
										<EyeOutlined className="h-4 w-4" />
										查看标签结果
									</span>
								</div>
							</div>
						</ProFormItem>
					);
				}}
			</ProFormDependency>

			{/* 系统标签特有字段 */}
			<ProFormDependency name={["tagType", "tagRulesId", "ruleSelectionType"]}>
				{({ tagType: currentTagType, tagRulesId, ruleSelectionType }) => {
					const isSystemTag = currentTagType === TAG_TYPE.SYSTEM;
					const hasSelectedRule = !!tagRulesId;
					const canView = isSystemTag && hasSelectedRule;
					const isFromLibrary = ruleSelectionType === RULE_SOURCE_VALUES.FROM_LIBRARY;
					const isCustomRule = ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
					const isTalentTagLibrary = tagLibraryType === TAG_RULE_TYPE_DICT.TALENT;

					return (
						<>
							<ProFormText name="ruleSelectionType" hidden />

							{isSystemTag && isTalentTagLibrary ? (
								<ProFormItem label="规则来源" required>
									<Radio.Group
										value={ruleSelectionType || RULE_SOURCE_VALUES.FROM_LIBRARY}
										optionType="button"
										buttonStyle="solid"
										disabled={mode === "readonly" || mode === "edit"}
										onChange={(e) => {
											void onRuleSelectionTypeChange(String(e.target.value));
										}}
									>
										<Radio.Button value={RULE_SOURCE_VALUES.FROM_LIBRARY}>
											规则库
										</Radio.Button>
										<Radio.Button value={RULE_SOURCE_VALUES.CUSTOM_RULE}>
											复合规则
										</Radio.Button>
									</Radio.Group>
								</ProFormItem>
							) : null}

							{/* 选择规则 - 从规则库选取 */}
							<ProFormItem
								name="tagRulesId"
								label={isTalentTagLibrary ? "选择规则" : "规则来源"}
								rules={[
									{
										required:
											currentTagType === TAG_TYPE.SYSTEM && isFromLibrary,
										message: "请选择规则",
									},
								]}
								hidden={!isSystemTag || !isFromLibrary}
							>
								<RuleLibrarySelect
									form={form}
									tagLibraryType={tagLibraryType}
									tagRulesId={tagRulesId}
									disabled={mode === "readonly" || mode === "edit"}
									style={{ width: mode === "readonly" ? "100%" : "300px" }}
									active={isSystemTag && isFromLibrary}
									canView={canView}
									onViewTagRule={onViewTagRule}
									onAfterProgrammaticChange={onRuleLibrarySelectionSync}
								/>
							</ProFormItem>

							{/* 选择规则 - 新建自定义复合规则（仅人才标签显示） */}
							<ProFormDependency name={["aliTagCode"]}>
								{({ aliTagCode }) => (
									<ProFormItem
										label="复合规则"
										hidden={
											!isSystemTag || !isTalentTagLibrary || !isCustomRule
										}
									>
										<Form.Item noStyle dependencies={["aliTagCode"]}>
											{() => {
												const aliTagCodeErrors =
													form.getFieldError("aliTagCode");
												const validateStatus =
													aliTagCodeErrors.length > 0
														? "error"
														: undefined;
												const help =
													aliTagCodeErrors.length > 0
														? aliTagCodeErrors[0]
														: undefined;

												return (
													<Form.Item
														validateStatus={validateStatus}
														help={help}
														className="mb-0"
													>
														<Button
															type="link"
															disabled={
																mode === "readonly" && !aliTagCode
															}
															onClick={onStartTagGeneration}
															icon={
																aliTagCode ? (
																	mode === "readonly" ? (
																		<EyeOutlined />
																	) : (
																		<EditOutlined />
																	)
																) : (
																	<PlusOutlined />
																)
															}
															className="pl-0"
														>
															{getTagGenerationButtonText(aliTagCode)}
														</Button>
													</Form.Item>
												);
											}}
										</Form.Item>
									</ProFormItem>
								)}
							</ProFormDependency>
						</>
					);
				}}
			</ProFormDependency>

			{/* 标签值 */}
			<ProFormDependency name={["tagType", "ruleSelectionType"]}>
				{({ tagType: currentTagType, ruleSelectionType }) => {
					const isSystemTag = currentTagType === TAG_TYPE.SYSTEM;
					const isCustomRule =
						isSystemTag && ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
					const isIntelligentTag = currentTagType === TAG_TYPE.INTELLIGENT;

					return (
						<ProFormTextArea
							name="tagValue"
							label="标签值"
							placeholder={TAG_VALUE_PLACEHOLDER[currentTagType] || "请输入标签值"}
							rules={[{ required: true, message: "请输入标签值" }]}
							fieldProps={{
								rows: 3,
								maxLength: 500,
								showCount: {
									formatter: ({ count, maxLength }) =>
										`${count}${maxLength ? `/${maxLength}` : ""}`,
								},
							}}
							disabled={
								mode === "readonly" ||
								isIntelligentTag ||
								isSystemTag ||
								isCustomRule
							}
						/>
					);
				}}
			</ProFormDependency>

			{/* 标签描述 */}
			<ProFormDependency name={["ruleSelectionType"]}>
				{({ ruleSelectionType }) => {
					const isCustomRule = ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
					return (
						<ProFormTextArea
							name="tagDescription"
							label="标签描述"
							placeholder="请输入标签描述，字数限制为 500 字"
							fieldProps={{
								rows: 3,
								maxLength: 500,
								showCount: {
									formatter: ({ count, maxLength }) =>
										`${count}${maxLength ? `/${maxLength}` : ""}`,
								},
							}}
							disabled={mode === "readonly" || isCustomRule}
						/>
					);
				}}
			</ProFormDependency>

			{/* 业务类别 */}
			<ProFormDependency name={["tagType", "ruleSelectionType"]}>
				{({ tagType: currentTagType, ruleSelectionType }) => {
					const isSystemTag = currentTagType === TAG_TYPE.SYSTEM;
					const isCustomRule =
						isSystemTag && ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
					const isReadonlyDisplay = mode === "readonly" || isCustomRule;
					const businessCategoryRules = [{ required: true, message: "请选择业务类别" }];

					return (
						<BusinessCategoryFormItem
							name="businessCategory"
							label="业务类别"
							placeholder="请选择业务类别"
							options={businessCategoryOptions}
							rules={businessCategoryRules}
							readonly={isReadonlyDisplay}
						/>
					);
				}}
			</ProFormDependency>

			{/* 是否必填 */}
			<ProFormRadio.Group
				name="isRequired"
				label="是否必填"
				rules={[{ required: true, message: "请选择是否必填" }]}
				options={[
					{ label: "是", value: "1" },
					{ label: "否", value: "0" },
				]}
				disabled={mode === "readonly"}
			/>

			{/* 敏感程度 */}
			<ProFormDependency name={["tagType", "ruleSelectionType"]}>
				{({ tagType: currentTagType, ruleSelectionType }) => {
					const isSystemTag = currentTagType === TAG_TYPE.SYSTEM;
					const isCustomRule =
						isSystemTag && ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
					return (
						<ProFormSelect
							name="sensitivityLevel"
							label="敏感程度"
							placeholder="请选择敏感程度"
							rules={[{ required: true, message: "请选择敏感程度" }]}
							options={sensitivityLevelOptions}
							disabled={mode === "readonly" || isCustomRule}
						/>
					);
				}}
			</ProFormDependency>

			{/* 到期时间 */}
			<ProFormDatePicker
				name="existenceCycle"
				label="到期时间"
				placeholder="请选择到期时间"
				rules={[{ required: true, message: "请选择到期时间" }]}
				valueType="date"
				fieldProps={{
					format: "YYYY-MM-DD",
					disabledDate: (current: dayjs.Dayjs) =>
						current && current < dayjs().startOf("day"),
					presets: [
						{
							label: "永久有效",
							value: dayjs("2099-12-31"),
						},
						{
							label: "一年后",
							value: dayjs().add(1, "year"),
						},
						{
							label: "半年后",
							value: dayjs().add(6, "month"),
						},
						{
							label: "一季度后",
							value: dayjs().add(3, "month"),
						},
						{
							label: "一个月后",
							value: dayjs().add(1, "month"),
						},
					],
				}}
				disabled={mode === "readonly"}
			/>

			{/* 更新频次 */}
			<ProFormDependency name={["tagType"]}>
				{({ tagType: currentTagType }) => (
					<ProFormSelect
						name="updateFrequency"
						label="更新频次"
						placeholder="请选择更新频次"
						rules={[{ required: true, message: "请选择更新频次" }]}
						options={updateFrequencyOptions}
						fieldProps={{
							onChange: onUpdateFrequencyChange,
						}}
						disabled={mode === "edit" && currentTagType === TAG_TYPE.INTELLIGENT}
					/>
				)}
			</ProFormDependency>

			{/* 智能标签生命周期字段：始终 hidden 注册，保证编辑态 setFieldsValue 后 getFieldsValue 可稳定取回 */}
			<ProFormText name="isExisting" hidden />
			<ProFormText name="aliTagCode" hidden />
			<ProFormText name="aiSessionId" hidden />
		</div>
	);
}
