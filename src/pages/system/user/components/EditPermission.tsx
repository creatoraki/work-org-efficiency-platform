import type { UserInfoDetailType, UserItemType } from "#src/api/system";
import { fetchrolecategory, fetchUserInfoDetail, fetchUserInfoUpdate } from "#src/api/system";

import { Col, Drawer, Form, Input, message, Row, Space, TreeSelect, Typography } from "antd";
import { useContext, useEffect, useMemo, useState } from "react";
import { TreeDataContext } from "../index";
import FunctionPermission from "./FunctionPermission";
import ResetUser from "./ResetUser";
import TitleBox from "./TitleBox";

interface AddUserProps {
	user: UserItemType;
	open: boolean;
	setOpen: (open: boolean) => void;
}
const formItemLayout = {
	labelCol: { xs: { span: 12 }, sm: { span: 6 } },
	wrapperCol: { xs: { span: 6 }, sm: { span: 16 } },
};
export default function AddUser(props: AddUserProps) {
	const { user, open, setOpen } = props;
	const [userDetail, setUserDetail] = useState<UserInfoDetailType>();
	const [roleTree, setRoleTree] = useState<any[]>([]);
	const [openResetUser, setOpenResetUser] = useState(false);
	const { treeData } = useContext(TreeDataContext);
	const [form] = Form.useForm();
	const selectedRole = Form.useWatch("roles", form);
	const [messageApi, contextHolder] = message.useMessage();
	const roles = useMemo(() => selectedRole, [selectedRole]);

	const initForm = {
		account: "",
		name: "",
		staffJobName: "",
		mobileNum: "",
	};

	/**
	 * 把后端返回的列表或嵌套结构转换为 TreeSelect 能识别的树结构
	 * - 支持扁平列表（parentId 关联）或已有 children 的嵌套结构
	 * - 部门节点：{ label: name, value: name+id, children: [...], disabled: true }
	 * - 角色节点：{ label: roleName, value: roleId, disabled: false }
	 */
	const buildRoleTreeFromItems = (items: any[]) => {
		if (!Array.isArray(items) || items.length === 0) return [];

		const hasNested = items.some((i) => Array.isArray(i.children) && i.children.length > 0);
		let roots: any[];
		if (hasNested) {
			roots = items;
		} else {
			const map = new Map<number, any>();
			items.forEach((it) => map.set(it.id, { ...it, children: [] }));
			map.forEach((node) => {
				if (node.parentId && map.has(node.parentId)) {
					map.get(node.parentId).children.push(node);
				}
			});
			roots = Array.from(map.values()).filter((n) => !n.parentId || !map.has(n.parentId));
		}

		const toTree = (nodes: any[]): any[] => {
			return nodes
				.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
				.map((node) => {
					const children: any[] = [];
					if (Array.isArray(node.children) && node.children.length) {
						children.push(...toTree(node.children));
					}
					if (Array.isArray(node.roles) && node.roles.length) {
						children.push(
							...node.roles.map((r: any) => ({
								label: r.roleName,
								value: r.roleId,
								disabled: false,
							})),
						);
					}
					return {
						label: node.name,
						value: String(node.name) + String(node.id),
						children,
						disabled: true,
					};
				});
		};

		return toTree(roots);
	};
	const getRoleCategory = async () => {
		const { data }: any = await fetchrolecategory();
		if (!Array.isArray(data) || data.length === 0) return;
		const tree = buildRoleTreeFromItems(data);
		if (tree.length) setRoleTree(tree);
	};

	const fetchData = async () => {
		const { data, code } = await fetchUserInfoDetail(user.id);
		if (code === 200) {
			setUserDetail(data);
		}
	};

	const onClose = () => {
		setOpen(false);
	};
	const handleUpdate = async (menuIdList: any[], dataPermList: any[]) => {
		const param = {
			userId: user.id,
			roleIds: form.getFieldValue("roles"),
			deptIds: form.getFieldValue("depts"),
			projIds: form.getFieldValue("projs"),
			userMenuSaveForm: {
				userId: user.id,
				menuIdList,
				dataPermList,
			},
		};
		const { code } = await fetchUserInfoUpdate(param);
		if (code === 200) {
			messageApi.success("保存成功");
			setOpen(false);
		} else {
			// messageApi.error("保存失败");
			setOpen(false);
		}
	};

	// 定义tag的渲染
	const renderTreeNode = (nodeData: any, list: any[]) => {
		const { value, deptName } = nodeData || {};
		// 如果组织树找不到这个节点，就显示接口返回的name
		const itemDeptName = value ? list?.find((e: any) => e.deptId === value)?.deptName : "";
		const nodeName = deptName || itemDeptName;
		return <>{nodeName}</>;
	};
	useEffect(() => {
		if (!open) return;
		fetchData();
		getRoleCategory();
		return () => {
			form.resetFields();
		};
	}, [open]);

	useEffect(() => {
		const depts: any = userDetail?.depts?.map((e: any) => e.deptId);
		const projs: any = userDetail?.projs?.map((e: any) => e.deptId);
		const roles: any = userDetail?.roles?.map((e: any) => e.roleId);
		form.setFieldsValue({
			account: userDetail?.account,
			name: userDetail?.name,
			staffJobName: userDetail?.staffJobName,
			mobileNum: userDetail?.mobileNum,
			depts,
			projs,
			roles,
		});
	}, [userDetail]);
	return (
		<>
			{contextHolder}
			<Drawer
				title="权限配置"
				onClose={onClose}
				open={open}
				width="80%"
				height="100vh"
				size="large"
				closable={{ placement: "end" }}
			>
				<div className="flex h-full w-full flex-col">
					<TitleBox title="基础信息" />
					<Form
						className="w-full"
						layout="horizontal"
						initialValues={initForm}
						form={form}
						colon={false}
						{...formItemLayout}
					>
						<Row className="w-full">
							<Col span={6}>
								<Form.Item label="账号">
									<Space>
										<Form.Item name="account" noStyle>
											<Input placeholder="Please input" disabled />
										</Form.Item>
										<Typography.Link
											className="whitespace-nowrap"
											onClick={() => setOpenResetUser(true)}
										>
											重置密码
										</Typography.Link>
									</Space>
								</Form.Item>
							</Col>

							<Col span={6}>
								<Form.Item label="姓名" name="name" className="mb-4">
									<Input disabled />
								</Form.Item>
							</Col>
							<Col span={6}>
								<Form.Item label="岗位" name="staffJobName" className="mb-4">
									<Input disabled />
								</Form.Item>
							</Col>
							<Col span={6}>
								<Form.Item label="电话号码" name="mobileNum" className="mb-4">
									<Input disabled />
								</Form.Item>
							</Col>
							<Col span={6}>
								<Form.Item label="角色" name="roles" className="mb-4">
									<TreeSelect
										allowClear
										showSearch
										treeData={roleTree}
										treeNodeLabelProp="label"
										maxTagCount="responsive"
										treeCheckable={true}
										filterTreeNode={(inputValue, node) => {
											const label = node?.label ?? "";
											return String(label)
												.toLowerCase()
												.includes(inputValue.toLowerCase());
										}}
									></TreeSelect>
								</Form.Item>
							</Col>
							<Col span={6}>
								<Form.Item label="数据范围" name="projs" className="mb-4">
									<TreeSelect
										allowClear
										showSearch
										treeData={treeData}
										fieldNames={{
											label: "deptName",
											value: "deptId",
											children: "children",
										}}
										treeCheckable={true}
										showCheckedStrategy="SHOW_PARENT"
										maxTagCount="responsive"
										filterTreeNode={(inputValue, node) => {
											const label = node?.deptName ?? "";
											return String(label)
												.toLowerCase()
												.includes(inputValue.toLowerCase());
										}}
										treeTitleRender={(node) =>
											renderTreeNode(node, userDetail?.projs || [])
										}
									/>
								</Form.Item>
							</Col>
							<Col span={6}>
								<Form.Item label="组织范围" name="depts" className="mb-4">
									<TreeSelect
										allowClear
										showSearch
										treeData={treeData}
										fieldNames={{
											label: "deptName",
											value: "deptId",
											children: "children",
										}}
										treeCheckable={true}
										showCheckedStrategy="SHOW_PARENT"
										maxTagCount="responsive"
										filterTreeNode={(inputValue, node) => {
											const label = node?.deptName ?? "";
											return String(label)
												.toLowerCase()
												.includes(inputValue.toLowerCase());
										}}
										treeTitleRender={(node) =>
											renderTreeNode(node, userDetail?.depts || [])
										}
									/>
								</Form.Item>
							</Col>
						</Row>
					</Form>
					<TitleBox title="功能权限" />
					<div className="min-h-0 flex-1">
						<FunctionPermission
							userDetail={userDetail}
							handleUpdate={handleUpdate}
							roles={roles}
						/>
					</div>
				</div>
				<ResetUser
					user={user}
					openResetUser={openResetUser}
					setOpenResetUser={setOpenResetUser}
				/>
			</Drawer>
		</>
	);
}
