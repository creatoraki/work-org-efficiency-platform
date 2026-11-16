import type { RoleInfoDetailType, RoleItemType } from "#src/api/system";
import { fetchRoleDetail, fetchSaveRoleSave } from "#src/api/system";
import { useDict } from "#src/hooks";
import { Col, Drawer, Form, Input, message, Row, Select, Tabs } from "antd";
import { useEffect, useState } from "react";
import TitleBox from "../../user/components/TitleBox";
import { AdminRole } from "../index";
import FunctionPermission from "./FunctionPermission";
import RuleConfig from "./RuleConfig";

const { TextArea } = Input;
interface EditRoleProps {
	role: RoleItemType;
	open: boolean;
	setOpen: (open: boolean) => void;
	tabKeys: string;
}

const { TabPane } = Tabs;
export default function EditRole(props: EditRoleProps) {
	const { open, setOpen, role, tabKeys } = props;
	const [tab, setTab] = useState(tabKeys);
	const [roleDetail, setRoleDetail] = useState<RoleInfoDetailType>();
	const { options: typeOptions }: any = useDict("sys_role_type");
	const [form] = Form.useForm();
	// const remark = Form.useWatch("remark", form);
	const [messageApi, contextHolder] = message.useMessage();

	const initForm = {
		account: "",
		name: "",
		staffJobName: "",
		mobileNum: "",
		remark: "",
	};

	const onClose = () => {
		setOpen(false);
	};
	const onChange = (key: string) => {
		setTab(key);
	};
	const getRoleDetail = async (role: RoleItemType) => {
		const { data }: any = await fetchRoleDetail(role.roleId);
		setRoleDetail(data);
		form.setFieldsValue(data);
	};

	const handleUpdate = async (menuIdList: any[], dataPermList: any[]) => {
		const param = {
			roleId: role.roleId,
			menuIdList,
			dataPermList,
			remark: form.getFieldValue("remark"),
		};
		const { code } = await fetchSaveRoleSave(param);
		if (code === 200) {
			messageApi.success("保存成功");
			setOpen(false);
		}
	};

	useEffect(() => {
		if (!open) return;
		getRoleDetail(role);
		setTab(tabKeys);
		return () => {
			form.resetFields();
		};
	}, [open]);

	return (
		<>
			{contextHolder}
			<Drawer
				onClose={onClose}
				open={open}
				width="80%"
				height="100vh"
				size="large"
				title="配置管理"
				closable={{ placement: "end" }}
			>
				<TitleBox title="基础信息" />
				<Form
					className="px-6"
					style={{
						height: "10vh",
					}}
					layout="inline"
					initialValues={initForm}
					form={form}
					colon={false}
				>
					<Row className="w-full">
						<Col span={6}>
							<Form.Item label="角色名称" name="roleName" className="mb-4">
								<Input disabled />
							</Form.Item>
						</Col>

						<Col span={6}>
							<Form.Item label="更新人" name="updateBy" className="mb-4">
								<Input disabled />
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item label="更新时间" name="updateTime" className="mb-4">
								<Input disabled />
							</Form.Item>
						</Col>
						<Col span={6}>
							<Form.Item label="角色类型" name="roleType" className="mb-4">
								<Select options={typeOptions} disabled />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item label="角色说明" name="remark" className="mb-4">
								<TextArea
									autoSize={{ minRows: 1, maxRows: 1 }}
									showCount
									maxLength={100}
									disabled={roleDetail?.roleName === AdminRole.roleName}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Form>
				<Tabs activeKey={tab} onChange={onChange}>
					<TabPane
						tab="功能权限"
						key="1"
						className="h-full w-full"
						style={{
							height: "calc(83vh - 1080px / 100vh * 130px)",
						}}
					>
						{roleDetail ? (
							<FunctionPermission
								roleDetail={roleDetail}
								handleUpdate={handleUpdate}
							/>
						) : (
							<></>
						)}
					</TabPane>
					<TabPane tab="成员管理" key="2">
						<div
							style={{
								height: "calc(83vh - 1080px / 100vh * 130px)",
								overflow: "hidden",
							}}
						>
							{roleDetail ? (
								<RuleConfig roleDetail={roleDetail} open={open} />
							) : (
								<></>
							)}
						</div>
					</TabPane>
				</Tabs>
			</Drawer>
		</>
	);
}
