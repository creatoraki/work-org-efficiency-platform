import type { UserItemType, UserTreeType } from "#src/api/system";
import type { ProColumns } from "@ant-design/pro-components";
import {
	fetchActiveUserItem,
	fetchCloseUserItem,
	fetchDeleteUserItem,
	fetchUserList,
} from "#src/api/system";
import { BasicButton, BasicContent, BasicTable } from "#src/components";
import { confirm } from "#src/components/custom-confirm";
import FoldContent from "#src/components/foldContent";
import { useDict } from "#src/hooks";
import { useUserStore } from "#src/store";
import { DownOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, message, Select, Switch, theme, Tooltip, Typography } from "antd";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import AddUser from "./components/AddUser";
import EditPermission from "./components/EditPermission";
import ResetUser from "./components/ResetUser";
import UserTree from "./components/UserTree";

interface TreeDataContextType {
	treeData: UserTreeType[];
	setTreeData: (treeData: UserTreeType[]) => void;
}

export const AdminUser = {
	account: "admin",
	id: 1,
	name: "admin",
	status: "0",
	userType: "00",
};

export const TreeDataContext = createContext<TreeDataContextType>({
	treeData: [],
	setTreeData: () => {},
});

export default function User() {
	const [openPermission, setOpenPermission] = useState(false);
	const [openResetUser, setOpenResetUser] = useState(false);
	const [user, setUser] = useState<UserItemType | undefined>(undefined);
	const [dept, setDept] = useState<UserTreeType | null>();
	const [operaKeys, setOperaKeys] = useState<any>([]);
	const [treeData, setTreeData] = useState<UserTreeType[]>([]);
	const { token } = theme.useToken();
	const { options } = useDict("job_status");
	const { roles: userRoles } = useUserStore();
	const actionRef = useRef<any>();
	const formRef = useRef<any>();
	const abortControllerRef = useRef<AbortController | null>(null);
	const [messageApi, contextHolder] = message.useMessage();

	const adminRole = useMemo(
		() => userRoles?.find((e) => e.roleKey === "admin" || e === "admin"),
		[userRoles],
	);

	const showDrawer = (data: UserItemType) => {
		setUser(data);
		setOpenPermission(true);
	};

	const request = async (pramas: any) => {
		const { pageSize, current, ...restPramas } = pramas;

		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;
		const {
			data: { list, total },
		}: any = await fetchUserList(
			{
				pageSize,
				pageNum: current,
				deptCode: dept && dept?.deptCode === "-1" ? undefined : dept?.deptCode,
				userType: dept ? (dept?.deptCode === "-1" ? "00" : "01") : undefined,
				...restPramas,
			},
			{ signal: controller.signal },
		);
		return {
			data: list,
			success: true,
			total,
			pageSize,
			pageNum: current,
		};
	};

	// 重置密码
	const handleResetUser = (user: UserItemType) => {
		setUser(user);
		setOpenResetUser(true);
	};

	// 确认删除账户
	const confirmDelete = (user: UserItemType) => {
		confirm({
			icon: "yellow",
			title: "请确认是否删除",
			centered: true,
			onOk: async () => {
				const { code } = await fetchDeleteUserItem([user.id]);
				if (code === 200) {
					messageApi.success("删除成功");
					actionRef.current?.reload();
				}
			},
			onCancel() {},
		});
	};

	// 确认开启/停用账户
	const confirmOpenClose = (open: boolean, user: UserItemType) => {
		confirm({
			icon: open ? "blue" : "yellow",
			title: `请确认是否${open ? "开启" : "关闭"}`,
			centered: true,
			content: open ? "" : "关闭后，该账号将不能登入该平台",
			onOk: async () => {
				const { code } = open
					? await fetchActiveUserItem([user.id])
					: await fetchCloseUserItem([user.id]);
				if (code === 200) {
					messageApi.success(`${open ? "开启" : "关闭"}成功`);
					actionRef.current?.reload();
				}
			},
			onCancel() {},
		});
	};

	// 批量操作
	const handleOperation = async (opera: "active" | "close") => {
		const opearText = opera === "active" ? "激活" : "关闭";
		// 校验是否有选中项
		if (!operaKeys || !Array.isArray(operaKeys) || operaKeys.length === 0) {
			messageApi.warning("请先选择要操作的用户");
			return;
		}
		const idsArray: number[] = operaKeys
			.map((k: any) => Number(k))
			.filter((v: number) => !Number.isNaN(v));
		const exec = async () => {
			try {
				let res: any = {};
				if (opera === "active") {
					res = await fetchActiveUserItem(idsArray);
				} else {
					res = await fetchCloseUserItem(idsArray);
				}
				if (res && res.code === 200) {
					const successText = `${opearText}成功`;
					messageApi.success(successText);
					// 刷新表格并清空选择
					actionRef.current?.reload?.();
					try {
						actionRef.current?.clearSelected?.();
					} catch (err) {
						console.error(err);
					}
					setOperaKeys([]);
				} else {
					const errText = `${opearText}失败`;
					messageApi.error(errText);
				}
			} catch (e) {
				console.error(e);
				messageApi.error("操作失败，请稍后重试");
			}
		};
		// 需要二次确认
		confirm({
			icon: "yellow",
			title: `请确认是否${opearText}选中的 ${idsArray.length} 个账号？`,
			centered: true,
			okText: "确认",
			onOk: exec,
		});
	};
	const columns: ProColumns<UserItemType>[] = [
		{
			title: "账号",
			dataIndex: "account",
			hideInSearch: false,
			width: 150,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
			},
			fieldProps: {
				variant: "borderless",
				placeholder: "支持模糊搜索",
			},
		},
		{
			title: "姓名",
			dataIndex: "name",
			hideInSearch: false,
			width: 150,
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
			title: "主岗位",
			dataIndex: "staffJobName",
			hideInSearch: true,
			width: 90,
		},
		{
			title: "所属组织",
			dataIndex: "deptName",
			hideInSearch: true,
			width: 150,
			render: (value: any, user: UserItemType) => {
				const deptFullName = user.deptFullName?.split(",").join(">");
				return (
					<Tooltip
						placement="top"
						title={deptFullName}
						className="cursor-pointer"
						color="#000000B2"
					>
						{value}
					</Tooltip>
				);
			},
		},
		{
			title: "电话号码",
			dataIndex: "mobileNum",
			hideInSearch: false,
			width: 110,

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
			title: "用户状态",
			dataIndex: "status",
			hideInSearch: false,
			width: 100,

			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6] pl-4",
			},
			fieldProps: {
				variant: "borderless",
			},
			render: (value: any, user: UserItemType) => {
				return (
					<Switch
						disabled={user?.account === AdminUser.account}
						size="small"
						checked={value === "0"}
						onChange={(value) => confirmOpenClose(value, user)}
					/>
				);
			},
			renderFormItem: () => {
				return (
					<Select
						allowClear
						placeholder="请选择"
						className="variant=borderless w-full"
						options={[
							{ label: "正常", value: "0" },
							{ label: "停用", value: "1" },
						]}
					/>
				);
			},
		},
		{
			title: "在职状态",
			dataIndex: "jobStatus",
			hideInSearch: false,
			width: 90,
			formItemProps: {
				colon: false,
				className: "rounded border-[1px] border-[#DCDFE6] pl-4",
			},
			fieldProps: {
				variant: "borderless",
			},
			render: (value: any, user) => {
				return user.jobStatusName ? (
					<div>
						<Badge status={user.jobStatusName === "在职" ? "success" : "default"} />
						<span
							className="ml-1"
							style={
								user.jobStatusName !== "在职"
									? {
											color: "#C0C4CC",
										}
									: {}
							}
						>
							{user.jobStatusName}
						</span>
					</div>
				) : (
					<div>-</div>
				);
			},
			renderFormItem: () => {
				return (
					<Select
						allowClear
						placeholder="请选择"
						className="variant=borderless w-full"
						options={options}
					/>
				);
			},
		},
		{
			title: "最后登录时间",
			dataIndex: "loginDate",
			hideInSearch: true,
			width: 150,
		},
		{
			title: "操作",
			dataIndex: "opera",
			hideInSearch: true,
			width: 200,
			render: (dom, user: UserItemType) => {
				return (
					<div className="flex cursor-pointer items-center gap-3">
						<Typography.Link onClick={() => showDrawer(user)}>权限配置</Typography.Link>
						{user.account !== AdminUser.account ? (
							<>
								<span
									className="inline-block h-4 w-px"
									style={{
										backgroundColor: token.colorBorderSecondary,
									}}
								></span>
								<Typography.Link onClick={() => handleResetUser(user)}>
									重置密码
								</Typography.Link>
							</>
						) : (
							<></>
						)}
						{user.userType !== "01" && user.account !== AdminUser.account ? (
							<>
								<span
									className="inline-block h-4 w-px"
									style={{
										backgroundColor: token.colorBorderSecondary,
									}}
								></span>
								<Typography.Link onClick={() => confirmDelete(user)}>
									删除
								</Typography.Link>
							</>
						) : (
							<></>
						)}
					</div>
				);
			},
		},
	];
	const contextValue = useMemo(() => {
		return {
			treeData,
			setTreeData,
		};
	}, [treeData]);

	useEffect(() => {
		if (!formRef.current && dept) return;
		try {
			formRef.current?.submit();
		} catch (e) {
			console.error(e);
		}
	}, [dept]);

	return (
		<BasicContent className="h-full bg-white/100">
			{contextHolder}
			<TreeDataContext.Provider value={contextValue}>
				<FoldContent
					foldWidth="16.7%"
					foldChildren={
						<UserTree dept={dept} setDept={setDept} TreeDataContext={TreeDataContext} />
					}
					spreadChildren={
						<BasicTable
							columns={columns}
							request={request as any}
							adaptive
							scroll={{ x: "1600" }}
							cardBordered={false}
							headerTitle={
								<div className="flex gap-2">
									{adminRole ? <AddUser /> : <></>}

									<Dropdown
										menu={{
											items: [
												{
													key: "online",
													label: "批量激活",
													onClick: () => handleOperation("active"),
												},
												{
													key: "offline",
													label: "批量关闭",
													onClick: () => handleOperation("close"),
												},
											],
										}}
										trigger={["click"]}
									>
										<BasicButton
											type="default"
											icon={<DownOutlined />}
											iconPosition="end"
										>
											批量操作
										</BasicButton>
									</Dropdown>
								</div>
							}
							search={{
								className:
									"!mb-0 !pt-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",
								labelWidth: "auto",
								span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
								defaultCollapsed: false,
								// 在提交搜索前，过滤所有空值（空字符串 / null / undefined / 空数组）
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
											searchConfig.form?.submit(); // 重置后自动刷新
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
							rowSelection={{
								alwaysShowAlert: true,
								onChange: (selectedRowKeys: React.Key[]) =>
									setOperaKeys(selectedRowKeys),
							}}
							tableAlertRender={() => {
								return false;
							}}
							actionRef={actionRef}
							formRef={formRef}
						/>
					}
				/>
				<ResetUser
					user={user}
					openResetUser={openResetUser}
					setOpenResetUser={setOpenResetUser}
				/>
				{user ? (
					<EditPermission user={user} open={openPermission} setOpen={setOpenPermission} />
				) : (
					<></>
				)}
			</TreeDataContext.Provider>
		</BasicContent>
	);
}
