import type { ColumnsType } from "antd/es/table";
import {
	fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsList,
	indicatorConfDetailsCorrelationMetricsIndicatorList,
} from "#src/api/strategy/target-plan";
import { CloseOutlined } from "@ant-design/icons";
import Button from "antd/es/button";
import Checkbox from "antd/es/checkbox";
import Col from "antd/es/col";
import ConfigProvider from "antd/es/config-provider";
import Form from "antd/es/form";
import Input from "antd/es/input";
import message from "antd/es/message";
import Modal from "antd/es/modal";
import Row from "antd/es/row";
import Select from "antd/es/select";
import Space from "antd/es/space";
import Table from "antd/es/table";
import zhCN from "antd/locale/zh_CN";
import React, { useMemo, useState } from "react";
import { RESPONSIBLE_DEPARTMENTS } from "../../target-management/constants/indicator";

interface Props {
	open: boolean;
	onClose: (res?: any) => void;
	effTaskIndicatorConfId?: string | number;
	title?: string;
	customSubmit?: (keys: React.Key[], rows: any[]) => Promise<boolean>;
	/** 已选指标的相关参数 */
	selectedIndicatorParams?: {
		effTaskIndicatorSubmitUserId: number | string;
		sourceNewB?: boolean;
		suspendedVersion?: number | string;
		suspendedEditId?: number | string;
	};
}

interface IndicatorItem {
	id: number;
	indicatorId: number;
	name: string;
	tag?: number | null;
	responsibleDepartment?: string;
	unitName?: string;
	definition?: string;
	groupKey?: string;
	// 用于渲染的辅助字段
	isFirstInGroup?: boolean;
	groupSize?: number;
}

// 提升常量样式对象到模块级别 (rendering-hoist-jsx)
const HIGHLIGHT_STYLE = {
	color: "#ff4d4f",
	fontWeight: "bold" as const,
};

const SELECT_MIN_WIDTH_STYLE = { minWidth: 260 };
const PANEL_HEIGHT = 500;
const TABLE_SCROLL_Y = PANEL_HEIGHT - 40;
const SELECTED_PANEL_STYLE = { maxHeight: PANEL_HEIGHT };
const WORD_BREAK_STYLE: React.CSSProperties = { wordBreak: "break-word" };

export default function AddGroupedIndicatorDrawer({
	open,
	onClose,
	effTaskIndicatorConfId,
	title,
	customSubmit,
	selectedIndicatorParams,
}: Props) {
	const [form] = Form.useForm();
	const [allData, setAllData] = React.useState<IndicatorItem[]>([]); // 全量数据
	const [filteredData, setFilteredData] = React.useState<IndicatorItem[]>([]); // 过滤后的数据
	const [loading, setLoading] = React.useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);

	const [selectedTags, setSelectedTags] = React.useState<Set<string>>(() => new Set());
	const [searchKeyword, setSearchKeyword] = React.useState("");
	const [, setSearchDept] = React.useState<string | undefined>(undefined);

	const getGroupKey = React.useCallback((item: IndicatorItem) => {
		if (item.tag !== null && item.tag !== undefined) {
			return `tag-${item.tag}`;
		}
		return `single-${item.id || item.indicatorId}`;
	}, []);

	// 加载已选指标
	const loadSelectedIndicators = React.useCallback(async (): Promise<number[]> => {
		if (!selectedIndicatorParams) return [];

		try {
			const res =
				await fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsList(
					selectedIndicatorParams,
				);
			if (res && res.data) {
				// res.data 格式: {1500433:"实收",1500434:"应收"}
				const selectedIds = Object.keys(res.data).map((id) => Number(id));
				return selectedIds;
			}
		} catch (e) {
			console.error("load selected indicators failed", e);
		}
		return [];
	}, [selectedIndicatorParams]);

	// 根据指标ID找到对应的tag
	const findTagsByIndicatorIds = React.useCallback(
		(indicatorIds: number[], data: IndicatorItem[]) => {
			const tags = new Set<string>();
			data.forEach((item) => {
				if (indicatorIds.includes(item.id) || indicatorIds.includes(item.indicatorId)) {
					tags.add(getGroupKey(item));
				}
			});
			return tags;
		},
		[getGroupKey],
	);

	// 处理数据，标记每组的第一行
	const processData = React.useCallback(
		(rawData: IndicatorItem[]) => {
			// 按 groupKey 分组，tag 为空时按指标自身单独分组
			const groupMap = new Map<string, IndicatorItem[]>();
			rawData.forEach((item) => {
				const groupKey = getGroupKey(item);
				if (!groupMap.has(groupKey)) {
					groupMap.set(groupKey, []);
				}
				groupMap.get(groupKey)!.push({
					...item,
					groupKey,
				});
			});

			// 标记每组的第一行和组大小
			const processed: IndicatorItem[] = [];
			groupMap.forEach((items) => {
				items.forEach((item, index) => {
					processed.push({
						...item,
						isFirstInGroup: index === 0,
						groupSize: items.length,
					});
				});
			});

			return processed;
		},
		[getGroupKey],
	);

	// 前端过滤数据
	const filterData = React.useCallback(
		(keyword: string, deptCode: string | number | undefined) => {
			if (!keyword && !deptCode && deptCode !== 0) {
				// 没有搜索条件，显示全部数据
				setFilteredData(allData);
				return;
			}

			const lowerKeyword = keyword.toLowerCase().trim();

			// 将部门编码转换为部门名称
			let deptName: string | undefined;
			if (deptCode !== undefined && deptCode !== null) {
				const deptOption = RESPONSIBLE_DEPARTMENTS.find(
					(d) => d.value === Number(deptCode),
				);
				deptName = deptOption?.label;
			}

			// 第一步：找到匹配的指标
			const matchedTags = new Set<string>();
			allData.forEach((item) => {
				let matched = true;

				// 指标名称匹配
				if (lowerKeyword && !item.name?.toLowerCase().includes(lowerKeyword)) {
					matched = false;
				}

				// 主责部门匹配（字符串模糊匹配）
				if (deptName && !item.responsibleDepartment?.includes(deptName)) {
					matched = false;
				}

				if (matched) {
					matchedTags.add(item.groupKey || getGroupKey(item));
				}
			});

			// 第二步：显示这些 tag 对应的所有指标
			const filtered = allData.filter((item) =>
				matchedTags.has(item.groupKey || getGroupKey(item)),
			);
			const processed = processData(filtered);
			setFilteredData(processed);
		},
		[allData, processData, getGroupKey],
	);

	// 高亮关键词
	const highlightText = React.useCallback((text: string, keyword: string): React.ReactNode => {
		if (!keyword || !text) return text;

		const lowerText = text.toLowerCase();
		const lowerKeyword = keyword.toLowerCase().trim();
		const index = lowerText.indexOf(lowerKeyword);

		if (index === -1) return text;

		const before = text.substring(0, index);
		const match = text.substring(index, index + keyword.length);
		const after = text.substring(index + keyword.length);

		return (
			<>
				{before}
				<span style={HIGHLIGHT_STYLE}>{match}</span>
				{highlightText(after, keyword)}
			</>
		);
	}, []);

	// 加载指标列表（全量）- 优化并行请求 (async-parallel)
	const loadIndicators = React.useCallback(async () => {
		setLoading(true);
		try {
			const fetchParams = {
				effTaskIndicatorConfId,
			};

			// 并行启动两个请求 (async-parallel)
			const [resp, selectedIds] = await Promise.all([
				indicatorConfDetailsCorrelationMetricsIndicatorList(fetchParams as any),
				selectedIndicatorParams ? loadSelectedIndicators() : Promise.resolve([]),
			]);

			const list: IndicatorItem[] = Array.isArray(resp?.data) ? resp.data : [];

			// 处理数据
			const processedData = processData(list);
			setAllData(processedData);
			setFilteredData(processedData);

			// 设置已选指标
			if (selectedIds && selectedIds.length > 0) {
				const tags = findTagsByIndicatorIds(selectedIds, list);
				setSelectedTags(tags);
			}
		} catch (e) {
			console.error("load indicators failed", e);
		} finally {
			setLoading(false);
		}
	}, [
		effTaskIndicatorConfId,
		selectedIndicatorParams,
		processData,
		findTagsByIndicatorIds,
		loadSelectedIndicators,
	]);

	React.useEffect(() => {
		if (open) {
			loadIndicators();
		} else {
			// 关闭时重置状态
			setSelectedTags(new Set());
			setSearchKeyword("");
			setSearchDept(undefined);
			form.resetFields();
		}
	}, [open, loadIndicators]);

	const handleSearch = React.useCallback(() => {
		const vals = form.getFieldsValue();
		const name = (vals.name || "").trim();
		const dept = vals.responsibleDepartmentCode;
		setSearchKeyword(name);
		setSearchDept(dept);
		filterData(name, dept);
	}, [form, filterData]);

	const handleReset = React.useCallback(() => {
		form.resetFields();
		setSearchKeyword("");
		setSearchDept(undefined);
		setFilteredData(allData);
	}, [form, allData]);

	// 处理 tag 勾选 - 使用函数式更新 (rerender-functional-setstate)
	const handleTagCheck = React.useCallback((tag: string, checked: boolean) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(tag);
			} else {
				next.delete(tag);
			}
			return next;
		});
	}, []);

	// 获取已选行数据（用于右侧显示）
	const selectedRowsMap = useMemo(() => {
		const groupMap = new Map<string, IndicatorItem[]>();
		// 从全量数据中获取已选数据，而不是从过滤后的数据
		allData.forEach((item) => {
			const currentGroupKey = item.groupKey || getGroupKey(item);
			if (selectedTags.has(currentGroupKey)) {
				if (!groupMap.has(currentGroupKey)) {
					groupMap.set(currentGroupKey, []);
				}
				groupMap.get(currentGroupKey)!.push(item);
			}
		});
		return groupMap;
	}, [allData, selectedTags, getGroupKey]);

	const filteredGroupKeys = useMemo(() => {
		return Array.from(new Set(filteredData.map((item) => item.groupKey || getGroupKey(item))));
	}, [filteredData, getGroupKey]);

	const selectedFilteredCount = useMemo(() => {
		return filteredGroupKeys.filter((groupKey) => selectedTags.has(groupKey)).length;
	}, [filteredGroupKeys, selectedTags]);

	const allChecked =
		filteredGroupKeys.length > 0 && selectedFilteredCount === filteredGroupKeys.length;
	const indeterminate = selectedFilteredCount > 0 && !allChecked;

	const handleCheckAll = React.useCallback(
		(checked: boolean) => {
			setSelectedTags((prev) => {
				if (checked) {
					const next = new Set(prev);
					filteredGroupKeys.forEach((key) => next.add(key));
					return next;
				}

				const next = new Set(prev);
				filteredGroupKeys.forEach((key) => next.delete(key));
				return next;
			});
		},
		[filteredGroupKeys],
	);

	// Memoize columns (rerender-memo)
	const columns = useMemo<ColumnsType<IndicatorItem>>(
		() => [
			{
				title: (
					<Checkbox
						checked={allChecked}
						indeterminate={indeterminate}
						onChange={(e) => handleCheckAll(e.target.checked)}
					/>
				),
				width: 60,
				fixed: "left",
				render: (_, record) => {
					const currentGroupKey = record.groupKey || getGroupKey(record);
					if (record.isFirstInGroup) {
						return {
							children: (
								<Checkbox
									checked={selectedTags.has(currentGroupKey)}
									onChange={(e) =>
										handleTagCheck(currentGroupKey, e.target.checked)
									}
								/>
							),
							props: {
								rowSpan: record.groupSize,
							},
						};
					}
					return {
						props: {
							rowSpan: 0,
						},
					};
				},
			},
			{
				title: "指标名称",
				dataIndex: "name",
				key: "name",
				ellipsis: true,
				render: (text: string) => highlightText(text, searchKeyword),
			},
			{
				title: "主责部门",
				width: 120,
				dataIndex: "responsibleDepartment",
				key: "responsibleDepartment",
				ellipsis: true,
			},
			{ title: "单位", width: 80, dataIndex: "unitName", key: "unitName" },
			{ title: "指标定义及口径", dataIndex: "definition", key: "definition", ellipsis: true },
		],
		[
			selectedTags,
			handleTagCheck,
			highlightText,
			searchKeyword,
			getGroupKey,
			allChecked,
			indeterminate,
			handleCheckAll,
		],
	);

	const clearSelected = React.useCallback(() => {
		setSelectedTags(new Set());
	}, []);

	const removeSelectedTag = React.useCallback((tag: string) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			next.delete(tag);
			return next;
		});
	}, []);

	const handleOk = async () => {
		if (selectedTags.size === 0) {
			message.warning("请先选择要添加的指标");
			return;
		}

		// 收集所有已选指标的ID（从全量数据中收集）
		const allIndicatorIds: number[] = [];
		const allIndicators: IndicatorItem[] = [];
		allData.forEach((item) => {
			if (selectedTags.has(item.groupKey || getGroupKey(item))) {
				allIndicatorIds.push(item.id);
				allIndicators.push(item);
			}
		});

		if (customSubmit) {
			setConfirmLoading(true);
			try {
				const success = await customSubmit(allIndicatorIds, allIndicators);
				if (success) {
					message.success("操作成功");
					onClose?.({ saved: true });
				}
			} catch (e) {
				console.error(e);
				message.error("操作失败");
			} finally {
				setConfirmLoading(false);
			}
			return;
		}

		message.error("未配置提交方法");
	};

	return (
		<Modal
			title={title || "选择指标"}
			width={856}
			open={open}
			onCancel={() => {
				onClose();
			}}
			onOk={handleOk}
			confirmLoading={confirmLoading}
		>
			<Form form={form} layout="inline" className="mb-4 w-full">
				<Form.Item name="name" label={null} className="flex-1">
					<Input
						placeholder=" 支持模糊搜索"
						prefix="指标名称"
						onPressEnter={handleSearch}
					/>
				</Form.Item>

				<Form.Item name="responsibleDepartmentCode">
					<Select
						prefix="主责部门"
						allowClear
						placeholder=" 全部"
						style={SELECT_MIN_WIDTH_STYLE}
						options={RESPONSIBLE_DEPARTMENTS}
						onSelect={handleSearch}
						onClear={handleSearch}
					/>
				</Form.Item>

				<Form.Item className="ml-auto">
					<Space>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</Space>
				</Form.Item>
			</Form>

			<Row gutter={16}>
				<Col span={16}>
					<div className="rounded bg-white" style={{ height: PANEL_HEIGHT }}>
						<ConfigProvider locale={zhCN}>
							<Table
								rowKey={(r: any) => String(r.id || r.indicatorId)}
								columns={columns}
								dataSource={filteredData}
								loading={loading}
								scroll={{ y: TABLE_SCROLL_Y }}
								pagination={false}
								size="small"
								bordered
							/>
						</ConfigProvider>
					</div>
				</Col>

				<Col span={8}>
					<div
						className="flex h-full flex-col rounded border border-gray-200 p-3"
						style={SELECTED_PANEL_STYLE}
					>
						<div className="mb-3 flex flex-shrink-0 items-center justify-between">
							<div className="font-medium">
								已选(
								{selectedRowsMap.size}
								组)
							</div>
							<Button size="small" onClick={clearSelected} type="link">
								清空
							</Button>
						</div>

						<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
							{selectedRowsMap.size === 0 && (
								<div className="text-sm text-gray-500">未选中任何指标</div>
							)}
							{Array.from(selectedRowsMap.entries()).map(([groupKey, items]) => (
								<div
									key={groupKey}
									className="flex flex-shrink-0 items-center rounded bg-[rgba(240,242,245,1)] px-2 py-2"
								>
									<div className="flex flex-1 flex-col">
										<div className="text-sm" style={WORD_BREAK_STYLE}>
											{items.map((item) => item.name).join("、")}
										</div>
										<div className="mt-1 text-xs text-gray-500">
											共{items.length}
											项指标
										</div>
									</div>
									<CloseOutlined
										className="ml-2 flex-shrink-0 cursor-pointer text-[#8c8c8c] transition-colors hover:text-[#1890ff]"
										onClick={() => removeSelectedTag(groupKey)}
									/>
								</div>
							))}
						</div>
					</div>
				</Col>
			</Row>
		</Modal>
	);
}
