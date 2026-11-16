/**
 * 员工列表表格列配置
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { PersonnelArchiveItem } from "#src/api/org-brain/personnel-archive";
import type { ProColumns } from "@ant-design/pro-components";
import { Avatar, Tooltip, Typography } from "antd";

import { PERSONNEL_ARCHIVE_COLUMN_WIDTHS } from "../config";
import { formatOrganizationPath } from "./organization-path";

const { Link, Text } = Typography;

/**
 * 表格列操作处理器接口
 */
interface EmployeeTableColumnHandlers {
	/** 查看档案回调 */
	onViewArchive: (record: PersonnelArchiveItem) => void;
}

/**
 * 获取员工列表表格列配置
 *
 * @author 王善能
 * @date 2026-04-16
 * @param handlers - 操作处理器
 * @returns 表格列配置
 */
export function getEmployeeTableColumns(
	handlers: EmployeeTableColumnHandlers,
): ProColumns<PersonnelArchiveItem>[] {
	return [
		{
			title: "员工名称",
			dataIndex: "name",
			key: "name",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.name,
			fixed: "left",
			formItemProps: {
				colon: false,
				className: "rounded border border-[#DCDFE6]",
				labelCol: { flex: "8.5rem" },
				name: "keyword",
			},
			fieldProps: {
				variant: "borderless",
				placeholder: "模糊搜索：姓名/工号、组织、岗位、职位、入职时间",
			},
			render: (_, record) => (
				<div className="flex flex-shrink-0 items-center gap-1">
					<Avatar
						size="small"
						className="h-8 w-8 flex-shrink-0 border border-[rgb(var(--oo-colorPrimaryHover))] [&_img]:object-cover [&_img]:object-center"
						src={record.avatar}
						style={{
							backgroundColor: "rgb(var(--oo-colorPrimary) / 0.12)",
							color: "rgb(var(--oo-colorPrimary))",
						}}
					>
						{record.name?.[0]}
					</Avatar>
					<div className="flex-shrink-0">
						<div>
							<Link onClick={() => handlers.onViewArchive(record)}>
								{record.name}
							</Link>
						</div>
						<div className="text-xs text-gray-500">
							工号：
							{record.userCode}
						</div>
					</div>
				</div>
			),
		},
		{
			title: "所属组织",
			dataIndex: "orgName",
			key: "orgName",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.organization,
			ellipsis: true,
			hideInSearch: true,
			render: (_, record) => (
				<Tooltip title={formatOrganizationPath(record.orgFullName || record.orgName)}>
					<Text ellipsis className="max-w-[160px]">
						{record.orgName}
					</Text>
				</Tooltip>
			),
		},
		{
			title: "岗位",
			dataIndex: "jobName",
			key: "jobName",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.job,
			hideInSearch: true,
		},
		{
			title: "职位",
			dataIndex: "postName",
			key: "postName",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.post,
			hideInSearch: true,
		},
		{
			title: "职级",
			dataIndex: "postgradeName",
			key: "postgradeName",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.postgrade,
			hideInSearch: true,
		},
		{
			title: "入职时间",
			dataIndex: "joinDate",
			key: "joinDate",
			width: PERSONNEL_ARCHIVE_COLUMN_WIDTHS.joinDate,
			valueType: "date",
			hideInSearch: true,
		},
	];
}
