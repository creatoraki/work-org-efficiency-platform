import type {
	SubmitUserIndicatorAnnualTargetValueRes,
	UserIndicatorTreeRes,
} from "#src/api/strategy/target-filling";
import type { Row } from "./types";
import { commonExport } from "#src/api/file/export-task/index.js";
import {
	deleteChildIndicator,
	fetchSubmitUserIndicatorDetailUpperRight,
	fetchSubmitUserIndicatorDisassembleSubTree,
	fetchSubmitUserIndicatorTree,
	noticeChange,
	noticeChangeCount,
	noticeChangeUp,
	submitSubmitUserIndicatorAnnualTargetValue,
	submitSubmitUserIndicatorBasicChange,
	submitSubmitUserIndicatorChild,
	submitSubmitUserIndicatorDisassembleSub,
	submitSubmitUserIndicatorPeriod,
	submitUserIndicatorChildCheck,
	upResponsiblePersonMsg,
} from "#src/api/strategy/target-filling";
import { strategyExcelDataImport } from "#src/api/system/files/index.js";
import ImportIcon from "#src/assets/small-icons/target-filling/import-icon.svg?react";
import InfoCircleFilledIcon from "#src/assets/small-icons/target-filling/info-circle-filled.svg?react";
import BlankSvg from "#src/assets/svg/target-blank.svg?react";
import { BasicButton, BasicContent, BasicTable } from "#src/components/index.js";
import SearchableTable from "#src/components/searchable-table";
import PersonCreateModal from "#src/pages/strategy/target-management/modal/Person-create-modal";
import PlanPermissionsDrawer from "#src/pages/strategy/target-management/modal/Plan-permissions-drawer";
import { TABLE_CONFIG } from "#src/pages/tag-management/config.js";
import { useUserStore } from "#src/store/user.js";
import { addThousand } from "#src/utils/add-thousand";
import {
	EditOutlined,
	MinusOutlined,
	PlusOutlined,
	QuestionCircleOutlined,
} from "@ant-design/icons";
import {
	Badge,
	Button,
	Checkbox,
	Divider,
	Dropdown,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Space,
	Tag,
	theme,
	Tooltip,
	Typography,
} from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import AddDecomposeObjectModal from "../modal/AddDecomposeObjectModal";
import ChangeReminderDrawer from "../modal/ChangeReminderDrawer";
import DoubleCountingDrawer from "../modal/DoubleCountingDrawer";
import IndicatorConfigDrawer from "../modal/IndicatorConfigDrawer";
import ReferenceValueDrawer from "../modal/ReferenceValueDrawer";
import SubmitDrawer from "../modal/SubmitDrawer";
import { EditableCell, StatsCards, TreePanel } from "./components";
import {
	useChildTableData,
	useFieldStats,
	useLockStatus,
	useRootTableData,
	useTreeData,
} from "./hooks";
import { flattenExportHeads, getTitleText, validateChildTableData } from "./utils";

const { Title, Text } = Typography;

export default function SingleFillingPage() {
	const [searchParams] = useSearchParams();
	const planId = searchParams.get("planId") || searchParams.get("id") || "";
	const planNameParam = searchParams.get("planName");
	const targetCycle = searchParams.get("targetCycle");
	const updateTime = searchParams.get("updateTime");
	const remark = searchParams.get("remark");
	const responsibleUserId = searchParams.get("responsibleUserId");
	const [, setReloadSignal] = useState<number>(0);
	const [treeReloadSignal, setTreeReloadSignal] = useState<number>(0);
	const shouldResetExpansionRef = React.useRef(true);
	const importChildInputRef = React.useRef<HTMLInputElement>(null);
	const importRootInputRef = React.useRef<HTMLInputElement>(null);
	const [childImportDropdownOpen, setChildImportDropdownOpen] = useState(false);
	const [selectedImportHeads, setSelectedImportHeads] = useState<string[]>([]);
	const [rootImportDropdownOpen, setRootImportDropdownOpen] = useState(false);
	const [selectedRootImportHeads, setSelectedRootImportHeads] = useState<string[]>([]);
	const [form] = Form.useForm();
	const { token } = theme.useToken();
	const user = useUserStore((state) => state);

	// #region 1. 状态定义 (State)

	// ----------------- 主表格(Root)相关 -----------------
	const {
		columns,
		setColumns,
		tableData,
		setTableData,
		expandedRowKeys,
		setExpandedRowKeys,
		loadDetailData: loadDetailDataFromHook,
		handleValueChange: handleValueChangeFromHook,
	} = useRootTableData(planId);

	// ----------------- 左侧树相关 -----------------
	const {
		treeData,
		setTreeData,
		search,
		setSearch,
		selectedKey,
		setSelectedKey,
		expandedKeys,
		setExpandedKeys,
		selectedNode,
		isRootSelected,
		removeVerifiedLabel: removeVerifiedLabelFromTree,
	} = useTreeData();

	// ----------------- 子级表格(Child)相关 -----------------
	const [childReloadSignal, setChildReloadSignal] = useState<number>(0);
	const {
		childTableData,
		childTableLoading,
		hasMore,
		childTableParams,
		setChildTableParams,
		aFetchedCount,
		summaryData,
		basicIndicatorConfigs,
		periodConfigs,
		indicatorUnitName,
		handleChildTableChange,
		refreshRow: refreshRowFromHook,
		loadingRef,
	} = useChildTableData(selectedKey, isRootSelected, childReloadSignal);

	const childTableDataRef = React.useRef(childTableData);
	useEffect(() => {
		childTableDataRef.current = childTableData;
	}, [childTableData]);

	// ----------------- 顶部统计/占位区状态 -----------------
	const {
		fieldObj,
		setFieldObj,
		fieldSubLeft,
		setFieldSubLeft,
		fieldIndicator,
		setFieldIndicator,
		fieldTarget,
		setFieldTarget,
		fieldGap,
		setFieldGap,
		fieldGapDesc,
		setFieldGapDesc,
		setCheckStatus,
		boxHeight,
		setBoxHeight,
		validateFailed,
		setValidateFailed,
	} = useFieldStats();

	// ----------------- 弹窗/抽屉状态 -----------------
	// 拆解子目标 Modal
	const [disassembleModalOpen, setDisassembleModalOpen] = useState(false);
	const [currentRecordForDisassemble, setCurrentRecordForDisassemble] = useState<any>(null);
	// 主责人 Modal
	const [mainResponsibleModalOpen, setMainResponsibleModalOpen] = useState(false);
	const [editingResponsibleRow, setEditingResponsibleRow] = useState<any>(null);
	// 提交抽屉
	const [submitDrawerOpen, setSubmitDrawerOpen] = useState(false);
	// 协作人抽屉
	const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
	// 指标配置抽屉
	const [indicatorConfigDrawerOpen, setIndicatorConfigDrawerOpen] = useState(false);
	const [indicatorConfigRecord] = useState<any>(null);
	// 参考值抽屉
	const [referenceDrawerOpen, setReferenceDrawerOpen] = useState(false);
	const [currentReferenceRecord, setCurrentReferenceRecord] = useState<any>(null);
	// 双算抽屉
	const [doubleCountingDrawerOpen, setDoubleCountingDrawerOpen] = useState(false);
	const [doubleCountingListOverviewId, setDoubleCountingListOverviewId] = useState<
		number | string | null
	>(null);
	const [doubleCountingHeader, setDoubleCountingHeader] = useState<{
		decomposeObject?: string;
		targetValue?: number;
	} | null>(null);
	// 变动提醒抽屉
	const [changeReminderDrawerOpen, setChangeReminderDrawerOpen] = useState(false);
	const [changeReminderList, setChangeReminderList] = useState<any[]>([]);
	const [changeReminderLoading, setChangeReminderLoading] = useState(false);
	const [changeReminderCount, setChangeReminderCount] = useState(0);

	// 拉取变动提醒列表
	const loadChangeReminderList = async () => {
		if (!planId) return;
		setChangeReminderLoading(true);
		try {
			const resp = await noticeChange(Number(planId));
			setChangeReminderList(resp?.data ?? []);
		} catch (e) {
			console.error("noticeChange failed", e);
		} finally {
			setChangeReminderLoading(false);
		}
	};

	// 拉取变动提醒统计（徽标数字）
	const loadChangeReminderCount = async () => {
		if (!planId) return;
		try {
			const resp = await noticeChangeCount(Number(planId));
			setChangeReminderCount(Number(resp?.data ?? 0));
		} catch (e) {
			console.error("noticeChangeCount failed", e);
		}
	};

	// 锁定状态管理
	const {
		lockStatus,
		curEditor,
		curEditorName,
		updateLockStatus,
		acquireLock: acquireLockFromHook,
		releaseLock: releaseLockFromHook,
	} = useLockStatus(user.id);

	const [gapModalOpen, setGapModalOpen] = useState(false);
	const [tempGapReason, setTempGapReason] = useState("");

	// #endregion

	// #region 2. 计算属性 (Computed / Memo)

	const summaryParentSummaryWeight = useMemo(() => {
		const walk = (nodes: Row[]): number => {
			let min = 100;
			nodes.forEach((node) => {
				const val = Number(node.parentSummaryWeight ?? 100);
				if (!Number.isNaN(val)) min = Math.min(min, val);
				if (node.children && node.children.length > 0) {
					min = Math.min(min, walk(node.children));
				}
			});
			return min;
		};
		if (!childTableData || childTableData.length === 0) return 100;
		return walk(childTableData);
	}, [childTableData]);

	const summaryRow = useMemo(() => {
		if (!summaryData) return null;

		const periodicReporting: Record<string, any> = {};
		if (summaryData.period) {
			Object.entries(summaryData.period).forEach(([key, value]) => {
				periodicReporting[key] = {
					resultValue: value,
					periodCode: Number(key),
				};
			});
		}

		return {
			id: "SUMMARY_ROW",
			targetOrgName: "汇总",
			isSummary: true,
			annualTargetValue: summaryData.annualTargetSum,
			deviationValue: summaryData.deviationSum,
			referenceValue: summaryData.referenceSum,
			samePeriodValue: summaryData.samePeriodSum,
			parentSummaryWeight: summaryParentSummaryWeight,
			periodicReporting,
		} as unknown as Row;
	}, [summaryData, summaryParentSummaryWeight]);

	const gapValue = useMemo(() => {
		const target = Number(fieldTarget) || 0;
		const currentTotal = summaryRow?.annualTargetValue || 0;
		return Math.max(0, target - currentTotal);
	}, [fieldTarget, summaryRow]);

	// #endregion

	// #region 3. 数据加载 (Data Loading)

	const refreshRow = async (recordId: any) => {
		const upperData = await refreshRowFromHook(recordId);

		// 刷新右上角方块数据
		if (upperData) {
			setFieldObj(upperData.targetOrgName || "");
			setFieldSubLeft(String(upperData.targetOrgNum ?? ""));
			setFieldIndicator(upperData.indicatorName || "");
			setFieldTarget(String(upperData.targetValue ?? ""));
			setFieldGap(String(upperData.targetGap ?? ""));
			setFieldGapDesc(upperData.gapReason || "");
			setCheckStatus(upperData.checkStatus);
		}
	};

	/**
	 * 加载主表格详情数据 (Root View)
	 */
	const loadDetailData = loadDetailDataFromHook;

	const fetchDisassembleTree = async () => {
		if (!planId || !currentRecordForDisassemble?.targetOrgCode) return [];
		const res: any = await fetchSubmitUserIndicatorDisassembleSubTree({
			effTaskIndicatorSubmitUserId: planId,
			targetOrgCode: currentRecordForDisassemble.targetOrgCode,
		});
		const data = res.data;
		if (data) {
			// 转换数据结构以适配 Tree 组件
			const transform = (node: any): any => ({
				title: node.name,
				key: node.id || node.code || String(Math.random()), // 确保有 key
				children: node.children ? node.children.map(transform) : [],
				disabled: !node.canChoose, // 根据 canChoose 控制是否可选
				...node,
			});
			return [transform(data)];
		}
		return [];
	};

	// #endregion

	// #region 4. 事件处理 (Event Handlers)

	const handleOpenDisassembleModal = (record: any) => {
		setCurrentRecordForDisassemble(record);
		setDisassembleModalOpen(true);
	};

	const handleSubmit = () => {
		if (isRootSelected) {
			setSubmitDrawerOpen(true);
			return;
		}
		// const hasGap = gapValue > 0;
		// if (hasGap && (!fieldGapDesc || fieldGapDesc.trim() === "")) {
		// 	setBoxHeight(88);
		// 	setValidateFailed(true);
		// 	return;
		// }
		setBoxHeight(66);
		setSubmitDrawerOpen(true);
	};

	const handleValueChange = handleValueChangeFromHook;

	const applyRootLinkedValues = (
		rowKey: React.Key | undefined,
		linkedMap: SubmitUserIndicatorAnnualTargetValueRes,
	) => {
		if (!rowKey || !linkedMap || Object.keys(linkedMap).length === 0) return;

		const updateNodes = (nodes: any[]): any[] => {
			return nodes.map((node) => {
				const hasChildren = Array.isArray(node?.children) && node.children.length > 0;

				if (node?.key !== rowKey) {
					if (!hasChildren) return node;
					return {
						...node,
						children: updateNodes(node.children),
					};
				}

				const currentMap = node?.mapMap;
				if (!currentMap || typeof currentMap !== "object") {
					if (!hasChildren) return node;
					return {
						...node,
						children: updateNodes(node.children),
					};
				}

				const nextMap = { ...currentMap };
				Object.entries(currentMap).forEach(([indicatorKey, cellData]: [string, any]) => {
					if (!cellData || typeof cellData !== "object") return;

					const idKey = String(cellData.id ?? "");
					if (idKey && Object.prototype.hasOwnProperty.call(linkedMap, idKey)) {
						nextMap[indicatorKey] = {
							...cellData,
							totalTargetAmount: linkedMap[idKey],
						};
						return;
					}

					if (Object.prototype.hasOwnProperty.call(linkedMap, indicatorKey)) {
						nextMap[indicatorKey] = {
							...cellData,
							totalTargetAmount: linkedMap[indicatorKey],
						};
					}
				});

				if (!hasChildren) {
					return {
						...node,
						mapMap: nextMap,
					};
				}

				return {
					...node,
					mapMap: nextMap,
					children: updateNodes(node.children),
				};
			});
		};

		setTableData((prev) => updateNodes(prev));
	};

	const onSelectTree = (keys: React.Key[]) => {
		const k = keys && keys[0] ? String(keys[0]) : null;
		setSelectedKey(k);
	};

	/**
	 * 处理拆解子目标确认
	 */
	const handleDisassembleOk = async (nodes: any[]) => {
		if (nodes.length === 0) {
			message.warning("请选择拆解对象");
			return false;
		}

		const targetOrgConfig: Record<string, { targetOrgName: string; fullRoadStrength: string }> =
			{};
		nodes.forEach((node) => {
			const key = node.key || node.id;
			const title = node.title || node.name;
			if (key && title) {
				targetOrgConfig[key] = {
					targetOrgName: title,
					fullRoadStrength: node.fullRoadStrength || key,
				};
			}
		});

		const payload = {
			effTaskIndicatorSubmitUserId: planId,
			targetOrgConfig,
		};

		try {
			const res: any = await submitSubmitUserIndicatorDisassembleSub(payload as any);
			if (res.code === 200) {
				setDisassembleModalOpen(false);
				if (isRootSelected) {
					loadDetailData();
				}
				return true;
			}
			return false;
		} catch (e) {
			console.error(e);
			message.error("保存失败");
			return false;
		}
	};

	/**
	 * 处理主责人选择确认
	 */
	const handleMainResponsibleModalClose = async (res?: any) => {
		setMainResponsibleModalOpen(false);
		if (!res || !editingResponsibleRow) return;

		const items: any[] = Array.isArray(res) ? res : [res];
		if (items.length === 0) return;
		const person = items[0];

		try {
			const resp = await upResponsiblePersonMsg({
				targetOrgCode: editingResponsibleRow.targetOrgCode,
				responsiblePersonId: person.id,
				responsiblePersonName: person.name,
				effTaskIndicatorSubmitUserId: planId,
			});
			if (resp && resp.code === 200) {
				// 刷新根表数据
				loadDetailData();
				removeVerifiedLabelFromTree();
			}
		} catch (e) {
			console.error(e);
		} finally {
			setEditingResponsibleRow(null);
		}
	};

	const handleSaveReferenceValue = async (
		updates: any[],
		options?: { isFloatMode?: boolean },
	) => {
		try {
			if (!options?.isFloatMode) {
				await Promise.all(
					updates.map((u) =>
						submitSubmitUserIndicatorBasicChange({ id: u.id, value: Number(u.value) }),
					),
				);
			}
			message.success("保存成功");
			// 仅刷新受影响的行，而非整个表格
			if (currentReferenceRecord?.id) {
				await refreshRow(currentReferenceRecord.id);
			}
			removeVerifiedLabelFromTree();
		} catch (e) {
			console.error(e);
		}
	};

	const doCheck = async (reason: string | null) => {
		if (!selectedKey) return;
		try {
			const res: any = await submitUserIndicatorChildCheck(selectedKey, reason);
			if (res === true || res?.code === 200) {
				setValidateFailed(false);
				setBoxHeight(66);
				shouldResetExpansionRef.current = false;
				setTreeReloadSignal((s) => s + 1);
				if (reason !== null) {
					setFieldGapDesc(reason);
				}
			} else {
				setValidateFailed(true);
			}
		} catch (e) {
			console.error(e);
			message.error("校验请求失败");
		}
	};

	const handleExport = async () => {
		// 4. 调用导出 API
		const heads = [
			{
				tableHeadCode: "serialNumber",
				tableHeadName: "序号",
			},
			{
				tableHeadCode: "orgCodeStatusStr",
				tableHeadName: "标签",
			},
			...exportTableHead,
		];
		try {
			await commonExport({
				excelId: Number(7),
				reqCondition: {
					indicatorListId: Number(selectedKey),
				},
				exportTableHead: heads,
			});
		} catch (error) {
			console.error("导出失败:", error);
		}
	};

	const handleImportClick = () => {
		if (!selectedKey) {
			message.warning("请先选择子指标");
			return;
		}
		if (selectedImportHeads.length === 0) {
			message.warning("请至少选择一个导入字段");
			return;
		}
		setChildImportDropdownOpen(false);
		importChildInputRef.current?.click();
	};

	const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const validTypes = [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		];
		if (!validTypes.includes(file.type)) {
			message.error("请选择Excel文件（.xls 或 .xlsx）");
			event.target.value = "";
			return;
		}

		try {
			const extMapStr = JSON.stringify({
				effTaskIndicatorSubmitIndicatorListId: Number(selectedKey),
				importHead: selectedImportHeads,
			});
			await strategyExcelDataImport({
				templateId: 4,
				extMapStr,
				file,
			});
			setTreeReloadSignal((s) => s + 1);
			setChildReloadSignal((s) => s + 1);
			setChildTableParams((prev) => ({ ...prev, pageNum: 1 }));
		} catch (e) {
			console.error("导入失败:", e);
		} finally {
			event.target.value = "";
		}
	};

	const handleExportRoot = async () => {
		// 4. 调用导出 API
		const heads = [
			{
				tableHeadCode: "serialNumber",
				tableHeadName: "序号",
			},
			{
				tableHeadCode: "orgCodeStatusStr",
				tableHeadName: "标签",
			},
			...rootExportTableHead,
		];

		try {
			await commonExport({
				excelId: Number(6),
				reqCondition: {
					effTaskIndicatorSubmitUserId: Number(planId),
				},
				exportTableHead: heads,
			});
		} catch (error) {
			console.error("导出失败:", error);
		}
	};

	const handleImportRootClick = () => {
		if (!planId) {
			message.warning("未获取到计划ID");
			return;
		}
		if (selectedRootImportHeads.length === 0) {
			message.warning("请至少选择一个导入字段");
			return;
		}
		setRootImportDropdownOpen(false);
		importRootInputRef.current?.click();
	};

	const handleImportRootFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const validTypes = [
			"application/vnd.ms-excel",
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		];
		if (!validTypes.includes(file.type)) {
			message.error("请选择Excel文件（.xls 或 .xlsx）");
			event.target.value = "";
			return;
		}

		try {
			const extMapStr = JSON.stringify({
				effTaskIndicatorSubmitUserId: Number(planId),
				fields: selectedRootImportHeads,
			});
			await strategyExcelDataImport({
				templateId: 3,
				extMapStr,
				file,
			});
			loadDetailData();
			setTreeReloadSignal((s) => s + 1);
		} catch (e) {
			console.error("导入失败:", e);
		} finally {
			event.target.value = "";
		}
	};

	// #endregion

	// #region 5. 副作用 (Effects)

	// 默认选中第一个节点
	useEffect(() => {
		if (treeData && treeData.length > 0 && !selectedKey) {
			const first = treeData[0];
			onSelectTree([first.key]);
			setExpandedKeys([first.key]);
		}
	}, [treeData, selectedKey]);

	// 根节点选中时触发刷新信号
	useEffect(() => {
		if (isRootSelected && selectedKey) {
			setReloadSignal((s) => s + 1);
		}
	}, [isRootSelected, selectedKey]);

	// 根节点选中时加载数据
	useEffect(() => {
		if (isRootSelected) {
			loadDetailData();
		}
	}, [isRootSelected, planId]);

	// 选中非根节点时更新右上角统计数据和锁定状态
	useEffect(() => {
		if (!selectedKey || isRootSelected) {
			// 清空方块数据
			setFieldObj("");
			setFieldSubLeft("");
			setFieldIndicator("");
			setFieldTarget("");
			setFieldGap("");
			setFieldGapDesc("");
			return;
		}

		// 重置 UI 状态
		setFieldGapDesc("");
		setBoxHeight(66);
		setValidateFailed(false);

		// 获取右侧上方6个方块的具体数据和锁定状态
		fetchSubmitUserIndicatorDetailUpperRight(selectedKey).then((res: any) => {
			if (res && res.data) {
				const d = res.data;
				setFieldObj(d.targetOrgName || "");
				setFieldSubLeft(String(d.targetOrgNum ?? ""));
				setFieldIndicator(d.indicatorName || "");
				setFieldTarget(String(d.targetValue ?? ""));
				setFieldGap(String(d.targetGap ?? ""));
				setFieldGapDesc(d.gapReason || "");
				setCheckStatus(d.checkStatus);
				updateLockStatus(d);
			}
		});
	}, [selectedKey, isRootSelected]);

	// 监听滚动加载下一页
	useEffect(() => {
		const tableBody = document.querySelector(".red-header-table .ant-table-body");
		if (!tableBody) return;

		const handleScroll = (e: any) => {
			const { scrollTop, scrollHeight, clientHeight } = e.target;
			// 距离底部 20px 时触发加载
			if (scrollHeight - scrollTop - clientHeight < 20) {
				// 检查当前一级节点数量是否达到分页总条数
				const currentLevel1Count = aFetchedCount;
				const expectedCount = childTableParams.pageNum * childTableParams.pageSize;

				if (!loadingRef.current && hasMore && currentLevel1Count >= expectedCount) {
					setChildTableParams((prev) => ({ ...prev, pageNum: prev.pageNum + 1 }));
				}
			}
		};

		tableBody.addEventListener("scroll", handleScroll);

		// Check immediately if content is short enough to need more data
		if (tableBody.scrollHeight <= tableBody.clientHeight + 20) {
			const currentLevel1Count = aFetchedCount;
			const expectedCount = childTableParams.pageNum * childTableParams.pageSize;

			if (
				!loadingRef.current &&
				hasMore &&
				childTableData.length > 0 &&
				currentLevel1Count >= expectedCount
			) {
				setChildTableParams((prev) => ({ ...prev, pageNum: prev.pageNum + 1 }));
			}
		}

		return () => tableBody.removeEventListener("scroll", handleScroll);
	}, [aFetchedCount, childTableData.length, hasMore, isRootSelected]);

	// 初始化加载树和主表格列
	useEffect(() => {
		if (planId) {
			const splitNode = (
				<span
					style={{
						display: "inline-block",
						width: 1,
						height: 14,
						background: "rgba(235,238,245,1)",
					}}
				/>
			);
			form.setFieldsValue({ planId, planName: `计划 #${planId}`, value: "", note: "" });
			loadChangeReminderList();
			loadChangeReminderCount();
			fetchSubmitUserIndicatorTree(planId).then((res: UserIndicatorTreeRes[]) => {
				// 1. 生成动态列
				const dynamicCols = (res || []).map((dept: any, index: number) => ({
					title: dept.responsibleDepartment,
					children: (dept.innerDetailList || []).map((ind: any) => ({
						title: ind.unitName ? `${ind.name}（${ind.unitName}）` : ind.name,
						key: String(ind.id),
						width: 120,
						render: (_: any, record: any) => {
							if (record.isHeaderRow) {
								return (
									<span
										className="cursor-pointer text-blue-500"
										onClick={() => {
											setSelectedKey(String(ind.id));
											const deptKey = `dept-${index}-${dept.responsibleDepartment}`;
											setExpandedKeys((keys) => {
												const k = keys as React.Key[];
												if (!k.includes(deptKey)) {
													return [...k, deptKey];
												}
												return k;
											});
										}}
									>
										目标计划
									</span>
								);
							}
							// mapMap key is indicator id
							const cellData = record.mapMap?.[ind.id];
							if (!cellData) {
								return (
									<InputNumber
										disabled
										value={undefined}
										style={{ width: "100%" }}
									/>
								);
							}

							const { totalTargetAmount, totalTargetAmountChange } = cellData;
							// totalTargetAmountChange: 0:不允许 1:允许
							const isReadOnly = totalTargetAmountChange === 0;

							return (
								<InputNumber
									value={totalTargetAmount ?? undefined}
									disabled={isReadOnly}
									style={{ width: "100%" }}
									controls={false}
									onChange={(val) => handleValueChange(val, record, ind.id)}
									onBlur={async () => {
										if (cellData?.id) {
											const currentValue = cellData.totalTargetAmount;
											const payloadValue =
												currentValue === undefined ||
												currentValue === null ||
												String(currentValue).trim() === ""
													? null
													: Number(currentValue);
											const payload: any = {
												id: cellData.id,
												value: payloadValue,
												childFlag: false,
											};
											const res =
												await submitSubmitUserIndicatorAnnualTargetValue(
													payload,
												);
											if (res?.data && typeof res.data === "object") {
												applyRootLinkedValues(record.key, res.data);
											}
										}
									}}
								/>
							);
						},
					})),
				}));

				const baseCols = [
					{
						title: "拆解对象",
						dataIndex: "targetOrgName",
						key: "targetOrgName",
						width: 300,
						fixed: "left",
						render: (v: any, record: any) => {
							if (record.isHeaderRow) return "";

							const status = (record as any).orgCodeStatus;
							const statusText = (record as any).orgCodeStatusStr;

							const tagStyle: React.CSSProperties = {
								marginRight: 4,
								flexShrink: 0,
							};

							let mergedTagStyle = tagStyle;
							let tagColor: string | undefined = "blue";

							if (status === "DELIVERPROJ") {
								tagColor = undefined;
								mergedTagStyle = {
									...tagStyle,
									backgroundColor: "rgba(235, 238, 245, 1)",
									color: "#000000",
									border: 0,
								};
							} else if (status === "QUITPROJ") {
								tagColor = undefined;
								mergedTagStyle = {
									...tagStyle,
									backgroundColor: "rgba(235, 238, 245, 1)",
									color: "rgba(192, 196, 204, 1)",
									border: 0,
								};
							}

							return (
								<span
									style={{
										display: "inline-flex",
										alignItems: "center",
										maxWidth: "100%",
										// verticalAlign: "middle",
										transform: status ? "translateY(-10px)" : "translateY(2px)",
									}}
								>
									{status && (
										<Tag color={tagColor} style={mergedTagStyle}>
											{statusText}
										</Tag>
									)}
									<span
										title={v ? String(v) : ""}
										style={{
											flex: 1,
											minWidth: 0,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
											display: "inline-block",
										}}
									>
										{v}
									</span>
								</span>
							);
						},
					},
					{
						title: (
							<span>
								<span style={{ color: "red" }}>* </span>
								负责人
							</span>
						),
						dataIndex: "responsiblePersonName",
						key: "responsiblePersonName",
						width: 120,
						render: (text: string, record: Row) => {
							if ((record as any).isHeaderRow) return null;

							const isDoubleCounting = (record as any).doubleCountingRecord === 1;

							const openModal = () => {
								setEditingResponsibleRow(record);
								setMainResponsibleModalOpen(true);
							};

							return (
								<Input
									status={
										validateFailed && !record.responsiblePersonName
											? "error"
											: ""
									}
									value={record.responsiblePersonName}
									suffix={
										<EditOutlined
											style={{
												color:
													lockStatus === 0 || isDoubleCounting
														? "rgba(0,0,0,0.25)"
														: "rgba(0,0,0,0.45)",
												cursor:
													lockStatus === 0 || isDoubleCounting
														? "not-allowed"
														: "pointer",
											}}
											onClick={
												lockStatus === 0 || isDoubleCounting
													? undefined
													: openModal
											}
										/>
									}
									onClick={openModal}
									style={{
										cursor:
											lockStatus === 0 || isDoubleCounting
												? "not-allowed"
												: "pointer",
									}}
								/>
							);
						},
					},
					{
						title: "主数据编码",
						dataIndex: "targetOrgCode",
						key: "targetOrgCode",
						width: 120,
						fixed: "left",
						render: (v: any, record: any) => {
							if (record.isHeaderRow) return "";
							return v || "";
						},
					},
					...dynamicCols,
					{
						title: "操作",
						key: "actions",
						width: 150,
						fixed: "right",
						render: (_: any, record: any) => {
							if (record.isHeaderRow) return "";
							return (
								<Space split={splitNode}>
									<Button
										type="link"
										className="px-1"
										onClick={() => handleOpenDisassembleModal(record)}
									>
										拆解子目标
									</Button>
									{!record.isRoot && (
										<Button
											type="link"
											className="px-1"
											onClick={() => {
												Modal.confirm({
													title: "确认删除",
													content: "确定要删除该子目标吗？",
													onOk: async () => {
														try {
															const res: any =
																await deleteChildIndicator({
																	targetOrgCodes: [
																		record.targetOrgCode,
																	],
																	effTaskIndicatorSubmitUserId:
																		Number(planId),
																});
															if (res.code === 200) {
																loadDetailData();
															}
														} catch (e) {
															console.error(e);
														}
													},
												});
											}}
										>
											删除
										</Button>
									)}
								</Space>
							);
						},
					},
				];
				setColumns(baseCols);

				// transform data to match Tree structure
				const formatted = (res || []).map((dept: any, index: number) => ({
					title: dept.responsibleDepartment,
					key: `dept-${index}-${dept.responsibleDepartment}`,
					selectable: false,
					children: (dept.innerDetailList || []).map((item: any) => ({
						title: item.name,
						key: String(item.id),
						...item,
					})),
					...dept,
				}));
				const rootNode = {
					title: "全部指标",
					key: "ALL_ROOT",
					children: formatted,
				};
				setTreeData([rootNode]);
				if (shouldResetExpansionRef.current) {
					setExpandedKeys(["ALL_ROOT"]);
				}
				shouldResetExpansionRef.current = true;
			});
		}
	}, [planId, form, treeReloadSignal]);

	// #endregion

	// #region 6. 渲染辅助 (Render Helpers)

	const childColumns: any[] = useMemo(() => {
		const periodCols = periodConfigs.map((p: any) => ({
			title: (
				<span>
					{indicatorUnitName ? `${p.name}（${indicatorUnitName}）` : p.name}
					<Tooltip title={p.desc}>
						<QuestionCircleOutlined
							style={{ marginLeft: 4, color: "rgba(0,0,0,0.45)", cursor: "pointer" }}
						/>
					</Tooltip>
				</span>
			),
			key: `period_${p.id}`,
			width: 140,
			render: (_: any, record: Row) => {
				const isDoubleCounting = (record as any).doubleCountingRecord === 1;
				const map = record.periodicReporting || {};
				const found = Object.values(map).find((item: any) => item.periodCode === p.id);
				const val = found ? (found as any).resultValue : undefined;
				if (record.isSummary) {
					const displayVal =
						val === undefined || val === null || val === "" ? "" : addThousand(val);
					return <span style={{ fontWeight: "bold" }}>{displayVal}</span>;
				}
				if (found && (found as any).supportModify === 1) {
					return (
						<EditableCell
							value={val}
							id={(found as any).id}
							disabled={lockStatus === 0 || isDoubleCounting}
							onSave={async (id, v) => {
								if (id) {
									const payloadValue =
										v === undefined || v === null || v === ""
											? null
											: Number(v);
									await submitSubmitUserIndicatorPeriod({
										id,
										value: payloadValue,
									});
									refreshRow(record.id);
									removeVerifiedLabelFromTree();
								}
							}}
						/>
					);
				}
				return val === undefined || val === null ? "" : val;
			},
		}));

		return [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 180,
				fixed: "left",
				render: (v: any, r: Row) => {
					if (r.isSummary) return <span style={{ fontWeight: "bold" }}>{v}</span>;

					const status = (r as any).orgCodeStatus;
					let tagStyle: React.CSSProperties = { marginRight: 4 };
					let tagColor: string | undefined = "blue";

					if (status === "DELIVERPROJ") {
						// 计划交付项目
						tagColor = undefined;
						tagStyle = {
							...tagStyle,
							backgroundColor: "rgba(235, 238, 245, 1)",
							color: "#000000",
							border: 0,
						};
					} else if (status === "QUITPROJ") {
						// 退出项目
						tagColor = undefined;
						tagStyle = {
							...tagStyle,
							backgroundColor: "rgba(235, 238, 245, 1)",
							color: "rgba(192, 196, 204, 1)",
							border: 0,
						};
					}

					return (
						<div style={{ display: "flex", alignItems: "center" }}>
							{status && (
								<Tag color={tagColor} style={tagStyle}>
									{(r as any).orgCodeStatusStr}
								</Tag>
							)}
							<Typography.Text ellipsis={{ tooltip: true }}>{v}</Typography.Text>
						</div>
					);
				},
			},
			{
				title: "主数据编码",
				dataIndex: "targetOrgCode",
				key: "targetOrgCode",
				width: 60,
				fixed: "left",
				render: (v: any, r: Row) => {
					if (r.isSummary) return "";
					return <Typography.Text ellipsis={{ tooltip: true }}>{v}</Typography.Text>;
				},
			},
			{
				title: (
					<span>
						同期值(
						{(selectedNode as any)?.unitName || ""})
					</span>
				),
				dataIndex: "samePeriodValue",
				key: "samePeriodValue",
				width: 140,
				render: (val: any, record: Row) => {
					if (record.isSummary) return null;
					return addThousand(record.samePeriodValue);
				},
			},
			{
				title: (
					<span>
						参考值(
						{(selectedNode as any)?.unitName || ""})
					</span>
				),
				dataIndex: "referenceValue",
				key: "referenceValue",
				width: 140,
				render: (t: any, record: Row) => {
					const val: any = record.referenceValue;
					if (record.isSummary)
						return <span style={{ fontWeight: "bold" }}>{addThousand(val ?? 0)}</span>;

					const isDoubleCounting = (record as any).doubleCountingRecord === 1;

					const isDisabled = lockStatus === 0 || isDoubleCounting || !val;

					const openDrawer = () => {
						if (isDisabled) return;
						setCurrentReferenceRecord(record);
						setReferenceDrawerOpen(true);
					};

					return (
						<Input
							value={addThousand(val)}
							readOnly
							disabled={isDisabled}
							suffix={
								<EditOutlined
									style={{
										color: isDisabled ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.45)",
										cursor: isDisabled ? "not-allowed" : "pointer",
									}}
									onClick={openDrawer}
								/>
							}
							onClick={openDrawer}
							style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
						/>
					);
				},
			},
			{
				title: targetCycle ? targetCycle.split("-")[1] : "年度",
				children: [
					{
						title: (
							<span>
								{`${targetCycle ? targetCycle.split("-")[1] : "年度"}目标值（${(selectedNode as any)?.unitName || ""}）`}
							</span>
						),
						dataIndex: "annualTargetValue",
						key: "annualTargetValue",
						width: 160,
						render: (v: any, r: Row) => {
							if (r.isSummary)
								return <span style={{ fontWeight: "bold" }}>{addThousand(v)}</span>;

							const isDoubleCounting = (r as any).doubleCountingRecord === 1;
							const canEditAnnualTarget = r.annualTargetValueChange === 1;

							const hasChildren = r.children && r.children.length > 0;
							let childrenSum = 0;
							if (hasChildren) {
								childrenSum = r.children!.reduce(
									(acc, curr) => acc + (Number(curr.annualTargetValue) || 0),
									0,
								);
							}

							return (
								<div style={{ display: "flex", alignItems: "center" }}>
									<InputNumber
										style={{ width: "100%" }}
										value={v}
										disabled={
											lockStatus === 0 ||
											isDoubleCounting ||
											!canEditAnnualTarget
										}
										onChange={(val) => {
											handleChildTableChange(val, r.id, "annualTargetValue");
										}}
										onBlur={async () => {
											if (
												lockStatus === 0 ||
												isDoubleCounting ||
												!canEditAnnualTarget
											) {
												return;
											}
											const payloadValue =
												r.annualTargetValue === undefined ||
												r.annualTargetValue === null ||
												String(r.annualTargetValue).trim() === ""
													? null
													: Number(r.annualTargetValue);
											const res: any =
												await submitSubmitUserIndicatorAnnualTargetValue({
													id: r.id,
													value: payloadValue,
												});
											if (res?.data !== undefined) {
												refreshRow(r.id);
												removeVerifiedLabelFromTree();
											}
										}}
									/>
									{hasChildren && (
										<Tooltip title={`下级汇总:${addThousand(childrenSum)}`}>
											<InfoCircleFilledIcon
												style={{
													marginLeft: 4,
													cursor: "pointer",
													width: 20,
													height: 20,
												}}
											/>
										</Tooltip>
									)}
								</div>
							);
						},
					},
					{
						title: `偏差（${(selectedNode as any)?.unitName || ""}）`,
						dataIndex: "deviationValue",
						key: "deviationValue",
						width: 120,
						render: (v: any, r: Row) => {
							const isRed = (r as any).deviationFormulaFlag === 1;
							return r.isSummary ? (
								<span
									style={{ fontWeight: "bold", color: isRed ? "red" : undefined }}
								>
									{addThousand(v)}
								</span>
							) : (
								<span style={{ color: isRed ? "red" : undefined }}>
									{addThousand(v)}
								</span>
							);
						},
					},
				],
			},
			// 动态周期列
			...(periodCols.length > 0 ? periodCols : []),
			{
				title: "上级汇总权重(%)",
				dataIndex: "parentSummaryWeight",
				key: "parentSummaryWeight",
				width: 140,
				render: (v: any, r: Row) => {
					if (r.isSummary)
						return <span>{addThousand(Number(r.parentSummaryWeight ?? 100))}</span>;
					const showDoubleCounting = true;
					const isDoubleCounting = (r as any).doubleCountingRecord === 1;
					const openDrawer = () => {
						if (!showDoubleCounting || isDoubleCounting) return;
						setDoubleCountingListOverviewId(r.id);
						setDoubleCountingHeader({
							decomposeObject: r.targetOrgName || "",
							targetValue: Number(r.annualTargetValue ?? 0),
						});
						setDoubleCountingDrawerOpen(true);
					};
					return (
						<Input
							value={addThousand(r.parentSummaryWeight ?? 0)}
							readOnly
							disabled={lockStatus === 0 || !showDoubleCounting || isDoubleCounting}
							suffix={
								<EditOutlined
									style={{
										color:
											lockStatus === 0 ||
											!showDoubleCounting ||
											isDoubleCounting
												? "rgba(0,0,0,0.25)"
												: "rgba(0,0,0,0.45)",
										cursor:
											lockStatus === 0 ||
											!showDoubleCounting ||
											isDoubleCounting
												? "not-allowed"
												: "pointer",
									}}
									onClick={openDrawer}
								/>
							}
							onClick={openDrawer}
							style={{
								cursor:
									lockStatus === 0 || !showDoubleCounting || isDoubleCounting
										? "not-allowed"
										: "pointer",
							}}
						/>
					);
				},
			},
			{
				title: "备注",
				dataIndex: "remarks",
				key: "remarks",
				width: 150,
				render: (v: any, r: Row) => {
					if (r.isSummary) return null;

					const isDoubleCounting = (r as any).doubleCountingRecord === 1;

					const hasChildren = r.children && r.children.length > 0;
					let childrenSum = 0;
					if (hasChildren) {
						childrenSum = r.children!.reduce(
							(acc, curr) => acc + (Number(curr.annualTargetValue) || 0),
							0,
						);
					}
					const isRemarkRequired =
						hasChildren && (Number(r.annualTargetValue) || 0) > childrenSum;

					return (
						<Input
							status={
								validateFailed &&
								isRemarkRequired &&
								(!r.remarks || r.remarks.trim() === "")
									? "error"
									: ""
							}
							placeholder={isRemarkRequired ? "必填" : undefined}
							value={r.remarks}
							disabled={lockStatus === 0 || isDoubleCounting}
							onChange={(e) => {
								handleChildTableChange(e.target.value, r.id, "remarks");
							}}
							onBlur={async () => {
								await submitSubmitUserIndicatorChild({
									id: r.id,
									remarks: r.remarks,
								});
								refreshRow(r.id);
								removeVerifiedLabelFromTree();
							}}
						/>
					);
				},
			},
			{
				title: "子目标数",
				dataIndex: "treeElement",
				key: "treeElement",
				width: 100,
				render: (v: any, r: Row) => (r.isSummary ? "" : addThousand(v)),
			},
			{
				title: "更新人",
				dataIndex: "updateByName",
				key: "updateByName",
				width: 100,
				render: (v: any, r: Row) => (r.isSummary ? "" : v || ""),
			},
			{
				title: "更新时间",
				dataIndex: "updateTime",
				key: "updateTime",
				width: 150,
				render: (v: any, r: Row) => (r.isSummary ? "" : v || ""),
			},
			{
				title: "状态",
				dataIndex: "statusStr",
				key: "statusStr",
				width: 100,
				render: (v: any, r: Row) => (r.isSummary ? "" : v || ""),
			},
		];
	}, [basicIndicatorConfigs, periodConfigs, indicatorUnitName, lockStatus, validateFailed]);

	const exportTableHead = useMemo(() => {
		return flattenExportHeads(childColumns);
	}, [childColumns]);

	const importFieldOptions = useMemo(() => {
		const annualTargetLabel = `${targetCycle ? targetCycle.split("-")[1] : "年度"}目标值（${(selectedNode as any)?.unitName || ""}）`;
		const periodLabels = periodConfigs.map((item: any) =>
			indicatorUnitName ? `${item.name}（${indicatorUnitName}）` : item.name,
		);

		return Array.from(new Set([annualTargetLabel, ...periodLabels, "备注"]));
	}, [targetCycle, selectedNode, periodConfigs, indicatorUnitName]);

	useEffect(() => {
		setSelectedImportHeads((prev) => {
			const optionSet = new Set(importFieldOptions);
			const nextSelected = prev.filter((item) => optionSet.has(item));
			return nextSelected.length > 0 ? nextSelected : importFieldOptions;
		});
	}, [importFieldOptions]);

	const rootExportTableHead = useMemo(() => {
		return flattenExportHeads(columns as any[]);
	}, [columns]);

	const rootImportFieldOptions = useMemo(() => {
		const labels: string[] = [];
		const walk = (list: any[]) => {
			list.forEach((col) => {
				if (col?.children && Array.isArray(col.children) && col.children.length > 0) {
					walk(col.children);
					return;
				}
				if (col?.key === "actions") return;
				const label = getTitleText(col?.title);
				if (label) labels.push(label.replaceAll("*", ""));
			});
		};
		walk((columns || []) as any[]);
		return Array.from(new Set(labels));
	}, [columns]);

	useEffect(() => {
		setSelectedRootImportHeads((prev) => {
			const optionSet = new Set(rootImportFieldOptions);
			const nextSelected = prev.filter((item) => optionSet.has(item));
			return nextSelected.length > 0 ? nextSelected : rootImportFieldOptions;
		});
	}, [rootImportFieldOptions]);

	const rootHeaderButtons = () => {
		return (
			<Space>
				<BasicButton onClick={handleExportRoot}>导出模板</BasicButton>
			</Space>
		);
	};

	const btns = (
		<div className="flex w-full">
			<div className="flex gap-2">
				{!isRootSelected && (
					<BasicButton
						onClick={async () => {
							setValidateFailed(true);
							const validationResult = validateChildTableData(childTableData);

							if (validationResult.hasError) {
								message.error(
									validationResult.errorMessage ||
										"已完成校验，提交前请先更正错误数据",
								);
								return;
							}

							const hasGap = gapValue > 0;
							if (hasGap) {
								setTempGapReason(fieldGapDesc || "");
								setGapModalOpen(true);
								return;
							}

							doCheck(fieldGapDesc);
						}}
					>
						校验
					</BasicButton>
				)}
				{!isRootSelected && (
					<>
						<BasicButton onClick={handleExport}>导出模板</BasicButton>
					</>
				)}
				{!isRootSelected && (
					<div className="flex items-center">
						<BasicButton
							onClick={async () => {
								if (!selectedKey) return;
								try {
									if (!curEditor) {
										// 当前是解锁，点击锁定
										await acquireLockFromHook(selectedKey);
									} else {
										// 当前是锁定，点击解锁
										await releaseLockFromHook(selectedKey);
									}
								} catch (e) {
									console.error(e);
								}
							}}
						>
							{curEditor ? "解锁" : "锁定"}
						</BasicButton>
						{curEditor ? (
							<span className="ml-4 text-sm">
								当前锁定人:
								{curEditorName}
							</span>
						) : (
							<div className="ml-4 text-sm text-red-500">
								当前为未锁定状态，如需编辑，请点击“锁定”按钮
							</div>
						)}
					</div>
				)}
			</div>
			<div className="ml-auto" style={{ position: "absolute", right: 123, top: 17 }}></div>
		</div>
	);

	const rootImportDropdownContent = (
		<div
			className="import-head-dropdown-panel ant-pro-table-column-setting-list w-max min-w-[200px] max-w-[400px] bg-white"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="ant-pro-table-column-setting-title import-head-dropdown-title">
				<Checkbox
					checked={
						rootImportFieldOptions.length > 0 &&
						selectedRootImportHeads.length === rootImportFieldOptions.length
					}
					indeterminate={
						selectedRootImportHeads.length > 0 &&
						selectedRootImportHeads.length < rootImportFieldOptions.length
					}
					onChange={(event) => {
						setSelectedRootImportHeads(
							event.target.checked ? rootImportFieldOptions : [],
						);
					}}
				>
					导入字段
				</Checkbox>
				<Button
					type="link"
					className="ant-pro-table-column-setting-action-rest-button px-0"
					onClick={() => setSelectedRootImportHeads(rootImportFieldOptions)}
				>
					全选
				</Button>
			</div>
			<div className="import-head-dropdown-options">
				{rootImportFieldOptions.map((name) => (
					<label
						key={name}
						className="ant-pro-table-column-setting-list-item import-head-dropdown-option whitespace-nowrap"
					>
						<Checkbox
							checked={selectedRootImportHeads.includes(name)}
							onChange={(event) => {
								setSelectedRootImportHeads((prev) => {
									if (event.target.checked && prev.includes(name)) return prev;
									if (event.target.checked) return [...prev, name];
									return prev.filter((item) => item !== name);
								});
							}}
						>
							{name}
						</Checkbox>
					</label>
				))}
			</div>
			<Divider className="my-3" />
			<div className="import-head-dropdown-footer">
				<Button block type="primary" onClick={handleImportRootClick}>
					选择导入文件
				</Button>
			</div>
		</div>
	);

	const childImportDropdownContent = (
		<div
			className="import-head-dropdown-panel ant-pro-table-column-setting-list w-max min-w-[200px] max-w-[400px] bg-white"
			onClick={(e) => e.stopPropagation()}
		>
			<div className="ant-pro-table-column-setting-title import-head-dropdown-title">
				<Checkbox
					checked={
						importFieldOptions.length > 0 &&
						selectedImportHeads.length === importFieldOptions.length
					}
					indeterminate={
						selectedImportHeads.length > 0 &&
						selectedImportHeads.length < importFieldOptions.length
					}
					onChange={(event) => {
						setSelectedImportHeads(event.target.checked ? importFieldOptions : []);
					}}
				>
					导入字段
				</Checkbox>
				<Button
					type="link"
					className="ant-pro-table-column-setting-action-rest-button px-0"
					onClick={() => setSelectedImportHeads(importFieldOptions)}
				>
					全选
				</Button>
			</div>
			<div className="import-head-dropdown-options">
				{importFieldOptions.map((name) => (
					<label
						key={name}
						className="ant-pro-table-column-setting-list-item import-head-dropdown-option whitespace-nowrap"
					>
						<Checkbox
							checked={selectedImportHeads.includes(name)}
							onChange={(event) => {
								setSelectedImportHeads((prev) => {
									if (event.target.checked && prev.includes(name)) return prev;
									if (event.target.checked) return [...prev, name];
									return prev.filter((item) => item !== name);
								});
							}}
						>
							{name}
						</Checkbox>
					</label>
				))}
			</div>
			<Divider className="my-3" />
			<div className="import-head-dropdown-footer">
				<Button block type="primary" onClick={handleImportClick}>
					选择导入文件
				</Button>
			</div>
		</div>
	);

	const finalChildTableData = useMemo(() => {
		return summaryRow ? [summaryRow, ...childTableData] : childTableData;
	}, [summaryRow, childTableData]);

	// #endregion

	// #region 7. 渲染 (Render)

	return (
		<BasicContent className="relative h-full pl-4 pr-0 pt-4">
			<div className="w-full overflow-y-auto">
				{/* header 区域 */}
				<div className="mb-2">
					<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
						<div>
							<Title
								level={4}
								style={{ margin: 0, fontWeight: 700, fontSize: 20 }}
							>{`${planNameParam || planId || "获取计划名称失败"}`}</Title>
						</div>
						<div
							style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}
							className="gap-8"
						>
							<div style={{ fontSize: 14 }}>
								<Text type="secondary" className="mr-4">
									目标周期
								</Text>
								<span style={{ fontWeight: 500, color: "#000" }}>
									{targetCycle || "-"}
								</span>
							</div>
							<div style={{ fontSize: 14 }}>
								<Text type="secondary" className="mr-4">
									上次编辑时间
								</Text>
								<span style={{ fontWeight: 500, color: "#000" }}>
									{updateTime || "-"}
								</span>
							</div>
							<div style={{ fontSize: 14 }}>
								<Text type="secondary" className="mr-4">
									填报说明
								</Text>
								<span style={{ fontWeight: 500, color: "#000" }}>
									{remark || "-"}
								</span>
							</div>
						</div>
					</div>
				</div>

				<Divider className="mb-4 mt-0" />

				{/* 内容区（左右排列，非 flex） */}
				<div style={{ position: "relative" }}>
					{/* 左侧树 */}
					<TreePanel
						treeData={treeData}
						selectedKeys={selectedKey ? [selectedKey] : []}
						expandedKeys={expandedKeys}
						onSelect={onSelectTree}
						onExpand={setExpandedKeys}
						search={search}
						onSearchChange={setSearch}
					/>

					{/* 右侧动态内容 */}
					<div style={{ marginLeft: 240 }}>
						{isRootSelected ? (
							<div className="right-hide">
								<style>
									{`.right-hide .ant-pro-query-filter-container{display:none !important;} .right-hide .ant-pro-table-search-query-filter{display:none !important;} .right-hide [class*="query-filter"]{display:none !important;}
										.right-hide .ant-pro-card-border{border:none!important}
										`}
								</style>
								<style>
									{`
											.red-header-table .ant-table-thead > tr > th {
												border-color: rgba(228, 231, 237, 1) !important;
											}
											.red-header-table .ant-table-body::-webkit-scrollbar {
												display: none;
											}
											.red-header-table .ant-table-body {
												scrollbar-width: none;
												-ms-overflow-style: none;
											}
											.import-head-dropdown-overlay .ant-pro-table-column-setting-overlay,
											.import-head-dropdown-overlay .ant-pro-table-column-setting-list {
												padding: 0;
												border-radius: 8px;
												overflow: hidden;
												box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18), 0 6px 16px rgba(0, 0, 0, 0.12);
											}
											.import-head-dropdown-overlay .import-head-dropdown-title {
												display: flex;
												align-items: center;
												justify-content: space-between;
												padding: 12px 16px;
												border-bottom: 1px solid #f0f0f0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-options {
												max-height: 240px;
												overflow-y: auto;
												padding: 8px 0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-option {
												display: flex;
												align-items: center;
												padding: 6px 16px;
												margin: 0;
												cursor: pointer;
												transition: background-color 0.2s;
											}
											.import-head-dropdown-overlay .import-head-dropdown-option:hover {
												background: rgba(0, 0, 0, 0.04);
											}
											.import-head-dropdown-overlay .import-head-dropdown-option .ant-checkbox-wrapper {
												width: 100%;
												margin-inline-start: 0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-footer {
												padding: 0 16px 16px;
											}
										`}
								</style>
								<BasicTable
									className="red-header-table"
									size="small"
									columns={columns}
									dataSource={tableData}
									rowKey="key"
									bordered
									expandable={{
										expandedRowKeys,
										onExpandedRowsChange: (keys) =>
											setExpandedRowKeys(keys as React.Key[]),
										expandIcon: ({ expanded, onExpand, record }: any) => {
											if (!record.children || record.children.length === 0) {
												return (
													<span
														style={{
															display: "inline-block",
															width: 24,
															marginRight: 8,
														}}
													/>
												);
											}
											return (
												<div
													onClick={(e) => onExpand(record, e)}
													style={{
														display: "inline-flex",
														alignItems: "center",
														justifyContent: "center",
														width: 16,
														height: 16,
														border: "1px solid #d9d9d9",
														borderRadius: 2,
														cursor: "pointer",
														marginRight: 16,
														backgroundColor: "#fff",
														verticalAlign: "middle",
													}}
												>
													{expanded ? (
														<MinusOutlined
															style={{
																fontSize: 10,
																color: "rgba(0,0,0,0.85)",
															}}
														/>
													) : (
														<PlusOutlined
															style={{
																fontSize: 10,
																color: "rgba(0,0,0,0.85)",
																strokeWidth: 40,
																stroke: "currentColor",
															}}
														/>
													)}
												</div>
											);
										},
									}}
									pagination={{ pageSize: 10 }}
									// scroll={{ x: 1200, y: undefined }}
									headerTitle={rootHeaderButtons()}
									toolBarRender={() => {
										return [
											<span
												key="change-reminder-badge"
												style={{
													position: "relative",
													display: "inline-block",
												}}
											>
												<BasicButton
													onClick={() =>
														setChangeReminderDrawerOpen(true)
													}
												>
													变动提醒
												</BasicButton>
												{changeReminderCount > 0 && (
													<Badge
														count={changeReminderCount}
														size="small"
														style={{
															position: "absolute",
															top: -22,
															right: -6,
															zIndex: 1,
															boxShadow: "0 0 0 1px #fff",
														}}
													/>
												)}
											</span>,
											<Dropdown
												key="root-import-btn"
												trigger={["click"]}
												open={rootImportDropdownOpen}
												onOpenChange={(open) => {
													if (open && !planId) {
														message.warning("未获取到计划ID");
														return;
													}
													setRootImportDropdownOpen(open);
												}}
												overlayClassName="ant-pro-table-column-setting-overlay import-head-dropdown-overlay"
												dropdownRender={() => rootImportDropdownContent}
											>
												<BasicButton
													icon={
														<ImportIcon
															width={14}
															height={14}
															style={{ transform: "translateY(1px)" }}
														/>
													}
												>
													导入
												</BasicButton>
											</Dropdown>,
										];
									}}
									adaptive={{
										offsetBottom: 56,
									}}
									options={{
										...TABLE_CONFIG.OPTIONS,
										setting: {
											settingIcon: <BasicButton>列表选项</BasicButton>,
										},
									}}
								/>
							</div>
						) : (
							<div
								className="px-2"
								style={{
									position: "relative",
									minHeight: 240,
									height: "calc(100vh - 200px)",
								}}
							>
								{/* 六个横向方块区域 */}
								<StatsCards
									boxHeight={boxHeight}
									fieldObj={fieldObj}
									fieldSubLeft={fieldSubLeft}
									fieldIndicator={fieldIndicator}
									fieldTarget={fieldTarget}
									fieldGap={fieldGap}
									fieldGapDesc={fieldGapDesc}
									unitName={(selectedNode as any)?.unitName || ""}
								/>

								{childTableData.length > 0 ? (
									<div>
										<style>
											{`
											.red-header-table .ant-table-thead > tr > th {
												border-color: rgba(228, 231, 237, 1) !important;
											}
											.sticky-summary-row > td {
												position: sticky !important;
												top: 0;
												z-index: 20;
												background: #fafafa !important;
											}
											.sticky-summary-row > td.ant-table-cell-fix-left,
											.sticky-summary-row > td.ant-table-cell-fix-right {
												z-index: 21;
												background: #fafafa !important;
											}
											.import-head-dropdown-overlay .ant-pro-table-column-setting-overlay,
											.import-head-dropdown-overlay .ant-pro-table-column-setting-list {
												padding: 0;
												border-radius: 8px;
												overflow: hidden;
												box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18), 0 6px 16px rgba(0, 0, 0, 0.12);
											}
											.import-head-dropdown-overlay .import-head-dropdown-title {
												display: flex;
												align-items: center;
												justify-content: space-between;
												padding: 12px 16px;
												border-bottom: 1px solid #f0f0f0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-options {
												max-height: 240px;
												overflow-y: auto;
												padding: 8px 0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-option {
												display: flex;
												align-items: center;
												padding: 6px 16px;
												margin: 0;
												cursor: pointer;
												transition: background-color 0.2s;
											}
											.import-head-dropdown-overlay .import-head-dropdown-option:hover {
												background: rgba(0, 0, 0, 0.04);
											}
											.import-head-dropdown-overlay .import-head-dropdown-option .ant-checkbox-wrapper {
												width: 100%;
												margin-inline-start: 0;
											}
											.import-head-dropdown-overlay .import-head-dropdown-footer {
												padding: 0 16px 16px;
											}
										`}
										</style>
										<SearchableTable
											className="red-header-table"
											columns={childColumns}
											dataSource={finalChildTableData}
											loading={childTableLoading}
											rowKey="id"
											size="small"
											bordered
											adaptive={false}
											scroll={{ x: "max-content", y: "calc(100vh - 440px)" }}
											searchSchema={[]}
											toolbarActions={btns}
											columnEmptyText=""
											pagination={false}
											rowClassName={(record: any) =>
												record.isSummary ? "sticky-summary-row" : ""
											}
											toolBarRender={() => {
												return [
													<Dropdown
														key="import-btn"
														trigger={["click"]}
														open={childImportDropdownOpen}
														onOpenChange={(open) => {
															if (open && !selectedKey) {
																message.warning("请先选择子指标");
																return;
															}
															setChildImportDropdownOpen(open);
														}}
														overlayClassName="ant-pro-table-column-setting-overlay import-head-dropdown-overlay"
														dropdownRender={() =>
															childImportDropdownContent
														}
													>
														<BasicButton
															icon={
																<ImportIcon
																	width={14}
																	height={14}
																	style={{
																		transform:
																			"translateY(1px)",
																	}}
																/>
															}
														>
															导入
														</BasicButton>
													</Dropdown>,
												];
											}}
											// renderRowActions={renderRowActions}
										/>
									</div>
								) : (
									<div
										style={{
											position: "absolute",
											left: "50%",
											transform: "translateX(-50%)",
											bottom: 24,
										}}
									>
										<BlankSvg width={220} height={400} />
									</div>
								)}
							</div>
						)}
					</div>
					{/* clear float */}
					<div style={{ clear: "both" }} />
				</div>
			</div>
			{/* 页面底部 Footer */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					borderTop: `1px solid ${token.colorSplit}`,
					padding: "6px 24px",
					textAlign: "right",
					backgroundColor: token.colorBgContainer,
					zIndex: 10,
				}}
			>
				{responsibleUserId === user.id.toString() && (
					<BasicButton onClick={() => setPermissionDrawerOpen(true)} className="mr-2">
						新增协作人
					</BasicButton>
				)}

				<BasicButton type="primary" onClick={handleSubmit}>
					提交
				</BasicButton>
			</div>

			<input
				ref={importChildInputRef}
				type="file"
				accept=".xls,.xlsx"
				style={{ display: "none" }}
				onChange={handleImportFileChange}
			/>
			<input
				ref={importRootInputRef}
				type="file"
				accept=".xls,.xlsx"
				style={{ display: "none" }}
				onChange={handleImportRootFileChange}
			/>

			<AddDecomposeObjectModal
				open={disassembleModalOpen}
				onClose={() => setDisassembleModalOpen(false)}
				quickFilterId={planId}
				customSubmit={handleDisassembleOk}
				title="拆解子目标"
				customFetchTree={fetchDisassembleTree}
			/>

			<PersonCreateModal
				open={mainResponsibleModalOpen}
				onClose={handleMainResponsibleModalClose}
				titleLabel="主责人"
				single
				defaultSelected={
					editingResponsibleRow && editingResponsibleRow.responsiblePersonId
						? [
								{
									id: editingResponsibleRow.responsiblePersonId,
									name: editingResponsibleRow.responsiblePersonName || "",
								},
							]
						: []
				}
			/>

			<SubmitDrawer
				open={submitDrawerOpen}
				onClose={() => setSubmitDrawerOpen(false)}
				effTaskIndicatorSubmitUserId={planId}
				leftTreeSelectedKey={selectedKey as string}
			/>

			<IndicatorConfigDrawer
				open={indicatorConfigDrawerOpen}
				record={indicatorConfigRecord}
				onClose={() => setIndicatorConfigDrawerOpen(false)}
				readonly={true}
			/>

			<PlanPermissionsDrawer
				open={permissionDrawerOpen}
				record={{ id: planId }}
				onClose={() => setPermissionDrawerOpen(false)}
				dataType={3}
			/>

			<ReferenceValueDrawer
				open={referenceDrawerOpen}
				onClose={() => setReferenceDrawerOpen(false)}
				record={currentReferenceRecord}
				basicIndicatorConfigs={basicIndicatorConfigs}
				indicatorName={(selectedNode as any)?.title || ""}
				unitName={indicatorUnitName}
				onSave={handleSaveReferenceValue}
			/>

			<ChangeReminderDrawer
				open={changeReminderDrawerOpen}
				onClose={() => setChangeReminderDrawerOpen(false)}
				planId={planId}
				dataSource={changeReminderList}
				loading={changeReminderLoading}
				onChange={async () => {
					if (!planId) return;
					try {
						const resp = await noticeChangeUp(Number(planId));
						if (resp?.data) {
							message.success("变更成功");
							await Promise.all([
								loadChangeReminderList(),
								loadChangeReminderCount(),
							]);
							setChangeReminderDrawerOpen(false);
						}
					} catch (e) {
						console.error("noticeChangeUp failed", e);
					}
				}}
			/>

			<DoubleCountingDrawer
				open={doubleCountingDrawerOpen}
				onClose={() => {
					setDoubleCountingDrawerOpen(false);
					setDoubleCountingHeader(null);
				}}
				listOverviewId={doubleCountingListOverviewId}
				decomposeObject={doubleCountingHeader?.decomposeObject || ""}
				indicator={fieldIndicator}
				targetValue={doubleCountingHeader?.targetValue ?? 0}
				onRefresh={() => {
					if (doubleCountingListOverviewId) {
						refreshRow(doubleCountingListOverviewId);
					}
				}}
			/>

			<Modal
				title="缺口说明"
				open={gapModalOpen}
				onCancel={() => setGapModalOpen(false)}
				onOk={() => {
					if (!tempGapReason || tempGapReason.trim() === "") {
						message.error("请输入缺口说明");
						return;
					}
					doCheck(tempGapReason);
					setGapModalOpen(false);
				}}
			>
				<div className="mb-2 text-red-500">当前存在缺口，请输入缺口说明后进行校验</div>
				<Input.TextArea
					rows={4}
					value={tempGapReason}
					onChange={(e) => setTempGapReason(e.target.value)}
					placeholder="请输入缺口说明"
				/>
			</Modal>
		</BasicContent>
	);
}
