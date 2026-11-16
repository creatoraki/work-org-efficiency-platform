import type { MenuTree, UserInfoDetailType } from "#src/api/system";
import { fetchUserMenuByRole } from "#src/api/system";
import { useDict } from "#src/hooks";
import { EditableProTable, ProForm } from "@ant-design/pro-components";
import { Button, Checkbox, Col, Form, Radio, Row, Select } from "antd";
import { findIndex, uniq, uniqBy } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdminUser } from "../index";
import { flattenTree, idCountMap } from "./unit";

export interface PermissionNode {
	id: number;
	name: string;
	children: PermissionNode[] | null;
	level: number;
	checked: boolean;
	userChecked: boolean;
	parentId: number;
	weight: number;
	inheritsRole: boolean;
}
interface FunctionPermissionType {
	userDetail: UserInfoDetailType | undefined;
	handleUpdate: (menuIdList: any[], dataPermList: any[]) => void;
	roles: number[];
}
interface MenuItem {
	id: string | number;
	name: string;
	nodes: PermissionNode[];
	parents: { id: string | number }[];
	inheritsRole?: boolean;
}

const dataPermObj = {
	confidentialLevelList: [2018, 2022, 2030],
	jobAuditDeptList: [2026],
};
export default function FunctionPermission(props: FunctionPermissionType) {
	const { userDetail, handleUpdate, roles } = props;
	const [roleMenuTree, setroleMenuTree] = useState<MenuTree[]>([]);
	const [menuData, setMenuData] = useState<MenuItem[]>([]);
	const formRef = useRef<any>();
	const editorFormRef = useRef<any>();

	const [menuForm] = Form.useForm();
	const first = Form.useWatch("first", menuForm); // 筛选一级菜单
	const second = Form.useWatch("second", menuForm); // 筛选二级菜单
	const third = Form.useWatch("third", menuForm); // 筛选三级菜单

	const containerRef = useRef<HTMLDivElement | null>(null);
	const [tableScrollY, setTableScrollY] = useState<number>(400);

	// 数据权限字典
	const { options: confidentialOptions } = useDict("confidential_level");
	const { options: jobAuditOptions } = useDict("job_audit_dept");

	// 合并单元格逻辑
	function getRowSpan(index: number, parentIndex: number) {
		const data = formRef.current?.getFieldValue("table") || [];
		if (!data) return 0;
		const currentId = data[index]?.parents?.[parentIndex]?.id;
		const compareId = data[index - 1]?.parents?.[parentIndex]?.id;
		return compareId === currentId ? 0 : idCountMap(data).get(currentId);
	}

	// 获取需要传参的节点ID
	const getMenuIdList = () => {
		const tableData = menuData as MenuItem[] | undefined;
		const dataPermList = formRef.current?.getFieldValue("dataPerm");
		if (!tableData) return;

		// Step 1: 筛选出有效项（根据 inheritsRole 判断 checked / userChecked）
		const validItems = tableData.filter((item) => {
			const hasCheckedNode = item.nodes.some((node) =>
				item.inheritsRole ? node.checked : node,
			);
			return hasCheckedNode;
		});

		// Step 2: 提取所有父级路径（去掉最后一级，即当前项自身）
		const parentPaths = validItems.flatMap((item) => {
			const path = [...item.parents];
			path.pop(); // 移除最后一项（通常是当前菜单项自己）
			return path;
		});

		const uniqList = uniq(parentPaths?.map((item) => JSON.stringify(item)))?.map((item) =>
			JSON.parse(item),
		);

		const parents2 = [...uniqList]
			?.filter((e: any) => !!e.parentId)
			?.map((p) => {
				const children = validItems?.filter(
					(item) => !!p.children?.find((e: any) => e.id === item.id),
				);
				return { ...p, inheritsRole: !!children?.find((e: any) => e.inheritsRole) };
			});
		const parents1 = [...uniqList]
			?.filter((e: any) => !e.parentId)
			?.map((p) => {
				const children = parents2?.length
					? parents2?.filter((e) => e.parentId === p.id)
					: validItems?.filter(
							(item) => !!p.children?.find((e: any) => e.id === item.id),
						);
				return { ...p, inheritsRole: !!children?.find((e: any) => e.inheritsRole) };
			});

		// 父级菜单节点，（除父级的最后一级）
		const uniqueParents = [...parents1, ...parents2]?.map((p) => ({
			menuId: p.id,
			name: p.name,
			inheritsRole: p.inheritsRole,
		}));

		// Step 3: 提取所有操作节点（nodes 中被选中的项）
		const operaNodes = validItems.flatMap((item) =>
			item.nodes.filter((node) => (item.inheritsRole ? node.checked : true)),
		);

		// 操作节点
		const uniqueOperaNodes = uniqBy(operaNodes, "id").map((node) => {
			if (!node.inheritsRole) {
				return {
					menuId: node.id,
					name: node.name,
					inheritsRole: node.inheritsRole,
					userChecked: node.userChecked,
				};
			} else {
				return {
					menuId: node.id,
					name: node.name,
					inheritsRole: node.inheritsRole,
				};
			}
		});

		// Step 4: 提取项本身---父级菜单的最后一级节点
		const topLevelNodes = validItems.map((item: any) => ({
			menuId: item.id,
			name: item.name,
			inheritsRole: item.inheritsRole,
			...(!item.inheritsRole && item.nodes?.[0]?.parentId === item.id
				? {
						// 父级菜单的最后一级如果没有继承角色，要返回userChecked的选中状态
						userChecked: !!item.nodes?.find((el: any) => el.userChecked),
					}
				: {}),
		}));

		// 合并并更新
		handleUpdate([...uniqueParents, ...topLevelNodes, ...uniqueOperaNodes], dataPermList);
	};

	const getColumns = () => {
		return [
			{
				title: "一级菜单",
				dataIndex: "parents",
				key: 1,
				onCell: (_: any, index = -1) => ({ rowSpan: getRowSpan(index, 0) }),
				render: (parents: PermissionNode[], record: any) =>
					parents?.length === 1 ? (
						<NodeCheckbox
							parent={parents[0]}
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					) : (
						<ParentCheckbox
							parent={parents[0]}
							num={0}
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					),
			},
			{
				title: "二级菜单",
				dataIndex: "parents",
				key: 2,
				fieldProps: {
					variant: "borderless",
				},
				onCell: ({ parents }: any, index = -1) => ({
					rowSpan: parents[1] ? getRowSpan(index, 1) : 1,
				}),
				render: (parents: PermissionNode[], record: any) =>
					parents?.length === 2 ? (
						<NodeCheckbox
							parent={parents[1]}
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					) : parents[1] ? (
						<ParentCheckbox
							parent={parents[1]}
							num={1}
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					) : (
						<></>
					),
			},
			{
				title: "三级菜单",
				dataIndex: "parents",
				key: 3,
				fieldProps: {
					variant: "borderless",
				},
				onCell: ({ parents }: any, index = -1) => ({
					rowSpan: parents[2] ? getRowSpan(index, 2) : 1,
				}),
				render: (parents: PermissionNode[], record: any) =>
					parents[2] ? (
						<NodeCheckbox
							parent={parents[2]}
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					) : (
						<></>
					),
			},
			{
				title: "操作权限",
				dataIndex: "nodes",
				key: 3,
				fieldProps: {
					variant: "borderless",
				},
				onCell: ({ parents }: any, index = -1) => ({
					rowSpan: parents[2] ? getRowSpan(index, 2) : 1,
				}),
				render: (nodes: PermissionNode[]) => {
					return (
						<OperaCheckbox
							items={nodes}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					);
				},
			},
			{
				title: "数据权限",
				dataIndex: "status",
				width: 320,
				hideInSearch: true,
				render: (_: any, record: any) => {
					return dataPermObj.confidentialLevelList.includes(record.id) ? (
						<Form.Item noStyle name="dataPerm">
							<DataPermSelect
								permKey="confidentialLevelList"
								options={confidentialOptions || []}
								record={record}
								userId={userDetail?.userMenuEditBO.userId || 0}
								permType="敏感标签"
							/>
						</Form.Item>
					) : dataPermObj.jobAuditDeptList.includes(record.id) ? (
						<Form.Item noStyle name="dataPerm">
							<DataPermSelect
								permKey="jobAuditDeptList"
								options={jobAuditOptions || []}
								record={record}
								userId={userDetail?.userMenuEditBO.userId || 0}
								permType="部门审核"
							/>
						</Form.Item>
					) : (
						<></>
					);
				},
			},
			{
				title: "是否继承角色权限",
				dataIndex: "inheritsRole",
				width: 140,
				key: 3,
				fieldProps: {
					variant: "borderless",
				},
				onCell: ({ parents }: any, index = -1) => ({
					rowSpan: parents[2] ? getRowSpan(index, 2) : 1,
				}),
				render: (value: boolean, record: any) => {
					return (
						<InheritsRole
							record={record}
							menuData={menuData}
							setMenuData={setMenuData}
						/>
					);
				},
			},
		];
	};

	// 根据角色获取权限树数据
	const fetchRoleData = async () => {
		if (!userDetail) {
			return;
		}
		const { data, code } = await fetchUserMenuByRole(
			userDetail.userMenuEditBO.userId,
			roles.join(","),
		);
		if (code === 200) {
			const table = flattenTree(data.menuTree);
			const newTable = table?.map((item: MenuItem) => {
				if (item.name === "工作台") {
					return {
						...item,
						inheritsRole: false,
						nodes: item?.nodes?.map((node) => {
							return {
								...node,
								inheritsRole: false,
								userChecked: true,
							};
						}),
					};
				} else {
					return item;
				}
			});
			const newDataPermList = data.dataPermList;
			setroleMenuTree(data.menuTree);
			setMenuData(newTable);

			formRef.current?.setFieldValue("table", newTable);
			formRef.current?.setFieldValue("dataPerm", newDataPermList || []);
		}
	};

	// 根据筛选呈现table
	const getTableByMenu = () => {
		if (!menuData?.length) {
			formRef.current?.setFieldValue("table", []);
			return;
		}
		const firstSet = first?.length ? new Set(first) : null;
		const secondSet = second?.length ? new Set(second) : null;
		const thirdSet = third?.length ? new Set(third) : null;

		let filteredData = menuData;
		if (thirdSet) {
			filteredData = menuData.filter((item) => thirdSet.has(item.id));
		} else if (secondSet) {
			filteredData = menuData.filter(
				(item) => item.parents?.[1]?.id && secondSet.has(item.parents[1].id),
			);
		} else if (firstSet) {
			filteredData = menuData.filter(
				(item) => item.parents?.[0]?.id && firstSet.has(item.parents[0].id),
			);
		}

		formRef.current?.setFieldValue("table", filteredData);
	};
	// 重置筛选
	const resetMenu = () => {
		menuForm.resetFields();
		formRef.current?.setFieldValue("table", menuData);
	};

	// 一级菜单选项
	const firstMenuOPtions = useMemo(() => {
		return roleMenuTree?.map((e) => {
			return {
				label: e.name,
				value: e.id,
			};
		});
	}, [roleMenuTree]);

	// 二级菜单选项
	const secondMenuOptions = useMemo(() => {
		if (!roleMenuTree || !Array.isArray(roleMenuTree)) {
			return [];
		}
		// 如果 first 为空或未定义，视为选择全部一级菜单
		const selectedFirstLevelMenus = first?.length
			? roleMenuTree.filter((menu) => first.includes(menu.id))
			: roleMenuTree;

		const secondLevelMenus = selectedFirstLevelMenus
			.flatMap((menu) => menu.children ?? [])
			.filter(Boolean);

		// 只保留有 children 的二级菜单（即能作为“父级”的菜单）
		return secondLevelMenus
			.filter((menu) => Array.isArray(menu.children) && menu.children.length > 0)
			.map(({ id, name }) => ({
				label: name,
				value: id,
			}));
	}, [roleMenuTree, first]);

	// 三级菜单选项
	const thirdMenuOptions = useMemo(() => {
		if (!roleMenuTree || !Array.isArray(roleMenuTree)) {
			return [];
		}

		let candidateLevel2Menus;

		// 情况1：first 和 second 都没选 → 遍历全部一级，取所有二级
		if (!first?.length && !second?.length) {
			candidateLevel2Menus = roleMenuTree
				.flatMap((level1) => level1.children ?? [])
				.filter(Boolean);
		}
		// 情况2：有 first 或 second → 按条件筛选二级菜单
		else {
			// 先根据 first 筛选一级菜单（若 first 为空，则用全部）
			const selectedLevel1 = first?.length
				? roleMenuTree.filter((menu) => first.includes(menu.id))
				: roleMenuTree;

			// 从选中的一级中提取所有二级菜单
			const allLevel2 = selectedLevel1.flatMap((menu) => menu.children ?? []).filter(Boolean);

			// 再根据 second 进一步筛选（若 second 为空，则保留全部）
			candidateLevel2Menus = second?.length
				? allLevel2.filter((menu) => second.includes(menu.id))
				: allLevel2;
		}

		// 从候选的二级菜单中，提取其 children（即三级菜单）
		// 并只保留那些自己还有 children 的三级项（即“非叶子”节点）
		return candidateLevel2Menus
			.flatMap((level2) => level2.children ?? [])
			.filter(Boolean)
			.filter((level3) => Array.isArray(level3.children) && level3.children.length > 0)
			.map(({ id, name }) => ({
				label: name,
				value: id,
			}));
	}, [roleMenuTree, first, second]);

	useEffect(() => {
		if (!userDetail || !roles) {
			return;
		}

		menuForm.resetFields();
		fetchRoleData();

		return () => {
			formRef.current?.setFieldValue("table", []);
		};
	}, [roles, userDetail]);

	useEffect(() => {
		const newSecond =
			second?.filter((e: number) => secondMenuOptions.find((r) => r.value === e)) || [];
		menuForm.setFieldValue("second", newSecond);
	}, [secondMenuOptions]);

	useEffect(() => {
		const newThird =
			third?.filter((e: number) => thirdMenuOptions.find((r) => r.value === e)) || [];
		menuForm.setFieldValue("third", newThird);
	}, [thirdMenuOptions]);

	// 计算高度（可用 useSize 或 window resize）
	useEffect(() => {
		function update() {
			const rect = containerRef.current?.getBoundingClientRect();
			if (rect) {
				const headerHeight = 40; // 表格头等占用高度，按需调整
				const footerReserve = 70; // 提交按钮 / 底部留白
				setTableScrollY(Math.max(200, rect.height - headerHeight - footerReserve));
			}
		}
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, []);
	return (
		<div className="flex h-full w-full flex-col">
			<ProForm
				form={menuForm}
				initialValues={{
					first: [],
					second: [],
					third: [],
				}}
				layout="inline"
				className="mb-4 w-full"
				submitter={false}
				colon={false}
			>
				<Row className="w-full">
					<Col span={6}>
						<ProForm.Item
							label="一级菜单"
							name="first"
							className="rounded border-[1px] border-[#DCDFE6] pl-4"
						>
							<Select
								allowClear
								showSearch={false}
								maxTagCount="responsive"
								mode="multiple"
								placeholder="请选择"
								variant="borderless"
								options={firstMenuOPtions}
							></Select>
						</ProForm.Item>
					</Col>
					<Col span={6}>
						<ProForm.Item
							label="二级菜单"
							name="second"
							className="rounded border-[1px] border-[#DCDFE6] pl-4"
						>
							<Select
								allowClear
								showSearch={false}
								maxTagCount="responsive"
								mode="multiple"
								placeholder="请选择"
								variant="borderless"
								options={secondMenuOptions}
							></Select>
						</ProForm.Item>
					</Col>
					<Col span={6}>
						<ProForm.Item
							label="三级菜单"
							name="third"
							className="rounded border-[1px] border-[#DCDFE6] pl-4"
						>
							<Select
								allowClear
								showSearch={false}
								maxTagCount="responsive"
								mode="multiple"
								placeholder="请选择"
								variant="borderless"
								options={thirdMenuOptions}
							></Select>
						</ProForm.Item>
					</Col>
					<Col span={6}>
						<div className="flex w-full justify-end gap-2">
							<Button type="primary" htmlType="submit" onClick={getTableByMenu}>
								查询
							</Button>
							<Button type="text" onClick={resetMenu}>
								重置
							</Button>
						</div>
					</Col>
				</Row>
			</ProForm>
			<div ref={containerRef} className="min-h-0 flex-1">
				<ProForm
					formRef={formRef}
					onFinish={async () => {
						getMenuIdList();
					}}
					submitter={{
						render: () =>
							userDetail?.account !== AdminUser.account ? (
								<div style={{ textAlign: "right" }}>
									<Button type="primary" htmlType="submit">
										保存
									</Button>
								</div>
							) : (
								<></>
							),
					}}
				>
					<EditableProTable
						scroll={{
							y: tableScrollY,
							x: "max-content",
						}}
						bordered
						editableFormRef={editorFormRef}
						name="table"
						rowKey="id"
						columns={getColumns() as any}
						recordCreatorProps={false}
					/>
				</ProForm>
			</div>
		</div>
	);
}

function ParentCheckbox(props: {
	value?: any;
	onChange?: any;
	parent: PermissionNode;
	num: number;
	record: any;
	menuData: MenuItem[];
	setMenuData: (menuData: MenuItem[]) => void;
}) {
	const { parent, menuData, setMenuData }: any = props;
	const { getFieldValue, setFieldsValue } = Form.useFormInstance();
	const src = getFieldValue("table") || [];
	const getStatus = (inheritsRole: boolean) => {
		return inheritsRole ? "checked" : "userChecked";
	};
	const handleChange = (e: any) => {
		const checked = e.target.checked;

		// 修改表格数据,将除开继承角色权限的子节点字段修改
		const newTable: any[] = src.map((row: any) => {
			if (row.parents.find((e: any) => e.id === parent.id && !row.inheritsRole)) {
				const nodes = row.nodes.map((e: any) => {
					return {
						...e,
						userChecked: checked,
					};
				});
				return { ...row, nodes };
			}
			return { ...row };
		});

		// 写回表单

		const newMenuData = menuData?.map((t: MenuItem) => {
			const newItemMenu = newTable.find((r) => r.id === t.id);
			if (newItemMenu) {
				return newItemMenu;
			} else {
				return t;
			}
		});
		setFieldsValue({ table: newTable });
		setMenuData(newMenuData);
	};

	const getIndeterminate = () => {
		const list = src.filter((row: any) => {
			return row.parents.find((e: any) => e.id === parent.id);
		});

		// 寻找选中的子节点
		const checkedList = list.filter((e: any) => {
			return e.nodes.find((b: any) => b[getStatus(!!e.inheritsRole)]);
		});
		// 寻找没有选中的子节点
		const notCheckedList = list.filter((e: any) => {
			return e.nodes.find((b: any) => !b[getStatus(!!e.inheritsRole)]);
		});

		return notCheckedList.length > 0 && checkedList.length !== 0;
	};

	const getIsChecked = () => {
		const list = src.filter((row: any) => {
			return row.parents.find((e: any) => e.id === parent.id);
		});

		// 寻找没有选中的子节点
		const notCheckedList = list.filter((e: any) => {
			return e.nodes.find((b: any) => !b[getStatus(!!e.inheritsRole)]);
		});
		return !notCheckedList.length;
	};
	const getDisable = () => {
		const list = src.filter((row: any) => {
			return row.parents.find((e: any) => e.id === parent.id);
		});
		const isDisable = list?.find((e: PermissionNode) => !e.inheritsRole);
		return !isDisable;
	};
	return (
		<Checkbox
			checked={getIsChecked()}
			indeterminate={getIndeterminate()}
			onChange={handleChange}
			disabled={getDisable()}
		>
			{parent?.name}
		</Checkbox>
	);
}

function NodeCheckbox(props: {
	value?: any;
	onChange?: any;
	parent: PermissionNode;
	record: any;
	menuData: MenuItem[];
	setMenuData: (menuData: MenuItem[]) => void;
}) {
	const { parent, record, menuData, setMenuData }: any = props;
	const { getFieldValue, setFieldsValue } = Form.useFormInstance();
	const src = getFieldValue("table") || [];
	const checkStatus = record.inheritsRole ? "checked" : "userChecked";

	const handleChange = (e: any) => {
		const checked = e.target.checked;
		// 将所有操作节点选中
		const newTable: any[] = src.map((row: any) => {
			if (row.parents.find((e: any) => e.id === parent.id)) {
				return {
					...row,
					nodes: row.nodes.map((p: any) => {
						return { ...p, [checkStatus]: checked };
					}),
				};
			} else {
				return row;
			}
		});

		const newMenuData = menuData?.map((t: MenuItem) => {
			const newItemMenu = newTable.find((r) => r.id === t.id);
			if (newItemMenu) {
				return newItemMenu;
			} else {
				return t;
			}
		});
		setFieldsValue({ table: newTable });

		setMenuData(newMenuData);
	};

	const getIndeterminate = () => {
		const checkedList = record.nodes.filter((e: any) => !!e?.[checkStatus]);
		return checkedList.length > 0 && checkedList.length < record.nodes.length;
	};

	const getIsChecked = () => {
		const checkedList = record.nodes.filter((e: any) => !!e?.[checkStatus]);
		const isChecked = checkedList.length > 0 && checkedList.length === record.nodes.length;
		return isChecked;
	};

	return (
		<Checkbox
			checked={getIsChecked()}
			indeterminate={getIndeterminate()}
			onChange={handleChange}
			disabled={record.inheritsRole || parent.name === "工作台"}
		>
			{parent?.name}
		</Checkbox>
	);
}
function OperaCheckbox(props: {
	items?: PermissionNode[];
	menuData: MenuItem[];
	setMenuData: (menuData: MenuItem[]) => void;
}) {
	const { items, menuData, setMenuData }: any = props;
	const { getFieldValue, setFieldsValue } = Form.useFormInstance();

	const src = getFieldValue("table") || [];
	const record = src?.find((e: any) => {
		return !!e.nodes?.find((b: any) => b.id === items?.[0].id);
	});
	const checkStatus = record.inheritsRole ? "checked" : "userChecked";

	const handleChange = (e: any, id: number) => {
		const isChecked = e.target.checked;
		const list = record?.nodes?.map((e: PermissionNode) => {
			return e.id === id ? { ...e, [checkStatus]: isChecked } : { ...e };
		});
		const newRecord = { ...record, nodes: [...list] };
		const newTable = src?.map((e: any) => {
			if (e.id === newRecord.id) {
				return newRecord;
			} else {
				return e;
			}
		});

		const newMenuData = menuData?.map((t: MenuItem) => {
			const newItemMenu = newTable.find((r: MenuItem) => r.id === t.id);
			if (newItemMenu) {
				return newItemMenu;
			} else {
				return t;
			}
		});
		setFieldsValue({ table: newTable });

		setMenuData(newMenuData);
	};

	const getChecked = (id: number) => {
		if (record.name === "工作台") {
			const list = record?.nodes?.map((e: PermissionNode) => {
				return e.id === id ? { ...e, [checkStatus]: true } : { ...e };
			});
			const newRecord = { ...record, nodes: [...list] };
			const newTable = src?.map((e: any) => {
				if (e.id === record.id) {
					return newRecord;
				} else {
					return e;
				}
			});
			setFieldsValue({ table: newTable });

			return true;
		} else {
			const isChecked = record?.nodes?.find((e: PermissionNode) => e.id === id)?.[
				checkStatus
			];
			return isChecked;
		}
	};

	return (
		<div className="flex gap-2">
			{items?.map(({ id, name }: PermissionNode) => (
				<Checkbox
					key={id}
					checked={getChecked(id)}
					onChange={(e: any) => handleChange(e, id)}
					disabled={record.inheritsRole || record.name === "工作台"}
				>
					{name}
				</Checkbox>
			))}
		</div>
	);
}

function InheritsRole({
	record,
	menuData,
	setMenuData,
}: {
	record: any;
	menuData: MenuItem[];
	setMenuData: (menuData: MenuItem[]) => void;
}) {
	const { getFieldValue, setFieldsValue } = Form.useFormInstance();
	const src = getFieldValue("table") || [];
	const dataPerm = getFieldValue("dataPerm") || [];
	const isWorkbench = record?.parents?.[0].name === "工作台";
	const value = !!src.find((row: any) => row.id === record.id).inheritsRole;
	const perm = dataPerm.find((e: any) => e.menuId === record.id);
	const handleChange = (e: any) => {
		const checked = e.target.value;
		const newTable: any[] = src.map((row: any) => {
			if (row.id === record.id) {
				return {
					...row,
					inheritsRole: checked,
					nodes: row.nodes?.map((e: any) => {
						return {
							...e,
							inheritsRole: checked,
							userChecked: !checked ? e.checked : e.userChecked, // 切换至不继承角色权限时，默认为继承角色权限选中状态
						};
					}),
				};
			} else {
				return row;
			}
		});

		const newMenuData = menuData?.map((t: MenuItem) => {
			const newItemMenu = newTable.find((r: MenuItem) => r.id === t.id);
			if (newItemMenu) {
				return newItemMenu;
			} else {
				return t;
			}
		});

		if (perm) {
			const newPermData = dataPerm?.map((e: any) => {
				if (e.menuId === record.id) {
					return {
						...e,
						inheritsRole: checked,
						menuDataPerm: checked ? e.menuDataPerm : e.inheritsRoleData?.menuDataPerm,
					};
				} else {
					return e;
				}
			});
			setFieldsValue({ dataPerm: newPermData });
		}
		setFieldsValue({ table: newTable });

		setMenuData(newMenuData);
	};
	return (
		<Radio.Group
			disabled={isWorkbench}
			value={value}
			onChange={handleChange}
			options={[
				{ value: true, label: "是" },
				{ value: false, label: "否" },
			]}
		/>
	);
}

function DataPermSelect({
	permKey,
	options,
	record,
	userId,
	permType,
}: {
	permKey: string;
	options: any[];
	record: MenuItem;
	userId: number;
	permType: string;
}) {
	const { getFieldValue, setFieldValue } = Form.useFormInstance();
	const dataPermList: any[] = getFieldValue("dataPerm") || [];
	const recorddataPerm: any | undefined = dataPermList?.find((e: any) => e.menuId === record.id);

	const handleChange = (keys: string[]) => {
		const newDataPermObj = {
			inheritsRole: false,
			menuDataPerm: { [permKey]: keys || [] },
			inheritsRoleData: recorddataPerm.inheritsRoleData || {},
		};

		const newPerm = {
			userId,
			menuId: record.id,
			...newDataPermObj,
		};

		const newDataPermList = [...dataPermList];
		const index = findIndex(newDataPermList, (o: any) => o.menuId === record.id);
		if (index !== -1) {
			// 找到了，替换
			newDataPermList[index] = newPerm;
		} else {
			// 没找到，添加
			newDataPermList.push(newPerm);
		}
		setFieldValue("dataPerm", [...newDataPermList]);
	};
	const getValue = () => {
		let menuDataPerm;

		if (record?.inheritsRole) {
			// 继承角色权限时，取继承的权限值
			menuDataPerm = recorddataPerm?.inheritsRoleData?.menuDataPerm || [];
		} else {
			menuDataPerm = recorddataPerm?.menuDataPerm;
		}
		const checkedList: string[] = menuDataPerm?.[permKey]?.filter((e: string) =>
			options?.find((b: any) => b.value === e),
		);

		return checkedList;
	};
	return (
		<div className="flex items-center">
			<div>{permType}</div>
			<div>
				<Select
					mode="multiple"
					allowClear
					disabled={record?.inheritsRole}
					style={{ width: 220, marginLeft: 10 }}
					placeholder="请选择"
					value={getValue()}
					onChange={handleChange}
					options={options}
				/>
			</div>
		</div>
	);
}
