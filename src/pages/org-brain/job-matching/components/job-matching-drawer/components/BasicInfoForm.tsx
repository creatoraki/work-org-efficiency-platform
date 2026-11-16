import type { OrganizationTreeNode } from "#src/api/common";
import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { JobDescManagementItem } from "#src/pages/tag-management/job-desc/management/types";
import type {
	MatchingModelItem,
	MatchingModelListParams,
} from "#src/pages/tag-management/tag-matching/model/types";
import type { FormInstance } from "antd";
import type { DrawerMode } from "../types";
import type { JobPostTreeSelectNode } from "./job-post-tree";

import { checkJobMatchingName } from "#src/api/org-brain/job-matching";
import { fetchJobDescManagementList } from "#src/api/tag-management/job-desc/management";
import { JOB_DESC_STATUS } from "#src/pages/tag-management/job-desc/management/types";
import { cn } from "#src/utils";
import { EditOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import { ProForm, ProFormSelect, ProFormText } from "@ant-design/pro-components";
import { Divider, Form, Tooltip, TreeSelect, Typography } from "antd";
import message from "antd/es/message";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useMatchingModelRemoteOptions } from "@/pages/org-brain/hooks/useMatchingModelRemoteOptions";

import { CACHE_TIME } from "../../../config";
import { buildJobPostSelectionFields } from "./job-post-tree";

const { Link } = Typography;
const ONLINE_MATCHING_MODEL_STATUS = "1";
const EMPTY_JOB_POSITION_TREE: JobPositionTreeNode[] = [];
const EMPTY_JOB_POST_TREE_DATA: JobPostTreeSelectNode[] = [];
const EMPTY_JOB_POST_NODE_MAP = new Map<string, JobPostTreeSelectNode>();

interface BasicInfoFormProps {
	// 表单实例
	form: FormInstance;
	// 抽屉模式
	mode: DrawerMode;
	// 编辑记录 ID
	recordId?: string;
	// 组织树数据
	organizationTreeData?: OrganizationTreeNode | null;
	// 页面级岗位-职位-职级树
	jobPositionTreeData?: JobPositionTreeNode[];
	// 页面级岗位-职位-职级选择树
	jobPostTreeData?: JobPostTreeSelectNode[];
	// 页面级岗位节点索引
	jobPostNodeMap?: Map<string, JobPostTreeSelectNode>;
	// 组织变更回调
	onOrgChange: () => void;
	// 职级变更回调
	onLevelChange: () => void;
	// 匹配模型变更回调
	onModelChange: () => void;
	// 查看岗位描述回调
	onViewJobDesc: (record: JobDescManagementItem) => void;
	// 新增/更新模型回调，modelId 有值时为更新模式
	onAddModel: (modelId?: string) => void;
	// 匹配模型下拉刷新标识，变化时重新请求模型选项
	modelOptionsRefreshKey?: number;
	// 编辑态重置后，触发一次初始模型展示所需的 options hydration
	resetModelOptionsKey?: number;
	// 匹配模型下拉刷新后需要回填的模型 ID
	pendingModelId?: string;
	// 待回填模型 ID 已处理回调
	onPendingModelHandled?: () => void;
	// 是否只读
	readonly?: boolean;
	// 是否处于加载态
	loading?: boolean;
	// 查看模型回调
	onViewModel?: () => void;
}

/**
 * 基本信息表单组件
 *
 * 负责维护人岗匹配任务的基础表单输入，包括组织、岗位、职位、职级和匹配模型联动
 *
 * @param props - 基本信息表单属性
 * @param props.form - 表单实例
 * @param props.mode - 抽屉模式
 * @param props.recordId - 编辑记录 ID
 * @param props.organizationTreeData - 组织树数据
 * @param props.jobPositionTreeData - 页面级岗位-职位-职级树数据
 * @param props.jobPostTreeData - 页面级岗位-职位-职级选择树
 * @param props.jobPostNodeMap - 页面级岗位节点索引
 * @param props.onOrgChange - 组织变更回调
 * @param props.onLevelChange - 职级变更回调
 * @param props.onModelChange - 匹配模型变更回调
 * @param props.onViewJobDesc - 查看岗位描述回调
 * @param props.onAddModel - 打开匹配模型抽屉回调
 * @param props.modelOptionsRefreshKey - 匹配模型下拉刷新标识
 * @param props.resetModelOptionsKey - 编辑态重置后的模型选项恢复标识
 * @param props.pendingModelId - 待回填的匹配模型 ID
 * @param props.onPendingModelHandled - 待回填模型已处理回调
 * @param props.readonly - 是否只读
 * @param props.loading - 是否处于加载态
 * @param props.onViewModel - 查看模型回调
 * @returns 基本信息表单 JSX
 * @author 王善能
 * @since 2026-06-08
 */
function BasicInfoFormInner({
	form,
	mode,
	recordId,
	organizationTreeData,
	jobPositionTreeData = EMPTY_JOB_POSITION_TREE,
	jobPostTreeData = EMPTY_JOB_POST_TREE_DATA,
	jobPostNodeMap = EMPTY_JOB_POST_NODE_MAP,
	onOrgChange,
	onLevelChange,
	onModelChange,
	onViewJobDesc,
	onAddModel,
	modelOptionsRefreshKey = 0,
	resetModelOptionsKey = 0,
	pendingModelId,
	onPendingModelHandled,
	readonly = false,
	loading = false,
	onViewModel,
}: BasicInfoFormProps) {
	const isNameCheckEnabled = mode === "add" || mode === "edit";
	const [isModelDropdownLoading, setIsModelDropdownLoading] = useState(false);
	const organizationNodeMap = useMemo(() => {
		const nodeMap = new Map<string, OrganizationTreeNode>();
		const walk = (node?: OrganizationTreeNode | null) => {
			if (!node) {
				return;
			}
			nodeMap.set(node.code, node);
			node.children?.forEach(walk);
		};
		walk(organizationTreeData);
		return nodeMap;
	}, [organizationTreeData]);

	const isBasicInfoInitializing =
		loading ||
		!organizationTreeData ||
		jobPositionTreeData.length === 0 ||
		jobPostTreeData.length === 0 ||
		jobPostNodeMap.size === 0;

	const modelOption = Form.useWatch("modelOption", form) as
		| { value?: string; label?: string }
		| undefined;
	const modelId = modelOption?.value ? String(modelOption.value) : undefined;
	const modelName = typeof modelOption?.label === "string" ? modelOption.label : undefined;
	const formOrgCode = Form.useWatch("orgCode", form) as string | undefined;
	const formJobId = Form.useWatch("jobId", form) as string | undefined;
	const formPostId = Form.useWatch("postId", form) as string | undefined;
	const formPostgradeId = Form.useWatch("postgradeId", form) as string | undefined;
	const isBasicInfoReady = Boolean(formOrgCode && formJobId && formPostId && formPostgradeId);
	const hasSelectedModel = !!modelId;
	// 模型下拉仅在组织与岗位链路完整时才允许请求，避免无效接口调用。
	const canQueryModelOptions = useMemo(
		() => Boolean(formOrgCode && formJobId && formPostId && formPostgradeId),
		[formJobId, formOrgCode, formPostId, formPostgradeId],
	);
	const modelQueryParams = useMemo<MatchingModelListParams | undefined>(
		() =>
			canQueryModelOptions
				? {
						pageNum: 1,
						pageSize: 500,
						status: ONLINE_MATCHING_MODEL_STATUS,
						orgMatchId: String(formOrgCode),
						jobIds: [String(formJobId)],
						postIds: formPostId ? [String(formPostId)] : undefined,
						postLevelIds: formPostgradeId ? [String(formPostgradeId)] : undefined,
					}
				: undefined,
		[canQueryModelOptions, formJobId, formOrgCode, formPostId, formPostgradeId],
	);
	const {
		getDisplayOptions,
		remoteState: modelRemoteState,
		refreshOptions,
	} = useMatchingModelRemoteOptions({
		params: modelQueryParams,
		enabled: false,
		staleTime: CACHE_TIME,
		gcTime: CACHE_TIME,
	});
	const displayModelOptions = useMemo(() => {
		return getDisplayOptions(
			modelId && modelName
				? {
						id: modelId,
						name: modelName,
					}
				: undefined,
		);
	}, [getDisplayOptions, modelId, modelName]);

	useEffect(() => {
		/**
		 * 模型抽屉保存成功后的刷新分两类：
		 * 1. 有 pendingModelId 时，说明需要刷新后自动回填新模型，此场景由下方 effect 统一处理；
		 * 2. 无 pendingModelId 时，仅需刷新下拉列表。
		 *
		 * 这样可以避免“新增模型成功”同时命中两个 effect，导致重复请求同一接口。
		 */
		if (!canQueryModelOptions || modelOptionsRefreshKey === 0 || pendingModelId) {
			return;
		}
		void refreshOptions();
	}, [canQueryModelOptions, modelOptionsRefreshKey, pendingModelId, refreshOptions]);

	useEffect(() => {
		if (
			pendingModelId &&
			displayModelOptions.some(
				(option: MatchingModelItem) => String(option.id) === String(pendingModelId),
			)
		) {
			const matchedModelOption = displayModelOptions.find(
				(option: MatchingModelItem) => String(option.id) === String(pendingModelId),
			);
			const currentModelOption = form.getFieldValue("modelOption") as
				| { value?: string; label?: string }
				| undefined;
			const currentModelId = currentModelOption?.value
				? String(currentModelOption.value)
				: undefined;
			const currentModelName =
				typeof currentModelOption?.label === "string"
					? currentModelOption.label
					: undefined;
			const nextModelName = matchedModelOption?.name ?? undefined;
			const shouldNotifyModelChange =
				String(currentModelId ?? "") !== String(pendingModelId) ||
				currentModelName !== nextModelName;
			form.setFieldsValue({
				modelOption: nextModelName
					? {
							value: String(pendingModelId),
							label: nextModelName,
						}
					: undefined,
			});
			if (shouldNotifyModelChange) {
				onModelChange();
			}
			onPendingModelHandled?.();
		}
	}, [displayModelOptions, form, onModelChange, onPendingModelHandled, pendingModelId]);

	useEffect(() => {
		const currentModelOption = form.getFieldValue("modelOption") as
			| { value?: string; label?: string }
			| undefined;
		const currentModelName =
			typeof currentModelOption?.label === "string" ? currentModelOption.label : undefined;
		if (!modelId) {
			if (currentModelOption !== undefined) {
				form.setFieldValue("modelOption", undefined);
			}
			return;
		}
		const matchedModelOption = displayModelOptions.find(
			(option: MatchingModelItem) => String(option.id) === String(modelId),
		);
		const nextModelName = matchedModelOption?.name ?? currentModelName ?? undefined;
		if (nextModelName !== currentModelName) {
			form.setFieldValue("modelOption", {
				value: modelId,
				label: nextModelName ?? "",
			});
		}
	}, [displayModelOptions, form, modelId]);

	const loadDynamicModelOptions = useCallback(async () => {
		if (!canQueryModelOptions) {
			return;
		}
		setIsModelDropdownLoading(true);
		try {
			await refreshOptions();
		} catch (error) {
			console.error("获取匹配模型列表失败:", error);
			message.error("获取匹配模型列表失败，请稍后重试");
		} finally {
			setIsModelDropdownLoading(false);
		}
	}, [canQueryModelOptions, refreshOptions]);

	useEffect(() => {
		if (!pendingModelId || !canQueryModelOptions) {
			return;
		}
		void loadDynamicModelOptions();
	}, [canQueryModelOptions, loadDynamicModelOptions, pendingModelId]);

	useEffect(() => {
		const currentModelOption = form.getFieldValue("modelOption") as
			| { value?: string; label?: string }
			| undefined;
		const currentModelId = currentModelOption?.value
			? String(currentModelOption.value)
			: undefined;
		if (!resetModelOptionsKey || !canQueryModelOptions || !currentModelId) {
			return;
		}
		void loadDynamicModelOptions();
	}, [canQueryModelOptions, form, loadDynamicModelOptions, resetModelOptionsKey]);

	/**
	 * 打开岗位描述查看弹窗
	 *
	 * 只有在组织、岗位、职位和职级都已选定时，才允许按当前筛选条件查询岗位描述
	 */
	const handleViewJobDesc = useCallback(async () => {
		if (!isBasicInfoReady) {
			return;
		}
		try {
			const result = await fetchJobDescManagementList({
				pageNum: 1,
				pageSize: 1,
				deptCode: formOrgCode,
				jobId: formJobId,
				positionId: formPostId,
				postGrade: formPostgradeId,
				status: [JOB_DESC_STATUS.ONLINE],
			});
			const jobDescRecord = result.list?.[0];
			if (!jobDescRecord) {
				message.warning("未找到岗位描述");
				return;
			}
			onViewJobDesc(jobDescRecord);
		} catch (error) {
			console.error("获取岗位描述失败:", error);
			message.error("获取岗位描述失败，请稍后重试");
		}
	}, [isBasicInfoReady, onViewJobDesc, formJobId, formOrgCode, formPostId, formPostgradeId]);

	const handleOrganizationChange = useCallback(
		(value?: string) => {
			const organizationNode = value ? organizationNodeMap.get(String(value)) : undefined;
			form.setFieldsValue({
				orgCode: value,
				orgFullName: organizationNode?.fullname ?? undefined,
				orgFullPath: organizationNode?.ancestors ?? undefined,
			});
			onOrgChange();
		},
		[form, onOrgChange, organizationNodeMap],
	);

	const handleJobPostNodeChange = useCallback(
		(value?: string) => {
			const selectedNode = value ? jobPostNodeMap.get(String(value)) : undefined;
			form.setFieldsValue(buildJobPostSelectionFields(selectedNode));
			onLevelChange();
		},
		[form, jobPostNodeMap, onLevelChange],
	);

	const validateTaskName = useCallback(
		async (_: unknown, value: string) => {
			const trimmedValue = value?.trim();
			if (!trimmedValue) {
				return Promise.resolve();
			}
			if (!isNameCheckEnabled) {
				return Promise.resolve();
			}

			try {
				const isDuplicate = await checkJobMatchingName({
					id: mode === "edit" && recordId ? Number(recordId) : undefined,
					taskName: trimmedValue,
				});
				if (isDuplicate) {
					return Promise.reject(new Error("人岗匹配任务名称已存在，请重新输入"));
				}
				return Promise.resolve();
			} catch (error) {
				console.error("人岗匹配任务名称重名校验失败:", error);
				return Promise.resolve();
			}
		},
		[isNameCheckEnabled, mode, recordId],
	);

	return (
		<ProForm
			form={form}
			layout="horizontal"
			submitter={false}
			labelCol={{ flex: "8rem" }}
			colon={false}
		>
			<ProFormText
				label="人岗匹配任务名称"
				name="taskName"
				validateTrigger="onBlur"
				rules={[
					{ required: true, message: "请输入人岗匹配任务名称" },
					{ validator: validateTaskName },
				]}
				placeholder="请输入人岗匹配任务名称"
				fieldProps={{
					maxLength: 50,
					disabled: readonly || loading,
				}}
			/>

			<ProFormText name="modelSnapshot" hidden />
			<ProFormText name="modelSnapshotHash" hidden />
			<ProFormText name="orgFullName" hidden />
			<ProFormText name="orgFullPath" hidden />
			<ProFormText name="jobId" hidden />
			<ProFormText name="jobName" hidden />
			<ProFormText name="postId" hidden />
			<ProFormText name="postName" hidden />
			<ProFormText name="postgradeId" hidden />
			<ProFormText name="postgradeName" hidden />

			<Form.Item
				label="所属组织"
				name="orgCode"
				rules={[{ required: true, message: "请选择所属组织" }]}
			>
				<TreeSelect
					placeholder="请选择所属组织"
					treeData={organizationTreeData ? [organizationTreeData] : []}
					fieldNames={{ label: "name", value: "code", children: "children" }}
					showSearch
					allowClear
					disabled={readonly || isBasicInfoInitializing}
					treeNodeFilterProp="name"
					popupMatchSelectWidth={416}
					variant="outlined"
					onChange={(value) => handleOrganizationChange(value as string | undefined)}
				/>
			</Form.Item>

			<div className="flex items-start gap-3">
				<div className="min-w-0 flex-1">
					<Form.Item
						label="岗位-职位-职级"
						name="jobPostNodeValue"
						rules={[{ required: true, message: "请选择岗位-职位-职级" }]}
					>
						<TreeSelect
							placeholder="请选择岗位-职位-职级"
							treeData={jobPostTreeData}
							showSearch
							allowClear
							treeDefaultExpandAll
							treeNodeLabelProp="selectionLabel"
							treeNodeFilterProp="title"
							popupMatchSelectWidth={520}
							disabled={readonly || isBasicInfoInitializing}
							fieldNames={{
								label: "title",
								value: "value",
								children: "children",
							}}
							onChange={(value) =>
								handleJobPostNodeChange(value as string | undefined)
							}
						/>
					</Form.Item>
				</div>

				<div className="flex h-8 shrink-0 items-center gap-3">
					<Divider type="vertical" className="h-[14px] border-[#dcdfe6]" />
					<Tooltip
						title={
							loading
								? "表单初始化中，请稍候"
								: !isBasicInfoReady
									? "请先选择组织、岗位-职位-职级"
									: undefined
						}
					>
						<Link
							disabled={loading || !isBasicInfoReady}
							onClick={() => void handleViewJobDesc()}
							className={cn(
								"whitespace-nowrap",
								(loading || !isBasicInfoReady) &&
									"cursor-not-allowed !text-gray-400",
							)}
						>
							<EyeOutlined className="mr-1" />
							查看所选组织、岗位的要求描述
						</Link>
					</Tooltip>
				</div>
			</div>

			<div className="flex items-start gap-6">
				<div className="min-w-0 flex-1">
					<ProFormSelect
						label="匹配模型"
						name="modelOption"
						rules={[{ required: true, message: "请选择匹配模型" }]}
						placeholder="请选择匹配模型"
						options={displayModelOptions}
						fieldProps={{
							labelInValue: true,
							showSearch: true,
							allowClear: true,
							disabled: readonly || isBasicInfoInitializing,
							loading: isModelDropdownLoading || modelRemoteState.loading,
							fieldNames: { label: "name", value: "id" },
							optionFilterProp: "name",
							notFoundContent:
								isModelDropdownLoading || modelRemoteState.loading
									? null
									: "暂无数据",
							onChange: () => {
								onModelChange();
							},
							onOpenChange: (open) => {
								if (!open) {
									return;
								}
								if (!canQueryModelOptions || modelRemoteState.loading) {
									return;
								}
								void loadDynamicModelOptions();
							},
						}}
					/>
				</div>

				<div className="flex h-8 shrink-0 items-center gap-3">
					<Divider type="vertical" className="h-[14px] border-[#dcdfe6]" />
					<Tooltip
						title={
							loading
								? "表单初始化中，请稍候"
								: !isBasicInfoReady
									? "请先选择组织、岗位-职位-职级"
									: undefined
						}
					>
						<Link
							disabled={loading || !isBasicInfoReady}
							onClick={() => {
								if (loading || !isBasicInfoReady) {
									return;
								}
								if (readonly) {
									onViewModel?.();
									return;
								}
								onAddModel(hasSelectedModel ? modelId : undefined);
							}}
							className={cn(
								"whitespace-nowrap",
								(loading || !isBasicInfoReady) &&
									"cursor-not-allowed !text-gray-400",
							)}
						>
							{readonly ? (
								<>
									<EyeOutlined className="mr-1" />
									查看模型
								</>
							) : hasSelectedModel ? (
								<>
									<EditOutlined className="mr-1" />
									更新模型
								</>
							) : (
								<>
									<PlusOutlined className="mr-1" />
									新增模型
								</>
							)}
						</Link>
					</Tooltip>
				</div>
			</div>
		</ProForm>
	);
}

/**
 * 人岗匹配基础表单记忆化组件。
 *
 * 将候选人卡片、匹配结果等高频状态更新与基础表单渲染隔离，
 * 避免抽屉右侧候选人区变化时，左侧整块表单重复重渲染。
 *
 * @author 王善能
 * @since 2026-07-09
 */
export const BasicInfoForm = memo(BasicInfoFormInner);

BasicInfoForm.displayName = "BasicInfoForm";
