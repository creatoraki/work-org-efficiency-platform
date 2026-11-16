import RightArrowIcon from "#src/assets/small-icons/work-bench/chevron-right.double.svg?react";
import WarningIcon from "#src/assets/small-icons/work-bench/warning.svg?react";
import WorkforceIcon from "#src/assets/small-icons/work-bench/workforce.svg?react";
import { WaterDropTabs } from "#src/components/water-drop-tabs/index.js";
import { Input, Typography } from "antd";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

export interface WarningMessageProps {
	className?: string;
	style?: React.CSSProperties;
}
const listData = [
	{
		id: 1,
		title: "杭州区域公司-杭东地区-杭东项目群- 浙江·杭州·亲和雅园-目标拆解流程已发起，请审核！",
		status: "高",
		text: "7天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 2,
		title: "杭州区域公司-杭东地区-杭东项目群- 浙江·杭州·亲和雅园-目标拆解流程已发起，请审核！",
		status: "高",
		text: "7天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 3,
		title: "杭州区域公司-杭东地区-杭东项目群- 浙江·杭州·亲和雅园-目标拆解流程已发起，请审核！",
		status: "中",
		text: "7天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 4,
		title: "杭州区域公司-杭东地区-杭东项目群- 浙江·杭州·亲和雅园-目标拆解流程已发起，请审核！",
		status: "中",
		text: "7天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 5,
		title: "杭州区域公司-杭东地区-杭东项目群- 浙江·杭州·亲和雅园-目标拆解流程已发起，请审核！",
		status: "低",
		text: "7天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 6,
		title: "上海区域公司-浦东片区-星河湾- 预算调整申请已提交，请尽快审批。",
		status: "高",
		text: "5天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 7,
		title: "华东事业部-苏州中心-云栖公馆- 采购合同变更流程待审核。",
		status: "中",
		text: "4天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 8,
		title: "华中事业部-武汉片区-江南里- 人员编制调整申请待确认。",
		status: "低",
		text: "2天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 9,
		title: "华南事业部-深圳片区-湖畔名邸- 月度经营指标复核待处理。",
		status: "中",
		text: "6天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 10,
		title: "杭州区域公司-钱江新城- 项目结算审批流程已超期，请跟进。",
		status: "高",
		text: "9天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 11,
		title: "华北事业部-北京片区-春江花月- 绩效评审流程待确认。",
		status: "低",
		text: "3天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 12,
		title: "华西事业部-成都片区-望江府- 会议纪要审批待处理。",
		status: "中",
		text: "5天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 13,
		title: "华东事业部-南京片区-晶水家园- 供应商准入审批待完成。",
		status: "低",
		text: "1天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 14,
		title: "华中事业部-长沙片区-云水天府- 关键岗位空缺补录待确认。",
		status: "中",
		text: "4天未处理",
		statusColor: "text-red-500",
	},
	{
		id: 15,
		title: "华南事业部-广州片区-铂金名筑- 风险提示整改方案待审批。",
		status: "高",
		text: "8天未处理",
		statusColor: "text-red-500",
	},
];
interface TabHeaderProps {
	activeIdx: number;
	setActiveIdx: (idx: number) => void;
}

function TabHeader({ activeIdx, setActiveIdx }: TabHeaderProps) {
	const tabs = [
		{ label: "全部(15条)", value: 0 },
		{ label: "人效管控(10条)", value: 1 },
		{ label: "人岗匹配(5条)", value: 2 },
	];

	const subTabs = [
		{ label: "经营预警(6条)", value: 0, icon: WarningIcon },
		{ label: "人效管控(3条)", value: 1, icon: WorkforceIcon },
	];
	const [subActiveIdx, setSubActiveIdx] = useState(0);

	return (
		<div className="flex flex-col">
			<WaterDropTabs
				tabs={tabs}
				activeIdx={activeIdx}
				onChange={setActiveIdx}
				layoutId="red"
				color="#d8262f"
			/>
			<AnimatePresence>
				{activeIdx === 1 && (
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
							{subTabs.map((tab: any, index) => (
								<div
									key={tab.value}
									className="relative flex h-full min-w-0 flex-1 items-center justify-center px-3"
								>
									<div
										className="relative flex h-8 w-full cursor-pointer items-center justify-center rounded"
										onClick={() => setSubActiveIdx(tab.value)}
									>
										{/* Inactive Background */}
										<motion.div
											initial={false}
											animate={{
												opacity: subActiveIdx === tab.value ? 0 : 1,
											}}
											transition={{ duration: 0.2 }}
											className="absolute inset-0 z-0 rounded border border-[#e4e7ed] bg-[#f5f7fa]"
										/>

										{/* Active Background */}
										{subActiveIdx === tab.value && (
											<motion.div
												layoutId="subTabActiveRed"
												className="absolute inset-0 z-0 rounded border border-[#d8262f] bg-[#d8262f]/10"
												transition={{
													type: "spring",
													bounce: 0.2,
													duration: 0.6,
												}}
											/>
										)}

										{/* Content */}
										<div
											className={`relative z-10 flex w-full items-center justify-center overflow-hidden transition-colors duration-200 ${subActiveIdx === tab.value ? "text-[#d8262f]" : "text-gray-600"}`}
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
									{index < subTabs.length - 1 && (
										<div className="absolute -right-4 top-1/2 z-20 -translate-y-1/3 translate-x-1">
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

export function WarningMessage({ className = "", style }: WarningMessageProps) {
	const [search, setSearch] = useState("");
	const [activeIdx, setActiveIdx] = useState(0);

	return (
		<div
			className={`flex min-h-0 w-full flex-1 flex-col rounded-lg bg-white shadow-sm ${className}`}
			style={style}
		>
			<TabHeader activeIdx={activeIdx} setActiveIdx={setActiveIdx} />
			<div
				className={`flex min-h-0 flex-1 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${activeIdx === 1 ? "rounded-t-none border-t-0" : ""}`}
			>
				{/* 顶部操作区 */}
				<div className="mb-2 flex w-full flex-shrink-0 items-center justify-between">
					<div className="flex flex-1 items-center gap-2">
						<div className="relative flex flex-1 items-center">
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="搜索关键词"
								allowClear
								className="flex-1"
								onPressEnter={(e: any) => setSearch(e.target?.value)}
							/>
							<button
								type="button"
								className="absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-gray-400 hover:text-blue-500"
								onClick={() => setSearch(search)}
								tabIndex={-1}
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
									<polygon points="5,0.5 8.2,4.6 1.8,4.6" />
									<polygon points="1.8,7.4 8.2,7.4 5,11.5" />
								</svg>
							</span>
						</div>
					</div>
				</div>
				{/* 列表区 */}
				<div className="hide-scrollbar relative min-h-0 flex-1 divide-y overflow-y-auto border-b border-gray-200">
					{listData.map((item) => {
						// 预警级别与圆点颜色映射
						let dotColor = "bg-gray-400";
						if (item.status === "高") dotColor = "bg-red-500";
						else if (item.status === "中") dotColor = "bg-[#FFAA00]";
						else if (item.status === "低") dotColor = "bg-green-500";
						return (
							<div
								key={item.id}
								className="flex items-center border-x border-y border-gray-200 py-1.5 text-sm"
							>
								<span className="flex w-[15%] flex-shrink-0 items-center px-2">
									<span
										className={`mr-1 inline-block h-2 w-2 rounded-full ${dotColor} flex-shrink-0`}
									></span>
									<Typography.Text
										ellipsis={{ tooltip: true }}
										className="text-sm text-gray-500"
									>
										{item.status}
									</Typography.Text>
								</span>
								<span className="flex min-w-0 flex-1 px-2 text-gray-500">
									<Typography.Text
										ellipsis={{ tooltip: true }}
										className="text-sm text-gray-500"
									>
										{item.title}
									</Typography.Text>
								</span>
								<span
									className={`px-2 font-medium ${item.statusColor} flex w-[20%] flex-shrink-0 justify-end text-right`}
								>
									<Typography.Text
										ellipsis={{ tooltip: true }}
										className={`${item.statusColor} text-sm`}
									>
										{item.text}
									</Typography.Text>
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
