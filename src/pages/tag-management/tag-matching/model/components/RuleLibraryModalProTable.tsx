import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type {
	RuleLibraryListItem,
	SaveRuleLibraryItemParams,
} from "#src/api/tag-management/tag-matching/model";
import type { ActionType, ProColumns, ProTableProps } from "@ant-design/pro-components";
import type { BusinessTagTreeNode, RuleCondition, RuleItem } from "../types";
import { getJobPositionTree } from "#src/api/tag-management/rule-library";
import {
	convertUserTagTreeToBusinessTagTree,
	fetchOrganizationTagList,
	fetchRuleLibraryList,
	fetchUserTagTree,
	saveRuleLibrary,
} from "#src/api/tag-management/tag-matching/model";
import { processJobPositionTreeData } from "#src/utils";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Drawer, Form, Input, message, Select, theme, TreeSelect } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

// ==================== 常量定义 ====================

/** ID 前缀 */
const ID_PREFIXES = {
	RULE: "rule",
	CONDITION: "condition",
} as const;

/** 滚动延迟时间（毫秒） */
const SCROLL_DELAY_MS = 100;

/** 最小规则数量 */
const MIN_RULES_COUNT = 1;

// ==================== 类型定义 ====================

/**
 * 表单规则值类型
 */
interface FormRuleValue {
	/** 规则名称 */
	ruleName?: string;
	/** 条件列表 */
	conditions?: FormConditionValue[];
}

/**
 * 表单条件值类型
 */
interface FormConditionValue {
	/** 组织标签ID */
	orgTagId?: string;
	/** 组织标签值（表单中存储字符串（逗号拼接），通过 normalize 转换为数组给 Select 使用） */
	orgTagValue?: string;
	/** 岗位职位ID */
	jobPostId?: string;
	/** 规则值 */
	ruleValue?: string;
	/** 人才标签ID */
	userTagId?: string;
	/** 人才标签值 */
	userTagValue?: string;
}

/**
 * 表单值映射类型
 */
type FormValueMap = Map<
	string,
	{
		/** 规则名称 */
		ruleName?: string;
		/** 条件映射（条件ID -> 条件值） */
		conditions: Map<string, FormConditionValue>;
	}
>;

/**
 * 表格行数据（用于 ProTable）
 */
export interface TableRowData {
	/** 行唯一标识 */
	key: string;
	/** 规则ID */
	ruleId: string;
	/** 规则索引（在活跃规则列表中的索引） */
	ruleIndex: number;
	/** 条件索引（在活跃条件列表中的索引，确保字段名唯一） */
	conditionIndex: number;
	/** 规则名称 */
	ruleName: string;
	/** 组织标签ID */
	orgTagId?: string;
	/** 组织标签值（字符串格式，逗号拼接） */
	orgTagValue?: string;
	/** 岗位职位ID */
	jobPostId?: string;
	/** 规则值 */
	ruleValue?: string;
	/** 人才标签ID */
	userTagId?: string;
	/** 人才标签值 */
	userTagValue?: string;
	/** 是否为第一个条件 */
	isFirstCondition: boolean;
	/** 条件数量 */
	conditionCount: number;
	/** 是否为新增条件行 */
	isAddConditionRow?: boolean;
	/** 是否为新增规则行 */
	isAddRuleRow?: boolean;
	/** 条件ID */
	conditionId?: string;
}

/** 组件 Props */
export interface RuleLibraryModalProTableProps extends Omit<
	ProTableProps<TableRowData, Record<string, any>, "text">,
	| "columns"
	| "dataSource"
	| "rowKey"
	| "search"
	| "toolBarRender"
	| "options"
	| "pagination"
	| "scroll"
> {
	/** 是否显示 */
	open: boolean;
	/** 关闭回调 */
	onCancel: () => void;
}

// ==================== 工具函数 ====================

/**
 * 生成唯一 ID
 *
 * @param prefix - ID 前缀
 * @returns 唯一 ID 字符串
 */
function generateId(prefix: string): string {
	return `${prefix}-${uuidv4()}`;
}

/**
 * 创建空规则
 *
 * @returns 空规则对象
 */
function createEmptyRule(): RuleItem {
	return {
		id: generateId(ID_PREFIXES.RULE),
		ruleName: "",
		conditions: [createEmptyCondition()],
		delFlag: "0",
	};
}

/**
 * 创建空条件
 *
 * @returns 空条件对象
 */
function createEmptyCondition(): RuleCondition {
	return {
		id: generateId(ID_PREFIXES.CONDITION),
		orgTagId: undefined,
		jobPostId: undefined,
		ruleValue: undefined,
		delFlag: "0",
	};
}

/**
 * 创建表单值映射
 *
 * 从规则列表和表单值中提取，建立规则 ID 到表单值的映射关系
 *
 * @param prevRules - 之前的规则列表
 * @param currentFormRules - 当前表单值中的规则数组
 * @returns 表单值映射 Map
 */
function createFormValueMap(
	prevRules: RuleItem[],
	currentFormRules: FormRuleValue[],
): FormValueMap {
	const formValueMap: FormValueMap = new Map();

	prevRules.forEach((prevRule, prevRuleIndex) => {
		const prevFormRule = currentFormRules[prevRuleIndex];
		if (prevFormRule) {
			const conditionMap = new Map<string, FormConditionValue>();

			prevRule.conditions.forEach((prevCondition, prevCondIndex) => {
				const prevFormCondition = prevFormRule.conditions?.[prevCondIndex];
				if (prevFormCondition) {
					conditionMap.set(prevCondition.id, {
						orgTagId: prevFormCondition.orgTagId,
						orgTagValue: prevFormCondition.orgTagValue,
						jobPostId: prevFormCondition.jobPostId,
						ruleValue: prevFormCondition.ruleValue,
						userTagId: prevFormCondition.userTagId,
						userTagValue: prevFormCondition.userTagValue,
					});
				}
			});

			formValueMap.set(prevRule.id, {
				ruleName: prevFormRule.ruleName,
				conditions: conditionMap,
			});
		}
	});

	return formValueMap;
}

/**
 * 将规则列表转换为表单值
 *
 * @param rules - 规则列表（只包含未删除的规则）
 * @param formValueMap - 表单值映射
 * @returns 表单值对象
 */
function rulesToFormValues(
	rules: RuleItem[],
	formValueMap: FormValueMap,
): { rules: FormRuleValue[] } {
	return {
		rules: rules.map((rule) => {
			const formValueForRule = formValueMap.get(rule.id);
			// 只包含未删除的条件，确保索引与字段名一致
			const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");
			return {
				ruleName: formValueForRule?.ruleName ?? rule.ruleName,
				conditions: activeConditions.map((cond) => {
					const formValueForCondition = formValueForRule?.conditions.get(cond.id);
					// 表单中存储字符串（逗号拼接），normalize 会自动处理转换
					const orgTagValue = formValueForCondition?.orgTagValue ?? cond.orgTagValue;
					// 确保是字符串格式（如果是数组，转换为字符串）
					const orgTagValueStr = Array.isArray(orgTagValue)
						? orgTagValue.join(",")
						: orgTagValue;

					return {
						orgTagId: formValueForCondition?.orgTagId ?? cond.orgTagId,
						orgTagValue: orgTagValueStr,
						jobPostId: formValueForCondition?.jobPostId ?? cond.jobPostId,
						ruleValue: formValueForCondition?.ruleValue ?? cond.ruleValue,
						userTagId: formValueForCondition?.userTagId ?? (cond as any).userTagId,
						userTagValue:
							formValueForCondition?.userTagValue ?? (cond as any).userTagValue,
					};
				}),
			};
		}),
	};
}

/**
 * 将表单值转换为规则列表
 *
 * 根据 id 匹配表单值和规则，新增行按索引匹配。
 * formRules 基于过滤后的规则（只包含未删除的），stateRules 包含所有规则（包括已删除的）。
 * 表单字段名格式：["rules", activeRuleIndex, "conditions", activeCondIndex, "fieldName"]
 * 其中 activeCondIndex 是条件在活跃条件列表中的索引，确保字段名唯一性
 *
 * @param formRules - 表单规则值数组（只包含未删除的规则和条件）
 * @param stateRules - 状态规则数组（包含所有规则，包括已删除的）
 * @param activeRules - 未删除的规则数组（用于索引映射）
 * @returns 转换后的规则列表
 */
function formValuesToRulesById(
	formRules: FormRuleValue[],
	stateRules: RuleItem[],
	activeRules: RuleItem[],
): RuleItem[] {
	// 创建规则 id 到表单值的映射
	const ruleIdToFormValue = new Map<
		string,
		{ activeRuleIndex: number; formRule: FormRuleValue }
	>();
	activeRules.forEach((rule, activeRuleIndex) => {
		if (formRules[activeRuleIndex]) {
			ruleIdToFormValue.set(rule.id, {
				activeRuleIndex,
				formRule: formRules[activeRuleIndex],
			});
		}
	});

	// 遍历所有 stateRules（包括已删除的），根据 id 匹配表单值
	return stateRules.map((stateRule) => {
		const formValueData = ruleIdToFormValue.get(stateRule.id);

		// 如果找不到对应的表单值（可能是已删除的规则），使用 stateRule 的值
		if (!formValueData) {
			return stateRule;
		}

		const { formRule } = formValueData;

		// 获取未删除的条件列表
		const activeConditions = stateRule.conditions.filter((cond) => cond.delFlag !== "1");

		// 创建条件 id 到表单值的映射
		// 表单值只包含活跃条件，使用 activeCondIndex（活跃条件列表中的索引）从表单值中获取
		const conditionIdToFormValue = new Map<string, FormConditionValue>();
		activeConditions.forEach((condition, activeCondIndex) => {
			// 从表单值中根据 activeCondIndex 获取（表单值只包含活跃条件，索引与字段名一致）
			if (formRule.conditions && formRule.conditions[activeCondIndex]) {
				const formCondition = formRule.conditions[activeCondIndex];
				conditionIdToFormValue.set(condition.id, formCondition);
			}
		});

		// 遍历所有 conditions（包括已删除的），根据 id 匹配表单值
		const conditions = stateRule.conditions.map((stateCondition) => {
			const formCondition = conditionIdToFormValue.get(stateCondition.id);

			// 如果找不到对应的表单值（可能是已删除的条件），使用 stateCondition 的值
			if (!formCondition) {
				return stateCondition;
			}

			return {
				id: stateCondition.id,
				orgTagId: formCondition.orgTagId,
				orgTagValue: formCondition.orgTagValue,
				jobPostId: formCondition.jobPostId,
				ruleValue: formCondition.ruleValue,
				userTagId: formCondition.userTagId,
				userTagValue: formCondition.userTagValue,
				delFlag: stateCondition.delFlag || "0",
			} as RuleCondition;
		});

		return {
			id: stateRule.id,
			ruleName: formRule.ruleName || stateRule.ruleName || "",
			conditions: conditions.length > 0 ? conditions : [createEmptyCondition()],
			delFlag: stateRule.delFlag || "0",
		};
	});
}

/**
 * 创建空单元格渲染结果
 *
 * 用于 ProTable 的 render 函数，返回空单元格以隐藏该单元格
 *
 * @returns 空单元格渲染结果
 */
function createEmptyCell() {
	return {
		children: null,
		props: {
			colSpan: 0,
		},
	};
}

/**
 * 将接口返回的规则列表转换为组件使用的规则列表
 *
 * @param apiRules - 接口返回的规则列表
 * @returns 组件使用的规则列表
 */
function convertApiRulesToRuleItems(apiRules: RuleLibraryListItem[]): RuleItem[] {
	return apiRules.map((apiRule) => {
		const details = apiRule.details || [];
		const conditions =
			details.length > 0
				? details.map((detail) => {
						return {
							// 保留原始的 detail id，用于保存时识别更新/新增
							id: String(detail.id),
							orgTagId: String(detail.orgTagId),
							// 保持 orgTagValue 为字符串格式（逗号拼接），normalize 会自动转换为数组给 Select 使用
							orgTagValue: detail.orgTagValue || undefined,
							// 使用 != null 检查，允许 jobPostId 为 0（0 是有效的值，表示根节点）
							jobPostId:
								detail.jobPostId != null ? String(detail.jobPostId) : undefined,
							ruleValue: detail.ruleValue,
							// 人才标签回显
							userTagId:
								detail.userTagId != null ? String(detail.userTagId) : undefined,
							userTagValue: detail.userTagValue || undefined,
							delFlag: "0",
						};
					})
				: [createEmptyCondition()];

		return {
			id: String(apiRule.id),
			ruleName: apiRule.ruleName,
			conditions,
			delFlag: "0",
		};
	});
}

// ==================== 主组件 ====================

/**
 * 规则库维护弹窗组件
 *
 * 基于 ProTable 实现，支持规则的增删改查操作
 */
export default function RuleLibraryModalProTable({
	open,
	onCancel,
	...restProps
}: RuleLibraryModalProTableProps) {
	const [form] = Form.useForm();
	const [rules, setRules] = useState<RuleItem[]>([]);
	const [saving, setSaving] = useState(false);
	const actionRef = useRef<ActionType>();
	const { token } = theme.useToken();

	// 获取选项数据（组织标签、岗位职位树和人才标签树）
	const { data: optionsData } = useRequest(
		async () => {
			const [orgTagRes, jobPositionTreeRes, userTagTreeRes] = await Promise.all([
				fetchOrganizationTagList(),
				getJobPositionTree(), // 获取岗位-职位树
				fetchUserTagTree(), // 获取人才标签树
			]);
			return {
				orgTagOptions: orgTagRes || [],
				jobPositionTreeData: jobPositionTreeRes || [],
				userTagTreeData: userTagTreeRes || [],
			};
		},
		{
			ready: open,
			onError: (error) => {
				console.error("获取选项数据失败:", error);
			},
		},
	);

	const orgTagOptions = optionsData?.orgTagOptions ?? [];
	const jobPositionTreeData = optionsData?.jobPositionTreeData ?? [];
	const userTagTreeData = optionsData?.userTagTreeData ?? [];

	/**
	 * 处理人才标签树数据，转换为 BusinessTagTreeNode 格式
	 * 只有标签节点（isTag: true）可选中，其他节点只能展开
	 */
	const userTagTreeNodes = useMemo(() => {
		if (!userTagTreeData || userTagTreeData.length === 0) {
			return [];
		}
		const convertedTree = convertUserTagTreeToBusinessTagTree(userTagTreeData);

		/**
		 * 递归处理节点，添加 selectable 属性
		 *
		 * @param nodes - 节点数组
		 * @returns 处理后的节点数组
		 */
		const processSelectable = (nodes: BusinessTagTreeNode[]): BusinessTagTreeNode[] => {
			return nodes.map((node) => {
				const processedNode: BusinessTagTreeNode & { selectable?: boolean } = {
					...node,
					// 只有标签节点（isTag: true）可选中，其他节点只能展开
					selectable: node.isTag === true,
				};

				if (node.children && node.children.length > 0) {
					processedNode.children = processSelectable(node.children);
				}

				return processedNode;
			});
		};

		return processSelectable(convertedTree);
	}, [userTagTreeData]);

	/**
	 * 构建人才标签节点映射：tagId -> tagValue
	 *
	 * 用于快速查找标签值
	 *
	 * @returns 人才标签节点映射 Map
	 */
	const userTagNodeMap = useMemo(() => {
		const nodeMap = new Map<string, BusinessTagTreeNode>();
		if (userTagTreeNodes && userTagTreeNodes.length > 0) {
			const buildNodeMap = (nodes: BusinessTagTreeNode[]) => {
				nodes.forEach((node) => {
					nodeMap.set(node.id, node);
					if (node.children?.length) {
						buildNodeMap(node.children);
					}
				});
			};
			buildNodeMap(userTagTreeNodes);
		}
		return nodeMap;
	}, [userTagTreeNodes]);

	/**
	 * 构建人才标签父节点映射：nodeId -> parentId
	 *
	 * 用于获取节点的父节点链，实现 TreeSelect 展开到选中节点
	 *
	 * @returns 父节点映射 Map
	 */
	const userTagParentMap = useMemo(() => {
		const parentMap = new Map<string, string>();
		if (userTagTreeNodes && userTagTreeNodes.length > 0) {
			const buildParentMap = (nodes: BusinessTagTreeNode[], parentId?: string) => {
				nodes.forEach((node) => {
					if (parentId) {
						parentMap.set(node.id, parentId);
					}
					if (node.children?.length) {
						buildParentMap(node.children, node.id);
					}
				});
			};
			buildParentMap(userTagTreeNodes);
		}
		return parentMap;
	}, [userTagTreeNodes]);

	/**
	 * 获取节点的所有祖先节点ID列表
	 *
	 * @param nodeId - 节点ID
	 * @returns 祖先节点ID数组
	 */
	const getUserTagAncestorIds = useCallback(
		(nodeId: string | undefined): string[] => {
			if (!nodeId) {
				return [];
			}
			const ancestors: string[] = [];
			let currentId = nodeId;
			while (userTagParentMap.has(currentId)) {
				const parentId = userTagParentMap.get(currentId)!;
				ancestors.push(parentId);
				currentId = parentId;
			}
			return ancestors;
		},
		[userTagParentMap],
	);

	/**
	 * 构建扁平化 Map：id -> node
	 *
	 * 用于快速查找节点，在提交时将 id 转换为后端格式
	 *
	 * @returns 岗位职位节点映射 Map
	 */
	const jobPositionNodeMap = useMemo(() => {
		const nodeMap = new Map<string, JobPositionTreeNode>();
		if (jobPositionTreeData && jobPositionTreeData.length > 0) {
			const buildNodeMap = (nodes: JobPositionTreeNode[]) => {
				nodes.forEach((node) => {
					nodeMap.set(node.id, node);
					if (node.children?.length) {
						buildNodeMap(node.children);
					}
				});
			};
			buildNodeMap(jobPositionTreeData);
		}
		return nodeMap;
	}, [jobPositionTreeData]);

	/**
	 * 处理树数据，为节点添加自定义 title
	 */
	const processedTreeData = useMemo(() => {
		return processJobPositionTreeData(jobPositionTreeData);
	}, [jobPositionTreeData]);

	/**
	 * 将组件使用的规则列表转换为接口需要的格式
	 *
	 * @param rules - 规则列表
	 * @returns 接口参数格式
	 */
	const convertRuleItemsToApiParams = useCallback(
		(rules: RuleItem[]): SaveRuleLibraryItemParams[] => {
			return rules.map((rule) => {
				// 尝试从 id 中提取数字 id，如果 id 是纯数字字符串则转换为数字，否则为 undefined（表示新增）
				const ruleIdNum = Number(rule.id);
				const finalRuleId = Number.isNaN(ruleIdNum) ? undefined : ruleIdNum;

				return {
					id: finalRuleId,
					ruleName: rule.ruleName,
					delFlag: rule.delFlag || "0",
					// 提交所有条件，包括已删除的（初始化有的数据都要带回去）
					details: rule.conditions.map((condition) => {
						// 尝试从 id 中提取数字 id，如果 id 是纯数字字符串则转换为数字，否则为 undefined（表示新增）
						const detailIdNum = Number(condition.id);
						const finalDetailId = Number.isNaN(detailIdNum) ? undefined : detailIdNum;

						// 确保 orgTagValue 是字符串类型（防御性编程，虽然理论上应该已经是字符串）
						const orgTagValueStr =
							typeof condition.orgTagValue === "string"
								? condition.orgTagValue
								: Array.isArray(condition.orgTagValue)
									? condition.orgTagValue.join(",")
									: "";

						// 如果条件已标记删除，跳过必填字段验证，但依然提交
						if (condition.delFlag === "1") {
							// 删除时也需要提供默认值，保持原有数据
							// 使用 != null 检查，允许 jobPostId 为 0
							const node =
								condition.jobPostId != null
									? jobPositionNodeMap.get(condition.jobPostId)
									: null;
							return {
								id: finalDetailId,
								ruleId: finalRuleId,
								orgTagId: condition.orgTagId ? Number(condition.orgTagId) : 0,
								orgTagValue: orgTagValueStr,
								jobPostType: node?.type || "",
								jobPostId:
									condition.jobPostId != null ? Number(condition.jobPostId) : 0,
								ruleValue: condition.ruleValue || "",
								userTagId: condition.userTagId
									? Number(condition.userTagId)
									: undefined,
								userTagValue: condition.userTagValue || undefined,
								delFlag: condition.delFlag,
							};
						}

						// 如果规则被删除，条件也需要提交（保持原有的 delFlag），跳过必填字段验证
						if (rule.delFlag === "1") {
							// 使用 != null 检查，允许 jobPostId 为 0
							const node =
								condition.jobPostId != null
									? jobPositionNodeMap.get(condition.jobPostId)
									: null;
							return {
								id: finalDetailId,
								ruleId: finalRuleId,
								orgTagId: condition.orgTagId ? Number(condition.orgTagId) : 0,
								orgTagValue: orgTagValueStr,
								jobPostType: node?.type || "",
								jobPostId:
									condition.jobPostId != null ? Number(condition.jobPostId) : 0,
								ruleValue: condition.ruleValue || "",
								userTagId: condition.userTagId
									? Number(condition.userTagId)
									: undefined,
								userTagValue: condition.userTagValue || undefined,
								delFlag: condition.delFlag || "0",
							};
						}

						// 正常情况：验证必填字段
						// 使用 != null 检查，允许 jobPostId 为 0（0 表示根节点）
						if (!condition.orgTagId || condition.jobPostId == null) {
							throw new Error("组织标签和岗位-职位-职级不能为空");
						}

						// 从树节点映射中获取节点信息
						// 先尝试从 map 中查找，如果找不到且 jobPostId 为 "0"，则使用 "root" 作为默认 type
						const node = jobPositionNodeMap.get(condition.jobPostId);
						// 如果找不到节点且 jobPostId 不为 "0"，则报错
						if (!node && condition.jobPostId !== "0") {
							throw new Error(`未找到岗位职位节点，ID: ${condition.jobPostId}`);
						}

						return {
							id: finalDetailId,
							ruleId: finalRuleId,
							orgTagId: Number(condition.orgTagId),
							orgTagValue: orgTagValueStr,
							// 如果找不到节点且 jobPostId 为 "0"，则使用 "root" 作为默认 type
							jobPostType: node?.type || (condition.jobPostId === "0" ? "root" : ""),
							jobPostId: Number(condition.jobPostId),
							ruleValue: condition.ruleValue || "",
							userTagId: condition.userTagId
								? Number(condition.userTagId)
								: undefined,
							userTagValue: condition.userTagValue || undefined,
							delFlag: condition.delFlag || "0",
						};
					}),
				};
			});
		},
		[jobPositionNodeMap],
	);

	// 查询规则列表（弹窗打开时自动请求）
	const { data: ruleListData, loading: _ruleListLoading } = useRequest(
		async () => {
			const response = await fetchRuleLibraryList({
				pageNum: 1,
				pageSize: 500,
			});
			return response;
		},
		{
			ready: open,
			onError: (error) => {
				console.error("获取规则列表失败:", error);
			},
		},
	);

	// 计算表单初始值
	const formInitialValues = useMemo(() => {
		if (ruleListData?.list && ruleListData.list.length > 0) {
			const convertedRules = convertApiRulesToRuleItems(ruleListData.list);
			setRules(convertedRules);
			// 只包含未删除的规则和条件，确保索引与字段名一致
			const activeRules = convertedRules.filter((rule) => rule.delFlag !== "1");
			return {
				rules: activeRules.map((rule) => {
					const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");
					return {
						ruleName: rule.ruleName,
						conditions: activeConditions.map((cond) => ({
							orgTagId: cond.orgTagId,
							orgTagValue: cond.orgTagValue,
							jobPostId: cond.jobPostId,
							ruleValue: cond.ruleValue,
							userTagId: (cond as any).userTagId,
							userTagValue: (cond as any).userTagValue,
						})),
					};
				}),
			};
		} else {
			// 没有数据或数据为空，初始化至少一条空规则
			const initialRules = [createEmptyRule()];
			setRules(initialRules);
			return {
				rules: initialRules.map((rule) => {
					const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");
					return {
						ruleName: rule.ruleName,
						conditions: activeConditions.map((cond) => ({
							orgTagId: cond.orgTagId,
							orgTagValue: cond.orgTagValue,
							jobPostId: cond.jobPostId,
							ruleValue: cond.ruleValue,
							userTagId: (cond as any).userTagId,
							userTagValue: (cond as any).userTagValue,
						})),
					};
				}),
			};
		}
	}, [ruleListData]);

	// 当初始值变化时，重置表单
	useEffect(() => {
		if (open && formInitialValues) {
			form.setFieldsValue(formInitialValues);
		}
	}, [open, formInitialValues, form]);

	// 将规则数据转换为表格行数据（过滤掉已标记删除的数据）
	const tableRows = useMemo<TableRowData[]>(() => {
		const rows: TableRowData[] = [];

		// 过滤掉已标记删除的规则
		const activeRules = rules.filter((rule) => rule.delFlag !== "1");

		activeRules.forEach((rule, ruleIndex) => {
			// 过滤掉已标记删除的条件
			const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");

			// 添加条件行
			activeConditions.forEach((condition, condIndex) => {
				// 确保 orgTagValue 是字符串格式（逗号拼接）
				const orgTagValueStr = Array.isArray(condition.orgTagValue)
					? condition.orgTagValue.join(",")
					: condition.orgTagValue || "";

				rows.push({
					key: `${rule.id}-${condition.id}`,
					ruleId: rule.id,
					ruleIndex,
					conditionIndex: condIndex, // 使用活跃条件列表中的索引，确保字段名唯一
					ruleName: rule.ruleName,
					orgTagId: condition.orgTagId,
					orgTagValue: orgTagValueStr, // 表格行数据中保持为字符串（逗号拼接）
					jobPostId: condition.jobPostId,
					ruleValue: condition.ruleValue,
					userTagId: (condition as any).userTagId,
					userTagValue: (condition as any).userTagValue,
					isFirstCondition: condIndex === 0,
					conditionCount: activeConditions.length,
					conditionId: condition.id,
				});
			});

			// 添加新增条件行
			rows.push({
				key: `add-condition-${rule.id}`,
				ruleId: rule.id,
				ruleIndex,
				conditionIndex: -1,
				ruleName: rule.ruleName,
				isFirstCondition: false,
				conditionCount: activeConditions.length,
				isAddConditionRow: true,
			});
		});

		// 添加新增规则行
		rows.push({
			key: "add-rule-row",
			ruleId: "",
			ruleIndex: -1,
			conditionIndex: -1,
			ruleName: "",
			isFirstCondition: false,
			conditionCount: 0,
			isAddRuleRow: true,
		});

		return rows;
	}, [rules]);

	/**
	 * 更新规则列表
	 *
	 * 同时更新状态和表单值，确保表单视图与表格视图一致
	 *
	 * @param updater - 规则更新函数
	 */
	const updateRules = useCallback(
		(updater: (rules: RuleItem[]) => RuleItem[]) => {
			setRules((prevRules) => {
				const newRules = updater(prevRules);
				// 获取当前表单值，保留用户输入
				const currentFormValues = form.getFieldsValue();
				const currentFormRules = (currentFormValues.rules || []) as FormRuleValue[];

				// 创建 ID 到表单值的映射（只包含未删除的规则）
				const activePrevRules = prevRules.filter((rule) => rule.delFlag !== "1");
				const formValueMap = createFormValueMap(activePrevRules, currentFormRules);

				// 只对未删除的规则生成表单值，确保表单视图与表格视图一致
				const activeNewRules = newRules.filter((rule) => rule.delFlag !== "1");
				const formValues = rulesToFormValues(activeNewRules, formValueMap);
				form.setFieldsValue(formValues);
				return newRules;
			});
		},
		[form],
	);

	/**
	 * 新增规则
	 */
	const handleAddRule = useCallback(() => {
		updateRules((rules) => [...rules, createEmptyRule()]);
		// 延迟刷新表格，确保表单值已更新
		setTimeout(() => {
			actionRef.current?.reload();
		}, SCROLL_DELAY_MS);
	}, [updateRules]);

	/**
	 * 新增条件
	 *
	 * @param ruleId - 规则 ID
	 */
	const handleAddCondition = useCallback(
		(ruleId: string) => {
			updateRules((rules) =>
				rules.map((rule) =>
					rule.id === ruleId
						? { ...rule, conditions: [...rule.conditions, createEmptyCondition()] }
						: rule,
				),
			);
		},
		[updateRules],
	);

	/**
	 * 删除条件
	 *
	 * 新增行直接删除，已存在的行标记 delFlag
	 * 当删除最后一个条件时，删除整个规则
	 *
	 * @param ruleId - 规则 ID
	 * @param conditionId - 条件 ID
	 */
	const handleDeleteCondition = useCallback(
		(ruleId: string, conditionId: string) => {
			updateRules((rules) => {
				// 找到对应的规则
				const ruleIndex = rules.findIndex((rule) => rule.id === ruleId);
				if (ruleIndex === -1) {
					return rules;
				}

				const rule = rules[ruleIndex];

				// 判断是否为新增条件（id 不是纯数字，表示新增）
				const conditionIdNum = Number(conditionId);
				const isNewCondition = Number.isNaN(conditionIdNum);

				// 统计未删除的条件数量
				const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");

				// 如果只有最后一个条件，删除整个规则
				if (activeConditions.length === 1) {
					// 判断是否为新增规则（id 不是纯数字，表示新增）
					const ruleIdNum = Number(ruleId);
					const isNewRule = Number.isNaN(ruleIdNum);

					// 统计未删除的规则数量
					const activeRules = rules.filter((r) => r.delFlag !== "1");
					if (activeRules.length <= MIN_RULES_COUNT) {
						return rules; // 至少保留一个规则
					}

					// 新增规则直接删除，已存在的规则标记 delFlag
					if (isNewRule) {
						return rules.filter((r) => r.id !== ruleId);
					} else {
						// 标记删除，不实际移除
						return rules.map((r) => (r.id === ruleId ? { ...r, delFlag: "1" } : r));
					}
				}

				// 如果还有多个条件，只删除当前条件
				// 新增条件直接删除，已存在的条件标记 delFlag
				if (isNewCondition) {
					const newConditions = rule.conditions.filter((cond) => cond.id !== conditionId);
					return rules.map((r, index) =>
						index === ruleIndex
							? {
									...r,
									conditions:
										newConditions.length > 0
											? newConditions
											: [createEmptyCondition()],
								}
							: r,
					);
				} else {
					// 标记删除，不实际移除
					const newConditions = rule.conditions.map((cond) =>
						cond.id === conditionId ? { ...cond, delFlag: "1" } : cond,
					);
					const activeAfterDelete = newConditions.filter((cond) => cond.delFlag !== "1");
					return rules.map((r, index) =>
						index === ruleIndex
							? {
									...r,
									conditions:
										activeAfterDelete.length > 0
											? newConditions
											: [createEmptyCondition()],
								}
							: r,
					);
				}
			});
		},
		[updateRules],
	);

	/**
	 * 保存规则
	 *
	 * 验证表单、转换数据格式并提交到后端
	 */
	const handleSave = useCallback(async () => {
		try {
			// 获取未删除的规则列表（用于索引映射）
			const activeRules = rules.filter((rule) => rule.delFlag !== "1");

			// 1. 只验证未删除的表单项
			// 构建需要验证的字段名列表（排除已删除的数据）
			const validateFieldNames: Array<string | number | (string | number)[]> = [];
			activeRules.forEach((rule, activeRuleIndex) => {
				// 验证规则名称
				validateFieldNames.push(["rules", activeRuleIndex, "ruleName"] as (
					| string
					| number
				)[]);

				// 获取未删除的条件列表
				const activeConditions = rule.conditions.filter((cond) => cond.delFlag !== "1");

				// 验证未删除的条件（使用活跃条件列表中的索引，确保与字段名一致）
				activeConditions.forEach((condition, activeCondIndex) => {
					validateFieldNames.push(
						["rules", activeRuleIndex, "conditions", activeCondIndex, "orgTagId"] as (
							| string
							| number
						)[],
						[
							"rules",
							activeRuleIndex,
							"conditions",
							activeCondIndex,
							"orgTagValue",
						] as (string | number)[],
						["rules", activeRuleIndex, "conditions", activeCondIndex, "jobPostId"] as (
							| string
							| number
						)[],
						["rules", activeRuleIndex, "conditions", activeCondIndex, "userTagId"] as (
							| string
							| number
						)[],
						[
							"rules",
							activeRuleIndex,
							"conditions",
							activeCondIndex,
							"userTagValue",
						] as (string | number)[],
					);
				});
			});

			// 验证指定的字段
			await form.validateFields(validateFieldNames);

			// 从表单获取所有字段值（包括嵌套的）
			const formValues = form.getFieldsValue(true);
			const formRules = (formValues.rules || []) as FormRuleValue[];

			// 将表单数据与状态数据合并（补充 id），根据 id 匹配
			const finalRules = formValuesToRulesById(formRules, rules, activeRules);

			// 转换为接口需要的格式
			const apiParams = convertRuleItemsToApiParams(finalRules);

			// 2. 发起请求
			setSaving(true);
			try {
				await saveRuleLibrary(apiParams);
				message.success("保存成功");
			} catch (error) {
				console.error("保存失败:", error);
				// 保存失败时不关闭抽屉，让用户有机会修复
				return;
			} finally {
				setSaving(false);
			}

			// 3. 关闭抽屉（保存成功后）
			onCancel();
		} catch {
			// 验证失败时，错误信息已由 Form 自动显示，不需要额外处理
			// 验证失败时不应该显示 loading 状态，也不关闭抽屉
		}
	}, [form, rules, onCancel, convertRuleItemsToApiParams]);

	/**
	 * 关闭弹窗
	 *
	 * 重置规则列表并调用关闭回调
	 */
	const handleCancel = useCallback(() => {
		setRules([]);
		onCancel();
	}, [onCancel]);

	// 定义列
	const columns: ProColumns<TableRowData>[] = useMemo(
		() => [
			{
				title: (
					<>
						<span style={{ color: token.colorError }}>*</span>
						规则名称
					</>
				),
				dataIndex: "ruleName",
				width: 200,
				render: (text, record) => {
					if (record.isAddRuleRow || record.isAddConditionRow) {
						return createEmptyCell();
					}

					return {
						children: (
							<Form.Item
								name={["rules", record.ruleIndex, "ruleName"]}
								noStyle
								rules={[
									{
										required: true,
										message: "请输入规则名称",
									},
								]}
							>
								<Input placeholder="请输入规则名称" style={{ width: "100%" }} />
							</Form.Item>
						),
						props: {
							rowSpan: record.isFirstCondition ? record.conditionCount + 1 : 0,
						},
					};
				},
			},
			{
				title: (
					<>
						<span style={{ color: token.colorError }}>*</span>
						具体规则
					</>
				),
				dataIndex: "specificRule",
				width: 720,
				render: (text, record) => {
					if (record.isAddRuleRow) {
						return createEmptyCell();
					}

					if (record.isAddConditionRow) {
						return {
							children: (
								<Button
									type="link"
									icon={<PlusOutlined />}
									onClick={() => handleAddCondition(record.ruleId)}
									className="px-0"
								>
									新增
								</Button>
							),
							props: {
								colSpan: 2,
							},
						};
					}

					const orgTagIdFieldName = [
						"rules",
						record.ruleIndex,
						"conditions",
						record.conditionIndex,
						"orgTagId",
					];
					const orgTagValueFieldName = [
						"rules",
						record.ruleIndex,
						"conditions",
						record.conditionIndex,
						"orgTagValue",
					];
					const userTagIdFieldName = [
						"rules",
						record.ruleIndex,
						"conditions",
						record.conditionIndex,
						"userTagId",
					];
					const userTagValueFieldName = [
						"rules",
						record.ruleIndex,
						"conditions",
						record.conditionIndex,
						"userTagValue",
					];

					return {
						children: (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									flexWrap: "wrap",
								}}
							>
								<span className="flex-shrink-0">当组织标签为</span>
								<Form.Item
									name={orgTagIdFieldName}
									noStyle
									rules={[
										{
											required: true,
											message: "请选择组织标签",
										},
									]}
								>
									<Select
										placeholder="请选择组织标签"
										showSearch
										allowClear
										className="min-w-32 max-w-40 flex-1"
										options={orgTagOptions}
										fieldNames={{ label: "tagName", value: "id" }}
										optionFilterProp="tagName"
										notFoundContent={
											orgTagOptions.length === 0 ? "暂无数据" : undefined
										}
										onChange={() => {
											form.setFieldValue(orgTagValueFieldName, undefined);
										}}
									/>
								</Form.Item>
								<span className="flex-shrink-0">=</span>
								<Form.Item
									noStyle
									shouldUpdate={(prevValues, currentValues) => {
										const prevOrgTagId =
											prevValues.rules?.[record.ruleIndex]?.conditions?.[
												record.conditionIndex
											]?.orgTagId;
										const currentOrgTagId =
											currentValues.rules?.[record.ruleIndex]?.conditions?.[
												record.conditionIndex
											]?.orgTagId;
										return prevOrgTagId !== currentOrgTagId;
									}}
								>
									{() => {
										const currentOrgTagId =
											form.getFieldValue(orgTagIdFieldName);
										const selectedTag = orgTagOptions.find(
											(tag) => String(tag.id) === String(currentOrgTagId),
										);
										const options = selectedTag?.tagValue
											? selectedTag.tagValue
													.split(",")
													.map((value) => value.trim())
													.filter((value) => value.length > 0)
													.map((value) => ({
														label: value,
														value,
													}))
											: [];

										return (
											<Form.Item
												name={orgTagValueFieldName}
												noStyle
												rules={[
													{
														required: true,
														message: "请选择组织标签值",
													},
												]}
												dependencies={[orgTagIdFieldName]}
												getValueFromEvent={(value) => {
													if (Array.isArray(value)) {
														return value.join(",");
													}
													return "";
												}}
												normalize={(value) => {
													if (typeof value === "string" && value) {
														return value
															.split(",")
															.map((v) => v.trim())
															.filter((v) => v.length > 0);
													}
													if (Array.isArray(value)) {
														return value;
													}
													return undefined;
												}}
											>
												<Select
													key={`orgTagValue-${record.ruleIndex}-${record.conditionIndex}-${currentOrgTagId || "empty"}`}
													mode="multiple"
													placeholder="请选择组织标签值"
													showSearch
													allowClear
													className="min-w-32 max-w-40 flex-1"
													options={options}
													notFoundContent={
														!currentOrgTagId
															? "请先选择组织标签"
															: options.length === 0
																? "该组织标签暂无标签值"
																: undefined
													}
												/>
											</Form.Item>
										);
									}}
								</Form.Item>
								<span className="flex-shrink-0">且岗位为</span>
								<Form.Item
									name={[
										"rules",
										record.ruleIndex,
										"conditions",
										record.conditionIndex,
										"jobPostId",
									]}
									noStyle
									rules={[
										{
											required: true,
											message: "请选择岗位",
										},
									]}
								>
									<TreeSelect
										placeholder="请选择岗位"
										showSearch
										allowClear
										className="min-w-32 max-w-40 flex-1"
										styles={{
											popup: {
												root: { minWidth: "26rem" },
											},
										}}
										treeData={processedTreeData}
										treeNodeFilterProp="label"
										fieldNames={{
											label: "title",
											value: "id",
											children: "children",
										}}
										notFoundContent={
											processedTreeData.length === 0 ? "暂无数据" : undefined
										}
									/>
								</Form.Item>
								<span className="flex-shrink-0">时，</span>
								{/* 强制换行 */}
								<div className="basis-full" />
								<span className="flex-shrink-0">需找人员标签</span>
								<Form.Item
									name={userTagIdFieldName}
									noStyle
									rules={[
										{
											required: true,
											message: "请选择人才标签",
										},
									]}
								>
									<TreeSelect
										key={`userTagTree-${record.ruleIndex}-${record.conditionIndex}-${record.userTagId || "empty"}`}
										placeholder="请选择人才标签"
										showSearch
										allowClear
										className="min-w-32 max-w-40 flex-1"
										styles={{
											popup: {
												root: { minWidth: "26rem" },
											},
										}}
										treeData={userTagTreeNodes as any}
										fieldNames={{
											label: "label",
											value: "id",
											children: "children",
										}}
										treeNodeFilterProp="label"
										treeDefaultExpandedKeys={getUserTagAncestorIds(
											record.userTagId,
										)}
										onChange={(_value) => {
											form.setFieldValue(userTagValueFieldName, undefined);
										}}
										notFoundContent={
											userTagTreeNodes.length === 0 ? "暂无数据" : undefined
										}
									/>
								</Form.Item>
								<span className="flex-shrink-0">=</span>
								<Form.Item
									noStyle
									shouldUpdate={(prevValues, currentValues) => {
										const prevUserTagId =
											prevValues.rules?.[record.ruleIndex]?.conditions?.[
												record.conditionIndex
											]?.userTagId;
										const currentUserTagId =
											currentValues.rules?.[record.ruleIndex]?.conditions?.[
												record.conditionIndex
											]?.userTagId;
										return prevUserTagId !== currentUserTagId;
									}}
								>
									{() => {
										const currentUserTagId =
											form.getFieldValue(userTagIdFieldName);
										const selectedNode = currentUserTagId
											? userTagNodeMap.get(String(currentUserTagId))
											: null;
										const options = selectedNode?.tagValue
											? selectedNode.tagValue
													.split(",")
													.map((value) => value.trim())
													.filter((value) => value.length > 0)
													.map((value) => ({
														label: value,
														value,
													}))
											: [];

										return (
											<Form.Item
												name={userTagValueFieldName}
												noStyle
												rules={[
													{
														required: true,
														message: "请选择人才标签值",
													},
												]}
												dependencies={[userTagIdFieldName]}
											>
												<Select
													key={`userTagValue-${record.ruleIndex}-${record.conditionIndex}-${currentUserTagId || "empty"}`}
													placeholder="请选择人才标签值"
													showSearch
													allowClear
													className="min-w-32 max-w-40 flex-1"
													options={options}
													notFoundContent={
														!currentUserTagId
															? "请先选择人才标签"
															: options.length === 0
																? "该人才标签暂无标签值"
																: undefined
													}
												/>
											</Form.Item>
										);
									}}
								</Form.Item>
								<span className="flex-shrink-0">的人员</span>
							</div>
						),
						props: {},
					};
				},
			},
			{
				title: "操作",
				dataIndex: "conditionAction",
				width: 80,
				render: (_, record) => {
					if (record.isAddRuleRow) {
						return {
							children: (
								<Button
									type="link"
									icon={<PlusOutlined />}
									onClick={handleAddRule}
									className="px-0"
								>
									新增
								</Button>
							),
							props: {
								colSpan: 3,
							},
						};
					}

					if (record.isAddConditionRow) {
						return createEmptyCell();
					}

					// 获取当前规则的条件数量
					const currentRule = rules.find((rule) => rule.id === record.ruleId);
					const conditionCount = currentRule?.conditions.length ?? 0;
					// 当只剩一个规则且该规则只有一个条件时，禁用删除按钮（确保至少保留一个规则）
					const isLastRule = rules.length === 1 && conditionCount <= 1;

					return {
						children: (
							<Button
								type="text"
								danger
								icon={<DeleteOutlined />}
								size="small"
								onClick={() =>
									handleDeleteCondition(record.ruleId, record.conditionId!)
								}
								title={isLastRule ? "至少保留一个规则" : "删除"}
								disabled={isLastRule}
							/>
						),
						props: {},
					};
				},
			},
		],
		[
			rules,
			orgTagOptions,
			processedTreeData,
			userTagTreeNodes,
			userTagNodeMap,
			getUserTagAncestorIds,
			handleAddRule,
			handleAddCondition,
			handleDeleteCondition,
			token.colorError,
			form,
		],
	);

	return (
		<Drawer
			title="规则库维护"
			open={open}
			onClose={handleCancel}
			width="max(1100px, 60vw)"
			placement="right"
			closable={{ placement: "end" }}
			footer={
				<div className="flex justify-end gap-2">
					<Button onClick={handleCancel}>取消</Button>
					<Button type="primary" onClick={handleSave} loading={saving}>
						保存
					</Button>
				</div>
			}
			styles={{
				body: {
					display: "flex",
					flexDirection: "column",
					height: "100%",
					padding: 24,
					overflow: "hidden",
				},
			}}
		>
			<Form form={form} component={false}>
				<ProTable<TableRowData>
					actionRef={actionRef}
					columns={columns}
					dataSource={tableRows}
					rowKey="key"
					search={false}
					toolBarRender={false}
					options={false}
					pagination={false}
					size="small"
					bordered
					scroll={{ y: "calc(100vh - 200px)" }}
					{...restProps}
				/>
			</Form>
		</Drawer>
	);
}
