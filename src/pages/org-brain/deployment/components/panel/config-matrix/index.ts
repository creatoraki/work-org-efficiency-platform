/** 岗位矩阵表格：标杆只读表、可编辑表（仅 step-views 内使用） */
export { BenchmarkMatrixTable } from "./BenchmarkMatrixTable";
export type { EditableMatrixTableHandle } from "./EditableMatrixTable";
export { EditableMatrixTable } from "./EditableMatrixTable";
export {
	FULLY_MERGEABLE_MATRIX_ELIGIBILITY,
	getMatrixMergeCellProps,
	getMatrixRowSpans,
	groupMatrixRowsForMerge,
} from "./getMatrixRowSpans";
