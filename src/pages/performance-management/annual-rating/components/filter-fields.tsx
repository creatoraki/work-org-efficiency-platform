import { cn } from "#src/utils";
import { DatePicker, Input, Select, TreeSelect } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import styles from "./filter-fields.module.css";

interface LabeledInputProps {
	/** 字段名 */
	label: string;
	/** 输入值 */
	value?: string;
	/** 输入值变更回调 */
	onChange: (value: string) => void;
}

/**
 * 内嵌标签的输入框。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 输入值
 * @param props.onChange - 输入值变更回调
 * @returns 输入框元素
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function LabeledInput({ label, value, onChange }: LabeledInputProps) {
	return (
		<div
			className={cn(
				"flex h-8 items-center rounded-[3px] border border-[#DCDFE6] bg-white pl-3",
				styles.labeledField,
			)}
		>
			<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">{label}</span>
			<Input
				allowClear
				bordered={false}
				className="flex-1"
				placeholder="支持模糊搜索"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}

/** 下拉值类型：字典 value 可能是数字码或字符串码 */
type LabeledSelectValue = string | number;

/**
 * 下拉选项
 *
 * label 是全文，同时承担「搜索过滤」与「选中后展示」两个职责；
 * splitLabel 只影响下拉面板内的排版，用于把一列信息拆成上下对齐的两列。
 */
export interface LabeledSelectOption<T extends LabeledSelectValue = string> {
	/** 选项全文，同时作为搜索过滤字段与选中后的展示文案 */
	label: string;
	/** 选项值 */
	value: T;
	/**
	 * 下拉面板内的分栏文案
	 *
	 * primary 列固定最小宽度，secondary 列紧随其后，使多行之间逐列对齐
	 * （典型场景：「姓名 - 工号」）。不配置时面板内整行渲染 label。
	 */
	splitLabel?: {
		/** 主文案（如姓名） */
		primary: string;
		/** 次文案（如工号） */
		secondary?: string;
	};
}

/** 树选择节点 */
export interface LabeledTreeSelectNode {
	/** 节点值 */
	value: string;
	/** 节点标题 */
	title: string;
	/** 子节点 */
	children?: LabeledTreeSelectNode[];
}

/**
 * 高亮选项文案中的搜索命中片段
 *
 * antd Select 无内置高亮，用 optionRender 标注命中段。
 *
 * @param label - 选项文案
 * @param keyword - 当前搜索词
 * @returns 带高亮片段的文案
 */
function highlightLabel(label: string, keyword: string) {
	const term = keyword.trim();
	if (!term) {
		return label;
	}
	const index = label.toLowerCase().indexOf(term.toLowerCase());
	if (index < 0) {
		return label;
	}
	return (
		<>
			{label.slice(0, index)}
			<span className="font-medium text-[#0075FF]">
				{label.slice(index, index + term.length)}
			</span>
			{label.slice(index + term.length)}
		</>
	);
}

/**
 * 渲染单行下拉选项
 *
 * 未配置 splitLabel 时整行渲染全文；配置后主文案列给最小宽度，
 * 次文案列排在破折号之后，从而在多行之间形成上下对齐的两列。
 *
 * @param option - 待渲染的选项
 * @param keyword - 当前搜索词，用于高亮命中片段
 * @returns 选项内容
 */
function renderOptionContent(
	option: Pick<LabeledSelectOption, "label" | "splitLabel">,
	keyword: string,
) {
	const split = option.splitLabel;
	if (!split) {
		return highlightLabel(option.label, keyword);
	}
	return (
		<span className="flex items-center gap-2">
			{/* min-w-[3em] 即三个汉字宽（面板 14px 字号下 42px），列宽一致才能让破折号上下对齐 */}
			<span className="min-w-[3em] shrink-0">{highlightLabel(split.primary, keyword)}</span>
			{split.secondary ? (
				<>
					<span className="shrink-0 text-[#C0C4CC]">-</span>
					<span>{highlightLabel(split.secondary, keyword)}</span>
				</>
			) : null}
		</span>
	);
}

interface LabeledSelectProps<T extends LabeledSelectValue = string> {
	/** 字段名 */
	label: string;
	/** 选中值 */
	value?: T;
	/** 下拉选项 */
	options: Array<LabeledSelectOption<T>>;
	/** 选中值变更回调 */
	onChange: (value?: T) => void;
	/** 是否支持输入搜索（按选项文案过滤） */
	searchable?: boolean;
}

/**
 * 内嵌标签的单选下拉框。
 *
 * 泛型承载字符串/数字字典值；searchable 按选项文案过滤。
 * 选项配置 splitLabel 时，面板内按两列对齐展示。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 选中值
 * @param props.options - 下拉选项
 * @param props.onChange - 选中值变更回调，清空时为 undefined
 * @param props.searchable - 是否支持输入搜索
 * @returns 下拉框元素
 *
 * @author 王善能
 * @since 2026-11-13
 */
export function LabeledSelect<T extends LabeledSelectValue = string>({
	label,
	value,
	options,
	onChange,
	searchable = false,
}: LabeledSelectProps<T>) {
	/** 当前搜索词，用于选项文案高亮 */
	const [keyword, setKeyword] = useState("");

	/** 选项值 → 选项原始数据，供 optionRender 反查分栏文案（antd 只回传 label/value） */
	const optionMap = useMemo(
		() => new Map(options.map((option) => [String(option.value), option])),
		[options],
	);

	/** 是否需要接管面板渲染：搜索高亮与分栏排版都走自定义渲染 */
	const customRender = searchable || options.some((option) => option.splitLabel);

	return (
		<div
			className={cn(
				"flex h-8 items-center rounded-[3px] border border-[#E4E7ED] bg-white pl-3",
				styles.labeledSelect,
			)}
		>
			<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">{label}</span>
			<Select
				allowClear
				bordered={false}
				className="flex-1"
				placeholder="请选择"
				options={options}
				value={value}
				showSearch={searchable}
				optionFilterProp="label"
				onSearch={setKeyword}
				onOpenChange={(open) => {
					if (!open) {
						setKeyword("");
					}
				}}
				optionRender={
					customRender
						? (option) => {
								const source = optionMap.get(String(option.value));
								return source
									? renderOptionContent(source, keyword)
									: highlightLabel(String(option.label ?? ""), keyword);
							}
						: undefined
				}
				onChange={onChange}
			/>
		</div>
	);
}

interface LabeledTreeSelectProps {
	/** 字段名 */
	label: string;
	/** 选中值（树节点 value） */
	value?: string;
	/** 树数据 */
	treeData: LabeledTreeSelectNode[];
	/** 选中值变更回调，清空时为 undefined */
	onChange: (value?: string) => void;
}

/**
 * 内嵌标签的树选择框。
 *
 * 用于层级字段；按节点 title 搜索。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 选中值
 * @param props.treeData - 树数据
 * @param props.onChange - 选中值变更回调
 * @returns 树选择框元素
 *
 * @author 王善能
 * @since 2026-11-14
 */
export function LabeledTreeSelect({ label, value, treeData, onChange }: LabeledTreeSelectProps) {
	return (
		<div
			className={cn(
				"flex h-8 items-center rounded-[3px] border border-[#E4E7ED] bg-white pl-3",
				styles.labeledSelect,
			)}
		>
			<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">{label}</span>
			<TreeSelect
				allowClear
				variant="borderless"
				className="flex-1"
				placeholder="请选择"
				popupMatchSelectWidth={false}
				value={value}
				treeData={treeData}
				showSearch
				treeNodeFilterProp="title"
				onChange={(next) => onChange(next || undefined)}
			/>
		</div>
	);
}

interface LabeledYearPickerProps {
	/** 字段名 */
	label: string;
	/** 选中值（四位年份，如 2026） */
	value?: string;
	/** 选中值变更回调，清空时为 undefined */
	onChange: (value?: string) => void;
}

/** 年度评级最早可选年份（业务从 2026 年度评级开始） */
const MIN_RATING_YEAR = 2026;

/**
 * 内嵌标签的年份选择框。
 *
 * 用于按年筛选的周期字段：值为四位年份，后端会拼接「年度」后匹配计划周期；
 * 早于 2026 年的年份不可选。
 *
 * @param props - 组件属性
 * @param props.label - 字段名
 * @param props.value - 选中值（年份）
 * @param props.onChange - 选中值变更回调
 * @returns 年份选择框元素
 *
 * @author 王善能
 * @since 2026-11-14
 */
export function LabeledYearPicker({ label, value, onChange }: LabeledYearPickerProps) {
	return (
		<div
			className={cn(
				"flex h-8 items-center rounded-[3px] border border-[#E4E7ED] bg-white pl-3",
				styles.labeledSelect,
			)}
		>
			<span className="mr-3 shrink-0 text-sm leading-[22px] text-[#606266]">{label}</span>
			<DatePicker
				allowClear
				picker="year"
				variant="borderless"
				className="flex-1"
				placeholder="请选择"
				value={value ? dayjs(`${value}-01-01`) : undefined}
				disabledDate={(current) => current.year() < MIN_RATING_YEAR}
				onChange={(date) => onChange(date ? date.format("YYYY") : undefined)}
			/>
		</div>
	);
}
