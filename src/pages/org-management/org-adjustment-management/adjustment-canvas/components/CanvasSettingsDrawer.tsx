import type {
	OrgAdjustmentTaskIndicatorInfo,
	OrgAdjustmentTaskOrgItem,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DisplayFieldSettingKey } from "../settings";
import { fetchTargetPlanListOverVal } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { EditOutlined } from "@ant-design/icons";
import { App, Checkbox, Drawer, Switch } from "antd";
import React, { useEffect, useState } from "react";
import { useAdjustmentCanvas } from "../context";
import { DEFAULT_ORG_ADJUSTMENT_TASK_SETTINGS, DISPLAY_FIELD_CONFIG } from "../settings";
import { IndicatorSelectModal } from "./IndicatorSelectModal";

interface CanvasSettingsDrawerProps {
	open: boolean;
	onClose: () => void;
}

const sectionRowClassName = "flex items-center justify-between gap-4 py-3";

function SectionTitle({ title }: { title: string }) {
	return (
		<div className="flex items-center gap-3 py-2">
			<div className="h-px flex-1 bg-[#E6E8EB]" />
			<span className="shrink-0 text-[15px] font-semibold text-[#303133]">{title}</span>
			<div className="h-px flex-1 bg-[#E6E8EB]" />
		</div>
	);
}

export const CanvasSettingsDrawer: React.FC<CanvasSettingsDrawerProps> = ({ open, onClose }) => {
	const { canvasSettings, updateCanvasSettings, updateOrgListFields } = useAdjustmentCanvas();
	const { message } = App.useApp();
	const [draftSettings, setDraftSettings] = useState(canvasSettings);
	const [indicatorModalState, setIndicatorModalState] = useState<{
		open: boolean;
		fieldType: "targetRevenue" | "targetProfit" | null;
	}>({ open: false, fieldType: null });

	useEffect(() => {
		if (open) {
			setDraftSettings(canvasSettings);
		}
	}, [open, canvasSettings]);

	const updateDraftSettings = (patch: Partial<typeof draftSettings>) => {
		setDraftSettings((prev) => ({ ...prev, ...patch }));
	};

	const handleFieldToggle = (key: DisplayFieldSettingKey, checked: boolean) => {
		if (checked && (key === "showTargetRevenue" || key === "showTargetProfit")) {
			const fieldType =
				key === "showTargetRevenue"
					? ("targetRevenue" as const)
					: ("targetProfit" as const);
			setIndicatorModalState({ open: true, fieldType });
			return;
		}
		updateDraftSettings({ [key]: checked });
	};

	const handleIndicatorConfirm = async (info: OrgAdjustmentTaskIndicatorInfo) => {
		const fieldType = indicatorModalState.fieldType;
		if (!fieldType) return;

		const settingKey = fieldType === "targetRevenue" ? "showTargetRevenue" : "showTargetProfit";
		const indicatorKey =
			fieldType === "targetRevenue" ? "targetRevenueIndicator" : "targetProfitIndicator";
		const unitKey = fieldType === "targetRevenue" ? "targetRevenueUnit" : "targetProfitUnit";

		setIndicatorModalState({ open: false, fieldType: null });

		// 查询各节点的目标值并增量更新
		try {
			const response = await fetchTargetPlanListOverVal({
				indicatorId: Number(info.indicatorId),
				targetPlanId: Number(info.indicatorPlanId),
			});
			const items = Array.isArray(response?.data) ? response.data : [];

			// 从返回数据中提取单位
			const unitStr = items.find((item) => item.unitStr)?.unitStr ?? "";

			// 更新 draft 并立即持久化设置（含单位）
			const patch = { [settingKey]: true, [indicatorKey]: info, [unitKey]: unitStr };
			setDraftSettings((prev) => ({ ...prev, ...patch }));
			updateCanvasSettings({ ...draftSettings, ...patch });

			// 增量更新节点目标值
			const updates = new Map<string, Partial<OrgAdjustmentTaskOrgItem>>();
			items.forEach((item) => {
				updates.set(item.targetOrgCode, { [fieldType]: item.annualTargetValue });
			});
			updateOrgListFields(updates);
		} catch {
			message.error("目标值加载失败");
		}
	};

	const handleIndicatorCancel = () => {
		setIndicatorModalState({ open: false, fieldType: null });
	};

	const enabledFieldCount = DISPLAY_FIELD_CONFIG.filter(
		(item) => draftSettings[item.settingKey],
	).length;
	const allFieldsChecked =
		draftSettings.showMoreInfo && enabledFieldCount === DISPLAY_FIELD_CONFIG.length;
	const partiallyChecked =
		draftSettings.showMoreInfo &&
		enabledFieldCount > 0 &&
		enabledFieldCount < DISPLAY_FIELD_CONFIG.length;

	const handleToggleAllFields = (checked: boolean) => {
		const patch = DISPLAY_FIELD_CONFIG.reduce(
			(result, item) => {
				result[item.settingKey] = checked;
				return result;
			},
			{} as Record<DisplayFieldSettingKey, boolean>,
		);

		updateDraftSettings(patch);
	};

	const handleClose = () => {
		if (JSON.stringify(draftSettings) !== JSON.stringify(canvasSettings)) {
			updateCanvasSettings(draftSettings);
		}
		onClose();
	};

	return (
		<>
			<Drawer
				placement="right"
				width={400}
				open={open}
				destroyOnHidden
				styles={{
					header: { padding: "18px 16px 14px", borderBottom: "1px solid #F0F2F5" },
					body: { padding: "16px" },
				}}
				title="调整设置"
				{...commonDrawerProps(handleClose)}
			>
				<div className="flex flex-col gap-4">
					<SectionTitle title="展示字段" />
					<div className={sectionRowClassName}>
						<span className="text-sm text-gray-700">是否启用</span>
						<Switch
							checked={draftSettings.showMoreInfo}
							size="small"
							onChange={(checked) => {
								if (checked) {
									updateDraftSettings({ showMoreInfo: true });
									return;
								}

								updateDraftSettings({
									...DEFAULT_ORG_ADJUSTMENT_TASK_SETTINGS,
									showAdjustmentOnly: draftSettings.showAdjustmentOnly,
									showMoreInfo: false,
								});
							}}
						/>
					</div>
					<div>
						<div className="mb-3">
							<Checkbox
								checked={allFieldsChecked}
								indeterminate={partiallyChecked}
								disabled={!draftSettings.showMoreInfo}
								onChange={(event) => handleToggleAllFields(event.target.checked)}
							>
								<span className="text-sm text-[#303133]">全选</span>
							</Checkbox>
						</div>
						<div className="flex flex-wrap items-start gap-2">
							{DISPLAY_FIELD_CONFIG.map((item) => {
								const disabled = !draftSettings.showMoreInfo;
								const checked = draftSettings[item.settingKey];
								const isIndicatorField =
									item.settingKey === "showTargetRevenue" ||
									item.settingKey === "showTargetProfit";
								const indicatorInfo =
									item.settingKey === "showTargetRevenue"
										? draftSettings.targetRevenueIndicator
										: item.settingKey === "showTargetProfit"
											? draftSettings.targetProfitIndicator
											: null;
								const hasIndicator = indicatorInfo && indicatorInfo.indicatorId;
								const indicatorText = hasIndicator
									? indicatorInfo.indicatorName
									: "请配置";

								return (
									<label
										key={item.settingKey}
										className={`inline-flex items-center rounded-sm border px-2 py-1 text-sm leading-5 transition-colors ${checked ? "border-[#91C3FF] bg-[#F2F8FF] text-[#1677FF]" : "border-[#DCDFE6] bg-white text-[#606266]"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${isIndicatorField ? "w-[108px] flex-wrap" : "w-fit"}`}
									>
										<Checkbox
											checked={checked}
											disabled={disabled}
											onChange={(event) =>
												handleFieldToggle(
													item.settingKey,
													event.target.checked,
												)
											}
										/>
										<span className="ml-2 whitespace-nowrap text-sm leading-5">
											{item.label}
										</span>
										{isIndicatorField && (
											<div
												className={`flex w-full items-center gap-1 pl-[22px] text-xs ${hasIndicator ? "text-[#606266]" : "text-[#909399]"}`}
												onClick={(e) => {
													e.preventDefault();
													if (disabled) return;
													const fieldType =
														item.settingKey === "showTargetRevenue"
															? ("targetRevenue" as const)
															: ("targetProfit" as const);
													setIndicatorModalState({
														open: true,
														fieldType,
													});
												}}
											>
												<span className="truncate">{indicatorText}</span>
												<EditOutlined className="shrink-0 text-[#909399]" />
											</div>
										)}
									</label>
								);
							})}
						</div>
					</div>
				</div>
			</Drawer>
			<IndicatorSelectModal
				open={indicatorModalState.open}
				title={indicatorModalState.fieldType === "targetRevenue" ? "目标营收" : "目标利润"}
				onConfirm={handleIndicatorConfirm}
				onCancel={handleIndicatorCancel}
			/>
		</>
	);
};

export default CanvasSettingsDrawer;
