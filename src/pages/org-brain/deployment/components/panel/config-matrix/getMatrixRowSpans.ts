import type { DeployPositionMatrixRow } from "#src/api/org-brain/deployment";
import { trim } from "lodash-es";

export interface MatrixRowMergeEligibility {
	canMergeGroupCell: (row: DeployPositionMatrixRow) => boolean;
	canMergeHierarchyCells: (row: DeployPositionMatrixRow) => boolean;
}

export interface MatrixRowSpans {
	departmentLine: number[];
	authorizedJobName: number[];
}

export type MatrixMergeColumnKey = keyof MatrixRowSpans;

export const FULLY_MERGEABLE_MATRIX_ELIGIBILITY: MatrixRowMergeEligibility = {
	canMergeGroupCell: () => true,
	canMergeHierarchyCells: () => true,
};

function resolveRowMergeGroupId(row?: DeployPositionMatrixRow) {
	const mergeGroupId = trim(
		String((row as { mergeGroupId?: string } | undefined)?.mergeGroupId ?? ""),
	);
	if (mergeGroupId) {
		return mergeGroupId;
	}
	if (row?.departmentLine) {
		return `initial::${trim(String(row.departmentLine))}`;
	}
	if (row?.rowKey) {
		return `row::${trim(String(row.rowKey))}`;
	}
	return "row::__anonymous__";
}

export function getMatrixMergeCellProps(
	spans: MatrixRowSpans,
	columnKey: MatrixMergeColumnKey,
	index?: number,
) {
	return {
		rowSpan: index != null ? (spans[columnKey][index] ?? 1) : 1,
	};
}

/**
 * 按条线、编制两级字段对矩阵行做稳定分组排序，保证同组数据在渲染前物理相邻。
 *
 * 分组规则：
 * 1. 先按条线归并，确保同一条线的行连续，从而支持“条线”列整体合并
 * 2. 再在条线分组内按编制岗位归并，确保“编制岗位”仅在同条线范围内局部合并
 * 3. 条线组、编制组都以首次出现顺序决定展示顺序，组内维持原始相对顺序
 *
 * 这样既能满足 rowSpan 对物理相邻行的要求，又不会破坏后端原始分组顺序。
 *
 * @param matrix - 原始矩阵行数据
 * @returns 按条线、编制分组聚合后的矩阵行
 * @author 王善能
 * @since 2026-07-07
 */
export function groupMatrixRowsForMerge<T extends DeployPositionMatrixRow>(matrix: T[]): T[] {
	const departmentOrder: string[] = [];
	const departmentBuckets = new Map<string, T[]>();

	for (const row of matrix) {
		const departmentKey = row.departmentLine ?? "";
		let departmentBucket = departmentBuckets.get(departmentKey);
		if (!departmentBucket) {
			departmentBucket = [];
			departmentBuckets.set(departmentKey, departmentBucket);
			departmentOrder.push(departmentKey);
		}
		departmentBucket.push(row);
	}

	return departmentOrder.flatMap((departmentKey) => {
		const departmentRows = departmentBuckets.get(departmentKey) ?? [];
		const authorizedOrder: string[] = [];
		const authorizedBuckets = new Map<string, T[]>();

		for (const row of departmentRows) {
			const authorizedKey = row.authorizedJobName ?? "";
			let authorizedBucket = authorizedBuckets.get(authorizedKey);
			if (!authorizedBucket) {
				authorizedBucket = [];
				authorizedBuckets.set(authorizedKey, authorizedBucket);
				authorizedOrder.push(authorizedKey);
			}
			authorizedBucket.push(row);
		}

		return authorizedOrder.flatMap(
			(authorizedKey) => authorizedBuckets.get(authorizedKey) ?? [],
		);
	});
}

/**
 * 计算岗位矩阵可合并列的 rowSpan。
 * 条线支持单独判定合并资格，后续层级列只在整行完成配置后再逐级参与合并。
 *
 * @param matrix - 当前表格数据
 * @param eligibility - 行合并资格配置
 * @returns 各可合并列对应的 rowSpan，0 表示被上方单元格合并隐藏
 * @author 王善能
 * @since 2026-06-08
 */
export function getMatrixRowSpans(
	matrix: DeployPositionMatrixRow[],
	eligibility: MatrixRowMergeEligibility,
): MatrixRowSpans {
	const n = matrix.length;
	const departmentLine = Array.from<number>({ length: n });
	const authorizedJobName = Array.from<number>({ length: n });

	for (let i = 0; i < n; i++) {
		const currentRow = matrix[i];
		const currentCanMergeGroupCell = eligibility.canMergeGroupCell(currentRow);
		const currentCanMergeHierarchyCells = eligibility.canMergeHierarchyCells(currentRow);
		const prevRow = i > 0 ? matrix[i - 1] : undefined;
		const prevCanMergeGroupCell = prevRow ? eligibility.canMergeGroupCell(prevRow) : false;
		const prevCanMergeHierarchyCells = prevRow
			? eligibility.canMergeHierarchyCells(prevRow)
			: false;

		if (
			i > 0 &&
			prevCanMergeGroupCell &&
			currentCanMergeGroupCell &&
			resolveRowMergeGroupId(currentRow) === resolveRowMergeGroupId(prevRow) &&
			currentRow.departmentLine === prevRow?.departmentLine
		) {
			departmentLine[i] = 0;
		} else {
			let span = 1;
			while (
				i + span < n &&
				eligibility.canMergeGroupCell(matrix[i + span]) &&
				resolveRowMergeGroupId(matrix[i + span]) === resolveRowMergeGroupId(currentRow) &&
				matrix[i + span].departmentLine === currentRow.departmentLine
			) {
				span++;
			}
			departmentLine[i] = span;
		}

		if (!currentCanMergeHierarchyCells) {
			authorizedJobName[i] = 1;
			continue;
		}

		const lineSameForDetail =
			i > 0 &&
			prevCanMergeHierarchyCells &&
			currentCanMergeHierarchyCells &&
			resolveRowMergeGroupId(currentRow) === resolveRowMergeGroupId(prevRow) &&
			currentRow.departmentLine === prevRow?.departmentLine;
		if (lineSameForDetail && currentRow.authorizedJobName === prevRow?.authorizedJobName) {
			authorizedJobName[i] = 0;
		} else {
			let span = 1;
			while (
				i + span < n &&
				eligibility.canMergeHierarchyCells(matrix[i + span]) &&
				resolveRowMergeGroupId(matrix[i + span]) === resolveRowMergeGroupId(currentRow) &&
				matrix[i + span].departmentLine === currentRow.departmentLine &&
				matrix[i + span].authorizedJobName === currentRow.authorizedJobName
			) {
				span++;
			}
			authorizedJobName[i] = span;
		}
	}

	return {
		departmentLine,
		authorizedJobName,
	};
}
