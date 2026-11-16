import type { OrgAdjustmentTaskOrgItem } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { SplitOrganizationPayload, SplitTargetConfig, SplitTargetMode } from "../types";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Drawer, Input, Radio, Select, Tabs, TreeSelect } from "antd";
import React, { useEffect, useMemo, useState } from "react";

interface SplitOrganizationDrawerProps {
	open: boolean;
	onClose: () => void;
	selectedOrgIds: string[];
	orgList: OrgAdjustmentTaskOrgItem[];
	orgTree: DataNode[];
	onConfirmSplit: (payload: SplitOrganizationPayload) => boolean;
}

interface SplitFormErrors {
	sourceOrgId?: string;
	tabs?: Record<
		string,
		Partial<Record<keyof SplitTargetConfig | "existingOrgId" | "childOrgIds", string>>
	>;
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

const FORM_ROW_CENTER_STYLE: React.CSSProperties = {
	...FORM_ROW_STYLE,
	alignItems: "center",
};

const FORM_LABEL_STYLE: React.CSSProperties = {
	width: 76,
	minWidth: 76,
	paddingTop: 5,
	fontSize: 14,
	lineHeight: "22px",
	color: "#606266",
	textAlign: "right",
};

const FORM_LABEL_CENTER_STYLE: React.CSSProperties = {
	...FORM_LABEL_STYLE,
	paddingTop: 0,
	lineHeight: "32px",
};

const FORM_ITEMS_CONTAINER_STYLE: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 30,
	paddingTop: 6,
};

const SECTION_BLOCK_STYLE: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 18,
};

type TreeNode = DataNode & {
	id?: string;
	key?: React.Key;
	value?: string;
	title?: React.ReactNode;
	children?: TreeNode[];
};

function createTabKey() {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildExistingTarget(sourceOrg: OrgAdjustmentTaskOrgItem | undefined): SplitTargetConfig {
	return {
		key: createTabKey(),
		mode: "existing",
		existingOrgId: sourceOrg ? String(sourceOrg.orgId) : undefined,
		orgName: sourceOrg?.orgName ?? "",
		parentOrgId: sourceOrg?.parentOrgId ? String(sourceOrg.parentOrgId) : undefined,
		childOrgIds: [],
	};
}

function buildPrecreatedTarget(sourceOrg: OrgAdjustmentTaskOrgItem | undefined): SplitTargetConfig {
	return {
		key: createTabKey(),
		mode: "precreate",
		orgName: "",
		parentOrgId: sourceOrg?.parentOrgId ? String(sourceOrg.parentOrgId) : undefined,
		childOrgIds: [],
	};
}

function buildSelectableNonLeafTree(nodes: TreeNode[]): TreeNode[] {
	return nodes.map((node) => {
		const children = Array.isArray(node.children)
			? buildSelectableNonLeafTree(node.children)
			: undefined;
		const hasChildren = Boolean(children?.length);
		return {
			...node,
			value: String(node.value ?? node.key ?? node.id),
			title: String(node.title ?? ""),
			disabled: !hasChildren,
			selectable: hasChildren,
			children,
		};
	});
}

function createInitialTargets(sourceOrg: OrgAdjustmentTaskOrgItem | undefined) {
	return [buildExistingTarget(sourceOrg), buildPrecreatedTarget(sourceOrg)];
}

function areChildSelectionsEqual(left: string[], right: string[]) {
	return left.length === right.length && left.every((item, index) => item === right[index]);
}

function normalizeOrgName(name: string | undefined) {
	return String(name ?? "").trim();
}

function collectPrecreatedNameErrors(
	targets: SplitTargetConfig[],
	orgList: OrgAdjustmentTaskOrgItem[],
) {
	const duplicatedMessage = "同一上级组织下不能预创建同名组织";
	const existingSiblingNames = new Map<string, Set<string>>();
	const duplicatedTargetKeys = new Map<string, string[]>();
	const errorMap: Record<string, string> = {};

	orgList.forEach((item) => {
		const parentKey = String(item.parentOrgId ?? "");
		const orgName = normalizeOrgName(item.orgName);
		if (!orgName) {
			return;
		}

		if (!existingSiblingNames.has(parentKey)) {
			existingSiblingNames.set(parentKey, new Set());
		}
		existingSiblingNames.get(parentKey)?.add(orgName);
	});

	targets.forEach((target) => {
		if (target.mode !== "precreate" || !target.parentOrgId) {
			return;
		}

		const orgName = normalizeOrgName(target.orgName);
		if (!orgName) {
			return;
		}

		if (existingSiblingNames.get(target.parentOrgId)?.has(orgName)) {
			errorMap[target.key] = duplicatedMessage;
		}

		const duplicatedGroupKey = `${target.parentOrgId}::${orgName}`;
		if (!duplicatedTargetKeys.has(duplicatedGroupKey)) {
			duplicatedTargetKeys.set(duplicatedGroupKey, []);
		}
		duplicatedTargetKeys.get(duplicatedGroupKey)?.push(target.key);
	});

	duplicatedTargetKeys.forEach((targetKeys) => {
		if (targetKeys.length < 2) {
			return;
		}

		targetKeys.forEach((targetKey) => {
			errorMap[targetKey] = duplicatedMessage;
		});
	});

	return errorMap;
}

export const SplitOrganizationDrawer: React.FC<SplitOrganizationDrawerProps> = ({
	open,
	onClose,
	selectedOrgIds,
	orgList,
	orgTree,
	onConfirmSplit,
}) => {
	const [sourceOrgId, setSourceOrgId] = useState("");
	const [targets, setTargets] = useState<SplitTargetConfig[]>([]);
	const [activeTabKey, setActiveTabKey] = useState("");
	const [errors, setErrors] = useState<SplitFormErrors>({});

	const orgMap = useMemo(
		() => new Map(orgList.map((item) => [String(item.orgId), item])),
		[orgList],
	);
	const nonLeafTreeData = useMemo(
		() => buildSelectableNonLeafTree(orgTree as TreeNode[]),
		[orgTree],
	);
	const sourceOrg = useMemo(() => orgMap.get(sourceOrgId), [orgMap, sourceOrgId]);
	const sourceChildOptions = useMemo(
		() =>
			orgList
				.filter((item) => String(item.parentOrgId) === sourceOrgId)
				.map((item) => ({ label: item.orgName, value: String(item.orgId) })),
		[orgList, sourceOrgId],
	);

	useEffect(() => {
		if (!open) {
			return;
		}
		const initialSourceOrgId = selectedOrgIds[0] ?? "";
		const initialSourceOrg = initialSourceOrgId ? orgMap.get(initialSourceOrgId) : undefined;
		const initialTargets = createInitialTargets(initialSourceOrg);
		setSourceOrgId(initialSourceOrgId);
		setTargets(initialTargets);
		setActiveTabKey(initialTargets[0]?.key ?? "");
		setErrors({});
	}, [open, selectedOrgIds, orgMap]);

	const updateTarget = (targetKey: string, patch: Partial<SplitTargetConfig>) => {
		setTargets((prev) =>
			prev.map((target) => (target.key === targetKey ? { ...target, ...patch } : target)),
		);
		setErrors((prev) => ({
			...prev,
			tabs: {
				...(prev.tabs ?? {}),
				[targetKey]: {
					...(prev.tabs?.[targetKey] ?? {}),
					...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])),
				},
			},
		}));
	};

	const addTargetTab = () => {
		const nextTarget = buildPrecreatedTarget(sourceOrg);
		setTargets((prev) => [...prev, nextTarget]);
		setActiveTabKey(nextTarget.key);
	};

	const removeTargetTab = (targetKey: string) => {
		setTargets((prev) => {
			if (prev.length <= 2) {
				return prev;
			}
			const next = prev.filter((target) => target.key !== targetKey);
			if (activeTabKey === targetKey) {
				setActiveTabKey(next[next.length - 1]?.key ?? "");
			}
			return next;
		});
	};

	const getAssignedChildIds = (currentTargetKey: string) =>
		new Set(
			targets
				.filter((target) => target.key !== currentTargetKey)
				.flatMap((target) => target.childOrgIds),
		);

	useEffect(() => {
		if (!sourceChildOptions.length) {
			return;
		}

		const validChildIds = new Set(sourceChildOptions.map((option) => option.value));
		setTargets((prev) => {
			let hasChanged = false;
			const next = prev.map((target) => {
				const assignedChildIds = new Set(
					prev
						.filter((item) => item.key !== target.key)
						.flatMap((item) => item.childOrgIds),
				);
				const nextChildOrgIds = target.childOrgIds.filter(
					(childId) => validChildIds.has(childId) && !assignedChildIds.has(childId),
				);
				if (areChildSelectionsEqual(nextChildOrgIds, target.childOrgIds)) {
					return target;
				}
				hasChanged = true;
				return {
					...target,
					childOrgIds: nextChildOrgIds,
				};
			});

			return hasChanged ? next : prev;
		});
	}, [sourceChildOptions, targets.length]);

	const validate = () => {
		const nextErrors: SplitFormErrors = { tabs: {} };
		const precreatedNameErrors = collectPrecreatedNameErrors(targets, orgList);
		if (!sourceOrgId) {
			nextErrors.sourceOrgId = "请选择拆分组织";
		}
		if (targets.length < 2) {
			nextErrors.sourceOrgId = nextErrors.sourceOrgId ?? "至少保留两个拆分结果";
		}

		targets.forEach((target) => {
			const tabErrors: Record<string, string> = {};
			if (target.mode === "existing") {
				if (!target.existingOrgId) {
					tabErrors.existingOrgId = "请选择原有组织";
				}
			} else {
				if (!normalizeOrgName(target.orgName)) {
					tabErrors.orgName = "请输入组织名称";
				} else if (precreatedNameErrors[target.key]) {
					tabErrors.orgName = precreatedNameErrors[target.key];
				}
				if (!target.parentOrgId) {
					tabErrors.parentOrgId = "请选择上级组织";
				}
			}
			if (!target.childOrgIds.length) {
				tabErrors.childOrgIds = "请选择下级组织";
			}
			if (Object.keys(tabErrors).length) {
				nextErrors.tabs![target.key] = tabErrors;
			}
		});

		setErrors(nextErrors);
		return !nextErrors.sourceOrgId && Object.keys(nextErrors.tabs ?? {}).length === 0;
	};

	const handleConfirm = () => {
		if (!validate()) {
			return;
		}

		const confirmed = onConfirmSplit({
			sourceOrgId,
			targets,
		});
		if (confirmed) {
			onClose();
		}
	};

	return (
		<Drawer
			placement="right"
			width={620}
			open={open}
			destroyOnHidden
			title="拆分组织"
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
				<div style={SECTION_BLOCK_STYLE}>
					<div style={SECTION_TITLE_STYLE}>选择组织</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							拆分组织
						</div>
						<div className="flex-1">
							<div className="flex min-h-8 items-center rounded border border-[#DCDFE6] bg-[#F5F7FA] px-3 text-sm text-[#606266]">
								{sourceOrg?.orgName ?? "-"}
							</div>
							{errors.sourceOrgId ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.sourceOrgId}
								</div>
							) : null}
						</div>
					</div>
				</div>

				<div style={SECTION_BLOCK_STYLE}>
					<div style={SECTION_TITLE_STYLE}>拆分后组织设置</div>
					<Tabs
						activeKey={activeTabKey}
						onChange={setActiveTabKey}
						tabBarStyle={{ marginBottom: 18 }}
						items={targets.map((target, index) => ({
							key: target.key,
							label: (
								<div className="flex items-center gap-1">
									<span>{`拆分${index + 1}`}</span>
									{index >= 2 ? (
										<span
											onClick={(event) => {
												event.stopPropagation();
												removeTargetTab(target.key);
											}}
											className="text-xs text-[#909399] hover:text-[#F56C6C]"
										>
											x
										</span>
									) : null}
								</div>
							),
							children: (
								<div style={FORM_ITEMS_CONTAINER_STYLE}>
									<div style={FORM_ROW_CENTER_STYLE}>
										<div style={FORM_LABEL_CENTER_STYLE}>
											<span className="text-[#F56C6C]">*</span>
											拆分类型
										</div>
										<div className="flex-1">
											<Radio.Group
												value={target.mode}
												onChange={(event) =>
													updateTarget(target.key, {
														mode: event.target.value as SplitTargetMode,
														childOrgIds: [],
													})
												}
											>
												<Radio value="existing">原有组织</Radio>
												<Radio value="precreate">预创建组织</Radio>
											</Radio.Group>
										</div>
									</div>

									{target.mode === "existing" ? (
										<>
											<div style={FORM_ROW_STYLE}>
												<div style={FORM_LABEL_STYLE}>
													<span className="text-[#F56C6C]">*</span>
													组织名称
												</div>
												<div className="flex-1">
													<TreeSelect
														value={target.existingOrgId}
														style={{ width: "100%" }}
														placeholder="请选择组织"
														treeData={nonLeafTreeData}
														fieldNames={{
															label: "title",
															value: "value",
															children: "children",
														}}
														showSearch
														treeNodeFilterProp="title"
														onChange={(value) => {
															const nextOrgId = String(value);
															const nextOrg = orgMap.get(nextOrgId);
															updateTarget(target.key, {
																existingOrgId: nextOrgId,
																orgName: nextOrg?.orgName ?? "",
																parentOrgId: nextOrg?.parentOrgId
																	? String(nextOrg.parentOrgId)
																	: undefined,
															});
														}}
													/>
													{errors.tabs?.[target.key]?.existingOrgId ? (
														<div className="mt-1 text-xs text-[#F56C6C]">
															{errors.tabs[target.key]?.existingOrgId}
														</div>
													) : null}
												</div>
											</div>
											<div style={FORM_ROW_STYLE}>
												<div style={FORM_LABEL_STYLE}>上级组织</div>
												<div className="flex-1">
													<Input
														value={
															target.parentOrgId
																? (orgMap.get(target.parentOrgId)
																		?.orgName ?? "")
																: ""
														}
														placeholder="自动带出"
														disabled
													/>
												</div>
											</div>
										</>
									) : (
										<>
											<div style={FORM_ROW_STYLE}>
												<div style={FORM_LABEL_STYLE}>
													<span className="text-[#F56C6C]">*</span>
													组织名称
												</div>
												<div className="flex-1">
													<Input
														value={target.orgName}
														placeholder="请输入组织名称"
														onChange={(event) =>
															updateTarget(target.key, {
																orgName: event.target.value,
															})
														}
													/>
													{errors.tabs?.[target.key]?.orgName ? (
														<div className="mt-1 text-xs text-[#F56C6C]">
															{errors.tabs[target.key]?.orgName}
														</div>
													) : null}
												</div>
											</div>
											<div style={FORM_ROW_STYLE}>
												<div style={FORM_LABEL_STYLE}>
													<span className="text-[#F56C6C]">*</span>
													上级组织
												</div>
												<div className="flex-1">
													<TreeSelect
														value={target.parentOrgId}
														style={{ width: "100%" }}
														placeholder="请选择上级组织"
														treeData={nonLeafTreeData}
														fieldNames={{
															label: "title",
															value: "value",
															children: "children",
														}}
														showSearch
														treeNodeFilterProp="title"
														onChange={(value) =>
															updateTarget(target.key, {
																parentOrgId: String(value),
															})
														}
													/>
													{errors.tabs?.[target.key]?.parentOrgId ? (
														<div className="mt-1 text-xs text-[#F56C6C]">
															{errors.tabs[target.key]?.parentOrgId}
														</div>
													) : null}
												</div>
											</div>
										</>
									)}

									<div style={FORM_ROW_STYLE}>
										<div style={FORM_LABEL_STYLE}>
											<span className="text-[#F56C6C]">*</span>
											下级组织
										</div>
										<div className="flex-1">
											<Select
												mode="multiple"
												showSearch
												optionFilterProp="label"
												value={target.childOrgIds}
												style={{ width: "100%" }}
												placeholder="请选择下级组织"
												options={sourceChildOptions.map((option) => ({
													...option,
													disabled: getAssignedChildIds(target.key).has(
														option.value,
													),
												}))}
												onChange={(value) => {
													const assignedChildIds = getAssignedChildIds(
														target.key,
													);
													const nextChildOrgIds = value.filter(
														(childId) => !assignedChildIds.has(childId),
													);
													updateTarget(target.key, {
														childOrgIds: nextChildOrgIds,
													});
												}}
											/>
											{errors.tabs?.[target.key]?.childOrgIds ? (
												<div className="mt-1 text-xs text-[#F56C6C]">
													{errors.tabs[target.key]?.childOrgIds}
												</div>
											) : null}
										</div>
									</div>
								</div>
							),
						}))}
						tabBarExtraContent={
							<Button type="link" icon={<PlusOutlined />} onClick={addTargetTab}>
								新增
							</Button>
						}
					/>
				</div>
			</div>
		</Drawer>
	);
};

export default SplitOrganizationDrawer;
