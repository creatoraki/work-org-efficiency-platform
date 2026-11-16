/**
 * 人岗匹配表单 Hook
 *
 * 封装表单相关的数据查询、级联联动和执行匹配逻辑。
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { JobMatchCandidateItem } from "#src/api/org-brain/candidate";
import type { JobMatchingDetail, JobMatchingItem } from "#src/api/org-brain/job-matching";
import type { FormInstance } from "antd";
import type { DrawerMode } from "../types";

import { executeJobMatching } from "#src/api/org-brain/job-matching";
import { findOrganizationNodeByCode } from "#src/utils";
import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface JobMatchingFormValues {
	taskName?: string;
	orgCode?: string;
	orgFullPath?: string;
	orgFullName?: string;
	jobPostNodeValue?: string;
	jobId?: string;
	jobName?: string;
	postId?: string;
	postName?: string;
	postgradeId?: string;
	postgradeName?: string;
	modelOption?: {
		value: string;
		label: string;
	};
	modelSnapshot?: string;
	modelSnapshotHash?: string;
}

interface UseJobMatchingFormOptions {
	// 表单实例
	form: FormInstance;
	// 抽屉模式
	mode: DrawerMode;
	// 抽屉是否打开
	open: boolean;
	// 当前会话是否允许执行初始化
	canInitializeForm?: boolean;
	// 是否允许恢复到当前会话的初始态
	canResetToInitialState?: boolean;
	// 初始数据
	initialData?: JobMatchingDetail | null;
	// 列表行预览数据
	previewData?: JobMatchingItem | null;
	// 页面级组织树缓存
	organizationTreeData?: OrganizationTreeNode | null;
}

interface UseJobMatchingFormReturn {
	// 候选人列表
	candidates: JobMatchCandidateItem[];
	// 选中的候选人
	selectedCandidate: JobMatchCandidateItem | null;
	// 多选候选人列表
	selectedCandidates: JobMatchCandidateItem[];
	// 是否已执行匹配
	hasMatched: boolean;
	// 是否正在匹配
	isMatching: boolean;
	// 匹配失败提示
	matchErrorMessage?: string;
	// 组织变更处理
	handleOrgChange: () => void;
	// 职级变更处理
	handleLevelChange: () => void;
	// 匹配模型变更处理
	handleModelChange: () => void;
	// 执行匹配
	handleExecuteMatch: () => Promise<void>;
	// 重置匹配结果
	handleReset: () => void;
	// 编辑态重置后的模型选项恢复标识
	resetModelOptionsKey: number;
	// 选择候选人
	handleSelectCandidate: (candidate: JobMatchCandidateItem) => void;
	// 取消选中候选人
	handleDeselectCandidate: (candidate: JobMatchCandidateItem) => void;
	// 编辑态候选人区是否已从权威详情完成 hydration
	isEditCandidateReady: boolean;
}

interface JobMatchingResetSnapshot {
	formValues: JobMatchingFormValues;
	candidateState: {
		candidateList: JobMatchCandidateItem[];
		selectedCandidates: JobMatchCandidateItem[];
		selectedCandidate: JobMatchCandidateItem | null;
		hasMatched: boolean;
	};
}

const JOB_MATCHING_FORM_FIELD_NAMES: Array<keyof JobMatchingFormValues> = [
	"taskName",
	"orgCode",
	"orgFullPath",
	"orgFullName",
	"jobPostNodeValue",
	"jobId",
	"jobName",
	"postId",
	"postName",
	"postgradeId",
	"postgradeName",
	"modelOption",
	"modelSnapshot",
	"modelSnapshotHash",
];

/**
 * 根据职位与职级构造岗位树选中值。
 *
 * @param postId - 职位 ID
 * @param postgradeId - 职级 ID
 * @returns 岗位树选中值
 * @author 王善能
 * @since 2026-07-09
 */
function buildJobPostNodeValue(
	postId?: string | number | null,
	postgradeId?: string | number | null,
): string | undefined {
	if (postId == null || postgradeId == null || postId === "" || postgradeId === "") {
		return undefined;
	}
	return `position:${postId}:${postgradeId}`;
}

function normalizeModelSnapshotField(value: unknown): string | undefined {
	if (value == null || value === "") {
		return undefined;
	}
	if (typeof value === "string") {
		return value;
	}
	try {
		return JSON.stringify(value);
	} catch {
		return undefined;
	}
}

/**
 * 将详情/预览数据转换为抽屉表单初始值。
 *
 * @param source - 详情或预览数据
 * @param organizationTreeData - 组织树
 * @returns 可直接回填到表单的字段值
 * @author 王善能
 * @since 2026-06-29
 */
function buildInitialFormValues(
	source: JobMatchingDetail | JobMatchingItem,
	organizationTreeData: OrganizationTreeNode | null | undefined,
): JobMatchingFormValues {
	const organizationNode = findOrganizationNodeByCode(organizationTreeData, source.orgCode);

	return {
		taskName: source.taskName,
		orgCode: organizationNode?.code ?? source.orgCode,
		orgFullPath: source.orgFullPath ?? organizationNode?.ancestors ?? undefined,
		orgFullName: source.orgFullName ?? organizationNode?.fullname ?? undefined,
		jobPostNodeValue: buildJobPostNodeValue(source.postId, source.postgradeId),
		jobId: source.jobId ? String(source.jobId) : undefined,
		jobName: source.jobName,
		postId: source.postId ? String(source.postId) : undefined,
		postName: source.postName,
		postgradeId: source.postgradeId ? String(source.postgradeId) : undefined,
		postgradeName: source.postgradeName,
		modelOption:
			source.modelId && source.modelName
				? {
						value: String(source.modelId),
						label: source.modelName,
					}
				: undefined,
		modelSnapshot: normalizeModelSnapshotField(source.modelSnapshot),
		modelSnapshotHash: source.modelSnapshotHash,
	};
}

/**
 * 返回空白表单值。
 *
 * @returns 新增态默认表单值
 * @author 王善能
 * @since 2026-06-29
 */
function getEmptyFormValues(): JobMatchingFormValues {
	return {
		taskName: undefined,
		orgCode: undefined,
		orgFullPath: undefined,
		orgFullName: undefined,
		jobPostNodeValue: undefined,
		jobId: undefined,
		jobName: undefined,
		postId: undefined,
		postName: undefined,
		postgradeId: undefined,
		postgradeName: undefined,
		modelOption: undefined,
		modelSnapshot: undefined,
		modelSnapshotHash: undefined,
	};
}

/**
 * 从详情或预览数据中提取候选人初始状态。
 *
 * @param source - 详情或预览数据
 * @returns 候选人初始状态
 * @author 王善能
 * @since 2026-06-29
 */
function buildInitialCandidateState(source?: JobMatchingDetail | JobMatchingItem | null): {
	candidateList: JobMatchCandidateItem[];
	selectedCandidates: JobMatchCandidateItem[];
	selectedCandidate: JobMatchCandidateItem | null;
	hasMatched: boolean;
} {
	const candidateList =
		"candidateList" in (source ?? {})
			? ((source as JobMatchingDetail | null)?.candidateList ?? [])
			: ((source as JobMatchingItem | null)?.candidates ?? []);
	const selectedCandidates = candidateList.filter((item) =>
		Boolean((item as { isSelected?: boolean }).isSelected),
	);
	const selectedCandidate =
		"selectedCandidate" in (source ?? {})
			? ((source as JobMatchingDetail | null)?.selectedCandidate ??
				selectedCandidates[0] ??
				null)
			: (selectedCandidates[0] ?? null);

	return {
		candidateList,
		selectedCandidates,
		selectedCandidate,
		hasMatched: candidateList.length > 0,
	};
}

/**
 * 将表单恢复到指定快照，并同步清理字段校验状态。
 *
 * @param form - 表单实例
 * @param snapshot - 目标表单快照
 * @author 王善能
 * @since 2026-07-09
 */
function restoreFormSnapshot(form: FormInstance, snapshot: JobMatchingFormValues): void {
	form.setFieldsValue(snapshot);
	form.setFields(
		JOB_MATCHING_FORM_FIELD_NAMES.map((name) => ({
			name,
			errors: [],
			warnings: [],
			touched: false,
			validating: false,
		})),
	);
}

/**
 * 人岗匹配表单 Hook
 *
 * 负责组织、岗位、职位、职级级联数据加载，以及结果匹配候选人的状态管理。
 *
 * @param options - Hook 入参
 * @param options.form - 表单实例
 * @param options.mode - 抽屉模式
 * @param options.open - 抽屉是否打开
 * @param options.canInitializeForm - 当前会话是否允许执行初始化
 * @param options.canResetToInitialState - 当前会话是否允许恢复到初始态
 * @param options.initialData - 编辑态的详情初始值
 * @param options.previewData - 列表行预览数据，用于编辑态详情返回前的首屏回填
 * @param options.organizationTreeData - 页面级组织树缓存
 * @returns 人岗匹配表单联动能力集合
 * @author 王善能
 * @since 2026-06-08
 */
export function useJobMatchingForm({
	form,
	mode,
	open,
	canInitializeForm = true,
	canResetToInitialState = true,
	initialData,
	previewData,
	organizationTreeData,
}: UseJobMatchingFormOptions): UseJobMatchingFormReturn {
	// 候选人状态
	const [candidates, setCandidates] = useState<JobMatchCandidateItem[]>([]);
	const [selectedCandidate, setSelectedCandidate] = useState<JobMatchCandidateItem | null>(null);
	const [selectedCandidates, setSelectedCandidates] = useState<JobMatchCandidateItem[]>([]);
	const [hasMatched, setHasMatched] = useState(false);
	const [isMatching, setIsMatching] = useState(false);
	const [matchErrorMessage, setMatchErrorMessage] = useState<string | undefined>(undefined);
	const [isEditCandidateReady, setIsEditCandidateReady] = useState(mode !== "edit");
	const [resetModelOptionsKey, setResetModelOptionsKey] = useState(0);
	const matchAbortControllerRef = useRef<AbortController | null>(null);
	const latestMatchRequestIdRef = useRef(0);
	const drawerSessionIdRef = useRef(0);
	const previousOpenRef = useRef(false);
	const initializedFormSourceKeyRef = useRef<string | null>(null);
	const resetSnapshotRef = useRef<JobMatchingResetSnapshot | null>(null);

	const formInitialValues = useMemo(() => {
		if (mode === "add") {
			return getEmptyFormValues();
		}
		/**
		 * 编辑态优先使用列表预览值首屏回填，详情返回后再以权威数据覆盖一次。
		 */
		const formSource = initialData ?? previewData;
		return formSource
			? buildInitialFormValues(formSource, organizationTreeData)
			: getEmptyFormValues();
	}, [initialData, mode, organizationTreeData, previewData]);

	const formSourceKey = useMemo(() => {
		if (mode === "add") {
			return "add";
		}
		const source = initialData ?? previewData;
		if (!source?.id) {
			return null;
		}
		const sourceType = initialData ? "detail" : "preview";
		const updateTime =
			"updateTime" in source && source.updateTime ? String(source.updateTime) : "";
		return `${sourceType}:${source.id}:${updateTime}`;
	}, [initialData, mode, previewData]);

	const candidateInitialState = useMemo(() => {
		if (mode === "add") {
			return buildInitialCandidateState(null);
		}
		const candidateSource = initialData ?? previewData;
		return buildInitialCandidateState(candidateSource ?? null);
	}, [initialData, mode, previewData]);

	/**
	 * 清空候选人卡片及匹配状态。
	 *
	 * 仅在用户切换筛选项或主动重置结果时调用，不处理表单字段本身。
	 */
	const clearCandidateState = useCallback(() => {
		matchAbortControllerRef.current?.abort();
		matchAbortControllerRef.current = null;
		latestMatchRequestIdRef.current += 1;
		setIsMatching(false);
		setMatchErrorMessage(undefined);
		setCandidates([]);
		setSelectedCandidate(null);
		setSelectedCandidates([]);
		setHasMatched(false);
	}, []);

	/**
	 * 清空最近一次结果匹配写回的模型快照字段。
	 *
	 * 这些字段与候选人结果属于同一次匹配产物，任一筛选条件变化后都需要失效。
	 */
	const clearMatchSnapshotFields = useCallback(() => {
		form.setFieldValue("modelSnapshot", undefined);
		form.setFieldValue("modelSnapshotHash", undefined);
	}, [form]);

	/**
	 * 清空匹配模型字段。
	 *
	 * 岗位链路任一节点变化后，已有模型可能已不再适配，因此需要同步清空。
	 */
	const clearModelSelection = useCallback(() => {
		form.setFieldValue("modelOption", undefined);
	}, [form]);

	/**
	 * 记录当前抽屉会话的“初始态快照”。
	 *
	 * 编辑态下，该快照用于重置时恢复详情初始表单、初始模型展示和初始候选人结果；
	 * 不能被后续的模型新增/更新回填结果覆盖。
	 *
	 * @param formValues - 初始表单值快照
	 * @param candidateState - 初始候选人状态快照
	 * @author 王善能
	 * @since 2026-07-09
	 */
	const syncResetSnapshot = useCallback(
		(
			formValues: JobMatchingFormValues,
			candidateState: JobMatchingResetSnapshot["candidateState"],
		) => {
			resetSnapshotRef.current = {
				formValues: { ...formValues },
				candidateState: {
					candidateList: [...candidateState.candidateList],
					selectedCandidates: [...candidateState.selectedCandidates],
					selectedCandidate: candidateState.selectedCandidate,
					hasMatched: candidateState.hasMatched,
				},
			};
		},
		[],
	);

	// 抽屉每次重新打开都视为新的会话，关闭时立即清掉当前会话的匹配态，避免旧请求污染新抽屉。
	useEffect(() => {
		if (open && !previousOpenRef.current) {
			drawerSessionIdRef.current += 1;
			initializedFormSourceKeyRef.current = null;
			resetSnapshotRef.current = null;
			setResetModelOptionsKey(0);
			if (mode === "edit") {
				setIsEditCandidateReady(false);
			}
		}

		previousOpenRef.current = open;

		if (!open) {
			drawerSessionIdRef.current += 1;
			initializedFormSourceKeyRef.current = null;
			resetSnapshotRef.current = null;
			setResetModelOptionsKey(0);
			setIsEditCandidateReady(mode !== "edit");
			matchAbortControllerRef.current?.abort();
			matchAbortControllerRef.current = null;
			latestMatchRequestIdRef.current += 1;
			setIsMatching(false);
			form.resetFields();
			setCandidates([]);
			setSelectedCandidate(null);
			setSelectedCandidates([]);
			setHasMatched(false);
		}
	}, [form, mode, open]);

	/**
	 * 初始化或切换抽屉会话时回填表单快照。
	 *
	 * 使用标准 useEffect 完成初始化回填，避免同步副作用阻塞抽屉首帧渲染。
	 */
	useEffect(() => {
		if (!open || !canInitializeForm || !formSourceKey) {
			return;
		}
		if (initializedFormSourceKeyRef.current === formSourceKey) {
			return;
		}

		const isPreviewInit = mode === "edit" && formSourceKey.startsWith("preview:");
		const isDetailUpgrade =
			mode === "edit" &&
			initializedFormSourceKeyRef.current != null &&
			initializedFormSourceKeyRef.current.startsWith("preview:") &&
			formSourceKey.startsWith("detail:");

		if (isDetailUpgrade || (mode === "edit" && formSourceKey.startsWith("detail:"))) {
			syncResetSnapshot(formInitialValues, candidateInitialState);
			restoreFormSnapshot(form, formInitialValues);
			setCandidates(candidateInitialState.candidateList);
			setSelectedCandidates(candidateInitialState.selectedCandidates);
			setSelectedCandidate(candidateInitialState.selectedCandidate);
			setHasMatched(candidateInitialState.hasMatched);
			setIsEditCandidateReady(true);
			initializedFormSourceKeyRef.current = formSourceKey;
			return;
		}

		if (mode !== "edit" || initialData) {
			syncResetSnapshot(formInitialValues, candidateInitialState);
		}
		restoreFormSnapshot(form, formInitialValues);
		if (isPreviewInit) {
			// 编辑态预览只回填基本信息，候选人区保持 loading 直到权威详情返回。
			initializedFormSourceKeyRef.current = formSourceKey;
			setIsEditCandidateReady(false);
			return;
		}
		setCandidates(candidateInitialState.candidateList);
		setSelectedCandidates(candidateInitialState.selectedCandidates);
		setSelectedCandidate(candidateInitialState.selectedCandidate);
		setHasMatched(candidateInitialState.hasMatched);
		setIsEditCandidateReady(true);
		initializedFormSourceKeyRef.current = formSourceKey;
	}, [
		candidateInitialState,
		canInitializeForm,
		form,
		formInitialValues,
		formSourceKey,
		initialData,
		mode,
		open,
		syncResetSnapshot,
	]);

	// 组织变更
	const handleOrgChange = useCallback(() => {
		clearModelSelection();
		clearMatchSnapshotFields();
		clearCandidateState();
	}, [clearCandidateState, clearMatchSnapshotFields, clearModelSelection]);

	// 职级变更
	const handleLevelChange = useCallback(() => {
		clearModelSelection();
		clearMatchSnapshotFields();
		clearCandidateState();
	}, [clearCandidateState, clearMatchSnapshotFields, clearModelSelection]);

	// 匹配模型变更
	const handleModelChange = useCallback(() => {
		clearMatchSnapshotFields();
		clearCandidateState();
	}, [clearCandidateState, clearMatchSnapshotFields]);

	// 执行匹配 mutation
	const { mutateAsync: executeMatch } = useMutation({
		mutationFn: async (params: Parameters<typeof executeJobMatching>[0]) => {
			matchAbortControllerRef.current?.abort();
			const controller = new AbortController();
			matchAbortControllerRef.current = controller;
			return executeJobMatching(params, { signal: controller.signal });
		},
	});

	/**
	 * 执行结果匹配
	 *
	 * 只有组织、岗位、职位、职级和匹配模型都完成校验后，才允许调用匹配接口。
	 */
	const handleExecuteMatch = useCallback(async () => {
		if (isMatching) {
			matchAbortControllerRef.current?.abort();
		}

		const sessionId = drawerSessionIdRef.current;
		const requestId = latestMatchRequestIdRef.current + 1;

		try {
			latestMatchRequestIdRef.current = requestId;
			setIsMatching(true);
			setMatchErrorMessage(undefined);
			await form.validateFields(["orgCode", "jobPostNodeValue", "modelOption"]);
			const values = form.getFieldsValue([
				"orgCode",
				"jobId",
				"jobName",
				"postId",
				"postName",
				"postgradeId",
				"postgradeName",
				"modelOption",
			]);
			const selectedModelId = values.modelOption?.value
				? String(values.modelOption.value)
				: undefined;
			setCandidates([]);
			setSelectedCandidate(null);
			setSelectedCandidates([]);
			setHasMatched(false);
			const organizationNode = findOrganizationNodeByCode(
				organizationTreeData,
				values.orgCode,
			);
			const result = await executeMatch({
				orgCode: values.orgCode ?? "",
				orgName: organizationNode?.name ?? "",
				jobId: values.jobId,
				jobName: values.jobName ?? "",
				postId: values.postId,
				postName: values.postName ?? "",
				postgradeId: values.postgradeId,
				postgradeName: values.postgradeName ?? "",
				modelId: selectedModelId ?? "",
				pageNum: 1,
				pageSize: 50,
			});
			if (
				!open ||
				drawerSessionIdRef.current !== sessionId ||
				latestMatchRequestIdRef.current !== requestId
			) {
				return;
			}
			form.setFieldsValue({
				modelSnapshot: result.modelSnapshot,
				modelSnapshotHash: result.modelSnapshotHash,
			});
			setCandidates(result.candidates);
			setSelectedCandidate(null);
			setSelectedCandidates([]);
			setHasMatched(true);
			setIsEditCandidateReady(true);
		} catch (error) {
			if (axios.isCancel(error)) {
				return;
			}
			if (
				error &&
				typeof error === "object" &&
				"errorFields" in error &&
				Array.isArray((error as { errorFields?: unknown[] }).errorFields)
			) {
				return;
			}
			console.error("执行结果匹配失败:", error);
			setMatchErrorMessage("结果匹配失败，请稍后重试");
			message.error("结果匹配失败，请稍后重试");
		} finally {
			if (latestMatchRequestIdRef.current === requestId) {
				matchAbortControllerRef.current = null;
				setIsMatching(false);
			}
		}
	}, [executeMatch, form, isMatching, open, organizationTreeData]);

	// 重置表单与候选人结果；新增恢复空表单，编辑恢复详情初始态。
	const handleReset = useCallback(() => {
		if (!canResetToInitialState) {
			return;
		}
		const resetSnapshot = resetSnapshotRef.current ?? {
			formValues: formInitialValues,
			candidateState: candidateInitialState,
		};
		clearCandidateState();
		restoreFormSnapshot(form, resetSnapshot.formValues);
		setCandidates(resetSnapshot.candidateState.candidateList);
		setSelectedCandidates(resetSnapshot.candidateState.selectedCandidates);
		setSelectedCandidate(resetSnapshot.candidateState.selectedCandidate);
		setHasMatched(resetSnapshot.candidateState.hasMatched);
		setIsEditCandidateReady(true);
		if (mode === "edit") {
			setResetModelOptionsKey((previous) => previous + 1);
		}
	}, [
		canResetToInitialState,
		candidateInitialState,
		clearCandidateState,
		form,
		formInitialValues,
		mode,
	]);

	// 选择候选人：支持多选；再次点击已选候选人时取消选中。
	const handleSelectCandidate = useCallback((candidate: JobMatchCandidateItem) => {
		setSelectedCandidates((prev) => {
			const exists = prev.some((item) => {
				if (item.userId != null && candidate.userId != null) {
					return item.userId === candidate.userId;
				}
				return item.empCode && candidate.empCode && item.empCode === candidate.empCode;
			});
			if (exists) {
				const next = prev.filter((item) => {
					if (item.userId != null && candidate.userId != null) {
						return item.userId !== candidate.userId;
					}
					return !(
						item.empCode &&
						candidate.empCode &&
						item.empCode === candidate.empCode
					);
				});
				setSelectedCandidate((currentSelected) => {
					const isRemovingCurrent =
						(currentSelected?.userId != null &&
							candidate.userId != null &&
							currentSelected.userId === candidate.userId) ||
						(currentSelected?.empCode &&
							candidate.empCode &&
							currentSelected.empCode === candidate.empCode);
					if (!isRemovingCurrent) {
						return currentSelected;
					}
					return next[next.length - 1] ?? null;
				});
				return next;
			}
			setSelectedCandidate(candidate);
			return [...prev, candidate];
		});
	}, []);

	// 从多选结果中取消某个候选人；若取消的是当前焦点候选人，则切到剩余列表最后一项。
	const handleDeselectCandidate = useCallback((candidate: JobMatchCandidateItem) => {
		setSelectedCandidates((prev) => {
			const next = prev.filter((item) => {
				if (item.userId != null && candidate.userId != null) {
					return item.userId !== candidate.userId;
				}
				return !(item.empCode && candidate.empCode && item.empCode === candidate.empCode);
			});
			setSelectedCandidate((currentSelected) => {
				const isRemovingCurrent =
					(currentSelected?.userId != null &&
						candidate.userId != null &&
						currentSelected.userId === candidate.userId) ||
					(currentSelected?.empCode &&
						candidate.empCode &&
						currentSelected.empCode === candidate.empCode);
				if (!isRemovingCurrent) {
					return currentSelected;
				}
				return next[next.length - 1] ?? null;
			});
			return next;
		});
	}, []);

	return {
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
	};
}
