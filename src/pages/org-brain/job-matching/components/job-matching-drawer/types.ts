/**
 * 人岗匹配抽屉类型定义
 */

import type { OrganizationTreeNode } from "#src/api/common";
import type { JobMatchCandidateItem } from "#src/api/org-brain/candidate";
import type { JobMatchingDetail, JobMatchingItem } from "#src/api/org-brain/job-matching";
import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { JobPostTreeSelectNode } from "./components/job-post-tree";

/**
 * 抽屉模式
 */
export type DrawerMode = "add" | "edit" | "view";

/**
 * 人岗匹配抽屉保存表单值。
 */
export interface JobMatchingDrawerSubmitValues {
	id?: string;
	taskName: string;
	orgCode: string;
	orgFullPath?: string;
	orgFullName?: string;
	jobId: string;
	jobName?: string;
	postId: string;
	postName?: string;
	postgradeId: string;
	postgradeName?: string;
	modelId: string;
	modelName?: string;
	modelSnapshot?: string;
	modelSnapshotHash?: string;
	refreshModelSnapshot?: boolean;
	candidateList?: JobMatchCandidateItem[];
	selectedCandidates?: JobMatchCandidateItem[];
	selectedCandidate?: JobMatchCandidateItem | null;
}

/**
 * 抽屉属性接口
 */
export interface JobMatchingDrawerProps {
	// 是否打开
	open: boolean;
	// 模式
	mode: DrawerMode;
	// 编辑时的任务ID，组件内部据此请求详情
	recordId?: string | null;
	// 列表行预览数据，用于详情接口返回前的首屏稳定展示
	initialPreviewData?: JobMatchingItem | null;
	// 首页已加载的组织树
	organizationTreeData?: OrganizationTreeNode | null;
	// 首页组织树是否仍在初始化
	organizationTreeLoading?: boolean;
	// 首页已加载的岗位-职位-职级树
	jobPositionTreeData?: JobPositionTreeNode[];
	// 首页已加工的岗位-职位-职级选择树
	jobPostTreeData?: JobPostTreeSelectNode[];
	// 首页已加工的岗位节点索引
	jobPostNodeMap?: Map<string, JobPostTreeSelectNode>;
	// 首页岗位-职位-职级树是否仍在初始化
	jobPositionTreeLoading?: boolean;
	detailReloadKey?: number;
	// 关闭回调
	onClose: () => void;
	// 详情加载完成后回传，供列表页人才档案等场景使用
	onDetailChange?: (detail: JobMatchingDetail | null) => void;
	// 保存回调
	onSave?: (values: JobMatchingDrawerSubmitValues) => void;
	// 查看档案回调，传递当前候选人与当前可切换候选人列表
	onViewArchive?: (candidate: JobMatchCandidateItem, candidates: JobMatchCandidateItem[]) => void;
}
