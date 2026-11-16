import { Form, InputNumber, Modal, Select } from "antd";
import React, { useEffect, useState } from "react";

interface Props {
	open: boolean;
	onClose: () => void;
	onOk: (value: string, rawData?: any) => void;
	initialValue?: string;
	initialData?: {
		formula?: number | string;
		method?: number | string;
		rangeMin?: number;
		rangeMax?: number;
	};
	showAdjustmentRange?: boolean;
	showFormula?: boolean;
}

const FORMULA_OPTIONS = [
	{ label: "(填报值-参考值)/参考值", value: "1" },
	{ label: "填报值-参考值", value: "2" },
	{ label: "填报值", value: "3" },
];

const AdjustmentRangeModal: React.FC<Props> = ({
	open,
	onClose,
	onOk,
	initialValue,
	initialData,
	showAdjustmentRange = true,
	showFormula = true,
}) => {
	const [form] = Form.useForm();
	const [confirmLoading, setConfirmLoading] = useState(false);

	useEffect(() => {
		if (open) {
			form.resetFields();
			if (initialData) {
				form.setFieldsValue({
					formula: String(initialData.formula ?? "3"),
					method: String(initialData.method ?? "3"),
					rangeMin: initialData.rangeMin,
					rangeMax: initialData.rangeMax,
				});
			} else if (initialValue) {
				// Remove \s* after (.*?) to avoid "regexp/no-super-linear-backtracking" lint error
				const regex = /^(.*?)([[(])\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*([\])])$/;
				const match = initialValue.match(regex);
				if (match) {
					const [, formulaLabelRaw, left, min, max, right] = match;
					const formulaLabel = formulaLabelRaw.trim();
					let method = "3";
					if (left === "(" && right === "]") method = "2";
					else if (left === "[" && right === ")") method = "1";
					else if (left === "(" && right === ")") method = "0";

					const formulaOption = FORMULA_OPTIONS.find((opt) => opt.label === formulaLabel);
					const formulaValue = formulaOption ? formulaOption.value : "3";

					form.setFieldsValue({
						formula: formulaValue,
						method,
						rangeMin: Number(min),
						rangeMax: Number(max),
					});
				} else {
					const formulaOption = FORMULA_OPTIONS.find((opt) => opt.label === initialValue);
					if (formulaOption) {
						form.setFieldsValue({
							formula: formulaOption.value,
						});
					}
				}
			}
		}
	}, [open, form, initialValue, initialData]);

	const handleOk = async () => {
		try {
			setConfirmLoading(true);
			const values = await form.validateFields();
			const { formula, method, rangeMin, rangeMax } = values;

			const formulaOption = FORMULA_OPTIONS.find((opt) => opt.value === formula);
			const formulaLabel = formulaOption ? formulaOption.label : "填报值";

			if (showAdjustmentRange) {
				let leftBracket = "[";
				let rightBracket = "]";
				if (method === "2") leftBracket = "(";
				if (method === "1") rightBracket = ")";
				if (method === "0") {
					leftBracket = "(";
					rightBracket = ")";
				}

				const prefix = showFormula ? formulaLabel : "";
				const result = `${prefix}${leftBracket}${rangeMin},${rangeMax}${rightBracket}`;
				onOk(result, {
					adjustmentRangeBoundaryRule: Number(method),
					adjustmentRangeMin: rangeMin,
					adjustmentRangeMax: rangeMax,
					formula: Number(formula),
				});
			} else {
				onOk(formulaLabel, { formula: Number(formula) });
			}
			onClose();
		} catch (e) {
			console.error("Validation failed:", e);
		} finally {
			setConfirmLoading(false);
		}
	};

	return (
		<Modal
			title={`${showFormula ? "偏差" : "调整"}范围配置`}
			open={open}
			onCancel={onClose}
			onOk={handleOk}
			confirmLoading={confirmLoading}
			destroyOnHidden
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ span: 6 }}
				wrapperCol={{ span: 16 }}
				colon={false}
			>
				<Form.Item name="formula" label="计算公式" initialValue="3" hidden={!showFormula}>
					<Select options={FORMULA_OPTIONS} />
				</Form.Item>
				{showAdjustmentRange && (
					<>
						<Form.Item
							name="method"
							label="计算方式"
							rules={[{ required: true, message: "请选择计算方式" }]}
						>
							<Select
								options={[
									{ label: "左右均包含", value: "3" },
									{ label: "左不包含右包含", value: "2" },
									{ label: "左包含右不包含", value: "1" },
									{ label: "左右都不包含", value: "0" },
								]}
							/>
						</Form.Item>
						<Form.Item
							label={showFormula ? "偏差范围" : "调整范围"}
							required
							style={{ marginBottom: 0 }}
						>
							<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
								<Form.Item
									name="rangeMin"
									rules={[{ required: true, message: "请输入" }]}
									style={{ flex: 1 }}
								>
									<InputNumber style={{ width: "100%" }} placeholder="最小值" />
								</Form.Item>
								<span style={{ lineHeight: "32px", marginBottom: "24px" }}>-</span>
								<Form.Item
									name="rangeMax"
									dependencies={["rangeMin"]}
									rules={[
										{ required: true, message: "请输入" },
										({ getFieldValue }) => ({
											validator(_, value) {
												const min = getFieldValue("rangeMin");
												if (
													value !== undefined &&
													value !== null &&
													min !== undefined &&
													min !== null &&
													value < min
												) {
													return Promise.reject(
														new Error("最大值不能小于最小值"),
													);
												}
												return Promise.resolve();
											},
										}),
									]}
									style={{ flex: 1 }}
								>
									<InputNumber style={{ width: "100%" }} placeholder="最大值" />
								</Form.Item>
							</div>
						</Form.Item>
					</>
				)}
			</Form>
		</Modal>
	);
};

export default AdjustmentRangeModal;
