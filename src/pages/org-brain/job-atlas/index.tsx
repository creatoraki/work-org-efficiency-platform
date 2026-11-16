import type {
	JobAtlasMatrixCell,
	JobAtlasMatrixQueryParams,
	JobAtlasMatrixRow,
} from "#src/api/org-brain/job-atlas";
import type { TableColumnsType } from "antd";
import type { JobAtlasBenchmarkOptionItem } from "./components/benchmark-detail-drawer";
import {
	fetchJobAtlasBaseInfo,
	fetchJobAtlasBenchmarkDetail,
	fetchJobAtlasBenchmarkGradeOptions,
	fetchJobAtlasGradeItemDetail,
	queryJobAtlasMatrix,
} from "#src/api/org-brain/job-atlas";
import jobAtlasCellTipSrc from "#src/assets/svg/job-atlas-cell-tip.svg";
import JobCountIcon from "#src/assets/svg/job-count.svg?react";
import PositionCountIcon from "#src/assets/svg/position-count.svg?react";
import { BasicContent, SectionTitle } from "#src/components";
import { cn } from "#src/utils";
import { RightOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
	Button,
	Card,
	Col,
	Divider,
	Empty,
	Form,
	Row,
	Select,
	Statistic,
	Table,
	Typography,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { BenchmarkDetailDrawer } from "./components/benchmark-detail-drawer";
import { GradeDetailDrawer } from "./components/grade-detail-drawer";
import {
	JOB_ATLAS_MATRIX_HIGHLIGHT_BORDER,
	JOB_ATLAS_MATRIX_HIGHLIGHT_CELL_BG,
	JOB_ATLAS_MATRIX_HIGHLIGHT_ROW_BG,
} from "./constants";
import { getMatrixCellToneByGradeTitle } from "./grade-tone";

const DEFAULT_GROUP_ID = 5;

interface FilterFormValues {
	groupIds?: string[];
	sequenceTypeCodes?: string[];
	gradeOptionValues?: string[];
}

interface MatrixTableRecord extends JobAtlasMatrixRow {
	key: string;
	__rowIndex: number;
}

function buildJobAtlasMatrixParams(values: {
	groupIds?: string[];
	sequenceTypeCodes?: string[];
	benchmarkPostgradePairs?: string[];
}): JobAtlasMatrixQueryParams {
	const groupIds = (values.groupIds || [])
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
	const normalizedGroupIds =
		groupIds.length > 0 ? Array.from(new Set(groupIds)) : [DEFAULT_GROUP_ID];
	const sequenceTypeCodes = (values.sequenceTypeCodes || []).filter((item) => !!item?.trim());
	return {
		groupIds: normalizedGroupIds,
		sequenceTypeCodes:
			sequenceTypeCodes.length > 0 ? Array.from(new Set(sequenceTypeCodes)) : undefined,
		benchmarkPostgradePairs:
			values.benchmarkPostgradePairs && values.benchmarkPostgradePairs.length > 0
				? Array.from(new Set(values.benchmarkPostgradePairs))
				: undefined,
	};
}

function parseBenchmarkGradeOptionValues(selectValues?: string[]): {
	benchmarkPostgradePairs: string[];
} {
	if (!selectValues || selectValues.length === 0) {
		return { benchmarkPostgradePairs: [] };
	}
	const pairSet = new Set<string>();
	selectValues.forEach((selectValue) => {
		const parts = selectValue.split("#");
		const [benchmarkIdRaw = "", middleRaw = "", thirdRaw = ""] = parts;
		const postgradeRaw = parts.length >= 3 ? thirdRaw : middleRaw;
		const benchmarkIdNum = Number(benchmarkIdRaw);
		const postgradeIdNum = Number(postgradeRaw);
		if (Number.isFinite(benchmarkIdNum) && Number.isFinite(postgradeIdNum)) {
			pairSet.add(`${benchmarkIdNum}#${postgradeIdNum}`);
		}
	});
	return {
		benchmarkPostgradePairs: Array.from(pairSet),
	};
}

function buildSequenceRowSpans(rows: JobAtlasMatrixRow[]) {
	const spans = Array.from({ length: rows.length }, () => 0);
	let index = 0;
	while (index < rows.length) {
		const sequenceName = (rows[index].sequenceTypeName || "").trim() || "-";
		let end = index + 1;
		while (end < rows.length) {
			const nextSequenceName = (rows[end].sequenceTypeName || "").trim() || "-";
			if (nextSequenceName !== sequenceName) {
				break;
			}
			end++;
		}
		spans[index] = end - index;
		index = end;
	}
	return spans;
}

export default function OrgBrainJobAtlas() {
	const [filterForm] = Form.useForm<FilterFormValues>();
	const selectedGroupIds = Form.useWatch("groupIds", filterForm);
	const selectedSequenceTypeCodes = Form.useWatch("sequenceTypeCodes", filterForm);
	const { data: baseInfo, isPending: baseInfoLoading } = useQuery({
		queryKey: ["org-brain-job-atlas-base-info"],
		queryFn: fetchJobAtlasBaseInfo,
	});

	const [baseQueryParams, setBaseQueryParams] = useState<JobAtlasMatrixQueryParams>({
		groupIds: [DEFAULT_GROUP_ID],
	});
	const [highlightFilter, setHighlightFilter] = useState<{
		sequenceTypeCodes?: string[];
		benchmarkPostgradePairs?: string[];
	}>({});

	const [benchmarkDrawerOpen, setBenchmarkDrawerOpen] = useState(false);
	const [currentBenchmarkId, setCurrentBenchmarkId] = useState<number>();
	const [gradeDrawerOpen, setGradeDrawerOpen] = useState(false);
	const [currentGradeItemId, setCurrentGradeItemId] = useState<number>();
	const [currentRowGradeItems, setCurrentRowGradeItems] = useState<
		Array<{ label: string; value: number }>
	>([]);
	const [activeMatrixCellKey, setActiveMatrixCellKey] = useState<string>();
	const matrixTableContainerRef = useRef<HTMLDivElement>(null);
	const [matrixTableScrollY, setMatrixTableScrollY] = useState(360);

	const matrixQuery = useQuery({
		queryKey: ["org-brain-job-atlas-matrix-base", baseQueryParams],
		queryFn: () => queryJobAtlasMatrix(baseQueryParams),
	});

	const benchmarkDetailQuery = useQuery({
		queryKey: ["org-brain-job-atlas-benchmark-detail", currentBenchmarkId],
		queryFn: () => fetchJobAtlasBenchmarkDetail(currentBenchmarkId as number),
		enabled: benchmarkDrawerOpen && !!currentBenchmarkId,
	});

	const gradeDetailQuery = useQuery({
		queryKey: ["org-brain-job-atlas-grade-item-detail", currentGradeItemId],
		queryFn: () => fetchJobAtlasGradeItemDetail(currentGradeItemId as number),
		enabled: gradeDrawerOpen && !!currentGradeItemId,
	});

	const benchmarkGradeOptionsQuery = useQuery({
		queryKey: [
			"org-brain-job-atlas-benchmark-grade-options",
			selectedGroupIds,
			selectedSequenceTypeCodes,
		],
		queryFn: () => {
			const parsedGroupIds = (selectedGroupIds || [])
				.map((item) => Number(item))
				.filter((item) => Number.isFinite(item));
			const normalizedGroupIds =
				parsedGroupIds.length > 0
					? Array.from(new Set(parsedGroupIds))
					: [DEFAULT_GROUP_ID];
			return fetchJobAtlasBenchmarkGradeOptions({
				groupIds: normalizedGroupIds,
				sequenceTypeCodes: selectedSequenceTypeCodes?.filter((item) => !!item?.trim()),
			});
		},
	});

	const handleQuery = (values: {
		groupIds?: string[];
		sequenceTypeCodes?: string[];
		benchmarkPostgradePairs?: string[];
	}) => {
		const nextParams = buildJobAtlasMatrixParams(values);
		setBaseQueryParams({ groupIds: nextParams.groupIds });
		setHighlightFilter({
			sequenceTypeCodes: nextParams.sequenceTypeCodes,
			benchmarkPostgradePairs: nextParams.benchmarkPostgradePairs,
		});
		setCurrentBenchmarkId(undefined);
		setActiveMatrixCellKey(undefined);
	};

	const handleReset = () => {
		filterForm.setFieldsValue({
			groupIds: [String(DEFAULT_GROUP_ID)],
			sequenceTypeCodes: undefined,
			gradeOptionValues: undefined,
		});
		setBaseQueryParams({ groupIds: [DEFAULT_GROUP_ID] });
		setHighlightFilter({});
		setCurrentBenchmarkId(undefined);
		setActiveMatrixCellKey(undefined);
	};

	const matrixRows = matrixQuery.data?.rows || [];
	const matrixColumns = matrixQuery.data?.columnMeta || [];
	const matrixPgColumns = useMemo(
		() => matrixColumns.filter((col) => col.dataIndex.startsWith("pg_")),
		[matrixColumns],
	);
	const isMatrixLoading = matrixQuery.isLoading || matrixQuery.isFetching;
	const matrixSequenceRowSpans = useMemo(() => buildSequenceRowSpans(matrixRows), [matrixRows]);
	const linkedBenchmarkGradeOptions = benchmarkGradeOptionsQuery.data || [];
	const highlightBenchmarkIdSet = useMemo(() => {
		const sequenceCodeSet = new Set(
			(highlightFilter.sequenceTypeCodes || []).filter((code) => !!code?.trim()),
		);
		const pairMap = new Map<number, Set<number>>();
		(highlightFilter.benchmarkPostgradePairs || []).forEach((pair) => {
			const [benchmarkIdRaw = "", postgradeIdRaw = ""] = pair.split("#");
			const benchmarkIdNum = Number(benchmarkIdRaw);
			const postgradeIdNum = Number(postgradeIdRaw);
			if (!Number.isFinite(benchmarkIdNum) || !Number.isFinite(postgradeIdNum)) {
				return;
			}
			const set = pairMap.get(benchmarkIdNum) || new Set<number>();
			set.add(postgradeIdNum);
			pairMap.set(benchmarkIdNum, set);
		});

		const matchedBenchmarkSet = new Set<number>();
		matrixRows.forEach((row) => {
			if (typeof row.benchmarkId !== "number") {
				return;
			}
			const rowSequenceCode = (row.sequenceTypeCode || "").trim();
			const sequenceMatched =
				sequenceCodeSet.size === 0 || sequenceCodeSet.has(rowSequenceCode);
			if (!sequenceMatched) {
				return;
			}

			if (pairMap.size === 0) {
				matchedBenchmarkSet.add(row.benchmarkId);
				return;
			}

			const allowedPostgradeSet = pairMap.get(row.benchmarkId);
			if (!allowedPostgradeSet || allowedPostgradeSet.size === 0) {
				return;
			}
			const hasMatchedCell = matrixPgColumns.some((col) => {
				const cell = row[col.dataIndex] as JobAtlasMatrixCell | undefined;
				if (!cell?.gradeItemId || typeof cell.postgradeId !== "number") {
					return false;
				}
				return allowedPostgradeSet.has(cell.postgradeId);
			});
			if (hasMatchedCell) {
				matchedBenchmarkSet.add(row.benchmarkId);
			}
		});
		return matchedBenchmarkSet;
	}, [
		highlightFilter.benchmarkPostgradePairs,
		highlightFilter.sequenceTypeCodes,
		matrixPgColumns,
		matrixRows,
	]);
	const highlightCellKeySet = useMemo(() => {
		const sequenceCodeSet = new Set(
			(highlightFilter.sequenceTypeCodes || []).filter((code) => !!code?.trim()),
		);
		const pairMap = new Map<number, Set<number>>();
		(highlightFilter.benchmarkPostgradePairs || []).forEach((pair) => {
			const [benchmarkIdRaw = "", postgradeIdRaw = ""] = pair.split("#");
			const benchmarkIdNum = Number(benchmarkIdRaw);
			const postgradeIdNum = Number(postgradeIdRaw);
			if (!Number.isFinite(benchmarkIdNum) || !Number.isFinite(postgradeIdNum)) {
				return;
			}
			const set = pairMap.get(benchmarkIdNum) || new Set<number>();
			set.add(postgradeIdNum);
			pairMap.set(benchmarkIdNum, set);
		});

		const keys = new Set<string>();
		matrixRows.forEach((row) => {
			if (typeof row.benchmarkId !== "number") {
				return;
			}
			const rowSequenceCode = (row.sequenceTypeCode || "").trim();
			const sequenceMatched =
				sequenceCodeSet.size === 0 || sequenceCodeSet.has(rowSequenceCode);
			if (!sequenceMatched) {
				return;
			}

			const allowedPostgradeSet = pairMap.get(row.benchmarkId);
			matrixPgColumns.forEach((col) => {
				const value = row[col.dataIndex] as JobAtlasMatrixCell | undefined;
				if (!value?.gradeItemId) {
					return;
				}
				if (pairMap.size > 0) {
					if (!allowedPostgradeSet || !allowedPostgradeSet.has(value.postgradeId)) {
						return;
					}
				}
				keys.add(`${row.benchmarkId}-${col.dataIndex}`);
			});
		});
		return keys;
	}, [
		highlightFilter.benchmarkPostgradePairs,
		highlightFilter.sequenceTypeCodes,
		matrixPgColumns,
		matrixRows,
	]);
	const hasHighlightFilter =
		(highlightFilter.sequenceTypeCodes?.length || 0) > 0 ||
		(highlightFilter.benchmarkPostgradePairs?.length || 0) > 0;

	useEffect(() => {
		const current = filterForm.getFieldValue("gradeOptionValues") as string[] | undefined;
		if (!current || current.length === 0) {
			return;
		}
		const optionSet = new Set(linkedBenchmarkGradeOptions.map((item) => String(item.value)));
		const next = current.filter((value) => optionSet.has(value));
		if (next.length !== current.length) {
			filterForm.setFieldValue("gradeOptionValues", next.length > 0 ? next : undefined);
		}
	}, [filterForm, linkedBenchmarkGradeOptions]);

	useEffect(() => {
		const container = matrixTableContainerRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			return;
		}
		let rafId = 0;
		const updateScrollY = () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
			rafId = requestAnimationFrame(() => {
				const headerEl = container.querySelector(".ant-table-header") as HTMLElement | null;
				const headerHeight = headerEl?.offsetHeight ?? 40;
				// 扣除底边框与渲染误差，避免最后 1px 被吃掉导致“下边框消失”
				const borderCompensation = 2;
				const nextY = Math.floor(
					container.clientHeight - headerHeight - borderCompensation,
				);
				setMatrixTableScrollY(nextY > 0 ? nextY : 0);
			});
		};
		updateScrollY();
		const observer = new ResizeObserver(updateScrollY);
		observer.observe(container);
		const mutationObserver = new MutationObserver(updateScrollY);
		mutationObserver.observe(container, { childList: true, subtree: true, attributes: true });
		window.addEventListener("resize", updateScrollY);
		return () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
			observer.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener("resize", updateScrollY);
		};
	}, [isMatrixLoading, matrixRows.length]);

	const buildGradeItemsByRow = (record: JobAtlasMatrixRow) => {
		return matrixPgColumns
			.map((col) => {
				const pgCell = record[col.dataIndex] as JobAtlasMatrixCell | undefined;
				if (!pgCell?.gradeItemId || !pgCell?.gradeItemName) {
					return null;
				}
				return {
					label: pgCell.gradeItemName,
					value: pgCell.gradeItemId,
				};
			})
			.filter((item): item is { label: string; value: number } => !!item)
			.filter((item, idx, arr) => arr.findIndex((x) => x.value === item.value) === idx);
	};

	const isBenchmarkRowHighlighted = (record: JobAtlasMatrixRow) => {
		return (
			hasHighlightFilter &&
			typeof record.benchmarkId === "number" &&
			highlightBenchmarkIdSet.has(record.benchmarkId)
		);
	};

	const benchmarkDrawerOptions = useMemo<JobAtlasBenchmarkOptionItem[]>(() => {
		const optionsFromRows = matrixRows
			.map((row) => {
				if (row.isDisabled === 1) {
					return null;
				}
				const label = row.benchmarkName?.trim();
				const value = row.benchmarkId;
				if (!label || typeof value !== "number") {
					return null;
				}
				return { label, value };
			})
			.filter((item): item is JobAtlasBenchmarkOptionItem => !!item)
			.filter((item, idx, arr) => arr.findIndex((x) => x.value === item.value) === idx);

		return optionsFromRows;
	}, [matrixRows]);

	const matrixTableDataSource = useMemo<MatrixTableRecord[]>(
		() =>
			matrixRows.map((row, rowIndex) => ({
				...row,
				key: `${row.benchmarkId || row.benchmarkName || rowIndex}`,
				__rowIndex: rowIndex,
			})),
		[matrixRows],
	);

	const matrixSequenceTitle =
		matrixColumns.find((col) => col.dataIndex === "sequenceTypeName")?.title || "序列";
	const matrixBenchmarkTitle =
		matrixColumns.find((col) => col.dataIndex === "benchmarkName")?.title || "基准岗";
	const matrixGradeCountTitle =
		matrixColumns.find((col) => col.dataIndex === "gradeCount")?.title || "职级数量";

	const matrixTableColumns = useMemo<TableColumnsType<MatrixTableRecord>>(() => {
		const pgColumnCount = Math.max(matrixPgColumns.length, 1);
		const sequenceColWidth = "10%";
		const benchmarkColWidth = "14%";
		const gradeCountColWidth = "6%";
		const pgColWidth = `${(70 / pgColumnCount).toFixed(2)}%`;
		const columns: TableColumnsType<MatrixTableRecord> = [
			{
				title: <span className="font-medium">{matrixSequenceTitle}</span>,
				key: "sequenceTypeName",
				dataIndex: "sequenceTypeName",
				width: sequenceColWidth,
				onCell: (record) => ({
					rowSpan: matrixSequenceRowSpans[record.__rowIndex] || 0,
					style: {
						padding: "24px 12px",
						verticalAlign: "middle",
					},
				}),
				render: (_value, record) => (
					<div className="break-words text-[14px] font-medium text-[#202529]">
						{record.sequenceTypeName || "-"}
					</div>
				),
			},
			{
				title: <span className="font-medium">{matrixBenchmarkTitle}</span>,
				key: "benchmarkName",
				dataIndex: "benchmarkName",
				width: benchmarkColWidth,
				onCell: (record) => {
					const isBenchmarkHighlighted = isBenchmarkRowHighlighted(record);
					return {
						style: {
							padding: "8px 12px",
							verticalAlign: "middle",
							backgroundColor: isBenchmarkHighlighted
								? JOB_ATLAS_MATRIX_HIGHLIGHT_ROW_BG
								: undefined,
						},
					};
				},
				render: (_value, record) => {
					const isBenchmarkHighlighted = isBenchmarkRowHighlighted(record);
					const benchmarkClickable = record.isDisabled !== 1;
					return (
						<div className="relative flex h-full flex-col justify-center gap-1">
							{isBenchmarkHighlighted && (
								<span
									className="absolute bottom-0 left-[-12px] top-0 w-1 rounded-r"
									style={{ backgroundColor: JOB_ATLAS_MATRIX_HIGHLIGHT_BORDER }}
								/>
							)}
							<div className="flex items-center justify-between gap-2">
								<div className="break-words text-[14px] font-medium leading-[1.5]">
									{record.benchmarkName || "-"}
								</div>
								{benchmarkClickable && (
									<Typography.Link
										className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap text-[14px]"
										onClick={() => {
											if (typeof record.benchmarkId === "number") {
												setCurrentBenchmarkId(record.benchmarkId);
												setBenchmarkDrawerOpen(true);
											}
										}}
									>
										任职标准
										<RightOutlined className="text-[10px]" />
									</Typography.Link>
								)}
							</div>
							{record.benchmarkDescription && (
								<Typography.Text
									type="secondary"
									className="text-[12px] leading-[1.5]"
								>
									{record.benchmarkDescription}
								</Typography.Text>
							)}
						</div>
					);
				},
			},
		];

		matrixPgColumns.forEach((col) => {
			const tone = getMatrixCellToneByGradeTitle(col.title);
			columns.push({
				title: (
					<span className="font-normal" style={{ color: tone.text }}>
						{col.title}
					</span>
				),
				key: col.key,
				dataIndex: col.dataIndex,
				width: pgColWidth,
				align: "center",
				onCell: () => ({
					style: {
						padding: 0,
						position: "relative",
					},
				}),
				render: (_value, record) => {
					const cell = record[col.dataIndex] as JobAtlasMatrixCell | undefined;
					const benchmarkClickable = record.isDisabled !== 1;
					const canClick = benchmarkClickable && !!cell?.gradeItemId && !!cell?.clickable;
					const hasContent = !!cell?.gradeItemName;
					const cellKey = `${record.benchmarkId || record.__rowIndex}-${col.dataIndex}`;
					const isActive = activeMatrixCellKey === cellKey;
					const isHighlightedCell =
						hasHighlightFilter && highlightCellKeySet.has(cellKey);
					const openGradeDetail = () => {
						if (!canClick || !cell?.gradeItemId) {
							return;
						}
						const gradeItems = buildGradeItemsByRow(record);
						setCurrentRowGradeItems(gradeItems);
						setCurrentGradeItemId(cell.gradeItemId);
						setActiveMatrixCellKey(cellKey);
						setGradeDrawerOpen(true);
					};
					return (
						<div
							className={cn(
								"absolute inset-[4px] rounded-[4px] border border-transparent px-2 py-3 text-center",
								"flex items-center justify-center",
								canClick &&
									"group cursor-pointer transition-all duration-150 ease-out",
								canClick && "hover:-translate-y-px active:translate-y-0",
								canClick && !isHighlightedCell && "hover:border-[#0969DA4D]",
								canClick &&
									!isHighlightedCell &&
									"hover:shadow-[0_1px_2px_rgba(16,24,40,0.08),0_8px_24px_-12px_rgba(9,105,218,0.45)]",
								canClick &&
									!isHighlightedCell &&
									"active:shadow-[0_1px_2px_rgba(16,24,40,0.08)]",
								canClick &&
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0969DA66]",
								canClick &&
									isActive &&
									"border-[#0969DA4D] shadow-[0_1px_2px_rgba(16,24,40,0.08),0_8px_24px_-12px_rgba(9,105,218,0.45)]",
							)}
							style={{
								backgroundColor: isHighlightedCell
									? JOB_ATLAS_MATRIX_HIGHLIGHT_CELL_BG
									: hasContent
										? tone.bg
										: "transparent",
								borderColor: isHighlightedCell
									? JOB_ATLAS_MATRIX_HIGHLIGHT_BORDER
									: undefined,
								boxShadow: isHighlightedCell
									? "inset 0 0 0 1px rgba(107,140,255,0.38), 0 6px 16px rgba(107,140,255,0.18)"
									: undefined,
							}}
							onClick={openGradeDetail}
							onKeyDown={(event) => {
								if (event.key === "Enter" || event.key === " ") {
									event.preventDefault();
									openGradeDetail();
								}
							}}
							role={canClick ? "button" : undefined}
							tabIndex={canClick ? 0 : undefined}
						>
							{hasContent ? (
								<div
									className="block select-none text-[14px] font-normal"
									style={{ color: tone.text }}
								>
									{cell?.gradeItemName}
								</div>
							) : (
								<div className="block text-[14px]"></div>
							)}
						</div>
					);
				},
			});
		});

		columns.push({
			title: <span className="font-medium">{matrixGradeCountTitle}</span>,
			key: "gradeCount",
			dataIndex: "gradeCount",
			width: gradeCountColWidth,
			align: "left",
			render: (value) => <span className="text-[14px]">{value ?? "-"}</span>,
		});

		return columns;
	}, [
		activeMatrixCellKey,
		hasHighlightFilter,
		highlightBenchmarkIdSet,
		highlightCellKeySet,
		isBenchmarkRowHighlighted,
		matrixBenchmarkTitle,
		matrixGradeCountTitle,
		matrixPgColumns,
		matrixSequenceRowSpans,
		matrixSequenceTitle,
	]);

	return (
		<BasicContent className="flex h-full flex-col overflow-hidden">
			<div className="mb-4 grid shrink-0 grid-cols-1 gap-4 md:grid-cols-2 lg:auto-rows-[112px] lg:grid-cols-4">
				{[
					{
						title: "岗位数量",
						value: baseInfo?.jobTreeCount || 0,
						icon: (
							<div
								className="inline-flex items-center justify-center rounded-[4px] p-[2px] leading-none"
								style={{
									background:
										"linear-gradient(0deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.88) 100%), #0075FF",
								}}
							>
								<JobCountIcon />
							</div>
						),
					},
					{
						title: "职位数量",
						value: baseInfo?.fieldTreeCount || 0,
						icon: (
							<div className="inline-flex items-center justify-center rounded-[4px] bg-[#E3F7ED] p-[2px] leading-none">
								<PositionCountIcon />
							</div>
						),
					},
				].map((item) => (
					<Card
						key={item.title}
						className="h-full rounded-[4px] border-none bg-[#F5F7FA] transition-all duration-300 hover:scale-[1.01] hover:shadow-md"
						styles={{ body: { padding: "16px" } }}
						loading={baseInfoLoading}
					>
						<div className="mb-2 flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">{item.title}</span>
							<div>{item.icon}</div>
						</div>
						<div className="flex items-end justify-between">
							<div>
								<Statistic
									value={item.value}
									valueStyle={{
										fontSize: "26px",
										fontWeight: "bold",
										lineHeight: 1,
									}}
									formatter={(value) => (
										<CountUp
											duration={2}
											end={value as number}
											separator=","
											start={0}
										/>
									)}
								/>
							</div>
						</div>
					</Card>
				))}
			</div>

			<Form
				className="shrink-0"
				form={filterForm}
				layout="vertical"
				initialValues={{ groupIds: [String(DEFAULT_GROUP_ID)] }}
				onValuesChange={(changedValues, _allValues: FilterFormValues) => {
					if (Object.prototype.hasOwnProperty.call(changedValues, "sequenceTypeCodes")) {
						// 序列变化时，仅联动清空“基准岗—职级”，不自动刷新下方矩阵
						filterForm.setFieldValue("gradeOptionValues", undefined);
					}
					if (Object.prototype.hasOwnProperty.call(changedValues, "groupIds")) {
						filterForm.setFieldValue("gradeOptionValues", undefined);
					}
				}}
				onFinish={(values: FilterFormValues) => {
					const picked = parseBenchmarkGradeOptionValues(values.gradeOptionValues);
					handleQuery({
						groupIds: values.groupIds,
						sequenceTypeCodes: values.sequenceTypeCodes,
						benchmarkPostgradePairs: picked.benchmarkPostgradePairs,
					});
				}}
			>
				<Row gutter={[16, 12]} align="middle">
					<Col xs={24} md={12} lg={6}>
						<div className="flex h-8 items-center rounded border border-[#DCDFE6] bg-white pl-3">
							<span className="mr-3 shrink-0">族群</span>
							<Form.Item name="groupIds" className="mb-0 flex-1">
								<Select
									placeholder="请选择"
									variant="borderless"
									showSearch
									mode="multiple"
									options={baseInfo?.filterOptions.groups || []}
									optionFilterProp="label"
									maxTagCount="responsive"
								/>
							</Form.Item>
						</div>
					</Col>
					<Col xs={24} md={12} lg={6}>
						<div className="flex h-8 items-center rounded border border-[#DCDFE6] bg-white pl-3">
							<span className="mr-3 shrink-0">序列</span>
							<Form.Item name="sequenceTypeCodes" className="mb-0 flex-1">
								<Select
									placeholder="请选择"
									allowClear
									showSearch
									mode="multiple"
									variant="borderless"
									optionFilterProp="label"
									options={baseInfo?.filterOptions.sequenceTypes || []}
									maxTagCount="responsive"
								/>
							</Form.Item>
						</div>
					</Col>
					<Col xs={24} md={12} lg={6}>
						<div className="flex h-8 items-center rounded border border-[#DCDFE6] bg-white pl-3">
							<span className="mr-3 shrink-0">基准岗—职级</span>
							<Form.Item name="gradeOptionValues" className="mb-0 flex-1">
								<Select
									placeholder="请选择"
									allowClear
									showSearch
									mode="multiple"
									optionFilterProp="label"
									variant="borderless"
									options={linkedBenchmarkGradeOptions}
									maxTagCount="responsive"
								/>
							</Form.Item>
						</div>
					</Col>
					<Col xs={24} md={12} lg={6}>
						<div className="flex h-10 items-center justify-end gap-3">
							<Button type="primary" htmlType="submit">
								查询
							</Button>
							<Button onClick={handleReset}>重置</Button>
						</div>
					</Col>
				</Row>
			</Form>

			<Divider className="my-4" />

			<div className="flex min-h-0 flex-1 flex-col">
				<SectionTitle
					title="岗位职级分布矩阵"
					className="mb-3 shrink-0"
					extra={<img alt="点击单元格查看任职标准" src={jobAtlasCellTipSrc} />}
				/>
				<div
					ref={matrixTableContainerRef}
					className="min-h-0 flex-1 overflow-hidden rounded [&_.ant-spin-container]:h-full [&_.ant-spin-nested-loading]:h-full [&_.ant-table-body]:[scrollbar-gutter:stable] [&_.ant-table-container]:h-full [&_.ant-table-content]:overflow-x-hidden [&_.ant-table-header]:overflow-y-hidden [&_.ant-table-thead>tr>th]:!bg-[#FFFFFF] [&_.ant-table-thead>tr>th]:!py-0 [&_.ant-table]:h-full"
				>
					<Table<MatrixTableRecord>
						bordered
						rowHoverable={false}
						pagination={false}
						tableLayout="fixed"
						columns={matrixTableColumns}
						dataSource={matrixTableDataSource}
						loading={isMatrixLoading}
						locale={{ emptyText: <Empty description="暂无矩阵数据" /> }}
						scroll={{ y: matrixTableScrollY }}
					/>
				</div>
			</div>

			<BenchmarkDetailDrawer
				open={benchmarkDrawerOpen}
				onClose={() => setBenchmarkDrawerOpen(false)}
				loading={benchmarkDetailQuery.isLoading || benchmarkDetailQuery.isFetching}
				standardList={benchmarkDetailQuery.data?.standardList}
				salaryBandList={benchmarkDetailQuery.data?.salaryBandList}
				benchmarkOptions={benchmarkDrawerOptions}
				currentBenchmarkId={currentBenchmarkId}
				onBenchmarkChange={setCurrentBenchmarkId}
			/>

			<GradeDetailDrawer
				open={gradeDrawerOpen}
				onClose={() => {
					setGradeDrawerOpen(false);
					setCurrentRowGradeItems([]);
					setActiveMatrixCellKey(undefined);
				}}
				loading={gradeDetailQuery.isLoading || gradeDetailQuery.isFetching}
				currentRowGradeItems={currentRowGradeItems}
				currentGradeItemId={currentGradeItemId}
				onGradeItemChange={setCurrentGradeItemId}
				gradeDetail={gradeDetailQuery.data}
			/>
		</BasicContent>
	);
}
