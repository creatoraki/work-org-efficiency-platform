import type {
	PlanOrgNode,
	PlanViewScope,
	PlanViewSummary,
} from "#src/api/performance-management/plan";

import { fetchPlanOrgTree, fetchPlanViewSummary } from "#src/api/performance-management/plan";
import { SectionTitle } from "#src/pages/performance-management/annual-rating/components/section-title";
import { useEffect, useState } from "react";
import { EmployeeTable } from "./employee-table";
import { GradeDistributionTable } from "./grade-distribution-table";
import { OrgTree } from "./org-tree";

/**
 * 人员清单 Tab 属性
 */
interface PeopleListTabProps {
	/** 计划名称（用于数据请求） */
	planName?: string;
}

/**
 * 人员清单 Tab
 *
 * 左侧组织树 + 右侧统计范围切换、人数概览、等级分布与人员清单。
 *
 * @param props - 组件属性
 * @param props.planName - 计划名称
 * @returns 人员清单 Tab
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function PeopleListTab({ planName }: PeopleListTabProps) {
	const [tree, setTree] = useState<PlanOrgNode[]>([]);
	const [scope, setScope] = useState<PlanViewScope>("全部");
	const [summary, setSummary] = useState<PlanViewSummary>();
	/** 左侧组织树是否折叠 */
	const [treeCollapsed, setTreeCollapsed] = useState(false);

	useEffect(() => {
		fetchPlanOrgTree().then(setTree);
	}, []);

	useEffect(() => {
		fetchPlanViewSummary(scope).then(setSummary);
	}, [scope, planName]);

	const chips = summary
		? [
				{ label: `考核人数(${summary.totalCount}人)` },
				{ label: `待确认(${summary.pendingCount}人)` },
				{ label: `已提交-申诉中(${summary.submittedCount}人)` },
				{ label: `已归档(${summary.archivedCount}人)` },
			]
		: [];

	return (
		<div className="flex h-full gap-4">
			{/* 左侧组织树：380px 卡片、+/− 展开器、16px 行文字 */}
			<OrgTree
				tree={tree}
				collapsed={treeCollapsed}
				onToggleCollapsed={() => setTreeCollapsed((current) => !current)}
			/>
			{/* 右侧内容 */}
			<div className="min-w-0 flex-1 overflow-y-auto pb-6 pr-1">
				{/* 统计范围切换 */}
				<div className="mb-3 flex items-center gap-6 border-b border-[#EBEEF5]">
					{(["全部", "基层员工", "管理者"] as PlanViewScope[]).map((item) => (
						<button
							key={item}
							type="button"
							className={`-mb-px cursor-pointer border-0 border-b-2 border-solid bg-transparent px-1 pb-2 text-sm leading-[22px] ${
								scope === item
									? "border-[#0075FF] font-medium text-[#0075FF]"
									: "border-transparent text-[#606266]"
							}`}
							onClick={() => setScope(item)}
						>
							{item}
						</button>
					))}
				</div>
				{/* 人数概览 */}
				<div className="mb-4 flex flex-wrap gap-1">
					{chips.map((chip) => (
						<span
							key={chip.label}
							className="rounded-[3px] bg-[#F5F7FA] px-3 py-1 text-sm leading-[22px] text-[#606266]"
						>
							{chip.label}
						</span>
					))}
				</div>
				{/* 等级分布 */}
				<SectionTitle
					title="等级分布"
					badge={
						<span className="rounded-[3px] bg-[#FEE4E6] px-2 text-xs leading-5 text-[#F5222D]">
							校验异常
						</span>
					}
					extra={
						<div className="flex gap-2">
							<button
								type="button"
								className="cursor-pointer rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-[3px] text-sm leading-[22px] text-[#323233]"
							>
								提报等级
							</button>
							<button
								type="button"
								className="cursor-pointer rounded-[3px] border border-[#E4E7ED] bg-white px-3 py-[3px] text-sm leading-[22px] text-[#323233]"
							>
								最终等级
							</button>
						</div>
					}
				/>
				<GradeDistributionTable rows={summary?.gradeRows ?? []} />
				<p className="mb-4 mt-2 text-xs leading-5 text-[#909399]">
					等级分布：剔除在职状态=离职的人数进行校验
					<br />
					基准规则：（1）岗位类别人数&gt;7人，为A≤10%、A和B+≤30%、C/D≥10%；（2）岗位类别人数≤7，A≤1,A和B+≤30%，C和D不做强制要求
				</p>
				{/* 人员清单 */}
				<EmployeeTable />
			</div>
		</div>
	);
}
