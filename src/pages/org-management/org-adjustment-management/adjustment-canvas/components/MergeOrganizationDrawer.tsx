import type { OrgAdjustmentTaskOrgItem } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { MergeChildTransferMode, MergeOrganizationPayload } from "../types";
import { confirm } from "#src/components/custom-confirm";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { AutoComplete, Button, Drawer, Input, Radio, Select, TreeSelect } from "antd";
import React, { useEffect, useMemo, useState } from "react";

type MergeTreeNode = DataNode & {
	id?: string;
	key?: React.Key;
	value?: string;
	title?: React.ReactNode;
	children?: MergeTreeNode[];
};

interface MergeOrganizationDrawerProps {
	open: boolean;
	onClose: () => void;
	selectedOrgIds: string[];
	initialMergedOrgId?: string | null;
	initialStoppedOrgId?: string | null;
	orgList: OrgAdjustmentTaskOrgItem[];
	orgTree: DataNode[];
	visibleNodeIds: string[];
	onConfirmMerge: (payload: MergeOrganizationPayload) => boolean;
}

interface MergeFormState {
	mergeOrgIds: string[];
	mergedOrgId: string;
	mergedOrgName: string;
	stoppedOrgIds: string[];
	childTransferMode: MergeChildTransferMode;
	partialChildOrgIds: string[];
}

interface FormErrors {
	mergeOrgIds?: string;
	mergedOrgId?: string;
	stoppedOrgIds?: string;
	partialChildOrgIds?: string;
}

const SECTION_TITLE_STYLE: React.CSSProperties = {
	paddingLeft: 10,
	borderLeft: "3px solid rgba(0, 117, 255, 1)",
	fontSize: 14,
	fontWeight: 600,
	lineHeight: "20px",
	color: "#303133",
};

const FORM_ROW_STYLE: React.CSSProperties = {
	display: "flex",
	alignItems: "flex-start",
	gap: 12,
};

const FORM_LABEL_STYLE: React.CSSProperties = {
	width: 104,
	minWidth: 104,
	paddingTop: 5,
	fontSize: 14,
	lineHeight: "22px",
	color: "#606266",
	textAlign: "right",
};

function filterTreeByVisibleIds(
	nodes: MergeTreeNode[],
	visibleNodeIdSet: Set<string>,
): MergeTreeNode[] {
	return nodes.reduce<MergeTreeNode[]>((result, node) => {
		const nodeId = String(node.id || node.value || node.key);
		const children = Array.isArray(node.children)
			? filterTreeByVisibleIds(node.children, visibleNodeIdSet)
			: undefined;
		const isVisible = visibleNodeIdSet.has(nodeId);

		if (!isVisible && (!children || children.length === 0)) {
			return result;
		}

		result.push({
			...node,
			value: String(node.value ?? nodeId),
			title: String(node.title ?? ""),
			children,
		});
		return result;
	}, []);
}

function buildPartialMoveTreeData(
	orgList: OrgAdjustmentTaskOrgItem[],
	mergeOrgIds: string[],
	mergedOrgId: string,
) {
	const mergeAwayIds = mergeOrgIds.filter((id) => id !== mergedOrgId);
	return mergeAwayIds.reduce<
		Array<{
			title: string;
			value: string;
			key: string;
			disabled: boolean;
			children: Array<{ title: string; value: string; key: string }>;
		}>
	>((result, orgId) => {
		const org = orgList.find((item) => String(item.orgId) === orgId);
		if (!org) {
			return result;
		}

		const children = orgList
			.filter((item) => String(item.parentOrgId) === orgId)
			.map((item) => ({
				title: item.orgName,
				value: String(item.orgId),
				key: String(item.orgId),
			}));

		result.push({
			title: org.orgName,
			value: `group-${orgId}`,
			key: `group-${orgId}`,
			disabled: true,
			children,
		});
		return result;
	}, []);
}

function createInitialState(
	selectedOrgIds: string[],
	orgList: OrgAdjustmentTaskOrgItem[],
	initialMergedOrgId?: string | null,
	initialStoppedOrgId?: string | null,
): MergeFormState {
	const uniqueIds = Array.from(new Set(selectedOrgIds.filter(Boolean)));
	const mergedOrgId =
		initialMergedOrgId && uniqueIds.includes(initialMergedOrgId)
			? initialMergedOrgId
			: (uniqueIds[0] ?? "");
	const stoppedCandidates = uniqueIds.filter((id) => id !== mergedOrgId);
	const stoppedOrgIds =
		initialStoppedOrgId && stoppedCandidates.includes(initialStoppedOrgId)
			? Array.from(new Set([initialStoppedOrgId, ...stoppedCandidates]))
			: stoppedCandidates;
	const mergedOrgName = orgList.find((item) => String(item.orgId) === mergedOrgId)?.orgName ?? "";

	return {
		mergeOrgIds: uniqueIds,
		mergedOrgId,
		mergedOrgName,
		stoppedOrgIds,
		childTransferMode: "all",
		partialChildOrgIds: [],
	};
}

function buildMergeConfirmContent(formState: MergeFormState, orgList: OrgAdjustmentTaskOrgItem[]) {
	const mergeOrgNames = formState.mergeOrgIds
		.map((orgId) => orgList.find((item) => String(item.orgId) === orgId)?.orgName)
		.filter((orgName): orgName is string => Boolean(orgName));

	const mergedOrgName =
		formState.mergedOrgName.trim() ||
		orgList.find((item) => String(item.orgId) === formState.mergedOrgId)?.orgName ||
		"目标组织";
	const stoppedOrgNames = formState.stoppedOrgIds
		.map((orgId) => orgList.find((item) => String(item.orgId) === orgId)?.orgName ?? orgId)
		.filter(Boolean);
	const mergeSourceText = mergeOrgNames.join("、") || "所选组织";

	return `${mergeSourceText}将合并为${mergedOrgName}${stoppedOrgNames.length ? `，${stoppedOrgNames.join("、")}将被停用` : ""}`;
}

export const MergeOrganizationDrawer: React.FC<MergeOrganizationDrawerProps> = ({
	open,
	onClose,
	selectedOrgIds,
	initialMergedOrgId,
	initialStoppedOrgId,
	orgList,
	orgTree,
	visibleNodeIds,
	onConfirmMerge,
}) => {
	const [formState, setFormState] = useState<MergeFormState>(() =>
		createInitialState(selectedOrgIds, orgList, initialMergedOrgId, initialStoppedOrgId),
	);
	const [errors, setErrors] = useState<FormErrors>({});

	const visibleNodeIdSet = useMemo(() => new Set(visibleNodeIds.map(String)), [visibleNodeIds]);
	const visibleOrgTree = useMemo(
		() => filterTreeByVisibleIds(orgTree as MergeTreeNode[], visibleNodeIdSet),
		[orgTree, visibleNodeIdSet],
	);
	const mergeOrgOptions = useMemo(
		() =>
			formState.mergeOrgIds
				.map((orgId) => {
					const org = orgList.find((item) => String(item.orgId) === orgId);
					return org ? { label: org.orgName, value: orgId } : null;
				})
				.filter(Boolean) as Array<{ label: string; value: string }>,
		[formState.mergeOrgIds, orgList],
	);
	const stoppedOrgOptions = useMemo(
		() => mergeOrgOptions.filter((option) => option.value !== formState.mergedOrgId),
		[formState.mergedOrgId, mergeOrgOptions],
	);
	const mergedOrg = useMemo(
		() => orgList.find((item) => String(item.orgId) === formState.mergedOrgId),
		[formState.mergedOrgId, orgList],
	);
	const parentOrgName = useMemo(() => {
		if (!mergedOrg?.parentOrgId) {
			return "";
		}
		return (
			orgList.find((item) => String(item.orgId) === String(mergedOrg.parentOrgId))?.orgName ??
			""
		);
	}, [mergedOrg, orgList]);
	const partialMoveTreeData = useMemo(
		() => buildPartialMoveTreeData(orgList, formState.mergeOrgIds, formState.mergedOrgId),
		[formState.mergeOrgIds, formState.mergedOrgId, orgList],
	);
	const hasMovableChildren = useMemo(
		() =>
			partialMoveTreeData.some(
				(item) =>
					Array.isArray((item as any).children) && (item as any).children.length > 0,
			),
		[partialMoveTreeData],
	);

	useEffect(() => {
		if (!open) {
			return;
		}
		setFormState(
			createInitialState(selectedOrgIds, orgList, initialMergedOrgId, initialStoppedOrgId),
		);
		setErrors({});
	}, [open, selectedOrgIds, orgList, initialMergedOrgId, initialStoppedOrgId, visibleOrgTree]);

	const updateFormState = (patch: Partial<MergeFormState>) => {
		setFormState((prev) => ({ ...prev, ...patch }));
		setErrors((prev) => ({
			...prev,
			...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])),
		}));
	};

	const handleMergeOrgIdsChange = (mergeOrgIds: string[]) => {
		const uniqueIds = Array.from(new Set(mergeOrgIds));
		const nextMergedOrgId = uniqueIds.includes(formState.mergedOrgId)
			? formState.mergedOrgId
			: (uniqueIds[0] ?? "");
		const nextStoppedCandidates = uniqueIds.filter((id) => id !== nextMergedOrgId);
		updateFormState({
			mergeOrgIds: uniqueIds,
			mergedOrgId: nextMergedOrgId,
			mergedOrgName:
				orgList.find((item) => String(item.orgId) === nextMergedOrgId)?.orgName ??
				formState.mergedOrgName,
			stoppedOrgIds: nextStoppedCandidates,
			partialChildOrgIds: [],
		});
	};

	const validate = () => {
		const nextErrors: FormErrors = {};
		if (formState.mergeOrgIds.length < 2) {
			nextErrors.mergeOrgIds = "至少选择两个合并组织";
		}
		if (!formState.mergedOrgId) {
			nextErrors.mergedOrgId = "请选择合并后组织";
		}
		if (
			formState.childTransferMode === "partial" &&
			hasMovableChildren &&
			formState.partialChildOrgIds.length === 0
		) {
			nextErrors.partialChildOrgIds = "请选择需要部分平移的下级节点";
		}
		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleConfirm = () => {
		if (!validate()) {
			return;
		}

		const payload = {
			mergeOrgIds: formState.mergeOrgIds,
			mergedOrgId: formState.mergedOrgId,
			mergedOrgName: formState.mergedOrgName,
			stoppedOrgIds: formState.stoppedOrgIds,
			childTransferMode: formState.childTransferMode,
			partialChildOrgIds: formState.partialChildOrgIds,
		};

		confirm({
			title: "请确认是否合并组织",
			icon: "yellow",
			content: buildMergeConfirmContent(formState, orgList),
			okText: "确认",
			cancelText: "取消",
			onOk: () => {
				const confirmed = onConfirmMerge(payload);
				if (confirmed) {
					onClose();
				}
			},
		});
	};

	return (
		<Drawer
			placement="right"
			width={560}
			open={open}
			destroyOnHidden
			title="合并组织"
			styles={{
				body: { padding: 24, background: "#fff" },
				footer: { padding: "12px 24px", borderTop: "1px solid #EBEEF5" },
			}}
			footer={
				<div className="flex justify-end gap-2">
					<Button onClick={onClose}>取消</Button>
					<Button type="primary" onClick={handleConfirm}>
						确定
					</Button>
				</div>
			}
			{...commonDrawerProps(onClose)}
		>
			<div className="flex h-full flex-col gap-6">
				<div className="space-y-4">
					<div style={SECTION_TITLE_STYLE}>选择组织</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							合并组织(至少2个)
						</div>
						<div className="flex-1">
							<TreeSelect
								value={formState.mergeOrgIds}
								placeholder="请选择合并组织"
								style={{ width: "100%" }}
								treeData={visibleOrgTree}
								fieldNames={{
									label: "title",
									value: "value",
									children: "children",
								}}
								multiple
								showSearch
								allowClear
								popupMatchSelectWidth={360}
								listHeight={320}
								treeDefaultExpandAll={false}
								treeNodeFilterProp="title"
								onChange={(values) =>
									handleMergeOrgIdsChange(
										(values as React.Key[] | undefined)?.map(String) ?? [],
									)
								}
								filterTreeNode={(input, node) =>
									String(node.title || "")
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							/>
							{errors.mergeOrgIds ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.mergeOrgIds}
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div style={SECTION_TITLE_STYLE}>合并后组织设置</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							组织名称
						</div>
						<div className="flex-1">
							<AutoComplete
								value={formState.mergedOrgName}
								style={{ width: "100%" }}
								options={mergeOrgOptions.map((option) => ({
									label: option.label,
									value: option.label,
								}))}
								onSelect={(value) => {
									const selectedOption = mergeOrgOptions.find(
										(option) => option.label === value,
									);
									const nextMergedOrgId =
										selectedOption?.value ?? formState.mergedOrgId;
									updateFormState({
										mergedOrgId: nextMergedOrgId,
										mergedOrgName: value,
										stoppedOrgIds: formState.mergeOrgIds.filter(
											(orgId) => orgId !== nextMergedOrgId,
										),
									});
								}}
								onChange={(value) => {
									updateFormState({ mergedOrgName: value });
								}}
							>
								<Input placeholder="请选择或输入合并后组织名称" />
							</AutoComplete>
							{errors.mergedOrgId ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.mergedOrgId}
								</div>
							) : null}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>上级组织</div>
						<div className="flex-1">
							<Input value={parentOrgName} placeholder="自动带出" disabled />
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							下级节点
						</div>
						<div className="flex-1">
							<Radio.Group
								value={formState.childTransferMode}
								onChange={(event) =>
									updateFormState({
										childTransferMode: event.target
											.value as MergeChildTransferMode,
										partialChildOrgIds: [],
									})
								}
								className="flex flex-col gap-2"
							>
								<Radio value="all">
									全量平移（下级节点全部平移至合并后组织下方）
								</Radio>
								<Radio value="partial">部分平移</Radio>
							</Radio.Group>
							{formState.childTransferMode === "partial" ? (
								<div className="mt-3">
									<TreeSelect
										value={formState.partialChildOrgIds}
										style={{ width: "100%" }}
										multiple
										treeCheckable
										showCheckedStrategy={TreeSelect.SHOW_CHILD}
										placeholder={
											hasMovableChildren
												? "请选择下级节点组织"
												: "暂无可平移的下级节点"
										}
										treeData={partialMoveTreeData}
										disabled={!hasMovableChildren}
										onChange={(values) =>
											updateFormState({
												partialChildOrgIds: values as string[],
											})
										}
									/>
									{errors.partialChildOrgIds ? (
										<div className="mt-1 text-xs text-[#F56C6C]">
											{errors.partialChildOrgIds}
										</div>
									) : null}
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div style={SECTION_TITLE_STYLE}>停用组织设置</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>组织名称</div>
						<div className="flex-1">
							<Select
								mode="multiple"
								value={formState.stoppedOrgIds}
								style={{ width: "100%" }}
								placeholder="请选择停用组织"
								options={stoppedOrgOptions}
								onChange={(value) =>
									updateFormState({ stoppedOrgIds: value.map(String) })
								}
							/>
							{errors.stoppedOrgIds ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.stoppedOrgIds}
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
};

export default MergeOrganizationDrawer;
