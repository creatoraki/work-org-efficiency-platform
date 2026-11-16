import type {
	RatingAction,
	RatingTodoItem,
	RatingTodoQuery,
	RatingTodoStatistics,
} from "#src/api/performance-management/todo";
import type { ActionType } from "@ant-design/pro-components";

import {
	fetchTodoList,
	fetchTodoStatistics,
	RatingNodeType,
	RatingTodoAction,
} from "#src/api/performance-management/todo";
import { BasicContent, BasicTable } from "#src/components";
import { ConfigProvider, message } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnnualRatingDict } from "../hooks/use-annual-rating-dict";
import { AppealHandleDrawer } from "./appeal/appeal-handle-drawer";
import { ApprovalDrawer } from "./approval/approval-drawer";
import { TodoFilterBar } from "./components/todo-filter-bar";
import { TodoStatCards } from "./components/todo-stat-cards";
import { getTodoColumns } from "./config/columns";
import { TABLE_COLUMN_WIDTH } from "./config/index";
import { AppealFilingModal } from "./confirm/appeal-filing-modal";
import { ConfirmDrawer } from "./confirm/confirm-drawer";
import styles from "./index.module.css";
import { SelfEvalDrawer } from "./self-eval/self-eval-drawer";
import { SubmitDrawer } from "./submit/submit-drawer";

/**
 * 表格横向滚动宽度，与全部固定列宽之和保持一致
 */
const TABLE_SCROLL_X = Object.values(TABLE_COLUMN_WIDTH).reduce((total, width) => total + width, 0);

/**
 * 评级待办页面
 *
 * 汇总展示当前用户的年度评级待办：顶部统计四类待办数量，
 * 中部提供筛选条件，底部表格展示待办明细并提供行操作入口。
 *
 * @returns 评级待办页面组件
 *
 * @author 王善能
 * @since 2026-11-11
 */
export default function RatingTodoPage() {
	const actionRef = useRef<ActionType>();
	const queryInitializedRef = useRef(false);
	const [query, setQuery] = useState<RatingTodoQuery>({});
	const [searchedQuery, setSearchedQuery] = useState<RatingTodoQuery>({});
	const [selfEvalOpen, setSelfEvalOpen] = useState(false);
	const [selfEvalTodoId, setSelfEvalTodoId] = useState("");
	const [selfEvalReadonly, setSelfEvalReadonly] = useState(false);
	const [appealOpen, setAppealOpen] = useState(false);
	const [appealTodoId, setAppealTodoId] = useState("");
	const [appealReadonly, setAppealReadonly] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [confirmTodoId, setConfirmTodoId] = useState("");
	const [appealFilingOpen, setAppealFilingOpen] = useState(false);
	const [submitOpen, setSubmitOpen] = useState(false);
	const [submitTodoId, setSubmitTodoId] = useState("");
	const [submitReadonly, setSubmitReadonly] = useState(false);
	const [approvalOpen, setApprovalOpen] = useState(false);
	const [approvalTodoId, setApprovalTodoId] = useState("");
	const [approvalReadonly, setApprovalReadonly] = useState(false);
	const [approvalNodeType, setApprovalNodeType] = useState<RatingNodeType>();

	const [statistics, setStatistics] = useState<RatingTodoStatistics>({
		pendingCount: 0,
		rejectedCount: 0,
		submittedCount: 0,
		completedCount: 0,
		rejectedTodayCount: 0,
		completedTodayCount: 0,
	});

	useEffect(() => {
		fetchTodoStatistics().then(setStatistics);
	}, []);

	const refreshTodo = useCallback(() => {
		fetchTodoStatistics().then(setStatistics);
		actionRef.current?.reload();
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

	const handleAction = useCallback((record: RatingTodoItem, action: RatingAction) => {
		// 自评节点的「填报」打开可编辑抽屉
		if (action.type === RatingTodoAction.FILL && record.nodeType === RatingNodeType.SELF_EVAL) {
			setSelfEvalTodoId(record.id);
			setSelfEvalReadonly(false);
			setSelfEvalOpen(true);
			return;
		}
		// 自评节点的「查看」打开只读抽屉
		if (action.type === RatingTodoAction.VIEW && record.nodeType === RatingNodeType.SELF_EVAL) {
			setSelfEvalTodoId(record.id);
			setSelfEvalReadonly(true);
			setSelfEvalOpen(true);
			return;
		}
		// 提报节点的「填报」打开可编辑提报抽屉
		if (action.type === RatingTodoAction.FILL && record.nodeType === RatingNodeType.SUBMIT) {
			setSubmitTodoId(record.id);
			setSubmitReadonly(false);
			setSubmitOpen(true);
			return;
		}
		// 提报节点的「查看」/「提交版本」打开只读提报抽屉
		if (
			(action.type === RatingTodoAction.VIEW ||
				action.type === RatingTodoAction.SUBMIT_VERSION) &&
			record.nodeType === RatingNodeType.SUBMIT
		) {
			setSubmitTodoId(record.id);
			setSubmitReadonly(true);
			setSubmitOpen(true);
			return;
		}
		// 确认节点的「确认」或「查看」打开确认抽屉
		if (
			record.nodeType === RatingNodeType.CONFIRM &&
			(action.type === RatingTodoAction.CONFIRM || action.type === RatingTodoAction.VIEW)
		) {
			setConfirmTodoId(record.id);
			setConfirmOpen(true);
			return;
		}
		// 申诉节点的「处理」打开可编辑抽屉，「查看」打开只读抽屉
		if (
			record.nodeType === RatingNodeType.APPEAL &&
			(action.type === RatingTodoAction.HANDLE || action.type === RatingTodoAction.VIEW)
		) {
			setAppealTodoId(record.id);
			setAppealReadonly(action.type === RatingTodoAction.VIEW);
			setAppealOpen(true);
			return;
		}
		// 审批 / 审定节点的「填报」「处理」「查看」打开审批抽屉（只读态用于已提交/已完成）
		if (
			(record.nodeType === RatingNodeType.APPROVE ||
				record.nodeType === RatingNodeType.FINALIZE) &&
			(action.type === RatingTodoAction.FILL ||
				action.type === RatingTodoAction.HANDLE ||
				action.type === RatingTodoAction.VIEW ||
				action.type === RatingTodoAction.SUBMIT_VERSION)
		) {
			setApprovalTodoId(record.id);
			setApprovalNodeType(record.nodeType);
			setApprovalReadonly(
				action.type === RatingTodoAction.VIEW ||
					action.type === RatingTodoAction.SUBMIT_VERSION,
			);
			setApprovalOpen(true);
			return;
		}
		message.info(`${action.label}：${record.planName}`);
	}, []);

	const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
	const { statusLabel, nodeTypeLabel, assessTypeLabel } = useAnnualRatingDict();

	const columns = useMemo(
		() =>
			getTodoColumns(
				handleAction,
				{
					hiddenKeys: hiddenColumns,
					onChange: setHiddenColumns,
				},
				{ statusLabel, nodeTypeLabel, assessTypeLabel },
			).filter((column) => !hiddenColumns.includes(String(column.key))),
		[handleAction, hiddenColumns, statusLabel, nodeTypeLabel, assessTypeLabel],
	);

	const request = useCallback(
		async (params: { current?: number; pageSize?: number }) => {
			const result = await fetchTodoList({
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
						// 表格边框使用 #E4E7ED，区别于 AntD 默认的 #F0F0F0
						borderColor: "#E4E7ED",
						// 上下 6.5px + 行高 22px + 1px 下边框 = 36px 行高
						cellPaddingBlockMD: 6.5,
						cellPaddingInlineMD: 12,
					},
				},
			}}
		>
			<BasicContent>
				{/* 统计卡、筛选区、分隔线与表格统一使用 16px 纵向间距 */}
				<div className="flex flex-col gap-4">
					<TodoStatCards statistics={statistics} />
					<TodoFilterBar
						value={query}
						onChange={setQuery}
						onSearch={handleSearch}
						onReset={handleReset}
					/>
					<div className="h-px w-full bg-[#EBEEF5]" />
					<BasicTable<RatingTodoItem, { current?: number; pageSize?: number }>
						cardProps={false}
						rowKey="id"
						headerTitle={false}
						className={`${styles.todoTable} [&_.ant-table-thead>tr>th]:whitespace-nowrap`}
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
						/**
						 * 分页器只保留「共N条 + 页码 + 每页条数」，
						 * 不提供快速跳页（BasicTable 默认开启，需显式关闭），总数文案无空格。
						 */
						pagination={{
							defaultPageSize: 20,
							showSizeChanger: true,
							showQuickJumper: false,
							showTotal: (total: number) => `共${total}条`,
						}}
					/>
				</div>
			</BasicContent>
			<SelfEvalDrawer
				todoId={selfEvalTodoId}
				open={selfEvalOpen}
				readonly={selfEvalReadonly}
				onClose={() => setSelfEvalOpen(false)}
				onSubmitted={refreshTodo}
			/>
			<AppealHandleDrawer
				todoId={appealTodoId}
				open={appealOpen}
				readonly={appealReadonly}
				onClose={() => setAppealOpen(false)}
			/>
			<ConfirmDrawer
				todoId={confirmTodoId}
				open={confirmOpen}
				onClose={() => setConfirmOpen(false)}
				onAppeal={() => setAppealFilingOpen(true)}
				onConfirmed={refreshTodo}
			/>
			<AppealFilingModal
				todoId={confirmTodoId}
				open={appealFilingOpen}
				onClose={() => setAppealFilingOpen(false)}
				onSubmitted={() => {
					setConfirmOpen(false);
					refreshTodo();
				}}
			/>
			<SubmitDrawer
				todoId={submitTodoId}
				open={submitOpen}
				readonly={submitReadonly}
				onClose={() => setSubmitOpen(false)}
				onSubmitted={refreshTodo}
			/>
			<ApprovalDrawer
				todoId={approvalTodoId}
				open={approvalOpen}
				readonly={approvalReadonly}
				nodeType={approvalNodeType}
				onClose={() => setApprovalOpen(false)}
				onSubmitted={refreshTodo}
			/>
		</ConfigProvider>
	);
}
