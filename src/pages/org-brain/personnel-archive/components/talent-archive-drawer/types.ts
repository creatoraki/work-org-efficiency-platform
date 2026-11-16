/**
 * 人员档案类型定义
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type {
	PersonnelArchiveTagItem,
	TalentArchiveAssessmentItem,
	TalentArchiveBasicInfo,
	TalentArchiveCompanyHistoryItem,
	TalentArchiveEducationItem,
	TalentArchiveTrainingItem,
} from "#src/api/org-brain/personnel-archive";

/**
 * 人才档案视图数据及分区加载状态。
 *
 * @author 王善能
 * @since 2026-07-15
 */
export interface TalentArchiveViewData {
	/** 基本信息，供头部和个人信息区块共用 */
	basicInfo: TalentArchiveBasicInfo | undefined;
	/** 人员档案详情是否加载中 */
	detailLoading: boolean;
	/** 人员档案详情是否加载失败 */
	detailError: boolean;
	/** 重新加载人员档案详情 */
	retryDetail: () => void;
	/** 标签列表 */
	tags: PersonnelArchiveTagItem[];
	/** 标签列表是否加载中 */
	tagsLoading: boolean;
	/** 标签列表是否加载失败且无缓存数据 */
	tagsLoadFailed: boolean;
	/** 重新加载标签列表 */
	retryTags: () => void;
	/** 公司经历列表 */
	companyHistory: TalentArchiveCompanyHistoryItem[];
	/** 公司经历是否加载中 */
	companyHistoryLoading: boolean;
	/** 公司经历是否加载失败且无缓存数据 */
	companyHistoryLoadFailed: boolean;
	/** 重新加载公司经历 */
	retryCompanyHistory: () => void;
	/** 考核绩效列表 */
	assessments: TalentArchiveAssessmentItem[];
	/** 教育经历列表 */
	educations: TalentArchiveEducationItem[];
	/** 培训经历列表 */
	trainings: TalentArchiveTrainingItem[];
}

/**
 * 人员档案抽屉属性接口
 *
 * @author 王善能
 * @date 2026-04-16
 */
export interface TalentArchiveDrawerProps {
	/** 当前查看人员用户ID */
	userId: string;
	/** 当前候选人的匹配度 */
	matchRate?: number;
	/** 是否显示候选人模式标识 */
	isCandidateMode?: boolean;
	/** 是否当前候选人 */
	isCurrent?: boolean;
	/** 是否打开 */
	open: boolean;
	/** 当前序号 */
	currentIndex?: number;
	/** 总数 */
	totalCount?: number;
	/** 是否可切到上一个 */
	canPrevious?: boolean;
	/** 是否可切到下一个 */
	canNext?: boolean;
	/** 切到上一个 */
	onPrevious?: () => void;
	/** 切到下一个 */
	onNext?: () => void;
	/** 关闭回调 */
	onClose: () => void;
}
