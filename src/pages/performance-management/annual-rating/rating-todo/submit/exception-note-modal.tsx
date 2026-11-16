import { Button, Form, Input, Modal } from "antd";
import { useEffect } from "react";

/**
 * 异常情况说明弹窗组件属性
 */
interface ExceptionNoteModalProps {
	/** 弹窗是否可见 */
	open: boolean;
	/** 初始说明内容 */
	initialValue?: string;
	/** 关闭回调 */
	onClose: () => void;
	/** 确定回调 */
	onConfirm: (value: string) => void;
}

/**
 * 异常情况说明弹窗
 *
 * 用于提报名单中编辑单个员工的异常情况说明，最多 100 字；
 * 弹窗尺寸为 572×302，文本域为 320×128，标题固定且不包含员工姓名。
 *
 * @param props - 组件属性
 * @param props.open - 弹窗是否可见
 * @param props.initialValue - 初始说明内容
 * @param props.onClose - 关闭回调
 * @param props.onConfirm - 确定回调
 * @returns 异常情况说明弹窗组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function ExceptionNoteModal({
	open,
	initialValue,
	onClose,
	onConfirm,
}: ExceptionNoteModalProps) {
	const [form] = Form.useForm<{ note: string }>();

	/**
	 * 打开时回显初始值
	 */
	useEffect(() => {
		if (open) {
			form.setFieldsValue({ note: initialValue ?? "" });
		}
	}, [open, initialValue, form]);

	/**
	 * 确定：校验通过后回传内容
	 */
	const handleOk = async () => {
		const values = await form.validateFields();
		onConfirm(values.note ?? "");
		onClose();
	};

	return (
		<Modal
			centered
			title="异常情况说明"
			open={open}
			onCancel={onClose}
			width={572}
			footer={
				<div className="flex justify-end gap-3">
					<Button onClick={onClose}>取消</Button>
					<Button type="primary" onClick={handleOk}>
						确定
					</Button>
				</div>
			}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ flex: "116px" }}
				colon={false}
				requiredMark={false}
			>
				<Form.Item
					name="note"
					label={
						<span>
							<span className="text-[#F5222D]">*</span>异常情况说明
						</span>
					}
					rules={[{ required: true, message: "请填写异常情况说明" }]}
				>
					<Input.TextArea
						style={{ width: 320, height: 128 }}
						maxLength={100}
						showCount
						placeholder="请输入"
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
