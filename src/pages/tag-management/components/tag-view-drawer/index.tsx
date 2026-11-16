/**
 * 标签查看抽屉。
 *
 * 聚合标签中心与审核场景的只读详情展示，详情数据通过 TanStack Query 按 tagId 拉取。
 *
 * @author 王善能
 * @since 2026-06-11
 */

import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TagCenterDetailItem, TagPositionNode } from "#src/api/tag-management/tag-center";
import type { LabelDataItem } from "#src/api/tag-management/tag-center/ai-tag";
import type { DescriptionsProps } from "antd";
import type { ReactNode } from "react";
import { getJobPositionTree } from "#src/api/tag-management/rule-library";
import { fetchTagCenterDetail } from "#src/api/tag-management/tag-center";
import { fetchLabelData } from "#src/api/tag-management/tag-center/ai-tag";
import { SectionTitle } from "#src/components/section-title";
import { useDict } from "#src/hooks";
import { formatJobPositionNodeLabel } from "#src/utils";
import { CaretDownOutlined, EyeOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	ConfigProvider,
	Descriptions,
	Divider,
	Drawer,
	Form,
	Input,
	List,
	message,
	Modal,
	Popover,
	Spin,
	Steps,
	Tag,
	Typography,
} from "antd";
import { useCallback, useMemo, useState } from "react";
import { TAG_DICT_KEYS, TAG_TYPE, YES_NO } from "../../config";
import { AiTagIframeModal } from "../ai-tag-iframe-modal";
import { ViewOrgTagRuleDrawer, ViewTalentAiTagModal, ViewTalentTagRuleDrawer } from "../shared";
import {
	RULE_SOURCE_VALUES,
	TAG_DRAWER_BODY_STYLES,
	TAG_DRAWER_CONTENT_CLASS,
} from "../tag-form-drawer/constants";
import {
	buildTagGenerationIframeUrl,
	getAuditMechanismSectionTitle,
	isTalentManualTag,
	normalizeTagType,
} from "../tag-form-drawer/utils";

const { TextArea } = Input;
const EMPTY_PLACEHOLDER = "/";

/**
 * 岗位职位树 Query 缓存时间（毫秒）。
 *
 * 与标签表单抽屉保持一致，1 分钟内复用树数据，减少人员范围展示时的重复请求。
 */
const JOB_POSITION_TREE_STALE_TIME = 60 * 1000;

/**
 * 人员范围 Popover 组件。
 *
 * 人员范围条目较多时，列表首项省略展示，hover 展开完整列表。
 *
 * @param props - 组件属性
 * @param props.labels - 人员范围展示文案列表
 * @returns Popover 交互节点
 *
 * @author 王善能
 * @since 2026-06-11
 */
function PositionScopePopover({ labels }: { labels: string[] }) {
	const [isOpen, setIsOpen] = useState(false);
	const displayText = labels.slice(0, 1).join("、");

	return (
		<Popover
			content={
				<List
					size="small"
					bordered={false}
					dataSource={labels}
					renderItem={(item) => <List.Item className="!px-0 !py-1">{item}</List.Item>}
					style={{
						maxHeight: "300px",
						overflowY: "auto",
						width: "auto",
					}}
				/>
			}
			title={`共 ${labels.length} 项`}
			trigger="hover"
			placement="topLeft"
			onOpenChange={setIsOpen}
		>
			<div className="inline-flex cursor-pointer items-center gap-1">
				<Typography.Text
					ellipsis={{
						tooltip: false,
					}}
				>
					{displayText}
				</Typography.Text>
				<span className="inline-flex flex-shrink-0 items-center whitespace-nowrap text-xs text-blue-500">
					共{labels.length}
					项
					<CaretDownOutlined
						className={`text-xs text-blue-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
					/>
				</span>
			</div>
		</Popover>
	);
}

/**
 * 标签查看抽屉模式。
 *
 * - view: 标签中心查看详情
 * - audit: 标签审核（含驳回/通过操作）
 * - auditDetail: 审核详情只读
 *
 * @author 王善能
 * @since 2026-06-11
 */
export type TagViewMode = "view" | "audit" | "auditDetail";

/**
 * 标签查看抽屉组件属性。
 *
 * @author 王善能
 * @since 2026-06-11
 */
export interface TagViewDrawerProps {
	/** 是否显示抽屉 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 标签ID（根据 ID 请求详情数据） */
	tagId: string;
	/** 标签名称（外部传入） */
	tagName: string;
	/** 标签库类型（'1': 组织标签，'2': 人才标签） */
	libraryType: "1" | "2";
	/** 模式：查看详情、审核、审核详情 */
	mode: TagViewMode;
	/** 审核状态值映射（用于显示状态标签） */
	auditStatusValueMap?: Map<string, { listClass?: string | null; dictLabel?: string }>;
	/** 审核通过回调（审核模式） */
	onApprove?: () => void | Promise<void>;
	/** 提交审核回调（审核模式，用于提交审核意见） */
	onSubmitAudit?: (auditComment: string) => Promise<void>;
}

/**
 * 标签查看抽屉组件。
 *
 * 支持 view / audit / auditDetail 三种模式，详情、规则与岗位树均通过 TanStack Query 按 id 拉取，
 * 避免关闭抽屉后切换 tagId 时短暂展示上一条记录。
 *
 * @param props - 组件属性
 * @param props.open - 是否显示抽屉
 * @param props.onClose - 关闭回调
 * @param props.tagId - 标签 ID，作为详情 queryKey 的一部分
 * @param props.tagName - 标签名称（外部传入，用于抽屉标题）
 * @param props.libraryType - 标签库类型（'1': 组织标签，'2': 人才标签）
 * @param props.mode - 模式：查看详情、审核、审核详情
 * @param props.auditStatusValueMap - 审核状态值映射（用于显示状态标签）
 * @param props.onApprove - 审核通过回调（审核模式）
 * @param props.onSubmitAudit - 提交审核回调（审核模式，用于提交审核意见）
 * @returns 标签查看抽屉
 *
 * @author 王善能
 * @since 2026-06-11
 */
export function TagViewDrawer({
	open,
	onClose,
	tagId,
	tagName,
	libraryType,
	mode,
	auditStatusValueMap,
	onApprove,
	onSubmitAudit,
}: TagViewDrawerProps) {
	const { getLabel: getMaintainerRoleLabel } = useDict(TAG_DICT_KEYS.MAINTAINER_ROLE);
	const { getLabel: getTagDistributionModuleLabel } = useDict(
		TAG_DICT_KEYS.TAG_USER_DISTRIBUTION_MODULE,
		{
			staleTime: 10 * 60 * 1000, // 10 分钟数据新鲜时间
			gcTime: 10 * 60 * 1000, // 10 分钟缓存保留时间
		},
	);
	const translateRoleLabel = useCallback(
		(value?: string | null) => {
			if (value === undefined || value === null || value === "") {
				return undefined;
			}
			return getMaintainerRoleLabel(String(value)) || String(value);
		},
		[getMaintainerRoleLabel],
	);
	const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
	const [form] = Form.useForm();
	const [isViewOrgTagRuleDrawerOpen, setIsViewOrgTagRuleDrawerOpen] = useState(false);
	const [isViewAiTagResultModalOpen, setIsViewAiTagResultModalOpen] = useState(false);
	const [isViewTagRuleDrawerOpen, setIsViewTagRuleDrawerOpen] = useState(false);
	const [isViewCompositeRuleModalOpen, setIsViewCompositeRuleModalOpen] = useState(false);
	const [aiTagResultPage, setAiTagResultPage] = useState({ pageNum: 1, pageSize: 20 });

	/**
	 * 标签详情 Query。
	 *
	 * queryKey 纳入 tagId，切换查看对象时按 id 隔离 TanStack Query 缓存，
	 * 避免抽屉复用组件实例时短暂展示上一条详情。
	 */
	const {
		data: detailData,
		isLoading: detailLoading,
		isFetching: detailFetching,
	} = useQuery({
		queryKey: ["tag-management", "tag-center-detail", tagId],
		queryFn: () => fetchTagCenterDetail(tagId),
		enabled: open && !!tagId,
	});

	// 优先使用详情中的 type，详情未返回前回退到外部 libraryType
	const isOrgTag = useMemo(() => {
		if (detailData?.type) {
			return detailData.type === "1";
		}
		return libraryType === "1";
	}, [detailData, libraryType]);

	// 获取业务类别字典数据
	const businessCategoryDictKey = isOrgTag
		? TAG_DICT_KEYS.ORG_BUSINESS_CATEGORY
		: TAG_DICT_KEYS.BUSINESS_CATEGORY;
	const { getLabel: getBusinessCategoryLabel } = useDict(businessCategoryDictKey);

	/**
	 * 根据业务类别的值查找完整路径并拼接显示
	 *
	 * 业务类别编码规律：
	 * - 一级节点：dictValue 长度为 2（如：01, 02, 03...）
	 * - 二级节点：dictValue 长度为 4，以父级 dictValue 开头（如：0101）
	 * - 三级节点：dictValue 长度为 6，以父级 dictValue 开头（如：010101）
	 *
	 * @param value - 业务类别的值（如 "0101"）
	 * @returns 完整路径字符串（如 "一级/二级/三级"），如果未找到则返回 "/"
	 */
	const getBusinessCategoryFullPath = useCallback(
		(value: string | undefined): string => {
			if (!value) {
				return EMPTY_PLACEHOLDER;
			}

			const targetValue = String(value);
			const path: string[] = [];

			// 根据值的长度确定层级，从最深层开始向上查找
			// 例如：010101 -> 查找 010101, 0101, 01
			for (let len = targetValue.length; len >= 2; len -= 2) {
				const prefix = targetValue.substring(0, len);
				const label = getBusinessCategoryLabel(prefix);
				if (label) {
					path.unshift(label); // 从头部插入，保持顺序
				}
			}

			return path.length > 0 ? path.join("/") : EMPTY_PLACEHOLDER;
		},
		[getBusinessCategoryLabel],
	);

	/**
	 * 转换是否选项显示文本
	 *
	 * @param value - 是否选项值（boolean 或 YES_NO.YES/NO 字符串）
	 * @returns 显示文本（"是" 或 "否"）
	 */
	const getYesNoLabel = useCallback((value: boolean | string | undefined): string => {
		if (value === undefined || value === null) {
			return EMPTY_PLACEHOLDER;
		}
		// 支持 boolean 类型
		if (typeof value === "boolean") {
			return value ? "是" : "否";
		}
		// 支持字符串类型（向后兼容）
		return value === YES_NO.YES ? "是" : "否";
	}, []);

	/**
	 * 转换标签显隐情况显示文本
	 *
	 * @param value - 标签显隐情况值（YES_NO.YES 表示"显性"，YES_NO.NO 表示"隐形"）
	 * @returns 显示文本（"显性" 或 "隐形"）
	 */
	const getTagVisibilityLabel = useCallback((value: string | undefined): string => {
		if (!value) {
			return EMPTY_PLACEHOLDER;
		}
		return value === YES_NO.YES ? "显性" : "隐形";
	}, []);

	/**
	 * 转换标签分布模块显示文本
	 *
	 * @param value - 标签分布模块值
	 * @returns 显示文本，如果未找到则返回 "/"
	 */
	const getTagDistributionModuleLabelText = useCallback(
		(value: string | undefined): string => {
			if (!value) {
				return EMPTY_PLACEHOLDER;
			}
			return getTagDistributionModuleLabel(value) || EMPTY_PLACEHOLDER;
		},
		[getTagDistributionModuleLabel],
	);

	// 标签详情接口已返回关联规则名称，无需根据 tagRulesId 再查询一次规则详情。
	const ruleName = detailData?.tagRulesName ?? null;

	const aiTagLabelCode = detailData?.aliTagCode || undefined;
	const { data: aiTagResultPageData, isLoading: aiTagResultLoading } = useQuery({
		queryKey: [
			"tag-management",
			"ai-tag-result",
			aiTagLabelCode,
			aiTagResultPage.pageNum,
			aiTagResultPage.pageSize,
		],
		queryFn: async () => {
			if (!aiTagLabelCode) {
				return null;
			}
			return await fetchLabelData({
				labelCode: aiTagLabelCode,
				pageNum: aiTagResultPage.pageNum,
				pageSize: aiTagResultPage.pageSize,
			});
		},
		enabled: open && isViewAiTagResultModalOpen && !isOrgTag && !!aiTagLabelCode,
	});

	/**
	 * 岗位职位树 Query。
	 *
	 * 仅人才标签查看模式需要，用于将 tagPositionList 中的 id 还原为岗位-职位-职级文案。
	 */
	const { data: jobPositionTreeData = [], isLoading: jobPositionLoading } = useQuery({
		queryKey: ["tag-management", "job-position-tree"],
		queryFn: getJobPositionTree,
		enabled: !isOrgTag && mode === "view" && open,
		staleTime: JOB_POSITION_TREE_STALE_TIME,
		gcTime: JOB_POSITION_TREE_STALE_TIME,
	});

	// 构建节点 Map：id -> node，用于快速查找节点
	const jobPositionNodeMap = useMemo(() => {
		const nodeMap = new Map<string, JobPositionTreeNode>();
		if (jobPositionTreeData.length > 0) {
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
	 * 根据 id 查找节点
	 *
	 * @param id - 节点ID
	 * @returns 节点对象或 null
	 */
	const findNode = useCallback(
		(id: string): JobPositionTreeNode | null => {
			if (!id) {
				return null;
			}
			return jobPositionNodeMap.get(id) || null;
		},
		[jobPositionNodeMap],
	);

	/**
	 * 格式化人员范围显示文本
	 *
	 * 显示格式：岗位-职位-职级（例如：副总经理-技术专家-高级）
	 * 返回 ReactNode，支持省略和 Popover 显示完整列表
	 *
	 * @param tagPositionList - 岗位职位列表
	 * @returns ReactNode
	 */
	const formatPositionScope = useCallback(
		(tagPositionList: TagPositionNode[] | undefined): ReactNode => {
			if (!tagPositionList || tagPositionList.length === 0) {
				return "全部";
			}

			// 如果只有一个且 id 为 0，表示全部
			if (tagPositionList.length === 1 && String(tagPositionList[0]?.id) === "0") {
				return "全部";
			}

			// 根据 id 查找节点并拼接完整信息
			const labels: string[] = [];
			for (const item of tagPositionList) {
				if (item.id && String(item.id) !== "0") {
					const node = findNode(String(item.id));
					if (node) {
						// 根据节点类型拼接显示文本
						if (node.type === "position") {
							// 职位类型：岗位-职位-职级（不显示族群信息，族群信息属于岗位）
							const parts: string[] = [];
							// 岗位名称（父节点名称）
							if (node.parentLabel) {
								parts.push(node.parentLabel);
							}
							// 职位名称
							if (node.label) {
								parts.push(node.label);
							}
							// 职级名称
							if (node.postGradeName) {
								parts.push(node.postGradeName);
							}
							// 如果至少有一个部分，则拼接
							if (parts.length > 0) {
								labels.push(parts.join("-"));
							}
						} else if (node.type === "job") {
							// 岗位类型：如果选择了岗位，显示所有子职位
							if (node.children && node.children.length > 0) {
								node.children.forEach((child) => {
									if (child.type === "position") {
										const parts: string[] = [];
										// 岗位名称
										if (node.label) {
											parts.push(node.label);
										}
										// 职位名称
										if (child.label) {
											parts.push(child.label);
										}
										// 职级名称
										if (child.postGradeName) {
											parts.push(child.postGradeName);
										}
										if (parts.length > 0) {
											let label = parts.join("-");
											// 如果是岗位类型且有族群名称，添加族群信息（使用父节点的族群信息）
											if (node.ethnicName) {
												label = `${label}（族群：${node.ethnicName}）`;
											}
											labels.push(label);
										}
									}
								});
							} else {
								// 没有子职位，只显示岗位名称
								if (node.label) {
									labels.push(formatJobPositionNodeLabel(node));
								}
							}
						} else {
							// 其他类型，只显示节点名称（不显示族群信息）
							if (node.label) {
								labels.push(node.label);
							}
						}
					}
				}
			}

			if (labels.length === 0) {
				return "全部";
			}

			// 去重（避免重复显示）
			const uniqueLabels = Array.from(new Set(labels));

			// 如果项目数量 <= 3，直接显示文本
			if (uniqueLabels.length <= 1) {
				return <Typography.Text>{uniqueLabels.join("、")}</Typography.Text>;
			}

			// 如果项目数量 > 1，使用 Popover + List 显示完整列表
			return <PositionScopePopover labels={uniqueLabels} />;
		},
		[findNode],
	);

	// 获取审核状态标签（从 detailData 中获取审核状态）
	const auditStatusTag = useMemo(() => {
		if (mode === "audit" || mode === "auditDetail") {
			if (detailData && auditStatusValueMap) {
				const dictItem = auditStatusValueMap.get(detailData.auditStatus || "");
				if (dictItem) {
					return (
						<Tag
							color={dictItem.listClass || undefined}
							className="rounded-md px-2 py-0.5 font-medium"
						>
							{dictItem.dictLabel || detailData.auditStatusName}
						</Tag>
					);
				}
			}
		}
		return null;
	}, [mode, detailData, auditStatusValueMap]);

	/**
	 * 处理审核操作
	 *
	 * @param status - 审核状态：通过或驳回
	 */
	const handleAuditAction = useCallback(
		(status: "approved" | "rejected") => {
			if (status === "approved") {
				// 通过审核直接提交
				if (onApprove) {
					onApprove();
				}
			} else {
				// 驳回需要填写意见，显示弹窗
				setIsAuditModalOpen(true);
			}
		},
		[onApprove],
	);

	/**
	 * 提交审核
	 *
	 * 验证表单并调用审核提交回调
	 */
	const handleSubmitAudit = useCallback(async () => {
		if (!onSubmitAudit) {
			return;
		}

		try {
			const values = await form.validateFields();
			await onSubmitAudit(values.auditComment);
			setIsAuditModalOpen(false);
			form.resetFields();
		} catch (error) {
			const errorMessage = (error as any)?.message;
			if (errorMessage && !errorMessage.includes("validateFields")) {
				console.error("审核操作失败:", error);
			}
		}
	}, [form, onSubmitAudit]);

	/**
	 * 取消审核弹窗
	 *
	 * 关闭弹窗并重置表单
	 */
	const handleCancelAudit = useCallback(() => {
		setIsAuditModalOpen(false);
		form.resetFields();
	}, [form]);

	// 解析审核流程数据
	const auditSteps = useMemo(() => {
		let processData: Array<{
			stepName: string;
			approver: string | number;
			type: string;
			approverName?: string;
		}> = [];

		// 从 detailData 中获取审核流程数据（所有模式都使用 detailData）
		const auditProcessTagging = detailData?.auditProcessTagging;

		if (auditProcessTagging) {
			try {
				// 如果是字符串，解析为数组
				if (typeof auditProcessTagging === "string") {
					const parsed = JSON.parse(auditProcessTagging);
					if (Array.isArray(parsed)) {
						processData = parsed.filter(
							(item: any) =>
								item &&
								item.approver !== undefined &&
								item.approver !== null &&
								item.approver !== "",
						);
					}
				}
				// 如果已经是数组，直接使用
				else if (Array.isArray(auditProcessTagging)) {
					processData = (auditProcessTagging as any[]).filter(
						(item: any) =>
							item &&
							item.approver !== undefined &&
							item.approver !== null &&
							item.approver !== "",
					);
				}
			} catch (error) {
				console.error("解析审核流程数据失败:", error);
			}
		}

		// 如果没有数据，返回空数组
		if (processData.length === 0) {
			return [];
		}

		// 转换为 Steps 组件需要的数据格式
		const steps = processData.map((item, _index) => {
			// 获取审核人名称
			let approverName = item.approverName || "";

			// 如果是角色类型（type === "2"）且没有 approverName，尝试从角色值转换
			if (item.type === "2" && !approverName && typeof item.approver === "string") {
				approverName = translateRoleLabel(item.approver) || String(item.approver);
			}
			// 如果是人员类型（type === "1"）且没有 approverName，使用 approver 值
			else if (item.type === "1" && !approverName) {
				approverName = String(item.approver);
			}

			return {
				title: (
					<div className="flex flex-1 items-center justify-between gap-8">
						<div className="flex-shrink-0 whitespace-nowrap">{item.stepName}</div>
						<Typography.Paragraph
							ellipsis={{
								rows: 2,
								expandable: "collapsible",
							}}
							style={{
								marginBottom: 0,
								maxHeight: "8rem",
								overflowY: "auto",
							}}
						>
							{approverName || EMPTY_PLACEHOLDER}
						</Typography.Paragraph>
					</div>
				),
				status: "finish" as const,
			};
		});

		// 添加"结束"步骤
		steps.push({
			title: <span>结束</span>,
			status: "finish" as const,
		});

		return steps;
	}, [detailData, translateRoleLabel]);

	// 基础信息配置
	const basicInfoItems: DescriptionsProps["items"] = useMemo(() => {
		const isViewMode = mode === "view";
		const isAuditMode = mode === "audit" || mode === "auditDetail";

		if (!detailData || (!isViewMode && !isAuditMode)) {
			return [];
		}

		// 规范 tagType 后按类型分支，与编辑表单 basic-info-section 字段展示对齐
		const normalizedTagType = normalizeTagType(detailData.tagType);
		const isSystemTag = normalizedTagType === TAG_TYPE.SYSTEM;
		const isCustomRule =
			isSystemTag && detailData.ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
		const isFromLibrary =
			isSystemTag && detailData.ruleSelectionType === RULE_SOURCE_VALUES.FROM_LIBRARY;

		const items: DescriptionsProps["items"] = [
			{
				key: "1",
				label: "标签类型",
				children: detailData.tagTypeName || EMPTY_PLACEHOLDER,
			},
			{
				key: "1-0",
				label: "标签名称",
				children: detailData.tagName || EMPTY_PLACEHOLDER,
			},
		];

		switch (normalizedTagType) {
			case TAG_TYPE.SYSTEM:
				items.push({
					key: "1-0-1",
					label: "规则选取",
					children: isCustomRule ? "新建自定义复合规则" : "从规则库选取",
				});

				if (isFromLibrary) {
					items.push({
						key: "1-1",
						label: "选择规则",
						children: (
							<div className="flex items-center gap-2">
								<span>{ruleName || EMPTY_PLACEHOLDER}</span>
								{detailData.tagRulesId && (
									<>
										<Divider type="vertical" style={{ margin: "0 4px" }} />
										<span
											onClick={() => {
												if (isOrgTag) {
													setIsViewOrgTagRuleDrawerOpen(true);
												} else {
													setIsViewTagRuleDrawerOpen(true);
												}
											}}
											className="inline-flex cursor-pointer items-center gap-0.5 hover:opacity-80"
											style={{ color: "var(--ant-color-primary)" }}
										>
											<EyeOutlined className="h-4 w-4" />
											查看规则标签
										</span>
									</>
								)}
							</div>
						),
					});
				}

				if (isCustomRule) {
					items.push({
						key: "1-1-1",
						label: "选择规则",
						children: detailData.aliTagCode ? (
							<span
								onClick={() => {
									setIsViewCompositeRuleModalOpen(true);
								}}
								className="inline-flex cursor-pointer items-center gap-0.5 hover:opacity-80"
								style={{ color: "var(--ant-color-primary)" }}
							>
								<EyeOutlined className="h-4 w-4" />
								查看复合规则
							</span>
						) : (
							EMPTY_PLACEHOLDER
						),
					});
				}
				break;
			case TAG_TYPE.INTELLIGENT:
				items.push({
					key: "1-2",
					label: "AI标签",
					children: (
						<div className="flex items-center gap-2">
							{isAuditMode && (
								<>
									<span>
										{detailData.aiTagDescription ? "已配置" : EMPTY_PLACEHOLDER}
									</span>
									<Divider type="vertical" style={{ margin: "0 4px" }} />
								</>
							)}
							<span
								onClick={() => {
									if (isOrgTag) {
										Modal.info({
											title: "提示",
											content: "组织标签暂不支持查看 AI 标签结果",
											centered: true,
										});
									} else {
										if (!aiTagLabelCode) {
											void message.warning("暂无可查看的 AI 标签结果");
											return;
										}
										setAiTagResultPage({ pageNum: 1, pageSize: 20 });
										setIsViewAiTagResultModalOpen(true);
									}
								}}
								className="inline-flex cursor-pointer items-center gap-0.5 hover:opacity-80"
								style={{ color: "var(--ant-color-primary)" }}
							>
								<EyeOutlined className="h-4 w-4" />
								查看标签结果
							</span>
						</div>
					),
				});
				break;
			case TAG_TYPE.MANUAL:
			default:
				break;
		}

		items.push(
			{
				key: "2",
				label: "标签值",
				children: detailData.tagValue || EMPTY_PLACEHOLDER,
			},
			{
				key: "4",
				label: "标签描述",
				children: detailData.tagDescription || EMPTY_PLACEHOLDER,
			},
			{
				key: "5",
				label: "业务类别",
				children: getBusinessCategoryFullPath(detailData.businessCategory),
			},
			{
				key: "6",
				label: "是否必填",
				children: detailData.isRequiredName || EMPTY_PLACEHOLDER,
			},
			{
				key: "7",
				label: "敏感程度",
				children: detailData.sensitivityLevelName || EMPTY_PLACEHOLDER,
			},
			{
				key: "8",
				label: "到期时间",
				children: detailData.existenceCycle || EMPTY_PLACEHOLDER,
			},
			{
				key: "9",
				label: "更新频次",
				children: detailData.updateFrequencyName || EMPTY_PLACEHOLDER,
			},
		);

		return items;
	}, [detailData, mode, ruleName, isOrgTag, getBusinessCategoryFullPath]);

	// 审核机制区块标题，与编辑表单 getAuditMechanismSectionTitle 共用逻辑
	const maintenanceSectionTitle = useMemo(() => {
		if (!detailData) {
			return "标签审核";
		}
		return getAuditMechanismSectionTitle(libraryType, detailData.tagType);
	}, [detailData, libraryType]);

	// 审核机制 Descriptions 项：人才手工标签含维护人，其余仅审核人
	const maintenanceItems: DescriptionsProps["items"] = useMemo(() => {
		if (!detailData) {
			return [];
		}

		const showMaintainer = isTalentManualTag(libraryType, detailData.tagType);

		const items: DescriptionsProps["items"] = [];

		// 仅人才手工标签显示维护人
		if (showMaintainer) {
			items.push({
				key: "1",
				label: "维护人",
				children: detailData.maintainerName || EMPTY_PLACEHOLDER,
			});
		}

		// 所有标签类型都显示审核人
		items.push({
			key: "2",
			label: "审核人",
			children: detailData.auditorName || EMPTY_PLACEHOLDER,
		});

		return items;
	}, [detailData, libraryType]);

	// 打标审核机制信息配置（仅人才手工标签显示，所有模式显示相同内容）
	const auditMechanismItems: DescriptionsProps["items"] = useMemo(() => {
		if (!detailData || !isTalentManualTag(libraryType, detailData.tagType)) {
			return [];
		}

		return [
			{
				key: "1",
				label: "是否需审核",
				children: detailData.isAuditTaggingName || EMPTY_PLACEHOLDER,
			},
			{
				key: "2",
				label: "审核流程",
				children:
					auditSteps.length > 0 ? (
						<div className="rounded border p-2">
							<Steps
								size="small"
								progressDot
								direction="vertical"
								current={auditSteps.length - 1}
								items={auditSteps}
								className="w-full [&_.ant-steps-item-title]:w-full"
							/>
						</div>
					) : (
						EMPTY_PLACEHOLDER
					),
			},
			{
				key: "3",
				label: "是否附件证明",
				children: detailData.isAttProofTaggingName || EMPTY_PLACEHOLDER,
			},
			{
				key: "4",
				label: "附件证明要求",
				children: detailData.attProofReqsTagging || EMPTY_PLACEHOLDER,
			},
		];
	}, [detailData, auditSteps, libraryType]);

	// 面谈机制信息配置（仅人才手工标签显示，所有模式显示相同内容）
	const interviewItems: DescriptionsProps["items"] = useMemo(() => {
		if (!detailData || !isTalentManualTag(libraryType, detailData.tagType)) {
			return [];
		}

		const isFtfInterview = detailData.isFtfInterview === "1";
		const items: DescriptionsProps["items"] = [
			{
				key: "1",
				label: "是否需面谈",
				children: detailData.isFtfInterviewName || "否",
			},
		];

		// 如果需面谈，显示面谈更新频次和面谈人
		if (isFtfInterview) {
			items.push(
				{
					key: "2",
					label: "面谈更新频次",
					children: detailData.ftfInterviewUpdFreqName || EMPTY_PLACEHOLDER,
				},
				{
					key: "3",
					label: "面谈人",
					children: detailData.ftfInterviewer
						? translateRoleLabel(detailData.ftfInterviewer) || detailData.ftfInterviewer
						: EMPTY_PLACEHOLDER,
				},
			);
		}

		return items;
	}, [detailData, libraryType]);

	// 标签呈现信息配置（仅人才标签显示）
	const tagPresentationItems: DescriptionsProps["items"] = useMemo(() => {
		if (!detailData || isOrgTag) {
			return [];
		}

		const detailDataWithPresentation = detailData as TagCenterDetailItem & {
			isDisplayInOrgBrain?: boolean;
			tagVisibility?: string;
			tagDistributionModule?: string;
		};

		const items: DescriptionsProps["items"] = [
			{
				key: "1",
				label: "在组织大脑呈现",
				children: getYesNoLabel(detailDataWithPresentation.isDisplayInOrgBrain),
			},
		];

		// 仅在"在组织大脑呈现"为"是"时显示标签显隐情况
		if (detailDataWithPresentation.isDisplayInOrgBrain === true) {
			items.push({
				key: "2",
				label: "标签显隐情况",
				children: getTagVisibilityLabel(detailDataWithPresentation.tagVisibility),
			});

			// 仅在"标签显隐情况"为"隐形"时显示标签分布模块
			if (detailDataWithPresentation.tagVisibility === YES_NO.NO) {
				items.push({
					key: "3",
					label: "标签分布模块",
					children: getTagDistributionModuleLabelText(
						detailDataWithPresentation.tagDistributionModule,
					),
				});
			}
		}

		return items;
	}, [
		detailData,
		isOrgTag,
		getYesNoLabel,
		getTagVisibilityLabel,
		getTagDistributionModuleLabelText,
	]);

	// 人员范围展示（仅人才标签查看模式）：按 tagType 区分规则命中与树形范围
	const positionScopeContent = useMemo(() => {
		if (isOrgTag || mode !== "view" || !detailData) {
			return null;
		}

		switch (normalizeTagType(detailData.tagType)) {
			case TAG_TYPE.INTELLIGENT:
				return (
					<span style={{ color: "rgba(0, 0, 0, 0.45)" }}>以规则命中的人员范围为准</span>
				);
			case TAG_TYPE.SYSTEM:
				// 系统标签且没有 tagRulesId 时，说明是自定义复合规则
				if (!detailData.tagRulesId) {
					return (
						<span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
							以规则命中的人员范围为准
						</span>
					);
				}
				break;
			case TAG_TYPE.MANUAL:
			default:
				break;
		}

		return jobPositionLoading ? "加载中..." : formatPositionScope(detailData.tagPositionList);
	}, [isOrgTag, mode, detailData, jobPositionLoading, formatPositionScope]);

	// 抽屉标题
	const drawerTitle = useMemo(() => {
		if (mode === "audit" || mode === "auditDetail") {
			return (
				<div className="flex items-center gap-3">
					<span className="text-lg font-medium">{tagName}</span>
					{auditStatusTag}
				</div>
			);
		}
		return tagName;
	}, [mode, tagName, auditStatusTag]);

	// 抽屉 footer（仅审核模式显示）
	const drawerFooter = useMemo(() => {
		if (mode === "audit") {
			return (
				<div className="flex justify-end gap-2">
					<Button type="default" onClick={() => handleAuditAction("rejected")}>
						驳回
					</Button>
					<Button type="primary" onClick={() => handleAuditAction("approved")}>
						通过
					</Button>
				</div>
			);
		}
		return null;
	}, [mode, handleAuditAction]);

	const compositeRuleUrl = useMemo(() => {
		if (!detailData?.aliTagCode) {
			return "";
		}
		return buildTagGenerationIframeUrl(
			detailData.tagName || "",
			detailData.aliTagCode,
			"readonly",
		);
	}, [detailData?.aliTagCode, detailData?.tagName]);

	const isViewMode = mode === "view";
	// 换 id 且无对应缓存时展示 Spin，避免空窗期误显上一轮详情 DOM
	const shouldShowLoading = open && !!tagId && (detailLoading || (detailFetching && !detailData));
	const hasContent = !!detailData;

	return (
		<>
			<Drawer
				title={drawerTitle}
				placement="right"
				width="30%"
				open={open}
				onClose={onClose}
				closable={{ placement: "end" }}
				footer={drawerFooter}
				destroyOnHidden
				styles={TAG_DRAWER_BODY_STYLES}
			>
				<Spin spinning={shouldShowLoading}>
					{hasContent ? (
						<ConfigProvider
							theme={{
								components: {
									Descriptions: {
										colonMarginRight: 12,
										colonMarginLeft: 12,
									},
								},
							}}
						>
							<div className="flex h-full flex-col">
								{/* 驳回原因 banner 贴边展示 */}
								{detailData.auditComment && (
									<Alert
										banner
										message={`驳回原因：${detailData.auditComment}`}
										type="error"
										showIcon
									/>
								)}

								{/* 标签信息 */}
								<div className={`flex-1 overflow-auto ${TAG_DRAWER_CONTENT_CLASS}`}>
									{/* 基础信息 */}
									<div className="mb-6">
										<SectionTitle
											title="基础信息"
											style={{ marginBottom: 12 }}
										/>
										<Descriptions
											column={1}
											colon={false}
											styles={{
												label: {
													width: "122px",
													display: "flex",
													justifyContent: "flex-end",
												},
												content: { flex: 1 },
											}}
											items={basicInfoItems}
										/>
									</div>

									{/* 标签审核 / 标签维护与审核 */}
									{maintenanceItems.length > 0 && (
										<div className="mb-6">
											<SectionTitle
												title={maintenanceSectionTitle}
												style={{ marginBottom: 12 }}
											/>
											<Descriptions
												column={1}
												colon={false}
												styles={{
													label: {
														width: "122px",
														display: "flex",
														justifyContent: "flex-end",
													},
													content: { flex: 1 },
												}}
												items={maintenanceItems}
											/>
										</div>
									)}

									{/* 打标审核机制 */}
									{auditMechanismItems.length > 0 && (
										<div className="mb-6">
											<SectionTitle
												title="打标审核机制"
												style={{ marginBottom: 12 }}
											/>
											<Descriptions
												column={1}
												colon={false}
												styles={{
													label: {
														width: "122px",
														display: "flex",
														justifyContent: "flex-end",
													},
													content: { flex: 1 },
												}}
												items={auditMechanismItems}
											/>
										</div>
									)}

									{/* 面谈机制 */}
									{interviewItems.length > 0 && (
										<div className="mb-6">
											<SectionTitle
												title="面谈机制（无需打标审核）"
												style={{ marginBottom: 12 }}
											/>
											<Descriptions
												column={1}
												colon={false}
												styles={{
													label: {
														width: "122px",
														display: "flex",
														justifyContent: "flex-end",
													},
													content: { flex: 1 },
												}}
												items={interviewItems}
											/>
										</div>
									)}

									{/* 人员范围（仅人才标签显示） */}
									{positionScopeContent !== null && (
										<div className="mb-6">
											<SectionTitle
												title="人员范围"
												style={{ marginBottom: 12 }}
											/>
											<Descriptions
												column={1}
												colon={false}
												styles={{
													label: {
														width: "122px",
														display: "flex",
														justifyContent: "flex-end",
													},
													content: { flex: 1 },
												}}
												items={[
													{
														key: "1",
														label: "人员范围",
														children: positionScopeContent,
													},
												]}
											/>
										</div>
									)}

									{/* 标签呈现（仅人才标签显示） */}
									{tagPresentationItems.length > 0 && (
										<div className="mb-6">
											<SectionTitle title="标签呈现" className="mb-4" />
											<Descriptions
												column={1}
												colon={false}
												styles={{
													label: {
														width: "122px",
														display: "flex",
														justifyContent: "flex-end",
													},
													content: { flex: 1 },
												}}
												items={tagPresentationItems}
											/>
										</div>
									)}
								</div>
							</div>
						</ConfigProvider>
					) : (
						isViewMode && (
							<div
								className={`py-20 text-center text-gray-500 ${TAG_DRAWER_CONTENT_CLASS}`}
							>
								暂无数据
							</div>
						)
					)}
				</Spin>
			</Drawer>

			{/* 驳回审核意见弹窗 */}
			<Modal
				title={
					<>
						<span style={{ color: "#ff4d4f" }} className="mr-1">
							*
						</span>
						驳回审核
					</>
				}
				open={isAuditModalOpen}
				onOk={handleSubmitAudit}
				onCancel={handleCancelAudit}
				okText="确认"
				cancelText="取消"
				centered
			>
				<Form form={form} layout="vertical" colon={false}>
					<Form.Item
						name="auditComment"
						rules={[
							{ required: true, message: "请填写驳回原因" },
							{ max: 100, message: "驳回原因不能超过100个字符" },
						]}
					>
						<TextArea
							rows={4}
							placeholder="请输入驳回原因..."
							showCount={{
								formatter: ({ count, maxLength }) =>
									`${count}${maxLength ? `/${maxLength}` : ""}`,
							}}
							maxLength={100}
						/>
					</Form.Item>
				</Form>
			</Modal>

			{/* 查看组织系统标签抽屉 */}
			{isOrgTag && detailData && (
				<ViewOrgTagRuleDrawer
					open={isViewOrgTagRuleDrawerOpen}
					onClose={() => setIsViewOrgTagRuleDrawerOpen(false)}
					tagRuleId={detailData.tagRulesId}
				/>
			)}

			{/* 复合规则只读查看：通过 hrbrain iframe readonly 模式打开 */}
			<AiTagIframeModal
				open={isViewCompositeRuleModalOpen}
				onClose={() => setIsViewCompositeRuleModalOpen(false)}
				url={compositeRuleUrl}
				libraryType={isOrgTag ? "1" : "2"}
				title="查看复合规则"
			/>

			{/* 查看人才智能标签结果弹窗 */}
			{!isOrgTag && (
				<ViewTalentAiTagModal
					open={isViewAiTagResultModalOpen}
					onClose={() => setIsViewAiTagResultModalOpen(false)}
					tagDescription={detailData?.tagDescription}
					dataSource={(aiTagResultPageData?.list || []) as LabelDataItem[]}
					total={aiTagResultPageData?.total || 0}
					pageNum={aiTagResultPage.pageNum}
					pageSize={aiTagResultPage.pageSize}
					loading={aiTagResultLoading}
					onPageChange={(pageNum, pageSize) => {
						setAiTagResultPage({ pageNum, pageSize });
					}}
				/>
			)}

			{/* 查看人才系统标签抽屉 */}
			{!isOrgTag && detailData && (
				<ViewTalentTagRuleDrawer
					open={isViewTagRuleDrawerOpen}
					onClose={() => setIsViewTagRuleDrawerOpen(false)}
					tagRuleId={
						detailData.tagRulesId !== undefined
							? String(detailData.tagRulesId)
							: undefined
					}
					jobPositionList={
						detailData.tagPositionList && detailData.tagPositionList.length > 0
							? detailData.tagPositionList
							: [{ id: "0", type: "root" }]
					}
				/>
			)}
		</>
	);
}
