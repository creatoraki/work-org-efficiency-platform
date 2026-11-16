import type { JobOptionItem, PositionOptionItem, PostgradeOptionItem } from "#src/api/common";
import type { ProFormInstance } from "@ant-design/pro-components";
import type { RefObject } from "react";
import { fetchJobOptions, fetchPositionOptions, fetchPostgradeOptions } from "#src/api/common";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

/**
 * 岗位、职位、职级联动 Hook 入参。
 */
interface UseJobCascadeOptionsParams {
	/** 查询缓存前缀，用于区分不同页面实例。 */
	sceneKey: string;
	/** 查询表单引用，用于在联动时清空下级字段。 */
	formRef?: RefObject<ProFormInstance | undefined>;
	/** 岗位字段名。 */
	jobFieldName?: string;
	/** 职位字段名。 */
	postFieldName?: string;
	/** 职级字段名。 */
	postgradeFieldName?: string;
	/** React Query staleTime。 */
	staleTime?: number;
	/** React Query gcTime。 */
	gcTime?: number;
}

/**
 * 岗位、职位、职级联动 Hook 返回值。
 */
interface UseJobCascadeOptionsResult {
	/** 岗位选项。 */
	jobOptions: JobOptionItem[];
	/** 职位选项。 */
	postOptions: PositionOptionItem[];
	/** 职级选项。 */
	postgradeOptions: PostgradeOptionItem[];
	/** 岗位变更处理器。 */
	handleJobChange: (jobIds: Array<string | number>) => void;
	/** 职位变更处理器。 */
	handlePostChange: (postIds: Array<string | number>) => void;
	/** 重置联动状态。 */
	resetLinkage: () => void;
}

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_GC_TIME = 10 * 60 * 1000;

/**
 * 岗位、职位、职级三级联动选项 Hook。
 *
 * 统一职责：
 * 1. 基于选中岗位查询职位选项；
 * 2. 基于选中职位查询职级选项；
 * 3. 在上级字段变更时清空下级表单值；
 * 4. 默认围绕 jobIds、postIds、postgradeIds 三个字段工作，也支持按页面配置历史单选字段名；
 * 5. 为各页面提供一致的联动写法，避免重复维护。
 *
 * @param params - Hook 配置项
 * @returns 联动选项与变更处理器
 * @author 王善能
 * @since 2026-07-09
 */
export function useJobCascadeOptions(
	params: UseJobCascadeOptionsParams,
): UseJobCascadeOptionsResult {
	const {
		sceneKey,
		formRef,
		jobFieldName = "jobIds",
		postFieldName = "postIds",
		postgradeFieldName = "postgradeIds",
		staleTime = DEFAULT_STALE_TIME,
		gcTime = DEFAULT_GC_TIME,
	} = params;

	const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);
	const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

	const clearFormFields = useCallback(
		(fieldNames: string[]) => {
			if (!formRef?.current) {
				return;
			}
			const clearedValues: Record<string, undefined> = {};
			fieldNames.forEach((fieldName) => {
				clearedValues[fieldName] = undefined;
			});
			formRef.current.setFieldsValue(clearedValues);
		},
		[formRef],
	);

	const { data: jobOptions = [] } = useQuery({
		queryKey: [sceneKey, "job-options"],
		queryFn: fetchJobOptions,
		staleTime,
		gcTime,
	});

	const { data: postOptions = [] } = useQuery({
		queryKey: [sceneKey, "post-options", selectedJobIds],
		queryFn: () => fetchPositionOptions(selectedJobIds.length > 0 ? selectedJobIds : undefined),
		staleTime,
		gcTime,
	});

	const { data: postgradeOptions = [] } = useQuery({
		queryKey: [sceneKey, "postgrade-options", selectedPostIds],
		queryFn: () =>
			fetchPostgradeOptions(selectedPostIds.length > 0 ? selectedPostIds : undefined),
		staleTime,
		gcTime,
	});

	const handleJobChange = useCallback(
		(jobIds: Array<string | number>) => {
			const nextJobIds = jobIds
				.map((item) => Number(item))
				.filter((item) => !Number.isNaN(item));
			setSelectedJobIds(nextJobIds);
			setSelectedPostIds([]);
			clearFormFields([postFieldName, postgradeFieldName]);
		},
		[clearFormFields, postFieldName, postgradeFieldName],
	);

	const handlePostChange = useCallback(
		(postIds: Array<string | number>) => {
			const nextPostIds = postIds.map((item) => String(item));
			setSelectedPostIds(nextPostIds);
			clearFormFields([postgradeFieldName]);
		},
		[clearFormFields, postgradeFieldName],
	);

	const resetLinkage = useCallback(() => {
		setSelectedJobIds([]);
		setSelectedPostIds([]);
		clearFormFields([jobFieldName, postFieldName, postgradeFieldName]);
	}, [clearFormFields, jobFieldName, postFieldName, postgradeFieldName]);

	return {
		jobOptions,
		postOptions,
		postgradeOptions,
		handleJobChange,
		handlePostChange,
		resetLinkage,
	};
}
