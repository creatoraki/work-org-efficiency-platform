/**
 * 人员档案详情底部操作栏。
 *
 * 负责根据编辑或审核模式渲染提交、暂存、通过、驳回按钮。
 * 将动作区从详情主组件中拆出，避免主组件继续累积模式分支和权限按钮依赖。
 */

import type { ArchiveSubmittingAction } from "./hooks/useArchiveActions";
import { BasicButton } from "#src/components";
import { PERSONNEL_ARCHIVE_PERMISSIONS } from "#src/pages/personnel-archive/config";

/**
 * 人员档案详情底部操作栏属性。
 */
interface ArchiveDetailActionBarProps {
	/** 是否为审核模式 */
	isAudit: boolean;
	/** 是否为编辑模式 */
	isEditMode: boolean;
	/** 已选标签数量 */
	selectedTagCount: number;
	/** 是否正在提交或审核 */
	isSubmitting: boolean;
	/** 当前正在执行的提交动作 */
	submittingAction: ArchiveSubmittingAction | null;
	/** 驳回处理 */
	onRefuse: () => void;
	/** 通过处理 */
	onPass: () => void;
	/** 暂存处理 */
	onSaveDraft: () => void;
	/** 提交审核处理 */
	onSubmit: () => void;
}

/**
 * 人员档案详情底部操作栏。
 *
 * @param props - 组件属性
 * @param props.isAudit - 是否为审核模式
 * @param props.isEditMode - 是否为编辑模式
 * @param props.selectedTagCount - 已选标签数量
 * @param props.isSubmitting - 是否正在提交或审核
 * @param props.submittingAction - 当前正在执行的提交动作
 * @param props.onRefuse - 驳回处理
 * @param props.onPass - 通过处理
 * @param props.onSaveDraft - 暂存处理
 * @param props.onSubmit - 提交审核处理
 * @returns 操作栏元素；非编辑/审核模式返回 null
 */
export function ArchiveDetailActionBar({
	isAudit,
	isEditMode,
	selectedTagCount,
	isSubmitting,
	submittingAction,
	onRefuse,
	onPass,
	onSaveDraft,
	onSubmit,
}: ArchiveDetailActionBarProps) {
	if (isAudit) {
		return (
			<div className="flex gap-2">
				<BasicButton
					onClick={onRefuse}
					disabled={selectedTagCount === 0 || isSubmitting}
					auth={PERSONNEL_ARCHIVE_PERMISSIONS.ARCHIVE_APPROVE}
				>
					驳回
				</BasicButton>
				<BasicButton
					type="primary"
					onClick={onPass}
					disabled={selectedTagCount === 0 || isSubmitting}
					loading={submittingAction === "pass"}
					auth={PERSONNEL_ARCHIVE_PERMISSIONS.ARCHIVE_APPROVE}
				>
					通过
				</BasicButton>
			</div>
		);
	}

	if (isEditMode) {
		return (
			<div className="flex gap-2">
				<BasicButton
					onClick={onSaveDraft}
					disabled={isSubmitting}
					loading={submittingAction === "saveDraft"}
				>
					暂存
				</BasicButton>
				<BasicButton
					type="primary"
					onClick={onSubmit}
					disabled={selectedTagCount === 0 || isSubmitting}
					loading={submittingAction === "submit"}
				>
					<span className="hidden lg:inline">将勾选标签提交审核</span>
					<span className="lg:hidden">提交审核</span>
				</BasicButton>
			</div>
		);
	}

	return null;
}
