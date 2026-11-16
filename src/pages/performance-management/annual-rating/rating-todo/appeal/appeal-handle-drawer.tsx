import type {
	FlowField,
	FlowTimelineItem,
} from "#src/pages/performance-management/annual-rating/rating-todo/components/flow-timeline";

import { AppealFlowType } from "#src/api/performance-management/appeal";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { AppealDetailDrawer } from "#src/pages/performance-management/annual-rating/rating-todo/appeal/appeal-detail-drawer";
import { useAppealHandleDetail } from "#src/pages/performance-management/annual-rating/rating-todo/appeal/hooks/use-appeal";
import { FlowTimeline } from "#src/pages/performance-management/annual-rating/rating-todo/components/flow-timeline";
import { AppealFilingDetailModal } from "#src/pages/performance-management/annual-rating/rating-todo/confirm/appeal-filing-detail-modal";
import { CloseCircleOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Drawer, message } from "antd";
import { useCallback, useMemo, useState } from "react";

/**
 * 申诉处理抽屉组件属性
 */
interface AppealHandleDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 抽屉是否可见 */
	open: boolean;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 是否只读（申诉节点的「查看」态） */
	readonly?: boolean;
}

/**
 * 信息展示行
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @returns 信息行元素
 */
function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-sm leading-[22px] text-[#606266]">{label}</span>
			<span className="text-sm leading-[22px] text-black">{value}</span>
		</div>
	);
}

/**
 * 信息展示行（标签与值同行）
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @returns 信息行元素
 */
function InfoLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-6 py-1.5">
			<span className="w-[92px] shrink-0 text-right text-sm leading-[22px] text-[#606266]">
				{label}
			</span>
			<span className="text-sm leading-[22px] text-black">{value}</span>
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
			<div className="text-xl leading-7" style={{ color }}>
				{value}
			</div>
		</div>
	);
}

/**
 * 申诉处理抽屉
 *
 * 从右侧滑出，展示评级信息、基础信息、考评结果确认（含考评详情入口）
 * 与申诉流程时间线。点击申诉编号跳 OA 提示功能开发中，
 * 点击考评详情打开考评详情抽屉，点击「去处理」打开该笔申诉的申诉界面（只读）。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 抽屉是否可见
 * @param props.onClose - 关闭抽屉回调
 * @param props.readonly - 是否只读
 * @returns 申诉处理抽屉组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function AppealHandleDrawer({
	todoId,
	open,
	onClose,
	readonly = false,
}: AppealHandleDrawerProps) {
	const { data, isLoading } = useAppealHandleDetail(todoId, open);
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();
	const [detailOpen, setDetailOpen] = useState(false);
	const [filingOpen, setFilingOpen] = useState(false);
	const [filingAppealNo, setFilingAppealNo] = useState("");

	/**
	 * 点击申诉编号：跳转 OA，提示功能开发中
	 */
	const handleAppealNoClick = useCallback((appealNo: string) => {
		// TODO(OA 对接): 跳转 OA 查看申诉详情
		message.info(`跳转 OA 查看申诉详情：${appealNo}（功能开发中）`);
	}, []);

	/**
	 * 打开考评详情抽屉
	 */
	const handleOpenDetail = useCallback(() => {
		setDetailOpen(true);
	}, []);

	const flowItems = useMemo(() => data?.flowItems ?? [], [data?.flowItems]);

	/**
	 * 打开申诉界面（只读）
	 *
	 * 申诉流程中的「去处理」需要先核对申诉内容，因此复用确认流程的申诉界面，
	 * 展示申诉得分、申诉等级、申诉类型、申诉原因与佐证材料；
	 * 处理结论仍在 OA 流程中完成，平台侧不提供编辑入口。
	 *
	 * @param appealNo - 目标申诉编号，未指定时回退到流程中首个带编号的申诉节点
	 */
	const handleOpenAppealInterface = useCallback(
		(appealNo?: string) => {
			const targetAppealNo =
				appealNo ?? flowItems.find((item) => Boolean(item.appealNo))?.appealNo;
			if (!targetAppealNo) {
				message.info("该申诉尚未生成流程编号");
				return;
			}
			setFilingAppealNo(targetAppealNo);
			setFilingOpen(true);
		},
		[flowItems],
	);

	/**
	 * 把申诉接口数据归一成时间线展示模型
	 *
	 * 待处理的申诉节点由受理人执行，展示「执行人」；已提交的申诉与拒绝节点
	 * 展示「提交人」；通过节点展示「执行人」。
	 */
	const flowTimelineItems = useMemo<FlowTimelineItem[]>(
		() =>
			flowItems.map((item) => {
				const isAppeal = item.type === AppealFlowType.APPEAL;
				const isSubmitterField =
					(isAppeal && !item.actionable) || item.type === AppealFlowType.REJECT;
				const fields: FlowField[] = [
					{ label: "申诉类型", value: item.appealType },
					{
						label: isSubmitterField ? "提交人" : "执行人",
						value: isSubmitterField
							? (item.submitter ?? item.executor ?? "")
							: (item.executor ?? item.submitter ?? ""),
					},
				];
				if (item.appealScore !== undefined) {
					fields.push({ label: "申诉得分", value: item.appealScore.toFixed(2) });
				}
				if (isAppeal) {
					fields.push({ label: "申诉等级", value: item.appealLevel ?? "" });
					fields.push({ label: "岗位分类", value: item.positionCategory });
					fields.push({ label: "职级", value: item.jobLevel });
				}
				return {
					id: item.id,
					title: item.type,
					date: item.date,
					appealNo: item.appealNo,
					actionLabel: item.actionable ? "去处理" : undefined,
					onAction: item.actionable
						? () => handleOpenAppealInterface(item.appealNo)
						: undefined,
					fields,
				};
			}),
		[flowItems, handleOpenAppealInterface],
	);

	return (
		<>
			<Drawer
				title={
					<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
						2026年度评级-申诉
					</span>
				}
				open={open}
				onClose={onClose}
				width={1200}
				loading={isLoading}
				closeIcon={<CloseCircleOutlined className="text-[26px] text-[#909399]" />}
				styles={{
					header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
					body: { display: "flex", flexDirection: "column" },
				}}
				footer={
					readonly ? (
						<div className="flex justify-end">
							<Button onClick={onClose}>关闭</Button>
						</div>
					) : (
						<div className="flex justify-end gap-3">
							<Button onClick={onClose}>取消</Button>
							<Button type="primary" onClick={() => handleOpenAppealInterface()}>
								去处理
							</Button>
						</div>
					)
				}
			>
				{/* 评级信息 */}
				<div className="mb-4">
					<SectionTitle title="评级信息" />
					<div className="grid grid-cols-7 gap-6 rounded bg-[#F5F7FA] p-3">
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
						<InfoRow label="执行人" value={data?.ratingInfo.executor ?? ""} />
						<InfoRow label="有效期" value={data?.ratingInfo.validDate ?? ""} />
						<div className="flex flex-col gap-1">
							<span className="text-sm leading-[22px] text-[#606266]">状态</span>
							<span className="w-fit rounded-[3px] bg-[#FFEFE0] px-1.5 py-0.5 text-xs text-[#FF7D00]">
								{statusLabel(data?.ratingInfo.status)}
							</span>
						</div>
					</div>
				</div>

				{/* 基础信息：两行三列，标签 92px 右对齐，列间留 24px */}
				<div className="mb-4">
					<SectionTitle title="基础信息" />
					<div className="grid grid-cols-3">
						<div className="flex flex-col pr-6">
							<InfoLine label="姓名" value={data?.employeeInfo.name ?? ""} />
							<InfoLine label="岗位" value={data?.employeeInfo.position ?? ""} />
						</div>
						<div className="flex flex-col px-6">
							<InfoLine label="工号" value={data?.employeeInfo.employeeNo ?? ""} />
							<InfoLine
								label="岗位分类"
								value={data?.employeeInfo.positionCategory ?? ""}
							/>
						</div>
						<div className="flex flex-col pl-6">
							<InfoLine label="部门" value={data?.employeeInfo.department ?? ""} />
							<InfoLine label="职级" value={data?.employeeInfo.jobLevel ?? ""} />
						</div>
					</div>
				</div>

				{/* 考评结果确认 */}
				<div className="mb-4">
					<SectionTitle
						title="考评结果确认"
						extra={<Button onClick={handleOpenDetail}>考评详情</Button>}
					/>
					<div className="flex gap-6">
						<ScoreCard
							label="自评得分"
							value={(data?.evalResult.selfScore ?? 0).toFixed(2)}
							color="#14B968"
						/>
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

				{/* 申诉流程：左侧步骤条 + 节点卡片 */}
				<FlowTimeline
					title="申诉流程"
					items={flowTimelineItems}
					onAppealNoClick={handleAppealNoClick}
				/>

				{/* 底部提示：吸底警告条，背景与图标按设计稿警告色规范 */}
				<div className="mt-auto flex items-center gap-2 bg-[#FFEFE0] px-4 py-2">
					<ExclamationCircleFilled className="text-base text-[#FF7D00]" />
					<span className="text-sm leading-[22px] text-[#323233]">
						申诉提交后由所选受理人处理，处理期间确认操作暂停；处理结论为最终结果。
					</span>
				</div>
			</Drawer>

			{/* 考评详情抽屉 */}
			<AppealDetailDrawer
				todoId={todoId}
				open={detailOpen}
				onClose={() => setDetailOpen(false)}
			/>

			{/* 申诉界面（只读）：核对申诉得分、等级、原因与佐证材料 */}
			<AppealFilingDetailModal
				todoId={todoId}
				appealNo={filingAppealNo}
				open={filingOpen}
				onClose={() => setFilingOpen(false)}
			/>
		</>
	);
}
