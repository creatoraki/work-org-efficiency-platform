import type {
	FlowField,
	FlowTimelineItem,
} from "#src/pages/performance-management/annual-rating/rating-todo/components/flow-timeline";

import { ConfirmFlowType } from "#src/api/performance-management/confirm";
import { RatingAssessType } from "#src/api/performance-management/todo";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { AppealDetailDrawer } from "#src/pages/performance-management/annual-rating/rating-todo/appeal/appeal-detail-drawer";
import { FlowTimeline } from "#src/pages/performance-management/annual-rating/rating-todo/components/flow-timeline";
import { AppealFilingDetailModal } from "#src/pages/performance-management/annual-rating/rating-todo/confirm/appeal-filing-detail-modal";
import {
	useConfirmDetail,
	useSubmitConfirm,
} from "#src/pages/performance-management/annual-rating/rating-todo/confirm/hooks/use-confirm";
import { CloseCircleOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Drawer, message } from "antd";
import { useCallback, useMemo, useState } from "react";

/**
 * 确认抽屉组件属性
 */
interface ConfirmDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 抽屉是否可见 */
	open: boolean;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 发起申诉回调 */
	onAppeal: () => void;
	/** 确认成功回调 */
	onConfirmed: () => void;
}

/** 基础信息三列留白：首列右留白、中列两侧留白、末列左留白，保证三列纵向对齐 */
const BASIC_COLUMN_PADDING = ["pr-6", "px-6", "pl-6"] as const;

/**
 * 标签-值内联行（基础信息）
 *
 * 标签列固定 92px 右对齐，与值间距 24px，行高 34px。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.columnClass - 所在列的左右留白类名
 * @returns 信息行元素
 */
function InlineField({
	label,
	value,
	columnClass = "",
}: {
	label: string;
	value: string;
	columnClass?: string;
}) {
	return (
		<div className={`flex h-[34px] items-center gap-6 py-1.5 ${columnClass}`}>
			<span className="w-[92px] shrink-0 text-right text-sm leading-[22px] text-[#606266]">
				{label}
			</span>
			<span className="min-w-0 flex-1 truncate text-sm leading-[22px] text-black">
				{value}
			</span>
		</div>
	);
}

/**
 * 堆叠字段（评级信息用：标签在上、值在下）
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.tag - 状态标签（仅状态列使用）
 * @param props.tagTone - 标签色调 success/pending
 * @returns 字段元素
 */
function StackedField({
	label,
	value,
	tag,
	tagTone = "pending",
}: {
	label: string;
	value: string;
	tag?: string;
	tagTone?: "success" | "pending";
}) {
	const tagClass =
		tagTone === "success" ? "bg-[#E3F7ED] text-[#14B968]" : "bg-[#FFEFE0] text-[#FF7D00]";
	return (
		<div className="flex flex-col gap-1">
			<span className="text-sm leading-[22px] text-[#606266]">{label}</span>
			{tag ? (
				<span className={`w-fit rounded-[3px] px-1.5 py-0.5 text-xs ${tagClass}`}>
					{tag}
				</span>
			) : (
				<span className="whitespace-nowrap text-sm leading-[22px] text-black">{value}</span>
			)}
		</div>
	);
}

/**
 * 得分卡片
 *
 * @param props - 组件属性
 * @param props.label - 卡片标题
 * @param props.value - 得分值
 * @param props.color - 数值颜色
 * @returns 卡片元素
 */
function ScoreCard({ label, value, color }: { label: string; value: string; color: string }) {
	return (
		<div className="flex-1 rounded border border-[#EBEEF5] px-3 py-1.5">
			<div className="mb-2 text-base leading-6" style={{ color }}>
				{label}
			</div>
			<div className="text-xl font-normal leading-7" style={{ color }}>
				{value}
			</div>
		</div>
	);
}

/**
 * 确认抽屉
 *
 * 展示评级信息、基础信息、考评结果确认与确认流程。
 * 支持四种形态：
 * - 待完成（基层员工）：3 张卡片 + 发起申诉/确认
 * - 已完成（基层员工）：3 张卡片 + 单条确认流程
 * - 已完成（管理者）：4 张卡片（KPI/述职/考评得分/考评等级）+ 单条确认流程
 * - 有申诉：展示完整申诉时间线
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 抽屉是否可见
 * @param props.onClose - 关闭抽屉回调
 * @param props.onAppeal - 发起申诉回调
 * @param props.onConfirmed - 确认成功回调
 * @returns 确认抽屉组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function ConfirmDrawer({
	todoId,
	open,
	onClose,
	onAppeal,
	onConfirmed,
}: ConfirmDrawerProps) {
	const { data, isLoading } = useConfirmDetail(todoId, open);
	const confirmMutation = useSubmitConfirm();
	const [detailOpen, setDetailOpen] = useState(false);
	const [appealDetailNo, setAppealDetailNo] = useState("");
	const [appealDetailOpen, setAppealDetailOpen] = useState(false);

	/**
	 * 点击申诉编号：打开申诉详情弹窗
	 */
	const handleAppealNoClick = useCallback((appealNo: string) => {
		setAppealDetailNo(appealNo);
		setAppealDetailOpen(true);
	}, []);

	/**
	 * 提交确认
	 */
	const handleConfirm = useCallback(() => {
		confirmMutation.mutate(
			{ todoId },
			{
				onSuccess: () => {
					message.success("确认成功");
					onConfirmed();
					onClose();
				},
			},
		);
	}, [todoId, confirmMutation, onConfirmed, onClose]);

	/** 是否为管理者（4 张卡片） */
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();
	const isManager = data?.ratingInfo.assessType === RatingAssessType.MANAGER;
	/** 是否已确认完成（只读） */
	const finished = data?.finished ?? false;
	/** 是否存在申诉流程（决定底部提示与按钮） */
	const hasAppeal = useMemo(
		() => (data?.flowItems ?? []).some((item) => item.type === ConfirmFlowType.APPEAL),
		[data?.flowItems],
	);

	const flowItems = data?.flowItems ?? [];

	/** 申诉处理中：流程最后一个节点是申诉（尚未给出处理结论） */
	const appealProcessing = useMemo(() => {
		const last = flowItems[flowItems.length - 1];
		return last?.type === ConfirmFlowType.APPEAL;
	}, [flowItems]);

	/** 是否展示底部操作区：已完成与申诉处理中均为只读，仅保留头部关闭图标 */
	const showFooter = !finished && !appealProcessing;

	/** 确认结果摘要，用于底部展示 */
	const confirmSummary = useMemo(() => {
		const lastConfirm = [...flowItems]
			.reverse()
			.find((i) => i.type === ConfirmFlowType.CONFIRM);
		if (lastConfirm) {
			return { score: lastConfirm.confirmScore, level: lastConfirm.confirmLevel };
		}
		return {
			score: data?.evalResult.evalScore,
			level: data?.evalResult.evalLevel,
		};
	}, [flowItems, data?.evalResult]);

	/**
	 * 把确认接口数据归一成时间线展示模型
	 *
	 * 确认节点展示确认得分与等级；申诉、拒绝、通过节点的第二列统一展示
	 * 「执行人」，值优先取 executor，缺省回退 submitter。
	 */
	const flowTimelineItems = useMemo<FlowTimelineItem[]>(
		() =>
			flowItems.map((item) => {
				if (item.type === ConfirmFlowType.CONFIRM) {
					return {
						id: item.id,
						title: item.type,
						date: item.date,
						fields: [
							{ label: "确认得分", value: (item.confirmScore ?? 0).toFixed(2) },
							{ label: "确认等级", value: item.confirmLevel ?? "" },
						],
					};
				}

				const isAppeal = item.type === ConfirmFlowType.APPEAL;
				const fields: FlowField[] = [
					{ label: "申诉类型", value: item.appealType ?? "" },
					{
						label: "执行人",
						value: item.executor ?? item.submitter ?? "",
					},
				];
				if (item.appealScore !== undefined) {
					fields.push({ label: "申诉得分", value: item.appealScore.toFixed(2) });
				}
				if (isAppeal) {
					fields.push({ label: "申诉等级", value: item.appealLevel ?? "" });
					fields.push({ label: "岗位分类", value: item.positionCategory ?? "" });
					fields.push({ label: "职级", value: item.jobLevel ?? "" });
				}
				return {
					id: item.id,
					title: item.type,
					date: item.date,
					appealNo: item.appealNo,
					rejectReason: item.rejectReason,
					fields,
				};
			}),
		[flowItems],
	);

	return (
		<>
			<Drawer
				title={
					<span className="text-xl font-semibold leading-7 text-[#323233]">
						2026年度评级-确认
					</span>
				}
				open={open}
				onClose={onClose}
				width={1200}
				loading={isLoading}
				closeIcon={<CloseCircleOutlined className="text-[26px] text-[#323233]" />}
				styles={{
					header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
					footer: { padding: "12px 24px" },
				}}
				footer={
					showFooter ? (
						<div className="flex items-center justify-end gap-[42px]">
							<div className="flex items-center gap-6">
								<span className="text-base leading-6 text-[#F5222D]">
									确认后不可再申诉
								</span>
								<span className="text-base leading-6 text-black">
									确认结果：
									<span className="text-xl font-medium leading-7 text-[#0075FF]">
										得分
										{confirmSummary.score?.toFixed(0)}
										分，等级
										{confirmSummary.level}
									</span>
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Button onClick={onClose}>取消</Button>
								<Button onClick={onAppeal}>发起申诉</Button>
								<Button
									type="primary"
									loading={confirmMutation.isPending}
									onClick={handleConfirm}
								>
									确认
								</Button>
							</div>
						</div>
					) : null
				}
			>
				{/* 评级信息 */}
				<div className="mb-4">
					<SectionTitle title="评级信息" />
					<div className="grid grid-cols-7 gap-6 rounded-[3px] bg-[#F5F7FA] p-3">
						<StackedField label="计划名称" value={data?.ratingInfo.planName ?? ""} />
						<StackedField label="周期" value={data?.ratingInfo.cycle ?? ""} />
						<StackedField
							label="考核类型"
							value={assessTypeLabel(data?.ratingInfo.assessType)}
						/>
						<StackedField
							label="节点类型"
							value={nodeTypeLabel(data?.ratingInfo.nodeType)}
						/>
						<StackedField label="执行人" value={data?.ratingInfo.executor ?? ""} />
						<StackedField label="有效期" value={data?.ratingInfo.validDate ?? ""} />
						<StackedField
							label="状态"
							value={statusLabel(data?.ratingInfo.status)}
							tag={statusLabel(data?.ratingInfo.status)}
							tagTone={finished ? "success" : "pending"}
						/>
					</div>
				</div>

				{/* 基础信息 */}
				<div className="mb-4">
					<SectionTitle title="基础信息" />
					<div className="grid grid-cols-3">
						<InlineField
							label="姓名"
							value={data?.employeeInfo.name ?? ""}
							columnClass={BASIC_COLUMN_PADDING[0]}
						/>
						<InlineField
							label="工号"
							value={data?.employeeInfo.employeeNo ?? ""}
							columnClass={BASIC_COLUMN_PADDING[1]}
						/>
						<InlineField
							label="部门"
							value={data?.employeeInfo.department ?? ""}
							columnClass={BASIC_COLUMN_PADDING[2]}
						/>
						<InlineField
							label="岗位"
							value={data?.employeeInfo.position ?? ""}
							columnClass={BASIC_COLUMN_PADDING[0]}
						/>
						<InlineField
							label="岗位分类"
							value={data?.employeeInfo.positionCategory ?? ""}
							columnClass={BASIC_COLUMN_PADDING[1]}
						/>
						<InlineField
							label="职级"
							value={data?.employeeInfo.jobLevel ?? ""}
							columnClass={BASIC_COLUMN_PADDING[2]}
						/>
					</div>
				</div>

				{/* 考评结果确认 */}
				<div className="mb-4">
					<SectionTitle
						title="考评结果确认"
						extra={
							isManager ? null : (
								<Button onClick={() => setDetailOpen(true)}>考评详情</Button>
							)
						}
					/>
					<div className="flex gap-6">
						{isManager ? (
							<>
								<ScoreCard
									label="KPI得分"
									value={(data?.evalResult.kpiScore ?? 0).toFixed(2)}
									color="#14B968"
								/>
								<ScoreCard
									label="述职/重点工作得分"
									value={(data?.evalResult.reportScore ?? 0).toFixed(2)}
									color="#14B968"
								/>
							</>
						) : (
							<ScoreCard
								label="自评得分"
								value={(data?.evalResult.selfScore ?? 0).toFixed(2)}
								color="#14B968"
							/>
						)}
						<ScoreCard
							label="考评得分"
							value={(data?.evalResult.evalScore ?? 0).toFixed(2)}
							color="#0075FF"
						/>
						<ScoreCard
							label="考评等级"
							value={data?.evalResult.evalLevel ?? ""}
							color="#0075FF"
						/>
					</div>
				</div>

				{/* 确认流程：单节点纯确认不带左侧步骤条，含申诉时展示完整时间线 */}
				<FlowTimeline
					title="确认流程"
					items={flowTimelineItems}
					onAppealNoClick={handleAppealNoClick}
				/>

				{/* 申诉提示：已完成态与存在申诉流程时固定展示 */}
				{finished || hasAppeal ? (
					<div className="flex items-center gap-2 bg-[#FFEFE0] px-4 py-2 text-sm leading-[22px] text-[#323233]">
						<ExclamationCircleFilled className="shrink-0 text-base text-[#FF7D00]" />
						<span>申诉提交后由所选受理人处理，处理期间确认操作暂停</span>
					</div>
				) : null}
			</Drawer>

			{/* 考评详情抽屉 */}
			<AppealDetailDrawer
				todoId={todoId}
				open={detailOpen}
				onClose={() => setDetailOpen(false)}
			/>

			{/* 申诉详情弹窗 */}
			<AppealFilingDetailModal
				todoId={todoId}
				appealNo={appealDetailNo}
				open={appealDetailOpen}
				onClose={() => setAppealDetailOpen(false)}
			/>
		</>
	);
}
