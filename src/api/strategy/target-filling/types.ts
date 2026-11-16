// 目标填报任务项
export interface SubmitUserTask {
	/* 主键id */
	id: number;
	/* 任务名称 */
	name: string;
	/* 目标计划名称 */
	targetPlanName: string;
	/* 填报说明 */
	remark: string;
	/* 子周期 */
	subperiod: number;
	/* 年份 */
	year: string;
	/* 目标周期 */
	targetCycle: string;
	/* 填报状态0:未完成 1：进行中 2：已完成 3：已提交 4：已停用 */
	fillingStatus: number;
	/* 填报状态说明 */
	fillingStatusStr: string;
	/* 填报开始时间 */
	startTime: string | Record<string, unknown>;
	/* 填报截止时间 */
	deadline: string | Record<string, unknown>;
	/* 更新时间 */
	updateTime: string | Record<string, unknown>;
	/* 主责人id */
	responsibleUserId: number;
	/* 主责人姓名 */
	responsibleUserName: string;
	/* 权限 0:管理 1：编辑 参考枚举[UserDataPermDataPerm] */
	perm: number;
}

// 目标填报任务列表查询参数
export interface SubmitUserTaskListParams {
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
	/* 填报任务记录id */
	submitUserId?: number;
	/* 名称精准查询 true:精准 */
	preciseNameFlag?: boolean;
	/* 任务名称 */
	name?: string;
	/* 目标计划名称 */
	targetPlanName?: string;
	/* 子周期 */
	subperiod?: number;
	/* 目标周期 */
	year?: string;
	/* 填报状态0:未完成 1：进行中 2：已完成 3：已提交 4：已停用 */
	fillingStatus?: number;
	/* 主责人姓名 */
	responsibleUserName?: string;
	/* 1：主责计划 2：协作计划 */
	queryModelType?: number;
	/* 兼容页面层现有扩展查询字段 */
	[key: string]: unknown;
}

// 目标填报任务列表分页响应
export interface SubmitUserTaskListRes {
	/* 当前页 */
	pageNum: number;
	/* 每页数量 */
	pageSize: number;
	/* 总记录数 */
	total: number;
	/* 总页数 */
	pages: number;
	/* 结果集 */
	list: SubmitUserTask[];
	/* 是否为空 */
	emptyFlag: boolean;
}

export interface UserIndicatorTreeRes {
	/* 主责部门 */
	responsibleDepartment: string;

	/* 指标编辑信息 */
	innerDetailList: {
		/* 配置指标组标识 */
		tag: number;

		/* 拆解指标id */
		id: number;

		/* 指标名称 */
		name: string;

		/* 单位 */
		unitName: string;

		/* 指标id */
		indicatorId: number;

		/* 状态（0:未提交 1:已提交） */
		status: number;

		/* 指标类型 0:基础指标 1：复合指标 */
		type: number;

		/* 标识 */
		typeStr: string;

		/* 填报数量 */
		fillInQuantity: number;

		/* 填报标签 */
		fillInLabels: string;
	}[];
}

// (右边树)目标填报>全部指标>总 - 返回数据
export interface ListOverviewTreeMData {
	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 项目类型 */
	orgCodeStatus: string;

	/* 项目类型 */
	orgCodeStatusStr: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 拆解对象code */
	targetOrgCode: string;

	/* 是否是构树元素 0：否 1：是 */
	treeElement: number;

	/* 分页节点：1-分页，0-不分页，默认0 */
	paginationNode: number;

	/* 是否双算数据 0：不是 1：是 */
	doubleCounting: number;

	/* map<SubmitIndicatorList表id,map<总目标值 */
	mapMap: {
		/* 主键id */
		id: number;

		/* 总目标值 */
		totalTargetAmount: number;

		/* 是否允许修改总目标值 0：不允许 1：允许 */
		totalTargetAmountChange: number;
	};

	/* */
	children: Record<string, unknown>[];
}

export interface IndicatorDetailUpperRight {
	targetOrgName: string;
	targetOrgNum: string;
	indicatorName: string;
	targetValue: number;
	targetGap: number;
	gapReason: string | null;
	checkStatus: boolean;
	curEditorName?: string;
	curEditor?: number | string;
}

export interface TargetFollowUpRes {
	/* 主键id */
	id: number;

	/* 文件名 */
	fileName: string;

	/* 桶名称 */
	bucketName: string;

	/* 提交版本 */
	submitVersion: string;

	/* 任务名称 */
	name: string;

	/* 提交时间 */
	submitDate: string;

	/* 提交指标描述 */
	submitIndicators: string[];

	/* 是否进行确认(0-否,1-是) */
	needConfirmation: number;

	/* 是否进行确认(0-否,1-是) */
	needConfirmationStr: string;

	/* 确认子周期 */
	confirmationCycle: number[];

	/* 确认子周期 */
	confirmationCycleStr: string;

	/* 是否流程报批(0-否,1-是) */
	needApproval: number;

	/* 是否流程报批(0-否,1-是) */
	needApprovalStr: string;

	/* 是否允许流程报批(0-否,1-是) */
	allowApproval: number;

	/* 流程报批类型 0：集团报批 1：地区内部报批 */
	processApprovalType: number;

	/* 流程报批类型 0：集团报批 1：地区内部报批 */
	processApprovalTypeStr: string;

	/* 当前步骤(0-未开始,1-步骤一,2-步骤二,...) */
	currentStep: number;

	/* 流程定义(存储整个流程的步骤配置) */
	workflowDefinition: {
		/* 当前步骤(0-未开始,1-步骤一,2-步骤二,...) */
		step: number;

		/* 步骤名字 */
		stepName: string;

		/* 流程 0:下发前确认 1:各组织负责人目标值确认 */
		stepType: number;

		/* 流程 0:下发前确认 1:各组织负责人目标值确认 */
		stepTypeStr: string;

		/* 时间 */
		time: string;

		/* 进度状态 */
		status: number;

		/* 进度状态 */
		statusStr: string;

		/* 是否允许催办 true:催办 false:不催办 */
		urgentStatus: boolean;

		/* 确认人姓名 */
		confirmName: string;

		/* 确认人 */
		confirmUserIds: {
			/* 负责人id */
			responsiblePersonId: number;

			/* 拆解对象code */
			targetOrgCode: string;
		}[];
	}[];

	/* 流程实例ID */
	approvalFldId: string;

	/* 兼容旧接口返回的流程实例ID字段 */
	approvalFdId?: string;

	/* 确认说明 */
	confirmationInstructions: string;

	/* 是否已完成 */
	isCompleted: number;

	/* 是否已取消 */
	isCancel: number;

	/* 是否可以作废 */
	canBeVoided: boolean;

	/* 创建者 */
	createBy: string;

	/* 创建者 */
	createByName: string;
}

export interface TargetFollowUpVersionRes {
	/* 版本信息 */
	data: Record<string, unknown>;
}

export interface TargetFollowUpConfirmedParams {
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

	/* 提交任务id */
	effTaskSubmissionId: number;

	/* 步骤 */
	step: number;

	/* 拆解对象名称 */
	targetOrgName?: string;

	/* 负责人姓名 */
	responsiblePersonName?: string;
}

export interface TargetFollowUpConfirmedResponseItem {
	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 拆解对象code */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 确认指标数量 */
	number: number;

	/* 填报任务ids */
	ids: Record<string, unknown>[];

	/* 确认任务id */
	effStepConfirmationRecordId: number;

	/* 步骤状态 */
	stepStatus: number;

	/* 状态 */
	statusStr: string;
}

export type SubmitUserIndicatorAnnualTargetValueRes = Record<string, number>;

export interface HisPageRes {
	/* 当前页 */
	pageNum: number;

	/* 每页的数量 */
	pageSize: number;

	/* 总记录数 */
	total: number;

	/* 总页数 */
	pages: number;

	/* 结果集 */
	list: {
		/* 拆解对象id */
		targetOrgCode: string;

		/* 拆解对象名称 */
		targetOrgName: string;

		/* 负责人姓名 */
		responsiblePersonName: string;

		/* 指标名称 */
		indicatorName: string;

		/* 年度目标值 */
		annualTargetValue: number;

		/* 备注 */
		remarks: string;

		/* 确认周期 */
		confirmPeriod: {
			/* 映射数据源 */
			id: number;

			/* 周期code */
			code: number;

			/* 结果值 */
			resultValue: number;

			/* 是否支持修改（0:否 1:是） */
			supportModify: number;
		}[];

		/* 上级汇总权重 */
		parentSummaryWeight: number;

		/* 状态 */
		status: number;

		/* 状态 */
		statusStr: string;
	}[];

	/* 是否为空 */
	emptyFlag: boolean;
}

export interface ChildIndicatorSummary {
	samePeriodSum: number;
	referenceSum: number;
	annualTargetSum: number;
	deviationSum: number;
	period: Record<string, number>;
}

export interface IndicatorSubmitUserViewDataResponse {
	unitName: string;
	oepOrgUuid: string;
	orgCodeStatus: string;
	targetOrgCode: string;
	targetOrgName: string;
	indicatorName: string;
	responsiblePersonName: string;
	annualTargetValue: number;
	periodMap: Record<string, number>;
	parentSummaryWeight: number;
	remarks: string;
	submitVersion: string;
	submitUserName: string;
	children: Record<string, IndicatorSubmitUserViewDataResponse>;
}

export interface IndicatorSubmitUserViewDataHeadResponse {
	subperiodName: string;
	periods: {
		id: number;
		name: string;
	}[];
}

export interface TargetFollowUpConfirmedStatisticsParams {
	/* 提交任务id */
	effTaskSubmissionId: number;

	/* 步骤 */
	step: number;
}

export interface TargetFollowUpConfirmedStatisticsRes {
	/* 总确认数 */
	total: number;

	/* 未开始 */
	notStarted: number;

	/* 未确认 */
	unconfirmed: number;

	/* 已驳回 */
	rejected: number;

	/* 已确认 */
	confirmed: number;
}

export interface ConfirmUserIdsIndicatorCountPageParams {
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

	/* 填报任务ids */
	indicatorListOverviewIds: Record<string, unknown>[];

	/* 子周期codes */
	subperiods: Record<string, unknown>[];
}

export interface ConfirmUserIdsIndicatorCountHisPageParams {
	/* 提交任务id */
	effTaskSubmissionId: number;

	/* 拆解对象code */
	targetOrgCode: string;

	/* 确认人id */
	responsiblePersonId: number;
}

export interface ConfirmUserIdsIndicatorCountHisPageItem {
	/* 主键id */
	id: number;

	/* 指标名称 */
	name: string;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 数据单位 */
	unitName: string;

	/* k:周期code v:值 */
	map: Record<string, unknown>;

	/* 备注 */
	remarks: string;
}

export interface ConfirmUserIdsIndicatorCountHisHeadItem {
	/* id */
	id: number;

	/* 名称 */
	name: string;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustParams {
	/* 提交任务id */
	effTaskSubmissionId: number;

	/* 拆解对象code */
	targetOrgCode: string;

	/* 确认人id */
	responsiblePersonId: number;

	/* 是否全周期 true：是 false：不是 */
	allPeriodFlag?: boolean;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustPeriodItem {
	/* 主键id */
	id: number;

	/* 周期code */
	periodCode: number;

	/* 结果值 */
	resultValue: number;

	/* 是否支持修改（0:否 1:是） */
	supportModify: 0 | 1;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustListItem {
	/* 主键id */
	id: number;

	/* 拆解指标id */
	indicatorListId: number;

	/* 指标名称 */
	name: string;

	/* 参考值 */
	referenceValue: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 数据单位 */
	unitName: string;

	/* k:周期code v:对象 */
	map: Record<string, ConfirmUserIdsIndicatorCountHisAdjustPeriodItem>;

	/* 偏差值 */
	deviationValue: number;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 备注 */
	remarks: string;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustRes {
	/* 确认记录id */
	effStepConfirmationRecordId: number;

	/* 确认意见 */
	confirmationOpinion: string;

	/* 记录 */
	listBOS: ConfirmUserIdsIndicatorCountHisAdjustListItem[];
}

export interface ConfirmUserIdsIndicatorCountHisAdjustPutParams {
	/* 确认记录id */
	effStepConfirmationRecordId: number;

	/* 修改表单 */
	adjustFormList: {
		/* id */
		id: number;

		/* 参考值 */
		referenceValue?: number;

		/* 年度目标值 */
		annualTargetValue?: number;

		/* 偏差值 */
		deviationValue?: number;

		/* 是否偏离偏差 0:不是 1：是 */
		deviationFormulaFlag?: number;

		/* k:周期code v:值 */
		map?: Record<string, unknown>;

		/* 备注 */
		remarks?: string;
	}[];

	/* k:拆解对象code vk:基础指标id,v:值 */
	basicIndicatorMap?: Record<string, Record<string, string>>;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustPutRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: boolean;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustReferenceValue {
	/* 目标方式（1:按基础指标计算提供参考值 2:按同期值浮动比例提供参考值） */
	targetMethod: number;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 指标名称 */
	indicatorName: string;

	/* 参考值 */
	referenceValue: number;

	/* 公式Json */
	formulaBO: {
		/* 源公式(填报值中可使用) */
		formulaS: string;

		/* 源公式描述 */
		formulaSDesc: string;

		/* 平铺公式(快速计算参考值) */
		formulaT: string;

		/* 平铺公式描述 */
		formulaTDesc: string;

		/* 基础指标idSets */
		basicIndicatorIdSets: Record<string, unknown>[];

		/* 配置指标idSets */
		confDetailsIdSets: Record<string, unknown>[];
	};

	/* 基础指标集 */
	basicIndicatorInnerList: {
		/* 基础指标名称 */
		basicIndicatorName: string;

		/* 填报基础指标id */
		id: number;

		/* 值 */
		value: number;

		/* 单位 */
		unitName: string;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;
	}[];

	/* 按同期值浮动比例提供参考值 */
	floatingRatioReferenceValueInner: {
		/* 基础指标名称 */
		basicIndicatorName: string;

		/* 单位 */
		unitName: string;

		/* 默认值 */
		value: number;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;
	};
}

export interface ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalParams {
	/* 填报版本记录id */
	listOverviewHisId: number;

	/* k:基础指标id v:值 */
	map: Record<string, unknown>;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageParams {
	/* 填报版本记录id */
	listOverviewHisId: number;

	/* k:基础指标id v:值 */
	map: Record<string, unknown>;

	/* 当前拆解对象关联的所有基础指标 k:基础指标id v:值 */
	basicIndicatorMap: Record<string, unknown>;

	/* 当前拆解对象下所有同拆解对象数据k:id */
	calLinkageInnerMap: Record<
		string,
		{
			/* 版本填报记录id */
			listOverviewHisId?: number;

			/* 同期值 */
			samePeriodValue?: number;

			/* 参考值 */
			referenceValue?: number;

			/* 年度目标值 */
			annualTargetValue?: number;
		}
	>;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageItem {
	/* 参考值 */
	referenceValue: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 偏差值 */
	deviationValue: number;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;

	/* k:周期code v:周期值 */
	periodic: Record<string, number>;

	/* k:基础指标id v:值 */
	basicIndicatorMap: Record<string, unknown> | null;
}

export type ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes = Record<
	string,
	ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageItem
>;

export interface UserIndicatorBasicDetailsResData {
	/* 目标方式（1:按基础指标计算提供参考值 2:按同期值浮动比例提供参考值） */
	targetMethod: number;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 指标名称 */
	indicatorName: string;

	/* 参考值 */
	referenceValue: number;

	/* 公式Json */
	formulaBO: {
		/* 源公式(填报值中可使用) */
		formulaS: string;

		/* 源公式描述 */
		formulaSDesc: string;

		/* 平铺公式(快速计算参考值) */
		formulaT: string;

		/* 平铺公式描述 */
		formulaTDesc: string;

		/* 基础指标idSets */
		basicIndicatorIdSets: Record<string, unknown>[];

		/* 配置指标idSets */
		confDetailsIdSets: Record<string, unknown>[];
	};

	/* 基础指标集 */
	basicIndicatorInnerList: {
		/* 基础指标名称 */
		basicIndicatorName: string;

		/* 填报基础指标id */
		id: number;

		/* 值 */
		value: number;

		/* 单位 */
		unitName: string;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;
	}[];

	/* 按同期值浮动比例提供参考值 */
	floatingRatioReferenceValueInner: {
		/* 基础指标名称 */
		basicIndicatorName: string;

		/* 单位 */
		unitName: string;

		/* 值 */
		value: number;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;
	};
}

export interface UserIndicatorBasicCalParams {
	/* id */
	id: number;

	/* 值 */
	value: number;
}

// (计算)目标填报>填报>参考值 - 参数
export interface UserIndicatorCalParams {
	/* 填报记录id */
	listOverviewId: number;

	/* 计算参数 */
	forms?: {
		/* id */
		id: number;

		/* 值 */
		value: number;
	}[];
}

// (右边树)目标填报>全部指标>总>修改负责人信息 - 参数
export interface UpResponsiblePersonMsgParams {
	/* 拆解对象code */
	targetOrgCode: string;

	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 拆解子任务id 计划id */
	effTaskIndicatorSubmitUserId: number | string;
}

export interface UserIndicatorBasicUpParams {
	/* 填报记录id */
	effTaskIndicatorSubmitIndicatorListOverviewId: number;

	/* 计算参数 */
	list?: {
		/* id */
		id: number;

		/* 值 */
		value: number;
	}[];

	/* 浮动比例值 */
	floatValue?: number;
}

// (计算)目标填报>填报>基础指标(特殊) - 参数
export interface UserIndicatorSpecialCalParams {
	/* 填报记录id */
	effTaskIndicatorSubmitIndicatorListOverviewId: number;

	/* 值 */
	val: number;
}

// (列表)目标填报>填报>双算 - 参数
export interface DoubleCountingListParams {
	/* 填报记录id */
	listOverviewId: number;

	/* 上级主数据编码 */
	targetOrgCodeP?: string;
}

// (列表)目标填报>填报>双算 - 返回数据项
export interface DoubleCountingListItem {
	/* 自增主键 */
	id: number;

	/* 是否双算数据 0：不是 1：是 */
	doubleCounting: number;

	/* 上级组织UUID */
	oepOrgUuidP: string;

	/* 上级主数据编码 */
	targetOrgCodeP: string;

	/* 上级归属 */
	targetOrgNameP: string;

	/* 所属组织code */
	ancestorcodep: string;

	/* 所属组织名称 */
	ancestornamep: string;

	/* 上级汇总权重 */
	parentSummaryWeight: number;
}

// (提交)目标填报>填报>双算 - 参数
export interface DoubleCountingSubmitParams {
	/* 填报记录id */
	effTaskIndicatorSubmitIndicatorListOverviewId: number;

	/* 删除记录 */
	delIds?: number | string[];

	/* 新增记录 */
	addRecords?: {
		/* 是否双算数据 0：不是 1：是 */
		doubleCounting?: number;

		/* 上级组织UUID */
		oepOrgUuidP?: string;

		/* 上级主数据编码 */
		targetOrgCodeP?: string;

		/* 上级归属 */
		targetOrgNameP?: string;

		/* 所属组织code */
		ancestorcodep?: string;

		/* 所属组织名称 */
		ancestornamep?: string;

		/* 上级汇总权重 */
		parentSummaryWeight: number;
	}[];

	/* 修改记录 */
	upRecords?: {
		/* id */
		id?: number;

		/* 上级汇总权重 */
		parentSummaryWeight: number;
	}[];
}

export interface SubmitUserIndicatorDetailByIdRes {
	/* 项目类型 */
	orgCodeStatus: string;

	/* 项目类型 */
	orgCodeStatusStr: string;

	/* 参考值公式描述 */
	referenceValueDesc: string;

	/* 主键id */
	id: number;

	/* 拆解对象id */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 更新者 */
	updateByName: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 子结点信息 */
	children: string;

	/* 基础指标 */
	basicIndicator: {
		/* id */
		id: number;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;

		/* 基础指标值 */
		value: number;

		/* 调整值 */
		adjustmentValue: number;

		/* 数据来源（1:数据资产 0:手动录入） */
		dataSourceType: number;
	};

	/* 规划填报 */
	periodicReporting: {
		/* 主键id */
		id: number;

		/* 周期code */
		periodCode: number;

		/* 结果值 */
		resultValue: number;

		/* 是否支持修改（0:否 1:是） */
		supportModify: number;
	};

	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 同期值 */
	samePeriodValue: number;

	/* 参考值 */
	referenceValue: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;

	/* 是否允许修改年度目标值 0：不允许 1：允许 */
	annualTargetValueChange: number;

	/* 偏差值 */
	deviationValue: number;

	/* 上级汇总权重 */
	parentSummaryWeight: number;

	/* 备注 */
	remarks: string;

	/* 是否是构树元素 0：否 1：是 */
	treeElement: number;

	/* 当前节点是否成为拆解对象 0：否 1：是 */
	isDisassembleObject: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	status: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	statusStr: string;
}

// (分页)目标填报>填报>子 - 参数
export interface UserIndicatorDetailDisassembleChildParams {
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

	/* 拆解指标id */
	id: number | string;
}

export interface UserIndicatorDetailDisassembleChildItem {
	/* 项目类型 */
	orgCodeStatus: string;

	/* 项目类型 */
	orgCodeStatusStr: string;

	/* 参考值公式描述 */
	referenceValueDesc: string;

	/* 主键id */
	id: number;

	/* 拆解对象id */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 更新者 */
	updateByName: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 子结点信息 */
	children: string;

	/* 基础指标 */
	basicIndicator: {
		/* id */
		id: number;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;

		/* 基础指标值 */
		value: number;

		/* 调整值 */
		adjustmentValue: number;

		/* 数据来源（1:数据资产 0:手动录入） */
		dataSourceType: number;
	};

	/* 规划填报 */
	periodicReporting: {
		/* 主键id */
		id: number;

		/* 周期code */
		periodCode: number;

		/* 结果值 */
		resultValue: number;

		/* 是否支持修改（0:否 1:是） */
		supportModify: number;
	};

	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 同期值 */
	samePeriodValue: number;

	/* 参考值 */
	referenceValue: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;

	/* 是否允许修改年度目标值 0：不允许 1：允许 */
	annualTargetValueChange: number;

	/* 偏差值 */
	deviationValue: number;

	/* 上级汇总权重 */
	parentSummaryWeight: number;

	/* 备注 */
	remarks: string;

	/* 是否是构树元素 0：否 1：是 */
	treeElement: number;

	/* 当前节点是否成为拆解对象 0：否 1：是 */
	isDisassembleObject: number;

	/* 是否双算记录 0：否 1：是 */
	doubleCountingRecord: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	status: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	statusStr: string;
}

// (分页)目标填报>填报>子 - 响应数据
export interface UserIndicatorDetailDisassembleChildRes {
	/* 当前页 */
	pageNum: number;

	/* 每页的数量 */
	pageSize: number;

	/* 总记录数 */
	total: number;

	/* 总页数 */
	pages: number;

	/* 结果集 */
	list: UserIndicatorDetailDisassembleChildItem[];

	/* 是否为空 */
	emptyFlag: boolean;
}

// (列表)目标填报>填报>子(前置双算记录) - 参数
export interface UserIndicatorListChildDoubleCountingParams {
	/* 拆解指标id */
	id: number;
}

export interface UserIndicatorListChildDoubleCountingItem {
	/* 项目类型 */
	orgCodeStatus: string;

	/* 项目类型 */
	orgCodeStatusStr: string;

	/* 参考值公式描述 */
	referenceValueDesc: string;

	/* 主键id */
	id: number;

	/* 拆解对象id */
	targetOrgCode: string;

	/* 拆解对象名称 */
	targetOrgName: string;

	/* 更新者 */
	updateByName: string;

	/* 更新时间 */
	updateTime: Record<string, unknown>;

	/* 子结点信息 */
	children: string;

	/* 基础指标 */
	basicIndicator: {
		/* id */
		id: number;

		/* 是否支持调整（0:否 1:是） */
		supportAdjustment: number;

		/* 基础指标值 */
		value: number;

		/* 调整值 */
		adjustmentValue: number;

		/* 数据来源（1:数据资产 0:手动录入） */
		dataSourceType: number;
	};

	/* 规划填报 */
	periodicReporting: {
		/* 主键id */
		id: number;

		/* 周期code */
		periodCode: number;

		/* 结果值 */
		resultValue: number;

		/* 是否支持修改（0:否 1:是） */
		supportModify: number;
	};

	/* 负责人id */
	responsiblePersonId: number;

	/* 负责人姓名 */
	responsiblePersonName: string;

	/* 同期值 */
	samePeriodValue: number;

	/* 参考值 */
	referenceValue: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number;

	/* 是否允许修改年度目标值 0：不允许 1：允许 */
	annualTargetValueChange: number;

	/* 偏差值 */
	deviationValue: number;

	/* 上级汇总权重 */
	parentSummaryWeight: number;

	/* 备注 */
	remarks: string;

	/* 是否是构树元素 0：否 1：是 */
	treeElement: number;

	/* 当前节点是否成为拆解对象 0：否 1：是 */
	isDisassembleObject: number;

	/* 是否双算记录 0：否 1：是 */
	doubleCountingRecord: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	status: number;

	/* 是否提交0:未提交 1:进行中 2:已完成 3：被驳回 4：被动变更 */
	statusStr: string;
}

// (列表)目标填报>填报>子(前置双算记录) - 响应数据
export interface UserIndicatorListChildDoubleCountingRes {
	/* 结果集 */
	data: UserIndicatorListChildDoubleCountingItem[];
}

export interface ConfirmUserIdsIndicatorCountHisAdjustAllRes {
	/* 确认意见 */
	confirmationOpinion: string;

	/* 第一层 主责部门 */
	hisListFirstLayer: {
		/* 主责部门Code，枚举值[IndicatorResponsibleDepartmentCode]。公共接口，根据当前枚举值进行获取对应值信息 */
		responsibleDepartmentCode: number;

		/* 主责部门Code，枚举值[IndicatorResponsibleDepartmentCode]。公共接口，根据当前枚举进行获取对应值信息 */
		responsibleDepartmentName: string;

		/* 第二层 各指标 */
		hisListSecondLayers: {
			/* 指标名称 */
			name: string;

			/* 数据单位 */
			unitName: string;

			/* 指标id */
			indicatorListId: string;

			/* 拆解对象集 */
			innerAllNodes: {
				/* 子结点 */
				child: string;

				/* 版本填报记录id */
				id: number;

				/* 拆解对象编码 */
				targetOrgCode: string;

				/* 拆解对象名称 */
				targetOrgName: string;

				/* 负责人姓名 */
				responsiblePersonName: string;

				/* 同期值 */
				samePeriodValue: number;

				/* 参考值 */
				referenceValue: number;

				/* 是否允许修改年度目标值 0：不允许 1：允许 */
				annualTargetValueChange: number;

				/* 年度目标值 */
				annualTargetValue: number;

				/* 偏差值 */
				deviationValue: number;

				/* 是否偏离偏差 0:不是 1：是 */
				deviationFormulaFlag: number;

				/* 备注 */
				remarks: string;

				/* 确认周期 */
				confirmPeriodAll: {
					/* 映射数据源 */
					id: number;

					/* 周期code */
					code: number;

					/* 结果值 */
					resultValue: number;

					/* 是否支持修改（0:否 1:是） */
					supportModify: number;
				}[];

				/* 上级汇总权重 */
				parentSummaryWeight: number;
			}[];

			/* 周期 */
			period: {
				/* id */
				id: number;

				/* 名称 */
				name: string;
			}[];
		}[];
	}[];
}

export interface ConfirmUserIdsIndicatorCountHisAdjustAllCalParams {
	/* id */
	id: number;

	/* 值 */
	value: number;

	/* 当前拆解对象关联的所有基础指标 k:基础指标id v:值 */
	basicIndicatorMap: Record<string, unknown>;

	/* 当前拆解对象下所有同拆解对象数据k:id */
	hisAdjustAllCalInnerMap: Record<
		string,
		{
			/* 版本填报记录id */
			listOverviewHisId?: number;

			/* 参考值 */
			referenceValue?: number;

			/* 年度目标值 */
			annualTargetValue?: number;
		}
	>;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustAllCalRes {
	/* 记录id */
	id: number;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 偏差值 */
	deviationValue: number | null;

	/* 是否偏离偏差 0:不是 1：是 */
	deviationFormulaFlag: number | null;

	/* 确认周期 */
	map: Record<string, unknown>;
}

export type ConfirmUserIdsIndicatorCountHisAdjustAllCalData =
	| ConfirmUserIdsIndicatorCountHisAdjustAllCalRes
	| Record<string, ConfirmUserIdsIndicatorCountHisAdjustAllCalRes>;

export interface ConfirmUserIdsIndicatorCountHisAdjustAllSubmitParams {
	/* 提交任务id */
	effTaskSubmissionId: number;

	/* 修改表单 */
	adjustFormList?: {
		/* id */
		id: number;

		/* 参考值 */
		referenceValue?: number;

		/* 年度目标值 */
		annualTargetValue?: number;

		/* k:周期code v:值 */
		map?: Record<string, unknown>;

		/* 备注 */
		remarks?: string;
	}[];

	/* k:拆解对象code vk:基础指标id,v:值 */
	basicIndicatorMap: Record<string, Record<string, string>>;
}

export interface ConfirmUserIdsIndicatorCountHisAdjustAllSubmitRes {
	/* 返回数据 */
	data: boolean;
}

export interface NoticeChangeRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: {
		/* 自增主键ID */
		id: number;

		/* 变更类型 0：目标计划变更 1：上级目标值变动 2：组织变动-停用 3：组织变动-调整 */
		changeType: number;

		/* 变更类型 0：目标计划变更 1：上级目标值变动 2：组织变动-停用 3：组织变动-调整 */
		changeTypeStr: string;

		/* 指标名称 */
		indicatorName: string;

		/* 变更内容 */
		changeRemark: string;

		/* 变更时间 */
		changeTime: Record<string, unknown>;
	}[];
}

export interface NoticeChangeCountRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: number;
}

export interface NoticeChangeUpRes {
	/* 返回码 */
	code: number;

	/* 返回码说明 */
	msg: string;

	/* 返回数据 */
	data: boolean;
}

export interface ConfirmUserIdsIndicatorCount {
	/* 指标名称 */
	name: string;

	/* 年度目标值 */
	annualTargetValue: number;

	/* 数据单位 */
	unitName: string;

	/* k:周期code v:值 */
	map: Record<string, unknown>;
}

export interface UserIndicatorDetailDisassembleSubTreeItem {
	/* */
	id: string;

	/* */
	name: string;

	/* parenCode */
	parentCode: string;

	/* 是否可选 true:可选 false:不可选 */
	canChoose: boolean;

	/* 全路劲 */
	fullRoadStrength: string;

	/* */
	data: string;

	/* */
	children: Record<string, unknown>[];
}

export interface UserIndicatorTreeSubmitIndicatorsItem {
	/* 主责部门 */
	responsibleDepartment: string;

	/* 指标编辑信息 */
	innerDetailList: {
		/* 拆解指标id */
		id: number;

		/* 指标名称 */
		name: string;

		/* 单位 */
		unitName: string;

		/* 指标id */
		indicatorId: number;

		/* 状态（0:未提交 1:已提交） */
		status: number;

		/* 指标类型 0:基础指标 1：复合指标 */
		type: number;

		/* 标识 */
		typeStr: string;

		/* 填报数量 */
		fillInQuantity: number;

		/* 填报记录ids */
		listOverviewIds: Record<string, unknown>[];

		/* 填报标签(进行中、已校验) */
		fillInLabels: string;
	}[];
}

// (校验)目标填报>填报>提交>下一步
export interface UserIndicatorListCheckConfDetailGroupParams {
	/* 拆解指标ids */
	indicatorListIds: string[];

	/* 待提交审核的填报记录 */
	indicatorListOverviewIds: React.Key[];
}

// (校验)目标填报>填报>提交>下一步
export type UserIndicatorListCheckConfDetailGroupRes = ApiResponse<boolean>;

// (提交)目标填报>填报 - 流程定义步骤中的确认人
export interface ConfirmSubmitWorkflowConfirmUser {
	/* 负责人id */
	responsiblePersonId?: number;
	/* 拆解对象code */
	targetOrgCode?: string;
}

// (提交)目标填报>填报 - 流程定义步骤
export interface ConfirmSubmitWorkflowStep {
	/* 当前步骤(0-未开始,1-步骤一,2-步骤二,...) */
	step: number;
	/* 步骤名字 */
	stepName: string;
	/* 流程 0:下发前确认 1:各组织负责人目标值确认 */
	stepType: number;
	/* 确认人 */
	confirmUserIds: ConfirmSubmitWorkflowConfirmUser[];
}

// (提交)目标填报>填报
export interface ConfirmSubmitParams {
	/* 目标分解任务id */
	effTaskIndicatorSubmitUserId: number | string | undefined;
	/* 提交版本 */
	submitVersion: string;
	/* 提交时间 */
	submitDate: any;
	/* 任务名称 */
	name: string;
	/* 提交指标描述(提交指标) */
	submitIndicators: any[];
	/* 是否进行确认(0-否,1-是) */
	needConfirmation: number;
	/* 确认周期 */
	confirmationCycle?: any[];
	/* 是否流程报批(0-否,1-是) */
	needApproval: number;
	/* 流程报批类型 0：集团报批 1：地区内部报批 */
	processApprovalType?: number;
	/* 当批次需要审核的所有填报ids */
	indicatorListOverviewIds: React.Key[];
	/* 流程定义(存储整个流程的步骤配置) */
	workflowDefinition?: ConfirmSubmitWorkflowStep[];
	/* 确认说明 */
	confirmationInstructions?: string;
}
