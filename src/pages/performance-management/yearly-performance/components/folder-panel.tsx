import type { YearlyReportFolder } from "#src/api/performance-management/yearly-performance";

import {
	YEARLY_REPORT_FOLDER_ALL,
	YEARLY_REPORT_FOLDER_UNFILED,
} from "#src/api/performance-management/yearly-performance";
import { useDroppable } from "@dnd-kit/core";
import { Input, Tooltip } from "antd";
import { Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { TreeRow } from "./tree-row";

/** 文件夹放置目标 ID 前缀（与人员卡片的排序 ID 区分） */
export const FOLDER_DROP_PREFIX = "folder:";

interface FolderPanelProps {
	/** 「全部」人数 */
	totalCount: number;
	/** 「未归入文件夹」人数 */
	unfiledCount: number;
	/** 文件夹 */
	folders: YearlyReportFolder[];
	/** 选中文件夹 */
	selectedFolderId: string;
	/** 文件夹关键字 */
	keyword: string;
	/** 关键字变更 */
	onKeywordChange: (keyword: string) => void;
	/** 选中文件夹变更 */
	onSelect: (folderId: string) => void;
	/** 新增 */
	onCreate: () => void;
	/** 重命名 */
	onRename: (folder: YearlyReportFolder) => void;
	/** 删除 */
	onDelete: (folder: YearlyReportFolder) => void;
}

interface FolderRowProps {
	/** 文件夹 */
	folder: YearlyReportFolder;
	/** 是否选中 */
	selected: boolean;
	/** 选中 */
	onSelect: (folderId: string) => void;
	/** 重命名 */
	onRename: (folder: YearlyReportFolder) => void;
	/** 删除 */
	onDelete: (folder: YearlyReportFolder) => void;
}

/** 悬浮操作图标样式：16px #909399，悬浮主色 */
const ACTION_ICON_CLASS =
	"size-4 cursor-pointer text-[#909399] outline-none transition-colors hover:text-[#0075FF]";

/**
 * 文件夹行：可作为人员卡片的拖拽放置目标；悬浮时人数替换为「编辑 / 删除」图标（带文字提示）
 *
 * @param props - 组件属性
 * @param props.folder - 文件夹
 * @param props.selected - 是否选中
 * @param props.onSelect - 选中文件夹变更
 * @param props.onRename - 重命名
 * @param props.onDelete - 删除
 * @returns 文件夹行
 */
function FolderRow({ folder, selected, onSelect, onRename, onDelete }: FolderRowProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: `${FOLDER_DROP_PREFIX}${folder.folderId}`,
		data: { type: "folder", folderId: folder.folderId },
	});
	return (
		<div ref={setNodeRef}>
			<TreeRow
				level={1}
				title={folder.folderName}
				count={folder.headCount}
				selected={selected}
				showSwitcher
				dropActive={isOver}
				onClick={() => onSelect(folder.folderId)}
				hoverActions={
					<>
						<Tooltip title="编辑">
							<Pencil
								className={ACTION_ICON_CLASS}
								strokeWidth={1.5}
								onClick={(event) => {
									event.stopPropagation();
									onRename(folder);
								}}
							/>
						</Tooltip>
						<Tooltip title="删除">
							<Trash2
								className={ACTION_ICON_CLASS}
								strokeWidth={1.5}
								onClick={(event) => {
									event.stopPropagation();
									onDelete(folder);
								}}
							/>
						</Tooltip>
					</>
				}
			/>
		</div>
	);
}

/**
 * 文件夹面板
 *
 * 「全部」为根，固定子项「未归入文件夹」，其后为当前组织范围内的文件夹（文件夹即一场述职会）。
 * 文件夹名称右侧展示人数；拖拽人员卡片到文件夹上即归入该文件夹。
 *
 * @param props - 组件属性
 * @param props.totalCount - 「全部」人数
 * @param props.unfiledCount - 「未归入文件夹」人数
 * @param props.folders - 文件夹
 * @param props.selectedFolderId - 选中文件夹
 * @param props.keyword - 文件夹关键字
 * @param props.onKeywordChange - 关键字变更
 * @param props.onSelect - 选中文件夹变更
 * @param props.onCreate - 新增
 * @param props.onRename - 重命名
 * @param props.onDelete - 删除
 * @returns 文件夹面板
 *
 * @since 2026-11-16
 */
export function FolderPanel({
	totalCount,
	unfiledCount,
	folders,
	selectedFolderId,
	keyword,
	onKeywordChange,
	onSelect,
	onCreate,
	onRename,
	onDelete,
}: FolderPanelProps) {
	const [expanded, setExpanded] = useState(true);
	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col">
			<div className="flex h-[22px] items-center justify-between text-sm leading-[22px]">
				<span className="font-semibold text-[#323233]">文件夹</span>
				<button
					type="button"
					className="cursor-pointer border-none bg-transparent p-0 text-sm text-[#0075FF] hover:opacity-80"
					onClick={onCreate}
				>
					新增
				</button>
			</div>
			<Input
				className="mt-2 shrink-0"
				placeholder="搜索文件夹"
				allowClear
				value={keyword}
				onChange={(event) => onKeywordChange(event.target.value)}
				suffix={<Search className="size-3.5 text-[#909399]" strokeWidth={1.75} />}
			/>
			<div className="mt-1 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
				<TreeRow
					level={0}
					title="全部"
					count={totalCount}
					selected={selectedFolderId === YEARLY_REPORT_FOLDER_ALL}
					showSwitcher
					expanded={expanded}
					onToggle={() => setExpanded((prev) => !prev)}
					onClick={() => onSelect(YEARLY_REPORT_FOLDER_ALL)}
				/>
				{expanded ? (
					<>
						<TreeRow
							level={1}
							title="未归入文件夹"
							count={unfiledCount}
							selected={selectedFolderId === YEARLY_REPORT_FOLDER_UNFILED}
							showSwitcher
							onClick={() => onSelect(YEARLY_REPORT_FOLDER_UNFILED)}
						/>
						{folders.map((folder) => (
							<FolderRow
								key={folder.folderId}
								folder={folder}
								selected={selectedFolderId === folder.folderId}
								onSelect={onSelect}
								onRename={onRename}
								onDelete={onDelete}
							/>
						))}
					</>
				) : null}
			</div>
		</div>
	);
}
