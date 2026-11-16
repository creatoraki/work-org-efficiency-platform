import type {
	RatingPlanItem,
	RatingPlanQuery,
	RatingPlanStatistics,
} from "#src/api/performance-management/plan";
import type { ActionType } from "@ant-design/pro-components";
import type { PlanAction } from "./types";

import { fetchPlanList, fetchPlanStatistics } from "#src/api/performance-management/plan";
import { BasicContent, BasicTable } from "#src/components";
import { ConfigProvider } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlanFilterBar } from "./components/plan-filter-bar";
import { PlanStatCards } from "./components/plan-stat-cards";
import { getPlanColumns } from "./config/columns";
import { PermissionDrawer } from "./permission/permission-drawer";
import { PlanViewDrawer } from "./plan-view/plan-view-drawer";
import { PlanActionType } from "./types";

/**
 * 表格横向滚动内容宽度
 */
const TABLE_SCROLL_X = 1696;

/**
 * 评级计划页面
 *
 * 展示年度评级计划的统计概览、筛选条件与计划列表，
 * 行操作提供「查看」（人员清单 / 分析报表）与「权限编辑」两个入口。
 *
 * @returns 评级计划页面组件
 *
 * @author 王善能
 * @since 2026-11-12
 */
export default function RatingPlanPage() {
	const actionRef = useRef<ActionType>();
	const queryInitializedRef = useRef(false);
	const [query, setQuery] = useState<RatingPlanQuery>({});
	const [searchedQuery, setSearchedQuery] = useState<RatingPlanQuery>({});
	const [statistics, setStatistics] = useState<RatingPlanStatistics>({
		totalCount: 0,
		inProgressCount: 0,
		archivedCount: 0,
		archivedTodayCount: 0,
	});
	const [viewOpen, setViewOpen] = useState(false);
	const [permissionOpen, setPermissionOpen] = useState(false);
	const [activePlan, setActivePlan] = useState<RatingPlanItem>();

	useEffect(() => {
		fetchPlanStatistics().then(setStatistics);
	}, []);

	useEffect(() => {
		if (!queryInitializedRef.current) {
			queryInitializedRef.current = true;
			return;
		}
		actionRef.current?.setPageInfo?.({ current: 1 });
		actionRef.current?.reload();
	}, [searchedQuery]);

	const handleSearch = useCallback(() => {
		setSearchedQuery(query);
	}, [query]);

	const handleReset = useCallback(() => {
		setQuery({});
		setSearchedQuery({});
	}, []);

	const handleAction = useCallback((record: RatingPlanItem, action: PlanAction) => {
		setActivePlan(record);
		if (action.type === PlanActionType.VIEW) {
			setViewOpen(true);
			return;
		}
		setPermissionOpen(true);
	}, []);

	const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

	const columns = useMemo(
		() =>
			getPlanColumns(handleAction, {
				hiddenKeys: hiddenColumns,
				onChange: setHiddenColumns,
			}).filter((column) => !hiddenColumns.includes(String(column.key))),
		[handleAction, hiddenColumns],
	);

	const request = useCallback(
		async (params: { current?: number; pageSize?: number }) => {
			const result = await fetchPlanList({
				...searchedQuery,
				pageNum: params.current ?? 1,
				pageSize: params.pageSize ?? 20,
			});
			return {
				data: result.data,
				total: result.total,
				success: true,
			};
		},
		[searchedQuery],
	);

	return (
		<ConfigProvider
			theme={{
				components: {
					Table: {
						headerBg: "#f0f2f5",
						headerColor: "#323233",
						bodySortBg: "#f0f2f5",
						// 表体正文统一 #606266，表头由 headerColor 单独控制
						colorText: "#606266",
						// 表格分割线统一 #E4E7ED（与设计稿一致）
						borderColor: "#E4E7ED",
						// 上下 7px + 行高 22px = 36px 行高
						cellPaddingBlockMD: 7,
						cellPaddingInlineMD: 12,
					},
				},
			}}
		>
			<BasicContent>
				{/* 统计卡、筛选区、分隔线与表格统一使用 16px 纵向间距 */}
				<div className="flex flex-col gap-4">
					<PlanStatCards statistics={statistics} />
					<PlanFilterBar
						value={query}
						onChange={setQuery}
						onSearch={handleSearch}
						onReset={handleReset}
					/>
					<div className="h-px w-full bg-[#EBEEF5]" />
					<BasicTable<RatingPlanItem, { current?: number; pageSize?: number }>
						cardProps={false}
						rowKey="id"
						headerTitle={false}
						className="[&_.ant-table-thead>tr>th]:whitespace-nowrap"
						columns={columns}
						request={request}
						actionRef={actionRef}
						cardBordered={false}
						search={false}
						/**
						 * adaptive 让表体撑满剩余高度并内部滚动，
						 * 分页器固定在视口底部，随窗口高度自适应。
						 *
						 * 不覆盖 offsetBottom：默认的 24px 对应 BasicContent 的底部内边距，
						 * 分页器自身占位（16px 上外边距 + 24px 分页器）由 BasicTable 另行计入。
						 * 此前把 offsetBottom 调成 16，表体比可用高度高出 8px，
						 * 内容溢出内容区并触发外层滚动条。
						 */
						adaptive
						scroll={{ x: TABLE_SCROLL_X }}
						options={{
							reload: false,
							density: false,
							fullScreen: false,
							setting: false,
						}}
						pagination={{
							defaultPageSize: 20,
							showSizeChanger: true,
							// BasicTable 默认开启快速跳页，这里显式关闭以对齐设计稿
							showQuickJumper: false,
							showTotal: (total: number) => `共${total}条`,
						}}
					/>
				</div>
			</BasicContent>
			<PlanViewDrawer plan={activePlan} open={viewOpen} onClose={() => setViewOpen(false)} />
			<PermissionDrawer
				plan={activePlan}
				open={permissionOpen}
				onClose={() => setPermissionOpen(false)}
			/>
		</ConfigProvider>
	);
}
