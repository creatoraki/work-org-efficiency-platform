/**
 * 组织大脑 - 人岗匹配 API 类型定义
 */

import type { JobMatchCandidateItem } from "../candidate";

/**
 * 人岗匹配任务筛选选项
 */
export interface JobMatchFilterOption {
	// 筛选值
	value: string;
	// 筛选标签
	label: string;
}

/**
 * 人岗匹配任务列表项
 */
export interface JobMatchingItem {
	// 主键ID
	id: string;
	// 人岗匹配任务名称
	taskName: string;
	// 组织编码
	orgCode?: string;
	// 组织名称
	orgName: string;
	// 组织全路径
	orgFullPath?: string;
	// 组织全名称
	orgFullName?: string;
	// 岗位id
	jobId: string;
	// 岗位名称
	jobName: string;
	// 职位id
	postId: string;
	// 职位名称
	postName: string;
	// 职级id
	postgradeId?: string;
	// 职级
	postgradeName?: string;
	// 匹配模型ID
	modelId: string;
	// 匹配模型名称
	modelName: string;
	// 匹配模型快照（JSON），仅详情接口返回
	modelSnapshot?: string;
	// 匹配模型快照哈希
	modelSnapshotHash?: string;
	// 匹配模型是否有更新
	modelChanged?: boolean;
	// 匹配模型是否在线
	modelOnline?: boolean;
	// 最近一次AI请求ID
	aiRequestId?: string;
	// 匹配轮次
	matchRound?: number;
	// 最近一次匹配时间
	lastMatchTime?: string;
	// 候选人工号
	candidate?: string;
	// 候选人姓名
	candidateName?: string;
	// 人岗匹配度（0-100），后端分页接口字段
	matchScore?: number;
	// 候选人列表，仅详情接口返回
	candidates?: JobMatchCandidateItem[];
	// 操作人账号
	operatorAccount?: string;
	// 操作人姓名
	operatorName: string;
	// 创建人
	createBy?: string;
	// 创建时间
	createTime: string;
	// 更新人
	updateBy?: string;
	// 更新时间
	updateTime: string;
}

/**
 * 人岗匹配任务列表查询参数
 */
export interface JobMatchingListParams {
	// 页码
	pageNum?: number;
	// 每页数量
	pageSize?: number;
	// 人岗匹配任务名称（模糊搜索）
	taskName?: string;
	// 组织编码
	orgCode?: string;
	// 岗位ID集合
	jobIds?: number[];
	// 职位ID集合
	postIds?: number[];
	// 职级ID集合
	postgradeIds?: string[];
	// 匹配模型ID集合
	modelIds?: number[];
	// 候选人工号集合
	candidates?: string[];
	// 操作人账号集合
	operatorAccounts?: string[];
}

/**
 * 新增/编辑人岗匹配任务参数
 */
export interface SaveJobMatchingParams {
	// 主键ID（编辑时必填）
	id?: string;
	// 人岗匹配任务名称
	taskName: string;
	// 组织编码
	orgCode: string;
	// 组织名称
	orgName: string;
	// 组织全路径
	orgFullPath?: string;
	// 组织全名称
	orgFullName?: string;
	// 岗位id
	jobId: string;
	// 岗位名称
	jobName: string;
	// 职位id
	postId: string;
	// 职位名称
	postName: string;
	// 职级id
	postgradeId?: string;
	// 职级
	postgradeName?: string;
	// 匹配模型ID
	modelId?: string;
	// 匹配模型名称
	modelName?: string;
	// 匹配模型快照（JSON）
	modelSnapshot?: string;
	// 匹配模型快照哈希
	modelSnapshotHash?: string;
	// 匹配候选人列表
	candidates?: SaveJobMatchingCandidateItem[];
	// 是否刷新匹配模型快照
	refreshModelSnapshot?: boolean;
}

/**
 * 人岗匹配任务名称校验参数
 */
export interface JobMatchingNameCheckParams {
	// 主键ID，编辑时传入用于排除当前任务
	id?: number;
	// 人岗匹配任务名称
	taskName: string;
}

/**
 * 保存人岗匹配任务时提交的候选人信息。
 */
export interface SaveJobMatchingCandidateItem {
	// 候选人主键ID，编辑时透传已有候选人记录 ID
	id?: number;
	// 员工工号，兼容预览接口返回字段
	empCode: string;
	// 候选人姓名
	userName?: string;
	// 用户ID
	userId?: number;
	// 性别
	sex?: string;
	// 员工所在组织编码
	orgCode?: string;
	// 员工所在组织名称
	orgName?: string;
	// 岗位编码
	jobCode?: number;
	// 岗位名称
	jobName?: string;
	// 职位编码
	postCode?: number;
	// 职位名称
	positionName?: string;
	// 职级
	positionLevel?: string;
	// AI请求ID
	aiRequestId?: string;
	// 人岗匹配度
	matchScore?: number;
	// 推荐序号
	recommendRank?: number;
	// 匹配明细
	matchDetail?: string;
	// AI匹配理由
	matchReason?: string;
	// 是否被选中
	isSelected?: boolean;
}

/**
 * 人岗匹配详情
 */
export interface JobMatchCandidateResponseItem extends JobMatchCandidateItem {
	// 员工工号
	empBadge?: string;
	// 员工姓名
	empName?: string;
	// 职位名称
	postName?: string;
	// 职级
	postgradeName?: string;
}

/**
 * 人岗匹配详情
 */
export interface JobMatchingDetailResponse {
	// 主键ID
	id: string;
	// 人岗匹配任务名称
	taskName: string;
	// 所属组织编码
	orgCode?: string;
	// 组织名称
	orgName: string;
	// 组织全路径
	orgFullPath?: string;
	// 组织全名称
	orgFullName?: string;
	// 岗位id
	jobId: string;
	// 岗位名称
	jobName?: string;
	// 职位id
	postId: string;
	// 职位名称
	postName?: string;
	// 职级id
	postgradeId: string;
	// 职级
	postgradeName?: string;
	// 匹配模型ID
	modelId: string;
	// 匹配模型名称
	modelName: string;
	// 匹配模型快照（JSON），仅详情接口返回
	modelSnapshot?: string;
	// 匹配模型快照哈希
	modelSnapshotHash?: string;
	// 匹配模型是否有更新（true=模型已变更，建议同步）
	modelChanged?: boolean;
	// 匹配模型是否在线（true=在线，false=离线）
	modelOnline?: boolean;
	// 最近一次AI请求ID
	aiRequestId?: string;
	// 匹配轮次
	matchRound?: number;
	// 最近一次匹配时间
	lastMatchTime?: string;
	// 候选人（工号）
	candidate?: string;
	// 候选人姓名
	candidateName?: string;
	// 人岗匹配度（0-100）
	matchScore?: number;
	// 候选人列表（仅详情接口返回）
	candidates?: JobMatchCandidateResponseItem[];
	// 操作人账号
	operatorAccount?: string;
	// 操作人姓名
	operatorName: string;
	// 创建人
	createBy?: string;
	// 创建时间
	createTime: string;
	// 更新人
	updateBy?: string;
	// 更新时间
	updateTime: string;
}

/**
 * 人岗匹配详情页面结构。
 *
 * 在后端原生 VO 基础上，补充当前页面交互所需的当前选中候选人
 * 以及候选人列表别名，避免污染后端契约类型。
 */
export interface JobMatchingDetail extends JobMatchingDetailResponse {
	// 前端派生：当前选中的候选人
	selectedCandidate?: JobMatchCandidateItem;
	// 前端派生：候选人列表别名
	candidateList?: JobMatchCandidateItem[];
}

/**
 * 执行人岗匹配参数
 */
export interface ExecuteMatchingParams {
	// 组织编码
	orgCode: string;
	// 组织名称
	orgName: string;
	// 岗位id
	jobId: string;
	// 岗位名称
	jobName: string;
	// 职位id
	postId: string;
	// 职位名称
	postName: string;
	// 职级id
	postgradeId: string;
	// 职级
	postgradeName: string;
	// 匹配模型ID
	modelId: string;
	// 页码
	pageNum?: number;
	// 每页条数
	pageSize?: number;
}

/**
 * 执行人岗匹配候选人原始结果项
 */
export interface ExecuteMatchingResultItem {
	// 一票否决标识
	veto?: number;
	// 推荐排名
	recommendRank?: number;
	// 候选人姓名
	userName?: string;
	// 员工编码
	empCode?: string;
	// 用户ID
	userId?: string | number;
	// 匹配度
	matchScore?: number;
	// 候选人当前岗位
	jobName?: string;
	// 候选人当前职位
	positionName?: string;
	// 候选人当前职级
	positionLevel?: string;
	// 性别
	sex?: string;
	// 当前岗位编码
	jobCode?: string;
	// 当前职位编码
	postCode?: string;
	// 入职日期
	entryDate?: string;
	// 候选人所属组织
	orgName?: string;
}

/**
 * 执行人岗匹配结果
 */
export interface ExecuteMatchingResult {
	// 候选人列表
	content: ExecuteMatchingResultItem[];
	// 匹配模型快照（JSON）
	modelSnapshot?: string;
	// 匹配模型快照哈希
	modelSnapshotHash?: string;
	// 分页页码
	pageNum?: number;
	// 每页条数
	pageSize?: number;
	// 总条数
	totalCount?: number;
}

/**
 * 搜索选项响应
 */
export interface JobMatchingSearchOptions {
	// 匹配模型选项
	modelOptions: JobMatchFilterOption[];
	// 候选人选项
	candidateOptions: JobMatchFilterOption[];
	// 操作人选项
	operatorOptions: JobMatchFilterOption[];
}
