import type { GradeDistributionRow } from "#src/api/performance-management/plan";

import { fetchPlanAnalysisRows } from "#src/api/performance-management/plan";
import { LabeledSelect } from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { UploadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CHECK_RESULT_OPTIONS, ORG_NAME_OPTIONS, POSITION_CATEGORY_OPTIONS } from "../config";
import { GradeDistributionTableWithOrg } from "./grade-distribution-table-with-org";

/**
 * 分析报表 Tab
 *
 * 组织维度筛选 + 等级分布（按组织合并单元格）+ 异常情况说明。
 *
 * @returns 分析报表 Tab
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function AnalysisReportTab() {
	const [query, setQuery] = useState<{
		orgType?: string;
		orgName?: string;
		positionCategory?: string;
		checkResult?: string;
	}>({});
	const [rows, setRows] = useState<GradeDistributionRow[]>([]);
	const { ownerUnitTypeOptions } = useAnnualRatingDict();

	/**
	 * 组织类型选项
	 *
	 * 当前分析报表 mock 以组织类型名称作为筛选值，这里用字典标签同时作为 label 与 value；
	 * 接入真实接口后改为直接使用字典值（annual_evaluation_owner_unit_type）。
	 */
	const orgTypeOptions = useMemo(
		() => ownerUnitTypeOptions.map((item) => ({ label: item.label, value: item.label })),
		[ownerUnitTypeOptions],
	);

	const load = useCallback(
		async (next = query) => {
			const result = await fetchPlanAnalysisRows(next);
			setRows(result.data);
		},
		[query],
	);

	useEffect(() => {
		load({});
	}, []);

	return (
		<div className="h-full overflow-y-auto pb-6 pr-1">
			{/* 筛选区 */}
			<div className="mb-4 grid grid-cols-5 items-center gap-3">
				<div className="min-w-0">
					<LabeledSelect
						label="组织类型"
						value={query.orgType}
						options={orgTypeOptions}
						onChange={(value) =>
							setQuery((current) => ({ ...current, orgType: value }))
						}
					/>
				</div>
				<div className="min-w-0">
					<LabeledSelect
						label="组织名称"
						value={query.orgName}
						options={ORG_NAME_OPTIONS}
						onChange={(value) =>
							setQuery((current) => ({ ...current, orgName: value }))
						}
					/>
				</div>
				<div className="min-w-0">
					<LabeledSelect
						label="岗位分类"
						value={query.positionCategory}
						options={POSITION_CATEGORY_OPTIONS}
						onChange={(value) =>
							setQuery((current) => ({ ...current, positionCategory: value }))
						}
					/>
				</div>
				<div className="min-w-0">
					<LabeledSelect
						label="异常校验"
						value={query.checkResult}
						options={CHECK_RESULT_OPTIONS}
						onChange={(value) =>
							setQuery((current) => ({ ...current, checkResult: value }))
						}
					/>
				</div>
				<div className="flex items-center justify-end gap-2">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={() => load()}
					>
						查询
					</Button>
					<Button
						type="text"
						className="px-2 text-[#606266]"
						onClick={() => {
							setQuery({});
							load({});
						}}
					>
						重置
					</Button>
				</div>
			</div>
			<SectionTitle
				title="等级分布"
				badge={
					<span className="rounded-[3px] bg-[#FEE4E6] px-2 text-xs leading-5 text-[#F5222D]">
						校验异常
					</span>
				}
				extra={
					<div className="flex gap-2">
						{["提报等级", "最终等级"].map((label) => (
							<button
								key={label}
								type="button"
								className="cursor-pointer rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-[3px] text-sm leading-[22px] text-[#323233]"
							>
								{label}
							</button>
						))}
						<button
							type="button"
							className="flex cursor-pointer items-center gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-[3px] text-sm leading-[22px] text-[#323233]"
						>
							<UploadOutlined />
							导出
						</button>
					</div>
				}
			/>
			<GradeDistributionTableWithOrg rows={rows} />
		</div>
	);
}
