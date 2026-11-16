/**
 * 性别字典选项：0=女，1=男
 *
 * @author 王善能
 * @date 2026-04-16
 */
export const GENDER_OPTIONS = [
	{ name: "女", value: "0" },
	{ name: "男", value: "1" },
] as const;

/** 人员档案表格列宽配置，作为单列宽度与表格总宽度的唯一数据源。 */
export const PERSONNEL_ARCHIVE_COLUMN_WIDTHS = {
	name: 150,
	organization: 200,
	job: 150,
	post: 150,
	postgrade: 150,
	joinDate: 120,
} as const;

/** 人员档案表格横向总宽度。 */
export const PERSONNEL_ARCHIVE_TABLE_WIDTH = Object.values(PERSONNEL_ARCHIVE_COLUMN_WIDTHS).reduce(
	(total, width) => total + width,
	0,
);

/**
 * 判断是否存在有效性别值
 *
 * @author 王善能
 * @date 2026-04-16
 * @param gender - 性别值
 * @returns 是否存在有效性别值
 */
export function hasValidGender(gender?: string): boolean {
	return GENDER_OPTIONS.some((item) => item.value === gender);
}
