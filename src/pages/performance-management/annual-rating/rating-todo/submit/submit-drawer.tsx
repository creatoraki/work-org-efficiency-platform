import type {
	LevelDistributionRow,
	SubmitEmployee,
	SubmitEmployeeQuery,
	SubmitPayload,
} from "#src/api/performance-management/submit";

import { SubmitCheckStatus, SubmitEmployeeStatus } from "#src/api/performance-management/submit";
import { RatingTodoStatus } from "#src/api/performance-management/todo/types";
import { exportCsv } from "#src/pages/performance-management/annual-rating/components/export-csv";
import {
	LabeledInput,
	LabeledSelect,
} from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import {
	useSaveSubmitDraft,
	useSubmitDetail,
	useSubmitRating,
} from "#src/pages/performance-management/annual-rating/rating-todo/submit/hooks/use-submit";
import { CloseCircleOutlined, ExportOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Drawer, Input, InputNumber, message, Select, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollaboratorModal } from "./collaborator-modal";
import { ExceptionNoteModal } from "./exception-note-modal";
import styles from "./submit-drawer.module.css";

/** 提报等级选项 */
const SUBMIT_LEVEL_OPTIONS = ["A", "B+", "B", "C", "D"].map((level) => ({
	label: level,
	value: level,
}));

/** 在职状态选项 */
const EMPLOYMENT_STATUS_OPTIONS = ["在职", "离职", "退休"].map((status) => ({
	label: status,
	value: status,
}));

/** 校验情况选项 */
const CHECK_STATUS_OPTIONS = Object.values(SubmitCheckStatus).map((status) => ({
	label: status,
	value: status,
}));

/** 岗位分类选项 */
const POSITION_CATEGORY_OPTIONS = [
	"职能员工",
	"项目员工(其他)",
	"项目员工(安全)",
	"项目员工(保洁绿化)",
].map((category) => ({ label: category, value: category }));

/** 状态选项（取提报名单状态字典） */
const STATUS_OPTIONS = Object.values(SubmitEmployeeStatus).map((status) => ({
	label: status,
	value: status,
}));

/**
 * 校验结果文字配色
 *
 * 超 N 为红色、少 N 为橙色、正常为绿色。
 *
 * @param text - 校验结果文字
 * @returns 文字颜色
 */
function resolveCheckColor(text: string): string {
	if (text.startsWith("超")) {
		return "#F5222D";
	}
	if (text.startsWith("少")) {
		return "#FF7D00";
	}
	return "#14B968";
}

/**
 * 校验情况标签配色
 *
 * @param status - 校验情况
 * @returns 圆点颜色
 */
function resolveCheckStatusColor(status: SubmitCheckStatus): string {
	if (status === SubmitCheckStatus.NORMAL) {
		return "#14B968";
	}
	if (status === SubmitCheckStatus.WARNING) {
		return "#F5222D";
	}
	return "#FF7D00";
}

/** 提报名单状态圆点配色 */
const EMPLOYEE_STATUS_COLOR: Record<SubmitEmployeeStatus, string> = {
	[SubmitEmployeeStatus.NOT_STARTED]: "#0075FF",
	[SubmitEmployeeStatus.NOT_FILLED]: "#FF7D00",
	[SubmitEmployeeStatus.FILLED]: "#14B968",
	[SubmitEmployeeStatus.LOCKED]: "#909399",
};

/**
 * 提报名单状态圆点配色
 *
 * @param status - 员工填报状态
 * @returns 圆点颜色
 */
function resolveEmployeeStatusColor(status?: SubmitEmployeeStatus): string {
	return status
		? EMPLOYEE_STATUS_COLOR[status]
		: EMPLOYEE_STATUS_COLOR[SubmitEmployeeStatus.NOT_FILLED];
}

/**
 * 提报抽屉组件属性
 */
interface SubmitDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 抽屉是否可见 */
	open: boolean;
	/** 是否只读（已完成-查看态） */
	readonly?: boolean;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 提交成功回调 */
	onSubmitted: () => void;
}

/**
 * 状态标签配色
 *
 * 采用浅底 + 同色文字：待完成橙色、被驳回红色、已完成绿色。
 *
 * @param status - 待办状态
 * @returns 背景色与文字色
 */
function resolveStatusTagStyle(status: string): { background: string; color: string } {
	if (status === RatingTodoStatus.REJECTED) {
		return { background: "#FEE4E6", color: "#F5222D" };
	}
	if (status === RatingTodoStatus.COMPLETED) {
		return { background: "#E3F7ED", color: "#14B968" };
	}
	return { background: "#FFEFE0", color: "#FF7D00" };
}

/**
 * 信息展示行
 *
 * 标签 14px/22 灰字；带 tag 时只渲染状态标签，避免与纯文本重复。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.tag - 状态标签
 * @returns 信息行元素
 */
function InfoRow({ label, value, tag }: { label: string; value: string; tag?: string }) {
	const tagStyle = tag ? resolveStatusTagStyle(tag) : undefined;
	return (
		<div className="flex flex-col gap-1">
			<span className="text-sm leading-[22px] text-[#909399]">{label}</span>
			<span className="text-sm leading-[22px] text-[#323233]">
				{tag ? (
					<span className="rounded-[3px] px-2 text-xs leading-5" style={tagStyle}>
						{tag}
					</span>
				) : (
					value
				)}
			</span>
		</div>
	);
}

/**
 * 提报抽屉
 *
 * 从右侧滑出，依次展示评级信息（含协作人）、分布异常说明、
 * 等级分布校验与提报名单，底部提供取消 / 暂存 / 提交操作。
 *
 * 只读态用于「已完成-查看」，表单内容只读，底栏取消 / 暂存 / 提交均禁用。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 抽屉是否可见
 * @param props.readonly - 是否只读
 * @param props.onClose - 关闭抽屉回调
 * @param props.onSubmitted - 提交成功回调
 * @returns 提报抽屉组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function SubmitDrawer({
	todoId,
	open,
	readonly = false,
	onClose,
	onSubmitted,
}: SubmitDrawerProps) {
	const { data, isLoading } = useSubmitDetail(todoId, open);
	const draftMutation = useSaveSubmitDraft();
	const submitMutation = useSubmitRating();
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();

	/** 提报评分编辑态 */
	const [submitScores, setSubmitScores] = useState<Record<string, number | undefined>>({});
	/** 提报等级编辑态 */
	const [submitLevels, setSubmitLevels] = useState<Record<string, string | undefined>>({});
	/** 异常情况说明编辑态 */
	const [exceptionNotes, setExceptionNotes] = useState<Record<string, string>>({});
	/** 协作人 */
	const [collaborator, setCollaborator] = useState<string | undefined>();
	/** 协作人弹窗 */
	const [collaboratorOpen, setCollaboratorOpen] = useState(false);
	/** 异常情况说明弹窗 */
	const [exceptionOpen, setExceptionOpen] = useState(false);
	/** 当前编辑异常说明的员工 */
	const [exceptionTarget, setExceptionTarget] = useState<SubmitEmployee>();
	/** 分布异常说明 */
	const [distributionNote, setDistributionNote] = useState("");
	/** 提报名单筛选条件（编辑中） */
	const [employeeQuery, setEmployeeQuery] = useState<SubmitEmployeeQuery>({});
	/** 提报名单筛选条件（已应用） */
	const [appliedQuery, setAppliedQuery] = useState<SubmitEmployeeQuery>({});

	/**
	 * 数据回显：详情加载后初始化表单
	 */
	useEffect(() => {
		if (!data) {
			return;
		}
		setCollaborator(data.collaborator);
		setDistributionNote(data.distributionExceptionNote ?? "");
		const scores: Record<string, number | undefined> = {};
		const levels: Record<string, string | undefined> = {};
		const notes: Record<string, string> = {};
		data.employees.forEach((employee) => {
			scores[employee.id] = employee.submitScore;
			levels[employee.id] = employee.submitLevel;
			notes[employee.id] = employee.exceptionNote ?? "";
		});
		setSubmitScores(scores);
		setSubmitLevels(levels);
		setExceptionNotes(notes);
	}, [data]);

	/**
	 * 按筛选条件过滤提报名单
	 */
	const filteredEmployees = useMemo(() => {
		// 未下发状态时按是否已填评分/等级派生，统一使用字典枚举
		const list = (data?.employees ?? []).map((employee) => ({
			...employee,
			status:
				employee.status ??
				(submitScores[employee.id] !== undefined || submitLevels[employee.id]
					? SubmitEmployeeStatus.FILLED
					: SubmitEmployeeStatus.NOT_FILLED),
		}));
		return list.filter(
			(employee) =>
				(!appliedQuery.keyword ||
					employee.name.includes(appliedQuery.keyword) ||
					employee.employeeNo.includes(appliedQuery.keyword)) &&
				(!appliedQuery.positionCategory ||
					employee.positionCategory === appliedQuery.positionCategory) &&
				(!appliedQuery.employmentStatus ||
					employee.employmentStatus === appliedQuery.employmentStatus) &&
				(!appliedQuery.submitLevel ||
					submitLevels[employee.id] === appliedQuery.submitLevel) &&
				(!appliedQuery.checkStatus || employee.checkStatus === appliedQuery.checkStatus) &&
				(!appliedQuery.status || employee.status === appliedQuery.status),
		);
	}, [data?.employees, appliedQuery, submitScores, submitLevels]);

	/**
	 * 组装提报载荷
	 */
	const buildPayload = useCallback(
		(): SubmitPayload => ({
			todoId,
			collaborator,
			distributionExceptionNote: distributionNote,
			employees: (data?.employees ?? []).map((employee) => ({
				id: employee.id,
				submitScore: submitScores[employee.id],
				submitLevel: submitLevels[employee.id],
				exceptionNote: exceptionNotes[employee.id],
			})),
		}),
		[
			todoId,
			collaborator,
			distributionNote,
			data?.employees,
			submitScores,
			submitLevels,
			exceptionNotes,
		],
	);

	const handleDraft = useCallback(() => {
		draftMutation.mutate(buildPayload(), {
			onSuccess: () => message.success("已暂存"),
		});
	}, [draftMutation, buildPayload]);

	const handleSubmit = useCallback(() => {
		const employees = data?.employees ?? [];
		if (
			employees.some(
				(employee) => submitScores[employee.id] === undefined || !submitLevels[employee.id],
			)
		) {
			message.error("请填写所有员工的提报评分与提报等级");
			return;
		}
		const missingRequiredNote = employees.some(
			(employee) =>
				employee.exceptionNoteRequired && !(exceptionNotes[employee.id] ?? "").trim(),
		);
		if (missingRequiredNote) {
			message.error("请填写必填的异常情况说明");
			return;
		}
		if (data?.distributionAbnormal && !distributionNote.trim()) {
			message.error("等级分布校验异常，请填写分布异常说明");
			return;
		}
		submitMutation.mutate(buildPayload(), {
			onSuccess: () => {
				message.success("提报提交成功");
				onSubmitted();
				onClose();
			},
		});
	}, [
		data?.employees,
		data?.distributionAbnormal,
		submitScores,
		submitLevels,
		exceptionNotes,
		distributionNote,
		submitMutation,
		buildPayload,
		onSubmitted,
		onClose,
	]);

	/**
	 * 等级分布表格列配置
	 *
	 * 分组表头：标准人数 / 实际人数 / 异常校验。
	 */
	const distributionColumns = useMemo(
		() => [
			{
				title: "岗位分类",
				dataIndex: "positionCategory",
				key: "positionCategory",
				width: 146,
				onCell: (record: LevelDistributionRow) => ({
					className: record.isTotal ? "font-medium" : undefined,
				}),
			},
			{
				title: "人数",
				dataIndex: "totalCount",
				key: "totalCount",
				width: 52,
				align: "center" as const,
			},
			{
				title: "标准人数",
				children: [
					{
						title: "A",
						dataIndex: ["standard", "a"],
						key: "stdA",
						width: 62,
						align: "center" as const,
					},
					{
						title: "B+",
						dataIndex: ["standard", "bPlus"],
						key: "stdBPlus",
						width: 62,
						align: "center" as const,
					},
					{
						title: "B",
						dataIndex: ["standard", "b"],
						key: "stdB",
						width: 62,
						align: "center" as const,
					},
					{
						title: "C/D",
						dataIndex: ["standard", "cd"],
						key: "stdCd",
						width: 62,
						align: "center" as const,
					},
				],
			},
			{
				title: (
					<span>
						实际人数
						<span className="ml-2 text-xs text-[#909399]">点击单元格可进行筛选</span>
					</span>
				),
				children: [
					{
						title: "A",
						dataIndex: ["actual", "a"],
						key: "actA",
						width: 72,
						align: "center" as const,
					},
					{
						title: "B+",
						dataIndex: ["actual", "bPlus"],
						key: "actBPlus",
						width: 72,
						align: "center" as const,
					},
					{
						title: "B",
						dataIndex: ["actual", "b"],
						key: "actB",
						width: 72,
						align: "center" as const,
					},
					{
						title: "C",
						dataIndex: ["actual", "c"],
						key: "actC",
						width: 72,
						align: "center" as const,
					},
					{
						title: "D",
						dataIndex: ["actual", "d"],
						key: "actD",
						width: 72,
						align: "center" as const,
					},
				],
			},
			{
				title: "异常校验",
				children: [
					{
						title: "A",
						dataIndex: ["check", "a"],
						key: "chkA",
						width: 141,
						align: "center" as const,
						render: (text: string) => (
							<span style={{ color: resolveCheckColor(text) }}>{text}</span>
						),
					},
					{
						title: "B+",
						dataIndex: ["check", "bPlus"],
						key: "chkBPlus",
						width: 141,
						align: "center" as const,
						render: (text: string) => (
							<span style={{ color: resolveCheckColor(text) }}>{text}</span>
						),
					},
					{
						title: "B",
						dataIndex: ["check", "b"],
						key: "chkB",
						width: 142,
						align: "center" as const,
						render: (text: string) => (
							<span style={{ color: resolveCheckColor(text) }}>{text}</span>
						),
					},
					{
						title: "C/D",
						dataIndex: ["check", "cd"],
						key: "chkCd",
						width: 142,
						align: "center" as const,
						render: (text: string) => (
							<span style={{ color: resolveCheckColor(text) }}>{text}</span>
						),
					},
				],
			},
		],
		[],
	);

	/**
	 * 提报名单表格列配置
	 *
	 * 16 列固定宽度合计 1537px，超过 1372px 内容区，因此表格需要横向滚动；
	 * 提报评分、提报等级、异常情况说明为可编辑列，只读态转为纯文本。
	 */
	const employeeColumns = useMemo(
		() => [
			{ title: "员工", dataIndex: "name", key: "name", width: 66 },
			{ title: "工号", dataIndex: "employeeNo", key: "employeeNo", width: 64 },
			{ title: "部门", dataIndex: "department", key: "department", width: 94 },
			{ title: "岗位", dataIndex: "position", key: "position", width: 52 },
			{
				title: "岗位分类",
				dataIndex: "positionCategory",
				key: "positionCategory",
				width: 146,
			},
			{ title: "职级", dataIndex: "jobLevel", key: "jobLevel", width: 52 },
			{
				title: "在职状态",
				dataIndex: "employmentStatus",
				key: "employmentStatus",
				width: 80,
			},
			{
				title: "自评分",
				dataIndex: "selfScore",
				key: "selfScore",
				width: 86,
				align: "center" as const,
				sorter: (a: SubmitEmployee, b: SubmitEmployee) =>
					(a.selfScore ?? 0) - (b.selfScore ?? 0),
				render: (value?: number) => (value === undefined ? "-" : value.toFixed(2)),
			},
			{
				title: (
					<span>
						<span className="text-[#F5222D]">*</span>
						提报评分
					</span>
				),
				dataIndex: "submitScore",
				key: "submitScore",
				width: 141,
				sorter: (a: SubmitEmployee, b: SubmitEmployee) =>
					(submitScores[a.id] ?? 0) - (submitScores[b.id] ?? 0),
				render: (_: unknown, record: SubmitEmployee) =>
					readonly ? (
						<span className="text-sm leading-[22px] text-[#0075FF]">
							{submitScores[record.id] === undefined
								? "-"
								: submitScores[record.id]?.toFixed(2)}
						</span>
					) : (
						<InputNumber
							min={0}
							max={100}
							placeholder="请输入"
							className="w-full"
							value={submitScores[record.id]}
							onChange={(value) =>
								setSubmitScores((prev) => ({
									...prev,
									[record.id]: value ?? undefined,
								}))
							}
						/>
					),
			},
			{
				title: "一级部门排名",
				dataIndex: "departmentRank",
				key: "departmentRank",
				width: 128,
				align: "center" as const,
				sorter: (a: SubmitEmployee, b: SubmitEmployee) =>
					(a.departmentRank ?? "").localeCompare(b.departmentRank ?? ""),
				render: (value?: string) => value ?? "-",
			},
			{
				title: "建议等级",
				dataIndex: "suggestLevel",
				key: "suggestLevel",
				width: 80,
				align: "center" as const,
				render: (value?: string) => value ?? "-",
			},
			{
				title: (
					<span className="flex items-center">
						<span className="text-[#F5222D]">*</span>
						提报等级
						<button
							type="button"
							className="ml-2 cursor-pointer border-0 bg-transparent p-0 text-xs leading-5 text-[#0075FF]"
							onClick={() => {
								const next: Record<string, string | undefined> = {};
								(data?.employees ?? []).forEach((employee) => {
									next[employee.id] = employee.suggestLevel;
								});
								setSubmitLevels(next);
							}}
						>
							一键带入
						</button>
					</span>
				),
				dataIndex: "submitLevel",
				key: "submitLevel",
				width: 144,
				render: (_: unknown, record: SubmitEmployee) =>
					readonly ? (
						<span className="text-sm leading-[22px] text-[#606266]">
							{submitLevels[record.id] || "-"}
						</span>
					) : (
						<Select
							allowClear
							placeholder="请选择"
							className="w-full"
							options={SUBMIT_LEVEL_OPTIONS}
							value={submitLevels[record.id]}
							onChange={(value) =>
								setSubmitLevels((prev) => ({ ...prev, [record.id]: value }))
							}
						/>
					),
			},
			{
				title: "校验情况",
				dataIndex: "checkStatus",
				key: "checkStatus",
				width: 106,
				render: (status: SubmitCheckStatus, record: SubmitEmployee) => (
					<div className="flex items-center gap-1">
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{ backgroundColor: resolveCheckStatusColor(status) }}
						/>
						<span style={{ color: resolveCheckStatusColor(status) }}>
							{status}
							{record.checkDiff ? `/${record.checkDiff}` : ""}
						</span>
					</div>
				),
			},
			{
				title: "异常情况说明",
				dataIndex: "exceptionNote",
				key: "exceptionNote",
				width: 156,
				render: (_: unknown, record: SubmitEmployee) => {
					const note = exceptionNotes[record.id] ?? "";
					if (readonly) {
						return (
							<span className="text-sm leading-[22px] text-[#606266]">{note}</span>
						);
					}
					return (
						<button
							type="button"
							className="flex h-8 w-full cursor-pointer items-center justify-between gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-3 text-left text-sm leading-[22px]"
							onClick={() => {
								setExceptionTarget(record);
								setExceptionOpen(true);
							}}
						>
							<span className={note ? "text-[#323233]" : "text-[#C0C4CC]"}>
								{note || (record.exceptionNoteRequired ? "必填" : "选填")}
							</span>
							<span aria-hidden="true" className="shrink-0 text-[#909399]">
								✎
							</span>
						</button>
					);
				},
			},
			{
				title: "填报人",
				dataIndex: "filler",
				key: "filler",
				width: 66,
			},
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 76,
				render: (status: SubmitEmployeeStatus) => (
					<div className="flex items-center gap-1">
						<span
							className="size-1.5 shrink-0 rounded-full"
							style={{ backgroundColor: resolveEmployeeStatusColor(status) }}
						/>
						<span>{status}</span>
					</div>
				),
			},
		],
		[readonly, submitScores, submitLevels, exceptionNotes, data?.employees],
	);

	/**
	 * 提报名单筛选区
	 */
	const employeeFilter = (
		<div className="mb-3 flex flex-col gap-3">
			<div className="grid grid-cols-4 gap-3">
				<LabeledInput
					label="姓名/工号"
					value={employeeQuery.keyword}
					onChange={(next) =>
						setEmployeeQuery((prev) => ({ ...prev, keyword: next || undefined }))
					}
				/>
				<LabeledSelect
					label="岗位分类"
					options={POSITION_CATEGORY_OPTIONS}
					value={employeeQuery.positionCategory}
					onChange={(next) =>
						setEmployeeQuery((prev) => ({ ...prev, positionCategory: next }))
					}
				/>
				<LabeledSelect
					label="在职状态"
					options={EMPLOYMENT_STATUS_OPTIONS}
					value={employeeQuery.employmentStatus}
					onChange={(next) =>
						setEmployeeQuery((prev) => ({ ...prev, employmentStatus: next }))
					}
				/>
				<LabeledSelect
					label="提报等级"
					options={SUBMIT_LEVEL_OPTIONS}
					value={employeeQuery.submitLevel}
					onChange={(next) =>
						setEmployeeQuery((prev) => ({ ...prev, submitLevel: next }))
					}
				/>
			</div>
			<div className="grid grid-cols-4 gap-3">
				<LabeledSelect
					label="校验情况"
					options={CHECK_STATUS_OPTIONS}
					value={employeeQuery.checkStatus}
					onChange={(next) =>
						setEmployeeQuery((prev) => ({ ...prev, checkStatus: next }))
					}
				/>
				<LabeledSelect
					label="状态"
					options={STATUS_OPTIONS}
					value={employeeQuery.status}
					onChange={(next) => setEmployeeQuery((prev) => ({ ...prev, status: next }))}
				/>
				<div className="col-span-2 flex items-center justify-end gap-2">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={() => setAppliedQuery(employeeQuery)}
					>
						查询
					</Button>
					<Button
						type="text"
						className="px-2 text-[#606266]"
						onClick={() => {
							setEmployeeQuery({});
							setAppliedQuery({});
						}}
					>
						重置
					</Button>
				</div>
			</div>
		</div>
	);

	/**
	 * 提交按钮可用性
	 *
	 * 必填项未填完时「提交」禁用：所有员工提报评分与提报等级齐全、必填异常说明已填；
	 * 存在分布异常时，分布异常说明也必须填写。
	 */
	const canSubmit = useMemo(() => {
		const employees = data?.employees ?? [];
		if (!employees.length) {
			return false;
		}
		if (
			employees.some(
				(employee) => submitScores[employee.id] === undefined || !submitLevels[employee.id],
			)
		) {
			return false;
		}
		if (
			employees.some(
				(employee) =>
					employee.exceptionNoteRequired && !(exceptionNotes[employee.id] ?? "").trim(),
			)
		) {
			return false;
		}
		if (data?.distributionAbnormal && !distributionNote.trim()) {
			return false;
		}
		return true;
	}, [
		data?.employees,
		data?.distributionAbnormal,
		submitScores,
		submitLevels,
		exceptionNotes,
		distributionNote,
	]);

	/**
	 * 是否为被驳回态
	 *
	 * 被驳回时顺序为「驳回原因条 → 分布异常说明 → 评级信息」，
	 * 其余状态为「评级信息 → 分布异常说明」。
	 */
	const rejected = data?.ratingInfo.status === RatingTodoStatus.REJECTED;

	return (
		<ConfigProvider
			theme={{
				components: {
					Table: {
						headerBg: "#f0f2f5",
						headerColor: "#323233",
						borderColor: "#E4E7ED",
						// 上下 6.5px + 22px 行高 + 1px 下边框 = 36px 行高；
						// 提报名单行内是 32px 输入控件，因此该表行高自然为 46px。
						cellPaddingBlockMD: 6.5,
						cellPaddingInlineMD: 12,
					},
				},
			}}
		>
			<Drawer
				title={
					<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
						2026年度评级-提报
					</span>
				}
				open={open}
				onClose={onClose}
				// 抽屉宽 1420px，其中内容区 1372px，左右内边距各 24px
				width={1420}
				loading={isLoading}
				closeIcon={<CloseCircleOutlined className="text-[26px] text-[#909399]" />}
				styles={{
					header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
				}}
				footer={
					<div className="flex justify-end gap-3">
						{readonly ? (
							<>
								<Button disabled>取消</Button>
								<Button disabled>暂存</Button>
								<Button type="primary" disabled>
									提交
								</Button>
							</>
						) : (
							<>
								<Button onClick={onClose}>取消</Button>
								<Button loading={draftMutation.isPending} onClick={handleDraft}>
									暂存
								</Button>
								<Button
									type="primary"
									loading={submitMutation.isPending}
									disabled={!canSubmit}
									/**
									 * 提交可用时使用主色 #0075FF，必填项未填完时使用浅蓝 #B8D3FF；
									 * AntD 禁用样式来自类选择器，这里用内联样式覆盖。
									 */
									style={
										canSubmit
											? { background: "#0075FF", borderColor: "#0075FF" }
											: {
													background: "#B8D3FF",
													borderColor: "#B8D3FF",
													color: "#FFFFFF",
												}
									}
									onClick={handleSubmit}
								>
									提交
								</Button>
							</>
						)}
					</div>
				}
			>
				{/*
				 * 被驳回态顺序：驳回原因条 → 分布异常说明 → 评级信息；
				 * 其余状态：评级信息 → 分布异常说明。用 flex order 重排，避免重复 JSX。
				 */}
				<div className="flex flex-col">
					{/* 驳回原因条（被驳回态，通栏贴顶） */}
					{rejected ? (
						<div className="-mx-6 -mt-6 mb-4 flex items-center gap-2 bg-[#FFEFE0] px-4 py-2.5 text-base leading-6 text-[#323233]">
							<CloseCircleOutlined className="shrink-0 text-[22px] text-[#FF7D00]" />
							<span>
								驳回原因：
								{data?.rejectReason ||
									"不符合集团年度评级要求，应XXX，修正后请重新提报"}
							</span>
						</div>
					) : null}

					{/* 评级信息 + 协作人 */}
					<div className={rejected ? "order-3 mb-4" : "order-1 mb-4"}>
						<SectionTitle
							title="评级信息"
							extra={
								<span className="text-sm text-[#606266]">
									总人数：{data?.totalCount ?? 0}
								</span>
							}
						/>
						<div className="flex gap-3">
							<div className="grid flex-1 grid-cols-8 gap-4 rounded bg-[#F5F7FA] p-4">
								<InfoRow label="计划名称" value={data?.ratingInfo.planName ?? ""} />
								<InfoRow label="周期" value={data?.ratingInfo.cycle ?? ""} />
								<InfoRow
									label="考核类型"
									value={assessTypeLabel(data?.ratingInfo.assessType)}
								/>
								<InfoRow
									label="节点类型"
									value={nodeTypeLabel(data?.ratingInfo.nodeType)}
								/>
								<InfoRow
									label="执行范围"
									value={data?.ratingInfo.executeScope ?? ""}
								/>
								<InfoRow label="执行人" value={data?.ratingInfo.executor ?? ""} />
								<InfoRow label="有效期" value={data?.ratingInfo.validDate ?? ""} />
								<InfoRow
									label="状态"
									value={statusLabel(data?.ratingInfo.status)}
									tag={statusLabel(data?.ratingInfo.status)}
								/>
							</div>
							<div className="w-80 shrink-0 rounded bg-[#F5F7FA] p-3">
								<div className="mb-1 flex items-center gap-1 text-sm leading-[22px] text-[#909399]">
									协作人
									{readonly ? null : (
										<span className="flex size-3.5 items-center justify-center rounded-full bg-[#C0C4CC] text-[10px] text-white">
											i
										</span>
									)}
								</div>
								{readonly ? (
									// 只读态按设计稿渲染纯文本，不显示选择框与提示图标
									<span className="text-sm leading-[22px] text-[#303133]">
										{collaborator || "-"}
									</span>
								) : (
									<button
										type="button"
										disabled={Boolean(data?.collaboratorMode)}
										className="flex h-8 w-full cursor-pointer items-center justify-between rounded-[3px] border border-[#E4E7ED] bg-white px-3 text-left text-sm leading-[22px] text-[#323233] disabled:cursor-not-allowed disabled:bg-[#F5F7FA]"
										onClick={() => setCollaboratorOpen(true)}
									>
										<span className={collaborator ? "" : "text-[#C0C4CC]"}>
											{collaborator || "请选择"}
										</span>
										<span
											aria-hidden="true"
											className="text-[10px] text-[#909399]"
										>
											▾
										</span>
									</button>
								)}
								{data?.collaboratorMode ? (
									<div className="mt-1 text-xs leading-5 text-[#909399]">
										协作人不可再添加协作人
									</div>
								) : null}
							</div>
						</div>
					</div>

					{/* 分布异常说明 */}
					<div className="order-2 mb-4">
						<SectionTitle title="分布异常说明" />
						{readonly ? (
							// 只读态使用单行只读框（白底、1px #E4E7ED），不显示左侧标签列
							<div className="rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-3 text-sm leading-[22px] text-[#606266]">
								{distributionNote || (
									<span className="text-[#909399]">无分布异常说明</span>
								)}
							</div>
						) : (
							<div className="flex items-start gap-3">
								<span className="w-24 shrink-0 pt-1 text-sm text-[#606266]">
									<span className="text-[#F5222D]">*</span>
									分布异常说明
								</span>
								<div className="flex-1">
									<Input.TextArea
										rows={3}
										maxLength={500}
										showCount
										placeholder="若等级分布、校验异常，则需进行填写原因"
										value={distributionNote}
										onChange={(event) =>
											setDistributionNote(event.target.value)
										}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* 等级分布 */}
				<div className="mb-2">
					<SectionTitle
						title="等级分布"
						badge={
							data?.distributionAbnormal ? (
								<span className="rounded-[3px] bg-[#FEE4E6] px-2 text-xs leading-5 text-[#F5222D]">
									校验异常
								</span>
							) : (
								<span className="rounded-[3px] bg-[#E3F7ED] px-2 text-xs leading-5 text-[#14B968]">
									校验通过
								</span>
							)
						}
						extra={
							<div className="flex items-center gap-3 text-base leading-6 text-[#323233]">
								<span>
									总人数：
									{data?.totalCount ?? 0}
								</span>
								<span aria-hidden="true" className="h-[17px] w-0.5 bg-[#E4E7ED]" />
								<span>
									已填报人数：
									{data?.filledCount ?? 0}
								</span>
							</div>
						}
					/>
					<Table
						className={styles.submitTable}
						columns={distributionColumns}
						dataSource={data?.distributionRows ?? []}
						pagination={false}
						rowKey="key"
						bordered
						size="middle"
					/>
					<div className="mt-2 text-base leading-6 text-[#909399]">
						基准规则：（1）岗位类别人数&gt;7人，为A≤10%、A和B+≤30%、C/D≥10%；（2）岗位类别人数≤7，A≤1,A和B+≤30%，C和D不做强制要求
					</div>
				</div>

				{/* 提报名单 */}
				<div className="mt-4">
					<SectionTitle
						title="提报名单"
						extra={
							<Button
								icon={<ExportOutlined />}
								onClick={() => {
									const headers = [
										"员工",
										"工号",
										"部门",
										"岗位",
										"岗位分类",
										"职级",
										"在职状态",
										"自评分",
										"提报评分",
										"一级部门排名",
										"建议等级",
										"提报等级",
										"校验情况",
										"异常情况说明",
										"填报人",
										"状态",
									];
									const rows = filteredEmployees.map((employee) => [
										employee.name,
										employee.employeeNo,
										employee.department,
										employee.position,
										employee.positionCategory,
										employee.jobLevel,
										employee.employmentStatus,
										String(employee.selfScore ?? ""),
										String(submitScores[employee.id] ?? ""),
										employee.departmentRank ?? "",
										employee.suggestLevel ?? "",
										submitLevels[employee.id] ?? "",
										employee.checkStatus,
										exceptionNotes[employee.id] ?? "",
										employee.filler ?? "",
										employee.status ?? "",
									]);
									exportCsv("提报名单.csv", headers, rows);
								}}
							>
								导出
							</Button>
						}
					/>
					{employeeFilter}
					<Table
						className={styles.submitTable}
						columns={employeeColumns}
						dataSource={filteredEmployees}
						pagination={{
							defaultPageSize: 20,
							showSizeChanger: true,
							showTotal: (total) => `共${total}条`,
						}}
						rowKey="id"
						bordered
						size="middle"
						// 16 列合计 1537px，超出内容区 1372px，需要横向滚动
						scroll={{ x: 1537 }}
					/>
				</div>
				{/* 协作人配置弹窗 */}
				<CollaboratorModal
					open={collaboratorOpen}
					onClose={() => setCollaboratorOpen(false)}
					onSaved={(rows) => {
						setCollaborator(
							rows
								.map((row) => row.fillerName)
								.filter(Boolean)
								.join("、"),
						);
						setCollaboratorOpen(false);
					}}
				/>
				{/* 异常情况说明弹窗 */}
				<ExceptionNoteModal
					open={exceptionOpen}
					initialValue={exceptionTarget ? (exceptionNotes[exceptionTarget.id] ?? "") : ""}
					onClose={() => setExceptionOpen(false)}
					onConfirm={(value) => {
						if (exceptionTarget) {
							setExceptionNotes((prev) => ({ ...prev, [exceptionTarget.id]: value }));
						}
					}}
				/>
			</Drawer>
		</ConfigProvider>
	);
}
