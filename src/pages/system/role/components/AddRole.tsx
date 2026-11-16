import type { AddRoleType } from "#src/api/system";
import { fetchAddRoleItem, fetchRoleCategory, fetchRoleList } from "#src/api/system";
import yellowConfirm from "#src/assets/svg/yellow-confirm.svg";
import { useDict } from "#src/hooks";
import { Cascader, Form, Input, message, Modal, Select } from "antd";
import { useContext, useEffect, useState } from "react";
import { RoleContext } from "../index";

interface AddRoleProps {
	openAddRole: boolean;
	setOpenAddRole: (openAddRole: boolean) => void;
}
const formItemLayout = {
	labelCol: {
		xs: { span: 24 },
		sm: { span: 7 },
	},
	wrapperCol: {
		xs: { span: 24 },
		sm: { span: 17 },
	},
};
const { TextArea } = Input;
let timeoutId: NodeJS.Timeout;
export default function AddRole(props: AddRoleProps) {
	const { openAddRole, setOpenAddRole } = props;
	const [category, setCategory] = useState<any>([]);
	const { update } = useContext<any>(RoleContext);
	const [messageApi, contextHolder] = message.useMessage();

	const { options }: any = useDict("sys_role_type");
	const [form] = Form.useForm();

	const handleConfirm = () => {
		form.submit();
		form.validateFields().then(() => {
			const param = {
				roleName: form.getFieldsValue().roleName,
				roleType: form.getFieldsValue().roleType,
				categoryId: form.getFieldsValue().categoryId?.reverse()?.[0],
				remark: form.getFieldsValue().remark ?? undefined,
			};
			fetchAddRoleItem(param as AddRoleType).then((res) => {
				if (res.code === 200) {
					messageApi.success("操作成功");
					form.resetFields();
					update();
					setOpenAddRole(false);
				}
			});
			setOpenAddRole(false);
		});
	};
	const getRoleCategory = async () => {
		const { data }: any = await fetchRoleCategory();
		if (data?.length) {
			setCategory(data);
		}
	};

	const validator = (_: any, value: string) => {
		clearTimeout(timeoutId);

		if (!value?.trim()) return Promise.resolve();

		return new Promise((resolve, reject) => {
			timeoutId = setTimeout(() => {
				fetchRoleList({
					pageSize: 10,
					pageNum: 1,
					roleName: value.trim(),
				})
					.then((res) => {
						const list = res.data.list;
						if (list?.length && list?.find((role) => role.roleName === value.trim())) {
							reject(new Error("该角色名称已存在"));
						} else {
							resolve(undefined);
						}
					})
					.catch(reject);
			}, 500);
		});
	};
	useEffect(() => {
		if (openAddRole) {
			getRoleCategory();
		}
	}, [openAddRole]);

	return (
		<>
			{contextHolder}
			<Modal
				centered
				title="新增角色"
				open={openAddRole}
				onOk={handleConfirm}
				onCancel={() => {
					setOpenAddRole(false);
					form.resetFields();
				}}
				styles={{ body: { paddingTop: "0" } }}
			>
				<div
					className="w-2/1 my-3 flex h-8 items-center bg-[#FFEFE0] px-6"
					style={{
						margin: "0px -24px 24px -24px ",
					}}
				>
					<img src={yellowConfirm} className="mr-2 h-4 w-4" />
					注：角色名称、角色类型一旦确认，不可再进行修改
				</div>
				<Form
					form={form}
					style={{ maxWidth: 400 }}
					layout="horizontal"
					{...formItemLayout}
					colon={false}
				>
					<Form.Item
						label="角色名称"
						name="roleName"
						rules={[
							{
								required: true,
								message: "请输入角色名称",
							},
							{ validator },
						]}
					>
						<Input placeholder="请输入"></Input>
					</Form.Item>
					<Form.Item
						label="角色类型"
						name="roleType"
						rules={[{ required: true, message: "请选择角色类型" }]}
					>
						<Select placeholder="请选择" options={options}></Select>
					</Form.Item>
					<Form.Item
						label="归属文件夹"
						name="categoryId"
						rules={[{ required: true, message: "请选择归属文件夹" }]}
					>
						<Cascader
							fieldNames={{ label: "name", value: "id", children: "children" }}
							placeholder="请选择"
							options={category}
							changeOnSelect
						></Cascader>
					</Form.Item>
					<Form.Item label="角色说明" name="remark">
						<TextArea placeholder="请输入" rows={2} maxLength={100} showCount />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}
