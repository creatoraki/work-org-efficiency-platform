/**
 * 组织大脑候选人卡片展示结构。
 *
 * 只保留人岗匹配与排兵布阵共用卡片、弹窗、档案跳转所需的核心字段。
 */
export interface OrgBrainCandidateItem {
	id?: number;
	jobCode?: string;
	jobName?: string;
	positionCode?: string;
	positionName?: string;
	positionLevel?: string;
	postgradeId?: string;
	postgradeName?: string;
	orgName?: string;
	orgFullName?: string;
	entryDate?: string;
	// 性别文字
	sex?: string;
	veto?: number;
	empCode?: string;
	username?: string;
	userId?: number;
	// 备注，当前人岗匹配返回 AI 匹配理由
	remark?: string;
	// 是否已选中
	isSelected?: boolean;
	// 人岗匹配度分数 0-100
	matchScore: number;
	recommendRank?: number;
}

/**
 * 排兵布阵候选人完整结构。
 *
 * 排兵布阵接口返回字段可能多于共享卡片所需字段，因此单独保留完整类型，
 * 供排兵布阵业务状态与后续扩展字段继续使用。
 */
export interface DeployCandidateItem extends OrgBrainCandidateItem {
	requestId?: number;
	matrixId?: number;
	departmentLine?: string;
	authorizedJobId?: string;
	authorizedJobName?: string;
	tagMatchModelId?: number;
	tagMatchModelName?: string;
	isManager?: number;
}

/**
 * 人岗匹配候选人完整结构。
 *
 * 人岗匹配会额外返回任务、AI 匹配过程与选择态字段，因此独立保留完整类型，
 * 供人岗匹配页面状态与表单保存直接复用。
 */
export interface JobMatchCandidateItem extends OrgBrainCandidateItem {
	requestId?: number;
	aiRequestId?: string;
	matchRound?: number;
	orgCode?: string;
	jobId?: number;
	postId?: number;
	postgradeId?: string;
	empBadge?: string;
	empName?: string;
	postName?: string;
	postgradeName?: string;
	matchDetail?: string;
	matchReason?: string;
	selectedTime?: string;
}
