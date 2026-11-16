/**
 * 任务列表搜索字段配置
 */

import type { SearchField } from "#src/components/searchable-table";

export const searchSchema: SearchField[] = [
	{
		name: "taskName",
		label: "任务名称",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "status",
		label: "任务状态",
		type: "select",
		fieldProps: { allowClear: true, placeholder: "请选择" },
	},
	{
		name: "creatorName",
		label: "创建人",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "updateName",
		label: "更新人",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
];
