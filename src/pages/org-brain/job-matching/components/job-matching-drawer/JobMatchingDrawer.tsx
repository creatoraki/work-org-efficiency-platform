/**
 * 人岗匹配任务抽屉。
 * 负责新增/编辑人岗匹配任务，聚合基本信息、候选人匹配结果、岗位描述抽屉与匹配模型抽屉交互。
 */

import type { JobMatchingDetail, JobMatchingItem } from "#src/api/org-brain/job-matching";
import type { JobDescManagementItem } from "#src/pages/tag-management/job-desc/management/types";
import type { MatchingModelItem } from "#src/pages/tag-management/tag-matching/model/types";
import type { FormInstance } from "antd";
import type { JobPostTreeSelectNode } from "./components/job-post-tree";
import type { JobMatchingDrawerProps } from "./types";

import { fetchJobMatchingDetail } from "#src/api/org-brain/job-matching";
import { SectionTitle } from "#src/components/section-title";
import { SelectedCandidatesModal } from "#src/pages/org-brain/components";
import { JobDescDrawer } from "#src/pages/tag-management/job-desc/components/job-desc-drawer";
import { JOB_DESC_STATUS } from "#src/pages/tag-management/job-desc/management/types";
import MatchingModelFormDrawer from "#src/pages/tag-management/tag-matching/model/components/MatchingModelFormDrawer";
import MatchingModelViewDrawer from "#src/pages/tag-management/tag-matching/model/components/MatchingModelViewDrawer";
import { findOrganizationNodeByCode } from "#src/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Drawer, Empty, Form } from "antd";
import message from "antd/es/message";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { JOB_MATCHING_QUERY_KEYS } from "../../config";
import {
	BasicInfoDescriptions,
	BasicInfoForm,
	CandidateListSection,
	JobMatchingDrawerLoading,
} from "./components";
import { useJobMatchingForm } from "./hooks";

const EMPTY_JOB_POSITION_TREE: JobMatchingDrawerProps["jobPositionTreeData"] = [];
const EMPTY_JOB_POST_TREE_DATA: JobPostTreeSelectNode[] = [];
const EMPTY_JOB_POST_NODE_MAP = new Map<string, JobPostTreeSelectNode>();

interface MatchingModelEntryInitialData {
	orgCode?: string;
	orgId?: string;
	orgName?: string;
	orgLevel?: string;
	jobId?: string | number;
	postId?: string | number;
	postgradeId?: string | number;
	jobPostIdList?: MatchingModelItem["jobPostIdList"];
}

/**
 * 将列表行数据映射为查看态首屏可用的详情结构。
 *
 * 说明：列表接口已返回任务名、组织、岗位、职位、职级、模型等基础信息，
 * 可直接用于查看态首屏回显，详情接口返回后再静默覆盖为权威数据。
 *
 * @param previewData - 列表行预览数据
 * @returns 查看态首屏详情结构
 * @author 王善能
 * @since 2026-06-27
 */
function buildPreviewDetailData(
	previewData: JobMatchingItem | null | undefined,
): JobMatchingDetail | null {
	if (!previewData) {
		return null;
	}

	return {
		id: previewData.id,
		taskName: previewData.taskName,
		orgCode: previewData.orgCode,
		orgName: previewData.orgName,
		orgFullPath: previewData.orgFullPath,
		orgFullName: previewData.orgFullName,
		jobId: String(previewData.jobId ?? ""),
		jobName: previewData.jobName,
		postId: String(previewData.postId ?? ""),
		postName: previewData.postName,
		postgradeId: previewData.postgradeId ? String(previewData.postgradeId) : "",
		postgradeName: previewData.postgradeName,
		modelId: String(previewData.modelId ?? ""),
		modelName: previewData.modelName,
		modelSnapshot: previewData.modelSnapshot,
		modelSnapshotHash: previewData.modelSnapshotHash,
		modelChanged: previewData.modelChanged,
		modelOnline: previewData.modelOnline,
		aiRequestId: previewData.aiRequestId,
		matchRound: previewData.matchRound,
		lastMatchTime: previewData.lastMatchTime,
		candidate: previewData.candidate,
		candidateName: previewData.candidateName,
		matchScore: previewData.matchScore,
		operatorAccount: previewData.operatorAccount,
		operatorName: previewData.operatorName,
		createBy: previewData.createBy,
		createTime: previewData.createTime,
		updateBy: previewData.updateBy,
		updateTime: previewData.updateTime,
		selectedCandidate: undefined,
		candidateList: previewData.candidates ?? [],
	};
}

interface JobMatchingActionBarProps {
	form: FormInstance;
	isModelOffline: boolean;
	canResetToInitialState: boolean;
	onExecuteMatch: () => Promise<void>;
	onReset: () => void;
}

/**
 * 人岗匹配操作区。
 *
 * 将结果匹配、重置与保存前置校验所依赖的表单监听下沉到独立子组件，
 * 避免主抽屉因为输入任务名、组织或岗位链路变化而整块重渲染。
 *
 * @param props - 操作区属性
 * @param props.form - 抽屉表单实例
 * @param props.isModelOffline - 当前模型是否已下线
 * @param props.canResetToInitialState - 当前会话是否允许恢复到初始态
 * @param props.onExecuteMatch - 执行结果匹配回调
 * @param props.onReset - 重置表单与候选人结果回调
 * @returns 操作区 JSX
 * @author 王善能
 * @since 2026-07-10
 */
function JobMatchingActionBar({
	form,
	isModelOffline,
	canResetToInitialState,
	onExecuteMatch,
	onReset,
}: JobMatchingActionBarProps) {
	const orgCode = Form.useWatch("orgCode", form) as string | undefined;
	const jobId = Form.useWatch("jobId", form) as string | undefined;
	const postId = Form.useWatch("postId", form) as string | undefined;
	const postgradeId = Form.useWatch("postgradeId", form) as string | undefined;
	const modelOption = Form.useWatch("modelOption", form) as
		| { value?: string; label?: string }
		| undefined;
	const isBasicInfoReady = Boolean(orgCode && jobId && postId && postgradeId);
	const hasSelectedModel = Boolean(modelOption?.value);
	const isMatchDisabled = !isBasicInfoReady || !hasSelectedModel || isModelOffline;

	return (
		<div className="flex justify-end gap-2">
			<Button type="primary" disabled={isMatchDisabled} onClick={onExecuteMatch}>
				结果匹配
			</Button>
			<Button disabled={!canResetToInitialState} onClick={onReset}>
				重置
			</Button>
		</div>
	);
}

interface JobMatchingFooterProps {
	form: FormInstance;
	isEdit: boolean;
	isDictionaryReady: boolean;
	isMatching: boolean;
	isEditCandidateReady: boolean;
	hasMatched: boolean;
	selectedCandidateCount: number;
	onClose: () => void;
	onSave: () => void;
}

/**
 * 抽屉底部操作区。
 *
 * 保存按钮的禁用态仅依赖表单基础字段和候选人选择结果，
 * 因此将 watch 下沉到 footer，避免主抽屉树因输入字段变化而整体重渲染。
 *
 * @param props - footer 属性
 * @param props.form - 抽屉表单实例
 * @param props.isEdit - 是否编辑模式
 * @param props.isDictionaryReady - 页面级字典是否已就绪
 * @param props.isMatching - 当前是否正在执行结果匹配
 * @param props.isEditCandidateReady - 编辑态候选人区是否已完成详情 hydration
 * @param props.hasMatched - 当前会话是否已有匹配结果
 * @param props.selectedCandidateCount - 当前已选候选人数
 * @param props.onClose - 关闭抽屉回调
 * @param props.onSave - 保存回调
 * @returns footer JSX
 * @author 王善能
 * @since 2026-07-10
 */
function JobMatchingFooter({
	form,
	isEdit,
	isDictionaryReady,
	isMatching,
	isEditCandidateReady,
	hasMatched,
	selectedCandidateCount,
	onClose,
	onSave,
}: JobMatchingFooterProps) {
	const taskName = Form.useWatch("taskName", form) as string | undefined;
	const orgCode = Form.useWatch("orgCode", form) as string | undefined;
	const jobId = Form.useWatch("jobId", form) as string | undefined;
	const postId = Form.useWatch("postId", form) as string | undefined;
	const postgradeId = Form.useWatch("postgradeId", form) as string | undefined;
	const modelOption = Form.useWatch("modelOption", form) as
		| { value?: string; label?: string }
		| undefined;
	const isBasicInfoReady = Boolean(orgCode && jobId && postId && postgradeId);
	const hasSelectedModel = Boolean(modelOption?.value);
	const isSaveDisabled =
		isMatching ||
		!isDictionaryReady ||
		!taskName?.trim() ||
		!orgCode ||
		!isBasicInfoReady ||
		!hasSelectedModel ||
		selectedCandidateCount === 0 ||
		(isEdit && !isEditCandidateReady && !hasMatched);

	return (
		<div className="flex justify-end gap-2">
			<Button onClick={onClose}>取消</Button>
			<Button type="primary" disabled={isSaveDisabled} onClick={onSave}>
				保存
			</Button>
		</div>
	);
}

/**
 * 人岗匹配任务抽屉组件。
 *
 * @param props - 抽屉属性，包含打开状态、编辑模式、任务记录 ID 以及保存/查看档案回调
 * @param props.open - 抽屉是否打开
 * @param props.mode - 抽屉模式；新增时不加载详情，编辑时按 recordId 获取任务详情
 * @param props.recordId - 人岗匹配任务记录 ID；编辑模式下用于加载详情
 * @param props.initialPreviewData - 列表行预览数据，用于详情接口返回前的稳定展示
 * @param props.organizationTreeData - 页面级组织树缓存
 * @param props.organizationTreeLoading - 页面级组织树是否仍在初始化
 * @param props.jobPositionTreeData - 页面级岗位-职位-职级树缓存
 * @param props.jobPostTreeData - 页面级岗位-职位-职级选择树
 * @param props.jobPostNodeMap - 页面级岗位节点索引
 * @param props.jobPositionTreeLoading - 页面级岗位-职位-职级树是否仍在初始化
 * @param props.detailReloadKey - 详情主动刷新标识；变化时重新拉取详情接口
 * @param props.onClose - 关闭抽屉回调
 * @param props.onDetailChange - 详情加载完成后回传当前权威详情
 * @param props.onSave - 保存任务回调，接收当前表单值与已选候选人
 * @param props.onViewArchive - 查看候选人人员档案回调
 * @returns 人岗匹配任务抽屉 JSX
 */
export function JobMatchingDrawer({
	open,
	mode,
	recordId,
	initialPreviewData,
	organizationTreeData: pageOrganizationTreeData,
	organizationTreeLoading: _organizationTreeLoading = false,
	jobPositionTreeData = EMPTY_JOB_POSITION_TREE,
	jobPostTreeData = EMPTY_JOB_POST_TREE_DATA,
	jobPostNodeMap = EMPTY_JOB_POST_NODE_MAP,
	jobPositionTreeLoading: _jobPositionTreeLoading = false,
	onClose,
	onSave,
	onViewArchive,
	detailReloadKey = 0,
	onDetailChange,
}: JobMatchingDrawerProps) {
	const [form] = Form.useForm();
	const [isJobDescOpen, setIsJobDescOpen] = useState(false);
	const [isSelectedCandidatesModalOpen, setIsSelectedCandidatesModalOpen] = useState(false);
	const [isMatchingModelDrawerOpen, setIsMatchingModelDrawerOpen] = useState(false);
	const [isMatchingModelViewDrawerOpen, setIsMatchingModelViewDrawerOpen] = useState(false);
	const [matchingModelDrawerMode, setMatchingModelDrawerMode] = useState<"add" | "edit">("add");
	const [editingModelId, setEditingModelId] = useState<string | undefined>(undefined);
	const [matchingModelInitialData, setMatchingModelInitialData] =
		useState<MatchingModelEntryInitialData>();
	const [jobDescRecord, setJobDescRecord] = useState<JobDescManagementItem | null>(null);
	const [modelOptionsRefreshKey, setModelOptionsRefreshKey] = useState(0);
	const [pendingModelId, setPendingModelId] = useState<string | undefined>(undefined);
	const queryClient = useQueryClient();
	const isAdd = mode === "add";
	const isEdit = mode === "edit";
	const isView = mode === "view";

	const previewDetailData = useMemo(() => {
		return buildPreviewDetailData(initialPreviewData);
	}, [initialPreviewData]);
	const [detailData, setDetailData] = useState<JobMatchingDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState<unknown>(null);
	const loadedDetailKeyRef = useRef<string | null>(null);
	const detailRequestKey = useMemo(
		() => `${mode}:${recordId ?? ""}:${detailReloadKey}`,
		[detailReloadKey, mode, recordId],
	);
	const isDetailAuthoritative = Boolean(detailData);
	const isDetailError = Boolean(detailError);
	const isDetailFetching = detailLoading;

	/**
	 * 抽屉详情采用“会话内本地状态 + 打开时请求”的标准写法。
	 *
	 * 1. 首页点击后立即打开抽屉，不在外层做详情预热；
	 * 2. 编辑/查看每次打开都按 recordId 独立拉取详情；
	 * 3. Query 仅负责列表、搜索项与下拉类请求，不接管抽屉详情会话态。
	 */
	useEffect(() => {
		if (!open || !recordId || isAdd || !(isEdit || isView)) {
			return;
		}
		if (loadedDetailKeyRef.current === detailRequestKey) {
			return;
		}

		loadedDetailKeyRef.current = detailRequestKey;
		let cancelled = false;
		setDetailData(null);

		if (isView && previewDetailData) {
			onDetailChange?.(previewDetailData);
		} else {
			onDetailChange?.(null);
		}

		setDetailLoading(true);
		setDetailError(null);

		void fetchJobMatchingDetail(recordId)
			.then((data) => {
				if (cancelled) {
					return;
				}
				setDetailData(data);
				onDetailChange?.(isView ? data : null);
			})
			.catch((error) => {
				if (cancelled) {
					return;
				}
				setDetailError(error);
			})
			.finally(() => {
				if (!cancelled) {
					setDetailLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [
		detailRequestKey,
		isAdd,
		isEdit,
		isView,
		onDetailChange,
		open,
		previewDetailData,
		recordId,
	]);

	const hasJobPositionTreeData = (jobPositionTreeData?.length ?? 0) > 0;
	const hasJobPostTreeData = (jobPostTreeData?.length ?? 0) > 0;
	const hasJobPostNodeMap = (jobPostNodeMap?.size ?? 0) > 0;
	const isDictionaryReady =
		Boolean(pageOrganizationTreeData) &&
		hasJobPositionTreeData &&
		hasJobPostTreeData &&
		hasJobPostNodeMap;
	// 字典数据由列表页统一预加载并通过 props 注入；抽屉内仅判断数据是否已到位，不重复请求。
	const isAddInitReady = isDictionaryReady;
	const isEditInitReady =
		isDictionaryReady && Boolean(isDetailAuthoritative ? detailData : initialPreviewData);
	const canResetToInitialState = isAdd || Boolean(initialPreviewData) || isDetailAuthoritative;

	// 聚合人岗匹配表单联动逻辑，包括组织、岗位、职位、职级及候选人结果状态。
	const {
		candidates,
		selectedCandidate,
		selectedCandidates,
		hasMatched,
		isMatching,
		matchErrorMessage,
		handleOrgChange,
		handleLevelChange,
		handleModelChange,
		handleExecuteMatch,
		handleReset,
		resetModelOptionsKey,
		handleSelectCandidate,
		handleDeselectCandidate,
		isEditCandidateReady,
	} = useJobMatchingForm({
		form,
		mode,
		open,
		canResetToInitialState,
		canInitializeForm:
			mode === "add" ? isAddInitReady : mode === "edit" ? isEditInitReady : false,
		initialData: isEdit || isView ? (isDetailAuthoritative ? detailData : null) : null,
		previewData: initialPreviewData,
		organizationTreeData: pageOrganizationTreeData,
	});

	// 岗位描述抽屉只负责展示当前基本信息对应的岗位说明，不改变人岗匹配主表单。
	const handleViewJobDesc = useCallback((record: JobDescManagementItem) => {
		setJobDescRecord(record);
		setIsJobDescOpen(true);
	}, []);

	const handleFetchJobDesc = useCallback(async () => {
		const currentDetail = detailData ?? previewDetailData;
		const currentOrgCode = currentDetail?.orgCode;
		const currentJobId = currentDetail?.jobId;
		const currentPostId = currentDetail?.postId;
		const currentPostgradeId = currentDetail?.postgradeId;

		if (!currentOrgCode || !currentJobId || !currentPostId || !currentPostgradeId) {
			return null;
		}
		try {
			const { fetchJobDescManagementList } =
				await import("#src/api/tag-management/job-desc/management");
			const result = await fetchJobDescManagementList({
				pageNum: 1,
				pageSize: 1,
				deptCode: String(currentOrgCode),
				jobId: String(currentJobId),
				positionId: String(currentPostId),
				postGrade: String(currentPostgradeId),
				status: [JOB_DESC_STATUS.ONLINE],
			});
			const jobDesc = result.list?.[0] ?? null;
			if (!jobDesc) {
				message.warning("未找到岗位描述");
			}
			return jobDesc;
		} catch (error) {
			console.error("获取岗位描述失败:", error);
			message.error("获取岗位描述失败，请稍后重试");
			return null;
		}
	}, [
		detailData?.jobId,
		detailData?.orgCode,
		detailData?.postId,
		detailData?.postgradeId,
		previewDetailData?.jobId,
		previewDetailData?.orgCode,
		previewDetailData?.postId,
		previewDetailData?.postgradeId,
	]);

	// 只有基本信息可映射为匹配模型详情字段时，才允许从人岗入口打开匹配模型抽屉。
	const handleOpenModelForm = useCallback(
		(modelId?: string) => {
			const values = form.getFieldsValue(["orgCode", "jobId", "postId", "postgradeId"]) as {
				orgCode?: string;
				jobId?: string;
				postId?: string;
				postgradeId?: string;
			};
			if (!values.orgCode || !values.jobId || !values.postId || !values.postgradeId) {
				return;
			}
			// 魔法值说明：SYS 为匹配模型“自定义组织层级”字典值；人岗匹配入口只带入单个组织节点，应按自定义组织提交。
			const organizationNode = findOrganizationNodeByCode(
				pageOrganizationTreeData,
				values.orgCode,
			);
			setMatchingModelInitialData({
				orgCode: organizationNode?.code ? String(organizationNode.code) : values.orgCode,
				orgId: organizationNode?.id ? String(organizationNode.id) : undefined,
				orgName: organizationNode?.name,
				orgLevel: "SYS",
				jobId: Number(values.jobId),
				postId: Number(values.postId),
				postgradeId: Number(values.postgradeId),
			});
			if (modelId) {
				setMatchingModelDrawerMode("edit");
				setEditingModelId(modelId);
			} else {
				setMatchingModelDrawerMode("add");
				setEditingModelId(undefined);
			}
			setIsMatchingModelDrawerOpen(true);
		},
		[form, pageOrganizationTreeData],
	);

	// 匹配模型保存并上线成功后，先刷新下拉选项；待下拉查到新模型后再回填。
	const handleModelFormSuccess = useCallback(
		(result?: { modelId?: string; modelName?: string }) => {
			setIsMatchingModelDrawerOpen(false);
			const modelId = result?.modelId;
			if (modelId) {
				form.setFieldValue("modelOption", {
					value: String(modelId),
					label: result?.modelName ?? "",
				});
				setPendingModelId(modelId);
				handleModelChange();
			}
			queryClient.invalidateQueries({ queryKey: JOB_MATCHING_QUERY_KEYS.searchOptions });
			queryClient.invalidateQueries({ queryKey: JOB_MATCHING_QUERY_KEYS.modelOptionsRoot });
			setModelOptionsRefreshKey((prev) => prev + 1);
		},
		[form, handleModelChange, queryClient],
	);

	/**
	 * 清理当前抽屉会话中的局部弹层与暂存状态。
	 *
	 * 主抽屉关闭后，下次重新打开应回到干净会话，避免查看态、新增态和编辑态之间出现状态串扰。
	 */
	const resetDrawerSessionState = useCallback(() => {
		setIsJobDescOpen(false);
		setIsSelectedCandidatesModalOpen(false);
		setIsMatchingModelDrawerOpen(false);
		setIsMatchingModelViewDrawerOpen(false);
		setMatchingModelDrawerMode("add");
		setEditingModelId(undefined);
		setMatchingModelInitialData(undefined);
		setJobDescRecord(null);
		setPendingModelId(undefined);
	}, []);

	/**
	 * 关闭主抽屉前，先统一清理当前会话的局部状态。
	 */
	const handleDrawerClose = useCallback(() => {
		resetDrawerSessionState();
		onClose();
	}, [onClose, resetDrawerSessionState]);
	const handleOpenSelectedCandidatesModal = useCallback(() => {
		setIsSelectedCandidatesModalOpen(true);
	}, []);
	const handleCloseSelectedCandidatesModal = useCallback(() => {
		setIsSelectedCandidatesModalOpen(false);
	}, []);
	const handleOpenMatchingModelViewDrawer = useCallback(() => {
		setIsMatchingModelViewDrawerOpen(true);
	}, []);
	const handleCloseMatchingModelViewDrawer = useCallback(() => {
		setIsMatchingModelViewDrawerOpen(false);
	}, []);
	const handlePendingModelHandled = useCallback(() => {
		setPendingModelId(undefined);
	}, []);

	/**
	 * 重置主表单前，先清理待回填模型，避免异步回写覆盖单一基线 owner 恢复出的编辑态。
	 */
	const handleFormReset = useCallback(() => {
		setPendingModelId(undefined);
		handleReset();
	}, [handleReset]);

	useEffect(() => {
		if (!open) {
			resetDrawerSessionState();
			loadedDetailKeyRef.current = null;
			setDetailData(null);
			setDetailLoading(false);
			setDetailError(null);
			onDetailChange?.(null);
		}
	}, [onDetailChange, open, resetDrawerSessionState]);

	// 新增态：页面级字典未就绪前，不展示禁用表单，统一走抽屉 loading 态。
	const isAddDrawerInitializing = open && isAdd && !isDictionaryReady;
	const isEditDrawerInitializing = open && isEdit && !isDictionaryReady;
	const displayDetailData = isView ? (detailData ?? previewDetailData ?? null) : detailData;
	const currentModelOption = Form.useWatch("modelOption", form) as
		| { value?: string; label?: string }
		| undefined;
	const currentModelId = currentModelOption?.value ? String(currentModelOption.value) : "";
	const initialModelId = detailData?.modelId ? String(detailData.modelId) : "";
	/**
	 * 编辑态模型提示与禁用态只对“当前仍在使用详情初始模型”的场景生效。
	 *
	 * 当用户已经切换为其他模型时，旧详情里的 offline / changed 标记不应继续影响
	 * 当前表单的结果匹配能力与提示展示。
	 */
	const currentModelGuardState = useMemo(() => {
		const isUsingInitialModel =
			isEdit && Boolean(initialModelId) && currentModelId === initialModelId;
		return {
			isUsingInitialModel,
			isOffline: isUsingInitialModel && detailData?.modelOnline === false,
			isChanged: isUsingInitialModel && detailData?.modelChanged === true,
		};
	}, [currentModelId, detailData?.modelChanged, detailData?.modelOnline, initialModelId, isEdit]);
	const isModelOffline = currentModelGuardState.isOffline;
	const isModelChanged = currentModelGuardState.isChanged;
	const canViewJobDesc = Boolean(
		isView &&
		displayDetailData?.jobId &&
		displayDetailData?.postId &&
		displayDetailData?.postgradeId,
	);
	const drawerTitle = isView
		? detailData?.taskName || previewDetailData?.taskName || "查看"
		: isEdit
			? "编辑"
			: "新增";
	const shouldShowDetailLoading =
		open &&
		(isAddDrawerInitializing ||
			(isView && !detailError && !detailData && !previewDetailData) ||
			isEditDrawerInitializing ||
			(isEdit && detailLoading && !initialPreviewData));
	const isEditCandidateLoading =
		isEdit && open && !isEditCandidateReady && !hasMatched && !isDetailError;
	const editCandidateErrorMessage =
		isEdit && isDetailError && !isEditCandidateReady
			? detailError instanceof Error
				? detailError.message
				: "候选人详情加载失败，请稍后重试"
			: undefined;
	const hasAuthoritativeDetail = isDetailAuthoritative && Boolean(detailData);
	const isViewDetailReady = isView && Boolean(displayDetailData);
	const viewDetailData = isView ? (displayDetailData ?? null) : null;
	const fallbackViewSelectedCandidates = useMemo(() => {
		if (!hasAuthoritativeDetail || !detailData?.selectedCandidate) {
			return [];
		}
		return [detailData.selectedCandidate];
	}, [detailData, hasAuthoritativeDetail]);
	const viewCandidates = useMemo(() => {
		if (!hasAuthoritativeDetail) {
			return [];
		}
		const candidateList = detailData?.candidateList ?? [];
		if (candidateList.length > 0) {
			return candidateList;
		}
		return fallbackViewSelectedCandidates;
	}, [detailData?.candidateList, fallbackViewSelectedCandidates, hasAuthoritativeDetail]);
	const viewSelectedCandidates = useMemo(() => {
		if (!hasAuthoritativeDetail || !detailData) {
			return [];
		}
		const selectedByFlag = viewCandidates.filter((item) => item.isSelected);
		if (selectedByFlag.length > 0) {
			return selectedByFlag;
		}
		return fallbackViewSelectedCandidates;
	}, [detailData, fallbackViewSelectedCandidates, hasAuthoritativeDetail, viewCandidates]);
	const displayCandidates = isView ? viewCandidates : candidates;
	const displaySelectedCandidates = isView ? viewSelectedCandidates : selectedCandidates;
	const displayHasMatched = isView ? viewCandidates.length > 0 : hasMatched;
	// 查看态候选人区域必须等待详情接口权威数据；预览数据仅用于基本信息，避免短暂误显示「暂无数据」。
	const isViewCandidateLoading =
		isView && open && !hasAuthoritativeDetail && (detailLoading || isDetailFetching);
	const viewCandidateErrorMessage =
		isView && !isViewCandidateLoading && isDetailError
			? detailError instanceof Error
				? detailError.message
				: "候选人详情加载失败，请稍后重试"
			: undefined;
	const candidateErrorMessage = isView
		? viewCandidateErrorMessage
		: (matchErrorMessage ?? editCandidateErrorMessage);

	// 保存表单
	const handleSave = useCallback(async () => {
		/**
		 * 保存动作的兜底保护。
		 *
		 * 即使按钮联动失效，也不允许在字典未就绪、编辑态候选人详情未完成 hydration，
		 * 或尚未勾选候选人的情况下提交半成品数据。
		 */
		if (
			isMatching ||
			!isDictionaryReady ||
			(isEdit && !isEditCandidateReady && !hasMatched) ||
			selectedCandidates.length === 0
		) {
			return;
		}

		try {
			const values = await form.validateFields();
			const modelOption = values.modelOption as
				| { value?: string; label?: string }
				| undefined;
			onSave?.({
				taskName: values.taskName,
				orgCode: values.orgCode,
				orgFullPath: values.orgFullPath,
				orgFullName: values.orgFullName,
				jobId: values.jobId,
				jobName: values.jobName,
				postId: values.postId,
				postName: values.postName,
				postgradeId: values.postgradeId,
				postgradeName: values.postgradeName,
				modelId: modelOption?.value ? String(modelOption.value) : "",
				modelName: typeof modelOption?.label === "string" ? modelOption.label : undefined,
				modelSnapshot: values.modelSnapshot,
				modelSnapshotHash: values.modelSnapshotHash,
				refreshModelSnapshot: values.refreshModelSnapshot,
				id: isEdit ? (detailData?.id ?? recordId ?? undefined) : undefined,
				candidateList: candidates,
				selectedCandidates,
				selectedCandidate,
			});
		} catch (error) {
			console.error("表单验证失败:", error);
		}
	}, [
		candidates,
		detailData,
		form,
		isDictionaryReady,
		isMatching,
		isEdit,
		isEditCandidateReady,
		hasMatched,
		onSave,
		recordId,
		selectedCandidate,
		selectedCandidates,
	]);

	return (
		<>
			<Drawer
				title={drawerTitle}
				placement="right"
				width={1000}
				open={open}
				destroyOnHidden
				onClose={handleDrawerClose}
				closable={{ placement: "end" }}
				styles={{
					body: {
						padding: 0,
						overflow: "hidden",
					},
					footer: {
						position: "relative",
						zIndex: 2,
						background: "#fff",
					},
				}}
				footer={
					isView || shouldShowDetailLoading ? null : (
						<JobMatchingFooter
							form={form}
							isEdit={isEdit}
							isDictionaryReady={isDictionaryReady}
							isMatching={isMatching}
							isEditCandidateReady={isEditCandidateReady}
							hasMatched={hasMatched}
							selectedCandidateCount={selectedCandidates.length}
							onClose={handleDrawerClose}
							onSave={() => void handleSave()}
						/>
					)
				}
			>
				{shouldShowDetailLoading ? (
					<JobMatchingDrawerLoading isViewMode={isView} />
				) : (
					<div className="flex h-full min-w-0 flex-col">
						{!isView && (
							<div className="space-y-2">
								<Alert
									type="info"
									showIcon
									banner
									message='请先选择"所属组织""岗位-职位-职级"，再配置"匹配模型"'
								/>
								{isModelOffline ? (
									<Alert
										type="warning"
										showIcon
										banner
										message="提醒：该模型已下线，请至「标签管理-标签匹配配置-匹配模型」中上线后使用"
									/>
								) : null}
								{isModelChanged ? (
									<Alert
										type="warning"
										showIcon
										banner
										message="提醒：该模型已经被匹配配置变更，请查看模型，确认后再开始匹配"
									/>
								) : null}
							</div>
						)}
						<div className="shrink-0 px-6 pt-6">
							{/* 人岗匹配基本信息 */}
							<div className="mb-4">
								{isViewDetailReady && viewDetailData ? (
									<BasicInfoDescriptions
										data={viewDetailData}
										canViewJobDesc={canViewJobDesc}
										onFetchJobDesc={handleFetchJobDesc}
										onViewJobDesc={handleViewJobDesc}
										onViewModel={handleOpenMatchingModelViewDrawer}
									/>
								) : isView ? (
									<Empty
										description={
											detailError instanceof Error
												? detailError.message
												: "未获取到详情数据"
										}
									/>
								) : (
									<>
										<SectionTitle title="人岗匹配基本信息" className="mb-6" />

										<BasicInfoForm
											form={form}
											mode={mode}
											recordId={recordId ?? undefined}
											loading={!isDictionaryReady}
											organizationTreeData={pageOrganizationTreeData}
											jobPositionTreeData={jobPositionTreeData}
											jobPostTreeData={jobPostTreeData}
											jobPostNodeMap={jobPostNodeMap}
											onOrgChange={handleOrgChange}
											onLevelChange={handleLevelChange}
											onModelChange={handleModelChange}
											onViewJobDesc={handleViewJobDesc}
											onAddModel={handleOpenModelForm}
											modelOptionsRefreshKey={modelOptionsRefreshKey}
											resetModelOptionsKey={resetModelOptionsKey}
											pendingModelId={pendingModelId}
											onPendingModelHandled={handlePendingModelHandled}
										/>

										<JobMatchingActionBar
											form={form}
											isModelOffline={isModelOffline}
											canResetToInitialState={canResetToInitialState}
											onExecuteMatch={handleExecuteMatch}
											onReset={handleFormReset}
										/>
									</>
								)}
							</div>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-2">
							{/* 匹配候选人 */}
							<CandidateListSection
								candidates={displayCandidates}
								selectedCandidates={displaySelectedCandidates}
								hasMatched={displayHasMatched}
								loading={isViewCandidateLoading || isEditCandidateLoading}
								errorMessage={candidateErrorMessage}
								isMatching={isMatching}
								onSelectCandidate={handleSelectCandidate}
								onViewArchive={onViewArchive}
								onViewSelected={handleOpenSelectedCandidatesModal}
								showHeader
								readonly={isView}
							/>
						</div>
					</div>
				)}
			</Drawer>

			<SelectedCandidatesModal
				open={isSelectedCandidatesModalOpen}
				selectedCandidates={displaySelectedCandidates}
				onCancel={handleCloseSelectedCandidatesModal}
				onViewArchive={
					onViewArchive
						? (candidate) => onViewArchive(candidate, displaySelectedCandidates)
						: undefined
				}
				onDeselectCandidate={isView ? undefined : handleDeselectCandidate}
				readonly={isView}
			/>

			{/* 岗位描述抽屉 */}
			<JobDescDrawer
				open={isJobDescOpen}
				mode="readonly"
				record={jobDescRecord}
				onClose={() => setIsJobDescOpen(false)}
			/>

			{/* 新增/更新匹配模型抽屉 */}
			{isMatchingModelDrawerOpen ? (
				<MatchingModelFormDrawer
					open={isMatchingModelDrawerOpen}
					title={matchingModelDrawerMode === "edit" ? "更新匹配模型" : "新增匹配模型"}
					mode={matchingModelDrawerMode}
					modelId={editingModelId}
					organizationTreeData={pageOrganizationTreeData}
					initialModelData={matchingModelInitialData}
					onClose={() => setIsMatchingModelDrawerOpen(false)}
					onSuccess={handleModelFormSuccess}
				/>
			) : null}

			<MatchingModelViewDrawer
				open={isMatchingModelViewDrawerOpen}
				modelId={detailData?.modelId}
				onClose={handleCloseMatchingModelViewDrawer}
			/>
		</>
	);
}
