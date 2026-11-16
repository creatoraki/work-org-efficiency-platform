import type {
	JobAtlasBenchmarkStandardItem,
	JobAtlasSalaryBandCell,
} from "#src/api/org-brain/job-atlas";
import type { SalaryBandTableRow } from "./job-atlas-table-utils";
import { cn } from "#src/utils";
import { DownOutlined } from "@ant-design/icons";
import { Drawer, Dropdown, Empty, Space, Table, Tabs, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	buildBenchmarkStandardComparisonTable,
	buildSalaryBandRows,
} from "./job-atlas-table-utils";

export interface JobAtlasBenchmarkOptionItem {
	label: string;
	value: number;
}

interface BenchmarkDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	loading: boolean;
	standardList?: JobAtlasBenchmarkStandardItem[];
	salaryBandList?: JobAtlasSalaryBandCell[];
	benchmarkOptions: JobAtlasBenchmarkOptionItem[];
	currentBenchmarkId?: number;
	onBenchmarkChange: (id: number) => void;
}

export function BenchmarkDetailDrawer(props: BenchmarkDetailDrawerProps) {
	const {
		open,
		onClose,
		loading,
		standardList,
		salaryBandList,
		benchmarkOptions,
		currentBenchmarkId,
		onBenchmarkChange,
	} = props;

	const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
	const benchmarkStandardTableContainerRef = useRef<HTMLDivElement | null>(null);
	const [benchmarkStandardTableScrollY, setBenchmarkStandardTableScrollY] = useState(0);

	const benchmarkSalaryBandTable = useMemo(
		() => buildSalaryBandRows(salaryBandList ?? []),
		[salaryBandList],
	);
	const benchmarkStandardTable = useMemo(
		() => buildBenchmarkStandardComparisonTable(standardList ?? []),
		[standardList],
	);
	const currentBenchmarkName =
		benchmarkOptions.find((item) => item.value === currentBenchmarkId)?.label || "基准岗";

	useEffect(() => {
		const container = benchmarkStandardTableContainerRef.current;
		if (!open || !container || typeof ResizeObserver === "undefined") {
			return;
		}

		let rafId = 0;
		const updateScrollY = () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
			rafId = requestAnimationFrame(() => {
				const headerEl = container.querySelector(".ant-table-header") as HTMLElement | null;
				const headerHeight = headerEl?.offsetHeight ?? 55;
				const borderCompensation = 2;
				const nextY = Math.floor(
					container.clientHeight - headerHeight - borderCompensation,
				);
				setBenchmarkStandardTableScrollY(nextY > 0 ? nextY : 0);
			});
		};

		updateScrollY();
		const observer = new ResizeObserver(updateScrollY);
		observer.observe(container);
		const mutationObserver = new MutationObserver(updateScrollY);
		mutationObserver.observe(container, { childList: true, subtree: true, attributes: true });
		window.addEventListener("resize", updateScrollY);

		return () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
			}
			observer.disconnect();
			mutationObserver.disconnect();
			window.removeEventListener("resize", updateScrollY);
		};
	}, [open, standardList]);

	return (
		<Drawer
			title={
				<div className="flex items-center">
					<Dropdown
						menu={{
							items: benchmarkOptions.map((item) => ({
								key: String(item.value),
								label: `${item.label}任职标准`,
							})),
							onClick: ({ key }) => onBenchmarkChange(Number(key)),
						}}
						disabled={benchmarkOptions.length === 0}
						open={titleDropdownOpen}
						onOpenChange={setTitleDropdownOpen}
					>
						<span
							className="inline-flex cursor-pointer"
							onClick={(e) => e.preventDefault()}
						>
							<Space>
								<Typography.Text className="text-xl font-medium">{`${currentBenchmarkName}任职标准`}</Typography.Text>
								<DownOutlined
									className={cn(
										"transition-transform duration-200 ease-out",
										titleDropdownOpen && "rotate-180",
									)}
								/>
							</Space>
						</span>
					</Dropdown>
				</div>
			}
			open={open}
			onClose={() => {
				setTitleDropdownOpen(false);
				onClose();
			}}
			width={1536}
			closable={{ placement: "end" }}
			destroyOnHidden
			styles={{
				body: {
					paddingTop: 0,
					paddingBottom: 0,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				},
			}}
		>
			<Tabs
				className={cn(
					"h-full min-h-0",
					"[&_.ant-tabs-nav]:mb-0",
					"[&_.ant-tabs-content-holder]:h-full [&_.ant-tabs-content-holder]:min-h-0",
					"[&_.ant-tabs-content]:h-full [&_.ant-tabs-content]:py-5 [&_.ant-tabs-tabpane]:h-full",
				)}
				items={[
					{
						key: "standard",
						label: "任职标准",
						children: (
							<div
								ref={benchmarkStandardTableContainerRef}
								className="h-full min-h-0 overflow-hidden"
							>
								<Table
									rowKey="key"
									size="small"
									loading={loading}
									tableLayout="fixed"
									columns={benchmarkStandardTable.columns}
									dataSource={benchmarkStandardTable.dataSource}
									pagination={false}
									scroll={{ y: benchmarkStandardTableScrollY }}
									bordered
									className="custom-scrollbar h-full [&_.ant-table-content]:overflow-x-hidden [&_.ant-table-thead>tr>th]:!bg-[#FFFFFF] [&_thead.ant-table-thead>tr:nth-child(2)]:hidden"
									locale={{ emptyText: <Empty description="暂无任职标准" /> }}
								/>
							</div>
						),
					},
					{
						key: "salary-band",
						label: "薪资带宽",
						children: (
							<Table<SalaryBandTableRow>
								rowKey="key"
								columns={benchmarkSalaryBandTable.columns}
								dataSource={benchmarkSalaryBandTable.rows}
								pagination={false}
								bordered
								className="[&_.ant-table-thead>tr>th]:!bg-[#FFFFFF]"
							/>
						),
					},
				]}
			/>
		</Drawer>
	);
}
