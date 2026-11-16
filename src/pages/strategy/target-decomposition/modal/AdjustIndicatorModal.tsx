import type {
	ConfirmUserIdsIndicatorCountHisAdjustListItem,
	ConfirmUserIdsIndicatorCountHisAdjustPeriodItem,
	ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes,
	ConfirmUserIdsIndicatorCountHisAdjustRes,
} from "#src/api/strategy/target-filling";
import { confirmUserIdsIndicatorCountHisHeadV1 } from "#src/api/strategy/target-confirm";
import {
	confirmUserIdsIndicatorCountHisAdjust,
	confirmUserIdsIndicatorCountHisAdjustAllCal,
	submitConfirmUserIdsIndicatorCountHisAdjustPut,
} from "#src/api/strategy/target-filling";
import { EditOutlined } from "@ant-design/icons";
import { Button, Input, InputNumber, message, Modal, Table } from "antd";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdjustHistoryContext } from "./AdjustHistoryContext";
import AdjustReferenceValueDrawer from "./AdjustReferenceValueDrawer";

interface Props {
	open: boolean;
	onClose: () => void;
	record: any;
	effTaskSubmissionId?: string | number;
	onSuccess?: () => void;
}

type AdjustIndicatorRow = Omit<ConfirmUserIdsIndicatorCountHisAdjustListItem, "map"> & {
	map: Record<string, number | null>;
	periodMetaMap: Record<string, ConfirmUserIdsIndicatorCountHisAdjustPeriodItem>;
};

function normalizeAdjustIndicatorRows(
	rows: ConfirmUserIdsIndicatorCountHisAdjustRes["listBOS"] = [],
): AdjustIndicatorRow[] {
	return rows.map((item) => {
		const map: Record<string, number | null> = {};
		const periodMetaMap: Record<string, ConfirmUserIdsIndicatorCountHisAdjustPeriodItem> = {};

		Object.entries(item.map || {}).forEach(([key, rawValue]) => {
			if (rawValue && typeof rawValue === "object" && "periodCode" in rawValue) {
				const periodItem = rawValue as ConfirmUserIdsIndicatorCountHisAdjustPeriodItem;
				const periodKey = String(periodItem.periodCode ?? key);
				map[periodKey] = periodItem.resultValue ?? null;
				periodMetaMap[periodKey] = periodItem;
				return;
			}

			map[String(key)] = rawValue as number | null;
		});

		return {
			...item,
			map,
			periodMetaMap,
		};
	});
}

export default function AdjustIndicatorModal({
	open,
	onClose,
	record,
	effTaskSubmissionId,
	onSuccess,
}: Props) {
	const [loading, setLoading] = useState(false);
	const [confirmLoading, setConfirmLoading] = useState(false);
	const [data, setData] = useState<AdjustIndicatorRow[]>([]);
	const [headData, setHeadData] = useState<any[]>([]);
	const [effStepConfirmationRecordId, setEffStepConfirmationRecordId] = useState<number | null>(
		null,
	);
	const [confirmationOpinion, setConfirmationOpinion] = useState<string>("");
	const [referenceDrawerOpen, setReferenceDrawerOpen] = useState(false);
	const [currentEditRecord, setCurrentEditRecord] = useState<AdjustIndicatorRow | null>(null);
	const basicIndicatorMapRef = useRef<Record<string, string>>({});
	const annualCalInFlightRef = useRef<Record<number, boolean>>({});
	const annualCalLastSubmittedRef = useRef<Record<number, number>>({});

	// Store changes: map of id -> changed fields
	const [changes, setChanges] = useState<Record<number, any>>({});

	const loadData = async () => {
		if (!effTaskSubmissionId || !record?.targetOrgCode || !record?.responsiblePersonId) return;
		setLoading(true);
		try {
			// 1. Fetch Headers
			const headRes = await confirmUserIdsIndicatorCountHisHeadV1({
				effTaskSubmissionId: Number(effTaskSubmissionId),
				targetOrgCode: record.targetOrgCode,
				responsiblePersonId: record.responsiblePersonId,
				allPeriodFlag: true,
			});
			let headList: any[] = [];
			if (headRes && headRes.data) {
				headList = headRes.data;
				setHeadData(headList);
			}

			// 2. Fetch Data
			const res = await confirmUserIdsIndicatorCountHisAdjust({
				effTaskSubmissionId: Number(effTaskSubmissionId),
				targetOrgCode: record.targetOrgCode,
				responsiblePersonId: record.responsiblePersonId,
				allPeriodFlag: true,
			});

			if (res && res.data) {
				const resData = res.data;
				setEffStepConfirmationRecordId(resData.effStepConfirmationRecordId);
				setConfirmationOpinion(resData.confirmationOpinion || "");
				setData(normalizeAdjustIndicatorRows(resData.listBOS || []));
			} else {
				setData([]);
			}
		} catch (e) {
			console.error(e);
			message.error("加载数据失败");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			setChanges({});
			basicIndicatorMapRef.current = {};
			annualCalInFlightRef.current = {};
			annualCalLastSubmittedRef.current = {};
			loadData();
		}
	}, [open, record, effTaskSubmissionId]);

	const getCurrentFieldValue = useCallback(
		(row: any, field: string) => {
			if (changes[row.id]?.[field] !== undefined) {
				return changes[row.id][field];
			}
			return row[field];
		},
		[changes],
	);

	const buildHisAdjustAllCalInnerMap = useCallback(() => {
		const innerMap: Record<
			string,
			{
				listOverviewHisId?: number;
				referenceValue?: number;
				annualTargetValue?: number;
			}
		> = {};

		data.forEach((row: any) => {
			innerMap[String(row.id)] = {
				listOverviewHisId: row.id,
				referenceValue: getCurrentFieldValue(row, "referenceValue"),
				annualTargetValue: getCurrentFieldValue(row, "annualTargetValue"),
			};
		});

		return innerMap;
	}, [data, getCurrentFieldValue]);

	const handleChange = (value: any, id: number, field: string) => {
		setChanges((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				[field]: value,
			},
		}));
	};

	const handlePeriodChange = (value: any, id: number, periodId: string) => {
		setChanges((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				map: {
					...(prev[id]?.map || {}),
					[periodId]: value,
				},
			},
		}));
	};

	const handleAnnualTargetCommit = useCallback(
		async (row: any) => {
			const recordId = Number(row.id);
			const currentValue = getCurrentFieldValue(row, "annualTargetValue");
			if (
				currentValue === undefined ||
				currentValue === null ||
				Number.isNaN(Number(currentValue))
			) {
				return;
			}

			if (annualCalInFlightRef.current[recordId]) {
				return;
			}

			if (annualCalLastSubmittedRef.current[recordId] === Number(currentValue)) {
				return;
			}

			annualCalInFlightRef.current[recordId] = true;

			try {
				const resp = await confirmUserIdsIndicatorCountHisAdjustAllCal({
					id: recordId,
					value: Number(currentValue),
					basicIndicatorMap: basicIndicatorMapRef.current,
					hisAdjustAllCalInnerMap: buildHisAdjustAllCalInnerMap(),
				});

				if (resp?.code !== 200 || !resp.data) {
					message.error(resp?.msg || "年度目标值计算失败");
					return;
				}

				const rawData = resp.data as any;
				const resultMap: Record<string, any> =
					rawData && typeof rawData === "object" && "id" in rawData
						? { __single__: rawData }
						: rawData || {};

				setChanges((prev) => {
					const next = { ...prev };

					data.forEach((item: any) => {
						const indicatorListId = String(item?.indicatorListId ?? item.id);
						const rowResult =
							resultMap[indicatorListId] ||
							(resultMap.__single__ && Number(item.id) === recordId
								? resultMap.__single__
								: undefined);
						if (!rowResult) {
							return;
						}

						next[item.id] = {
							...(next[item.id] || {}),
							annualTargetValue: rowResult.annualTargetValue,
							deviationValue: rowResult.deviationValue ?? 0,
							deviationFormulaFlag: rowResult.deviationFormulaFlag ?? 0,
							map: {
								...((next[item.id] || {}).map || {}),
								...(rowResult.map || {}),
							},
						};
					});

					return next;
				});

				annualCalLastSubmittedRef.current[recordId] = Number(currentValue);
			} catch (e) {
				console.error(e);
				message.error("年度目标值计算失败");
			} finally {
				annualCalInFlightRef.current[recordId] = false;
			}
		},
		[buildHisAdjustAllCalInnerMap, data, getCurrentFieldValue],
	);

	const handleReferenceValueSave = useCallback(
		(
			updatedBasicIndicatorMap: Record<string, unknown>,
			linkageData?: ConfirmUserIdsIndicatorCountHisAdjustReferenceValueCalLinkageRes,
		) => {
			Object.entries(updatedBasicIndicatorMap).forEach(([key, value]) => {
				basicIndicatorMapRef.current[key] = String(value ?? "");
			});

			if (!linkageData) {
				return;
			}

			setChanges((prev) => {
				const next = { ...prev };

				data.forEach((item: any) => {
					const indicatorListId = String(item?.indicatorListId ?? item.id);
					const linkageItem = linkageData[indicatorListId];
					if (!linkageItem) {
						return;
					}

					next[item.id] = {
						...(next[item.id] || {}),
						referenceValue: linkageItem.referenceValue,
						annualTargetValue: linkageItem.annualTargetValue,
						deviationValue: linkageItem.deviationValue,
						deviationFormulaFlag: linkageItem.deviationFormulaFlag,
						map: {
							...((next[item.id] || {}).map || {}),
							...(linkageItem.periodic || {}),
						},
					};
				});

				return next;
			});
		},
		[data],
	);

	const sameTargetOrgRows = useMemo(() => {
		return data.map((row: any) => ({
			id: Number(row.id),
			samePeriodValue: Number(row.samePeriodValue ?? 0),
			referenceValue: Number(getCurrentFieldValue(row, "referenceValue") ?? 0),
			annualTargetValue: Number(getCurrentFieldValue(row, "annualTargetValue") ?? 0),
		}));
	}, [data, getCurrentFieldValue]);

	const currentIndicatorListId = useMemo(() => {
		if (!currentEditRecord) {
			return null;
		}
		return String(currentEditRecord?.indicatorListId ?? currentEditRecord?.id ?? "");
	}, [currentEditRecord]);

	const hasPeriodCellValue = useCallback((row: AdjustIndicatorRow, periodId: string) => {
		const rowMap = row?.map;
		if (!rowMap || typeof rowMap !== "object") {
			return false;
		}

		return (
			Object.prototype.hasOwnProperty.call(rowMap, periodId) &&
			rowMap[periodId] !== null &&
			rowMap[periodId] !== undefined
		);
	}, []);

	const canEditPeriodValue = useCallback((row: AdjustIndicatorRow, periodId: string) => {
		return row.periodMetaMap?.[periodId]?.supportModify !== 0;
	}, []);

	// 使用 useMemo 动态生成 columns，确保 render 函数总是使用最新的 changes
	const columns = useMemo(() => {
		const dynamicCols = headData.map((item: any) => ({
			title: item.name,
			dataIndex: ["map", String(item.id)],
			key: `period-${item.id}`,
			width: 120,
			render: (val: number | null | undefined, row: AdjustIndicatorRow) => {
				const periodId = String(item.id);
				if (!hasPeriodCellValue(row, periodId)) {
					return null;
				}

				return (
					<InputNumber
						value={changes[row.id]?.map?.[periodId] ?? val}
						disabled={!canEditPeriodValue(row, periodId)}
						onChange={(v) => handlePeriodChange(v, row.id, periodId)}
						style={{ width: "100%" }}
					/>
				);
			},
		}));

		return [
			{
				title: "指标名称",
				dataIndex: "name",
				key: "name",
				width: 200,
				fixed: "left" as const,
			},
			{
				title: "参考值",
				dataIndex: "referenceValue",
				key: "referenceValue",
				width: 150,
				render: (val: any, row: any) => {
					const displayValue =
						changes[row.id]?.referenceValue !== undefined
							? changes[row.id].referenceValue
							: val;
					return (
						<div className="flex items-center justify-between gap-2">
							<span>{displayValue ?? "-"}</span>
							<Button
								type="link"
								size="small"
								icon={<EditOutlined />}
								onClick={() => {
									setCurrentEditRecord(row);
									setReferenceDrawerOpen(true);
								}}
							/>
						</div>
					);
				},
			},
			{
				title: "年度目标值",
				dataIndex: "annualTargetValue",
				key: "annualTargetValue",
				width: 150,
				render: (val: any, row: any) => (
					<InputNumber
						value={
							changes[row.id]?.annualTargetValue !== undefined
								? changes[row.id].annualTargetValue
								: val
						}
						onChange={(v) => handleChange(v, row.id, "annualTargetValue")}
						onBlur={() => void handleAnnualTargetCommit(row)}
						onPressEnter={() => void handleAnnualTargetCommit(row)}
						style={{ width: "100%" }}
					/>
				),
			},
			{
				title: "偏差",
				dataIndex: "deviationValue",
				key: "deviationValue",
				width: 120,
				render: (val: any, row: any) => {
					const displayValue =
						changes[row.id]?.deviationValue !== undefined
							? changes[row.id].deviationValue
							: val;
					const deviationFormulaFlag =
						changes[row.id]?.deviationFormulaFlag !== undefined
							? changes[row.id].deviationFormulaFlag
							: row.deviationFormulaFlag;

					return (
						<span style={{ color: deviationFormulaFlag === 1 ? "red" : undefined }}>
							{displayValue ?? "-"}
						</span>
					);
				},
			},
			...dynamicCols,
			{
				title: "备注",
				dataIndex: "remarks",
				key: "remarks",
				width: 200,
				render: (val: any, row: any) => (
					<Input
						value={
							changes[row.id]?.remarks !== undefined ? changes[row.id].remarks : val
						}
						onChange={(e) => handleChange(e.target.value, row.id, "remarks")}
					/>
				),
			},
		];
	}, [canEditPeriodValue, changes, handleAnnualTargetCommit, hasPeriodCellValue, headData]);

	const handleSubmit = async () => {
		setConfirmLoading(true);
		if (!effStepConfirmationRecordId) {
			setConfirmLoading(false);
			return;
		}

		const adjustFormList = Object.entries(changes).map(([id, change]) => ({
			id: Number(id),
			...change,
		}));

		if (adjustFormList.length === 0) {
			setConfirmLoading(false);
			onClose();
			return;
		}

		try {
			const submitBasicIndicatorMap = record?.targetOrgCode
				? { [record.targetOrgCode]: { ...basicIndicatorMapRef.current } }
				: undefined;

			const res: any = await submitConfirmUserIdsIndicatorCountHisAdjustPut({
				effStepConfirmationRecordId,
				adjustFormList,
				basicIndicatorMap: submitBasicIndicatorMap,
			});

			if (res && res.code === 200) {
				if (onSuccess) onSuccess();
				onClose();
			}
		} catch (e) {
			console.error(e);
			message.error("保存失败");
		} finally {
			setConfirmLoading(false);
		}
	};

	return (
		<>
			<AdjustHistoryContext.Provider value={{ currentIndicatorListId }}>
				<AdjustReferenceValueDrawer
					open={referenceDrawerOpen}
					onClose={() => {
						setReferenceDrawerOpen(false);
						setCurrentEditRecord(null);
					}}
					listOverviewHisId={currentEditRecord?.id ?? null}
					targetOrgCode={record?.targetOrgCode ?? ""}
					indicatorName={currentEditRecord?.name ?? ""}
					unitName={currentEditRecord?.unitName ?? ""}
					initialReferenceValue={Number(
						getCurrentFieldValue(currentEditRecord || {}, "referenceValue") ?? 0,
					)}
					cachedBasicIndicatorMap={basicIndicatorMapRef.current}
					sameTargetOrgRows={sameTargetOrgRows}
					onSave={handleReferenceValueSave}
				/>
			</AdjustHistoryContext.Provider>

			<Modal
				title="调整指标"
				open={open}
				onCancel={onClose}
				onOk={handleSubmit}
				confirmLoading={confirmLoading}
				width="90%"
				style={{ top: 20 }}
				maskClosable={false}
				okText="提交"
			>
				<div style={{ marginBottom: 16 }}>
					<span style={{ fontWeight: "bold", marginRight: 8 }}>确认意见:</span>
					<span>{confirmationOpinion || "无"}</span>
				</div>
				<Table
					columns={columns}
					dataSource={data}
					loading={loading}
					rowKey="id"
					scroll={{ x: "max-content", y: 600 }}
					pagination={false}
					size="small"
					bordered
				/>
			</Modal>
		</>
	);
}
