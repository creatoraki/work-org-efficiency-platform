import type { RoleItemType } from "#src/api/system";
import {
	fetchDeleteRoleItem,
	fetchDisableRoleItem,
	fetchEnableRoleItem,
	fetchRoleList,
} from "#src/api/system";
import refresh from "#src/assets/svg/refresh.svg";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { confirm } from "#src/components/custom-confirm";
import FoldContent from "#src/components/foldContent";
import { useDict } from "#src/hooks";
import { Button, Divider, message, Select, Space, Switch, Typography } from "antd";
import { createContext, useEffect, useRef, useState } from "react";
import AddRole from "./components/AddRole";
import CheckRole from "./components/CheckRole";
import EditPermission from "./components/EditPermission";
import RoleMapping from "./components/RoleMapping";
import Roletree from "./components/Roletree";

interface RoleContextType {
	update?: () => void;
}

export const AdminRole = { roleId: 1, roleName: "超级管理员" };
export const RoleContext = createContext<RoleContextType>({});

export default function Role() {
	const [openPermission, setOpenPermission] = useState(false);
	const [openAddRole, setOpenAddRole] = useState(false);
	const [openRoleMap, setOpenRoleMap] = useState(false);
	const [role, setRole] = useState<RoleItemType | null>(null);
	const [roleCategoryId, setRoleCategoryId] = useState<number | undefined>(undefined);
	const [tabKeys, setTabKeys] = useState("1");
	const { options: typeOptions }: any = useDict("sys_role_type");
	const { options: statusOptions }: any = useDict("sys_role_status");
	const actionRef = useRef<any>();
	const formRef = useRef<any>();
	const abortControllerRef = useRef<AbortController | null>(null);

	const [messageApi, contextHolder] = message.useMessage();

	const showDrawer = (data: RoleItemType, tab: string) => {
		setRole(data);
		setTabKeys(tab);
		setOpenPermission(true);
	};
	// 更新数据
	const update = () => {
		actionRef.current?.reload();
	};

	const request = async (pramas: any) => {
		const { pageSize, current, ...restPramas } = pramas;
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;
		const { data }: any = await fetchRoleList(
			{
				roleCategoryId,
				pageSize,
				pageNum: current,
				...restPramas,
			},
			{ signal: controller.signal },
		);

		return {
			data: data?.list,
			success: true,
			total: data?.total,
			pageSize,
			pageNum: current,
		};
	};

	const confirmOpenClose = (open: boolean, role: RoleItemType) => {
		confirm({
			icon: open ? "blue" : "yellow",
			title: `请确认是否${open ? "开启" : "关闭"}角色`,
			content: open
				? ""
				: "角色关闭后，其关联用户的对应功能权限将自动失效，且该角色将无法在“用户管理-角色”选项中进行选择。",
			centered: true,
			onOk: async () => {
				const { code } = open
					? await fetchEnableRoleItem(role.roleId)
					: await fetchDisableRoleItem(role.roleId);
				if (code === 200) {
					messageApi.success(`${open ? "开启" : "关闭"}成功`);
					update();
				}
			},
			onCancel() {},
		});
	};
	const handleAdd = () => {
		setOpenAddRole(true);
	};
	const confirmDelete = (role: RoleItemType) => {
		confirm({
			icon: "yellow",
			title: "请确认是否删除角色",
			centered: true,
			onOk: async () => {
				const { code } = await fetchDeleteRoleItem(role.roleId);
				if (code === 200) {
					messageApi.success("删除成功");
					actionRef.current?.reload();
				}
			},
			onCancel() {},
		});
	};

	// 刷新
	const refreshList = () => {
		actionRef.current?.reload();
	};

	const openRoleModal = (role: RoleItemType) => {
		setOpenRoleMap(true);
		setRole(role);
	};

	const getColumns = () => {
		return [
			{
				title: "角色名称",
				dataIndex: "roleName",
				hideInSearch: false,

				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
					placeholder: "支持模糊搜索",
				},
				render: (value: string, row: RoleItemType, _: number) => {
					return <CheckRole role={row} />;
				},
			},
			{
				title: "角色类型",
				dataIndex: "roleType",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				render: (value: any, role: RoleItemType) => {
					return <div>{role.roleTypeName}</div>;
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={typeOptions}
						/>
					);
				},
			},
			{
				title: "人数(人)",
				dataIndex: "memberNumber",
				hideInSearch: true,
				// ;
				render: (value: number) => {
					return (
						<div className="flex flex-row items-center">
							<span>{value}</span>
							<img
								src={refresh}
								className="ml-2 h-4 w-4 cursor-pointer"
								onClick={refreshList}
							/>
						</div>
					);
				},
			},
			{
				title: "角色状态",
				dataIndex: "status",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
				},
				render: (value: any, role: RoleItemType) => {
					return (
						<Switch
							disabled={role.roleId === AdminRole.roleId}
							checked={value === "0"}
							onChange={(value) => confirmOpenClose(value, role)}
							checkedChildren={
								statusOptions?.find((e: any) => e.dictValue === "0")?.dictLabel
							}
							unCheckedChildren={
								statusOptions?.find((e: any) => e.dictValue === "1")?.dictLabel
							}
						/>
					);
				},
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={statusOptions}
						/>
					);
				},
			},
			{
				title: "更新人",
				dataIndex: "updateBy",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4",
				},
				fieldProps: {
					variant: "borderless",
					placeholder: "支持模糊搜索",
				},
			},
			{
				title: "最后更新时间",
				dataIndex: "updateTime",
				hideInSearch: true,
			},
			{
				title: "操作",
				dataIndex: "opera",
				hideInSearch: true,
				width: 350,
				render: (_: any, role: RoleItemType) => {
					return (
						<div className="flex cursor-pointer items-center">
							<Space split={<Divider type="vertical" />}>
								<Typography.Link onClick={() => showDrawer(role, "1")}>
									功能权限
								</Typography.Link>
								<Typography.Link onClick={() => showDrawer(role, "2")}>
									成员管理
								</Typography.Link>
								<Typography.Link onClick={() => openRoleModal(role)}>
									角色映射
								</Typography.Link>
								{role.roleId !== AdminRole.roleId ? (
									<>
										<Typography.Link onClick={() => confirmDelete(role)}>
											删除
										</Typography.Link>
									</>
								) : (
									<></>
								)}
							</Space>
						</div>
					);
				},
			},
		];
	};

	useEffect(() => {
		if (!formRef.current && roleCategoryId) return;
		try {
			formRef.current?.submit();
		} catch (e) {
			console.error(e);
		}
	}, [roleCategoryId]);

	return (
		<BasicContent
			style={{
				height: "100%",
				display: "flex",
				justifyContent: "space-between",
			}}
		>
			{contextHolder}
			<RoleContext.Provider value={{ update }}>
				<FoldContent
					foldWidth="16.7%"
					foldChildren={
						<Roletree
							roleCategoryId={roleCategoryId}
							setRoleCategoryId={setRoleCategoryId}
						/>
					}
					spreadChildren={
						<BasicTable
							rowKey="roleId"
							adaptive
							scroll={{ x: "1600" }}
							columns={getColumns() as any}
							request={request as any}
							actionRef={actionRef}
							// params={{ roleCategoryId }}
							formRef={formRef}
							cardBordered={false}
							headerTitle={
								<div className="flex gap-2">
									<BasicButton key="add" type="primary" onClick={handleAdd}>
										新增角色
									</BasicButton>
								</div>
							}
							search={{
								className:
									"!mb-0 !pt-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",
								labelWidth: "auto",
								span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
								defaultCollapsed: false,
								optionRender: (searchConfig) => [
									<Button
										key="submit"
										type="primary"
										onClick={() => searchConfig.form?.submit()}
									>
										查询
									</Button>,
									<Button
										key="reset"
										type="text"
										onClick={() => {
											searchConfig.form?.resetFields();
											searchConfig.form?.submit();
										}}
									>
										重置
									</Button>,
								],
							}}
							toolbar={{
								className: "border-t",
							}}
							options={{
								reload: false,
								density: false,
								fullScreen: false,
								setting: {
									settingIcon: <BasicButton>列表选项</BasicButton>,
								},
							}}
						/>
					}
				/>
				<AddRole openAddRole={openAddRole} setOpenAddRole={setOpenAddRole} />
				{role ? (
					<RoleMapping
						role={role}
						openAddRole={openRoleMap}
						setOpenAddRole={setOpenRoleMap}
					/>
				) : (
					<></>
				)}

				{role ? (
					<EditPermission
						role={role}
						open={openPermission}
						setOpen={setOpenPermission}
						tabKeys={tabKeys}
					/>
				) : (
					<></>
				)}
			</RoleContext.Provider>
		</BasicContent>
	);
}
