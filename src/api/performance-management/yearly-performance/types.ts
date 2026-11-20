/**
 * 绩效管理 · 年终述职
 *
 * 接口契约来源：docs/swagger/11-20.md（tag：年终述职-文件夹 / 年终述职-述职人 / 年终述职-AI听记记录 / 年终述职-组织树）。
 * 字段名与后端保持一致；唯一的统一转换是 int64 ID → string（见 api.ts「ID 归一」说明）。
 * 对接说明与待确认项见 docs/swagger/yearly-performance-api.md。
 */

/** int64 主键在前端统一按字符串持有，避免雪花 ID 超出 Number 安全整数范围 */
export type AppraisalId = string;

/** 述职状态（appraisalStatus） */
export enum AppraisalStatus {
	/** 待述职：备课材料已由千问办公同步，等待现场述职 */
	PENDING = 0,
	/** 述职中：已开始述职，AI 听记录制中或录制完成待提交 */
	IN_PROGRESS = 1,
	/** 报告生成中：述职已结束，评分报告 T+1 生成 */
	GENERATING = 2,
	/** 报告已生成（后端文案「报告生成完成」）：已由绿小服推送参会人员 */
	READY = 3,
}

/**
 * AI 听记任务状态（EffAnnualAppraisalRecordBO.status，后端为字符串）
 *
 * 3 未在契约中出现，按未知状态兜底展示。
 */
export enum AppraisalRecordStatus {
	/** 初始态 */
	INIT = "0",
	/** 录制中 */
	RECORDING = "1",
	/** 暂停中 */
	PAUSED = "2",
	/** 录制完成（已生成闪记） */
	COMPLETED = "4",
}

/* ------------------------------------------------------------------ */
/* 组织树 GET appraisal/org/tree                                         */
/* ------------------------------------------------------------------ */

/** 组织树节点（DeptTreeV） */
export interface AppraisalOrgNode {
	/** ID */
	id: AppraisalId;
	/** 父级 ID */
	parentId?: AppraisalId;
	/** 编码：列表 / 统计查询的 orgCode、文件夹的 belongToOrgCode 均使用该值 */
	code: string;
	/** 父级编码 */
	parentCode?: string;
	/** 祖先编码 */
	ancestorsCode?: string;
	/** 名称 */
	name: string;
	/** 是否可访问：不可访问节点仅作为路径展示，不可选中 */
	accessible: boolean;
	/** 深度 */
	depth?: number;
	/** 子级 */
	children?: AppraisalOrgNode[];
}

/* ------------------------------------------------------------------ */
/* 文件夹 appraisal/folder/**                                             */
/* ------------------------------------------------------------------ */

/** 文件夹（EffAnnualAppraisalFolderPageListBO / DetailVO） */
export interface AppraisalFolder {
	/** 文件夹 ID */
	id: AppraisalId;
	/** 文件夹名称 */
	name: string;
	/** 述职日期，后端 date-time 原样透传 */
	appraisalDate?: string;
	/** 所属组织编码 */
	belongToOrgCode?: string;
	/** 所属组织名称 */
	belongToOrgName?: string;
}

/** 文件夹分页查询（EffAnnualAppraisalFolderQueryForm） */
export interface AppraisalFolderQuery {
	/** 页码 */
	pageNum: number;
	/** 每页数量，最大 500 */
	pageSize: number;
	/** 文件夹名称 */
	name?: string;
	/** 述职日期开始 */
	appraisalDateStart?: string;
	/** 述职日期结束 */
	appraisalDateEnd?: string;
	/** 所属组织编码 */
	belongToOrgCode?: string;
	/** 述职周期 */
	period?: string;
}

/** 新增文件夹（EffAnnualAppraisalFolderAddForm） */
export interface AppraisalFolderAddForm {
	/** 文件夹名称 */
	name: string;
	/** 述职日期，YYYY-MM-DD HH:mm:ss */
	appraisalDate: string;
	/** 所属组织编码 */
	belongToOrgCode: string;
	/** 述职周期 */
	period?: string;
}

/** 修改文件夹（EffAnnualAppraisalFolderUpdateForm），后端要求 appraisalDate 必传 */
export interface AppraisalFolderUpdateForm {
	/** 主键 ID */
	id: AppraisalId;
	/** 文件夹名称 */
	name: string;
	/** 述职日期 */
	appraisalDate: string;
}

/** 批量添加述职人员到文件夹（EffAnnualAppraisalFolderAddUsersForm） */
export interface AppraisalFolderAddUsersForm {
	/** 文件夹 ID */
	folderId: AppraisalId;
	/** 述职人员 ID 列表 */
	userIds: AppraisalId[];
}

/* ------------------------------------------------------------------ */
/* 述职人 appraisal/user/**                                              */
/* ------------------------------------------------------------------ */

/** 述职人员（EffAnnualAppraisalUserPageListBO） */
export interface AppraisalUser {
	/** 述职人员 ID */
	userId: AppraisalId;
	/** 用户名称 */
	userName: string;
	/** 所属组织编码 */
	orgCode?: string;
	/** 所属组织名称 */
	orgName?: string;
	/** 所属组织类型 */
	orgType?: number;
	/** 所属文件夹 ID，未归入文件夹时为空 */
	folderId?: AppraisalId;
	/** 述职周期 */
	period?: string;
	/** 所属文件夹名称 */
	folderName?: string;
	/** 述职日期 */
	appraisalDate?: string;
	/** 述职状态 */
	appraisalStatus: AppraisalStatus;
	/** 岗位类别（页面展示为「管理者类别」） */
	jobType?: string;
	/** 排序（文件夹内述职顺序） */
	sort?: number;
}

/** 述职人员筛选条件（EffAnnualAppraisalUserStatisticQueryForm） */
export interface AppraisalUserFilter {
	/** 用户名称 */
	userName?: string;
	/** 所属组织编码 */
	orgCode?: string;
	/** 仅当前组织（false 时包含下级组织） */
	currentOrgOnly?: boolean;
	/** 所属文件夹 ID */
	folderId?: AppraisalId;
	/** 述职周期 */
	period?: string;
	/** 述职日期开始，YYYY-MM-DD HH:mm:ss */
	appraisalDateStart?: string;
	/** 述职日期结束，YYYY-MM-DD HH:mm:ss */
	appraisalDateEnd?: string;
	/** 述职状态 */
	appraisalStatus?: AppraisalStatus;
	/** 岗位类别 */
	jobType?: string;
}

/** 述职人员分页查询（EffAnnualAppraisalUserPageQueryForm） */
export interface AppraisalUserQuery extends AppraisalUserFilter {
	/** 页码 */
	pageNum: number;
	/** 每页数量，最大 500 */
	pageSize: number;
}

/** 述职状态统计（POST appraisal/user/statistic 归一后的结果） */
export type AppraisalStatistics = Record<AppraisalStatus, number>;

/** AI 听记记录（EffAnnualAppraisalRecordBO） */
export interface AppraisalRecord {
	/** 述职记录 ID */
	id: AppraisalId;
	/** AI 听记透传状态 */
	state?: string;
	/** AI 听记任务状态，见 AppraisalRecordStatus */
	status?: string;
	/** AI 听记任务 Uuid */
	taskUuid?: string;
	/** AI 听记任务发起人（Union Id） */
	creator?: string;
	/** AI 听记任务标题（闪记名称） */
	title?: string;
	/** AI 听记任务开始时间 */
	startTime?: string;
	/** AI 听记任务结束时间 */
	endTime?: string;
	/** 预计报告生成时间 */
	evaluationTime?: string;
	/** AI 听记任务时长（秒） */
	duration?: number;
	/** AI 听记任务音频 Url */
	url?: string;
	/** 契约描述同为「音频Url」，含义待后端确认，仅透传 */
	contact?: string;
}

/** 述职人员详情（EffAnnualAppraisalUserDetailBO） */
export interface AppraisalUserDetail extends Omit<AppraisalUser, "sort"> {
	/** 述职前准备材料（备课材料 PDF）Url */
	materialUrl?: string;
	/** 述职前准备材料拉取时间 */
	materialFetchTime?: string;
	/** 预计述职开始时间 */
	expectedBeginTime?: string;
	/** 预计述职结束时间 */
	expectedEndTime?: string;
	/** 实际述职开始时间 */
	realBeginTime?: string;
	/** 实际述职结束时间（录音与转写上传存档时间） */
	realEndTime?: string;
	/** 预计评估报告生成时间 */
	expectedEvaluationCompletedTime?: string;
	/** 实际评估报告生成时间 */
	realEvaluationCompletedTime?: string;
	/** AI 评估报告（评分报告 PDF）Url */
	evaluationReportUrl?: string;
	/** AI 评估报告拉取时间 */
	evaluationReportFetchedTime?: string;
	/** AI 听记述职录音等记录 */
	appraisalRecords: AppraisalRecord[];
}

/** 开始 / 重新开始 / 结束述职（EffAnnualAppraisalUserPresentationForm） */
export interface AppraisalPresentationForm {
	/** 所属文件夹 ID */
	folderId: AppraisalId;
	/** 述职人员 ID */
	userId: AppraisalId;
}

/** 述职人员排序（EffAnnualAppraisalUserSortForm） */
export interface AppraisalUserSortForm {
	/** 所属文件夹 ID */
	folderId: AppraisalId;
	/** 排好序的述职人员 ID 列表 */
	userIdsSorted: AppraisalId[];
}

/** 分页结果（前端只消费 list / total） */
export interface AppraisalPage<T> {
	/** 当前页数据 */
	list: T[];
	/** 总条数 */
	total: number;
}
