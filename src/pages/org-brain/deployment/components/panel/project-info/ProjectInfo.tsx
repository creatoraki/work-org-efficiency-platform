import type { ProjectBasicInfo } from "#src/api/org-brain/deployment/types";
import type {
	BenchmarkDiffNumberProps,
	BenchmarkDiffTextProps,
	ProjectInfoDescriptionsProps,
} from "./types";

import arrowDown from "#src/assets/svg/arrow-down.svg";
import arrowUp from "#src/assets/svg/arrow-up.svg";
import { Descriptions, Typography } from "antd";

const { Text } = Typography;

const DESCRIPTIONS_LABEL_STYLE = {
	color: "#6B7280",
	width: 110,
	display: "flex",
	textAlign: "right" as const,
	justifyContent: "flex-end" as const,
	paddingRight: 8,
};

const BENCHMARK_LABEL = "对比标杆：";

/**
 * 详情面板文本占位统一口径
 * 后端适配层会把部分空值归一成空字符串，因此这里同时兜底 null、undefined、"" 和纯空白字符串。
 */
function getTextOrSlash(value?: string | null): string {
	return value?.trim() || "/";
}

function getNumberWithUnitOrSlash(
	value: number | null | undefined,
	unit: string,
	formatter?: (input: number) => string,
): string {
	if (value == null) {
		return "/";
	}

	return `${formatter ? formatter(value) : value}${unit}`;
}

/** 对比标杆文案：文本型，统一格式 对比标杆：对比的值（标杆值）。供步骤二等在原值右侧追加对比时复用 */
export function BenchmarkDiffTextInline({ benchmarkVal }: BenchmarkDiffTextProps) {
	return (
		<Text className="ml-1 text-red-500">
			{BENCHMARK_LABEL}
			{benchmarkVal}
		</Text>
	);
}

/** 数值对比：统一格式 对比标杆：差值+单位+图标（项目 - 标杆）。供步骤二等在原值右侧追加对比时复用 */
export function BenchmarkDiffNumber({ diff, unit, decimalPlaces }: BenchmarkDiffNumberProps) {
	const isUp = diff > 0;
	const prefix = diff >= 0 ? "+" : "";
	const value =
		decimalPlaces != null
			? Math.abs(diff).toFixed(decimalPlaces)
			: Math.abs(diff).toLocaleString();
	return (
		<Text className="ml-1 text-red-500">
			{BENCHMARK_LABEL}
			<span className="inline-flex items-center gap-0.5">
				{prefix}
				{value}
				{unit}
				<img src={isUp ? arrowUp : arrowDown} alt="" className="inline-block size-[18px]" />
			</span>
		</Text>
	);
}

export function ProjectInfoDescriptions({ detail, isBenchmark }: ProjectInfoDescriptionsProps) {
	const info = (isBenchmark ? detail?.benchmarkInfo : detail?.projectInfo) as
		| ProjectBasicInfo
		| undefined;
	const benchmark = detail?.benchmarkInfo as ProjectBasicInfo | undefined;
	if (!info) return <Text type="secondary">暂无信息</Text>;

	const showBenchmarkCompare = !isBenchmark && benchmark != null;
	const areaDiff =
		showBenchmarkCompare && benchmark.deliveryArea != null && info.deliveryArea != null
			? info.deliveryArea - benchmark.deliveryArea
			: null;
	const propertyFeeUnitPriceText =
		info.propertyFeeUnitPrice == null ? "/" : String(info.propertyFeeUnitPrice);
	const organizationText = info.projectGroupName?.trim();
	return (
		<Descriptions
			size="small"
			column={2}
			styles={{ label: DESCRIPTIONS_LABEL_STYLE }}
			colon={false}
		>
			<Descriptions.Item label="所属组织">
				<Text ellipsis={{ tooltip: true }}>{getTextOrSlash(organizationText)}</Text>
			</Descriptions.Item>
			<Descriptions.Item label="省份">{getTextOrSlash(info.province)}</Descriptions.Item>
			<Descriptions.Item label="城市">
				<>
					{getTextOrSlash(info.city)}
					{showBenchmarkCompare &&
						benchmark.city != null &&
						info.city !== benchmark.city && (
							<BenchmarkDiffTextInline benchmarkVal={benchmark.city} />
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="交付日期">
				{getTextOrSlash(isBenchmark ? info.deliveryDate : info.planDeliveryDate)}
			</Descriptions.Item>
			<Descriptions.Item label={isBenchmark ? "交付面积" : "待交付面积"}>
				<>
					{getNumberWithUnitOrSlash(info.deliveryArea, "m²", (input) =>
						input.toLocaleString(),
					)}
					{areaDiff != null && areaDiff !== 0 && (
						<BenchmarkDiffNumber diff={areaDiff} unit="m²" />
					)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="交付户数">
				<>
					{getNumberWithUnitOrSlash(info.deliveryHouseholds, "户", (input) =>
						input.toLocaleString(),
					)}
					{showBenchmarkCompare &&
						info.deliveryHouseholds != null &&
						benchmark.deliveryHouseholds != null &&
						info.deliveryHouseholds !== benchmark.deliveryHouseholds && (
							<BenchmarkDiffNumber
								diff={info.deliveryHouseholds - benchmark.deliveryHouseholds}
								unit="户"
							/>
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="项目类型">
				<>
					{getTextOrSlash(info.projectTypeName)}
					{showBenchmarkCompare &&
						benchmark.projectTypeName != null &&
						info.projectTypeName !== benchmark.projectTypeName && (
							<BenchmarkDiffTextInline benchmarkVal={benchmark.projectTypeName} />
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="物业类型">
				<>
					{getTextOrSlash(info.propertyTypeName)}
					{showBenchmarkCompare &&
						benchmark.propertyTypeName != null &&
						info.propertyTypeName !== benchmark.propertyTypeName && (
							<BenchmarkDiffTextInline benchmarkVal={benchmark.propertyTypeName} />
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="服务等级">
				<>
					{getTextOrSlash(info.projectGradeName)}
					{showBenchmarkCompare &&
						info.projectGradeName != null &&
						benchmark.projectGradeName != null &&
						info.projectGradeName !== benchmark.projectGradeName && (
							<BenchmarkDiffTextInline benchmarkVal={benchmark.projectGradeName} />
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
					{getTextOrSlash(info.deliveryStandardName)}
					{showBenchmarkCompare &&
						info.deliveryStandardName != null &&
						benchmark.deliveryStandardName != null &&
						info.deliveryStandardName !== benchmark.deliveryStandardName && (
							<BenchmarkDiffTextInline
								benchmarkVal={benchmark.deliveryStandardName}
							/>
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="项目周期">
				<>
					{getTextOrSlash(info.projectCycleName)}
					{showBenchmarkCompare &&
						info.projectCycleName != null &&
						benchmark.projectCycleName != null &&
						info.projectCycleName !== benchmark.projectCycleName && (
							<BenchmarkDiffTextInline benchmarkVal={benchmark.projectCycleName} />
						)}
				</>
			</Descriptions.Item>
			<Descriptions.Item label="物业服务运营方案">
				{getTextOrSlash(info.operationPlan)}
			</Descriptions.Item>
			{isBenchmark && (
				<Descriptions.Item label="入住率">
					{getNumberWithUnitOrSlash(info.houseNumLiveRate, "%")}
				</Descriptions.Item>
			)}
		</Descriptions>
	);
}
