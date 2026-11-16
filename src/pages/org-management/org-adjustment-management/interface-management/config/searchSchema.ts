/**
 * 接口管理列表搜索字段配置
 */

import type { SearchField } from "#src/components/searchable-table";

export const searchSchema: SearchField[] = [
	{
		name: "taskName",
		label: "任务名称",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "支持模糊搜索" },
	},
	{
		name: "processNo",
		label: "流程编号",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "支持模糊搜索" },
	},
	{
		name: "businessSystem",
		label: "业务系统",
		type: "select",
		placeholder: "请选择",
		options: [
			{ label: "人事系统", value: "人事系统" },
			{ label: "绩效系统", value: "绩效系统" },
			{ label: "财务系统", value: "财务系统" },
		],
	},
	{
		name: "effectiveTime",
		label: "生效时间",
		type: "dateRange",
		fieldProps: {
			placeholder: ["请选择", "请选择"],
		},
	},
	{
		name: "status",
		label: "状态",
		type: "select",
		placeholder: "请选择",
		options: [
			{ label: "流程中", value: "流程中" },
			{ label: "已结束", value: "已结束" },
			{ label: "已中止", value: "已中止" },
		],
	},
];
