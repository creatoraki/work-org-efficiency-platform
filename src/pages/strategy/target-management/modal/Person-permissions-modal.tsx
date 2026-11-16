import { Form, Modal, Select } from "antd";
import React from "react";

interface Props {
	open: boolean;
	person?: any;
	onClose: (res?: any) => void;
}

export default function PersonPermissionsModal({ open, person, onClose }: Props) {
	const [form] = Form.useForm();

	React.useEffect(() => {
		if (open && person) form.setFieldsValue({ permissions: person.permissions || [] });
	}, [open, person, form]);

	const handleOk = async () => {
		const v = await form.validateFields();
		onClose(v.permissions || []);
	};

	return (
		<Modal
			title={person ? `编辑权限 — ${person.name}` : "编辑权限"}
			open={open}
			onCancel={() => onClose(null)}
			onOk={handleOk}
			centered
		>
			<Form form={form} layout="vertical">
				<Form.Item name="permissions" label="操作权限">
					<Select
						mode="multiple"
						options={[
							{ label: "查看", value: "view" },
							{ label: "编辑", value: "edit" },
							{ label: "删除", value: "delete" },
						]}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
