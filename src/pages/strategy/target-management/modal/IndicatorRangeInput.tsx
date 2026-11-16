import { EditOutlined } from "@ant-design/icons";
import React from "react";
import IndicatorRangeSelector from "./IndicatorRangeSelector";

interface IndicatorItem {
	id: number;
	indicatorId: number;
	name: string;
	tag: number;
	responsibleDepartment?: string;
	unitName?: string;
	definition?: string;
}

interface Props {
	/** 所有可选指标列表（从外部传入） */
	allIndicators: IndicatorItem[];
	/** 已选指标 ID 列表 */
	value?: string[];
	/** 选择变化回调 */
	onChange?: (selectedIds: string[]) => void;
	/** 是否禁用 */
	disabled?: boolean;
	/** 状态（用于显示错误） */
	status?: "error" | "warning";
	/** 是否加载中 */
	loading?: boolean;
}

export default function IndicatorRangeInput({
	allIndicators,
	value = [],
	onChange,
	disabled = false,
	status,
	loading = false,
}: Props) {
	const [modalOpen, setModalOpen] = React.useState(false);

	const handleClick = () => {
		if (!disabled && !loading) {
			setModalOpen(true);
		}
	};

	const handleModalChange = (selectedIds: string[]) => {
		onChange?.(selectedIds);
	};

	// 计算显示文本
	const displayText = React.useMemo(() => {
		if (loading) {
			return "加载中...";
		}
		if (value && value.length > 0) {
			// 获取已选指标的名称
			const selectedNames: string[] = [];
			allIndicators.forEach((item) => {
				if (value.includes(String(item.id)) || value.includes(String(item.indicatorId))) {
					selectedNames.push(item.name);
				}
			});
			const namesText = selectedNames.join(", ");
			// 如果文本太长，截断并添加省略号
			const maxLength = 30;
			if (namesText.length > maxLength) {
				return `${namesText.substring(0, maxLength)}...`;
			}
			return namesText;
		}
		return "请选择";
	}, [value, allIndicators, loading]);

	const isPlaceholder = !value || value.length === 0;

	// 计算完整的指标名称列表（用于 title）
	const fullText = React.useMemo(() => {
		if (value && value.length > 0) {
			const selectedNames: string[] = [];
			allIndicators.forEach((item) => {
				if (value.includes(String(item.id)) || value.includes(String(item.indicatorId))) {
					selectedNames.push(item.name);
				}
			});
			return selectedNames.join(", ");
		}
		return "";
	}, [value, allIndicators]);

	return (
		<>
			<div
				title={fullText || undefined}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					border: `1px solid ${status === "error" ? "#ff4d4f" : "#d9d9d9"}`,
					borderRadius: 4,
					padding: "4px 11px",
					height: 32,
					cursor: disabled || loading ? "not-allowed" : "pointer",
					backgroundColor: disabled ? "#f5f5f5" : "#fff",
					transition: "all 0.3s",
					width: 120,
				}}
				onClick={handleClick}
				onMouseEnter={(e) => {
					if (!disabled && !loading) {
						e.currentTarget.style.borderColor = "#40a9ff";
					}
				}}
				onMouseLeave={(e) => {
					if (!disabled && !loading && status !== "error") {
						e.currentTarget.style.borderColor = "#d9d9d9";
					}
				}}
			>
				<span
					style={{
						fontSize: 14,
						color: isPlaceholder ? "#bfbfbf" : "#000",
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						flex: 1,
					}}
				>
					{displayText}
				</span>
				<EditOutlined
					style={{
						color: disabled || loading ? "#bfbfbf" : "#1890ff",
						fontSize: 14,
						marginLeft: 8,
						flexShrink: 0,
					}}
				/>
			</div>

			<IndicatorRangeSelector
				allIndicators={allIndicators}
				value={value}
				onChange={handleModalChange}
				open={modalOpen}
				onClose={() => setModalOpen(false)}
			/>
		</>
	);
}
