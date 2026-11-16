import type { ColumnsType } from "antd/es/table";
import { CloseOutlined } from "@ant-design/icons";
import { Checkbox, Modal } from "antd";
import Table from "antd/es/table";
import React, { useMemo } from "react";

interface IndicatorItem {
	id: number | string;
	name: string;
	tag?: string | number;
	responsibleDepartment?: string;
	fillInQuantity?: number;
	// 用于渲染的辅助字段
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

const PANEL_HEIGHT = 440;

export default function SubmitIndicatorSelector({
	allIndicators,
	value = [],
	onChange,
	open,
	onClose,
	title = "选择提交指标",
}: Props) {
	const [selectedTags, setSelectedTags] = React.useState<Set<string>>(new Set());

	const getTagKey = React.useCallback((item: IndicatorItem) => {
		return item.tag !== undefined && item.tag !== null ? String(item.tag) : `single_${item.id}`;
	}, []);

	// 处理数据，按 tag 分组并标记每组的第一行
	const processedData = useMemo(() => {
		// 按 tag 分组
		const groupMap = new Map<string, IndicatorItem[]>();
		allIndicators.forEach((item) => {
			const tagKey = getTagKey(item);
			if (!groupMap.has(tagKey)) {
				groupMap.set(tagKey, []);
			}
			groupMap.get(tagKey)!.push(item);
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
	}, [allIndicators, getTagKey]);

	// 根据已选指标 ID 找到对应的 tags
	const findTagsByIds = React.useCallback(
		(ids: string[], data: IndicatorItem[]) => {
			const tags = new Set<string>();
			data.forEach((item) => {
				if (ids.includes(String(item.id))) {
					const tagKey = getTagKey(item);
					tags.add(tagKey);
				}
			});
			return tags;
		},
		[getTagKey],
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
	const handleTagCheck = React.useCallback((tagKey: string, checked: boolean) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			if (checked) {
				next.add(tagKey);
			} else {
				next.delete(tagKey);
			}
			return next;
		});
	}, []);

	// 获取已选行数据（按 tag 分组）
	const selectedRowsMap = useMemo(() => {
		const groupMap = new Map<string, IndicatorItem[]>();
		allIndicators.forEach((item) => {
			const tagKey = getTagKey(item);
			if (selectedTags.has(tagKey)) {
				if (!groupMap.has(tagKey)) {
					groupMap.set(tagKey, []);
				}
				groupMap.get(tagKey)!.push(item);
			}
		});
		return groupMap;
	}, [allIndicators, selectedTags, getTagKey]);

	const allTagKeys = useMemo(() => {
		return Array.from(new Set(allIndicators.map((item) => getTagKey(item))));
	}, [allIndicators, getTagKey]);

	const allChecked =
		allTagKeys.length > 0 && allTagKeys.every((tagKey) => selectedTags.has(tagKey));
	const indeterminate = selectedTags.size > 0 && !allChecked;

	const handleCheckAll = React.useCallback(
		(checked: boolean) => {
			if (checked) {
				setSelectedTags(new Set(allTagKeys));
				return;
			}
			setSelectedTags(new Set());
		},
		[allTagKeys],
	);

	// 表格列定义
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
					if (record.isFirstInGroup) {
						const tagKey = getTagKey(record);
						return {
							children: (
								<Checkbox
									checked={selectedTags.has(tagKey)}
									onChange={(e) => handleTagCheck(tagKey, e.target.checked)}
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
				title: "主责部门",
				dataIndex: "responsibleDepartment",
				key: "responsibleDepartment",
				width: 150,
				ellipsis: true,
				render: (text) => text || "-",
			},
			{
				title: "指标名称",
				dataIndex: "name",
				key: "name",
				ellipsis: true,
			},
			{
				title: "数据量",
				dataIndex: "fillInQuantity",
				key: "fillInQuantity",
				width: 100,
				render: (value) => value ?? "-",
			},
		],
		[selectedTags, handleTagCheck, getTagKey, allChecked, indeterminate, handleCheckAll],
	);

	const clearSelected = React.useCallback(() => {
		setSelectedTags(new Set());
	}, []);

	const removeSelectedTag = React.useCallback((tagKey: string) => {
		setSelectedTags((prev) => {
			const next = new Set(prev);
			next.delete(tagKey);
			return next;
		});
	}, []);

	const handleOk = () => {
		// 收集所有已选指标的 ID
		const selectedIds: string[] = [];
		allIndicators.forEach((item) => {
			const tagKey = getTagKey(item);
			if (selectedTags.has(tagKey)) {
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
			width={900}
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			okText="确定"
			cancelText="取消"
		>
			<div
				style={{
					display: "flex",
					gap: 16,
					width: "100%",
					alignItems: "stretch",
					height: PANEL_HEIGHT,
				}}
			>
				{/* 左侧：表格 */}
				<div style={{ flex: 1, minWidth: 0, height: "100%" }}>
					<Table
						rowKey={(r: any) => String(r.id)}
						columns={columns}
						dataSource={processedData}
						scroll={{ y: PANEL_HEIGHT - 40, x: "max-content" }}
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
							{Array.from(selectedRowsMap.entries()).map(([tagKey, items]) => (
								<div
									key={tagKey}
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
										onClick={() => removeSelectedTag(tagKey)}
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
