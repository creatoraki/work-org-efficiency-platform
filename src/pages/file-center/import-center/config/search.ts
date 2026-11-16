import type { SearchField } from "#src/components/searchable-table";
import { MODULE_OPTIONS } from "./modules";
import { IMPORT_STATUS_OPTIONS } from "./status";

export const SEARCH_SCHEMA: SearchField[] = [
	{
		name: "taskName",
		label: "任务名称",
		type: "input",
		fieldProps: { allowClear: true, placeholder: "请输入" },
	},
	{
		name: "moduleName",
		label: "模块名称",
		type: "cascader",
		options: MODULE_OPTIONS,
		fieldProps: { allowClear: true, placeholder: "请选择" },
	},
	{
		name: "status",
		label: "状态",
		type: "select",
		options: IMPORT_STATUS_OPTIONS,
	},
];
