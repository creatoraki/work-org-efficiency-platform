import { AppraisalStatus } from "#src/api/performance-management/yearly-performance";

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

/** 人员卡片最小宽度：1920 宽三列、详情展开两列、窄屏单列（见设计稿 01 / 05 / 15） */
export const PERSON_CARD_MIN_WIDTH = 360;

/** 主区域宽度小于该值时，筛选区切换为两列布局（设计稿 15 自适应） */
export const COMPACT_MAIN_WIDTH = 760;

/** 组织树默认展开层级（含）：真实组织树层级较深，默认只展开到地区一级 */
export const ORG_TREE_DEFAULT_EXPAND_DEPTH = 2;

/**
 * 文件夹面板虚拟节点
 *
 * 「全部」不是真实文件夹，查询时不传 folderId。
 */
export const FOLDER_ALL = "ALL";

/** 列表中存在「述职中 / 报告生成中」人员时的自动刷新间隔：状态由钉钉闪记回调与 T+1 报告在后端流转 */
export const LIST_POLL_INTERVAL = 30 * 1000;

/** 详情「述职中」自动刷新间隔：等待闪记录制完成回调 */
export const DETAIL_RECORDING_POLL_INTERVAL = 5 * 1000;

/** 详情「报告生成中」自动刷新间隔 */
export const DETAIL_GENERATING_POLL_INTERVAL = 30 * 1000;

/** 新增文件夹成功提示的展示时长（秒）：设计稿批注「全局提示 3 秒消失」 */
export const FOLDER_CREATED_TOAST_SECONDS = 3;

/** 述职状态展示配置 */
export interface AppraisalStatusMeta {
	/** 状态文案 */
	label: string;
	/** 主色：文字 / 图标 */
	color: string;
	/** 浅色背景：标签 / 图标底 */
	bgColor: string;
	/** 概览卡片说明文案 */
	description: string;
}

/** 述职状态 → 展示配置（颜色取自设计稿 32 状态标签组件集） */
export const APPRAISAL_STATUS_META: Record<AppraisalStatus, AppraisalStatusMeta> = {
	[AppraisalStatus.PENDING]: {
		label: "待述职",
		color: "#FF7D00",
		bgColor: "#FFEFE0",
		description: "请持续关注",
	},
	[AppraisalStatus.IN_PROGRESS]: {
		label: "述职中",
		color: "#0075FF",
		bgColor: "#E4EFFF",
		description: "录音实时转写中",
	},
	[AppraisalStatus.GENERATING]: {
		label: "报告生成中",
		color: "#A174F6",
		bgColor: "#F4EEFE",
		description: "T+1生成，完成后自动推送",
	},
	[AppraisalStatus.READY]: {
		label: "报告已生成",
		color: "#14B968",
		bgColor: "#E3F7ED",
		description: "已推送参会人员",
	},
};

/** 概览卡片顺序 */
export const APPRAISAL_STATUS_ORDER = [
	AppraisalStatus.PENDING,
	AppraisalStatus.IN_PROGRESS,
	AppraisalStatus.GENERATING,
	AppraisalStatus.READY,
] as const;

/** 述职状态下拉选项 */
export const APPRAISAL_STATUS_OPTIONS = APPRAISAL_STATUS_ORDER.map((status) => ({
	value: status,
	label: APPRAISAL_STATUS_META[status].label,
}));

/** 级联选项 */
export interface CascaderOption {
	/** 选项值 */
	value: string;
	/** 选项文案 */
	label: string;
	/** 是否禁用 */
	disabled?: boolean;
	/** 下级选项 */
	children?: CascaderOption[];
}

/**
 * 管理者类别级联选项（设计稿 26）
 *
 * 契约中对应字段为 jobType（岗位类别，字符串），暂无字典接口，先按设计稿固定选项，
 * 查询时以「>」拼接路径透传，取值规则待后端确认（见 docs/swagger/yearly-performance-api.md）。
 */
export const MANAGER_CATEGORY_OPTIONS: CascaderOption[] = ["地区公司", "业务集团", "服务集团"].map(
	(group) => ({
		value: group,
		label: group,
		children: ["三级及以上管理者", "三级以下管理者"].map((level) => ({
			value: level,
			label: level,
		})),
	}),
);

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
export const STATUS_CURRENT_STEP: Record<AppraisalStatus, DetailStep> = {
	[AppraisalStatus.PENDING]: DetailStep.PREPARE,
	[AppraisalStatus.IN_PROGRESS]: DetailStep.RECORDING,
	[AppraisalStatus.GENERATING]: DetailStep.REPORT,
	[AppraisalStatus.READY]: DetailStep.REPORT,
};
