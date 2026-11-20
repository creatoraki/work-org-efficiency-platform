import type {
	AppraisalFolder,
	AppraisalStatus,
} from "#src/api/performance-management/yearly-performance";
import type { Dayjs } from "dayjs";

/** 筛选区表单值（页面态，查询时再转换为接口参数，见 utils.toUserFilter） */
export interface ReportFilterValues {
	/** 员工姓名 / 工号 → userName */
	userName?: string;
	/** 管理者类别级联路径 → jobType */
	jobTypePath?: string[];
	/** 述职状态 → appraisalStatus */
	appraisalStatus?: AppraisalStatus;
	/** 述职日期范围 → appraisalDateStart / appraisalDateEnd */
	appraisalDateRange?: [Dayjs | null, Dayjs | null] | null;
}

/** 文件夹弹窗模式 */
export type FolderModalState =
	| { type: "create" }
	| { type: "rename"; folder: AppraisalFolder }
	| { type: "move" }
	| null;
