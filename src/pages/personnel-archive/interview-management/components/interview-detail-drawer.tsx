/**
 * 面谈详情抽屉组件（用于开始面谈）
 * 参考 archive-detail.tsx 实现，支持左侧树形结构 + 右侧表格
 */

import type { TreeTagItem, TreeTagNode } from "#src/api/personnel-archive/archive-management";
import type {
	InterviewHistoryItem,
	InterviewSaveParams,
	InterviewTagItem,
	UploadFileFormItem,
} from "#src/api/personnel-archive/interview-management";
import type { PreviewableAttachment } from "#src/hooks";
import {
	fetchInterviewDetail,
	saveInterview,
	submitInterview,
} from "#src/api/personnel-archive/interview-management";
import { BasicButton, ImagePreviewModal, SectionTitle } from "#src/components";
import { useAttachmentPreview, useDict } from "#src/hooks";
import { useAuthStore } from "#src/store";
import { getFileExtension, isPreviewableFile, SUPPORTED_UPLOAD_EXTENSIONS } from "#src/utils";
import { AUTH_HEADER } from "#src/utils/request/constants";
import { DeleteOutlined, DownloadOutlined, EyeOutlined, InboxOutlined } from "@ant-design/icons";
import { ProForm, ProFormSelect, ProFormTextArea } from "@ant-design/pro-components";
import {
	Button,
	ConfigProvider,
	Drawer,
	Form,
	Input,
	List,
	message,
	Popover,
	Select,
	Space,
	Spin,
	Tag,
	Tree,
	Typography,
	Upload,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PERSONNEL_ARCHIVE_DICT_KEYS } from "../../config";
import { BasicInfo } from "./basic-info";
import { InterviewHistoryList } from "./interview-history-list";

const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

/** 将 UploadFileFormItem 规范化为 PreviewableAttachment */
function toPreviewable(file: UploadFileFormItem): PreviewableAttachment {
	return {
		key: file.fileName || String(file.id),
		displayName: file.originalFilename || file.fileName || "",
		fileName: file.fileName || undefined,
	};
}

/**
 * 面谈详情抽屉属性接口
 */
interface InterviewDetailDrawerProps {
	/** 是否显示抽屉 */
	open: boolean;
	/** 用户ID */
	userId: number;
	/** 面谈人ID */
	interviewUserId?: string | number | null;
	/** 转派面谈人ID */
	assignInterviewUserId?: string | number | null;
	/** 关闭回调 */
	onClose: (shouldRefresh?: boolean) => void;
}

/**
 * 将 treeTags 对象转换为 TreeTagNode[] 数组（参考 archive-audit-drawer.tsx）
 *
 * @param treeTags - 树形标签对象
 * @returns 树形标签节点数组
 */
function convertTreeTagsToNodes(treeTags: any): TreeTagNode[] {
	if (!treeTags) {
		return [];
	}

	const convertNode = (node: any): TreeTagNode | null => {
		// 先处理子节点
		let children: TreeTagNode[] | undefined;
		if (node.children && Array.isArray(node.children) && node.children.length > 0) {
			const convertedChildren = node.children
				.map(convertNode)
				.filter((child: TreeTagNode | null): child is TreeTagNode => child !== null);
			if (convertedChildren.length > 0) {
				children = convertedChildren;
			}
		}

		// 如果 tags 为 null 且没有有效子节点，则过滤掉该节点
		const hasTags =
			node.tags !== null &&
			node.tags !== undefined &&
			(Array.isArray(node.tags) ? node.tags.length > 0 : true);
		if (!hasTags && !children) {
			return null;
		}

		const result: TreeTagNode = {
			id: node.id,
			name: node.name || "",
			parentId: node.parentId || "0",
			weight: node.weight || 0,
			tags: node.tags || [],
			children,
		};

		return result;
	};

	// 如果 treeTags 是数组，直接转换（多个根节点）
	if (Array.isArray(treeTags)) {
		return treeTags
			.map(convertNode)
			.filter((node: TreeTagNode | null): node is TreeTagNode => node !== null);
	}

	// 如果 treeTags 是对象，需要找到根节点
	if (treeTags.children && Array.isArray(treeTags.children)) {
		const convertedNodes = treeTags.children.map(convertNode);
		return convertedNodes.filter(
			(node: TreeTagNode | null): node is TreeTagNode => node !== null,
		);
	}

	return [];
}

/**
 * 判断标签是否为"是"/"否"类型
 *
 * @param tag - 标签项
 * @returns 是否为"是"/"否"类型
 */
function isYesNoTag(tag: InterviewTagItem | TreeTagItem): boolean {
	if (tag.tagValues === "是,否" || tag.tagValues === "否,是") {
		return true;
	}
	if (Array.isArray(tag.tagValueList) && tag.tagValueList.length === 2) {
		const values = tag.tagValueList.map((item: any) =>
			String(item.value || item.label || item).trim(),
		);
		return values.includes("是") && values.includes("否");
	}
	return false;
}

/**
 * 面谈详情抽屉
 *
 * @param props - 组件属性
 * @param props.open - 是否显示抽屉
 * @param props.userId - 用户ID
 * @param props.interviewUserId - 面谈人ID（可选）
 * @param props.assignInterviewUserId - 转派面谈人ID（可选）
 * @param props.onClose - 关闭回调
 */
export function InterviewDetailDrawer({
	open,
	userId,
	interviewUserId,
	assignInterviewUserId,
	onClose,
}: InterviewDetailDrawerProps) {
	const [form] = Form.useForm();
	const [searchForm] = Form.useForm();
	const { options: purposeOptions } = useDict(PERSONNEL_ARCHIVE_DICT_KEYS.INTERVIEW_PURPOSE, {
		staleTime: 10 * 60 * 1000, // 10 分钟缓存
	});
	// 获取标签状态字典
	const { getItem: getTagStatusItem, getLabel: getTagStatusLabel } = useDict(
		PERSONNEL_ARCHIVE_DICT_KEYS.TAG_STATUS,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const [interviewDetail, setInterviewDetail] = useState<any>(null);
	const [interviewHistory, setInterviewHistory] = useState<InterviewHistoryItem[]>([]);
	const [tagValues, setTagValues] = useState<Record<number, string>>({});
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [uploadFileForms, setUploadFileForms] = useState<UploadFileFormItem[]>([]);
	const token = useAuthStore((s) => s.token);
	const uploadAction = `${(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")}/file/oss/upload`;
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
		(file: UploadFileFormItem) => {
			return previewAttachment(toPreviewable(file), uploadFileForms.map(toPreviewable));
		},
		[previewAttachment, uploadFileForms],
	);

	const handleDownloadAttachment = useCallback(
		(file: UploadFileFormItem) => {
			return downloadAttachment(toPreviewable(file));
		},
		[downloadAttachment],
	);

	// 树形结构相关状态
	const [treeNodes, setTreeNodes] = useState<TreeTagNode[]>([]);
	const [selectedLeafNodeIds, setSelectedLeafNodeIds] = useState<string[]>([]);
	const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
	const [tagNameFilter, setTagNameFilter] = useState<string>("");

	/** 标签节点 key 的前缀 */
	const TAG_NODE_PREFIX = "tag-" as const;

	/**
	 * 生成标签节点的 key
	 *
	 * @param tagId - 标签ID
	 * @returns 标签节点 key
	 */
	const getTagNodeKey = (tagId: string | number) => `${TAG_NODE_PREFIX}${tagId}`;

	/**
	 * 判断是否为标签节点 key
	 *
	 * @param key - 节点 key
	 * @returns 是否为标签节点
	 */
	const isTagNodeKey = (key: React.Key) => String(key).startsWith(TAG_NODE_PREFIX);

	/**
	 * 从标签节点 key 中提取标签ID
	 *
	 * @param key - 标签节点 key
	 * @returns 标签ID
	 */
	const getTagIdFromKey = (key: React.Key) => String(key).slice(TAG_NODE_PREFIX.length);

	/**
	 * 递归收集节点及其子节点下的所有标签节点 key
	 *
	 * @param node - 树形节点
	 * @param result - 结果数组（用于收集标签节点 key）
	 */
	const collectTagNodeKeys = (node: TreeTagNode, result: string[]) => {
		if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
			node.tags.forEach((tag) => {
				if (tag.id !== null && tag.id !== undefined) {
					result.push(getTagNodeKey(tag.id));
				}
			});
		}
		if (node.children && Array.isArray(node.children)) {
			node.children.forEach((child) => {
				collectTagNodeKeys(child, result);
			});
		}
	};

	/**
	 * 建立节点ID到节点的映射，用于快速查找节点
	 */
	const nodeIdMap = useMemo(() => {
		const map = new Map<string, TreeTagNode>();
		const traverse = (nodes: TreeTagNode[]) => {
			nodes.forEach((node) => {
				map.set(node.id, node);
				if (node.children && Array.isArray(node.children)) {
					traverse(node.children);
				}
			});
		};
		traverse(treeNodes);
		return map;
	}, [treeNodes]);

	/**
	 * 建立标签ID到标签对象的映射，用于快速查找标签
	 */
	const tagIdMap = useMemo(() => {
		const map = new Map<string, TreeTagItem>();
		const traverse = (nodes: TreeTagNode[]) => {
			nodes.forEach((node) => {
				if (node.tags && Array.isArray(node.tags)) {
					node.tags.forEach((tag) => {
						if (tag.id !== null && tag.id !== undefined) {
							const tagId = String(tag.id);
							// 避免重复，取第一个遇到的标签
							if (!map.has(tagId)) {
								map.set(tagId, tag);
							}
						}
					});
				}
				if (node.children && Array.isArray(node.children)) {
					traverse(node.children);
				}
			});
		};
		traverse(treeNodes);
		return map;
	}, [treeNodes]);

	/**
	 * 加载面谈详情（历史记录从详情接口 hisList 获取）
	 */
	const loadInterviewDetail = useCallback(async () => {
		setIsLoadingDetail(true);
		try {
			const res = await fetchInterviewDetail(
				userId,
				interviewUserId ? Number(interviewUserId) : undefined,
				assignInterviewUserId ? Number(assignInterviewUserId) : undefined,
			);

			if (res) {
				setInterviewDetail(res);
				// 初始化附件列表（回显已保存的附件）
				setUploadFileForms(res.fileList ?? []);
				// 初始化表单值
				form.setFieldsValue({
					purpose: res.purpose,
					overall: res.overall,
				});

				// 使用 treeTags 构建树形结构
				let nodes: TreeTagNode[] = [];
				if (res.treeTags && res.treeTags.length > 0) {
					// 将 treeTags 转换为树形结构（多个根节点）
					nodes = convertTreeTagsToNodes(res.treeTags);
				}
				setTreeNodes(nodes);

				// 从树形节点中提取所有标签并初始化标签值
				const initialTagValues: Record<number, string> = {};
				const extractTagsFromNodes = (nodeList: TreeTagNode[]) => {
					nodeList.forEach((node) => {
						if (node.tags && node.tags.length > 0) {
							node.tags.forEach((tag) => {
								const tagId = Number(tag.id);
								initialTagValues[tagId] = tag.tagValue ?? "";
							});
						}
						if (node.children && node.children.length > 0) {
							extractTagsFromNodes(node.children);
						}
					});
				};
				extractTagsFromNodes(nodes);
				setTagValues(initialTagValues);
			}

			// 设置历史记录（从详情接口返回的 hisList 提取）
			if (Array.isArray(res?.hisList)) {
				setInterviewHistory(() => res.hisList as unknown as InterviewHistoryItem[]);
			} else {
				setInterviewHistory([]);
			}

			if (res) {
				// 默认选中所有根节点和所有标签节点
				const nodes = convertTreeTagsToNodes(res.treeTags || []);
				const rootKeys = nodes.map((rootNode) => rootNode.id);

				const tagKeys: string[] = [];
				const seenTagKeys = new Set<string>();
				nodes.forEach((rootNode) => {
					const tagIds: string[] = [];
					collectTagNodeKeys(rootNode, tagIds);
					tagIds.forEach((tagId) => {
						if (!seenTagKeys.has(tagId)) {
							tagKeys.push(tagId);
							seenTagKeys.add(tagId);
						}
					});
				});

				setCheckedKeys([...rootKeys, ...tagKeys]);
				setSelectedLeafNodeIds(tagKeys);
			}
		} catch (error) {
			console.error("加载面谈详情失败:", error);
		} finally {
			setIsLoadingDetail(false);
		}
	}, [userId, interviewUserId, form]);

	/**
	 * 清理状态的函数
	 */
	const resetState = useCallback(() => {
		setInterviewDetail(null);
		setTagValues({});
		setTreeNodes([]);
		setSelectedLeafNodeIds([]);
		setCheckedKeys([]);
		setTagNameFilter("");
		setUploadFileForms([]);
		// 检查 form 是否已挂载再重置
		if (form && typeof form.resetFields === "function") {
			try {
				form.resetFields();
			} catch {
				// Form 未挂载时忽略错误
			}
		}
		if (searchForm && typeof searchForm.resetFields === "function") {
			try {
				searchForm.resetFields();
			} catch {
				// Form 未挂载时忽略错误
			}
		}
	}, [form, searchForm]);

	useEffect(() => {
		if (open) {
			loadInterviewDetail();
		} else {
			resetState();
		}
	}, [open, userId, interviewUserId, assignInterviewUserId, resetState, loadInterviewDetail]);

	/**
	 * 处理树节点勾选
	 *
	 * @param checkedKeysValue - 选中的键值
	 */
	const handleCheck = (
		checkedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
	) => {
		const keys = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked;
		setCheckedKeys(keys);

		if (!treeNodes || treeNodes.length === 0) {
			return;
		}

		// 收集所有选中的标签节点 key（只收集标签节点，不收集分类节点）
		const newSelectedTagNodeIds: string[] = [];
		const seenIds = new Set<string>();

		keys.forEach((key) => {
			const nodeKey = String(key);

			// 标签节点：直接添加
			if (isTagNodeKey(nodeKey)) {
				if (!seenIds.has(nodeKey)) {
					newSelectedTagNodeIds.push(nodeKey);
					seenIds.add(nodeKey);
				}
				return;
			}

			// 分类节点：使用 Map 快速查找节点，然后收集其子标签节点
			const node = nodeIdMap.get(nodeKey);
			if (node) {
				// 收集该节点下的所有标签节点
				const tagIds: string[] = [];
				collectTagNodeKeys(node, tagIds);
				tagIds.forEach((tagId) => {
					if (!seenIds.has(tagId)) {
						newSelectedTagNodeIds.push(tagId);
						seenIds.add(tagId);
					}
				});
			}
		});

		// 清理未勾选标签的值
		setTagValues((prev) => {
			const newTagValues: Record<number, string> = {};
			newSelectedTagNodeIds.forEach((tagNodeKey) => {
				const tagId = Number(getTagIdFromKey(tagNodeKey));
				// 只保留已勾选标签的值
				if (prev[tagId] !== undefined) {
					newTagValues[tagId] = prev[tagId];
				}
			});
			return newTagValues;
		});

		setSelectedLeafNodeIds(newSelectedTagNodeIds);
	};

	/**
	 * 获取选中叶子节点的标签列表（用于表格显示，只显示符合筛选条件的已勾选节点）
	 */
	const selectedTagsList = useMemo(() => {
		if (!treeNodes || selectedLeafNodeIds.length === 0) {
			return [];
		}

		const selectedTagsList: TreeTagItem[] = [];
		const seenIds = new Set<string>();

		// 遍历选中的标签节点 ID，只处理标签节点（不处理分类节点）
		selectedLeafNodeIds.forEach((nodeKey) => {
			const nodeKeyStr = String(nodeKey);
			// 只处理标签节点 key
			if (isTagNodeKey(nodeKeyStr)) {
				const tagId = getTagIdFromKey(nodeKeyStr);
				// 使用 Map 快速查找标签，避免递归遍历树
				const tag = tagIdMap.get(tagId);
				if (tag) {
					const tagMapKey = String(tag.id);
					// 去重
					if (seenIds.has(tagMapKey)) {
						return;
					}
					// 应用筛选条件
					if (tagNameFilter && tag.tagName && !tag.tagName.includes(tagNameFilter)) {
						return;
					}
					selectedTagsList.push(tag);
					seenIds.add(tagMapKey);
				}
			}
		});

		return selectedTagsList;
	}, [tagIdMap, selectedLeafNodeIds, tagNameFilter]);

	/**
	 * 处理标签值变化
	 *
	 * @param tagId - 标签ID
	 * @param value - 标签值
	 */
	const handleTagValueChange = (tagId: number, value: string) => {
		setTagValues((prev) => ({
			...prev,
			[tagId]: value,
		}));
		// 如果填写了标签值，清除对应的校验错误
		if (value && value.trim() !== "") {
			setValidationErrors((prev) => {
				const tag = selectedTagsList.find((t) => Number(t.id) === tagId);
				if (tag) {
					return prev.filter((tagName) => tagName !== tag.tagName);
				}
				return prev;
			});
		}
	};

	/**
	 * 处理树数据，添加搜索高亮和状态显示，并根据筛选条件过滤 tags
	 */
	const treeData = useMemo((): any[] => {
		if (!treeNodes || treeNodes.length === 0) {
			return [];
		}

		const convertTreeNodes = (data: TreeTagNode[]): any[] =>
			data
				.map((item) => {
					const nodeTitle = (
						<div className="flex items-center justify-between gap-2">
							<span>{item.name}</span>
						</div>
					);

					const childNodes =
						item.children && Array.isArray(item.children)
							? convertTreeNodes(item.children)
							: [];

					// 将 tags 显示为子节点（可勾选），并根据筛选条件过滤
					const tagNodes =
						item.tags && Array.isArray(item.tags)
							? item.tags
									.filter((tag) => {
										// 筛选标签名称
										if (
											tagNameFilter &&
											tag.tagName &&
											!tag.tagName.includes(tagNameFilter)
										) {
											return false;
										}
										return true;
									})
									.map((tag) => {
										// 获取标签状态
										const tagStatusLabel = tag.status
											? getTagStatusLabel(String(tag.status))
											: undefined;
										const tagStatusDict = tag.status
											? getTagStatusItem(String(tag.status))
											: undefined;

										return {
											id:
												tag.id !== null && tag.id !== undefined
													? getTagNodeKey(tag.id)
													: `${item.id}-tag-${Math.random()}`,
											name: (
												<div className="flex items-center justify-between gap-2 text-[13px] text-gray-600">
													<span>{tag.tagName}</span>
													{tagStatusLabel && (
														<Tag
															color={
																tagStatusDict?.listClass ||
																"default"
															}
															bordered={false}
														>
															{tagStatusLabel}
														</Tag>
													)}
												</div>
											),
											isLeaf: true,
										};
									})
							: [];

					const allChildren = [...childNodes, ...tagNodes];

					// 只有当节点有符合条件的子节点或 tags 时才返回该节点
					if (allChildren.length === 0) {
						return null;
					}

					return { ...item, name: nodeTitle, children: allChildren };
				})
				.filter((node): node is any => node !== null);

		return convertTreeNodes(treeNodes);
	}, [treeNodes, tagNameFilter, getTagStatusItem, getTagStatusLabel]);

	/**
	 * 判断标签类型并渲染对应的输入组件
	 *
	 * @param tag - 标签项
	 * @param _index - 索引（未使用）
	 * @returns 输入组件
	 */
	const renderTagInput = (tag: TreeTagItem, _index: number) => {
		const currentValue = tagValues[Number(tag.id)] ?? tag.tagValue ?? "";
		// 将TreeTagItem转换为InterviewTagItem格式进行判断
		const tagForCheck: any = {
			tagValues: tag.tagValues,
			tagValueList: tag.tagValueList,
		};
		const isYesNo = isYesNoTag(tagForCheck);

		// 如果是"是"/"否"类型的标签，渲染下拉选择
		if (isYesNo) {
			return (
				<Select
					value={currentValue}
					onChange={(val) => handleTagValueChange(Number(tag.id), val)}
					options={[
						{ label: "是", value: "是" },
						{ label: "否", value: "否" },
					]}
					placeholder="请选择"
					allowClear
					style={{ width: "100%" }}
				/>
			);
		}

		// 如果是多值类型的标签
		if (tag.tagValueList && Array.isArray(tag.tagValueList) && tag.tagValueList.length > 0) {
			return (
				<Select
					value={currentValue}
					onChange={(val) => handleTagValueChange(Number(tag.id), val)}
					options={tag.tagValueList.map((item: string) => ({
						label: item,
						value: item,
					}))}
					placeholder="请选择"
					allowClear
					style={{ width: "100%" }}
				/>
			);
		}

		// 默认使用文本输入
		return (
			<Input
				value={currentValue}
				onChange={(e) => handleTagValueChange(Number(tag.id), e.target.value)}
				placeholder="请输入"
				allowClear
			/>
		);
	};

	/**
	 * 处理暂存
	 */
	const handleSave = async () => {
		try {
			// 暂存不校验必填项，直接获取表单值
			const values = form.getFieldsValue();
			// 只提交已勾选的标签
			const selectedTagValues = selectedTagsList
				.map((tag) => {
					const tagId = Number(tag.id);
					const tagValue = tagValues[tagId] || tag.tagValue || "";
					return {
						tagId,
						tagValue,
					};
				})
				.filter((item) => item.tagValue.trim() !== ""); // 过滤掉空值

			const params: InterviewSaveParams = {
				id: interviewDetail?.interviewId,
				userId,
				interviewUserId: interviewUserId ? Number(interviewUserId) : undefined,
				assignInterviewUserId: assignInterviewUserId
					? Number(assignInterviewUserId)
					: undefined,
				purpose: values.purpose,
				overall: values.overall,
				tags: selectedTagValues,
				uploadFileForms: uploadFileForms.length > 0 ? uploadFileForms : undefined,
			};

			setIsSubmitting(true);
			await saveInterview(params);
			message.success("暂存成功");
		} catch (error) {
			console.error("暂存失败:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * 处理提交
	 */
	const handleSubmit = async () => {
		try {
			// 检查是否至少选中一个标签
			if (selectedTagsList.length === 0) {
				message.warning("请至少选择一个面谈标签");
				return;
			}

			// 构建需要验证的字段路径（面谈目的、总体评价和所有标签都是必填的）
			const fieldsToValidate: Array<string | number | (string | number)[]> = [
				"purpose",
				"overall",
			];
			selectedTagsList.forEach((tag, index) => {
				if (tag.id !== null && tag.id !== undefined) {
					fieldsToValidate.push(["tags", index, "tagValue"] as (string | number)[]);
				}
			});

			try {
				// 触发表单验证（会显示字段错误状态，爆红）
				await form.validateFields(fieldsToValidate);
			} catch (errorInfo: any) {
				// 验证失败，收集校验错误中的标签名称
				const emptyTags: string[] = [];
				if (errorInfo?.errorFields) {
					errorInfo.errorFields.forEach((errorField: any) => {
						// 从字段路径中提取索引，找到对应的标签
						const fieldPath = errorField.name;
						if (
							Array.isArray(fieldPath) &&
							fieldPath[0] === "tags" &&
							fieldPath[1] !== undefined
						) {
							const index = fieldPath[1];
							const tag = selectedTagsList[index];
							if (tag) {
								emptyTags.push(tag.tagName);
							}
						}
					});
				}

				// 更新校验错误状态（只统计标签的错误）
				setValidationErrors(emptyTags);

				// 验证失败，只显示表单字段错误状态（爆红）和统计信息，不显示 message
				return;
			}

			// 校验通过，获取表单值并提交
			const values = await form.validateFields();
			// 只提交已勾选的标签
			const selectedTagValues = selectedTagsList.map((tag) => {
				const tagId = Number(tag.id);
				const tagValue = tagValues[tagId] || tag.tagValue || "";
				return {
					tagId,
					tagValue,
				};
			});

			const params: InterviewSaveParams = {
				id: interviewDetail?.interviewId,
				userId,
				interviewUserId: interviewUserId ? Number(interviewUserId) : undefined,
				assignInterviewUserId: assignInterviewUserId
					? Number(assignInterviewUserId)
					: undefined,
				purpose: values.purpose,
				overall: values.overall,
				tags: selectedTagValues,
				uploadFileForms: uploadFileForms.length > 0 ? uploadFileForms : undefined,
			};

			setIsSubmitting(true);
			await submitInterview(params);
			message.success("提交成功");
			setValidationErrors([]);
			onClose(true);
		} catch (error) {
			console.error("提交失败:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	/**
	 * 初始化表单值（当selectedTagsList变化时）
	 */
	useEffect(() => {
		if (selectedTagsList.length > 0) {
			const initialValues: { tags: Array<{ tagValue: string }> } = {
				tags: selectedTagsList.map((tag) => ({
					tagValue: tagValues[Number(tag.id)] || tag.tagValue || "",
				})),
			};
			form.setFieldsValue(initialValues);
		}
	}, [selectedTagsList, tagValues, form]);

	return (
		<Drawer
			title="开始面谈"
			placement="right"
			width="clamp(500px, 80vw, 95vw)"
			open={open}
			onClose={() => onClose(false)}
			closable={{ placement: "end" }}
			destroyOnHidden
			styles={{
				body: {
					padding: 0,
					height: "100%",
					overflow: "auto",
				},
			}}
			footer={
				<div className="flex justify-end gap-2">
					<BasicButton onClick={() => onClose(false)}>取消</BasicButton>
					<BasicButton type="default" onClick={handleSave} loading={isSubmitting}>
						暂存
					</BasicButton>
					<BasicButton type="primary" onClick={handleSubmit} loading={isSubmitting}>
						提交
					</BasicButton>
				</div>
			}
		>
			{isLoadingDetail && !interviewDetail ? (
				<div className="flex h-full items-center justify-center">
					<Spin size="large" />
				</div>
			) : (
				interviewDetail && (
					<div className="flex flex-col gap-4 p-4 lg:gap-5 lg:p-6">
						{/* 本次面谈对象 */}
						<BasicInfo data={interviewDetail} title="本次面谈对象" />

						{/* 面谈内容 */}
						<section className="flex flex-col gap-4">
							<SectionTitle title="面谈内容" />
							<ProForm
								form={form}
								layout="horizontal"
								className="space-y-4"
								submitter={false}
								labelCol={{ flex: "6.5rem" }}
							>
								<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
									<div className="flex flex-col gap-4">
										<ProFormSelect
											label="面谈目的"
											name="purpose"
											rules={[{ required: true, message: "请选择面谈目的" }]}
											options={purposeOptions}
											placeholder="请选择"
										/>

										<ProFormTextArea
											label="总体评价"
											name="overall"
											rules={[{ required: true, message: "请输入总体评价" }]}
											fieldProps={{
												rows: 5,
												placeholder: "请输入总体评价",
												maxLength: 1000,
												showCount: true,
											}}
										/>
									</div>

									<ProForm.Item label="附件上传" style={{ marginBottom: 0 }}>
										<div className="flex h-full w-full flex-col gap-2 rounded border border-[var(--oo-colorBorder)] p-4">
											<Upload.Dragger
												name="file"
												multiple
												action={uploadAction}
												headers={
													token
														? { [AUTH_HEADER]: `Bearer ${token}` }
														: undefined
												}
												showUploadList={false}
												accept={Array.from(SUPPORTED_UPLOAD_EXTENSIONS)
													.map((ext) => `.${ext}`)
													.join(",")}
												beforeUpload={(file) => {
													const ext = getFileExtension(file.name);
													if (!SUPPORTED_UPLOAD_EXTENSIONS.has(ext)) {
														message.error(
															"文件格式不支持，请按需求上传对应格式",
														);
														return Upload.LIST_IGNORE;
													}
													if (file.size > MAX_UPLOAD_SIZE) {
														message.error("文件大小不能超过 50MB");
														return Upload.LIST_IGNORE;
													}
													return true;
												}}
												onChange={(info) => {
													const { status } = info.file;
													if (status === "uploading") {
														setIsUploading(true);
													}
													if (status === "done") {
														setIsUploading(false);
														const res = info.file.response;
														const data = (
															res &&
															typeof res === "object" &&
															"data" in res
																? (
																		res as {
																			data?: Record<
																				string,
																				unknown
																			>;
																		}
																	).data
																: res
														) as Record<string, unknown> | undefined;
														if (
															data &&
															typeof data.fileName === "string"
														) {
															const item: UploadFileFormItem = {
																id: Number(data.id) || 0,
																url: String(data.fileName),
																fileName: String(data.fileName),
																newFileName:
																	data.newFileName != null
																		? String(data.newFileName)
																		: "",
																originalFilename:
																	data.originalFilename != null
																		? String(
																				data.originalFilename,
																			)
																		: "",
															};
															setUploadFileForms((prev) => [
																...prev,
																item,
															]);
														}
														message.success(
															`${info.file.name} 上传成功`,
														);
													} else if (status === "error") {
														setIsUploading(false);
														message.error(`${info.file.name} 上传失败`);
													}
												}}
												disabled={isUploading || isSubmitting}
												className="!rounded-lg !border-dashed !border-[#ABC4FF] !bg-white hover:!border-[#2D5BFF] [&_.ant-upload-drag-icon]:!mb-1 [&_.ant-upload-drag-icon_.anticon]:!text-[#2D5BFF] [&_.ant-upload-hint]:!text-xs [&_.ant-upload-hint]:!text-[#667085] [&_.ant-upload-text]:!text-sm [&_.ant-upload-text]:!text-[#1F2937]"
											>
												<div>
													<p className="ant-upload-drag-icon">
														<InboxOutlined />
													</p>
													<p className="ant-upload-text">
														点击或拖拽文件到此区域上传
													</p>
													<p className="ant-upload-hint">
														支持
														xls/xlsx/csv/ppt/pptx/doc/docx/pdf/bmp/gif/jpg/jpeg/png/zip/rar，单个不超过
														50MB
													</p>
												</div>
											</Upload.Dragger>

											{uploadFileForms.length > 0 && (
												<div className="flex flex-col gap-2">
													{uploadFileForms.map((file, index) => {
														const displayName =
															file.originalFilename || file.fileName;
														const previewable =
															isPreviewableFile(displayName);

														return (
															<div
																key={file.id ?? index}
																className="rounded border border-[#E5EBF6] bg-white px-3 py-2 transition-all hover:border-[#C7D6FF] hover:shadow-[0_2px_8px_rgba(45,91,255,0.08)]"
															>
																<div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
																	<div className="min-w-0 flex-1">
																		<div className="mb-1 flex min-w-0 flex-wrap items-center gap-2">
																			<Typography.Text
																				ellipsis={{
																					tooltip:
																						displayName,
																				}}
																				className="max-w-full font-medium md:max-w-[260px]"
																			>
																				{displayName}
																			</Typography.Text>
																		</div>
																	</div>

																	<div className="flex flex-wrap items-center gap-x-3 gap-y-1 md:flex-nowrap md:justify-end md:pl-2">
																		{previewable && (
																			<Button
																				type="link"
																				icon={
																					<EyeOutlined />
																				}
																				onClick={() =>
																					handlePreviewAttachment(
																						file,
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
																		<Button
																			type="link"
																			danger
																			icon={
																				<DeleteOutlined />
																			}
																			onClick={() =>
																				setUploadFileForms(
																					(prev) =>
																						prev.filter(
																							(
																								_,
																								i,
																							) =>
																								i !==
																								index,
																						),
																				)
																			}
																			className="!h-6 !px-0"
																		>
																			删除
																		</Button>
																	</div>
																</div>
															</div>
														);
													})}
												</div>
											)}
										</div>
									</ProForm.Item>
								</div>
							</ProForm>
						</section>

						{/* 面谈标签 */}
						<section className="flex min-h-[200px] flex-1 flex-col gap-4 lg:gap-5">
							<SectionTitle title="面谈标签" />
							<div className="flex items-center justify-between">
								<div>
									<span className="pr-1 text-red-500">*</span>
									<span>请为面谈人在以下方面作出评价</span>
								</div>
								{validationErrors.length > 0 && (
									<Popover
										content={
											<List
												size="small"
												bordered={false}
												dataSource={validationErrors}
												renderItem={(item) => (
													<List.Item className="!px-0 !py-1">
														<span className="mr-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
														{item}
													</List.Item>
												)}
												style={{
													maxHeight: "300px",
													overflowY: "auto",
													width: "200px",
												}}
											/>
										}
										title="未填写的标签"
										trigger="hover"
										placement="bottomRight"
									>
										<span className="cursor-pointer text-sm text-red-500 hover:underline">
											还有 {validationErrors.length} 项未填写
										</span>
									</Popover>
								)}
							</div>

							{/* 搜索表单 */}
							<ConfigProvider
								theme={{
									components: {
										Form: {
											labelColonMarginInlineStart: 0,
											labelColonMarginInlineEnd: 0,
										},
									},
								}}
							>
								<div className="w-full">
									<Form
										form={searchForm}
										variant="borderless"
										colon={false}
										layout="inline"
										labelAlign="right"
									>
										<Form.Item
											name="tagName"
											label="标签名称"
											className="mb-0 rounded border"
											labelCol={{ span: 6 }}
											wrapperCol={{ span: 18 }}
											style={{ width: 300 }}
										>
											<Input
												placeholder="请输入"
												allowClear
												onPressEnter={() => {
													const formValues = searchForm.getFieldsValue();
													setTagNameFilter(formValues.tagName || "");
												}}
											/>
										</Form.Item>
										<Form.Item className="ml-auto">
											<Space>
												<Button
													type="primary"
													onClick={() => {
														const formValues =
															searchForm.getFieldsValue();
														setTagNameFilter(formValues.tagName || "");
													}}
												>
													查询
												</Button>
												<Button
													type="text"
													onClick={() => {
														searchForm.resetFields();
														setTagNameFilter("");
													}}
												>
													重置
												</Button>
											</Space>
										</Form.Item>
									</Form>
								</div>
							</ConfigProvider>

							<div className="grid min-h-[400px] flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_3fr] lg:gap-6">
								{/* 左侧标签选择树 */}
								<aside className="flex min-h-[400px] flex-col overflow-hidden rounded border p-4">
									<section
										className="min-h-0 flex-1 overflow-y-auto"
										style={{ maxHeight: "100%" }}
									>
										{treeNodes && treeNodes.length > 0 && (
											<Tree
												checkable
												multiple
												blockNode
												fieldNames={{
													title: "name",
													key: "id",
													children: "children",
												}}
												defaultExpandAll
												checkedKeys={checkedKeys}
												onCheck={handleCheck}
												treeData={treeData as any}
											/>
										)}
									</section>
								</aside>

								{/* 右侧标签信息表格 */}
								<section className="flex min-h-[400px] flex-col overflow-hidden">
									<ConfigProvider
										theme={{
											components: {
												Form: {
													labelColonMarginInlineStart: 0,
													labelColonMarginInlineEnd: 0,
												},
											},
										}}
									>
										{/* 标签表单网格布局 */}
										<div className="min-h-[400px] flex-1 overflow-y-auto rounded border">
											<Form
												form={form}
												colon={false}
												variant="borderless"
												layout="horizontal"
												requiredMark={false}
											>
												<div className="flex items-center gap-2 bg-gray-100 p-2">
													<span className="pr-1 text-red-500">*</span>
													<span>标签名称</span>
												</div>
												<div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
													{selectedTagsList.map((tag, index) => {
														return (
															<Form.Item
																key={String(tag.id)}
																name={["tags", index, "tagValue"]}
																label={tag.tagName}
																required
																className="!mb-0 me-0 rounded border px-2"
																rules={[
																	{
																		required: true,
																		message: `请填写${tag.tagName}`,
																	},
																]}
															>
																{renderTagInput(tag, index)}
															</Form.Item>
														);
													})}
												</div>
											</Form>
										</div>
									</ConfigProvider>
								</section>
							</div>
						</section>

						{/* 历史面谈记录 */}
						{interviewHistory && interviewHistory.length > 0 && (
							<InterviewHistoryList interviewHistory={interviewHistory} />
						)}
					</div>
				)
			)}

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
