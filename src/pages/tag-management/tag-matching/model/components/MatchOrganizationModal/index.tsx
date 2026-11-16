import type { MatchOrganizationModalProps } from "./types";
import { message, Modal } from "antd";
import React from "react";
import { QuickFilterPanel } from "./components/QuickFilterPanel";
import { SelectedListPanel } from "./components/SelectedListPanel";
import { TreePanel } from "./components/TreePanel";
import { useMatchOrganization } from "./hooks/useMatchOrganization";

/**
 * 匹配组织选择弹窗组件
 *
 * 功能特性：
 * 1. 三列布局：左侧层级筛选、中间树形结构（带搜索）、右侧已选节点
 * 2. 双向联动：左侧层级筛选 ↔ 中间树节点勾选
 * 3. 支持搜索：实时过滤树节点，自动展开匹配节点的父节点
 * 4. 支持回显：通过 initialSelectedOrgId 和 initialSelectedOrgLevel 回显选中状态
 * 5. 自定义提交：支持通过 customSubmit 自定义提交逻辑
 *
 * @example
 * ```tsx
 * <MatchOrganizationModal
 *   open={isModalOpen}
 *   title="选择组织"
 *   treeData={orgTreeData}
 *   treeLoading={loading}
 *   initialSelectedOrgId="1,2,3"
 *   initialSelectedOrgLevel="GROUP,FIRST"
 *   onClose={(result) => {
 *     if (result?.saved) {
 *       console.log('选中的节点:', result.selected);
 *     }
 *   }}
 * />
 * ```
 */
export default function MatchOrganizationModal({
	open,
	title = "匹配组织",
	treeData: externalTreeData,
	treeLoading: externalTreeLoading = false,
	initialSelectedOrgId,
	initialSelectedOrgLevel,
	onClose,
	customSubmit,
}: MatchOrganizationModalProps) {
	const {
		checkedKeys,
		setCheckedKeys,
		checkedNodes,
		expandedKeys,
		autoExpandParent,
		quickFilter,
		setQuickFilter,
		treeData,
		displayTreeData,
		quickFilterOptions,
		handleQuickFilterChange,
		handleTreeCheck,
		handleRemove,
		handleSearch,
		handleExpand,
		titleRender,
	} = useMatchOrganization(open, externalTreeData, initialSelectedOrgId, initialSelectedOrgLevel);

	const [confirmLoading, setConfirmLoading] = React.useState(false);

	/**
	 * 确认提交处理
	 */
	const handleOk = async () => {
		if (quickFilter.length === 0) {
			message.warning("请至少选择一个组织层级");
			return;
		}

		if (checkedNodes.length === 0) {
			message.warning("请至少选择一个组织节点");
			return;
		}

		setConfirmLoading(true);
		try {
			const orgLevel = quickFilter.length > 0 ? quickFilter.join(",") : "";
			const orgId = checkedNodes.map((node) => String(node.id || node.key)).join(",");

			if (customSubmit) {
				const success = await customSubmit(checkedNodes);
				if (success) {
					onClose({
						saved: true,
						selected: checkedNodes,
						orgLevel,
						orgId,
					});
				}
			} else {
				onClose({
					saved: true,
					selected: checkedNodes,
					orgLevel,
					orgId,
				});
			}
		} catch (e) {
			console.error(e);
		} finally {
			setConfirmLoading(false);
		}
	};

	/**
	 * 取消按钮处理
	 */
	const handleCancel = () => {
		onClose();
	};

	return (
		<Modal
			title={title}
			open={open}
			onOk={handleOk}
			confirmLoading={confirmLoading}
			onCancel={handleCancel}
			width={900}
			centered
			destroyOnHidden
		>
			<div className="h-[500px]">
				<div className="flex h-full">
					<QuickFilterPanel
						quickFilterOptions={quickFilterOptions}
						quickFilter={quickFilter}
						onChange={handleQuickFilterChange}
					/>

					<div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200">
						<TreePanel
							loading={externalTreeLoading}
							treeData={treeData}
							displayTreeData={displayTreeData}
							checkedKeys={checkedKeys}
							expandedKeys={expandedKeys}
							autoExpandParent={autoExpandParent}
							onCheck={handleTreeCheck}
							onExpand={handleExpand}
							onSearch={handleSearch}
							titleRender={titleRender}
						/>

						<SelectedListPanel
							checkedNodes={checkedNodes}
							onRemove={handleRemove}
							onClear={() => {
								setCheckedKeys([]);
								setQuickFilter([]);
							}}
						/>
					</div>
				</div>
			</div>
		</Modal>
	);
}
