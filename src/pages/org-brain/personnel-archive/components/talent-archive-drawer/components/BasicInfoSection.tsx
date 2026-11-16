/**
 * 基本信息区块组件
 * Grid 布局：左-头像与基本信息；右-工号/司龄/入职日期三卡片
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentArchiveBasicInfo } from "#src/api/org-brain/personnel-archive";
import FemaleIcon from "#src/assets/small-icons/talent-archive/female.svg?react";
import MaleIcon from "#src/assets/small-icons/talent-archive/male.svg?react";
import EmployeeIcon from "#src/assets/svg/personnel-archive-employee.svg?react";
import HireDateIcon from "#src/assets/svg/personnel-archive-hire-date.svg?react";
import TenureIcon from "#src/assets/svg/personnel-archive-tenure.svg?react";
import { formatOrganizationPath } from "#src/pages/org-brain/personnel-archive/components/organization-path";

import { Avatar, Col, Divider, Row, Space, Tag, Typography } from "antd";

const { Text } = Typography;

interface BasicInfoSectionProps {
	data: TalentArchiveBasicInfo;
	matchRate?: number;
	/** 是否为候选人模式（显示「当前候选人」标识） */
	isCandidateMode?: boolean;
	isCurrent?: boolean;
	showJobInfoCards?: boolean;
}

/**
 * 格式化头部岗位、职位展示文本。
 * 入参允许为空，避免人员基础资料缺少岗位或职级字典时渲染空白。
 *
 * @param values 候选展示字段，按业务展示顺序拼接。
 * @returns 展示文本；无有效字段时返回占位符。
 */
function formatHeaderField(values: Array<string | undefined>) {
	const text = values.filter(Boolean).join("-");
	return text || "/";
}

/** 信息卡片项 */
function InfoCard({
	title,
	value,
	icon: Icon,
	gradientColor,
}: {
	title: string;
	value: string | number;
	icon: React.ComponentType<{ className?: string }>;
	gradientColor?: string;
}) {
	return (
		<div
			className="flex flex-col justify-between gap-2 rounded-lg border border-gray-100 px-4 py-3 shadow-sm"
			style={
				gradientColor
					? {
							background: `radial-gradient(ellipse 140% 140% at 0% 0%, ${gradientColor} 0%, white 80%)`,
						}
					: { background: "rgb(249 250 251 / 0.8)" }
			}
		>
			<div className="flex items-center justify-between">
				<Text type="secondary" className="text-base">
					{title}
				</Text>
				<div
					className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5"
					style={{
						background:
							"var(--color, linear-gradient(0deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.88) 100%), #0075FF)",
					}}
				>
					<Icon className="text-[rgb(var(--oo-colorPrimary))]" />
				</div>
			</div>
			<Text strong className="text-sm">
				{value}
			</Text>
		</div>
	);
}

export function BasicInfoSection({
	data,
	matchRate,
	isCandidateMode = false,
	isCurrent,
	showJobInfoCards = true,
}: BasicInfoSectionProps) {
	const displayAge = data.age > 0 ? `${data.age}岁` : "/";
	const displayTenure = data.tenure > 0 ? `${data.tenure}年` : "/";
	const displayJob = formatHeaderField([data.jobName]);
	const displayPost = formatHeaderField([data.postName, data.postgradeName]);
	const displayOrganization = formatOrganizationPath(data.orgFullName || data.orgName);
	const genderIcon =
		data.gender === "男" ? <MaleIcon /> : data.gender === "女" ? <FemaleIcon /> : null;

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
			{/* 左：头像和基本信息 */}
			<div className="flex min-w-0 items-start gap-3">
				<div className="relative flex-shrink-0">
					<Avatar
						size={80}
						src={data.avatar}
						style={{
							border: "1px solid rgb(var(--oo-colorPrimary))",
							background:
								"linear-gradient(0deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.88) 100%), rgb(var(--oo-colorPrimary))",
						}}
					>
						<Text strong className="text-xl text-[rgb(var(--oo-colorPrimary))]">
							{data.name.charAt(0)}
						</Text>
					</Avatar>
					{isCandidateMode && isCurrent && (
						<Tag
							bordered={false}
							className="absolute left-1/2 m-0 -translate-x-1/2 whitespace-nowrap rounded border border-white"
							style={{
								top: "85%",
								fontSize: "10px",
								background: "#FFEFE0",
								color: "#FF7D00",
							}}
						>
							当前候选人
						</Tag>
					)}
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<Space
						size={8}
						split={<Divider type="vertical" className="mx-0" />}
						className="min-w-0"
					>
						<Text strong className="truncate text-lg">
							{data.name}
						</Text>
						<span className="flex shrink-0 items-center gap-1">
							{displayAge}
							{genderIcon}
						</span>
						{isCandidateMode && matchRate !== undefined && (
							<Text className="shrink-0 text-sm">
								匹配度：
								<Text strong className="text-[#52c41a]">
									{matchRate}%
								</Text>
							</Text>
						)}
					</Space>

					<Row>
						<Col span={12}>
							<Text
								type="secondary"
								className="block min-w-0 overflow-hidden text-xs"
								ellipsis={{ tooltip: displayJob }}
							>
								岗位：
								{displayJob}
							</Text>
						</Col>
						<Col span={12}>
							<Text
								type="secondary"
								className="block min-w-0 overflow-hidden text-xs"
								ellipsis={{ tooltip: displayPost }}
							>
								职位：
								{displayPost}
							</Text>
						</Col>
					</Row>
					<Text
						type="secondary"
						className="block min-w-0 overflow-hidden text-xs"
						ellipsis={{ tooltip: displayOrganization }}
					>
						组织：
						{displayOrganization}
					</Text>
				</div>
			</div>

			{/* 右：工号、司龄、入职日期三卡片 */}
			{showJobInfoCards && (
				<div className="grid min-w-0 grid-cols-3 gap-6">
					<InfoCard
						title="工号"
						value={data.userCode}
						icon={EmployeeIcon}
						gradientColor="rgba(148, 246, 255, 0.3)"
					/>
					<InfoCard
						title="司龄"
						value={displayTenure}
						icon={TenureIcon}
						gradientColor="rgba(218, 218, 255, 0.3)"
					/>
					<InfoCard
						title="入职日期"
						value={data.joinDate}
						icon={HireDateIcon}
						gradientColor="rgba(148, 246, 255, 0.3)"
					/>
				</div>
			)}
		</div>
	);
}
