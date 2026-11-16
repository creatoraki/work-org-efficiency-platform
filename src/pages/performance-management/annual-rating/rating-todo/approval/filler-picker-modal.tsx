import type { ApprovalFillerCandidate } from "#src/api/performance-management/approval";

import { fetchApprovalFillerPickerData } from "#src/api/performance-management/approval";
import { SearchOutlined } from "@ant-design/icons";
import { Checkbox, Input, Modal, Tree } from "antd";
import { useEffect, useMemo, useState } from "react";

/**
 * 填报人选择器属性
 */
interface FillerPickerModalProps {
	/** 是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 确定回调 */
	onOk: (members: ApprovalFillerCandidate[]) => void;
}

/**
 * 填报人选择器
 *
 * 左侧组织树，右侧候选成员（复选）+ 已选成员卡片，底部取消 / 确定。
 *
 * @param props - 组件属性
 * @param props.open - 是否可见
 * @param props.onClose - 关闭回调
 * @param props.onOk - 确定回调
 * @returns 填报人选择器
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function FillerPickerModal({ open, onClose, onOk }: FillerPickerModalProps) {
	const [tree, setTree] = useState<Parameters<typeof toAntdTree>[0]>([]);
	const [candidates, setCandidates] = useState<ApprovalFillerCandidate[]>([]);
	const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
	const [selected, setSelected] = useState<ApprovalFillerCandidate[]>([]);
	const [keyword, setKeyword] = useState("");

	useEffect(() => {
		if (open) {
			fetchApprovalFillerPickerData().then((result) => {
				setTree(result.tree);
				setCandidates(result.candidates);
				setSelected(result.selected);
				setCheckedIds(new Set(result.selected.map((item) => item.id)));
				setKeyword("");
			});
		}
	}, [open]);

	const visibleCandidates = useMemo(
		() => candidates.filter((item) => !keyword || item.name.includes(keyword)),
		[candidates, keyword],
	);
	const selectableCandidates = visibleCandidates.filter((item) => !item.disabled);

	const toggleCandidate = (candidate: ApprovalFillerCandidate, checked: boolean) => {
		if (candidate.disabled && checked) return;
		setCheckedIds((current) => {
			const next = new Set(current);
			if (checked) next.add(candidate.id);
			else next.delete(candidate.id);
			return next;
		});
		if (checked) {
			setSelected((current) =>
				current.some((item) => item.id === candidate.id)
					? current
					: [...current, candidate],
			);
		} else {
			setSelected((current) => current.filter((item) => item.id !== candidate.id));
		}
	};

	return (
		<Modal
			centered
			open={open}
			onCancel={onClose}
			onOk={() => {
				onOk(selected);
				onClose();
			}}
			okText="确定"
			cancelText="取消"
			width={817}
			title="协作人"
			destroyOnHidden
		>
			<div className="flex gap-6">
				{/* 左侧组织树 */}
				<div className="flex h-[488px] w-[320px] shrink-0 flex-col rounded border border-[#EBEEF5] p-4">
					<Input
						allowClear
						placeholder="搜索名称"
						suffix={<SearchOutlined className="text-[#909399]" />}
						className="mb-3 h-8"
					/>
					<div className="min-h-0 flex-1 overflow-y-auto">
						<Tree
							defaultExpandAll
							treeData={toAntdTree(tree)}
							blockNode
							className="text-sm [&_.ant-tree-treenode]:min-h-[36px]"
						/>
					</div>
				</div>
				{/* 右侧成员选择 */}
				<div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded border border-[#EBEEF5] bg-white">
					<div className="flex h-8 shrink-0 items-center bg-[#F5F7FA] px-3 text-sm font-medium leading-[22px] text-[#323233]">
						添加成员
					</div>
					<div className="flex min-h-0 flex-1 gap-2 p-3.5">
						{/* 候选成员 */}
						<div className="flex w-[184px] shrink-0 flex-col">
							<Input
								allowClear
								placeholder="搜索姓名"
								suffix={<SearchOutlined className="text-[#909399]" />}
								className="mb-2 h-8"
								value={keyword}
								onChange={(e) => setKeyword(e.target.value)}
							/>
							<Checkbox
								className="mb-1 text-sm"
								checked={
									selectableCandidates.length > 0 &&
									selectableCandidates.every((item) => checkedIds.has(item.id))
								}
								indeterminate={
									selectableCandidates.some((item) => checkedIds.has(item.id)) &&
									!selectableCandidates.every((item) => checkedIds.has(item.id))
								}
								onChange={(e) => {
									selectableCandidates.forEach((item) =>
										toggleCandidate(item, e.target.checked),
									);
								}}
							>
								全选
							</Checkbox>
							<div className="min-h-0 flex-1 overflow-y-auto">
								{visibleCandidates.map((item) => (
									<div key={item.id} className="flex items-center py-1">
										<Checkbox
											disabled={item.disabled && !checkedIds.has(item.id)}
											checked={checkedIds.has(item.id)}
											onChange={(e) =>
												toggleCandidate(item, e.target.checked)
											}
										>
											<span className="text-sm leading-[22px] text-[#323233]">
												{item.name}
											</span>
										</Checkbox>
									</div>
								))}
							</div>
						</div>
						<span className="w-px self-stretch bg-[#EBEEF5]" aria-hidden="true" />
						{/* 已选成员 */}
						<div className="flex w-[192px] shrink-0 flex-col">
							<div className="mb-2 flex items-center justify-between">
								<span className="text-sm leading-[22px] text-[#323233]">
									已选({selected.length})
								</span>
								<button
									type="button"
									className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
									onClick={() => {
										setSelected([]);
										setCheckedIds(new Set());
									}}
								>
									清空
								</button>
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto">
								{selected.map((item) => (
									<div
										key={item.id}
										className="mb-2 flex items-start justify-between gap-2 rounded bg-[#F0F2F5] px-3 py-2"
									>
										<div className="min-w-0">
											<div className="text-sm leading-[22px] text-[#323233]">
												{item.name}
											</div>
											<div className="break-all text-xs leading-5 text-[#909399]">
												{item.path}
											</div>
										</div>
										<button
											type="button"
											aria-label={`移除${item.name}`}
											className="mt-1 shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[#909399]"
											onClick={() => toggleCandidate(item, false)}
										>
											×
										</button>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}

/**
 * 组织树转换为 antd Tree 数据
 *
 * @param nodes - 组织树
 * @returns antd Tree 节点
 */
function toAntdTree(
	nodes: Array<{ id: string; name: string; children?: unknown[] }>,
): Array<{ key: string; title: string; children?: ReturnType<typeof toAntdTree> }> {
	return nodes.map((node) => ({
		key: node.id,
		title: node.name,
		children: node.children ? toAntdTree(node.children as typeof nodes) : undefined,
	}));
}
