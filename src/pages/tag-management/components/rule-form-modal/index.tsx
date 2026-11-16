import type { ProFormInstance } from "@ant-design/pro-components";

import type { RadioChangeEvent } from "antd";
import { checkDuplicateName, fetchRuleLibraryDetail } from "#src/api/tag-management/rule-library";
import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import {
	ModalForm,
	ProFormDependency,
	ProFormItem,
	ProFormRadio,
	ProFormText,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, ConfigProvider, Modal } from "antd";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
	FORM_RULES,
	TAG_CONFIG_TYPE_DICT,
	TAG_CONFIG_TYPE_OPTIONS,
	TAG_RULE_ONLINE_STATUS_DICT,
	TAG_RULE_TYPE_DICT,
} from "../../config";

/**
 * 标签规则表单数据接口
 */
export interface TagRuleFormData {
	/** 规则名称 */
	ruleName: string;
	/** 规则定义 */
	ruleDefinition: string;
	/** 配置方式 */
	configType: string;
	/** 数据源 */
	dataSource?: string;
	/** 字段 */
	fields?: string;
	/** 配置规则 */
	configRule?: string;
	/** 上线状态 */
	onlineStatus?: string;
}

/**
 * 弹窗模式类型
 */
export type ModalMode = "create" | "edit" | "readonly";

/**
 * 规则表单弹窗属性接口
 */
export interface RuleFormModalProps {
	/** 弹窗模式 */
	mode: ModalMode;
	/** 弹窗是否可见 */
	open: boolean;
	/** 弹窗关闭回调 */
	onOpenChange: (open: boolean) => void;
	/** 表单提交回调 */
	onFinish?: (values: TagRuleFormData) => Promise<boolean>;
	/** 规则ID（编辑模式或只读模式使用，会通过 useRequest 获取数据） */
	id?: string;
	/** 查看配置人员回调（编辑模式下现有标签配置使用） */
	onViewPersonnel?: () => void;
	/** 配置规则点击回调（创建模式下现有标签配置使用） */
	onConfigRule?: () => void;
	/** 标签类型（组织标签或人才标签） */
	type?: typeof TAG_RULE_TYPE_DICT.ORG | typeof TAG_RULE_TYPE_DICT.TALENT;
}

/**
 * 统一的规则表单弹窗组件（支持新增(create)、编辑(edit)两种模式）
 *
 * @param props - 组件属性
 * @param props.mode - 弹窗模式
 * @param props.open - 弹窗是否可见
 * @param props.onOpenChange - 弹窗关闭回调
 * @param props.onFinish - 表单提交回调
 * @param props.id - 规则ID（可选，编辑模式使用）
 * @param props.onViewPersonnel - 查看配置人员回调（可选）
 * @param props.onConfigRule - 配置规则点击回调（可选）
 * @param props.type - 标签类型（可选，默认为人才标签）
 * @returns 规则表单弹窗组件
 * @since 1.0.0
 */
export function RuleFormModal({
	mode,
	open,
	onOpenChange,
	onFinish,
	id,
	onViewPersonnel,
	onConfigRule,
	type = TAG_RULE_TYPE_DICT.TALENT,
}: RuleFormModalProps) {
	// 表单实例引用
	const formRef = useRef<ProFormInstance>();
	// 保存配置方式的旧值，用于在值改变前拦截
	const prevConfigTypeRef = useRef<string | undefined>();
	// 存储当前验证的 Promise 的 resolve/reject，用于取消之前的验证
	const currentValidationRef = useRef<{
		resolve: (value?: unknown) => void;
		reject: (reason?: any) => void;
	} | null>(null);

	// 编辑模式或只读模式：通过 id 请求数据
	const shouldFetchData = (mode === "edit" || mode === "readonly") && !!id;
	const { data: fetchedRecordData, loading: fetchedRecordLoading } = useRequest(
		() => fetchRuleLibraryDetail(id!),
		{
			ready: shouldFetchData && open,
			refreshDeps: [id, open],
			onError: (error) => {
				console.error("获取规则详情失败:", error);
			},
		},
	);

	// 编辑模式或只读模式使用的数据
	const recordData = fetchedRecordData;

	// 根据模式计算弹窗配置
	const modalConfig = useMemo(() => {
		if (mode === "create") {
			return {
				title: "新增规则",
				initialValues: {
					configType: TAG_CONFIG_TYPE_DICT.DATA_DEVELOPMENT,
				},
			};
		}
		if (mode === "readonly") {
			return {
				title: "查看规则",
				initialValues: {},
			};
		}
		// edit 模式
		return {
			title: "编辑规则",
			initialValues: {},
		};
	}, [mode]);

	// 判断配置方式是否应该禁用编辑
	// 当状态为"已下线"时，禁止编辑配置方式
	const isConfigModeDisabled = useMemo(() => {
		return mode === "edit" && recordData?.onlineStatus === TAG_RULE_ONLINE_STATUS_DICT.OFFLINE;
	}, [mode, recordData?.onlineStatus]);

	// 创建模式：弹窗打开时重置表单（使用 initialValues 初始化）
	useEffect(() => {
		if (!open || mode !== "create") {
			return;
		}

		// 重置表单，会使用 ModalForm 的 initialValues
		formRef.current?.resetFields();
		// 保存配置方式的初始值
		prevConfigTypeRef.current = TAG_CONFIG_TYPE_DICT.DATA_DEVELOPMENT;
	}, [open, mode]);

	// 编辑模式或只读模式：请求数据后初始化表单
	useEffect(() => {
		if (!open || (mode !== "edit" && mode !== "readonly") || !recordData) {
			return;
		}

		// 数据加载完成后，设置表单值
		formRef.current?.setFieldsValue(recordData);
		// 保存配置方式的初始值
		prevConfigTypeRef.current = recordData.configType;
	}, [open, mode, recordData]);

	// 防抖验证函数（使用 useMemo 确保在依赖变化时重新创建）
	const debouncedCheckName = useMemo(() => {
		return debounce(async (name: string, id: string | undefined) => {
			// 获取当前的验证 Promise 的 resolve/reject
			const validation = currentValidationRef.current;
			if (!validation) {
				return;
			}

			try {
				const result = await checkDuplicateName({
					id,
					name: name.trim(),
					type,
				});
				// 接口返回 true 表示重名，需要拒绝验证
				if (result === true) {
					validation.reject(new Error("规则名称已存在，请使用其他名称"));
				} else {
					validation.resolve();
				}
			} catch (error) {
				// 网络错误时跳过验证，避免影响用户体验
				console.error("重名校验失败:", error);
				validation.resolve();
			} finally {
				// 清除当前的验证引用
				currentValidationRef.current = null;
			}
		}, 500);
	}, [type]);

	// 规则名称验证器（使用 lodash debounce 实现防抖）
	const ruleNameValidator = useCallback(
		async (_: any, value: string) => {
			if (!value || !value.trim()) {
				return Promise.resolve();
			}

			const ruleId =
				(mode === "edit" || mode === "readonly") && recordData?.id
					? recordData.id
					: undefined;

			// 如果之前有未完成的验证，先取消它（通过 resolve，避免显示错误信息）
			if (currentValidationRef.current) {
				currentValidationRef.current.resolve();
				currentValidationRef.current = null;
			}

			// 返回一个新的 Promise，在防抖函数执行后 resolve/reject
			return new Promise((resolve, reject) => {
				// 存储当前的 resolve/reject
				currentValidationRef.current = { resolve, reject };
				// 调用防抖函数
				debouncedCheckName(value, ruleId);
			});
		},
		[mode, recordData?.id, debouncedCheckName],
	);

	// 渲染配置方式依赖的表单项
	const renderConfigModeFields = (configType: string) => {
		if (configType === TAG_CONFIG_TYPE_DICT.DATA_DEVELOPMENT) {
			// 数据开发模式
			return (
				<>
					<ProFormText
						name="dataSource"
						label="数据源"
						rules={FORM_RULES.dataSource}
						placeholder="请输入取数平台（模块）"
					/>
					<ProFormText
						name="fields"
						label="字段"
						rules={FORM_RULES.field}
						placeholder="请输入字段"
					/>
					<ProFormTextArea
						name="configRule"
						label="具体口径"
						rules={FORM_RULES.specificCriteria}
						placeholder="请输入具体取值逻辑1、若字段有特殊的过滤逻辑请备注，例：过滤离职员工的学历2、若存在多字段之间的逻辑请描述，例：第一学历为本科以上，且为新活力的毕业生"
						fieldProps={{
							maxLength: 500,
							showCount: {
								formatter: ({ count, maxLength }) =>
									`${count}${maxLength ? `/${maxLength}` : ""}`,
							},
							rows: 4,
						}}
					/>
				</>
			);
		} else if (configType === TAG_CONFIG_TYPE_DICT.EXISTING_TAG_CONFIG) {
			// 现有标签配置模式
			if (mode === "edit" || mode === "readonly") {
				// 编辑模式或只读模式：显示眼睛图标 + 查看符合规则人员按钮
				return (
					<ProFormItem label="具体规则" name="configRule">
						<ConfigProvider
							theme={{
								components: {
									Button: {
										iconGap: 1,
										paddingInline: 0,
									},
								},
							}}
						>
							<Button type="link" icon={<EyeOutlined />} onClick={onViewPersonnel}>
								查看符合规则人员
							</Button>
						</ConfigProvider>
					</ProFormItem>
				);
			}
			// 创建模式：显示输入框
			return (
				<ProFormItem label="具体规则" name="configRule">
					<ProFormText
						name="configRule"
						placeholder="点击配置"
						fieldProps={{
							suffix: (
								<EditOutlined style={{ color: "var(--ant-color-text-tertiary)" }} />
							),
							onClick: onConfigRule,
							style: { cursor: "pointer" },
							readOnly: true,
						}}
					/>
				</ProFormItem>
			);
		}
		return null;
	};

	/**
	 * 处理配置方式改变，在值改变之前拦截并显示确认弹窗
	 */
	const handleConfigTypeChange = useCallback((e: RadioChangeEvent) => {
		const newValue = e.target.value;
		const oldValue = prevConfigTypeRef.current ?? formRef.current?.getFieldValue("configType");

		// 如果值没有改变，直接返回
		if (oldValue === newValue) {
			return;
		}

		// 立即恢复旧值，阻止值改变（如果 oldValue 存在）
		if (oldValue !== undefined) {
			formRef.current?.setFieldsValue({
				configType: oldValue,
			});
		}

		// 显示确认弹窗
		Modal.confirm({
			title: "提示",
			content: "是否确认变更配置方式？变更后，原有方式的配置信息将会清除",
			centered: true,
			okText: "确认",
			cancelText: "取消",
			onOk: () => {
				// 确认后设置新值并清空相关字段
				formRef.current?.setFieldsValue({
					configType: newValue,
					configRule: undefined,
					dataSource: undefined,
					fields: undefined,
				});
				// 更新旧值引用
				prevConfigTypeRef.current = newValue;
			},
		});
	}, []);

	/**
	 * 处理表单提交
	 *
	 * @param values - 表单值
	 * @returns Promise<boolean> 是否提交成功
	 */
	const handleFinish = useCallback(
		async (values: TagRuleFormData) => {
			// 调用父组件传入的 onFinish
			if (onFinish) {
				return await onFinish(values);
			}
			return true;
		},
		[onFinish],
	);

	return (
		<ModalForm
			formRef={formRef}
			title={modalConfig.title}
			open={open}
			onOpenChange={onOpenChange}
			onFinish={handleFinish}
			submitter={{
				render: (props, dom) => {
					// readonly 模式下不显示提交按钮
					if (mode === "readonly") {
						return null;
					}
					// 返回默认按钮，并设置按钮文本
					return dom;
				},
				searchConfig: {
					submitText: mode === "edit" ? "更新" : "确定",
				},
			}}
			layout="horizontal"
			labelCol={{
				span: 4,
			}}
			wrapperCol={{
				span: 20,
			}}
			modalProps={{ destroyOnHidden: true, width: 572, centered: true }}
			initialValues={modalConfig.initialValues}
			colon={false}
			readonly={mode === "readonly"}
			requiredMark={mode !== "readonly"}
			loading={fetchedRecordLoading}
		>
			<ProFormText
				name="ruleName"
				label="规则名称"
				rules={[...FORM_RULES.ruleName, { validator: ruleNameValidator }]}
				placeholder="请输入规则名称"
			/>
			<ProFormTextArea
				name="ruleDefinition"
				label="规则定义"
				rules={FORM_RULES.ruleDefinition}
				placeholder="请输入规则定义"
				fieldProps={{
					maxLength: 100,
					showCount: {
						formatter: ({ count, maxLength }) =>
							`${count}${maxLength ? `/${maxLength}` : ""}`,
					},
					rows: 4,
				}}
			/>
			{/* TODO: 配置方式 hidden，默认选中数据开发 */}
			<ProFormRadio.Group
				name="configType"
				label="配置方式"
				rules={FORM_RULES.configMode}
				disabled={isConfigModeDisabled}
				options={TAG_CONFIG_TYPE_OPTIONS}
				hidden
				fieldProps={{
					onChange: handleConfigTypeChange,
				}}
			/>
			<ProFormDependency name={["configType"]}>
				{({ configType }) => renderConfigModeFields(configType)}
			</ProFormDependency>
		</ModalForm>
	);
}
