/**
 * 创建搜索表单配置
 */
export function createSearchSchema() {
	return [
		{
			name: "name",
			label: "任务名称",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "请输入" },
		},
		{
			name: "targetOrgName",
			label: "拆解对象",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "请输入" },
		},
		{
			name: "targetPlanName",
			label: "计划名称",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "请输入" },
		},
		{
			name: "subperiod",
			label: "目标周期",
			type: "input",
		},
		{
			name: "submitUserName",
			label: "下发人",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "请输入" },
		},
		{
			name: "confirmUserName",
			label: "确认人",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "请输入" },
		},
		{
			name: "status",
			label: "状态",
			type: "select",
			options: [
				{ label: "未确认", value: 0 },
				{ label: "被驳回", value: 3 },
				{ label: "已确认", value: 2 },
				{ label: "废弃", value: 5 },
			],
		},
	];
}
