import type { YearlyReportStatus } from "#src/api/performance-management/yearly-performance";
import type { Dayjs } from "dayjs";

/** 筛选区表单值（页面态，查询时再转换为接口参数） */
export interface ReportFilterValues {
	/** 员工姓名 */
	employeeName?: string;
	/** 管理者类别级联路径 */
	managerCategory?: string[];
	/** 述职状态 */
	status?: YearlyReportStatus;
	/** 述职时间范围 */
	reportTimeRange?: [Dayjs | null, Dayjs | null] | null;
}

/** 文件夹弹窗模式 */
export type FolderModalState =
	| { type: "create" }
	| { type: "rename"; folderId: string; folderName: string }
	| { type: "move" }
	| null;
