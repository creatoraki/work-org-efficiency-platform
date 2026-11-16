import type { OrgState } from "#src/api/org-management/org-file";
import { fetchOrgTree } from "#src/api/org-management/org-file";
import { SearchOutlined } from "@ant-design/icons";
import { ConfigProvider, Input, theme, Tooltip, Tree } from "antd";
import { debounce } from "lodash-es";
import { useEffect, useMemo, useState } from "react";
import { useOrgStore } from "../store";

export const tabList = [
	{
		text: "全部",
		value: 1,
		bgColor: "#E4EFFF",
		textColor: "#0075FF",
	},
	{
		text: "在管",
		value: 2,
		bgColor: "#E4EFFF",
		textColor: "#0075FF",
	},
	{
		text: "计划交付",
		value: 3,
		bgColor: "#E3F7ED",
		textColor: "#14B968",
	},
	{
		text: "当拓当交",
		value: 4,
		bgColor: "#FFEFE0",
		textColor: "#FF7D00",
	},
	{
		text: "退出",
		value: 5,
		bgColor: "#EBEEF5",
		textColor: "#323233",
	},
];
// const MAX_MATCH_HIGHLIGHT = 1000; // 若匹配节点过多，放弃高亮并提示用户缩小范围
const MAX_EXPAND = 500; // 展开祖先数量上限
export default function OrgTree() {
	const [activeTab, setActiveTab] = useState(1);
	const [treeData, setTreeData] = useState<OrgState[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const { token } = theme.useToken();
	const { setOrg } = useOrgStore();
	const [inputText, setInputText] = useState("");
	const [searchValue, setSearchValue] = useState("");

	const handleSelect = (selectedKeys: React.Key[], info: any) => {
		if (selectedKeys.length > 0) {
			const selectedNode = info.node;
			setOrg(selectedNode);
			setSelectedKeys(selectedKeys);
		}
	};

	const handExpand = (expandedKeys: React.Key[]) => {
		setExpandedKeys(expandedKeys);
	};

	const getOrgTree = async () => {
		const { data } = await fetchOrgTree();
		setTreeData(data);
		setOrg(data?.[0]);
		setSelectedKeys([data[0].id]);
		setExpandedKeys([data[0].id]);
	};
	const getOrgStatusStyle = (status: string) => {
		const tab = tabList.find((t) => t.text === status);
		return {
			color: tab?.textColor,
			background: tab?.bgColor,
		};
	};
	const getWidth = (status: string, node: OrgState) => {
		if (status) {
			return 302 - 22 * node.layer - 12 * status?.length - 8;
		} else {
			return 302 - 22 * node.layer;
		}
	};
	// 预处理：构建扁平映射（按 id 和 orgFullName），用 useMemo 缓存，避免每次渲染重复计算
	const { codeMap, idMap } = useMemo(() => {
		const codeMap: Record<string, OrgState> = {};
		const idMap: Record<string, OrgState> = {};
		const traverse = (nodes: any[]) => {
			nodes.forEach((node) => {
				codeMap[node.id] = node;
				idMap[node.orgFullName] = node;
				if (node.children) traverse(node.children);
			});
		};
		traverse(treeData);
		return { codeMap, idMap };
	}, [treeData]);

	// 搜索----计算匹配集合与祖先集合，同时判断匹配是否过多
	const { matchedKeys, ancestorKeys } = useMemo(() => {
		const mk = new Set<string>();
		const ak = new Set<string>();
		const kw = (searchValue || "").toString().trim().toLowerCase();
		const status = tabList.find((t) => t.value === activeTab)?.text;

		// 匹配 deptName（大小写无关）
		Object.keys(codeMap).forEach((code) => {
			const n = codeMap[code];
			const name = String(n?.name || "");
			const matchStatus = status === "全部" ? true : n?.projOrgStatus === status;
			if (name.toLowerCase().includes(kw) && matchStatus) {
				mk.add(code);
			}
		});

		// 递归向上收集祖先（通过 parentId -> idMap）
		mk.forEach((code) => {
			const node = codeMap[code];
			let pId = (node && (node as any).parentId) as string | undefined;
			while (pId && idMap[pId]) {
				ak.add(String(idMap[pId].id));
				pId = idMap[pId].parentId;
			}
		});

		return { matchedKeys: mk, ancestorKeys: ak };
	}, [searchValue, activeTab, codeMap, idMap]);

	// 搜索时：只找匹配的节点（匹配名称或含有匹配子节点），并高亮匹配文本
	const filterTree = (data: OrgState[], keyword: string, mk: Set<string>): OrgState[] => {
		const kw = keyword.toLowerCase();
		const status = tabList.find((t) => t.value === activeTab)?.text;

		const buildFilteredTree = (nodes: any[]): OrgState[] => {
			const result: any[] = [];
			for (const node of nodes) {
				const code = node.id;
				const children = node.children ? buildFilteredTree(node.children) : [];
				const matchStatus = status === "全部" ? true : node?.projOrgStatus === status;

				const isMatched = mk.has(code);
				if ((isMatched && matchStatus) || children.length > 0) {
					// highlight
					const rawName = String(node.name || "");
					let title: any = <span>{rawName}</span>;
					if (isMatched) {
						const idx = rawName.toLowerCase().indexOf(kw);
						if (idx > -1) {
							const before = rawName.substring(0, idx);
							const match = rawName.substring(idx, idx + keyword.length);
							const after = rawName.substring(idx + keyword.length);
							title = (
								<span>
									{before}
									<span className="font-semibold text-blue-500">{match}</span>
									{after}
								</span>
							);
						}
					}

					result.push({ ...node, name: title as any, children });
				}
			}
			return result;
		};

		return buildFilteredTree(data);
	};

	// 搜索结果
	const searchData = useMemo(() => {
		const filtered =
			searchValue.trim() || activeTab !== 1
				? filterTree(treeData, searchValue, matchedKeys)
				: treeData;

		return filtered;
	}, [searchValue, activeTab, treeData, matchedKeys]);

	const renderTreeNode = (node: any) => {
		return (
			<div className="-ml-3 flex w-auto items-start justify-between gap-1">
				{node.projOrgStatus ? (
					<span
						className="whitespace-nowrap rounded px-1 text-xs"
						style={getOrgStatusStyle(node.projOrgStatus)}
					>
						{node.projOrgStatus}
					</span>
				) : (
					<></>
				)}
				<Tooltip
					placement="top"
					title={node.orgFullName?.split("|")?.reverse()?.[0] || "-"}
					getPopupContainer={(triggerNode: any) => triggerNode.parentNode}
				>
					<span
						className="block h-auto overflow-hidden text-ellipsis whitespace-nowrap"
						title=""
						style={{
							width: getWidth(node.projOrgStatus, node),
						}}
					>
						{node.name}
					</span>
				</Tooltip>
			</div>
		);
	};
	// 防抖：限制对 searchValue 的更新频率
	const debouncedSetSearch = useMemo(
		() => debounce((v: string) => setSearchValue(v), 300),
		[setSearchValue],
	);

	useEffect(() => {
		// 外部修改 searchValue（或清空）时，保持输入框同步（用定时器延迟以避免 lint/规则警告）
		const t = setTimeout(() => setInputText(searchValue));
		return () => clearTimeout(t);
	}, [searchValue]);

	useEffect(() => {
		return () => {
			debouncedSetSearch.cancel && debouncedSetSearch.cancel();
		};
	}, [debouncedSetSearch]);

	// 当进行搜索时，自动展开匹配的祖先路径，提升可见性
	useEffect(() => {
		if (!searchValue.trim()) {
			return;
		}
		// 若匹配过多则限制要展开的祖先数量，避免一次性展开太多节点
		const keysAll = Array.from(ancestorKeys || []);
		const keys = keysAll.length > MAX_EXPAND ? keysAll.slice(0, MAX_EXPAND) : keysAll;
		if (keys.length) {
			const t = setTimeout(() =>
				setExpandedKeys((prev) => Array.from(new Set([...prev, ...keys]))),
			);
			return () => clearTimeout(t);
		}
		return undefined;
	}, [searchValue, ancestorKeys]);

	useEffect(() => {
		getOrgTree();
	}, []);

	return (
		<div className="custom-scrollbar flex h-full min-h-0 w-full flex-col overflow-hidden p-4">
			<div className="custom-scrollbar mb-1 flex h-auto w-full items-center justify-between gap-2 overflow-x-auto pb-1">
				{tabList.map((item) => (
					<div
						className="md:xs flex cursor-pointer items-center justify-center whitespace-nowrap rounded border px-3 py-0.5 text-[10px] md:text-xs"
						key={item.text}
						style={{
							borderColor: activeTab === item.value ? "#0075FF" : "#E4E7ED",
							color: activeTab === item.value ? "#0075FF" : "#323233",
						}}
						onClick={() => setActiveTab(item.value)}
					>
						{item.text}
					</div>
				))}
			</div>

			<Input
				placeholder="支持模糊搜索"
				className="mb-2 flex-shrink-0"
				suffix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
				value={inputText}
				onChange={(e) => {
					const v = e.target.value;
					setInputText(v);
					if (!v) {
						// 立即生效清空并取消挂起的防抖
						debouncedSetSearch.cancel && debouncedSetSearch.cancel();
						setSearchValue("");
					} else {
						debouncedSetSearch(v);
					}
				}}
				allowClear
			/>
			<ConfigProvider
				theme={{
					components: {
						Tree: {
							nodeSelectedColor: token.blue,
							nodeSelectedBg: "transparent",
						},
					},
				}}
			>
				<div className="custom-scrollbar h-full min-h-0 w-full flex-1 overflow-y-auto">
					<Tree
						showLine
						virtual
						treeData={searchData}
						selectedKeys={selectedKeys}
						expandedKeys={expandedKeys}
						onSelect={handleSelect}
						onExpand={handExpand}
						titleRender={renderTreeNode}
						fieldNames={{ title: "name", key: "id" }}
					/>
				</div>
			</ConfigProvider>
		</div>
	);
}
