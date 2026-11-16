import type { OrgAdjustmentTaskSettings } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";

export type DisplayFieldSettingKey = Exclude<
	keyof OrgAdjustmentTaskSettings,
	| "rootNodeId"
	| "showAdjustmentOnly"
	| "showMoreInfo"
	| "targetRevenueIndicator"
	| "targetProfitIndicator"
	| "projectNumUnit"
	| "saturatedRevenueUnit"
	| "employeeNumUnit"
	| "childNodeNumUnit"
	| "targetRevenueUnit"
	| "targetProfitUnit"
>;

export interface DisplayFieldConfigItem {
	settingKey: DisplayFieldSettingKey;
	propertyKey: string;
	label: string;
}

export const DEFAULT_ORG_ADJUSTMENT_TASK_SETTINGS: OrgAdjustmentTaskSettings = {
	showAdjustmentOnly: false,
	showMoreInfo: false,
	showSaturatedRevenue: false,
	showTargetRevenue: false,
	targetRevenueIndicator: {
		indicatorPlanId: "",
		indicatorId: "",
		indicatorName: "",
	},
	showTargetProfit: false,
	targetProfitIndicator: {
		indicatorPlanId: "",
		indicatorId: "",
		indicatorName: "",
	},
	showEmployeeNum: false,
	showChildNodeNum: false,
	showProjectNum: false,
	showPlanDeliveryProjectNum: false,
	showExpandDeliveryProjectNum: false,
};

export const DISPLAY_FIELD_CONFIG: DisplayFieldConfigItem[] = [
	{ settingKey: "showSaturatedRevenue", propertyKey: "saturatedRevenue", label: "饱和营收" },
	{ settingKey: "showEmployeeNum", propertyKey: "employeeNum", label: "员工数" },
	{ settingKey: "showChildNodeNum", propertyKey: "childNodeNum", label: "下级节点数" },
	{ settingKey: "showTargetRevenue", propertyKey: "targetRevenue", label: "目标营收" },
	{ settingKey: "showTargetProfit", propertyKey: "targetProfit", label: "目标利润" },
	{ settingKey: "showProjectNum", propertyKey: "projectNum", label: "在管项目数" },
	{
		settingKey: "showPlanDeliveryProjectNum",
		propertyKey: "planDeliveryProjectNum",
		label: "计划交付项目数",
	},
	{
		settingKey: "showExpandDeliveryProjectNum",
		propertyKey: "expandDeliveryProjectNum",
		label: "当拓当交项目数",
	},
];
