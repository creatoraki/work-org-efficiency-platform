/**
 * 组织大脑 - 人员档案 API 类型定义
 */

/**
 * 人员档案列表项
 */
export interface PersonnelArchiveItem {
	/** 用户ID */
	userId: string;
	/** 姓名 */
	name: string;
	/** 工号 */
	userCode: string;
	/** 头像 */
	avatar?: string;
	/** 所属组织ID */
	orgId: string;
	/** 所属组织名称 */
	orgName: string;
	/** 所属组织完整路径 */
	orgFullName?: string;
	/** 岗位ID */
	jobId: string;
	/** 岗位名称 */
	jobName: string;
	/** 职位ID */
	postId: string;
	/** 职位名称 */
	postName: string;
	/** 职级ID */
	postgradeId?: string;
	/** 职级名称 */
	postgradeName?: string;
	/** 入职时间 */
	joinDate: string;
}

/**
 * 人员档案列表查询参数
 */
export interface PersonnelArchiveListParams {
	/** 页码 */
	pageNum?: number;
	/** 每页数量 */
	pageSize?: number;
	/** 员工名称 */
	employeeName?: string;
	/** 工号 */
	userCode?: string;
	/** 所属组织ID（从组织树选择） */
	orgId?: string;
	/** 岗位ID列表 */
	jobIds?: number[];
	/** 职位ID列表 */
	postIds?: number[];
	/** 职级ID列表 */
	postgradeIds?: number[];
	/** 入职日期起始值 */
	joinDateStart?: string;
	/** 入职日期结束值 */
	joinDateEnd?: string;
}

// ==================== 人才档案相关类型 ====================

/**
 * 人才档案 - 基本信息（头部展示区域）
 */
export interface TalentArchiveBasicInfo {
	/** 用户ID */
	userId: string;
	/** 姓名 */
	name: string;
	/** 工号 */
	userCode: string;
	/** 头像 */
	avatar?: string;
	/** 性别 */
	gender: string;
	/** 年龄 */
	age: number;
	/** 所属组织ID */
	orgId: string;
	/** 所属组织名称 */
	orgName: string;
	/** 所属组织完整路径 */
	orgFullName?: string;
	/** 岗位ID */
	jobId?: string;
	/** 岗位名称 */
	jobName?: string;
	/** 职位ID */
	postId?: string;
	/** 职位名称 */
	postName?: string;
	/** 职级ID */
	postgradeId?: string;
	/** 职级名称 */
	postgradeName?: string;
	/** 司龄（年） */
	tenure: number;
	/** 入职日期 */
	joinDate: string;
	/** 人岗匹配度（百分比） */
	matchRate?: number;
	/** 出生地 */
	birthplace?: string;
	/** 出生日期 */
	birthday?: string;
	/** 籍贯 */
	nativePlace?: string;
	/** 民族 */
	nation?: string;
	/** 身高 */
	height?: string;
	/** 体重 */
	weight?: string;
	/** 血型 */
	bloodType?: string;
	/** 属相 */
	zodiac?: string;
	/** 星座 */
	constellation?: string;
	/** 政治面貌 */
	politicalStatus?: string;
	/** 婚姻状况 */
	maritalStatus?: string;
	/** 生育状况 */
	fertilityStatus?: string;
	/** 手机号码 */
	phone?: string;
	/** 现居地 */
	address?: string;
}

/**
 * 人才档案 - 公司经历类型
 */
export type TalentArchiveCompanyHistoryType = "CONCURRENT" | "TRANSFER";

/**
 * 人才档案 - 公司经历项
 */
export interface TalentArchiveCompanyHistoryItem {
	/** 开始时间 */
	beginDate: string;
	/** 结束时间 */
	endDate?: string;
	/** 类型编码 */
	type: TalentArchiveCompanyHistoryType;
	/** 类型名称 */
	typeLabel?: string;
	/** 所属公司编码 */
	cityCompanyCode?: string;
	/** 所属公司名称 */
	cityCompanyName?: string;
	/** 一级部门编码 */
	firstDeptCode?: string;
	/** 一级部门名称 */
	firstDeptName?: string;
	/** 部门ID */
	deptId?: string;
	/** 所属部门编码 */
	deptCode?: string;
	/** 所属部门名称 */
	deptName?: string;
	/** 岗位名称 */
	jobName?: string;
	/** 职位名称 */
	postName?: string;
	/** 职级名称 */
	postgradeName?: string;
}

/**
 * 人才档案 - 考核绩效项
 */
export interface TalentArchiveAssessmentItem {
	/** 等级 */
	grade: string;
	/** 年份 */
	year: string;
	/** 是否最新 */
	isLatest?: boolean;
}

/**
 * 人才档案 - 培训经历项
 */
export interface TalentArchiveTrainingItem {
	/** 日期 */
	date: string;
	/** 培训项目 */
	project: string;
	/** 培训机构 */
	organization: string;
}

/**
 * 人才档案 - 梯队信息
 */
export interface TalentArchiveEchelonInfo {
	/** 所在梯队 */
	echelonName?: string;
	/** 继任准备度 */
	successionReadiness?: string;
}

/**
 * 人才档案 - 发展规划项
 */
export interface TalentArchiveDevelopmentItem {
	/** 年份 */
	year: string;
	/** 目标 */
	target: string;
}

/**
 * 人才档案 - 教育经历项
 */
export interface TalentArchiveEducationItem {
	/** 开始时间 */
	startDate: string;
	/** 结束时间 */
	endDate?: string;
	/** 学校名称 */
	school: string;
	/** 学历 */
	degree: string;
}

/**
 * 人员档案详情数据
 */
export interface PersonnelArchiveDetail {
	/** 基本信息（头部展示） */
	basicInfo: TalentArchiveBasicInfo;
	/** 考核绩效 */
	assessments: TalentArchiveAssessmentItem[];
	/** 教育经历 */
	educations: TalentArchiveEducationItem[];
	/** 培训经历 */
	trainings: TalentArchiveTrainingItem[];
}

/**
 * 人才档案数据
 */
export type TalentArchiveData = PersonnelArchiveDetail;

/**
 * 人员档案标签项
 */
export interface PersonnelArchiveTagItem {
	/** 标签ID */
	tagId: string;
	/** 标签名称 */
	tagName: string;
	/** 标签值 */
	tagValue?: string;
	/** 业务类别 */
	businessCategory?: string;
	/** 标签显隐情况 */
	tagVisibility?: string;
	/** 标签分布模块 */
	tagDistributionModule?: string;
}

/**
 * 兼岗情况项
 */
export interface ConcurrentJobItem {
	/** 开始时间 */
	startDate: string;
	/** 结束时间 */
	endDate?: string;
	/** 组织ID */
	orgId: string;
	/** 组织名称 */
	orgName: string;
	/** 岗位ID */
	jobId: string;
	/** 岗位名称 */
	jobName: string;
	/** 职位ID */
	postId: string;
	/** 职位名称 */
	postName: string;
}

// ==================== 人才画像相关类型 ====================

/**
 * 人才画像 - 雷达图维度数据
 */
export interface TalentPortraitRadarData {
	/** 学历分数（1-5分） */
	education: number;
	/** 资历分数（1-5分） */
	qualification: number;
	/** 绩效分数（1-5分） */
	performance: number;
}

/**
 * 人才画像 - 学历详情
 */
export interface TalentPortraitEducationDetail {
	/** 综合分数 */
	score: number;
	/** 学历刻度 */
	scale: string;
	/** 第一学历 */
	firstDegree: string;
	/** 最高学历 */
	highestDegree: string;
	/** 是否海外学历 */
	isOverseas: boolean;
}

/**
 * 人才画像 - 绩效详情
 */
export interface TalentPortraitPerformanceDetail {
	/** 综合分数 */
	score: number;
	/** 绩效刻度 */
	scale: string;
}

/**
 * 人才画像 - 资历详情
 */
export interface TalentPortraitQualificationDetail {
	/** 综合分数（自动计算：已获证书的刻度得分之和） */
	score: number;
	/** 已获证书列表 */
	obtainedCertificates: Array<{
		/** 证书名称 */
		name: string;
		/** 证书等级 */
		level: string;
	}>;
}

/**
 * 人才画像 - 一心四力维度
 */
export interface TalentPortraitOneHeartFourForces {
	/** 一心（价值观） */
	heart: Array<{
		/** 标签名称 */
		tagName: string;
		/** 标签值 */
		tagValue: string;
	}>;
	/** 四力 - 学习力 */
	learning: Array<{
		/** 标签名称 */
		tagName: string;
		/** 标签值 */
		tagValue: string;
	}>;
	/** 四力 - 执行力 */
	execution: Array<{
		/** 标签名称 */
		tagName: string;
		/** 标签值 */
		tagValue: string;
	}>;
	/** 四力 - 创新力 */
	innovation: Array<{
		/** 标签名称 */
		tagName: string;
		/** 标签值 */
		tagValue: string;
	}>;
	/** 四力 - 领导力 */
	leadership: Array<{
		/** 标签名称 */
		tagName: string;
		/** 标签值 */
		tagValue: string;
	}>;
}

/**
 * 人才画像 - 标签项
 */
export interface TalentPortraitTagItem {
	/** 标签ID */
	tagId: string;
	/** 标签名称 */
	tagName: string;
	/** 标签值 */
	tagValue?: string;
	/** 业务类别 */
	businessCategory?: string | string[];
	/** 标签显隐情况（0:隐性，1:显性） */
	tagVisibility?: string;
	/** 标签分布模块（隐形标签专用） */
	tagDistributionModule?: string;
}

/**
 * 雷达图详情聚合数据（学历、资历、绩效）
 */
export interface RadarDetailData {
	/** 学历详情 */
	education: {
		/** 雷达图分数 */
		score: number;
		/** 第一学历 */
		firstLevel: string;
		/** 第一学历学校 */
		firstLevelSchool: string;
		/** 最高学历 */
		highLevel: string;
		/** 最高学历学校 */
		highLevelSchool: string;
	};
	/** 资历详情 */
	qualification: {
		/** 雷达图分数（已获证书刻度得分之和） */
		score: number;
		/** 已获证书列表 */
		obtainedCertificates: Array<{
			/** 证书字典主键ID */
			id: number;
			/** 证书ID */
			certId: string;
			/** 证书名称 */
			certName: string;
			/** 证书等级 */
			certGrade: string;
			/** 证书类别 */
			certClass: string;
			/** 证书类型 */
			certType: string;
			/** 管理级别 */
			managementLevel: string;
			/** 刻度得分 */
			scaleScore: number;
		}>;
	};
	/** 绩效详情 */
	performance: {
		/** 雷达图分数 */
		score: number;
		/** 历年绩效列表 */
		appraisalList: Array<{
			/** 年度 */
			year: string;
			/** 等级 */
			grade: string;
		}>;
	};
}
