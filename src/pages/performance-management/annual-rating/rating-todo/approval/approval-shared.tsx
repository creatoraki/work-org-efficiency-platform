import type {
	ApprovalEmployee,
	ApprovalEmployeeQuery,
} from "#src/api/performance-management/approval";

import { exportCsv } from "#src/pages/performance-management/annual-rating/components/export-csv";
import {
	LabeledInput,
	LabeledSelect,
} from "#src/pages/performance-management/annual-rating/components/filter-fields";
import { useAnnualRatingDict } from "#src/pages/performance-management/annual-rating/hooks/use-annual-rating-dict";
import { SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import {
	approvalStatusColor,
	CHECK_STATUS_FILTER_OPTIONS,
	DISTRIBUTION_BASIS_RULE,
	EMPLOYMENT_OPTIONS,
	POSITION_CATEGORY_OPTIONS,
	SUBMIT_LEVEL_OPTIONS,
} from "./approval-constants";

/**
 * 状态圆点 + 同色文字
 *
 * @param props - 组件属性
 * @param props.status - 状态文案
 * @returns 状态展示元素
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function ApprovalStatus({ status }: { status: string }) {
	const color = approvalStatusColor(status);
	const { statusLabel } = useAnnualRatingDict();
	return (
		<span className="flex items-center gap-1 whitespace-nowrap" style={{ color }}>
			<span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
			{statusLabel(status)}
		</span>
	);
}

/**
 * 等级分布基准规则段落
 *
 * @returns 基准规则段落
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function DistributionBasisRule() {
	return (
		<p className="px-6 text-center text-base leading-6 text-[#909399]">
			{DISTRIBUTION_BASIS_RULE}
		</p>
	);
}

/**
 * 审批名单筛选栏属性
 */
interface ApprovalEmployeeFilterBarProps {
	/** 当前筛选条件 */
	value: ApprovalEmployeeQuery;
	/** 单个筛选项变更回调 */
	onChange: (patch: Partial<ApprovalEmployeeQuery>) => void;
	/** 查询回调 */
	onSearch: () => void;
	/** 重置回调 */
	onReset: () => void;
}

/**
 * 审批名单筛选栏
 *
 * 两行四列布局：姓名/工号、岗位类别、在职状态、提报等级、校验情况、状态，
 * 第二行右侧为查询 / 重置；筛选栏下方保留 16px 间距与 1px 分割线。
 *
 * @param props - 组件属性
 * @param props.value - 当前筛选条件
 * @param props.onChange - 单个筛选项变更回调
 * @param props.onSearch - 查询回调
 * @param props.onReset - 重置回调
 * @returns 筛选栏元素
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function ApprovalEmployeeFilterBar({
	value,
	onChange,
	onSearch,
	onReset,
}: ApprovalEmployeeFilterBarProps) {
	const { statusOptions } = useAnnualRatingDict();
	return (
		<div className="mb-4 border-b border-[#EBEEF5] pb-4">
			<div className="grid grid-cols-4 gap-3">
				<LabeledInput
					label="姓名/工号"
					value={value.keyword}
					onChange={(next) => onChange({ keyword: next || undefined })}
				/>
				<LabeledSelect
					label="岗位类别"
					value={value.positionCategory}
					options={POSITION_CATEGORY_OPTIONS}
					onChange={(next) => onChange({ positionCategory: next })}
				/>
				<LabeledSelect
					label="在职状态"
					value={value.employmentStatus}
					options={EMPLOYMENT_OPTIONS}
					onChange={(next) => onChange({ employmentStatus: next })}
				/>
				<LabeledSelect
					label="提报等级"
					value={value.submitLevel}
					options={SUBMIT_LEVEL_OPTIONS}
					onChange={(next) => onChange({ submitLevel: next })}
				/>
				<LabeledSelect
					label="校验情况"
					value={value.checkStatus}
					options={CHECK_STATUS_FILTER_OPTIONS}
					onChange={(next) => onChange({ checkStatus: next })}
				/>
				<LabeledSelect
					label="状态"
					value={value.status}
					options={statusOptions}
					onChange={(next) => onChange({ status: next })}
				/>
				<div className="col-span-2 flex items-center justify-end gap-2">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={onSearch}
					>
						查询
					</Button>
					<Button type="text" className="px-2 text-[#606266]" onClick={onReset}>
						重置
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * 审批名单导出按钮
 *
 * @param props - 组件属性
 * @param props.employees - 当前名单数据
 * @returns 描边导出按钮
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function ApprovalExportButton({ employees }: { employees: ApprovalEmployee[] }) {
	const { statusLabel } = useAnnualRatingDict();
	const handleExport = () => {
		const headers = [
			"员工",
			"工号",
			"部门",
			"岗位",
			"岗位分类",
			"职级",
			"在职状态",
			"自评分",
			"提报评分",
			"一级部门排名",
			"建议等级",
			"提报等级",
			"校验情况",
			"异常情况说明",
			"填报人",
			"状态",
		];
		const rows = employees.map((item) => [
			item.name,
			item.employeeNo,
			item.department,
			item.position,
			item.positionCategory,
			item.jobLevel,
			item.employmentStatus,
			item.selfScore === undefined ? "" : item.selfScore.toFixed(2),
			item.submitScore === undefined ? "" : item.submitScore.toFixed(2),
			item.departmentRank ?? "",
			item.suggestLevel ?? "",
			item.submitLevel ?? "",
			item.checkStatus,
			item.exceptionNote ?? "",
			item.filler ?? "",
			statusLabel(item.status),
		]);
		exportCsv("审批名单.csv", headers, rows);
	};

	return (
		<button
			type="button"
			className="flex h-8 cursor-pointer items-center gap-1 rounded-[3px] border border-[#E4E7ED] bg-white px-4 text-sm leading-[22px] text-[#323233]"
			onClick={handleExport}
		>
			<UploadOutlined className="text-base" />
			导出
		</button>
	);
}

/**
 * 组织树搜索输入框
 *
 * @param props - 组件属性
 * @param props.placeholder - 占位文案
 * @returns 带放大镜后缀的输入框
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function OrgTreeSearchInput({ placeholder }: { placeholder: string }) {
	return (
		<Input
			allowClear
			placeholder={placeholder}
			suffix={<SearchOutlined className="text-[#909399]" />}
			className="mb-3 h-8"
		/>
	);
}
