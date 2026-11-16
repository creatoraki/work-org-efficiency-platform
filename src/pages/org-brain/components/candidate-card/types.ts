import type { OrgBrainCandidateItem } from "#src/api/org-brain/candidate";

/**
 * 候选人卡片属性接口
 */
export interface CandidateCardProps<T extends OrgBrainCandidateItem = OrgBrainCandidateItem> {
	// 候选人数据
	candidate: T;
	// 是否处于选中态
	isSelected?: boolean;
	// 是否使用紧凑布局
	compact?: boolean;
	// 是否只读
	readonly?: boolean;
	// 展示序号，未传时退回候选人自身推荐序号
	displayRank?: number;
	// 点击卡片回调
	onClick?: (candidate: T) => void;
	// 查看档案回调
	onViewArchive?: (candidate: T) => void;
}
