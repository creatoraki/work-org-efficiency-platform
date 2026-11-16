/** 方案序号对应的中文标签（方案一、方案二、方案三...） */
export const SCHEME_LABEL: Record<number, string> = {
	1: "一",
	2: "二",
	3: "三",
};

/** 排兵布阵表格默认 scroll.y，与岗位矩阵表保持一致 */
export const DEPLOYMENT_TABLE_DEFAULT_SCROLL_Y = 400;

/** 表格体内滚最小高度；低于此值改由外层容器滚动 */
export const DEPLOYMENT_TABLE_MIN_SCROLL_Y = 200;

/** Ant Design small Table 表头高度，DOM 未就绪时的回退值 */
export const DEPLOYMENT_ANT_TABLE_HEADER_HEIGHT = 39;

/** 预览模式矩阵表超过该行数时启用固定 scroll.y 内滚 */
export const DEPLOYMENT_PREVIEW_MATRIX_SCROLL_ROW_THRESHOLD = 8;

/** 岗位矩阵配置提示文案，预览与导出共用同一口径 */
export const DEPLOYMENT_MATRIX_CONFIG_TIP =
	"提示：初始配置来源EHR编制，可以基于与标杆差异对比判断是否需要调整";
