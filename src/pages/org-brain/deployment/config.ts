/**
 * 排兵布阵通用配置与常量
 */
import {
	DeploymentDeliveryStatusEnum,
	DeploymentStatusEnum,
} from "@/api/org-brain/deployment/types";

export { DeploymentDeliveryStatusEnum, DeploymentStatusEnum };

/** 筛选项缓存时间：5 分钟 */
export const DEPLOYMENT_SEARCH_OPTIONS_STALE_TIME = 5 * 60 * 1000;

/**
 * 排兵布阵字典 Key
 * 与后端 sys_dict_type.dict_type 保持一致，用于列表筛选项统一由字典表维护。
 */
export const DEPLOYMENT_DICT_KEYS = {
	PROJECT_TYPE: "org_brain_deployment_project_type",
	DELIVERY_STATUS: "org_brain_deployment_delivery_status",
	DEPLOYMENT_STATUS: "org_brain_deployment_deployment_status",
} as const;

/**
 * 排兵布阵项目类型枚举
 * 枚举值与 sys_dict_data.dict_value 保持一致，用于项目类型筛选。
 */
export enum DeploymentProjectTypeEnum {
	/** 住宅项目 */
	RESIDENTIAL = "1",
	/** 非住宅项目 */
	NON_RESIDENTIAL = "2",
}

/**
 * 排兵布阵项目类型选项
 * 供列表筛选下拉框使用，value 使用 DeploymentProjectTypeEnum 保证和字典值一致。
 */
export const DEPLOYMENT_PROJECT_TYPE_OPTIONS = [
	{ label: "住宅", value: DeploymentProjectTypeEnum.RESIDENTIAL },
	{ label: "非住宅", value: DeploymentProjectTypeEnum.NON_RESIDENTIAL },
] as const;

/**
 * 判断是否允许查看排兵布阵。
 *
 * 条件：交付状态为 已交付/退场/进场 且 排布状态为 已排布/排布中。
 * 用于列表操作栏「查看排兵布阵」入口的显示控制。
 *
 * @param deliveryStateCode - 交付状态编码
 * @param deployStatusCode   - 排布状态编码
 * @returns 允许查看时返回 true
 *
 * @author 王善能
 * @since 2026-06-25
 */
export function canViewDeployment(deliveryStateCode: string, deployStatusCode: string): boolean {
	return (
		(deliveryStateCode === DeploymentDeliveryStatusEnum.DELIVERED ||
			deliveryStateCode === DeploymentDeliveryStatusEnum.RESERVE_EXIT ||
			deliveryStateCode === DeploymentDeliveryStatusEnum.MANAGED_EXIT) &&
		(deployStatusCode === DeploymentStatusEnum.DEPLOYED ||
			deployStatusCode === DeploymentStatusEnum.DEPLOYING)
	);
}
