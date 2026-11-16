import type { TargetFollowUpRes } from "#src/api/strategy/target-filling";
import { downloadFileFromOss } from "#src/api/file/oss";
import { initiateOaProcess } from "#src/api/strategy/target-confirm";
import {
	abortSubmission,
	fetchConfirmTargetFollowUp,
	fetchConfirmTargetFollowUpVersion,
} from "#src/api/strategy/target-filling";
import SendOut from "#src/assets/small-icons/target-filling/send_out.svg?react";
import { confirm } from "#src/components/custom-confirm/index.js";
import { downloadBlob } from "#src/utils/files";
import { Button, Drawer, Form, message, Space, Steps, Tabs, Typography } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import { AdjustHistoryDrawer } from "./AdjustHistoryDrawer";
import TargetConfirmDetailDrawer from "./TargetConfirmDetailDrawer";

const OA_BASE_URL = import.meta.env.VITE_OA_BASE_URL;

/**
 * 已中止印章：红色椭圆线条印章，倾斜盖在已中止版本的详情内容上
 * 仅作视觉标记，使用时外层容器需配合 pointer-events-none，避免遮挡内容交互
 */
function AbortedStamp() {
	return (
		<svg width={200} height={140} viewBox="0 0 200 140" className="select-none">
			<g transform="rotate(-25 100 70)" opacity={0.75}>
				<ellipse
					cx={100}
					cy={70}
					rx={86}
					ry={50}
					fill="none"
					stroke="#e60012"
					strokeWidth={3}
				/>
				<text
					x={102}
					y={70}
					textAnchor="middle"
					dominantBaseline="central"
					fill="#e60012"
					fontSize={34}
					fontWeight={600}
					letterSpacing={4}
				>
					已中止
				</text>
			</g>
		</svg>
	);
}

interface Props {
	open: boolean;
	onClose: any;
	record: any;
	onRefresh?: () => void;
}

export default function TargetFollowDrawer({ open, onClose, record, onRefresh }: Props) {
	const [expanded, setExpanded] = useState(false);
	const [showExpandBtn, setShowExpandBtn] = useState(false);
	const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
	const [adjustHistoryDrawerOpen, setAdjustHistoryDrawerOpen] = useState(false);
	const indicatorsRef = useRef<HTMLDivElement>(null);
	const [versionList, setVersionList] = useState<string[]>([]);
	const [activeVersion, setActiveVersion] = useState<string>("");
	const [versionMap, setVersionMap] = useState<Record<string, any>>({});
	const [detailData, setDetailData] = useState<Partial<TargetFollowUpRes>>({});
	const [, setConfirmUserCount] = useState<number>(0);
	const [, setSelectedIndicatorIds] = useState<any[]>([]);
	const currentStep = useRef<number>(0);

	const refreshCurrentVersionDetail = useCallback(async () => {
		if (!activeVersion || !record?.id || !versionMap[activeVersion]) {
			return;
		}

		const res: any = await fetchConfirmTargetFollowUp({
			effTaskIndicatorSubmitUserId: record.id,
			submitVersion: activeVersion,
		});

		const resultData = res?.data || {};
		setDetailData(resultData);

		const hasConfirmStep = (resultData.workflowDefinition || []).some(
			(step: any) => step.stepType === 1,
		);
		if (!hasConfirmStep) {
			setConfirmUserCount(0);
		}
	}, [activeVersion, record, versionMap]);

	// 拉取版本列表：接口返回"数组内每个元素仅含一组 key-value"的结构，此处展平为 版本号 -> 提交任务id 映射
	const loadVersionList = useCallback(() => {
		if (!record?.id) {
			return;
		}
		fetchConfirmTargetFollowUpVersion(record.id).then((res: any) => {
			const raw = res?.data ?? [];
			const items = Array.isArray(raw) ? raw : [];
			const map: Record<string, any> = {};
			const list: string[] = [];
			items.forEach((item) => {
				if (!item || typeof item !== "object") return;
				Object.keys(item).forEach((key) => {
					if (!key) return;
					if (!Object.prototype.hasOwnProperty.call(map, key)) {
						list.push(key);
					}
					map[key] = (item as any)[key];
				});
			});
			setVersionList(list);
			setVersionMap(map);
			// 当前选中版本已不在列表中（如中止后被后端移除）时，回退到第一个版本
			setActiveVersion((prev) =>
				list.length > 0 && list.includes(prev) ? prev : list[0] || "",
			);
		});
	}, [record]);

	useEffect(() => {
		if (open && record?.id) {
			loadVersionList();
		}
	}, [open, record, loadVersionList]);

	useEffect(() => {
		if (activeVersion && record?.id && versionMap[activeVersion]) {
			refreshCurrentVersionDetail();
		}
	}, [activeVersion, record, refreshCurrentVersionDetail, versionMap]);

	const data = {
		taskName: detailData.name || record?.name || "",
		submitTime: detailData.submitDate || record?.updateTime || "",
		version: detailData.submitVersion || activeVersion || "",
		indicators: detailData.submitIndicators || [],
		confirmationCycle: detailData.confirmationCycleStr || "",
		confirmationInstructions: detailData.confirmationInstructions || "",
		processApprovalType: detailData.processApprovalTypeStr || "",
		currentStep: detailData.currentStep ?? 0,
		needApprovalStr: detailData.needApprovalStr || "",
		steps: (detailData.workflowDefinition || []).map((step: any) => {
			let status: "wait" | "process" | "finish" | "error" = "wait";
			let statusColor = "text-gray-500";

			if (step.statusStr === "进行中") {
				status = "process";
				statusColor = "text-green-500";
			} else if (step.statusStr === "已完成") {
				status = "finish";
				statusColor = "text-blue-500";
			} else if (step.statusStr === "未确认" || step.statusStr === "未开始") {
				status = "wait";
				statusColor = "text-yellow-500";
			}

			return {
				title: step.stepTypeStr || step.stepName,
				time: step.time,
				orgStatus: step.status,
				status,
				statusText: step.statusStr,
				statusColor,
				descLeft:
					step.confirmName ||
					(step.stepType === 1
						? `共${step.confirmUserIds.length}人`
						: step.confirmUserIds
							? `共${step.confirmUserIds.length}人`
							: ""),
				showDetailLink: step.stepType === 1,
				confirmUserIds: step.confirmUserIds,
			};
		}),
	};

	useEffect(() => {
		if (open && indicatorsRef.current) {
			// 检查内容高度是否超过两行（假设两行高度约为 56px）
			if (indicatorsRef.current.scrollHeight > 60) {
				setShowExpandBtn(true);
			} else {
				setShowExpandBtn(false);
			}
		}
	}, [open, data.indicators]);

	const handleDownloadAttachment = useCallback(async () => {
		if (!detailData.fileName) {
			return;
		}

		if (!detailData.bucketName) {
			message.error("附件缺少桶信息，无法下载");
			return;
		}

		try {
			const blob = await downloadFileFromOss(detailData.bucketName, detailData.fileName);
			downloadBlob(blob, detailData.fileName);
		} catch (error) {
			console.error("下载目标跟进附件失败", error);
			message.error("附件下载失败");
		}
	}, [detailData.bucketName, detailData.fileName]);

	const handleInitiateProcess = () => {
		confirm({
			title: "发起流程",
			content: "确认发起流程吗？",
			onOk: async () => {
				try {
					const effTaskSubmissionId = versionMap[activeVersion];
					if (!effTaskSubmissionId) {
						message.error("未找到对应的提交ID");
						return;
					}
					const res = await initiateOaProcess({ effTaskSubmissionId });
					// const res = {
					// 	code:200,
					// 	data:'19be869e971e5c110fc471845ad8f97f'
					// }
					if (res.code === 200) {
						const fdId = res.data;
						if (fdId) {
							const url = `${OA_BASE_URL}/km/review/km_review_main/kmReviewMain.do?method=view&fdId=${fdId}&s_css=default`;
							window.open(url, "_blank");
						}
						fetchConfirmTargetFollowUp({
							effTaskIndicatorSubmitUserId: record.id,
							submitVersion: activeVersion,
						}).then((res: any) => {
							const data = res.data || {};
							setDetailData(data);
						});
					}
				} catch (e) {
					console.error(e);
				}
			},
		});
	};

	const handleOpenApprovalProcess = (fdId?: string) => {
		if (fdId) {
			const url = `${OA_BASE_URL}/km/review/km_review_main/kmReviewMain.do?method=view&fdId=${fdId}&s_css=default`;
			window.open(url, "_blank");
		}
	};

	// 当前版本任务是否可中止：未完成（isCompleted）且未被中止（isCancel）时显示；详情未加载或字段缺失时不显示
	const showAbortBtn =
		Boolean(versionMap[activeVersion]) &&
		detailData.isCompleted === 0 &&
		detailData.isCancel === 0;

	// 当前版本是否已中止：已中止时在确认周期/确认说明区域加盖红色印章
	const isAborted = detailData.isCancel === 1;

	// 中止当前版本提交任务：二次确认后调用中止接口，成功后刷新版本列表与外层任务列表
	const handleAbortSubmission = () => {
		const effTaskSubmissionId = versionMap[activeVersion];
		if (!effTaskSubmissionId) {
			message.error("未找到对应的提交ID");
			return;
		}
		confirm({
			title: "中止提醒",
			content: `确认中止「${data.taskName}·${data.version}」任务？中止后该版本数据将不会覆盖原有数据。`,
			onOk: async () => {
				try {
					const res = await abortSubmission(effTaskSubmissionId);
					if (res?.code === 200) {
						// 成功提示由 request 层 successMessage 统一弹出；重拉版本列表后详情随既有 effect 刷新，isCancel 置为 1 后按钮自动隐藏
						loadVersionList();
						onRefresh?.();
					}
				} catch (e) {
					// 失败提示由 request 层 errorMessage 统一弹出，吞掉异常以便关闭确认弹窗
					console.error("中止提交任务失败", e);
				}
			},
		});
	};

	return (
		<Drawer
			title="目标跟进"
			placement="right"
			width={600}
			open={open}
			footer={
				<Space className="float-right">
					{showAbortBtn && (
						<Button danger onClick={handleAbortSubmission}>
							中止
						</Button>
					)}
					<Button onClick={onClose}>关闭</Button>
				</Space>
			}
			{...commonDrawerProps(onClose)}
			styles={{
				body: {
					paddingTop: 0,
				},
			}}
		>
			{/* 版本信息 */}
			<div className="mb-0">
				<Tabs
					activeKey={activeVersion}
					onChange={setActiveVersion}
					items={versionList.map((v) => ({
						key: v,
						label: v,
					}))}
				/>
			</div>

			<Form
				layout="horizontal"
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 20 }}
				labelAlign="right"
				colon={false}
				className="text-sm [&_.ant-form-item-label>label]:text-[#606266]"
			>
				<Form.Item label="任务名称" className="mb-2">
					{data.taskName}
				</Form.Item>

				<Form.Item label="提交时间" className="mb-2">
					{data.submitTime}
				</Form.Item>

				<Form.Item label="提交版本" className="mb-2">
					<Space size={8}>
						<span>{data.version}</span>
						{detailData.fileName && (
							<Button
								type="link"
								className="!px-0"
								onClick={handleDownloadAttachment}
							>
								<Typography.Text
									style={{ maxWidth: 220, color: "inherit" }}
									ellipsis={{ tooltip: detailData.fileName }}
								>
									{detailData.fileName}
								</Typography.Text>
							</Button>
						)}
					</Space>
				</Form.Item>

				<Form.Item label="提交指标" className="mb-2">
					<div
						ref={indicatorsRef}
						className={`flex flex-wrap gap-2 transition-all duration-300 ${expanded ? "" : "max-h-[60px] overflow-hidden"}`}
					>
						{data.indicators.map((tag: any, index: number) => (
							<span
								key={index}
								className="rounded bg-[rgba(235,238,245,1)] px-2 py-1 text-xs text-[#606266]"
							>
								{tag}
							</span>
						))}
					</div>
					{showExpandBtn && (
						<div
							className="mt-1 inline-block cursor-pointer select-none text-xs text-[#1890ff]"
							onClick={() => setExpanded(!expanded)}
						>
							{expanded ? "收起" : "展开"}
						</div>
					)}
				</Form.Item>

				<Form.Item label="确认周期" className="relative mb-2">
					{data.confirmationCycle}
					{/* 已中止版本：印章锚定本行，垂直覆盖确认周期与确认说明两行，水平偏右 */}
					{isAborted && (
						<div className="pointer-events-none absolute right-4 top-[-34px] z-10">
							<AbortedStamp />
						</div>
					)}
				</Form.Item>

				<Form.Item label="确认说明" className="mb-2">
					<span className="whitespace-pre-wrap break-all">
						{data.confirmationInstructions || "-"}
					</span>
				</Form.Item>

				{data.steps.length > 0 && (
					<Form.Item label="确认流程" className="mb-2">
						<div className="relative rounded border border-gray-200 px-4">
							{/* <div className="absolute top-1 right-2 z-10">
								<Button type="link" icon={<BellOutlined />} size="small" className="!text-[#1890ff] text-sm">
									催办
								</Button>
							</div> */}
							<Steps
								direction="vertical"
								size="small"
								current={data.currentStep}
								className="w-full [&_.ant-steps-item-icon]:translate-y-3 [&_.ant-steps-item-tail::after]:!bg-[rgba(0,117,255,1)] [&_.ant-steps-item-tail]:-translate-x-2 [&_.ant-steps-item-tail]:-translate-y-1"
							>
								{data.steps.map((step: any, index: number) => (
									<Steps.Step
										key={index}
										title={
											<div className="flex -translate-y-0.5 items-center justify-between pl-4">
												<span>{step.title}</span>
												{step.time && (
													<span className="ml-4 text-sm font-normal text-gray-500">
														{step.time}
													</span>
												)}
											</div>
										}
										status={step.status as any}
										className="w-full [&_.ant-steps-item-content]:w-full"
										icon={
											<div className="h-2 w-2 rounded-full bg-[rgba(0,117,255,1)]" />
										}
										description={
											<div className="ml-6 mt-1 flex items-center justify-between rounded bg-[rgba(245,247,250,1)] px-4 py-2 text-xs">
												{step.showDetailLink ? (
													<span className="text-gray-500">
														<span
															className="cursor-pointer text-[#1890ff]"
															onClick={() => {
																const ids = (
																	step.confirmUserIds || []
																).map(
																	(u: any) =>
																		u.responsiblePersonId,
																);
																setSelectedIndicatorIds(ids);
																currentStep.current = index;
																setDetailDrawerOpen(true);
															}}
														>
															{`${step.descLeft}>`}
														</span>
													</span>
												) : (
													<span>{step.descLeft}</span>
												)}
												<div className="flex items-center gap-2">
													<span
														className={`h-1.5 w-1.5 rounded-full ${step.statusColor.replace("text-", "bg-")}`}
													></span>
													<span className="text-[rgba(96,98,102,1)]">
														{step.orgStatus === 3 && (
															<Button
																type="link"
																onClick={() =>
																	setAdjustHistoryDrawerOpen(true)
																}
															>
																调整
															</Button>
														)}
														{step.statusText}
													</span>
												</div>
											</div>
										}
									/>
								))}
							</Steps>
						</div>
					</Form.Item>
				)}
				<Form.Item label="是否流程报批" className="mb-2">
					{data.needApprovalStr}
					{/* <span>
						<Button type="link" icon={<SendOutlined />}>发起流程</Button>
					</span> */}
				</Form.Item>
				{data.needApprovalStr === "是" && (
					<Form.Item label="流程报批类型" className="mb-2">
						{data.processApprovalType}
						<span>
							{detailData?.approvalFldId || detailData?.approvalFdId ? (
								<Button
									type="link"
									icon={<SendOut />}
									onClick={() =>
										handleOpenApprovalProcess(
											detailData.approvalFldId || detailData.approvalFdId,
										)
									}
								>
									查看已发起流程
								</Button>
							) : (
								<Button type="link" onClick={handleInitiateProcess}>
									发起流程
								</Button>
							)}
						</span>
					</Form.Item>
				)}
			</Form>
			<TargetConfirmDetailDrawer
				open={detailDrawerOpen}
				onClose={() => setDetailDrawerOpen(false)}
				effTaskSubmissionId={versionMap[activeVersion]}
				step={currentStep.current}
			/>
			<AdjustHistoryDrawer
				open={adjustHistoryDrawerOpen}
				onClose={() => setAdjustHistoryDrawerOpen(false)}
				effTaskSubmissionId={versionMap[activeVersion]}
				onSubmitSuccess={refreshCurrentVersionDetail}
			/>
		</Drawer>
	);
}
