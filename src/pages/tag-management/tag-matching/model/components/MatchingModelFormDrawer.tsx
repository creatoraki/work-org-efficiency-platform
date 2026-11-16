import type { OrganizationTreeNode } from "#src/api/common";
import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { CheckNameParams } from "#src/api/tag-management/tag-matching/model";
import type {
	CreateMatchingModelParams,
	DefaultModelTag,
	JobPostNode,
	MatchingModelFormData,
	MatchingModelItem,
	TagWeightItem,
	UpdateMatchingModelParams,
} from "../types";
import { getJobPositionTree } from "#src/api/tag-management/rule-library";
import {
	checkName,
	createMatchingModel,
	// fetchAllRulesList, // 产品变动，暂时隐藏规则库选择功能
	fetchMatchingModelDetail,
	onlineMatchingModel,
	updateMatchingModel,
} from "#src/api/tag-management/tag-matching/model";
import { SectionTitle } from "#src/components/section-title";
import { useDict } from "#src/hooks";
import { TagsCell } from "#src/pages/personnel-archive/components/tags-cell";
import { TAG_DICT_KEYS } from "#src/pages/tag-management/config";
import { formatJobPositionNodeLabel, processJobPositionTreeData } from "#src/utils";
import {
	ProForm,
	ProFormSelect,
	ProFormText,
	ProFormTextArea,
	ProFormTreeSelect,
} from "@ant-design/pro-components";
import { useRequest } from "ahooks";
import { Button, Drawer, Form, message, theme, TreeSelect, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DefaultModelTagType } from "../types";
import MatchOrganizationModal from "./MatchOrganizationModal";
import TagWeightConfig from "./TagWeightConfig";

/** 匹配模型抽屉模式：新增、编辑、只读查看。 */
type DrawerMode = "add" | "edit" | "readonly";

interface MatchingModelTreeSelectNode extends JobPositionTreeNode {
	title: string;
	selectionLabel: string;
	children?: MatchingModelTreeSelectNode[];
}

/**
 * 初始模型详情字段。
 * 人岗匹配入口只需要带入组织和岗位主键，岗位树节点映射由模型抽屉在自身数据准备完成后再处理。
 */
type InitialModelData = Pick<
	MatchingModelItem,
	"orgId" | "orgName" | "orgLevel" | "jobPostIdList"
> & {
	/** 组织编码；用于入口侧按 code 映射真实组织节点 */
	orgCode?: string;
	/** 岗位 ID；人岗匹配入口可能传字符串编码或数字 ID */
	jobId?: string | number;
	/** 职位 ID；人岗匹配入口可能传字符串编码或数字 ID */
	postId?: string | number;
	/** 职级 ID；人岗匹配入口可能传字符串编码或数字 ID */
	postgradeId?: string | number;
};

type MatchingModelInitData = Omit<
	Partial<MatchingModelItem>,
	"jobId" | "postId" | "postgradeId" | "jobPostIdList"
> &
	Partial<InitialModelData>;

export type { InitialModelData };

interface MatchingModelFormDrawerProps {
	/** 抽屉是否可见 */
	open: boolean;
	/** 抽屉标题 */
	title: string;
	/** 抽屉模式 */
	mode: DrawerMode;
	/** 模型ID（编辑/查看模式需要） */
	modelId?: string;
	/** 组织树数据（从父组件传入，带缓存） */
	organizationTreeData?: OrganizationTreeNode | null;
	/** 初始模型详情数据（人岗匹配入口传入时，组织与岗位字段不可修改） */
	initialModelData?: Partial<InitialModelData>;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 提交成功回调 */
	onSuccess?: (result?: { modelId?: string; modelName?: string }) => void;
}

/**
 * 匹配模型表单抽屉组件。
 *
 * 支持匹配模型入口的新建/编辑/查看，也支持人岗匹配入口带入 initialModelData 后的新建/编辑。
 *
 * @param props - 抽屉属性，包含模式、模型 ID、组织树缓存、初始模型数据以及关闭/成功回调
 * @param props.open - 抽屉是否打开
 * @param props.title - 抽屉标题
 * @param props.mode - 抽屉模式；add 新建、edit 编辑、readonly 只读查看
 * @param props.modelId - 匹配模型 ID；编辑和只读查看模式下用于加载详情
 * @param props.organizationTreeData - 组织树数据；用于组织字段回显与组织名称补全
 * @param props.initialModelData - 初始模型详情数据；人岗匹配入口传入时用于初始化并锁定组织、岗位字段
 * @param props.onClose - 关闭抽屉回调
 * @param props.onSuccess - 保存成功回调；用于上层刷新匹配模型下拉数据，并在人岗入口回填新增模型 ID
 * @returns 匹配模型表单抽屉 JSX
 */
export default function MatchingModelFormDrawer({
	open,
	title,
	mode,
	modelId,
	organizationTreeData,
	initialModelData,
	onClose,
	onSuccess,
}: MatchingModelFormDrawerProps) {
	const [form] = Form.useForm<MatchingModelFormData>();
	const { token } = theme.useToken();
	const { options: organizationLevelOptions } = useDict(TAG_DICT_KEYS.ORG_LEVEL_FOR_MATCH_MODEL);

	const [defaultModelTags, setDefaultModelTags] = useState<DefaultModelTag[]>([]);
	// const [selectedRules, setSelectedRules] = useState<RuleItem[]>([]); // 产品变动，暂时隐藏规则库选择功能
	const [tagWeights, setTagWeights] = useState<TagWeightItem[]>([]);
	// const [rulesList, setRulesList] = useState<RuleItem[]>([]); // 产品变动，暂时隐藏规则库选择功能
	const [tagWeightError, setTagWeightError] = useState<string>("");
	const [readonlyJobPostTags, setReadonlyJobPostTags] = useState<string[]>([]);
	// const [detailRuleIds, setDetailRuleIds] = useState<string[]>([]); // 产品变动，暂时隐藏规则库选择功能
	const [isMatchOrgModalOpen, setIsMatchOrgModalOpen] = useState(false);
	const [selectedOrgInfo, setSelectedOrgInfo] = useState<{
		id: string | number;
		name: string;
	} | null>(null);

	const isReadonly = mode === "readonly";
	const isEdit = mode === "edit";
	// 人岗匹配入口会带入初始模型数据，此时组织和岗位字段只做回显，不允许在模型抽屉内修改。
	const isJobMatchingEntry = !!initialModelData;

	const DEFAULT_MODEL_TAGS: DefaultModelTag[] = [
		{
			id: "1",
			tagName: "默认基础标签1",
			tagType: DefaultModelTagType.BASIC,
		},
		{
			id: "2",
			tagName: "默认基础标签2",
			tagType: DefaultModelTagType.BASIC,
		},
		{
			id: "3",
			tagName: "默认基础标签3",
			tagType: DefaultModelTagType.BASIC,
		},
		{
			id: "4",
			tagName: "默认基础标签4",
			tagType: DefaultModelTagType.BASIC,
		},

		{
			id: "5",
			tagName: "能力标签1",
			tagType: DefaultModelTagType.ABILITY,
		},
		{
			id: "6",
			tagName: "能力标签2",
			tagType: DefaultModelTagType.ABILITY,
		},
	];

	const { data: jobPositionTreeData } = useRequest(getJobPositionTree, {
		ready: open,
		cacheKey: "matching-model-job-position-tree",
		cacheTime: 10 * 60 * 1000, // 10 分钟缓存保留时间
		staleTime: 10 * 60 * 1000, // 10 分钟数据新鲜时间
		onError: (error) => {
			console.error("加载岗位-职位-职级树失败:", error);
		},
	});

	// 岗位树映射用于提交时将表单中的节点 ID 还原为后端需要的完整节点对象。
	const jobPositionNodeMap = useMemo(() => {
		const nodeMap = new Map<string, JobPositionTreeNode>();
		if (jobPositionTreeData) {
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

	// TreeSelect 需要同时维护下拉展示 title 与输入框回显 selectionLabel。
	const processedTreeData = useMemo(() => {
		const buildTreeData = (nodes?: JobPositionTreeNode[]): MatchingModelTreeSelectNode[] => {
			return processJobPositionTreeData(nodes).map((node) => {
				const parentName = node.parentName ?? node.parentLabel;
				return {
					...node,
					selectionLabel:
						node.type === "position" && parentName
							? `${parentName}-${node.title}`
							: node.title,
					children: node.children?.length ? buildTreeData(node.children) : undefined,
				};
			});
		};
		return buildTreeData(jobPositionTreeData);
	}, [jobPositionTreeData]);

	const buildJobPostIdListFromIds = useCallback(
		(data: MatchingModelInitData) => {
			if (data.jobPostIdList?.length) {
				return data.jobPostIdList;
			}
			const matchedPositionNode = Array.from(jobPositionNodeMap.values()).find((node) => {
				return (
					node.type === "position" &&
					data.postId != null &&
					String(node.id) === String(data.postId) &&
					(data.postgradeId == null ||
						String(node.postGrade) === String(data.postgradeId))
				);
			});
			const selectedNode =
				matchedPositionNode ??
				(data.postId != null ? jobPositionNodeMap.get(String(data.postId)) : undefined) ??
				(data.jobId != null ? jobPositionNodeMap.get(String(data.jobId)) : undefined);
			if (!selectedNode) {
				return [];
			}
			return [
				{
					id: selectedNode.id,
					label: selectedNode.label,
					parentId: selectedNode.parentId || null,
					parentLabel: selectedNode.parentLabel || null,
					postGrade: selectedNode.postGrade ?? null,
					postGradeName: selectedNode.postGradeName ?? null,
					ethnicName: selectedNode.ethnicName ?? null,
					type: selectedNode.type,
				},
			];
		},
		[jobPositionNodeMap],
	);

	/**
	 * 使用匹配模型详情结构初始化表单。
	 * 人岗匹配入口传入的 initialModelData 与后端详情字段保持一致，因此新增和编辑都复用同一套初始化逻辑。
	 * 当 data 只包含部分字段时，只覆盖对应表单项，避免误清空名称、描述、权重等编辑态数据。
	 *
	 * @param data - 匹配模型详情或从人岗匹配入口带入的部分详情字段
	 * @returns 无返回值，直接写入表单与本地展示状态
	 */
	const initModelFormData = useCallback(
		(data: MatchingModelInitData) => {
			const resolvedJobPostIdList = buildJobPostIdListFromIds(data);
			const jobPostIdListIds = resolvedJobPostIdList.map((node: JobPostNode) => node.id);

			form.setFieldsValue({
				...(data.name !== undefined ? { name: data.name } : {}),
				...(data.remark !== undefined ? { remark: data.remark } : {}),
				...(data.orgLevel !== undefined ? { orgLevel: data.orgLevel } : {}),
				...(data.orgId !== undefined ? { orgId: data.orgId } : {}),
				...(data.orgName !== undefined ? { orgName: data.orgName } : {}),
				...(resolvedJobPostIdList.length > 0 ? { jobPostIdList: jobPostIdListIds } : {}),
			});

			if (data.weightList) {
				const weights = data.weightList.map((weight: any, index: number) => ({
					id: String(weight.id),
					tagId: String(weight.tagId),
					tagName: weight.tagName,
					weight: weight.weight,
					isVeto: weight.veto === 1,
					vetoTagValue: weight.vetoTagValue,
					order: weight.order !== undefined ? weight.order : index,
				}));
				setTagWeights(weights);
			}

			if (data.defaultBaseTag) {
				const tags = data.defaultBaseTag
					.split(",")
					.filter((tag: string) => tag.trim())
					.map((tagName: string) => ({
						id: "",
						tagName: tagName.trim(),
						tagType: DefaultModelTagType.BASIC,
					}));
				setDefaultModelTags(tags);
			}

			if (resolvedJobPostIdList.length > 0) {
				const readonlyTags = resolvedJobPostIdList.map((node: JobPostNode) => {
					return formatJobPositionNodeLabel(node);
				});
				setReadonlyJobPostTags(readonlyTags);
			} else {
				setReadonlyJobPostTags([]);
			}

			if (data.orgId) {
				setSelectedOrgInfo({
					id: data.orgId,
					name: data.orgName || "⚠️组织名称数据缺失",
				});
			} else {
				setSelectedOrgInfo(null);
			}
		},
		[buildJobPostIdListFromIds, form],
	);

	// 编辑/查看模式先加载后端详情，再与人岗入口带入的初始模型数据合并初始化。
	const { loading: loadingDetail } = useRequest(
		async (id: string) => {
			const result = await fetchMatchingModelDetail(id);
			const data = result;
			if (data) {
				initModelFormData({
					...data,
					...initialModelData,
					jobPostIdList: initialModelData?.jobPostIdList ?? data.jobPostIdList,
				});
			}
		},
		{
			ready: open && (isEdit || isReadonly) && !!modelId,
			defaultParams: [modelId!],
			onError: (error) => {
				console.error("获取模型详情失败:", error);
			},
		},
	);

	// 新增模式重置本地状态；人岗新建模式会额外用 initialModelData 初始化组织和岗位。
	useEffect(() => {
		if (open && mode === "add") {
			form.resetFields();
			// setSelectedRules([]); // 产品变动，暂时隐藏规则库选择功能
			setTagWeights([]);
			setDefaultModelTags(DEFAULT_MODEL_TAGS);
			// setDetailRuleIds([]); // 产品变动，暂时隐藏规则库选择功能
			setTagWeightError("");
			setReadonlyJobPostTags([]);
			setSelectedOrgInfo(null);
			form.setFieldsValue({
				jobPostIdList: [],
			});

			// 人岗新建模式沿用匹配模型详情初始化逻辑填充组织与岗位表单。
			if (initialModelData) {
				initModelFormData(initialModelData);
			}
		}
	}, [open, mode, form, initialModelData, initModelFormData]);

	useEffect(() => {
		if (
			!open ||
			!isJobMatchingEntry ||
			mode !== "add" ||
			!initialModelData ||
			jobPositionNodeMap.size === 0
		) {
			return;
		}
		initModelFormData(initialModelData);
	}, [initialModelData, initModelFormData, isJobMatchingEntry, jobPositionNodeMap, mode, open]);

	// 加载规则列表
	// 产品变动，暂时隐藏规则库选择功能
	// const { data: allRulesListData } = useRequest(
	// 	async () => {
	// 		const result = await fetchAllRulesList();
	// 		return result || [];
	// 	},
	// 	{
	// 		ready: open,
	// 		onError: (error) => {
	// 			console.error("获取规则列表失败:", error);
	// 		},
	// 	},
	// );

	// 规则列表加载完成后，根据详情中的 ruleIds 查找对应规则
	// 产品变动，暂时隐藏规则库选择功能
	// useEffect(() => {
	// 	if (allRulesListData) {
	// 		setRulesList(allRulesListData);

	// 		// 根据详情中的规则 ID 查找对应规则
	// 		if (detailRuleIds.length > 0) {
	// 			const matchedRules = allRulesListData.filter(rule => detailRuleIds.includes(rule.id));
	// 			setSelectedRules(matchedRules);
	// 			// 查看模式只显示已选规则
	// 			if (isReadonly) {
	// 				setRulesList(matchedRules);
	// 			}
	// 		}
	// 	}
	// }, [allRulesListData, detailRuleIds, isReadonly]);

	// 模型名称校验（必填和重名）
	const validateModelName = useCallback(
		async (_: any, value: string) => {
			if (!value || !value.trim()) {
				return Promise.reject(new Error("请输入匹配模型名称"));
			}

			const id = isEdit ? modelId : undefined;
			try {
				const params: CheckNameParams = { name: value.trim() };
				if (id) {
					params.id = Number(id);
				}
				const result = await checkName(params);
				if (result === true) {
					return Promise.reject(new Error("模型名称已存在，请使用其他名称"));
				}
				return Promise.resolve();
			} catch (error) {
				console.error("重名校验失败:", error);
				return Promise.resolve();
			}
		},
		[isEdit, modelId],
	);

	const { loading: submitting, run: submitForm } = useRequest(
		async (
			params: CreateMatchingModelParams | UpdateMatchingModelParams,
			isEditMode: boolean,
			id?: string,
		) => {
			if (isEditMode && id) {
				return await updateMatchingModel({ ...params, id });
			}
			const savedModelId = await createMatchingModel(params);
			if (isJobMatchingEntry) {
				await onlineMatchingModel(String(savedModelId));
			}
			return savedModelId;
		},
		{
			manual: true,
			onSuccess: (savedModelId, [submittedParams]) => {
				message.success(isEdit ? "更新成功" : "创建成功");
				onSuccess?.(
					savedModelId !== undefined && savedModelId !== null
						? {
								modelId: String(savedModelId),
								modelName: submittedParams?.name?.trim(),
							}
						: {
								modelName: submittedParams?.name?.trim(),
							},
				);
				onClose();
			},
			onError: (error) => {
				console.error(`${isEdit ? "更新" : "创建"}失败:`, error);
			},
		},
	);

	// 提交表单
	const handleSubmit = useCallback(async () => {
		try {
			const values = await form.validateFields();
			let hasError = false;

			// 校验标签权重
			if (!tagWeights || tagWeights.length === 0) {
				setTagWeightError("请配置标签权重");
				hasError = true;
			} else {
				// 校验一票否决标签值
				const vetoItemsWithoutValue = tagWeights.filter(
					(item) =>
						item.isVeto && (!item.vetoTagValue || item.vetoTagValue.trim() === ""),
				);
				if (vetoItemsWithoutValue.length > 0) {
					const maxDisplayCount = 1;
					let errorMessage = "请为以下标签选择一票否决的标签值：";
					if (vetoItemsWithoutValue.length <= maxDisplayCount) {
						errorMessage += vetoItemsWithoutValue
							.map((item) => item.tagName)
							.join("、");
					} else {
						const displayTags = vetoItemsWithoutValue
							.slice(0, maxDisplayCount)
							.map((item) => item.tagName)
							.join("、");
						errorMessage += `${displayTags} 等 ${vetoItemsWithoutValue.length} 个标签`;
					}
					setTagWeightError(errorMessage);
					hasError = true;
				}
				// 校验权重总和（除一票否决外必须为100%）
				else {
					const nonVetoWeight = tagWeights
						.filter((item) => !item.isVeto)
						.reduce((sum, item) => sum + item.weight, 0);

					if (nonVetoWeight !== 100) {
						setTagWeightError("差异化标签权重配置：除一票否决外现有权重总和必须为100%");
						hasError = true;
					} else {
						setTagWeightError("");
					}
				}
			}

			if (hasError) {
				return;
			}

			// 转换 jobPostIdList 为对象数组，提交接口需要完整岗位节点信息。
			const jobPostIdListIds: string[] =
				Array.isArray(values.jobPostIdList) && values.jobPostIdList.length > 0
					? values.jobPostIdList
					: [];

			const jobPostIdList: JobPostNode[] = [];
			const missingIds: string[] = [];
			jobPostIdListIds.forEach((idStr: string) => {
				const node = jobPositionNodeMap.get(idStr);
				if (node) {
					jobPostIdList.push({
						id: node.id,
						label: node.label,
						parentId: node.parentId || null,
						parentLabel: node.parentLabel || null,
						postGrade: node.postGrade,
						postGradeName: node.postGradeName,
						ethnicName: node.ethnicName ?? null,
						type: node.type,
					});
				} else {
					missingIds.push(idStr);
				}
			});

			if (missingIds.length > 0) {
				message.warning(`部分岗位职位节点未找到，已自动移除：${missingIds.join(", ")}`);
			}

			// 验证 tagId
			const invalidTagWeights = tagWeights.filter((weight) => {
				const tagId = Number(weight.tagId);
				return Number.isNaN(tagId);
			});
			if (invalidTagWeights.length > 0) {
				message.error(
					`标签ID格式不正确：${invalidTagWeights.map((w) => w.tagName).join(", ")}`,
				);
				return;
			}

			const params: CreateMatchingModelParams | UpdateMatchingModelParams = {
				name: values.name,
				remark: values.remark,
				orgLevel: values.orgLevel,
				orgId: values.orgId,
				orgName: form.getFieldValue("orgName"),
				...(jobPostIdList.length > 0 ? { jobPostIdList } : {}),
				// modelRuleIdList: selectedRules.map(rule => String(rule.id)), // 产品变动，暂时隐藏规则库选择功能
				defaultBaseTag: defaultModelTags.map((tag) => tag.tagName).join(",") || undefined,
				details: tagWeights.map((weight) => {
					// 判断是否为数据库 id（临时 id 格式为 "tag-weight-xxx"）
					let weightId: number | undefined;
					if (
						weight.id !== undefined &&
						weight.id !== null &&
						weight.id !== "" &&
						!weight.id.startsWith("tag-weight-")
					) {
						const idNum = Number(weight.id);
						if (!Number.isNaN(idNum) && String(idNum) === weight.id) {
							weightId = idNum;
						}
					}
					const tagIdNum = Number(weight.tagId);
					return {
						id: weightId,
						matchModelId: isEdit && modelId ? Number(modelId) : undefined,
						tagId: tagIdNum,
						tagName: weight.tagName,
						weight: weight.weight,
						veto: weight.isVeto ? 1 : 0,
						vetoTagValue:
							weight.isVeto && weight.vetoTagValue ? weight.vetoTagValue : undefined,
					};
				}),
			};

			submitForm(params, isEdit, modelId);
		} catch (error) {
			console.error("表单提交失败:", error);
		}
	}, [
		form,
		tagWeights,
		/* selectedRules, */ defaultModelTags,
		isEdit,
		modelId,
		submitForm,
		jobPositionNodeMap,
	]); // 产品变动，暂时隐藏规则库选择功能，移除 selectedRules 依赖

	// 构建表格数据源（规则列表扁平化）
	// 产品变动，暂时隐藏规则库选择功能
	// const tableDataSource = useMemo(() => {
	// 	return rulesList.flatMap(rule =>
	// 		rule.conditions.map((condition, condIndex) => ({
	// 			ruleId: rule.id,
	// 			ruleName: rule.ruleName,
	// 			condition,
	// 			isFirstCondition: condIndex === 0,
	// 			conditionCount: rule.conditions.length,
	// 		})),
	// 	);
	// }, [rulesList]);

	// 计算已选中的行 keys（选中规则的所有 condition 行）
	// 产品变动，暂时隐藏规则库选择功能
	// const selectedRowKeys = useMemo(() => {
	// 	return tableDataSource
	// 		.filter(record => selectedRules.some(r => r.id === record.ruleId))
	// 		.map(record => `${record.ruleId}-${record.condition.id}`);
	// }, [selectedRules, tableDataSource]);

	// 生成组织名称列表的 ReactNode（用于 tooltip 显示）
	const orgNameListTooltip = useMemo(() => {
		if (!selectedOrgInfo?.name) {
			return null;
		}
		const orgNames = selectedOrgInfo.name
			.split(",")
			.map((name) => name.trim())
			.filter((name) => name);
		if (orgNames.length === 0) {
			return null;
		}
		return (
			<div className="max-h-[300px] min-w-[200px] max-w-[400px] overflow-y-auto px-3 py-2">
				{orgNames.map((name) => (
					<div key={name} className="flex items-center py-1.5 leading-5">
						<span className="mr-3 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
						<span className="text-sm">{name}</span>
					</div>
				))}
			</div>
		);
	}, [selectedOrgInfo?.name]);

	return (
		<>
			<Drawer
				title={title}
				open={open}
				onClose={onClose}
				width="52.5rem"
				placement="right"
				closable={{ placement: "end" }}
				destroyOnHidden
				footer={
					!isReadonly && (
						<div className="flex justify-end gap-2">
							<Button onClick={onClose}>取消</Button>
							<Button
								type="primary"
								onClick={handleSubmit}
								loading={submitting || loadingDetail}
							>
								{isEdit ? "更新" : "确定"}
							</Button>
						</div>
					)
				}
			>
				<div>
					{/* 配置基础信息 */}
					<div>
						<SectionTitle title="配置基础信息" className="mb-4" />
						<ProForm<MatchingModelFormData>
							form={form}
							layout="horizontal"
							readonly={isReadonly}
							submitter={false}
							colon={false}
							labelCol={{ flex: "120px" }}
						>
							<ProFormText
								name="name"
								label="模型名称"
								placeholder="请输入模型名称"
								colProps={{ span: 8 }}
								rules={[
									{
										required: true,
										validator: validateModelName,
									},
								]}
								disabled={loadingDetail || submitting}
							/>
							<ProFormTextArea
								name="remark"
								label="模型描述"
								placeholder="请输入模型描述"
								colProps={{ span: 24 }}
								wrapperCol={{ flex: "auto" }}
								rules={[
									{ max: 300, message: "模型描述不能超过300字", type: "string" },
								]}
								fieldProps={{
									rows: 3,
									maxLength: 300,
									showCount: true,
								}}
								disabled={loadingDetail || submitting}
							/>
							{/* 组织层级字段隐藏，但保留在表单中 */}
							<ProFormSelect
								name="orgLevel"
								label="组织层级"
								placeholder="请选择组织层级"
								options={organizationLevelOptions}
								fieldProps={{
									showSearch: true,
									allowClear: true,
								}}
								rules={[{ required: true, message: "请选择匹配组织层次" }]}
								disabled={loadingDetail || submitting}
								hidden
							/>
							{/* 匹配组织字段 */}
							{isReadonly ? (
								<ProForm.Item
									label="匹配组织"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "1" }}
									required
								>
									{selectedOrgInfo ? (
										<Typography.Text
											ellipsis={{
												tooltip: orgNameListTooltip || selectedOrgInfo.name,
											}}
										>
											{selectedOrgInfo.name}
										</Typography.Text>
									) : (
										<Typography.Text type="secondary">
											请选择匹配组织
										</Typography.Text>
									)}
								</ProForm.Item>
							) : isJobMatchingEntry ? (
								<ProFormTreeSelect
									name="orgId"
									label="匹配组织"
									placeholder="请选择匹配组织"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "1" }}
									rules={[{ required: true, message: "请选择匹配组织" }]}
									fieldProps={{
										treeData: organizationTreeData
											? [organizationTreeData]
											: [],
										fieldNames: {
											label: "name",
											value: "id",
											children: "children",
										},
										showSearch: true,
										allowClear: false,
										treeNodeFilterProp: "name",
										popupMatchSelectWidth: 416,
									}}
									disabled
								/>
							) : (
								<ProForm.Item
									name="orgId"
									label="匹配组织"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "1" }}
									rules={[{ required: true, message: "请选择匹配组织" }]}
								>
									<Button
										type="default"
										onClick={() => setIsMatchOrgModalOpen(true)}
										disabled={loadingDetail || submitting}
										className="flex w-full justify-start px-3"
									>
										{selectedOrgInfo ? (
											<Typography.Text
												ellipsis={{
													tooltip:
														orgNameListTooltip || selectedOrgInfo.name,
												}}
											>
												{selectedOrgInfo.name}
											</Typography.Text>
										) : (
											<Typography.Text
												style={{ color: token.colorTextPlaceholder }}
											>
												请选择匹配组织
											</Typography.Text>
										)}
									</Button>
								</ProForm.Item>
							)}
							{isReadonly ? (
								<ProForm.Item
									label="岗位-职位-职级"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "auto" }}
									required
								>
									<TagsCell tags={readonlyJobPostTags} separator="、" />
								</ProForm.Item>
							) : isJobMatchingEntry ? (
								<ProFormTreeSelect
									name="jobPostIdList"
									label="岗位-职位-职级"
									placeholder="请选择岗位-职位-职级"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "auto" }}
									rules={[{ required: true, message: "请选择岗位-职位-职级" }]}
									fieldProps={{
										treeData: processedTreeData,
										multiple: true,
										treeCheckable: true,
										showSearch: true,
										treeNodeLabelProp: "selectionLabel",
										treeNodeFilterProp: "title",
										fieldNames: {
											label: "title",
											value: "id",
											children: "children",
										},
										allowClear: false,
										placeholder: "请选择岗位-职位-职级",
										maxTagCount: "responsive",
										showCheckedStrategy: TreeSelect.SHOW_PARENT,
									}}
									disabled
								/>
							) : (
								<ProFormTreeSelect
									name="jobPostIdList"
									label="岗位-职位-职级"
									placeholder="请选择岗位-职位-职级"
									colProps={{ span: 8 }}
									wrapperCol={{ flex: "auto" }}
									rules={[{ required: true, message: "请选择岗位-职位-职级" }]}
									fieldProps={{
										treeData: processedTreeData,
										multiple: true,
										treeCheckable: true,
										showSearch: true,
										treeNodeLabelProp: "selectionLabel",
										treeNodeFilterProp: "title",
										fieldNames: {
											label: "title",
											value: "id",
											children: "children",
										},
										allowClear: true,
										placeholder: "请选择岗位-职位-职级",
										maxTagCount: "responsive",
										showCheckedStrategy: TreeSelect.SHOW_PARENT,
									}}
									disabled={loadingDetail || submitting}
								/>
							)}
						</ProForm>
					</div>

					{/* 配置模型 */}
					<div>
						<SectionTitle title="配置模型" className="mb-4" />

						{/* 标签权重配置 */}
						<div className="mb-4">
							<div className="mb-2 flex items-center justify-start gap-2">
								<div className="flex items-center text-sm font-medium">
									<Typography.Text type="danger" className="mr-1">
										*
									</Typography.Text>
									<Typography.Text className="flex-shrink-0 text-sm font-medium">
										标签权重
									</Typography.Text>
								</div>
								{tagWeightError && (
									<Typography.Text type="danger" className="block break-words">
										{tagWeightError}
									</Typography.Text>
								)}
							</div>
							<TagWeightConfig
								value={tagWeights}
								onChange={(weights) => {
									setTagWeights(weights);
									if (tagWeightError) {
										setTagWeightError("");
									}
								}}
								readonly={isReadonly}
							/>
						</div>

						{/* 规则库选择 */}
						{/* 产品变动，暂时隐藏规则库选择功能 */}
						{/* <div className="mb-4">
							<div className="mb-2 flex items-center justify-start gap-2">
								<Typography.Text className="flex-shrink-0 text-sm font-medium">规则库选择</Typography.Text>
							</div>
							<Table
								rowKey={record => `${record.ruleId}-${record.condition.id}`}
								dataSource={tableDataSource}
								rowSelection={isReadonly ? undefined : {
									selectedRowKeys,
									onChange: (selectedKeys) => {
										// 当点击第一行时，自动选中该规则的所有条件行
										const newSelectedRuleIds = new Set<string>();

										// 从选中的行中提取规则ID（只处理第一行）
										selectedKeys.forEach((key) => {
											const keyStr = String(key);
											const record = tableDataSource.find(r =>
												r.isFirstCondition && `${r.ruleId}-${r.condition.id}` === keyStr,
											);
											if (record) {
												newSelectedRuleIds.add(record.ruleId);
											}
										});

										// 更新选中的规则列表
										const newSelectedRules = rulesList.filter(rule => newSelectedRuleIds.has(rule.id));
										setSelectedRules(newSelectedRules);
									},
									renderCell: (checked, record, index, originNode) => {
										// 只在第一行显示复选框，其他行返回 null 以实现合并效果
										if (!record.isFirstCondition) {
											return null;
										}
										return originNode;
									},
									onCell: record => ({
										rowSpan: record.isFirstCondition ? record.conditionCount : 0,
									}),
								}}
								columns={[
									{
										title: "规则名称",
										dataIndex: "ruleName",
										key: "ruleName",
										width: 150,
										onCell: record => ({
											rowSpan: record.isFirstCondition ? record.conditionCount : 0,
										}),
										render: text => text || "未命名规则",
									},
									{
										title: "具体规则",
										key: "specificRule",
										children: [
											{
												title: "组织标签",
												dataIndex: ["condition", "organizationTag"],
												key: "organizationTag",
												width: 150,
												render: text => text || "-",
											},
											{
												title: "组织标签值",
												dataIndex: ["condition", "orgTagValue"],
												key: "orgTagValue",
												width: 200,
												render: (value: string | string[] | undefined) => {
													if (!value) {
														return "-";
													}
													// 如果是数组，用逗号连接；如果是字符串，直接显示
													const displayText = Array.isArray(value)
														? (value.length > 0 ? value.join(", ") : "-")
														: (value || "-");

													if (displayText === "-") {
														return "-";
													}

													return (
														<Typography.Text
															ellipsis={{
																tooltip: displayText,
															}}
														>
															{displayText}
														</Typography.Text>
													);
												},
											},
											{
												title: "岗位",
												dataIndex: ["condition", "jobPostId"],
												key: "jobPostId",
												width: 200,
												render: (jobPostId: string | undefined) => {
													if (!jobPostId) {
														return "-";
													}
													const node = jobPositionNodeMap.get(jobPostId);
													if (!node) {
														return "-";
													}
													return formatJobPositionNodeLabel(node);
												},
											},
											{
												title: "规则结果值",
												dataIndex: ["condition", "ruleValue"],
												key: "ruleValue",
												width: 150,
												render: text => text || "-",
											},
										],
									},
								]}
								pagination={false}
								size="small"
								bordered
								scroll={{ y: 400 }}
							/>
						</div> */}

						{/* 默认模型 */}
						{/* <div className="mb-2 text-sm font-medium">
						默认模型
					</div>
					<Alert
						message="当前显示的是模拟数据（Mock），仅用于功能演示，实际数据需要对接阿里AI接口获取默认标签。"
						type="warning"
						showIcon
						className="mb-4"
					/>
					<div className="mb-4 p-4 border border-[#EBEEF5] rounded">
						<Descriptions
							column={1}
							colon={false}
							styles={{ label: { width: "100px", textAlign: "right", display: "flex", justifyContent: "flex-end" } }}
							items={[
								{
									label: "默认基础标签",
									children: (
										<TagList
											tags={defaultModelTags
												.filter(tag => !tag.tagType || tag.tagType === DefaultModelTagType.BASIC)
												.map(tag => tag.tagName)}
											tagClassName="text-xs px-2 py-0.5 rounded bg-[#EBEEF5] text-[#323233]"
											gap={8}
											maxRows={2}
											overflowMode="popover"
											popover={{
												trigger: "hover",
												title: "默认基础标签",
											}}
										/>
									),
								},
								{
									label: "能力标签",
									children: (
										<TagList
											tags={defaultModelTags
												.filter(tag => tag.tagType === DefaultModelTagType.ABILITY)
												.map(tag => tag.tagName)}
											tagClassName="text-xs px-2 py-0.5 rounded bg-[#EBEEF5] text-[#323233]"
											gap={8}
											maxRows={2}
											overflowMode="popover"
											popover={{
												trigger: "hover",
												title: "能力标签",
											}}
										/>
									),
								},
							]}
						/>
					</div> */}
					</div>
				</div>
			</Drawer>
			{/* 匹配组织选择弹窗 */}
			<MatchOrganizationModal
				open={isMatchOrgModalOpen}
				title="匹配组织"
				treeData={organizationTreeData || null}
				treeLoading={false}
				initialSelectedOrgId={form.getFieldValue("orgId") || selectedOrgInfo?.id || null}
				initialSelectedOrgLevel={form.getFieldValue("orgLevel") || null}
				onClose={(res) => {
					setIsMatchOrgModalOpen(false);
					if (res?.saved && res?.selected && res.selected.length > 0) {
						// 将所有选中的组织ID用逗号拼接
						const orgIds = res.selected
							.map((node: any) => String(node.id || node.key || ""))
							.filter((id: string) => id);
						const orgId = orgIds.join(",");
						// 将所有组织名称用逗号连接
						const orgNames = res.selected
							.map((node: any) => node.name || "")
							.filter((name: string) => name);
						const orgName = orgNames.join(",");

						// 设置表单值（orgId 为逗号拼接的字符串）
						form.setFieldValue("orgId", orgId);
						form.setFieldValue("orgName", orgName);
						// 如果有层级信息，也设置到表单中
						if (res.orgLevel) {
							form.setFieldValue("orgLevel", res.orgLevel);
						}
						// 保存选中的组织信息用于显示
						setSelectedOrgInfo({
							id: orgId,
							name: orgName,
						});
					}
				}}
			/>
		</>
	);
}
