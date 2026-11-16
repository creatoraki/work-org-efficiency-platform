/**
 * 搜索表单区块组件
 *
 * 提供标签名称和标签状态的筛选功能
 */

import type { DictOption } from "#src/api/system/dict/types";
import type { FormInstance } from "antd";
import { Button, ConfigProvider, Form, Input, Select, Space } from "antd";

/**
 * 搜索表单区块属性
 */
interface SearchFormSectionProps {
	/** 表单实例 */
	form: FormInstance;
	/** 是否为审核模式 */
	isAuditMode: boolean;
	/** 审核状态选项 */
	approvalStatusOptions: DictOption[] | undefined;
	/** 标签状态选项 */
	tagStatusOptions: DictOption[] | undefined;
	/** 设置标签名称筛选 */
	setTagNameFilter: (value: string) => void;
	/** 设置状态筛选 */
	setStatusFilter: (value: string | undefined) => void;
	/** 重置筛选条件（同时全选标签） */
	onReset: () => void;
}

/**
 * 搜索表单区块组件
 *
 * @param props - 组件属性
 * @param props.form - 表单实例
 * @param props.isAuditMode - 是否为审核模式
 * @param props.approvalStatusOptions - 审核状态选项
 * @param props.tagStatusOptions - 标签状态选项
 * @param props.setTagNameFilter - 设置标签名称筛选
 * @param props.setStatusFilter - 设置状态筛选
 * @param props.onReset - 重置筛选条件（同时全选标签）
 * @returns 搜索表单区块元素
 */
export function SearchFormSection({
	form,
	isAuditMode,
	approvalStatusOptions,
	tagStatusOptions,
	setTagNameFilter,
	setStatusFilter,
	onReset,
}: SearchFormSectionProps) {
	/**
	 * 处理查询
	 */
	const handleSearch = () => {
		const formValues = form.getFieldsValue();
		setTagNameFilter(formValues.tagName || "");
		setStatusFilter(formValues.status || undefined);
	};

	/**
	 * 处理重置
	 */
	const handleReset = () => {
		form.resetFields();
		// 重置筛选条件（同时全选标签）
		onReset();
	};

	return (
		<ConfigProvider
			theme={{
				components: {
					Form: {
						labelColonMarginInlineStart: 0,
						labelColonMarginInlineEnd: 0,
					},
				},
			}}
		>
			<div className="w-full">
				<Form
					form={form}
					variant="borderless"
					colon={false}
					layout="inline"
					labelAlign="right"
				>
					<Form.Item
						name="tagName"
						label="标签名称"
						className="mb-0 rounded border"
						labelCol={{ span: 6 }}
						wrapperCol={{ span: 18 }}
						style={{ width: 300 }}
					>
						<Input placeholder="请输入" allowClear onPressEnter={handleSearch} />
					</Form.Item>
					<Form.Item
						name="status"
						label="标签状态"
						className="mb-0 rounded border"
						labelCol={{ span: 6 }}
						wrapperCol={{ span: 18 }}
						style={{ width: 300 }}
					>
						<Select
							placeholder="请选择"
							allowClear
							options={
								isAuditMode
									? (approvalStatusOptions ?? [])
									: (tagStatusOptions ?? [])
							}
						/>
					</Form.Item>
					<Form.Item className="ml-auto">
						<Space>
							<Button type="primary" onClick={handleSearch}>
								查询
							</Button>
							<Button type="text" onClick={handleReset}>
								重置
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</div>
		</ConfigProvider>
	);
}
