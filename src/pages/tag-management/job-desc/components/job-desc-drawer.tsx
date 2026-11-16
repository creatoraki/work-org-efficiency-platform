/**
 * 岗位描述抽屉组件（管理/审核复用）
 */

import type { UpdateJobDescPayload } from "#src/api/tag-management/job-desc/management";
import type { PreviewableAttachment } from "#src/hooks";
import type { ProDescriptionsItemProps, ProFormInstance } from "@ant-design/pro-components";
import type { UploadProps } from "antd";
import type { JobDescAuditItem } from "../audit/types";
import type {
	DrawerMode,
	JobBasicDescription,
	JobDescAttachmentFile,
	JobDescManagementItem,
	JobPersonalizedDescription,
} from "../management/types";
import { ImagePreviewModal } from "#src/components/image-preview-modal";
import { useAttachmentPreview, useDict } from "#src/hooks";
import { getFileExtension, isPreviewableFile, SUPPORTED_UPLOAD_EXTENSIONS } from "#src/utils";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, InboxOutlined } from "@ant-design/icons";
import { ProDescriptions, ProForm, ProFormTextArea } from "@ant-design/pro-components";
import { Alert, Button, Drawer, message, Tag, Typography, Upload } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { TAG_DICT_KEYS } from "../../config";
import { parseDescriptionField, stringifyDescriptionField } from "../utils";

type JobDescDrawerRecord = (JobDescManagementItem | JobDescAuditItem) & {
	auditDeptName?: string;
	auditStatus?: string;
};

interface JobDescFormValues {
	personalizedDescFields?: JobPersonalizedDescription;
}

type AttachmentSource = "server" | "local";

interface DrawerAttachment extends JobDescAttachmentFile {
	id: string;
	source: AttachmentSource;
	localFile?: File;
	localUid?: string;
}

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function getAttachmentKey(attachment: DrawerAttachment): string {
	if (attachment.source === "local") {
		return attachment.localUid
			? `local-${attachment.localUid}`
			: `local-${attachment.fileName}-${attachment.localFile?.lastModified ?? 0}-${attachment.localFile?.size ?? 0}`;
	}
	return `server-${attachment.fileName}`;
}

function getAttachmentDisplayName(attachment: DrawerAttachment): string {
	return attachment.originalFileName || attachment.fileName;
}

function canPreviewAttachment(attachment: DrawerAttachment): boolean {
	return isPreviewableFile(getAttachmentDisplayName(attachment));
}

/**
 * 将后端附件数据统一为抽屉使用的 DrawerAttachment[]
 * 后端返回：attachments 字段为 JSON 字符串（数组），如：
 * `[{"originalFileName":"a.pdf","fileName":"path/a.pdf"}]`
 * 约定：fileName 存 OSS 路径（预览/下载用），originalFileName 存文件名（展示用）
 */
function normalizeAttachmentList(record?: JobDescDrawerRecord | null): DrawerAttachment[] {
	if (!record) {
		return [];
	}
	const attachments = (record as any).attachments;
	if (!attachments || typeof attachments !== "string") {
		return [];
	}
	// 优先解析 JSON 字符串（新格式）
	try {
		const parsed = JSON.parse(attachments) as Array<{
			fileName?: unknown;
			originalFileName?: unknown;
		}>;
		if (Array.isArray(parsed)) {
			return parsed
				.filter((item) => item && typeof item === "object")
				.map((item) => ({
					id: uuidv4(),
					fileName: typeof item.fileName === "string" ? item.fileName : "",
					originalFileName:
						typeof item.originalFileName === "string"
							? item.originalFileName
							: undefined,
					source: "server" as const,
				}))
				.filter((item) => Boolean(item.fileName || item.originalFileName));
		}
	} catch {}

	// 兜底兼容旧逗号分隔格式（避免历史数据导致无法展示）
	return attachments
		.split(",")
		.map((path: string) => path.trim())
		.filter(Boolean)
		.map((path) => ({
			id: uuidv4(),
			fileName: path,
			originalFileName: path.split("/").pop() ?? path,
			source: "server" as const,
		}));
}

interface AuditActionConfig {
	onApprove: () => void | Promise<void>;
	onReject: () => void | Promise<void>;
	approveLoading?: boolean;
	rejectLoading?: boolean;
	approveDisabled?: boolean;
	rejectDisabled?: boolean;
}

interface JobDescDrawerProps {
	/** 抽屉是否打开 */
	open: boolean;
	/** 抽屉模式 */
	mode: DrawerMode;
	/** 当前记录数据 */
	record?: JobDescDrawerRecord | null;
	/** 关闭抽屉回调 */
	onClose: () => void;
	/** 提交表单回调（仅编辑模式需要），payload 含 existingAttachments/newFiles，不含 uploadFileForms */
	onSubmit?: (values: UpdateJobDescPayload) => Promise<void>;
	/** 抽屉宽度 */
	width?: number | string;
	/** 状态字典 key，默认 tag_status */
	statusDictKey?: (typeof TAG_DICT_KEYS)[keyof typeof TAG_DICT_KEYS] | string;
	/** 审核操作配置（审核模式专用） */
	auditActions?: AuditActionConfig;
}

const DEFAULT_DRAWER_WIDTH = 800;

/** 将 DrawerAttachment 规范化为 PreviewableAttachment */
function toPreviewable(file: DrawerAttachment): PreviewableAttachment {
	return {
		key: getAttachmentKey(file),
		displayName: getAttachmentDisplayName(file),
		fileName: file.source === "server" ? file.fileName : undefined,
		localFile: file.localFile,
	};
}

/**
 * 岗位描述抽屉组件
 */
export function JobDescDrawer({
	open,
	mode,
	record,
	onClose,
	onSubmit,
	width = DEFAULT_DRAWER_WIDTH,
	statusDictKey = TAG_DICT_KEYS.STATUS,
	auditActions,
}: JobDescDrawerProps) {
	const [loading, setLoading] = useState(false);
	const [attachmentList, setAttachmentList] = useState<DrawerAttachment[]>([]);
	const formRef = useRef<ProFormInstance<JobDescFormValues>>(null);
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

	const isManagementRecord = (
		value: JobDescDrawerRecord | null,
	): value is JobDescManagementItem => Boolean(value && "status" in value);

	const getCurrentStatusValue = () => {
		if (!record) {
			return undefined;
		}
		if (isManagementRecord(record)) {
			return record.status;
		}
		if ("auditStatus" in record) {
			return record.auditStatus;
		}
		return undefined;
	};

	// 获取描述字段的keys（动态生成）
	const getDescriptionKeys = (description?: JobBasicDescription | JobPersonalizedDescription) => {
		if (!description || typeof description !== "object") {
			return [];
		}
		return Object.keys(description);
	};

	// 获取状态字典
	const { valueMap: statusValueMap } = useDict(statusDictKey);

	// 获取状态标签样式和文本
	const getStatusTag = (status?: string | null) => {
		if (!status) {
			return null;
		}
		const dictItem = statusValueMap.get(status);
		if (!dictItem) {
			return null;
		}
		const statusType = dictItem.listClass as
			| "default"
			| "success"
			| "processing"
			| "error"
			| "warning"
			| undefined;
		return (
			<Tag
				style={{
					color:
						statusType === "success"
							? "#14B968"
							: statusType === "error"
								? "#F5222D"
								: statusType === "processing"
									? "#0075FF"
									: statusType === "warning"
										? "#FF7D00"
										: undefined,
					backgroundColor:
						statusType === "success"
							? "#E8F5E8"
							: statusType === "error"
								? "#FFEBEE"
								: statusType === "processing"
									? "#E6F4FF"
									: statusType === "warning"
										? "#FFEFE0"
										: undefined,
					border: "none",
				}}
				className="rounded-md px-2 py-0.5 font-medium"
			>
				{dictItem.dictLabel}
			</Tag>
		);
	};

	const basicDescData = useMemo(
		() => parseDescriptionField(record?.basicDesc),
		[record?.basicDesc],
	);
	const personalizedDescData = useMemo(
		() => parseDescriptionField(record?.personalizedDesc),
		[record?.personalizedDesc],
	);
	const basicDescKeys = getDescriptionKeys(basicDescData);
	const personalizedDescKeys = getDescriptionKeys(personalizedDescData);

	// 是否为只读模式
	const isReadonly = mode === "readonly";

	useEffect(() => {
		if (!open) {
			setImagePreviewOpen(false);
			return;
		}
		setAttachmentList(normalizeAttachmentList(record));
	}, [open, record]);

	const handlePreviewAttachment = useCallback(
		(file: DrawerAttachment) => {
			return previewAttachment(toPreviewable(file), attachmentList.map(toPreviewable));
		},
		[previewAttachment, attachmentList],
	);

	const handleDownloadAttachment = useCallback(
		(file: DrawerAttachment) => {
			return downloadAttachment(toPreviewable(file));
		},
		[downloadAttachment],
	);

	const uploadProps: UploadProps = useMemo(
		() => ({
			accept: Array.from(SUPPORTED_UPLOAD_EXTENSIONS)
				.map((ext) => `.${ext}`)
				.join(","),
			showUploadList: false,
			multiple: true,
			beforeUpload: (file) => {
				const extension = getFileExtension(file.name);
				if (!SUPPORTED_UPLOAD_EXTENSIONS.has(extension)) {
					message.error("文件格式不支持，请按需求上传对应格式");
					return Upload.LIST_IGNORE;
				}
				if (file.size > MAX_UPLOAD_SIZE) {
					message.error("文件大小不能超过 50MB");
					return Upload.LIST_IGNORE;
				}
				setAttachmentList((prev) => [
					...prev,
					{
						id: uuidv4(),
						fileName: "",
						originalFileName: file.name,
						source: "local",
						localFile: file as File,
						localUid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					},
				]);
				message.success("附件已添加，点击更新后生效");
				return Upload.LIST_IGNORE;
			},
		}),
		[],
	);

	/**
	 * 构建提交附件数据：
	 * - attachments：编辑后的附件 JSON 字符串（数组，元素为 { fileName, originalFileName }）
	 * - newFiles：新上传的文件流，传给后端 files 字段
	 */
	const buildSubmitAttachments = useCallback(() => {
		const newFiles = attachmentList
			.filter(
				(a): a is DrawerAttachment & { localFile: File } =>
					a.source === "local" && Boolean(a.localFile),
			)
			.map((a) => a.localFile);

		const attachmentPayload = attachmentList.map((item) => ({
			fileName: item.fileName || "",
			originalFileName: item.originalFileName || "",
		}));
		const attachments = JSON.stringify(attachmentPayload);

		return { attachments, newFiles: newFiles.length > 0 ? newFiles : undefined };
	}, [attachmentList]);

	// 处理表单提交
	const handleSubmit = async (values: JobDescFormValues) => {
		if (!record) {
			message.error("缺少岗位基础信息，无法提交");
			return false;
		}
		if (!onSubmit) {
			message.warning("当前模式不支持提交操作");
			return false;
		}
		const localFiles = attachmentList.filter((a) => a.source === "local");
		const invalidLocal = localFiles.find((a) => !a.localFile);
		if (invalidLocal) {
			message.error(
				`${invalidLocal.originalFileName || invalidLocal.fileName || "附件"}已失效，请重新上传`,
			);
			return false;
		}
		setLoading(true);
		try {
			const { attachments, newFiles } = buildSubmitAttachments();
			const payload = {
				jobId: record.jobId,
				jobName: record.jobName,
				deptCode: record.deptCode,
				positionId: record.positionId,
				positionName: record.positionName,
				postGrade: record.postGrade,
				auditDept: record.auditDept,
				basicDesc: record.basicDesc ?? stringifyDescriptionField(basicDescData),
				personalizedDesc: stringifyDescriptionField(
					values.personalizedDescFields ?? personalizedDescData,
				),
				status: isManagementRecord(record) ? record.status : undefined,
				attachments,
				existingAttachments: (record as any).attachments, // 原样透传（JSON 字符串），用于后端对比
				newFiles,
			};
			await onSubmit(payload);
			message.success("更新成功");
			onClose();
			return true;
		} catch (error) {
			if (error instanceof Error) {
				message.error(error.message);
			} else {
				console.error("表单提交失败:", error);
			}
			return false;
		} finally {
			setLoading(false);
		}
	};

	const renderBasicDescription = useCallback(() => {
		if (!basicDescKeys.length) {
			return <div className="text-sm text-gray-500">暂无岗位基本描述</div>;
		}
		return (
			<div className="flex w-full flex-col gap-3">
				{basicDescKeys.map((key, index) => (
					<div key={key} className="text-sm leading-6">
						<div className="mb-2 font-bold">
							{index + 1}.{key}：
						</div>
						<Typography.Paragraph
							ellipsis={{
								rows: 4,
								expandable: "collapsible",
							}}
							style={{
								marginBottom: 0,
								maxHeight: "8rem",
								overflowY: "auto",
							}}
						>
							{basicDescData[key] || "-"}
						</Typography.Paragraph>
					</div>
				))}
			</div>
		);
	}, [basicDescData, basicDescKeys]);

	const renderPersonalizedForm = useCallback(() => {
		if (!personalizedDescKeys.length) {
			return <div className="w-full text-sm text-gray-500">暂无岗位个性描述</div>;
		}
		return (
			<ProForm<JobDescFormValues>
				id="job-desc-form"
				formRef={formRef}
				readonly={isReadonly}
				onFinish={handleSubmit}
				initialValues={{
					personalizedDescFields: personalizedDescData,
				}}
				submitter={false}
				preserve={false}
				className="w-full"
			>
				{personalizedDescKeys.map((key, index) => (
					<ProFormTextArea
						key={key}
						label={
							<span className="font-bold">
								{index + 1}.{key}
							</span>
						}
						name={["personalizedDescFields", key]}
						placeholder={`请输入${key}个性化要求`}
						formItemProps={{
							layout: "vertical",
						}}
						fieldProps={{
							rows: 4,
							maxLength: 500,
							showCount: true,
						}}
						disabled={isReadonly}
					/>
				))}
			</ProForm>
		);
	}, [handleSubmit, isReadonly, personalizedDescData, personalizedDescKeys]);

	const renderAttachmentSection = useCallback(() => {
		const hasAttachments = attachmentList.length > 0;
		const { Dragger } = Upload;

		// Dragger 上传组件配置（直接内联，避免在 useCallback 内部使用 useMemo）
		const draggerProps: UploadProps = {
			...uploadProps,
			showUploadList: false,
		};

		// Dragger 的额外属性（不需要从 uploadProps 展开）
		const draggerDisabled = loading || isReadonly;

		// 暂无附件
		if (!hasAttachments && mode !== "edit") {
			return <>暂无附件</>;
		}

		return (
			<div className="flex w-full flex-col gap-2 rounded border border-[var(--oo-colorBorder)] p-4">
				{/* 使用 Dragger 组件作为上传区域 */}
				{!isReadonly && (
					<Dragger
						{...draggerProps}
						disabled={draggerDisabled}
						className="!rounded-lg !border-dashed !border-[#ABC4FF] !bg-white hover:!border-[#2D5BFF] [&_.ant-upload-drag-icon]:!mb-1 [&_.ant-upload-drag-icon_.anticon]:!text-[#2D5BFF] [&_.ant-upload-hint]:!text-xs [&_.ant-upload-hint]:!text-[#667085] [&_.ant-upload-text]:!text-sm [&_.ant-upload-text]:!text-[#1F2937]"
					>
						<div className="py-3">
							<p className="ant-upload-drag-icon">
								<InboxOutlined />
							</p>
							<p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
							<p className="ant-upload-hint">
								支持
								xls/xlsx/csv/ppt/pptx/doc/docx/pdf/bmp/gif/jpg/jpeg/png/zip/rar，单个不超过
								50MB
							</p>
						</div>
					</Dragger>
				)}

				{attachmentList.length > 0 && (
					<div className="flex flex-col gap-2">
						{attachmentList.map((file) => {
							const displayName = getAttachmentDisplayName(file);
							const previewable = canPreviewAttachment(file);

							return (
								<div
									key={file.id}
									className="rounded border border-[#E5EBF6] bg-white px-3 py-2 transition-all hover:border-[#C7D6FF] hover:shadow-[0_2px_8px_rgba(45,91,255,0.08)]"
								>
									<div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
												<Typography.Text
													ellipsis={{ tooltip: displayName }}
													className="max-w-full font-medium md:max-w-[260px]"
												>
													{displayName}
												</Typography.Text>
												{file.source === "local" && !isReadonly && (
													<Tag color="processing" className="m-0">
														新
													</Tag>
												)}
											</div>
										</div>

										<div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:flex-nowrap md:justify-end md:pl-2">
											{previewable && (
												<Button
													type="link"
													icon={<EyeOutlined />}
													onClick={() => handlePreviewAttachment(file)}
													className="!h-6 !px-0"
												>
													预览
												</Button>
											)}
											<Button
												type="link"
												icon={<DownloadOutlined />}
												onClick={() => handleDownloadAttachment(file)}
												className="!h-6 !px-0"
											>
												下载
											</Button>
											{!isReadonly && (
												<Button
													type="link"
													danger
													icon={<DeleteOutlined />}
													onClick={() => {
														setAttachmentList((prev) =>
															prev.filter(
																(item) => item.id !== file.id,
															),
														);
													}}
													className="!h-6 !px-0"
												>
													删除
												</Button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	}, [
		attachmentList,
		handleDownloadAttachment,
		handlePreviewAttachment,
		isReadonly,
		loading,
		uploadProps,
	]);

	const baseInfoColumns: ProDescriptionsItemProps<JobDescDrawerRecord>[] = useMemo(
		() => [
			{
				title: "组织名称",
				dataIndex: "deptName",
				render: (_, entity) => (
					<Typography.Paragraph
						ellipsis={{
							rows: 2,
							tooltip: entity?.deptName || "-",
						}}
						style={{ marginBottom: 0 }}
					>
						{entity?.deptName || "-"}
					</Typography.Paragraph>
				),
			},
			{
				title: "岗位名称",
				dataIndex: "jobName",
			},
			{
				title: "职位名称",
				dataIndex: "positionName",
			},
			{
				title: "职级",
				dataIndex: "postGrade",
				render: (_, entity) => entity?.postGrade ?? "-",
			},
			{
				title: "审核部门",
				dataIndex: "auditDeptName",
				render: (_, entity) => entity?.auditDeptName ?? entity?.auditDept ?? "-",
			},
			{
				title: "岗位基本描述",
				dataIndex: "basicDesc",
				render: () => renderBasicDescription(),
			},
			{
				title: "岗位个性描述",
				dataIndex: "personalizedDesc",
				render: () => renderPersonalizedForm(),
			},
			{
				title: "会议附件",
				dataIndex: "attachments",
				render: () => renderAttachmentSection(),
			},
		],
		[renderAttachmentSection, renderBasicDescription, renderPersonalizedForm],
	);

	// 抽屉标题
	const getTitle = () => {
		if (!record) {
			switch (mode) {
				case "edit":
					return "新增岗位描述";
				case "readonly":
					return "查看岗位描述";
				default:
					return "岗位描述";
			}
		}
		const statusValue = getCurrentStatusValue();
		return (
			<div className="flex items-center gap-3">
				<span className="text-lg font-medium">{record.jobName}</span>
				{getStatusTag(statusValue)}
			</div>
		);
	};

	const renderFooter = () => {
		if (!record) {
			return null;
		}
		if (auditActions) {
			const {
				onReject,
				onApprove,
				approveLoading,
				rejectLoading,
				approveDisabled,
				rejectDisabled,
			} = auditActions;
			return (
				<div className="flex justify-end gap-2">
					<Button
						onClick={onReject}
						disabled={Boolean(rejectDisabled)}
						loading={rejectLoading}
					>
						驳回
					</Button>
					<Button
						type="primary"
						onClick={onApprove}
						disabled={Boolean(approveDisabled)}
						loading={approveLoading}
					>
						通过
					</Button>
				</div>
			);
		}
		if (isReadonly) {
			return null;
		}
		return (
			<div className="flex justify-end gap-2">
				<Button onClick={onClose}>取消</Button>
				<Button
					type="primary"
					loading={loading}
					onClick={() => {
						if (!onSubmit) {
							message.warning("当前模式不支持提交操作");
							return;
						}
						if (personalizedDescKeys.length === 0) {
							void handleSubmit({});
							return;
						}
						formRef.current?.submit();
					}}
				>
					更新
				</Button>
			</div>
		);
	};

	return (
		<Drawer
			title={getTitle()}
			open={open}
			onClose={onClose}
			width={width}
			placement="right"
			destroyOnHidden
			closable={{ placement: "end" }}
			footer={renderFooter()}
		>
			{/* 显示拒绝原因 - auditComment 字段 */}
			{record?.auditComment && (
				<Alert
					message={`驳回原因：${record.auditComment}`}
					type="error"
					showIcon
					className="mb-4"
				/>
			)}

			<ProDescriptions<JobDescDrawerRecord>
				column={1}
				dataSource={record || undefined}
				columns={baseInfoColumns}
				size="small"
				styles={{
					label: {
						minWidth: 100,
						fontWeight: 500,
						display: "flex",
						justifyContent: "flex-end",
					},
					content: { width: "100%", flex: 1 },
				}}
				colon={false}
			/>

			<ImagePreviewModal
				open={imagePreviewOpen}
				onClose={() => setImagePreviewOpen(false)}
				items={imagePreviewItems}
				currentIndex={imagePreviewIndex}
				onIndexChange={setImagePreviewIndex}
				fetchBlobSrc={fetchBlobSrc}
			/>
		</Drawer>
	);
}
