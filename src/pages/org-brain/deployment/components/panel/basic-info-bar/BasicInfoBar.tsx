import type { DeploymentDetail, DeploymentItem } from "#src/api/org-brain/deployment";

import { Descriptions, Space, Typography } from "antd";

import { BenchmarkDiffNumber, BenchmarkDiffTextInline } from "../project-info";
import { DiffValueArrow, STAT_CARD_CONFIG } from "../stat-cards";

const { Text } = Typography;

function getTextOrSlash(value?: string | null) {
	return value?.trim() || "/";
}

function getNumberWithUnitOrSlash(
	value: number | null | undefined,
	unit: string,
	formatter?: (input: number) => string,
) {
	if (value == null) {
		return "/";
	}

	return `${formatter ? formatter(value) : value}${unit}`;
}

/** 与 stat-cards 一致的图标样式 */
function StatIcon({ src, bg }: { src: string; bg: string }) {
	return (
		<span
			className="inline-flex items-center justify-center rounded p-0.5"
			style={{ backgroundColor: bg }}
		>
			<img src={src} alt="" className="size-4 object-contain" />
		</span>
	);
}

interface BasicInfoBarProps {
	detail?: DeploymentDetail | null;
	project: DeploymentItem;
}

/** 基础信息栏（步骤头、步骤二内容区共用） */
export function BasicInfoBar({ detail, project }: BasicInfoBarProps) {
	const info = detail?.projectInfo;
	const stats = detail?.projectStatistics;
	const benchmark = detail?.benchmarkInfo;
	const benchmarkStats = detail?.benchmarkStatistics;
	const showCompare = !!(benchmark && info);
	const propertyFeeUnitPriceText =
		info?.propertyFeeUnitPrice == null ? "/" : String(info.propertyFeeUnitPrice);
	const areaDiff =
		showCompare && benchmark?.deliveryArea != null && info?.deliveryArea != null
			? info.deliveryArea - benchmark.deliveryArea
			: null;
	const organizationText = info?.projectGroupName?.trim() || "/";

	return (
		<div>
			<div className="mb-3 flex items-center gap-4">
				<div className="flex items-center gap-2">
					<div className="h-4 w-1 rounded bg-[rgb(var(--oo-colorPrimary))]" />
					<Text strong>
						基础信息——
						{project.projectName}
					</Text>
				</div>
				{stats && (
					<Space size="large" className="ml-auto">
						{STAT_CARD_CONFIG.filter(
							(item) => stats[item.key] !== undefined && stats[item.key] !== null,
						).map((item) => {
							const raw = stats[item.key] as number;
							const value =
								item.format && typeof raw === "number" ? raw.toFixed(2) : raw;
							const benchNum = benchmarkStats?.[item.key] as number | undefined;
							const showDiff = benchNum != null && raw !== benchNum;
							return (
								<Text
									key={item.key}
									type="secondary"
									className="flex items-center gap-1"
								>
									{item.iconSrc && item.iconBg && (
										<StatIcon src={item.iconSrc} bg={item.iconBg} />
									)}
									{item.label}（{item.unit}
									）：
									<Text strong>{value}</Text>
									{showCompare && showDiff && (
										<DiffValueArrow
											diff={raw - benchNum}
											decimalPlaces={item.format ? 2 : undefined}
										/>
									)}
								</Text>
							);
						})}
					</Space>
				)}
			</div>
			<Descriptions
				size="small"
				column={4}
				styles={{
					label: {
						color: "#6B7280",
						width: 110,
						display: "flex",
						textAlign: "right",
						justifyContent: "flex-end",
						paddingRight: 8,
					},
				}}
			>
				<Descriptions.Item label="所属组织">{organizationText}</Descriptions.Item>
				<Descriptions.Item label="省份">{getTextOrSlash(info?.province)}</Descriptions.Item>
				<Descriptions.Item label="城市">
					<>
						{getTextOrSlash(info?.city)}
						{showCompare &&
							benchmark?.city != null &&
							info?.city !== benchmark.city && (
								<BenchmarkDiffTextInline benchmarkVal={benchmark.city} />
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="计划交付日期">
					{getTextOrSlash(info?.planDeliveryDate)}
				</Descriptions.Item>
				<Descriptions.Item label="待交付面积">
					<>
						{getNumberWithUnitOrSlash(info?.deliveryArea, "m²", (input) =>
							input.toLocaleString(),
						)}
						{areaDiff != null && areaDiff !== 0 && (
							<BenchmarkDiffNumber diff={areaDiff} unit="m²" />
						)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="户数">
					<>
						{getNumberWithUnitOrSlash(info?.deliveryHouseholds, "户", (input) =>
							input.toLocaleString(),
						)}
						{showCompare &&
							info?.deliveryHouseholds != null &&
							benchmark?.deliveryHouseholds != null &&
							info?.deliveryHouseholds !== benchmark?.deliveryHouseholds && (
								<BenchmarkDiffNumber
									diff={info.deliveryHouseholds - benchmark.deliveryHouseholds}
									unit="户"
								/>
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="项目类型">
					<>
						{getTextOrSlash(info?.projectTypeName)}
						{showCompare &&
							benchmark?.projectTypeName != null &&
							info?.projectTypeName !== benchmark?.projectTypeName && (
								<BenchmarkDiffTextInline benchmarkVal={benchmark.projectTypeName} />
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="物业类型">
					<>
						{getTextOrSlash(info?.propertyTypeName)}
						{showCompare &&
							benchmark?.propertyTypeName != null &&
							info?.propertyTypeName !== benchmark?.propertyTypeName && (
								<BenchmarkDiffTextInline
									benchmarkVal={benchmark.propertyTypeName}
								/>
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="服务等级">
					<>
						{getTextOrSlash(info?.projectGradeName)}
						{showCompare &&
							info?.projectGradeName != null &&
							benchmark?.projectGradeName != null &&
							info?.projectGradeName !== benchmark?.projectGradeName && (
								<BenchmarkDiffTextInline
									benchmarkVal={benchmark.projectGradeName}
								/>
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="物业费单价">
					<Text className="block" ellipsis={{ tooltip: propertyFeeUnitPriceText }}>
						{propertyFeeUnitPriceText}
					</Text>
				</Descriptions.Item>
				<Descriptions.Item label="交付标准">
					<>
						{getTextOrSlash(info?.deliveryStandardName)}
						{showCompare &&
							info?.deliveryStandardName != null &&
							benchmark?.deliveryStandardName != null &&
							info?.deliveryStandardName !== benchmark?.deliveryStandardName && (
								<BenchmarkDiffTextInline
									benchmarkVal={benchmark.deliveryStandardName}
								/>
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="项目周期">
					<>
						{getTextOrSlash(info?.projectCycleName)}
						{showCompare &&
							info?.projectCycleName != null &&
							benchmark?.projectCycleName != null &&
							info?.projectCycleName !== benchmark?.projectCycleName && (
								<BenchmarkDiffTextInline
									benchmarkVal={benchmark.projectCycleName}
								/>
							)}
					</>
				</Descriptions.Item>
				<Descriptions.Item label="物业服务运营方案">
					{getTextOrSlash(info?.operationPlan)}
				</Descriptions.Item>
			</Descriptions>
		</div>
	);
}
