/**
 * 上传附件弹窗组件（通用）
 */

import type { UploadFile, UploadProps } from "antd";
import type { MouseEventHandler } from "react";
import { ossUploadFile } from "#src/api/common";
import { CheckCircleFilled, InboxOutlined } from "@ant-design/icons";
import { App, Divider, Modal, Typography, Upload } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { UPLOAD_CONFIG } from "../index";

const { Dragger } = Upload;

/**
 * 上传附件弹窗属性
 */
export interface UploadAttachmentModalProps {
	open: boolean;
	onCancel: () => void;
	onSuccess?: (
		fileList: Array<{
			id?: number | string;
			fileName: string;
			newFileName?: string;
			url?: string;
			originalFilename: string;
		}>,
	) => void;
}

/**
 * 上传附件弹窗组件
 */
export function UploadAttachmentModal({ open, onCancel, onSuccess }: UploadAttachmentModalProps) {
	const { message } = App.useApp();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	// 格式化文件大小
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) {
			return `${bytes}B`;
		}
		if (bytes < 1024 * 1024) {
			return `${Math.round(bytes / 1024)}KB`;
		}
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	};

	// 上传文件列表
	const uploadFileList = useMemo<UploadFile[]>(() => {
		if (!selectedFile) {
			return [];
		}
		return [
			{
				uid: "attachment-upload",
				name: selectedFile.name,
				status: "done",
			},
		];
	}, [selectedFile]);

	// 选中的文件信息
	const selectedFileInfo = useMemo(() => {
		if (!selectedFile) {
			return null;
		}
		return {
			name: selectedFile.name,
			size: formatFileSize(selectedFile.size),
			uploadedAt: dayjs().format("YYYY/MM/DD HH:mm:ss"),
		};
	}, [selectedFile]);

	/**
	 * 上传配置
	 */
	const uploadProps: UploadProps = {
		name: "file",
		multiple: false,
		maxCount: 1,
		accept: ".pdf,.jpg,.png,.jpeg",
		fileList: uploadFileList,
		showUploadList: false,
		beforeUpload: (file) => {
			// 验证文件类型
			const allowedTypes: readonly string[] = [
				"application/pdf",
				"image/jpeg",
				"image/png",
				"image/jpg",
			];
			const isValidType = allowedTypes.includes(file.type);
			if (!isValidType) {
				message.error("只支持上传 PDF/JPG/PNG/JPEG 格式文件");
				return Upload.LIST_IGNORE;
			}

			// 验证文件大小
			if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
				message.error(`文件大小不能超过 ${UPLOAD_CONFIG.MAX_SIZE_TEXT}`);
				return Upload.LIST_IGNORE;
			}

			setSelectedFile(file);
			message.success(`已选择文件：${file.name}`);
			return false; // 阻止自动上传
		},
		onChange: (info) => {
			// 文件列表变化时更新 selectedFile
			if (info.fileList.length === 0) {
				setSelectedFile(null);
			}
		},
		onRemove: () => {
			setSelectedFile(null);
			return true;
		},
	};

	// 删除选中的文件
	const handleRemoveSelectedFile = () => {
		setSelectedFile(null);
		return true;
	};

	// 触发上传对话框
	const triggerUploadDialog = () => {
		const input = document.querySelector<HTMLInputElement>(
			".attachment-upload-dragger input[type='file']",
		);
		if (input) {
			input.value = "";
			input.click();
		}
	};

	// 处理重新上传点击
	const handleReuploadClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		triggerUploadDialog();
	};

	// 处理删除链接点击
	const handleDeleteLinkClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		handleRemoveSelectedFile();
	};

	/**
	 * 处理取消
	 */
	const handleCancel = () => {
		setSelectedFile(null);
		onCancel();
	};

	/**
	 * 处理确认上传
	 */
	const handleOk = async () => {
		if (!selectedFile) {
			message.warning("请选择一个文件");
			return;
		}

		setIsUploading(true);
		try {
			const result = await ossUploadFile(selectedFile);
			const id = result.id;
			const fileName = result.fileName;
			const newFileName = result.newFileName;
			const url = result.fileName;
			const originalFilename = result.originalFilename;

			if (fileName && originalFilename) {
				message.success("成功上传文件");
				onSuccess?.([
					{
						id,
						fileName,
						newFileName,
						url,
						originalFilename,
					},
				]);
				handleCancel();
			} else {
				message.error("上传失败，请重试");
			}
		} catch (error) {
			console.error("上传失败:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Modal
			title="上传文件"
			open={open}
			onCancel={handleCancel}
			onOk={handleOk}
			centered
			width={600}
			confirmLoading={isUploading}
			okText="确定"
			cancelText="取消"
			okButtonProps={{
				disabled: !selectedFile || isUploading,
			}}
		>
			<div className="py-4">
				<Dragger className="attachment-upload-dragger" {...uploadProps}>
					<div className="flex h-24 items-stretch">
						{selectedFileInfo ? (
							<div className="flex min-w-0 flex-1 flex-col justify-center text-left">
								<div className="flex items-center gap-2 text-sm text-gray-900">
									<CheckCircleFilled className="flex-shrink-0 text-lg text-green-500" />
									<span
										className="truncate font-medium"
										title={selectedFileInfo.name}
									>
										{selectedFileInfo.name}
									</span>
								</div>
								<div className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
									<span>
										文件大小：
										{selectedFileInfo.size}
									</span>
									<span>
										上传时间：
										{selectedFileInfo.uploadedAt}
									</span>
								</div>
								<div className="mt-2 flex items-center gap-3 text-xs">
									<Typography.Link onClick={handleReuploadClick}>
										重新上传
									</Typography.Link>
									<Divider type="vertical" className="!m-0" />
									<Typography.Link type="danger" onClick={handleDeleteLinkClick}>
										删除
									</Typography.Link>
								</div>
							</div>
						) : (
							<div className="flex flex-1 items-center gap-4 text-left">
								<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl text-blue-500">
									<InboxOutlined />
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-sm font-medium text-gray-900">
										选择文件或将文件拖入此处
									</div>
									<div className="mt-1 text-xs text-gray-500">
										支持上传
										{UPLOAD_CONFIG.TYPE_TEXT}
										格式，且单个文件不超过 {UPLOAD_CONFIG.MAX_SIZE_TEXT}
									</div>
								</div>
								<div className="flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
									≤ {UPLOAD_CONFIG.MAX_SIZE_TEXT}
								</div>
							</div>
						)}
					</div>
				</Dragger>
			</div>
		</Modal>
	);
}
