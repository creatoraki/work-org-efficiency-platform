import type {
	RoleInfoDetailType,
	RoleUserListRes,
	UserItemType,
	UserTreeType,
} from "#src/api/system";
import {
	fetchRoleUserbind,
	fetchRoleUserList,
	fetchRoleUserunbind,
	fetchSaveRoleUser,
} from "#src/api/system";
import { BasicButton, BasicTable } from "#src/components";
import { confirm } from "#src/components/custom-confirm";
import { useDict } from "#src/hooks";
import { Dropdown, message, Select, TreeSelect } from "antd";
import { difference } from "lodash-es";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import UserTree from "../../user/components/UserTree";
import { RoleContext } from "../index";
import { MaintainerSelectorModal } from "./MaintainerSelectorModal";

interface TreeDataContextType {
	treeData: UserTreeType[];
	setTreeData: (treeData: UserTreeType[]) => void;
}
interface RuleConfigProps {
	roleDetail: RoleInfoDetailType;
	open: boolean;
}

export const TreeDataContext = createContext<TreeDataContextType>({
	treeData: [],
	setTreeData: () => {},
});

export default function RuleConfig(props: RuleConfigProps) {
	const { roleDetail, open } = props;
	const [dept, setDept] = useState<UserTreeType | null>();

	const [roleId, setRoleId] = useState<number>(roleDetail.roleId);
	const [treeData, setTreeData] = useState<UserTreeType[]>([]);
	const [operaKeys, setOperaKeys] = useState<any>([]);
	const [openBind, setOpenBind] = useState(false);
	const { update } = useContext<any>(RoleContext);
	const [messageApi, contextHolder] = message.useMessage();

	const { options } = useDict("job_status");
	const { options: userOptions } = useDict("user_status");
	const actionRef = useRef<any>();

	// 确认解绑
	const confirmUnbind = (user: RoleUserListRes) => {
		confirm({
			centered: true,
			icon: "yellow",
			title: "请确认是否解绑",
			onOk: async () => {
				const { code } = await fetchRoleUserunbind({
					roleId,
					userIdList: [user.userId],
				});
				if (code === 200) {
					messageApi.success("解绑成功");
					update();
					actionRef.current?.reload();
					setOperaKeys([]);
				}
			},
			onCancel() {},
		});
	};

	// 批量解绑
	const confirmClose = () => {
		confirm({
			icon: "yellow",
			title: "请确认是否解绑",
			centered: true,
			onOk: async () => {
				const { code } = await fetchRoleUserunbind({
					roleId,
					userIdList: operaKeys,
				});
				if (code === 200) {
					messageApi.success("解绑成功");
					actionRef.current?.reload();
					update();
					setOperaKeys([]);
				} else {
					setOperaKeys([]);
				}
			},
			onCancel() {
				setOperaKeys([]);
			},
		});
	};

	// 修改用户数据权限
	const handleChangeIdList = async (projIdList: number[], user: RoleUserListRes) => {
		const { code } = await fetchSaveRoleUser({
			dataScopeSaveForms: [
				{
					userId: user.userId,
					projIdList,
				},
			],
		});
		if (code === 200) {
			messageApi.success("修改成功");
		} else {
			// messageApi.error("修改失败");
		}
		actionRef.current?.reload();
	};

	function getColumns(treeData: UserTreeType[]) {
		return [
			{
				title: "账号",
				dataIndex: "account",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
				},
				fieldProps: {
					variant: "borderless",
				},
			},
			{
				title: "姓名",
				dataIndex: "name",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
				},
				fieldProps: {
					variant: "borderless",
				},
			},
			{
				title: "所属组织",
				dataIndex: "orgName",
				width: 150,

				hideInSearch: true,
			},
			{
				title: "电话号码",
				dataIndex: "phoneNumber",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
				},
				fieldProps: {
					variant: "borderless",
				},
			},
			{
				title: "用户状态",
				dataIndex: "status",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
				},
				fieldProps: {
					variant: "borderless",
				},
				render: (value: any, user: UserItemType) => <div>{user.statusNane}</div>,
				renderFormItem: () => {
					return (
						<Select
							allowClear
							placeholder="请选择"
							className="variant=borderless w-full"
							options={userOptions}
						/>
					);
				},
			},
			{
				title: "在职状态",
				dataIndex: "jobStatus",
				hideInSearch: false,
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6] pl-4 ",
				},
				fieldProps: {
					variant: "borderless",
				},
				render: (value: any, user: UserItemType) => <div>{user.jobStatusName}</div>,
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
				title: "数据权限",
				width: 250,
				dataIndex: "projIdList",
				hideInSearch: true,
				render: (value: number[] | string, record: RoleUserListRes) => (
					<ProjIdTreeSelect
						initValue={value === "-" ? [] : value}
						treeData={treeData}
						record={record}
						handleChangeIdList={handleChangeIdList}
					/>
				),
			},
			{
				title: "操作",
				dataIndex: "opera",
				hideInSearch: true,
				render: (_: number, record: RoleUserListRes) => {
					return (
						<div className="flex cursor-pointer gap-3 text-blue-500">
							<span onClick={() => confirmUnbind(record)}> 解绑</span>
						</div>
					);
				},
			},
		];
	}

	const request = async (pramas: any) => {
		const { pageSize, current, dept, ...restPramas } = pramas;
		const { data }: any = await fetchRoleUserList({
			pageSize,
			pageNum: current,
			roleId,
			orgId: dept?.deptCode === "-1" ? -1 : dept?.deptId,
			...restPramas,
		});
		const { total, list } = data;
		return {
			data: list,
			success: true,
			total,
			pageSize,
			pageNum: current,
		};
	};

	// 处理确认
	const handleConfirm = async (userIdList: number[]) => {
		const { code } = await fetchRoleUserbind({
			roleId,
			userIdList,
		});
		if (code === 200) {
			messageApi.success("绑定成功");
			actionRef.current?.reload();
			setOpenBind(false);
			update();
		} else {
			messageApi.success("绑定失败");
			setOpenBind(false);
		}
	};
	const contextValue = useMemo(() => {
		return {
			treeData,
			setTreeData,
		};
	}, [treeData]);

	useEffect(() => {
		setRoleId(roleDetail.roleId);
		return () => {
			setDept(undefined);
		};
	}, [roleDetail]);

	useEffect(() => {
		if (open) {
			actionRef.current?.reload();
		}
	}, [open]);

	return (
		<div className="flex h-full w-full flex-row gap-4">
			{contextHolder}
			<TreeDataContext.Provider value={contextValue}>
				<div className="h-full w-1/5 rounded-md border bg-white/100">
					<UserTree dept={dept} setDept={setDept} TreeDataContext={TreeDataContext} />
				</div>
				<div className="h-full w-4/5 rounded-md border p-4">
					<BasicTable
						adaptive={{
							offsetBottom: 49,
						}}
						actionRef={actionRef}
						rowKey="userId"
						params={{ dept, roleId }}
						options={{
							setting: false,
							reload: false,
							density: false,
							fullScreen: false,
						}}
						columns={getColumns(treeData) as any}
						cardBordered={false}
						search={{
							className:
								"!mb-0 !pt-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",
							labelWidth: "auto",
							span: { xs: 6, sm: 6, md: 6, lg: 6, xl: 6, xxl: 6 },
							defaultCollapsed: false,
						}}
						toolbar={{
							className: "border-t",
						}}
						request={request as any}
						headerTitle={
							<div className="flex gap-2">
								<Dropdown
									menu={{
										items: [
											{
												key: "online",
												label: "批量绑定",
												onClick: () => setOpenBind(true),
											},
											{
												key: "批量解绑",
												label: "批量解绑",
												onClick: confirmClose,
												disabled: !operaKeys?.length,
											},
										],
									}}
									trigger={["click"]}
								>
									<BasicButton type="default">批量操作</BasicButton>
								</Dropdown>
							</div>
						}
						rowSelection={{
							alwaysShowAlert: true,
							onChange: (selectedRowKeys: React.Key[]) =>
								setOperaKeys(selectedRowKeys),
						}}
						tableAlertRender={() => {
							return false;
						}}
					/>
				</div>
				{openBind ? (
					<MaintainerSelectorModal
						open={openBind}
						onClose={() => setOpenBind(false)}
						title="批量绑定"
						onConfirm={handleConfirm}
					/>
				) : (
					<></>
				)}
			</TreeDataContext.Provider>
		</div>
	);
}

function ProjIdTreeSelect(props: {
	initValue: any;
	treeData: UserTreeType[];
	record: RoleUserListRes;
	handleChangeIdList: any;
}) {
	const { initValue = [], treeData, record, handleChangeIdList } = props;
	const [value, setValue] = useState<number[]>(initValue?.map((e: any) => e?.id));
	const [open, setOpen] = useState(false);

	const handleChange = (keys: number[]) => {
		if ((value.length > keys.length || keys?.length === 0) && !open) {
			handleChangeIdList(keys, record);
		}
		setValue(keys);
	};
	const renderTreeNode = (nodeData: any) => {
		const { value, deptName } = nodeData || {};
		// 如果组织树找不到这个节点，就显示接口返回的name
		const nodeName = deptName || initValue?.find((e: any) => e.id === value)?.name;
		return <>{nodeName}</>;
	};

	useEffect(() => {
		const list = record?.projIdList?.map((e: any) => e?.id) || [];
		const isChange = value?.length < list?.length || !!difference(value, list)?.length;
		if (!open && isChange) {
			handleChangeIdList(value, record);
		}
	}, [open, value]);

	return (
		<TreeSelect
			open={open}
			allowClear
			showSearch
			value={value}
			onChange={handleChange}
			onFocus={() => setOpen(true)}
			onBlur={() => setOpen(false)}
			treeCheckable
			treeData={treeData}
			placeholder="请选择"
			style={{ width: 250 }}
			showCheckedStrategy="SHOW_PARENT"
			fieldNames={{ label: "deptName", value: "deptId", children: "children" }}
			filterTreeNode={(inputValue, node) => {
				const label = node?.deptName ?? "";
				return String(label).toLowerCase().includes(inputValue.toLowerCase());
			}}
			treeTitleRender={renderTreeNode}
		/>
	);
}
