// ==================== 待办 ====================

export interface ListForWorkbenchParams {
	/* 目标用户id */
	targetUserId?: string;

	/* 待办标题 */
	backLogTitle?: string;

	/* 创建时间排序 0倒序 1正序  默认按照创建时间倒序 */
	order?: number;

	/* 业务模块 */
	businessType?: string;
}

export interface BacklogItem {
	/* 主键id */
	id: number;

	/* 待办标题 */
	backLogTitle: string;

	/* 业务类型 */
	businessType: string;

	/* 业务主键id */
	businessId: number;

	/* pc端跳转链接 */
	pcLink: string;

	/* 额外查询参数，JSON字符串 */
	query?: string;

	/* 移动端跳转链接 */
	mobileLink: string;

	/* 目标用户id */
	targetUserId: string;

	/* 目标用户名称，oa账号 */
	targetUserName: string;

	/* 是否删除0否1是 */
	delFlag: number;

	/* 待办状态0待办2已办 */
	status: number;

	/* 待办类型0通知类待办 1审批类待办 */
	type: number;

	/* 创建者 */
	createBy: string;

	/* 创建时间 */
	createTime: Record<string, unknown>;

	/* 更新者 */
	updateBy: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 备注 */
	remark: string;

	/* 创建者 */
	createByName: string;

	/* 更新者 */
	updateByName: string;

	/* 待办完成时间 */
	finishTime: Record<string, unknown>;

	/* 待办截止时间 */
	deadline: Record<string, unknown>;

	/* 是否逾期 */
	isOverDue: boolean;

	/* 逾期天数 */
	overdueDays: number;
}

export interface ListForWorkbenchRes {
	/* 全部数量 */
	count: number;

	/* 已办数量 */
	doneCount: number;

	/* 未办数量 */
	undoCount: number;

	/* 已办列表 */
	doneBacklogList: BacklogItem[];

	/* 未办列表 */
	undoBacklogList: BacklogItem[];

	/* 按照业务类型统计 */
	businessTypeCountList: {
		/* 业务类型  humanEfficiency人效管控（父级） ,postMatching人岗匹配 ,humanEfficiencySecond人效管控（子级）,strategySplit战略拆解 organizationManage组织管理,beingOpen推心置腹,militaryOrganization 排兵布阵,recognizeTalent慧眼识珠 */
		businessType: string;

		/* 数量 */
		count: number;

		/* 子业务类型待办数量 */
		child: ListForWorkbenchRes["businessTypeCountList"];
	}[];
}

// ==================== 日历 ====================

export interface CalendarListParams {
	/* 年 */
	year?: number;

	/* 会议名称 支持模糊查询 */
	meetingName?: string;
}

export interface CalendarItem {
	/* 主键ID（自增） */
	id: number;

	/* 会议名称（限制8个字符） */
	meetingName: string;

	/* 会议开始时间-年 */
	startYear: number;

	/* 会议开始时间-月 */
	startMonth: number;

	/* 会议结束时间-年 */
	endYear: number;

	/* 会议结束时间-月 */
	endMonth: number;

	/* */
	createBy: string;

	/* */
	createByName: string;

	/* */
	updateBy: string;

	/* */
	updateByName: string;

	/* 会议开始时间 */
	startTime: Record<string, unknown>;

	/* 会议结束时间 */
	endTime: Record<string, unknown>;

	/* 状态0未完成 1已完成,可用值:UNFINISHED,FINISHED */
	status: string;

	/* 活动状态0待开始 1进行中 2已结束,可用值:WAIT_START,GOING,OVER_DUE_UNFINISHED,FINISHED */
	activeStatus: string;

	/* 完成时间 */
	finishTime: Record<string, unknown>;

	/* 逻辑删除标识：0=未删除，1=已删除 */
	delFlag: number;

	/* 是否合跨月份并 0否1是 */
	isMerge: number;
}

export interface CalendarListRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 月份 */
		month: number;

		/* 会议列表 */
		list: CalendarItem[];
	}[];
}

export interface AddCalendarParams {
	/* 创建者 */
	createBy?: string;

	/* 创建时间 */
	createTime?: Record<string, unknown>;

	/* 更新者 */
	updateBy?: string;

	/* 更新时间 */
	updateTime?: Record<string, unknown>;

	/* 备注 */
	remark?: string;

	/* 创建者姓名 */
	createByName?: string;

	/* 更新者姓名 */
	updateByName?: string;

	/* 主键ID（自增） */
	id?: number;

	/* 会议名称（限制8个字符） */
	meetingName?: string;

	/* 会议开始时间（仅存年月，日固定为01，如2025-08-01） */
	startTime?: Record<string, unknown>;

	/* 会议开始时间-年 */
	startYear?: number;

	/* 会议开始时间-月 */
	startMonth?: number;

	/* 会议结束时间-年 */
	endYear?: number;

	/* 会议结束时间-月 */
	endMonth?: number;

	/* 会议结束时间（仅存年月，日固定为月末，如2025-09-30） */
	endTime?: Record<string, unknown>;

	/* 状态0未完成 1已完成 */
	status?: number;

	/* 完成时间 */
	finishTime?: Record<string, unknown>;

	/* 逻辑删除标识：0=未删除，1=已删除 */
	delFlag?: number;
}

export type UpdateCalendarParams = AddCalendarParams;

// ==================== 文化课程 ====================

export interface CourseItem {
	/* 数据主键ID */
	id: string;

	/* 课程主键ID */
	kngId: string;

	/* 课程类型名称 */
	kngTypeName: string;

	/* 知识名称 */
	title: string;

	/* 知识封面 */
	coverUrl: string;

	/* 学习人数 */
	studyUserCount: number;

	/* 创建时间 */
	createTime: Record<string, unknown>;
}

export interface CoursePageListParams extends PaginationParams {
	/* 知识名称 */
	title?: string;
}
