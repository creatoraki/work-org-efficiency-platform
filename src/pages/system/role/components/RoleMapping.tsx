import type { RoleItemType } from "#src/api/system";
import {
	fetchAddEHRRoleMapping,
	fetchEditEHRRoleMapping,
	fetchGetEHRRoleMapping,
	fetchNoBindEhrRoleInfo,
} from "#src/api/system";
import { Form, message, Modal, Select } from "antd";
import { useContext, useEffect, useState } from "react";
import { RoleContext } from "../index";

interface RoleMappingProps {
	role: RoleItemType;
	openAddRole: boolean;
	setOpenAddRole: (openAddRole: boolean) => void;
}

interface EHRRoleItem {
	roleId: number;
	roleName: string;
}

interface ehrRoleMapDataPrama {
	/* 主键id */
	id: number;
	/* ehr角色id */
	ehrRoleId: number;
	/* ehr角色名称 */
	ehrRoleName: string;
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

const orgLevelOptions = [
	{
		value: 1,
		label: "区域",
	},
	{
		value: 2,
		label: "项目群",
	},
	{
		value: 3,
		label: "城市公司",
	},
	{
		value: 4,
		label: "地区",
	},
];

export default function RoleMapping(props: RoleMappingProps) {
	const { openAddRole, setOpenAddRole, role } = props;
	const [ehrRoleOptions, setEhrRoleOptions] = useState<EHRRoleItem[]>([]);
	const [ehrRoleMapData, setEhrRoleMapData] = useState<ehrRoleMapDataPrama | null>();
	const [isAdd, setIsAdd] = useState(true);
	const { update } = useContext<any>(RoleContext);
	const [messageApi, contextHolder] = message.useMessage();

	const [form] = Form.useForm();

	const getEhrRoleInfo = async () => {
		const { data }: any = await fetchNoBindEhrRoleInfo();
		if (data?.length) {
			setEhrRoleOptions(data);
		}
	};

	const getEHRRoleMapping = async (id: number) => {
		const { data }: any = await fetchGetEHRRoleMapping(id);
		if (data) {
			setEhrRoleMapData(data);
			setIsAdd(false);
			form.setFieldsValue({
				ehrRoleId: data.ehrRoleId,
				orgLevel: data.orgLevel,
			});
		} else {
			form.resetFields();
			setIsAdd(true);
			setEhrRoleMapData(null);
		}
	};

	const handleConfirm = async () => {
		const values = await form.validateFields();
		const matchEhrRole = ehrRoleOptions?.find((item) => item.roleId === values.ehrRoleId);

		const ehrRoleId = matchEhrRole ? values.ehrRoleId : ehrRoleMapData?.ehrRoleId;
		const param = {
			id: isAdd ? undefined : ehrRoleMapData?.id,
			ehrRoleId,
			orgLevel: values.orgLevel,
			roleId: role.roleId,
		};
		const fetchFun = isAdd ? fetchAddEHRRoleMapping : fetchEditEHRRoleMapping;
		const { code }: any = await fetchFun(param);
		if (code === 200) {
			messageApi.success(isAdd ? "添加成功" : "修改成功");
			form.resetFields();
			update();
			setOpenAddRole(false);
		}
	};

	const handleCancel = () => {
		setOpenAddRole(false);
		form.resetFields();
	};

	useEffect(() => {
		if (openAddRole) {
			getEhrRoleInfo();
			getEHRRoleMapping(role.roleId);
		}
	}, [openAddRole, role.roleId]);

	useEffect(() => {
		if (!ehrRoleMapData || !ehrRoleOptions?.length) return;
		const { ehrRoleId, ehrRoleName } = ehrRoleMapData;
		const matchEhrRole = ehrRoleOptions?.find((item) => item.roleId === ehrRoleId);

		if (!matchEhrRole) {
			form.setFieldValue("ehrRoleId", ehrRoleName);
		}
	}, [ehrRoleMapData, ehrRoleOptions]);

	return (
		<>
			{contextHolder}
			<Modal
				centered
				title="角色映射"
				open={openAddRole}
				onOk={handleConfirm}
				onCancel={handleCancel}
			>
				<Form
					form={form}
					style={{ maxWidth: 400 }}
					layout="horizontal"
					{...formItemLayout}
					colon={false}
				>
					<Form.Item
						label="EHR角色"
						name="ehrRoleId"
						rules={[{ required: true, message: "请选择EHR角色" }]}
					>
						<Select
							placeholder="请选择"
							options={ehrRoleOptions}
							fieldNames={{ value: "roleId", label: "roleName" }}
						></Select>
					</Form.Item>
					<Form.Item label="公司层级" name="orgLevel">
						<Select allowClear placeholder="请选择" options={orgLevelOptions}></Select>
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}
