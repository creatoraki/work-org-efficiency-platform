import {
	RATING_OWNER_UNIT_TYPE_LABEL,
	RatingOwnerUnitType,
} from "#src/api/performance-management/plan";
import {
	getAssessTypeLabel,
	getNodeTypeLabel,
	getTodoStatusLabel,
	RATING_ASSESS_TYPE_LABEL,
	RATING_NODE_TYPE_LABEL,
	RATING_TODO_STATUS_LABEL,
	RatingAssessType,
	RatingNodeType,
	RatingTodoStatus,
} from "#src/api/performance-management/todo";
import { useDict } from "#src/hooks";
import { useCallback, useMemo } from "react";

/** 年度评级字典类型（与 sys_dict_data.dict_type 一致） */
export const ANNUAL_RATING_DICT_TYPE = {
	/** 任务状态 */
	TASK_STATUS: "annual_evaluation_task_status",
	/** 节点类型 */
	NODE_TYPE: "annual_evaluation_node_type",
	/** 考评表类型（考核类型） */
	FORM_TYPE: "annual_evaluation_form_type",
	/** 组织单位类型 */
	OWNER_UNIT_TYPE: "annual_evaluation_owner_unit_type",
} as const;

/** 字典选项 */
export interface AnnualRatingDictOption<T extends string | number> {
	/** 展示文案 */
	label: string;
	/** 字典值 */
	value: T;
}

/** 任务状态兜底选项（字典未加载时使用，按 dict_sort 排序） */
const FALLBACK_STATUS_OPTIONS: AnnualRatingDictOption<string>[] = [
	RatingTodoStatus.PENDING,
	RatingTodoStatus.REJECTED,
	RatingTodoStatus.SUBMITTED,
	RatingTodoStatus.COMPLETED,
].map((value) => ({ label: RATING_TODO_STATUS_LABEL[value], value }));

/** 节点类型兜底选项（字典未加载时使用，按 dict_sort 排序） */
const FALLBACK_NODE_TYPE_OPTIONS: AnnualRatingDictOption<RatingNodeType>[] = [
	RatingNodeType.SELF_EVAL,
	RatingNodeType.SUBMIT,
	RatingNodeType.APPROVE,
	RatingNodeType.FINALIZE,
	RatingNodeType.CONFIRM,
	RatingNodeType.APPEAL,
].map((value) => ({ label: RATING_NODE_TYPE_LABEL[value], value }));

/** 考核类型兜底选项（字典未加载时使用） */
const FALLBACK_ASSESS_TYPE_OPTIONS: AnnualRatingDictOption<RatingAssessType>[] = [
	RatingAssessType.STAFF,
	RatingAssessType.MANAGER,
].map((value) => ({ label: RATING_ASSESS_TYPE_LABEL[value], value }));

/** 组织单位类型兜底选项（字典未加载时使用） */
const FALLBACK_OWNER_UNIT_TYPE_OPTIONS: AnnualRatingDictOption<RatingOwnerUnitType>[] = [
	RatingOwnerUnitType.REGION_COMPANY,
	RatingOwnerUnitType.BUSINESS_GROUP,
	RatingOwnerUnitType.SERVICE_GROUP_FUNCTION,
].map((value) => ({ label: RATING_OWNER_UNIT_TYPE_LABEL[value], value }));

/**
 * 年度评级字典
 *
 * 通过 useDict 拉取 sys_dict_data 中的年度评级字典（任务状态、节点类型、考核类型、组织单位类型），
 * 统一提供筛选选项与展示文案；字典接口不可用时回退到本地字典文案，保证离线 mock 环境仍可渲染。
 *
 * @returns 三个字典的选项与文案翻译方法
 *
 * @author 王善能
 * @since 2026-11-14
 */
export function useAnnualRatingDict() {
	const statusDict = useDict(ANNUAL_RATING_DICT_TYPE.TASK_STATUS);
	const nodeTypeDict = useDict(ANNUAL_RATING_DICT_TYPE.NODE_TYPE);
	const assessTypeDict = useDict(ANNUAL_RATING_DICT_TYPE.FORM_TYPE);
	const ownerUnitTypeDict = useDict(ANNUAL_RATING_DICT_TYPE.OWNER_UNIT_TYPE);

	/** 任务状态选项 */
	const statusOptions = useMemo<AnnualRatingDictOption<string>[]>(() => {
		const options = statusDict.options
			?.filter((item) => !item.disabled)
			.map((item) => ({ label: item.dictLabel, value: item.dictValue }));
		return options?.length ? options : FALLBACK_STATUS_OPTIONS;
	}, [statusDict.options]);

	/** 节点类型选项（字典值为数字码） */
	const nodeTypeOptions = useMemo<AnnualRatingDictOption<RatingNodeType>[]>(() => {
		const options = nodeTypeDict.options
			?.filter((item) => !item.disabled)
			.map((item) => ({
				label: item.dictLabel,
				value: Number(item.dictValue) as RatingNodeType,
			}));
		return options?.length ? options : FALLBACK_NODE_TYPE_OPTIONS;
	}, [nodeTypeDict.options]);

	/** 考核类型选项 */
	const assessTypeOptions = useMemo<AnnualRatingDictOption<RatingAssessType>[]>(() => {
		const options = assessTypeDict.options
			?.filter((item) => !item.disabled)
			.map((item) => ({
				label: item.dictLabel,
				value: Number(item.dictValue) as RatingAssessType,
			}));
		return options?.length ? options : FALLBACK_ASSESS_TYPE_OPTIONS;
	}, [assessTypeDict.options]);

	/** 组织单位类型选项 */
	const ownerUnitTypeOptions = useMemo<AnnualRatingDictOption<RatingOwnerUnitType>[]>(() => {
		const options = ownerUnitTypeDict.options
			?.filter((item) => !item.disabled)
			.map((item) => ({
				label: item.dictLabel,
				value: Number(item.dictValue) as RatingOwnerUnitType,
			}));
		return options?.length ? options : FALLBACK_OWNER_UNIT_TYPE_OPTIONS;
	}, [ownerUnitTypeDict.options]);

	/** 任务状态文案 */
	const statusLabel = useCallback(
		(value?: string | number | null) => {
			const key = value === undefined || value === null ? "" : String(value);
			return statusDict.getLabel(key) ?? getTodoStatusLabel(value);
		},
		[statusDict.getLabel],
	);

	/** 节点类型文案 */
	const nodeTypeLabel = useCallback(
		(value?: string | number | null) => {
			const key = value === undefined || value === null ? "" : String(value);
			return nodeTypeDict.getLabel(key) ?? getNodeTypeLabel(value);
		},
		[nodeTypeDict.getLabel],
	);

	/** 考核类型文案 */
	const assessTypeLabel = useCallback(
		(value?: string | number | null) => {
			const key = value === undefined || value === null ? "" : String(value);
			return assessTypeDict.getLabel(key) ?? getAssessTypeLabel(value);
		},
		[assessTypeDict.getLabel],
	);

	return {
		statusOptions,
		nodeTypeOptions,
		assessTypeOptions,
		ownerUnitTypeOptions,
		statusLabel,
		nodeTypeLabel,
		assessTypeLabel,
	};
}
