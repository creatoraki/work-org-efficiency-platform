import { YearlyReportStatus } from "#src/api/performance-management/yearly-performance";

/** React Query 缓存 key 前缀，变更类操作统一按前缀失效 */
export const YEARLY_PERFORMANCE_QUERY_KEY = "yearly-performance";

/** 设计稿主色（与年度评级模块一致，不跟随全局主题色） */
export const PRIMARY_COLOR = "#0075FF";

/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 20;

/** 左侧「组织架构 + 文件夹」面板默认宽度（设计稿 1920 宽下 497px（含 1px 描边）） */
export const SIDE_PANEL_DEFAULT_WIDTH = 497;

/** 左侧面板可拖拽的最小 / 最大宽度 */
export const SIDE_PANEL_MIN_WIDTH = 400;
export const SIDE_PANEL_MAX_WIDTH = 720;

/** 人员卡片最小宽度：1920 宽三列、详情展开两列、窄屏单列（见设计稿 01 / 04 / 18） */
export const PERSON_CARD_MIN_WIDTH = 360;

/** 主区域宽度小于该值时，筛选区切换为两列布局（设计稿 18 自适应） */
export const COMPACT_MAIN_WIDTH = 760;

/** 述职状态展示配置 */
export interface YearlyReportStatusMeta {
	/** 状态文案 */
	label: string;
	/** 主色：文字 / 图标 */
	color: string;
	/** 浅色背景：标签 / 图标底 */
	bgColor: string;
	/** 概览卡片说明文案 */
	description: string;
}

/** 述职状态 → 展示配置（颜色取自设计稿） */
export const YEARLY_REPORT_STATUS_META: Record<YearlyReportStatus, YearlyReportStatusMeta> = {
	[YearlyReportStatus.PENDING]: {
		label: "待述职",
		color: "#FF7D00",
		bgColor: "#FFEFE0",
		description: "请持续关注",
	},
	[YearlyReportStatus.IN_PROGRESS]: {
		label: "述职中",
		color: "#0075FF",
		bgColor: "#E4EFFF",
		description: "录音实时转写中",
	},
	[YearlyReportStatus.GENERATING]: {
		label: "报告生成中",
		color: "#A174F6",
		bgColor: "#F4EEFE",
		description: "T+1生成，完成后自动推送",
	},
	[YearlyReportStatus.READY]: {
		label: "报告已生成",
		color: "#14B968",
		bgColor: "#E3F7ED",
		description: "已推送参会人员",
	},
};

/** 概览卡片顺序 */
export const YEARLY_REPORT_STATUS_ORDER = [
	YearlyReportStatus.PENDING,
	YearlyReportStatus.IN_PROGRESS,
	YearlyReportStatus.GENERATING,
	YearlyReportStatus.READY,
] as const;

/** 述职状态下拉选项 */
export const YEARLY_REPORT_STATUS_OPTIONS = YEARLY_REPORT_STATUS_ORDER.map((status) => ({
	value: status,
	label: YEARLY_REPORT_STATUS_META[status].label,
}));

/** 详情三步流程 */
export enum DetailStep {
	/** 述职前 · 备课材料 */
	PREPARE = 0,
	/** 述职中 · 录音转写 */
	RECORDING = 1,
	/** 述职后 · 评分报告 */
	REPORT = 2,
}

/** 详情步骤标题 */
export const DETAIL_STEP_TITLES = ["述职前·备课材料", "述职中·录音转写", "述职后·评分报告"];

/**
 * 述职状态对应的当前步骤
 *
 * 待述职停在第 1 步；述职中停在第 2 步；报告生成中 / 已生成停在第 3 步。
 */
export const STATUS_CURRENT_STEP: Record<YearlyReportStatus, DetailStep> = {
	[YearlyReportStatus.PENDING]: DetailStep.PREPARE,
	[YearlyReportStatus.IN_PROGRESS]: DetailStep.RECORDING,
	[YearlyReportStatus.GENERATING]: DetailStep.REPORT,
	[YearlyReportStatus.READY]: DetailStep.REPORT,
};
