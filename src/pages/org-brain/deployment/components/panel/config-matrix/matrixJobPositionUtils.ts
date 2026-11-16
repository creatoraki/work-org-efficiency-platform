import type {
	DeployPositionMatrixRow,
	PositionMatrixMetaItem,
} from "#src/api/org-brain/deployment";

import { trim } from "lodash-es";

export interface MatrixTreeSelectNode {
	title: string;
	value: string;
	selectionLabel: string;
	selectable?: boolean;
	children?: MatrixTreeSelectNode[];
}

export const MATRIX_DUPLICATE_ERROR_MESSAGE =
	"相同的条线、编制岗位、岗位、职位、职级只允许配置一条";

export type MatrixGroupSource = "initial" | "draft";

/**
 * 过滤岗位-职位-职级树节点，仅移除已被同组其他行占用的叶子选项。
 *
 * 该处理仅作用于“岗位-职位-职级”末级选项，不介入“条线 / 编制岗位”两级联动逻辑；
 * 若当前行已存在选中值，则需在过滤结果中予以保留，以保证编辑态回显稳定。
 *
 * @param treeOptions - 当前岗位树选项
 * @param usedValueSet - 同组其他行已占用的组合值集合
 * @param currentTreeValue - 当前行已选中的组合值
 * @returns 过滤后的岗位树选项
 * @author 王善能
 * @since 2026-07-08
 */
export function filterMatrixJobPositionTreeOptions(
	treeOptions: MatrixTreeSelectNode[],
	usedValueSet: Set<string>,
	currentTreeValue?: string,
) {
	if (usedValueSet.size === 0) {
		return treeOptions;
	}
	return treeOptions
		.map((jobNode) => {
			const children = (jobNode.children ?? []).filter(
				(child) => child.value === currentTreeValue || !usedValueSet.has(child.value),
			);
			return {
				...jobNode,
				children,
			};
		})
		.filter((jobNode) => (jobNode.children?.length ?? 0) > 0);
}

/**
 * 合并岗位-职位-职级字段的重复错误信息。
 *
 * 在实时重复校验场景下，仅维护“重复组合”这一条错误提示，
 * 不覆盖同字段上已存在的必填等其他校验结果。
 *
 * @param errors - 当前字段已有错误信息
 * @param options - 合并选项
 * @param options.hasDuplicate - 当前字段是否命中重复组合
 * @returns 合并后的错误信息列表
 * @author 王善能
 * @since 2026-07-08
 */
export function mergeMatrixDuplicateError(
	errors: string[] | undefined,
	options: {
		hasDuplicate: boolean;
	},
) {
	const nextErrors = (errors ?? []).filter(
		(errorMessage) => errorMessage !== MATRIX_DUPLICATE_ERROR_MESSAGE,
	);
	if (options.hasDuplicate) {
		nextErrors.push(MATRIX_DUPLICATE_ERROR_MESSAGE);
	}
	return nextErrors;
}

export type EditableMatrixStateRow = DeployPositionMatrixRow & {
	editMode?: "row" | "full";
	groupSource?: MatrixGroupSource;
	isGroupCellMergeReady?: boolean;
	isHierarchyCellMergeReady?: boolean;
	isMatchModelConfirmed?: boolean;
	isAuthorizedJobLocked?: boolean;
	mergeGroupId?: string;
};

export type MatrixFormRow = EditableMatrixStateRow & {
	jobPositionTreeValue?: string;
};

function hasTextValue(value?: string) {
	return Boolean(trim(value ?? ""));
}

/**
 * 解析矩阵行所属的组来源。
 *
 * “初始组”表示后端回显或基于后端初始行继续组内新增的行；
 * “草稿组”表示前端新增出来、仅在当前编辑过程存在的临时组。
 *
 * @param row - 当前矩阵行
 * @returns 组来源
 * @author 王善能
 * @since 2026-07-08
 */
export function resolveMatrixGroupSource(row?: Partial<EditableMatrixStateRow>): MatrixGroupSource {
	const explicitGroupSource = row?.groupSource;
	if (explicitGroupSource === "initial" || explicitGroupSource === "draft") {
		return explicitGroupSource;
	}
	const mergeGroupId = trim(String(row?.mergeGroupId ?? ""));
	if (mergeGroupId.startsWith("initial::")) {
		return "initial";
	}
	if (mergeGroupId.startsWith("draft::")) {
		return "draft";
	}
	if (!row?.editMode) {
		return "initial";
	}
	return "draft";
}

/**
 * 解析矩阵行所属的合并组 ID。
 *
 * 初始矩阵与外新增草稿行需要显式隔离：
 * 同条线只是展示值相同，不代表应该跨组共享 rowSpan。
 *
 * @param row - 当前矩阵行
 * @returns 合并组 ID；缺失时回退为基于 rowKey 的唯一组
 * @author 王善能
 * @since 2026-07-08
 */
export function resolveMatrixMergeGroupId(row?: Partial<EditableMatrixStateRow>) {
	const existingGroupId = trim(String(row?.mergeGroupId ?? ""));
	if (existingGroupId) {
		return existingGroupId;
	}
	if (resolveMatrixGroupSource(row) === "initial" && hasTextValue(row?.departmentLine)) {
		return `initial::${trim(String(row?.departmentLine))}`;
	}
	if (hasTextValue(row?.rowKey)) {
		return `row::${trim(String(row?.rowKey))}`;
	}
	return "row::__anonymous__";
}

/**
 * 为矩阵行补齐合并组 ID，确保 rowSpan 计算存在稳定边界。
 *
 * @param row - 当前矩阵行
 * @returns 带 mergeGroupId 的矩阵行
 * @author 王善能
 * @since 2026-07-08
 */
export function ensureMatrixMergeGroupId(row: EditableMatrixStateRow): EditableMatrixStateRow {
	return {
		...row,
		groupSource: resolveMatrixGroupSource(row),
		mergeGroupId: resolveMatrixMergeGroupId(row),
	};
}

/**
 * 基于当前行构造组内新增草稿行。
 *
 * 该工厂统一处理“继承哪些字段、清空哪些字段、继承哪一类分组来源”，
 * 以避免初始行与草稿行在各调用点重复分叉判断。
 *
 * @param row - 当前点击“新增行”的父行
 * @param rowKey - 新行唯一键
 * @returns 组内新增后的草稿行
 * @author 王善能
 * @since 2026-07-08
 */
export function createGroupedDraftMatrixRow(
	row: EditableMatrixStateRow,
	rowKey: string,
): EditableMatrixStateRow {
	const groupSource = resolveMatrixGroupSource(row);
	if (groupSource === "draft") {
		return ensureMatrixMergeGroupId({
			...row,
			rowKey,
			groupSource,
			mergeGroupId: trim(String(row.mergeGroupId ?? "")) || `row::${rowKey}`,
			jobCode: undefined,
			jobName: "",
			positionCode: undefined,
			positionName: "",
			positionLevel: undefined,
			requiredCount: undefined,
			tagMatchModelId: undefined,
			tagMatchModelName: "",
			editMode: "full",
			isAuthorizedJobLocked: false,
			isGroupCellMergeReady: false,
			isHierarchyCellMergeReady: false,
			isMatchModelConfirmed: false,
		});
	}
	return ensureMatrixMergeGroupId({
		...row,
		rowKey,
		groupSource,
		mergeGroupId: resolveMatrixMergeGroupId({
			departmentLine: row.departmentLine,
			groupSource,
		}),
		jobCode: undefined,
		jobName: "",
		positionCode: undefined,
		positionName: "",
		positionLevel: undefined,
		requiredCount: undefined,
		tagMatchModelId: undefined,
		tagMatchModelName: "",
		editMode: "row",
		isAuthorizedJobLocked: true,
		isGroupCellMergeReady: true,
		isHierarchyCellMergeReady: true,
		isMatchModelConfirmed: false,
	});
}

/**
 * 构造外新增的空白草稿行。
 *
 * @param rowKey - 新行唯一键
 * @param mergeGroupId - 新草稿组唯一 ID
 * @returns 外新增草稿行
 * @author 王善能
 * @since 2026-07-08
 */
export function createStandaloneDraftMatrixRow(
	rowKey: string,
	mergeGroupId: string,
): EditableMatrixStateRow {
	return ensureMatrixMergeGroupId({
		rowKey,
		groupSource: "draft",
		mergeGroupId,
		departmentLine: undefined,
		authorizedJobId: undefined,
		authorizedJobName: "",
		jobCode: undefined,
		jobName: "",
		positionCode: undefined,
		positionName: "",
		positionLevel: undefined,
		requiredCount: undefined,
		editMode: "full",
		isGroupCellMergeReady: false,
		isHierarchyCellMergeReady: false,
		isMatchModelConfirmed: false,
	});
}

function buildIdLabelOptions(items: Array<{ label?: string; value?: string }>) {
	const uniqueMap = new Map<string, string>();
	items.forEach((item) => {
		const value = item.value?.trim();
		const label = item.label?.trim();
		if (value && label && !uniqueMap.has(value)) {
			uniqueMap.set(value, label);
		}
	});
	return Array.from(uniqueMap.entries()).map(([value, label]) => ({ value, label }));
}

/**
 * 生成岗位、职位、职级组合值。
 *
 * 该值用于矩阵行 TreeSelect 的唯一标识，并作为后续联动解析的基础字段。
 * 其中 positionLevel 在当前矩阵数据中承接的是职级值，而非仅用于界面展示的名称。
 *
 * @param row - 当前岗位相关字段
 * @param row.jobCode - 岗位编码
 * @param row.positionCode - 职位编码
 * @param row.positionLevel - 职级值
 * @returns 组合 value；任一关键字段缺失时返回 undefined
 * @author 王善能
 * @since 2026-07-08
 */
export function buildMatrixJobPositionValue(row?: {
	jobCode?: string;
	positionCode?: string;
	positionLevel?: string;
}) {
	if (
		!hasTextValue(row?.jobCode) ||
		!hasTextValue(row?.positionCode) ||
		!hasTextValue(row?.positionLevel)
	) {
		return undefined;
	}
	return [
		trim(String(row?.jobCode)),
		trim(String(row?.positionCode)),
		trim(String(row?.positionLevel)),
	].join("::");
}

/**
 * 生成岗位、职位、职级组合展示文案。
 *
 * @param row - 当前岗位相关字段
 * @param row.jobName - 岗位名称
 * @param row.positionName - 职位名称
 * @param row.positionLevel - 职级展示名称
 * @returns 组合展示文案
 * @author 王善能
 * @since 2026-07-08
 */
export function buildMatrixJobPositionSelectionLabel(row?: {
	jobName?: string;
	positionName?: string;
	positionLevel?: string;
}) {
	const parts = [row?.jobName, row?.positionName, row?.positionLevel]
		.map((item) => trim(item ?? ""))
		.filter(Boolean);
	return parts.length > 0 ? parts.join("-") : "";
}

/**
 * 构造 Form store 使用的矩阵行快照，补齐组合岗位字段。
 *
 * @param rows - 当前编辑态矩阵
 * @returns Form store 可消费的矩阵行
 * @author 王善能
 * @since 2026-07-08
 */
export function buildMatrixFormRows(rows: EditableMatrixStateRow[]): MatrixFormRow[] {
	return rows.map((row) => ({
		...row,
		jobPositionTreeValue: buildMatrixJobPositionValue(row),
	}));
}

/**
 * 收集当前行同组其他行已占用的岗位-职位-职级组合值。
 *
 * 同组定义为“条线 + 编制岗位”完全一致；
 * 当前行自身及未形成完整岗位组合的行不参与占用值计算。
 *
 * @param rows - 当前矩阵行集合
 * @param currentRow - 当前编辑行
 * @returns 同组其他行已占用的组合值集合
 * @author 王善能
 * @since 2026-07-08
 */
export function collectUsedMatrixJobPositionValues(
	rows: EditableMatrixStateRow[],
	currentRow: EditableMatrixStateRow,
) {
	if (!hasTextValue(currentRow.departmentLine) || !hasTextValue(currentRow.authorizedJobId)) {
		return new Set<string>();
	}
	return new Set(
		rows
			.filter(
				(row) =>
					row.rowKey !== currentRow.rowKey &&
					row.departmentLine === currentRow.departmentLine &&
					row.authorizedJobId === currentRow.authorizedJobId,
			)
			.map((row) => buildMatrixJobPositionValue(row))
			.filter((value): value is string => hasTextValue(value)),
	);
}

/**
 * 判断当前行是否允许参与“条线”列合并。
 *
 * @param row - 当前矩阵行
 * @returns 是否允许条线合并
 * @author 王善能
 * @since 2026-07-08
 */
export function resolveGroupCellMergeReady(row: EditableMatrixStateRow) {
	if (row.isGroupCellMergeReady != null) {
		return row.isGroupCellMergeReady;
	}
	if (!row.editMode) {
		return true;
	}
	return row.editMode === "row";
}

/**
 * 判断当前行是否允许参与“编制岗位”列合并。
 *
 * @param row - 当前矩阵行
 * @returns 是否允许层级列合并
 * @author 王善能
 * @since 2026-07-08
 */
export function resolveHierarchyCellMergeReady(row: EditableMatrixStateRow) {
	if (!row.editMode) {
		return true;
	}
	return Boolean(row.isHierarchyCellMergeReady);
}

/**
 * 判断当前行是否属于“初始组的组内子行”。
 *
 * 该类行来源于后端初始矩阵的组内新增，
 * 条线与编制岗位属于既定继承关系，编辑过程中不应退出前两列合并态。
 *
 * @param row - 当前矩阵行
 * @returns 是否为初始组的组内子行
 * @author 王善能
 * @since 2026-07-08
 */
export function isInitialGroupedChildRow(row: EditableMatrixStateRow) {
	return resolveMatrixGroupSource(row) === "initial" && row.editMode === "row";
}

/**
 * 判断当前编辑态行的匹配模型是否已经确认。
 *
 * @param row - 当前矩阵行
 * @returns 是否已确认匹配模型
 * @author 王善能
 * @since 2026-07-08
 */
export function isMatchModelConfirmed(row: EditableMatrixStateRow) {
	if (!row.editMode) {
		return true;
	}
	return Boolean(row.isMatchModelConfirmed);
}

/**
 * 标记编辑态行进入“结构字段已变更，需要暂时退出合并态”的状态。
 *
 * @param row - 当前矩阵行
 * @param options - 额外选项
 * @param options.preserveGroupCellMergeReady - 是否保留条线列合并资格
 * @returns 更新后的矩阵行
 * @author 王善能
 * @since 2026-07-08
 */
export function markEditingRow(
	row: EditableMatrixStateRow,
	options?: {
		preserveGroupCellMergeReady?: boolean;
	},
): EditableMatrixStateRow {
	const shouldPreserveMergedCells =
		options?.preserveGroupCellMergeReady || isInitialGroupedChildRow(row);
	return {
		...row,
		isGroupCellMergeReady: shouldPreserveMergedCells ? resolveGroupCellMergeReady(row) : false,
		isHierarchyCellMergeReady: shouldPreserveMergedCells
			? resolveHierarchyCellMergeReady(row)
			: false,
		isMatchModelConfirmed: row.isMatchModelConfirmed,
	};
}

/**
 * 将编辑态矩阵按当前合并资格做稳定重排，保证 rowSpan 依赖的物理相邻关系成立。
 *
 * 该实现不采用全局重排策略，而是在连续可合并区块内执行局部归并；
 * 对于正在编辑且尚未确认的行，保留其原始物理位置，以维持交互过程中的视觉稳定性。
 *
 * @param rows - 当前编辑态矩阵
 * @returns 适用于渲染与 Form 索引的稳定顺序矩阵
 * @author 王善能
 * @since 2026-07-08
 */
export function normalizeEditableMatrixRows(rows: EditableMatrixStateRow[]) {
	const normalizedRows: EditableMatrixStateRow[] = [];
	let mergeableBlock: EditableMatrixStateRow[] = [];

	const flushMergeableBlock = () => {
		if (mergeableBlock.length === 0) {
			return;
		}
		const mergeGroupOrder: string[] = [];
		const mergeGroupBuckets = new Map<
			string,
			Array<{ row: EditableMatrixStateRow; index: number }>
		>();

		mergeableBlock.forEach((row, index) => {
			const mergeGroupKey = resolveMatrixMergeGroupId(row);
			const mergeGroupBucket = mergeGroupBuckets.get(mergeGroupKey) ?? [];
			if (!mergeGroupBuckets.has(mergeGroupKey)) {
				mergeGroupBuckets.set(mergeGroupKey, mergeGroupBucket);
				mergeGroupOrder.push(mergeGroupKey);
			}
			mergeGroupBucket.push({ row, index });
		});

		normalizedRows.push(
			...mergeGroupOrder.flatMap((mergeGroupKey) => {
				const mergeGroupRows = mergeGroupBuckets.get(mergeGroupKey) ?? [];
				const departmentOrder: string[] = [];
				const departmentBuckets = new Map<
					string,
					Array<{ row: EditableMatrixStateRow; index: number }>
				>();

				mergeGroupRows.forEach((entry) => {
					const departmentKey = entry.row.departmentLine ?? "";
					const departmentBucket = departmentBuckets.get(departmentKey) ?? [];
					if (!departmentBuckets.has(departmentKey)) {
						departmentBuckets.set(departmentKey, departmentBucket);
						departmentOrder.push(departmentKey);
					}
					departmentBucket.push(entry);
				});

				return departmentOrder.flatMap((departmentKey) => {
					const departmentRows = departmentBuckets.get(departmentKey) ?? [];
					const authorizedOrder: string[] = [];
					const authorizedBuckets = new Map<
						string,
						Array<{ row: EditableMatrixStateRow; index: number }>
					>();

					departmentRows.forEach((entry) => {
						const authorizedKey = resolveHierarchyCellMergeReady(entry.row)
							? (entry.row.authorizedJobName ?? "")
							: `__row_authorized__${entry.row.rowKey ?? entry.index}`;
						const authorizedBucket = authorizedBuckets.get(authorizedKey) ?? [];
						if (!authorizedBuckets.has(authorizedKey)) {
							authorizedBuckets.set(authorizedKey, authorizedBucket);
							authorizedOrder.push(authorizedKey);
						}
						authorizedBucket.push(entry);
					});

					return authorizedOrder.flatMap((authorizedKey) =>
						(authorizedBuckets.get(authorizedKey) ?? []).map((entry) => entry.row),
					);
				});
			}),
		);
		mergeableBlock = [];
	};

	rows.forEach((row) => {
		const rowWithMergeGroup = ensureMatrixMergeGroupId(row);
		if (!resolveGroupCellMergeReady(row)) {
			flushMergeableBlock();
			normalizedRows.push(rowWithMergeGroup);
			return;
		}
		mergeableBlock.push(rowWithMergeGroup);
	});

	flushMergeableBlock();
	return normalizedRows;
}

/**
 * 获取某行在当前稳定顺序矩阵中的索引。
 *
 * @param rows - 当前编辑态矩阵
 * @param rowKey - 目标行主键
 * @returns 稳定顺序下的行索引
 * @author 王善能
 * @since 2026-07-08
 */
export function getNormalizedRowIndex(rows: EditableMatrixStateRow[], rowKey?: string) {
	if (!rowKey) {
		return -1;
	}
	return normalizeEditableMatrixRows(rows).findIndex((row) => row.rowKey === rowKey);
}

/**
 * 基于矩阵元数据与当前行，构造岗位-职位-职级树与编制岗位选项。
 *
 * @param meta - 岗位矩阵元数据
 * @param record - 当前编辑态矩阵行
 * @returns 当前行可选的编制岗位与岗位树选项
 * @author 王善能
 * @since 2026-07-08
 */
export function buildMatrixRowOptions(
	meta: PositionMatrixMetaItem[],
	record: EditableMatrixStateRow,
) {
	const lineMatched = record.departmentLine
		? meta.filter((item) => item.jobTypeName === record.departmentLine)
		: meta;
	const authorizedMatched = record.authorizedJobId
		? lineMatched.filter((item) => item.authorizedJobId === record.authorizedJobId)
		: lineMatched;
	const jobPositionTreeOptions = buildIdLabelOptions(
		authorizedMatched.map((item) => ({
			value: item.jobCode,
			label: item.jobName,
		})),
	)
		.map((jobOption) => {
			const matchedJobItems = authorizedMatched.filter(
				(item) => item.jobCode === jobOption.value,
			);
			const children = matchedJobItems.reduce<MatrixTreeSelectNode[]>((acc, item) => {
				const value = buildMatrixJobPositionValue({
					jobCode: item.jobCode,
					positionCode: item.postCode,
					positionLevel: item.positionLevel,
				});
				if (!value) {
					return acc;
				}
				acc.push({
					title: [item.postName, item.positionLevel]
						.map((part) => trim(part ?? ""))
						.filter(Boolean)
						.join("-"),
					value,
					selectionLabel: buildMatrixJobPositionSelectionLabel({
						jobName: item.jobName,
						positionName: item.postName,
						positionLevel: item.positionLevel,
					}),
					selectable: true,
				});
				return acc;
			}, []);
			return {
				title: jobOption.label,
				value: `job:${jobOption.value}`,
				selectionLabel: jobOption.label,
				selectable: false,
				children,
			} satisfies MatrixTreeSelectNode;
		})
		.filter((item) => item.children?.length);

	const currentTreeValue = buildMatrixJobPositionValue(record);
	const currentSelectionLabel = buildMatrixJobPositionSelectionLabel(record);
	const currentJobNodeValue = `job:${record.jobCode ?? "current"}`;
	const hasCurrentTreeValue =
		Boolean(currentTreeValue) &&
		jobPositionTreeOptions.some((jobNode) =>
			jobNode.children?.some((child) => child.value === currentTreeValue),
		);
	if (currentTreeValue && currentSelectionLabel && !hasCurrentTreeValue) {
		const currentChildNode: MatrixTreeSelectNode = {
			title: [record.positionName, record.positionLevel]
				.map((part) => trim(part ?? ""))
				.filter(Boolean)
				.join("-"),
			value: currentTreeValue,
			selectionLabel: currentSelectionLabel,
			selectable: true,
		};
		const existingJobNodeIndex = jobPositionTreeOptions.findIndex(
			(jobNode) => jobNode.value === currentJobNodeValue,
		);
		if (existingJobNodeIndex >= 0) {
			const existingJobNode = jobPositionTreeOptions[existingJobNodeIndex];
			jobPositionTreeOptions[existingJobNodeIndex] = {
				...existingJobNode,
				children: [...(existingJobNode.children ?? []), currentChildNode],
			};
		} else {
			jobPositionTreeOptions.unshift({
				title: record.jobName || "当前岗位",
				value: currentJobNodeValue,
				selectionLabel: record.jobName || currentSelectionLabel,
				selectable: false,
				children: [currentChildNode],
			});
		}
	}

	return {
		authorizedJobOptions: buildIdLabelOptions(
			lineMatched.map((item) => ({
				value: item.authorizedJobId,
				label: item.authorizedJobName,
			})),
		),
		jobPositionTreeOptions,
	};
}
