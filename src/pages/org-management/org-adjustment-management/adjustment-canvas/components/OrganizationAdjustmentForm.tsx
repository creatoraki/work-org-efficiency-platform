/**
 * 组织调整表单组件
 */

import type { AdjustmentValidationIssue, CanvasRef } from "../types";
import type { ImpactMeasurementSubmitPayload } from "./ImpactMeasurementDrawer";
import {
	checkOrgAdjustmentTask,
	fetchOrgAdjustmentTaskArchiveList,
	saveOrgAdjustmentTaskResult,
	saveTempOrgAdjustmentTaskResult,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { App, Button, Input, Modal, Progress, Radio, Select, Space, TreeSelect } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdjustmentCanvas } from "../context/AdjustmentCanvasContext";
import { AdjustmentSubmissionDrawer } from "./AdjustmentSubmissionDrawer";
import { ArchiveListDrawer } from "./ArchiveListDrawer";
import { ImpactMeasurementDrawer } from "./ImpactMeasurementDrawer";
import { useZoomStore } from "./OrgDiagram/store";

interface OrganizationAdjustmentFormProps {
	className?: string;
	canvasRef?: React.RefObject<CanvasRef | null>;
}

const { TextArea } = Input;

const ACTION_LABEL_MAP: Record<string, string> = {
	move: "平移",
	merge: "合并",
	split: "拆分",
	disable: "禁用",
	enable: "启用",
	stop: "停用组织",
	resume: "恢复组织",
	"batch-disable": "批量禁用下级",
	"batch-enable": "批量启用下级",
	snapshot: "调整保存",
};

function renderFieldPrefix(label: string) {
	return <span className="mr-2 inline-flex items-center text-sm text-[#606266]">{label}</span>;
}

function buildDefaultVersion() {
	const now = new Date();
	const year = String(now.getFullYear());
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}${month}${day}V1`;
}

function buildVersionPrefix() {
	const now = new Date();
	const year = String(now.getFullYear());
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

function generateUniqueVersion(existingVersions: Iterable<string>) {
	const prefix = buildVersionPrefix();
	const occupiedVersions = new Set(
		Array.from(existingVersions)
			.map((version) => version.trim())
			.filter(Boolean),
	);

	let nextIndex = 1;
	while (occupiedVersions.has(`${prefix}V${nextIndex}`)) {
		nextIndex += 1;
	}

	return `${prefix}V${nextIndex}`;
}

function normalizeExistingVersions(
	versionList: Array<{ txtVer?: string }> | undefined,
	currentVersion?: string,
) {
	const existingVersions = new Set(
		(versionList ?? [])
			.slice(0, 500)
			.map((item) => item.txtVer?.trim())
			.filter((version): version is string => Boolean(version)),
	);

	if (currentVersion?.trim()) {
		existingVersions.add(currentVersion.trim());
	}

	return existingVersions;
}

function buildChangeContent(operationTypes: string[]) {
	if (!operationTypes.length) {
		return "调整保存";
	}

	const counter = new Map<string, number>();
	operationTypes.forEach((type) => {
		counter.set(type, (counter.get(type) ?? 0) + 1);
	});

	return Array.from(counter.entries())
		.map(([type, count]) => `${ACTION_LABEL_MAP[type] ?? type}${count > 1 ? `x${count}` : ""}`)
		.join("、");
}

export const OrganizationAdjustmentForm: React.FC<OrganizationAdjustmentFormProps> = ({
	className,
	canvasRef,
}) => {
	const { message } = App.useApp();
	const {
		taskId,
		taskDetail,
		hasPendingChanges,
		operationRecords,
		oepOrgTree,
		selectedTreeNodeId,
		displayLevel,
		adjustmentType,
		canvasData,
		handleTreeNodeSelect,
		setDisplayLevel,
		setAdjustmentType,
		applyVersionDetail,
		setValidationIssues,
		clearValidationIssues,
	} = useAdjustmentCanvas();
	const setSearchHighlightKeyword = useZoomStore((state) => state.setSearchKeyword);

	const [orgName, setOrgName] = useState("");
	const [searchKeyword, setSearchKeyword] = useState("");
	const [searchMatchIds, setSearchMatchIds] = useState<string[]>([]);
	const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
	const [checkProgressOpen, setCheckProgressOpen] = useState(false);
	const [checkProgress, setCheckProgress] = useState(0);
	const [archiveDrawerOpen, setArchiveDrawerOpen] = useState(false);
	const [impactMeasurementOpen, setImpactMeasurementOpen] = useState(false);
	const [adjustmentSubmissionOpen, setAdjustmentSubmissionOpen] = useState(false);
	const [impactMeasurementPayload, setImpactMeasurementPayload] =
		useState<ImpactMeasurementSubmitPayload | null>(null);
	const [hasSavedVersion, setHasSavedVersion] = useState(false);
	const [checkingSavedVersion, setCheckingSavedVersion] = useState(false);
	const [saveModalOpen, setSaveModalOpen] = useState(false);
	const [saveVersion, setSaveVersion] = useState("");
	const [saveRemark, setSaveRemark] = useState("");
	const [generatingSaveVersion, setGeneratingSaveVersion] = useState(false);
	const [submittingCheck, setSubmittingCheck] = useState(false);
	const [submittingSave, setSubmittingSave] = useState(false);
	const [submittingTempSave, setSubmittingTempSave] = useState(false);
	const [currentTaskVersion, setCurrentTaskVersion] = useState("");
	const progressTimerRef = useRef<number | null>(null);
	const progressFinishTimerRef = useRef<number | null>(null);
	const defaultVersion = useMemo(() => buildDefaultVersion(), []);

	const clearProgressTimers = () => {
		if (progressTimerRef.current !== null) {
			window.clearInterval(progressTimerRef.current);
			progressTimerRef.current = null;
		}
		if (progressFinishTimerRef.current !== null) {
			window.clearTimeout(progressFinishTimerRef.current);
			progressFinishTimerRef.current = null;
		}
	};

	const startFakeProgress = () => {
		clearProgressTimers();
		setCheckProgress(6);
		setCheckProgressOpen(true);
		progressTimerRef.current = window.setInterval(() => {
			setCheckProgress((prev) => {
				if (prev >= 92) {
					return prev;
				}
				return Math.min(92, prev + Math.max(3, Math.ceil((100 - prev) / 14)));
			});
		}, 180);
	};

	const finishFakeProgress = (callback?: () => void) => {
		if (progressTimerRef.current !== null) {
			window.clearInterval(progressTimerRef.current);
			progressTimerRef.current = null;
		}
		setCheckProgress(100);
		progressFinishTimerRef.current = window.setTimeout(() => {
			setCheckProgressOpen(false);
			setCheckProgress(0);
			progressFinishTimerRef.current = null;
			callback?.();
		}, 260);
	};

	// 默认选中根节点
	useEffect(() => {
		if (oepOrgTree && oepOrgTree.length > 0 && !selectedTreeNodeId) {
			const rootNode = oepOrgTree[0];
			const rootId = (rootNode as any).id || String(rootNode.key);
			handleTreeNodeSelect(rootId);
		}
	}, [oepOrgTree, selectedTreeNodeId, handleTreeNodeSelect]);

	// 展示层级选项
	const levelOptions = [
		{ label: "一级", value: 1 },
		{ label: "二级", value: 2 },
		{ label: "三级", value: 3 },
	];

	const normalizedSearchKeyword = orgName.trim().toLowerCase();

	const buildMatchedNodeIds = (keyword: string) => {
		if (!keyword) {
			return [] as string[];
		}

		return (canvasData.nodes ?? [])
			.filter((node) => {
				const currentName = String(node.name ?? "").toLowerCase();
				return currentName.includes(keyword);
			})
			.map((node) => String(node.id));
	};

	const previewMatchIds = useMemo(
		() => buildMatchedNodeIds(normalizedSearchKeyword),
		[canvasData.nodes, normalizedSearchKeyword],
	);

	const focusMatchedNodeByIndex = (matchIds: string[], index: number) => {
		const nodeId = matchIds[index];
		if (!nodeId) {
			return;
		}

		setSearchKeyword(normalizedSearchKeyword);
		setSearchMatchIds(matchIds);
		setCurrentSearchIndex(index);
		canvasRef?.current?.focusNode(nodeId);
	};

	// 处理查询
	const handleSearch = (direction: "next" | "prev" = "next") => {
		if (!normalizedSearchKeyword) {
			message.warning("请输入组织名称");
			setSearchKeyword("");
			setSearchMatchIds([]);
			setCurrentSearchIndex(-1);
			return;
		}

		const canReuseSearchResult =
			searchKeyword === normalizedSearchKeyword && searchMatchIds.length > 0;
		const nextMatchIds = canReuseSearchResult
			? searchMatchIds
			: buildMatchedNodeIds(normalizedSearchKeyword);

		if (!nextMatchIds.length) {
			message.warning("当前视图内未找到匹配的组织");
			setSearchKeyword(normalizedSearchKeyword);
			setSearchMatchIds([]);
			setCurrentSearchIndex(-1);
			return;
		}

		if (!canReuseSearchResult) {
			focusMatchedNodeByIndex(
				nextMatchIds,
				direction === "prev" ? nextMatchIds.length - 1 : 0,
			);
			return;
		}

		const nextIndex =
			direction === "prev"
				? currentSearchIndex <= 0
					? nextMatchIds.length - 1
					: currentSearchIndex - 1
				: currentSearchIndex >= nextMatchIds.length - 1 || currentSearchIndex < 0
					? 0
					: currentSearchIndex + 1;

		focusMatchedNodeByIndex(nextMatchIds, nextIndex);
	};

	// 处理重置
	const handleReset = () => {
		setOrgName("");
		setSearchKeyword("");
		setSearchMatchIds([]);
		setCurrentSearchIndex(-1);
		// 重置为根节点
		if (oepOrgTree && oepOrgTree.length > 0) {
			const rootNode = oepOrgTree[0];
			const rootId = (rootNode as any).id || String(rootNode.key);
			handleTreeNodeSelect(rootId);
		}
		setDisplayLevel(3);
		setAdjustmentType("move");
	};

	useEffect(() => {
		return () => {
			clearProgressTimers();
		};
	}, []);

	useEffect(() => {
		setCurrentTaskVersion((taskDetail?.txtVer || "").trim() || defaultVersion);
	}, [defaultVersion, taskDetail?.txtVer]);

	useEffect(() => {
		let cancelled = false;

		if (!taskId) {
			setHasSavedVersion(false);
			setCheckingSavedVersion(false);
			return;
		}

		setCheckingSavedVersion(true);
		fetchOrgAdjustmentTaskArchiveList({ taskId })
			.then((response) => {
				if (cancelled) {
					return;
				}
				setHasSavedVersion((response.data?.length ?? 0) > 0);
			})
			.catch(() => {
				if (cancelled) {
					return;
				}
				setHasSavedVersion(false);
			})
			.finally(() => {
				if (cancelled) {
					return;
				}
				setCheckingSavedVersion(false);
			});

		return () => {
			cancelled = true;
		};
	}, [taskId]);

	useEffect(() => {
		setSearchHighlightKeyword(orgName.trim());
	}, [orgName, setSearchHighlightKeyword]);

	useEffect(() => {
		if (!searchKeyword) {
			return;
		}

		const nextMatchIds = buildMatchedNodeIds(searchKeyword);
		if (!nextMatchIds.length) {
			setSearchMatchIds([]);
			setCurrentSearchIndex(-1);
			return;
		}

		setSearchMatchIds(nextMatchIds);
		setCurrentSearchIndex((prev) => {
			if (prev < 0) {
				return 0;
			}

			const currentNodeId = searchMatchIds[prev];
			const nextIndex = currentNodeId ? nextMatchIds.indexOf(currentNodeId) : -1;
			return nextIndex >= 0 ? nextIndex : 0;
		});
	}, [canvasData.nodes, searchKeyword]);

	const displayMatchCount = normalizedSearchKeyword
		? searchKeyword === normalizedSearchKeyword
			? searchMatchIds.length
			: previewMatchIds.length
		: 0;

	const displaySearchIndex =
		searchKeyword === normalizedSearchKeyword && currentSearchIndex >= 0
			? currentSearchIndex + 1
			: 0;

	const searchStatusText = normalizedSearchKeyword
		? `${displaySearchIndex}/${displayMatchCount}`
		: "";

	const searchNavigator = (
		<span className="inline-flex items-center gap-1 text-xs text-[#606266]">
			<span>{searchStatusText}</span>
			<Button
				type="text"
				size="small"
				icon={<UpOutlined />}
				disabled={displayMatchCount === 0}
				onClick={() => handleSearch("prev")}
				className="!flex !h-5 !w-5 !items-center !justify-center !p-0"
			/>
			<Button
				type="text"
				size="small"
				icon={<DownOutlined />}
				disabled={displayMatchCount === 0}
				onClick={() => handleSearch("next")}
				className="!flex !h-5 !w-5 !items-center !justify-center !p-0"
			/>
		</span>
	);

	// const showCheckFailedModal = () => {
	// 	modal.confirm({
	// 		centered: true,
	// 		icon: <ExclamationCircleFilled style={{ color: "#fa8c16" }} />,
	// 		title: "未通过校验",
	// 		content: null,
	// 		cancelText: "取消",
	// 		okText: "返回调整",
	// 		maskClosable: true,
	// 	});
	// };

	const buildValidationIssues = (
		responseIssues: NonNullable<
			Awaited<ReturnType<typeof checkOrgAdjustmentTask>>["data"]
		>["conflictList"],
	): AdjustmentValidationIssue[] => {
		return (responseIssues ?? []).map((item, index) => ({
			key: `issue-${item.orgId}-${index}`,
			orgId: String(item.orgId),
			code: item.code,
			orgName: item.orgName,
			originalParentOrgId: item.oldParentOrgId ? String(item.oldParentOrgId) : undefined,
			originalParentOrgName: item.oldParentOrgName,
			message: item.conflictContent,
		}));
	};

	const openSaveModal = async () => {
		setSaveRemark("");
		setSaveModalOpen(true);
		setGeneratingSaveVersion(true);

		try {
			if (!taskId) {
				setSaveVersion(defaultVersion);
				return;
			}

			const response = await fetchOrgAdjustmentTaskArchiveList({ taskId });
			const existingVersions = normalizeExistingVersions(response.data, taskDetail?.txtVer);

			setSaveVersion(generateUniqueVersion(existingVersions));
		} catch {
			setSaveVersion(defaultVersion);
			message.warning("版本号自动生成失败，已回退为默认版本号");
		} finally {
			setGeneratingSaveVersion(false);
		}
	};

	const buildActiveListPayload = (version: string) => {
		if (!taskId || !taskDetail) {
			return null;
		}

		const fallbackActiveBody = JSON.stringify({
			type: "snapshot",
			createdAt: new Date().toISOString(),
			payload: {
				modifiedOrgIds: taskDetail.orgList
					.filter((item) => item.modified)
					.map((item) => item.orgId),
			},
		});

		const activeList = (
			operationRecords.length > 0
				? operationRecords
				: [{ type: "snapshot", activeBody: fallbackActiveBody }]
		).map((record) => ({
			taskId,
			ver: version,
			type: record.type,
			activeBody: record.activeBody,
		}));

		return {
			activeList,
			changeContent: buildChangeContent(activeList.map((item) => item.type ?? "")),
		};
	};

	// 处理保存
	const handleSave = async () => {
		if (!hasPendingChanges || submittingCheck || !taskId || !taskDetail) {
			return;
		}

		setSubmittingCheck(true);
		startFakeProgress();

		try {
			const response = await checkOrgAdjustmentTask({
				taskId,
				remark: taskDetail.remark,
				orgList: taskDetail.orgList,
				forCheckErrorTest: false,
			});

			if (response.code !== 200 || !response.data) {
				finishFakeProgress(() => {
					message.error(response.msg || "校验失败，请稍后重试");
				});
				return;
			}

			const conflictList = response.data.conflictList ?? [];

			// 无冲突：校验通过，直接进入保存流程
			if (conflictList.length === 0) {
				finishFakeProgress(() => {
					clearValidationIssues();
					openSaveModal();
				});
				return;
			}

			const validationIssues = buildValidationIssues(conflictList);

			finishFakeProgress(() => {
				setValidationIssues(validationIssues);
				message.warning(`存在 ${validationIssues.length} 项冲突待处理`);
			});
		} catch {
			finishFakeProgress();
		} finally {
			setSubmittingCheck(false);
		}
	};

	const handleNextStep = async () => {
		const normalizedSaveVersion = saveVersion.trim();
		const normalizedSaveRemark = saveRemark.trim();

		if (!normalizedSaveVersion) {
			message.warning("请输入保存版本");
			return;
		}

		if (!taskId || !taskDetail) {
			return;
		}

		setSubmittingSave(true);

		try {
			const versionResponse = await fetchOrgAdjustmentTaskArchiveList({ taskId });
			const existingVersions = normalizeExistingVersions(versionResponse.data);
			if (existingVersions.has(normalizedSaveVersion)) {
				const nextVersion = generateUniqueVersion(existingVersions);
				setSaveVersion(nextVersion);
				message.warning(`版本号已存在，已自动生成新的版本号：${nextVersion}`);
				return;
			}

			const payload = buildActiveListPayload(normalizedSaveVersion);
			if (!payload) {
				message.error("保存失败，缺少任务数据");
				return;
			}
			const response = await saveOrgAdjustmentTaskResult({
				taskId,
				txtVer: normalizedSaveVersion,
				remark: normalizedSaveRemark,
				rootNodeId: selectedTreeNodeId ?? taskDetail.rootNodeId,
				viewLevel: displayLevel,
				changeContent: payload.changeContent,
				orgList: taskDetail.orgList,
				activeList: payload.activeList,
			});

			if (response.code !== 200) {
				message.error(response.msg || "保存失败");
				return;
			}

			message.success("保存成功");
			clearValidationIssues();
			setHasSavedVersion(true);
			setCurrentTaskVersion(normalizedSaveVersion);
			setSaveModalOpen(false);
		} catch {
			message.error("保存失败，请稍后重试");
		} finally {
			setSubmittingSave(false);
		}
	};

	const handleTempSave = async () => {
		if (!hasPendingChanges || submittingTempSave || !taskId || !taskDetail) {
			return;
		}

		setSubmittingTempSave(true);

		try {
			const tempVersion = defaultVersion;
			const payload = buildActiveListPayload(tempVersion);
			if (!payload) {
				message.error("暂存失败，缺少任务数据");
				return;
			}

			const response = await saveTempOrgAdjustmentTaskResult({
				taskId,
				txtVer: tempVersion,
				remark: taskDetail.remark,
				rootNodeId: selectedTreeNodeId ?? taskDetail.rootNodeId,
				viewLevel: displayLevel,
				changeContent: payload.changeContent,
				orgList: taskDetail.orgList,
				activeList: payload.activeList,
			});

			if (response.code !== 200) {
				message.error(response.msg || "暂存失败");
				return;
			}

			message.success("暂存成功");
		} catch {
			message.error("暂存失败，请稍后重试");
		} finally {
			setSubmittingTempSave(false);
		}
	};

	const handleImpactMeasurementSubmit = (payload: ImpactMeasurementSubmitPayload) => {
		setImpactMeasurementPayload(payload);
		setImpactMeasurementOpen(false);
		setAdjustmentSubmissionOpen(true);
	};

	return (
		<>
			<div className={`flex h-full flex-col ${className || ""}`}>
				{/* 上半部分：搜索栏 */}
				<div className="flex flex-1 items-center justify-between px-4">
					<div className="flex items-center gap-4">
						{/* 根节点 */}
						<div className="flex items-center gap-2">
							{oepOrgTree && oepOrgTree.length > 0 ? (
								<TreeSelect
									value={selectedTreeNodeId || undefined}
									prefix={renderFieldPrefix("根节点")}
									onChange={(value) => {
										if (value) {
											handleTreeNodeSelect(String(value));
										}
									}}
									treeData={oepOrgTree}
									fieldNames={{
										label: "title",
										value: "key",
										children: "children",
									}}
									placeholder="请选择根节点"
									style={{ width: "280px" }}
									showSearch
									virtual
									listHeight={320}
									popupMatchSelectWidth={600}
									treeDefaultExpandAll={false}
									allowClear
									filterTreeNode={(input, node) => {
										const title = String(node.title || "");
										return title.toLowerCase().includes(input.toLowerCase());
									}}
								/>
							) : (
								<TreeSelect
									disabled
									placeholder="加载中..."
									style={{ width: "280px" }}
								/>
							)}
						</div>

						{/* 默认展示层级 */}
						<div className="flex items-center gap-2">
							<Select
								value={displayLevel}
								onChange={(value) => setDisplayLevel(value as 1 | 2 | 3)}
								options={levelOptions}
								style={{ width: "310px" }}
								prefix={renderFieldPrefix("默认展示层级")}
							/>
						</div>

						{/* 组织名称 */}
						<div className="flex items-center gap-2">
							<Input
								value={orgName}
								onChange={(e) => {
									setOrgName(e.target.value);
									if (!e.target.value.trim()) {
										setSearchKeyword("");
										setSearchMatchIds([]);
										setCurrentSearchIndex(-1);
									}
								}}
								onPressEnter={() => handleSearch("next")}
								placeholder="支持模糊搜索"
								maxLength={50}
								style={{ width: "310px" }}
								prefix={renderFieldPrefix("组织名称")}
								suffix={searchNavigator}
							/>
						</div>
					</div>

					{/* 查询和重置按钮 */}
					<Space size="small">
						<Button type="primary" onClick={() => handleSearch("next")}>
							查询
						</Button>
						<Button type="text" onClick={handleReset}>
							重置
						</Button>
					</Space>
				</div>

				{/* 分割线 */}
				<div className="border-t border-gray-200"></div>

				{/* 下半部分：操作面板 */}
				<div className="flex flex-1 items-center justify-between px-4">
					{/* 调整类型 */}
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-700">
							<span className="text-red-500">*</span>
							调整类型:
						</span>
						<Radio.Group
							value={adjustmentType}
							onChange={(e) => setAdjustmentType(e.target.value)}
							style={{ display: "flex", gap: 16 }}
						>
							<Radio value="merge">合并</Radio>
							<Radio value="split">拆分</Radio>
							<Radio value="move">平移</Radio>
						</Radio.Group>
					</div>

					{/* 右侧按钮组 */}
					<Space size="small">
						<Button onClick={() => setArchiveDrawerOpen(true)}>存档列表</Button>
						<Button
							onClick={() => setImpactMeasurementOpen(true)}
							disabled={!hasSavedVersion || checkingSavedVersion}
						>
							影响范围测算
						</Button>
						<Button
							onClick={handleTempSave}
							disabled={!hasPendingChanges || submittingTempSave}
							loading={submittingTempSave}
						>
							暂存
						</Button>
						<Button
							type="primary"
							onClick={handleSave}
							disabled={!hasPendingChanges || submittingCheck}
						>
							保存版本
						</Button>
					</Space>
				</div>
			</div>

			<Modal
				open={checkProgressOpen}
				centered
				closable={false}
				maskClosable={false}
				keyboard={false}
				footer={null}
				width={360}
			>
				<div className="py-1">
					<div className="mb-3 flex items-center justify-between text-sm text-[#303133]">
						<span>正在校验调整组织是否符合要求...</span>
						<span className="text-[#1677ff]">{checkProgress}%</span>
					</div>
					<Progress
						percent={checkProgress}
						showInfo={false}
						strokeColor="#1677ff"
						trailColor="rgba(0, 0, 0, 0.06)"
					/>
				</div>
			</Modal>

			<Modal
				open={saveModalOpen}
				title="保存"
				centered
				onCancel={() => {
					if (!submittingSave) {
						setSaveModalOpen(false);
					}
				}}
				width={500}
				footer={[
					<Button
						key="cancel"
						disabled={submittingSave}
						onClick={() => setSaveModalOpen(false)}
					>
						取消
					</Button>,
					<Button
						key="next"
						type="primary"
						loading={submittingSave || generatingSaveVersion}
						disabled={generatingSaveVersion}
						onClick={handleNextStep}
					>
						下一步
					</Button>,
				]}
			>
				<div className="pt-2">
					<div className="mb-4 flex items-center gap-3">
						<span className="w-[72px] shrink-0 text-right text-sm text-[#606266]">
							<span className="mr-1 text-[#f56c6c]">*</span>
							保存版本
						</span>
						<Input
							value={saveVersion}
							onChange={(e) => setSaveVersion(e.target.value)}
							placeholder={
								generatingSaveVersion ? "正在生成版本号..." : "请输入保存版本"
							}
							maxLength={30}
							disabled={generatingSaveVersion}
						/>
					</div>
					<div className="flex items-start gap-3">
						<span className="mt-1 w-[72px] shrink-0 text-right text-sm text-[#606266]">
							保存说明
						</span>
						<TextArea
							value={saveRemark}
							onChange={(e) => setSaveRemark(e.target.value)}
							placeholder="请输入"
							maxLength={100}
							showCount
							autoSize={{ minRows: 4, maxRows: 4 }}
							disabled={generatingSaveVersion}
						/>
					</div>
				</div>
			</Modal>

			<ArchiveListDrawer
				open={archiveDrawerOpen}
				onClose={() => setArchiveDrawerOpen(false)}
				taskId={taskId}
				onRestoreVersion={applyVersionDetail}
			/>
			<ImpactMeasurementDrawer
				open={impactMeasurementOpen}
				onClose={() => setImpactMeasurementOpen(false)}
				onSubmit={handleImpactMeasurementSubmit}
				taskId={taskId}
				txtVer={currentTaskVersion}
				taskDetail={taskDetail}
			/>
			<AdjustmentSubmissionDrawer
				open={adjustmentSubmissionOpen}
				onClose={() => setAdjustmentSubmissionOpen(false)}
				taskId={taskId}
				taskDetail={taskDetail}
				txtVer={currentTaskVersion}
				adjustmentType={adjustmentType}
				operationRecords={operationRecords}
				impactMeasurementPayload={impactMeasurementPayload}
			/>
		</>
	);
};

export default OrganizationAdjustmentForm;
