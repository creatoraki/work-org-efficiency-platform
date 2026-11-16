/**
 * 组织审核列表搜索字段配置
 */

import type { SearchField } from "#src/components/searchable-table";

export function buildSearchSchema(options: {
	currentApproverOptions: Array<{ label: string; value: string }>;
	initiatorOptions: Array<{ label: string; value: string }>;
	statusOptions: Array<{ label: string; value: string }>;
}): SearchField[] {
	return [
		{
			name: "approvalCode",
			label: "流程编号",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "支持模糊搜索" },
		},
		{
			name: "approvalName",
			label: "任务名称",
			type: "input",
			fieldProps: { allowClear: true, placeholder: "支持模糊搜索" },
		},
		{
			name: "status",
			label: "状态",
			type: "select",
			placeholder: "请选择",
			options: options.statusOptions,
		},
		{
			name: "currentApprover",
			label: "当前审批人",
			type: "select",
			placeholder: "请选择",
			fieldProps: {
				allowClear: true,
				showSearch: true,
				optionFilterProp: "label",
			},
			options: options.currentApproverOptions,
		},
		{
			name: "initiatorUserName",
			label: "发起人",
			type: "select",
			placeholder: "请选择",
			fieldProps: {
				allowClear: true,
				showSearch: true,
				optionFilterProp: "label",
			},
			options: options.initiatorOptions,
		},
	];
}
