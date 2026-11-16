import type { OrgAdjustmentTaskOrgItem } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { SplitOrganizationPayload } from "../types";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Button, Drawer, Input, Select, TreeSelect } from "antd";
import React, { useEffect, useMemo, useState } from "react";

interface PrecreateOrganizationDrawerProps {
	open: boolean;
	onClose: () => void;
	sourceOrgId: string | null;
	orgList: OrgAdjustmentTaskOrgItem[];
	orgTree: DataNode[];
	onConfirmSplit: (payload: SplitOrganizationPayload) => boolean;
}

interface PrecreateFormState {
	orgName: string;
	parentOrgId?: string;
	childOrgIds: string[];
}

interface PrecreateFormErrors {
	orgName?: string;
	parentOrgId?: string;
	childOrgIds?: string;
	sourceOrgId?: string;
}

type TreeNode = DataNode & {
	id?: string;
	key?: React.Key;
	value?: string;
	title?: React.ReactNode;
	children?: TreeNode[];
};

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

// const FORM_ROW_CENTER_STYLE: React.CSSProperties = {
// 	...FORM_ROW_STYLE,
// 	alignItems: "center",
// };

const FORM_LABEL_STYLE: React.CSSProperties = {
	width: 88,
	minWidth: 88,
	paddingTop: 5,
	fontSize: 14,
	lineHeight: "22px",
	color: "#606266",
	textAlign: "right",
};

// const FORM_LABEL_CENTER_STYLE: React.CSSProperties = {
// 	...FORM_LABEL_STYLE,
// 	paddingTop: 0,
// 	lineHeight: "32px",
// };

const SECTION_BLOCK_STYLE: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 18,
};

function normalizeOrgName(name: string | undefined) {
	return String(name ?? "").trim();
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

function createInitialFormState(
	sourceOrg: OrgAdjustmentTaskOrgItem | undefined,
): PrecreateFormState {
	return {
		orgName: "",
		parentOrgId: sourceOrg?.parentOrgId ? String(sourceOrg.parentOrgId) : undefined,
		childOrgIds: [],
	};
}

export const PrecreateOrganizationDrawer: React.FC<PrecreateOrganizationDrawerProps> = ({
	open,
	onClose,
	sourceOrgId,
	orgList,
	orgTree,
	onConfirmSplit,
}) => {
	const [formState, setFormState] = useState<PrecreateFormState>(
		createInitialFormState(undefined),
	);
	const [errors, setErrors] = useState<PrecreateFormErrors>({});

	const orgMap = useMemo(
		() => new Map(orgList.map((item) => [String(item.orgId), item])),
		[orgList],
	);
	const sourceOrg = useMemo(
		() => (sourceOrgId ? orgMap.get(sourceOrgId) : undefined),
		[orgMap, sourceOrgId],
	);
	const nonLeafTreeData = useMemo(
		() => buildSelectableNonLeafTree(orgTree as TreeNode[]),
		[orgTree],
	);
	const sourceChildOptions = useMemo(
		() =>
			orgList
				.filter((item) => String(item.parentOrgId) === String(sourceOrgId ?? ""))
				.map((item) => ({ label: item.orgName, value: String(item.orgId) })),
		[orgList, sourceOrgId],
	);

	useEffect(() => {
		if (!open) {
			return;
		}

		setFormState(createInitialFormState(sourceOrg));
		setErrors({});
	}, [open, sourceOrg]);

	useEffect(() => {
		const validChildIds = new Set(sourceChildOptions.map((item) => item.value));
		setFormState((prev) => {
			const nextChildOrgIds = prev.childOrgIds.filter((childId) =>
				validChildIds.has(childId),
			);
			if (nextChildOrgIds.length === prev.childOrgIds.length) {
				return prev;
			}

			return {
				...prev,
				childOrgIds: nextChildOrgIds,
			};
		});
	}, [sourceChildOptions]);

	const updateFormState = <K extends keyof PrecreateFormState>(
		key: K,
		value: PrecreateFormState[K],
	) => {
		setFormState((prev) => ({ ...prev, [key]: value }));
		setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const validate = () => {
		const nextErrors: PrecreateFormErrors = {};
		const normalizedName = normalizeOrgName(formState.orgName);

		if (!sourceOrgId || !sourceOrg) {
			nextErrors.sourceOrgId = "请选择待拆分的组织";
		}

		if (!normalizedName) {
			nextErrors.orgName = "请输入组织名称";
		}

		if (!formState.parentOrgId) {
			nextErrors.parentOrgId = "请选择上级组织";
		}

		if (formState.parentOrgId && normalizedName) {
			const duplicatedSibling = orgList.some(
				(item) =>
					String(item.parentOrgId ?? "") === formState.parentOrgId &&
					normalizeOrgName(item.orgName) === normalizedName,
			);
			if (duplicatedSibling) {
				nextErrors.orgName = "同一上级组织下已存在同名组织";
			}
		}

		if (!formState.childOrgIds.length) {
			nextErrors.childOrgIds = "请选择下级组织";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleConfirm = () => {
		if (!validate() || !sourceOrgId || !sourceOrg) {
			return;
		}

		const confirmed = onConfirmSplit({
			sourceOrgId,
			targets: [
				{
					key: `existing-${sourceOrgId}`,
					mode: "existing",
					existingOrgId: sourceOrgId,
					orgName: sourceOrg.orgName,
					parentOrgId: sourceOrg.parentOrgId ? String(sourceOrg.parentOrgId) : undefined,
					childOrgIds: [],
				},
				{
					key: `precreate-${sourceOrgId}`,
					mode: "precreate",
					orgName: normalizeOrgName(formState.orgName),
					parentOrgId: formState.parentOrgId,
					childOrgIds: formState.childOrgIds,
				},
			],
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
			title="预创建组织"
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
					<div style={SECTION_TITLE_STYLE}>预创建组织设置</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							组织名称
						</div>
						<div className="flex-1">
							<Input
								placeholder="请输入组织名称"
								value={formState.orgName}
								onChange={(event) => updateFormState("orgName", event.target.value)}
							/>
							{errors.orgName ? (
								<div className="mt-1 text-xs text-[#F56C6C]">{errors.orgName}</div>
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
								className="w-full"
								value={formState.parentOrgId}
								treeData={nonLeafTreeData}
								placeholder="请选择上级组织"
								popupMatchSelectWidth={360}
								listHeight={320}
								onChange={(value) =>
									updateFormState(
										"parentOrgId",
										value ? String(value) : undefined,
									)
								}
							/>
							{errors.parentOrgId ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.parentOrgId}
								</div>
							) : null}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							下级组织
						</div>
						<div className="flex-1">
							<Select
								mode="multiple"
								className="w-full"
								allowClear
								placeholder="请选择下级组织"
								value={formState.childOrgIds}
								options={sourceChildOptions}
								onChange={(value) =>
									updateFormState(
										"childOrgIds",
										value.map((item) => String(item)),
									)
								}
							/>
							{errors.childOrgIds ? (
								<div className="mt-1 text-xs text-[#F56C6C]">
									{errors.childOrgIds}
								</div>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
};

export default PrecreateOrganizationDrawer;
