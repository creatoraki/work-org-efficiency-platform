/**
 * 基础信息区域组件
 */

import type React from "react";
import { SectionTitle } from "#src/components";
import { Avatar, ConfigProvider, Descriptions, Progress, Typography } from "antd";

const { Text } = Typography;

/**
 * 获取完善度等级
 *
 * @param degree - 完善度数值（0-100）
 * @returns 完善度等级：low（<30）、medium（30-69）、high（>=70）
 */
function getPerfectDegreeLevel(degree: number): "low" | "medium" | "high" {
	if (degree < 30) {
		return "low";
	}
	if (degree < 70) {
		return "medium";
	}
	return "high";
}

/**
 * 获取完善度颜色
 *
 * @param degree - 完善度数值（0-100）
 * @returns 对应的颜色值（十六进制）
 */
function getPerfectDegreeColor(degree: number): string {
	if (degree < 30) {
		return "#F5222D";
	}
	if (degree < 70) {
		return "#FAAD14";
	}
	return "#52C41A";
}

/**
 * 基础信息数据
 */
interface BasicInfoData {
	/** 姓名 */
	name?: string;
	/** 工号 */
	userCode?: string;
	/** 手机号码 */
	mobileNum?: string;
	/** 岗位名称 */
	jobName?: string;
	/** 职位 */
	postName?: string;
	/** 入职时间 */
	joinDate?: string;
	/** 所属组织 */
	orgName?: string;
	/** 维护完善度 */
	perfectDegree?: number;
}

/**
 * BasicInfoSection 组件属性
 */
interface BasicInfoSectionProps {
	/** 基础信息数据 */
	basicInfoData: BasicInfoData | null;
}

/**
 * 基础信息区域组件
 *
 * @param props - 组件属性
 * @param props.basicInfoData - 基础信息数据
 * @returns 基础信息区域元素
 */
export function BasicInfoSection({ basicInfoData }: BasicInfoSectionProps) {
	return (
		<section className="flex flex-col gap-4">
			<SectionTitle title="基础信息" />
			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_3fr]">
				<div className="flex items-start gap-4">
					<Avatar
						size={64}
						className="flex-shrink-0 border border-[rgb(var(--oo-colorPrimaryHover))] [&_img]:object-cover [&_img]:object-center"
						style={{
							backgroundColor: "rgb(var(--oo-colorPrimary) / 0.12)",
							color: "rgb(var(--oo-colorPrimary))",
						}}
					>
						{basicInfoData?.name?.[0]}
					</Avatar>
					<div className="flex-shrink-0">
						<div className="mb-3">
							<Text strong className="text-xl">
								{basicInfoData?.name}
							</Text>
						</div>
						<div className="w-[200px]">
							<div className="mb-[-0.5rem] flex items-center justify-between">
								<span className="text-sm">
									维护完善度
									{Math.round(basicInfoData?.perfectDegree || 0)}%
								</span>
								<span
									className="text-sm font-medium"
									style={{
										color: getPerfectDegreeColor(
											basicInfoData?.perfectDegree || 0,
										),
									}}
								>
									{getPerfectDegreeLevel(basicInfoData?.perfectDegree || 0) ===
									"low"
										? "低"
										: getPerfectDegreeLevel(
													basicInfoData?.perfectDegree || 0,
											  ) === "medium"
											? "中"
											: "高"}
								</span>
							</div>
							<Progress
								percent={Math.round(basicInfoData?.perfectDegree || 0)}
								showInfo={false}
								strokeColor={getPerfectDegreeColor(
									basicInfoData?.perfectDegree || 0,
								)}
								trailColor="#f0f0f0"
								strokeLinecap="butt"
								size={["100%", 4]}
							/>
						</div>
					</div>
				</div>
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
							column={2}
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
									key: "1",
									label: "工号",
									children: basicInfoData?.userCode,
								},
								{
									key: "2",
									label: "手机号码",
									children: basicInfoData?.mobileNum || "-",
								},
								{
									key: "3",
									label: "岗位",
									children: basicInfoData?.jobName || "-",
								},
								{
									key: "4",
									label: "职位",
									children: basicInfoData?.postName || "-",
								},
								{
									key: "6",
									label: "入职时间",
									children: basicInfoData?.joinDate || "-",
								},
								{
									key: "5",
									label: "所属组织",
									children: basicInfoData?.orgName,
								},
							]}
						/>
					</ConfigProvider>
				</div>
			</div>
		</section>
	);
}
