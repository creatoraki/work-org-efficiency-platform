import type { OrgAdjustmentTaskOrgItem } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { AdjustmentOperationType } from "../types";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Button, Drawer, Input, Table, TreeSelect } from "antd";
import React, { useEffect, useMemo, useState } from "react";

type MoveTreeNode = DataNode & {
	id?: string;
	key?: React.Key;
	value?: string;
	title?: React.ReactNode;
	nodeLevel?: number;
	treeLevel?: number;
	children?: MoveTreeNode[];
};

interface TreeLevelMeta {
	treeLevel: number;
	parentOrgId?: string;
	title: string;
}

interface MoveOrganizationDrawerProps {
	open: boolean;
	onClose: () => void;
	operationType: AdjustmentOperationType;
	selectedOrgIds: string[];
	orgList: OrgAdjustmentTaskOrgItem[];
	orgTree: DataNode[];
	visibleNodeIds: string[];
	onConfirmMoves: (moves: Array<{ sourceId: string; targetId: string }>) => boolean;
}

interface MoveRow {
	key: string;
	orgId?: string;
	targetOrgId?: string;
}

interface MoveRowError {
	orgId?: string;
	targetOrgId?: string;
}

const SECTION_TITLE_STYLE: React.CSSProperties = {
	paddingLeft: 10,
	borderLeft: "3px solid rgba(0, 117, 255, 1)",
	fontSize: 14,
	fontWeight: 600,
	lineHeight: "20px",
	color: "#303133",
};

function collectTreeLevelMeta(
	nodes: MoveTreeNode[],
	level = 1,
	result = new Map<string, TreeLevelMeta>(),
) {
	nodes.forEach((node) => {
		const nodeId = String(node.id || node.value || node.key);
		result.set(nodeId, {
			treeLevel: Number(node.treeLevel ?? level),
			parentOrgId: (node as any).parentOrgId ? String((node as any).parentOrgId) : undefined,
			title: String(node.title ?? ""),
		});
		if (Array.isArray(node.children)) {
			collectTreeLevelMeta(node.children, level + 1, result);
		}
	});
	return result;
}

function createRow(orgId?: string): MoveRow {
	return {
		key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		orgId,
		targetOrgId: undefined,
	};
}

function collectDescendantIds(orgList: OrgAdjustmentTaskOrgItem[], rootId: string) {
	const childrenMap = new Map<string, string[]>();
	orgList.forEach((item) => {
		const parentId = item.parentOrgId ? String(item.parentOrgId) : "";
		if (!childrenMap.has(parentId)) {
			childrenMap.set(parentId, []);
		}
		childrenMap.get(parentId)!.push(String(item.orgId));
	});

	const result = new Set<string>();
	const queue = [rootId];
	while (queue.length) {
		const currentId = queue.shift()!;
		result.add(currentId);
		(childrenMap.get(currentId) ?? []).forEach((childId) => {
			if (!result.has(childId)) {
				queue.push(childId);
			}
		});
	}

	return result;
}

function cloneTreeWithDisabledState(
	nodes: MoveTreeNode[],
	treeLevelMetaMap: Map<string, TreeLevelMeta>,
	disabledIds: Set<string>,
): MoveTreeNode[] {
	return nodes.map((node) => {
		const nodeId = String(node.id || node.value || node.key);
		const treeMeta = treeLevelMetaMap.get(nodeId);
		const currentLevel = Number(node.treeLevel ?? treeMeta?.treeLevel ?? 0);
		const disabledByHierarchy = disabledIds.has(nodeId);
		const children = Array.isArray(node.children)
			? cloneTreeWithDisabledState(node.children, treeLevelMetaMap, disabledIds)
			: undefined;

		return {
			...node,
			value: String(node.value ?? nodeId),
			disabled: disabledByHierarchy,
			selectable: !disabledByHierarchy,
			title: String(node.title ?? ""),
			treeLevel: currentLevel,
			children,
		};
	});
}

function filterTreeByVisibleIds(
	nodes: MoveTreeNode[],
	visibleNodeIdSet: Set<string>,
): MoveTreeNode[] {
	return nodes.reduce<MoveTreeNode[]>((result, node) => {
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

export const MoveOrganizationDrawer: React.FC<MoveOrganizationDrawerProps> = ({
	open,
	onClose,
	// operationType,
	selectedOrgIds,
	orgList,
	orgTree,
	visibleNodeIds,
	onConfirmMoves,
}) => {
	const [rows, setRows] = useState<MoveRow[]>([]);
	const [errors, setErrors] = useState<Record<string, MoveRowError>>({});

	const orgMap = useMemo(
		() => new Map(orgList.map((item) => [String(item.orgId), item])),
		[orgList],
	);
	const visibleNodeIdSet = useMemo(() => new Set(visibleNodeIds.map(String)), [visibleNodeIds]);
	const visibleOrgTree = useMemo(
		() => filterTreeByVisibleIds(orgTree as MoveTreeNode[], visibleNodeIdSet),
		[orgTree, visibleNodeIdSet],
	);
	const treeLevelMetaMap = useMemo(() => collectTreeLevelMeta(visibleOrgTree), [visibleOrgTree]);

	useEffect(() => {
		if (!open) {
			return;
		}

		const uniqueSelectedIds = Array.from(new Set(selectedOrgIds));
		setRows(
			uniqueSelectedIds.length
				? uniqueSelectedIds.map((orgId) => createRow(orgId))
				: [createRow()],
		);
		setErrors({});
	}, [open, selectedOrgIds, visibleOrgTree, orgList.length, treeLevelMetaMap]);

	const updateRow = (rowKey: string, patch: Partial<MoveRow>) => {
		setRows((prev) => prev.map((row) => (row.key === rowKey ? { ...row, ...patch } : row)));
		setErrors((prev) => ({
			...prev,
			[rowKey]: {
				...prev[rowKey],
				...(patch.orgId !== undefined ? { orgId: undefined } : null),
				...(patch.targetOrgId !== undefined ? { targetOrgId: undefined } : null),
			},
		}));
	};

	const removeRow = (rowKey: string) => {
		setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== rowKey) : prev));
		setErrors((prev) => {
			const next = { ...prev };
			delete next[rowKey];
			return next;
		});
	};

	const addRow = () => {
		setRows((prev) => [...prev, createRow()]);
	};

	const validateRows = () => {
		const nextErrors: Record<string, MoveRowError> = {};
		rows.forEach((row) => {
			const rowError: MoveRowError = {};
			if (!row.orgId) {
				rowError.orgId = "请选择组织";
			}
			if (!row.targetOrgId) {
				rowError.targetOrgId = "请选择平移至该组织下方";
			}
			if (rowError.orgId || rowError.targetOrgId) {
				nextErrors[row.key] = rowError;
			}
		});
		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleConfirm = () => {
		if (!validateRows()) {
			return;
		}

		const moves = rows
			.filter((row): row is MoveRow & { orgId: string; targetOrgId: string } =>
				Boolean(row.orgId && row.targetOrgId),
			)
			.map((row) => ({
				sourceId: row.orgId,
				targetId: row.targetOrgId,
			}));

		if (onConfirmMoves(moves)) {
			onClose();
		}
	};

	const columns = [
		{
			title: "序号",
			dataIndex: "index",
			width: 60,
			render: (_: unknown, _record: MoveRow, index: number) => index + 1,
		},
		{
			title: (
				<span>
					<span style={{ color: "#F56C6C" }}>*</span>
					组织名称
				</span>
			),
			dataIndex: "orgId",
			width: 250,
			render: (value: string | undefined, record: MoveRow) => (
				<div>
					<TreeSelect
						value={value}
						placeholder="请选择组织"
						style={{ width: "100%" }}
						treeData={visibleOrgTree}
						fieldNames={{ label: "title", value: "value", children: "children" }}
						popupMatchSelectWidth={320}
						showSearch
						allowClear
						treeDefaultExpandAll={false}
						treeNodeFilterProp="title"
						onChange={(nextOrgId) =>
							updateRow(record.key, {
								orgId: nextOrgId ? String(nextOrgId) : undefined,
								targetOrgId: undefined,
							})
						}
						filterTreeNode={(input, node) =>
							String(node.title || "")
								.toLowerCase()
								.includes(input.toLowerCase())
						}
					/>
					{errors[record.key]?.orgId ? (
						<div className="mt-1 text-xs text-[#F56C6C]">
							{errors[record.key]?.orgId}
						</div>
					) : null}
				</div>
			),
		},
		{
			title: "上级组织",
			dataIndex: "parentOrgName",
			width: 180,
			render: (_: unknown, record: MoveRow) => {
				const currentOrg = record.orgId ? orgMap.get(record.orgId) : undefined;
				const parentOrg = currentOrg?.parentOrgId
					? orgMap.get(String(currentOrg.parentOrgId))
					: undefined;
				return <Input value={parentOrg?.orgName || ""} placeholder="自动带出" disabled />;
			},
		},
		{
			title: (
				<span>
					<span style={{ color: "#F56C6C" }}>*</span>
					平移至该组织下方
				</span>
			),
			dataIndex: "targetOrgId",
			width: 260,
			render: (value: string | undefined, record: MoveRow) => {
				const currentOrg = record.orgId ? orgMap.get(record.orgId) : undefined;
				const disabledIds = currentOrg
					? collectDescendantIds(orgList, String(currentOrg.orgId))
					: new Set<string>();
				const treeData = cloneTreeWithDisabledState(
					visibleOrgTree,
					treeLevelMetaMap,
					disabledIds,
				);

				return (
					<div>
						<TreeSelect
							value={value}
							placeholder="请选择平移至该组织下方"
							style={{ width: "100%" }}
							treeData={treeData}
							fieldNames={{ label: "title", value: "value", children: "children" }}
							popupMatchSelectWidth={320}
							showSearch
							allowClear
							treeDefaultExpandAll={false}
							treeNodeFilterProp="title"
							onChange={(nextTargetOrgId) => {
								if (!nextTargetOrgId) {
									updateRow(record.key, { targetOrgId: undefined });
									return;
								}

								updateRow(record.key, { targetOrgId: String(nextTargetOrgId) });
							}}
							filterTreeNode={(input, node) =>
								String(node.title || "")
									.toLowerCase()
									.includes(input.toLowerCase())
							}
						/>
						{errors[record.key]?.targetOrgId ? (
							<div className="mt-1 text-xs text-[#F56C6C]">
								{errors[record.key]?.targetOrgId}
							</div>
						) : null}
					</div>
				);
			},
		},
		{
			title: "操作",
			dataIndex: "action",
			width: 80,
			render: (_: unknown, record: MoveRow) => (
				<Button
					type="text"
					className="text-[#0075FF]"
					onClick={() => removeRow(record.key)}
				>
					删除
				</Button>
			),
		},
	];

	return (
		<Drawer
			placement="right"
			width={900}
			open={open}
			destroyOnHidden
			title="平移组织"
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
			<div className="flex h-full gap-6">
				<div className="min-w-0 flex-1">
					<div style={SECTION_TITLE_STYLE}>选择组织</div>
					<div className="mt-4 rounded-md border border-[#EBEEF5] bg-white">
						<Table<MoveRow>
							rowKey="key"
							columns={columns}
							dataSource={rows}
							pagination={false}
							size="small"
							scroll={{ x: 830 }}
							bordered
						/>
						<div className="px-4 py-3">
							<Button type="text" className="text-sm text-[#0075FF]" onClick={addRow}>
								+ 新增
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Drawer>
	);
};

export default MoveOrganizationDrawer;
