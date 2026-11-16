import type { ReferenceBasicDetailRes } from "#src/api/strategy";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	addBasicIndicatorImport,
	addReferenceIndicator,
	deleteBasicIndicatorImport,
	deleteReferenceIndicatorSamePeriodValueImport,
	fetchBasicIndicatorImportPage,
	fetchIndicatorConfReferenceBasic,
	fetchIndicatorConfReferenceBasicIndicatorList,
	submitBasicIndicatorImport,
	updateBasicIndicatorImport,
	updateIndicatorConfReferenceBasic,
	updateIndicatorConfReferenceBasicIndicatorListAdjustmentRange,
	updateIndicatorConfReferenceBasicIndicatorListOther,
} from "#src/api/strategy";
import {
	addReferenceConfDetailIndicator,
	delReferenceConfDetailIndicator,
	pageRetrieveBasicIndicatorSelected,
	referenceConfDetailIndicatorList,
} from "#src/api/strategy/indicator-config/index.js";
import { fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsPage } from "#src/api/strategy/target-plan/index.js";
import { SectionTitle } from "#src/components/index.js";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Drawer, Form, Input, message, Modal, Radio, Select, Table, Tag } from "antd";
import React, { useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import { UNIT_OPTIONS_ALL } from "../../target-management/constants/indicator";
import AddIndicatorDrawer from "./AddIndicatorDrawer";
import AdjustmentRangeModal from "./AdjustmentRangeModal";
import { IndicatorContext } from "./IndicatorConfigDrawer";
import SourceConfigDrawer from "./SourceConfigDrawer";

interface Props {
	open: boolean;
	indicatorName?: string;
	effTaskIndicatorConfDetailsId?: string | number;
	// current row data from parent (optional) so we can show 拆解对象
	row?: any;
	onClose: (res?: { saved?: boolean; value?: any }) => void;
}

interface FormulaItem {
	uid: string;
	type: "indicator" | "operator" | "number";
	value: string | number;
	label: string;
}

function SortableTag({
	id,
	label,
	type,
	disabled,
}: {
	id: string;
	label: string;
	type: "indicator" | "operator" | "number";
	disabled?: boolean;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		disabled,
	});

	const transformStyle = transform ? { ...transform, scaleX: 1, scaleY: 1 } : null;
	const style: React.CSSProperties = {
		transform: transformStyle ? CSS.Transform.toString(transformStyle) : undefined,
		transition,
		cursor: disabled ? "default" : "move",
		opacity: isDragging ? 0 : 1,
		visibility: isDragging ? "hidden" : "visible",
		display: "inline-flex",
		alignItems: "center",
		lineHeight: "1",
		transformOrigin: "center",
	};

	if (type === "operator") {
		return (
			<div ref={setNodeRef} style={style} {...attributes} {...listeners} className="m-1">
				<span className="px-1 text-lg font-bold">{label}</span>
			</div>
		);
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className="m-1">
			<Tag
				style={{
					backgroundColor: "rgba(235, 238, 245, 1)",
					border: "none",
					fontSize: 14,
					padding: "4px 8px",
				}}
			>
				{label}
			</Tag>
		</div>
	);
}

function DroppableDeleteArea() {
	const { setNodeRef, isOver } = useDroppable({
		id: "delete-area",
	});

	return (
		<div
			ref={setNodeRef}
			className={`mt-2 flex h-12 items-center justify-center rounded border-2 border-dashed transition-colors ${
				isOver ? "border-red-500 bg-red-50 text-red-500" : "border-gray-300 text-gray-400"
			}`}
		>
			<DeleteOutlined className="mr-2" />
			拖拽至此处删除
		</div>
	);
}

export default function BasicIndicatorDrawer({
	open,
	indicatorName,
	effTaskIndicatorConfDetailsId,
	row,
	onClose,
}: Props) {
	const [form] = Form.useForm();
	const { indicatorConfigInfo, selectedIndicator } = React.useContext(IndicatorContext);
	const isEffective = row?.statusStr === "已生效";
	const canUseFloatMode = Boolean(row?.dataSourceCodeStr) && !isEffective;
	const targetMethod = Form.useWatch("targetMethod", form);
	const isFloatMode = targetMethod === 2;
	const unitOptions = UNIT_OPTIONS_ALL;
	const prevTargetMethodRef = React.useRef<number | undefined>(undefined);
	const formulaCacheRef = React.useRef<Record<number, FormulaItem[]>>({});
	const formulaItemsRef = React.useRef<FormulaItem[]>([]);
	const samePeriodLabel = `${indicatorName ?? ""}同期值`;
	const [addIndicatorOpen, setAddIndicatorOpen] = React.useState(false);
	const [addConfigIndicatorOpen, setAddConfigIndicatorOpen] = React.useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [adjustmentModalOpen, setAdjustmentModalOpen] = React.useState(false);
	const [sourceConfigDrawerOpen, setSourceConfigDrawerOpen] = React.useState(false);
	const [editingFieldIndex, setEditingFieldIndex] = React.useState<number | null>(null);
	const [formulaItems, setFormulaItems] = React.useState<FormulaItem[]>([]);
	const [activeId, setActiveId] = React.useState<string | null>(null);
	const [floatingRatioRow, setFloatingRatioRow] = React.useState<any | null>(null);
	const [numberInput, setNumberInput] = React.useState<string>("");
	const [delIds] = React.useState<string[]>([]);
	const [configIndicators, setConfigIndicators] = React.useState<any[]>([]);
	const basicIndicators = Form.useWatch("basicIndicators", form) || [];

	const floatIndicatorRow = React.useMemo(
		() => ({
			id: "floatValue",
			indicatorCode: "floatValue",
			indicatorName: "浮动比例",
			unitName: "%",
			unit: 99,
			dataSourceType: 0,
			dataSourceDesc: "10",
			supportAdjustment: 1,
			deviationRange: "[0,10]",
		}),
		[],
	);

	const mapFloatingRatioRow = React.useCallback(
		(source: any) => {
			if (!source) return null;
			const range = source.innerAdjustmentRange || {};
			let leftBracket = "[";
			let rightBracket = "]";
			if (range.adjustmentRangeBoundaryRule === 2) leftBracket = "(";
			if (range.adjustmentRangeBoundaryRule === 1) rightBracket = ")";
			if (range.adjustmentRangeBoundaryRule === 0) {
				leftBracket = "(";
				rightBracket = ")";
			}
			const rangeMin = range.adjustmentRangeMin ?? 0;
			const rangeMax = range.adjustmentRangeMax ?? 0;
			return {
				id: "floatValue",
				indicatorCode: "floatValue",
				indicatorName: source.basicIndicatorName ?? "浮动比例",
				unit: source.unit ?? (row?.dataType === 1 ? 99 : 0),
				unitName: source.unitName ?? (row?.dataType === 1 ? "%" : "元"),
				dataSourceType: 0,
				dataSourceDesc:
					source.value !== undefined && source.value !== null ? String(source.value) : "",
				supportAdjustment: source.supportAdjustment ?? 0,
				deviationRange: `${leftBracket}${rangeMin},${rangeMax}${rightBracket}`,
			};
		},
		[row?.dataType],
	);

	const parseDeviationRange = React.useCallback((value?: string) => {
		if (!value)
			return { adjustmentRangeBoundaryRule: 3, adjustmentRangeMin: 0, adjustmentRangeMax: 0 };
		const match = value.match(/([[(])\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*([\])])/);
		if (!match) {
			return { adjustmentRangeBoundaryRule: 3, adjustmentRangeMin: 0, adjustmentRangeMax: 0 };
		}
		const [, left, min, max, right] = match;
		let adjustmentRangeBoundaryRule = 3;
		if (left === "(" && right === "]") adjustmentRangeBoundaryRule = 2;
		else if (left === "[" && right === ")") adjustmentRangeBoundaryRule = 1;
		else if (left === "(" && right === ")") adjustmentRangeBoundaryRule = 0;
		return {
			adjustmentRangeBoundaryRule,
			adjustmentRangeMin: Number(min),
			adjustmentRangeMax: Number(max),
		};
	}, []);

	const buildFloatingRatioReferenceValue = React.useCallback(() => {
		const list = form.getFieldValue("basicIndicators") || [];
		const rowData = list[0] || floatingRatioRow || floatIndicatorRow;
		const innerAdjustmentRange = parseDeviationRange(rowData?.deviationRange);
		const valueNum = Number.parseFloat(rowData?.dataSourceDesc);
		return {
			basicIndicatorName: rowData?.indicatorName ?? "浮动比例",
			unit: rowData?.unit,
			unitName: rowData?.unitName ?? (row?.dataType === 1 ? "%" : "元"),
			value: Number.isNaN(valueNum) ? undefined : valueNum,
			supportAdjustment: rowData?.supportAdjustment ?? 0,
			innerAdjustmentRange,
		};
	}, [form, floatingRatioRow, floatIndicatorRow, parseDeviationRange, row?.dataType]);

	const floatReferenceIndicators = React.useMemo(
		() => [
			{ id: "floatValue", indicatorCode: "floatValue", indicatorName: "浮动比例" },
			{
				id: "samePeriodValue",
				indicatorCode: "samePeriodValue",
				indicatorName: samePeriodLabel,
			},
		],
		[samePeriodLabel],
	);

	const referenceIndicators = React.useMemo(() => {
		return isFloatMode ? floatReferenceIndicators : basicIndicators;
	}, [isFloatMode, floatReferenceIndicators, basicIndicators]);

	// 判断是否使用了配置指标
	const hasConfigIndicatorInFormula = React.useMemo(() => {
		return formulaItems.some(
			(item) => item.type === "indicator" && String(item.value).startsWith("#"),
		);
	}, [formulaItems]);

	// 当目标方式为按基础指标计算且使用了配置指标时，需要锁定填报值
	const shouldLockFillMethod = targetMethod === 1 && hasConfigIndicatorInFormula;

	const toFormulaItems = React.useCallback(
		(
			referenceValue: string,
			indicatorsList: any[],
			configIndicatorsList: any[] = [],
		): FormulaItem[] => {
			const regex = /(\$-?\d+(?:\.\d+)?|#\d+|>=|<=|!=|[+\-*/()><=])/g;
			const tokens = referenceValue.split(regex).filter((t: string) => t && t.trim() !== "");
			return tokens.map((token: string) => {
				const isOperator = /^(?:>=|<=|!=|[+\-*/()><=])$/.test(token);
				if (isOperator) {
					let label = token;
					if (token === "*") label = "×";
					if (token === "/") label = "÷";
					return {
						uid: `${Date.now()}-${Math.random()}`,
						type: "operator",
						value: token,
						label,
					};
				}
				if (/^\$-?\d+(?:\.\d+)?$/.test(token)) {
					const numberValue = token.slice(1);
					return {
						uid: `${Date.now()}-${Math.random()}`,
						type: "number",
						value: numberValue,
						label: numberValue,
					};
				}
				if (token === "floatValue") {
					return {
						uid: `${Date.now()}-${Math.random()}`,
						type: "indicator",
						value: token,
						label: "浮动比例",
					};
				}
				if (token === "samePeriodValue") {
					return {
						uid: `${Date.now()}-${Math.random()}`,
						type: "indicator",
						value: token,
						label: samePeriodLabel,
					};
				}
				// 处理配置指标（以 # 开头）
				if (/^#\d+$/.test(token) && configIndicatorsList) {
					const configId = token.slice(1);
					const configIndicator = configIndicatorsList.find(
						(i: any) => String(i.id) === String(configId),
					);
					return {
						uid: `${Date.now()}-${Math.random()}`,
						type: "indicator",
						value: token,
						label: configIndicator ? configIndicator.indicatorName : token,
					};
				}
				// 处理基础指标
				const indicator = indicatorsList.find((i: any) => String(i.id) === String(token));
				return {
					uid: `${Date.now()}-${Math.random()}`,
					type: "indicator",
					value: token,
					label: indicator ? indicator.indicatorName : token,
				};
			});
		},
		[samePeriodLabel],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const loadBasicIndicators = React.useCallback(async () => {
		if (!row?.id) return;
		const res = await fetchIndicatorConfReferenceBasicIndicatorList(row.id);
		const list = Array.isArray(res) ? res : [];
		form.setFieldValue("basicIndicators", list);
	}, [row?.id, form, delIds]);

	const loadReferenceBasicDetail = React.useCallback(async () => {
		if (!row?.id) return;
		try {
			// 1. Load basic indicators for formula parsing
			const basicIndicatorsRes = await fetchIndicatorConfReferenceBasicIndicatorList(row.id);
			const basicIndicatorsList = Array.isArray(basicIndicatorsRes) ? basicIndicatorsRes : [];
			form.setFieldValue("basicIndicators", basicIndicatorsList);

			// 2. Load config indicators for config indicators table
			const configIndicatorsRes = await referenceConfDetailIndicatorList(row.id);
			const configIndicatorsList = configIndicatorsRes.data ?? [];
			setConfigIndicators(configIndicatorsList);

			// 3. Load details
			const res: ReferenceBasicDetailRes = await fetchIndicatorConfReferenceBasic(row.id);
			if (res) {
				form.setFieldsValue({
					targetMethod: res.targetMethod ?? 1,
					fillMethod: res.fillMethod ?? 1,
					allowModifyFillValue: res.allowModifyFillValue ?? 1,
				});

				if (res.referenceValue) {
					const indicatorLookup =
						res.targetMethod === 2 ? floatReferenceIndicators : basicIndicatorsList;
					const parsedFormula = toFormulaItems(
						res.referenceValue,
						indicatorLookup,
						configIndicatorsList,
					);
					setFormulaItems(parsedFormula);
					formulaCacheRef.current[res.targetMethod ?? 1] = parsedFormula;
				} else {
					setFormulaItems([]);
				}
			}
			if (res?.floatingRatioReferenceValue) {
				setFloatingRatioRow(mapFloatingRatioRow(res.floatingRatioReferenceValue));
			}
			if (res?.targetMethod === 2) {
				form.setFieldValue("basicIndicators", [
					mapFloatingRatioRow(res?.floatingRatioReferenceValue) || floatIndicatorRow,
				]);
			}
		} catch (e) {
			console.error(e);
		}
	}, [row?.id, form, floatReferenceIndicators, floatIndicatorRow, mapFloatingRatioRow]);

	React.useEffect(() => {
		formulaItemsRef.current = formulaItems;
	}, [formulaItems]);

	React.useEffect(() => {
		if (open && row?.id) {
			loadReferenceBasicDetail();
		} else if (open) {
			form.setFieldsValue({
				targetMethod: row?.targetMethod ?? 1,
				fillMethod: row?.fillMethod ?? 1,
				allowModifyFillValue: row?.allowModifyFillValue ?? 1,
			});
			form.setFieldValue("basicIndicators", []);
			setFormulaItems([]);
			setConfigIndicators([]);
		}
	}, [open, row, form, loadReferenceBasicDetail]);

	React.useEffect(() => {
		if (!open) return;
		const prevMethod = prevTargetMethodRef.current;
		if (prevMethod && prevMethod !== targetMethod) {
			formulaCacheRef.current[prevMethod] = formulaItemsRef.current;
		}
		if (targetMethod === 2) {
			form.setFieldValue("basicIndicators", [floatingRatioRow || floatIndicatorRow]);
		} else if (row?.id) {
			loadBasicIndicators();
		}
		if (targetMethod) {
			setFormulaItems(formulaCacheRef.current[targetMethod] || []);
		}
		prevTargetMethodRef.current = targetMethod;
	}, [
		targetMethod,
		open,
		row?.id,
		form,
		floatIndicatorRow,
		floatingRatioRow,
		loadBasicIndicators,
	]);

	// 当目标方式为按基础指标计算且使用了配置指标时，自动锁定填报值
	React.useEffect(() => {
		if (shouldLockFillMethod) {
			form.setFieldsValue({
				fillMethod: 1, // 固定为自动带出参考值
				allowModifyFillValue: 0, // 固定为否
			});
		}
	}, [shouldLockFillMethod, form]);

	const save = async () => {
		try {
			setConfirmLoading(true);
			const values = await form.validateFields();
			if (row?.id) {
				// Construct referenceValue string from formulaItems
				// Replace indicator tags with their IDs (value), keep operators as is
				const referenceValue = formulaItems
					.map((item) => {
						if (item.type === "number") return `$${item.value}`;
						return String(item.value);
					})
					.join("");

				const payload: any = {
					id: row.id,
					targetMethod: values.targetMethod,
					referenceValue,
					fillMethod: values.fillMethod,
					allowModifyFillValue: values.allowModifyFillValue,
				};
				if (values.targetMethod === 2) {
					payload.floatingRatioReferenceValue = buildFloatingRatioReferenceValue();
				}
				const res: any = await updateIndicatorConfReferenceBasic(payload);
				if (res && res.code === 200) {
					onClose?.({ saved: true });
				} else {
					message.error(res?.msg || "保存失败");
				}
			}
		} catch (e) {
			console.error("Validation failed", e);
		} finally {
			setConfirmLoading(false);
		}
	};

	const handleDragStart = (event: any) => {
		setActiveId(event.active.id);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		if (!over) return;

		if (over.id === "delete-area") {
			setFormulaItems((items) => items.filter((item) => item.uid !== active.id));
			return;
		}

		if (active.id !== over.id) {
			setFormulaItems((items) => {
				const oldIndex = items.findIndex((item) => item.uid === active.id);
				const newIndex = items.findIndex((item) => item.uid === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	const addToFormula = (item: Omit<FormulaItem, "uid">) => {
		setFormulaItems([...formulaItems, { ...item, uid: `${Date.now()}-${Math.random()}` }]);
	};

	const handleAddNumber = () => {
		const raw = numberInput.trim();
		if (!raw) return;
		if (!/^-?\d+(?:\.\d+)?$/.test(raw)) {
			message.error("请输入有效数字");
			return;
		}
		addToFormula({ type: "number", value: raw, label: raw });
		setNumberInput("");
	};

	const handleDelete = async (index: number) => {
		const list = form.getFieldValue("basicIndicators") || [];
		const item = list[index];
		if (item?.id) {
			Modal.confirm({
				title: "确认删除该指标吗？",
				onOk: async () => {
					try {
						const res: any = await deleteBasicIndicatorImport(item.id);
						if (res && res.code === 200) {
							message.success("删除成功");
							loadBasicIndicators();
						} else {
							message.error(res?.msg || "删除失败");
						}
					} catch (e) {
						console.error(e);
						message.error("删除失败");
					}
				},
			});
		} else {
			const newList = [...list];
			newList.splice(index, 1);
			form.setFieldValue("basicIndicators", newList);
		}
	};

	const handleConfigIndicatorSubmit = async (_keys: React.Key[], rows: any[]) => {
		if (!row?.id) return false;
		try {
			const confDetailIds = rows.map((item) => item.id || item.key || item.indicatorId);
			const resp = await addReferenceConfDetailIndicator({
				effTaskIndicatorConfDetailsReferenceId: row.id,
				confDetailIds: confDetailIds as unknown as Record<string, unknown>[],
			});
			if (resp && resp.code === 200) {
				message.success("添加成功");
				await loadReferenceBasicDetail();
				return true;
			}
			message.error(resp?.msg || "添加失败");
			return false;
		} catch (e) {
			console.error(e);
			message.error("添加失败");
			return false;
		}
	};

	const handleDeleteConfigIndicator = (record: any) => {
		Modal.confirm({
			title: "确认删除该指标吗？",
			onOk: async () => {
				try {
					// 乐观更新：先更新 UI
					const newConfigIndicators = configIndicators.filter(
						(item) => item.id !== record.id,
					);
					setConfigIndicators(newConfigIndicators);

					// 发送删除请求
					const resp = await delReferenceConfDetailIndicator(record.id);
					if (resp && resp.code === 200) {
						message.success("删除成功");
					} else {
						// 删除失败，回滚数据
						setConfigIndicators(configIndicators);
						message.error(resp?.msg || "删除失败");
					}
				} catch (e) {
					// 删除失败，回滚数据
					setConfigIndicators(configIndicators);
					console.error(e);
					message.error("删除失败");
				}
			},
		});
	};

	const onSourceClosed = async (res: any) => {
		setSourceConfigDrawerOpen(false);
		if (res?.saved && editingFieldIndex !== null) {
			const list = form.getFieldValue("basicIndicators") || [];
			const item = list[editingFieldIndex];
			if (item && item.id) {
				try {
					const payload: any = {
						id: item.id,
						dataSourceType: res.value.dataSourceCode,
					};
					if (res.value.dataSourceCode === 1) {
						payload.taskTableName = res.value.taskTableName;
						payload.mappings = res.value.mappings;
					}
					// const apiRes: any = await updateIndicatorConfReferenceBasicIndicatorListImport(payload);
					// if (apiRes && apiRes.code === 200) {
					loadBasicIndicators();
					// }
					// else {
					// 	message.error(apiRes?.msg || "配置失败");
					// }
				} catch (e) {
					console.error(e);
					message.error("配置失败");
				}
			}
		}
	};

	return (
		<Drawer
			title="目标配置"
			placement="right"
			width={1000}
			destroyOnHidden
			open={open}
			{...commonDrawerProps(onClose)}
			footer={
				<div className="flex justify-end gap-2">
					<Button onClick={() => onClose?.({})}>取消</Button>
					<Button type="primary" loading={confirmLoading} onClick={save}>
						确定
					</Button>
				</div>
			}
		>
			<Form
				form={form}
				layout="horizontal"
				labelCol={{ flex: "120px" }}
				colon={false}
				labelAlign="right"
			>
				<div className="mb-4">
					<SectionTitle title="基础信息" />
					<div className="flex flex-col gap-3 pl-4 pt-2">
						<Form.Item label="指标名称" style={{ marginBottom: 0 }}>
							<Input value={indicatorName ?? "-"} disabled />
						</Form.Item>

						<Form.Item label="拆解对象" style={{ marginBottom: 0 }}>
							<Input value={row?.targetOrgDesc ?? "-"} disabled />
						</Form.Item>

						<Form.Item
							label="目标方式"
							name="targetMethod"
							rules={[{ required: true, message: "请选择目标方式" }]}
							style={{ marginBottom: 0 }}
						>
							<Radio.Group disabled={isEffective}>
								<Radio value={1}>按基础指标计算提供参考值</Radio>
								<Radio value={2} disabled={!canUseFloatMode}>
									按同期值浮动比例提供参考值
								</Radio>
							</Radio.Group>
						</Form.Item>
					</div>
				</div>

				<div className="mb-4">
					<div className="mb-2 flex items-center justify-between">
						<SectionTitle title="基础指标" />
						{!isEffective && !isFloatMode && (
							<Button
								type="primary"
								onClick={() => {
									setAddIndicatorOpen(true);
								}}
							>
								新增
							</Button>
						)}
					</div>
					<Form.List name="basicIndicators">
						{(fields) => (
							<Table
								dataSource={fields}
								pagination={false}
								size="small"
								bordered
								rowKey="key"
								columns={[
									{
										title: "基础指标",
										dataIndex: "indicatorName",
										width: 160,
										render: (_, field) => (
											<Form.Item
												name={[field.name, "indicatorName"]}
												fieldKey={field.fieldKey}
												style={{ marginBottom: 0 }}
											>
												<Input disabled />
											</Form.Item>
										),
									},
									{
										title: "单位",
										dataIndex: "unitName",
										width: 80,
										render: (_, field) => (
											<Form.Item
												name={[field.name, "unitName"]}
												fieldKey={field.fieldKey}
												style={{ marginBottom: 0 }}
											>
												{(() => {
													const item = form.getFieldValue([
														"basicIndicators",
														field.name,
													]);
													const isFloatRow =
														item?.indicatorCode === "floatValue" ||
														item?.indicatorName === "浮动比例" ||
														item?.id === "floatValue";
													if (!isFloatMode || !isFloatRow) {
														return <Input disabled />;
													}
													return (
														<Select
															disabled={isEffective}
															options={unitOptions}
															value={item?.unit}
															onChange={(val) => {
																const list =
																	form.getFieldValue(
																		"basicIndicators",
																	) || [];
																const newList = [...list];
																const option = unitOptions.find(
																	(opt) => opt.value === val,
																);
																if (newList[field.name]) {
																	newList[field.name].unit = val;
																	newList[field.name].unitName =
																		option?.label ?? "";
																	form.setFieldValue(
																		"basicIndicators",
																		newList,
																	);
																	setFloatingRatioRow(
																		newList[field.name],
																	);
																}
															}}
														/>
													);
												})()}
											</Form.Item>
										),
									},
									// 数据来源列 - 在浮动模式下隐藏
									...(!isFloatMode
										? [
												{
													title: (
														<span>
															<span
																style={{
																	color: "#ff4d4f",
																	marginRight: 4,
																}}
															>
																*
															</span>
															数据来源
														</span>
													),
													dataIndex: "dataSourceType",
													width: 120,
													render: (_: any, field: any) => (
														<Form.Item
															name={[field.name, "dataSourceType"]}
															fieldKey={field.fieldKey}
															rules={[
																{
																	required: true,
																	message: "请选择",
																},
															]}
															style={{ marginBottom: 0 }}
															getValueProps={(value) => ({
																value:
																	value === 1
																		? "数据资产"
																		: value === 0
																			? "手工录入"
																			: "",
															})}
														>
															{(() => {
																const item = form.getFieldValue([
																	"basicIndicators",
																	field.name,
																]);
																const isFloatRow =
																	item?.indicatorCode ===
																		"floatValue" ||
																	item?.indicatorName ===
																		"浮动比例" ||
																	item?.id === "floatValue";
																return (
																	<Input
																		readOnly
																		disabled={isFloatRow}
																		suffix={
																			!isFloatRow ? (
																				<EditOutlined
																					style={{
																						color: "rgba(0,0,0,0.45)",
																					}}
																				/>
																			) : undefined
																		}
																		placeholder={
																			isFloatRow
																				? undefined
																				: "点击配置"
																		}
																		onClick={() => {
																			if (isFloatRow) return;
																			setEditingFieldIndex(
																				field.name,
																			);
																			setSourceConfigDrawerOpen(
																				true,
																			);
																		}}
																	/>
																);
															})()}
														</Form.Item>
													),
												},
											]
										: []),
									{
										title: (
											<span>
												<span style={{ color: "#ff4d4f", marginRight: 4 }}>
													*
												</span>
												默认值
											</span>
										),
										dataIndex: "dataSourceDesc",
										width: 120,
										render: (_, field) => (
											<Form.Item
												name={[field.name, "dataSourceDesc"]}
												fieldKey={field.fieldKey}
												rules={[{ required: true, message: "请输入" }]}
												style={{ marginBottom: 0 }}
											>
												{(() => {
													const item = form.getFieldValue([
														"basicIndicators",
														field.name,
													]);
													const isFloatRow =
														item?.indicatorCode === "floatValue" ||
														item?.indicatorName === "浮动比例" ||
														item?.id === "floatValue";
													// 浮动模式下允许修改
													if (isFloatMode && isFloatRow) {
														return (
															<Input
																disabled={isEffective}
																onChange={(e) => {
																	const list =
																		form.getFieldValue(
																			"basicIndicators",
																		) || [];
																	const newList = [...list];
																	if (newList[field.name]) {
																		newList[
																			field.name
																		].dataSourceDesc =
																			e.target.value;
																		form.setFieldValue(
																			"basicIndicators",
																			newList,
																		);
																		setFloatingRatioRow(
																			newList[field.name],
																		);
																	}
																}}
															/>
														);
													}
													return <Input disabled />;
												})()}
											</Form.Item>
										),
									},
									{
										title: (
											<span>
												<span style={{ color: "#ff4d4f", marginRight: 4 }}>
													*
												</span>
												是否支持调整
											</span>
										),
										dataIndex: "supportAdjustment",
										render: (_, field) => (
											<Form.Item
												name={[field.name, "supportAdjustment"]}
												fieldKey={field.fieldKey}
												rules={[{ required: true, message: "请选择" }]}
												style={{ marginBottom: 0 }}
											>
												<Select
													disabled={isEffective}
													options={[
														{ label: "是", value: 1 },
														{ label: "否", value: 0 },
													]}
													onChange={async (val) => {
														const list =
															form.getFieldValue("basicIndicators") ||
															[];
														const item = list[field.name];
														if (isFloatMode) {
															setFloatingRatioRow(list[field.name]);
															return;
														}
														if (item && item.id) {
															try {
																const res: any =
																	await updateIndicatorConfReferenceBasicIndicatorListOther(
																		{
																			id: item.id,
																			supportAdjustment: val,
																		},
																	);
																if (res && res.code === 200) {
																	loadBasicIndicators();
																} else {
																	message.error(
																		res?.msg || "更新失败",
																	);
																}
															} catch (e) {
																console.error(e);
																message.error("更新失败");
															}
														}
													}}
												/>
											</Form.Item>
										),
									},
									{
										title: "调整范围",
										dataIndex: "deviationRange",
										width: 160,
										render: (_, field) => (
											<Form.Item
												shouldUpdate={(prev, curr) => {
													return (
														prev.basicIndicators?.[field.name]
															?.supportAdjustment !==
														curr.basicIndicators?.[field.name]
															?.supportAdjustment
													);
												}}
												noStyle
											>
												{({ getFieldValue }) => {
													const supportAdjustment = getFieldValue([
														"basicIndicators",
														field.name,
														"supportAdjustment",
													]);
													const disabled =
														supportAdjustment === 0 || isEffective;
													return (
														<Form.Item
															name={[field.name, "deviationRange"]}
															fieldKey={field.fieldKey}
															style={{ marginBottom: 0 }}
														>
															<Input
																disabled={disabled}
																readOnly
																suffix={
																	!disabled && (
																		<EditOutlined
																			style={{
																				color: "rgba(0,0,0,0.45)",
																			}}
																		/>
																	)
																}
																onClick={() => {
																	if (!disabled) {
																		setEditingFieldIndex(
																			field.name,
																		);
																		setAdjustmentModalOpen(
																			true,
																		);
																	}
																}}
															/>
														</Form.Item>
													);
												}}
											</Form.Item>
										),
									},
									{
										title: "操作",
										key: "op",
										render: (_, field) => {
											if (isEffective || isFloatMode) return null;
											return (
												<a onClick={() => handleDelete(field.name)}>删除</a>
											);
										},
									},
								]}
							/>
						)}
					</Form.List>
				</div>

				<div className="mb-4">
					<div className="mb-2 flex items-center justify-between">
						<SectionTitle title="配置指标" />
						{!isEffective && (
							<Button
								type="primary"
								onClick={() => {
									setAddConfigIndicatorOpen(true);
								}}
							>
								新增
							</Button>
						)}
					</div>
					<Table
						dataSource={configIndicators}
						pagination={false}
						size="small"
						bordered
						rowKey={(r) => String(r.id)}
						columns={[
							{
								title: "指标名称",
								dataIndex: "indicatorName",
								render: (val: any) => <Input value={val} disabled />,
							},
							{
								title: "单位",
								dataIndex: "unitName",
								width: 80,
								render: (val: any) => <Input value={val} disabled />,
							},
							{
								title: "操作",
								key: "op",
								width: 80,
								render: (_: any, record: any) => {
									if (isEffective) return null;
									return (
										<a onClick={() => handleDeleteConfigIndicator(record)}>
											删除
										</a>
									);
								},
							},
						]}
					/>
				</div>

				<div className="mb-4">
					<SectionTitle title="参考值" />
					<div className="flex h-[350px] gap-4 py-4">
						{/* Left: Basic Indicators and Config Indicators */}
						<div className="flex flex-1 flex-col overflow-hidden rounded border border-gray-300">
							{/* 基础指标部分 */}
							<div className="flex flex-1 flex-col overflow-hidden border-b border-gray-300">
								<div className="border-b border-gray-300 bg-gray-100 p-2 font-bold">
									基础指标
								</div>
								<div className="flex-1 overflow-y-auto p-2">
									{referenceIndicators.map((ind: any) => (
										<div
											key={ind.id || ind.key}
											onClick={() => {
												if (isEffective) return;
												const formulaValue = isFloatMode
													? ind.indicatorCode || ind.id
													: ind.id;
												addToFormula({
													type: "indicator",
													value: formulaValue,
													label: ind.indicatorName,
												});
											}}
											className={`cursor-pointer border-b border-gray-100 p-2 text-sm transition-colors last:border-0 hover:bg-[#1677ff] hover:text-white ${isEffective ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
										>
											{ind.indicatorName}
										</div>
									))}
									{referenceIndicators.length === 0 && (
										<div className="mt-4 text-center text-gray-400">
											暂无指标
										</div>
									)}
								</div>
							</div>

							{/* 配置指标部分 */}
							<div className="flex flex-1 flex-col overflow-hidden">
								<div className="border-b border-gray-300 bg-gray-100 p-2 font-bold">
									配置指标
								</div>
								<div className="flex-1 overflow-y-auto p-2">
									{configIndicators.map((ind: any) => (
										<div
											key={ind.id}
											onClick={() => {
												if (isEffective) return;
												addToFormula({
													type: "indicator",
													value: `#${ind.id}`,
													label: ind.indicatorName,
												});
											}}
											className={`cursor-pointer border-b border-gray-100 p-2 text-sm transition-colors last:border-0 hover:bg-[#1677ff] hover:text-white ${isEffective ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
										>
											{ind.indicatorName}
										</div>
									))}
									{configIndicators.length === 0 && (
										<div className="mt-4 text-center text-gray-400">
											暂无指标
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Middle: Operators */}
						<div className="flex flex-1 flex-col overflow-hidden rounded border border-gray-300">
							<div className="border-b border-gray-300 bg-gray-100 p-2 font-bold">
								运算与函数
							</div>
							<div className="flex-1 overflow-y-auto p-2">
								{[
									{
										title: "算术运算",
										ops: [
											{ label: "+", value: "+" },
											{ label: "-", value: "-" },
											{ label: "×", value: "*" },
											{ label: "÷", value: "/" },
										],
									},
									{
										title: "比较运算",
										ops: [">", "<", ">=", "<=", "=", "!="].map((op) => ({
											label: op,
											value: op,
										})),
									},
									{
										title: "分组符号",
										ops: ["(", ")"].map((op) => ({ label: op, value: op })),
									},
								].map((group) => (
									<div key={group.title} className="mb-3">
										<div className="mb-2 text-sm font-bold">{group.title}</div>
										<div className="flex flex-wrap gap-2">
											{group.ops.map((op) => (
												<div
													key={op.value}
													onClick={() =>
														!isEffective &&
														addToFormula({
															type: "operator",
															value: op.value,
															label: op.label,
														})
													}
													className={`m-0 flex cursor-pointer items-center justify-center text-base transition-colors ${isEffective ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
													style={{
														width: 34,
														height: 30,
														backgroundColor: "rgba(242, 246, 252, 1)",
														boxShadow:
															"0.5px 0.5px 1px 0px rgba(0, 0, 0, 0.12), 0px 0px 4px 0px rgba(0, 0, 0, 0.1), inset 0.8px 0.8px 0.5px 0px rgba(255, 255, 255, 1), inset -0.8px -0.8px 0.8px 0px rgba(105, 150, 255, 0.1)",
														borderRadius: 4,
													}}
													onMouseEnter={(e) =>
														!isEffective &&
														(e.currentTarget.style.backgroundColor =
															"rgba(228, 231, 237, 1)")
													}
													onMouseLeave={(e) =>
														!isEffective &&
														(e.currentTarget.style.backgroundColor =
															"rgba(242, 246, 252, 1)")
													}
												>
													{op.label}
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Right: Formula */}
						<div className="flex flex-[2] flex-col overflow-hidden rounded border border-gray-300">
							<div className="flex items-center justify-between border-b border-gray-300 bg-gray-100 p-2 font-bold">
								<span>参考值</span>
								<div className="flex items-center gap-2">
									<Input
										value={numberInput}
										onChange={(e) => setNumberInput(e.target.value)}
										onPressEnter={handleAddNumber}
										disabled={isEffective}
										size="small"
										placeholder="添加数字值"
										style={{ width: 120 }}
									/>
									<Button
										size="small"
										type="link"
										onClick={handleAddNumber}
										disabled={isEffective}
									>
										添加
									</Button>
									{!isEffective && (
										<Button
											size="small"
											type="link"
											onClick={() => setFormulaItems([])}
										>
											清空
										</Button>
									)}
									{!isEffective && (
										<Button
											size="small"
											type="link"
											onClick={() => setFormulaItems([])}
										>
											重置
										</Button>
									)}
								</div>
							</div>
							<div className="flex flex-1 flex-col overflow-y-auto bg-white p-2">
								<DndContext
									sensors={sensors}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
								>
									<div className="flex-1">
										<SortableContext
											items={formulaItems.map((i) => i.uid)}
											strategy={rectSortingStrategy}
										>
											<div className="flex flex-wrap items-center gap-1">
												{formulaItems.map((item) => (
													<SortableTag
														key={item.uid}
														id={item.uid}
														label={item.label}
														type={item.type}
														disabled={isEffective}
													/>
												))}
											</div>
										</SortableContext>
										{formulaItems.length === 0 && (
											<div className="p-2 text-gray-300">
												点击左侧指标或中间符号添加...
											</div>
										)}
									</div>
									<DragOverlay>
										{activeId
											? (() => {
													const item = formulaItems.find(
														(i) => i.uid === activeId,
													);
													if (!item) return null;
													if (item.type === "operator") {
														return (
															<div
																className="m-1 inline-flex items-center"
																style={{ lineHeight: "1" }}
															>
																<span className="px-1 text-lg font-bold">
																	{item.label}
																</span>
															</div>
														);
													}
													return (
														<div
															className="m-1 inline-flex items-center"
															style={{ lineHeight: "1" }}
														>
															<Tag
																style={{
																	backgroundColor:
																		"rgba(235, 238, 245, 1)",
																	border: "none",
																	fontSize: 14,
																	padding: "4px 8px",
																}}
															>
																{item.label}
															</Tag>
														</div>
													);
												})()
											: null}
									</DragOverlay>
									{!isEffective && <DroppableDeleteArea />}
								</DndContext>
							</div>
						</div>
					</div>
				</div>

				<div className="mb-4">
					<SectionTitle title="填报值" />
					<div className="flex flex-col gap-3 p-4">
						<Form.Item
							label="填报值"
							name="fillMethod"
							rules={[{ required: true, message: "请选择填报值方式" }]}
							style={{ marginBottom: 0 }}
						>
							<Radio.Group disabled={isEffective || shouldLockFillMethod}>
								<Radio value={1}>自动带出参考值</Radio>
								<Radio value={0}>不自动带出参考值</Radio>
							</Radio.Group>
						</Form.Item>

						<Form.Item
							shouldUpdate={(prev, curr) => prev.fillMethod !== curr.fillMethod}
							noStyle
						>
							{({ getFieldValue }) => {
								const fillMethod = getFieldValue("fillMethod");
								if (fillMethod === 0) return null;
								return (
									<Form.Item
										label="是否修改填报值"
										name="allowModifyFillValue"
										rules={[
											{ required: true, message: "请选择是否修改填报值" },
										]}
										style={{ marginBottom: 0 }}
									>
										<Radio.Group disabled={isEffective || shouldLockFillMethod}>
											<Radio value={1}>是</Radio>
											<Radio value={0}>否</Radio>
										</Radio.Group>
									</Form.Item>
								);
							}}
						</Form.Item>
					</div>
				</div>
			</Form>
			<AddIndicatorDrawer
				open={addIndicatorOpen}
				effTaskIndicatorConfId={row?.effTaskIndicatorConfId}
				isSelectionOnly
				type={0}
				customFetch={(params) => pageRetrieveBasicIndicatorSelected(params)}
				customFetchPagination
				onClose={async (res) => {
					setAddIndicatorOpen(false);
					if (res?.saved && res.selectedKeys) {
						try {
							const payload = {
								effTaskIndicatorConfDetailsReferenceId: row?.id,
								indicatorIds: res.selectedKeys,
							};
							const apiRes: any = await addReferenceIndicator(payload);
							if (apiRes && apiRes.code === 200) {
								loadBasicIndicators();
							} else {
								message.error(apiRes?.msg || "添加失败");
							}
						} catch (e) {
							console.error(e);
							message.error("添加失败");
						}
					}
				}}
			/>
			<AddIndicatorDrawer
				open={addConfigIndicatorOpen}
				title="配置指标"
				customFetch={async (params: any) => {
					const indicatorConfDetailsExcludeIds = (configIndicators || [])
						.map((item: any) => item?.effTaskIndicatorConfDetailsId)
						.filter((id: any) => id !== undefined && id !== null);
					const payload = {
						pageNum: 1,
						pageSize: 100,
						searchCount: true,
						allRecords: true,
						effTaskIndicatorConfId: indicatorConfigInfo.id,
						indicatorConfDetailsExcludeIds: [
							...indicatorConfDetailsExcludeIds,
							selectedIndicator.id,
						],
						responsibleDepartmentCode: params?.responsibleDepartmentCode,
						name: params?.name,
					};
					const res =
						await fetchIndicatorTargetDecompositionMainResponsibleDecomposingIndicatorsPage(
							payload,
						);
					return res;
				}}
				customSubmit={handleConfigIndicatorSubmit}
				onClose={() => setAddConfigIndicatorOpen(false)}
			/>
			<AdjustmentRangeModal
				showFormula={false}
				open={adjustmentModalOpen}
				initialValue={
					editingFieldIndex !== null
						? form.getFieldValue([
								"basicIndicators",
								editingFieldIndex,
								"deviationRange",
							])
						: undefined
				}
				onClose={() => setAdjustmentModalOpen(false)}
				onOk={async (value, rawData) => {
					if (editingFieldIndex !== null) {
						const list = form.getFieldValue("basicIndicators") || [];
						const newList = [...list];
						if (newList[editingFieldIndex]) {
							const item = newList[editingFieldIndex];
							newList[editingFieldIndex].deviationRange = value;
							form.setFieldValue("basicIndicators", newList);

							if (isFloatMode) {
								setFloatingRatioRow(newList[editingFieldIndex]);
								return;
							}
							if (rawData && item.id) {
								try {
									const res: any =
										await updateIndicatorConfReferenceBasicIndicatorListAdjustmentRange(
											{
												id: item.id,
												...rawData,
											},
										);
									if (res && res.code === 200) {
										loadBasicIndicators();
									} else {
										message.error(res?.msg || "更新失败");
									}
								} catch (e) {
									console.error(e);
									message.error("更新失败");
								}
							}
						}
					}
				}}
			/>
			<SourceConfigDrawer
				customTitle="同期值"
				open={sourceConfigDrawerOpen}
				indicatorId={
					editingFieldIndex !== null
						? form.getFieldValue(["basicIndicators", editingFieldIndex, "id"])
						: undefined
				}
				effTaskIndicatorConfDetailsId={effTaskIndicatorConfDetailsId}
				effTaskIndicatorConfDetailsBasicIndicatorId={
					editingFieldIndex !== null
						? form.getFieldValue(["basicIndicators", editingFieldIndex, "id"])
						: undefined
				}
				indicatorName={
					editingFieldIndex !== null
						? form.getFieldValue([
								"basicIndicators",
								editingFieldIndex,
								"indicatorName",
							])
						: undefined
				}
				row={row}
				value={
					editingFieldIndex !== null
						? form.getFieldValue([
								"basicIndicators",
								editingFieldIndex,
								"dataSourceType",
							])
						: undefined
				}
				manualValue={0}
				assetValue={1}
				samePeriodValueLabel={
					form.getFieldValue("targetMethod") === 1 ? "默认值" : "同期值"
				}
				unit={
					editingFieldIndex !== null
						? form.getFieldValue(["basicIndicators", editingFieldIndex, "unitName"])
						: ""
				}
				templateId={2}
				apiConfig={{
					fetchPage: fetchBasicIndicatorImportPage,
					add: addBasicIndicatorImport,
					delete: deleteReferenceIndicatorSamePeriodValueImport,
					update: updateBasicIndicatorImport,
					submit: submitBasicIndicatorImport,
				}}
				onClose={onSourceClosed}
			/>
		</Drawer>
	);
}
