export const SEARCH_SCHEMA = [
	{
		name: "name",
		label: "任务名称",
		type: "input",
		fieldProps: {
			allowClear: true,
			placeholder: "请输入",
		},
	},
	{
		name: "targetPlanName",
		label: "计划名称",
		type: "input",
		fieldProps: {
			allowClear: true,
			placeholder: "请输入",
		},
	},
	{ name: "subperiod", label: "目标周期", type: "input" },
	{
		name: "fillingStatus",
		label: "状态",
		type: "select",
		options: [
			{ label: "未完成", value: 0 },
			{ label: "进行中", value: 1 },
			{ label: "已完成", value: 2 },
			// { label: "已提交", value: 3 },
			{ label: "已停用", value: 4 },
		],
	},
	{
		name: "responsibleUserName",
		label: "主责人",
		type: "input",
		fieldProps: {
			allowClear: true,
			placeholder: "请输入",
		},
	},
];
