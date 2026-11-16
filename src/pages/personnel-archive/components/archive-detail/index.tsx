/**
 * 人员档案详情组件（支持编辑、只读、审核和审核详情模式）
 */

import type { TreeTagItem, TreeTagNode } from "#src/api/personnel-archive/archive-management";
import type { UploadFile, UploadProps } from "antd";
import type {
	ArchiveDetailMode,
	ArchiveDetailProps,
	AttachmentFile,
	AttachmentFormItemProps,
} from "./types";
import { ossUploadFile } from "#src/api/common";
import { SectionTitle } from "#src/components";
import { useDict } from "#src/hooks";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "#src/pages/personnel-archive/config";
import { cn } from "#src/utils";

import { UploadOutlined } from "@ant-design/icons";
import {
	Alert,
	App,
	Badge,
	Button,
	Drawer,
	Form,
	Input,
	Select,
	Skeleton,
	Space,
	Tag,
	Typography,
	Upload,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArchiveDetailActionBar } from "./archive-detail-action-bar";
import {
	useArchiveActions,
	useArchiveData,
	useArchiveDetailQuery,
	useArchiveDetailViewModel,
	useChangeRecords,
	useFileUtils,
	useFormCache,
	useTagFilter,
	useTagSelection,
	useTagTree,
	useTagTreeUtils,
} from "./hooks";
import { RefuseAuditModal, UploadAttachmentModal } from "./modal/index";
import {
	BasicInfoSection,
	ChangeRecordsSection,
	SearchFormSection,
	TagTableSection,
	TagTreeSection,
} from "./sections";

// 导出类型，方便其他文件使用
export type {
	ArchiveDetailMode,
	ArchiveDetailProps,
	AttachmentFile,
	AttachmentFormItemProps,
} from "./types";

const { Text } = Typography;

// API 基础路径
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/shanshu-efficiency-api";

/** 文件上传配置 */
export const UPLOAD_CONFIG = {
	ALLOWED_TYPES: [
		"application/pdf",
		"image/jpeg",
		"image/png",
		"image/jpg",
	] satisfies readonly string[],
	ACCEPT: ".pdf,.jpg,.png,.jpeg",
	MAX_SIZE_MB: 5,
	MAX_SIZE: 5 * 1024 * 1024,
	MAX_SIZE_TEXT: "5MB",
	TYPE_TEXT: "PDF/JPG/PNG/JPEG",
} as const;

/**
 * 验证文件类型
 *
 * @param file - 文件对象
 * @returns 是否为允许的文件类型
 */
function validateFileType(file: File): boolean {
	return UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type);
}

/**
 * 验证文件大小
 *
 * @param file - 文件对象
 * @returns 文件大小是否在限制范围内
 */
function validateFileSize(file: File): boolean {
	return file.size <= UPLOAD_CONFIG.MAX_SIZE;
}

/**
 * 将后端文件数据转换为 Upload 组件格式
 *
 * @param files - 附件文件数组
 * @returns Upload 组件文件列表
 */
function convertToUploadFileList(files: AttachmentFile[]): UploadFile[] {
	return files.map((file, index) => ({
		uid: String(file.id ?? index),
		name: file.originalFilename || file.fileName || "附件",
		status: "done" as const,
		url: file.fileName
			? `${window.location.origin}${API_BASE_URL}${file.fileName.startsWith("/") ? "" : "/"}${file.fileName}`
			: undefined,
		response: file,
	}));
}

const EMPTY_ATTACHMENT_FILE_ARRAY: AttachmentFile[] = [];

/**
 * 附件表单项组件
 *
 * 用于在表单中上传和管理附件文件，支持文件上传、删除和预览功能。
 */
const AttachmentFormItem: React.FC<AttachmentFormItemProps> = ({
	value = EMPTY_ATTACHMENT_FILE_ARRAY,
	onChange,
}) => {
	const { message } = App.useApp();
	const [isUploading, setIsUploading] = useState(false);

	const fileList = useMemo<AttachmentFile[]>(() => {
		if (!value) {
			return [];
		}
		return Array.isArray(value) ? value : [value];
	}, [value]);

	const uploadFileList = useMemo<UploadFile[]>(() => {
		return convertToUploadFileList(fileList);
	}, [fileList]);

	/**
	 * 文件上传前处理
	 *
	 * @param file - 待上传的文件
	 * @returns 返回 false 阻止默认上传行为，或 Upload.LIST_IGNORE 忽略该文件
	 */
	const handleBeforeUpload = useCallback(
		(file: File): boolean | typeof Upload.LIST_IGNORE => {
			if (!validateFileType(file)) {
				message.error(`只支持上传 ${UPLOAD_CONFIG.TYPE_TEXT} 格式文件`);
				return Upload.LIST_IGNORE;
			}

			if (!validateFileSize(file)) {
				message.error(`文件大小不能超过 ${UPLOAD_CONFIG.MAX_SIZE_TEXT}`);
				return Upload.LIST_IGNORE;
			}

			setIsUploading(true);

			ossUploadFile(file)
				.then((result) => {
					const newFile: AttachmentFile = {
						id: result.id,
						fileName: result.fileName,
						newFileName: result.newFileName,
						url: result.fileName,
						originalFilename: result.originalFilename,
					};
					onChange?.([...fileList, newFile]);
					message.success("上传成功");
				})
				.catch((error) => {
					console.error("上传失败:", error);
					message.error("上传失败，请重试");
				})
				.finally(() => {
					setIsUploading(false);
				});

			return false;
		},
		[fileList, onChange],
	);

	/**
	 * 删除文件处理
	 *
	 * 按照索引删除：找到要删除的文件在 uploadFileList 中的索引，然后从 fileList 中删除对应索引的文件。
	 * uploadFileList 和 fileList 是一一对应的，因为它们都是通过 convertToUploadFileList 从 fileList 转换而来的。
	 *
	 * @param file - 要删除的文件对象
	 * @returns 删除成功返回 true，未找到文件返回 false
	 */
	const handleRemove = useCallback(
		(file: UploadFile): boolean => {
			const fileIndex = uploadFileList.findIndex((uploadFile) => uploadFile.uid === file.uid);

			if (fileIndex === -1) {
				return false;
			}

			const newFileList = fileList.filter((_, index) => index !== fileIndex);
			onChange?.(newFileList);

			return true;
		},
		[fileList, uploadFileList, onChange],
	);

	/**
	 * 预览文件处理
	 *
	 * @param file - 要预览的文件对象
	 */
	const handlePreview = useCallback((file: UploadFile) => {
		const fileName = (file.response as AttachmentFile)?.fileName;
		if (fileName) {
			const previewUrl = `${window.location.origin}${API_BASE_URL}${fileName.startsWith("/") ? "" : "/"}${fileName}`;
			window.open(previewUrl, "_blank");
		}
	}, []);

	const uploadProps: UploadProps = useMemo(
		() => ({
			name: "file",
			multiple: false,
			maxCount: 1,
			accept: UPLOAD_CONFIG.ACCEPT,
			fileList: uploadFileList,
			beforeUpload: handleBeforeUpload,
			onRemove: handleRemove,
			onPreview: handlePreview,
			showUploadList: {
				showRemoveIcon: true,
				showPreviewIcon: true,
			},
		}),
		[uploadFileList, handleBeforeUpload, handleRemove, handlePreview],
	);

	return (
		<Space direction="vertical" size="small" className="w-full">
			<Upload {...uploadProps}>
				<Button
					type="default"
					size="small"
					icon={<UploadOutlined />}
					loading={isUploading}
					disabled={isUploading}
				>
					上传文件
				</Button>
			</Upload>
			<Text type="secondary" className="text-xs">
				支持上传 {UPLOAD_CONFIG.TYPE_TEXT} 格式，且单个文件不超过{" "}
				{UPLOAD_CONFIG.MAX_SIZE_TEXT}
			</Text>
		</Space>
	);
};

/**
 * 档案详情加载骨架屏组件
 */
const ArchiveDetailSkeleton: React.FC = () => {
	return (
		<div className="flex h-full flex-col">
			<div className="grid flex-1 grid-rows-[1fr_2fr] gap-4 overflow-hidden p-4 lg:gap-6 lg:p-6">
				<div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] lg:gap-6">
					<section className="flex flex-col p-4 lg:p-6">
						<Skeleton
							active
							title={{ width: 100 }}
							paragraph={false}
							className="mb-4"
						/>
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_3fr]">
							<div className="flex items-center gap-4">
								<Skeleton.Avatar active size={64} />
								<div className="flex-1">
									<Skeleton
										active
										title={{ width: 120 }}
										paragraph={{ rows: 1 }}
									/>
									<div className="mt-3">
										<Skeleton active title={{ width: 150 }} paragraph={false} />
										<Skeleton.Button
											active
											size="small"
											style={{ width: "100%", marginTop: 8 }}
										/>
									</div>
								</div>
							</div>
							<div>
								<Skeleton active paragraph={{ rows: 6 }} />
							</div>
						</div>
					</section>
					<section className="flex min-h-0 flex-col p-4 lg:p-6">
						<Skeleton
							active
							title={{ width: 100 }}
							paragraph={false}
							className="mb-4"
						/>
						<div className="flex-1">
							<Skeleton active paragraph={{ rows: 5 }} />
						</div>
					</section>
				</div>
				<div className="flex min-h-0 flex-col gap-4 lg:gap-6">
					<Skeleton active title={{ width: 120 }} paragraph={false} />
					<div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr] lg:gap-6">
						<aside className="flex flex-col overflow-hidden p-4">
							<Skeleton
								active
								title={{ width: 100 }}
								paragraph={false}
								className="mb-4"
							/>
							<div className="flex-1">
								<Skeleton active paragraph={{ rows: 8 }} />
							</div>
						</aside>
						<section className="overflow-y-auto">
							<article className="p-4 lg:p-6">
								<Skeleton
									active
									title={{ width: 100 }}
									paragraph={false}
									className="mb-4"
								/>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
									{Array.from({ length: 10 }, (_, index) => (
										<div key={`skeleton-${index}`}>
											<Skeleton
												active
												title={{ width: 80 }}
												paragraph={{ rows: 1 }}
											/>
										</div>
									))}
								</div>
							</article>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

/**
 * 获取人员档案详情抽屉标题。
 *
 * @param mode - 详情模式
 * @returns 抽屉标题
 */
function getArchiveDetailTitle(mode: ArchiveDetailMode = "edit"): string {
	if (mode === "audit") {
		return "审核人员档案";
	}
	if (mode === "auditView") {
		return "查看审核详情";
	}
	if (mode === "readonly") {
		return "查看人员档案";
	}
	return "编辑人员档案";
}

/**
 * 人员档案详情重内容属性。
 */
type ArchiveDetailContentProps = Omit<ArchiveDetailProps, "onClose">;

/**
 * 人员档案详情重内容。
 *
 * 负责详情数据请求、标签树转换、表格表单、审核动作与附件弹窗。该组件只在抽屉打开后延迟挂载，
 * 避免点击“编辑档案/查看详情”时同步执行大量计算而阻塞 Drawer 弹出动画。
 */
const ArchiveDetailContent: React.FC<ArchiveDetailContentProps> = ({
	open,
	userId,
	mode = "edit",
	maintainer,
	forUpdate = true,
	approver,
	onRefresh,
}) => {
	const [form] = Form.useForm();
	const [searchForm] = Form.useForm();
	const [refuseForm] = Form.useForm();

	const isReadonly = mode === "readonly";
	const isAudit = mode === "audit";
	const isAuditView = mode === "auditView";
	const isAuditMode = isAudit || isAuditView;
	const isEditMode = mode === "edit";

	/**
	 * 查看模式标识
	 *
	 * 查看详情、审核、审核详情都使用相同的只读显示逻辑
	 */
	const isViewMode = isReadonly || isAuditMode;

	/**
	 * 不允许修改的状态列表
	 *
	 * 待审核状态（状态值为 "2"）的标签不允许修改
	 */
	const DISABLED_STATUSES: readonly string[] = ["2"];
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [currentUploadTag, setCurrentUploadTag] = useState<TreeTagItem | null>(null);

	/**
	 * 筛选重置时需要调用最新的全选逻辑。
	 * 这里用 ref 打破“筛选状态 -> 视图模型 -> 树选择 -> 重置筛选”的初始化顺序循环。
	 */
	const selectAllTagsRef = useRef<() => void>(() => undefined);
	const selectAllTagsFromCurrentTree = useCallback(() => {
		selectAllTagsRef.current();
	}, []);

	// 使用 useTagFilter Hook 管理筛选条件和重置逻辑
	const { tagNameFilter, setTagNameFilter, statusFilter, setStatusFilter, resetFilters } =
		useTagFilter(selectAllTagsFromCurrentTree);

	const { data: archiveDetailResponse, refetch: refetchArchiveDetail } = useArchiveDetailQuery({
		open,
		userId,
		mode,
		maintainer,
		forUpdate,
		approver,
	});

	/**
	 * 刷新当前人员档案详情。
	 */
	const refreshArchiveDetail = useCallback(() => {
		void refetchArchiveDetail();
	}, [refetchArchiveDetail]);

	// 使用 useTagTreeUtils Hook 获取树形数据处理工具函数
	const {
		collectAllTagIds,
		isTagNodeKey,
		collectTagNodeKeys,
		findNode,
		findNodeByTagId,
		getAllParentKeys,
		collectTreeKeys,
		filterValidKeys,
	} = useTagTreeUtils();

	const {
		basicInfoData,
		shouldShowArchiveDetailSkeleton,
		maintainerFromDetail,
		rawTreeData,
		visibleStatuses,
		treeDataForDisplay,
		initLeafNodeTags,
		initialChangeRecords,
	} = useArchiveDetailViewModel({
		userId,
		mode,
		archiveDetailResponse,
		tagNameFilter,
		statusFilter,
	});

	const archiveDetailData = treeDataForDisplay;

	/**
	 * 所有 tagId 集合（缓存）
	 *
	 * 用于判断一个 key 是否是标签节点，避免重复计算
	 */
	const tagIdsSet = useMemo(
		() => collectAllTagIds(archiveDetailData),
		[archiveDetailData, collectAllTagIds],
	);

	/**
	 * 所有分类节点 key 集合（缓存）
	 *
	 * 用于过滤和验证节点 key，避免重复计算
	 */
	const categoryKeysSet = useMemo(
		() => collectTreeKeys(archiveDetailData),
		[archiveDetailData, collectTreeKeys],
	);

	// 使用 useTagSelection Hook 管理标签选择逻辑
	const {
		selectedTagNodeIds,
		setSelectedTagNodeIds,
		expandedKeys,
		setExpandedKeys,
		isAutoExpandParent,
		checkedKeys,
		setCheckedKeys,
		handleCheck,
		handleExpand,
		selectAllTags,
	} = useTagSelection({
		archiveDetailData,
		tagIdsSet,
		categoryKeysSet,
		isTagNodeKey,
		findNode,
		findNodeByTagId,
		getAllParentKeys,
		collectTagNodeKeys,
		filterValidKeys,
	});
	selectAllTagsRef.current = selectAllTags;

	/**
	 * 跟踪上次初始化的数据标识
	 *
	 * 用于避免重复初始化
	 */
	const lastInitializedDataRef = useRef<string>("");

	/**
	 * 用户标签审核状态字典
	 */
	const {
		options: approvalStatusOptions,
		getItem: getApprovalStatusItem,
		getLabel: getApprovalStatusLabel,
	} = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.ARCHIVE_APPROVAL_STATUS_FOR_APPROVAL);

	/**
	 * 用户标签状态字典
	 */
	const {
		options: tagStatusOptions,
		getItem: getTagStatusItem,
		getLabel: getTagStatusLabel,
	} = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.TAG_STATUS);

	// 树形数据处理工具函数已从 useTagTreeUtils Hook 中获取

	/**
	 * 使用 useTagTree Hook 处理树形数据
	 */
	const { treeData, matchesFilter: matchesFilterFromHook } = useTagTree({
		rawTreeData,
		visibleStatuses,
		tagNameFilter,
		statusFilter,
		isAuditMode,
		getApprovalStatusLabel,
		getApprovalStatusItem,
		getTagStatusLabel,
		getTagStatusItem,
	});

	/**
	 * 初始化树节点选中和展开状态
	 *
	 * 注意：archiveDetailData 已经是根据模式过滤后的数据，直接收集所有标签即可
	 */
	useEffect(() => {
		// 抽屉未打开或数据为空时，清空状态并返回
		if (!open || !archiveDetailData?.length) {
			if (!open) {
				return;
			}
			// 数据为空时，清空状态
			setCheckedKeys([]);
			setSelectedTagNodeIds([]);
			setExpandedKeys([]);
			lastInitializedDataRef.current = "";
			return;
		}

		// 收集所有标签节点 keys（archiveDetailData 已经是过滤后的数据）
		const rootKeys: React.Key[] = [];
		const tagKeys: string[] = [];
		const seenTagKeys = new Set<string>();

		const collectKeys = (nodes: TreeTagNode[]) => {
			for (const node of nodes) {
				rootKeys.push(node.id);
				if (node.tags?.length) {
					for (const tag of node.tags) {
						const tagId = (tag as any).tagId;
						if (tagId != null) {
							const tagKey = String(tagId);
							if (!seenTagKeys.has(tagKey)) {
								tagKeys.push(tagKey);
								seenTagKeys.add(tagKey);
							}
						}
					}
				}
				if (node.children?.length) {
					collectKeys(node.children);
				}
			}
		};
		collectKeys(archiveDetailData);

		// 生成当前数据的唯一标识
		const currentDataKey = [...tagKeys].sort().join(",");

		// 判断是否需要重新初始化
		const shouldReinitialize =
			lastInitializedDataRef.current !== currentDataKey ||
			selectedTagNodeIds.length === 0 ||
			selectedTagNodeIds.length !== tagKeys.length;

		if (shouldReinitialize) {
			lastInitializedDataRef.current = currentDataKey;
			setCheckedKeys([...rootKeys, ...tagKeys]);
			setSelectedTagNodeIds(tagKeys);

			// 展开包含标签的节点及其父节点路径
			const keysToExpand = new Set<React.Key>();
			const parentMap = new Map<React.Key, React.Key>();

			/**
			 * 遍历树形结构，构建父节点映射并收集包含标签的节点
			 *
			 * @param nodes - 树形节点数组
			 * @param parentId - 父节点 ID
			 * @returns 包含标签的节点数组
			 */
			const findNodesWithTagsAndBuildParentMap = (
				nodes: TreeTagNode[],
				parentId?: React.Key,
			): TreeTagNode[] => {
				const result: TreeTagNode[] = [];
				nodes.forEach((node) => {
					if (parentId !== undefined) {
						parentMap.set(node.id, parentId);
					}
					if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
						result.push(node);
					}
					if (node.children && Array.isArray(node.children) && node.children.length > 0) {
						result.push(...findNodesWithTagsAndBuildParentMap(node.children, node.id));
					}
				});
				return result;
			};

			const nodesWithTags = findNodesWithTagsAndBuildParentMap(archiveDetailData);

			// 展开包含标签的节点及其所有父节点
			nodesWithTags.forEach((node) => {
				keysToExpand.add(node.id);
				let currentId: React.Key | undefined = node.id;
				while (currentId !== undefined) {
					const parentId = parentMap.get(currentId);
					if (parentId !== undefined) {
						keysToExpand.add(parentId);
						currentId = parentId;
					} else {
						break;
					}
				}
			});

			setExpandedKeys(Array.from(keysToExpand));
		}
	}, [archiveDetailData, open, isAudit, isAuditView]);

	// 树形数据处理工具函数已从 useTagTreeUtils Hook 中获取

	// handleCheck、handleExpand 和 selectAllTags 已从 useTagSelection Hook 中获取

	// matchesFilter 已从 useTagTree Hook 中获取
	const matchesFilter = matchesFilterFromHook;

	/**
	 * 获取选中标签列表（用于表格显示）
	 *
	 * 核心原则：tag = 表格一行，一一对应
	 */
	const selectedTagsList = useMemo(() => {
		if (!archiveDetailData?.length || !selectedTagNodeIds.length) {
			return [];
		}

		const result: TreeTagItem[] = [];
		const seenIds = new Set<string>();

		// 预先构建所有节点的映射，避免重复遍历树
		const nodeMap = new Map<string, TreeTagNode>();
		const buildNodeMap = (nodes: TreeTagNode[]) => {
			for (const node of nodes) {
				nodeMap.set(node.id, node);
				if (node.children?.length) {
					buildNodeMap(node.children);
				}
			}
		};
		buildNodeMap(archiveDetailData);

		for (const nodeId of selectedTagNodeIds) {
			const keyStr = String(nodeId);
			// 判断是否是标签节点（tagId）
			// 使用缓存的 tagIdsSet，避免重复计算
			if (isTagNodeKey(keyStr, tagIdsSet)) {
				const tagId = keyStr;

				if (seenIds.has(tagId)) {
					continue;
				}

				// 从缓存获取标签
				const tag = initLeafNodeTags.get(tagId);
				if (tag && matchesFilter(tag)) {
					result.push(tag);
					seenIds.add(tagId);
				}
				continue;
			}

			// 从映射获取节点
			const node = nodeMap.get(keyStr);
			if (!node?.tags) {
				continue;
			}

			// 处理节点下的标签
			for (const tag of node.tags) {
				const tagId = String((tag as any).tagId);
				if (seenIds.has(tagId) || tagId === "null" || tagId === "undefined") {
					continue;
				}
				if (matchesFilter(tag)) {
					const finalTag = initLeafNodeTags.get(tagId) || tag;
					result.push(finalTag);
					seenIds.add(tagId);
				}
			}
		}

		return result;
	}, [
		archiveDetailData,
		selectedTagNodeIds,
		tagNameFilter,
		statusFilter,
		initLeafNodeTags,
		matchesFilter,
		tagIdsSet,
		isTagNodeKey,
	]);

	// 使用 useFormCache Hook 管理表单值缓存
	const { formValues, setFormValues, clearFormValuesCache, setFormValueToCache } = useFormCache({
		form,
		selectedTagsList,
		enabled: !shouldShowArchiveDetailSkeleton,
	});

	// 当详情数据切换时清理表单缓存，确保重新打开或切换人员时使用接口最新值初始化。
	useEffect(() => {
		if (open) {
			clearFormValuesCache();
		}
	}, [archiveDetailData, open, clearFormValuesCache]);

	// 使用 useArchiveData Hook 管理数据处理逻辑
	const { buildTableData, prepareSubmitData, prepareDraftData, selectedTagIds } = useArchiveData({
		form,
		selectedTagsList,
		initLeafNodeTags,
		userId,
		disabledStatuses: DISABLED_STATUSES,
	});

	// 使用 useArchiveActions Hook 管理业务逻辑
	const {
		isSubmitting,
		submittingAction,
		isRefuseModalOpen,
		setIsRefuseModalOpen,
		handlePass,
		handleRefuse,
		handleConfirmRefuse,
		handleSaveDraft,
		handleSubmit,
	} = useArchiveActions({
		form,
		refuseForm,
		selectedTagsList,
		selectedTagIds,
		userId,
		maintainer,
		maintainerFromDetail,
		disabledStatuses: DISABLED_STATUSES,
		buildTableData,
		prepareSubmitData,
		prepareDraftData,
		refreshArchiveDetail,
		onRefresh,
	});

	// 使用变更记录 Hook 管理变更记录逻辑
	const { changeRecords } = useChangeRecords({
		initialChangeRecords,
		selectedTagsList,
		initLeafNodeTags,
		formValues,
		isViewMode,
	});

	// 使用 useFileUtils Hook 获取文件处理工具函数
	const { normalizeFileList, getFilePreviewUrl } = useFileUtils();

	/**
	 * 渲染附件链接
	 *
	 * @param file - 文件对象
	 * @returns 附件链接按钮元素
	 */
	const renderFileLink = useCallback(
		(file: any) => {
			if (!file?.fileName) return null;
			const previewUrl = getFilePreviewUrl(file.fileName);
			return (
				<Button
					type="link"
					size="small"
					className="h-auto p-0"
					onClick={() => window.open(previewUrl, "_blank")}
				>
					{file.originalFilename || file.fileName || "附件"}
				</Button>
			);
		},
		[getFilePreviewUrl],
	);

	/**
	 * 渲染查看模式的附件
	 *
	 * @param record - 标签记录
	 * @returns 附件显示元素
	 */
	const renderViewModeAttachment = useCallback(
		(record: TreeTagItem) => {
			// 审核模式下：如果有 tagFileList 就显示，不需要检查 isAttProofTagging
			// 非审核模式：需要检查 isAttProofTagging
			const needsAttachment = isAuditMode
				? !!record.tagFileList
				: record.isAttProofTagging === "1";
			if (!needsAttachment) {
				return (
					<Space direction="vertical" size="small">
						<Text type="secondary" className="text-xs">
							•无需附件
						</Text>
					</Space>
				);
			}

			const fileList = normalizeFileList(record.tagFileList);

			if (fileList.length === 0) {
				return (
					<Space direction="vertical" size="small">
						<Text type="secondary" className="text-xs">
							•无附件
						</Text>
					</Space>
				);
			}

			return (
				<Space direction="vertical" size="small">
					{fileList.map((file: any) => (
						<div
							key={file.id ?? file.fileName ?? file.originalFilename}
							className="flex items-center gap-1"
						>
							{renderFileLink(file)}
						</div>
					))}
				</Space>
			);
		},
		[normalizeFileList, renderFileLink, isAuditMode],
	);

	/**
	 * 表格列配置
	 */
	const columns = useMemo(
		() => [
			{
				title: "标签名称",
				dataIndex: "tagName",
				key: "tagName",
				width: 200,
				render: (_: any, record: TreeTagItem, index: number) => {
					// 查看模式：直接显示标签名称和值（统一使用 tagValue）
					if (isViewMode) {
						const tagName = record.tagName || "-";
						const displayValue = record.tagValue || "";
						if (displayValue) {
							return (
								<>
									{tagName}：<Text>{displayValue}</Text>
								</>
							);
						}
						return tagName;
					}

					// 编辑模式：使用表单控件
					const status = record.status || "1";
					const isDisabled = DISABLED_STATUSES.includes(status);
					const hasOptions =
						record.tagValueList &&
						Array.isArray(record.tagValueList) &&
						record.tagValueList.length > 0;

					return (
						<div className="flex items-center gap-2">
							<Form.Item
								name={[index, "tagValue"]}
								rules={
									record.isRequired === "1"
										? [{ required: true, message: `请输入${record.tagName}` }]
										: []
								}
								label={record.tagName}
								className={cn(
									"mb-0 flex-1 rounded border pl-2",
									isDisabled && "cursor-not-allowed opacity-60",
								)}
							>
								{hasOptions ? (
									<Select
										disabled={isDisabled}
										size="small"
										options={record.tagValueList.map((item: string) => ({
											label: item,
											value: item,
										}))}
										placeholder="请选择"
										allowClear
									/>
								) : (
									<Input
										disabled={isDisabled}
										size="small"
										placeholder="请输入"
										allowClear
									/>
								)}
							</Form.Item>
							{record.expired && (
								<Tag color="error" bordered={false}>
									已过期
								</Tag>
							)}
						</div>
					);
				},
			},
			{
				title: "标签状态",
				dataIndex: "status",
				key: "status",
				width: 200,
				render: (_: any, record: TreeTagItem) => {
					const status = record.status || "1";
					// 审核模式使用审核状态字典，其他模式使用标签状态字典
					const dictItem = isAuditMode
						? getApprovalStatusItem(String(status))
						: getTagStatusItem(String(status));
					const label = isAuditMode
						? getApprovalStatusLabel(String(status))
						: getTagStatusLabel(String(status));
					const isRejected = label === "已拒绝" || status === "4";
					const displayText =
						isRejected && record.approvalComments
							? `${label || status}(驳回原因:${record.approvalComments})`
							: label || status;

					return (
						<Badge
							color={dictItem?.listClass || "default"}
							status={
								dictItem?.listClass as
									| "default"
									| "success"
									| "processing"
									| "error"
									| "warning"
									| undefined
							}
							text={displayText}
						/>
					);
				},
			},
			// 审核时间列（仅审核模式显示）
			...(isAuditMode
				? [
						{
							title: "审核时间",
							dataIndex: "approvalTime",
							key: "approvalTime",
							width: 180,
							render: (_: any, record: TreeTagItem & { approvalTime?: string }) => {
								const status = getApprovalStatusLabel(record.status) || "待审核";
								return status === "待审核"
									? "-"
									: (record as any).approvalTime || "-";
							},
						},
					]
				: []),
			// 提交人列（仅审核模式显示）
			...(isAudit
				? [
						{
							title: "提交人",
							dataIndex: "createByName",
							key: "createByName",
							width: 120,
							render: (_: any, record: TreeTagItem & { createByName?: string }) => {
								return (record as any).createByName || "-";
							},
						},
					]
				: []),
			{
				title: (
					<span>
						{isEditMode && <span style={{ color: "#ff4d4f" }}>*</span>}
						附件
					</span>
				),
				key: "attachment",
				width: 200,
				render: (_: any, record: TreeTagItem, index: number) => {
					const needsAttachment = record.isAttProofTagging === "1";

					// 查看模式：直接显示附件
					if (isViewMode) {
						return renderViewModeAttachment(record);
					}

					// 待审核状态的标签不允许修改附件
					const status = record.status || "1";
					const isDisabled = DISABLED_STATUSES.includes(status);

					return (
						<Form.Item
							name={[index, "tagFileList"]}
							rules={
								needsAttachment && !isDisabled
									? [
											{
												required: true,
												message: `请为${record.tagName}上传附件`,
												validator: (_: any, value: any) => {
													if (
														!value ||
														(Array.isArray(value) && value.length === 0)
													) {
														return Promise.reject(
															new Error(
																`请为${record.tagName}上传附件`,
															),
														);
													}
													return Promise.resolve();
												},
											},
										]
									: []
							}
							className="mb-0"
						>
							{needsAttachment ? (
								isDisabled ? (
									// 禁用状态：仅显示已有附件，不允许上传
									<Space direction="vertical" size="small">
										{(() => {
											const fileList = normalizeFileList(record.tagFileList);
											if (fileList.length === 0) {
												return (
													<Text type="secondary" className="text-xs">
														•无附件
													</Text>
												);
											}
											return fileList.map((file: any) => (
												<div
													key={
														file.id ??
														file.fileName ??
														file.originalFilename
													}
													className="flex items-center gap-1"
												>
													{renderFileLink(file)}
												</div>
											));
										})()}
									</Space>
								) : (
									<AttachmentFormItem />
								)
							) : (
								<Space direction="vertical" size="small">
									<Text type="secondary" className="text-xs">
										•无需附件
									</Text>
								</Space>
							)}
						</Form.Item>
					);
				},
			},
		],
		[
			isReadonly,
			isAuditMode,
			isAudit,
			isViewMode,
			isEditMode,
			getApprovalStatusItem,
			getApprovalStatusLabel,
			getTagStatusItem,
			getTagStatusLabel,
			renderViewModeAttachment,
			normalizeFileList,
			renderFileLink,
		],
	);

	// 数据处理和业务逻辑函数已从 useArchiveData 和 useArchiveActions Hooks 中获取

	const shouldShowActionFooter = isAudit || isEditMode;

	return (
		<>
			{shouldShowArchiveDetailSkeleton ? (
				<ArchiveDetailSkeleton />
			) : (
				<div className="flex h-full flex-col">
					<div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:gap-5 lg:p-6">
						{/* 基础信息和变更记录 */}
						<div className="grid h-[200px] grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] lg:gap-6">
							{/* 基础信息 */}
							<BasicInfoSection basicInfoData={basicInfoData} />

							{/* 变更记录 */}
							<ChangeRecordsSection changeRecords={changeRecords} />
						</div>

						{/* 人员档案 */}
						<div className="flex min-h-[200px] flex-1 flex-col gap-4 lg:gap-5">
							<SectionTitle title="人员档案" />

							{/* 仅编辑模式下显示操作指南 */}
							{isEditMode && (
								<Alert
									message={
										<span>
											操作指南： 1、请在现有档案中下拉选择或输入内容；
											2、勾选需提交的标签，未勾选的标签将不提交数据；
											3、提交后，变更记录将显示在上方的记录列表中
										</span>
									}
									type="info"
									closable
									showIcon
									className="mb-0"
								/>
							)}

							{/* 搜索表单 */}
							<SearchFormSection
								form={searchForm}
								isAuditMode={isAuditMode}
								approvalStatusOptions={approvalStatusOptions}
								tagStatusOptions={tagStatusOptions}
								setTagNameFilter={setTagNameFilter}
								setStatusFilter={setStatusFilter}
								onReset={resetFilters}
							/>

							<div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_3fr] lg:gap-6">
								{/* 左侧标签选择树 */}
								<TagTreeSection
									treeData={treeData as any}
									expandedKeys={expandedKeys}
									autoExpandParent={isAutoExpandParent}
									checkedKeys={checkedKeys}
									onExpand={handleExpand}
									onCheck={handleCheck}
									hasData={archiveDetailData.length > 0}
								/>

								{/* 右侧标签信息表格 */}
								<TagTableSection
									isAuditMode={isAuditMode}
									isViewMode={isViewMode}
									isEditMode={isEditMode}
									columns={columns}
									selectedTagsList={selectedTagsList}
									form={form}
									onFormValuesChange={(changedValues, allValues) => {
										setFormValues(allValues);

										// 实时更新缓存：当表单值变化时，更新对应标签的缓存
										const tags = allValues.tags ?? [];
										if (tags.length > 0 && selectedTagsList.length > 0) {
											for (const [index, tag] of selectedTagsList.entries()) {
												const tagId = (tag as any).tagId;
												if (tagId != null && tags[index] != null) {
													const tagIdStr = String(tagId);
													const formValue = tags[index];
													// 更新缓存
													setFormValueToCache(tagIdStr, {
														tagValue: formValue.tagValue,
														tagFileList: formValue.tagFileList,
													});
												}
											}
										}
									}}
								/>
							</div>
						</div>
					</div>
					{shouldShowActionFooter ? (
						<div className="flex shrink-0 items-center justify-end border-t border-gray-100 bg-white px-4 py-3 lg:px-6">
							<ArchiveDetailActionBar
								isAudit={isAudit}
								isEditMode={isEditMode}
								selectedTagCount={selectedTagIds.length}
								isSubmitting={isSubmitting}
								submittingAction={submittingAction}
								onRefuse={handleRefuse}
								onPass={handlePass}
								onSaveDraft={handleSaveDraft}
								onSubmit={handleSubmit}
							/>
						</div>
					) : null}
				</div>
			)}

			{/* 上传附件弹窗 */}
			<UploadAttachmentModal
				open={isUploadModalOpen}
				onCancel={() => {
					setIsUploadModalOpen(false);
					setCurrentUploadTag(null);
				}}
				onSuccess={(
					fileList: Array<{
						id?: number | string;
						fileName: string;
						newFileName?: string;
						url?: string;
						originalFilename: string;
					}>,
				) => {
					if (!currentUploadTag || !fileList || fileList.length === 0) {
						return;
					}

					// 获取当前表单值
					const currentFormValues = form.getFieldsValue();
					const currentFormTags = currentFormValues.tags || [];

					// 找到当前上传标签在表单中的索引
					const tagIndex = selectedTagsList.findIndex(
						(tag) =>
							tag.id === currentUploadTag.id &&
							tag.userTagId === currentUploadTag.userTagId,
					);

					if (tagIndex >= 0) {
						// 获取现有的附件列表
						const existingFileList = currentFormTags[tagIndex]?.tagFileList || [];
						const existingFiles = Array.isArray(existingFileList)
							? existingFileList
							: existingFileList
								? [existingFileList]
								: [];

						// 合并新上传的附件
						const allFiles = [...existingFiles, ...fileList];

						// 更新表单中的附件列表
						const updatedTags = [...currentFormTags];
						updatedTags[tagIndex] = {
							...updatedTags[tagIndex],
							tagFileList: allFiles,
						};
						form.setFieldsValue({
							tags: updatedTags,
						});
					}

					// 附件已更新到表单中，提交时会从表单获取
					setIsUploadModalOpen(false);
					setCurrentUploadTag(null);
				}}
			/>

			{/* 驳回弹窗（审核模式） */}
			<RefuseAuditModal
				open={isAudit && isRefuseModalOpen}
				loading={isSubmitting}
				form={refuseForm}
				onConfirm={handleConfirmRefuse}
				onCancel={() => {
					setIsRefuseModalOpen(false);
					refuseForm.resetFields();
				}}
			/>
		</>
	);
};

/**
 * 人员档案详情抽屉。
 *
 * 该组件只负责渲染轻量 Drawer 外壳，并在打开后的两个 animation frame 再挂载 ArchiveDetailContent。
 * 这样浏览器可以先完成遮罩和抽屉滑入首帧绘制，再执行标签树、表格、表单等重计算。
 */
export const ArchiveDetail: React.FC<ArchiveDetailProps> = (props) => {
	const { open, userId, mode = "edit", onClose, ...contentProps } = props;
	const [shouldRenderContent, setShouldRenderContent] = useState(false);
	const firstFrameRef = useRef<number | null>(null);
	const secondFrameRef = useRef<number | null>(null);

	/**
	 * 清理延迟挂载详情内容的 animation frame。
	 */
	const clearDeferredRenderFrames = useCallback(() => {
		if (firstFrameRef.current !== null) {
			cancelAnimationFrame(firstFrameRef.current);
			firstFrameRef.current = null;
		}
		if (secondFrameRef.current !== null) {
			cancelAnimationFrame(secondFrameRef.current);
			secondFrameRef.current = null;
		}
	}, []);

	useEffect(() => {
		clearDeferredRenderFrames();

		if (!userId) {
			setShouldRenderContent(false);
			return undefined;
		}

		if (!open) {
			return undefined;
		}

		setShouldRenderContent(false);
		firstFrameRef.current = requestAnimationFrame(() => {
			firstFrameRef.current = null;
			secondFrameRef.current = requestAnimationFrame(() => {
				secondFrameRef.current = null;
				setShouldRenderContent(true);
			});
		});

		return () => {
			clearDeferredRenderFrames();
		};
	}, [clearDeferredRenderFrames, open, userId, mode]);

	/**
	 * 抽屉关闭动画结束后卸载重内容，避免隐藏状态下继续持有大树和表单。
	 *
	 * @param visible - 抽屉是否完成打开
	 */
	const handleAfterOpenChange = useCallback(
		(visible: boolean) => {
			if (!visible) {
				clearDeferredRenderFrames();
				setShouldRenderContent(false);
			}
		},
		[clearDeferredRenderFrames],
	);

	return (
		<Drawer
			title={getArchiveDetailTitle(mode)}
			placement="right"
			width="clamp(500px, 80vw, 95vw)"
			open={open}
			onClose={onClose}
			afterOpenChange={handleAfterOpenChange}
			closable={{ placement: "end" }}
			forceRender
			styles={{
				body: {
					padding: 0,
					height: "100%",
					overflow: "auto",
				},
			}}
		>
			{shouldRenderContent ? (
				<ArchiveDetailContent {...contentProps} open={open} userId={userId} mode={mode} />
			) : (
				<ArchiveDetailSkeleton />
			)}
		</Drawer>
	);
};

export default ArchiveDetail;
