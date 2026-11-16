import budget from "#src/assets/svg/budget.svg";
import checkCircle from "#src/assets/svg/check-circle.svg";

import DataDeclaration from "#src/assets/svg/data-declaration.svg?react";
import detail from "#src/assets/svg/detail.svg";
import exceedBudget from "#src/assets/svg/exceed-budget.svg";
import expend from "#src/assets/svg/expend.svg";
import close from "#src/assets/svg/red-close.svg";
import { SectionTitle, SubTitle } from "#src/components";
import { Table, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";

import { Target } from "../middle/ProjCostCompare";
import SalaryDetail from "./components/SalaryDetail";
import {
	costsCompareFakeData,
	costsExpectedCompareFakeData,
	getCostsCompareColumns,
	getCostsExpectedCompareColumns,
} from "./config";
import "./index.css";

export default function CostOverview() {
	const [isexceedBudget] = useState(true);
	const [openDetail, setOpenDetail] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	// const tablesContainerRef = useRef<HTMLDivElement>(null);
	const [firstTableHeight, setFirstTableHeight] = useState<number | undefined>(undefined);
	const [secondTableHeight, setSecondTableHeight] = useState<number | undefined>(undefined);

	useEffect(() => {
		const calculateTableHeights = () => {
			if (!containerRef.current) return;

			const container = containerRef.current;
			// 获取容器的实际内容区域高度（已减去 padding）
			const containerHeight = container.clientHeight;

			// 获取上方固定元素的实际高度
			const sectionTitle = container.querySelector(".section-title-container");
			const budgetOverview = container.querySelector(".border.rounded");
			const subTitleRow = container.querySelector(".flex.items-center.justify-between");

			let fixedHeight = 0;
			if (sectionTitle) fixedHeight += sectionTitle.clientHeight;
			if (budgetOverview) fixedHeight += budgetOverview.clientHeight + 8; // 8px for margin-top
			if (subTitleRow) fixedHeight += subTitleRow.clientHeight;

			// 计算两个表格区域的总可用高度
			// 容器总高度 - 固定元素高度 - 两个表格之间的间距(4px)
			const tablesTotalHeight = containerHeight - fixedHeight - 32;

			// 平均分配两个表格的总高度
			const totalHeightPerTable = tablesTotalHeight / 2;

			// 获取或估算表头高度
			// 动态获取第一个表格的表头高度，如果不存在则使用默认值 39px
			const firstTableHeader = container.querySelector(".comparedTable .ant-table-thead");
			const tableHeaderHeight = firstTableHeader ? firstTableHeader.clientHeight : 39;

			// 获取单行数据的高度（从第一个表格的第一行获取）
			const firstTableRow = container.querySelector(".comparedTable .ant-table-tbody tr");
			const rowHeight = firstTableRow ? firstTableRow.clientHeight : 40; // 默认 40px

			// 计算最小所需高度（表头 + 一行数据）
			const minScrollY = rowHeight;

			// 计算滚动区域高度（表格总高度 - 表头高度）
			let scrollY = Math.floor(totalHeightPerTable - tableHeaderHeight);

			// 如果计算出的高度小于最小高度，则设置为最小高度（允许容器撑开）
			if (scrollY < minScrollY) {
				scrollY = minScrollY;
			}

			setFirstTableHeight(scrollY > 0 ? scrollY : undefined);
			setSecondTableHeight(scrollY > 0 ? scrollY : undefined);
		};

		// 初始计算
		calculateTableHeights();

		// 监听窗口大小变化
		const handleResize = () => {
			// 使用 requestAnimationFrame 确保在渲染完成后计算
			requestAnimationFrame(() => {
				calculateTableHeights();
			});
		};

		window.addEventListener("resize", handleResize);

		// 使用 ResizeObserver 监听容器大小变化
		let resizeObserver: ResizeObserver | null = null;
		if (containerRef.current) {
			resizeObserver = new ResizeObserver(() => {
				requestAnimationFrame(() => {
					calculateTableHeights();
				});
			});
			resizeObserver.observe(containerRef.current);
		}

		// 监听全屏状态变化
		const handleFullscreenChange = () => {
			// 全屏切换后多次延迟计算，确保 DOM 已经完全更新
			setTimeout(() => {
				calculateTableHeights();
			}, 100);
			setTimeout(() => {
				requestAnimationFrame(() => {
					calculateTableHeights();
				});
			}, 300);
			setTimeout(() => {
				calculateTableHeights();
			}, 500);
		};

		document.addEventListener("fullscreenchange", handleFullscreenChange);
		document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
		document.addEventListener("mozfullscreenchange", handleFullscreenChange);
		document.addEventListener("MSFullscreenChange", handleFullscreenChange);

		return () => {
			window.removeEventListener("resize", handleResize);
			if (resizeObserver && containerRef.current) {
				resizeObserver.unobserve(containerRef.current);
			}
			document.removeEventListener("fullscreenchange", handleFullscreenChange);
			document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
			document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
			document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 8px 0px #0000001F ",
			}}
		>
			<div className="section-title-container">
				<SectionTitle
					title={
						<span className="text-sm font-medium md:text-base">X月人力成本总览</span>
					}
				/>
			</div>

			<div className="relative mt-2 flex flex-shrink-0 flex-col gap-2.5 rounded border bg-[#fff] px-2.5 py-2">
				<div
					className="w-atuo absolute -top-4 right-0 flex h-4 h-5 items-center justify-center bg-[#FEE4E6] px-1.5 py-1 text-[10px] text-[#F5222D] md:-top-5 md:text-xs"
					style={{
						borderRadius: "4px 4px 0 0",
						display: isexceedBudget ? "absolute" : "none",
					}}
				>
					<img src={exceedBudget} className="mr-0.5" />
					<span>超预算</span>
				</div>
				<div className="around flex h-auto w-full items-center justify-between">
					<Target img={budget} title="年度预算(万元)" number="8,360.00" />
					<div className="whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] [@media(max-width:1400px)]:px-0.5">
						减去
					</div>

					<Target img={expend} title="实际支出(万元)" number="9,360.00" />
					<div className="whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] [@media(max-width:1400px)]:px-0.5">
						等于
					</div>

					<Target
						img={isexceedBudget ? close : checkCircle}
						title="剩余预算(万元)"
						number={
							isexceedBudget ? (
								<span className="text-[#F5222D]">-1,000.00</span>
							) : (
								"-1,000.00"
							)
						}
					/>
				</div>
				<div
					className="w-full"
					style={{
						borderTop: "1px solid #E4E7ED",
					}}
				></div>
				<div className="flex h-auto w-full items-center justify-around">
					<Target
						title="预算使用率(%)"
						number="90.00"
						style={{ flexDirection: "row", gap: 4 }}
					/>
					<Target
						title="预算使用率地区排名"
						number="2/320"
						style={{ flexDirection: "row", gap: 4 }}
					/>
				</div>
			</div>

			<div className="flex h-auto w-full flex-shrink-0 items-center justify-between">
				<SubTitle
					className="my-2"
					title={
						<div className="relative">
							<span className="font-medium">X月人力成本对比</span>
							<Tooltip placement="top" title="123">
								<DataDeclaration className="absolute top-0 cursor-pointer" />
							</Tooltip>
						</div>
					}
				/>
				<div
					className="right-4 top-3 flex cursor-pointer items-center justify-center text-[#606266]"
					onClick={() => setOpenDetail(true)}
				>
					<span className="text-xs md:text-sm">详情</span>
					<img src={detail} />
				</div>
			</div>
			<SalaryDetail open={openDetail} setOpen={setOpenDetail} />

			<Table
				className="comparedTable"
				bordered
				size="small"
				columns={getCostsCompareColumns() as any[]}
				dataSource={costsCompareFakeData}
				pagination={false}
				scroll={{
					y: firstTableHeight,
					x: "max-content",
				}}
			/>
			<Table
				className="showTable my-2"
				scroll={{
					y: secondTableHeight,
					x: "max-content",
				}}
				bordered
				size="small"
				columns={getCostsExpectedCompareColumns() as any[]}
				dataSource={costsExpectedCompareFakeData}
				pagination={false}
			/>
		</div>
	);
}
