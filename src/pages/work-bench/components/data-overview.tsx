import { Table } from "antd";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const GREEN_DOT = "rgba(20,185,104,1)";
const RED_DOT = "rgba(245,34,45,1)";

export interface DataOverviewProps {
	className?: string;
	style?: React.CSSProperties;
}

export function DataOverview({ className = "", style }: DataOverviewProps) {
	const leftTableWrapRef = useRef<HTMLDivElement>(null);
	const rightTableWrapRef = useRef<HTMLDivElement>(null);
	const [leftScrollY, setLeftScrollY] = useState(0);
	const [rightScrollY, setRightScrollY] = useState(0);

	useLayoutEffect(() => {
		const update = () => {
			if (leftTableWrapRef.current) setLeftScrollY(leftTableWrapRef.current.clientHeight);
			if (rightTableWrapRef.current) setRightScrollY(rightTableWrapRef.current.clientHeight);
		};
		update();
		const observer = new ResizeObserver(update);
		if (leftTableWrapRef.current) observer.observe(leftTableWrapRef.current);
		if (rightTableWrapRef.current) observer.observe(rightTableWrapRef.current);
		return () => observer.disconnect();
	}, []);

	const leftScroll = useMemo(() => ({ x: 400, y: leftScrollY || 1 }), [leftScrollY]);
	const rightScroll = useMemo(() => ({ x: 400, y: rightScrollY || 1 }), [rightScrollY]);
	// 左表数据，首行为平均线
	const leftData = [
		{
			key: "avg",
			name: "平均线",
			revenueRate: 91,
			costRate: 18,
			avgRevenue: 156000,
			isAvg: true,
		},
		{ key: 1, name: "亲和雅园", revenueRate: 92, costRate: 18, avgRevenue: 120000 },
		{ key: 2, name: "杭东项目群", revenueRate: 88, costRate: 20, avgRevenue: 110000 },
		{ key: 3, name: "翡翠城", revenueRate: 95, costRate: 15, avgRevenue: 130000 },
		{ key: 4, name: "西溪诚园", revenueRate: 85, costRate: 22, avgRevenue: 105000 },
		{ key: 5, name: "钱江新城", revenueRate: 98, costRate: 12, avgRevenue: 140000 },
		{ key: 6, name: "晶水家园", revenueRate: 92, costRate: 17, avgRevenue: 172000 },
		{ key: 7, name: "铂金名筑", revenueRate: 89, costRate: 18, avgRevenue: 193000 },
		{ key: 8, name: "云栖公馆", revenueRate: 87, costRate: 21, avgRevenue: 128000 },
		{ key: 9, name: "星河湾", revenueRate: 93, costRate: 16, avgRevenue: 165000 },
		{ key: 10, name: "江南里", revenueRate: 90, costRate: 19, avgRevenue: 148000 },
		{ key: 11, name: "春江花月", revenueRate: 96, costRate: 14, avgRevenue: 182000 },
		{ key: 12, name: "望江府", revenueRate: 84, costRate: 23, avgRevenue: 101000 },
		{ key: 13, name: "湖畔名邸", revenueRate: 91, costRate: 18, avgRevenue: 158000 },
		{ key: 14, name: "云水天府", revenueRate: 94, costRate: 16, avgRevenue: 176000 },
	];
	function getRandomDotColor() {
		return Math.random() > 0.5 ? GREEN_DOT : RED_DOT;
	}
	const leftColumns = [
		{
			title: "项目名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
			render: (_: any, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{record.name}</span>
				) : (
					<span className="text-gray-600">{record.name}</span>
				),
		},
		{
			title: "营收达成率",
			dataIndex: "revenueRate",
			key: "revenueRate",
			ellipsis: true,
			sorter: (a: any, b: any) => a.revenueRate - b.revenueRate,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}%</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}%</span>
					</span>
				),
		},
		{
			title: "人力成本占比",
			dataIndex: "costRate",
			key: "costRate",
			ellipsis: true,
			sorter: (a: any, b: any) => a.costRate - b.costRate,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}%</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}%</span>
					</span>
				),
		},
		{
			title: "人均营收",
			dataIndex: "avgRevenue",
			key: "avgRevenue",
			ellipsis: true,
			sorter: (a: any, b: any) => a.avgRevenue - b.avgRevenue,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}元</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}元</span>
					</span>
				),
		},
	];

	// 右表数据，首行为平均线
	const rightData = [
		{ key: "avg", name: "平均线", quitRate: 4.9, vacancyRate: 2.6, matchRate: 96, isAvg: true },
		{ key: 1, name: "亲和雅园", quitRate: 5.2, vacancyRate: 3.1, matchRate: 97 },
		{ key: 2, name: "杭东项目群", quitRate: 4.8, vacancyRate: 2.5, matchRate: 95 },
		{ key: 3, name: "翡翠城", quitRate: 4.5, vacancyRate: 2.0, matchRate: 98 },
		{ key: 4, name: "西溪诚园", quitRate: 6.0, vacancyRate: 3.5, matchRate: 94 },
		{ key: 5, name: "钱江新城", quitRate: 3.5, vacancyRate: 1.5, matchRate: 99 },
		{ key: 6, name: "晶水家园", quitRate: 4.2, vacancyRate: 2.2, matchRate: 96 },
		{ key: 7, name: "铂金名筑", quitRate: 5.6, vacancyRate: 3.0, matchRate: 95 },
		{ key: 8, name: "云栖公馆", quitRate: 4.9, vacancyRate: 2.6, matchRate: 94 },
		{ key: 9, name: "星河湾", quitRate: 3.8, vacancyRate: 1.8, matchRate: 98 },
		{ key: 10, name: "江南里", quitRate: 5.1, vacancyRate: 2.9, matchRate: 95 },
		{ key: 11, name: "春江花月", quitRate: 4.0, vacancyRate: 2.1, matchRate: 97 },
		{ key: 12, name: "望江府", quitRate: 6.3, vacancyRate: 3.6, matchRate: 93 },
		{ key: 13, name: "湖畔名邸", quitRate: 4.6, vacancyRate: 2.4, matchRate: 96 },
		{ key: 14, name: "云水天府", quitRate: 3.9, vacancyRate: 1.7, matchRate: 98 },
	];
	const rightColumns = [
		{
			title: "项目名称",
			dataIndex: "name",
			key: "name",
			ellipsis: true,
			render: (_: any, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{record.name}</span>
				) : (
					<span className="text-gray-600">{record.name}</span>
				),
		},
		{
			title: "离职率",
			dataIndex: "quitRate",
			key: "quitRate",
			ellipsis: true,
			sorter: (a: any, b: any) => a.quitRate - b.quitRate,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}%</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}%</span>
					</span>
				),
		},
		{
			title: "岗位空缺率",
			dataIndex: "vacancyRate",
			key: "vacancyRate",
			ellipsis: true,
			sorter: (a: any, b: any) => a.vacancyRate - b.vacancyRate,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}%</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}%</span>
					</span>
				),
		},
		{
			title: "人岗匹配率",
			dataIndex: "matchRate",
			key: "matchRate",
			ellipsis: true,
			sorter: (a: any, b: any) => a.matchRate - b.matchRate,
			render: (v: number, record: any) =>
				record.isAvg ? (
					<span className="font-bold">{v}%</span>
				) : (
					<span className="flex items-center truncate text-gray-600">
						<span
							className="mr-1 inline-block h-2 w-2 flex-shrink-0 rounded-full"
							style={{ background: getRandomDotColor() }}
						/>
						<span className="truncate">{v}%</span>
					</span>
				),
		},
	];

	return (
		<div
			className={`flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden lg:flex-row ${className}`}
			style={style}
		>
			{/* 左侧人效管控 */}
			<div className="flex min-w-0 flex-1 flex-col rounded-lg bg-transparent p-4 py-0 pl-0 shadow-sm">
				<div className="mb-2 text-sm font-medium">人效管控</div>
				<div ref={leftTableWrapRef} className="min-h-0 flex-1">
					<Table
						className="compact-table h-full"
						style={{ height: "100%" }}
						columns={leftColumns}
						dataSource={leftData}
						pagination={false}
						bordered
						size="small"
						scroll={leftScroll}
					/>
				</div>
			</div>
			{/* 右侧人岗匹配 */}
			<div className="flex min-w-0 flex-1 flex-col rounded-lg bg-transparent p-4 py-0 pl-2 pr-2 shadow-sm">
				<div className="mb-2 text-sm font-medium">人岗匹配</div>
				<div ref={rightTableWrapRef} className="min-h-0 flex-1">
					<Table
						className="compact-table h-full"
						style={{ height: "100%" }}
						columns={rightColumns}
						dataSource={rightData}
						pagination={false}
						bordered
						size="small"
						scroll={rightScroll}
					/>
				</div>
			</div>
		</div>
	);
}
