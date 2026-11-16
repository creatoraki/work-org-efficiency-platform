import type { ArchiveDetailMode } from "#src/pages/personnel-archive/components/archive-detail";
import type { ArchiveManagementItem } from "../types";
import ArchiveDetail from "#src/pages/personnel-archive/components/archive-detail";
import { getArchiveDetailQueryOptions } from "#src/pages/personnel-archive/components/archive-detail/hooks/useArchiveDetailQuery";
import { useQueryClient } from "@tanstack/react-query";
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from "react";

/**
 * 档案详情视图状态。
 */
interface ArchiveDetailViewState {
	/** 用户 ID */
	userId: number | string;
	/** 详情模式 */
	mode: ArchiveDetailMode;
	/** 维护人 */
	maintainer?: string;
	/** 是否用于更新 */
	forUpdate?: boolean;
}

/**
 * 档案详情抽屉宿主组件暴露的命令式方法。
 */
export interface ArchiveDetailDrawerHostRef {
	/**
	 * 预取编辑档案详情。
	 *
	 * @param record - 档案管理列表行数据
	 */
	prefetchEdit: (record: ArchiveManagementItem) => void;
	/**
	 * 预取查看详情数据。
	 *
	 * @param record - 档案管理列表行数据
	 */
	prefetchReadonly: (record: ArchiveManagementItem) => void;
	/**
	 * 打开编辑档案抽屉。
	 *
	 * @param record - 档案管理列表行数据
	 */
	openEdit: (record: ArchiveManagementItem) => void;
	/**
	 * 打开查看详情抽屉。
	 *
	 * @param record - 档案管理列表行数据
	 */
	openReadonly: (record: ArchiveManagementItem) => void;
}

/**
 * 档案详情抽屉宿主组件属性。
 */
interface ArchiveDetailDrawerHostProps {
	/**
	 * 详情保存或提交后的列表刷新回调。
	 */
	onRefresh: () => void;
}

/**
 * 档案详情抽屉宿主。
 *
 * 将抽屉状态隔离在列表页之外，避免点击“编辑档案/查看详情”时触发 BasicTable 与查询表单整体重渲染。
 * 打开时同步更新轻量视图状态，并提前预取详情数据；重内容的延迟挂载由 ArchiveDetail 内部统一控制。
 *
 * @param props - 组件属性
 * @param props.onRefresh - 详情操作成功后的列表刷新回调
 * @param ref - 暴露给列表操作列的打开抽屉方法
 * @returns 档案详情抽屉元素
 */
const ArchiveDetailDrawerHost = memo(
	forwardRef<ArchiveDetailDrawerHostRef, ArchiveDetailDrawerHostProps>(({ onRefresh }, ref) => {
		const queryClient = useQueryClient();
		const [archiveDetailView, setArchiveDetailView] = useState<ArchiveDetailViewState | null>(
			null,
		);
		const [isDrawerOpen, setIsDrawerOpen] = useState(false);

		/**
		 * 预取档案详情数据。
		 *
		 * @param view - 档案详情视图参数
		 */
		const prefetchArchiveDetail = useCallback(
			(view: ArchiveDetailViewState) => {
				void queryClient.prefetchQuery(getArchiveDetailQueryOptions(view));
			},
			[queryClient],
		);

		/**
		 * 打开档案详情抽屉。
		 *
		 * @param view - 档案详情视图参数
		 */
		const openArchiveDetail = useCallback(
			(view: ArchiveDetailViewState) => {
				prefetchArchiveDetail(view);
				setArchiveDetailView(view);
				setIsDrawerOpen(true);
			},
			[prefetchArchiveDetail],
		);

		useImperativeHandle(
			ref,
			() => ({
				prefetchEdit: (record: ArchiveManagementItem) => {
					prefetchArchiveDetail({
						userId: record.id,
						mode: "edit",
						maintainer: record.maintainer,
					});
				},
				prefetchReadonly: (record: ArchiveManagementItem) => {
					prefetchArchiveDetail({
						userId: record.id,
						mode: "readonly",
						maintainer: record.maintainer,
						forUpdate: false,
					});
				},
				openEdit: (record: ArchiveManagementItem) => {
					openArchiveDetail({
						userId: record.id,
						mode: "edit",
						maintainer: record.maintainer,
					});
				},
				openReadonly: (record: ArchiveManagementItem) => {
					openArchiveDetail({
						userId: record.id,
						mode: "readonly",
						maintainer: record.maintainer,
						forUpdate: false,
					});
				},
			}),
			[openArchiveDetail, prefetchArchiveDetail],
		);

		/**
		 * 关闭档案详情抽屉。
		 */
		const handleCloseArchiveDetail = useCallback(() => {
			setIsDrawerOpen(false);
		}, []);

		return (
			<ArchiveDetail
				open={isDrawerOpen}
				userId={archiveDetailView?.userId || ""}
				mode={archiveDetailView?.mode || "edit"}
				maintainer={archiveDetailView?.maintainer}
				forUpdate={archiveDetailView?.forUpdate}
				onClose={handleCloseArchiveDetail}
				onRefresh={onRefresh}
			/>
		);
	}),
);
ArchiveDetailDrawerHost.displayName = "ArchiveDetailDrawerHost";

export default ArchiveDetailDrawerHost;
