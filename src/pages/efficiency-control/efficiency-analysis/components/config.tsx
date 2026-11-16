import type { MatchingsProjectsRes } from "#src/api/efficiency-control/analysis/aiMoal";
import type { MatchingProjsProps } from "./AiModal";

import benchMarkTitle from "#src/assets/bench-mark-proj-title@2x.png";

export function getColumns(Analysisproj: MatchingsProjectsRes, proj: MatchingProjsProps) {
	return [
		{
			title: "对比维度",
			dataIndex: "dimension",
			key: "dimension",
			width: 100,
			render: (text: any) => <strong>{text}</strong>,
		},
		{
			title: `分析项目：${Analysisproj.projName}`,
			dataIndex: "analysisValue",
			key: "analysisValue",
			width: 300,
			onCell: (record: any) => ({
				colSpan: record?.title ? 2 : 1,
			}),
		},
		{
			title: (
				<div className="flex items-center justify-center">
					<div>{`标杆项目：${proj.tagName}`}</div>
					<img src={benchMarkTitle} className="w-15 ml-3 h-6" />
				</div>
			),
			dataIndex: "benchmarkValue",
			key: "benchmarkValue",
			width: 300,
		},
	];
}

export function getCompareColumns(Analysisproj: MatchingsProjectsRes, proj: MatchingProjsProps) {
	return [
		{
			title: "对比维度",
			dataIndex: "dimension",
			key: "dimension",
			width: 100,
			render: (text: any) => <strong>{text}</strong>,
			onCell: (record: any, index: number) => {
				return {
					rowSpan:
						index === 0
							? 1
							: index === 1
								? 14
								: record?.dimension === "智能化设备"
									? 1
									: 0,
				};
			},
		},
		{
			title: `分析项目：${Analysisproj.projName}`,
			dataIndex: "analysisValue",
			key: "analysisValue",
			width: 300,
			onCell: (record: any) => ({
				colSpan: record?.title ? 2 : 1,
			}),
		},
		{
			title: (
				<div className="flex items-center justify-center">
					<div>{`标杆项目：${proj.tagName}`}</div>
					<img src={benchMarkTitle} className="w-15 ml-3 h-6" />
				</div>
			),
			dataIndex: "benchmarkValue",
			key: "benchmarkValue",
			width: 300,
			onCell: (record: any) => ({
				colSpan: record?.title ? 0 : 1,
			}),
		},
	];
}
export function getBasicInfo(data: any, map: any) {
	const list = Object.entries(map).map(([label, key]: any) => ({
		field: label,
		value: data?.[key] ?? "-",
	}));
	return (
		<div className="flex w-full flex-col gap-1">
			{list.map(({ field, value }) => (
				<div key={field} className="flex w-full gap-4">
					{/* <div className="w-1/4 h-auto flex justify-end text-sm text-[#606266]">{field}</div>
					<div className="w-3/4 h-auto flex justify-start text-sm text-[#000000]">{value}</div> */}

					<div className="flex h-auto w-[100px] justify-end text-sm text-[#606266]">
						{field}
					</div>
					<div
						className="flex h-auto justify-start text-sm text-[#000000]"
						style={{
							width: "calc(100% - 100px)",
						}}
					>
						{value}
					</div>
				</div>
			))}
		</div>
	);
}

export function getStaffInfo(data: any) {
	const list = [];
	for (const key in data) {
		if (key !== "共计") {
			list.push(key);
		}
	}

	return (
		<div className="flex w-full flex-col gap-1">
			{data?.["共计"] ? (
				<span className="flex w-[100px] justify-end text-sm text-[#000000]">
					共计
					{data?.["共计"]}
				</span>
			) : (
				<></>
			)}
			{typeof data === "string" ? (
				<div className="h-auto w-full text-sm text-[#000000]">{data}</div>
			) : (
				list.map((key: string) => (
					<div key={key + data[key]} className="flex w-full gap-4">
						<div className="flex h-auto w-[100px] justify-end text-sm text-[#606266]">
							{key}
						</div>
						<div
							className="flex h-auto justify-start text-sm text-[#000000]"
							style={{
								width: "calc(100% - 100px)",
							}}
						>
							{data[key]}
						</div>
					</div>
				))
			)}
		</div>
	);
}
// 基本信息
export const basicMap: Record<string, string> = {
	物业类型: "propertyTypeName",
	服务等级: "projGradeName",
	地区: "areaName",
	所在省: "province",
	所在市: "city",
	所在区: "county",
	项目周期: "projCycleName",
	项目性质: "projNatureName",
};

// 交付信息
export const deliverMap: Record<string, string> = {
	交付标准: "deliveryStandard",
	合同面积: "contractArea",
	物业费: "propertyFee",
	已交付户数: "deliveryHouseNum",
	入住率: "houseNumLiveRate",
	已交付面积: "deliveryArea",
};

// 服务内容
export const serviceContentMap: Record<string, string> = {
	门岗数: "primarySecondaryGatePost",
	绿化作业面积: "maintenanceArea",
	保洁作业面积: "cleaningArea",
};

// 运营指标
export const operatingMetricsMap: Record<string, string> = {
	全口径营收: "totRevenue",
	全口径利润: "totProfit",
	人力成本占比: "laborCostRate",
	满意度: "projSatisfiedScore",
	综合收缴率: "totCollectionRate",
};

// 智能化设备
export const equipmentMap: Record<string, string> = {
	设备抵岗: "deviceOnPost",
	设备数量: "deviceNum",
};
