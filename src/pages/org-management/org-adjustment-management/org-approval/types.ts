import type {
	OrgApprovalDateValue,
	OrgApprovalListItem,
} from "#src/api/org-management/org-adjustment-management/org-approval";

/**
 * 组织审批页面列表项类型
 */
export interface OrgApprovalRecord {
	id: string;
	approvalCode: string;
	approvalName: string;
	businessVersion: string;
	status: string;
	statusStr: string;
	currentApprover: string;
	startTime: OrgApprovalDateValue;
	initiatorUserName: string;
	raw: OrgApprovalListItem;
}

/**
 * 组织审批状态统计
 */
export interface OrgApprovalStatistics {
	totalCount: number;
	inProgressCount: number;
	finishedCount: number;
	abortedCount: number;
}
