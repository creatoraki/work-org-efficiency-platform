/**
 * 流程列表搜索字段配置
 */
export const searchSchema = [
	{
		name: "approvalCode",
		label: "流程编号",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "name",
		label: "任务名称",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "targetPlanName",
		label: "计划名称",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{ name: "subperiod", label: "目标周期", type: "input" },
	{
		name: "status",
		label: "状态",
		type: "select",
		options: [
			{ label: "流程中", value: "inProgress" },
			{ label: "已结束", value: "finished" },
			{ label: "已中止", value: "aborted" },
		],
	},
	{
		name: "approvalUserId",
		label: "当前审批人",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "submitUserName",
		label: "发起人",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
];
