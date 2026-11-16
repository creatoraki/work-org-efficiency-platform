export interface MatchingsProjectsRes {
	/* 项目编号 */
	projCode: string;

	/* 项目名称 */
	projName: string;

	/* 项目匹配评分 */
	proScore?: string;
}

export interface DataEffProjectsRes {
	/* 唯一主键 */
	uuid: string;

	/* 项目编码 */
	projCode: string;

	/* 项目名称 */
	projName: string;

	/* 是否标杆项目 1: 是 0: 否 */
	isBenchmark: string;

	/* 物业类型编码 */
	propertyTypeCode: string;

	/* 物业类型名称 */
	propertyTypeName: string;

	/* 项目服务等级编码 */
	projGradeCode: string;

	/* 项目服务等级名称 */
	projGradeName: string;

	/* 组织编码层级树 */
	orgFullCode: string;

	/* 组织名称层级树 */
	orgFullName: string;

	/* 地区编码 */
	areaCode: string;

	/* 地区名称 */
	areaName: string;

	/* 服务中心编码 */
	serverCode: string;

	/* 服务中心名称 */
	serverName: string;

	/* 所在省 */
	province: string;

	/* 所在市 */
	city: string;

	/* 所在区县 */
	county: string;

	/* 项目周期编码 */
	projCycleCode: string;

	/* 项目周期名称 */
	projCycleName: string;

	/* 项目性质编码 */
	projNatureCode: string;

	/* 项目性质名称 */
	projNatureName: string;

	/* 交付标准 */
	deliveryStandard: string;

	/* 合同面积 */
	contractArea: number;

	/* 物业费 */
	propertyFee: string;

	/* 已交付户数 */
	deliveryHouseNum: number;

	/* 入住率 */
	houseNumLiveRate: number;

	/* 已交付面积 */
	deliveryArea: number;

	/* 会所数量 */
	clubNum: number;

	/* 泳池数量 */
	poolNum: number;

	/* 高配房数量 */
	highNum: number;

	/* 消监控室 */
	fireNum: number;

	/* 门岗数 */
	primarySecondaryGatePost: number;

	/* 绿化作业面积 */
	maintenanceArea: number;

	/* 保洁作业面积 */
	cleaningArea: number;

	/* 全口径营收 */
	totRevenue: number;

	/* 全口径利润 */
	totProfit: number;

	/* 人力成本占比 */
	laborCostRate: number;

	/* 综合收缴率 */
	totCollectionRate: number;

	/* 满意度 */
	projSatisfiedScore: number;

	/* 编制人数 */
	authorizedNum: string;

	/* 在职人数 */
	onstaffNum: string;

	/* 新老配比 */
	newOldRatio: string;

	/* 男女配比 */
	sexRatio: string;

	/* 年龄配比 */
	ageRatio: string;

	/* 学历分布 */
	eduRatio: string;

	/* 稳定性 */
	stability: string;

	/* 设备抵岗 */
	deviceOnPost: string;

	/* 设备数量 */
	deviceNum: number;

	/* 编制总人数 */
	authorizedNumTotal: number;

	/* 在职总人数 */
	onstaffNumTotal: number;

	/* 创建时间 */
	createTime: Record<string, unknown>;
}
export interface ComparedProjCodeRes {
	/* */
	projCode: string;

	/* */
	projName: string;

	/* */
	isBenchmark: string;

	/* */
	basicInfo: {
		/* 属性类型名称 */
		propertyTypeName: string;

		/* 项目等级名称 */
		projGradeName: string;

		/* 地区 */
		areaName: string;

		/* 省份 */
		province: string;

		/* 城市 */
		city: string;

		/* 县区 */
		county: string;

		/* 项目周期名称 */
		projCycleName: string;

		/* 项目性质名称 */
		projNatureName: string;
	};

	/* */
	deliverInfo: {
		/* 交付标准 */
		deliveryStandard: string;

		/* 合同面积 */
		contractArea: number;

		/* 物业费 */
		propertyFee: string;

		/* 已交付户数 */
		deliveryHouseNum: number;

		/* 入住率 */
		houseNumLiveRate: number;

		/* 已交付面积 */
		deliveryArea: number;
	};

	/* */
	serviceInfo: {
		/* 门岗数 */
		primarySecondaryGatePost: number;

		/* 绿化作业面积 */
		maintenanceArea: number;

		/* 保洁作业面积 */
		cleaningArea: number;
	};

	/* */
	operationInfo: {
		/* 全口径营收 */
		totRevenue: number;

		/* 全口径利润 */
		totProfit: number;

		/* 人力成本占比 */
		laborCostRate: number;

		/* 满意度 */
		projSatisfiedScore: number;

		/* 综合收缴率 */
		totCollectionRate: number;
	};

	/* */
	teamInfo: {
		/* 编制人数 */
		authorizedNum: string;

		/* 在职人数 */
		onstaffNum: string;

		/* 新老配比 */
		newOldRatio: string;

		/* 男女配比 */
		sexRatio: string;

		/* 年龄配比 */
		ageRatio: string;

		/* 学历分布 */
		eduRatio: string;

		/* 稳定性 */
		stability: string;
	};

	/* */
	intelligentDeviceInfo: {
		/* 设备抵岗 */
		deviceOnPost: string;
	};
}

export interface DataEffProjectParam {
	pageNum: number;
	pageSize: number;
	searchCount: boolean;
	isBenchmark: boolean;
	sortItemList?: [
		{
			isAsc: boolean;
			column: string;
		},
	];
}

export interface ProjResultOfContrastRes {
	proSuggestResult: any;
	proResult: any;
}
export interface ProjResultOfContrastParam {
	noBenchmarkProjectCode: string;
	benchmarkProjectCodeList: string[];
	t?: number;
}

export interface FuzzyAIMatchingParam {
	projCode?: string;
	projName?: string;
	isBenchmark?: string;
}

export interface GetFuzzyAIMatchingProjectsRes {
	/* 项目编号 */
	projCode: string;

	/* 项目名称 */
	projName: string;

	/* 是否标杆项目 */
	isBenchmark: string;
}
