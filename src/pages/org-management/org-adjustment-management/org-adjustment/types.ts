/**
 * 组织调整模块类型定义
 */

import type {
	CreateOrgAdjustmentTaskParams,
	OrgAdjustmentTaskListItem,
	OrgAdjustmentTaskSearchOptionsData,
	OrgAdjustmentTaskStatisticsData,
} from "#src/api/org-management/org-adjustment-management/org-adjustment";
import type { DictOption } from "#src/api/system/dict/types";

/**
 * 兼容旧 mock 逻辑的任务统计类型。
 * 待相关 mock API 清理后可移除。
 */
export interface TaskCounts {
	totalNum: number;
	draftNum: number;
	inProgressNum: number;
	completedNum: number;
}

/**
 * 页面顶部统计信息
 */
export type OrgAdjustmentTaskStatisticsState = OrgAdjustmentTaskStatisticsData;

/**
 * 页面查询选项状态
 */
export type OrgAdjustmentTaskSearchOptionsState = OrgAdjustmentTaskSearchOptionsData;

/**
 * 页面表格行数据
 */
export type OrgAdjustmentTaskTableRow = Omit<
	OrgAdjustmentTaskListItem,
	"createTime" | "updateTime"
> & {
	createTime: string;
	updateTime: string;
};

/**
 * 表单提交值
 */
export type OrgAdjustmentTaskFormValues = Pick<
	CreateOrgAdjustmentTaskParams,
	"taskName" | "remark"
>;

/**
 * 搜索条件构建参数
 */
export interface BuildTaskSearchSchemaParams {
	taskSearchOptions: OrgAdjustmentTaskSearchOptionsState;
	taskStatusOptions: DictOption[];
}
