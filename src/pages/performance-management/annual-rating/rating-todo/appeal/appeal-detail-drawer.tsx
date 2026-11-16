import type { AppealDetailDimension } from "#src/api/performance-management/appeal";
import type { CSSProperties } from "react";

import { useAppealDetail } from "#src/pages/performance-management/annual-rating/rating-todo/appeal/hooks/use-appeal";
import { CloseCircleOutlined } from "@ant-design/icons";
import { ConfigProvider, Drawer, Table } from "antd";
import { useMemo } from "react";

// 表头单元格样式：14px/22 中粗 #323233，上下内边距 7px（行高 36px）
const HEADER_CELL_STYLE: CSSProperties = {
	padding: "7px 12px",
	color: "#323233",
	fontWeight: 500,
};

// 表体单元格样式：上下内边距 12px，配合 22px 行高得到 46px 行高
const BODY_CELL_STYLE: CSSProperties = { padding: "12px 12px" };

/**
 * 考评详情表格行（每档评分细则一行）
 *
 * 表格合并规则：
 * - 序号/维度：按维度合并（rowSpan = 该维度所有指标的档位总数）
 * - 指标/得分：按指标合并（rowSpan = 该指标的档位数）
 * - 加分项/扣分项：指标列跨 3 列（指标 + 评分细则 + 评分标准），得分列展示备注
 */
interface DetailRow {
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
	/** 指标名 */
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
	/** 自评得分 */
	selfScore: number;
	/** 考评得分 */
	evalScore: number;
	/** 自评备注事项 */
	selfRemark?: string;
	/** 考评备注事项 */
	evalRemark?: string;
	/** 得分列合并行数 */
	scoreRowSpan: number;
	/** 附加项类型 */
	extraType?: "bonus" | "deduct";
}

/**
 * 考评详情抽屉组件属性
 */
interface AppealDetailDrawerProps {
	/** 待办标识 */
	todoId: string;
	/** 抽屉是否可见 */
	open: boolean;
	/** 关闭抽屉回调 */
	onClose: () => void;
}

/**
 * 顶部得分卡片
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
 * 考评详情抽屉
 *
 * 从右侧滑出，展示自评得分/考评得分/考评等级三卡片
 * 与评价量表（每档评分细则一行，自评与考评分数并列展示），底部提供量表口径说明。
 *
 * @param props - 组件属性
 * @param props.todoId - 待办标识
 * @param props.open - 抽屉是否可见
 * @param props.onClose - 关闭抽屉回调
 * @returns 考评详情抽屉组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export function AppealDetailDrawer({ todoId, open, onClose }: AppealDetailDrawerProps) {
	const { data, isLoading } = useAppealDetail(todoId, open);

	/**
	 * 评价量表列配置
	 *
	 * 6 列固定宽度合计 1152px，与 1200px 抽屉扣除左右 24px padding 后的内容宽度一致：
	 * 序号 52 | 维度 127 | 指标 127 | 评分细则 562 | 评分标准 80 | 得分 204
	 */
	const columns = useMemo(
		() => [
			{
				title: "序号",
				dataIndex: "seq",
				key: "seq",
				width: 52,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					rowSpan: record.seqRowSpan,
					style: BODY_CELL_STYLE,
				}),
				render: (value: number) => (
					<span className="text-sm leading-[22px] text-[#606266]">{value}</span>
				),
			},
			{
				title: "维度",
				dataIndex: "dimension",
				key: "dimension",
				width: 127,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					rowSpan: record.dimensionRowSpan,
					style: BODY_CELL_STYLE,
				}),
				render: (value: string) => (
					<span className="text-sm leading-[22px] text-[#606266]">{value}</span>
				),
			},
			{
				title: "指标",
				dataIndex: "indicator",
				key: "indicator",
				width: 127,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					rowSpan: record.indicatorRowSpan,
					colSpan: record.indicatorColSpan,
					style: BODY_CELL_STYLE,
				}),
				render: (value: string) => (
					<span className="whitespace-pre-line text-sm leading-[22px] text-[#606266]">
						{value}
					</span>
				),
			},
			{
				title: "评分细则",
				dataIndex: "description",
				key: "description",
				width: 562,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					colSpan: record.descriptionColSpan,
					style: BODY_CELL_STYLE,
				}),
				render: (value: string) => (
					<span className="whitespace-pre-line text-sm leading-[22px] text-[#606266]">
						{value}
					</span>
				),
			},
			{
				title: "评分标准",
				dataIndex: "scoreRange",
				key: "scoreRange",
				width: 80,
				align: "right" as const,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					colSpan: record.scoreRangeColSpan,
					style: BODY_CELL_STYLE,
				}),
				render: (value: string) => (
					<span className="text-sm leading-[22px] text-[#606266]">{value}</span>
				),
			},
			{
				title: "得分",
				dataIndex: "score",
				key: "score",
				width: 204,
				align: "right" as const,
				onHeaderCell: () => ({ style: HEADER_CELL_STYLE }),
				onCell: (record: DetailRow) => ({
					rowSpan: record.scoreRowSpan,
					// 得分列单元格边框按设计稿使用更浅的 #EBEEF5
					style: { ...BODY_CELL_STYLE, borderColor: "#EBEEF5" },
				}),
				render: (_: unknown, record: DetailRow) => (
					<div className="flex w-full flex-col">
						<div className="flex items-center justify-between">
							<span className="text-base leading-6 text-[#00B42A]">自评得分：</span>
							<span className="text-xl leading-7 text-[#14B968]">
								{record.selfScore.toFixed(2)}
							</span>
						</div>
						<div
							className={`flex items-center justify-between ${record.extraType ? "mt-3" : "mt-8"}`}
						>
							<span className="text-base leading-6 text-[#4285F4]">考评得分：</span>
							<span className="text-xl leading-7 text-[#0075FF]">
								{record.evalScore.toFixed(2)}
							</span>
						</div>
						{record.extraType ? (
							<>
								{record.selfRemark ? (
									<div className="mt-3 text-sm leading-[22px]">
										<span className="text-[#606266]">自评备注事项</span>
										<br />
										<span className="text-black">{record.selfRemark}</span>
									</div>
								) : null}
								{record.evalRemark ? (
									<div className="mt-3 text-sm leading-[22px]">
										<span className="text-[#606266]">考评备注事项</span>
										<br />
										<span className="text-black">{record.evalRemark}</span>
									</div>
								) : null}
							</>
						) : null}
					</div>
				),
			},
		],
		[],
	);

	/**
	 * 将维度数据展平为表格行（每档评分细则一行）
	 *
	 * 合并规则：序号/维度按维度合并，指标/得分按指标合并；
	 * 加分项、扣分项作为表格最后两行，指标列跨 3 列。
	 */
	const tableData = useMemo(() => {
		const rows: DetailRow[] = [];
		let seq = 0;
		data?.dimensions.forEach((dim: AppealDetailDimension) => {
			const isExtra = dim.id === "bonus" || dim.id === "deduct";
			seq += 1;

			if (isExtra) {
				const indicator = dim.indicators[0];
				rows.push({
					key: dim.id,
					seq,
					seqRowSpan: 1,
					dimension: dim.name,
					dimensionRowSpan: 1,
					indicator: indicator?.levels[0]?.description ?? "",
					indicatorRowSpan: 1,
					indicatorColSpan: 3,
					description: "",
					descriptionColSpan: 0,
					scoreRange: "",
					scoreRangeColSpan: 0,
					selfScore: indicator?.selfScore ?? 0,
					evalScore: indicator?.evalScore ?? 0,
					selfRemark: indicator?.selfRemark,
					evalRemark: indicator?.evalRemark,
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
						selfScore: ind.selfScore,
						evalScore: ind.evalScore,
						scoreRowSpan: isFirstRowOfIndicator ? ind.levels.length : 0,
					});
					isFirstRowOfDimension = false;
				});
			});
		});
		return rows;
	}, [data?.dimensions]);

	return (
		<Drawer
			title={
				<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
					考评详情
				</span>
			}
			open={open}
			onClose={onClose}
			width={1200}
			loading={isLoading}
			closeIcon={<CloseCircleOutlined className="text-[26px] text-[#909399]" />}
			styles={{
				header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
			}}
		>
			{/* 顶部得分卡片 */}
			<div className="mb-4 flex gap-6">
				<ScoreCard
					label="自评得分"
					value={(data?.selfScore ?? 0).toFixed(2)}
					color="#14B968"
				/>
				<ScoreCard
					label="考评得分"
					value={(data?.evalScore ?? 0).toFixed(2)}
					color="#0075FF"
				/>
				<ScoreCard label="考评等级" value={data?.evalLevel ?? ""} color="#0075FF" />
			</div>

			{/* 评价量表 */}
			<div className="mb-4">
				{/* 表格边框统一使用 #E4E7ED（得分列在单元格上单独覆盖为 #EBEEF5） */}
				<ConfigProvider theme={{ components: { Table: { borderColor: "#E4E7ED" } } }}>
					<Table
						columns={columns}
						dataSource={tableData}
						pagination={false}
						rowKey="key"
						bordered
						size="small"
					/>
				</ConfigProvider>
			</div>

			{/* 量表口径说明 */}
			<div className="text-base leading-6 text-[#909399]">
				量表口径：《附件3：2026
				年度服务集团员工考评确认表》；评价得分由上级按同一量表核定。如对结果有异议，可在确认页点击「申诉」。
			</div>
		</Drawer>
	);
}
