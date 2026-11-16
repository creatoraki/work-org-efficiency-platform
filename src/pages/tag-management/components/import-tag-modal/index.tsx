import type { UploadFile } from "antd/es/upload/interface";
import type { MouseEventHandler } from "react";

import { BasicButton } from "#src/components";
import { CheckCircleFilled, DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { Alert, Button, Divider, message, Modal, Typography, Upload } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Dragger } = Upload;

/**
 * 导入标签弹窗组件属性
 */
export interface ImportTagModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 导入确认回调 */
	onImport: (file: File) => Promise<void>;
	/** 模板下载回调 */
	onDownloadTemplate: () => void;
}

/**
 * 导入标签弹窗组件
 *
 * @param props - 组件属性
 * @param props.open - 是否显示弹窗
 * @param props.onClose - 关闭回调
 * @param props.onImport - 导入确认回调
 * @param props.onDownloadTemplate - 模板下载回调
 * @returns 导入标签弹窗组件
 */
export function ImportTagModal({
	open,
	onClose,
	onImport,
	onDownloadTemplate,
}: ImportTagModalProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	// 格式化文件大小
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
	};

	// 上传文件列表
	const uploadFileList = useMemo<UploadFile[]>(() => {
		if (!selectedFile) {
			return [];
		}
		return [
			{
				uid: "tag-import",
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
	 * 处理文件选择（不立即上传）
	 *
	 * @param file - 选中的文件
	 * @returns 是否阻止自动上传
	 */
	const handleFileSelect = (file: File) => {
		// 验证文件类型
		const allowedTypes: readonly string[] = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
			"application/vnd.ms-excel", // .xls
		];

		if (!allowedTypes.includes(file.type)) {
			message.error("请选择 Excel 格式文件（.xlsx 或 .xls）");
			return false;
		}

		// 验证文件大小（70MB）
		const maxSize = 70 * 1024 * 1024;
		if (file.size > maxSize) {
			message.error("文件大小不能超过 70MB");
			return false;
		}

		setSelectedFile(file);
		message.success(`已选择文件：${file.name}`);
		return false; // 阻止自动上传
	};

	/**
	 * 删除选中的文件
	 *
	 * @returns 是否允许删除
	 */
	const handleRemoveSelectedFile = () => {
		setSelectedFile(null);
		return true;
	};

	/**
	 * 触发上传对话框
	 */
	const triggerUploadDialog = () => {
		const input = document.querySelector<HTMLInputElement>(
			".tag-import-upload-dragger input[type='file']",
		);
		if (input) {
			input.value = "";
			input.click();
		}
	};

	/**
	 * 处理重新上传点击
	 */
	const handleReuploadClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		triggerUploadDialog();
	};

	/**
	 * 处理删除链接点击
	 */
	const handleDeleteLinkClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		handleRemoveSelectedFile();
	};

	/**
	 * 处理导入确认
	 */
	const handleImportConfirm = async () => {
		if (!selectedFile) {
			message.warning("请先选择要导入的文件");
			return;
		}

		setIsUploading(true);
		try {
			await onImport(selectedFile);
			setSelectedFile(null);
			onClose();
		} catch (error) {
			console.error("导入失败:", error);
			throw error;
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * 重置状态
	 */
	const handleCancel = () => {
		setSelectedFile(null);
		setIsUploading(false);
		onClose();
	};

	return (
		<Modal
			title="导入标签"
			open={open}
			onCancel={handleCancel}
			centered
			width={600}
			footer={[
				<Button key="cancel" onClick={handleCancel}>
					取消
				</Button>,
				<Button
					key="import"
					type="primary"
					disabled={!selectedFile || isUploading}
					loading={isUploading}
					onClick={handleImportConfirm}
				>
					{isUploading ? "导入中..." : "导入"}
				</Button>,
			]}
		>
			<Alert
				message='此方式导入的标签类型为"手工标签"'
				type="info"
				showIcon
				closable
				className="mb-4"
			/>
			<div className="space-y-4 py-5">
				{/* 步骤一：模板下载 */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-start">
						<span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
							1
						</span>
						<span className="text-sm">请导出模板，并按照模板填入对应字段</span>
					</div>
					<div className="relative pl-10 before:absolute before:left-[10px] before:top-0 before:h-full before:w-1 before:rounded-sm before:bg-gray-300 before:content-['']">
						<BasicButton
							type="default"
							onClick={onDownloadTemplate}
							icon={<DownloadOutlined />}
						>
							导出模板
						</BasicButton>
					</div>
				</div>

				{/* 步骤二：文件上传 */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-start">
						<span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
							2
						</span>
						<span className="text-sm">请将填写好的模板，进行导入</span>
					</div>
					<div className="relative pl-10 before:absolute before:left-[10px] before:top-0 before:h-full before:w-1 before:rounded-sm before:bg-gray-300 before:content-['']">
						<Dragger
							className="tag-import-upload-dragger"
							beforeUpload={handleFileSelect}
							accept=".xlsx,.xls"
							maxCount={1}
							disabled={isUploading}
							fileList={uploadFileList}
							showUploadList={false}
							onRemove={handleRemoveSelectedFile}
						>
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
											<Typography.Link
												type="danger"
												onClick={handleDeleteLinkClick}
											>
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
												选择 Excel 文件或将文件拖入此处
											</div>
											<div className="mt-1 text-xs text-gray-500">
												仅支持 .xlsx / .xls，字段需与模板保持一致
											</div>
										</div>
										<div className="flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
											≤ 70MB
										</div>
									</div>
								)}
							</div>
						</Dragger>
					</div>
				</div>
			</div>
		</Modal>
	);
}
