import { deleteCalendar, getCalendarList } from "#src/api/work-bench";
import removeIcon from "#src/assets/small-icons/work-bench/remove.svg?react";
import { message, Modal, Tag, Tooltip } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";

interface MeetingItem {
	id: number;
	name: string;
	startYear: number;
	startMonth: number;
	endYear: number;
	endMonth: number;
	status: string;
	activeStatus: string;
	createTime?: string;
	createByName?: string;
	createBy?: string;
}

interface MonthItem {
	name: string;
	year: number;
	month: number;
	color: string;
	key: string;
}

interface CalendarData {
	monthList: MonthItem[];
	meetingRows: any[];
}

export const MeetingCalendar: React.FC<{
	year: number;
	refreshKey?: number;
	onEdit?: (item: MeetingItem) => void;
}> = ({ year, refreshKey, onEdit }) => {
	const [data, setData] = useState<CalendarData>({ monthList: [], meetingRows: [] });
	const containerRef = useRef<HTMLDivElement>(null);
	const [internalRefreshKey, setInternalRefreshKey] = useState(0);
	const shouldScrollRef = useRef(true);

	useEffect(() => {
		shouldScrollRef.current = true;
	}, [year]);

	useEffect(() => {
		const fetchData = async () => {
			const currentYear = year;
			const now = dayjs();

			const displayMonths: MonthItem[] = [];
			const yearsToFetch = new Set<number>();
			yearsToFetch.add(currentYear);

			// 1. Add all months of the selected year
			for (let m = 1; m <= 12; m++) {
				const d = dayjs()
					.year(currentYear)
					.month(m - 1);
				let color = "#606266"; // Future: Grey
				if (d.isBefore(now, "month")) {
					color = "#14B968"; // Past: Green
				} else if (d.isSame(now, "month")) {
					color = "#0075FF"; // Current: Blue
				}

				displayMonths.push({
					name: `${m}月`,
					year: currentYear,
					month: m,
					color,
					key: `${currentYear}-${m}`,
				});
			}

			// 2. If current year and near end of year (Nov/Dec), add next year's start
			if (currentYear === now.year() && now.month() >= 10) {
				yearsToFetch.add(currentYear + 1);
				for (let m = 1; m <= 2; m++) {
					// Add Jan, Feb
					displayMonths.push({
						name: `${m}月`,
						year: currentYear + 1,
						month: m,
						color: "#606266",
						key: `${currentYear + 1}-${m}`,
					});
				}
			}

			// Fetch data only for involved years
			const fetchedYears = Array.from(yearsToFetch);
			const responses = await Promise.all(
				fetchedYears.map((y) => getCalendarList({ year: y })),
			);

			const allData: any[] = [];
			responses.forEach((res, index) => {
				if (res?.data) {
					const y = fetchedYears[index];
					allData.push(...res.data.map((item) => ({ ...item, year: y })));
				}
			});

			// Extract unique meetings
			const meetingMap = new Map<string, MeetingItem>();
			allData.forEach((monthData) => {
				monthData.list?.forEach((meeting: any) => {
					// Use composite key to handle duplicate IDs in data
					const uniqueKey = `${meeting.id}_${meeting.meetingName}_${meeting.startYear}_${meeting.startMonth}`;
					if (!meetingMap.has(uniqueKey)) {
						meetingMap.set(uniqueKey, {
							id: meeting.id,
							name: meeting.meetingName,
							startYear: meeting.startYear,
							startMonth: meeting.startMonth,
							endYear: meeting.endYear,
							endMonth: meeting.endMonth,
							status: meeting.status,
							activeStatus: meeting.activeStatus,
							createTime: meeting.createTime,
							createByName: meeting.createByName,
							createBy: meeting.createBy,
						});
					}
				});
			});

			const meetings = Array.from(meetingMap.values());

			// Layout algorithm
			const rows: any[] = [];

			// Sort meetings by start time
			meetings.sort((a, b) => {
				if (a.startYear !== b.startYear) return a.startYear - b.startYear;
				return a.startMonth - b.startMonth;
			});

			meetings.forEach((meeting) => {
				// Calculate span and start index in displayMonths
				const startKey = `${meeting.startYear}-${meeting.startMonth}`;

				const startIndex = displayMonths.findIndex((m) => m.key === startKey);

				// If meeting starts after the display window, ignore
				if (
					startIndex === -1 &&
					dayjs(`${meeting.startYear}-${meeting.startMonth}`).isAfter(
						dayjs(
							`${displayMonths[displayMonths.length - 1].year}-${displayMonths[displayMonths.length - 1].month}`,
						),
					)
				) {
					return;
				}

				// If meeting ends before the display window, ignore
				if (
					dayjs(`${meeting.endYear}-${meeting.endMonth}`).isBefore(
						dayjs(`${displayMonths[0].year}-${displayMonths[0].month}`),
					)
				) {
					return;
				}

				// Calculate duration in months
				const startD = dayjs(`${meeting.startYear}-${meeting.startMonth}-01`);
				const endD = dayjs(`${meeting.endYear}-${meeting.endMonth}-01`);

				// Find which months in displayMonths this meeting covers
				const coveredIndices: number[] = [];
				displayMonths.forEach((m, idx) => {
					const currentD = dayjs(`${m.year}-${m.month}-01`);
					if (
						(currentD.isSame(startD) || currentD.isAfter(startD)) &&
						(currentD.isSame(endD) || currentD.isBefore(endD))
					) {
						coveredIndices.push(idx);
					}
				});

				if (coveredIndices.length === 0) return;

				const firstCoveredIndex = coveredIndices[0];
				const lastCoveredIndex = coveredIndices[coveredIndices.length - 1];
				const displaySpan = lastCoveredIndex - firstCoveredIndex + 1;

				// Find a row
				let placed = false;
				for (let r = 0; r < rows.length; r++) {
					const row = rows[r];
					// Check collision
					let collision = false;
					for (let i = firstCoveredIndex; i <= lastCoveredIndex; i++) {
						const key = displayMonths[i].key;
						if (row[key] && row[key].type !== "empty") {
							collision = true;
							break;
						}
					}

					if (!collision) {
						// Place here
						row[displayMonths[firstCoveredIndex].key] = {
							name: meeting.name,
							type: "normal",
							span: displaySpan,
							id: meeting.id,
							data: meeting,
							// Store original meeting info if needed
						};
						// Fill placeholders
						for (let i = firstCoveredIndex + 1; i <= lastCoveredIndex; i++) {
							row[displayMonths[i].key] = { type: "placeholder" };
						}
						placed = true;
						break;
					}
				}

				if (!placed) {
					// Create new row
					const newRow: any = {};
					// Initialize with empty
					displayMonths.forEach((m) => {
						newRow[m.key] = { type: "empty" };
					});

					newRow[displayMonths[firstCoveredIndex].key] = {
						name: meeting.name,
						type: "normal",
						span: displaySpan,
						id: meeting.id,
						data: meeting,
					};
					for (let i = firstCoveredIndex + 1; i <= lastCoveredIndex; i++) {
						newRow[displayMonths[i].key] = { type: "placeholder" };
					}
					rows.push(newRow);
				}
			});

			// Fill empty cells in rows
			rows.forEach((row) => {
				displayMonths.forEach((m) => {
					if (!row[m.key]) {
						row[m.key] = { type: "empty" };
					}
				});
			});

			setData({ monthList: displayMonths, meetingRows: rows });
		};

		fetchData();
	}, [year, refreshKey, internalRefreshKey]);

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout>;
		if (containerRef.current && data.monthList.length > 0 && shouldScrollRef.current) {
			if (data.monthList[0].year === year) {
				shouldScrollRef.current = false;
				const now = dayjs();
				if (year === now.year()) {
					timer = setTimeout(() => {
						if (containerRef.current) {
							const monthIndex = now.month();
							const itemWidth = containerRef.current.clientWidth / 4;
							containerRef.current.scrollTo({
								left: monthIndex * itemWidth,
								behavior: "smooth",
							});
						}
					}, 200);
				} else {
					containerRef.current.scrollTo({ left: 0, behavior: "smooth" });
				}
			}
		}
		return () => clearTimeout(timer);
	}, [data, year]);

	const handleDelete = (e: React.MouseEvent, id: number) => {
		e.stopPropagation();
		Modal.confirm({
			title: "确认删除",
			content: "您确定要删除这个会议吗？",
			okText: "确认",
			cancelText: "取消",
			onOk: async () => {
				try {
					await deleteCalendar(String(id));
					message.success("删除成功");
					setInternalRefreshKey((prev) => prev + 1);
				} catch (error) {
					console.error("Delete failed:", error);
				}
			},
		});
	};

	const { monthList, meetingRows } = data;
	return (
		<div
			ref={containerRef}
			className="custom-scrollbar relative h-full w-full overflow-auto p-4 pb-0 pt-1"
		>
			{/* 顶部进度线+月份tag */}
			<div className="sticky top-0 z-20 mb-0 flex h-7 items-center bg-white">
				{monthList.map((m, idx) => (
					<div
						key={m.key}
						data-key={m.key}
						className="flex w-1/4 flex-shrink-0 items-center"
					>
						<div className="flex flex-shrink-0 flex-col items-start">
							<Tag
								color={m.color}
								className="mb-2 h-5 w-10 rounded-full border-0 px-0 text-center text-sm font-normal leading-5 text-white"
								style={{ background: m.color }}
							>
								{m.name}
							</Tag>
						</div>
						<div
							className="h-[2px] min-w-8 flex-1 -translate-y-1 self-center rounded-none"
							style={{
								background:
									idx >= 2
										? "linear-gradient(90deg, #0075FF 29.42%, #A7F2FF 37.74%, #B7F3FF 46.18%, #EEF6FF 100.87%)"
										: "linear-gradient(90deg, #0075FF 29.42%, #0075FF 37.74%, #0075FF 46.18%, #0075FF 100.87%)",
							}}
						/>
					</div>
				))}
			</div>
			{/* 每个月会议tag列表 */}
			<div className="flex pt-2">
				{monthList.map((m) => {
					return (
						<div
							key={m.key}
							className="flex w-1/4 flex-shrink-0 flex-col items-start pr-4"
						>
							{meetingRows.map((row, rowIndex) => {
								const cell = row[m.key];
								const cellKey = cell?.data?.id
									? String(cell.data.id)
									: `empty-${rowIndex}`;

								// 如果没有数据或者是empty/placeholder，渲染占位div以保持高度对齐
								if (!cell || cell.type === "empty" || cell.type === "placeholder") {
									return (
										<div key={cellKey} className="mb-2 h-[30px] w-full"></div>
									);
								}

								// 计算跨列宽度
								// 默认宽度是80% (相对于父容器w-1/4)
								// 跨N列宽度 = (N-1) * (100% + 1rem) + 80%
								// 即：前N-1列的全宽(含gap) + 最后一列的会议宽度(80%)
								const span = cell.span || 1;
								const widthStyle =
									span > 1
										? `calc(${(span - 1) * 100 + 80}% + ${span - 1}rem)`
										: "80%";
								const zIndex = span > 1 ? 10 : 1;

								// 0待开始 1进行中 2已结束
								const activeStatus = cell.data?.activeStatus;
								let borderColor = "rgba(228, 231, 237, 1)";
								let textColor = "rgba(144, 147, 153, 1)";

								if (activeStatus === "1") {
									// 进行中
									borderColor = "#0075FF";
									textColor = "rgba(96, 98, 102, 1)";
								} else if (activeStatus === "2") {
									// 已结束
									borderColor = "#14B968";
									textColor = "rgba(96, 98, 102, 1)";
								}

								return (
									<div
										key={cellKey}
										className="group relative mb-2 box-border h-[26px] cursor-pointer rounded bg-[#f5f7fa] text-sm font-normal"
										style={{
											width: widthStyle,
											zIndex,
											color: textColor,
											border: `1px solid ${borderColor}`,
										}}
										onClick={(e) => {
											e.stopPropagation();
											onEdit?.(cell.data);
										}}
									>
										<div
											className="h-[26px] overflow-hidden px-3 text-left leading-[26px]"
											style={{
												display: "-webkit-box",
												WebkitLineClamp: 1,
												WebkitBoxOrient: "vertical",
												wordBreak: "break-all",
											}}
										>
											<Tooltip title={cell.name} placement="top">
												{cell.name}
											</Tooltip>
										</div>
										<div
											className="absolute -right-[9px] -top-[9px] z-20 hidden h-[18px] w-[18px] cursor-pointer items-center justify-center group-hover:flex"
											onClick={(e) => handleDelete(e, cell.id)}
										>
											{React.createElement(removeIcon, {
												style: { width: 18, height: 18 },
											})}
										</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
};
