export const RESPONSIBLE_DEPARTMENTS = [
	{ label: "审计监察中心", value: 0 },
	{ label: "本体建设中心", value: 1 },
	{ label: "客户服务中心", value: 2 },
	{ label: "运营管控中心", value: 3 },
	{ label: "市场发展中心", value: 4 },
];

export const INDICATOR_TYPES = [
	{ label: "基础指标", value: 0 },
	{ label: "复合指标", value: 1 },
];

export const ONLINE_STATUS = [
	{ label: "未上线", value: 0 },
	{ label: "已上线", value: 1 },
];

// 数据单位枚举
export const UNIT_OPTIONS_NUMBER = [
	{ label: "元", value: 0 },
	{ label: "万元", value: 1 },
	{ label: "人", value: 2 },
	{ label: "个", value: 3 },
];

export const UNIT_OPTIONS_PERCENT = [{ label: "%", value: 99 }];

export const UNIT_OPTIONS_ALL = [...UNIT_OPTIONS_NUMBER, ...UNIT_OPTIONS_PERCENT];
