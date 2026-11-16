/**
 * 接口管理-列表 mock 类型
 */
export interface InterfaceTask {
	id: number | string;
	/** 任务名称 */
	taskName: string;
	/** 流程编号 */
	processNo: string;
	/** 业务系统 */
	businessSystem: string;
	/** 生效时间 */
	effectiveTime: string;
	/** 状态 */
	status: "流程中" | "已结束" | "已中止" | string | number;
}
