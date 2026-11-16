import type { BusinessTagTreeNode, TagWeightItem } from "../types";
import {
	convertUserTagTreeToBusinessTagTree,
	fetchUserTagTree,
} from "#src/api/tag-management/tag-matching/model";
import emptyStateImg from "#src/assets/svg/empty-data.svg";
import { InfoCircleIcon, SearchIcon } from "#src/icons";
import { useRequest } from "ahooks";
import {
	Checkbox,
	Descriptions,
	Empty,
	Input,
	InputNumber,
	Select,
	Slider,
	Spin,
	Tooltip,
	Tree,
} from "antd";
import axios from "axios";
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TagList from "./TagList";

interface TagWeightConfigProps {
	/** 标签权重配置列表 */
	value?: TagWeightItem[];
	/** 变更回调 */
	onChange?: (items: TagWeightItem[]) => void;
	/** 是否只读 */
	readonly?: boolean;
}

const DEFAULT_TAG_WEIGHT_ITEMS: TagWeightItem[] = [];

/**
 * 差异化标签权重配置组件
 *
 * @param props - 组件属性
 * @param props.value - 标签权重配置列表
 * @param props.onChange - 变更回调
 * @param props.readonly - 是否只读
 */
export default function TagWeightConfig({
	value = DEFAULT_TAG_WEIGHT_ITEMS,
	onChange,
	readonly = false,
}: TagWeightConfigProps) {
	const tagWeights = value;

	const [treeData, setTreeData] = useState<BusinessTagTreeNode[]>([]);
	const [selectedTagIds, setSelectedTagIds] = useState<React.Key[]>([]);
	const [tagWeightsState, setTagWeightsState] = useState<TagWeightItem[]>(value);
	const [searchValue, setSearchValue] = useState<string>("");
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
	const nodeMapRef = useRef<Map<string, BusinessTagTreeNode>>(new Map());

	const { loading, run: fetchTree } = useRequest(
		async () => {
			const result = await fetchUserTagTree(undefined, true);
			const convertedData = convertUserTagTreeToBusinessTagTree(result || []);
			setTreeData(convertedData);
			return convertedData;
		},
		{
			manual: true,
			onError: (error) => {
				if (axios.isCancel(error)) {
					return;
				}
				console.error("获取业务类型/标签树失败:", error);
			},
		},
	);

	useEffect(() => {
		if (readonly) {
			return;
		}
		const loadTree = async () => {
			try {
				await fetchTree();
			} catch {
				// 取消请求和已在 useRequest 中处理过的异常，这里不再二次抛出到控制台
			}
		};
		void loadTree();
	}, [fetchTree, readonly]);

	// 同步外部传入的 value 到内部状态
	// 注意：selectedTagIds 可能包含父节点，但我们只根据 value 同步 tags 节点
	// 父节点的选中状态由用户操作维护，不会因为 value 变化而丢失
	useEffect(() => {
		setTagWeightsState((prev) => {
			if (
				prev.length === value.length &&
				prev.every((item, index) => item.id === value[index]?.id)
			) {
				return prev;
			}
			return value;
		});
		// value 为空数组时，清空所有选中状态
		if (value.length === 0) {
			setSelectedTagIds([]);
			return;
		}
		// 只同步 tags 节点（因为 value 只包含 tags 节点）
		const tagNodeIds = value.map((item) => item.tagId) as React.Key[];
		// 保留当前已选中的父节点（isTag 不为 true 的节点），只更新 tags 节点
		setSelectedTagIds((prev) => {
			// 找出当前选中的父节点（isTag 不为 true 的节点）
			const parentNodes = prev.filter((id) => {
				const node = nodeMapRef.current.get(String(id));
				return node && node.isTag !== true;
			});
			// 合并父节点和新的 tags 节点
			const merged = [...parentNodes, ...tagNodeIds];
			const mergedSet = new Set(merged);
			const mergedArray = Array.from(mergedSet);

			// tags 节点部分相同且父节点没有变化时，不更新（性能优化）
			const prevTagNodes = prev.filter((id) => {
				const node = nodeMapRef.current.get(String(id));
				return node && node.isTag === true;
			});
			if (
				prevTagNodes.length === tagNodeIds.length &&
				prevTagNodes.every((id, index) => id === tagNodeIds[index]) &&
				parentNodes.length === mergedArray.length - tagNodeIds.length
			) {
				return prev;
			}
			return mergedArray;
		});
	}, [value]);

	// 构建节点映射表，用于快速查找节点
	useMemo(() => {
		const map = new Map<string, BusinessTagTreeNode>();
		const buildMap = (nodes: BusinessTagTreeNode[]) => {
			nodes.forEach((node) => {
				map.set(node.id, node);
				if (node.children?.length) {
					buildMap(node.children);
				}
			});
		};
		buildMap(treeData);
		nodeMapRef.current = map;
	}, [treeData]);

	// 搜索算法：单次遍历同时完成过滤和收集展开 keys（性能优化）
	const { filteredTreeData, matchedKeys } = useMemo(() => {
		if (!searchValue?.trim()) {
			return { filteredTreeData: treeData, matchedKeys: [] };
		}

		const searchLower = searchValue.toLowerCase().trim();
		const matchedKeySet = new Set<React.Key>();

		const filterTree = (
			nodes: BusinessTagTreeNode[],
			parentKeys: React.Key[] = [],
		): BusinessTagTreeNode[] => {
			const result: BusinessTagTreeNode[] = [];

			for (const node of nodes) {
				const label = String(node.label || "");
				const matchesTitle = label.toLowerCase().includes(searchLower);
				const currentPath = [...parentKeys, node.id];

				const filteredChildren = node.children?.length
					? filterTree(node.children, currentPath)
					: [];

				const hasMatchingChildren = filteredChildren.length > 0;
				const shouldKeep = matchesTitle || hasMatchingChildren;

				if (shouldKeep) {
					// 当前节点匹配时，展开所有父节点路径
					if (matchesTitle) {
						parentKeys.forEach((key) => matchedKeySet.add(key));
						matchedKeySet.add(node.id);
					}

					// 有匹配的子节点时，当前节点需要展开以显示子节点
					if (hasMatchingChildren) {
						matchedKeySet.add(node.id);
					}

					result.push({
						...node,
						children: hasMatchingChildren ? filteredChildren : node.children,
					});
				}
			}

			return result;
		};

		return {
			filteredTreeData: filterTree(treeData),
			matchedKeys: Array.from(matchedKeySet),
		};
	}, [treeData, searchValue]);

	// 计算需要展开的节点路径（用于选中节点时自动展开）
	const expandSelectedPaths = useMemo(() => {
		if (!selectedTagIds.length || !treeData.length) {
			return [];
		}

		const expanded: React.Key[] = [];
		/**
		 * 查找目标节点的父节点路径
		 *
		 * @param targetId - 目标节点ID
		 * @param nodes - 节点数组
		 * @param path - 当前路径
		 * @returns 父节点路径（不包括目标节点本身），未找到返回 null
		 */
		const findParentPath = (
			targetId: string,
			nodes: BusinessTagTreeNode[],
			path: React.Key[] = [],
		): React.Key[] | null => {
			for (const node of nodes) {
				const currentPath = [...path, node.id];
				if (node.id === targetId) {
					// 找到目标节点，返回路径（不包括目标节点本身）
					return path;
				}
				if (node.children?.length) {
					const found = findParentPath(targetId, node.children, currentPath);
					if (found !== null) {
						return found;
					}
				}
			}
			return null;
		};

		selectedTagIds.forEach((id) => {
			const path = findParentPath(String(id), treeData);
			if (path) {
				expanded.push(...path);
			}
		});

		return Array.from(new Set(expanded));
	}, [selectedTagIds, treeData]);

	// 搜索时自动展开匹配的节点，否则展开选中节点的路径
	useEffect(() => {
		if (searchValue && matchedKeys.length > 0) {
			// 搜索模式：展开匹配的节点
			setExpandedKeys((prev) => {
				if (
					prev.length === matchedKeys.length &&
					prev.every((key, index) => key === matchedKeys[index])
				) {
					return prev;
				}
				return matchedKeys;
			});
		} else if (expandSelectedPaths.length > 0) {
			// 非搜索模式：展开选中节点的路径
			setExpandedKeys((prev) => {
				if (
					prev.length === expandSelectedPaths.length &&
					prev.every((key, index) => key === expandSelectedPaths[index])
				) {
					return prev;
				}
				return expandSelectedPaths;
			});
		}
	}, [searchValue, matchedKeys, expandSelectedPaths]);

	/**
	 * 递归查找节点下的所有 tags 节点（isTag: true）
	 *
	 * @param nodeId - 节点ID
	 * @returns tags 节点ID数组
	 */
	const findTagNodes = useCallback((nodeId: React.Key): React.Key[] => {
		const node = nodeMapRef.current.get(String(nodeId));
		if (!node) {
			return [];
		}

		// 当前节点就是 tags 节点时，直接返回
		if (node.isTag === true) {
			return [nodeId];
		}

		// 递归查找所有子节点中的 tags 节点
		const tagNodes: React.Key[] = [];
		if (node.children && node.children.length > 0) {
			for (const child of node.children) {
				tagNodes.push(...findTagNodes(child.id));
			}
		}

		return tagNodes;
	}, []);

	/**
	 * 处理树复选框变化
	 * 点击节点时，找到它下面的所有 tags 节点放到右侧
	 * 如果点击的就是 tags 节点，直接选中放到右侧
	 *
	 * @param checkedKeys - 选中的节点 keys
	 */
	const handleTreeCheck = useCallback(
		(checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
			const checked = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked;

			// 更新所有选中节点的状态（用于树组件的显示）
			setSelectedTagIds(checked);

			// 从所有选中的节点中，找到所有 tags 节点
			const allTagNodeKeys = new Set<React.Key>();
			for (const key of checked) {
				const tagNodes = findTagNodes(key);
				tagNodes.forEach((tagKey) => allTagNodeKeys.add(tagKey));
			}

			const tagNodeKeys = Array.from(allTagNodeKeys);

			// 获取当前已存在的 tagId 集合
			const existingTagIdsSet = new Set(tagWeightsState.map((item) => item.tagId));

			// 计算需要新增和移除的 tags
			const tagIdsToAdd = tagNodeKeys.filter((key) => !existingTagIdsSet.has(String(key)));
			const tagIdsToRemove = Array.from(existingTagIdsSet).filter(
				(tagId) => !tagNodeKeys.some((key) => String(key) === tagId),
			);

			// 移除不需要的 tags
			const keptItems = tagWeightsState.filter(
				(item) => !tagIdsToRemove.includes(item.tagId),
			);

			// 添加新的 tags
			const newTagItems: TagWeightItem[] = [];
			let orderIndex = keptItems.length;
			for (const key of tagIdsToAdd) {
				const keyStr = String(key);
				const node = nodeMapRef.current.get(keyStr);
				if (node) {
					newTagItems.push({
						id: `tag-weight-${Date.now()}-${orderIndex}`,
						tagId: keyStr,
						tagName: node.label || keyStr,
						weight: 30,
						isVeto: false,
						order: orderIndex++,
					});
				}
			}

			// 构建最终的权重配置列表
			const updated = [...keptItems, ...newTagItems];

			setTagWeightsState(updated);
			onChange?.(updated);
		},
		[tagWeightsState, onChange, findTagNodes],
	);

	// 计算权重总和（排除一票否决项）
	const totalWeight = useMemo(() => {
		return tagWeightsState.reduce((sum, item) => sum + (item.isVeto ? 0 : item.weight), 0);
	}, [tagWeightsState]);

	/**
	 * 更新标签权重
	 *
	 * @param id - 标签权重项ID
	 * @param weight - 权重值（0-100）
	 */
	const handleWeightChange = useCallback(
		(id: string, weight: number) => {
			const clampedWeight = Math.max(0, Math.min(100, weight));
			const updated = tagWeightsState.map((item) =>
				item.id === id ? { ...item, weight: clampedWeight } : item,
			);
			setTagWeightsState(updated);
			onChange?.(updated);
		},
		[tagWeightsState, onChange],
	);

	/**
	 * 切换一票否决状态
	 *
	 * @param id - 标签权重项ID
	 * @param isVeto - 是否一票否决
	 */
	const handleVetoChange = useCallback(
		(id: string, isVeto: boolean) => {
			const updated = tagWeightsState.map((item) =>
				item.id === id
					? {
							...item,
							isVeto,
							// 一票否决时权重设为 100，否则恢复为 30
							weight: isVeto ? 100 : 30,
							// 取消一票否决时，清空一票否决标签值
							vetoTagValue: isVeto ? item.vetoTagValue : undefined,
						}
					: item,
			);
			setTagWeightsState(updated);
			onChange?.(updated);
		},
		[tagWeightsState, onChange],
	);

	/**
	 * 更新一票否决标签值
	 *
	 * @param id - 标签权重项ID
	 * @param vetoTagValue - 一票否决标签值（逗号分隔的字符串）
	 */
	const handleVetoTagValueChange = useCallback(
		(id: string, vetoTagValue: string) => {
			const updated = tagWeightsState.map((item) =>
				item.id === id ? { ...item, vetoTagValue } : item,
			);
			setTagWeightsState(updated);
			onChange?.(updated);
		},
		[tagWeightsState, onChange],
	);

	if (readonly) {
		const vetoItems: TagWeightItem[] = [];
		const weightedItems: TagWeightItem[] = [];
		tagWeights.forEach((item) => {
			if (item.isVeto) {
				vetoItems.push(item);
			} else {
				weightedItems.push(item);
			}
		});

		if (tagWeights.length === 0) {
			return (
				<div className="flex items-center justify-center py-8">
					<Empty
						image={emptyStateImg}
						description={
							<span className="text-sm" style={{ color: "#909399" }}>
								暂无标签权重配置
							</span>
						}
					/>
				</div>
			);
		}

		return (
			<div className="rounded border border-[#EBEEF5] p-4">
				<Descriptions
					column={1}
					colon={false}
					styles={{
						label: {
							width: "100px",
							textAlign: "right",
							display: "flex",
							justifyContent: "flex-end",
						},
					}}
					items={[
						...(vetoItems.length > 0
							? [
									{
										label: "一票否决权",
										children: (
											<TagList
												tags={vetoItems.map((item) => item.tagName)}
												tagClassName="text-xs px-2 py-0.5 rounded bg-[#EBEEF5] text-[#323233]"
												gap={8}
												maxRows={2}
												overflowMode="popover"
												popover={{
													trigger: "hover",
													title: "一票否决权",
												}}
											/>
										),
									},
								]
							: []),
						...(weightedItems.length > 0
							? [
									{
										label: "加权逻辑",
										children: (
											<div className="flex flex-wrap items-center gap-2">
												{weightedItems.map((item, index) => (
													<Fragment key={item.id}>
														<span className="flex-shrink-0 rounded bg-[#EBEEF5] px-2 text-xs text-[#323233]">
															{item.tagName}
															{item.weight}%
														</span>
														{index < weightedItems.length - 1 && (
															<span className="text-sm text-gray-700">
																+
															</span>
														)}
													</Fragment>
												))}
												<span className="text-sm text-gray-700">
													= 100%
												</span>
											</div>
										),
									},
								]
							: []),
					]}
				/>
			</div>
		);
	}

	return (
		<div className="flex h-[40vh] min-h-[442px] rounded border border-[#EBEEF5]">
			<div className="flex w-2/5 flex-col p-3">
				<div className="flex min-h-0 flex-1 flex-col">
					<Input
						placeholder="搜索业务类型/标签"
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
						allowClear
						disabled={readonly}
						className="mb-3"
						suffix={<SearchIcon className="text-[#909399]" />}
					/>
					<div className="relative flex-1 overflow-auto">
						{loading ? (
							<div className="absolute inset-0 flex items-center justify-center">
								<Spin tip="加载中..." />
							</div>
						) : filteredTreeData.length > 0 ? (
							<Tree
								checkable={true}
								checkStrictly={true}
								checkedKeys={selectedTagIds}
								onCheck={handleTreeCheck}
								treeData={filteredTreeData as any}
								disabled={readonly}
								expandedKeys={expandedKeys}
								onExpand={setExpandedKeys}
								fieldNames={{
									key: "id",
									title: "label",
									children: "children",
								}}
							/>
						) : (
							<div className="py-4 text-center text-gray-400">暂无数据</div>
						)}
					</div>
				</div>
			</div>

			<div className="flex w-3/5 flex-col border-l border-[#EBEEF5] p-3">
				<div className="mb-4 flex items-center justify-between">
					<div className="gap-.5 flex items-center text-xs font-medium">
						请配置标签权重
						<Tooltip title="一票否决除外">
							<InfoCircleIcon className="h-3.5 w-3.5 cursor-help text-[#c0c4cc]" />
						</Tooltip>
					</div>
					<div className="text-xs font-medium">
						权重总和：
						{totalWeight}%
					</div>
				</div>
				<div className="min-h-0 w-full flex-1 space-y-6 overflow-auto pr-1">
					{tagWeightsState.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center">
							<Empty
								image={emptyStateImg}
								description={
									<span className="text-sm" style={{ color: "#909399" }}>
										请勾选左侧标签，进行标签权重配置
									</span>
								}
							/>
						</div>
					) : (
						tagWeightsState.map((item, index) => (
							<div key={item.id} className="space-y-1">
								<div className="flex items-center justify-between">
									<div className="text-sm font-medium">
										{index + 1}、{item.tagName}
									</div>
								</div>
								<div className="flex items-center gap-4">
									<div className="flex flex-1 items-center gap-2 pl-1">
										<Slider
											min={0}
											max={100}
											value={item.weight}
											onChange={(val) => handleWeightChange(item.id, val)}
											disabled={item.isVeto || readonly}
											className="flex-1"
											styles={{
												track: {
													background: "#1677ff",
												},
											}}
										/>
										<InputNumber
											min={0}
											max={100}
											value={item.weight}
											onChange={(val) =>
												handleWeightChange(item.id, val ?? 0)
											}
											disabled={item.isVeto || readonly}
											formatter={(value) => `${value}%`}
											parser={(value) => Number(value?.replace("%", "") || 0)}
											size="small"
										/>
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Checkbox
										checked={item.isVeto}
										onChange={(e) =>
											handleVetoChange(item.id, e.target.checked)
										}
										disabled={readonly}
										className="flex-shrink-0"
									>
										一票否决权
									</Checkbox>
									{item.isVeto && (
										<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
											<span className="flex items-center gap-1 whitespace-nowrap text-sm">
												<span
													style={{ color: "#ff4d4f" }}
													className="flex-shrink-0"
												>
													*
												</span>
												<span className="flex-shrink-0">当标签为</span>
											</span>
											<Select
												mode="multiple"
												placeholder="请选择"
												value={
													item.vetoTagValue
														? item.vetoTagValue
																.split(",")
																.filter((v) => v.trim())
														: []
												}
												onChange={(values) => {
													handleVetoTagValueChange(
														item.id,
														values.join(","),
													);
												}}
												disabled={readonly}
												options={(() => {
													const node = nodeMapRef.current.get(item.tagId);
													if (node?.tagValue) {
														return node.tagValue
															.split(",")
															.map((value) => ({
																label: value.trim(),
																value: value.trim(),
															}))
															.filter((opt) => opt.value);
													}
													return [];
												})()}
												className="min-w-[100px] flex-1"
												size="small"
												maxTagCount={1}
											/>
											<span className="whitespace-nowrap text-sm">
												进行一票否决
											</span>
										</div>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
