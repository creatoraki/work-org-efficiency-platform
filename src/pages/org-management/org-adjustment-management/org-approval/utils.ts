import type {
	OrgApprovalDateValue,
	OrgApprovalListItem,
	OrgApprovalListParams,
} from "#src/api/org-management/org-adjustment-management/org-approval";
import type { OrgApprovalRecord, OrgApprovalStatistics } from "./types";

/**
 * 构建组织审批列表查询参数
 */
export function buildOrgApprovalListParams(params: Record<string, any>): OrgApprovalListParams {
	const status =
		params.status === "" || typeof params.status === "undefined"
			? undefined
			: String(params.status);

	const currentApprover = params.currentApprover || undefined;

	return {
		pageNum: params.pageNum || 1,
		pageSize: params.pageSize || 10,
		searchCount: true,
		businessType: "orgAdjustment",
		sortItemList: [
			{
				isAsc: false,
				column: "start_time",
			},
		],
		approvalCode: params.approvalCode || undefined,
		approvalName: params.approvalName || undefined,
		status,
		initiatorUserName: params.initiatorUserName || undefined,
		createUser: currentApprover,
	};
}

/**
 * 将接口数据映射为页面表格数据
 */
export function mapOrgApprovalRecord(item: OrgApprovalListItem): OrgApprovalRecord {
	return {
		id: item.id,
		approvalCode: item.approvalCode,
		approvalName: item.approvalName,
		businessVersion: item.businessVersion,
		status: item.status,
		statusStr: item.statusStr,
		currentApprover: item.operatorName || item.creatorName || "--",
		startTime: item.startTime,
		initiatorUserName: item.initiatorUserName,
		raw: item,
	};
}

/**
 * 统计当前列表中的状态数量
 */
export function buildOrgApprovalStatistics(list: OrgApprovalRecord[]): OrgApprovalStatistics {
	return list.reduce<OrgApprovalStatistics>(
		(acc, item) => {
			acc.totalCount += 1;
			if (String(item.status) === "0") {
				acc.inProgressCount += 1;
			} else if (String(item.status) === "2") {
				acc.finishedCount += 1;
			} else if (String(item.status) === "1") {
				acc.abortedCount += 1;
			}
			return acc;
		},
		{
			totalCount: 0,
			inProgressCount: 0,
			finishedCount: 0,
			abortedCount: 0,
		},
	);
}

/**
 * 根据当前列表构建下拉选项
 */
export function buildUserSelectOptions(
	list: OrgApprovalRecord[],
	field: "currentApprover" | "initiatorUserName",
) {
	return Array.from(new Set(list.map((item) => item[field]).filter(Boolean))).map((value) => ({
		label: value,
		value,
	}));
}

/**
 * 格式化审批时间字段
 */
export function formatOrgApprovalDateTime(value: OrgApprovalDateValue | string | null | undefined) {
	if (!value) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	const dateValue = value as {
		time?: number;
		timestamp?: number;
		epochMilli?: number;
		year?: number;
		monthValue?: number;
		dayOfMonth?: number;
		hour?: number;
		minute?: number;
		second?: number;
	};

	const timestamp = dateValue.time ?? dateValue.timestamp ?? dateValue.epochMilli;
	if (typeof timestamp === "number") {
		return new Date(timestamp).toLocaleString("zh-CN");
	}

	const { year, monthValue, dayOfMonth, hour, minute, second } = dateValue;
	if (
		typeof year === "number" &&
		typeof monthValue === "number" &&
		typeof dayOfMonth === "number"
	) {
		const month = String(monthValue).padStart(2, "0");
		const day = String(dayOfMonth).padStart(2, "0");
		const hours = String(hour ?? 0).padStart(2, "0");
		const minutes = String(minute ?? 0).padStart(2, "0");
		const seconds = String(second ?? 0).padStart(2, "0");
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	return String(value);
}
