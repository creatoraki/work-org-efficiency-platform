/**
 * 组织档案 API 类型
 * TODO: 补充组织档案相关类型定义
 */

export interface OrgState {
	/* */
	name: string;

	/* */
	id: string;
	orgFullName: string;
	layer: number;
	standLayer: string;
	projOrgStatus?: string | null;
	/* */
	parentId: string;

	/* */
	weight: number;

	/* */
	empty?: boolean;
	/* */
	children?: {
		name: string;

		/* */
		id: string;
		/* */
		parentId: string;

		/* */
		weight: number;

		/* */
		empty: boolean;
	};
}

export interface GetOrgFileInfoRes {
	/* */
	orgId: string;

	/* */
	orgName: string;

	/* */
	orgFullName: string;

	/* */
	code: string;

	/* */
	parentOrgId: string;

	/* */
	effective: boolean;

	/* 项目组织状态 */
	projOrgStatus: string;

	/* 标准层级 */
	standLayer: string;

	/* 组织档案-组织信息-拓展列表 */
	businessList: {
		/* 商机id */
		businessId: string;

		/* 商机编号 */
		businessCode: string;

		/* 商机名称 */
		businessName: string;

		/* 客户名称 */
		customerName: string;

		/* 项目id */
		projectId: string;

		/* 项目名称 */
		projectName: string;

		/* 排序 */
		rankId: string;

		/* 业绩归属部门 */
		performanceDept: string;

		/* 项目状态 */
		projectStatus: string;

		/* 项目来源 */
		projectSource: string;

		/* 物业类型 */
		propertyType: string;

		/* 业务模式 */
		businessModel: string;

		/* 商机类型 */
		businessType: string;

		/* 商机分类 */
		businessClassify: string;

		/* 商机阶段 */
		businessStage: string;

		/* 商机状态组 */
		businessStatusGroup: string;

		/* 开标时间 */
		openTime: string;

		/* 开标结果 */
		openResults: string;

		/* 预期成交日期 */
		exTransactionDate: string;

		/* 最后跟进时间 */
		lastFollowTime: string;

		/* 最后跟进记录 */
		lastFollowRecord: string;

		/* 负责人 */
		ownerUser: string;
	}[];

	/* 组织档案-组织信息-项目实体 */
	project: {
		/* 项目编码 */
		projCode: string;

		/* 项目性质 */
		projNatureName: string;

		/* 项目类型 */
		projTypeName: string;

		/* 物业类型 */
		propertyTypeName: string;

		/* 业务模式 */
		businessTypeName: string;

		/* 服务等级 */
		projGradeName: string;

		/* 合同性质 */
		contractNature: string;

		/* 是否当年拓展交付 */
		isExpandDeliver: string;

		/* 是否存量 */
		isStock: string;

		/* 在管项目状态 */
		deliveryStatus: string;

		/* 首次交付日期 */
		deliveryDate: string;

		/* 是否单一产权 */
		isSingleProperty: string;

		/* 退出项目状态 */
		exitStatus: string;

		/* 实际退出日期 */
		acturalExitDate: string;

		/* 交付标准 */
		deliveryStandard: string;
	};

	/* 组织档案-组织信息-组织实体 */
	org: {
		/* 主数据编码 */
		orgCode: string;

		/* 组织全称 */
		orgFullName: string;

		/* 部门类型 */
		orgType: string;

		/* 管理形式 */
		manageForm: string;

		/* 所属公司 */
		company: string;

		/* 成立日期 */
		bornDate: string;

		/* 是否虚拟 */
		isVirtual: string;

		/* 是否并表 */
		isMerge: string;

		/* 部门状态 */
		depStatus: string;

		/* 工作省份 */
		province: string;

		/* 工作城市 */
		city: string;

		/* 工作县区 */
		county: string;
	};

	/* 组织档案-组织信息-负责人变更列表 */
	directorChangeList: string[];

	/* 组织档案-组织信息-人员信息实体 */
	staff: {
		/* 组织编码 */
		deptCode: string;

		/* 组织名称 */
		deptName: string;

		/* 编制数 */
		establishment: number;

		/* 在职数 */
		onjobNum: number;

		/* 储备数 */
		reserveNum: number;

		/* 项目管理编制数 */
		pmanagerBz: number;

		/* 项目管理在职数 */
		pmanagerOnjob: number;

		/* 管家编制数 */
		housekeeperBz: number;

		/* 管家在职数 */
		housekeeperOnjob: number;

		/* 工程编制数 */
		engineerBz: number;

		/* 工程在职数 */
		engineerOnjob: number;

		/* 保安编制数 */
		securityBz: number;

		/* 保安在职数 */
		securityOnjob: number;

		/* 保洁编制数 */
		cleanerBz: number;

		/* 保洁在职数 */
		cleanerOnjob: number;

		/* 绿化编制数 */
		afforestBz: number;

		/* 绿化在职数 */
		afforestOnjob: number;
	};

	/* */
	newOrg: boolean;
}

export interface GetOrgScaleListParams {
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

	/* 组织ID */
	orgId: string;
}
export interface GetOrgScaleListRes {
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
		/* 组织唯一标识 上级编码组织编码 */
		orgUuid: string;

		/* 组织编码 */
		orgCode: string;

		/* 组织名称 */
		orgName: string;

		/* 上级组织编码 */
		parentOrgCode: string;

		/* 地区编码 */
		areaCode: string;

		/* 地区名称 */
		areaName: string;

		/* 项目群编码 */
		pgroupCode: string;

		/* 项目群名称 */
		pgroupName: string;

		/* 物业类型 */
		projType: string;

		/* 服务等级 */
		projGrade: string;

		/* 项目类型 */
		orgStatus: string;

		/* 在管项目数 */
		projectNum: number;

		/* 计划交付项目数 */
		planDeliveryProjectNum: number;

		/* 当拓当交项目数 */
		expandDeliveryProjectNum: number;
	}[];

	/* 是否为空 */
	emptyFlag: boolean;
}

export interface GetArchiveUserListParams {
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

	/* 组织ID */
	orgId: string;
}

export interface GetArchiveUserListRes {
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
		/* 用户id */
		id: number;

		/* 用户名称 */
		name: string;

		/* 工号 */
		userCode: string;

		/* 岗位名称code */
		staffJobCode: string;

		/* 岗位名称 */
		staffJobName: string;

		/* 职位名称code */
		staffPostCode: string;

		/* 职位名称 */
		staffPostName: string;

		/* 职级 */
		postGrade: number;

		/* 职级名称 */
		postGradeName: string;

		/* 电话号码 */
		mobileNum: string;

		/* 用户性别 */
		sex: string;

		/* 入职日期 */
		joinDate: Record<string, unknown>;

		/* 司龄 */
		cyear: string;

		/* 部门id */
		deptId: number;

		/* 部门名称 */
		deptName: string;
	}[];

	/* 是否为空 */
	emptyFlag: boolean;
}
export interface GetArchiveProjectTagRes {
	/* 唯一主键 */
	uuid: string;

	/* 管理项目ID */
	projId: string;

	/* 管理项目编码 */
	projCode: string;

	/* 管理项目名称 */
	projName: string;

	/* 组织编码 */
	orgCode: string;

	/* 组织名称 */
	orgName: string;

	/* 项目类型编码 */
	projTypeCode: string;

	/* 项目类型名称 */
	projTypeName: string;

	/* 物业类型编码 */
	propertyTypeCode: number;

	/* 物业类型名称 */
	propertyTypeName: string;

	/* 管理项目大类 */
	projClassId: number;

	/* 管理项目分类名称 */
	projClassName: string;

	/* 项目服务等级编码 */
	projGradeCode: string;

	/* 项目服务等级名称 */
	projGradeName: string;

	/* 交付标准编码 */
	deliveryStandardCode: string;

	/* 交付标准名称 */
	deliveryStandardName: string;

	/* 项目性质编码 */
	projNatureCode: string;

	/* 项目性质名称 */
	projNatureName: string;

	/* 合同性质编码 */
	contractNatureCode: string;

	/* 合同性质名称 */
	contractNatureName: string;

	/* 省 */
	province: string;

	/* 市 */
	city: string;

	/* 区/县 */
	county: string;

	/* 物业费 */
	propertyFee: string;

	/* 合同面积 */
	contractArea: Record<string, unknown>;

	/* 已交付户数 */
	deliveryHouseNum: number;

	/* 入住率 */
	houseNumLiveRate: Record<string, unknown>;

	/* 是否高低配项目 */
	projIsMultiResident: string;

	/* 是否配置公租房配套项目 */
	projIsPublicRental: string;

	/* 综合类业态 */
	projIsMulti: string;

	/* 是否高居住率 */
	projIsHighLiveRate: string;

	/* 项目周期编码 */
	projCycleCode: string;

	/* 项目周期名称 */
	projCycleName: string;

	/* 是否提价 */
	projIsRaisePrice: string;

	/* 是否续约 */
	projIsResign: string;

	/* 合同任期 */
	contractTerm: string;

	/* 是否成立业委会 */
	projIsEstablish: string;

	/* 业委会任期 */
	committeeTerm: string;

	/* 高满意度项目 */
	projIsHighSatisfied: string;

	/* 高收缴率项目 */
	projIsHighCollect: string;

	/* 是否大型项目 */
	projIsMajor: string;

	/* 是否重点项目 */
	projIsKey: string;

	/* 扭亏为盈项目 */
	projIsTurnLossProfit: string;

	/* 亏损项目 */
	projIsLoss: string;

	/* 攻坚克难项目 */
	projIsLargeLoss: string;

	/* 标杆项目类型 */
	modelProjType: string;

	/* 是否重大投诉 */
	projMajorComplaint: string;

	/* 是否设备抵岗 */
	projDeviceOnPost: string;

	/* 会所个数 */
	projClub: string;

	/* 泳池个数 */
	projPool: string;

	/* 颐乐学院 */
	yileCollege: string;

	/* 四点半学堂 */
	school430: string;

	/* 有无食堂 */
	hasCanteen: string;

	/* 星级宿舍 */
	dormStarLvl: string;

	/* 基本信息 列表 */
	baseInfoList: string;

	/* 关键节点 列表 */
	keyNodeList: string;

	/* 项目运营 列表 */
	projOperList: string;

	/* 项目服务 列表 */
	projServList: string;

	/* 创建时间 */
	createTime: string;
}
