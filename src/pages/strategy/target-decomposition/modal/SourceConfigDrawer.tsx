import type { MenuProps } from "antd";
import {
	deleteImportedSamePeriodValue,
	fetchSamePeriodValueImportPage,
	importSamePeriodValue,
	submitImportedSamePeriodValue,
	updateImportedSamePeriodValue,
} from "#src/api/strategy";
import { strategyExcelDataImport, strategyExcelTemplateExport } from "#src/api/system/files";
import { SectionTitle } from "#src/components/section-title/index.js";
import { downloadBlob } from "#src/utils/files";
import { DownOutlined } from "@ant-design/icons";
import {
	Button,
	ConfigProvider,
	Drawer,
	Dropdown,
	Input,
	InputNumber,
	message,
	Modal,
	Radio,
	Space,
	Table,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import AddManualImportModal from "./AddManualImportModal";

interface ManualRow {
	key: string;
	targetOrgCode: string; // 主数据编码
	targetOrgName: string; // 应用对象
	samePeriodValue: string; // 同期值
	suspendedVersion?: string;
}

interface ApiConfig {
	fetchPage: (payload: any) => Promise<any>;
	add: (payload: any) => Promise<any>;
	delete: (id: string | number) => Promise<any>;
	update: (payload: any) => Promise<any>;
	submit: (payload: any) => Promise<any>;
}

interface Props {
	open: boolean;
	indicatorId?: string | number;
	effTaskIndicatorConfDetailsId?: string | number;
	effTaskIndicatorConfDetailsBasicIndicatorId?: string | number;
	indicatorName?: string;
	// current row data from parent (optional) so we can show 指标名称 / 拆解对象
	row?: any;
	value?: number;
	onClose: (res?: { saved?: boolean; value?: any }) => void;
	apiConfig?: ApiConfig;
	manualValue?: number;
	assetValue?: number;
	samePeriodValueLabel?: string;
	customTitle?: string;
	unit?: string;
	dataRangeStart?: number;
	dataRangeEnd?: number;
	decimalDigits?: number;
	templateId?: number;
}

export default function SourceConfigDrawer({
	open,
	indicatorId,
	effTaskIndicatorConfDetailsId,
	effTaskIndicatorConfDetailsBasicIndicatorId,
	indicatorName,
	row,
	value,
	onClose,
	apiConfig,
	manualValue = 0,
	samePeriodValueLabel = "同期值",
	unit = "",
	dataRangeStart,
	dataRangeEnd,
	decimalDigits,
	templateId,
}: Props) {
	const [dataSourceCode, setDataSourceCode] = React.useState<number>(() => {
		const val = value ?? row?.dataSourceCode;
		if (val === undefined || val === null || val === "") {
			return manualValue;
		}
		const num = Number(val);
		return Number.isNaN(num) ? manualValue : num;
	});
	const [manualRows, setManualRows] = React.useState<ManualRow[]>([]);

	interface DataAssetRow {
		key: string;
		field: string; // 字段
		mappedField: string; // 映射字段
		mappedValue: string; // 映射值
	}

	const [taskTableName, setTaskTableName] = React.useState<string>(row?.taskTableName ?? "");
	const [dataAssetRows, setDataAssetRows] = React.useState<DataAssetRow[]>([]);
	const [addModalOpen, setAddModalOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [pagination, setPagination] = React.useState({ current: 1, pageSize: 10, total: 0 });

	const [suspendedVersion, setSuspendedVersion] = React.useState<string>("");
	const delIdsRef = React.useRef<string[]>([]);
	const kstTMapRef = React.useRef<Record<string, any>>({});
	const [validateFailed, setValidateFailed] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const importExcelTypeRef = React.useRef<1 | 2>(1);

	const suspendedVersionRef = React.useRef(suspendedVersion);
	suspendedVersionRef.current = suspendedVersion;
	const apiConfigRef = React.useRef(apiConfig);
	apiConfigRef.current = apiConfig;

	const buildManualQueryExtObj = React.useCallback(
		(excelType?: 1 | 2) => {
			const extObj: any = {
				effTaskIndicatorConfDetailsId: Number(
					effTaskIndicatorConfDetailsId ?? indicatorId ?? 0,
				),
				effTaskIndicatorConfDetailsReferenceId: Number(row?.id ?? 0),
				suspendedVersion: suspendedVersionRef.current,
				kstT: kstTMapRef.current,
				importDelIds: delIdsRef.current,
			};

			if (typeof excelType !== "undefined") {
				extObj.excelType = excelType;
			}

			if (effTaskIndicatorConfDetailsBasicIndicatorId) {
				extObj.effTaskIndicatorConfDetailsBasicIndicatorId = Number(
					effTaskIndicatorConfDetailsBasicIndicatorId,
				);
			}

			return JSON.stringify(extObj);
		},
		[
			effTaskIndicatorConfDetailsBasicIndicatorId,
			effTaskIndicatorConfDetailsId,
			indicatorId,
			row?.id,
		],
	);

	const loadManualData = async (page: number, size: number, _?: any, sv?: string) => {
		setLoading(true);
		try {
			const payload: any = {
				pageNum: page,
				pageSize: size,
				effTaskIndicatorConfDetailsId: Number(
					effTaskIndicatorConfDetailsId ?? indicatorId ?? 0,
				),
				effTaskIndicatorConfDetailsReferenceId: Number(row?.id ?? 0),
				suspendedVersion: sv === undefined ? suspendedVersion : sv,
				kstT: kstTMapRef.current,
				importDelIds: delIdsRef.current,
			};
			if (effTaskIndicatorConfDetailsBasicIndicatorId) {
				payload.effTaskIndicatorConfDetailsBasicIndicatorId = Number(
					effTaskIndicatorConfDetailsBasicIndicatorId,
				);
			}
			const fetchFn = apiConfig?.fetchPage || fetchSamePeriodValueImportPage;
			const res: any = await fetchFn(payload);
			let list: any[] = [];
			if (res && res.data && Array.isArray(res.data)) list = res.data;
			else if (res && res.data && Array.isArray(res.data.list)) list = res.data.list;
			else if (res && Array.isArray(res)) list = res;

			setManualRows(
				list.map((item: any) => ({
					key: item.id || String(Math.random()),
					targetOrgCode: item.targetOrgCode || item.code || "",
					targetOrgName:
						item.targetOrgName || item.targetOrgDesc || item.orgName || item.name || "",
					samePeriodValue: String(item.sameValue ?? item.samePeriodValue ?? ""),
					suspendedVersion: item.suspendedVersion,
				})),
			);
			setPagination({
				current: page,
				pageSize: size,
				total: res.total || (res.data && res.data.total) || list.length || 0,
			});
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const init = async () => {
		const sv = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		setSuspendedVersion(sv);
		loadManualData(1, 10, undefined, sv);
	};

	React.useEffect(() => {
		if (open) {
			const val = value ?? row?.dataSourceCode;
			if (val === undefined || val === null || val === "") {
				setDataSourceCode(manualValue);
			} else {
				const num = Number(val);
				setDataSourceCode(Number.isNaN(num) ? manualValue : num);
			}
		}
	}, [value, row, open, manualValue]);

	React.useEffect(() => {
		if (open && dataSourceCode === manualValue) {
			init();
			kstTMapRef.current = {};
			delIdsRef.current = [];
			setValidateFailed(false);
		} else if (!open) {
			const sv = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
			setSuspendedVersion(sv);
			kstTMapRef.current = {};
			delIdsRef.current = [];
		}
	}, [open, dataSourceCode, indicatorId, manualValue]);

	React.useEffect(() => {
		if (row && row.dataAsset) {
			setTaskTableName(row.dataAsset.taskTableName || "");
			setDataAssetRows(
				(row.dataAsset.mappings || []).map((m: any, idx: number) => ({
					key: String(m.key ?? idx),
					field: m.field ?? "",
					mappedField: m.mappedField ?? "",
					mappedValue: m.mappedValue ?? "",
				})),
			);
		}
	}, [row]);

	const updateRow = (key: string, field: keyof ManualRow, val: any) => {
		setManualRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: val } : r)));
	};

	const removeRow = (rec: ManualRow) => {
		Modal.confirm({
			title: "确认删除该条数据吗？",
			onOk: async () => {
				const originalId = Object.keys(kstTMapRef.current).find(
					(key) => kstTMapRef.current[key] === rec.key,
				);

				if (originalId) {
					try {
						const deleteFn = apiConfig?.delete || deleteImportedSamePeriodValue;
						const res: any = await deleteFn(rec.key);
						if (res && res.code === 200) {
							message.success("删除成功");
							delIdsRef.current = [...delIdsRef.current, originalId];
							delete kstTMapRef.current[originalId];
							loadManualData(pagination.current, pagination.pageSize);
						} else {
							message.error(res?.msg || "删除失败");
						}
					} catch (e) {
						console.error("delete failed", e);
						message.error("删除失败");
					}
					return;
				}

				if (!rec.suspendedVersion) {
					delIdsRef.current = [...delIdsRef.current, rec.key];
					loadManualData(pagination.current, pagination.pageSize);
					return;
				}

				try {
					const deleteFn = apiConfig?.delete || deleteImportedSamePeriodValue;
					const res: any = await deleteFn(rec.key);
					if (res && res.code === 200) {
						message.success("删除成功");
						loadManualData(pagination.current, pagination.pageSize);
					} else {
						message.error(res?.msg || "删除失败");
					}
				} catch (e) {
					console.error("delete failed", e);
					message.error("删除失败");
				}
			},
		});
	};

	const handleExportTemplate = async () => {
		if (!templateId) {
			message.warning("未配置模板ID，无法导出");
			return;
		}

		try {
			const blob = await strategyExcelTemplateExport({
				templateId,
				extObj: buildManualQueryExtObj(),
			});
			const fileName =
				templateId === 1 ? "数据来源-同期值-导入模板" : "基础指标-数据来源-导入模板";
			downloadBlob(blob, fileName);
		} catch (e) {
			console.error("export template failed", e);
		}
	};

	const handleImportClick = () => {
		if (!templateId) {
			message.warning("未配置模板ID，无法导入");
			return;
		}
		// 触发文件选择
		fileInputRef.current?.click();
	};

	const importMenuItems = React.useMemo<MenuProps["items"]>(
		() => [
			{ key: "1", label: "覆盖导入" },
			{ key: "2", label: "修改导入" },
		],
		[],
	);

	const handleImportMenuClick = React.useCallback<Required<MenuProps>["onClick"]>(
		({ key }) => {
			importExcelTypeRef.current = key === "2" ? 2 : 1;
			handleImportClick();
		},
		[templateId],
	);

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}

		// 验证文件类型
		const validTypes = [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		];
		if (!validTypes.includes(file.type)) {
			message.error("请选择Excel文件（.xls 或 .xlsx）");
			event.target.value = ""; // 清空文件选择
			return;
		}

		try {
			// 构建 extMapStr
			const extMapStr = buildManualQueryExtObj(importExcelTypeRef.current);

			// 调用导入接口
			const success = await strategyExcelDataImport({
				templateId: templateId!,
				extMapStr,
				file,
			});

			if (success) {
				// 刷新数据
				loadManualData(pagination.current, pagination.pageSize);
			}
		} catch (e) {
			console.error("import failed", e);
		} finally {
			// 清空文件选择，允许重复选择同一文件
			event.target.value = "";
		}
	};

	const save = async () => {
		if (dataSourceCode === manualValue) {
			// Validate manualRows
			const emptyRows = manualRows.filter((r) => {
				const val = r.samePeriodValue;
				return val === undefined || val === null || String(val).trim() === "";
			});
			if (emptyRows.length > 0) {
				setValidateFailed(true);
				return;
			}

			const payload: any = {
				effTaskIndicatorConfDetailsId: effTaskIndicatorConfDetailsId ?? indicatorId ?? 0,
				effTaskIndicatorConfDetailsReferenceId: row?.id ?? 0,
				suspendedVersion,
				delIds: delIdsRef.current,
				kstT: kstTMapRef.current,
			};
			if (effTaskIndicatorConfDetailsBasicIndicatorId) {
				payload.effTaskIndicatorConfDetailsBasicIndicatorId =
					effTaskIndicatorConfDetailsBasicIndicatorId;
			}

			try {
				const submitFn = apiConfig?.submit || submitImportedSamePeriodValue;
				const res: any = await submitFn(payload);
				if (res && res.code === 200) {
					onClose?.({ saved: true, value: { dataSourceCode, manualRows } });
				}
			} catch (e) {
				console.error("save failed", e);
			}
			return;
		}

		// 数据资产
		if (!taskTableName || taskTableName.trim() === "") {
			message.error("任务表名称为必填项");
			return;
		}

		onClose?.({
			saved: true,
			value: { dataSourceCode, taskTableName, mappings: dataAssetRows },
		});
	};

	const loadManualDataRef = React.useRef(loadManualData);
	loadManualDataRef.current = loadManualData;
	const paginationRef = React.useRef(pagination);
	paginationRef.current = pagination;

	const handleUpdate = (rec: ManualRow, value: string) => {
		if (!value) {
			return;
		}
		const isInKst = Object.keys(kstTMapRef.current).includes(rec.key.toString());
		const sourceNewB = isInKst ? false : !!rec.suspendedVersion;
		const payload: any = {
			id: rec.key,
			samePeriodValue: value,
			sourceNewB,
			suspendedVersion: suspendedVersionRef.current,
		};
		if (isInKst) {
			payload.suspendedEditId = kstTMapRef.current[rec.key];
		}
		const updateFn = apiConfigRef.current?.update || updateImportedSamePeriodValue;
		updateFn(payload)
			.then((res: any) => {
				if (!sourceNewB && res && res.code === 200 && res.data) {
					kstTMapRef.current[rec.key] = res.data;
				}
				// Don't reload data here to avoid focus loss or UI jump
				// loadManualDataRef.current(paginationRef.current.current, paginationRef.current.pageSize);
			})
			.catch((e) => {
				console.error("update failed", e);
			});
	};

	const columns = [
		{
			title: "主数据编码",
			dataIndex: "targetOrgCode",
			key: "targetOrgCode",
		},
		{
			title: "应用对象",
			dataIndex: "targetOrgName",
			key: "targetOrgName",
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					{samePeriodValueLabel}
				</span>
			),
			dataIndex: "samePeriodValue",
			key: "samePeriodValue",
			render: (v: string | number, rec: ManualRow) => {
				const isError =
					validateFailed && (v === undefined || v === null || String(v).trim() === "");
				return (
					<div>
						<InputNumber
							style={{ width: "100%" }}
							status={isError ? "error" : ""}
							suffix={unit}
							value={v}
							precision={decimalDigits}
							onChange={(val) => {
								updateRow(
									rec.key,
									"samePeriodValue",
									val === null ? "" : String(val),
								);
							}}
							onBlur={() => {
								const currentRow = manualRows.find((r) => r.key === rec.key);
								if (currentRow) {
									const valStr = currentRow.samePeriodValue;
									const valNum = Number(valStr);
									let finalValStr = valStr;

									if (valStr !== "" && !Number.isNaN(valNum)) {
										if (
											dataRangeEnd !== undefined &&
											dataRangeEnd !== null &&
											valNum > dataRangeEnd
										) {
											finalValStr = String(dataRangeEnd);
											message.warning(
												`输入值超出范围，已自动调整为最大值 ${dataRangeEnd}`,
											);
											updateRow(rec.key, "samePeriodValue", finalValStr);
										} else if (
											dataRangeStart !== undefined &&
											dataRangeStart !== null &&
											valNum < dataRangeStart
										) {
											finalValStr = String(dataRangeStart);
											message.warning(
												`输入值超出范围，已自动调整为最小值 ${dataRangeStart}`,
											);
											updateRow(rec.key, "samePeriodValue", finalValStr);
										}
									}
									handleUpdate(
										{ ...currentRow, samePeriodValue: finalValStr },
										finalValStr,
									);
								}
							}}
						/>
						{isError && (
							<div
								style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "4px" }}
							>{`请输入${samePeriodValueLabel}`}</div>
						)}
					</div>
				);
			},
		},
		{
			title: "操作",
			dataIndex: "op",
			key: "op",
			render: (_: any, rec: ManualRow) => <a onClick={() => removeRow(rec)}>删除</a>,
		},
	];

	return (
		<Drawer
			title={samePeriodValueLabel === "同期值" ? samePeriodValueLabel : "数据来源配置"}
			placement="right"
			width={1080}
			open={open}
			destroyOnHidden
			footer={
				<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
					<Button onClick={() => onClose?.({})}>取消</Button>
					<Button type="primary" onClick={save}>
						保存
					</Button>
				</div>
			}
			{...commonDrawerProps(onClose)}
		>
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ width: 112, color: "#6b7280" }}>指标名称</div>
						<Input value={indicatorName ?? "-"} disabled style={{ flex: 1 }} />
					</div>

					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ width: 112, color: "#6b7280" }}>拆解对象</div>
						<Input value={row?.targetOrgDesc ?? "-"} disabled style={{ flex: 1 }} />
					</div>

					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ width: 112, color: "#6b7280" }}>数据来源</div>
						<div style={{ flex: 1 }}>
							<Radio.Group
								value={dataSourceCode}
								onChange={(e) => setDataSourceCode(e.target.value)}
							>
								<Radio value={manualValue}>手工录入</Radio>
								{/* <Radio value={assetValue}>数据资产</Radio> */}
							</Radio.Group>
						</div>
					</div>
				</div>
			</div>

			{dataSourceCode === manualValue && (
				<>
					<div className="mb-4 flex items-center justify-between">
						<SectionTitle title="手工录入数据" />
						<Space>
							<Button onClick={handleExportTemplate}>导出模板</Button>
							<Dropdown
								menu={{ items: importMenuItems, onClick: handleImportMenuClick }}
								trigger={["click"]}
							>
								<Button>
									导入
									<DownOutlined />
								</Button>
							</Dropdown>
							<Button type="primary" onClick={() => setAddModalOpen(true)}>
								新增
							</Button>
						</Space>
					</div>
					{/* 隐藏的文件输入框 */}
					<input
						ref={fileInputRef}
						type="file"
						accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
						style={{ display: "none" }}
						onChange={handleFileChange}
					/>
					<ConfigProvider locale={zhCN}>
						<Table
							columns={columns}
							dataSource={manualRows}
							loading={loading}
							pagination={{
								...pagination,
								showSizeChanger: true,
								onChange: (p, ps) => loadManualData(p, ps),
								showTotal: (t) => `共 ${t} 条`,
							}}
							rowKey="key"
							bordered
							size="small"
						/>
					</ConfigProvider>
					<AddManualImportModal
						open={addModalOpen}
						effTaskIndicatorConfDetailsReferenceId={row?.id}
						disabledKeys={manualRows.map((r: any) => r.targetOrgCode || r.key)}
						excludeIndicators={manualRows.map((r: any) => r.targetOrgCode || r.key)}
						onClose={async (res) => {
							setAddModalOpen(false);
							if (res?.saved) {
								// Call importSamePeriodValue
								const targetOrgConfig: Record<string, string> = {};
								if (Array.isArray(res.data)) {
									res.data.forEach((item: any) => {
										const key = item.targetOrgCode || item.code;
										const val = item.targetOrgName || item.name || item.orgName;
										if (key) {
											targetOrgConfig[key] = val;
										}
									});
								}

								const payload: any = {
									targetOrgConfig,
									effTaskIndicatorConfDetailsId:
										effTaskIndicatorConfDetailsId ?? indicatorId ?? 0,
									effTaskIndicatorConfDetailsReferenceId: row?.id ?? 0,
									suspendedVersion,
									delIds: delIdsRef.current,
									kstT: kstTMapRef.current,
								};
								if (effTaskIndicatorConfDetailsBasicIndicatorId) {
									payload.effTaskIndicatorConfDetailsBasicIndicatorId =
										effTaskIndicatorConfDetailsBasicIndicatorId;
								}
								try {
									const addFn = apiConfig?.add || importSamePeriodValue;
									const res: any = await addFn(payload);
									if (res && res.code === 200) {
										loadManualData(1, 10);
									} else {
										message.error(res?.msg || "添加失败");
									}
								} catch (e) {
									console.error("import failed", e);
									message.error("添加失败");
								}
							}
						}}
					/>
				</>
			)}
			{dataSourceCode === 1 && (
				<>
					<SectionTitle title="数据资产" className="mb-4" />
					<div style={{ marginBottom: 12 }}>
						<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
							<div style={{ display: "flex", alignItems: "center" }}>
								<div style={{ width: 112, color: "#6b7280" }}>任务表名称</div>
								<Input
									value={taskTableName}
									onChange={(e) => setTaskTableName(e.target.value)}
									placeholder="请输入任务表名称（必填）"
									style={{ flex: 1 }}
								/>
							</div>
						</div>
					</div>
					<ConfigProvider locale={zhCN}>
						<Table
							columns={[
								{ title: "字段", dataIndex: "field", key: "field" },
								{
									title: "映射字段",
									dataIndex: "mappedField",
									key: "mappedField",
									render: (v: string, rec: DataAssetRow) => (
										<Input
											value={v}
											onChange={(e) =>
												setDataAssetRows((prev) =>
													prev.map((r) =>
														r.key === rec.key
															? { ...r, mappedField: e.target.value }
															: r,
													),
												)
											}
										/>
									),
								},
								{
									title: "映射值",
									dataIndex: "mappedValue",
									key: "mappedValue",
									render: (v: string, rec: DataAssetRow) => (
										<Input
											value={v}
											onChange={(e) =>
												setDataAssetRows((prev) =>
													prev.map((r) =>
														r.key === rec.key
															? { ...r, mappedValue: e.target.value }
															: r,
													),
												)
											}
										/>
									),
								},
							]}
							dataSource={dataAssetRows}
							pagination={false}
							rowKey="key"
							bordered
							size="small"
						/>
					</ConfigProvider>
				</>
			)}
		</Drawer>
	);
}
