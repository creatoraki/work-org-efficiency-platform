import type { AddRoleTreeType, RoleDeptList } from "#src/api/system";
import {
	fetchAddRoleTreeItem,
	fetchDeleteRoleTreeItem,
	fetchEditRoleTreeItem,
	fetchRoleCategory,
	fetchRoleList,
} from "#src/api/system";
import { confirm } from "#src/components/custom-confirm";
import {
	DeleteOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	PlusOutlined,
	SearchOutlined,
} from "@ant-design/icons";
import { Cascader, ConfigProvider, Form, Input, message, Modal, theme, Tooltip, Tree } from "antd";
import { debounce } from "lodash-es";
import { useContext, useEffect, useMemo, useState } from "react";
import { RoleContext } from "../index";

interface RoleTreeProps {
	roleCategoryId: number | undefined;
	setRoleCategoryId: (roleCategoryId: number | undefined) => void;
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
export default function Roletree(props: RoleTreeProps) {
	const { setRoleCategoryId } = props;
	const [openModal, setOpenModal] = useState(false);
	const [isAdd, setIsAdd] = useState(false);
	const [isDelete, setIsDelete] = useState(false);
	const [treeData, setTreeData] = useState<any>([]);
	const [category, setCategory] = useState<RoleDeptList | null>(null);
	const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
	const [hoverNode, sethoverNode] = useState<number | null>();
	const [inputText, setInputText] = useState("");
	const [searchValue, setSearchValue] = useState("");
	const { update } = useContext<any>(RoleContext);
	const [messageApi, contextHolder] = message.useMessage();

	const { token } = theme.useToken();

	const [addForm] = Form.useForm();

	const getRoleCategory = async () => {
		const { data }: any = await fetchRoleCategory();
		if (data) {
			setTreeData([{ id: 0, name: "全部", children: data }]);
			if (!expandedKeys?.length) {
				setExpandedKeys([0]);
			}
		}
	};

	// 防抖更新搜索值
	const debouncedSetSearch = useMemo(() => debounce((v: string) => setSearchValue(v), 300), []);

	useEffect(() => {
		return () => debouncedSetSearch.cancel && debouncedSetSearch.cancel();
	}, [debouncedSetSearch]);

	const handleSelect = (keys: any) => {
		setRoleCategoryId(keys?.[0]);
	};

	// 递归获取所有父节点
	function getAllParentNodes(tree: any, targetId: any) {
		// eslint-disable-next-line prefer-const
		for (let node of tree) {
			if (node.id === targetId) {
				return [node].filter((v) => v.id !== targetId);
			}
			if (node.children?.length > 0) {
				const result: any = getAllParentNodes(node.children, targetId);
				if (result) return result.concat(node).filter((v: any) => v.id !== targetId);
			}
		}
	}

	// 无法删除文件夹对话框
	const cannotDeleteConfirm = (num: number) => {
		confirm({
			icon: <ExclamationCircleOutlined style={{ color: "#0075FF" }} />,
			title: "无法删除文件夹",
			content: (
				<div style={{ color: token.colorTextTertiary }}>
					该文件夹或其子文件夹中存在
					{num}
					个角色，请先移出所有角色后再进行删除
				</div>
			),
			centered: true,
			onOk() {
				setIsDelete(false);
			},
			onCancel() {
				setIsDelete(false);
			},
		});
	};
	// 删除确认框
	const handleDeleteConfirm = (id: number) => {
		confirm({
			icon: "yellow",
			title: "请确认是否删除",
			content: <div>删除后，该文件夹包含的子节点将一并删除</div>,
			centered: true,
			onOk: async () => {
				const { data: roleData } = await fetchRoleList({
					pageSize: 10,
					pageNum: 1,
					roleCategoryId: id,
				});
				if (roleData?.total) {
					cannotDeleteConfirm(roleData?.total);
				} else {
					const { code } = await fetchDeleteRoleTreeItem(id);
					if (code === 200) {
						messageApi.success("删除成功");
						update();
						getRoleCategory();
					} else {
						// messageApi.error("删除失败");
					}
					sethoverNode(null);
					setCategory(null);
				}
				setIsDelete(false);
			},
			onCancel() {
				setIsDelete(false);
				sethoverNode(null);
				setCategory(null);
			},
		});
	};

	// 新增/编辑确认框
	const handleAddConfirm = () => {
		addForm.submit();
		addForm
			.validateFields({ validateOnly: true })
			.then(async () => {
				const param = {
					categoryName: addForm.getFieldsValue().categoryName,
					parentId: addForm.getFieldsValue().parentId?.reverse()?.[0],
					...(category ? { id: category.id } : {}),
				};
				const { code } = !isAdd
					? await fetchEditRoleTreeItem(param as AddRoleTreeType)
					: await fetchAddRoleTreeItem(param as AddRoleTreeType);
				if (code === 200) {
					messageApi.success(!isAdd ? "编辑成功" : "新增成功");
					getRoleCategory();
					if (isAdd && category) {
						setExpandedKeys([...expandedKeys, category.id]);
					}
				} else {
					// messageApi.error(!isAdd ? "编辑失败" : "新增失败");
				}
				addForm.resetFields();
				setCategory(null);
				sethoverNode(null);
				setIsAdd(false);
				setOpenModal(false);
			})
			.catch((err) => {
				console.error("表单校验失败:", err);
			});
	};
	// 编辑节点
	const handleEdit = (nodeData: RoleDeptList) => {
		setCategory(nodeData);
		setOpenModal(true);
		const list = getAllParentNodes(treeData, nodeData.id)
			?.map((item: any) => item.id)
			?.reverse();

		addForm.setFieldsValue({
			categoryName: nodeData.name,
			parentId: list,
		});
	};

	// 删除节点
	const handleDelete = (nodeData: RoleDeptList) => {
		handleDeleteConfirm(nodeData.id);
		setCategory(nodeData);
		setIsDelete(true);
	};

	// 新增节点
	const handleAdd = (nodeData: RoleDeptList) => {
		sethoverNode(nodeData.id);
		setCategory(nodeData);
		setOpenModal(true);
		setIsAdd(true);
		const list = getAllParentNodes(treeData, nodeData.id)
			?.map((item: any) => item.id)
			?.reverse();
		addForm.setFieldsValue({
			categoryName: "",
			parentId: [...list, nodeData.id],
		});
	};

	const onExpand = (newExpandedKeys: number[]) => {
		setExpandedKeys(newExpandedKeys);
	};

	const renderTreeNode = (nodeData: RoleDeptList) => {
		// 高亮匹配文本
		const renderNameWithHighlight = (name: string) => {
			if (!searchValue) return <span>{name}</span>;
			const idx = name.toLowerCase().indexOf(searchValue.toLowerCase());
			if (idx === -1) return <span>{name}</span>;
			const before = name.substring(0, idx);
			const match = name.substring(idx, idx + searchValue.length);
			const after = name.substring(idx + searchValue.length);
			return (
				<span>
					{before}
					<span className="font-semibold text-blue-500">{match}</span>
					{after}
				</span>
			);
		};
		return (
			<div
				className="w-100% flex justify-between"
				onMouseEnter={() => sethoverNode(nodeData.id)}
				onMouseLeave={() => !category && sethoverNode(null)}
			>
				<span>{renderNameWithHighlight(nodeData.name)}</span>
				{hoverNode === nodeData.id ? (
					<div className="flex gap-2">
						<IconRenderState
							title="新增子级"
							onClick={() => handleAdd(nodeData)}
							clickState={isAdd && category?.id === nodeData.id && openModal}
						>
							<PlusOutlined />
						</IconRenderState>
						{nodeData.id !== 0 ? (
							<>
								<IconRenderState
									title="编辑"
									onClick={() => handleEdit(nodeData)}
									clickState={!isAdd && category?.id === nodeData.id && openModal}
								>
									<EditOutlined />
								</IconRenderState>

								<IconRenderState
									title="删除"
									onClick={() => handleDelete(nodeData)}
									clickState={isDelete && category?.id === nodeData.id}
								>
									<DeleteOutlined />
								</IconRenderState>
							</>
						) : (
							<></>
						)}
					</div>
				) : (
					<></>
				)}
			</div>
		);
	};

	function hasNodeWithName(tree: any[], targetName: string) {
		if (!Array.isArray(tree)) return false;

		for (const node of tree) {
			if (node.name === targetName) {
				return true;
			}
			if (node.children && hasNodeWithName(node.children, targetName)) {
				return true;
			}
		}
		return false;
	}

	// 计算匹配节点及其祖先集合，用于高亮和自动展开
	const { ancestorIds } = useMemo(() => {
		const mk = new Set<number>();
		const ak = new Set<number>();
		const kw = (searchValue || "").toString().trim().toLowerCase();
		if (!kw) {
			return { matchedIds: mk, ancestorIds: ak };
		}

		const traverse = (nodes: any[]) => {
			for (const n of nodes) {
				const name = (n.name || "").toString();
				if (name.toLowerCase().includes(kw)) {
					mk.add(n.id);
					const parents = getAllParentNodes(treeData, n.id) || [];
					parents.forEach((p: any) => ak.add(p.id));
				}
				if (n.children) {
					traverse(n.children);
				}
			}
		};
		traverse(treeData);
		return { matchedIds: mk, ancestorIds: ak };
	}, [searchValue, treeData]);

	// 根据搜索值自动展开祖先节点；搜索为空时回到根展开
	useEffect(() => {
		let timer: any;
		if (!searchValue.trim()) {
			// 延迟执行 setState，避免同步在 effect 中触发额外规则警告
			timer = setTimeout(() => setExpandedKeys([0]));
			return () => clearTimeout(timer);
		}
		const keys = Array.from(ancestorIds);
		if (keys.length) {
			timer = setTimeout(() =>
				setExpandedKeys((prev) => Array.from(new Set([...prev, ...keys]))),
			);
		}
		return () => clearTimeout(timer);
	}, [searchValue, ancestorIds]);

	useEffect(() => {
		getRoleCategory();
	}, []);
	return (
		<div className="h-full p-4">
			{contextHolder}
			<Input
				allowClear
				placeholder="搜索名称"
				value={inputText}
				onChange={(e) => {
					const v = e.target.value;
					setInputText(v);
					if (!v) {
						debouncedSetSearch.cancel && debouncedSetSearch.cancel();
						setSearchValue("");
					} else {
						debouncedSetSearch(v);
					}
				}}
				suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
			/>
			<ConfigProvider
				theme={{
					components: {
						Tree: {
							nodeSelectedColor: token.blue,
						},
					},
				}}
			>
				<Tree
					className="mt-2 h-[calc(100%_-_32px_-_0.5rem)] overflow-y-auto"
					fieldNames={{ title: "name", key: "id", children: "children" }}
					titleRender={renderTreeNode as any}
					treeData={treeData}
					expandedKeys={expandedKeys}
					blockNode
					onSelect={handleSelect}
					onExpand={onExpand as any}
				/>
			</ConfigProvider>
			<Modal
				title={isAdd ? "新增" : "编辑"}
				centered
				open={openModal}
				onOk={handleAddConfirm}
				onCancel={() => {
					setOpenModal(false);
					setIsAdd(false);
					setCategory(null);
					sethoverNode(null);
				}}
			>
				<Form style={{ maxWidth: 400 }} form={addForm} {...formItemLayout} colon={false}>
					<Form.Item
						label="文件夹名称"
						name="categoryName"
						rules={[
							{
								required: true,
							},
							({ getFieldValue }) => ({
								validator(_, value) {
									// 否与已有的文件夹名称重复
									const isNameRepeat = hasNodeWithName(
										treeData,
										getFieldValue("categoryName"),
									);
									if (!value || !isNameRepeat) {
										return Promise.resolve();
									}
									return Promise.reject(new Error("该文件夹名称已存在"));
								},
							}),
						]}
					>
						<Input placeholder="请输入"></Input>
					</Form.Item>
					<Form.Item
						label="上级目录"
						name="parentId"
						rules={[{ required: true, message: "请选择上级目录" }]}
						className="mb-0"
					>
						<Cascader
							fieldNames={{ label: "name", value: "id", children: "children" }}
							placeholder="请选择"
							options={treeData}
							changeOnSelect
						></Cascader>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}

function IconRenderState(props: {
	onClick: () => void;
	clickState: boolean;
	title: string;
	children: any;
}) {
	const { token } = theme.useToken();
	const [isHovered, setIsHovered] = useState(false);
	const { onClick, clickState, title, children } = props;

	const handleClick = (e: any) => {
		e.stopPropagation();
		onClick();
	};

	return (
		<Tooltip placement="top" title={title}>
			<div
				onClick={handleClick}
				style={{
					color: clickState
						? token.blue
						: isHovered
							? token.blue3
							: token.colorTextTertiary,
				}}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{children}
			</div>
		</Tooltip>
	);
}
