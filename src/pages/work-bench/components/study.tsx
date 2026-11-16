import type { CourseItem } from "#src/api/work-bench";
import { getCoursePageList, getCourseUrl } from "#src/api/work-bench";
import studyBlank from "#src/assets/svg/study-blank.svg";
import { message, Spin } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 10;

function getCourseListData(response: ApiListResponse<CourseItem> | null | undefined) {
	return {
		list: Array.isArray(response?.data?.list) ? response.data.list : [],
		total: Number(response?.data?.total ?? 0),
	};
}

function normalizeMonth(rawValue: unknown) {
	if (typeof rawValue === "number") {
		return rawValue;
	}
	if (typeof rawValue === "string") {
		const upperValue = rawValue.toUpperCase();
		const monthMap: Record<string, number> = {
			JANUARY: 1,
			FEBRUARY: 2,
			MARCH: 3,
			APRIL: 4,
			MAY: 5,
			JUNE: 6,
			JULY: 7,
			AUGUST: 8,
			SEPTEMBER: 9,
			OCTOBER: 10,
			NOVEMBER: 11,
			DECEMBER: 12,
		};
		if (monthMap[upperValue]) {
			return monthMap[upperValue];
		}
		const numericMonth = Number(rawValue);
		if (!Number.isNaN(numericMonth)) {
			return numericMonth;
		}
	}
	return 1;
}

function formatCourseDate(rawValue: unknown) {
	if (!rawValue) {
		return "-";
	}
	if (typeof rawValue === "string" || typeof rawValue === "number" || rawValue instanceof Date) {
		const parsedValue = dayjs(rawValue);
		return parsedValue.isValid() ? parsedValue.format("YYYY-MM-DD") : "-";
	}
	if (typeof rawValue === "object") {
		const dateValue = rawValue as Record<string, unknown>;
		const year = Number(dateValue.year ?? dateValue.years ?? 0);
		const month = normalizeMonth(dateValue.monthValue ?? dateValue.month ?? 1);
		const day = Number(dateValue.dayOfMonth ?? dateValue.day ?? 1);
		if (year > 0) {
			const parsedValue = dayjs(new Date(year, month - 1, day));
			return parsedValue.isValid() ? parsedValue.format("YYYY-MM-DD") : "-";
		}
	}
	return "-";
}

export interface StudyProps {
	className?: string;
	style?: React.CSSProperties;
	keyword?: string;
}

export const Study: React.FC<StudyProps> = ({ className = "", style, keyword = "" }) => {
	const scrollRef = useRef<HTMLDivElement>(null);
	const requestIdRef = useRef(0);
	const [courseList, setCourseList] = useState<CourseItem[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);

	const hasMore = courseList.length < total;
	const coverUrl = useMemo(() => courseList[0]?.coverUrl?.trim() || "", [courseList]);

	const loadCourseList = useCallback(
		async ({
			pageNum,
			append,
			searchTitle,
		}: {
			pageNum: number;
			append: boolean;
			searchTitle: string;
		}) => {
			const requestId = ++requestIdRef.current;
			if (append) {
				setLoadingMore(true);
			} else {
				setLoading(true);
			}

			try {
				const response = await getCoursePageList({
					pageNum,
					pageSize: PAGE_SIZE,
					searchCount: true,
					title: searchTitle || undefined,
				});
				if (requestId !== requestIdRef.current) {
					return;
				}

				const { list, total: nextTotal } = getCourseListData(response);
				setTotal(nextTotal);
				setCurrentPage(pageNum);
				setCourseList((prev) => {
					if (!append) {
						return list;
					}
					const existingIds = new Set(prev.map((item) => item.id));
					const mergedList = [...prev];
					list.forEach((item) => {
						if (!existingIds.has(item.id)) {
							mergedList.push(item);
						}
					});
					return mergedList;
				});
			} catch (error) {
				if (requestId === requestIdRef.current && !append) {
					setCourseList([]);
					setTotal(0);
				}
				console.error("load culture courses failed", error);
			} finally {
				if (requestId === requestIdRef.current) {
					setLoading(false);
					setLoadingMore(false);
				}
			}
		},
		[],
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			requestIdRef.current += 1;
			setCourseList([]);
			setTotal(0);
			setCurrentPage(1);
			loadCourseList({
				pageNum: 1,
				append: false,
				searchTitle: keyword.trim(),
			});
			if (scrollRef.current) {
				scrollRef.current.scrollTop = 0;
			}
		}, 300);

		return () => window.clearTimeout(timer);
	}, [keyword, loadCourseList]);

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) {
			return;
		}

		const handleScroll = () => {
			if (loading || loadingMore || !hasMore) {
				return;
			}
			const { scrollTop, clientHeight, scrollHeight } = scrollElement;
			if (scrollHeight - scrollTop - clientHeight <= 48) {
				void loadCourseList({
					pageNum: currentPage + 1,
					append: true,
					searchTitle: keyword.trim(),
				});
			}
		};

		scrollElement.addEventListener("scroll", handleScroll);
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [currentPage, hasMore, keyword, loadCourseList, loading, loadingMore]);

	const handleOpenCourse = useCallback(async (course: CourseItem) => {
		if (!course.kngId) {
			message.warning("当前课程缺少播放标识");
			return;
		}

		try {
			const response = await getCourseUrl(course.kngId);
			const courseUrl = typeof response?.data === "string" ? response.data.trim() : "";

			if (!courseUrl || courseUrl.toLowerCase().startsWith("javascript:")) {
				message.warning("未获取到有效的课程地址");
				return;
			}

			window.open(courseUrl, "_blank", "noopener,noreferrer");
		} catch (error) {
			console.error("open course failed", error);
			message.error("打开课程失败，请稍后重试");
		}
	}, []);

	if (loading && courseList.length === 0) {
		return (
			<div
				className={`flex h-full min-h-0 items-center justify-center overflow-hidden ${className}`}
				style={style}
			>
				<Spin size="small" />
			</div>
		);
	}

	if (!loading && courseList.length === 0) {
		return (
			<div
				className={`flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden ${className}`}
				style={style}
			>
				<img
					src={studyBlank}
					alt="暂无文化学习内容"
					className="mb-3 h-[88px] w-auto object-contain opacity-90"
				/>
				<div className="shrink-0 text-sm text-gray-400">暂无文化学习内容</div>
			</div>
		);
	}

	return (
		<div className={`flex h-full min-h-0 w-full overflow-hidden ${className}`} style={style}>
			<div
				className={`h-full min-h-0 w-full overflow-hidden ${coverUrl ? "flex gap-3 lg:grid lg:grid-cols-[2fr_3fr]" : "flex"}`}
			>
				{coverUrl && (
					<div className="hidden h-full overflow-hidden rounded-md bg-gray-100 pb-2 lg:block">
						<img
							src={coverUrl}
							alt={courseList[0]?.title || "课程封面"}
							className="h-full w-full object-cover"
						/>
					</div>
				)}
				<div
					ref={scrollRef}
					className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto pr-1"
				>
					<div className="flex flex-col gap-2 pt-1">
						{courseList.map((course) => {
							return (
								<div
									key={course.id}
									className="group cursor-pointer rounded-md border border-transparent bg-white px-3 py-1.5 transition-all duration-200 hover:-translate-y-[1px] hover:border-[#0075FF] hover:bg-[rgba(0,117,255,0.04)] hover:shadow-[0_8px_18px_rgba(0,117,255,0.08)]"
									onClick={() => void handleOpenCourse(course)}
								>
									<div
										className="truncate text-[14px] leading-5 text-black transition-colors duration-200 group-hover:text-[#0075FF]"
										style={{
											fontFamily: "PingFang SC",
											fontWeight: 400,
											fontStyle: "normal",
											letterSpacing: 0,
										}}
										title={course.title}
									>
										{course.title}
									</div>
									<div className="mt-0.5 grid grid-cols-3 gap-x-3 text-left text-xs leading-4 text-[rgba(96,98,102,1)] transition-colors duration-200 group-hover:text-[#3A7BFF] sm:text-sm">
										<span
											className="block min-w-0 truncate text-left"
											title={course.kngTypeName}
										>
											{course.kngTypeName}
										</span>
										<span className="block min-w-0 truncate text-center">
											{course.studyUserCount || 0}
											人学习
										</span>
										<span className="block min-w-0 truncate text-right">
											{formatCourseDate(course.createTime)}
										</span>
									</div>
								</div>
							);
						})}
					</div>
					{loadingMore && (
						<div className="flex items-center justify-center py-3 text-xs text-gray-400">
							<Spin size="small" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
