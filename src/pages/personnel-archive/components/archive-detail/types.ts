/**
 * 人员档案详情组件类型定义
 */

/**
 * 附件文件
 */
export interface AttachmentFile {
	/** 文件ID */
	id?: number | string;
	/** 文件名 */
	fileName: string;
	/** 新文件名 */
	newFileName?: string;
	/** 文件URL */
	url?: string;
	/** 原始文件名 */
	originalFilename: string;
}

/**
 * 附件表单项属性
 */
export interface AttachmentFormItemProps {
	/** 附件文件列表 */
	value?: AttachmentFile | AttachmentFile[];
	/** 值变化回调 */
	onChange?: (value: AttachmentFile[]) => void;
}

/**
 * 人员档案详情页面模式
 */
export type ArchiveDetailMode = "edit" | "readonly" | "audit" | "auditView";

/**
 * 人员档案详情组件属性
 */
export interface ArchiveDetailProps {
	/** 是否打开抽屉 */
	open: boolean;
	/** 用户ID */
	userId: string | number;
	/** 页面模式，默认为编辑模式 */
	mode?: ArchiveDetailMode;
	/** 维护人 */
	maintainer?: string;
	/** 是否用于更新，默认为 true */
	forUpdate?: boolean;
	/** 审核人ID（审核模式使用） */
	approver?: number;
	/** 关闭回调 */
	onClose?: () => void;
	/** 刷新回调 */
	onRefresh?: () => void;
}
