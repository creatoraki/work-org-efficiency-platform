// ==================== 目标确认相关 ====================

/** 目标确认分页查询参数 */
export interface ConfirmPageParams {
	/* 页码(不能为空) */
	pageNum: number;

	/* 每页数量(不能为空) */
	pageSize: number;

	/* 是否查询总条数 */
	searchCount?: boolean;

	/* 排序字段集合 */
	sortItemList?: {
		/* true正序|false倒序 */
		isAsc: boolean;

		/* 排序字段 */
		column: string;
	}[];

	/* 目标确认记录id */
	stepConfirmationRecordId?: number;

	/* 任务名称 */
	name?: string;

	/* 拆解对象名称 */
	targetOrgName?: string;

	/* 目标计划名称 */
	targetPlanName?: string;

	/* 目标计划周期(子周期) */
	targetPlanPeriod?: number;

	/* 目标计划周期 */
	targetPlanYear?: string;

	/* 提交人姓名 */
	submitUserName?: string;

	/* 确认人姓名 */
	confirmUserName?: string;

	/* 步骤状态 */
	stepStatus?: number;

	/* 兼容页面层现有扩展字段 */
	[key: string]: unknown;
}

/** 目标确认列表项 */
export interface ConfirmPageItem {
	/* 主键id */
	id: number;
	/* 任务提交表id */
	effTaskSubmissionId: number;
	/* 任务名称 */
	name: string;
	/* 拆解对象id */
	targetOrgCode: string;
	/* 拆解对象名称 */
	targetOrgName: string;
	/* 提交版本 */
	submitVersion: string;
	/* 目标计划主键id */
	targetPlanId: number;
	/* 目标计划名称 */
	targetPlanName: string;
	/* 目标计划周期(子周期) */
	targetPlanPeriod: number;
	/* 目标计划周期 */
	targetPlanYear: string;
	/* 提交人姓名 */
	submitUserName: string;
	/* 下发时间 */
	issueTime: string | Record<string, unknown> | null;
	/* 步骤状态 */
	stepStatus: number;
	/* 步骤状态 */
	stepStatusStr: string;
	/* 确认人姓名 */
	confirmUserName: string;
	/* 确认指标数量 */
	confirmationIndicatorCount: number;
	/* 确认意见 */
	confirmationOpinion: string | null;
	/* 目标周期 */
	targetCycle: string;
	/* 流程 0:下发前确认 1:各组织负责人目标值确认 */
	processType: number;
}

/** 提交目标确认参数 */
export interface ConfirmTaskParams {
	id: number | string;
	status: number;
	confirmationOpinion?: string;
}

/** 目标确认统计响应 */
export interface TargetConfirmStatisticsRes {
	totalCount: number;
	waitConfirmedCount: number;
	rejectedCount: number;
	confirmedCount: number;
}

// ==================== 流程跟进相关 ====================

/** 流程跟进列表项 */
export interface ProcessListItem {
	id: number | string;
	curAuditName: string;
	approvalCode: string;
	name: string;
	targetPlanName: string;
	targetPlanPeriod: number;
	targetPlanYear: string;
	targetCycle: string;
	submitVersion: string;
	status: number;
	statusStr: string;
	submitUserName: string;
	submitDate: string;
}

/** OA 流程统计响应 */
export interface OaProcessStatisticsRes {
	totalCount: number;
	processingCount: number;
	terminatedCount: number;
	finishedCount: number;
}

export interface Page_5Params {
	/* 页码(不能为空) */
	pageNum: number;

	/* 每页数量(不能为空) */
	pageSize: number;

	/* 是否查询总条数 */
	searchCount?: boolean;

	/* 排序字段集合 */
	sortItemList?: {
		/* true正序|false倒序 */
		isAsc: boolean;

		/* 排序字段 */
		column: string;
	}[];

	/* 当前审核人姓名 */
	curAuditName?: string;

	/* 流程编号 */
	approvalCode?: string;

	/* 任务名称 */
	name?: string;

	/* 目标计划名称 */
	targetPlanName?: string;

	/* 目标计划周期 */
	targetPlanPeriod?: number;

	/* 目标计划周期(子周期) */
	targetPlanYear?: string;

	/* 状态0：流程中1：已中止 2：已结束 */
	status?: number;

	/* 发起人姓名 */
	submitUserName?: string;
}

export interface OAProcessListItem {
	/* 主键id */
	id: number;

	/* 当前审核人姓名 */
	curAuditName: string;

	/* 流程实例ID */
	approvalFdId: string;

	/* 流程编号 */
	approvalCode: string;

	/* 任务名称 */
	name: string;

	/* 目标计划名称 */
	targetPlanName: string;

	/* 目标计划周期 */
	targetPlanPeriod: number;

	/* 目标计划周期(子周期) */
	targetPlanYear: string;

	/* 周期 */
	targetCycle: string;

	/* 提交版本 */
	submitVersion: string;

	/* 状态0：流程中1：已中止 2：已结束 */
	status: number;

	/* 状态0：流程中1：已中止 2：已结束 */
	statusStr: string;

	/* 发起人姓名 */
	submitUserName: string;

	/* 发起时间 */
	submitDate: Record<string, unknown>;
}

/** 发起 OA 流程参数 */
export interface InitiateOaProcessParams {
	effTaskSubmissionId: number | string;
}

// ==================== 操作日志相关 ====================

/** 操作日志内容选项 */
export interface OperationLogContentOption {
	data: {
		text: string;
		type: string;
		wrap: boolean;
	};
	style: any;
}

/** 操作日志列表项 */
export interface OperationLogItem {
	id: string;
	bizId: string;
	bizObject: {
		bizCode: string;
		objName: string;
	};
	title: string;
	action: {
		value: string;
		type: string;
		code: string;
	};
	content: {
		options: OperationLogContentOption[];
	};
	operator: {
		id: string;
		name: string;
		phone: string;
	};
	groupInfo: any;
	operateTime: string;
}

/** 获取操作日志列表参数 */
export interface FetchOperationLogListParams {
	bizId: number;
	bizCode: string;
}

// ==================== 调整历史详情相关（复杂嵌套类型） ====================

/** 确认周期项 */
export interface ConfirmPeriodItem {
	/** 映射数据源 */
	id: number;
	/** 周期 code */
	code: number;
	/** 结果值 */
	resultValue: number;
	/** 提交版本 */
	submitVersion: string;
	/** 是否支持修改（0:否 1:是） */
	supportModify: number;
}

/** 拆解对象节点 */
export interface InnerAllNode {
	/** 子结点 */
	child: string;
	/** 版本填报记录 id */
	id: number;
	/** 拆解对象编码 */
	targetOrgCode: string;
	/** 拆解对象名称 */
	targetOrgName: string;
	/** 负责人姓名 */
	responsiblePersonName: string;
	/** 同期值 */
	samePeriodValue: number;
	/** 参考值 */
	referenceValue: number;
	/** 是否允许修改年度目标值 0：不允许 1：允许 */
	annualTargetValueChange: number;
	/** 年度目标值 */
	annualTargetValue: number;
	/** 偏差值 */
	deviationValue: number;
	/** 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;
	/** 备注 */
	remarks: string;
	/** 确认周期 */
	confirmPeriodAll: ConfirmPeriodItem[];
	/** 上级汇总权重 */
	parentSummaryWeight: number;
}

/** 周期配置项 */
export interface PeriodConfigItem {
	/** id */
	id: number;
	/** 名称 */
	name: string;
}

/** 指标第二层（各指标） */
export interface HisListSecondLayerItem {
	/** 指标名称 */
	name: string;
	/** 拆解指标id */
	indicatorListId: number;
	/** 数据单位 */
	unitName: string;
	/** 拆解对象集 */
	innerAllNodes: InnerAllNode[];
	/** 周期 */
	period: PeriodConfigItem[];
}

/** 指标第一层（主责部门） */
export interface HisListFirstLayerItem {
	/** 主责部门 Code，枚举值[IndicatorResponsibleDepartmentCode]。公共接口，根据当前枚举值进行获取对应值信息 */
	responsibleDepartmentCode: number;
	/** 主责部门名称 */
	responsibleDepartmentName: string;
	/** 第二层 各指标 */
	hisListSecondLayers: HisListSecondLayerItem[];
}

/** 调整历史详情数据 */
export interface ConfirmUserIdsIndicatorCountHisAdjustAllDataRes {
	/** 确认意见 */
	confirmationOpinion: string;
	/** 第一层 主责部门 */
	hisListFirstLayer: HisListFirstLayerItem[];
}

/** 调整历史详情完整响应 */
export interface ConfirmUserIdsIndicatorCountHisAdjustAllRes {
	/** 返回码 */
	code: number;
	/** 返回码说明 */
	msg: string;
	/** 返回数据 */
	data: ConfirmUserIdsIndicatorCountHisAdjustAllDataRes;
}

/** 调整子周期表头查询参数 */
export interface ConfirmUserIdsIndicatorCountHisHeadV1Params {
	/** 提交任务id */
	effTaskSubmissionId: number;
	/** 拆解对象code */
	targetOrgCode: string;
	/** 确认人id */
	responsiblePersonId: number;
	/** 是否全周期 true：是 false：不是 */
	allPeriodFlag?: boolean;
}

/** 调整子周期表头项 */
export interface ConfirmUserIdsIndicatorCountHisHeadV1Item {
	/** id */
	id: number;
	/** 名称 */
	name: string;
}
