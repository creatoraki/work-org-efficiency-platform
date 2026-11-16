export function getBusinessItems(data: any) {
	return [
		{
			key: "businessCode",
			label: "商机编号",
			children: data?.businessCode || "-",
		},
		{
			key: "businessName",
			label: "商机名称",
			children: data?.businessName || "-",
		},
		{
			key: "customerName",
			label: "客户名称",
			children: data?.customerName || "-",
		},
		{
			key: "projectName",
			label: "项目名称",
			children: data?.projectName || "-",
		},
		{
			key: "performanceDept",
			label: "业绩归属部门",
			children: data?.performanceDept || "-",
		},
		{
			key: "projectStatus",
			label: "项目状态",
			children: data?.projectStatus || "-",
		},
		{
			key: "projectSource",
			label: "项目来源",
			children: data?.projectSource || "-",
		},
		{
			key: "propertyType",
			label: "物业类型",
			children: data?.propertyType || "-",
		},
		{
			key: "businessModel",
			label: "业务模式",
			children: data?.businessModel || "-",
		},
		{
			key: "businessType",
			label: "商机类型",
			children: data?.businessType || "-",
		},
		{
			key: "businessClassify",
			label: "商机分级",
			children: data?.businessClassify || "-",
		},
		{
			key: "businessStage",
			label: "商机阶段",
			children: data?.businessStage || "-",
		},
		{
			key: "businessStatusGroup",
			label: "商机状态组",
			children: data?.businessStatusGroup || "-",
		},
		{
			key: "openTime",
			label: "开标时间",
			children: data?.openTime || "-",
		},
		{
			key: "openResults",
			label: "开标结果",
			children: data?.openResults || "-",
		},
		{
			key: "exTransactionDate",
			label: "预期成交日期",
			children: data?.exTransactionDate || "-",
		},
		{
			key: "lastFollowTime",
			label: "最后跟进时间",
			children: data?.lastFollowTime || "-",
		},
		{
			key: "lastFollowRecord",
			label: "最后跟进记录",
			children: data?.lastFollowRecord || "-",
		},
		{
			key: "ownerUser",
			label: "负责人",
			children: data?.ownerUser || "-",
		},
	];
}

export function getProjectItems(data: any) {
	return [
		{
			key: "projCode",
			label: "项目编码",
			children: data?.projCode || "-",
		},
		{
			key: "projName",
			label: "项目名称",
			children: data?.projName || "-",
		},
		{
			key: "projNatureName",
			label: "项目性质",
			children: data?.projNatureName || "-",
		},
		{
			key: "projTypeName",
			label: "项目类型",
			children: data?.projTypeName || "-",
		},
		{
			key: "propertyTypeName",
			label: "物业类型",
			children: data?.propertyTypeName || "-",
		},
		{
			key: "businessTypeName",
			label: "业务模式",
			children: data?.businessTypeName || "-",
		},
		{
			key: "projGradeName",
			label: "服务等级",
			children: data?.projGradeName || "-",
		},
		{
			key: "contractNature",
			label: "收费模式",
			children: data?.contractNature || "-",
		},
		{
			key: "isExpandDeliver",
			label: "是否当年拓展交付",
			children: data?.isExpandDeliver || "-",
		},
		{
			key: "isStock",
			label: "是否存量",
			children: data?.isStock || "-",
		},
		{
			key: "deliveryStatus",
			label: "在管项目状态",
			children: data?.deliveryStatus || "-",
		},
		{
			key: "deliveryDate",
			label: "首次交付日期",
			children: data?.deliveryDate || "-",
		},
		{
			key: "isSingleProperty",
			label: "是否单一产权",
			children: data?.isSingleProperty || "-",
		},
		{
			key: "exitStatus",
			label: "退出项目状态",
			children: data?.exitStatus || "-",
		},
		{
			key: "acturalExitDate",
			label: "实际退出日期",
			children: data?.acturalExitDate || "-",
		},
		{
			key: "deliveryStandard",
			label: "交付标准",
			children: data?.deliveryStandard || "-",
		},
	];
}
export function getOrgItems(data: any) {
	return [
		{
			key: "orgCode",
			label: "组织编码",
			children: data?.orgCode || "-",
		},
		{
			key: "orgFullName",
			label: "组织名称",
			children: data?.orgFullName?.split("|")?.reverse()?.[0] || "-",
		},
		{
			key: "company",
			label: "所属公司",
			children: data?.company || "-",
		},
		{
			key: "orgType",
			label: "部门类型",
			children: data?.orgType || "-",
		},
		{
			key: "bornDate",
			label: "成立日期",
			children: data?.bornDate || "-",
		},
		{
			key: "manageForm",
			label: "管理形式",
			children: data?.manageForm || "-",
		},
		{
			key: "isMerge",
			label: "是否并表",
			children: data?.isMerge || "-",
		},
		{
			key: "isVirtual",
			label: "是否虚拟",
			children: data?.isVirtual || "-",
		},
		{
			key: "depStatus",
			label: "部门状态",
			children: data?.depStatus || "-",
		},
		{
			key: "province",
			label: "工作省份",
			children: data?.province || "-",
		},
		{
			key: "city",
			label: "工作城市",
			children: data?.city || "-",
		},
		{
			key: "county",
			label: "工作县区",
			children: data?.county || "-",
		},
	];
}

export function getNotProjectItems(data: any) {
	return [
		{
			key: "orgCode",
			label: "组织编码",
			children: data?.orgCode || "-",
		},
		{
			key: "orgType",
			label: "组织性质",
			children: data?.orgType || "-",
		},
		{
			key: "orgFullName",
			label: "组织名称",
			children: data?.orgFullName?.split("|")?.reverse()?.[0] || "-",
		},
		{
			key: "company",
			label: "上级组织",
			children: data?.company || "-",
		},
		{
			key: "isVirtual",
			label: "是否虚拟",
			children: data?.isVirtual || "-",
		},
		{
			key: "bornDate",
			label: "成立日期",
			children: data?.bornDate || "-",
		},
		{
			key: "province",
			label: "工作省份",
			children: data?.province || "-",
		},
		{
			key: "city",
			label: "工作城市",
			children: data?.city || "-",
		},
		{
			key: "county",
			label: "工作县区",
			children: data?.county || "-",
		},
	];
}
export function getStaffItems(data: any) {
	return [
		{
			key: "establishment",
			label: "编制数",
			children: `${data?.establishment || 0}人`,
		},
		{
			key: "onjobNum",
			label: "在职数",
			children: `${data?.onjobNum || 0}人`,
		},
		{
			key: "reserveNum",
			label: "储备数",
			children: `${data?.reserveNum || 0}人`,
		},
		{
			key: "pmanagerBz",
			label: "项目管理",
			children: `编制${data?.pmanagerBz || 0}人/在职${data?.pmanagerOnjob || 0}人`,
		},
		{
			key: "housekeeperBz",
			label: "客服",
			children: `编制${data?.housekeeperBz || 0}人/在职${data?.housekeeperOnjob || 0}人`,
		},
		{
			key: "engineerBz",
			label: "工程",
			children: `编制${data?.engineerBz || 0}人/在职${data?.engineerOnjob || 0}人`,
		},
		{
			key: "securityBz",
			label: "保安",
			children: `编制${data?.securityBz || 0}人/在职${data?.securityOnjob || 0}人`,
		},
		{
			key: "cleanerBz",
			label: "保洁",
			children: `编制${data?.cleanerBz || 0}人/在职${data?.cleanerOnjob || 0}人`,
		},
		{
			key: "afforestBz",
			label: "绿化",
			children: `编制${data?.afforestBz || 0}人/在职${data?.afforestOnjob || 0}人`,
		},
	];
}

export function getProjScaleColumns({ page }: { page: { pageNum: number; pageSize: number } }) {
	const { pageNum = 1, pageSize = 10 } = page;
	return [
		{
			title: "序号",
			dataIndex: "controlDimension",
			hideInSearch: true,
			render: (_: any, __: any, index: number) => index + 1 + (pageNum - 1) * pageSize,
		},
		{
			title: "地区",
			dataIndex: "areaName",
			hideInSearch: true,
		},
		{
			title: "项目群",
			dataIndex: "pgroupName",
			hideInSearch: true,
		},
		{
			title: "项目名称",
			dataIndex: "orgName",
			hideInSearch: true,
		},
		{
			title: "物业类型",
			dataIndex: "projType",
			hideInSearch: true,
		},
		{
			title: "服务等级",
			dataIndex: "projGrade",
			hideInSearch: true,
		},
		{
			title: "业务模式",
			dataIndex: "orgType",
			hideInSearch: true,
		},
		{
			title: "项目类型",
			dataIndex: "orgStatus",
			hideInSearch: true,
		},
	];
}

export function getProjInformationColumns({
	page,
}: {
	page: { pageNum: number; pageSize: number };
}) {
	const { pageNum = 1, pageSize = 10 } = page;
	return [
		{
			title: "序号",
			dataIndex: "controlDimension",
			hideInSearch: true,
			render: (_: any, __: any, index: number) => index + 1 + (pageNum - 1) * pageSize,
		},
		// {
		// 	title: "账号",
		// 	dataIndex: "account",
		// 	hideInSearch: true
		// },
		{
			title: "姓名",
			dataIndex: "name",
			hideInSearch: true,
		},
		{
			title: "工号",
			dataIndex: "id",
			hideInSearch: true,
		},
		{
			title: "岗位",
			dataIndex: "staffJobName",
			hideInSearch: true,
		},
		{
			title: "职位",
			dataIndex: "staffPostName",
			hideInSearch: true,
		},
		{
			title: "职级",
			dataIndex: "postGradeName",
			hideInSearch: true,
		},
		{
			title: "电话",
			dataIndex: "mobileNum",
			hideInSearch: true,
		},
		{
			title: "性别",
			dataIndex: "sex",
			hideInSearch: true,
			render: (value: any) => (value === "1" ? "女" : "男"),
		},
		{
			title: "司龄",
			dataIndex: "cyear",
			hideInSearch: true,
		},
	];
}

/**
 * 组织档案模块权限标识管理
 *
 * 谨慎修改，避免权限失效
 */
export const ORG_FILE_PERMISSIONS = {
	/** 组织档案导出按钮 */
	ORG_FILE_EXPORT: "orgfile:export",
} as const;
