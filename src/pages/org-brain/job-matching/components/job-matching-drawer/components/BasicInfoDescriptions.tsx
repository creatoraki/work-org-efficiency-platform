import type { JobMatchingDetail } from "#src/api/org-brain/job-matching";
import type { JobDescManagementItem } from "#src/pages/tag-management/job-desc/management/types";
import type { DescriptionsProps } from "antd";

import { SectionTitle } from "#src/components";
import { EyeOutlined } from "@ant-design/icons";
import { Descriptions, Divider, Space, Tooltip, Typography } from "antd";
import { memo, useCallback, useMemo } from "react";

const { Link, Text } = Typography;

interface BasicInfoDescriptionsProps {
	// 详情数据
	data: JobMatchingDetail;
	// 是否可查看岗位描述
	canViewJobDesc: boolean;
	// 查询岗位描述
	onFetchJobDesc: () => Promise<JobDescManagementItem | null>;
	// 打开岗位描述抽屉
	onViewJobDesc: (record: JobDescManagementItem) => void;
	// 查看匹配模型回调
	onViewModel: () => void;
}

/**
 * 查看态基本信息组件。
 *
 * 使用 ProDescriptions 展示只读基础信息，同时保留岗位描述和匹配模型查看入口。
 *
 * @param props - 组件属性
 * @param props.data - 当前任务详情数据
 * @param props.canViewJobDesc - 是否允许查看岗位描述
 * @param props.onFetchJobDesc - 查询岗位描述数据回调
 * @param props.onViewJobDesc - 打开岗位描述抽屉回调
 * @param props.onViewModel - 打开匹配模型查看回调
 * @returns 查看态基本信息 JSX
 * @author 王善能
 * @since 2026-06-26
 */
function BasicInfoDescriptionsInner({
	data,
	canViewJobDesc,
	onFetchJobDesc,
	onViewJobDesc,
	onViewModel,
}: BasicInfoDescriptionsProps) {
	const handleViewJobDesc = useCallback(async () => {
		const record = await onFetchJobDesc();
		if (record) {
			onViewJobDesc(record);
		}
	}, [onFetchJobDesc, onViewJobDesc]);

	const items = useMemo<DescriptionsProps["items"]>(
		() => [
			{
				key: "taskName",
				label: "人岗匹配任务名称",
				children: data.taskName || "-",
			},
			{
				key: "orgFullName",
				label: "所属组织",
				children: (
					<Text ellipsis={{ tooltip: data.orgFullName || "-" }}>
						{data.orgFullName || "-"}
					</Text>
				),
			},
			{
				key: "jobName",
				label: "族群-岗位",
				children: data.jobName || "-",
			},
			{
				key: "postName",
				label: "职位",
				children: data.postName || "-",
			},
			{
				key: "postgradeName",
				label: "职级",
				children: (
					<Space split={<Divider type="vertical" />}>
						<span>{data.postgradeName || data.postgradeId || "-"}</span>
						<Tooltip
							title={!canViewJobDesc ? "缺少组织、岗位、职位或职级信息" : undefined}
						>
							<Link
								disabled={!canViewJobDesc}
								onClick={() => void handleViewJobDesc()}
							>
								<EyeOutlined className="mr-1" />
								查看所选组织、岗位的要求描述
							</Link>
						</Tooltip>
					</Space>
				),
			},
			{
				key: "modelName",
				label: "匹配模型",
				children: (
					<div className="flex min-w-0 items-center gap-3">
						<span className="min-w-0 flex-1 truncate">{data.modelName || "-"}</span>
						<Divider type="vertical" className="m-0 h-[14px] border-[#dcdfe6]" />
						<Link className="shrink-0" onClick={onViewModel}>
							<EyeOutlined className="mr-1" />
							查看模型
						</Link>
					</div>
				),
			},
		],
		[canViewJobDesc, data, handleViewJobDesc, onViewModel],
	);

	return (
		<div>
			<SectionTitle title="人岗匹配基本信息" className="mb-6" />
			<Descriptions
				column={1}
				colon={false}
				items={items}
				styles={{
					label: {
						width: "8rem",
						display: "flex",
						justifyContent: "flex-end",
						textAlign: "right",
					},
				}}
			/>
		</div>
	);
}

/**
 * 查看态基础信息记忆化组件。
 *
 * 将查看态描述区与候选人列表、抽屉局部弹层状态隔离，
 * 避免无关状态更新时重复构造 Descriptions 项配置。
 *
 * @author 王善能
 * @since 2026-07-09
 */
export const BasicInfoDescriptions = memo(BasicInfoDescriptionsInner);

BasicInfoDescriptions.displayName = "BasicInfoDescriptions";
