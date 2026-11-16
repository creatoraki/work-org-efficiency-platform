import type { ExportTemplateParams } from "#src/api/personnel-archive/archive-management";
import type { BusinessTagTreeNode } from "#src/pages/tag-management/tag-matching/model/types";
import type { RadioChangeEvent, SelectProps } from "antd";

import type { UploadFile } from "antd/es/upload/interface";
import type { MouseEventHandler } from "react";
import type { SelectedPersonnel } from "./personnel-selector-modal";

import { importData } from "#src/api/common";
import { downloadFileFromOss } from "#src/api/file/oss";
import {
	exportImportTemplate,
	fetchUserMaintainTagTree,
	getFileExportDetail,
} from "#src/api/personnel-archive/archive-management";
import { convertUserTagTreeToBusinessTagTree } from "#src/api/tag-management/tag-matching/model";
import { CheckCircleFilled, DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRequest } from "ahooks";
import {
	App,
	Button,
	Divider,
	Form,
	Input,
	Modal,
	Radio,
	Tooltip,
	TreeSelect,
	Typography,
	Upload,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { PersonnelSelectorModal } from "./personnel-selector-modal";

const { Dragger } = Upload;

/**
 * 导入档案弹窗组件 Props
 */
interface ImportArchiveModalProps {
	/** 是否显示弹窗 */
	open: boolean;
	/** 取消回调 */
	onCancel: () => void;
	/** 导入成功回调 */
	onSuccess?: () => void;
	/** 维护人下拉框配置 */
	maintainerFieldProps: SelectProps;
}

/**
 * 导入档案弹窗组件
 *
 * @example
 * ```tsx
 * <ImportArchiveModal
 *   open={visible}
 *   onCancel={handleCancel}
 *   onSuccess={handleSuccess}
 *   maintainerFieldProps={maintainerProps}
 * />
 * ```
 */
export const ImportArchiveModal: React.FC<ImportArchiveModalProps> = ({
	open,
	onCancel,
	onSuccess,
	maintainerFieldProps: _maintainerFieldProps,
}) => {
	const { message } = App.useApp();
	// 获取标签树数据（每次打开弹窗时刷新，确保数据最新）
	const { data: tagTreeData = [] } = useRequest(
		async () => {
			const result = await fetchUserMaintainTagTree();
			return convertUserTagTreeToBusinessTagTree(result ?? []);
		},
		{
			refreshDeps: [open],
			ready: open, // 只在弹窗打开时才请求
		},
	);

	// 内部状态管理
	const [importFile, setImportFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [importTemplateType, setImportTemplateType] = useState<"all" | "selected">("all");
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [personnelScope, setPersonnelScope] = useState<"all" | "selected">("all");
	const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
	const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
	const [selectedPersonnel, setSelectedPersonnel] = useState<SelectedPersonnel[]>([]);
	// 导出任务ID（用于轮询进度）
	const [exportTaskId, setExportTaskId] = useState<number | null>(null);
	// 是否已自动下载（避免重复下载）
	const hasAutoDownloadedRef = useRef(false);
	// 上次导出时的表单参数签名（用于判断是否需要重新导出）
	const lastExportParamsRef = useRef<string>("");
	const navigate = useNavigate();

	// 格式化已选人员显示文本
	const selectedPersonnelDisplayText = useMemo(() => {
		if (selectedPersonnel.length === 0) {
			return "";
		}
		const names = selectedPersonnel.map((p) => p.name);
		if (names.length <= 3) {
			return names.join("、");
		}
		return `${names.slice(0, 3).join("、")} 等 ${selectedPersonnel.length} 人`;
	}, [selectedPersonnel]);

	// 已选人员完整名称列表（用于 title 提示）
	const selectedPersonnelFullNames = useMemo(() => {
		return selectedPersonnel.map((p) => p.name).join("、");
	}, [selectedPersonnel]);

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
		if (!importFile) {
			return [];
		}
		return [
			{
				uid: "archive-import",
				name: importFile.name,
				status: "done",
			},
		];
	}, [importFile]);

	// 选中的文件信息
	const selectedFileInfo = useMemo(() => {
		if (!importFile) {
			return null;
		}
		return {
			name: importFile.name,
			size: formatFileSize(importFile.size),
			uploadedAt: dayjs().format("YYYY/MM/DD HH:mm:ss"),
		};
	}, [importFile]);

	// 收集节点下所有 isTag 为 true 的子节点 ID
	const collectTagNodeIds = useMemo(() => {
		const collectIds = (node: BusinessTagTreeNode, ids: string[] = []): string[] => {
			if (node.isTag) {
				ids.push(node.value);
			}
			if (node.children && node.children.length > 0) {
				node.children.forEach((child) => {
					collectIds(child, ids);
				});
			}
			return ids;
		};

		const idMap = new Map<string, string[]>();
		const traverse = (nodes: BusinessTagTreeNode[]) => {
			nodes.forEach((node) => {
				if (!node.isTag && node.children && node.children.length > 0) {
					// 收集该节点下所有标签节点 ID
					const tagIds = collectIds(node, []);
					if (tagIds.length > 0) {
						idMap.set(node.value, tagIds);
					}
				}
				if (node.children && node.children.length > 0) {
					traverse(node.children);
				}
			});
		};
		traverse(tagTreeData);
		return idMap;
	}, [tagTreeData]);

	// 处理树选择变化：选中父节点时自动选中所有 tags 子节点
	const handleTreeSelectChange = (value: string[]) => {
		const allTagIds = new Set<string>();

		// 遍历所有选中的节点
		value.forEach((selectedId) => {
			// 检查是否是父节点
			const tagIds = collectTagNodeIds.get(selectedId);
			if (tagIds) {
				// 这是父节点，添加所有子标签节点
				tagIds.forEach((tagId) => {
					allTagIds.add(tagId);
				});
			} else {
				// 这是标签节点，直接添加
				allTagIds.add(selectedId);
			}
		});

		// 为了保持视觉效果，需要同时包含父节点和子标签节点
		// 但实际存储时，我们需要一个包含父节点的列表用于 TreeSelect 的 value
		// 同时保存所有标签节点 ID
		const finalTagIds = Array.from(allTagIds);

		// 为了 TreeSelect 能正确显示选中状态，我们需要包含父节点
		// 但只保存标签节点 ID 到 selectedTagIds
		setSelectedTagIds(finalTagIds);
	};

	// 根据 value 查找对应的 label
	const findLabelByValue = useMemo(() => {
		const labelMap = new Map<string, string>();
		const traverse = (nodes: BusinessTagTreeNode[]) => {
			nodes.forEach((node) => {
				labelMap.set(node.value, node.label);
				if (node.children && node.children.length > 0) {
					traverse(node.children);
				}
			});
		};
		traverse(tagTreeData);
		return labelMap;
	}, [tagTreeData]);

	// 计算 TreeSelect 的 value：包含父节点和标签节点，用于显示
	const treeSelectValue = useMemo(() => {
		const valueSet = new Set<string>(selectedTagIds);

		// 找出哪些父节点应该被选中（其所有子标签节点都在 selectedTagIds 中）
		collectTagNodeIds.forEach((tagIds, parentId) => {
			const allChildrenSelected = tagIds.every((tagId) => selectedTagIds.includes(tagId));
			if (allChildrenSelected && tagIds.length > 0) {
				valueSet.add(parentId);
			}
		});

		return Array.from(valueSet);
	}, [selectedTagIds, collectTagNodeIds]);

	// 自定义 maxTagPlaceholder：悬浮时显示所有隐藏的标签名
	const maxTagPlaceholder = (
		omittedValues: Array<{ value?: string | number; label?: React.ReactNode }>,
	) => {
		const labels = omittedValues
			.map((item) => {
				const value = item.value ? String(item.value) : "";
				// 如果 item.label 已经是字符串，直接使用；否则从 findLabelByValue 查找
				const label =
					typeof item.label === "string"
						? item.label
						: (value ? findLabelByValue.get(value) : "") || value;
				return label;
			})
			.filter(Boolean);

		return (
			<Tooltip
				title={
					<div className="max-h-60 overflow-y-auto">
						{labels.map((label) => (
							<div key={label} className="py-1">
								{label}
							</div>
						))}
					</div>
				}
				placement="topLeft"
			>
				<span className="cursor-pointer">+ {omittedValues.length} ...</span>
			</Tooltip>
		);
	};

	// 初始化：当弹窗打开时，清空选中项（选择"全部"时，传给接口的是空数组，表示全部）
	useEffect(() => {
		if (open) {
			setSelectedTagIds([]);
		}
	}, [open]);

	// 处理文件选择
	const handleFileSelect = (file: File) => {
		setImportFile(file);
		message.success(`已选择文件：${file.name}`);
		return false; // 阻止自动上传
	};

	// 删除选中的文件
	const handleRemoveSelectedFile = () => {
		setImportFile(null);
		return true;
	};

	// 触发上传对话框
	const triggerUploadDialog = () => {
		const input = document.querySelector<HTMLInputElement>(
			".archive-import-upload-dragger input[type='file']",
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

	// 处理模板类型改变
	const handleTemplateTypeChange = (e: RadioChangeEvent) => {
		const newType = e.target.value as "all" | "selected";
		setImportTemplateType(newType);
		setSelectedTagIds([]);
	};

	// 导出模板（TanStack Query mutation：成功保存任务ID用于轮询，失败提示导出失败）
	const { mutate: runExportTemplate, isPending: isExportingTemplate } = useMutation({
		mutationFn: (params: ExportTemplateParams) => exportImportTemplate(params),
		onSuccess: (taskId) => {
			setExportTaskId(taskId);
			message.success("正在导出");
		},
		onError: () => {
			message.error("导出模板失败");
		},
	});

	// 轮询获取导出进度（当任务ID存在且状态未完成时轮询）
	const { data: exportDetail, isSuccess } = useQuery({
		queryKey: ["export-template-detail", exportTaskId],
		queryFn: () => getFileExportDetail(exportTaskId!),
		enabled: exportTaskId !== null && open,
		refetchInterval: (query) => {
			// 弹窗关闭时停止轮询
			if (!open) {
				return false;
			}
			const data = query.state.data;
			// 状态：-1：导出失败，0：取消，1：排队中，2：导出中，3：导出完成
			// 当状态为 3（完成）或 -1（失败）或 0（取消）时停止轮询
			if (data && (data.status === 3 || data.status === -1 || data.status === 0)) {
				return false;
			}
			return 2000; // 每2秒轮询一次
		},
	});

	useEffect(() => {
		if (isSuccess && exportDetail?.status === 3 && !hasAutoDownloadedRef.current) {
			if (exportDetail.bucketName && exportDetail.name) {
				hasAutoDownloadedRef.current = true;
				// 自动下载文件
				downloadFileFromOss(exportDetail.bucketName, exportDetail.name)
					.then((blob) => {
						const url = window.URL.createObjectURL(blob);
						const link = document.createElement("a");
						link.href = url;
						link.download = exportDetail.name;
						document.body.appendChild(link);
						link.click();
						document.body.removeChild(link);
						window.URL.revokeObjectURL(url);
						message.success("模板导出完成，已自动下载");
					})
					.catch((error) => {
						console.error("自动下载文件失败:", error);
						message.error("自动下载失败，请手动下载");
						hasAutoDownloadedRef.current = false; // 允许重试
					});
			}
		}
	}, [isSuccess, exportDetail]);

	// 重置自动下载标记（当任务ID变化时）
	useEffect(() => {
		hasAutoDownloadedRef.current = false;
	}, [exportTaskId]);

	// 监听表单参数变化：参数变化时重置导出任务状态
	useEffect(() => {
		const currentParams = JSON.stringify({
			importTemplateType,
			tagIds: importTemplateType === "all" ? [] : [...selectedTagIds].sort(),
			personnelScope,
			userIds:
				personnelScope === "all"
					? []
					: [...selectedPersonnelIds].map((id) => String(id)).sort(),
		});
		if (!lastExportParamsRef.current || lastExportParamsRef.current === currentParams) {
			return;
		}
		// 参数变化时重置状态
		lastExportParamsRef.current = currentParams;
		setExportTaskId(null);
		hasAutoDownloadedRef.current = false;
	}, [importTemplateType, selectedTagIds, personnelScope, selectedPersonnelIds]);

	// 跳转到导出中心查看详情
	const handleJumpToExportCenter = () => {
		// 关闭弹窗
		onCancel();
		navigate("/file-center/export");
	};

	// 处理导出模板：校验后提交导出任务，如果已有完成的导出任务且参数未变化，直接下载
	const handleExportTemplate = () => {
		const tagIds =
			importTemplateType === "all" ? [] : selectedTagIds.length > 0 ? selectedTagIds : [];

		if (importTemplateType === "selected" && tagIds.length === 0) {
			message.warning("请至少选择一个标签");
			return;
		}

		const userIds =
			personnelScope === "all"
				? []
				: selectedPersonnelIds.length > 0
					? selectedPersonnelIds.map((id) => String(id))
					: [];

		if (personnelScope === "selected" && userIds.length === 0) {
			message.warning("请至少选择一个人员");
			return;
		}

		// 生成当前参数 JSON 字符串
		const currentParams = JSON.stringify({
			importTemplateType,
			tagIds: [...tagIds].sort(),
			personnelScope,
			userIds: [...userIds].sort(),
		});

		// 如果已有完成的导出任务且参数未变化，直接下载
		if (
			exportTaskId &&
			exportDetail &&
			exportDetail.status === 3 &&
			lastExportParamsRef.current === currentParams &&
			exportDetail.bucketName &&
			exportDetail.name
		) {
			downloadFileFromOss(exportDetail.bucketName, exportDetail.name)
				.then((blob) => {
					const url = window.URL.createObjectURL(blob);
					const link = document.createElement("a");
					link.href = url;
					link.download = exportDetail.name;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					window.URL.revokeObjectURL(url);
					message.success("模板下载成功");
				})
				.catch((error) => {
					console.error("下载文件失败:", error);
					message.error("下载失败，请重试");
				});
			return;
		}

		// 保存当前参数签名
		lastExportParamsRef.current = currentParams;
		// 重新导出
		runExportTemplate({ tagIds, userIds });
	};

	// 处理取消
	const handleCancel = () => {
		// 重置所有状态
		setImportFile(null);
		setImportTemplateType("all");
		setSelectedTagIds([]);
		setPersonnelScope("all");
		setSelectedPersonnelIds([]);
		setSelectedPersonnel([]);
		setIsPersonnelModalOpen(false);
		setExportTaskId(null);
		lastExportParamsRef.current = "";
		onCancel();
	};

	// 处理导入确认
	const handleImportConfirm = async () => {
		if (!importFile) {
			message.warning("请先选择要导入的文件");
			return;
		}

		setIsUploading(true);
		try {
			await importData(5, "", importFile);
			message.success("开始导入，请前往导入中心查看进度");
			onSuccess?.();
			handleCancel();
		} catch (error) {
			console.error("导入失败:", error);
			message.error("导入失败");
		} finally {
			setIsUploading(false);
		}
	};

	// 处理人员选择确认
	const handlePersonnelConfirm = (personnel: SelectedPersonnel[]) => {
		setSelectedPersonnel(personnel);
		setSelectedPersonnelIds(personnel.map((p) => String(p.id)));
		setIsPersonnelModalOpen(false);
	};

	return (
		<Modal
			title="导入档案"
			open={open}
			onCancel={handleCancel}
			onOk={handleImportConfirm}
			centered
			width={600}
			confirmLoading={isUploading}
			okText={isUploading ? "导入中..." : "导入"}
			okButtonProps={{
				disabled: !importFile || isUploading,
			}}
		>
			<div className="space-y-4 py-5">
				{/* 步骤一：选择导入的标签类型 */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-start">
						<span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
							1
						</span>
						<span className="text-sm">请选择导入的标签类型</span>
					</div>
					<div className="relative pl-10 before:absolute before:left-[10px] before:top-0 before:h-full before:w-1 before:rounded-sm before:bg-gray-300 before:content-['']">
						<Form>
							<div className="mb-2 flex items-start gap-4">
								<Form.Item label="标签范围" required className="mb-0 shrink-0">
									<Radio.Group
										value={importTemplateType}
										onChange={handleTemplateTypeChange}
									>
										<Radio value="all">全部标签</Radio>
										<Radio value="selected">部分标签</Radio>
									</Radio.Group>
								</Form.Item>
								{importTemplateType === "selected" && (
									<Form.Item className="mb-0 min-w-0 flex-1">
										<TreeSelect
											className="w-full"
											treeCheckable
											multiple
											placeholder="请选择标签"
											treeData={tagTreeData}
											value={treeSelectValue}
											onChange={handleTreeSelectChange}
											showSearch
											treeNodeFilterProp="label"
											fieldNames={{
												label: "label",
												value: "value",
												children: "children",
											}}
											allowClear
											maxTagCount="responsive"
											maxTagPlaceholder={maxTagPlaceholder}
											treeCheckStrictly={false}
											treeDefaultExpandAll
										/>
									</Form.Item>
								)}
							</div>
							<div className="mb-0 flex items-start gap-4">
								<Form.Item label="人员范围" required className="mb-0 shrink-0">
									<Radio.Group
										value={personnelScope}
										onChange={(e) => {
											setPersonnelScope(e.target.value);
											if (e.target.value === "all") {
												setSelectedPersonnelIds([]);
											}
										}}
									>
										<Radio value="all">全部人员</Radio>
										<Radio value="selected">部分人员</Radio>
									</Radio.Group>
								</Form.Item>
								{personnelScope === "selected" && (
									<Form.Item className="mb-0 min-w-0 flex-1">
										<Input
											readOnly
											placeholder="请选择人员"
											value={selectedPersonnelDisplayText}
											onClick={() => setIsPersonnelModalOpen(true)}
											className="cursor-pointer"
											title={selectedPersonnelFullNames || undefined}
										/>
									</Form.Item>
								)}
							</div>
						</Form>
					</div>
				</div>

				{/* 步骤二：导出模板 */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-start">
						<span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
							2
						</span>
						<span className="text-sm">请导出模板，并按照模板填入对应字段</span>
					</div>
					<div className="relative pl-10 before:absolute before:left-[10px] before:top-0 before:h-full before:w-1 before:rounded-sm before:bg-gray-300 before:content-['']">
						<div className="flex items-center gap-3">
							<Button
								type="default"
								icon={<DownloadOutlined />}
								loading={
									isExportingTemplate ||
									Boolean(
										exportTaskId &&
										exportDetail &&
										(exportDetail.status === 1 || exportDetail.status === 2),
									)
								}
								onClick={handleExportTemplate}
								disabled={
									(importTemplateType === "selected" &&
										selectedTagIds.length === 0) ||
									(personnelScope === "selected" &&
										selectedPersonnelIds.length === 0)
								}
							>
								{exportTaskId &&
								exportDetail &&
								(exportDetail.status === 1 || exportDetail.status === 2) ? (
									<>
										{exportDetail.statusStr || "导出中"}
										{exportDetail.progress
											? ` ${String(exportDetail.progress).replace(/%/g, "")}%`
											: ""}
									</>
								) : (
									"导出模板"
								)}
							</Button>
							{/* 导出进度和下载按钮 */}
							{exportTaskId && exportDetail && (
								<Button
									type="link"
									size="small"
									onClick={handleJumpToExportCenter}
									className="!px-0"
								>
									查看详情
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* 步骤三：文件上传 */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-start">
						<span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
							3
						</span>
						<span className="text-sm">请将填写好的模板，进行导入</span>
					</div>
					<div className="relative pl-10 before:absolute before:left-[10px] before:top-0 before:h-full before:w-1 before:rounded-sm before:bg-gray-300 before:content-['']">
						<Dragger
							className="archive-import-upload-dragger"
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

			{/* 人员选择弹窗 */}
			<PersonnelSelectorModal
				open={isPersonnelModalOpen}
				onClose={() => setIsPersonnelModalOpen(false)}
				onConfirm={handlePersonnelConfirm}
				value={selectedPersonnel}
				title="部分人员"
			/>
		</Modal>
	);
};
