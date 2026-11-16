import type { ProFormInstance } from "@ant-design/pro-components";
import type { MatchingModelItem, MatchingModelListParams, MatchingModelSearchForm } from "./types";
import { fetchOrganizationTree } from "#src/api/common";
import {
	deleteMatchingModel,
	fetchMatchingModelList,
	getMatchingModelSearchOptions,
	offlineMatchingModel,
	onlineMatchingModel,
} from "#src/api/tag-management/tag-matching/model";

import EditIcon from "#src/assets/svg/edit.svg?react";
import FileExcelIcon from "#src/assets/svg/file-excel.svg?react";
import FileIcon from "#src/assets/svg/file.svg?react";
import { BasicButton, BasicContent } from "#src/components";

import { useDict, useJobCascadeOptions } from "#src/hooks";
import {
	CACHE_TIME,
	TAG_DICT_KEYS,
	TAG_MANAGEMENT_PERMISSIONS,
} from "#src/pages/tag-management/config";
import { cn } from "#src/utils";
import {
	ProFormSelect,
	ProFormText,
	ProFormTreeSelect,
	QueryFilter,
} from "@ant-design/pro-components";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	ConfigProvider,
	Descriptions,
	Divider,
	Empty,
	message,
	Modal,
	Pagination,
	Space,
	Spin,
	Switch,
	Typography,
} from "antd";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import MatchingModelFormDrawer from "./components/MatchingModelFormDrawer";
import MatchingModelViewDrawer from "./components/MatchingModelViewDrawer";
import RuleLibraryModalProTable from "./components/RuleLibraryModalProTable";
import TagList from "./components/TagList";

const { Text } = Typography;

const MATCHING_MODEL_STATUS = {
	OFFLINE: "0",
	ONLINE: "1",
} as const;

/**
 * 渲染带 tooltip 的文本组件（支持按分隔符切分显示列表）
 *
 * @param value - 文本值
 * @param separator - 分隔符，默认为英文逗号
 * @returns React 节点
 */
function renderTextWithTooltip(
	value: string | undefined | null,
	separator: string = ",",
): React.ReactNode {
	const text = value || "暂无";
	if (!text || text === "暂无") {
		return <span>暂无</span>;
	}

	const items = text
		.split(separator)
		.map((item) => item.trim())
		.filter((item) => item);

	const tooltipContent = (
		<div className="max-h-[300px] min-w-[200px] max-w-[400px] overflow-y-auto px-3 py-2">
			{items.map((item) => (
				<div key={item} className="flex items-center py-1.5 leading-5">
					<span className="mr-3 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-500" />
					<span className="text-sm">{item}</span>
				</div>
			))}
		</div>
	);

	return (
		<Text
			ellipsis={{
				tooltip: tooltipContent,
			}}
		>
			{text}
		</Text>
	);
}

/**
 * 匹配模型搜索区人员选项集合。
 */
interface SearchUserOptionsState {
	creator: Array<{
		userId: number;
		userName: string;
	}>;
	updater: Array<{
		userId: number;
		userName: string;
	}>;
}

interface MatchingModelCardProps {
	/** 匹配模型数据 */
	item: MatchingModelItem;
	/** 查看详情回调 */
	onViewDetail: (item: MatchingModelItem) => void;
	/** 上线回调 */
	onOnline: (item: MatchingModelItem) => void;
	/** 下线回调 */
	onOffline: (item: MatchingModelItem) => void;
	/** 删除回调 */
	onDelete: (item: MatchingModelItem) => void;
	/** 编辑回调 */
	onEdit: (item: MatchingModelItem) => void;
	/** 组织层级字典 getLabel 方法 */
	getOrgLevelLabel?: (value: string) => string | undefined;
	/** 弹窗是否打开 */
	isDrawerOpen?: boolean;
	/** 当前正在编辑的卡片ID */
	activeCardId?: string;
	/** 当前打开 Modal 的卡片ID */
	activeModalCardId?: string;
}

const MatchingModelCard: React.FC<MatchingModelCardProps> = ({
	item,
	onViewDetail,
	onOnline,
	onOffline,
	onDelete,
	onEdit,
	getOrgLevelLabel,
	isDrawerOpen = false,
	activeCardId,
	activeModalCardId,
}) => {
	// 使用状态管理悬浮样式，而不是纯 CSS hover
	const [isHovered, setIsHovered] = useState(false);

	// 当弹窗打开且当前卡片是激活卡片时，保持悬浮状态
	const shouldShowHoverStyle =
		isHovered ||
		(isDrawerOpen && activeCardId === String(item.id)) ||
		activeModalCardId === String(item.id);
	const isOnline = item.status === MATCHING_MODEL_STATUS.ONLINE;

	const handleStatusChange = (checked: boolean) => {
		if (checked) {
			onOnline(item);
		} else {
			onOffline(item);
		}
	};

	const translateOrgLevel = useCallback(
		(orgLevel: string | undefined): string => {
			if (!orgLevel || !getOrgLevelLabel) {
				return "暂无";
			}
			const levels = orgLevel
				.split(",")
				.map((l) => l.trim())
				.filter((l) => l);
			if (levels.length === 0) {
				return "暂无";
			}
			const translatedLevels = levels.map((level) => getOrgLevelLabel(level) || level);
			return translatedLevels.join(", ");
		},
		[getOrgLevelLabel],
	);

	const translateOrgId = useCallback(
		(orgId: string | undefined, orgName: string | undefined): string => {
			if (orgName) {
				return orgName;
			}
			if (orgId) {
				return "⚠️组织名称数据缺失";
			}

			return "暂无";
		},
		[],
	);

	return (
		<div
			className={cn(
				"h-full overflow-hidden rounded border bg-colorBgContainer transition-all duration-300 ease-in-out",
				shouldShowHoverStyle
					? "-translate-y-1 border-primaryBorderHover shadow-md"
					: "border-colorBorder",
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="p-4">
				<div className="mb-4 flex items-center justify-between">
					<div className="mr-3 flex min-w-0 flex-1 items-center gap-1">
						<div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#0075FF] leading-none">
							<FileIcon className="h-3.5 w-3.5" />
						</div>
						<Text
							ellipsis={{
								tooltip: item.name,
							}}
							className="min-w-0 flex-1 cursor-pointer text-base font-medium text-[#0075FF]"
							onClick={() => onViewDetail(item)}
						>
							{item.name}
						</Text>
					</div>

					<ConfigProvider
						theme={{
							components: {
								Button: {
									iconGap: "1px",
									paddingInlineSM: 0,
								},
							},
						}}
					>
						<div className="flex items-center gap-3">
							<Button
								type="link"
								size="small"
								icon={<EditIcon className="h-3.5 w-3.5 text-[#0075FF]" />}
								onClick={() => onEdit(item)}
							>
								编辑
							</Button>
							{!isOnline && (
								<Button
									type="link"
									size="small"
									icon={<FileExcelIcon className="h-3.5 w-3.5 text-[#0075FF]" />}
									onClick={() => onDelete(item)}
								>
									删除
								</Button>
							)}
							<Switch
								checked={isOnline}
								onChange={handleStatusChange}
								checkedChildren="上线"
								unCheckedChildren="下线"
								className="flex-shrink-0"
							/>
						</div>
					</ConfigProvider>
				</div>

				{(() => {
					let jobPostLevelText = "暂无";
					if (item.jobPostIdList && item.jobPostIdList.length > 0) {
						const jobPostLevelList: string[] = [];

						item.jobPostIdList.forEach((node) => {
							switch (node.type) {
								case "root":
									jobPostLevelList.push("全部");
									break;
								case "job":
									jobPostLevelList.push(node.label);
									break;
								case "position": {
									const parts: string[] = [];
									if (node.parentLabel) {
										parts.push(node.parentLabel);
									}
									parts.push(node.label);
									if (node.postGradeName) {
										parts.push(node.postGradeName);
									}
									jobPostLevelList.push(parts.join("-"));
									break;
								}
								default:
									break;
							}
						});

						jobPostLevelText =
							jobPostLevelList.length > 0 ? jobPostLevelList.join("、") : "暂无";
					} else if (item.jobName || item.postName || item.postgradeName) {
						const parts: string[] = [];
						if (item.jobName) {
							parts.push(item.jobName);
						}
						if (item.postName) {
							parts.push(item.postName);
						}
						if (item.postgradeName) {
							parts.push(item.postgradeName);
						}
						jobPostLevelText = parts.length > 0 ? parts.join("-") : "暂无";
					}

					return (
						<Descriptions
							column={2}
							size="small"
							bordered={false}
							items={[
								{
									label: "创建人",
									children: item.createByName || "暂无",
								},
								{
									label: "更新人",
									children: item.updateByName || "暂无",
								},
								{
									label: "描述",
									children: (
										<Text
											ellipsis={{
												tooltip: item.remark || "暂无描述",
											}}
										>
											{item.remark || "暂无描述"}
										</Text>
									),
								},
								{
									label: "组织层级",
									children: renderTextWithTooltip(
										translateOrgLevel(item.orgLevel),
									),
								},
								{
									label: "组织",
									children: renderTextWithTooltip(
										translateOrgId(item.orgId, item.orgName),
									),
								},
								{
									label: "岗位-职位-职级",
									children: renderTextWithTooltip(jobPostLevelText, "、"),
								},
							]}
						/>
					);
				})()}

				<Divider className="my-4" />

				{/* 规则选择、一票否决权、加权逻辑 */}
				<Descriptions
					column={1}
					size="small"
					bordered={false}
					colon={false}
					styles={{ label: { width: "100px" } }}
					items={[
						// {
						// 	label: "规则选择",
						// 	children: (
						// 		<TagList
						// 			tags={item.modelRuleNameList || []}
						// 		/>
						// 	),
						// },
						{
							label: "一票否决权",
							children: (
								<TagList
									tags={
										item.weightList
											?.filter((weight) => weight.veto === 1)
											.map((weight) => weight.tagName) || []
									}
								/>
							),
						},
						{
							label: "加权逻辑",
							children: (
								<div className="flex flex-wrap items-center gap-2">
									{(() => {
										const nonVetoWeights =
											item.weightList?.filter((w) => w.veto !== 1) || [];
										return nonVetoWeights.length > 0 ? (
											<>
												{nonVetoWeights.map((weight, weightIndex) => (
													<Fragment key={weight.id}>
														<span className="flex-shrink-0 rounded bg-[#EBEEF5] px-2 text-xs text-[#323233]">
															{weight.tagName}
															{weight.weight}%
														</span>
														{weightIndex <
															nonVetoWeights.length - 1 && (
															<span className="text-sm text-gray-700">
																+
															</span>
														)}
													</Fragment>
												))}
												<span className="text-sm text-gray-700">
													= 100%
												</span>
											</>
										) : (
											<span className="text-gray-400">暂无配置</span>
										);
									})()}
								</div>
							),
						},
					]}
				/>
			</div>
		</div>
	);
};

function TagMatchingModel() {
	const formRef = useRef<ProFormInstance>();
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 12, // Grid布局可以显示更多卡片
	});
	const [searchParams, setSearchParams] = useState<MatchingModelSearchForm>({});
	const [isRuleLibraryModalOpen, setIsRuleLibraryModalOpen] = useState(false);
	const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
	const [formDrawerMode, setFormDrawerMode] = useState<"add" | "edit" | "readonly">("add");
	const [formDrawerModelId, setFormDrawerModelId] = useState<string | undefined>();
	const [activeModalCardId, setActiveModalCardId] = useState<string | undefined>();

	const { options: statusOptions } = useDict(TAG_DICT_KEYS.MATCHING_MODEL_STATUS);
	const { options: organizationLevelOptions, getLabel: getOrgLevelLabel } = useDict(
		TAG_DICT_KEYS.ORG_LEVEL_FOR_MATCH_MODEL,
	);

	const {
		jobOptions,
		postOptions,
		postgradeOptions,
		handleJobChange,
		handlePostChange,
		resetLinkage,
	} = useJobCascadeOptions({
		sceneKey: "tag-matching-model",
		formRef,
		staleTime: CACHE_TIME.JOB_DICT,
		gcTime: CACHE_TIME.JOB_DICT,
	});

	const { data: organizationTreeData } = useQuery({
		queryKey: ["tag-matching-organization-tree"],
		queryFn: async () => {
			const result = await fetchOrganizationTree();
			return result || null;
		},
		staleTime: CACHE_TIME.ORGANIZATION_TREE,
		gcTime: CACHE_TIME.ORGANIZATION_TREE,
	});

	const {
		data: searchUserOptions = { creator: [], updater: [] },
		refetch: refetchSearchUserOptions,
	} = useQuery({
		queryKey: ["tag-matching-model-search-user-options"],
		queryFn: async (): Promise<SearchUserOptionsState> => {
			const { createByOptions = [], updateByOptions = [] } =
				await getMatchingModelSearchOptions();
			return {
				creator: createByOptions,
				updater: updateByOptions,
			};
		},
		staleTime: CACHE_TIME.JOB_DICT,
		gcTime: CACHE_TIME.JOB_DICT,
	});

	const listQueryParams = useMemo<MatchingModelListParams>(
		() => ({
			...searchParams,
			pageNum: pagination.current,
			pageSize: pagination.pageSize,
			sortItemList: [
				{
					column: "model.update_time",
					isAsc: false,
				},
			],
		}),
		[pagination.current, pagination.pageSize, searchParams],
	);

	const {
		data: matchingModelListData,
		isFetching: loading,
		refetch: refetchMatchingModelList,
	} = useQuery({
		queryKey: ["tag-matching-model-list", listQueryParams],
		queryFn: () => fetchMatchingModelList(listQueryParams),
		placeholderData: (previousData) => previousData,
	});

	const dataSource = matchingModelListData?.list || [];
	const total = matchingModelListData?.total || 0;

	const handleSearch = useCallback((values: MatchingModelSearchForm) => {
		setPagination((prev) => ({ ...prev, current: 1 }));
		setSearchParams(values);
	}, []);

	const handleReset = useCallback(() => {
		resetLinkage();
		setPagination((prev) => ({ ...prev, current: 1 }));
		setSearchParams({});
	}, [resetLinkage]);

	const handleTableChange = useCallback(
		(page: number, pageSize?: number) => {
			setPagination({
				current: page,
				pageSize: pageSize || pagination.pageSize,
			});
		},
		[pagination.pageSize],
	);

	const refreshData = useCallback(async () => {
		await Promise.all([refetchMatchingModelList(), refetchSearchUserOptions()]);
	}, [refetchMatchingModelList, refetchSearchUserOptions]);

	const { mutate: runOnline } = useMutation({
		mutationFn: async (id: string) => {
			await onlineMatchingModel(String(id));
		},
		onSuccess: async () => {
			message.success("上线成功");
			await refreshData();
		},
		onError: (error) => {
			console.error("操作失败:", error);
		},
	});

	const handleOnline = (record: MatchingModelItem) => {
		setActiveModalCardId(String(record.id));
		Modal.confirm({
			title: "确认上线",
			content: "确定要上线该匹配模型吗？",
			centered: true,
			onOk: () => {
				runOnline(record.id);
				setActiveModalCardId(undefined);
			},
			onCancel: () => {
				setActiveModalCardId(undefined);
			},
		});
	};

	const { mutate: runOffline } = useMutation({
		mutationFn: async (id: string) => {
			await offlineMatchingModel(String(id));
		},
		onSuccess: async () => {
			message.success("下线成功");
			await refreshData();
		},
		onError: (error) => {
			console.error("操作失败:", error);
		},
	});

	const handleOffline = (record: MatchingModelItem) => {
		setActiveModalCardId(String(record.id));
		Modal.confirm({
			title: "确认下线",
			content: "确定要下线该匹配模型吗？",
			centered: true,
			onOk: () => {
				runOffline(record.id);
				setActiveModalCardId(undefined);
			},
			onCancel: () => {
				setActiveModalCardId(undefined);
			},
		});
	};

	const { mutate: runDelete } = useMutation({
		mutationFn: async (ids: string[]) => {
			await deleteMatchingModel(ids);
		},
		onSuccess: async () => {
			message.success("删除成功");
			await refreshData();
		},
		onError: (error) => {
			console.error("操作失败:", error);
		},
	});

	const handleDelete = (record: MatchingModelItem) => {
		if (record.status === MATCHING_MODEL_STATUS.ONLINE) {
			message.warning("已上线模型不支持删除，请先下线");
			return;
		}
		setActiveModalCardId(String(record.id));
		Modal.confirm({
			title: "确认删除",
			content: `确认是否删除${record.name || "该"}模型`,
			centered: true,
			onOk: () => {
				runDelete([record.id]);
				setActiveModalCardId(undefined);
			},
			onCancel: () => {
				setActiveModalCardId(undefined);
			},
		});
	};

	const handleViewDetail = useCallback((record: MatchingModelItem) => {
		setFormDrawerModelId(String(record.id));
		setFormDrawerMode("readonly");
		setIsFormDrawerOpen(true);
	}, []);

	/**
	 * 编辑匹配模型
	 */
	const handleEdit = useCallback((item: MatchingModelItem) => {
		setFormDrawerModelId(String(item.id));
		setFormDrawerMode("edit");
		setIsFormDrawerOpen(true);
	}, []);

	/**
	 * 新增匹配模型
	 */
	const handleAddModel = useCallback(() => {
		setFormDrawerModelId(undefined);
		setFormDrawerMode("add");
		setIsFormDrawerOpen(true);
	}, []);

	/**
	 * 表单抽屉关闭
	 */
	const handleFormDrawerClose = useCallback(() => {
		setIsFormDrawerOpen(false);
		setFormDrawerModelId(undefined);
	}, []);

	/**
	 * 表单提交成功
	 */
	const handleFormDrawerSuccess = useCallback(() => {
		refreshData();
	}, [refreshData]);

	/**
	 * 打开规则库维护弹窗
	 */
	const handleRuleLibrary = useCallback(() => {
		setIsRuleLibraryModalOpen(true);
	}, []);

	return (
		<BasicContent className="flex h-full flex-col">
			{/* 查询表单 */}
			<div>
				<QueryFilter
					formRef={formRef}
					onFinish={handleSearch}
					onReset={handleReset}
					className="!p-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap"
					span={4}
					searchGutter={12}
					defaultCollapsed={false}
					showHiddenNum={false}
					optionRender={(_, formProps) => [
						<Button
							key="submit"
							type="primary"
							onClick={() => formProps.form?.submit()}
						>
							查询
						</Button>,
						<Button
							type="text"
							key="reset"
							onClick={() => {
								formProps.form?.resetFields();
								handleReset();
							}}
						>
							重置
						</Button>,
					]}
					variant="borderless"
					colon={false}
				>
					<ProFormText
						name="name"
						label="模型名称"
						placeholder="请输入模型名称"
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
						fieldProps={{
							variant: "borderless",
						}}
					/>

					<ProFormText
						name="remark"
						label="模型描述"
						placeholder="请输入模型描述"
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
						fieldProps={{
							variant: "borderless",
						}}
					/>

					<ProFormSelect
						name="orgLevel"
						label="组织层级"
						placeholder="请选择组织层级"
						options={organizationLevelOptions}
						fieldProps={{
							showSearch: true,
							allowClear: true,
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormTreeSelect
						name="orgId"
						label="组织"
						placeholder="请选择组织"
						fieldProps={{
							showSearch: true,
							allowClear: true,
							treeData: organizationTreeData ? [organizationTreeData] : [],
							fieldNames: { label: "name", value: "id", children: "children" },
							treeNodeFilterProp: "name",
							style: { width: "100%" },
							styles: {
								popup: {
									root: { minWidth: "26rem" },
								},
							},
						}}
						formItemProps={{
							className: "rounded border border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="jobIds"
						label="岗位"
						placeholder="请选择岗位"
						fieldProps={{
							options: jobOptions,
							fieldNames: { label: "displayName", value: "jobId" },
							popupMatchSelectWidth: false,
							showSearch: true,
							allowClear: true,
							mode: "multiple",
							maxTagCount: "responsive",
							onChange: (value) => {
								handleJobChange(Array.isArray(value) ? value : []);
							},
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="postIds"
						label="职位"
						placeholder="请选择职位"
						fieldProps={{
							options: postOptions,
							fieldNames: { label: "displayName", value: "postId" },
							popupMatchSelectWidth: false,
							showSearch: true,
							allowClear: true,
							mode: "multiple",
							maxTagCount: "responsive",
							onChange: (value) => {
								handlePostChange(Array.isArray(value) ? value : []);
							},
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="postLevelIds"
						label="职级"
						placeholder="请选择职级"
						fieldProps={{
							options: postgradeOptions,
							fieldNames: { label: "postgradeName", value: "postgradeId" },
							popupMatchSelectWidth: false,
							showSearch: true,
							allowClear: true,
							mode: "multiple",
							maxTagCount: "responsive",
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="createBy"
						label="创建人"
						placeholder="请选择创建人"
						options={searchUserOptions.creator}
						fieldProps={{
							showSearch: true,
							allowClear: true,
							fieldNames: { label: "userName", value: "userId" },
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="updateBy"
						label="更新人"
						placeholder="请选择更新人"
						options={searchUserOptions.updater}
						fieldProps={{
							showSearch: true,
							allowClear: true,
							fieldNames: { label: "userName", value: "userId" },
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>

					<ProFormSelect
						name="status"
						label="状态"
						placeholder="请选择状态"
						options={statusOptions}
						fieldProps={{
							allowClear: true,
						}}
						formItemProps={{
							className: "rounded border-[1px] border-[#DCDFE6]",
						}}
					/>
				</QueryFilter>
			</div>

			<Divider className="my-4" />

			{/* 操作按钮 */}
			<div>
				<Space>
					<Button type="primary" onClick={handleAddModel}>
						新增匹配模型
					</Button>
					<BasicButton
						onClick={handleRuleLibrary}
						auth={TAG_MANAGEMENT_PERMISSIONS.MATCH_MODEL_RULE_CREATE}
					>
						规则库维护
					</BasicButton>
				</Space>
			</div>

			{/* 卡片列表 */}
			<div className="flex-1 overflow-auto pt-4">
				<Spin spinning={loading} tip="加载中..." size="large" wrapperClassName="h-full">
					{dataSource.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 3xl:grid-cols-3 4xl:grid-cols-4">
							{dataSource.map((item) => (
								<MatchingModelCard
									key={item.id}
									item={item}
									onViewDetail={handleViewDetail}
									onOnline={handleOnline}
									onOffline={handleOffline}
									onDelete={handleDelete}
									onEdit={handleEdit}
									getOrgLevelLabel={getOrgLevelLabel}
									isDrawerOpen={isFormDrawerOpen}
									activeCardId={formDrawerModelId}
									activeModalCardId={activeModalCardId}
								/>
							))}
						</div>
					) : (
						<div className="flex h-full items-center justify-center">
							<Empty description="暂无数据" />
						</div>
					)}
				</Spin>
			</div>

			{/* Ant Design 分页器 */}
			{dataSource.length > 0 && (
				<div className="mt-4 flex justify-end">
					<Pagination
						current={pagination.current}
						total={total}
						pageSize={pagination.pageSize}
						showSizeChanger
						showQuickJumper
						showTotal={(total) => `共 ${total} 条`}
						onChange={handleTableChange}
						onShowSizeChange={handleTableChange}
						pageSizeOptions={["12", "24", "48"]}
					/>
				</div>
			)}

			{/* 规则库维护弹窗 */}
			<RuleLibraryModalProTable
				open={isRuleLibraryModalOpen}
				onCancel={() => setIsRuleLibraryModalOpen(false)}
			/>

			{/* 查看模式使用轻量级只读抽屉 */}
			{formDrawerMode === "readonly" ? (
				<MatchingModelViewDrawer
					open={isFormDrawerOpen}
					modelId={formDrawerModelId}
					onClose={handleFormDrawerClose}
				/>
			) : (
				<MatchingModelFormDrawer
					open={isFormDrawerOpen}
					title={formDrawerMode === "add" ? "新增匹配模型" : "编辑匹配模型"}
					mode={formDrawerMode}
					modelId={formDrawerModelId}
					organizationTreeData={organizationTreeData}
					onClose={handleFormDrawerClose}
					onSuccess={handleFormDrawerSuccess}
				/>
			)}
		</BasicContent>
	);
}

export default TagMatchingModel;
