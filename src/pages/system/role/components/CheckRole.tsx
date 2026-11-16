import type { RoleItemType } from "#src/api/system";
import { fetchGetRoleItem, fetchRoleCategory, fetchUpdateRoleItem } from "#src/api/system";
import { useDict } from "#src/hooks";

import { ModalForm, ProForm } from "@ant-design/pro-components";
import { Cascader, Input, message, Select, Typography } from "antd";
import { useContext, useEffect, useState } from "react";
import { AdminRole, RoleContext } from "../index";

interface AddRoleProps {
	role: RoleItemType;
}
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
const { TextArea } = Input;

function findPathToNode(tree: any, targetId: any) {
	function dfs(node: any, path: any) {
		if (!node) return null;

		// 将当前节点加入路径
		const currentPath = [...path, node.id];

		// 找到目标
		if (node.id === targetId) {
			return currentPath;
		}

		// 递归子节点
		if (node.children && node.children.length > 0) {
			for (const child of node.children) {
				const result: any = dfs(child, currentPath);
				if (result) return result; // 找到就返回
			}
		}
		return null; // 未找到
	}

	for (const root of tree) {
		const path = dfs(root, []);
		if (path) return path; // 返回 [targetId, ..., rootId]
	}

	return []; // 未找到
}

export default function CheckRole(props: AddRoleProps) {
	const { role } = props;
	const [category, setCategory] = useState<any>([]);
	const [open, setOpen] = useState(false);
	const [roleDetail, setRoleDetail] = useState<RoleItemType>();
	const { options }: any = useDict("sys_role_type");
	const { update } = useContext<any>(RoleContext);
	const [messageApi, contextHolder] = message.useMessage();

	const [form] = ProForm.useForm();

	const getRoleCategory = async () => {
		const { data }: any = await fetchRoleCategory();
		if (data?.length) {
			setCategory(data);
		}
	};
	const getRoleItem = async () => {
		const { code, data }: any = await fetchGetRoleItem(role.roleId);
		if (code === 200) {
			setRoleDetail(data);
			form.setFieldsValue({
				...data,
				categoryId:
					data?.roleName === AdminRole.roleName
						? "全部"
						: findPathToNode(category, data.categoryId),
			});
		}
	};

	useEffect(() => {
		if (open && category.length) {
			getRoleItem();
		}
	}, [role, open, category]);

	useEffect(() => {
		if (open) {
			getRoleCategory();
		}
	}, [open]);
	return (
		<>
			{contextHolder}
			<ModalForm
				title="查看"
				layout="horizontal"
				trigger={
					<Typography.Link onClick={() => setOpen(true)}>{role.roleName}</Typography.Link>
				}
				form={form}
				submitter={{
					submitButtonProps: { disabled: roleDetail?.roleName === AdminRole.roleName },
					resetButtonProps: { disabled: roleDetail?.roleName === AdminRole.roleName },
				}}
				autoFocusFirstInput
				modalProps={{
					open,
					centered: true,
					width: 520,
					destroyOnHidden: true,
					onCancel: () => {
						setOpen(false);
					},
				}}
				submitTimeout={2000}
				onFinish={async (values) => {
					const param = {
						roleId: role.roleId,
						categoryId: values.categoryId?.reverse()?.[0],
						remark: values.remark ?? undefined,
					};
					const { code } = await fetchUpdateRoleItem(param);
					if (code === 200) {
						messageApi.success("修改成功");
						update();
						form.resetFields();
						return true;
					} else {
						messageApi.success("修改失败");
						return true;
					}
				}}
				{...formItemLayout}
			>
				<ProForm.Item label="角色名称" name="roleName">
					<Input placeholder="请输入" disabled></Input>
				</ProForm.Item>
				<ProForm.Item label="角色类型" name="roleType">
					<Select placeholder="请选择" options={options} disabled></Select>
				</ProForm.Item>
				<ProForm.Item
					label="归属文件夹"
					name="categoryId"
					rules={[{ required: true, message: "请选择归属文件夹" }]}
				>
					<Cascader
						disabled={roleDetail?.roleName === AdminRole.roleName}
						fieldNames={{ label: "name", value: "id", children: "children" }}
						placeholder="请选择"
						options={category}
						changeOnSelect
					></Cascader>
				</ProForm.Item>
				<ProForm.Item label="角色说明" name="remark">
					<TextArea
						disabled={roleDetail?.roleName === AdminRole.roleName}
						placeholder="请输入"
						rows={2}
						maxLength={100}
						showCount
					/>
				</ProForm.Item>
			</ModalForm>
		</>
	);
}
