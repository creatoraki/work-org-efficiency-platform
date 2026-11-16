import type {
	ApprovalData,
	ApprovalDetailRow,
	ApprovalDistributionRow,
	ApprovalEmployee,
	ApprovalEmployeeQuery,
} from "#src/api/performance-management/approval";

import {
	ApprovalAuditAction,
	auditApprovalDetail,
	filterApprovalEmployees,
} from "#src/api/performance-management/approval";
import { RatingTodoStatus } from "#src/api/performance-management/todo";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { CloseCircleOutlined, WarningFilled } from "@ant-design/icons";
import { Button, ConfigProvider, Drawer, Input, message, Modal, Table } from "antd";
import { useCallback, useMemo, useState } from "react";
import { APPROVAL_TABLE_CLASS, APPROVAL_TABLE_THEME } from "./approval-constants";
import {
	ApprovalEmployeeFilterBar,
	ApprovalExportButton,
	DistributionBasisRule,
} from "./approval-shared";
import { getApprovalDistributionColumns, getApprovalEmployeeColumns } from "./columns";

const EMPLOYEE_COLUMNS = getApprovalEmployeeColumns();

/**
 * 审核抽屉属性
 */
interface ApprovalAuditDrawerProps {
	/** 审批详情 */
	data?: ApprovalData;
	/** 当前组织明细行 */
	detail?: ApprovalDetailRow;
	/** 是否可见 */
	open: boolean;
	/** 是否只读（查看态） */
	readonly?: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 审核完成后回调 */
	onAudited?: () => void;
}

/**
 * 审核抽屉
 *
 * 按组织审核单个提交，展示评级信息、分布异常说明、等级分布与只读提报名单，
 * 底部提供驳回 / 通过（只读态仅关闭，被驳回态不提供底部操作）。
 *
 * @param props - 组件属性
 * @param props.data - 审批详情
 * @param props.detail - 当前组织明细
 * @param props.open - 是否可见
 * @param props.readonly - 是否只读
 * @param props.onClose - 关闭回调
 * @param props.onAudited - 审核完成回调
 * @returns 审核抽屉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function ApprovalAuditDrawer({
	data,
	detail,
	open,
	readonly = false,
	onClose,
	onAudited,
}: ApprovalAuditDrawerProps) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [auditAction, setAuditAction] = useState<ApprovalAuditAction>(ApprovalAuditAction.PASS);
	const [submitting, setSubmitting] = useState(false);
	const [reason, setReason] = useState("");
	const [reasonError, setReasonError] = useState(false);
	const [employeeQuery, setEmployeeQuery] = useState<ApprovalEmployeeQuery>({});
	const [appliedEmployeeQuery, setAppliedEmployeeQuery] = useState<ApprovalEmployeeQuery>({});

	const employees = useMemo(
		() => (data ? filterApprovalEmployees(data.employees, appliedEmployeeQuery) : []),
		[data, appliedEmployeeQuery],
	);

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

	const resetConfirm = () => {
		setConfirmOpen(false);
		setReason("");
		setReasonError(false);
	};

	const handleAudit = async () => {
		if (!data || !detail) return;
		let auditReason: string | undefined;
		if (auditAction === ApprovalAuditAction.REJECT) {
			if (!reason.trim()) {
				setReasonError(true);
				return;
			}
			auditReason = reason.trim();
		}
		setSubmitting(true);
		try {
			await auditApprovalDetail(data.todoId, detail.key, auditAction, auditReason);
			message.success(auditAction === ApprovalAuditAction.PASS ? "审核通过" : "已驳回");
			resetConfirm();
			onAudited?.();
			onClose();
		} finally {
			setSubmitting(false);
		}
	};

	const rejected = detail?.status === RatingTodoStatus.REJECTED;

	return (
		<>
			<Drawer
				open={open}
				onClose={onClose}
				width={1200}
				closable={{ closeIcon: <CloseCircleOutlined style={{ fontSize: 26 }} /> }}
				styles={{ body: { padding: 0 } }}
				title={
					<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
						{detail?.orgName ?? ""}-{readonly ? "查看" : "审核"}
					</span>
				}
				footer={
					rejected ? null : readonly ? (
						<div className="flex justify-end">
							<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
								关闭
							</Button>
						</div>
					) : (
						<div className="flex justify-end gap-2">
							<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
								取消
							</Button>
							<Button
								className="rounded-[3px] border-[#E4E7ED]"
								onClick={() => {
									setAuditAction(ApprovalAuditAction.REJECT);
									setConfirmOpen(true);
								}}
							>
								驳回
							</Button>
							<Button
								type="primary"
								className="rounded-[3px] bg-[#0075FF]"
								onClick={() => {
									setAuditAction(ApprovalAuditAction.PASS);
									setConfirmOpen(true);
								}}
							>
								通过
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
								驳回原因：{detail?.rejectReason ?? ""}
							</p>
						</div>
					) : null}
					<div className="p-6">
						{/* 评级信息 */}
						<div className="mb-4">
							<SectionTitle title="评级信息" />
							<div className="grid grid-cols-3 gap-x-6 gap-y-4 rounded-[3px] bg-[#F5F7FA] p-3">
								<div className="flex flex-col gap-1">
									<span className="text-sm leading-[22px] text-[#606266]">
										组织名称
									</span>
									<span className="text-sm leading-[22px] text-black">
										{detail?.orgName}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm leading-[22px] text-[#606266]">
										提交人
									</span>
									<span className="text-sm leading-[22px] text-black">
										{detail?.submitter}
									</span>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-sm leading-[22px] text-[#606266]">
										最近提交时间
									</span>
									<span className="text-sm leading-[22px] text-black">
										{detail?.lastSubmitTime ?? "2026-12-15 12:11"}
									</span>
								</div>
							</div>
						</div>
						{/* 分布异常说明 */}
						<div className="mb-4">
							<SectionTitle title="分布异常说明" />
							<div className="rounded-[3px] border border-[#E4E7ED] p-3 text-sm leading-[22px] text-[#323233]">
								{detail?.exceptionNote || "无"}
							</div>
						</div>
						{/* 等级分布 */}
						<div className="mb-4">
							<SectionTitle
								title="等级分布"
								badge={
									<span className="rounded-[3px] bg-[#E3F7ED] px-2 text-xs leading-5 text-[#14B968]">
										校验通过
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
							<Table
								rowKey="key"
								size="middle"
								pagination={false}
								bordered
								className={APPROVAL_TABLE_CLASS}
								dataSource={data?.distributionRows ?? []}
								columns={distributionColumns}
								onRow={(record) =>
									record.isTotal ? { className: "font-medium" } : {}
								}
							/>
							<div className="mt-2">
								<DistributionBasisRule />
							</div>
						</div>
						{/* 提报名单 */}
						<div>
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
								bordered
								columns={EMPLOYEE_COLUMNS}
								dataSource={employees}
								scroll={{ x: 1384 }}
								pagination={{
									defaultPageSize: 20,
									showSizeChanger: true,
									showTotal: (total) => `共${total}条`,
								}}
								className={APPROVAL_TABLE_CLASS}
							/>
						</div>
					</div>
				</ConfigProvider>
			</Drawer>
			{/* 二次确认 */}
			<Modal
				centered
				open={confirmOpen}
				title={
					auditAction === ApprovalAuditAction.PASS ? (
						"请确认是否通过"
					) : (
						<span className="flex items-center gap-2.5">
							<WarningFilled style={{ color: "#FF7D00", fontSize: 24 }} />
							<span className="text-base font-medium text-[#323233]">
								请确认是否驳回
							</span>
						</span>
					)
				}
				onCancel={resetConfirm}
				onOk={handleAudit}
				confirmLoading={submitting}
				okText="确认"
				cancelText="取消"
				width={380}
				okButtonProps={{ style: { background: "#0075FF" } }}
				cancelButtonProps={{ style: { borderColor: "#E4E7ED", color: "#323233" } }}
			>
				{auditAction === ApprovalAuditAction.PASS ? (
					<p className="text-sm leading-[22px] text-[#606266]">
						审核通过后该提交将进入下一环节，确认通过吗？
					</p>
				) : (
					<div>
						<Input.TextArea
							rows={3}
							maxLength={100}
							value={reason}
							status={reasonError ? "error" : undefined}
							style={{
								height: 62,
								borderColor: reasonError ? "#F5222D" : "#E4E7ED",
								borderRadius: 3,
							}}
							placeholder="请输入驳回原因"
							onChange={(event) => {
								setReason(event.target.value);
								if (event.target.value.trim()) {
									setReasonError(false);
								}
							}}
						/>
						<div className="mt-0.5 flex items-center justify-between">
							<span className="text-xs leading-5 text-[#F5222D]">
								{reasonError ? "请输入驳回原因" : ""}
							</span>
							<span className="text-xs leading-5 text-[#323233]">
								{reason.length}/100
							</span>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
}
