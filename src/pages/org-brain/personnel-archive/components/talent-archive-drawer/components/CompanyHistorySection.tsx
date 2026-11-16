import type { TalentArchiveCompanyHistoryItem } from "#src/api/org-brain/personnel-archive";

import ConcurrentIcon from "#src/assets/small-icons/talent-archive/concurrent.svg?react";
import TransferIcon from "#src/assets/small-icons/talent-archive/transfer.svg?react";
import { SectionTitle } from "#src/components";
import { RightOutlined } from "@ant-design/icons";
import { Button, Spin, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";

import {
	getCompanyHistoryDepartment,
	getCompanyHistoryJob,
	getCompanyHistoryPosition,
	getCompanyHistoryPrimaryDepartment,
	getCompanyHistoryTypeLabel,
} from "../company-history";
import { ConcurrentDetailModal, TransferDetailModal } from "../modals";
import { SectionEmptyHint } from "./SectionEmptyHint";

const { Text, Link } = Typography;

// 一条公司经历时间轴的最小高度，供加载态和完成态共用以稳定后续区块位置。
const COMPANY_HISTORY_MIN_HEIGHT_CLASS = "min-h-[169px]";

/** 时间轴详情弹窗状态。 */
interface DetailModalState {
	/** 是否打开调岗详情弹窗 */
	isTransferOpen: boolean;
	/** 是否打开兼岗详情弹窗 */
	isConcurrentOpen: boolean;
	/** 弹窗标题 */
	title: string;
	/** 当前选中项列表 */
	selectedItems: TalentArchiveCompanyHistoryItem[];
}

interface CompanyHistorySectionProps {
	/** 公司经历数据 */
	data: TalentArchiveCompanyHistoryItem[];
	/** 是否加载中 */
	loading?: boolean;
	/** 是否加载失败 */
	error?: boolean;
	/** 重新加载公司经历 */
	onRetry?: () => void;
}

function getIconByType(type: TalentArchiveCompanyHistoryItem["type"]) {
	switch (type) {
		case "TRANSFER":
			return <TransferIcon />;
		case "CONCURRENT":
			return <ConcurrentIcon />;
		default:
			return <TransferIcon />;
	}
}

/**
 * 生成公司经历分组标识。
 *
 * 调岗按公司名称和一级部门名称归组；一级部门名称缺失时按原始下标独立成节点。
 * 兼岗仍按开始时间归组，用于表达同一天新增的多条兼岗记录。
 *
 * @param item 公司经历记录。
 * @param index 原始数据下标，用于调岗一级部门名称缺失时生成独立节点。
 * @returns 分组标识。
 */
function getCompanyHistoryGroupKey(item: TalentArchiveCompanyHistoryItem, index: number): string {
	if (item.type === "CONCURRENT") {
		return `j_${item.beginDate}`;
	}

	const firstDeptName = item.firstDeptName || "";
	if (!firstDeptName) {
		return `t_single_${index}`;
	}

	return `t_${item.cityCompanyName || ""}_${firstDeptName}`;
}

/**
 * 公司经历区块组件。
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function CompanyHistorySection({
	data,
	loading = false,
	error = false,
	onRetry,
}: CompanyHistorySectionProps) {
	// 调岗与兼岗共用一个状态对象，避免多个弹窗状态分散难以维护。
	const [detailModal, setDetailModal] = useState<DetailModalState>({
		isTransferOpen: false,
		isConcurrentOpen: false,
		title: "",
		selectedItems: [],
	});

	// 按公司经历业务规则分组数据，建立 Map。
	const { timelineData, dataMap, itemGroupKeyMap } = useMemo(() => {
		// 建立 Map：key 为部门标识，value 为该部门下的所有记录
		const map = new Map<string, TalentArchiveCompanyHistoryItem[]>();
		const groupKeyMap = new WeakMap<TalentArchiveCompanyHistoryItem, string>();

		// 遍历所有数据，按部门分组
		data.forEach((item, index) => {
			const key = getCompanyHistoryGroupKey(item, index);
			groupKeyMap.set(item, key);

			if (!map.has(key)) {
				map.set(key, []);
			}
			map.get(key)!.push(item);
		});

		// 为每个分组选择最早的记录作为时间线节点，外层代表该组的首次调岗时间。
		const timeline: TalentArchiveCompanyHistoryItem[] = [];
		map.forEach((items, _key) => {
			// 按开始时间排序，取最旧的（最早的）记录。
			const sortedItems = [...items].sort((a, b) => a.beginDate.localeCompare(b.beginDate));
			timeline.push(sortedItems[0]);
		});

		// 时间线按开始时间倒序排序（从最新到最旧）
		timeline.sort((a, b) => b.beginDate.localeCompare(a.beginDate));

		return { timelineData: timeline, dataMap: map, itemGroupKeyMap: groupKeyMap };
	}, [data]);

	// 检查是否存在兼岗节点
	const hasConcurrentNodes = useMemo(
		() => timelineData.some((item) => item.type === "CONCURRENT"),
		[timelineData],
	);

	const handleCloseTransferModal = useCallback(() => {
		setDetailModal({
			isTransferOpen: false,
			isConcurrentOpen: false,
			title: "",
			selectedItems: [],
		});
	}, []);

	const handleCloseConcurrentModal = useCallback(() => {
		setDetailModal({
			isTransferOpen: false,
			isConcurrentOpen: false,
			title: "",
			selectedItems: [],
		});
	}, []);

	const handleOpenDetail = useCallback(
		(item: TalentArchiveCompanyHistoryItem) => {
			// 根据分组阶段记录的 key 获取详情数据，避免独立节点回查时被错误合并。
			const key = itemGroupKeyMap.get(item);

			// 从 Map 中获取该分组的所有记录
			const items = key ? dataMap.get(key) || [] : [];

			if (item.type === "TRANSFER") {
				setDetailModal({
					isTransferOpen: true,
					isConcurrentOpen: false,
					title: "部门任职历程",
					selectedItems: items,
				});
			} else if (item.type === "CONCURRENT") {
				setDetailModal({
					isTransferOpen: false,
					isConcurrentOpen: true,
					title: `${item.beginDate} 兼岗情况`,
					selectedItems: items,
				});
			}
		},
		[dataMap, itemGroupKeyMap],
	);

	if (loading) {
		return (
			<div>
				<SectionTitle title="公司经历" className="mb-3" />
				<div
					className={`${COMPANY_HISTORY_MIN_HEIGHT_CLASS} flex items-center justify-center rounded border border-gray-200 p-4`}
				>
					<Spin size="small" />
				</div>
			</div>
		);
	}

	if (error || data.length === 0) {
		return (
			<div>
				<SectionTitle
					title="公司经历"
					titleExtra={
						<SectionEmptyHint text={error ? "公司经历加载失败" : "暂无公司经历数据"} />
					}
					className="mb-3"
				/>
				<div
					className={`${COMPANY_HISTORY_MIN_HEIGHT_CLASS} flex items-center justify-center`}
				>
					{error && onRetry && (
						<Button size="small" type="link" onClick={onRetry}>
							重新加载
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<>
			<div>
				<SectionTitle title="公司经历" className="mb-3" />
				<div
					className={`${COMPANY_HISTORY_MIN_HEIGHT_CLASS} rounded border border-gray-200 p-4 pb-2`}
				>
					<div className="custom-scrollbar overflow-x-auto pb-2">
						<div className="flex gap-1">
							{timelineData.map((item, index) => {
								// 兼岗展示在时间轴上方，其余经历展示在下方，借此区分并行与串行经历。
								const isAbove = item.type === "CONCURRENT";
								const typeLabel = getCompanyHistoryTypeLabel(item);
								const departmentText =
									item.type === "TRANSFER"
										? getCompanyHistoryPrimaryDepartment(item)
										: getCompanyHistoryDepartment(item);
								const jobText = getCompanyHistoryJob(item);
								const positionText = getCompanyHistoryPosition(item);
								const canViewDetail =
									item.type === "TRANSFER" || item.type === "CONCURRENT";

								return (
									<div
										key={`${item.beginDate}-${item.type}-${item.cityCompanyCode || "company"}-${item.deptId || "dept"}-${item.jobName || "job"}-${item.postName || "post"}`}
										className="w-56 flex-shrink-0"
									>
										{isAbove && (
											<div className="mb-2 flex justify-center">
												<div className="w-[200px]">
													<div className="mb-1 flex items-center gap-2">
														<Text strong className="text-sm">
															{item.type === "TRANSFER"
																? item.beginDate
																: `${item.beginDate} - ${typeLabel}`}
														</Text>
														{canViewDetail && (
															<Link
																className="text-xs"
																onClick={() =>
																	handleOpenDetail(item)
																}
															>
																详情
																<RightOutlined className="ml-1 h-2 w-2" />
															</Link>
														)}
													</div>
													{(() => {
														// 获取该节点对应的所有记录
														const key = `j_${item.beginDate}`;
														const allItems = dataMap.get(key) || [];

														if (allItems.length === 1) {
															// 单个兼岗，显示完整信息
															return (
																<div className="space-y-1">
																	<Text
																		type="secondary"
																		className="block text-xs"
																		ellipsis={{
																			tooltip: departmentText,
																		}}
																	>
																		{departmentText}
																	</Text>
																	<Text
																		type="secondary"
																		className="block text-xs"
																	>
																		岗位：
																		{jobText}
																	</Text>
																	<Text
																		type="secondary"
																		className="block text-xs"
																	>
																		职位：
																		{positionText}
																	</Text>
																</div>
															);
														}

														// 多个兼岗，显示列表式
														const displayItems = allItems.slice(0, 2);

														return (
															<div className="space-y-1">
																{displayItems.map(
																	(concurrentItem, idx) => {
																		const dept =
																			getCompanyHistoryDepartment(
																				concurrentItem,
																			);
																		const pos =
																			getCompanyHistoryPosition(
																				concurrentItem,
																			);
																		const concurrentDisplayKey =
																			[
																				concurrentItem.beginDate,
																				concurrentItem.cityCompanyCode,
																				concurrentItem.deptId,
																				concurrentItem.jobName,
																				concurrentItem.postName,
																			]
																				.filter(Boolean)
																				.join("-");
																		return (
																			<Text
																				key={
																					concurrentDisplayKey
																				}
																				type="secondary"
																				className="block text-xs"
																				ellipsis={{
																					tooltip: `${dept} | ${pos}`,
																				}}
																			>
																				{`${idx + 1}. ${dept} | ${pos}`}
																			</Text>
																		);
																	},
																)}

																<Text
																	type="secondary"
																	className="block text-xs"
																>
																	共{allItems.length}个
																</Text>
															</div>
														);
													})()}
												</div>
											</div>
										)}

										{!isAbove && hasConcurrentNodes && (
											<div className="mb-2 flex justify-center">
												<div className="w-[192px]">
													<div className="h-[5.65rem]" />
												</div>
											</div>
										)}

										<div className="relative mb-4 h-7">
											<div
												className="absolute left-0 right-[calc(50%+16px)] top-1/2 -translate-y-1/2 border-t-2 border-dashed"
												style={{ borderColor: "#0075FF" }}
											/>
											{index < timelineData.length - 1 && (
												<div
													className="absolute left-[calc(50%+16px)] right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed"
													style={{ borderColor: "#0075FF" }}
												/>
											)}
											<div
												className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
												style={{
													backgroundColor:
														item.type === "CONCURRENT"
															? "#14B968"
															: "#0075FF",
												}}
											>
												{getIconByType(item.type)}
											</div>
										</div>

										{!isAbove && (
											<div className="flex justify-center">
												<div className="w-[192px]">
													<div className="mb-1 flex items-center gap-2">
														<Text strong className="text-sm">
															{item.type === "TRANSFER"
																? item.beginDate
																: `${item.beginDate} - ${typeLabel}`}
														</Text>
														{canViewDetail && (
															<Link
																className="text-xs"
																onClick={() =>
																	handleOpenDetail(item)
																}
															>
																详情
																<RightOutlined className="ml-1 h-2 w-2" />
															</Link>
														)}
													</div>
													<div className="space-y-1">
														<Text
															type="secondary"
															className="block text-xs"
															ellipsis={{ tooltip: departmentText }}
														>
															{departmentText}
														</Text>
														<Text
															type="secondary"
															className="block text-xs"
														>
															岗位：
															{jobText}
														</Text>
														<Text
															type="secondary"
															className="block text-xs"
														>
															职位：
															{positionText}
														</Text>
													</div>
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<TransferDetailModal
				open={detailModal.isTransferOpen}
				title={detailModal.title}
				data={detailModal.selectedItems}
				onClose={handleCloseTransferModal}
			/>

			<ConcurrentDetailModal
				open={detailModal.isConcurrentOpen}
				title={detailModal.title}
				data={detailModal.selectedItems}
				onClose={handleCloseConcurrentModal}
			/>
		</>
	);
}
