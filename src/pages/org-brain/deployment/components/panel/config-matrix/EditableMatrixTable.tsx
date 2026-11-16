import type { OrganizationTreeNode } from "#src/api/common";
import type {
	DeployPositionMatrixRow,
	PositionMatrixMetaItem,
} from "#src/api/org-brain/deployment";
import type { InitialModelData } from "#src/pages/tag-management/tag-matching/model/components/MatchingModelFormDrawer";
import type {
	MatchingModelItem,
	MatchingModelListParams,
} from "#src/pages/tag-management/tag-matching/model/types";
import type { ColumnsType } from "antd/es/table";
import type { ReactNode } from "react";
import type React from "react";
import type { EditableMatrixStateRow, MatrixFormRow } from "./matrixJobPositionUtils";
import MatchingModelFormDrawer from "#src/pages/tag-management/tag-matching/model/components/MatchingModelFormDrawer";
import MatchingModelViewDrawer from "#src/pages/tag-management/tag-matching/model/components/MatchingModelViewDrawer";
import { cn } from "#src/utils/cn";
import { DeleteOutlined, PlusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
	Button,
	Empty,
	Form,
	InputNumber,
	message,
	Select,
	Space,
	Table,
	Tooltip,
	TreeSelect,
	Typography,
} from "antd";
import { trim } from "lodash-es";
import { ChevronDown, ChevronRight, ChevronUp, Plus } from "lucide-react";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useMatchingModelRemoteOptions } from "@/pages/org-brain/hooks/useMatchingModelRemoteOptions";

import { getMatrixMergeCellProps, getMatrixRowSpans } from "./getMatrixRowSpans";
import { getMatrixCellRules } from "./matrixFormRules";
import {
	buildMatrixFormRows,
	buildMatrixJobPositionSelectionLabel,
	buildMatrixJobPositionValue,
	buildMatrixRowOptions,
	collectUsedMatrixJobPositionValues,
	createGroupedDraftMatrixRow,
	createStandaloneDraftMatrixRow,
	ensureMatrixMergeGroupId,
	filterMatrixJobPositionTreeOptions,
	getNormalizedRowIndex,
	isInitialGroupedChildRow,
	isMatchModelConfirmed,
	markEditingRow,
	MATRIX_DUPLICATE_ERROR_MESSAGE,
	mergeMatrixDuplicateError,
	normalizeEditableMatrixRows,
	resolveGroupCellMergeReady,
	resolveHierarchyCellMergeReady,
	resolveMatrixMergeGroupId,
} from "./matrixJobPositionUtils";

const { Text } = Typography;
const ONLINE_MATCHING_MODEL_STATUS = "1";
const MATRIX_TABLE_SCROLL_X = 900;

type EditableRow = EditableMatrixStateRow;

const MATRIX_SELECT_FIELD_KEYS: Array<keyof DeployPositionMatrixRow> = [
	"departmentLine",
	"authorizedJobId",
	"jobCode",
	"positionCode",
	"positionLevel",
	"tagMatchModelId",
];

function buildTextOptions(values: Array<string | undefined>) {
	return [...new Set(values)].filter(Boolean).map((v) => ({ label: v, value: v }));
}

function hasTextValue(value?: string) {
	return Boolean(trim(value ?? ""));
}

function hasTagMatchModelId(value?: string | number) {
	return Boolean(trim(String(value ?? "")));
}

function hasValidRequiredCount(value?: number | null) {
	return value != null && value >= 1;
}

function createDraftMatrixMergeGroupId() {
	return `draft::${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDraftMatrixRowKey() {
	return `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function canAddGroupedRow(row?: Partial<DeployPositionMatrixRow>) {
	return hasTextValue(row?.departmentLine) && hasTextValue(row?.authorizedJobId);
}

function canQueryMatchingModelOptions(orgMatchId?: string, row?: Partial<DeployPositionMatrixRow>) {
	return (
		hasTextValue(orgMatchId) &&
		hasTextValue(row?.jobCode) &&
		hasTextValue(row?.positionCode) &&
		hasTextValue(row?.positionLevel)
	);
}

/**
 * 组装排兵布阵场景的匹配模型查询参数。
 *
 * orgMatchId 本身就是匹配模型接口的组织入参；
 * 当岗位、职位、职级已选择后，再把三个条件一并补上。
 *
 * @param orgMatchId - 匹配组织编码，serverCode 优先，projectGroupCode 次之
 * @param row - 当前矩阵行
 * @returns 匹配模型列表查询参数
 * @author 王善能
 * @since 2026-06-30
 */
function buildMatchingModelRequestParams(
	orgMatchId?: string,
	row?: Partial<DeployPositionMatrixRow>,
): MatchingModelListParams {
	const params: MatchingModelListParams = {
		pageNum: 1,
		pageSize: 500,
		status: ONLINE_MATCHING_MODEL_STATUS,
		orgMatchId,
	};
	if (hasTextValue(row?.jobCode)) {
		params.jobIds = [trim(String(row?.jobCode))];
	}
	return params;
}

/**
 * 基于当前矩阵行构建匹配模型抽屉初始数据。
 *
 * 仅在组织、岗位、职位、职级信息均完整时返回，
 * 以保证新增模型入口能够复用当前矩阵行对应的匹配模型查询上下文。
 * 当前矩阵行字段仍沿用 positionLevel 命名，但此处消费的是用于匹配模型联动的职级值。
 *
 * @param row - 当前矩阵行
 * @param organizationNode - 通过 orgCode 命中的组织树节点
 * @param orgMatchId - 匹配模型接口入参 orgMatchId，取 serverCode 或 projectGroupCode
 * @param orgMatchName - 匹配模型上下文展示名称
 * @returns 匹配模型抽屉初始数据
 * @author 王善能
 * @since 2026-06-30
 */
function buildRowMatchingInitialData(
	row: Partial<DeployPositionMatrixRow>,
	organizationNode?: OrganizationTreeNode | null,
	orgMatchId?: string,
	orgMatchName?: string,
): Partial<InitialModelData> | undefined {
	if (!orgMatchId) {
		return undefined;
	}
	if (
		!hasTextValue(row.jobCode) ||
		!hasTextValue(row.positionCode) ||
		!hasTextValue(row.positionLevel)
	) {
		return undefined;
	}
	return {
		orgCode: organizationNode?.code ? String(organizationNode.code) : orgMatchId,
		orgId: organizationNode?.id ? String(organizationNode.id) : undefined,
		orgName: organizationNode?.name || orgMatchName || orgMatchId,
		orgLevel: organizationNode?.level || "SYS",
		jobId: row.jobCode,
		postId: row.positionCode,
		postgradeId: row.positionLevel,
	};
}

/**
 * 判断岗位矩阵行是否已经完成所有必填配置。
 *
 * @param row - 当前矩阵行
 * @returns 是否满足整行完成条件
 * @author 王善能
 * @since 2026-06-08
 */
function isMatrixRowComplete(row: EditableRow) {
	return (
		hasTextValue(row.departmentLine) &&
		hasTextValue(row.authorizedJobId) &&
		hasTextValue(row.jobCode) &&
		hasTextValue(row.positionCode) &&
		hasTextValue(row.positionLevel) &&
		hasTagMatchModelId(row.tagMatchModelId) &&
		isMatchModelConfirmed(row) &&
		hasValidRequiredCount(row.requiredCount)
	);
}

/**
 * 恢复暂存回显不完整行的编辑态。
 *
 * 暂存接口不会持久化 editMode 等前端临时字段；当用户只填写人数后返回页面，
 * 条线与编制岗位仍为空，需要按新增行继续展示为可编辑控件。
 *
 * @param row - 后端回显或父组件传入的矩阵行
 * @returns 补齐编辑态后的矩阵行
 * @author 王善能
 * @since 2026-06-15
 */
function restoreEditableStateForIncompleteRow(row: EditableRow): EditableRow {
	if (row.editMode || isMatrixRowComplete(row)) {
		return ensureMatrixMergeGroupId(row);
	}
	if (hasTextValue(row.departmentLine) && hasTextValue(row.authorizedJobId)) {
		return ensureMatrixMergeGroupId(row);
	}
	const editMode = hasTextValue(row.departmentLine) ? "row" : "full";
	return ensureMatrixMergeGroupId({
		...row,
		editMode,
		groupSource: "draft",
		isGroupCellMergeReady: editMode === "row",
		isHierarchyCellMergeReady: false,
		isMatchModelConfirmed: false,
	});
}

interface MatchingModelSelectProps {
	value?: string;
	valueLabel?: string;
	options: MatchingModelItem[];
	queried?: boolean;
	loadFailed?: boolean;
	onChange?: (value: string, option?: MatchingModelItem) => void;
	onBlur?: () => void;
	onOpenChange?: (open: boolean) => void;
	onViewDetail: (modelId: string) => void;
	status?: "error" | "warning";
	disabled?: boolean;
	loading?: boolean;
}

function MatchingModelSelectInner(
	{
		value,
		valueLabel,
		options,
		queried = false,
		loadFailed = false,
		onChange,
		onOpenChange,
		onViewDetail,
		status,
		loading = false,
		...rest
	}: MatchingModelSelectProps,
	ref: React.ForwardedRef<React.ComponentRef<typeof Select>>,
) {
	const [open, setOpen] = useState(false);
	const selectedLabel =
		valueLabel || options.find((item) => String(item.id) === value)?.name || "请选择匹配模型";

	return (
		<Select
			{...rest}
			ref={ref}
			status={status}
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				onOpenChange?.(nextOpen);
			}}
			value={value || undefined}
			options={options}
			size="small"
			placeholder="请选择匹配模型"
			className="w-full"
			loading={loading}
			showSearch
			fieldNames={{ label: "name", value: "id" }}
			optionFilterProp="name"
			popupMatchSelectWidth={256}
			notFoundContent={
				loading ? null : loadFailed ? (
					<div className="py-3 text-center text-xs text-[#F56C6C]">
						匹配模型加载失败，请重试
					</div>
				) : queried ? (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配模型" />
				) : null
			}
			suffixIcon={
				open ? (
					<ChevronUp className="size-3 text-[#606266]" strokeWidth={2} />
				) : (
					<ChevronDown className="size-3 text-[#606266]" strokeWidth={2} />
				)
			}
			onChange={(nextValue, option) =>
				onChange?.(String(nextValue), option as MatchingModelItem | undefined)
			}
			optionRender={(option) => {
				const optionItem = option.data as MatchingModelItem;
				const optionLabel = String(optionItem.name ?? "");
				return (
					<div className="flex items-center gap-2 py-1">
						<Text
							className="min-w-0 flex-1 text-sm leading-6 text-[#323233]"
							ellipsis={{ tooltip: optionLabel }}
						>
							{optionLabel}
						</Text>
						<button
							type="button"
							className="inline-flex shrink-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[12px] leading-5 text-[#909399] shadow-none outline-none transition-colors hover:bg-transparent hover:text-[#606266]"
							onMouseDown={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								if (optionItem?.id) {
									setOpen(false);
									onViewDetail(String(optionItem.id));
								}
							}}
						>
							<span>匹配模型详情</span>
							<ChevronRight className="size-2.5" strokeWidth={2} />
						</button>
					</div>
				);
			}}
			labelRender={() => (
				<Text
					className="block w-full text-sm leading-6 text-[#323233]"
					ellipsis={{ tooltip: selectedLabel }}
				>
					{selectedLabel}
				</Text>
			)}
		/>
	);
}

const MatchingModelSelect = forwardRef(MatchingModelSelectInner);

interface MatrixMatchingModelFieldProps {
	value?: string;
	valueLabel?: string;
	requestParams?: MatchingModelListParams;
	disabled?: boolean;
	onChange?: (value: string, option?: MatchingModelItem) => void;
	onBlur?: () => void;
	onViewDetail: (modelId: string) => void;
}

/**
 * 岗位矩阵行的匹配模型下拉字段。
 *
 * 远程选项状态在字段组件内自治：展开时请求，参数变化时重置。
 * 父表格只关心最终选中的模型值与名称，不再承担下拉远程状态管理职责。
 *
 * @param props - 匹配模型字段属性
 * @param props.value - 当前选中的匹配模型 ID
 * @param props.valueLabel - 当前选中的匹配模型名称
 * @param props.requestParams - 当前行对应的匹配模型查询参数
 * @param props.disabled - 是否禁用下拉
 * @param props.onChange - 匹配模型值变更回调
 * @param props.onBlur - 下拉失焦回调
 * @param props.onViewDetail - 查看匹配模型详情回调
 * @returns 匹配模型下拉字段
 * @author 王善能
 * @since 2026-07-09
 */
function MatrixMatchingModelField({
	value,
	valueLabel,
	requestParams,
	disabled = false,
	onChange,
	onBlur,
	onViewDetail,
}: MatrixMatchingModelFieldProps) {
	const { getDisplayOptions, remoteState, refreshOptions } = useMatchingModelRemoteOptions({
		params: requestParams,
		enabled: false,
	});
	const displayOptions = useMemo(
		() =>
			getDisplayOptions({
				id: value,
				name: valueLabel,
			}),
		[getDisplayOptions, value, valueLabel],
	);

	return (
		<MatchingModelSelect
			value={value}
			valueLabel={valueLabel}
			options={displayOptions}
			queried={remoteState.queried}
			loadFailed={remoteState.loadFailed}
			disabled={disabled}
			loading={remoteState.loading}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					return;
				}
				if (remoteState.loading) {
					return;
				}
				void refreshOptions().catch(() => {});
			}}
			onChange={onChange}
			onBlur={onBlur}
			onViewDetail={onViewDetail}
		/>
	);
}

const MATRIX_DUPLICATE_WARNING_KEY = "deployment-matrix-duplicate-warning";

interface EditableMatrixTableProps {
	matrix: DeployPositionMatrixRow[];
	meta: PositionMatrixMetaItem[];
	orgMatchId?: string;
	orgMatchName?: string;
	organizationTreeData?: OrganizationTreeNode | null;
	onChange: (matrix: DeployPositionMatrixRow[]) => void;
	readonly?: boolean;
	/** 表体纵向滚动高度；传 false 时不限制高度，按内容自然撑开 */
	bodyScrollY?: number | false;
}

/** 岗位矩阵表校验句柄：仅校验，不展示表单项下方错误文案 */
export interface EditableMatrixTableHandle {
	validate: () => Promise<boolean>;
}

interface MatrixFormValues {
	rows: MatrixFormRow[];
}

/** 岗位矩阵 Form 中参与校验的字段（与 Form.Item name 一致） */
type MatrixValidateFieldKey =
	| "departmentLine"
	| "authorizedJobId"
	| "jobPositionTreeValue"
	| "tagMatchModelId"
	| "requiredCount";

function getMatrixValidateFieldKeys(row: EditableRow): MatrixValidateFieldKey[] {
	const names: MatrixValidateFieldKey[] = [
		"jobPositionTreeValue",
		"tagMatchModelId",
		"requiredCount",
	];
	if (row.editMode === "full") {
		names.unshift("departmentLine");
	}
	if (row.editMode === "row" || row.editMode === "full") {
		names.unshift("authorizedJobId");
	}
	return names;
}

const MATRIX_UNIQUE_FIELD_KEYS = [
	"departmentLine",
	"authorizedJobId",
	"jobCode",
	"positionCode",
	"positionLevel",
] as const;

function normalizeMatrixUniqueValue(value?: string | number | null) {
	return trim(String(value ?? ""));
}

function isMatrixUniqueFieldsComplete(row?: Partial<DeployPositionMatrixRow>) {
	if (!row) {
		return false;
	}
	return MATRIX_UNIQUE_FIELD_KEYS.every(
		(fieldKey) => normalizeMatrixUniqueValue(row[fieldKey]).length > 0,
	);
}

function isSameMatrixUniqueCombination(
	left?: Partial<DeployPositionMatrixRow>,
	right?: Partial<DeployPositionMatrixRow>,
) {
	if (!left || !right) {
		return false;
	}
	return MATRIX_UNIQUE_FIELD_KEYS.every(
		(fieldKey) =>
			normalizeMatrixUniqueValue(left[fieldKey]) ===
			normalizeMatrixUniqueValue(right[fieldKey]),
	);
}

function getMatrixUniqueCombinationKey(row?: Partial<DeployPositionMatrixRow>) {
	if (!isMatrixUniqueFieldsComplete(row)) {
		return "";
	}
	return MATRIX_UNIQUE_FIELD_KEYS.map((fieldKey) =>
		normalizeMatrixUniqueValue(row?.[fieldKey]),
	).join("|");
}

function getDuplicateMatrixRowIndexes(rows: Array<Partial<DeployPositionMatrixRow>>) {
	const duplicateIndexes: number[] = [];
	const combinationMap = new Map<string, number[]>();

	rows.forEach((row, rowIndex) => {
		const combinationKey = getMatrixUniqueCombinationKey(row);
		if (!combinationKey) {
			return;
		}
		const indexes = combinationMap.get(combinationKey) ?? [];
		indexes.push(rowIndex);
		combinationMap.set(combinationKey, indexes);
	});

	combinationMap.forEach((indexes) => {
		if (indexes.length > 1) {
			duplicateIndexes.push(...indexes);
		}
	});

	return [...new Set(duplicateIndexes)].sort((left, right) => left - right);
}

/**
 * 合并 props.matrix 与 Form store。
 *
 * props.matrix 负责保留未注册字段（如条线、岗位名称等）；
 * Form store 优先提供用户最新编辑的 tagMatchModelId、requiredCount 等值，
 * 以避免校验前的 setFieldsValue 回写覆盖当前交互状态。
 */
function mergeMatrixWithFormRows(matrix: EditableRow[], formRows?: MatrixFormRow[]): EditableRow[] {
	if (!formRows?.length) {
		return matrix;
	}
	return matrix.map((row, index) => {
		const formRow = formRows[index];
		if (!formRow) {
			return row;
		}
		return {
			...row,
			tagMatchModelId: hasTagMatchModelId(formRow.tagMatchModelId)
				? formRow.tagMatchModelId
				: row.tagMatchModelId,
			tagMatchModelName: formRow.tagMatchModelName?.trim()
				? formRow.tagMatchModelName
				: row.tagMatchModelName,
			requiredCount: formRow.requiredCount,
			departmentLine: formRow.departmentLine?.trim()
				? formRow.departmentLine
				: row.departmentLine,
			authorizedJobId: formRow.authorizedJobId?.trim()
				? formRow.authorizedJobId
				: row.authorizedJobId,
			authorizedJobName: formRow.authorizedJobName?.trim()
				? formRow.authorizedJobName
				: row.authorizedJobName,
			jobCode: formRow.jobCode?.trim() ? formRow.jobCode : row.jobCode,
			jobName: formRow.jobName?.trim() ? formRow.jobName : row.jobName,
			positionCode: formRow.positionCode?.trim() ? formRow.positionCode : row.positionCode,
			positionName: formRow.positionName?.trim() ? formRow.positionName : row.positionName,
			positionLevel: formRow.positionLevel?.trim()
				? formRow.positionLevel
				: row.positionLevel,
		};
	});
}

const EditableMatrixTableInner = (
	{
		matrix,
		meta,
		orgMatchId,
		orgMatchName,
		organizationTreeData,
		onChange,
		readonly,
		bodyScrollY,
	}: EditableMatrixTableProps,
	ref: React.ForwardedRef<EditableMatrixTableHandle>,
) => {
	const [form] = Form.useForm<MatrixFormValues>();
	const [activeMatchingModelRowKey, setActiveMatchingModelRowKey] = useState<string | null>(null);
	const [isMatchingModelDrawerOpen, setIsMatchingModelDrawerOpen] = useState(false);
	const [viewModelId, setViewModelId] = useState<string>();
	const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
	const tableWrapperRef = useRef<HTMLDivElement>(null);
	const latestRowsRef = useRef<EditableRow[]>([]);
	const shouldScrollToBottomRef = useRef(false);

	const findScrollableAncestor = useCallback((node: HTMLElement | null) => {
		let current = node?.parentElement ?? null;
		while (current) {
			if (current.scrollHeight > current.clientHeight + 1) {
				const style = window.getComputedStyle(current);
				if (/auto|scroll/.test(style.overflowY)) {
					return current;
				}
			}
			current = current.parentElement;
		}
		return null;
	}, []);

	const scrollTableBodyToBottom = useCallback(() => {
		const tableBody = tableWrapperRef.current?.querySelector(".ant-table-body");
		if (
			tableBody instanceof HTMLDivElement &&
			tableBody.scrollHeight > tableBody.clientHeight + 1
		) {
			const targetTop = tableBody.scrollHeight;
			if (typeof tableBody.scrollTo === "function") {
				tableBody.scrollTo({
					top: targetTop,
					behavior: "smooth",
				});
				return;
			}
			tableBody.scrollTop = targetTop;
			return;
		}

		const scrollableAncestor = findScrollableAncestor(tableWrapperRef.current);
		if (!scrollableAncestor) {
			return;
		}
		const targetTop = scrollableAncestor.scrollHeight;
		if (typeof scrollableAncestor.scrollTo === "function") {
			scrollableAncestor.scrollTo({
				top: targetTop,
				behavior: "smooth",
			});
			return;
		}
		scrollableAncestor.scrollTop = targetTop;
	}, [findScrollableAncestor]);

	const editableMatrix = useMemo(
		() =>
			normalizeEditableMatrixRows(
				(matrix as EditableRow[]).map(restoreEditableStateForIncompleteRow),
			),
		[matrix],
	);

	useEffect(() => {
		latestRowsRef.current = editableMatrix;
		form.setFieldsValue({ rows: buildMatrixFormRows(editableMatrix) });
	}, [editableMatrix, form]);

	const syncRowsToParent = useCallback(
		(rows: EditableRow[]) => {
			onChange(rows);
		},
		[onChange],
	);

	const revalidateJobPositionFields = useCallback(
		(
			rows: EditableRow[],
			options?: {
				silent?: boolean;
			},
		) => {
			const normalizedRows = normalizeEditableMatrixRows(rows);
			const duplicateRowIndexSet = new Set(
				getDuplicateMatrixRowIndexes(normalizedRows).map((rowIndex) => rowIndex),
			);
			const jobPositionNameList = normalizedRows.map(
				(_, rowIndex) =>
					["rows", rowIndex, "jobPositionTreeValue"] as [
						"rows",
						number,
						"jobPositionTreeValue",
					],
			);
			if (jobPositionNameList.length === 0) {
				if (!options?.silent) {
					message.destroy(MATRIX_DUPLICATE_WARNING_KEY);
				}
				return duplicateRowIndexSet;
			}
			queueMicrotask(() => {
				const currentFieldErrors = form.getFieldsError(jobPositionNameList);
				form.setFields(
					jobPositionNameList.map((name, rowIndex) => {
						const currentFieldError = currentFieldErrors.find(
							(fieldError) =>
								Array.isArray(fieldError.name) &&
								fieldError.name.join(".") === name.join("."),
						);
						return {
							name,
							errors: mergeMatrixDuplicateError(currentFieldError?.errors, {
								hasDuplicate: duplicateRowIndexSet.has(rowIndex),
							}),
						};
					}),
				);
				if (duplicateRowIndexSet.size === 0 && !options?.silent) {
					message.destroy(MATRIX_DUPLICATE_WARNING_KEY);
				}
			});
			return duplicateRowIndexSet;
		},
		[form],
	);

	const applyRows = useCallback(
		(next: EditableRow[]) => {
			const normalizedRows = normalizeEditableMatrixRows(next);
			latestRowsRef.current = normalizedRows;
			form.setFieldsValue({ rows: buildMatrixFormRows(normalizedRows) });
			syncRowsToParent(normalizedRows);
		},
		[form, syncRowsToParent],
	);

	const activeMatchingModelRow = useMemo(
		() =>
			activeMatchingModelRowKey
				? editableMatrix.find((row) => row.rowKey === activeMatchingModelRowKey)
				: undefined,
		[activeMatchingModelRowKey, editableMatrix],
	);

	const activeMatchingModelInitialData = useMemo(
		() =>
			activeMatchingModelRow
				? buildRowMatchingInitialData(
						activeMatchingModelRow,
						organizationTreeData,
						orgMatchId,
						orgMatchName,
					)
				: undefined,
		[activeMatchingModelRow, orgMatchId, orgMatchName, organizationTreeData],
	);

	useImperativeHandle(
		ref,
		() => ({
			/**
			 * 使用 Form.validateFields 触发校验；表单项 noStyle 仅向子控件传递 error 状态（红框），不渲染下方错误文案。
			 */
			validate: async () => {
				if (readonly) {
					return true;
				}
				const formRows = form.getFieldValue("rows") as MatrixFormRow[] | undefined;
				const rows = mergeMatrixWithFormRows(latestRowsRef.current, formRows);
				form.setFieldsValue({ rows: buildMatrixFormRows(rows) });
				const validateNameList = rows.flatMap((row, rowIndex) =>
					getMatrixValidateFieldKeys(row).map(
						(field) =>
							["rows", rowIndex, field] as ["rows", number, MatrixValidateFieldKey],
					),
				);
				try {
					await form.validateFields(validateNameList);
					syncRowsToParent(rows);
					if (validateNameList.length > 0) {
						form.setFields(
							validateNameList.map((name) => ({
								name,
								errors: [] as string[],
							})),
						);
					}
					return true;
				} catch {
					return false;
				}
			},
		}),
		[editableMatrix, form, readonly, syncRowsToParent],
	);

	useLayoutEffect(() => {
		if (!shouldScrollToBottomRef.current) {
			return;
		}
		shouldScrollToBottomRef.current = false;
		requestAnimationFrame(() => {
			scrollTableBodyToBottom();
		});
	}, [editableMatrix.length, scrollTableBodyToBottom]);

	const lineOptions = useMemo(() => {
		const metaLineOptions = buildTextOptions(meta.map((item) => item.jobTypeName));
		return metaLineOptions.length > 0
			? metaLineOptions
			: buildTextOptions(editableMatrix.map((r) => r.departmentLine));
	}, [editableMatrix, meta]);

	const getRowOptions = useCallback(
		(record: EditableRow) => {
			const rowOptions = buildMatrixRowOptions(meta, record);
			const currentTreeValue = buildMatrixJobPositionValue(record);
			const usedJobPositionValueSet = collectUsedMatrixJobPositionValues(
				editableMatrix,
				record,
			);
			return {
				lineOptions,
				...rowOptions,
				jobPositionTreeOptions: filterMatrixJobPositionTreeOptions(
					rowOptions.jobPositionTreeOptions,
					usedJobPositionValueSet,
					currentTreeValue,
				),
			};
		},
		[editableMatrix, lineOptions, meta],
	);

	const handleFieldChange = useCallback(
		(
			key: string,
			field: keyof DeployPositionMatrixRow | "jobPositionTreeValue",
			value: string | number,
			options?: {
				matchingModel?: MatchingModelItem;
			},
		) => {
			let nextRows = editableMatrix.map((r) => {
				if (r.rowKey !== key) {
					return r;
				}
				if (field === "tagMatchModelId") {
					return {
						...r,
						tagMatchModelId: value,
						tagMatchModelName: options?.matchingModel?.name ?? "",
						isMatchModelConfirmed: false,
					};
				}
				if (field === "departmentLine") {
					return markEditingRow({
						...r,
						departmentLine: String(value),
						authorizedJobId: undefined,
						authorizedJobName: "",
						jobCode: undefined,
						jobName: "",
						positionCode: undefined,
						positionName: "",
						positionLevel: undefined,
						tagMatchModelId: undefined,
						tagMatchModelName: "",
					});
				}
				if (field === "authorizedJobId") {
					const metaItem = meta.find(
						(item) =>
							item.jobTypeName === r.departmentLine &&
							item.authorizedJobId === String(value),
					);
					return markEditingRow(
						{
							...r,
							authorizedJobId: String(value),
							authorizedJobName: metaItem?.authorizedJobName ?? "",
							jobCode: undefined,
							jobName: "",
							positionCode: undefined,
							positionName: "",
							positionLevel: undefined,
							tagMatchModelId: undefined,
							tagMatchModelName: "",
						},
						{ preserveGroupCellMergeReady: true },
					);
				}
				if (field === "jobPositionTreeValue") {
					const metaItem = meta.find(
						(item) =>
							item.jobTypeName === r.departmentLine &&
							item.authorizedJobId === r.authorizedJobId &&
							buildMatrixJobPositionValue({
								jobCode: item.jobCode,
								positionCode: item.postCode,
								positionLevel: item.positionLevel,
							}) === String(value),
					);
					return markEditingRow(
						{
							...r,
							jobCode: metaItem?.jobCode,
							jobName: metaItem?.jobName ?? "",
							positionCode: metaItem?.postCode,
							positionName: metaItem?.postName ?? "",
							positionLevel: metaItem?.positionLevel,
							tagMatchModelId: undefined,
							tagMatchModelName: "",
						},
						{ preserveGroupCellMergeReady: true },
					);
				}
				if (field === "requiredCount") {
					return {
						...r,
						requiredCount:
							typeof value === "number" ? value : Number(value || 0) || undefined,
					};
				}
				return markEditingRow({ ...r, [field]: value });
			});
			const parentRow = nextRows.find((row) => row.rowKey === key);
			const parentMergeGroupId = resolveMatrixMergeGroupId(parentRow);
			if (field === "departmentLine") {
				nextRows = nextRows.map((row) => {
					if (
						row.rowKey === key ||
						row.editMode !== "row" ||
						resolveMatrixMergeGroupId(row) !== parentMergeGroupId
					) {
						return row;
					}
					return markEditingRow({
						...row,
						departmentLine: String(value),
						authorizedJobId: undefined,
						authorizedJobName: "",
						jobCode: undefined,
						jobName: "",
						positionCode: undefined,
						positionName: "",
						positionLevel: undefined,
						tagMatchModelId: undefined,
						tagMatchModelName: "",
					});
				});
			}
			if (field === "authorizedJobId") {
				nextRows = nextRows.map((row) => {
					if (
						row.rowKey === key ||
						row.editMode !== "row" ||
						resolveMatrixMergeGroupId(row) !== parentMergeGroupId
					) {
						return row;
					}
					return markEditingRow(
						{
							...row,
							authorizedJobId: String(value),
							authorizedJobName: parentRow?.authorizedJobName ?? "",
							jobCode: undefined,
							jobName: "",
							positionCode: undefined,
							positionName: "",
							positionLevel: undefined,
							tagMatchModelId: undefined,
							tagMatchModelName: "",
						},
						{ preserveGroupCellMergeReady: true },
					);
				});
			}
			applyRows(nextRows);
			const rowIndex = getNormalizedRowIndex(nextRows, key);
			if (rowIndex >= 0) {
				const validateNameList: Array<
					["rows", number, keyof DeployPositionMatrixRow | "jobPositionTreeValue"]
				> = [["rows", rowIndex, field]];
				if (
					field === "departmentLine" ||
					field === "authorizedJobId" ||
					field === "jobPositionTreeValue"
				) {
					revalidateJobPositionFields(nextRows, { silent: true });
					const currentRow = normalizeEditableMatrixRows(nextRows)[rowIndex];
					const hasSelectedJobPosition = hasTextValue(
						buildMatrixJobPositionValue(currentRow),
					);
					if (hasSelectedJobPosition || field === "jobPositionTreeValue") {
						validateNameList.push(["rows", rowIndex, "jobPositionTreeValue"]);
					}
				}
				queueMicrotask(() => {
					void form.validateFields(validateNameList).catch(() => {});
				});
			}
		},
		[applyRows, editableMatrix, form, meta, revalidateJobPositionFields],
	);

	const handleDelete = useCallback(
		(key: string) => {
			const deletedRow = editableMatrix.find((row) => row.rowKey === key);
			const deletedRowUniqueKey = getMatrixUniqueCombinationKey(deletedRow);
			const nextRows = editableMatrix.filter((r) => r.rowKey !== key);
			applyRows(nextRows);
			if (!deletedRowUniqueKey) {
				return;
			}
			revalidateJobPositionFields(nextRows, { silent: true });
		},
		[applyRows, editableMatrix, revalidateJobPositionFields],
	);

	const handleAddGroupedRow = useCallback(
		(record: EditableRow) => {
			if (!canAddGroupedRow(record)) {
				return;
			}
			const index = editableMatrix.findIndex((r) => r.rowKey === record.rowKey);
			const next = [...editableMatrix];
			const newRow = createGroupedDraftMatrixRow(record, createDraftMatrixRowKey());
			next.splice(index + 1, 0, newRow);
			applyRows(next);
		},
		[applyRows, editableMatrix],
	);

	const handleAddStandaloneRow = useCallback(() => {
		shouldScrollToBottomRef.current = true;
		const newRow = createStandaloneDraftMatrixRow(
			createDraftMatrixRowKey(),
			createDraftMatrixMergeGroupId(),
		);
		const nextRows = [...editableMatrix, newRow];
		applyRows(nextRows);
	}, [applyRows, editableMatrix]);

	const handleFieldCommit = useCallback(
		(key: string, field: keyof DeployPositionMatrixRow | "jobPositionTreeValue") => {
			applyRows(
				latestRowsRef.current.map((row) => {
					if (row.rowKey !== key) {
						return row;
					}
					if (!row.editMode) {
						return row;
					}
					const nextRow: EditableRow = {
						...row,
						isMatchModelConfirmed:
							field === "tagMatchModelId" && hasTagMatchModelId(row.tagMatchModelId)
								? true
								: row.isMatchModelConfirmed,
					};
					const completed = isMatrixRowComplete(nextRow);
					const shouldPreserveMergedCells = isInitialGroupedChildRow(row);
					return {
						...nextRow,
						isGroupCellMergeReady: completed || shouldPreserveMergedCells,
						isHierarchyCellMergeReady: completed || shouldPreserveMergedCells,
					};
				}),
			);
		},
		[applyRows],
	);

	const handleOpenAddMatchingModel = useCallback(
		(record: EditableRow) => {
			if (!canQueryMatchingModelOptions(orgMatchId, record)) {
				message.warning("请先选择岗位-职位-职级");
				return;
			}
			setActiveMatchingModelRowKey(record.rowKey ?? null);
			setIsMatchingModelDrawerOpen(true);
		},
		[orgMatchId],
	);

	const handleMatchingModelCreateSuccess = useCallback(
		async (result?: { modelId?: string; modelName?: string }) => {
			const savedModelId = trim(String(result?.modelId ?? ""));
			const savedModelName = trim(result?.modelName ?? "");
			if (!activeMatchingModelRowKey || !savedModelId) {
				setIsMatchingModelDrawerOpen(false);
				setActiveMatchingModelRowKey(null);
				return;
			}
			const currentRow = editableMatrix.find(
				(row) => row.rowKey === activeMatchingModelRowKey,
			);
			if (!currentRow) {
				setIsMatchingModelDrawerOpen(false);
				setActiveMatchingModelRowKey(null);
				return;
			}
			const nextRows = editableMatrix.map((row) => {
				if (row.rowKey !== activeMatchingModelRowKey) {
					return row;
				}
				return {
					...row,
					tagMatchModelId: savedModelId,
					tagMatchModelName: savedModelName || row.tagMatchModelName || "",
					isMatchModelConfirmed: false,
				};
			});
			applyRows(nextRows);
			queueMicrotask(() => {
				const rowIndex = getNormalizedRowIndex(nextRows, activeMatchingModelRowKey);
				if (rowIndex >= 0) {
					void form
						.validateFields([["rows", rowIndex, "tagMatchModelId"]])
						.catch(() => {});
				}
			});
			setIsMatchingModelDrawerOpen(false);
			setActiveMatchingModelRowKey(null);
		},
		[activeMatchingModelRowKey, applyRows, editableMatrix, form],
	);

	// 表格渲染以归一化后的 props.matrix 为准，不使用 Form.useWatch("rows") 作为 dataSource。
	// 原因在于未挂载 Form.Item 的字段（如条线、岗位名称等）不会完整保存在 store 中，
	// 若直接以 store 结果驱动渲染，将出现展示字段缺失的问题。
	const tableRows = editableMatrix;
	const spans = getMatrixRowSpans(tableRows, {
		canMergeGroupCell: (row) => resolveGroupCellMergeReady(row as EditableRow),
		canMergeHierarchyCells: (row) => resolveHierarchyCellMergeReady(row as EditableRow),
	});

	const buildDuplicateJobPositionRule = useCallback(
		(fieldIndex: number) => ({
			validator: async () => {
				const formRows = form.getFieldValue("rows") as MatrixFormRow[] | undefined;
				const currentRows = mergeMatrixWithFormRows(latestRowsRef.current, formRows);
				const currentRow = currentRows[fieldIndex];
				const duplicateRowIndexSet = revalidateJobPositionFields(currentRows, {
					silent: true,
				});
				if (!isMatrixUniqueFieldsComplete(currentRow)) {
					return;
				}
				const currentRowDuplicateIndexes = Array.from(duplicateRowIndexSet).filter(
					(rowIndex) => isSameMatrixUniqueCombination(currentRows[rowIndex], currentRow),
				);
				if (currentRowDuplicateIndexes.length > 1) {
					const touched = form.isFieldTouched([
						"rows",
						fieldIndex,
						"jobPositionTreeValue",
					]);
					if (touched) {
						message.error({
							key: MATRIX_DUPLICATE_WARNING_KEY,
							content: MATRIX_DUPLICATE_ERROR_MESSAGE,
						});
					}
					throw new Error(MATRIX_DUPLICATE_ERROR_MESSAGE);
				}
				if (duplicateRowIndexSet.size === 0) {
					message.destroy(MATRIX_DUPLICATE_WARNING_KEY);
				}
			},
		}),
		[form, revalidateJobPositionFields],
	);

	const wrapFormCell = (
		fieldIndex: number,
		fieldKey: keyof DeployPositionMatrixRow | "jobPositionTreeValue",
		row: EditableRow | undefined,
		node: ReactNode,
	) => {
		if (readonly) {
			return node;
		}
		return (
			<Form.Item
				name={["rows", fieldIndex, fieldKey]}
				noStyle
				hasFeedback={false}
				getValueProps={(value) => {
					if (
						(fieldKey === "jobPositionTreeValue" ||
							MATRIX_SELECT_FIELD_KEYS.includes(
								fieldKey as keyof DeployPositionMatrixRow,
							)) &&
						trim(String(value ?? "")) === ""
					) {
						return { value: undefined };
					}
					return { value };
				}}
				validateTrigger={fieldKey === "jobPositionTreeValue" ? ["onChange", "onBlur"] : []}
				rules={
					fieldKey === "jobPositionTreeValue"
						? [
								...getMatrixCellRules(row, fieldKey),
								buildDuplicateJobPositionRule(fieldIndex),
							]
						: getMatrixCellRules(row, fieldKey)
				}
			>
				{node}
			</Form.Item>
		);
	};

	const req = (text: string) => (
		<div className="flex items-center gap-0.5">
			<span className="text-red-500">*</span>
			{text}
		</div>
	);

	const columns: ColumnsType<EditableRow> = [
		{
			title: req("条线"),
			dataIndex: "departmentLine",
			width: 120,
			onCell: (_: EditableRow, index?: number) =>
				getMatrixMergeCellProps(spans, "departmentLine", index),
			render: (val: string, record, index) => {
				const rowOptions = getRowOptions(record);
				if (!readonly && record.editMode === "full") {
					return wrapFormCell(
						index,
						"departmentLine",
						record,
						<Select
							options={rowOptions.lineOptions}
							size="small"
							placeholder="请选择条线"
							className="w-full"
							onBlur={() => handleFieldCommit(record.rowKey!, "departmentLine")}
							onChange={(v) => handleFieldChange(record.rowKey!, "departmentLine", v)}
						/>,
					);
				}
				return <Typography.Text ellipsis={{ tooltip: true }}>{val || "/"}</Typography.Text>;
			},
		},
		{
			title: req("编制岗位"),
			dataIndex: "authorizedJobName",
			width: 180,
			onCell: (_: EditableRow, index?: number) =>
				getMatrixMergeCellProps(spans, "authorizedJobName", index),
			render: (val: string | undefined, record, index) => {
				const rowOptions = getRowOptions(record);
				if (!readonly && record.editMode && !record.isAuthorizedJobLocked) {
					return wrapFormCell(
						index,
						"authorizedJobId",
						record,
						<Select
							options={rowOptions.authorizedJobOptions}
							size="small"
							placeholder="请选择编制岗位"
							className="w-full"
							onBlur={() => handleFieldCommit(record.rowKey!, "authorizedJobId")}
							onChange={(v) =>
								handleFieldChange(record.rowKey!, "authorizedJobId", v)
							}
						/>,
					);
				}
				return <Typography.Text ellipsis={{ tooltip: true }}>{val || "/"}</Typography.Text>;
			},
		},
		{
			title: req("岗位-职位-职级"),
			dataIndex: "positionLevel",
			key: "jobPositionTreeValue",
			width: 280,
			render: (_: string, record, index) => {
				const rowOptions = getRowOptions(record);
				if (!readonly) {
					return wrapFormCell(
						index,
						"jobPositionTreeValue",
						record,
						<TreeSelect
							treeData={rowOptions.jobPositionTreeOptions}
							size="small"
							placeholder="请选择岗位-职位-职级"
							className="w-full"
							allowClear
							showSearch
							treeNodeLabelProp="selectionLabel"
							treeNodeFilterProp="title"
							treeDefaultExpandedKeys={rowOptions.jobPositionTreeOptions.map(
								(item) => item.value,
							)}
							fieldNames={{
								label: "title",
								value: "value",
								children: "children",
							}}
							onBlur={() => handleFieldCommit(record.rowKey!, "jobPositionTreeValue")}
							onChange={(v) =>
								handleFieldChange(
									record.rowKey!,
									"jobPositionTreeValue",
									String(v ?? ""),
								)
							}
						/>,
					);
				}
				return (
					<Typography.Text ellipsis={{ tooltip: true }}>
						{buildMatrixJobPositionSelectionLabel(record) || "/"}
					</Typography.Text>
				);
			},
		},
		{
			title: req("人数（人）"),
			dataIndex: "requiredCount",
			width: 110,
			fixed: "right",
			render: (val: number, record, index) =>
				readonly
					? val
					: wrapFormCell(
							index,
							"requiredCount",
							record,
							<InputNumber
								min={1}
								size="small"
								className="w-full"
								placeholder="请输入人数"
								onChange={(v) =>
									handleFieldChange(
										record.rowKey!,
										"requiredCount",
										typeof v === "number" ? v : "",
									)
								}
								onBlur={() => handleFieldCommit(record.rowKey!, "requiredCount")}
							/>,
						),
		},
		{
			title: req("匹配模型"),
			dataIndex: "tagMatchModelId",
			width: 150,
			fixed: "right",
			render: (val: string, record, index) => {
				if (readonly) {
					return record.tagMatchModelName || "/";
				}
				const matchingModelDisabled = !canQueryMatchingModelOptions(orgMatchId, record);
				const matchingModelRequestParams = matchingModelDisabled
					? undefined
					: buildMatchingModelRequestParams(orgMatchId, record);
				return wrapFormCell(
					index,
					"tagMatchModelId",
					record,
					<MatrixMatchingModelField
						value={val}
						valueLabel={record.tagMatchModelName}
						requestParams={matchingModelRequestParams}
						disabled={matchingModelDisabled}
						onChange={(nextValue, matchingModel) =>
							handleFieldChange(record.rowKey!, "tagMatchModelId", nextValue, {
								matchingModel,
							})
						}
						onBlur={() => handleFieldCommit(record.rowKey!, "tagMatchModelId")}
						onViewDetail={(modelId) => {
							setViewModelId(modelId);
							setViewDrawerOpen(true);
						}}
					/>,
				);
			},
		},
	];

	if (!readonly) {
		columns.push({
			title: "操作",
			key: "action",
			width: 100,
			fixed: "right",
			render: (_, record) => (
				<Space size={6}>
					<Tooltip title="新增模型">
						<Button
							type="text"
							size="small"
							icon={<PlusCircleOutlined />}
							className={cn(
								"!flex !h-6 !w-6 !items-center !justify-center rounded-[4px] !bg-[#ecf5ff] !p-0 !text-[#1677ff] hover:!bg-[#d9ecff]",
								!canQueryMatchingModelOptions(orgMatchId, record) &&
									"!bg-[#f5f5f5] !text-[rgba(0,0,0,0.25)]",
							)}
							disabled={!canQueryMatchingModelOptions(orgMatchId, record)}
							onClick={() => handleOpenAddMatchingModel(record)}
						/>
					</Tooltip>
					<Tooltip title="新增行">
						<Button
							type="text"
							size="small"
							icon={<PlusOutlined />}
							className={cn(
								"!flex !h-6 !w-6 !items-center !justify-center rounded-[4px] !bg-[#ecf5ff] !p-0 !text-[#1677ff] hover:!bg-[#d9ecff]",
								!canAddGroupedRow(record) &&
									"!bg-[#f5f5f5] !text-[rgba(0,0,0,0.25)]",
							)}
							disabled={!canAddGroupedRow(record)}
							onClick={() => handleAddGroupedRow(record)}
						/>
					</Tooltip>
					<Tooltip title="删除">
						<Button
							type="text"
							size="small"
							icon={<DeleteOutlined />}
							className="!flex !h-6 !w-6 !items-center !justify-center rounded-[4px] !bg-[#fef0f0] !p-0 !text-[#f56c6c] hover:!bg-[#fde2e2]"
							onClick={() => handleDelete(record.rowKey!)}
						/>
					</Tooltip>
				</Space>
			),
		});
	}

	return (
		<>
			<Form
				form={form}
				component={false}
				validateTrigger={[]}
				initialValues={{ rows: editableMatrix }}
				className={cn(typeof bodyScrollY === "number" && "flex h-full min-h-0 flex-col")}
			>
				<div
					ref={tableWrapperRef}
					className={cn(
						typeof bodyScrollY === "number" && "min-h-0 flex-1 overflow-hidden",
					)}
				>
					<Table<EditableRow>
						dataSource={tableRows}
						columns={columns}
						rowKey="rowKey"
						size="small"
						tableLayout="fixed"
						pagination={false}
						bordered
						scroll={{
							x: MATRIX_TABLE_SCROLL_X,
							...(typeof bodyScrollY === "number" ? { y: bodyScrollY } : {}),
						}}
						footer={() =>
							!readonly ? (
								<div className="flex">
									<Button
										type="link"
										icon={<Plus size={14} strokeWidth={2} />}
										onClick={handleAddStandaloneRow}
									>
										新增
									</Button>
								</div>
							) : null
						}
						className={cn(
							typeof bodyScrollY === "number" && "h-full min-h-0",
							"[&_.ant-table-footer]:bg-white",
							typeof bodyScrollY === "number" &&
								"[&_.ant-table-body]:!overflow-y-auto",
						)}
					/>
				</div>
			</Form>
			<MatchingModelViewDrawer
				open={viewDrawerOpen}
				modelId={viewModelId}
				onClose={() => setViewDrawerOpen(false)}
			/>
			<MatchingModelFormDrawer
				open={isMatchingModelDrawerOpen}
				title="新增匹配模型"
				mode="add"
				organizationTreeData={organizationTreeData}
				initialModelData={activeMatchingModelInitialData}
				onClose={() => {
					setIsMatchingModelDrawerOpen(false);
					setActiveMatchingModelRowKey(null);
				}}
				onSuccess={(result) => {
					void handleMatchingModelCreateSuccess(result);
				}}
			/>
		</>
	);
};

export const EditableMatrixTable = forwardRef(EditableMatrixTableInner);
