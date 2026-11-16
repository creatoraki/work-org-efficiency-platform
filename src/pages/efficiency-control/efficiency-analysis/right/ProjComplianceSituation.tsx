import budget from "#src/assets/svg/budget.svg";
import checkCircle from "#src/assets/svg/check-circle.svg";
import DataDeclaration from "#src/assets/svg/data-declaration.svg?react";
import exceedBudget from "#src/assets/svg/exceed-budget.svg";
import expend from "#src/assets/svg/expend.svg";
import close from "#src/assets/svg/red-close.svg";
import { BasicButton, SectionTitle, SubTitle } from "#src/components";

import useInitEcharts from "#src/hooks/use-echarts/useInitEcharts";
import { UploadOutlined } from "@ant-design/icons";
import { Select, Table, Tooltip } from "antd";

import { useEffect, useRef, useState } from "react";
import { Target } from "../middle/ProjCostCompare";
import { useOrgStore, useStructure } from "../store";
import ProjCostRank from "./components/ProjCostRank";
import { fakeData, fakeGroupData, gaugeOtion, getColumns, getGroupColumns } from "./config";

import "./index.css";

export default function ProjComplianceSituation() {
	const [isexceedBudget] = useState(false);
	const complianceRateRef = useRef<any>();
	const [openProjCostRank, setOpenProjCostRank] = useState(false);
	const [clickRecord, setClickRecord] = useState<any | null>(null);
	const [tableSorter] = useState<{ field?: string; order?: string }>({
		field: "revenue_amount",
		order: "descend",
	});
	const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);
	const containerRef = useRef<HTMLDivElement>(null);
	const sales_finish_rate = 80;
	const { structure, structureTitle } = useStructure();
	const { org_tag } = useOrgStore();

	// 动态计算表格高度
	useEffect(() => {
		const calculateTableHeight = () => {
			if (!containerRef.current) return;

			const container = containerRef.current;
			// 获取容器的实际内容区域高度（已减去 padding）
			const containerHeight = container.clientHeight;

			// 获取上方固定元素的实际高度
			const sectionTitle = container.querySelector(".section-title-container");
			const firstSubTitle = container.querySelector(".section-title-container + div.my-2");
			const budgetOverview = container.querySelector(".border.rounded");
			const progressContainer = container.querySelector(".w-full.h-auto.flex");
			const secondSubTitle = container.querySelector(".-mt-2.my-2");

			let fixedHeight = 0;
			if (sectionTitle) fixedHeight += sectionTitle.clientHeight;
			if (firstSubTitle) fixedHeight += firstSubTitle.clientHeight;
			if (budgetOverview) fixedHeight += budgetOverview.clientHeight + 8; // 8px for margin-top
			if (progressContainer) fixedHeight += progressContainer.clientHeight;
			if (secondSubTitle) fixedHeight += secondSubTitle.clientHeight;

			// 计算表格区域的总可用高度
			// 容器总高度 - 固定元素高度
			const tableTotalHeight = containerHeight - fixedHeight;

			// 动态获取表头高度（会根据字体大小变化）
			const tableHeader = container.querySelector(".showTable .ant-table-thead");
			const tableHeaderHeight = tableHeader ? tableHeader.clientHeight : 39;

			// 动态获取单行数据高度（会根据字体大小变化）
			const tableRow = container.querySelector(".showTable .ant-table-tbody tr");
			const rowHeight = tableRow ? tableRow.clientHeight : 40;

			// 计算滚动区域高度（表格总高度 - 表头高度）
			let scrollY = Math.floor(tableTotalHeight - tableHeaderHeight);

			// 确保至少显示一行数据（考虑字体大小变化后的行高）
			const minScrollY = rowHeight;
			if (scrollY < minScrollY) {
				scrollY = minScrollY;
			}

			setTableScrollY(scrollY > 0 ? scrollY : undefined);
		};

		// 初始计算（延迟确保DOM完全渲染）
		setTimeout(() => {
			calculateTableHeight();
		}, 50);

		// 监听窗口大小变化
		const handleResize = () => {
			// 多次延迟计算，确保在字体大小和布局变化后DOM完全渲染
			setTimeout(() => {
				calculateTableHeight();
			}, 50);
			requestAnimationFrame(() => {
				calculateTableHeight();
			});
			setTimeout(() => {
				calculateTableHeight();
			}, 150);
		};

		window.addEventListener("resize", handleResize);

		// 使用 ResizeObserver 监听容器大小变化
		let resizeObserver: ResizeObserver | null = null;
		if (containerRef.current) {
			resizeObserver = new ResizeObserver(() => {
				// 多次延迟计算，确保在字体大小变化后DOM完全渲染
				setTimeout(() => {
					calculateTableHeight();
				}, 50);
				requestAnimationFrame(() => {
					calculateTableHeight();
				});
			});
			resizeObserver.observe(containerRef.current);
		}

		// 监听全屏状态变化
		const handleFullscreenChange = () => {
			// 多次延迟计算，确保在全屏切换后字体和布局完全更新
			setTimeout(() => {
				calculateTableHeight();
			}, 100);
			setTimeout(() => {
				requestAnimationFrame(() => {
					calculateTableHeight();
				});
			}, 300);
			setTimeout(() => {
				calculateTableHeight();
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
	useInitEcharts({
		ref: complianceRateRef,
		options: {
			series: {
				...gaugeOtion,
				data: [
					{
						value: 80,
						detail: {
							valueAnimation: false,
							offsetCenter: [0, -30],
							formatter() {
								return "{target|" + "达标率(%)" + "}";
							},
						},
					},
					{
						value: 80,
						detail: {
							offsetCenter: [0, -2],
							formatter(value: number) {
								const str = Number.isNaN(value) ? "/" : value;
								const lable = Number.isNaN(value) ? "null" : "value";
								return `{${lable}| ${str} }`;
							},
							valueAnimation: false,
						},
					},
				],
			},
		} as any,
	});
	const handleClickArea = (record: any) => {
		setClickRecord(record);
		setOpenProjCostRank(true);
	};
	return (
		<div
			ref={containerRef}
			className="flex min-w-0 flex-col overflow-hidden rounded-md bg-[#FFFFFF] p-4"
			style={{ boxShadow: "0px 0px 12px 0px #0000001F " }}
		>
			<SectionTitle
				title={
					<span className="text-sm font-medium md:text-base">
						项目达标情况
						{structureTitle ? `-${structureTitle}` : ""}
					</span>
				}
			/>
			<SubTitle
				className="my-2"
				title={
					<div className="relative">
						<span className="font-medium">X月项目成本总览</span>
						<Tooltip placement="top" title="123">
							<DataDeclaration className="absolute top-0 cursor-pointer" />
						</Tooltip>
					</div>
				}
			/>

			<div className="around relative flex h-auto w-full flex-shrink-0 items-center justify-between overflow-hidden rounded border px-2.5 py-1.5">
				<div
					className="text-3.5 w-atuo absolute -top-6 right-0 flex h-6 items-center justify-center bg-[#FEE4E6] px-1.5 py-1 text-[#F5222D]"
					style={{
						borderRadius: "4px 4px 0 0",
						display: isexceedBudget ? "absolute" : "none",
					}}
				>
					<img src={exceedBudget} className="mr-0.5" />
					<span>超预算</span>
				</div>
				<Target img={budget} title="月度预算(万元)" number="8,360.00" />
				<div className="mx-3 whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] md:px-3">
					减去
				</div>

				<Target img={expend} title="实际支出(万元)" number="9,360.00" />
				<div className="mx-3 whitespace-nowrap rounded-full bg-[#EBEEF5] px-3 py-0.5 text-center text-xs text-[#606266] md:px-3">
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
			<div className="my-6 flex h-auto w-full [@media(max-height:1000px)]:my-4">
				<div className="flex h-auto w-[55%] flex-col gap-2">
					<Target
						title="项目总数(个)"
						number="4,679"
						style={{ alignItems: "flex-start" }}
					/>

					<div className="flex h-4 w-full gap-0.5">
						<div
							className="h-100% rounded-2xl"
							style={{
								width:
									sales_finish_rate === undefined
										? "0%"
										: `${sales_finish_rate}%`,
								background: "linear-gradient(90deg, #0075FF 0%, #26CFFF 100%)",
							}}
						></div>
						<div
							className="h-100% rounded-xl"
							style={{
								width:
									sales_finish_rate === undefined
										? "100%"
										: `${100 - sales_finish_rate}%`,
								background: "linear-gradient(90deg, #EDE7E7 0%, #D4D4D4 100%)",
							}}
						></div>
					</div>
					<div className="flex w-full justify-between">
						<Target
							title="达标项目数(个)"
							number="30,915"
							style={{ alignItems: "flex-start" }}
						/>
						<Target
							title="不达标项目数(个)"
							number="4,885"
							style={{ alignItems: "flex-end" }}
						/>
					</div>
				</div>
				<div className="h-[100%] w-[45%]">
					<div ref={complianceRateRef} className="h-[100%] w-full"></div>
				</div>
			</div>
			<div className="mb-2 flex h-auto w-full items-center justify-between">
				<div className="flex h-8 w-auto flex-row items-center justify-center gap-2">
					<SubTitle title="X月项目成本排名" />
					<>
						{structure === 4 ? (
							<>
								<Select
									placeholder={<span className="text-xs">工种</span>}
									style={{ width: 120, height: 28 }}
									options={[]}
								/>
								<Select
									placeholder={<span className="text-xs">物业类型</span>}
									style={{ width: 120, height: 28 }}
									options={[]}
								/>
								<Select
									placeholder={<span className="text-xs">服务等级</span>}
									style={{ width: 120, height: 28 }}
									options={[]}
									// empty={<span className="text-xs">暂无数据</span>}
								/>
							</>
						) : (
							<></>
						)}
					</>
				</div>

				<BasicButton
					type="default"
					key="import"
					icon={<UploadOutlined />}
					style={{ height: 28 }}
				>
					<span className="text-xs">导出</span>
				</BasicButton>
			</div>

			<div className="min-w-0 flex-1 overflow-hidden">
				<Table
					className="showTable"
					bordered
					size="small"
					// onChange={(pag, fil, sorter) => tableChange(pag, fil, sorter)}
					columns={
						org_tag === "GROUP"
							? getGroupColumns(tableSorter, handleClickArea)
							: getColumns(tableSorter, handleClickArea)
					}
					dataSource={org_tag === "GROUP" ? fakeGroupData : fakeData}
					scroll={{
						y: tableScrollY,
					}}
					pagination={false}
					tableLayout="fixed"
				/>
			</div>
			<ProjCostRank
				open={openProjCostRank}
				setOpen={setOpenProjCostRank}
				record={clickRecord}
			/>
		</div>
	);
}
