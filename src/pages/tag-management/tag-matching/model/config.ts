/**
 * 标签匹配管理 - 匹配模型配置
 */

/**
 * 匹配模型状态选项
 */
export const MATCHING_MODEL_STATUS_OPTIONS = [
	{
		label: "未上线",
		value: "offline",
	},
	{
		label: "已上线",
		value: "online",
	},
];

/**
 * 匹配模型状态徽章配置
 */
export const MATCHING_MODEL_STATUS_BADGE_CONFIG = {
	offline: {
		color: "#8C8C8C",
		backgroundColor: "#F5F5F5",
		text: "未上线",
	},
	online: {
		color: "#14B968",
		backgroundColor: "#E8F5E8",
		text: "已上线",
	},
};

/**
 * 表格配置
 */
export const TABLE_CONFIG = {
	OPTIONS: {
		reload: true,
		density: true,
		fullScreen: true,
		setting: true,
	},
	PAGINATION: {
		pageSize: 20,
		showSizeChanger: true,
		showQuickJumper: true,
		showTotal: (total: number, range: [number, number]) =>
			`第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
	},
};
