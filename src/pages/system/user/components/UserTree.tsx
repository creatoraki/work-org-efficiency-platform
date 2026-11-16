import type { UserTreeType } from "#src/api/system";
import { fetchUserDeptTree } from "#src/api/system";
import yellowConfirm from "#src/assets/svg/yellow-confirm.svg";
import { useUserStore } from "#src/store";
import { SearchOutlined } from "@ant-design/icons";
import { ConfigProvider, Input, theme, Tree } from "antd";
import { debounce } from "lodash-es";
import { useContext, useEffect, useMemo, useState } from "react";

interface UserTreeProps {
	// deptCode: number | undefined
	// setDeptCode: (deptCode: number | undefined) => void
	dept?: UserTreeType | null;
	setDept?: (dept: UserTreeType | null) => void;
	TreeDataContext: any;
}
interface DataNode {
	children: DataNode[];
	deptCode: string;
	deptId: number;
	deptName: any;
	parentId: number;
}
const MAX_MATCH_HIGHLIGHT = 1000; // 若匹配节点过多，放弃高亮并提示用户缩小范围
const MAX_EXPAND = 500; // 展开祖先数量上限
export default function UserTree(props: UserTreeProps) {
	const { dept, setDept, TreeDataContext } = props;
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const { treeData, setTreeData } = useContext<any>(TreeDataContext);
	const [searchValue, setSearchValue] = useState("");
	// 用于输入框的即时显示；真正触发搜索（更新 searchValue）使用防抖
	const [inputText, setInputText] = useState("");
	const { roles: userRoles } = useUserStore();

	const { token } = theme.useToken();

	const fetchData = async () => {
		const { data, code } = await fetchUserDeptTree();
		if (code === 200) {
			setTreeData(data);
			setExpandedKeys([data?.[0]?.deptCode]);
		}
	};
	const handleSelect = (keys: any, info: any) => {
		const { node } = info;
		if (setDept) {
			if (keys.length) {
				setDept(node);
			} else {
				setDept(null);
			}
		}
	};
	useEffect(() => {
		fetchData();
	}, []);

	const onExpand = (newExpandedKeys: string[]) => {
		setExpandedKeys(newExpandedKeys);
	};

	// 预处理：构建扁平映射（按 deptCode 和 deptId），用 useMemo 缓存，避免每次渲染重复计算
	const { codeMap, idMap } = useMemo(() => {
		const codeMap: Record<string, DataNode> = {};
		const idMap: Record<number, DataNode> = {};
		const traverse = (nodes: DataNode[]) => {
			nodes.forEach((node) => {
				codeMap[node.deptCode] = node;
				idMap[node.deptId] = node;
				if (node.children) traverse(node.children);
			});
		};
		traverse(treeData);
		return { codeMap, idMap };
	}, [treeData]);

	// 计算匹配集合与祖先集合，同时判断匹配是否过多
	const { matchedKeys, ancestorKeys, tooManyMatches } = useMemo(() => {
		const mk = new Set<string>();
		const ak = new Set<string>();
		let tooMany = false;
		const kw = (searchValue || "").toString().trim().toLowerCase();
		if (!kw) {
			return { matchedKeys: mk, ancestorKeys: ak, tooManyMatches: tooMany };
		}

		// 匹配 deptName（大小写无关）
		Object.keys(codeMap).forEach((code) => {
			const n = codeMap[code];
			const name = String(n?.deptName || "");
			if (name.toLowerCase().includes(kw)) {
				mk.add(code);
			}
		});

		// 如果匹配过多，设置标志并提前返回，避免昂贵的祖先计算与高亮树构建
		if (mk.size > MAX_MATCH_HIGHLIGHT) {
			tooMany = true;
			return { matchedKeys: mk, ancestorKeys: ak, tooManyMatches: tooMany };
		}

		// 递归向上收集祖先（通过 parentId -> idMap）
		mk.forEach((code) => {
			const node = codeMap[code];
			let pId = (node && (node as any).parentId) as number | undefined;
			while (pId && idMap[pId]) {
				ak.add(String(idMap[pId].deptCode));
				pId = idMap[pId].parentId;
			}
		});

		return { matchedKeys: mk, ancestorKeys: ak, tooManyMatches: tooMany };
	}, [searchValue, codeMap, idMap]);

	// 搜索时：只找匹配的节点（匹配名称或含有匹配子节点），并高亮匹配文本
	const filterTree = (data: DataNode[], keyword: string, mk: Set<string>): DataNode[] => {
		if (!keyword.trim()) return data;
		const kw = keyword.toLowerCase();

		const buildFilteredTree = (nodes: DataNode[]): DataNode[] => {
			const result: DataNode[] = [];
			for (const node of nodes) {
				const code = node.deptCode;
				const children = node.children ? buildFilteredTree(node.children) : [];
				const isMatched = mk.has(code);
				if (isMatched || children.length > 0) {
					// highlight
					const rawName = String(node.deptName || "");
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

					result.push({ ...node, deptName: title as any, children });
				}
			}
			return result;
		};

		return buildFilteredTree(data);
	};

	const searchData = useMemo(() => {
		// 当匹配过多时，避免构建高亮树，直接返回原始 treeData 并提示用户
		if (searchValue.trim() && tooManyMatches) {
			return treeData;
		}
		const filtered = searchValue.trim()
			? filterTree(treeData, searchValue, matchedKeys)
			: treeData;
		const adminRole = userRoles?.find((e) => e.roleKey === "admin" || e === "admin");
		if (adminRole) {
			return [
				...filtered,
				{ deptName: "系统用户", deptCode: "-1", deptId: -1, parentId: 0 } as any,
			];
		}
		return filtered;
	}, [searchValue, treeData, userRoles, matchedKeys]);

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
	}, [searchValue, ancestorKeys, tooManyMatches]);

	return (
		<div className="h-full p-4">
			<Input
				placeholder="搜索名称"
				className="mb-2"
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
			{searchValue.trim() && tooManyMatches ? (
				<div className="my-2 text-[#ff7d00]">
					<img src={yellowConfirm} alt="" className="mb-1 mr-1 h-3 w-3" />
					<span>匹配结果过多（</span>
					<span className="font-semibold">{matchedKeys.size}</span>
					<span>），请缩小搜索范围</span>
				</div>
			) : null}
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
					className={`${
						searchValue.trim() && tooManyMatches
							? "h-[calc(100%_-_76px_-_1.5rem)]"
							: "h-[calc(100%_-_32px_-_0.5rem)]"
					} overflow-y-auto`}
					fieldNames={{ title: "deptName", key: "deptCode", children: "children" }}
					treeData={searchData as any}
					blockNode
					selectedKeys={dept ? [dept.deptCode] : []}
					onExpand={onExpand as any}
					onSelect={handleSelect}
					expandedKeys={expandedKeys}
					virtual
				/>
			</ConfigProvider>
		</div>
	);
}
