/**
 * 公司经历展示工具
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type {
	TalentArchiveCompanyHistoryItem,
	TalentArchiveCompanyHistoryType,
} from "#src/api/org-brain/personnel-archive";

const COMPANY_HISTORY_TYPE_LABEL_MAP: Record<TalentArchiveCompanyHistoryType, string> = {
	CONCURRENT: "兼岗",
	TRANSFER: "调岗",
};

/**
 * 获取公司经历类型展示文案
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function getCompanyHistoryTypeLabel(item: TalentArchiveCompanyHistoryItem): string {
	return item.typeLabel || COMPANY_HISTORY_TYPE_LABEL_MAP[item.type] || item.type;
}

/**
 * 获取公司经历部门展示文案
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function getCompanyHistoryDepartment(item: TalentArchiveCompanyHistoryItem): string {
	return [item.cityCompanyName, item.deptName].filter(Boolean).join(" - ") || "/";
}

/**
 * 获取主岗时间轴部门展示文案。
 *
 * 主岗外层节点只展示公司与一级部门；一级部门缺失时，用部门名称兜底。
 *
 * @author 王善能
 * @date 2026-04-28
 */
export function getCompanyHistoryPrimaryDepartment(item: TalentArchiveCompanyHistoryItem): string {
	return (
		[item.cityCompanyName, item.firstDeptName || item.deptName].filter(Boolean).join(" - ") ||
		"/"
	);
}

/**
 * 获取部门任职历程部门展示文案。
 *
 * 详情弹窗需要展示完整组织层级：公司、一级部门；当部门与一级部门不同时追加部门名称。
 *
 * @author 王善能
 * @date 2026-04-28
 */
export function getCompanyHistoryTransferDepartment(item: TalentArchiveCompanyHistoryItem): string {
	const firstDeptName = item.firstDeptName || "";
	const deptName = item.deptName || "";
	const displayDeptName = deptName && deptName !== firstDeptName ? deptName : "";

	return (
		[item.cityCompanyName, firstDeptName || deptName, displayDeptName]
			.filter(Boolean)
			.join(" - ") || "/"
	);
}

/**
 * 获取公司经历岗位展示文案
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function getCompanyHistoryJob(item: TalentArchiveCompanyHistoryItem): string {
	return item.jobName || "/";
}

/**
 * 获取公司经历职位展示文案
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function getCompanyHistoryPosition(item: TalentArchiveCompanyHistoryItem): string {
	return [item.postName, item.postgradeName].filter(Boolean).join("-") || "/";
}
