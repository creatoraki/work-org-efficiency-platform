/**
 * 绩效管理 · 年终述职
 *
 * 接口类型：组织架构树、述职文件夹、概览统计、述职人员列表、述职详情（备课材料 / 录音转写 / 评分报告）。
 * 后端接口就绪前由 api.ts 返回本地模拟数据，类型按后端契约草案定义，字段名以后端为准。
 */

/** 述职状态 */
export enum YearlyReportStatus {
	/** 待述职：备课材料已生成，等待现场述职 */
	PENDING = 1,
	/** 述职中：录音实时转写中 */
	IN_PROGRESS = 2,
	/** 报告生成中：述职已结束，评分报告 T+1 生成 */
	GENERATING = 3,
	/** 报告已生成：已由绿小服推送参会人员 */
	READY = 4,
}

/**
 * 文件夹树虚拟节点 ID
 *
 * 「全部」与「未归入文件夹」不是真实文件夹，由前端固定 ID 表达，
 * 查询列表时透传给后端，由后端区分「不过滤」与「folderId 为空」。
 */
export const YEARLY_REPORT_FOLDER_ALL = "ALL";
export const YEARLY_REPORT_FOLDER_UNFILED = "UNFILED";

/** 组织架构树节点 */
export interface YearlyReportOrgNode {
	/** 组织 ID */
	orgId: string;
	/** 组织名称 */
	orgName: string;
	/** 组织下（含下级）述职总人数 */
	headCount: number;
	/**
	 * 是否允许在该组织下新建文件夹
	 *
	 * 产品规则：文件夹只能建在「服务集团 / 地区公司 / 业务集团」下的二级组织上。
	 */
	folderEnabled?: boolean;
	/** 下级组织 */
	children?: YearlyReportOrgNode[];
}

/** 组织架构树响应 */
export interface YearlyReportOrgTree {
	/** 当前用户可见范围内的述职总人数 */
	totalCount: number;
	/** 组织树 */
	nodes: YearlyReportOrgNode[];
}

/** 述职文件夹 */
export interface YearlyReportFolder {
	/** 文件夹 ID */
	folderId: string;
	/** 文件夹名称 */
	folderName: string;
	/** 所属组织 ID */
	orgId: string;
	/** 述职日期，YYYY-MM-DD */
	reportDate: string;
	/** 文件夹内述职人数 */
	headCount: number;
}

/** 文件夹面板查询参数 */
export interface YearlyReportFolderQuery {
	/** 当前选中组织 */
	orgId?: string;
	/** 文件夹名称关键字 */
	keyword?: string;
}

/** 文件夹面板数据 */
export interface YearlyReportFolderTree {
	/** 当前组织范围内的述职总人数（对应「全部」） */
	totalCount: number;
	/** 未归入任何文件夹的人数 */
	unfiledCount: number;
	/** 文件夹列表，按创建顺序 */
	folders: YearlyReportFolder[];
}

/** 新增文件夹参数 */
export interface CreateYearlyReportFolderPayload {
	/** 所属组织 ID */
	orgId: string;
	/** 述职日期，YYYY-MM-DD */
	reportDate: string;
	/** 文件夹名称 */
	folderName: string;
}

/** 重命名文件夹参数 */
export interface RenameYearlyReportFolderPayload {
	/** 文件夹 ID */
	folderId: string;
	/** 文件夹名称 */
	folderName: string;
}

/** 批量移动述职人员参数 */
export interface MoveYearlyReportPayload {
	/** 述职记录 ID 列表 */
	reportIds: string[];
	/** 目标文件夹 ID */
	folderId: string;
}

/** 人员卡片拖拽排序参数 */
export interface SortYearlyReportPayload {
	/** 当前组织 */
	orgId?: string;
	/** 当前文件夹 */
	folderId?: string;
	/** 拖拽后的述职记录 ID 顺序（仅当前页） */
	reportIds: string[];
}

/** 述职人员列表查询参数 */
export interface YearlyReportListQuery {
	/** 组织 ID，空表示全部组织 */
	orgId?: string;
	/** 文件夹 ID，见 YEARLY_REPORT_FOLDER_ALL / YEARLY_REPORT_FOLDER_UNFILED */
	folderId?: string;
	/** 员工姓名，模糊匹配 */
	employeeName?: string;
	/** 管理者类别，级联路径，如 ["地区公司", "三级及以上管理者"] */
	managerCategory?: string[];
	/** 述职状态 */
	status?: YearlyReportStatus;
	/** 述职开始时间下限，YYYY-MM-DD HH:mm */
	reportTimeStart?: string;
	/** 述职开始时间上限，YYYY-MM-DD HH:mm */
	reportTimeEnd?: string;
	/** 页码，从 1 开始 */
	pageNum: number;
	/** 每页条数 */
	pageSize: number;
}

/** 述职人员列表项 */
export interface YearlyReportItem {
	/** 述职记录 ID */
	reportId: string;
	/** 员工工号 */
	userCode: string;
	/** 员工姓名 */
	userName: string;
	/** 头像地址，未上传时为空 */
	avatar?: string;
	/** 述职顺序（同一场述职会内的出场顺序） */
	sortNo: number;
	/** 管理者类别全路径，如「地区公司>地区经营班子/群主」 */
	managerCategory: string;
	/** 组织架构全路径，如「地区公司>杭州区域公司」 */
	orgPath: string;
	/** 所属组织 ID */
	orgId: string;
	/** 所属文件夹 ID，未归入时为空 */
	folderId?: string;
	/** 述职开始时间，YYYY-MM-DD HH:mm */
	reportStartTime: string;
	/** 述职结束时间，YYYY-MM-DD HH:mm */
	reportEndTime: string;
	/** 述职状态 */
	status: YearlyReportStatus;
}

/** 述职人员分页结果 */
export interface YearlyReportListResult {
	/** 当前页数据 */
	list: YearlyReportItem[];
	/** 总条数 */
	total: number;
}

/** 概览统计（不受「述职状态」筛选影响，便于卡片联动切换） */
export interface YearlyReportStatistics {
	/** 待述职 */
	pendingCount: number;
	/** 述职中 */
	inProgressCount: number;
	/** 报告生成中 */
	generatingCount: number;
	/** 报告已生成 */
	readyCount: number;
}

/** 概览统计查询参数：与列表查询一致，但不含状态与分页 */
export type YearlyReportStatisticsQuery = Omit<
	YearlyReportListQuery,
	"status" | "pageNum" | "pageSize"
>;

/** 级联选项（所属组织 / 管理者类别） */
export interface YearlyReportCascaderOption {
	/** 选项值 */
	value: string;
	/** 选项文案 */
	label: string;
	/** 下级选项 */
	children?: YearlyReportCascaderOption[];
}

/* ------------------------------------------------------------------ */
/* 述职详情                                                              */
/* ------------------------------------------------------------------ */

/** 备课材料 · 人员基本信息 */
export interface PrepMaterialBasicInfo {
	/** 姓名 / 工号 */
	nameAndCode: string;
	/** 岗位分类 */
	positionCategory: string;
	/** 所属组织 */
	orgName: string;
	/** 现任职务 */
	currentPosition: string;
	/** 入职时间 / 司龄 */
	entryAndTenure: string;
	/** 直接上级 */
	directLeader: string;
	/** 述职形式 */
	reportForm: string;
	/** 应到评委 */
	judges: string;
}

/** 近三年绩效成绩 */
export interface PrepMaterialPerformanceRow {
	/** 考核周期 */
	cycle: string;
	/** 绩效等级 */
	grade: string;
	/** 综合得分 */
	score: string;
	/** 部门排名 */
	rank: string;
}

/** 能力素质画像维度 */
export interface PrepMaterialAbility {
	/** 维度名称 */
	name: string;
	/** 得分（0-100） */
	score: number;
}

/** 过往汇报材料 */
export interface PrepMaterialFile {
	/** 文件名 */
	fileName: string;
	/** 文件类型 */
	fileType: "ppt" | "pdf" | "xls";
	/** 文件大小 */
	fileSize: string;
	/** 上传日期 */
	uploadDate: string;
}

/** 上一年度述职结论回顾 */
export interface PrepMaterialReview {
	/** 回顾内容，「」包裹的片段加粗展示 */
	content: string;
	/** 时间 */
	date: string;
	/** 是否为结论项（实心圆点） */
	primary?: boolean;
}

/** 述职备课材料（千问办公生成） */
export interface PrepMaterial {
	/** 文档副标题，如「林晚晴 · 10041208 · 人力资源部总经理」 */
	subtitle: string;
	/** 述职会名称 */
	meetingName: string;
	/** 述职会时间 */
	meetingTime: string;
	/** 同步时间 */
	syncTime: string;
	/** 人员基本信息 */
	basicInfo: PrepMaterialBasicInfo;
	/** 材料提取要点 */
	highlights: string[];
	/** 建议关注 */
	focusTags: string[];
	/** 近三年绩效成绩 */
	performance: PrepMaterialPerformanceRow[];
	/** 能力素质画像 */
	abilities: PrepMaterialAbility[];
	/** 过往汇报材料 */
	files: PrepMaterialFile[];
	/** 上一年度述职结论回顾 */
	reviews: PrepMaterialReview[];
}

/** 录音转写片段 */
export interface TranscriptSegment {
	/** 相对录音开始的时间点，mm:ss */
	time: string;
	/** 发言人 */
	speaker: string;
	/** 发言人角色 */
	role: string;
	/** 转写文本 */
	text: string;
}

/** 实时总结条目 */
export interface TranscriptSummary {
	/** 标题，如「会议主题」 */
	title: string;
	/** 内容 */
	content: string;
}

/** 述职中 · 录音转写 */
export interface ReportTranscript {
	/** 录音时长（秒） */
	durationSeconds: number;
	/** 输入音量（0-1） */
	inputVolume: number;
	/** 转写片段 */
	segments: TranscriptSegment[];
	/** 实时总结 */
	summaries: TranscriptSummary[];
}

/** 报告生成中说明 */
export interface ReportGenerating {
	/** 预计完成时间，如「11-06 12:00」 */
	expectFinishTime: string;
	/** 录音与转写上传完成时间，如「11-05 10:32」 */
	uploadFinishTime: string;
}

/** 评分构成 */
export interface ScoreComponent {
	/** 维度 */
	name: string;
	/** 权重，如「30%」 */
	weight: string;
	/** 得分（0-100） */
	score: number;
}

/** 述职过程关键节点 */
export interface ScoreKeyNode {
	/** 内容 */
	content: string;
	/** 时间点，mm:ss */
	time: string;
	/** 是否为高亮节点（实心圆点） */
	primary?: boolean;
}

/** 述职综合评分报告 */
export interface ScoreReport {
	/** 文档副标题 */
	subtitle: string;
	/** 述职会名称 */
	meetingName: string;
	/** 述职会时间 */
	meetingTime: string;
	/** 报告生成说明，如「11-05 10:12 生成 · 录音结束 T+1」 */
	generatedText: string;
	/** 被评人 · 职务 */
	personTitle: string;
	/** 建议评级 */
	suggestedGrade: string;
	/** 综合得分 */
	totalScore: number;
	/** 综合结论（「」与数字高亮在渲染层处理） */
	conclusion: string;
	/** 同层级排名百分位 */
	rankPercent: string;
	/** 录音时长 */
	recordDuration: string;
	/** AI 笔记条数 */
	aiNoteCount: number;
	/** 评委追问次数 */
	followUpCount: number;
	/** 评分构成 */
	components: ScoreComponent[];
	/** 亮点 */
	highlights: string[];
	/** 待改进 */
	improvements: string[];
	/** 千问办公综合评语（段落） */
	comments: string[];
	/** 关键节点总数 */
	keyNodeTotal: number;
	/** 述职过程关键节点 */
	keyNodes: ScoreKeyNode[];
}

/** 可下载的述职文档类型 */
export type YearlyReportDocumentType = "prep" | "transcript" | "report";

/** 述职详情 */
export interface YearlyReportDetail extends YearlyReportItem {
	/** 备课材料 */
	prepMaterial: PrepMaterial;
	/** 录音转写，述职开始后才有 */
	transcript?: ReportTranscript;
	/** 报告生成说明，述职结束后才有 */
	generating?: ReportGenerating;
	/** 评分报告，报告生成后才有 */
	scoreReport?: ScoreReport;
}
