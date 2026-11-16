import type { GetArchiveProjectTagRes } from "#src/api/org-management/org-file";

function getNumber(num: any, unit = "", fixNum = 0) {
	const value = num ?? "-";
	if (value !== "-") {
		return String(Number(value)?.toFixed(fixNum)) + unit;
	} else {
		return value;
	}
}
export function getBasicItems(data: GetArchiveProjectTagRes | any) {
	return [
		{
			key: "propertyTypeName",
			label: "物业类型",
			children: data?.propertyTypeName || "-",
		},
		{
			key: "projClassName",
			label: "业务模式",
			children: data?.projClassName || "-",
		},
		{
			key: "projGradeName",
			label: "服务等级",
			children: data?.projGradeName || "-",
		},
		{
			key: "deliveryStandardName",
			label: "交付标准",
			children: data?.deliveryStandardName || "-",
		},
		{
			key: "projNatureName",
			label: "项目性质",
			children: data?.projNatureName || "-",
		},
		{
			key: "contractNatureName",
			label: "收费模式",
			children: data?.contractNatureName || "-",
		},
		{
			key: "province",
			label: "所在省",
			children: data?.province || "-",
		},
		{
			key: "city",
			label: "所在市",
			children: data?.city || "-",
		},
		{
			key: "county",
			label: "所在区",
			children: data?.county || "-",
		},
		{
			key: "propertyFee",
			label: "物业费",
			children: data?.propertyFee || "-",
		},
		{
			key: "contractArea",
			label: "合同面积",
			children: getNumber(data?.contractArea, "m²", 2),
		},
		{
			key: "deliveryHouseNum",
			label: "交付户数",
			children: getNumber(data?.deliveryHouseNum, "户"),
		},
		{
			key: "houseNumLiveRate",
			label: "入住率",
			children: getNumber(data?.houseNumLiveRate, "%", 2),
		},
		{
			key: "projIsMultiResident",
			label: "是否高低配项目",
			children: data?.projIsMultiResident || "-",
		},
		{
			key: "projIsPublicRental",
			label: "是否配置公租房配套项目",
			children: data?.projIsPublicRental || "-",
		},
		{
			key: "projIsMulti",
			label: "综合类业态",
			children: data?.projIsMulti || "-",
		},
		{
			key: "projIsHighLiveRate",
			label: "是否高入住率",
			children: data?.projIsHighLiveRate || "-",
		},
	];
}

export function getKeyNodeItems(data: GetArchiveProjectTagRes | any) {
	return [
		{
			key: "projCycleName",
			label: "项目周期",
			children: data?.projCycleName || "-",
		},
		{
			key: "projIsRaisePrice",
			label: "是否提价",
			children: data?.projIsRaisePrice || "-",
		},
		{
			key: "projIsResign",
			label: "是否续约",
			children: data?.projIsResign || "-",
		},
		{
			key: "contractTerm",
			label: "合同任期",
			children: data?.contractTerm || "-",
		},
		{
			key: "projIsEstablish",
			label: "是否成立业委会",
			children: data?.projIsEstablish || "-",
		},
		{
			key: "committeeTerm",
			label: "业委会任期",
			children: data?.committeeTerm || "-",
		},
	];
}
export function getOperateItems(data: GetArchiveProjectTagRes | any) {
	return [
		{
			key: "projIsHighSatisfied",
			label: "高满意度项目",
			children: data?.projIsHighSatisfied || "-",
		},
		{
			key: "projIsHighCollect",
			label: "高收缴率项目",
			children: data?.projIsHighCollect || "-",
		},
		{
			key: "projIsMajor",
			label: "是否大型项目",
			children: data?.projIsMajor || "-",
		},
		{
			key: "projIsKey",
			label: "是否重点项目",
			children: data?.projIsKey || "-",
		},
		{
			key: "projIsTurnLossProfit",
			label: "扭亏为盈项目",
			children: data?.projIsTurnLossProfit || "-",
		},
		{
			key: "projIsLoss",
			label: "亏损项目",
			children: data?.projIsLoss || "-",
		},
		{
			key: "projIsLargeLoss",
			label: "攻坚克难项目",
			children: data?.projIsLargeLoss || "-",
		},
		{
			key: "modelProjType",
			label: "标杆项目类型",
			children: data?.modelProjType || "-",
		},
		// {
		// 	key: "projOperList",
		// 	label: "项目运营方案",
		// 	children: data?.projOperList || "-"
		// }
	];
}
export function getServiceItems(data: GetArchiveProjectTagRes | any) {
	return [
		{
			key: "projMajorComplaint",
			label: "是否重大投诉",
			children: data?.projMajorComplaint || "-",
		},
		{
			key: "projDeviceOnPost",
			label: "是否设备抵岗",
			children: data?.projDeviceOnPost || "-",
		},
		{
			key: "projPool",
			label: "泳池数量",
			children: getNumber(data?.projPool, "个"),
		},
		{
			key: "projClub",
			label: "会所数量",
			children: getNumber(data?.projClub, "个"),
		},
		{
			key: "yileCollege",
			label: "颐乐学院",
			children: data?.yileCollege || "-",
		},
		{
			key: "school430",
			label: "四点半学堂",
			children: data?.school430 || "-",
		},
		{
			key: "hasCanteen",
			label: "有无食堂",
			children: data?.hasCanteen || "-",
		},
		{
			key: "dormStarLvl",
			label: "星级宿舍",
			children: data?.dormStarLvl || "-",
		},
	];
}
