import type {
	JobAtlasBenchmarkStandardItem,
	JobAtlasGradeItemDetail,
	JobAtlasSalaryBandCell,
} from "#src/api/org-brain/job-atlas";
import type { ColumnsType } from "antd/es/table";
import { cn } from "#src/utils";
import { Typography } from "antd";
import { getMatrixCellToneByGradeTitle } from "../grade-tone";

export type StandardTextFieldKey = Exclude<
	Extract<keyof JobAtlasBenchmarkStandardItem, keyof JobAtlasGradeItemDetail>,
	"gradeItemId" | "gradeItemName" | "postgradeId" | "postgradeName" | "salaryBandList"
>;

interface StandardSectionField {
	key: StandardTextFieldKey;
	label: string;
}

interface StandardSection {
	title: string;
	fields: StandardSectionField[];
	singleColumn?: boolean;
	hideInGradeDetail?: boolean;
}

export const GRADE_STANDARD_SECTIONS: StandardSection[] = [
	{
		title: "底线要求",
		fields: [
			{ key: "education", label: "学历" },
			{ key: "discipline", label: "违纪" },
		],
	},
	{
		title: "专业能力",
		fields: [
			{ key: "talentDevelopment", label: "人才发展" },
			{ key: "performanceEfficiency", label: "人效绩效" },
			{ key: "employeeRelation", label: "员工关系" },
			{ key: "adminProcurement", label: "行政采购" },
		],
	},
	{
		title: "责任贡献",
		fields: [
			{ key: "responsibilityContribution", label: "责任贡献" },
			{ key: "resultOutput", label: "结果产出" },
		],
	},
	{
		title: "能力素质",
		fields: [
			{ key: "effectiveCommunication", label: "有效沟通" },
			{ key: "toolsCapability", label: "工具" },
		],
	},
	{
		title: "知识经验",
		fields: [{ key: "knowledgeExperience", label: "知识经验" }],
		singleColumn: true,
	},
	{
		title: "建议证书",
		fields: [{ key: "recommendedCertificate", label: "建议证书" }],
		singleColumn: true,
	},
	{
		title: "管理规模",
		fields: [{ key: "managementScope", label: "管理规模" }],
		singleColumn: true,
		hideInGradeDetail: true,
	},
];

export interface SalaryBandTableRow {
	key: string;
	rowCode: string;
	rowName: string;
	[colCode: string]:
		| {
				text: string;
				isCurrent: boolean;
		  }
		| string;
}

function getSalaryBandTone(text: string) {
	const normalized = text.trim().toUpperCase();
	const matched = normalized.match(/^[A-Z]*([A-E]|\d{1,2})(?=\b|\(|（)/);
	if (!matched) {
		return null;
	}
	return getMatrixCellToneByGradeTitle(matched[0]);
}

export function buildSalaryBandRows(salaryBandList: JobAtlasSalaryBandCell[]): {
	columns: ColumnsType<SalaryBandTableRow>;
	rows: SalaryBandTableRow[];
} {
	const colMap = new Map<string, string>();
	const rowMap = new Map<string, SalaryBandTableRow>();

	for (const cell of salaryBandList) {
		if (!colMap.has(cell.colCode)) {
			colMap.set(cell.colCode, cell.colName || cell.colCode);
		}
		const rowKey = `${cell.rowCode}-${cell.rowName}`;
		const current = rowMap.get(rowKey) || {
			key: rowKey,
			rowCode: cell.rowCode,
			rowName: cell.rowName,
		};
		current[cell.colCode] = {
			text: cell.text || "-",
			isCurrent: !!cell.isCurrent,
		};
		rowMap.set(rowKey, current);
	}

	const gradeColumns = Array.from(colMap.entries()).map(([colCode, colName]) => {
		const tone = getSalaryBandTone(colName);
		return {
			title: tone ? (
				<div
					className="m-1 flex min-h-[46px] items-center justify-center rounded-[4px] px-4 py-4 text-center"
					style={{ backgroundColor: tone.bg }}
				>
					<span className="font-medium leading-tight" style={{ color: tone.text }}>
						{colName}
					</span>
				</div>
			) : (
				colName
			),
			dataIndex: colCode,
			key: colCode,
			width: 220,
			onHeaderCell: () => ({
				style: {
					padding: tone ? 0 : undefined,
				},
			}),
			render: (
				value: { text: string; isCurrent: boolean } | undefined,
				record: SalaryBandTableRow,
			) => {
				const shouldCenterCell =
					record.rowCode !== "MGMT_SCOPE" && record.rowName !== "管理幅度";
				if (!value) {
					return <></>;
				}
				const cellTone = getSalaryBandTone(value.text);
				if (cellTone) {
					if (!shouldCenterCell) {
						return (
							<span className="relative inline-flex items-center pl-0">
								{value.isCurrent && (
									<span className="absolute left-[-42px] top-1/2 -translate-y-1/2 rounded border border-[#FF8900] px-1.5 py-0.5 text-xs leading-none text-[#FF8900]">
										当前
									</span>
								)}
								<span
									className="font-medium"
									style={{
										color: cellTone.text,
										paddingLeft: value.isCurrent ? "52px" : undefined,
									}}
								>
									{value.text}
								</span>
							</span>
						);
					}
					return (
						<div className="flex justify-center">
							<span className="relative inline-flex items-center justify-center text-center">
								{value.isCurrent && (
									<span className="absolute left-[-42px] top-1/2 -translate-y-1/2 rounded border border-[#FF8900] px-1.5 py-0.5 text-xs leading-none text-[#FF8900]">
										当前
									</span>
								)}
								<span className="font-medium" style={{ color: cellTone.text }}>
									{value.text}
								</span>
							</span>
						</div>
					);
				}
				if (!shouldCenterCell) {
					return (
						<span className="relative inline-flex items-center pl-0">
							{value.isCurrent && (
								<span className="absolute left-[-42px] top-1/2 -translate-y-1/2 rounded border border-[#FF8900] px-1.5 py-0.5 text-xs leading-none text-[#FF8900]">
									当前
								</span>
							)}
							<span className={cn(value.isCurrent && "font-medium text-[#1677ff]")}>
								{value.text}
							</span>
						</span>
					);
				}
				return (
					<div className="flex justify-center">
						<span className="relative inline-flex items-center justify-center text-center">
							{value.isCurrent && (
								<span className="absolute left-0 top-1/2 -translate-y-1/2 rounded border border-[#FF8900] px-1.5 py-0.5 text-xs leading-none text-[#FF8900]">
									当前
								</span>
							)}
							<span className={cn(value.isCurrent && "font-medium text-[#1677ff]")}>
								{value.text}
							</span>
						</span>
					</div>
				);
			},
		};
	});

	const mergedGradeHeaderColumns = gradeColumns.map((col, index) => ({
		...col,
		title: index === 0 ? "职级" : "",
		colSpan: index === 0 ? gradeColumns.length : 0,
	}));

	const columns: ColumnsType<SalaryBandTableRow> = [
		{
			title: "能力维度",
			dataIndex: "rowName",
			key: "rowName",
			width: 220,
		},
		...mergedGradeHeaderColumns,
	];

	return {
		columns,
		rows: Array.from(rowMap.values()),
	};
}

interface BenchmarkStandardCompareRow {
	key: string;
	fieldKey?: StandardTextFieldKey;
	mergeLeftTwoColumns: boolean;
	leftMergedLabel?: string;
	category: string;
	categoryRowSpan: number;
	dimension: string;
	cells: Record<string, string>;
}

export function cellText(value: string | null | undefined) {
	const t = value?.trim();
	return t && t.length > 0 ? t : "—";
}

function formatPostgradeRequirementText(value: string | null | undefined) {
	const text = cellText(value);
	if (text === "—") {
		return text;
	}
	if (/^P/i.test(text)) {
		return text.toUpperCase();
	}
	if (/^\d+$/.test(text)) {
		return `P${text}`;
	}
	return text;
}

function formatManagementScopeGradeLabel(value: string | null | undefined) {
	const text = cellText(value);
	const digitMatch = text.match(/\d+/);
	if (digitMatch) {
		return `${digitMatch[0]}级`;
	}
	return text === "—" ? text : `${text}级`;
}

function buildMergedManagementScopeContent(sortedItems: JobAtlasBenchmarkStandardItem[]) {
	const intro = "配置标准如下：原则上需严格参照管理规模进行匹配，涉及特殊事项的，一事一议";
	const lines = sortedItems.map((item) => {
		const gradeLabel = formatManagementScopeGradeLabel(item.postgradeName);
		return `${gradeLabel}：${cellText(item.managementScope)}`;
	});
	return { intro, body: lines.join("\n") };
}

function gradeColumnColSpansForRecord(
	record: BenchmarkStandardCompareRow,
	sortedItems: JobAtlasBenchmarkStandardItem[],
): number[] {
	const ids = sortedItems.map((i) => String(i.gradeItemId));
	const n = ids.length;
	const spans = Array.from({ length: n }, () => 0);
	const texts = ids.map((id) => record.cells[id] ?? "—");
	let i = 0;
	while (i < n) {
		let j = i + 1;
		while (j < n && texts[j] === texts[i]) {
			j++;
		}
		spans[i] = j - i;
		i = j;
	}
	return spans;
}

const BENCHMARK_STD_ROW_KEY_POSTGRADE = "postgrade";
const POSTGRADE_REQUIREMENT_SUBNOTE = "特殊情况允许高岗低配，低岗高配";
const BENCHMARK_COMPARE_LEFT_FULL_MERGE_TITLES = new Set(["知识经验", "建议证书", "管理规模"]);

export function buildBenchmarkStandardComparisonTable(
	standardList: JobAtlasBenchmarkStandardItem[],
) {
	const sorted = [...standardList].sort((a, b) => a.postgradeId - b.postgradeId);
	const rows: BenchmarkStandardCompareRow[] = [];

	rows.push({
		key: BENCHMARK_STD_ROW_KEY_POSTGRADE,
		mergeLeftTwoColumns: true,
		category: "",
		categoryRowSpan: 0,
		dimension: "",
		cells: Object.fromEntries(
			sorted.map((item) => [String(item.gradeItemId), cellText(item.postgradeName)]),
		),
	});

	for (const section of GRADE_STANDARD_SECTIONS) {
		const mergeLeftFull =
			section.fields.length === 1 &&
			BENCHMARK_COMPARE_LEFT_FULL_MERGE_TITLES.has(section.title);
		if (mergeLeftFull) {
			const field = section.fields[0];
			const row: BenchmarkStandardCompareRow = {
				key: `${section.title}-${String(field.key)}`,
				fieldKey: field.key,
				mergeLeftTwoColumns: true,
				leftMergedLabel: section.title,
				category: "",
				categoryRowSpan: 0,
				dimension: "",
				cells: {},
			};
			for (const item of sorted) {
				row.cells[String(item.gradeItemId)] = cellText(item[field.key]);
			}
			rows.push(row);
			continue;
		}

		section.fields.forEach((field, idx) => {
			const row: BenchmarkStandardCompareRow = {
				key: `${section.title}-${String(field.key)}`,
				fieldKey: field.key,
				mergeLeftTwoColumns: false,
				category: section.title,
				categoryRowSpan: idx === 0 ? section.fields.length : 0,
				dimension: field.label,
				cells: {},
			};
			for (const item of sorted) {
				row.cells[String(item.gradeItemId)] = cellText(item[field.key]);
			}
			rows.push(row);
		});
	}

	const gradeColSpansByRowKey = new Map<string, number[]>();
	for (const row of rows) {
		gradeColSpansByRowKey.set(row.key, gradeColumnColSpansForRecord(row, sorted));
	}

	const columns: ColumnsType<BenchmarkStandardCompareRow> = [
		{
			title: <div className="text-left text-[14px] font-medium text-[#202529]">认证岗位</div>,
			key: "certified-position-header",
			align: "left",
			children: [
				{
					title: "",
					dataIndex: "category",
					key: "category",
					width: "14%",
					onCell: (record) => {
						if (record.mergeLeftTwoColumns) {
							return { colSpan: 2, rowSpan: 1 };
						}
						return { rowSpan: record.categoryRowSpan };
					},
					render: (v: string, record) => {
						if (record.mergeLeftTwoColumns) {
							if (record.key === BENCHMARK_STD_ROW_KEY_POSTGRADE) {
								return (
									<div className="flex flex-col gap-1 text-left text-sm font-medium">
										职级要求
										<Typography.Text
											type="secondary"
											className="block whitespace-normal break-words !text-xs leading-snug"
										>
											{POSTGRADE_REQUIREMENT_SUBNOTE}
										</Typography.Text>
									</div>
								);
							}
							const label = record.leftMergedLabel?.trim();
							if (!label) {
								return "—";
							}
							return (
								<div className="whitespace-pre-wrap break-words text-left text-sm font-medium leading-snug">
									{label}
								</div>
							);
						}
						return <span className="text-sm font-medium">{v?.trim() ? v : "—"}</span>;
					},
				},
				{
					title: "",
					dataIndex: "dimension",
					key: "dimension",
					width: "14%",
					onCell: (record) => (record.mergeLeftTwoColumns ? { colSpan: 0 } : {}),
					render: (_: string, record) => {
						if (record.mergeLeftTwoColumns) {
							return null;
						}
						return (
							<div className="whitespace-pre-wrap break-words text-sm font-medium">
								{record.dimension?.trim() ? record.dimension : "—"}
							</div>
						);
					},
				},
			],
		},
		...sorted.map((item, colIndex) => {
			const gradeIdStr = String(item.gradeItemId);
			const tone = getMatrixCellToneByGradeTitle(item.postgradeName || item.gradeItemName);
			return {
				title: (
					<div
						className="m-1 flex min-h-[46px] items-center justify-center rounded-[4px] px-4 py-4 text-center"
						style={{ backgroundColor: tone.bg }}
					>
						<span className="font-normal leading-tight" style={{ color: tone.text }}>
							{item.gradeItemName}
						</span>
					</div>
				),
				key: `grade-${item.gradeItemId}`,
				onHeaderCell: () => ({
					style: {
						padding: 0,
					},
				}),
				onCell: (record: BenchmarkStandardCompareRow) => ({
					colSpan:
						record.fieldKey === "managementScope"
							? colIndex === 0
								? sorted.length
								: 0
							: (gradeColSpansByRowKey.get(record.key)?.[colIndex] ?? 1),
				}),
				render: (_: unknown, record: BenchmarkStandardCompareRow) => {
					if (record.fieldKey === "managementScope") {
						if (colIndex > 0) {
							return null;
						}
						const { intro, body } = buildMergedManagementScopeContent(sorted);
						return (
							<div className="whitespace-pre-wrap break-words text-sm leading-7">
								<span className="font-medium">{intro}</span>
								{body ? (
									<>
										{"\n"}
										{body}
									</>
								) : null}
							</div>
						);
					}
					if ((gradeColSpansByRowKey.get(record.key)?.[colIndex] ?? 1) === 0) {
						return null;
					}
					if (record.key === BENCHMARK_STD_ROW_KEY_POSTGRADE) {
						return (
							<div
								className="whitespace-pre-wrap break-words text-center text-sm font-normal"
								style={{ color: tone.text }}
							>
								{formatPostgradeRequirementText(record.cells[gradeIdStr])}
							</div>
						);
					}
					return (
						<div className="whitespace-pre-wrap break-words text-sm">
							{record.cells[gradeIdStr] ?? "—"}
						</div>
					);
				},
			};
		}),
	];

	return { columns, dataSource: rows };
}
