import type { ColumnsType } from "antd/es/table";
import { CloseOutlined } from "@ant-design/icons";
import { Checkbox, Modal } from "antd";
import Table from "antd/es/table";
import React, { useMemo } from "react";

interface IndicatorItem {
	id: number;
	indicatorId: number;
	name: string;
	tag?: number | null;
	responsibleDepartment?: string;
	unitName?: string;
	definition?: string;
	// 用于渲染的辅助字段
	groupKey?: string;
	isFirstInGroup?: boolean;
	groupSize?: number;
}

interface Props {
	/** 所有可选指标列表（从外部传入） */
	allIndicators: IndicatorItem[];
	/** 已选指标 ID 列表 */
	value?: string[];
	/** 选择变化回调 */
	onChange?: (selectedIds: string[]) => void;
	/** 是否显示弹窗 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
	/** 弹窗标题 */
	title?: string;
}

// 提升常量样式对象到模块级别
const CLOSE_ICON_STYLE = {
	fontSize: "12px",
	color: "#8c8c8c",
	cursor: "pointer" as const,
	transition: "color 0.3s",
};

export default function IndicatorRangeSelector({
	allIndicators,
	value = [],
	onChange,
	open,
	onClose,
	title = "选择指标范围",
}: Props) {
	const [selectedTags, setSelectedTags] = React.useState<Set<string>>(new Set());

	// 计算分组 key：只有具体 tag 值才分组，否则每个指标单独成组
	const getGroupKey = React.useCallback((item: IndicatorItem) => {
		// null / undefined / 空字符串 / 0 都视为“无具体 tag”
		if (item.tag != null && item.tag !== 0 && String(item.tag).trim() !== "") {
			return `tag-${item.tag}`;
		}
		return `single-${item.id || item.indicatorId}`;
	}, []);

	// 处理数据，按 groupKey 分组并标记每组的第一行
	const processedData = useMemo(() => {
		// 按 groupKey 分组，tag 为空时按指标自身单独分组
		const groupMap = new Map<string, IndicatorItem[]>();
		allIndicators.forEach((item) => {
			const groupKey = getGroupKey(item);
			if (!groupMap.has(groupKey)) {
				groupMap.set(groupKey, []);
			}
			groupMap.get(groupKey)!.push({ ...item, groupKey });
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
	}, [allIndicators, getGroupKey]);

	// 根据已选指标 ID 找到对应的分组 key
	const findTagsByIds = React.useCallback(
		(ids: string[], data: IndicatorItem[]) => {
			const tags = new Set<string>();
			data.forEach((item) => {
				if (ids.includes(String(item.id)) || ids.includes(String(item.indicatorId))) {
					tags.add(getGroupKey(item));
				}
			});
			return tags;
		},
		[getGroupKey],
	);

	// 当 value 或 allIndicators 变化时，更新 selectedTags
	React.useEffect(() => {
		if (value && value.length > 0) {
			const tags = findTagsByIds(value, allIndicators);
			setSelectedTags(tags);
		} else {
			setSelectedTags(new Set());
		}
	}, [value, allIndicators, findTagsByIds]);

	// 处理 tag 勾选
	const handleTagCheck = React.useCallback((groupKey: string, checked: boolean) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(groupKey);
			} else {
				next.delete(groupKey);
			}
			return next;
		});
	}, []);

	// 获取已选行数据（按 groupKey 分组）
	const selectedRowsMap = useMemo(() => {
		const groupMap = new Map<string, IndicatorItem[]>();
		allIndicators.forEach((item) => {
			const groupKey = getGroupKey(item);
			if (selectedTags.has(groupKey)) {
				if (!groupMap.has(groupKey)) {
					groupMap.set(groupKey, []);
				}
				groupMap.get(groupKey)!.push(item);
			}
		});
		return groupMap;
	}, [allIndicators, selectedTags, getGroupKey]);

	// 表格列定义
	const columns = useMemo<ColumnsType<IndicatorItem>>(
		() => [
			{
				title: "选择",
				width: 60,
				fixed: "left",
				render: (_, record) => {
					if (record.isFirstInGroup) {
						return {
							children: (
								<Checkbox
									checked={selectedTags.has(getGroupKey(record))}
									onChange={(e) =>
										handleTagCheck(getGroupKey(record), e.target.checked)
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
			},
			// {
			// 	title: "主责部门",
			// 	width: 120,
			// 	dataIndex: "responsibleDepartment",
			// 	key: "responsibleDepartment",
			// 	ellipsis: true,
			// },
			// { title: "单位", width: 80, dataIndex: "unitName", key: "unitName" },
			// { title: "指标定义及口径", dataIndex: "definition", key: "definition", ellipsis: true },
		],
		[selectedTags, handleTagCheck, getGroupKey],
	);

	const clearSelected = React.useCallback(() => {
		setSelectedTags(new Set());
	}, []);

	const removeSelectedTag = React.useCallback((groupKey: string) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			next.delete(groupKey);
			return next;
		});
	}, []);

	const handleOk = () => {
		// 收集所有已选指标的 ID
		const selectedIds: string[] = [];
		allIndicators.forEach((item) => {
			if (selectedTags.has(getGroupKey(item))) {
				selectedIds.push(String(item.id));
			}
		});
		onChange?.(selectedIds);
		onClose();
	};

	const handleCancel = () => {
		// 恢复到传入的 value 状态
		if (value && value.length > 0) {
			const tags = findTagsByIds(value, allIndicators);
			setSelectedTags(tags);
		} else {
			setSelectedTags(new Set());
		}
		onClose();
	};

	return (
		<Modal
			title={title}
			width={700}
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			okText="确定"
			cancelText="取消"
		>
			<div style={{ display: "flex", gap: 16, width: "100%", alignItems: "stretch" }}>
				{/* 左侧：表格 */}
				<div style={{ flex: 1, minWidth: 0 }}>
					<Table
						rowKey={(r: any) => String(r.id || r.indicatorId)}
						columns={columns}
						dataSource={processedData}
						scroll={{ y: 300, x: "max-content" }}
						pagination={false}
						size="small"
						bordered
					/>
				</div>

				{/* 右侧：已选列表 */}
				<div style={{ width: 280, flexShrink: 0, height: "100%" }}>
					<div
						style={{
							border: "1px solid #f0f0f0",
							borderRadius: 4,
							padding: 12,
							display: "flex",
							flexDirection: "column",
							height: "100%",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<div style={{ fontWeight: 500 }}>
								已选(
								{selectedRowsMap.size}
								组)
							</div>
							<a onClick={clearSelected} style={{ fontSize: 12 }}>
								清空
							</a>
						</div>

						<div
							style={{
								flex: 1,
								overflowY: "auto",
								display: "flex",
								flexDirection: "column",
								gap: 8,
							}}
						>
							{selectedRowsMap.size === 0 && (
								<div
									style={{
										textAlign: "center",
										color: "#999",
										fontSize: 12,
										marginTop: 20,
									}}
								>
									未选中任何指标
								</div>
							)}
							{Array.from(selectedRowsMap.entries()).map(([tag, items]) => (
								<div
									key={tag}
									style={{
										display: "flex",
										alignItems: "center",
										backgroundColor: "rgba(240,242,245,1)",
										borderRadius: 4,
										padding: 8,
									}}
								>
									<div
										style={{
											flex: 1,
											display: "flex",
											flexDirection: "column",
										}}
									>
										<div style={{ fontSize: 12, wordBreak: "break-word" }}>
											{items.map((item) => item.name).join("、")}
										</div>
										<div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
											共{items.length}
											项指标
										</div>
									</div>
									<CloseOutlined
										style={CLOSE_ICON_STYLE}
										onMouseEnter={(e: React.MouseEvent<HTMLSpanElement>) => {
											e.currentTarget.style.color = "#1890ff";
										}}
										onMouseLeave={(e: React.MouseEvent<HTMLSpanElement>) => {
											e.currentTarget.style.color = "#8c8c8c";
										}}
										onClick={() => removeSelectedTag(tag)}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}
