/**
 * 字典 Hook 默认配置
 */
export const DICT_DEFAULT_CONFIG = {
	/**
	 * 数据新鲜时间（毫秒）
	 * 在此时间内，数据被视为新鲜，不会重新请求
	 * 默认：5 分钟
	 */
	STALE_TIME: 5 * 60 * 1000,

	/**
	 * 缓存保留时间（毫秒）
	 * 在此时间后，未使用的缓存数据会被清理
	 * 默认：10 分钟
	 */
	GC_TIME: 10 * 60 * 1000,

	/**
	 * 是否在窗口聚焦时重新获取数据
	 * 字典数据通常不会频繁变化，默认不重新获取
	 */
	REFETCH_ON_WINDOW_FOCUS: false,

	/**
	 * 是否在网络恢复时重新获取数据
	 * 字典数据通常不会频繁变化，默认不重新获取
	 */
	REFETCH_ON_RECONNECT: false,

	/**
	 * 启用状态的字典项状态值
	 */
	ENABLED_STATUS: "0",

	/**
	 * 空值显示文本
	 */
	EMPTY_VALUE_DISPLAY: "-",
} as const;
