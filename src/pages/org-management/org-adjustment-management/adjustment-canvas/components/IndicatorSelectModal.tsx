import type {
	OrgAdjustmentTaskIndicatorInfo,
	PageForTargetPlanItem,
	TargetPlanPageItem,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import {
	fetchTargetPlanPage,
	pageForTargetPlan,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { App, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";

interface IndicatorSelectModalProps {
	open: boolean;
	title: string;
	onConfirm: (info: OrgAdjustmentTaskIndicatorInfo) => void;
	onCancel: () => void;
}

interface PlanOption {
	label: string;
	value: number;
}

interface IndicatorOption {
	label: string;
	value: number;
	item: PageForTargetPlanItem;
}

function buildPlanOption(plan: TargetPlanPageItem): PlanOption {
	return {
		label: `${plan.name}${plan.year ? ` (${plan.year})` : ""}`,
		value: plan.id,
	};
}

export const IndicatorSelectModal: React.FC<IndicatorSelectModalProps> = ({
	open,
	title,
	onConfirm,
	onCancel,
}) => {
	const { message } = App.useApp();

	const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
	const [planLoading, setPlanLoading] = useState(false);
	const [selectedPlanId, setSelectedPlanId] = useState<number>();

	const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);
	const [indicatorLoading, setIndicatorLoading] = useState(false);
	const [selectedIndicatorId, setSelectedIndicatorId] = useState<number>();

	// 打开时加载目标计划列表
	useEffect(() => {
		if (!open) {
			setSelectedPlanId(undefined);
			setSelectedIndicatorId(undefined);
			setPlanOptions([]);
			setIndicatorOptions([]);
			return;
		}

		const loadPlanOptions = async () => {
			setPlanLoading(true);
			try {
				const response = await fetchTargetPlanPage({ pageNum: 1, pageSize: 500 });
				const list = Array.isArray(response?.data?.list) ? response.data.list : [];
				setPlanOptions(list.map(buildPlanOption));
			} catch {
				setPlanOptions([]);
				message.error("目标计划加载失败");
			} finally {
				setPlanLoading(false);
			}
		};

		void loadPlanOptions();
	}, [open]);

	// 选择计划后加载指标列表
	useEffect(() => {
		if (!selectedPlanId) {
			setIndicatorOptions([]);
			setSelectedIndicatorId(undefined);
			return;
		}

		const loadIndicators = async () => {
			setIndicatorLoading(true);
			try {
				const response = await pageForTargetPlan({
					pageNum: 1,
					pageSize: 500,
					targetPlanId: selectedPlanId,
				});
				const list = Array.isArray(response?.data?.list) ? response.data.list : [];
				setIndicatorOptions(
					list.map((item) => ({
						label: item.name,
						value: item.id,
						item,
					})),
				);
			} catch {
				setIndicatorOptions([]);
				message.error("指标列表加载失败");
			} finally {
				setIndicatorLoading(false);
			}
		};

		void loadIndicators();
	}, [selectedPlanId]);

	const handlePlanChange = (value: number) => {
		setSelectedPlanId(value);
		setSelectedIndicatorId(undefined);
		setIndicatorOptions([]);
	};

	const handleConfirm = () => {
		if (!selectedPlanId || !selectedIndicatorId) return;
		const selectedItem = indicatorOptions.find((opt) => opt.value === selectedIndicatorId);
		onConfirm({
			indicatorPlanId: String(selectedPlanId),
			indicatorId: String(selectedIndicatorId),
			indicatorName: selectedItem?.label ?? "",
		});
	};

	return (
		<Modal
			title={title}
			open={open}
			onOk={handleConfirm}
			onCancel={onCancel}
			okButtonProps={{ disabled: !selectedPlanId || !selectedIndicatorId }}
			width={572}
		>
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-3">
					<span className="shrink-0 text-sm">
						<span className="mr-0.5 text-red-500">*</span>
						目标计划
					</span>
					<Select
						className="flex-1"
						showSearch
						optionFilterProp="label"
						placeholder="请选择"
						value={selectedPlanId}
						loading={planLoading}
						options={planOptions.reverse()}
						onChange={handlePlanChange}
					/>
				</div>
				<div className="flex items-center gap-3">
					<span className="shrink-0 text-sm">
						<span className="mr-0.5 text-red-500">*</span>
						对应指标
					</span>
					<Select
						className="flex-1"
						showSearch
						optionFilterProp="label"
						placeholder="请选择"
						value={selectedIndicatorId}
						loading={indicatorLoading}
						options={indicatorOptions}
						onChange={setSelectedIndicatorId}
						disabled={!selectedPlanId}
					/>
				</div>
			</div>
		</Modal>
	);
};

export default IndicatorSelectModal;
