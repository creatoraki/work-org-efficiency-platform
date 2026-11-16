/**
 * 人才画像抽屉 - 个人基本信息区块
 * 展示头像、姓名、年龄、性别、所属组织，供画像抽屉头部使用
 *
 * @author 王善能
 * @date 2026-04-16
 */

import type { TalentArchiveBasicInfo } from "#src/api/org-brain/personnel-archive";
import FemaleIcon from "#src/assets/small-icons/talent-archive/female.svg?react";
import MaleIcon from "#src/assets/small-icons/talent-archive/male.svg?react";
import { formatOrganizationPath } from "#src/pages/org-brain/personnel-archive/components/organization-path";
import { Avatar, Typography } from "antd";

const { Text } = Typography;

export interface PortraitBasicInfoSectionProps {
	/** 基本信息数据 */
	data: TalentArchiveBasicInfo | null;
}

/**
 * 人才画像抽屉用基本信息区块
 *
 * @author 王善能
 * @date 2026-04-16
 */
export function PortraitBasicInfoSection({ data }: PortraitBasicInfoSectionProps) {
	if (!data) {
		return null;
	}

	const genderIcon =
		data.gender === "男" ? <MaleIcon /> : data.gender === "女" ? <FemaleIcon /> : null;
	const displayOrganization = formatOrganizationPath(data.orgFullName || data.orgName);

	return (
		<div className="flex h-auto items-start gap-6">
			<div className="flex items-start gap-3">
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
						<Text strong className="text-2xl text-[rgb(var(--oo-colorPrimary))]">
							{data.name.charAt(0)}
						</Text>
					</Avatar>
				</div>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<Text strong className="text-lg">
							{data.name}
						</Text>
					</div>
					<div className="flex items-center gap-2">
						<span className="flex items-center gap-1">
							<Text className="text-base">{data.age || "/ "}岁</Text>
							{genderIcon}
						</span>
					</div>
					<Text ellipsis={{ tooltip: displayOrganization }}>
						组织：
						{displayOrganization}
					</Text>
				</div>
			</div>
		</div>
	);
}
