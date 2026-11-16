import {
	deleteIndicatorConfDetails,
	deleteIndicatorConfReference,
	fetchIndicatorConfDetails,
	fetchIndicatorConfReferencePage,
	fetchIndicatorConfTargetPlanDetails,
	fetchOverallTargetAudience,
	saveOverallTargetAudience,
	updateIndicatorConfReferenceBias,
	updateIndicatorConfTargetPlan,
} from "#src/api/strategy";
import { detailSort, lockIndicator, unlockIndicator } from "#src/api/strategy/indicator-config";
import deleteIcon from "#src/assets/small-icons/indicator-config/delete.svg?react";
import blankSvg from "#src/assets/svg/common-blank.svg";
import { SectionTitle } from "#src/components/section-title/index.js";
import { useGlobalStore, useUserStore } from "#src/store";
import { EditOutlined } from "@ant-design/icons";
import {
	Button,
	Checkbox,
	Col,
	ConfigProvider,
	Drawer,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Radio,
	Row,
	Select,
	Space,
	Table,
	Tabs,
	Tooltip,
	Tree,
	TreeSelect,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import React from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import PlanPermissionsDrawer from "../../target-management/modal/Plan-permissions-drawer";
import AddDecomposeObjectModal from "./AddDecomposeObjectModal";
import AddIndicatorDrawer from "./AddIndicatorDrawer";
import AdjustmentRangeModal from "./AdjustmentRangeModal";
import BasicIndicatorDrawer from "./BasicIndicatorDrawer";
import PreviewDrawer from "./PreviewDrawer";
import SourceConfigDrawer from "./SourceConfigDrawer";

const { Search } = Input;

export const IndicatorContext = React.createContext<{
	indicatorConfigInfo?: any;
	selectedIndicator?: any;
}>({});

interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
	readonly?: boolean;
}

export default function IndicatorConfigDrawer({ open, record, onClose, readonly }: Props) {
	// 总目标设置
	const [goalRows, setGoalRows] = React.useState<any[]>([]);
	const [form] = Form.useForm();
	const [planForm] = Form.useForm();
	const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);
	// targets table data (editable rows)
	const [targets, setTargets] = React.useState<any[]>([]);
	const [selectedPlanTypes, setSelectedPlanTypes] = React.useState<any[]>([]);
	const [, setHasSavedData] = React.useState(false);
	const [planLoading, setPlanLoading] = React.useState(false);

	// make tree data editable so we can delete nodes
	const [treeData, setTreeData] = React.useState<any[]>([]);

	const [indicatorDetail, setIndicatorDetail] = React.useState<any>(null);

	const user = useUserStore((state) => state);

	const isPeriodExpired = React.useCallback(
		(periodName: string) => {
			const planYearStr = record?.year;
			if (!planYearStr) return false;

			const planYear = Number.parseInt(planYearStr, 10);
			const now = dayjs();
			const currentYear = now.year();
			const currentMonth = now.month(); // 0-11

			if (planYear < currentYear) {
				// Past year: all expired
				return true;
			}
			if (planYear > currentYear) {
				// Future year: none expired
				return false;
			}

			// Current year
			let endMonth = -1;
			if (periodName?.includes("月")) {
				const m = Number.parseInt(periodName.replace("月", ""), 10);
				if (!Number.isNaN(m)) endMonth = m - 1;
			} else if (periodName?.includes("季度")) {
				if (periodName === "第一季度") endMonth = 2;
				else if (periodName === "第二季度") endMonth = 5;
				else if (periodName === "第三季度") endMonth = 8;
				else if (periodName === "第四季度") endMonth = 11;
			} else if (periodName === "上半年") {
				endMonth = 5;
			} else if (periodName === "下半年") {
				endMonth = 11;
			}

			if (endMonth === -1) return false;
			return currentMonth > endMonth;
		},
		[record?.year],
	);

	const isLocked = React.useMemo(() => {
		// 如果有 editor，则是锁定状态
		return !!indicatorDetail?.curEditor && indicatorDetail?.curEditor === user.id;
	}, [indicatorDetail]);

	const canEdit = React.useMemo(() => {
		// 只要是锁定状态，就认为是可编辑（后端控制权限）
		return isLocked;
	}, [isLocked]);

	const effectiveReadonly = React.useMemo(() => {
		// 全局 readonly 或者 不可编辑时，为只读
		return readonly || !canEdit;
	}, [readonly, canEdit]);

	const totalTargetReadonly = React.useMemo(() => {
		return effectiveReadonly || indicatorDetail?.status === 1;
	}, [effectiveReadonly, indicatorDetail?.status]);

	const [, setTreeLoading] = React.useState(false);

	const { oepOrgTree, loadOepOrgTree } = useGlobalStore();
	const [refPagination, setRefPagination] = React.useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});

	const handleTargetChange = async (key: string, field: string, val: any) => {
		setTargets((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: val } : r)));

		// 检查是否需要保存
		const target = targets.find((r) => r.key === key);
		if (!target) return;

		const newObj = field === "obj" ? val : target.obj;
		const newValue = field === "value" ? val : target.value;

		if (newObj && newValue !== undefined && newValue !== null) {
			if (!indicatorDetail?.id) return;

			const findTitle = (nodes: any[]): string | undefined => {
				for (const node of nodes) {
					if (node.key === newObj) return node.title;
					if (node.children) {
						const found = findTitle(node.children);
						if (found) return found;
					}
				}
				return undefined;
			};
			const totalTargetName = findTitle(oepOrgTree);

			try {
				await saveOverallTargetAudience({
					id: indicatorDetail.id,
					totalTargetExist: 1,
					totalTargetCode: newObj,
					totalTargetName,
					totalTargetAmount: newValue,
				});
				// 刷新详情
				const res = await fetchOverallTargetAudience(indicatorDetail.id);
				setIndicatorDetail(res);
			} catch (e) {
				console.error(e);
			}
		}
	};

	const hasTotalColumns = [
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					总目标对象
				</span>
			),
			dataIndex: "obj",
			key: "obj",
			width: "50%",
			render: (v: any, record: any) => (
				<Form.Item
					name={["targets", record.key, "obj"]}
					initialValue={v}
					rules={[{ required: true, message: "请选择总目标对象" }]}
					style={{ margin: 0 }}
				>
					<TreeSelect
						treeData={oepOrgTree}
						fieldNames={{ label: "title", value: "key", children: "children" }}
						placeholder="请选择"
						showSearch
						treeNodeFilterProp="title"
						onChange={(val) => handleTargetChange(record.key, "obj", val)}
						style={{ width: "100%" }}
						disabled={totalTargetReadonly}
					/>
				</Form.Item>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					总目标值
				</span>
			),
			dataIndex: "value",
			key: "value",
			width: "50%",
			render: (v: number, record: any) => (
				<Form.Item
					name={["targets", record.key, "value"]}
					initialValue={v}
					rules={[{ required: true, message: "总目标值不符合设定规则" }]}
					style={{ margin: 0 }}
				>
					<InputNumber
						className="w-full"
						min={indicatorDetail?.indicatorBasicBO?.dataRangeStart || 0}
						max={indicatorDetail?.indicatorBasicBO?.dataRangeEnd || undefined}
						precision={indicatorDetail?.indicatorBasicBO?.decimalDigits}
						onChange={(val) => handleTargetChange(record.key, "value", val)}
						disabled={totalTargetReadonly}
						suffix={indicatorDetail?.indicatorBasicBO?.unitName || ""}
					/>
				</Form.Item>
			),
		},
	];

	const fetchRefData = async (page = 1, size = 10, detailId?: string) => {
		const id = detailId ?? indicatorDetail?.id;
		if (!id) return;
		try {
			const res = await fetchIndicatorConfReferencePage({
				effTaskIndicatorConfDetailsId: id,
				pageNum: page,
				pageSize: size,
			});
			if (res) {
				const list = (Array.isArray(res.data) ? res.data : []).map(
					(item: any, index: number) => ({
						...item,
						key: item.id || `ref-${index}`,
					}),
				);
				setGoalRows(list);
				setRefPagination((prev) => ({
					...prev,
					current: page,
					pageSize: size,
					total: res.total || 0,
				}));
			}
		} catch (error) {
			console.error("fetchIndicatorConfReferencePage error", error);
		}
	};

	const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
	const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);
	const [addDecomposeModalOpen, setAddDecomposeModalOpen] = React.useState(false);
	const onAddIndicator = () => {
		setAddDrawerOpen(true);
	};
	// source config drawer state
	const [sourceDrawerOpen, setSourceDrawerOpen] = React.useState(false);
	const [activeSourceKey, setActiveSourceKey] = React.useState<string | null>(null);
	// basic indicator drawer state
	const [basicDrawerOpen, setBasicDrawerOpen] = React.useState(false);
	const [activeBasicKey, setActiveBasicKey] = React.useState<string | null>(null);
	const [biasModalOpen, setBiasModalOpen] = React.useState(false);
	const [activeBiasKey, setActiveBiasKey] = React.useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = React.useState(false);
	const [permissionDrawerOpen, setPermissionDrawerOpen] = React.useState(false);

	const abortControllerRef = React.useRef<AbortController | null>(null);

	const [activeTabKey, setActiveTabKey] = React.useState("1");
	const activeTabKeyRef = React.useRef(activeTabKey);
	React.useEffect(() => {
		activeTabKeyRef.current = activeTabKey;
	}, [activeTabKey]);

	const loadPlanData = async (id: string | number, types: any[], clear = true) => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		const controller = new AbortController();
		abortControllerRef.current = controller;

		setPlanLoading(true);
		const currentValues = planForm.getFieldsValue(["targets"])?.targets || {};

		if (clear) {
			setTargets([]);
			planForm.resetFields(["targets"]);
		}
		if (!types || types.length === 0) {
			setPlanLoading(false);
			return;
		}

		let allTargets: any[] = [];
		let hasAnySavedData = false;
		let savedData: any[] = [];

		try {
			const res: any = await fetchIndicatorConfTargetPlanDetails(
				{ effTaskIndicatorConfDetailsId: id },
				{ signal: controller.signal },
			);
			if (Array.isArray(res)) {
				savedData = res;
			} else if (res && Array.isArray(res.data)) {
				savedData = res.data;
			}
		} catch (e: any) {
			if (e.name === "AbortError") return;
			console.error(e);
		}

		for (const type of types) {
			const selectedPlan = indicatorDetail?.zq?.find((item: any) => item.id === type);
			if (selectedPlan && Array.isArray(selectedPlan.timePeriods)) {
				const typeTargets = selectedPlan.timePeriods.map((period: any, index: number) => {
					const code = period.code || period.assessmentCycleCode || period.id;
					// 根据 assessmentCycleCode 匹配已保存的数据
					const existing = savedData.find((d: any) => d.assessmentCycleCode === code);

					if (existing) {
						hasAnySavedData = true;
						return {
							key: `${type}-${code}`,
							id: existing.id,
							type,
							name: existing.assessmentCycleName || period.name,
							code,
							assessmentCycleCode: code,
							targetRule: String(existing.targetRuleCode),
							weight: existing.disassemblyWeight,
							supportModify: existing.supportModify,
							noFillRule: String(existing.noFillRule),
							planOrder: existing.planOrder,
						};
					} else {
						return {
							key: `${type}-${code}`,
							type,
							name: period.name,
							...period,
							assessmentCycleCode: code,
							id: -(type * 10000 + index + 1),
						};
					}
				});
				allTargets = [...allTargets, ...typeTargets];
			}
		}

		setHasSavedData(hasAnySavedData);
		setTargets(allTargets);

		// Set form values
		const newValues: any = {};
		const targetRuleOptions = Object.keys(indicatorDetail?.operationButtonChoose || {});
		const defaultTargetRule = targetRuleOptions.length > 0 ? targetRuleOptions[0] : null;
		const noFillRuleOptions = Object.keys(indicatorDetail?.noFillRuleChoose || {});
		const defaultNoFillRule = noFillRuleOptions.length > 0 ? noFillRuleOptions[0] : null;

		allTargets.forEach((t: any) => {
			if (currentValues[t.key]) {
				newValues[t.key] = currentValues[t.key];
			} else {
				newValues[t.key] = {
					name: t.name,
					targetRule: t.targetRule ?? defaultTargetRule,
					weight: t.weight ?? 0,
					supportModify: t.supportModify ?? 1,
					noFillRule: t.noFillRule ?? defaultNoFillRule,
				};
			}
		});
		planForm.resetFields(["targets"]);
		setTimeout(() => {
			planForm.setFieldsValue({ targets: newValues });
		}, 0);

		setSelectedPlanTypes(types);
		if (abortControllerRef.current === controller) {
			setPlanLoading(false);
		}
	};

	const fetchNodeDetail = React.useCallback(
		async (key: string, forceTab1 = false) => {
			if (key && key.startsWith("ind-")) {
				const id = key.replace("ind-", "");
				try {
					const res = await fetchOverallTargetAudience(id);
					setIndicatorDetail(res);

					// Only update targets if on Tab 1 or forced
					if (activeTabKeyRef.current === "1" || forceTab1) {
						// 回显总目标设置
						if (res.totalTargetExist === 1) {
							const newTargets = [
								{
									key: "1",
									obj: res.totalTargetCode,
									value: res.totalTargetAmount,
								},
							];
							setTargets(newTargets);

							// 使用 setTimeout 确保在 Table 渲染后设置 Form 值
							setTimeout(() => {
								form.setFieldsValue({
									targets: {
										1: {
											obj: res.totalTargetCode,
											value: res.totalTargetAmount,
										},
									},
								});
							}, 0);
						} else {
							setTargets([{ key: "1", obj: "", value: 0 }]);
							setTimeout(() => {
								form.setFieldsValue({
									targets: {
										1: {
											obj: undefined,
											value: undefined,
										},
									},
								});
							}, 0);
						}
					}
					return res;
				} catch (error) {
					console.error("fetchOverallTargetAudience error", error);
					return null;
				}
			} else {
				setIndicatorDetail(null);
				return null;
			}
		},
		[form],
	);

	const loadTree = React.useCallback(async () => {
		if (!record?.id) return;
		let mounted = true;
		setTreeLoading(true);
		try {
			const list = await fetchIndicatorConfDetails(record.id);

			const nodes = list.map((grp, gi: number) => {
				const sortedDetailList = (grp.innerDetailList || [])
					.map((it, index) => ({ it, index }))
					.sort((a, b) => {
						const aSort =
							typeof a.it?.sort === "number" && !Number.isNaN(a.it.sort)
								? a.it.sort
								: undefined;
						const bSort =
							typeof b.it?.sort === "number" && !Number.isNaN(b.it.sort)
								? b.it.sort
								: undefined;
						if (aSort !== undefined && bSort !== undefined) {
							return aSort - bSort;
						}
						return a.index - b.index;
					})
					.map(({ it }) => it);

				const children = sortedDetailList.map((it) => {
					return {
						title: it.name ?? it.typeStr ?? `指标 ${it.id}`,
						key: `ind-${it.id}`,
						data: it,
					};
				});
				return {
					title: grp.responsibleDepartment || `未设置部门 ${gi + 1}`,
					key: `dept-${gi}`,
					selectable: false,
					children,
				};
			});

			if (mounted) {
				setTreeData(nodes);
				// expand all
				setExpandedKeys(
					nodes.flatMap((n) => [n.key, ...(n.children?.map((c: any) => c.key) || [])]),
				);
				// select first child if any
				const firstChild = nodes[0]?.children?.[0];
				if (firstChild) {
					planForm.resetFields();
					setSelectedKey(firstChild.key);
					fetchNodeDetail(firstChild.key);
				}
			}
		} catch (e) {
			console.error("fetchIndicatorConfDetails failed", e);
		} finally {
			setTreeLoading(false);
		}
		return () => {
			mounted = false;
		};
	}, [record?.id, fetchNodeDetail, planForm]);

	React.useEffect(() => {
		if (open) {
			loadTree();
		} else {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}
		}
	}, [open, loadTree]);

	const checkUnsaved = (nextAction: () => void) => {
		if (indicatorDetail?.totalTargetExist === 1) {
			const target = targets.find((t) => t.key === "1");
			if (target && (!target.obj || target.value === undefined || target.value === null)) {
				Modal.confirm({
					title: "确认切换指标吗？",
					content: "由于您未填写总目标对象/总目标值，现在切换指标将会丢失您的更新。",
					onOk: () => {
						nextAction();
					},
				});
				return;
			}
		}
		nextAction();
	};

	const handleDeleteNode = (key: string) => {
		if (!key || !key.startsWith("ind-")) {
			message.warning("只能删除指标节点");
			return;
		}
		const id = key.replace("ind-", "");
		Modal.confirm({
			title: "确认删除该指标吗？",
			content: "删除后无法恢复，请谨慎操作。",
			onOk: async () => {
				try {
					const res: any = await deleteIndicatorConfDetails(id);
					if (res && res.code === 200) {
						message.success("删除成功");
						if (selectedKey === key) {
							setSelectedKey(null);
							setIndicatorDetail(null);
						}
						loadTree();
					} else {
						message.error(res?.msg || "删除失败");
					}
				} catch (e) {
					console.error("delete indicator failed", e);
					message.error("删除失败");
				}
			},
		});
	};

	const handleSelectNode = async (keys: any[]) => {
		const doSelect = async () => {
			const key = keys[0];
			setSelectedKey(key || null);

			setActiveTabKey("1");
			setSelectedPlanTypes([]);
			setGoalRows([]);
			planForm.resetFields();

			await fetchNodeDetail(key || "", true);
		};

		checkUnsaved(doSelect);
	};

	const findParentIndex = (nodes: any[], key: string) => {
		return nodes.findIndex((n) => (n.children || []).some((c: any) => c.key === key));
	};

	const handleTreeDrop = async (info: any) => {
		if (!selectedKey) {
			message.warning("请先选择一个指标后再拖拽");
			return;
		}
		const dragKey = info.dragNode?.key;
		if (!dragKey || dragKey !== selectedKey) {
			message.warning("只能拖拽当前选中的指标");
			return;
		}
		const dropKey = info.node?.key;
		if (!dropKey) {
			message.warning("未命中有效的放置节点");
			return;
		}
		if (dropKey === dragKey) {
			message.warning("不能放到自身节点");
			return;
		}

		const dragParentIndex = findParentIndex(treeData, dragKey);
		let dropParentIndex = findParentIndex(treeData, dropKey);
		const isDropOnParent = typeof dropKey === "string" && dropKey.startsWith("dept-");
		if (isDropOnParent) {
			dropParentIndex = treeData.findIndex((n) => n.key === dropKey);
		}
		if (dragParentIndex < 0 || dropParentIndex < 0 || dragParentIndex !== dropParentIndex) {
			message.warning("只能在同一父节点内排序");
			return;
		}

		const parent = treeData[dragParentIndex];
		const children = parent?.children || [];
		const dragIndex = children.findIndex((c: any) => c.key === dragKey);
		const dropIndex = children.findIndex((c: any) => c.key === dropKey);
		if (dragIndex < 0 || (!isDropOnParent && dropIndex < 0)) {
			message.warning("拖拽索引定位失败");
			return;
		}

		const nextChildren = [...children];
		const [moved] = nextChildren.splice(dragIndex, 1);
		let insertIndex = 0;
		if (isDropOnParent) {
			insertIndex = 0;
		} else {
			const dropPosition = info.dropPosition - Number(info.node.pos.split("-").pop());
			insertIndex = info.dropToGap
				? dropPosition < 0
					? dropIndex
					: dropIndex + 1
				: dropIndex + 1;
			if (dragIndex < insertIndex) insertIndex -= 1;
		}
		nextChildren.splice(insertIndex, 0, moved);
		const sortOffset = 1;
		const normalizedChildren = nextChildren.map((child: any, index: number) => ({
			...child,
			data: {
				...(child?.data || {}),
				sort: index + 1 + sortOffset,
			},
		}));

		const prevTreeData = treeData;
		const nextTreeData = treeData.map((node, index) => {
			if (index !== dragParentIndex) return node;
			return {
				...node,
				children: normalizedChildren,
			};
		});
		setTreeData(nextTreeData);

		if (!record?.id) {
			setTreeData(prevTreeData);
			return;
		}

		const items = normalizedChildren.map((child: any, index: number) => ({
			detailId: child?.data?.id,
			sort: index + 1 + sortOffset,
		}));

		try {
			const res: any = await detailSort({
				taskIndicatorConfId: Number(record.id),
				items,
			});
			let shouldRollback = false;
			if (!res) {
				shouldRollback = true;
			} else if ("code" in res && res.code !== 200) {
				shouldRollback = true;
			} else if ("success" in res && res.success === false) {
				shouldRollback = true;
			} else if ("data" in res && res.data === false) {
				shouldRollback = true;
			}
			if (shouldRollback) {
				setTreeData(prevTreeData);
			}
		} catch (e) {
			console.error(e);
			setTreeData(prevTreeData);
		}
	};

	const handleRemoveGoal = (key: string) => {
		Modal.confirm({
			title: "确认删除该条数据吗？",
			onOk: async () => {
				try {
					const res: any = await deleteIndicatorConfReference(key);
					if (res && res.code === 200) {
						message.success("删除成功");
						fetchRefData(refPagination.current, refPagination.pageSize);
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

	const updateGoalField = (key: string, field: string, val: any) => {
		setGoalRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: val } : r)));
	};

	React.useEffect(() => {
		loadOepOrgTree();
	}, [loadOepOrgTree]);

	const targetColumns = [
		{
			title: "考核周期",
			dataIndex: "name",
			key: "name",
			render: (v: any, record: any) => (
				<Form.Item
					key={`${record.key}-${indicatorDetail?.id}-name`}
					name={["targets", record.key, "name"]}
					style={{ margin: 0 }}
				>
					<Input placeholder="请输入" disabled />
				</Form.Item>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					目标值规则
				</span>
			),
			dataIndex: "targetRule",
			key: "targetRule",
			width: 240,
			render: (v: any, record: any) => (
				<Form.Item
					key={`${record.key}-${indicatorDetail?.id}-targetRule`}
					name={["targets", record.key, "targetRule"]}
					rules={[{ required: true, message: "请选择" }]}
					style={{ margin: 0 }}
				>
					<Select
						options={Object.entries(indicatorDetail?.operationButtonChoose || {}).map(
							([key, val]) => ({ label: val, value: key }),
						)}
						placeholder="请选择"
						disabled={
							effectiveReadonly ||
							(indicatorDetail?.status === 1 && isPeriodExpired(record.name))
						}
					/>
				</Form.Item>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					拆解比重(%)
				</span>
			),
			dataIndex: "weight",
			key: "weight",
			width: 140,
			render: (v: any, record: any) => (
				<Form.Item
					noStyle
					shouldUpdate={(prev, curr) => {
						return (
							prev.targets?.[record.key]?.targetRule !==
							curr.targets?.[record.key]?.targetRule
						);
					}}
				>
					{({ getFieldValue }) => {
						const targetRule = getFieldValue(["targets", record.key, "targetRule"]);
						const map = indicatorDetail?.operationButtonChoose || {};
						const isNoAssessment =
							map[targetRule] === "不考核" || map[targetRule] === "人工填报";
						return (
							<Form.Item
								key={`${record.key}-${indicatorDetail?.id}-weight`}
								name={["targets", record.key, "weight"]}
								rules={[{ required: !isNoAssessment, message: "请输入" }]}
								style={{ margin: 0 }}
							>
								<InputNumber
									style={{ width: "100%" }}
									placeholder="请输入"
									suffix="%"
									disabled={
										isNoAssessment ||
										effectiveReadonly ||
										(indicatorDetail?.status === 1 &&
											isPeriodExpired(record.name))
									}
								/>
							</Form.Item>
						);
					}}
				</Form.Item>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					是否支持修改
				</span>
			),
			dataIndex: "supportModify",
			key: "supportModify",
			width: 140,
			render: (v: any, record: any) => (
				<Form.Item
					noStyle
					shouldUpdate={(prev, curr) => {
						return (
							prev.targets?.[record.key]?.targetRule !==
							curr.targets?.[record.key]?.targetRule
						);
					}}
				>
					{({ getFieldValue }) => {
						const targetRule = getFieldValue(["targets", record.key, "targetRule"]);
						const map = indicatorDetail?.operationButtonChoose || {};
						const isNoAssessment =
							map[targetRule] === "不考核" || map[targetRule] === "人工填报";
						return (
							<Form.Item
								key={`${record.key}-${indicatorDetail?.id}-supportModify`}
								name={["targets", record.key, "supportModify"]}
								rules={[{ required: !isNoAssessment, message: "请选择" }]}
								style={{ margin: 0 }}
							>
								<Select
									options={[
										{ label: "是", value: 1 },
										{ label: "否", value: 0 },
									]}
									placeholder="请选择"
									disabled={
										isNoAssessment ||
										effectiveReadonly ||
										(indicatorDetail?.status === 1 &&
											isPeriodExpired(record.name))
									}
								/>
							</Form.Item>
						);
					}}
				</Form.Item>
			),
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					无需填写规则
				</span>
			),
			dataIndex: "noFillRule",
			key: "noFillRule",
			width: 280,
			render: (v: any, record: any) => (
				<Form.Item
					noStyle
					shouldUpdate={(prev, curr) => {
						return (
							prev.targets?.[record.key]?.targetRule !==
							curr.targets?.[record.key]?.targetRule
						);
					}}
				>
					{({ getFieldValue }) => {
						const targetRule = getFieldValue(["targets", record.key, "targetRule"]);
						const map = indicatorDetail?.operationButtonChoose || {};
						const isNoAssessment =
							map[targetRule] === "不考核" || map[targetRule] === "人工填报";
						return (
							<Form.Item
								key={`${record.key}-${indicatorDetail?.id}-noFillRule`}
								name={["targets", record.key, "noFillRule"]}
								rules={[{ required: !isNoAssessment, message: "请选择" }]}
								style={{ margin: 0 }}
							>
								<Select
									options={Object.entries(
										indicatorDetail?.noFillRuleChoose || {},
									).map(([key, val]) => ({ label: val, value: key }))}
									placeholder="请选择"
									style={{ width: 280 }}
									disabled={
										isNoAssessment ||
										effectiveReadonly ||
										(indicatorDetail?.status === 1 &&
											isPeriodExpired(record.name))
									}
								/>
							</Form.Item>
						);
					}}
				</Form.Item>
			),
		},
	];

	const onAddDecomposeObject = () => {
		setAddDecomposeModalOpen(true);
	};

	const handleLock = async () => {
		if (!indicatorDetail?.id) return;
		try {
			const res = await lockIndicator(indicatorDetail.id);
			if (res && res.code === 200) {
				if (selectedKey) {
					fetchNodeDetail(selectedKey);
				}
			}
		} catch (e) {
			console.error(e);
		}
	};

	const handleUnlock = async () => {
		if (!indicatorDetail?.id) return;
		try {
			const res = await unlockIndicator(indicatorDetail.id);
			if (res && res.code === 200) {
				if (selectedKey) {
					fetchNodeDetail(selectedKey);
				}
			}
		} catch (e) {
			console.error(e);
		}
	};

	const onPreview = () => {
		setPreviewOpen(true);
	};
	const onTempSave = () => {
		message.success("已暂存");
	};

	const filterTree = (search: string) => {
		if (!search) {
			setExpandedKeys([]);
			return;
		}
		// naive expand all for demo
		setExpandedKeys(["a", "b"]);
	};

	const handleChangeTotalTargetExist = async (e: any) => {
		const val = e.target.value;

		if (indicatorDetail?.id === undefined || indicatorDetail?.id === null) return;

		// 乐观更新：立即更新 UI
		setIndicatorDetail((prev: any) => ({ ...prev, totalTargetExist: val }));

		if (val === 1) {
			const newTargets = [
				{
					key: "1",
					obj: indicatorDetail.totalTargetCode,
					value: indicatorDetail.totalTargetAmount,
				},
			];
			setTargets(newTargets);
			setTimeout(() => {
				form.setFieldsValue({
					targets: {
						1: {
							obj: indicatorDetail.totalTargetCode,
							value: indicatorDetail.totalTargetAmount,
						},
					},
				});
			}, 0);

			// 若参数不齐全，则不调用接口
			if (
				!indicatorDetail.totalTargetCode ||
				indicatorDetail.totalTargetAmount === undefined ||
				indicatorDetail.totalTargetAmount === null
			) {
				return;
			}
		} else {
			setTargets([{ key: "1", obj: "", value: 0 }]);
			setTimeout(() => {
				form.setFieldsValue({
					targets: {
						1: {
							obj: undefined,
							value: undefined,
						},
					},
				});
			}, 0);
		}

		try {
			await saveOverallTargetAudience({
				id: indicatorDetail.id,
				totalTargetExist: val,
				totalTargetCode: indicatorDetail.totalTargetCode,
				totalTargetName: indicatorDetail.totalTargetName,
				totalTargetAmount: indicatorDetail.totalTargetAmount,
			});

			const res = await fetchOverallTargetAudience(indicatorDetail.id);
			setIndicatorDetail(res);
		} catch (e) {
			console.error(e);
			message.error("更新失败");
		}
	};

	const handleTabChange = async (activeKey: string) => {
		const doChange = async () => {
			setActiveTabKey(activeKey);
			if (activeKey === "1") {
				if (indicatorDetail) {
					if (indicatorDetail.totalTargetExist === 1) {
						const newTargets = [
							{
								key: "1",
								obj: indicatorDetail.totalTargetCode,
								value: indicatorDetail.totalTargetAmount,
							},
						];
						setTargets(newTargets);
						setTimeout(() => {
							form.setFieldsValue({
								targets: {
									1: {
										obj: indicatorDetail.totalTargetCode,
										value: indicatorDetail.totalTargetAmount,
									},
								},
							});
						}, 0);
					} else {
						setTargets([{ key: "1", obj: "", value: 0 }]);
						setTimeout(() => {
							form.setFieldsValue({
								targets: {
									1: {
										obj: undefined,
										value: undefined,
									},
								},
							});
						}, 0);
					}
				}
			}
			if (activeKey === "2") {
				if (indicatorDetail?.id) {
					fetchRefData(1, refPagination.pageSize);
				} else {
					setGoalRows([]);
				}
			}
			if (activeKey === "3") {
				if (indicatorDetail?.id) {
					let typesToLoad: any[] = [];

					if (
						indicatorDetail.types &&
						Array.isArray(indicatorDetail.types) &&
						indicatorDetail.types.length > 0
					) {
						typesToLoad = indicatorDetail.types;
					} else if (
						indicatorDetail.type !== undefined &&
						indicatorDetail.type !== null
					) {
						typesToLoad = [indicatorDetail.type];
					}

					if (typesToLoad.length > 0) {
						setSelectedPlanTypes(typesToLoad);
						loadPlanData(indicatorDetail.id, typesToLoad, true);
					} else {
						setSelectedPlanTypes([]);
						loadPlanData(indicatorDetail.id, [], true);
					}
				}
			}
		};

		// checkUnsaved(doChange);
		doChange();
	};
	const handleManualSave = async () => {
		try {
			const values = await planForm.validateFields();

			const forms: any[] = [];
			const editForms: any[] = [];

			targets.forEach((t: any, index: number) => {
				const formVal = values.targets?.[t.key];
				if (!formVal) return;

				const targetRuleCode = Number(formVal.targetRule);
				const disassemblyWeight = formVal.weight;
				const supportModify = formVal.supportModify;
				const noFillRule = Number(formVal.noFillRule);

				if (t.id && t.id > 0) {
					editForms.push({
						id: t.id,
						targetRuleCode,
						disassemblyWeight,
						supportModify,
						noFillRule,
					});
				} else {
					forms.push({
						type: t.type,
						assessmentCycleCode: t.code || t.assessmentCycleCode || t.id,
						targetRuleCode,
						disassemblyWeight,
						supportModify,
						noFillRule,
						planOrder: index + 1,
					});
				}
			});

			const payload = {
				effTaskIndicatorConfDetailsId: indicatorDetail?.id,
				typeIds: selectedPlanTypes,
				forms,
				editForms,
			};

			const res: any = await updateIndicatorConfTargetPlan(payload);

			if (res && res.code === 200) {
				message.success("保存成功");
				setHasSavedData(true);
				// 更新本地详情中的 types，确保切换 tab 后能记住选中状态
				setIndicatorDetail((prev: any) => ({ ...prev, types: selectedPlanTypes }));
				loadPlanData(indicatorDetail.id, selectedPlanTypes, true);
			} else {
				message.error(res?.msg || "保存失败");
			}
		} catch (e) {
			console.error(e);
			if (!(e as any).errorFields) {
				message.error("保存失败");
			}
		}
	};

	const titleElement = (
		<div>
			{record?.targetPlanName ?? ""}
			<div className="mt-2 flex gap-4 text-sm font-normal">
				<span>目标周期</span>
				<span className="ml-1">{record?.targetCycle}</span>
				<span className="ml-6">上次指标配置时间</span>
				<span className="ml-1">{record?.subTaskChangeTime ?? "-"}</span>
			</div>
		</div>
	);
	return (
		<Drawer
			title={titleElement}
			placement="right"
			width="85vw"
			open={open}
			{...commonDrawerProps(onClose)}
			styles={{
				body: { paddingTop: 8 },
			}}
		>
			<IndicatorContext.Provider
				value={{ indicatorConfigInfo: record, selectedIndicator: indicatorDetail }}
			>
				<ConfigProvider locale={zhCN}>
					<div className="p-2">
						<Row gutter={16} wrap={false}>
							{/* Left: 指标列表，带边框 */}
							<Col flex="240px" style={{ minWidth: 240, maxWidth: 240 }}>
								<div
									className="left-tree-wrapper flex flex-col rounded border border-gray-200 p-3"
									style={{ height: "calc(100vh - 180px)" }}
								>
									{treeData.length === 0 ? (
										<div className="flex h-full flex-col items-center justify-center">
											<img src={blankSvg} alt="暂无指标" />
											<div className="mt-2 text-gray-500">当前暂无指标</div>
											{!readonly && (
												<Button
													type="primary"
													className="mt-4"
													onClick={onAddIndicator}
												>
													新增指标
												</Button>
											)}
										</div>
									) : (
										<>
											<div className="mb-2 flex items-center justify-between">
												<div className="font-semibold">指标</div>
												{!readonly && (
													<a
														onClick={onAddIndicator}
														className="text-blue-600"
													>
														新增指标
													</a>
												)}
											</div>

											<div className="mb-2">
												<Search
													placeholder="搜索指标"
													onSearch={(v) => {
														filterTree(v);
													}}
													allowClear
												/>
											</div>

											<div className="flex-1 overflow-y-auto overflow-x-hidden">
												<Tree
													blockNode
													draggable={{
														icon: false,
														nodeDraggable: (node: any) => {
															const isLeaf = !(
																node.children &&
																node.children.length
															);
															return isLeaf;
														},
													}}
													allowDrop={() => true}
													treeData={treeData}
													expandedKeys={expandedKeys}
													onExpand={(keys) =>
														setExpandedKeys(keys as string[])
													}
													selectedKeys={selectedKey ? [selectedKey] : []}
													onSelect={(keys) =>
														handleSelectNode(keys as any)
													}
													onDrop={handleTreeDrop}
													titleRender={(node: any) => {
														const DeleteIcon = deleteIcon;
														const isLeaf = !(
															node.children && node.children.length
														);
														return (
															<div className="group flex w-full items-center justify-between overflow-hidden">
																{isLeaf && node.data.type === 1 && (
																	<div
																		className="mr-1 flex-shrink-0 rounded px-1"
																		style={{
																			backgroundColor:
																				"rgba(235, 238, 245, 1)",
																		}}
																	>
																		复
																	</div>
																)}
																<Tooltip
																	title={node.title}
																	placement="topLeft"
																>
																	<span className="flex-1 truncate">
																		{node.title}
																	</span>
																</Tooltip>
																{isLeaf &&
																	!readonly &&
																	node.data.status !== 1 && (
																		<span
																			className="invisible flex-shrink-0 cursor-pointer group-hover:visible"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleDeleteNode(
																					node.key,
																				);
																			}}
																		>
																			<DeleteIcon
																				style={{
																					transform:
																						"translateY(2px)",
																					marginLeft: 4,
																				}}
																			/>
																		</span>
																	)}
															</div>
														);
													}}
												/>
											</div>
										</>
									)}
								</div>
							</Col>

							{/* Right: 无边框 */}
							<Col flex="auto" style={{ minWidth: 0 }}>
								<div className="pl-3">
									{!selectedKey ? (
										<div
											className="flex flex-col items-center justify-center"
											style={{ height: "calc(100vh - 180px)" }}
										>
											<img src={blankSvg} alt="暂无数据" />
											<div className="mt-2 text-gray-500">当前暂无数据</div>
										</div>
									) : (
										<>
											<div className="flex items-start justify-between">
												<SectionTitle title="基础信息" />
												<Space>
													{!readonly &&
														(indicatorDetail?.curEditor ? (
															<>
																<span>
																	当前锁定人:
																	{indicatorDetail?.curEditorName}
																</span>
																<Button onClick={handleLock}>
																	解锁
																</Button>
															</>
														) : (
															<Button onClick={handleUnlock}>
																锁定
															</Button>
														))}
													<Button onClick={onPreview}>预览</Button>
													{!effectiveReadonly && (
														<Button onClick={onTempSave}>暂存</Button>
													)}
												</Space>
											</div>

											{/* fields: 3 per row - 横向 key:value，value 放在禁用输入框内 */}
											<div className="mt-3">
												<Row gutter={[12, 12]}>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																指标名称
															</div>
															<Input
																disabled
																value={
																	indicatorDetail
																		?.indicatorBasicBO?.name
																}
																placeholder="-"
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																指标类型
															</div>
															<Input
																disabled
																value={
																	indicatorDetail
																		?.indicatorBasicBO?.typeStr
																}
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																指标状态
															</div>
															<Input
																disabled
																value={indicatorDetail?.statusStr}
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																数据单位
															</div>
															<Input
																disabled
																value={
																	indicatorDetail
																		?.indicatorBasicBO?.unitName
																}
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																小数位数
															</div>
															<Input
																disabled
																value={
																	indicatorDetail
																		?.indicatorBasicBO
																		?.decimalDigits !==
																	undefined
																		? String(
																				indicatorDetail
																					?.indicatorBasicBO
																					?.decimalDigits,
																			)
																		: ""
																}
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
													<Col xs={24} sm={24} md={12} lg={8} xl={8}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																数据范围
															</div>
															<div className="flex min-w-0 flex-1 items-center gap-2">
																<InputNumber
																	disabled
																	value={
																		indicatorDetail
																			?.indicatorBasicBO
																			?.dataRangeStart
																	}
																	className="min-w-0 flex-1"
																/>
																<span>-</span>
																<InputNumber
																	disabled
																	value={
																		indicatorDetail
																			?.indicatorBasicBO
																			?.dataRangeEnd
																	}
																	className="min-w-0 flex-1"
																/>
															</div>
														</div>
													</Col>
													<Col span={24}>
														<div className="flex items-center gap-3 whitespace-nowrap">
															<div className="w-28 flex-shrink-0 text-sm text-gray-600">
																指标定义口径
															</div>
															<Input
																disabled
																value={
																	indicatorDetail
																		?.indicatorBasicBO
																		?.definition
																}
																className="min-w-0 flex-1"
															/>
														</div>
													</Col>
												</Row>
											</div>

											<div className="mt-4">
												<Tabs
													activeKey={activeTabKey}
													onChange={handleTabChange}
													items={[
														{
															key: "1",
															label: "总目标下达",
															className: "mt-2",
															children: (
																<Form
																	form={form}
																	layout="vertical"
																	colon={false}
																>
																	<Form.Item
																		label="是否有总目标"
																		layout="horizontal"
																	>
																		<Radio.Group
																			value={
																				indicatorDetail?.totalTargetExist ??
																				undefined
																			}
																			onChange={
																				handleChangeTotalTargetExist
																			}
																			disabled={
																				totalTargetReadonly
																			}
																		>
																			<Radio value={1}>
																				有
																			</Radio>
																			<Radio value={0}>
																				无
																			</Radio>
																		</Radio.Group>
																	</Form.Item>

																	{indicatorDetail?.totalTargetExist ===
																		1 && (
																		<Form.Item>
																			<style>
																				{`
																			.red-header-table .ant-table-thead > tr > th {
																				border-color: rgba(228, 231, 237, 1) !important;
																			}
																			`}
																			</style>
																			<Table
																				className="red-header-table"
																				columns={
																					hasTotalColumns
																				}
																				dataSource={targets}
																				pagination={false}
																				size="small"
																				bordered
																			/>
																		</Form.Item>
																	)}
																</Form>
															),
														},
														{
															key: "2",
															label: "参考设置",
															className: "mt-2",
															children: (
																<Form layout="vertical">
																	<div className="mb-2 flex w-full items-center justify-between">
																		<SectionTitle title="参考设置" />
																		{!effectiveReadonly && (
																			<Button
																				className="ml-auto"
																				onClick={
																					onAddDecomposeObject
																				}
																			>
																				新增拆解对象
																			</Button>
																		)}
																	</div>
																	<Form.Item>
																		<style>
																			{`
																	.red-header-table .ant-table-thead > tr > th {
																		border-color: rgba(228, 231, 237, 1) !important;
																	}
																	.red-header-table .ant-table-body::-webkit-scrollbar {
																		display: none!important;
																	}
																	.red-header-table .ant-table-body {
																		scrollbar-width: none!important;
																		-ms-overflow-style: none!important;
																	}
																	`}
																		</style>
																		<Table
																			className="red-header-table"
																			scroll={{
																				x: 1400,
																			}}
																			columns={
																				(() => {
																					const cols = [
																						{
																							title: "拆解对象",
																							dataIndex:
																								"targetOrgDesc",
																							key: "targetOrgDesc",
																							width: 180,
																							render: (
																								v: string,
																							) => (
																								<Input
																									value={
																										v
																									}
																									disabled
																								/>
																							),
																						},
																						{
																							title: "数量",
																							dataIndex:
																								"targetOrgCount",
																							key: "targetOrgCount",
																							align: "left" as any,
																							width: 80,
																							render: (
																								v: string,
																							) => (
																								<Input
																									value={
																										v
																									}
																									disabled
																								/>
																							),
																						},
																						{
																							title: "同期值",
																							children:
																								[
																									{
																										title: "数据来源",
																										dataIndex:
																											"dataSourceCodeStr",
																										key: "dataSourceCodeStr",
																										width: 140,
																										render: (
																											v: string,
																											rec: any,
																										) => (
																											<Input
																												value={
																													v
																												}
																												readOnly
																												disabled={
																													effectiveReadonly
																												}
																												onClick={(
																													e,
																												) => {
																													if (
																														effectiveReadonly
																													)
																														return;
																													e.stopPropagation();
																													setActiveSourceKey(
																														rec.key,
																													);
																													setSourceDrawerOpen(
																														true,
																													);
																												}}
																												placeholder={
																													effectiveReadonly
																														? ""
																														: "点击配置"
																												}
																												suffix={
																													!effectiveReadonly && (
																														<EditOutlined
																															onClick={(
																																e,
																															) => {
																																e.stopPropagation();
																																setActiveSourceKey(
																																	rec.key,
																																);
																																setSourceDrawerOpen(
																																	true,
																																);
																															}}
																															style={{
																																cursor: "pointer",
																															}}
																														/>
																													)
																												}
																											/>
																										),
																									},
																									{
																										title: "数据值",
																										dataIndex:
																											"dataSourceDesc",
																										key: "dataSourceDesc",
																										width: 180,
																										render: (
																											v: string,
																										) => (
																											<Input
																												value={
																													v
																												}
																												disabled
																												placeholder="数据值"
																											/>
																										),
																									},
																								],
																						},
																						{
																							title: "目标配置",
																							children:
																								[
																									{
																										title: "基础指标",
																										dataIndex:
																											"basicIndicatorDesc",
																										key: "basicIndicatorDesc",
																										width: 300,
																										render: (
																											v: string,
																											rec: any,
																										) => (
																											<Input
																												value={
																													v
																												}
																												readOnly
																												disabled={
																													effectiveReadonly
																												}
																												onClick={(
																													e,
																												) => {
																													if (
																														effectiveReadonly
																													)
																														return;
																													e.stopPropagation();
																													setActiveBasicKey(
																														rec.key,
																													);
																													setBasicDrawerOpen(
																														true,
																													);
																												}}
																												placeholder={
																													effectiveReadonly
																														? ""
																														: "点击配置"
																												}
																												suffix={
																													!effectiveReadonly && (
																														<EditOutlined
																															onClick={(
																																e,
																															) => {
																																e.stopPropagation();
																																setActiveBasicKey(
																																	rec.key,
																																);
																																setBasicDrawerOpen(
																																	true,
																																);
																															}}
																															style={{
																																cursor: "pointer",
																															}}
																														/>
																													)
																												}
																											/>
																										),
																									},
																									{
																										title: "参考值",
																										dataIndex:
																											"referenceValueDesc",
																										key: "referenceValueDesc",
																										width: 300,
																										align: "left" as any,
																										render: (
																											v: any,
																										) => (
																											<Input
																												value={
																													v
																												}
																												disabled
																												className="w-full text-right"
																											/>
																										),
																									},
																									{
																										title: "填报值",
																										dataIndex:
																											"fillInDesc",
																										key: "fillInDesc",
																										width: 200,
																										align: "left" as any,
																									},
																								],
																						},
																						{
																							title: "偏差",
																							children:
																								[
																									{
																										title: "计算公式",
																										dataIndex:
																											"deviationFormulaStr",
																										key: "deviationFormulaStr_bias",
																										width: 100,
																										render: (
																											v: string,
																											rec: any,
																										) => {
																											const isDisabled =
																												effectiveReadonly ||
																												rec.statusStr ===
																													"已生效";
																											return (
																												<Input
																													value={
																														v
																													}
																													readOnly
																													disabled={
																														isDisabled
																													}
																													onClick={(
																														e,
																													) => {
																														if (
																															isDisabled
																														)
																															return;
																														e.stopPropagation();
																														setActiveBiasKey(
																															rec.key,
																														);
																														setBiasModalOpen(
																															true,
																														);
																													}}
																													placeholder={
																														isDisabled
																															? ""
																															: "点击配置"
																													}
																													suffix={
																														!isDisabled && (
																															<EditOutlined
																																onClick={(
																																	e,
																																) => {
																																	e.stopPropagation();
																																	setActiveBiasKey(
																																		rec.key,
																																	);
																																	setBiasModalOpen(
																																		true,
																																	);
																																}}
																																style={{
																																	cursor: "pointer",
																																}}
																															/>
																														)
																													}
																												/>
																											);
																										},
																									},
																									{
																										title: "偏差范围",
																										dataIndex:
																											"deviationRange",
																										key: "deviationRange",
																										width: 100,
																										render: (
																											v: string,
																										) => (
																											<Input
																												value={
																													v
																												}
																												disabled
																												placeholder="等待配置"
																											/>
																										),
																									},
																								],
																						},
																						{
																							title: "状态",
																							key: "statusStr",
																							dataIndex:
																								"statusStr",
																							width: 120,
																						},
																						{
																							title: "操作",
																							key: "op",
																							width: 80,
																							fixed: "right" as any,
																							render: (
																								_: any,
																								rec: any,
																							) =>
																								!effectiveReadonly &&
																								rec.statusStr !==
																									"已生效" && (
																									<Button
																										type="link"
																										size="small"
																										onClick={() =>
																											handleRemoveGoal(
																												rec.key,
																											)
																										}
																									>
																										删除
																									</Button>
																								),
																						},
																					];
																					return cols;
																				})() as any
																			}
																			dataSource={goalRows}
																			pagination={{
																				current:
																					refPagination.current,
																				pageSize:
																					refPagination.pageSize,
																				total: refPagination.total,
																				onChange: (
																					page,
																					size,
																				) =>
																					fetchRefData(
																						page,
																						size,
																					),
																				showSizeChanger: true,
																				showTotal: (
																					total,
																				) =>
																					`共 ${total} 条`,
																			}}
																			size="small"
																			bordered
																			rowKey="key"
																		/>
																	</Form.Item>
																</Form>
															),
														},
														{
															key: "3",
															label: "目标计划",
															className: "mt-4",
															children: (
																<Form
																	layout="vertical"
																	form={planForm}
																>
																	<div className="mb-4 flex items-center justify-between">
																		<Checkbox.Group
																			value={
																				selectedPlanTypes
																			}
																			onChange={(val) => {
																				if (
																					effectiveReadonly
																				)
																					return;
																				setSelectedPlanTypes(
																					val,
																				);
																				loadPlanData(
																					indicatorDetail?.id,
																					val,
																					true,
																				);
																			}}
																			className="flex gap-4"
																			disabled={
																				effectiveReadonly
																			}
																		>
																			{(
																				indicatorDetail?.zq ||
																				[]
																			).map((item: any) => (
																				<Checkbox
																					key={item.id}
																					value={item.id}
																					className={`flex items-center rounded border px-2 py-0.5 text-sm ${selectedPlanTypes?.includes(item.id) ? "border-blue-500" : "border-gray-300"}`}
																					style={{
																						margin: 0,
																						height: "auto",
																						display:
																							"flex",
																					}}
																					disabled={
																						effectiveReadonly
																					}
																				>
																					{item.name}
																				</Checkbox>
																			))}
																		</Checkbox.Group>
																		{!effectiveReadonly && (
																			<Button
																				type="primary"
																				onClick={
																					handleManualSave
																				}
																			>
																				保存
																			</Button>
																		)}
																	</div>
																	<Form.Item>
																		<style>
																			{`
																	.red-header-table .ant-table-thead > tr > th {
																		border-color: rgba(228, 231, 237, 1) !important;
																	}
																	`}
																		</style>
																		<Table
																			className="red-header-table"
																			loading={planLoading}
																			columns={targetColumns}
																			dataSource={targets}
																			pagination={false}
																			size="small"
																			scroll={{ x: 1200 }}
																			bordered
																		/>
																	</Form.Item>
																</Form>
															),
														},
													]}
												/>
											</div>
										</>
									)}
								</div>
							</Col>
						</Row>
					</div>

					{/* drawer footer actions */}
					<div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 text-right">
						{!readonly && (
							<Button className="mr-2" onClick={() => setPermissionDrawerOpen(true)}>
								新增协作人
							</Button>
						)}
					</div>

					<SourceConfigDrawer
						open={sourceDrawerOpen}
						indicatorId={indicatorDetail?.id}
						effTaskIndicatorConfDetailsId={indicatorDetail?.id}
						indicatorName={indicatorDetail?.indicatorBasicBO?.name}
						row={
							activeSourceKey
								? goalRows.find((r) => r.key === activeSourceKey)
								: undefined
						}
						value={
							activeSourceKey
								? goalRows.find((r) => r.key === activeSourceKey)?.dataSourceDesc
								: undefined
						}
						unit={indicatorDetail?.indicatorBasicBO?.unitName || ""}
						dataRangeStart={indicatorDetail?.indicatorBasicBO?.dataRangeStart}
						dataRangeEnd={indicatorDetail?.indicatorBasicBO?.dataRangeEnd}
						decimalDigits={indicatorDetail?.indicatorBasicBO?.decimalDigits}
						templateId={1}
						onClose={async (res) => {
							setSourceDrawerOpen(false);
							if (res?.saved && activeSourceKey) {
								try {
									const payload: any = {
										id: activeSourceKey,
										dataSourceType: res.value.dataSourceCode,
									};
									if (res.value.dataSourceCode === 1) {
										payload.taskTableName = res.value.taskTableName;
										payload.mappings = res.value.mappings;
									}
									// const res2 = await updateIndicatorConfReferenceBasic(payload);
								} catch (e) {
									console.error(e);
									message.error("配置失败");
								}

								// res.value may be { sourceType, manualRows } or { sourceType }
								if (
									res.value &&
									typeof res.value === "object" &&
									"sourceType" in res.value
								) {
									updateGoalField(
										activeSourceKey,
										"dataSourceDesc",
										res.value.sourceType,
									);
									updateGoalField(
										activeSourceKey,
										"manualRows",
										res.value.manualRows ?? [],
									);
									if (res.value.taskTableName) {
										updateGoalField(activeSourceKey, "dataAsset", {
											taskTableName: res.value.taskTableName,
											mappings: res.value.mappings,
										});
									}
								} else {
									updateGoalField(
										activeSourceKey,
										"dataSourceDesc",
										res.value as any,
									);
								}
								fetchRefData(refPagination.current, refPagination.pageSize);
							}
						}}
					/>
					<BasicIndicatorDrawer
						open={basicDrawerOpen}
						indicatorName={indicatorDetail?.indicatorBasicBO?.name}
						effTaskIndicatorConfDetailsId={indicatorDetail?.id}
						row={
							activeBasicKey
								? goalRows.find((r) => r.key === activeBasicKey)
								: undefined
						}
						onClose={(res) => {
							setBasicDrawerOpen(false);
							if (res?.saved && activeBasicKey) {
								fetchRefData(refPagination.current, refPagination.pageSize);
							}
						}}
					/>
					<AdjustmentRangeModal
						open={biasModalOpen}
						initialValue={
							activeBiasKey
								? goalRows.find((r) => r.key === activeBiasKey)?.deviationFormulaStr
								: undefined
						}
						initialData={
							activeBiasKey
								? (() => {
										const row = goalRows.find((r) => r.key === activeBiasKey);
										if (!row) return undefined;
										return {
											formula: row.deviationFormula,
											method: row.deviationBoundaryRule,
											rangeMin: row.deviationRangeMin,
											rangeMax: row.deviationRangeMax,
										};
									})()
								: undefined
						}
						onClose={() => setBiasModalOpen(false)}
						onOk={async (value, rawData) => {
							if (activeBiasKey) {
								updateGoalField(activeBiasKey, "deviationFormulaStr", value);
								if (rawData) {
									try {
										const payload = {
											id: activeBiasKey,
											deviationFormula: rawData.formula,
											deviationBoundaryRule:
												rawData.adjustmentRangeBoundaryRule,
											deviationRangeMin: rawData.adjustmentRangeMin,
											deviationRangeMax: rawData.adjustmentRangeMax,
										};
										const res: any =
											await updateIndicatorConfReferenceBias(payload);
										if (res && res.code === 200) {
											fetchRefData(
												refPagination.current,
												refPagination.pageSize,
											);
										} else {
											message.error(res?.msg || "配置失败");
										}
									} catch (e) {
										console.error(e);
										message.error("配置失败");
									}
								}
							}
						}}
					/>
					<AddIndicatorDrawer
						open={addDrawerOpen}
						effTaskIndicatorConfId={record?.id}
						onClose={(res) => {
							setAddDrawerOpen(false);
							if (res?.saved) {
								// 刷新左侧树列表
								loadTree();
							}
						}}
					/>

					<AddDecomposeObjectModal
						open={addDecomposeModalOpen}
						quickFilterId={indicatorDetail?.id}
						onClose={(res) => {
							setAddDecomposeModalOpen(false);
							if (res?.saved) {
								// 刷新参考设置列表
								fetchRefData(refPagination.current, refPagination.pageSize);
							}
						}}
					/>

					{/* Preview Drawer (opened when user clicks 预览) */}
					<PreviewDrawer
						open={previewOpen}
						data={{ indicatorDetail, targets }}
						indicators={treeData
							.flatMap((node) => node.children || [])
							.map((child: any) => ({
								label: child.title,
								value: child.data.id,
							}))}
						onClose={(res) => {
							setPreviewOpen(false);
							if (res?.cancelled) {
								message.info("已关闭预览");
							}
						}}
					/>
					<PlanPermissionsDrawer
						open={permissionDrawerOpen}
						record={{ ...record, id: record?.id }}
						onClose={() => setPermissionDrawerOpen(false)}
						dataType={2}
					/>
				</ConfigProvider>
			</IndicatorContext.Provider>
		</Drawer>
	);
}
