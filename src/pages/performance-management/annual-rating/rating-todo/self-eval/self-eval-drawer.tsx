import type {
	ScoreDimension,
	SelfEvalSubmitPayload,
} from "#src/api/performance-management/self-eval";

import { calcTotalScore } from "#src/api/performance-management/self-eval";
import { RatingTodoStatus } from "#src/api/performance-management/todo/types";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import {
	useSaveSelfEvalDraft,
	useSelfEvalDetail,
	useSubmitSelfEval,
} from "#src/pages/performance-management/annual-rating/rating-todo/self-eval/hooks/use-self-eval";
import { RemarkModal } from "#src/pages/performance-management/annual-rating/rating-todo/self-eval/remark-modal";
import { CloseCircleOutlined, EditOutlined } from "@ant-design/icons";
import { Button, ConfigProvider, Drawer, InputNumber, message, Radio, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { STATUS_COLOR_MAP } from "../config";
import styles from "./self-eval-drawer.module.css";

/**
 * 状态标签底色
 *
 * 与 STATUS_COLOR_MAP 的文字色同步：待完成为浅橙、已完成/已提交为浅绿、被驳回为浅红。
 */
const STATUS_BG_MAP: Record<string, string> = {
	[RatingTodoStatus.PENDING]: "#FFEFE0",
	[RatingTodoStatus.COMPLETED]: "#E3F7ED",
	[RatingTodoStatus.SUBMITTED]: "#E3F7ED",
	[RatingTodoStatus.REJECTED]: "#FEE4E6",
};

/**
 * 评价量表表格行（每档评分细则一行）
 *
 * 表格合并规则：
 * - 序号/维度：按维度合并（rowSpan = 该维度所有指标的档位总数）
 * - 指标/自评分：按指标合并（rowSpan = 该指标的档位数）
 * - 加分项/扣分项：指标列跨 3 列（指标 + 评分细则 + 评分标准）
 */
interface TableRow {
	/** 行标识 */
	key: string;
	/** 序号 */
	seq: number;
	/** 序号列合并行数，0 表示被上方合并 */
	seqRowSpan: number;
	/** 维度名（含权重） */
	dimension: string;
	/** 维度列合并行数 */
	dimensionRowSpan: number;
	/** 指标名（含权重） */
	indicator: string;
	/** 指标列合并行数 */
	indicatorRowSpan: number;
	/** 指标列合并列数，加分/扣分项为 3 */
	indicatorColSpan: number;
	/** 评分细则描述 */
	description: string;
	/** 评分细则列合并列数，加分/扣分项为 0 */
	descriptionColSpan: number;
	/** 评分标准区间 */
	scoreRange: string;
	/** 评分标准列合并列数，加分/扣分项为 0 */
	scoreRangeColSpan: number;
	/** 指标标识（加分/扣分项为空） */
	indicatorId: string;
	/** 满分 */
	fullScore: number;
	/** 自评分列合并行数 */
	scoreRowSpan: number;
	/** 附加项类型 */
	extraType?: "bonus" | "deduct";
}

/**
 * 自评填报抽屉组件属性
 */
interface SelfEvalDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 抽屉是否可见 */
	open: boolean;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 提交成功回调 */
	onSubmitted: () => void;
	/** 是否只读（已完成-查看态） */
	readonly?: boolean;
}

/**
 * 评级信息展示行（标签在上、值在下）
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @param props.tag - 状态标签（仅状态列使用）
 * @param props.tagColor - 状态标签文字颜色
 * @param props.tagBg - 状态标签底色，需与文字色同步
 * @returns 信息行元素
 */
function InfoRow({
	label,
	value,
	tag,
	tagColor = "#FF7D00",
	tagBg = "#FFEFE0",
}: {
	label: string;
	value: string;
	tag?: string;
	tagColor?: string;
	tagBg?: string;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-sm leading-[22px] text-[#606266]">{label}</span>
			{tag ? (
				<span
					className="w-fit rounded-[3px] px-2 text-xs leading-5"
					style={{ color: tagColor, backgroundColor: tagBg }}
				>
					{tag}
				</span>
			) : (
				<span className="text-sm leading-[22px] text-black">{value}</span>
			)}
		</div>
	);
}

/**
 * 基础信息展示行（标签与值同一行）
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 字段值
 * @returns 信息行元素
 */
function InlineInfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center gap-6 py-1.5 text-sm leading-[22px]">
			<span className="w-[92px] shrink-0 text-right text-[#606266]">{label}</span>
			<span className="text-black">{value}</span>
		</div>
	);
}

/**
 * 自评填报抽屉
 *
 * 从右侧滑出，展示评级信息、基础信息、评价量表与加分/扣分项。
 * 支持 4 个场景：
 * - 填报：空表单，逐指标填分
 * - 回显联动：已有分数回显，总分实时联动
 * - 一票否决：勾选后总分归零
 * - 查看：只读，不可编辑
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 抽屉是否可见
 * @param props.onClose - 关闭抽屉回调
 * @param props.onSubmitted - 提交成功回调
 * @param props.readonly - 是否只读
 * @returns 自评填报抽屉组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function SelfEvalDrawer({
	todoId,
	open,
	onClose,
	onSubmitted,
	readonly = false,
}: SelfEvalDrawerProps) {
	const { data, isLoading } = useSelfEvalDetail(todoId, open);
	const submitMutation = useSubmitSelfEval();
	const draftMutation = useSaveSelfEvalDraft();
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();

	const [scores, setScores] = useState<Record<string, number>>({});
	const [bonusScore, setBonusScore] = useState<number | undefined>();
	const [bonusRemark, setBonusRemark] = useState("");
	const [deductScore, setDeductScore] = useState<number | undefined>();
	const [deductRemark, setDeductRemark] = useState("");
	const [vetoed, setVetoed] = useState(false);
	/** 备注弹窗当前编辑的加分类别：加分项 / 扣分项 */
	const [remarkEditor, setRemarkEditor] = useState<"bonus" | "deduct" | null>(null);

	/**
	 * 数据回显：详情加载后初始化表单
	 *
	 * 覆盖「回显评分 & 数据联动」场景——已有分数自动填入输入框。
	 */
	useEffect(() => {
		if (!data) {
			return;
		}
		setScores(data.scores ?? {});
		setBonusScore(data.bonusScore);
		setBonusRemark(data.bonusRemark ?? "");
		setDeductScore(data.deductScore);
		setDeductRemark(data.deductRemark ?? "");
		setVetoed(data.vetoed ?? false);
	}, [data]);

	/**
	 * 自评总分（一票否决时归零）
	 */
	const totalScore = useMemo(
		() => calcTotalScore(scores, bonusScore, deductScore, vetoed),
		[scores, bonusScore, deductScore, vetoed],
	);

	/**
	 * 切换待办时重置编辑态，避免新数据返回前展示上一个待办的分数
	 */
	useEffect(() => {
		setScores({});
		setBonusScore(undefined);
		setBonusRemark("");
		setDeductScore(undefined);
		setDeductRemark("");
		setVetoed(false);
	}, [todoId]);

	/**
	 * 需要评分的普通指标（加分项 / 扣分项不计入）
	 */
	const requiredIndicators = useMemo(
		() =>
			(data?.dimensions ?? [])
				.filter((dim) => dim.id !== "bonus" && dim.id !== "deduct")
				.flatMap((dim) => dim.indicators),
		[data?.dimensions],
	);

	const handleScoreChange = useCallback((indicatorId: string, value: number | null) => {
		setScores((current) => {
			const next = { ...current };
			if (value === null) {
				delete next[indicatorId];
			} else {
				next[indicatorId] = value;
			}
			return next;
		});
	}, []);

	const handleSubmit = useCallback(() => {
		const missing = requiredIndicators.filter((ind) => scores[ind.id] === undefined);
		if (missing.length > 0) {
			message.error("请完成所有指标的自评分");
			return;
		}
		const invalid = requiredIndicators.some((indicator) => {
			const score = scores[indicator.id];
			const min = indicator.fullScore === 5 ? 1 : 0;
			return score < min || score > indicator.fullScore;
		});
		if (invalid) {
			message.error("自评分超出指标允许范围，请检查后重试");
			return;
		}
		if (!vetoed && totalScore > 100) {
			message.error("自评总分不得超过 100 分");
			return;
		}
		const payload: SelfEvalSubmitPayload = {
			todoId,
			scores,
			bonusIndicatorId: data?.bonusIndicatorId,
			bonusScore,
			bonusRemark,
			deductIndicatorId: data?.deductIndicatorId,
			deductScore,
			deductRemark,
			vetoed,
		};
		submitMutation.mutate(payload, {
			onSuccess: () => {
				message.success("自评提交成功");
				onSubmitted();
				onClose();
			},
		});
	}, [
		todoId,
		scores,
		bonusScore,
		bonusRemark,
		deductScore,
		deductRemark,
		vetoed,
		submitMutation,
		onSubmitted,
		onClose,
		requiredIndicators,
		totalScore,
	]);

	const handleDraft = useCallback(() => {
		const payload: SelfEvalSubmitPayload = {
			todoId,
			scores,
			bonusIndicatorId: data?.bonusIndicatorId,
			bonusScore,
			bonusRemark,
			deductIndicatorId: data?.deductIndicatorId,
			deductScore,
			deductRemark,
			vetoed,
		};
		draftMutation.mutate(payload, {
			onSuccess: () => message.success("已暂存"),
		});
	}, [todoId, scores, bonusScore, bonusRemark, deductScore, deductRemark, vetoed, draftMutation]);

	/**
	 * 评价量表列配置
	 *
	 * 6 列固定宽度合计 1152px，与 1200px 抽屉扣除左右 24px padding 后的内容宽度一致：
	 * 序号 52 | 维度 127 | 指标 127 | 评分细则 562 | 评分标准 80 | 自评分 204
	 */
	const columns = useMemo(
		() => [
			{
				title: "序号",
				dataIndex: "seq",
				key: "seq",
				width: 52,
				align: "center" as const,
				onCell: (record: TableRow) => ({ rowSpan: record.seqRowSpan }),
				render: (value: number) => value,
			},
			{
				title: "维度",
				dataIndex: "dimension",
				key: "dimension",
				width: 127,
				onCell: (record: TableRow) => ({ rowSpan: record.dimensionRowSpan }),
			},
			{
				title: "指标",
				dataIndex: "indicator",
				key: "indicator",
				width: 127,
				onCell: (record: TableRow) => ({
					rowSpan: record.indicatorRowSpan,
					colSpan: record.indicatorColSpan,
				}),
				// 加分项/扣分项说明以换行符分隔「1.…」「2.…」，保留设计稿的断行
				render: (value: string) => <span className="whitespace-pre-line">{value}</span>,
			},
			{
				title: "评分细则",
				dataIndex: "description",
				key: "description",
				width: 562,
				onCell: (record: TableRow) => ({ colSpan: record.descriptionColSpan }),
				render: (value: string) => (
					<span className="whitespace-pre-line text-[#606266]">{value}</span>
				),
			},
			{
				title: "评分标准",
				dataIndex: "scoreRange",
				key: "scoreRange",
				width: 80,
				align: "center" as const,
				onCell: (record: TableRow) => ({ colSpan: record.scoreRangeColSpan }),
				render: (value: string) => <span className="text-[#606266]">{value}</span>,
			},
			{
				title: readonly ? (
					"自评得分"
				) : (
					<span>
						<span className="text-[#F5222D]">*</span>
						自评得分
					</span>
				),
				dataIndex: "score",
				key: "score",
				width: 204,
				// 只读态数值右对齐；编辑态保持左对齐
				align: readonly ? ("right" as const) : ("left" as const),
				onCell: (record: TableRow) => ({ rowSpan: record.scoreRowSpan }),
				render: (_: unknown, record: TableRow) => {
					// 加分项：只读态为「标签 + 数值」行，编辑态为步进器 + 备注事项
					if (record.extraType === "bonus") {
						if (readonly) {
							return (
								<div className="flex flex-col gap-3 py-1">
									<div className="flex items-center justify-between">
										<span className="text-sm leading-[22px] text-[#606266]">
											自评得分
										</span>
										<span className="text-xl font-medium leading-[30px] text-black">
											{bonusScore === undefined ? "-" : bonusScore.toFixed(2)}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-sm leading-[22px] text-[#606266]">
											备注事项
										</span>
										<span className="line-clamp-2 break-all text-sm leading-[22px] text-black">
											{bonusRemark || "-"}
										</span>
									</div>
								</div>
							);
						}
						return (
							<div className="flex flex-col gap-3 py-1">
								<InputNumber
									min={0}
									max={5}
									placeholder="请输入1-5"
									value={bonusScore}
									onChange={(value) => setBonusScore(value ?? undefined)}
									style={{ width: 180 }}
								/>
								<div className="flex flex-col gap-1">
									<span className="text-sm leading-[22px] text-[#323233]">
										备注事项
									</span>
									{/* 只读输入框样式，点击打开备注弹窗填写 */}
									<button
										type="button"
										className="flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-[#E4E7ED] bg-white px-3 text-left"
										onClick={() => setRemarkEditor("bonus")}
									>
										<span
											className={`truncate text-sm leading-[22px] ${
												bonusRemark ? "text-[#323233]" : "text-[#C0C4CC]"
											}`}
										>
											{bonusRemark || "附关键事项"}
										</span>
										<EditOutlined className="shrink-0 text-[#909399]" />
									</button>
								</div>
							</div>
						);
					}
					// 扣分项：只读态为「标签 + 数值」行，编辑态为步进器 + 一票否决 + 备注事项
					if (record.extraType === "deduct") {
						if (readonly) {
							return (
								<div className="flex flex-col gap-3 py-1">
									<div className="flex items-center justify-between">
										<span className="text-sm leading-[22px] text-[#606266]">
											自评得分
										</span>
										<span className="text-xl font-medium leading-[30px] text-black">
											{deductScore === undefined
												? "-"
												: `-${deductScore.toFixed(2)}`}
										</span>
									</div>
									<div className="flex flex-col gap-1">
										<span className="text-sm leading-[22px] text-[#606266]">
											备注事项
										</span>
										<span className="line-clamp-2 break-all text-sm leading-[22px] text-black">
											{deductRemark || "-"}
										</span>
									</div>
								</div>
							);
						}
						return (
							<div className="flex flex-col gap-3 py-1">
								<InputNumber
									min={0}
									max={5}
									placeholder="请输入"
									value={deductScore}
									formatter={(value) =>
										value ? `-${Number(value).toFixed(2)}` : ""
									}
									parser={(value) => Number(String(value ?? "").replace("-", ""))}
									onChange={(value) => setDeductScore(value ?? undefined)}
									style={{ width: 180 }}
								/>
								<Radio
									checked={vetoed}
									onChange={(e) => setVetoed(e.target.checked)}
									onClick={() => {
										// Radio 在已选中时不再触发 onChange，这里补一次点击切换以便取消否决
										if (vetoed) {
											setVetoed(false);
										}
									}}
								>
									一票否决
								</Radio>
								<div className="flex flex-col gap-1">
									<span className="text-sm leading-[22px] text-[#323233]">
										备注事项
									</span>
									{/* 只读输入框样式，点击打开备注弹窗填写 */}
									<button
										type="button"
										className="flex h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-[#E4E7ED] bg-white px-3 text-left"
										onClick={() => setRemarkEditor("deduct")}
									>
										<span
											className={`truncate text-sm leading-[22px] ${
												deductRemark ? "text-[#323233]" : "text-[#C0C4CC]"
											}`}
										>
											{deductRemark || "附关键事项"}
										</span>
										<EditOutlined className="shrink-0 text-[#909399]" />
									</button>
								</div>
							</div>
						);
					}
					// 普通指标：只读态纯文本（两位小数），编辑态为步进器
					const scoreValue = scores[record.indicatorId];
					if (readonly) {
						return (
							<span className="text-xl font-medium leading-[30px] text-black">
								{scoreValue === undefined ? "-" : scoreValue.toFixed(2)}
							</span>
						);
					}
					const isFivePoint = record.fullScore === 5;
					return (
						<InputNumber
							min={isFivePoint ? 1 : 0}
							max={record.fullScore}
							placeholder={isFivePoint ? "请输入1-5" : `请输入0-${record.fullScore}`}
							value={scoreValue}
							onChange={(value) => handleScoreChange(record.indicatorId, value)}
							style={{ width: 180 }}
						/>
					);
				},
			},
		],
		[
			scores,
			handleScoreChange,
			readonly,
			bonusScore,
			bonusRemark,
			deductScore,
			deductRemark,
			vetoed,
		],
	);

	/**
	 * 将维度数据展平为表格行（每档评分细则一行）
	 *
	 * 合并规则：序号/维度按维度合并，指标/自评分按指标合并；
	 * 加分项、扣分项作为表格最后两行，指标列跨 3 列。
	 */
	const tableData = useMemo(() => {
		const rows: TableRow[] = [];
		let seq = 0;
		data?.dimensions.forEach((dim: ScoreDimension) => {
			const isExtra = dim.id === "bonus" || dim.id === "deduct";
			seq += 1;

			if (isExtra) {
				rows.push({
					key: dim.id,
					seq,
					seqRowSpan: 1,
					dimension: dim.name,
					dimensionRowSpan: 1,
					indicator: dim.indicators[0]?.levels[0]?.description ?? "",
					indicatorRowSpan: 1,
					indicatorColSpan: 3,
					description: "",
					descriptionColSpan: 0,
					scoreRange: "",
					scoreRangeColSpan: 0,
					indicatorId: "",
					fullScore: dim.indicators[0]?.fullScore ?? 5,
					scoreRowSpan: 1,
					extraType: dim.id as "bonus" | "deduct",
				});
				return;
			}

			// 维度列合并行数 = 该维度所有指标的档位总数
			const dimensionRowSpan = dim.indicators.reduce(
				(sum, ind) => sum + ind.levels.length,
				0,
			);
			let isFirstRowOfDimension = true;

			dim.indicators.forEach((ind) => {
				ind.levels.forEach((level, levelIndex) => {
					const isFirstRowOfIndicator = levelIndex === 0;
					rows.push({
						key: `${ind.id}-${levelIndex}`,
						seq,
						seqRowSpan: isFirstRowOfDimension ? dimensionRowSpan : 0,
						dimension: `${dim.name}(${dim.weight})`,
						dimensionRowSpan: isFirstRowOfDimension ? dimensionRowSpan : 0,
						indicator: ind.name,
						indicatorRowSpan: isFirstRowOfIndicator ? ind.levels.length : 0,
						indicatorColSpan: 1,
						description: level.description,
						descriptionColSpan: 1,
						scoreRange:
							level.min === level.max
								? String(level.min)
								: `${level.min}-${level.max}`,
						scoreRangeColSpan: 1,
						indicatorId: ind.id,
						fullScore: ind.fullScore,
						scoreRowSpan: isFirstRowOfIndicator ? ind.levels.length : 0,
					});
					isFirstRowOfDimension = false;
				});
			});
		});
		return rows;
	}, [data?.dimensions]);

	/**
	 * 已评分项数：以「是否填写」（非 undefined）判定，0 分也算已评分
	 */
	const scoredCount = useMemo(
		() => requiredIndicators.filter((ind) => scores[ind.id] !== undefined).length,
		[requiredIndicators, scores],
	);

	return (
		<ConfigProvider theme={{ token: { colorPrimary: "#0075FF" } }}>
			<Drawer
				title={
					<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
						{data ? `${data.ratingInfo.planName}-自评` : "2026年度评级-自评"}
					</span>
				}
				open={open}
				onClose={onClose}
				width={1200}
				loading={isLoading}
				closeIcon={<CloseCircleOutlined className="text-[26px] text-[#909399]" />}
				styles={{
					header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
					footer: { padding: "12px 24px" },
				}}
				footer={
					<div
						className={
							readonly
								? "flex items-center justify-end"
								: "flex items-center justify-end gap-[42px]"
						}
					>
						<div className="flex items-center gap-6">
							{vetoed ? (
								<span className="text-base leading-6 text-[#F5222D]">
									一票否决·按0分计
								</span>
							) : null}
							<span className="text-base leading-6 text-black">
								自评得分：
								<span className="text-xl font-medium leading-7 text-[#0075FF]">
									{totalScore.toFixed(2)}/100
								</span>
							</span>
						</div>
						{readonly ? null : (
							<div className="flex gap-2">
								<Button onClick={onClose}>取消</Button>
								<Button loading={draftMutation.isPending} onClick={handleDraft}>
									暂存
								</Button>
								<Button
									type="primary"
									loading={submitMutation.isPending}
									onClick={handleSubmit}
								>
									提交
								</Button>
							</div>
						)}
					</div>
				}
			>
				{/* 评级信息 */}
				<div className="mb-4">
					<SectionTitle title="评级信息" />
					<div className="grid grid-cols-7 gap-6 rounded-[3px] bg-[#F5F7FA] p-3">
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
						<InfoRow
							label="状态"
							value={statusLabel(data?.ratingInfo.status)}
							tag={statusLabel(data?.ratingInfo.status)}
							tagColor={STATUS_COLOR_MAP[data?.ratingInfo.status ?? ""] ?? "#FF7D00"}
							tagBg={STATUS_BG_MAP[data?.ratingInfo.status ?? ""] ?? "#FFEFE0"}
						/>
					</div>
				</div>

				{/* 基础信息：3 列 × 2 行，标签与值同行，无灰底 */}
				<div className="mb-4">
					<SectionTitle title="基础信息" />
					<div className="grid grid-cols-3 gap-x-6 px-6 py-3">
						<InlineInfoRow label="姓名" value={data?.employeeInfo.name ?? ""} />
						<InlineInfoRow label="工号" value={data?.employeeInfo.employeeNo ?? ""} />
						<InlineInfoRow label="部门" value={data?.employeeInfo.department ?? ""} />
						<InlineInfoRow label="岗位" value={data?.employeeInfo.position ?? ""} />
						<InlineInfoRow
							label="岗位分类"
							value={data?.employeeInfo.positionCategory ?? ""}
						/>
						<InlineInfoRow label="职级" value={data?.employeeInfo.jobLevel ?? ""} />
					</div>
				</div>

				{/* 评价量表 */}
				<div className="mb-4">
					<SectionTitle
						title="评价量表"
						extra={
							<span className="text-base leading-6 text-[#323233]">
								已评分
								{scoredCount}/{requiredIndicators.length}项
							</span>
						}
					/>
					{/*
					 * size=small 时 AntD 使用 cellPadding*SM 令牌，这里覆盖为上下 7px、左右 12px；
					 * borderColor 统一单元格四边与表格外框为 #E4E7ED。
					 */}
					<ConfigProvider
						theme={{
							components: {
								Table: {
									headerBg: "#f0f2f5",
									headerColor: "#323233",
									borderColor: "#E4E7ED",
									cellPaddingBlockSM: 7,
									cellPaddingInlineSM: 12,
								},
							},
						}}
					>
						<Table
							className={styles.evalTable}
							columns={columns}
							dataSource={tableData}
							pagination={false}
							rowKey="key"
							bordered
							/* 使用固定表格布局，确保上述 6 列宽度生效 */
							tableLayout="fixed"
							size="small"
						/>
					</ConfigProvider>
				</div>

				{/* 等级分布说明：无底色，仅 C/D 区间标红 */}
				<div className="text-base leading-6 text-[#909399]">
					根据部门/单位范围或岗位特性，综合核定各层级员工考评等级的比例分布。（原则上A不超过10%，A和B+合计不超过30%，C和D合计不低于10%）。得分范围仅供参考：
					<span>A（90-100分）、B+（85-90分）、B（70-85分）、</span>
					<span className="text-[#F5222D]">C（60-70分）、D（60分以下）</span>
				</div>
			</Drawer>
			<RemarkModal
				open={remarkEditor !== null}
				value={remarkEditor === "deduct" ? deductRemark : bonusRemark}
				onClose={() => setRemarkEditor(null)}
				onConfirm={(value) => {
					if (remarkEditor === "deduct") {
						setDeductRemark(value);
					} else {
						setBonusRemark(value);
					}
					setRemarkEditor(null);
				}}
			/>
		</ConfigProvider>
	);
}
