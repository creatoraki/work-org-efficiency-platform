/**
 * 面谈历史记录列表组件
 */

import type {
	InterviewHistoryItem,
	UploadFileFormItem,
} from "#src/api/personnel-archive/interview-management";
import type { PreviewableAttachment } from "#src/hooks";
import type { ProDescriptionsItemProps } from "@ant-design/pro-components";
import { ImagePreviewModal, SectionTitle } from "#src/components";
import { useAttachmentPreview, useDict } from "#src/hooks";
import { isPreviewableFile } from "#src/utils";
import { cn } from "#src/utils/index.js";
import { DownloadOutlined, DownOutlined, EyeOutlined, UpOutlined } from "@ant-design/icons";
import { ProDescriptions } from "@ant-design/pro-components";
import { Button, Steps, Typography } from "antd";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "../../config";

/** 将 UploadFileFormItem 规范化为 PreviewableAttachment */
function toPreviewable(file: UploadFileFormItem): PreviewableAttachment {
	return {
		key: file.fileName || String(file.id),
		displayName: file.originalFilename || file.fileName || "",
		fileName: file.fileName || undefined,
	};
}

const { Text } = Typography;

/**
 * 面谈历史记录列表属性接口
 */
interface InterviewHistoryListProps {
	/** 面谈历史记录列表 */
	interviewHistory: InterviewHistoryItem[];
}

/**
 * 面谈历史记录列表
 *
 * @param props - 组件属性
 * @param props.interviewHistory - 面谈历史记录列表
 */
export function InterviewHistoryList({ interviewHistory }: InterviewHistoryListProps) {
	const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
	const { translate: translatePurpose } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.INTERVIEW_PURPOSE);
	const {
		imagePreviewOpen,
		setImagePreviewOpen,
		imagePreviewIndex,
		setImagePreviewIndex,
		imagePreviewItems,
		handlePreviewAttachment: previewAttachment,
		handleDownloadAttachment: downloadAttachment,
		fetchBlobSrc,
	} = useAttachmentPreview();

	const handlePreviewAttachment = useCallback(
		(file: UploadFileFormItem, allFiles: UploadFileFormItem[]) => {
			return previewAttachment(toPreviewable(file), allFiles.map(toPreviewable));
		},
		[previewAttachment],
	);

	const handleDownloadAttachment = useCallback(
		(file: UploadFileFormItem) => {
			return downloadAttachment(toPreviewable(file));
		},
		[downloadAttachment],
	);

	if (!interviewHistory || interviewHistory.length === 0) {
		return null;
	}

	/**
	 * 切换展开/收起
	 *
	 * @param key - 记录键值
	 */
	const toggleExpand = (key: string) => {
		setExpandedKeys((prev) => {
			if (prev.includes(key)) {
				return prev.filter((k) => k !== key);
			}
			return [...prev, key];
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<SectionTitle title="过往面谈记录" />
			<Steps
				direction="vertical"
				progressDot={(dot) => {
					return dot;
				}}
				className={cn(
					"[&_.ant-steps-item-title]:w-full",
					"[&_.ant-steps-item-title]:pr-0",
					"[&_.ant-steps-item-title]:!bg-gray-200",
					"[&_.ant-steps-item-title]:border-b",
					"[&_.ant-steps-item-description]:!pb-0",
					"[&_.ant-steps-item-content]:!min-h-0",
					"[&_.ant-steps-item-content]:border-l",
					"[&_.ant-steps-item-content]:border-r",
					// 第一个步骤项的内容需要顶部边框和圆角
					"[&_.ant-steps-item:first-child_.ant-steps-item-content]:!border-t",
					"[&_.ant-steps-item:first-child_.ant-steps-item-content]:rounded-tl",
					"[&_.ant-steps-item:first-child_.ant-steps-item-content]:rounded-tr",
					// 最后一个步骤项的内容需要底部圆角
					"[&_.ant-steps-item:last-child_.ant-steps-item-content]:!border-b",
					"[&_.ant-steps-item:last-child_.ant-steps-item-content]:rounded-bl",
					"[&_.ant-steps-item:last-child_.ant-steps-item-content]:rounded-br",
				)}
				items={interviewHistory.map((his: InterviewHistoryItem) => {
					const createTimeStr = his.createTime;
					const endTimeStr = his.endTime || "";
					const key = String(his.id);
					const isExpanded = expandedKeys.includes(key);
					const tags = Array.isArray(his.tags) ? his.tags : [];
					const fileList = Array.isArray(his.fileList) ? his.fileList : [];

					return {
						key,
						status: "finish" as const,
						title: (
							<div
								className="flex w-full items-center justify-between bg-[#f5f7fa] p-2"
								data-task-key={key}
								onClick={(e) => {
									e.stopPropagation();
									toggleExpand(key);
								}}
							>
								<div className="space-x-2">
									<span className="text-base font-bold">
										面谈触发日期:
										{createTimeStr}
									</span>
									<span className="rounded bg-blue-100 p-1 text-xs text-blue-600">
										面谈目的:
										{translatePurpose(his.purpose) || "-"}
									</span>
								</div>
								<div className="flex cursor-pointer items-center text-xs text-gray-600 transition-colors hover:text-gray-800">
									{isExpanded ? "收起" : "展开"}
									{isExpanded ? (
										<UpOutlined style={{ fontSize: 12, marginLeft: 2 }} />
									) : (
										<DownOutlined style={{ fontSize: 12, marginLeft: 2 }} />
									)}
								</div>
							</div>
						),
						description: (
							<AnimatePresence initial={false}>
								{isExpanded && (
									<motion.div
										key={`content-${key}`}
										initial="collapsed"
										animate="open"
										exit="collapsed"
										variants={{
											open: { opacity: 1, height: "auto" },
											collapsed: { opacity: 0, height: 0 },
										}}
										transition={{
											duration: 0.3,
											ease: [0.04, 0.62, 0.23, 0.98],
										}}
										style={{ overflow: "hidden" }}
									>
										<div className="p-4">
											<ProDescriptions
												column={3}
												dataSource={his}
												colon={false}
												columns={[
													{
														title: "面谈完成日期",
														dataIndex: "endTime",
														render: () => endTimeStr || "/",
													} as ProDescriptionsItemProps<InterviewHistoryItem>,
													{
														title: "总体评价",
														dataIndex: "overall",
														render: () => his.overall?.trim() || "/",
													} as ProDescriptionsItemProps<InterviewHistoryItem>,
													{
														title: "面谈附件",
														dataIndex: "fileList",
														render: () =>
															fileList.length > 0 ? (
																<div className="flex w-full flex-col gap-2">
																	{fileList.map((file, index) => {
																		const displayName =
																			file.originalFilename ||
																			file.fileName;
																		const previewable =
																			isPreviewableFile(
																				displayName,
																			);
																		return (
																			<div
																				key={
																					file.id ??
																					`${file.fileName}-${index}`
																				}
																				className="w-full"
																			>
																				<Typography.Text
																					ellipsis={{
																						tooltip:
																							displayName,
																					}}
																					className="max-w-full font-medium"
																				>
																					{displayName}
																				</Typography.Text>
																				<div className="flex items-center gap-3">
																					{previewable && (
																						<Button
																							type="link"
																							icon={
																								<EyeOutlined />
																							}
																							onClick={() =>
																								handlePreviewAttachment(
																									file,
																									fileList,
																								)
																							}
																							className="!h-6 !px-0 !text-[#2D5BFF]"
																						>
																							预览
																						</Button>
																					)}
																					<Button
																						type="link"
																						icon={
																							<DownloadOutlined />
																						}
																						onClick={() =>
																							handleDownloadAttachment(
																								file,
																							)
																						}
																						className="!h-6 !px-0 !text-[#2D5BFF]"
																					>
																						下载
																					</Button>
																				</div>
																			</div>
																		);
																	})}
																</div>
															) : (
																"/"
															),
													} as ProDescriptionsItemProps<InterviewHistoryItem>,
													...(tags.length > 0
														? [
																{
																	title: "面谈标签",
																	dataIndex: "tags",
																	span: 3,
																	render: () => {
																		return (
																			<div className="w-full rounded border">
																				<header className="border-b bg-[#f0f2f5] p-2">
																					<Text strong>
																						标签名称
																					</Text>
																				</header>
																				<div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-6 gap-y-3 p-3">
																					{tags.map(
																						(tag) => (
																							<div
																								key={
																									tag.id
																								}
																								className="grid min-w-0 grid-cols-[minmax(72px,auto)_1fr] gap-2"
																							>
																								<Text
																									type="secondary"
																									ellipsis={{
																										tooltip:
																											tag.name,
																									}}
																								>
																									{
																										tag.name
																									}
																								</Text>
																								<Text
																									ellipsis={{
																										tooltip:
																											tag.value ||
																											"/",
																									}}
																								>
																									{tag.value ||
																										"/"}
																								</Text>
																							</div>
																						),
																					)}
																				</div>
																			</div>
																		);
																	},
																} as ProDescriptionsItemProps<InterviewHistoryItem>,
															]
														: []),
												]}
												size="small"
											/>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						),
					};
				})}
			/>

			<ImagePreviewModal
				open={imagePreviewOpen}
				onClose={() => setImagePreviewOpen(false)}
				items={imagePreviewItems}
				currentIndex={imagePreviewIndex}
				onIndexChange={setImagePreviewIndex}
				fetchBlobSrc={fetchBlobSrc}
			/>
		</div>
	);
}
