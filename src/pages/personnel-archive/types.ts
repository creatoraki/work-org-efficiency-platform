/**
 * 人员档案数据类型
 */
export interface PersonnelArchiveItem {
	id: string;
	employeeId: string; // 员工编号
	name: string; // 姓名
	gender: "male" | "female"; // 性别
	age: number; // 年龄
	department: string; // 部门
	position: string; // 职位
	phone: string; // 联系电话
	email: string; // 邮箱
	education: string; // 学历
	workExperience: string; // 工作经验
	skills: string[]; // 技能标签
	status: "active" | "inactive" | "pending"; // 状态
	creator: string; // 创建人
	createTime: string; // 创建时间
	updateTime: string; // 更新时间
}

/**
 * 档案审核数据类型
 */
export interface ArchiveAuditItem {
	id: string;
	employeeId: string; // 员工编号
	employeeName: string; // 员工姓名
	auditType: "create" | "update" | "delete"; // 审核类型
	auditStatus: "pending" | "approved" | "rejected"; // 审核状态
	changeContent: string; // 变更内容
	applicant: string; // 申请人
	auditor?: string; // 审核人
	applyTime: string; // 申请时间
	auditTime?: string; // 审核时间
	auditReason?: string; // 审核意见
}

/**
 * 面谈记录数据类型
 */
export interface InterviewRecordItem {
	id: string;
	employeeId: string; // 员工编号
	employeeName: string; // 员工姓名
	interviewType: "entry" | "regular" | "performance" | "exit"; // 面谈类型
	interviewer: string; // 面谈人
	interviewDate: string; // 面谈日期
	interviewContent: string; // 面谈内容
	interviewResult: string; // 面谈结果
	followUpActions: string; // 后续行动
	status: "scheduled" | "completed" | "cancelled"; // 状态
	creator: string; // 创建人
	createTime: string; // 创建时间
}

/**
 * 档案查询表单数据类型
 */
export interface ArchiveSearchForm {
	employeeId?: string;
	name?: string;
	department?: string;
	position?: string;
	status?: string[];
	createTimeRange?: [string, string];
}

/**
 * 面谈查询表单数据类型
 */
export interface InterviewSearchForm {
	employeeId?: string;
	employeeName?: string;
	interviewType?: string[];
	interviewer?: string;
	status?: string[];
	interviewDateRange?: [string, string];
}
