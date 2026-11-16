import type { UploadFile } from "antd/es/upload/interface";

import {
	downloadJobDescTemplate,
	importJobDescManagement,
	validateJobDescImport,
} from "#src/api/tag-management/job-desc/management";
import {
	CheckCircleFilled,
	CloseCircleOutlined,
	DownloadOutlined,
	DownOutlined,
	InboxOutlined,
	UpOutlined,
} from "@ant-design/icons";
import { Button, Divider, message, Modal, Table, Typography, Upload } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";

const { Dragger } = Upload;

interface ImportErrorItem {
	rowIndex: number;
	errorMessage: string;
}

interface ImportResultInfo {
	totalRows: number;
	successRows: number;
	errorRows: number;
	errorList: ImportErrorItem[];
	errorFields: string[];
	success?: boolean;
}

interface ImportJobDescModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

function formatFileSize(bytes: number) {
	if (bytes < 1024) {
		return `${bytes}B`;
	}
	if (bytes < 1024 * 1024) {
		return `${Math.round(bytes / 1024)}KB`;
	}
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function collectErrorFields(errorList: ImportErrorItem[]) {
	const fieldSet = new Set<string>();
	errorList.forEach(({ errorMessage }) => {
		if (!errorMessage) {
			return;
		}
		const bracketMatch = errorMessage.match(/([\u4E00-\u9FA5A-Z0-9]+)[[：]/i);
		if (bracketMatch?.[1]) {
			fieldSet.add(bracketMatch[1]);
			return;
		}
		const colonMatch = errorMessage.match(/^(.*?)错误/);
		if (colonMatch?.[1]) {
			fieldSet.add(colonMatch[1]);
		}
	});
	return Array.from(fieldSet);
}

export function ImportJobDescModal({ open, onClose, onSuccess }: ImportJobDescModalProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const [resultInfo, setResultInfo] = useState<{
		result: ImportResultInfo | null;
		showDetail: boolean;
		type: "validate" | "import" | null;
	}>({
		result: null,
		showDetail: false,
		type: null,
	});

	const resultData = resultInfo.result;
	const showDetail = resultInfo.showDetail;
	const resultType = resultInfo.type;

	const uploadFileList = useMemo<UploadFile[]>(() => {
		if (!selectedFile) {
			return [];
		}
		return [
			{
				uid: "job-desc-import",
				name: selectedFile.name,
				status: "done",
			},
		];
	}, [selectedFile]);

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

	const importErrorColumns = useMemo(
		() => [
			{
				title: "错误行",
				dataIndex: "rowIndex",
				key: "rowIndex",
				width: 90,
				align: "center" as const,
				render: (value: number) => (
					<span
						style={{
							color: "#cf1322",
							fontWeight: 500,
							backgroundColor: "#fff2f0",
							padding: "2px 6px",
							borderRadius: "3px",
							fontSize: 12,
						}}
					>
						第{value}行
					</span>
				),
			},
			{
				title: "错误原因",
				dataIndex: "errorMessage",
				key: "errorMessage",
				width: 400,
				render: (text: string) => {
					const messages =
						text?.split(/[；;，]/).filter((item) => item.trim().length > 0) ?? [];
					if (!messages.length) {
						return <span style={{ fontSize: 12, color: "#595959" }}>-</span>;
					}
					return (
						<ul className="m-0 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-[#595959]">
							{messages.map((msg) => (
								<li key={msg} className="list-disc">
									{msg.trim()}
								</li>
							))}
						</ul>
					);
				},
			},
		],
		[],
	);

	const errorData = useMemo(() => resultData?.errorList ?? [], [resultData]);

	const resetState = () => {
		setSelectedFile(null);
		setIsUploading(false);
		setIsValidating(false);
		setResultInfo({ result: null, showDetail: false, type: null });
	};

	const handleClose = () => {
		resetState();
		onClose();
	};

	const handleFileSelect = async (file: File) => {
		const allowedTypes: readonly string[] = [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
		];

		if (!allowedTypes.includes(file.type)) {
			message.error("请选择 Excel 格式文件（.xlsx 或 .xls）");
			return false;
		}

		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			message.error("文件大小不能超过 10MB");
			return false;
		}

		setSelectedFile(file);
		setResultInfo({ result: null, showDetail: false, type: null });

		// 自动调用校验接口
		setIsValidating(true);
		try {
			const result = await validateJobDescImport(file);

			if (!result) {
				message.error("校验失败，返回数据为空");
				setResultInfo({ result: null, showDetail: false, type: null });
				return false;
			}

			const normalizedResult: ImportResultInfo = {
				totalRows: result.totalRows ?? 0,
				successRows: result.successRows ?? 0,
				errorRows: result.errorRows ?? 0,
				errorList: Array.isArray(result.errorList) ? result.errorList : [],
				errorFields: [],
				success: result.success,
			};
			normalizedResult.errorFields = collectErrorFields(normalizedResult.errorList);
			setResultInfo({ result: normalizedResult, showDetail: false, type: "validate" });

			if (result.success) {
				message.success(`文件校验通过，共 ${result.totalRows} 条数据`);
			} else {
				message.warning(
					`文件校验失败，失败 ${result.errorRows}/${result.totalRows} 条，请查看错误详情`,
				);
			}
		} catch (error) {
			console.error("校验失败:", error);
			message.error("文件校验失败，请重试");
			setResultInfo({ result: null, showDetail: false, type: null });
		} finally {
			setIsValidating(false);
		}

		return false;
	};

	const handleRemoveSelectedFile = () => {
		resetState();
		return true;
	};

	const triggerUploadDialog = () => {
		const input = document.querySelector<HTMLInputElement>(
			".job-desc-upload-dragger input[type='file']",
		);
		if (input) {
			input.value = "";
			input.click();
		}
	};

	const handleReuploadClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		triggerUploadDialog();
	};

	const handleDeleteLinkClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
		event.preventDefault();
		event.stopPropagation();
		handleRemoveSelectedFile();
	};

	const handleImportConfirm = async () => {
		if (!selectedFile) {
			message.warning("请先选择要导入的文件");
			return;
		}

		setIsUploading(true);
		try {
			const result = await importJobDescManagement(selectedFile);

			if (!result) {
				message.error("导入失败，返回数据为空");
				setResultInfo({ result: null, showDetail: false, type: null });
				return;
			}

			if (result.success) {
				message.success(
					`岗位描述导入成功，成功 ${result.successRows}/${result.totalRows} 条`,
				);
				onSuccess?.();
				handleClose();
				return;
			}

			const normalizedResult: ImportResultInfo = {
				totalRows: result.totalRows ?? 0,
				successRows: result.successRows ?? 0,
				errorRows: result.errorRows ?? 0,
				errorList: Array.isArray(result.errorList) ? result.errorList : [],
				errorFields: [],
				success: result.success,
			};
			normalizedResult.errorFields = collectErrorFields(normalizedResult.errorList);
			setResultInfo({ result: normalizedResult, showDetail: false, type: "import" });
			message.error("导入失败，请查看错误详情");
		} catch (error) {
			console.error("导入失败:", error);
			setResultInfo({ result: null, showDetail: false, type: null });
		} finally {
			setIsUploading(false);
		}
	};

	const handleDownloadTemplate = async () => {
		try {
			const blob = await downloadJobDescTemplate();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "岗位描述导入模板.xlsx";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			message.success("模板下载成功");
		} catch {
			message.error("模板下载失败");
		}
	};

	return (
		<Modal
			title="导入岗位基本描述"
			open={open}
			onCancel={handleClose}
			centered
			width={600}
			footer={[
				<Button key="cancel" onClick={handleClose}>
					取消
				</Button>,
				<Button
					key="import"
					type="primary"
					disabled={
						!selectedFile ||
						isUploading ||
						isValidating ||
						(resultData !== null &&
							resultType === "validate" &&
							resultData.success === false &&
							resultData.errorRows > 0)
					}
					loading={isUploading}
					onClick={handleImportConfirm}
				>
					{isUploading ? "导入中..." : "导入"}
				</Button>,
			]}
		>
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
						<Button
							type="default"
							icon={<DownloadOutlined />}
							onClick={handleDownloadTemplate}
						>
							导出模板
						</Button>
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
							className="job-desc-upload-dragger"
							beforeUpload={handleFileSelect}
							accept=".xlsx,.xls"
							maxCount={1}
							disabled={isUploading || isValidating}
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
											<span>文件大小： {selectedFileInfo.size}</span>
											<span>上传时间： {selectedFileInfo.uploadedAt}</span>
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
											≤ 10MB
										</div>
									</div>
								)}
							</div>
						</Dragger>
						{/* 结果展示 */}
						{isValidating && (
							<div className="mt-4 rounded border border-blue-300 bg-white">
								<div className="flex items-center gap-2 px-4 py-3 font-semibold text-blue-600">
									<span>正在校验文件...</span>
								</div>
							</div>
						)}
						{resultData && !isValidating && (
							<div
								className={`mt-4 rounded border ${resultData.errorRows > 0 ? "border-red-300" : "border-green-300"} bg-white`}
							>
								{resultData.errorRows > 0 ? (
									<>
										<div className="border-b border-red-100 px-4 py-3">
											<div className="flex items-center gap-2 font-semibold text-red-600">
												<CloseCircleOutlined className="text-lg text-red-500" />
												<span>
													{resultType === "validate"
														? "校验失败"
														: "导入失败"}
													：{resultData.errorRows ?? 0}
													行数据有误
												</span>
											</div>
										</div>
										<div className="border-b border-red-100 px-4 py-2 text-sm text-gray-700">
											总计 {resultData.totalRows ?? 0} 行，成功{" "}
											{resultData.successRows ?? 0} 行，失败{" "}
											{resultData.errorRows ?? 0} 行
										</div>
										<div className="flex items-center justify-between px-4 py-2 text-sm text-gray-700">
											请检查：
											{(resultData.errorFields?.length ?? 0) > 0
												? resultData.errorFields?.join("、")
												: "导入字段"}
											列，数据格式有误
											<div
												className="ml-2 inline-flex cursor-pointer select-none items-center gap-1 text-blue-500"
												onClick={() =>
													setResultInfo((prev) => ({
														result: prev.result,
														showDetail: !prev.showDetail,
														type: prev.type,
													}))
												}
											>
												查看详情
												{showDetail ? <UpOutlined /> : <DownOutlined />}
											</div>
										</div>
										<div
											className="overflow-hidden px-4"
											style={{
												maxHeight: showDetail ? 384 : 0,
												opacity: showDetail ? 1 : 0,
												transition:
													"max-height 300ms ease, opacity 300ms ease, padding 300ms ease",
											}}
										>
											<Table<ImportErrorItem>
												dataSource={errorData}
												columns={importErrorColumns}
												pagination={false}
												size="small"
												scroll={{ y: 200 }}
												rowKey={(record) =>
													`${record.rowIndex}-${record.errorMessage}`
												}
											/>
										</div>
									</>
								) : (
									<div className="px-4 py-3">
										<div className="flex items-center gap-2 font-semibold text-green-600">
											<CheckCircleFilled className="text-lg text-green-500" />
											<span>
												{resultType === "validate"
													? "校验通过"
													: "导入成功"}
												：共
												{resultData.totalRows ?? 0}
												行数据
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
}
