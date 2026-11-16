/**
 * 导出模板配置页面常量定义
 */

/**
 * 模块选项(可从字典API获取,这里先硬编码)
 */
export const MODULE_OPTIONS = [
	{ label: "战略拆解", value: "战略拆解" },
	{ label: "标签管理", value: "标签管理" },
	{ label: "人员档案", value: "人员档案" },
	{ label: "组织档案", value: "组织档案" },
	{ label: "其他", value: "其他" },
];

/**
 * Drawer 宽度
 */
export const DRAWER_WIDTH = 720;

/**
 * 表格列宽配置
 */
export const COLUMN_WIDTHS = {
	id: 80,
	fileName: 200,
	module: 150,
	dataReqUrl: 250,
	createTime: 180,
	actions: 150,
};
