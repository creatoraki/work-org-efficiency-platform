/**
 * 驳回审核弹窗组件
 */

import type { FormInstance } from "antd";
import { Form, Input, Modal } from "antd";

const { TextArea } = Input;

/**
 * 驳回审核弹窗属性
 */
interface RefuseAuditModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 是否正在提交 */
	loading: boolean;
	/** 表单实例 */
	form: FormInstance;
	/** 确认驳回回调 */
	onConfirm: () => void;
	/** 取消回调 */
	onCancel: () => void;
}

/**
 * 驳回审核弹窗组件
 */
export function RefuseAuditModal({
	open,
	loading,
	form,
	onConfirm,
	onCancel,
}: RefuseAuditModalProps) {
	return (
		<Modal
			title={
				<>
					<span style={{ color: "#ff4d4f" }} className="mr-1">
						*
					</span>
					驳回审核
				</>
			}
			open={open}
			onOk={onConfirm}
			onCancel={onCancel}
			okText="确认"
			cancelText="取消"
			centered
			okButtonProps={{ loading }}
			cancelButtonProps={{ disabled: loading }}
		>
			<Form form={form} layout="vertical" colon={false}>
				<Form.Item
					name="auditComment"
					rules={[
						{ required: true, message: "请填写驳回意见" },
						{ max: 500, message: "驳回意见不能超过500个字符" },
					]}
				>
					<TextArea
						rows={4}
						placeholder="请输入驳回意见..."
						showCount={{
							formatter: ({ count, maxLength }) =>
								`${count}${maxLength ? `/${maxLength}` : ""}`,
						}}
						maxLength={500}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
