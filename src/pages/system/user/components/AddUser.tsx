import type { AddUserType } from "#src/api/system";
import { addUserItem } from "#src/api/system";
import { ModalForm, ProForm } from "@ant-design/pro-components";
import { Button, Form, Input, message } from "antd";

const formItemLayout = {
	labelCol: {
		xs: { span: 24 },
		sm: { span: 5 },
	},
	wrapperCol: {
		xs: { span: 24 },
		sm: { span: 16 },
	},
};
export default function AddUser() {
	const [form] = Form.useForm();
	const [messageApi, contextHolder] = message.useMessage();

	return (
		<>
			{contextHolder}
			<ModalForm
				title="新增用户"
				layout="horizontal"
				trigger={<Button type="primary">新增用户</Button>}
				form={form}
				autoFocusFirstInput
				modalProps={{
					centered: true,
					width: 520,
					destroyOnHidden: true,
					onCancel: () => {},
				}}
				submitTimeout={2000}
				onFinish={async (values: AddUserType) => {
					const { code } = await addUserItem(values);
					if (code === 200) {
						messageApi.success("新增成功");
						form.resetFields();
						return true;
					} else {
						messageApi.success("新增失败");
						return true;
					}
				}}
				{...formItemLayout}
			>
				<ProForm.Item
					label="账号"
					name="account"
					rules={[{ required: true, message: "请输入账号" }]}
				>
					<Input placeholder="请输入"></Input>
				</ProForm.Item>
				<ProForm.Item
					label="姓名"
					name="name"
					rules={[{ required: true, message: "请输入姓名" }]}
				>
					<Input placeholder="请输入"></Input>
				</ProForm.Item>
				{/* <ProForm.Item
					label="岗位"
					name="staffJobCode"
				>
					<Input placeholder="请输入" style={{ width: "100%" }}></Input>
				</ProForm.Item> */}
				<ProForm.Item label="电话号码" name="mobileNum">
					<Input placeholder="请输入"></Input>
				</ProForm.Item>
			</ModalForm>
		</>
	);
}
