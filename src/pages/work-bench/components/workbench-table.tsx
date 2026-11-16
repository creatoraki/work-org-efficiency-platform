import type { ListForWorkbenchRes } from "#src/api/work-bench";
import BlankIcon from "#src/assets/svg/blank.svg?react";
import { useWorkBenchStore } from "#src/store/workbench";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button, Input, Spin } from "antd";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

type BacklogItem = ListForWorkbenchRes["undoBacklogList"][0];

const DEFAULT_LIST: BacklogItem[] = [];
const DEFAULT_COUNTS = { todo: 0, done: 0 };
const ROW_HEIGHT = 36;

function parseWorkbenchLink(link: string) {
	const normalizedLink = /^https?:\/\//i.test(link)
		? link
		: link.startsWith("/")
			? link
			: `/${link}`;
	const parsedUrl = new URL(normalizedLink, window.location.origin);
	const query: Record<string, string> = {};
	parsedUrl.searchParams.forEach((value, key) => {
		query[key] = value;
	});

	return {
		isExternal: /^https?:\/\//i.test(link) && parsedUrl.origin !== window.location.origin,
		path: parsedUrl.pathname,
		query,
	};
}

function parseWorkbenchQueryPayload(queryPayload?: string) {
	if (!queryPayload) {
		return null;
	}

	try {
		const parsedPayload = JSON.parse(queryPayload) as unknown;
		if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
			return null;
		}

		const normalizedQuery = Object.entries(parsedPayload).reduce<Record<string, string>>(
			(acc, [key, value]) => {
				if (value === undefined || value === null) {
					return acc;
				}

				acc[key] = String(value);
				return acc;
			},
			{},
		);

		return Object.keys(normalizedQuery).length > 0 ? normalizedQuery : null;
	} catch {
		return null;
	}
}

function formatTime(time: any) {
	if (!time) return "-";
	if (typeof time === "string") return time;
	return String(time);
}

function toTimestamp(value: any) {
	if (!value) return 0;
	if (typeof value === "string" || typeof value === "number") {
		const ts = new Date(value).getTime();
		return Number.isNaN(ts) ? 0 : ts;
	}
	if (typeof value === "object") {
		const { year, month, day } = value as any;
		if (year) return new Date(year, (month ?? 1) - 1, day ?? 1).getTime();
	}
	return 0;
}

/** 单行组件，用 memo 避免无关行重渲染 */
const RowItem = memo(
	({
		item,
		showAction,
		onProcess,
	}: {
		item: BacklogItem;
		showAction: boolean;
		onProcess: (item: BacklogItem) => void;
	}) => {
		const overdueText = item.isOverDue ? `${item.overdueDays}天未处理` : "正常";

		return (
			<div className="flex items-center border-x border-y border-gray-200 py-1.5">
				<span className="flex w-[3.33%] flex-shrink-0 justify-center text-center">
					<span className="truncate text-sm text-gray-500" title={String(item.id)}>
						{item.id}
					</span>
				</span>
				<span className="w-[62%] min-w-0 flex-shrink-0 px-2">
					<span
						className="block truncate text-sm"
						style={{ color: "rgba(96, 98, 102, 1)" }}
						title={item.backLogTitle}
					>
						{item.backLogTitle}
					</span>
				</span>
				<span className="flex w-[18%] min-w-0 flex-shrink-0 justify-center text-center">
					<span
						className="truncate text-sm"
						style={{ color: "rgba(96, 98, 102, 1)" }}
						title={formatTime(item.createTime)}
					>
						{formatTime(item.createTime)}
					</span>
				</span>
				<span
					className={`flex w-[10%] min-w-0 flex-shrink-0 justify-center text-center font-medium ${item.isOverDue ? "text-red-500" : "text-gray-500"}`}
				>
					<span
						className={`truncate text-sm ${item.isOverDue ? "text-red-500" : "text-gray-500"}`}
						title={overdueText}
					>
						{overdueText}
					</span>
				</span>
				{showAction && (
					<div className="flex w-[6.66%] flex-shrink-0 justify-center text-sm">
						<Button
							type="link"
							size="small"
							className="h-auto p-0"
							onClick={() => onProcess(item)}
						>
							去处理
						</Button>
					</div>
				)}
			</div>
		);
	},
);

export interface SearchTableProps {
	className?: string;
	todoList?: BacklogItem[];
	doneList?: BacklogItem[];
	counts?: { todo: number; done: number };
	loading?: boolean;
	onSearch?: (value: string) => void;
}

export function WorkBenchTable({
	className = "",
	todoList = DEFAULT_LIST,
	doneList = DEFAULT_LIST,
	counts = DEFAULT_COUNTS,
	loading = false,
	onSearch,
}: SearchTableProps) {
	const navigate = useNavigate();
	const { setPendingLinkQuery, clearPendingLinkQuery } = useWorkBenchStore();
	const [tab, setTab] = useState<"todo" | "done">("todo");
	const [search, setSearch] = useState("");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

	const filteredData = useMemo(() => {
		const data = tab === "todo" ? todoList : doneList;
		if (!sortOrder) return data;
		return [...data].sort((a, b) => {
			const diff = toTimestamp(a.createTime) - toTimestamp(b.createTime);
			return sortOrder === "asc" ? diff : -diff;
		});
	}, [todoList, doneList, tab, sortOrder]);

	const handleProcess = useCallback(
		(item: BacklogItem) => {
			const link = item.pcLink;
			if (!link) return;
			const { isExternal, path, query } = parseWorkbenchLink(link);
			const payloadQuery = parseWorkbenchQueryPayload(item.query);
			const effectiveQuery = payloadQuery ? { ...query, ...payloadQuery } : query;

			if (!isExternal && Object.keys(effectiveQuery).length > 0) {
				setPendingLinkQuery(path, effectiveQuery);
			} else {
				clearPendingLinkQuery();
			}

			if (isExternal) {
				window.location.assign(link);
				return;
			}
			navigate(path);
		},
		[navigate, setPendingLinkQuery, clearPendingLinkQuery],
	);

	// 虚拟滚动
	const scrollRef = useRef<HTMLDivElement>(null);
	const virtualizer = useVirtualizer({
		count: filteredData.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT,
		overscan: 10,
	});

	const showAction = tab === "todo";

	return (
		<div
			className={`flex h-full min-h-0 flex-col rounded-lg border border-gray-200 bg-white p-4 py-2 shadow-sm ${className}`}
		>
			{/* 顶部操作区 */}
			<div className="mb-2 flex flex-shrink-0 items-center justify-between">
				{/* 左侧tab切换 */}
				<div className="flex h-[38px] items-center gap-2 rounded-md bg-gray-100 px-2 text-sm">
					{[
						{ key: "todo", label: `待处理(${counts.todo}条)` },
						{ key: "done", label: `已处理(${counts.done}条)` },
					].map((item) => {
						const isActive = tab === item.key;
						return (
							<div
								key={item.key}
								className={`relative z-0 flex h-[30px] cursor-pointer items-center justify-center rounded-md px-1 text-sm font-medium transition-colors duration-150 ${isActive ? "text-[rgb(var(--oo-colorPrimary))]" : "text-gray-700 hover:text-[rgb(var(--oo-colorPrimary))]"}`}
								onClick={() => setTab(item.key as any)}
							>
								{isActive && (
									<motion.div
										layoutId="search-table-tab-active"
										className="absolute inset-0 z-[-1] rounded-md bg-white shadow-sm"
										transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
									/>
								)}
								{item.label}
							</div>
						);
					})}
				</div>
				{/* 右侧搜索和排序 */}
				<div className="flex min-w-0 flex-1 items-center justify-end gap-2">
					<div className="relative flex max-w-[360px] flex-1 items-center">
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="搜索关键词"
							allowClear
							className="w-full"
							onPressEnter={() => onSearch?.(search)}
						/>
						<button
							type="button"
							className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
							onClick={() => onSearch?.(search)}
							tabIndex={-1}
							style={{ background: "none", border: "none", padding: 0 }}
						>
							<svg
								className="h-5 w-5 translate-y-0.5"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								viewBox="0 0 24 24"
							>
								<circle cx="11" cy="12" r="5" />
								<line x1="15.5" y1="16.5" x2="21.5" y2="22.5" />
							</svg>
						</button>
					</div>
					<div
						className="mx-2 flex cursor-pointer select-none items-center"
						style={{ color: "rgba(96, 98, 102, 1)" }}
						onClick={() => {
							setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
						}}
					>
						接收时间
						<span className="ml-1 flex cursor-pointer flex-col justify-center">
							<svg
								className="h-3 w-2.5 leading-none"
								viewBox="0 0 10 12"
								fill="none"
								stroke="currentColor"
								strokeWidth="0.8"
								aria-hidden="true"
							>
								<polygon
									points="5,0.5 8.2,4.6 1.8,4.6"
									style={{
										stroke:
											sortOrder === "desc"
												? "rgba(96, 98, 102, 0.35)"
												: "rgba(96, 98, 102, 1)",
									}}
								/>
								<polygon
									points="1.8,7.4 8.2,7.4 5,11.5"
									style={{
										stroke:
											sortOrder === "asc"
												? "rgba(96, 98, 102, 0.35)"
												: "rgba(96, 98, 102, 1)",
									}}
								/>
							</svg>
						</span>
					</div>
				</div>
			</div>
			{/* 列表区 - 虚拟滚动 */}
			<div className="relative min-h-0 flex-1 overflow-hidden">
				{loading && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
						<Spin />
					</div>
				)}
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={tab}
						initial={{ x: tab === "todo" ? -30 : 30, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: tab === "todo" ? 30 : -30, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="absolute inset-0"
					>
						<div
							ref={scrollRef}
							className="relative h-full overflow-y-auto border-b border-gray-200"
							style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
						>
							{filteredData.length > 0 ? (
								<div
									style={{
										height: `${virtualizer.getTotalSize()}px`,
										width: "100%",
										position: "relative",
									}}
								>
									{virtualizer.getVirtualItems().map((virtualRow) => {
										const item = filteredData[virtualRow.index];
										return (
											<div
												key={item.id}
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													width: "100%",
													height: `${virtualRow.size}px`,
													transform: `translateY(${virtualRow.start}px)`,
												}}
											>
												<RowItem
													item={item}
													showAction={showAction}
													onProcess={handleProcess}
												/>
											</div>
										);
									})}
								</div>
							) : (
								!loading && (
									<div className="flex h-full flex-col items-center justify-center border-x border-t border-gray-200 text-gray-400">
										<BlankIcon className="h-[120px] w-[120px]" />
										<span className="mt-2 text-gray-400">暂无数据</span>
									</div>
								)
							)}
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
