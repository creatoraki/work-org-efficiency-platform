import type { ListForWorkbenchRes } from "#src/api/work-bench";
import { undoPublishFlow } from "#src/api/work-bench";
import RightArrowIcon from "#src/assets/small-icons/work-bench/chevron-right.double.svg?react";
import OrganizationManagementIcon from "#src/assets/small-icons/work-bench/organizationManagement.svg?react";
import StrategyIcon from "#src/assets/small-icons/work-bench/strategy.svg?react";
import WorkforceIcon from "#src/assets/small-icons/work-bench/workforce.svg?react";
import { WaterDropTabs } from "#src/components/water-drop-tabs";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { WorkBenchTable } from "./workbench-table";

export interface TodoProps {
	className?: string;
	style?: React.CSSProperties;
}

interface TabHeaderProps {
	activeIdx: number;
	setActiveIdx: (idx: number) => void;
	subActiveIdx: number;
	setSubActiveIdx: (idx: number) => void;
	counts: Record<string, number>;
	totalCount: number;
}

function TabHeader({
	activeIdx,
	setActiveIdx,
	subActiveIdx,
	setSubActiveIdx,
	counts,
	totalCount,
}: TabHeaderProps) {
	const strategyCount = counts.strategySplit || 0;
	const workforceCount = counts.humanEfficiencySecond || 0;
	const orgCount = counts.organizationManage || 0;
	const humanEfficiencyGroupCount =
		counts.humanEfficiency || strategyCount + workforceCount + orgCount;

	const beingOpenCount = counts.beingOpen || 0;
	const militaryOrganizationCount = counts.militaryOrganization || 0;
	const recognizeTalentCount = counts.recognizeTalent || 0;
	const postMatchingGroupCount =
		counts.postMatching || beingOpenCount + militaryOrganizationCount + recognizeTalentCount;

	const tabs = [
		{ label: `全部(${totalCount}条)`, value: 0 },
		{ label: `人效管控(${humanEfficiencyGroupCount}条)`, value: 1 },
		{ label: `人岗匹配(${postMatchingGroupCount}条)`, value: 2 },
	];

	const subTabs1 = [
		{ label: `战略拆解(${strategyCount}条)`, value: 0, icon: StrategyIcon },
		{ label: `人效管控(${workforceCount}条)`, value: 1, icon: WorkforceIcon },
		{ label: `组织管理(${orgCount}条)`, value: 2, icon: OrganizationManagementIcon },
	];

	const subTabs2 = [
		{ label: `推心置腹(${beingOpenCount}条)`, value: 0, icon: StrategyIcon },
		{ label: `排兵布阵(${militaryOrganizationCount}条)`, value: 1, icon: WorkforceIcon },
		{
			label: `慧眼识珠(${recognizeTalentCount}条)`,
			value: 2,
			icon: OrganizationManagementIcon,
		},
	];

	const currentSubTabs = activeIdx === 1 ? subTabs1 : activeIdx === 2 ? subTabs2 : [];

	return (
		<div className="flex flex-col">
			<WaterDropTabs
				tabs={tabs}
				activeIdx={activeIdx}
				onChange={setActiveIdx}
				layoutId="blue"
			/>
			<AnimatePresence>
				{(activeIdx === 1 || activeIdx === 2) && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="flex-shrink-0 overflow-hidden"
					>
						<div
							className="box-border flex w-full items-center rounded-t-lg border-x border-t border-gray-200 bg-white pt-2"
							style={{ borderTop: "none" }}
						>
							{currentSubTabs.map((tab: any, index) => (
								<div
									key={tab.value}
									className="relative flex h-full min-w-0 flex-1 items-center justify-center px-3"
								>
									<div
										className="group relative flex h-8 w-full cursor-pointer items-center justify-center rounded"
										onClick={() => setSubActiveIdx(tab.value)}
									>
										{/* Inactive Background */}
										<motion.div
											initial={false}
											animate={{
												opacity: subActiveIdx === tab.value ? 0 : 1,
											}}
											transition={{ duration: 0.2 }}
											className="absolute inset-0 z-0 rounded border border-[#e4e7ed] bg-[#f5f7fa] transition-colors duration-150 group-hover:border-blue-300 group-hover:bg-blue-50/30"
										/>

										{/* Active Background */}
										{subActiveIdx === tab.value && (
											<motion.div
												layoutId="subTabActive"
												className="absolute inset-0 z-0 rounded border border-blue-500 bg-blue-50/10"
												transition={{
													type: "spring",
													bounce: 0.2,
													duration: 0.6,
												}}
											/>
										)}

										{/* Content */}
										<div
											className={`relative z-10 flex w-full items-center justify-center overflow-hidden transition-colors duration-200 ${subActiveIdx === tab.value ? "text-blue-500" : "text-gray-600 group-hover:text-blue-500"}`}
										>
											<tab.icon
												className="mr-2 h-[18px] w-[18px] flex-shrink-0"
												style={{
													transform: "translateY(-1px)",
												}}
											/>
											<span
												className="min-w-0 truncate text-sm font-medium"
												title={tab.label}
											>
												{tab.label}
											</span>
										</div>
									</div>
									{index < currentSubTabs.length - 1 && (
										<div className="absolute right-0 top-1/2 z-20 -translate-y-1/3 translate-x-2/3">
											<RightArrowIcon className="h-8 w-8 text-gray-400" />
										</div>
									)}
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function TodoComponent({ className = "", style }: TodoProps) {
	const [activeIdx, setActiveIdx] = useState(0);
	const [subActiveIdx, setSubActiveIdx] = useState(0);
	const [data, setData] = useState<ListForWorkbenchRes | null>(null);
	const [loading, setLoading] = useState(false);
	const [backlogTitle, setBacklogTitle] = useState("");
	const [initialCounts, setInitialCounts] = useState<Record<string, number>>({});
	const [totalCount, setTotalCount] = useState(0);

	// Fetch initial counts (all data) once on mount
	useEffect(() => {
		const fetchInitialCounts = async () => {
			try {
				const res = await undoPublishFlow({});
				if (res.data) {
					const map: Record<string, number> = {};
					const traverse = (list: any[]) => {
						list.forEach((item) => {
							map[item.businessType] = item.count;
							if (item.child && item.child.length > 0) {
								traverse(item.child);
							}
						});
					};
					if (res.data.businessTypeCountList) {
						traverse(res.data.businessTypeCountList);
					}
					setInitialCounts(map);
					setTotalCount(res.data.count);
				}
			} catch (e) {
				console.error("Failed to fetch initial counts", e);
			}
		};
		fetchInitialCounts();
	}, []);

	const businessType = useMemo(() => {
		if (activeIdx === 0) return undefined;
		if (activeIdx === 1) {
			if (subActiveIdx === 0) return "strategySplit";
			if (subActiveIdx === 1) return "humanEfficiencySecond";
			if (subActiveIdx === 2) return "organizationManage";
		}
		if (activeIdx === 2) {
			if (subActiveIdx === 0) return "beingOpen";
			if (subActiveIdx === 1) return "militaryOrganization";
			if (subActiveIdx === 2) return "recognizeTalent";
		}
		return undefined;
	}, [activeIdx, subActiveIdx]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const requestParams = { businessType, backLogTitle: backlogTitle };
				const res = await undoPublishFlow(requestParams);
				if (res.data) {
					setData(res.data);
				}
			} catch (e) {
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [businessType, backlogTitle]);

	const counts = useMemo(() => {
		// Merge initial counts with current data counts to ensure updates are reflected
		const currentMap: Record<string, number> = { ...initialCounts };

		if (data?.businessTypeCountList) {
			const traverse = (list: any[]) => {
				list.forEach((item) => {
					currentMap[item.businessType] = item.count;
					if (item.child && item.child.length > 0) {
						traverse(item.child);
					}
				});
			};
			traverse(data.businessTypeCountList);
		}

		return currentMap;
	}, [initialCounts, data]);

	return (
		<div
			className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden shadow-sm ${className}`}
			style={{
				border: "1px solid rgba(255, 255, 255, 1)",
				...style,
			}}
		>
			<TabHeader
				activeIdx={activeIdx}
				setActiveIdx={setActiveIdx}
				subActiveIdx={subActiveIdx}
				setSubActiveIdx={setSubActiveIdx}
				counts={counts}
				totalCount={data?.count ?? totalCount}
			/>
			<div className="relative min-h-0 flex-1 overflow-hidden">
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={`${activeIdx}-${subActiveIdx}`}
						initial={{ x: 40, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: -40, opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
						className="absolute inset-0"
					>
						<WorkBenchTable
							className={`h-full ${activeIdx === 1 || activeIdx === 2 ? "rounded-t-none border-t-0" : ""}`}
							todoList={data?.undoBacklogList || []}
							doneList={data?.doneBacklogList || []}
							counts={{ todo: data?.undoCount || 0, done: data?.doneCount || 0 }}
							loading={loading}
							onSearch={setBacklogTitle}
						/>
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}
