import DataDeclaration from "#src/assets/svg/data-declaration.svg?react";
import { SectionTitle } from "#src/components";
import { Progress, Table, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useStructure } from "../store";
import { fakeData, jobColor } from "./config";
import "./index.css";

const NormalClassName = "text-10 md:text-xs whitespace-nowrap";

export default function ProjComplianceDistribution() {
	const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);
	const containerRef = useRef<HTMLDivElement>(null);
	const { structureTitle } = useStructure();

	// 动态计算表格高度
	useEffect(() => {
		const calculateTableHeight = () => {
			if (!containerRef.current) return;

			const container = containerRef.current;
			// 获取容器的实际内容区域高度（已减去 padding）
			const containerHeight = container.clientHeight;

			// 获取上方固定元素的实际高度
			const sectionTitle = container.querySelector(".section-title-container");

			let fixedHeight = 0;
			if (sectionTitle) fixedHeight += sectionTitle.clientHeight;

			// 获取表格的 marginTop
			const tableElement = container.querySelector(".proj-compliance-table");
			const computedStyle = tableElement ? window.getComputedStyle(tableElement) : null;
			const marginTop = computedStyle ? Number.parseFloat(computedStyle.marginTop) : 0;

			// 计算表格区域的总可用高度
			// 容器总高度 - 固定元素高度 - 表格的 marginTop
			const tableTotalHeight = containerHeight - fixedHeight - marginTop;

			// 动态获取表头高度（会根据字体大小变化）
			const tableHeader = container.querySelector(".proj-compliance-table .ant-table-thead");
			const tableHeaderHeight = tableHeader ? tableHeader.clientHeight : 39;

			// 计算滚动区域高度（表格总高度 - 表头高度 - 额外缓冲）
			// 额外缓冲 100px 确保最后一条数据能完整显示
			let scrollY = Math.floor(tableTotalHeight - tableHeaderHeight - 100);

			// 确保至少显示两行数据
			if (scrollY < 80) {
				scrollY = 80;
			}

			setTableScrollY(scrollY > 0 ? scrollY : undefined);
		};

		// 初始计算（多次延迟确保DOM完全渲染）
		setTimeout(() => {
			calculateTableHeight();
		}, 100);
		setTimeout(() => {
			calculateTableHeight();
		}, 300);
		setTimeout(() => {
			calculateTableHeight();
		}, 500);

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

	// 额外的监听，确保表格渲染后重新计算
	useEffect(() => {
		if (tableScrollY !== undefined) {
			const calculateTableHeight = () => {
				if (!containerRef.current) return;

				const container = containerRef.current;
				const containerHeight = container.clientHeight;

				const sectionTitle = container.querySelector(".section-title-container");

				let fixedHeight = 0;
				if (sectionTitle) fixedHeight += sectionTitle.clientHeight;

				const tableTotalHeight = containerHeight - fixedHeight - 8;

				const tableHeader = container.querySelector(
					".proj-compliance-table .ant-table-thead",
				);
				const tableHeaderHeight = tableHeader ? tableHeader.clientHeight : 39;

				const tableRow = container.querySelector(
					".proj-compliance-table .ant-table-tbody tr",
				);
				const rowHeight = tableRow ? tableRow.clientHeight : 40;

				let scrollY = Math.floor(tableTotalHeight - tableHeaderHeight);

				const minScrollY = rowHeight;
				if (scrollY < minScrollY) {
					scrollY = minScrollY;
				}

				setTableScrollY(scrollY > 0 ? scrollY : undefined);
			};

			setTimeout(() => {
				calculateTableHeight();
			}, 100);
		}
	}, [tableScrollY]);
	const getPercentText = (percent: number) => {
		return (
			<span
				className={NormalClassName}
				style={{ color: percent > 60 ? "#14B968" : "#F5222D" }}
			>
				{percent?.toFixed(2)}%
			</span>
		);
	};
	const getColumns = () => {
		return [
			{
				title: <span className={NormalClassName}>工种</span>,
				key: "type",
				dataIndex: "type",
				width: 130,
				// fixed: "left",
				render: (value: string) => {
					const item = jobColor?.[value] || { bg: "#F4EEFE", color: "#A174F6" };
					return (
						<div className={`flex items-center justify-start ${NormalClassName} `}>
							<span
								className="mr-0.5 flex h-6 w-6 items-center justify-center"
								style={{
									backgroundColor: item.bg,
									color: item.color,
									borderRadius: "50%",
								}}
							>
								{value?.substring(0, 1)}
							</span>
							<span>{value}</span>
						</div>
					);
				},
			},
			{
				title: <span className={NormalClassName}>达标率</span>,
				dataIndex: "progress",
				key: "progress",
				// fixed: "left",
				width: 160,

				render: (value: any) => {
					return (
						<Progress
							percent={value}
							strokeColor={value > 60 ? "#14B968" : "#F5222D"}
							format={getPercentText as any}
						/>
					);
				},
			},
			{
				title: <span className={NormalClassName}>达标项目数(个)</span>,
				dataIndex: "passedProjects",
				key: "passedProjects",
				// fixed: "left",
				render: (value: any) => <span className={NormalClassName}>{value}</span>,
			},
			{
				title: <span className={NormalClassName}>不达标项目数(个)</span>,
				dataIndex: "failedProjects",
				key: "failedProjects",
				// fixed: "left",
				render: (value: any) => <span className={NormalClassName}>{value}</span>,
			},
		];
	};
	return (
		<div
			ref={containerRef}
			className="flex min-h-0 w-full flex-col overflow-hidden rounded-md bg-[#FFFFFF] p-4"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<SectionTitle
				title={
					<div className="relative">
						<span className="whitespace-nowrap text-sm font-medium md:text-base">
							X月各工种项目达标分布
							{structureTitle ? `-${structureTitle}` : ""}
						</span>
						<Tooltip placement="top" title="123">
							<DataDeclaration className="absolute top-0 cursor-pointer" />
						</Tooltip>
					</div>
				}
			/>
			{/* <div className="border h-full w-full flex-1 min-h-0"></div> */}
			<Table
				className="proj-compliance-table h-full min-h-0 w-full flex-1"
				style={{
					marginTop: 8,
					boxSizing: "border-box",
				}}
				bordered
				size="small"
				// onChange={(pag, fil, sorter) => tableChange(pag, fil, sorter)}
				columns={getColumns() as any[]}
				dataSource={fakeData}
				scroll={{
					y: tableScrollY,
					x: "100%",
				}}
				pagination={false}
			/>{" "}
		</div>
	);
}
