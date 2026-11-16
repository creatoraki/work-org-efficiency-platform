/**
 * 组织调整画布 API 类型
 */

/**
 * 组织关键绩效指标
 */
export interface OrgAdjustmentTaskKpiItem {
	/** 组织id */
	orgId: string;

	/** 组织名称 */
	orgName: string;

	/** 关键绩效指标名称 */
	kpiName: string;

	/** 关键绩效指标值 */
	kpiValue: string;
}

export type OrgAdjustmentTaskDateValue = string | Record<string, unknown> | null;

/**
 * 子节点变更对比元数据
 */
export type OrgAdjustmentTaskChildIdLike = string | number | Record<string, unknown>;

export interface OrgAdjustmentTaskCompareMeta {
	/** 变更前子节点id列表 */
	beforeChildIds: OrgAdjustmentTaskChildIdLike[];

	/** 变更后子节点id列表 */
	afterChildIds: OrgAdjustmentTaskChildIdLike[];

	/** 变更前有效子节点id列表 */
	beforeEffectiveChildIds?: OrgAdjustmentTaskChildIdLike[];

	/** 变更后有效子节点id列表 */
	afterEffectiveChildIds?: OrgAdjustmentTaskChildIdLike[];
}

/**
 * 组织信息
 */
export interface OrgAdjustmentTaskOrgItem {
	/** 组织id */
	orgId: string;

	/** 组织编码 */
	code: string;

	/** 父组织id */
	parentOrgId: string;

	/** 是否有效(停用状态标识符) */
	effective: boolean;

	/** ehr原生组织id */
	ehrOrgId: number;

	/** 节点级别 */
	nodeLevel: number;

	/** 组织名称 */
	orgName: string;

	/** 组织全名称 */
	orgFullName: string;

	/** 饱和营收 */
	saturatedRevenue: number | null;

	/** 本部门饱和营收 */
	nodeSaturatedRevenue?: number | null;

	/** 目标营收 */
	targetRevenue: number | null;

	/** 目标利润 */
	targetProfit: number | null;

	/** 下级节点数 */
	childNodeNum: number | null;

	/** 在管项目数 */
	projectNum: number | null;

	/** 计划交付项目数 */
	planDeliveryProjectNum: number | null;

	/** 当拓当交项目数 */
	expandDeliveryProjectNum: number | null;

	/** 本部门员工数 */
	nodeEmployeeNum?: number | null;

	/** 本部门在管项目数 */
	nodeProjectNum?: number | null;

	/** 本部门计划交付项目数 */
	nodePlanDeliveryProjectNum?: number | null;

	/** 本部门当拓当交项目数 */
	nodeExpandDeliveryProjectNum?: number | null;

	/** 经度 */
	longitude: string | null;

	/** 维度 */
	latitude: string | null;

	/** 组织定级 */
	orgLevel: string | number | null;

	/** 预成立时间 */
	preEstablishTime: OrgAdjustmentTaskDateValue;

	/** 是否禁用 */
	disable: boolean;

	/** 组织关键绩效指标 */
	kpiList: OrgAdjustmentTaskKpiItem[] | null;

	/** 是否修改 */
	modified: boolean;

	/** 子节点是否被修改 */
	childrenModified: boolean;

	/** 对子节点变更的对比元数据 */
	compareMeta: OrgAdjustmentTaskCompareMeta | null;

	/** 全周期管理项目编码 */
	projCode: string;

	/** 项目组织状态 */
	projOrgStatus: string;

	/** 所属的集团 */
	belongGroup?: string;

	/** 组织性质 */
	orgNature?: string;

	/** 公司地址 */
	companyAddress?: string;

	/** 负责人ID */
	managerId?: string;

	/** 负责人姓名 */
	managerName?: string;

	/** 工作省份 */
	workProvince?: string;

	/** 工作城市 */
	workCity?: string;

	/** 工作县区 */
	workDistrict?: string;

	/** 是否虚拟组织 */
	virtual: boolean;

	/** 是否新组织 */
	newOrg: boolean;

	/** 员工数 */
	employeeNum: number | null;
}

/**
 * 指标信息
 */
export interface OrgAdjustmentTaskIndicatorInfo {
	/** 指标对应的计划id */
	indicatorPlanId: string;

	/** 指标id */
	indicatorId: string;

	/** 指标名称 */
	indicatorName: string;
}

/**
 * 设置信息
 */
export interface OrgAdjustmentTaskSettings {
	/** 默认根节点id */
	rootNodeId?: string;

	/** 是否仅显示调整组织 */
	showAdjustmentOnly: boolean;

	/** 是否展示更多字段 */
	showMoreInfo: boolean;

	/** 饱和营收 */
	showSaturatedRevenue: boolean;

	/** 目标营收 */
	showTargetRevenue: boolean;

	/** 目标营收指标信息 */
	targetRevenueIndicator: OrgAdjustmentTaskIndicatorInfo;

	/** 目标营收单位名称 */
	targetRevenueUnit?: string;

	/** 目标利润 */
	showTargetProfit: boolean;

	/** 目标利润指标信息 */
	targetProfitIndicator: OrgAdjustmentTaskIndicatorInfo;

	/** 目标利润单位名称 */
	targetProfitUnit?: string;

	/** 员工数 */
	showEmployeeNum: boolean;

	/** 下级节点数 */
	showChildNodeNum: boolean;

	/** 在管项目数 */
	showProjectNum: boolean;

	/** 计划交付项目数 */
	showPlanDeliveryProjectNum: boolean;

	/** 当拓当交项目数 */
	showExpandDeliveryProjectNum: boolean;

	/** 项目数单位名称 */
	projectNumUnit?: string;

	/** 饱和营收单位名称 */
	saturatedRevenueUnit?: string;

	/** 员工数单位名称 */
	employeeNumUnit?: string;

	/** 下级节点数单位名称 */
	childNodeNumUnit?: string;
}

/**
 * 组织调整任务详情数据
 */
export interface OrgAdjustmentTaskDetailData {
	/** 主键id */
	id: number;

	/** 任务名称 */
	taskName: string;

	/** 备注 */
	remark: string;

	/** 版本号 */
	txtVer: string;

	/** 居中显示的组织节点ID */
	rootNodeId?: string;

	/** 展示层级 */
	viewLevel?: number;

	/** 组织信息 */
	orgList: OrgAdjustmentTaskOrgItem[];

	/** 设置信息 */
	settings: OrgAdjustmentTaskSettings;

	/** 创建者 */
	createBy: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;
}

/**
 * 组织调整任务详情接口响应
 */
export type OrgAdjustmentTaskDetailResponse = ApiResponse<OrgAdjustmentTaskDetailData>;

/**
 * 组织调整版本详情数据
 */
export interface OrgAdjustmentTaskVersionDetailData {
	/** 主键id */
	id: number;

	/** 任务id */
	taskId: number;

	/** 版本号 */
	txtVer: string;

	/** 调整类型 */
	adjustmentType: string;

	/** 备注 */
	remark: string;

	/** 居中显示的组织节点ID */
	rootNodeId?: string;

	/** 展示层级 */
	viewLevel?: number;

	/** 组织信息 */
	orgList: OrgAdjustmentTaskOrgItem[];
}

/**
 * 组织调整版本详情接口响应
 */
export type OrgAdjustmentTaskVersionDetailResponse =
	ApiResponse<OrgAdjustmentTaskVersionDetailData>;

/**
 * 组织调整任务校验请求中的活动信息
 */
export interface OrgAdjustmentTaskCheckActiveItem {
	/** 任务id */
	taskId?: number;

	/** 版本号 */
	ver?: string;

	/** 活动类别 */
	type?: string;

	/** 活动实体 */
	activeBody?: string;
}

/**
 * 组织调整任务校验请求中的组织关键绩效指标（请求字段均可选）
 */
export type OrgAdjustmentTaskCheckKpiItem = Partial<OrgAdjustmentTaskKpiItem>;

/**
 * 组织调整任务校验请求中的组织信息（请求字段均可选）
 */
export type OrgAdjustmentTaskCheckOrgItem = Partial<
	Omit<OrgAdjustmentTaskOrgItem, "kpiList"> & { kpiList: OrgAdjustmentTaskCheckKpiItem[] | null }
>;

/**
 * 组织调整任务调整结果校验接口参数
 */
export interface CheckOrgAdjustmentTaskParams {
	/** 组织调整任务id */
	taskId: number;

	/** 版本号 */
	txtVer?: string;

	/** 备注 */
	remark?: string;

	/** 居中显示的组织节点ID */
	rootNodeId?: string;

	/** 展示层级 */
	viewLevel?: number;

	/** 变更内容 */
	changeContent?: string;

	/** 组织信息 */
	orgList?: OrgAdjustmentTaskCheckOrgItem[];

	/** 活动信息 */
	activeList?: OrgAdjustmentTaskCheckActiveItem[];

	/** 是否为测试异常用，异常测试时输入false */
	forCheckErrorTest?: boolean;
}

/**
 * 组织调整冲突信息
 */
export interface OrgAdjustmentTaskConflictItem {
	/** 组织id */
	orgId: string;

	/** 组织编码 */
	code: string;

	/** 组织名称 */
	orgName: string;

	/** 原父组织id */
	oldParentOrgId: string;

	/** 新父组织id */
	newParentOrgId: string;

	/** 原组织全名称 */
	oldOrgFullName: string;

	/** 新组织全名称 */
	newOrgFullName: string;

	/** 原父组织名称 */
	oldParentOrgName: string;

	/** 新父组织名称 */
	newParentOrgName: string;

	/** 冲突内容 */
	conflictContent: string;

	/** 冲突类型 */
	conflictType: number;
}

/**
 * 组织调整任务调整结果校验接口数据
 */
export interface CheckOrgAdjustmentTaskData {
	/** 组织调整冲突信息 */
	conflictList: OrgAdjustmentTaskConflictItem[];

	/** 最新组织信息 */
	latestorgList: OrgAdjustmentTaskOrgItem[];

	/** 原始组织信息 */
	oldOrgList: OrgAdjustmentTaskOrgItem[];
}

/**
 * 组织调整任务调整结果校验接口响应
 */
export type CheckOrgAdjustmentTaskResponse = ApiResponse<CheckOrgAdjustmentTaskData>;

/**
 * 组织调整任务存档列表查询条件中的创建人选项
 */
export interface OrgAdjustmentTaskArchiveCreatorOption {
	/** 用户ID */
	userId: number;

	/** 用户姓名 */
	userName: string;
}

/**
 * 组织调整任务存档列表查询条件接口数据
 */
export interface OrgAdjustmentTaskArchiveSearchOptionsData {
	/** 版本号 */
	txtVer: Record<string, unknown>[];

	/** 创建人 */
	createByOptions: OrgAdjustmentTaskArchiveCreatorOption[];
}

/**
 * 组织调整任务存档列表查询条件接口响应
 */
export type OrgAdjustmentTaskArchiveSearchOptionsResponse =
	ApiResponse<OrgAdjustmentTaskArchiveSearchOptionsData>;

/**
 * 组织调整任务存档列表查询接口参数
 */
export interface OrgAdjustmentTaskArchiveListParams {
	/** 组织调整任务id */
	taskId: number;

	/** 版本号 */
	txtVer?: string;

	/** 创建人 */
	createBy?: string;
}

/**
 * 组织调整任务存档列表项
 */
export interface OrgAdjustmentTaskArchiveListItem {
	/** 主键id */
	id: number;

	/** 版本号 */
	txtVer: string;

	/** 创建者姓名 */
	createByName: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 备注 */
	remark: string;
}

/**
 * 组织调整任务存档列表查询接口响应
 */
export type OrgAdjustmentTaskArchiveListResponse = ApiResponse<OrgAdjustmentTaskArchiveListItem[]>;

/**
 * 组织调整任务调整结果保存接口参数
 */
export type SaveOrgAdjustmentTaskParams = CheckOrgAdjustmentTaskParams;

/**
 * 组织调整任务调整结果保存接口响应
 */
export type SaveOrgAdjustmentTaskResponse = ApiResponse<number>;

/**
 * 组织调整任务调整设置保存接口参数（基于 OrgAdjustmentTaskSettings，所有字段可选）
 */
export type SaveSettingsParams = Partial<
	Omit<OrgAdjustmentTaskSettings, "targetRevenueIndicator" | "targetProfitIndicator"> & {
		targetRevenueIndicator?: Partial<OrgAdjustmentTaskIndicatorInfo>;
		targetProfitIndicator?: Partial<OrgAdjustmentTaskIndicatorInfo>;
	}
>;

/**
 * 组织调整任务调整设置保存接口响应
 */
export type SaveSettingsResponse = ApiResponse<string>;

/**
 * 修改组织调整结果接口子节点变更对比元数据
 */
export interface UpdateOrgAdjustmentResultCompareMeta {
	/** 变更前子节点id列表 */
	beforeChildIds?: string[];

	/** 变更后子节点id列表 */
	afterChildIds?: string[];
}

/**
 * 修改组织调整结果接口 KPI 项（基于 OrgAdjustmentTaskKpiItem，所有字段可选）
 */
export type UpdateOrgAdjustmentResultKpiItem = Partial<OrgAdjustmentTaskKpiItem>;

/**
 * 修改组织调整结果接口预创建组织补充信息项（基于 OrgAdjustmentTaskOrgItem 派生，所有字段可选，含额外补充字段）
 */
export type UpdateOrgAdjustmentResultNewOrgListInfoItem = Partial<
	Omit<OrgAdjustmentTaskOrgItem, "kpiList" | "compareMeta"> & {
		kpiList?: UpdateOrgAdjustmentResultKpiItem[];
		compareMeta?: UpdateOrgAdjustmentResultCompareMeta;
		/** 所属的集团 */
		belongGroup?: string;
		/** 组织性质 */
		orgNature?: string;
		/** 公司地址 */
		companyAddress?: string;
		/** 负责人ID */
		managerId?: string;
		/** 负责人姓名 */
		managerName?: string;
		/** 工作省份 */
		workProvince?: string;
		/** 工作城市 */
		workCity?: string;
		/** 工作县区 */
		workDistrict?: string;
	}
>;

/**
 * 修改组织调整结果接口参数
 */
export interface UpdateOrgAdjustmentResultParams {
	/** 任务id */
	taskId?: number;

	/** 版本号 */
	txtVer?: string;

	/** 调整类型（JSON 字符串化的英文 key 数组，例如 '["move","precreate"]'） */
	adjustmentType?: string;

	/** 变更内容 */
	changeContent?: string;

	/** 影响范围测算列表 */
	calculationOfInfluenceScopeList?: Partial<GetComparisonOrgCalculationOfInfluenceScopeListItem>[];

	/** 变动说明-备注 */
	remark?: string;

	/** 预创建组织补充信息 */
	newOrgListInfo?: UpdateOrgAdjustmentResultNewOrgListInfoItem[];
}

/**
 * 修改组织调整结果接口响应
 */
export type UpdateOrgAdjustmentResultResponse = ApiResponse<string>;

/**
 * 新增组织调整结果接口参数
 */
export interface CreateOrgAdjustmentResultParams extends UpdateOrgAdjustmentResultParams {
	/** 创建者 */
	createBy?: string;

	/** 创建时间 */
	createTime?: Record<string, unknown>;

	/** 更新者 */
	updateBy?: string;

	/** 更新时间 */
	updateTime?: Record<string, unknown>;

	/** 创建者姓名 */
	createByName?: string;

	/** 更新者姓名 */
	updateByName?: string;

	/** 变更组织id */
	changeId?: string;

	/** 影响范围测算结果 */
	scopeResultFilename?: string;

	/** 状态 */
	status?: string;

	/** 删除标志 */
	delFlag?: string;
}

/**
 * 新增组织调整结果接口响应
 */
export type CreateOrgAdjustmentResultResponse = ApiResponse<string>;

/**
 * (分页)指标库 for 目标计划参数
 */
export interface PageForTargetPlanParams extends PaginationParams {
	/** 指标名称 */
	name?: string;

	/** 主责部门Code，枚举值[IndicatorResponsibleDepartmentCode]。公共接口，根据当前枚举值进行获取对应值信息 */
	responsibleDepartmentCode?: number;

	/** 指标类型 0:基础指标 1：复合指标 */
	type?: number;

	/** 上线状态 0:未上线 1：已上线 */
	onlineStatus?: number;

	/** 创建者 */
	createByName?: string;

	/** 更新者 */
	updateByName?: string;

	/** 目标计划ID */
	targetPlanId?: number;
}

/**
 * (分页)指标库 for 目标计划条目
 */
export interface PageForTargetPlanItem {
	/** 删除标志 */
	delFlag: string;

	/** 创建者 */
	createBy: string;

	/** 创建者 */
	createByName: string;

	/** 更新者 */
	updateBy: string;

	/** 更新者 */
	updateByName: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 更新时间 */
	updateTime: Record<string, unknown>;

	/** 主键id */
	id: number;

	/** 指标类型 0:基础指标 1：复合指标 */
	type: number;

	/** 指标名称 */
	name: string;

	/** 主责部门 */
	responsibleDepartmentCode: number;

	/** 主责部门 */
	responsibleDepartment: string;

	/** 指标说明 */
	remark: string;

	/** 数据类型 0:数值 1:百分比 */
	dataType: number;

	/** 小数位数 */
	decimalDigits: number;

	/** 数据单位 */
	unit: number;

	/** 数据单位 */
	unitName: string;

	/** 数据范围开始 */
	dataRangeStart: number;

	/** 数据范围结束 */
	dataRangeEnd: number;

	/** 指标定义及口径 */
	definition: string;

	/** 上线状态 0:未上线 1：已上线 */
	onlineStatus: number;

	/** 锁标识 */
	synVersion: number;
}

/**
 * (分页)指标库 for 目标计划响应
 */
export type PageForTargetPlanResponse = ApiListResponse<PageForTargetPlanItem>;

/**
 * (分页)目标计划参数
 */
export interface TargetPlanPageParams extends PaginationParams {
	/** 名称精准查询 true:精准 */
	preciseNameFlag?: boolean;

	/** 名称 */
	name?: string;

	/** 周期-年 */
	year?: string;

	/** 子周期 */
	subperiod?: number;

	/** 计划状态 */
	status?: number;

	/** 创建者 */
	createByName?: string;

	/** 更新者 */
	updateByName?: string;
}

/**
 * (分页)目标计划条目
 */
export interface TargetPlanPageItem {
	/** 主键id */
	id: number;

	/** 名称 */
	name: string;

	/** 周期-年 */
	year: string;

	/** 子周期 */
	subperiod: number;

	/** 子周期名称 */
	subperiodName: string;

	/** 目标周期 */
	targetCycle: string;

	/** 计划状态 */
	status: number;

	/** 计划状态名称 */
	statusStr: string;

	/** 锁标识 */
	synVersion: number;

	/** 创建者 */
	createByName: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 更新者 */
	updateByName: string;

	/** 更新时间 */
	updateTime: Record<string, unknown>;

	/** 权限，参考枚举[UserDataPermEntityDataPerm] */
	perm: number;
}

/**
 * (分页)目标计划响应
 */
export type TargetPlanPageResponse = ApiListResponse<TargetPlanPageItem>;

/**
 * 影响范围测算值配置
 */
export interface InfluenceScopeValueConfig {
	/** keyComparator */
	keyComparator: string;

	/** ignoreError */
	ignoreError: boolean;

	/** ignoreCase */
	ignoreCase: boolean;

	/** dateFormat */
	dateFormat: string;

	/** ignoreNullValue */
	ignoreNullValue: boolean;

	/** transientSupport */
	transientSupport: boolean;

	/** stripTrailingZeros */
	stripTrailingZeros: boolean;

	/** checkDuplicate */
	checkDuplicate: boolean;

	/** writeLongAsString */
	writeLongAsString: boolean;

	/** order */
	order: boolean;
}

/**
 * 影响范围测算包装值对象
 */
export interface InfluenceScopeWrappedValueObject {
	/** 原始值 */
	raw: Record<string, unknown>;

	/** 配置 */
	config: InfluenceScopeValueConfig;

	/** 是否为空 */
	empty: boolean;
}

/**
 * 影响范围测算 KPI 项
 */
export interface InfluenceScopeKpiValueItem {
	/** 指标 key */
	kpisKey?: string;

	/** 指标名称 */
	kpisName: string;

	/** 指标值 */
	kpisValue?: string;

	/** 项目汇总 */
	kpisAll?: string;

	/** 当前层级值 */
	kpisCur?: string;

	/** 是否存在当前层级（false 时显示 -） */
	kpisCurExist?: boolean;

	/** 是否存在项目汇总（false 时显示 -） */
	kpisAllExist?: boolean;

	/** 单位 */
	kpisUnitName?: string;
}

/**
 * 影响范围测算值对象
 */
export type InfluenceScopeValueObject =
	| InfluenceScopeWrappedValueObject
	| Record<string, unknown>
	| null;

/**
 * 影响范围测算基础信息
 */
export interface InfluenceScopeBasicInfo {
	/** 在管项目数 */
	projectNum: number;

	/** 计划交付项目数 */
	planDeliveryProjectNum: number;

	/** 当拓当交项目数 */
	expandDeliveryProjectNum: number;
}

/**
 * 影响范围测算组织信息
 */
export interface InfluenceScopeOrgInfo {
	/** 组织名称 */
	orgName: string;

	/** 组织路径 */
	orgPath: string;
}

/**
 * 影响范围测算查询参数
 */
export interface GetComparisonOrgCalculationOfInfluenceScopeListParams {
	/** 任务ID */
	taskId: number;

	/** 版本 */
	txtVer: string;

	/** 目标计划id */
	effTargetPlanId?: number;

	/** 对比组织ID列表 */
	ehrOrgIdList?: string[];
}

/**
 * 影响范围测算响应项
 */
export interface GetComparisonOrgCalculationOfInfluenceScopeListItem {
	/** 组织信息 */
	orgInfo: InfluenceScopeOrgInfo;

	/** 调整前基础信息 */
	oldBasicInfo: InfluenceScopeBasicInfo;

	/** 调整后基础信息 */
	newBasicInfo: InfluenceScopeBasicInfo;

	/** 上年度调整前实际值 */
	lastYearOldValue: InfluenceScopeValueObject;

	/** 上年度调整后实际值 */
	lastYearNewValue: InfluenceScopeValueObject;

	/** 当年调整前实际值 */
	currentYearOldValue: InfluenceScopeValueObject;

	/** 当年调整后实际值 */
	currentYearNewValue: InfluenceScopeValueObject;
}

/**
 * 影响范围测算响应
 */
export type GetComparisonOrgCalculationOfInfluenceScopeListResponse = ApiResponse<
	GetComparisonOrgCalculationOfInfluenceScopeListItem[]
>;

/**
 * 目标计划超额值列表请求参数
 */
export interface TargetPlanListOverValParams {
	/** 指标id */
	indicatorId: number;

	/** 目标计划ID */
	targetPlanId: number;
}

/**
 * 目标计划超额值项
 */
export interface TargetPlanListOverValItem {
	/** 拆解对象code */
	targetOrgCode: string;

	/** 年度目标值 */
	annualTargetValue: number;

	/** 单位 */
	unitStr: string;
}

/**
 * 目标计划超额值列表响应
 */
export type TargetPlanListOverValResponse = ApiResponse<TargetPlanListOverValItem[]>;

/**
 * 组织调整结果详情中的变动组织项
 * 在 OrgAdjustmentTaskOrgItem 基础上扩展 type 字段
 */
export interface OrgAdjustmentResultDetailOrgItem extends OrgAdjustmentTaskOrgItem {
	/** 变动类型 可用值:ADDED,UPDATED,DELETED,MOVED,EFFECTIVE */
	type: string;
}

/**
 * 组织调整结果详情数据
 */
export interface OrgAdjustmentResultDetailData {
	/** 创建者 */
	createBy: string;

	/** 创建时间 */
	createTime: Record<string, unknown>;

	/** 更新者 */
	updateBy: string;

	/** 更新时间 */
	updateTime: Record<string, unknown>;

	/** 备注 */
	remark: string;

	/** 创建者姓名 */
	createByName: string;

	/** 更新者姓名 */
	updateByName: string;

	/** 主键id */
	id: number;

	/** 关联任务id */
	taskId: number;

	/** 关联任务名称 */
	taskName: string;

	/** 版本号 */
	txtVer: string;

	/** 变更内容 */
	changeContent: string;

	/** 变更内容文本,用于变动组织画布展示 */
	changeText: string;

	/** 影响范围测算结果文件 */
	scopeResultFilename: string;

	/** 影响范围测算结果实体列表 */
	scopeEntityList: GetComparisonOrgCalculationOfInfluenceScopeListItem[];

	/** 组织调整结果变动组织列表 */
	orgEntityList: OrgAdjustmentResultDetailOrgItem[];

	/** 调整类型列表 */
	adjustmentTypeList: Record<string, unknown>[];

	/** 状态 */
	status: string;

	/** 删除标志 */
	delFlag: string;
}

/**
 * 组织调整结果详情接口响应
 */
export type OrgAdjustmentResultDetailResponse = ApiResponse<OrgAdjustmentResultDetailData>;
