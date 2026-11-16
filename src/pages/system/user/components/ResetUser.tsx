import type { UserItemType } from "#src/api/system";
import { fetchUserResetPwd } from "#src/api/system";
import { Form, Input, message, Modal, Radio } from "antd";
import { useEffect, useState } from "react";

interface ResetUserProps {
	user: UserItemType | undefined;
	openResetUser: boolean;
	setOpenResetUser: (openResetUser: boolean) => void;
}
const initFormValue: any = {
	name: "",
	account: "",
	// mobileNum: "",
	staffJobCode: "",
};
const formItemLayout = {
	labelCol: {
		xs: { span: 6 },
		sm: { span: 5 },
	},
	wrapperCol: {
		xs: { span: 6 },
		sm: { span: 17 },
	},
};
export default function ResetUser(props: ResetUserProps) {
	const { openResetUser, user, setOpenResetUser } = props;
	const [form] = Form.useForm();
	const [messageApi, contextHolder] = message.useMessage();

	const handleConfirm = async () => {
		const param = {
			userId: user?.id,
			password: form.getFieldValue("password"),
		};
		if (!param.password || param.password.length < 5 || param.password.length > 20) {
			return;
		}
		const { code } = await fetchUserResetPwd(param);
		if (code === 200) {
			messageApi.success("修改成功");
		}
		setOpenResetUser(false);
	};

	useEffect(() => {
		form.setFieldsValue(user);
		return () => {
			form.resetFields();
		};
	}, [user]);

	return (
		<>
			{contextHolder}
			<Modal
				title="重置密码"
				open={openResetUser}
				centered
				destroyOnHidden
				onOk={handleConfirm}
				onCancel={() => {
					setOpenResetUser(false);
				}}
			>
				<Form
					form={form}
					initialValues={initFormValue}
					colon={false}
					layout="horizontal"
					{...formItemLayout}
				>
					<Form.Item label="账号" name="account">
						<Input placeholder="请输入" style={{ width: "100%" }} disabled></Input>
					</Form.Item>
					<Form.Item label="姓名" name="name">
						<Input placeholder="请输入" style={{ width: "100%" }} disabled></Input>
					</Form.Item>
					<Form.Item
						label="新密码"
						name="password"
						rules={[
							{
								required: true,
								message: "",
							},
							{
								validator: (_: any, v: any) => {
									const s = String(v || "");
									if (s.length < 5 || s.length > 20) {
										return Promise.reject(
											new Error("请输入密码，长度需为 5-20 位"),
										);
									}
									return Promise.resolve();
								},
							},
						]}
						className="mb-0"
					>
						<PassWordItem open={openResetUser} />
					</Form.Item>
					{/* <Form.Item
					label="推送方式"
					name="mobileNum"
					rules={[{ required: true }]}
				>
					<Radio>绿小服</Radio>
				</Form.Item> */}
				</Form>
			</Modal>
		</>
	);
}
function generatePassword(length = 6) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let password = "";
	for (let i = 0; i < length; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}
function PassWordItem(props: any) {
	const { value, onChange, open } = props;
	const [isRandom, setIsRandom] = useState<boolean>(() => value === undefined || value === "");
	const [passWord, setPassWord] = useState<string>(() =>
		value !== undefined && value !== null ? String(value) : generatePassword(),
	);

	// 初始化：若表单没有传入初始值，则把生成的密码回写到表单中
	useEffect(() => {
		if (onChange && (value === undefined || value === null || value === "")) {
			onChange(passWord);
		}
	}, []);

	useEffect(() => {
		if (open) {
			const _passWord = generatePassword();
			setIsRandom(true);
			setPassWord(_passWord);
			onChange(_passWord);
		}
	}, [open]);

	// 当外部 value 变化时（受控情形），同步组件内部值
	useEffect(() => {
		if (value !== undefined && value !== null && String(value) !== passWord) {
			setPassWord(String(value));
		}
	}, [value]);

	const handleSetRandom = () => {
		const newPwd = generatePassword();
		setIsRandom(true);
		setPassWord(newPwd);
		onChange && onChange(newPwd);
	};
	const handleSet = () => {
		setIsRandom(false);
		setPassWord("");
		onChange && onChange("");
	};
	const handleChange = (e: any) => {
		const v: string = e.target.value;
		setPassWord(v);
		onChange && onChange(v);
	};
	return (
		<div className="flex w-full items-center justify-between">
			<div className="flex items-center justify-between">
				<Radio checked={isRandom} onChange={handleSetRandom}>
					<span className="whitespace-nowrap">随机密码 </span>
				</Radio>
				{isRandom ? <Input value={passWord} readOnly /> : null}
			</div>
			<div className="ml-2 flex items-center justify-between">
				<Radio checked={!isRandom} onChange={handleSet}>
					<span className="whitespace-nowrap">自定义密码 </span>
				</Radio>
				{!isRandom ? (
					<Input
						value={passWord}
						onChange={handleChange}
						placeholder="请输入"
						minLength={5}
						maxLength={20}
					/>
				) : null}
			</div>
		</div>
	);
}
