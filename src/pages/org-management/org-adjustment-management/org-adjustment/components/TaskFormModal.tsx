/**
 * 任务表单弹窗
 */

import type { OrgAdjustmentTaskFormValues, OrgAdjustmentTaskTableRow } from "../types";
import { Form, Input, Modal } from "antd";
import React from "react";

interface TaskFormModalProps {
	open: boolean;
	editingTask: OrgAdjustmentTaskTableRow | null;
	onSubmit: (values: OrgAdjustmentTaskFormValues) => Promise<void>;
	onCancel: () => void;
}

/**
 * 组织调整任务表单弹窗
 *
 * 职责：
 * 1. 管理表单实例与提交态
 * 2. 在新增/编辑之间切换默认值
 * 3. 向外只暴露语义化的提交结果
 */
export default function TaskFormModal({
	open,
	editingTask,
	onSubmit,
	onCancel,
}: TaskFormModalProps) {
	const [form] = Form.useForm<OrgAdjustmentTaskFormValues>();
	const [loading, setLoading] = React.useState(false);

	/** 是否处于编辑模式 */
	const isEditMode = !!editingTask;

	/**
	 * 当弹窗打开或编辑对象变化时，同步表单值
	 */
	React.useEffect(() => {
		if (open) {
			if (isEditMode && editingTask) {
				form.setFieldsValue({
					taskName: editingTask.taskName,
					remark: editingTask.remark || "",
				});
			} else {
				form.resetFields();
			}
		}
	}, [open, editingTask, form, isEditMode]);

	/**
	 * 处理表单提交
	 */
	const handleSubmit = async () => {
		const values = await form.validateFields();
		setLoading(true);
		try {
			await onSubmit(values);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			title={isEditMode ? "编辑组织调整任务" : "新增组织调整任务"}
			open={open}
			onOk={handleSubmit}
			onCancel={onCancel}
			okText="保存"
			cancelText="取消"
			confirmLoading={loading}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 16 }}
				colon={false}
			>
				<Form.Item
					label="任务名称"
					name="taskName"
					rules={[
						{ required: true, message: "请输入任务名称" },
						{ max: 100, message: "任务名称最多100字" },
					]}
				>
					<Input placeholder="请输入任务名称" />
				</Form.Item>

				<Form.Item label="备注" name="remark">
					<Input.TextArea placeholder="请输入备注" maxLength={100} rows={3} showCount />
				</Form.Item>
			</Form>
		</Modal>
	);
}
