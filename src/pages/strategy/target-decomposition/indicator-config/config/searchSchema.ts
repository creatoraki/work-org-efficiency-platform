import { STATUS_OPTIONS } from "./constants";

/**
 * 生成搜索表单字段配置
 */
export function createSearchSchema() {
	return [
		{
			name: "planName",
			label: "计划名称",
			type: "input",
			formProps: {
				allowClear: true,
				placeholder: "支持模糊搜索",
			},
		},
		{
			name: "subperiod",
			label: "目标周期",
		},
		{
			name: "status",
			label: "状态",
			type: "select",
			options: STATUS_OPTIONS,
		},
		{
			name: "owner",
			label: "主责人",
			type: "input",
		},
	];
}
