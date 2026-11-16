/**
 * 档案数据处理 Hook
 *
 * 负责构建表格数据、准备提交数据、准备暂存数据等
 */

import type {
	SaveTempParams,
	SubmitArchiveParams,
	TreeTagItem,
} from "#src/api/personnel-archive/archive-management";
import type { FormInstance } from "antd";
import { useCallback, useMemo } from "react";

/**
 * useArchiveData 参数
 */
interface UseArchiveDataParams {
	/** 表单实例 */
	form: FormInstance;
	/** 选中的标签列表 */
	selectedTagsList: TreeTagItem[];
	/** 初始化标签映射 */
	initLeafNodeTags: Map<string, TreeTagItem>;
	/** 用户ID */
	userId: string | number;
	/** 不允许修改的状态列表 */
	disabledStatuses: readonly string[];
}

/**
 * useArchiveData 返回值
 */
interface UseArchiveDataReturn {
	/** 构建表格数据（合并表单值和原始数据） */
	buildTableData: () => TreeTagItem[];
	/** 构建附件表单数据 */
	buildUploadFileForms: (tagFileList: any) => SubmitArchiveParams["uploadFileForms"];
	/** 准备提交数据 */
	prepareSubmitData: () => SubmitArchiveParams[];
	/** 准备暂存数据 */
	prepareDraftData: () => SaveTempParams[];
	/** 获取选中的标签 ID 列表（数值类型） */
	selectedTagIds: number[];
}

/**
 * 档案数据处理 Hook
 */
export function useArchiveData({
	form,
	selectedTagsList,
	initLeafNodeTags,
	userId,
	disabledStatuses,
}: UseArchiveDataParams): UseArchiveDataReturn {
	/**
	 * 构建表格数据（合并表单值和原始数据）
	 *
	 * 使用索引对应数据，确保 Form.List 的顺序与 selectedTagsList 一致
	 *
	 * @returns 表格数据数组
	 */
	const buildTableData = useCallback((): TreeTagItem[] => {
		const latestFormValues = form.getFieldsValue();
		const formTags = latestFormValues.tags ?? [];

		return selectedTagsList.map((tag, index) => {
			// 使用索引对应的表单值（Form.List 的顺序与 selectedTagsList 一致）
			const formTagValue = formTags[index]?.tagValue ?? tag.tagValue;
			const formTagFileList = formTags[index]?.tagFileList;

			let fileList = tag.tagFileList;
			if (formTagFileList !== undefined) {
				fileList =
					Array.isArray(formTagFileList) && formTagFileList.length > 0
						? formTagFileList.length === 1
							? formTagFileList[0]
							: formTagFileList
						: undefined;
			}

			return {
				...tag,
				tagValue: formTagValue,
				tagFileList: fileList,
			};
		});
	}, [form, selectedTagsList]);

	/**
	 * 构建附件表单数据
	 *
	 * @param tagFileList - 标签文件列表
	 * @returns 附件表单数组
	 */
	const buildUploadFileForms = useCallback(
		(tagFileList: any): SubmitArchiveParams["uploadFileForms"] => {
			if (!tagFileList) {
				return undefined;
			}

			const fileList = Array.isArray(tagFileList) ? tagFileList : [tagFileList];
			const uploadFileForms: SubmitArchiveParams["uploadFileForms"] = [];

			fileList.forEach((file: any) => {
				if (file.fileName || file.url) {
					uploadFileForms.push({
						id: file.id || 0,
						url: file.url || "",
						fileName: file.fileName || "",
						newFileName: file.newFileName || "",
						originalFilename: file.originalFilename || "",
					});
				}
			});

			return uploadFileForms.length > 0 ? uploadFileForms : undefined;
		},
		[],
	);

	/**
	 * 准备提交数据
	 *
	 * @returns 提交参数数组
	 */
	const prepareSubmitData = useCallback((): SubmitArchiveParams[] => {
		const tableData = buildTableData();
		const submitData: SubmitArchiveParams[] = [];

		for (const tag of tableData) {
			const tagId = (tag as any).tagId;
			if (tagId == null) {
				continue;
			}

			const status = tag.status || "1";
			if (disabledStatuses.includes(status)) {
				continue;
			}

			const initTag = initLeafNodeTags.get(String(tagId));
			const currentTagValue = tag.tagValue ?? "";
			const oldTagValue = initTag?.tagValue ?? initTag?.oldTagValue ?? "";

			submitData.push({
				userTagId: tag.userTagId ? String(tag.userTagId) : undefined,
				userId: String(userId),
				tagId: String(tagId),
				tagValue: currentTagValue,
				oldTagValue,
				uploadFileForms: buildUploadFileForms(tag.tagFileList),
			});
		}

		return submitData;
	}, [buildTableData, buildUploadFileForms, initLeafNodeTags, userId, disabledStatuses]);

	/**
	 * 准备暂存数据
	 *
	 * 仅保存有变化的标签
	 *
	 * @returns 暂存参数数组
	 */
	const prepareDraftData = useCallback((): SaveTempParams[] => {
		const tableData = buildTableData();
		const draftData: SaveTempParams[] = [];

		for (const tag of tableData) {
			const tagId = (tag as any).tagId;
			if (tagId == null) {
				continue;
			}

			const initTag = initLeafNodeTags.get(String(tagId));
			const currentTagValue = tag.tagValue ?? "";
			const oldTagValue = initTag?.tagValue ?? initTag?.oldTagValue ?? "";

			if (currentTagValue !== oldTagValue) {
				draftData.push({
					userTagId: tag.userTagId ? String(tag.userTagId) : undefined,
					userId: String(userId),
					tagId: String(tagId),
					tagValue: oldTagValue || undefined,
					tempTagValue: currentTagValue,
				});
			}
		}

		return draftData;
	}, [buildTableData, initLeafNodeTags, userId]);

	/**
	 * 获取选中的标签 ID 列表（数值类型）
	 */
	const selectedTagIds = useMemo(() => {
		return selectedTagsList
			.filter((tag) => {
				const tagId = (tag as any).tagId;
				return tagId != null;
			})
			.map((tag) => {
				const tagId = (tag as any).tagId;
				return Number(tagId);
			});
	}, [selectedTagsList]);

	return {
		buildTableData,
		buildUploadFileForms,
		prepareSubmitData,
		prepareDraftData,
		selectedTagIds,
	};
}
