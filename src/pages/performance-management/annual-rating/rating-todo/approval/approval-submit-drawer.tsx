import type {
	ApprovalData,
	ApprovalDistributionRow,
	ApprovalEmployee,
	ApprovalEmployeeQuery,
	ApprovalSubmitPayload,
} from "#src/api/performance-management/approval";
import type { TableColumnsType } from "antd";

import {
	ApprovalCheckStatus,
	filterApprovalEmployees,
	saveApprovalDraft,
	startApprovalOa,
	submitApproval,
} from "#src/api/performance-management/approval";
import { RatingTodoStatus } from "#src/api/performance-management/todo";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { CloseCircleOutlined, FileTextOutlined, WarningFilled } from "@ant-design/icons";
import {
	Button,
	ConfigProvider,
	Drawer,
	Dropdown,
	Input,
	InputNumber,
	message,
	Select,
	Table,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	APPROVAL_TABLE_CLASS,
	APPROVAL_TABLE_THEME,
	approvalStatusTagClass,
	SUBMIT_LEVEL_OPTIONS,
} from "./approval-constants";
import {
	ApprovalEmployeeFilterBar,
	ApprovalExportButton,
	ApprovalStatus,
	DistributionBasisRule,
} from "./approval-shared";
import { getApprovalDistributionColumns } from "./columns";

/**
 * 提交抽屉属性
 */
interface ApprovalSubmitDrawerProps {
	/** 审批详情 */
	data?: ApprovalData;
	/** 协作人 */
	collaborators?: string[];
	/** 是否可见 */
	open: boolean;
	/** 只读版本查看态（提交后-查看-提交版本 / 流程编号） */
	readonly?: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 提交成功回调 */
	onSubmitted?: () => void;
	/** 版本切换回调 */
	onVersionChange?: (versionId: string) => void;
}

/**
 * 提交抽屉
 *
 * 可编辑态展示分布异常说明、等级分布与提报名单，提报评分/提报等级/异常说明可编辑；
 * 提交成功后进入待发起 OA 态，补填提交说明后可发起 OA；只读态展示提交版本。
 *
 * @param props - 组件属性
 * @param props.data - 审批详情
 * @param props.collaborators - 协作人
 * @param props.open - 是否可见
 * @param props.readonly - 是否只读
 * @param props.onClose - 关闭回调
 * @param props.onSubmitted - 提交成功回调
 * @param props.onVersionChange - 版本切换回调
 * @returns 提交抽屉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function ApprovalSubmitDrawer({
	data,
	collaborators,
	open,
	readonly = false,
	onClose,
	onSubmitted,
	onVersionChange,
}: ApprovalSubmitDrawerProps) {
	const [draft, setDraft] = useState<ApprovalData["employees"]>([]);
	const [aggregateNote, setAggregateNote] = useState("");
	const [submitNote, setSubmitNote] = useState("");
	const [oaPending, setOaPending] = useState(false);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [oaStarting, setOaStarting] = useState(false);
	const [oaProcessNo, setOaProcessNo] = useState<string>();
	const [employeeQuery, setEmployeeQuery] = useState<ApprovalEmployeeQuery>({});
	const [appliedEmployeeQuery, setAppliedEmployeeQuery] = useState<ApprovalEmployeeQuery>({});

	/**
	 * 每次打开或切换版本时初始化表单快照。
	 * 提交成功后父级会刷新同一版本的详情 data，此时保留当前待发起 OA 状态。
	 */
	const initializedVersionRef = useRef<string>();
	useEffect(() => {
		if (!open) {
			initializedVersionRef.current = undefined;
			return;
		}
		if (data && initializedVersionRef.current !== data.currentVersionId) {
			initializedVersionRef.current = data.currentVersionId;
			setDraft(data.employees.map((item) => ({ ...item })));
			setAggregateNote(data.distributionExceptionNote ?? "");
			setSubmitNote("");
			setOaPending(false);
			setOaProcessNo(data.oaProcessNo);
			setEmployeeQuery({});
			setAppliedEmployeeQuery({});
		}
	}, [open, data]);

	const isReadonly = readonly;

	const employees = useMemo(
		() => filterApprovalEmployees(draft, appliedEmployeeQuery),
		[draft, appliedEmployeeQuery],
	);

	const distributionAbnormal = useMemo(
		() =>
			(data?.distributionRows ?? []).some((row) =>
				Object.values(row.check).some((value) => value !== ApprovalCheckStatus.NORMAL),
			),
		[data],
	);

	/** 表单是否完整（提报评分 / 提报等级 / 必填异常说明 / 分布异常说明） */
	const formComplete = useMemo(() => {
		if (!data) return false;
		if (draft.some((item) => item.submitScore === undefined || !item.submitLevel)) {
			return false;
		}
		if (draft.some((item) => item.exceptionNoteRequired && !item.exceptionNote?.trim())) {
			return false;
		}
		if (distributionAbnormal && !aggregateNote.trim()) {
			return false;
		}
		return true;
	}, [data, draft, distributionAbnormal, aggregateNote]);

	/** 提交说明是否已填写（发起 OA 的前置条件） */
	const oaComplete = submitNote.trim().length > 0;

	const updateRow = (id: string, patch: Partial<ApprovalEmployee>) => {
		setDraft((current) =>
			current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
		);
	};

	/**
	 * 点击等级分布的实际人数单元格时，联动筛选提报名单。
	 *
	 * @param level - 点击的等级（A / B+ / B / C/D）
	 * @param record - 当前等级分布行
	 */
	const handleActualClick = useCallback(
		(level: string, record: ApprovalDistributionRow) => {
			const next: ApprovalEmployeeQuery = {
				...employeeQuery,
				submitLevel: level,
				positionCategory: record.isTotal ? undefined : record.positionCategory,
			};
			setEmployeeQuery(next);
			setAppliedEmployeeQuery(next);
		},
		[employeeQuery],
	);

	const distributionColumns = useMemo(
		() => getApprovalDistributionColumns({ onActualClick: handleActualClick }),
		[handleActualClick],
	);

	const columns = useMemo<TableColumnsType<ApprovalEmployee>>(
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
				sorter: (a, b) => (a.selfScore ?? 0) - (b.selfScore ?? 0),
				render: (value?: number) => (value === undefined ? "-" : value.toFixed(2)),
			},
			{
				title: isReadonly ? (
					"提报评分"
				) : (
					<span>
						<span className="mr-1 text-[#F5222D]">*</span>提报评分
					</span>
				),
				dataIndex: "submitScore",
				key: "submitScore",
				width: 100,
				sorter: (a, b) => (a.submitScore ?? 0) - (b.submitScore ?? 0),
				render: (value: number | undefined, record: ApprovalEmployee) =>
					isReadonly ? (
						<span className="text-[#0075FF]">
							{value === undefined ? "-" : value.toFixed(2)}
						</span>
					) : (
						<InputNumber
							className="w-full"
							min={0}
							max={100}
							placeholder="请输入"
							value={value}
							onChange={(next) =>
								updateRow(record.id, { submitScore: next ?? undefined })
							}
						/>
					),
			},
			{
				title: "一级部门排名",
				dataIndex: "departmentRank",
				key: "departmentRank",
				width: 128,
				sorter: (a, b) => {
					const left = Number.parseInt(a.departmentRank ?? "", 10);
					const right = Number.parseInt(b.departmentRank ?? "", 10);
					return (
						(Number.isNaN(left) ? Number.MAX_SAFE_INTEGER : left) -
						(Number.isNaN(right) ? Number.MAX_SAFE_INTEGER : right)
					);
				},
			},
			{ title: "建议等级", dataIndex: "suggestLevel", key: "suggestLevel", width: 80 },
			{
				title: (
					<span className="flex items-center gap-2">
						<span>
							{isReadonly ? null : <span className="mr-1 text-[#F5222D]">*</span>}
							提报等级
						</span>
						{isReadonly ? null : (
							<button
								type="button"
								className="cursor-pointer border-0 bg-transparent p-0 text-xs leading-[22px] text-[#0075FF]"
								onClick={() => {
									setDraft((current) =>
										current.map((item) =>
											item.suggestLevel
												? { ...item, submitLevel: item.suggestLevel }
												: item,
										),
									);
								}}
							>
								一键带入
							</button>
						)}
					</span>
				),
				dataIndex: "submitLevel",
				key: "submitLevel",
				width: 110,
				render: (value: string | undefined, record: ApprovalEmployee) =>
					isReadonly ? (
						(value ?? "-")
					) : (
						<Select
							allowClear
							className="w-full"
							placeholder="请选择"
							options={SUBMIT_LEVEL_OPTIONS}
							value={value}
							onChange={(next) => updateRow(record.id, { submitLevel: next })}
						/>
					),
			},
			{
				title: "校验情况",
				dataIndex: "checkStatus",
				key: "checkStatus",
				width: 106,
				render: (value: ApprovalCheckStatus) => {
					const color = value === ApprovalCheckStatus.NORMAL ? "#14B968" : "#F5222D";
					return (
						<span
							className="flex items-center gap-1 whitespace-nowrap"
							style={{ color }}
						>
							<span
								className="size-1.5 shrink-0 rounded-full"
								style={{ backgroundColor: color }}
							/>
							{value}
						</span>
					);
				},
			},
			{
				title: "异常情况说明",
				dataIndex: "exceptionNote",
				key: "exceptionNote",
				width: 108,
				render: (value: string | undefined, record: ApprovalEmployee) =>
					isReadonly ? (
						<span className="text-sm text-[#606266]">{value || "-"}</span>
					) : (
						<Input
							placeholder={record.exceptionNoteRequired ? "必填" : "选填"}
							value={value}
							onChange={(e) =>
								updateRow(record.id, { exceptionNote: e.target.value })
							}
						/>
					),
			},
			{ title: "填报人", dataIndex: "filler", key: "filler", width: 66 },
			{
				title: "状态",
				dataIndex: "status",
				key: "status",
				width: 76,
				render: (value: string) => <ApprovalStatus status={value} />,
			},
		],
		[isReadonly],
	);

	const buildPayload = (): ApprovalSubmitPayload | undefined => {
		if (!data) return undefined;
		return {
			todoId: data.todoId,
			versionId: data.currentVersionId,
			distributionExceptionNote: aggregateNote.trim(),
			collaborators,
			employees: draft.map((item) => ({
				id: item.id,
				submitScore: item.submitScore,
				submitLevel: item.submitLevel,
				exceptionNote: item.exceptionNote,
			})),
		};
	};

	const handleSaveDraft = async () => {
		const payload = buildPayload();
		if (!payload) return;
		setSaving(true);
		try {
			await saveApprovalDraft(payload);
			message.success("已暂存");
		} finally {
			setSaving(false);
		}
	};

	const handleSubmit = async () => {
		const payload = buildPayload();
		if (!payload || !data) return;
		if (!formComplete) {
			message.error("请填写完整的提报信息");
			return;
		}
		setSubmitting(true);
		try {
			await submitApproval(payload);
			message.success("提交成功");
			setOaPending(true);
			onSubmitted?.();
		} finally {
			setSubmitting(false);
		}
	};

	const handleStartOa = async () => {
		if (!data) return;
		setOaStarting(true);
		try {
			await startApprovalOa(data.todoId);
			message.success("已发起 OA，请在 OA 上查看流程");
			setOaProcessNo(`UY${Date.now().toString().slice(0, 15)}`);
		} finally {
			setOaStarting(false);
		}
	};

	/** 驳回原因：接口暂未在审批详情顶层下发，先取被驳回明细行的原因 */
	const rejectReason = data?.details.find((row) => row.rejectReason)?.rejectReason;
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();
	const rejected = data?.ratingInfo.status === RatingTodoStatus.REJECTED;
	const statusText = isReadonly ? "已完成" : statusLabel(data?.ratingInfo.status);

	return (
		<Drawer
			open={open}
			onClose={onClose}
			width={isReadonly ? 1200 : 1420}
			closable={{ closeIcon: <CloseCircleOutlined style={{ fontSize: 26 }} /> }}
			styles={{ body: { padding: 0 } }}
			title={
				<span className="flex items-center gap-3 text-[20px] font-semibold leading-[28px] text-[#323233]">
					{isReadonly ? "提交版本" : "提交"}
					{isReadonly && data ? (
						data.versions.length > 0 ? (
							<Dropdown
								menu={{
									items: data.versions.map((version) => ({
										key: version.id,
										label: version.name,
									})),
									selectedKeys: data.currentVersionId
										? [data.currentVersionId]
										: [],
									onClick: ({ key }) => onVersionChange?.(key),
								}}
							>
								<button
									type="button"
									className="flex h-8 cursor-pointer items-center gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-4 text-sm font-normal leading-[22px] text-[#323233]"
								>
									<FileTextOutlined className="text-base" />
									查看提交版本
								</button>
							</Dropdown>
						) : null
					) : null}
				</span>
			}
			footer={
				isReadonly ? null : oaPending ? (
					oaProcessNo ? null : (
						<div className="flex justify-end gap-2">
							<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
								取消
							</Button>
							<Button
								type="primary"
								disabled={!oaComplete}
								style={{
									background: oaComplete ? "#0075FF" : "#B8D3FF",
									borderColor: "transparent",
									color: "#fff",
								}}
								className="rounded-[3px]"
								loading={oaStarting}
								onClick={handleStartOa}
							>
								发起 OA
							</Button>
						</div>
					)
				) : (
					<div className="flex justify-end gap-2">
						<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
							取消
						</Button>
						<Button
							className="rounded-[3px] border-[#E4E7ED]"
							loading={saving}
							onClick={handleSaveDraft}
						>
							暂存
						</Button>
						<Button
							type="primary"
							disabled={!formComplete}
							style={{
								background: formComplete ? "#0075FF" : "#B8D3FF",
								borderColor: "transparent",
								color: "#fff",
							}}
							className="rounded-[3px]"
							loading={submitting}
							onClick={handleSubmit}
						>
							提交
						</Button>
					</div>
				)
			}
		>
			<ConfigProvider theme={APPROVAL_TABLE_THEME}>
				{/* 驳回原因（被驳回态顶部通栏提示） */}
				{rejected ? (
					<div className="flex items-start gap-2 bg-[#FFEFE0] px-4 py-2">
						<WarningFilled style={{ color: "#FF7D00", fontSize: 22 }} />
						<p className="text-base leading-6 text-[#323233]">
							驳回原因：{rejectReason ?? ""}
						</p>
					</div>
				) : null}
				<div className="p-6">
					{/* 评级信息 */}
					<div className="mb-4">
						<SectionTitle
							title="评级信息"
							extra={
								data ? (
									<span className="text-sm leading-[22px] text-[#606266]">
										总人数：{data.totalCount}
									</span>
								) : null
							}
						/>
						<div className="grid grid-cols-8 gap-x-6 gap-y-4 rounded-[3px] bg-[#F5F7FA] p-3">
							{data
								? [
										["计划名称", data.ratingInfo.planName],
										["周期", data.ratingInfo.cycle],
										["考核类型", assessTypeLabel(data.ratingInfo.assessType)],
										["节点类型", nodeTypeLabel(data.ratingInfo.nodeType)],
										["执行范围", data.ratingInfo.executeScope],
										["执行人", data.ratingInfo.executor],
										["有效期", data.ratingInfo.validDate],
									].map(([label, value]) => (
										<div key={label} className="flex flex-col gap-1">
											<span className="text-sm leading-[22px] text-[#606266]">
												{label}
											</span>
											<span className="text-sm leading-[22px] text-black">
												{value}
											</span>
										</div>
									))
								: null}
							<div className="flex flex-col gap-1">
								<span className="text-sm leading-[22px] text-[#606266]">状态</span>
								<span
									className={`w-fit rounded-[3px] px-2 text-xs leading-5 ${approvalStatusTagClass(statusText)}`}
								>
									{statusText}
								</span>
							</div>
						</div>
					</div>
					{/* 提交说明（提交成功待发起 OA / 只读且有值时展示） */}
					{oaPending || (isReadonly && submitNote) ? (
						<div className="mb-4">
							<SectionTitle
								title={
									isReadonly ? (
										"提交说明"
									) : (
										<span>
											<span className="mr-1 text-[#F5222D]">*</span>提交说明
										</span>
									)
								}
							/>
							{isReadonly ? (
								<div className="rounded-[3px] border border-[#E4E7ED] p-3 text-sm leading-[22px] text-[#323233]">
									{submitNote}
								</div>
							) : (
								<>
									<Input.TextArea
										rows={3}
										maxLength={500}
										placeholder="若等级分布，校验异常，则需进行填写原因"
										value={submitNote}
										style={{
											height: 62,
											borderColor: "#E4E7ED",
											borderRadius: 3,
										}}
										onChange={(event) => setSubmitNote(event.target.value)}
									/>
									<div className="mt-0.5 text-right text-xs leading-5 text-[#323233]">
										{submitNote.length}/500
									</div>
								</>
							)}
						</div>
					) : null}
					{/* 分布异常说明 */}
					<div className="mb-4">
						<SectionTitle
							title={
								isReadonly ? (
									"分布异常说明"
								) : (
									<span>
										<span className="mr-1 text-[#F5222D]">*</span>分布异常说明
									</span>
								)
							}
						/>
						{isReadonly ? (
							<div className="rounded-[3px] border border-[#E4E7ED] p-3 text-sm leading-[22px] text-[#323233]">
								{aggregateNote || "无"}
							</div>
						) : (
							<>
								<Input.TextArea
									rows={3}
									maxLength={500}
									placeholder="若等级分布、校验异常，则需进行填写原因"
									value={aggregateNote}
									style={{ height: 62, borderColor: "#E4E7ED", borderRadius: 3 }}
									onChange={(event) => setAggregateNote(event.target.value)}
								/>
								<div className="mt-0.5 text-right text-xs leading-5 text-[#323233]">
									{aggregateNote.length}/500
								</div>
							</>
						)}
					</div>
					{/* 等级分布 */}
					<SectionTitle
						title="等级分布"
						badge={
							<span
								className={`rounded-[3px] px-2 text-xs leading-5 ${distributionAbnormal ? "bg-[#FEE4E6] text-[#F5222D]" : "bg-[#E3F7ED] text-[#14B968]"}`}
							>
								{distributionAbnormal ? "校验异常" : "校验通过"}
							</span>
						}
						extra={
							data ? (
								<span className="flex items-center text-base leading-6 text-[#323233]">
									总人数：
									{data.totalCount}
									<span
										className="mx-3 h-[17px] w-0.5 bg-[#E4E7ED]"
										aria-hidden
									/>
									已填报人数：
									{data.filledCount}
								</span>
							) : null
						}
					/>
					<div className="mb-4">
						<Table
							rowKey="key"
							size="middle"
							pagination={false}
							bordered
							className={APPROVAL_TABLE_CLASS}
							dataSource={data?.distributionRows ?? []}
							columns={distributionColumns}
							onRow={(record) => (record.isTotal ? { className: "font-medium" } : {})}
						/>
						<div className="mt-2">
							<DistributionBasisRule />
						</div>
					</div>
					{/* 提报名单 */}
					<SectionTitle
						title="提报名单"
						extra={<ApprovalExportButton employees={employees} />}
					/>
					<ApprovalEmployeeFilterBar
						value={employeeQuery}
						onChange={(patch) =>
							setEmployeeQuery((current) => ({ ...current, ...patch }))
						}
						onSearch={() => setAppliedEmployeeQuery(employeeQuery)}
						onReset={() => {
							setEmployeeQuery({});
							setAppliedEmployeeQuery({});
						}}
					/>
					<Table<ApprovalEmployee>
						rowKey="id"
						size="middle"
						columns={columns}
						dataSource={employees}
						scroll={{ x: 1414 }}
						pagination={{
							defaultPageSize: 20,
							showSizeChanger: true,
							showTotal: (total) => `共${total}条`,
						}}
						className={APPROVAL_TABLE_CLASS}
					/>
				</div>
			</ConfigProvider>
		</Drawer>
	);
}
