/**
 * 基本信息组件（公共组件）
 * 用于展示员工的基本信息：头像、姓名、工号、手机号码、所属组织、职位、岗位名称、入职日期
 */

import { SectionTitle } from "#src/components";
import { Avatar, ConfigProvider, Descriptions, Typography } from "antd";

const { Text } = Typography;

/**
 * 基本信息数据接口
 */
export interface BasicInfoData {
	/** 员工名称 */
	name: string;
	/** 工号 */
	userCode: string;
	/** 手机号码 */
	mobileNum?: string;
	/** 所属组织 */
	orgName?: string;
	/** 岗位名称 */
	jobName?: string;
	/** 职位名称 */
	postName?: string;
	/** 入职日期 */
	joinDate?: string;
	/** 头像URL（可选） */
	avatar?: string;
}

/**
 * 基本信息组件属性接口
 */
interface BasicInfoProps {
	/** 基本信息数据 */
	data: BasicInfoData;
	/** 标题（可选，默认为"基本信息"） */
	title?: string;
}

/**
 * 基本信息组件
 *
 * @param props - 组件属性
 * @param props.data - 基本信息数据
 * @param props.title - 标题（可选，默认为"基本信息"）
 */
export function BasicInfo({ data, title = "基本信息" }: BasicInfoProps) {
	return (
		<section className="flex flex-col gap-4">
			<SectionTitle title={title} />
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_3fr]">
				{/* 左侧：头像和姓名、工号 */}
				<div className="flex items-start gap-4">
					<Avatar
						size={64}
						src={data.avatar}
						className="flex-shrink-0 border border-[rgb(var(--oo-colorPrimaryHover))] [&_img]:object-cover [&_img]:object-center"
						style={{
							backgroundColor: "rgb(var(--oo-colorPrimary) / 0.12)",
							color: "rgb(var(--oo-colorPrimary))",
						}}
					>
						{data.name?.[0]}
					</Avatar>
					<div className="flex-shrink-0">
						<div className="mb-3">
							<Text strong className="text-xl">
								{data.name}
							</Text>
						</div>
						<div className="text-sm text-gray-500">
							工号:
							{data.userCode}
						</div>
					</div>
				</div>

				{/* 右侧：详细信息 */}
				<div>
					<ConfigProvider
						theme={{
							components: {
								Descriptions: {
									fontSize: 14,
									itemPaddingBottom: 24,
								},
							},
						}}
					>
						<Descriptions
							column={3}
							styles={{
								label: {
									width: "80px",
									display: "flex",
									justifyContent: "flex-end",
								},
							}}
							colon={false}
							items={[
								{
									key: "2",
									label: "手机号码",
									children: data.mobileNum || "-",
								},
								{
									key: "3",
									label: "岗位",
									children: data.jobName || "-",
								},
								{
									key: "4",
									label: "职位",
									children: data.postName || "-",
								},
								{
									key: "5",
									label: "入职时间",
									children: data.joinDate || "-",
								},
								{
									key: "6",
									label: "所属组织",
									children: data.orgName || "-",
								},
							]}
						/>
					</ConfigProvider>
				</div>
			</div>
		</section>
	);
}
