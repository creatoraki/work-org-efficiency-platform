import type { ColumnsType } from "antd/es/table";
import { fetchSubmitUserSubmitPage } from "#src/api/strategy";
import {
	deleteIndicatorTargetDecompositionMainResponsible,
	fetchIndicatorTargetDecompositionObjectsTree,
	submitIndicatorTargetDecompositionMainResponsible,
	submitIndicatorTargetDecompositionMainResponsibleDecomposingIndicators,
	submitIndicatorTargetDecompositionMainResponsibleSubmit,
	submitIndicatorTargetDecompositionObjects,
	submitIndicatorTargetDecompositionObjectsEdit,
	undoPublishFlow,
} from "#src/api/strategy/target-plan";
import { strategyExcelDataImport, strategyExcelTemplateExport } from "#src/api/system/files";
import { useModal } from "#src/components/modal-manager/context.js";
import { SectionTitle } from "#src/components/section-title/index.js";
import { useGlobalStore } from "#src/store";
import { downloadBlob } from "#src/utils/files";

// #region Imports: API & Components
import { request } from "#src/utils/request";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
	Button,
	Col,
	ConfigProvider,
	DatePicker,
	Drawer,
	Form,
	Input,
	List,
	message,
	Modal,
	Popover,
	Row,
	Select,
	Space,
	Table,
	Tag,
	theme,
	TreeSelect,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";

import React from "react";
import AddDecomposeObjectModal from "../../target-decomposition/modal/AddDecomposeObjectModal";
import { commonDrawerProps } from "../constants/base";
import AddGroupedIndicatorDrawer from "./AddGroupedIndicatorDrawer";
import DecomposeMetricModal from "./DecomposeMetric-modal";
import PersonCreateModal from "./Person-create-modal";
import PlanPermissionsDrawer from "./Plan-permissions-drawer";
// #endregion

// #region Types & Interfaces
interface Props {
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
	readOnly?: boolean;
	afterOpenChange?: (open: boolean) => void;
}

interface Step {
	id: string;
	seq: number;
	name: string;
	status: "published" | "unpublished";
	effTargetPlanId?: number;
	synVersion?: number;
	statusStr?: string;
	targetPlanSynVersion?: number;
}

interface Collaborator {
	id: string;
	name: string;
	employeeId?: string;
	department?: string;
	permissions?: string[];
}

// const mockAdmin = 1;
// #endregion

export default function PlanFlowDrawer({
	open,
	record,
	onClose,
	readOnly = false,
	afterOpenChange,
}: Props) {
	const { token } = theme.useToken();
	const { deptTree, loadDeptTree } = useGlobalStore();
	const [mainForm] = Form.useForm();
	const [decomposeForm] = Form.useForm();

	// #region State: Steps & Navigation (流程步骤与导航)
	const [steps, setSteps] = React.useState<Step[]>([]);
	const [selected, setSelected] = React.useState<string | null>(null);
	const [direction, setDirection] = React.useState(0);
	const [, setLoadingSteps] = React.useState(false);
	// 用于在异步操作中获取当前选中的步骤，避免闭包陷阱
	const currentStepRef = React.useRef<Step | undefined>(steps.find((s) => s.id === selected));
	const currentStep = steps.find((s) => s.id === selected);
	// #endregion

	// #region State: Data Persistence (表单数据缓存)
	// 切换步骤时，缓存当前步骤的表单数据，避免丢失
	const [, setMainValuesMap] = React.useState<Record<string, any>>({});
	const [, setDecomposeValuesMap] = React.useState<Record<string, any>>({});
	const [confDetail, setConfDetail] = React.useState<any>(null); // 步骤1的详情
	const [decomposeDetail, setDecomposeDetail] = React.useState<any>(null); // 步骤N的详情
	// #endregion

	// #region State: Collaborators (协作人列表 - 步骤1)
	const [collaborators, setCollaborators] = React.useState<Collaborator[]>([]);
	const [collPageNum, setCollPageNum] = React.useState(1);
	const [collPageSize, setCollPageSize] = React.useState(10);
	const [collTotal, setCollTotal] = React.useState(0);
	const [collLoading, setCollLoading] = React.useState(false);
	const [collUpdatingIds, setCollUpdatingIds] = React.useState<string[]>([]); // 正在更新权限的ID
	const [collDelIds, setCollDelIds] = React.useState<string[]>([]); // 标记删除的ID
	const [collSuspendedVersion, setCollSuspendedVersion] = React.useState<string>(""); // 暂存版本号
	const collKstTRef = React.useRef<Record<string, any>>({}); // 协作人数据缓存
	// #endregion

	// #region State: Decomposition Table (拆解表 - 步骤N)
	const [decomposeData, setDecomposeData] = React.useState<any[]>([]);
	const [decomposeLoading, setDecomposeLoading] = React.useState(false);
	const [decomposePageNum, setDecomposePageNum] = React.useState(1);
	const [decomposePageSize, setDecomposePageSize] = React.useState(10);
	const [decomposeTotal, setDecomposeTotal] = React.useState(0);
	const kstTRef = React.useRef<Record<string, any>>({}); // 拆解表数据缓存
	const mainResponsibleFileInputRef = React.useRef<HTMLInputElement>(null);
	// 拆解表所在容器，用于计算自适应高度
	const decomposeTableWrapRef = React.useRef<HTMLDivElement>(null);
	const [decomposeTableScrollY, setDecomposeTableScrollY] = React.useState<number>(0);
	// #endregion

	// #region State: Step Cache (步骤缓存)
	const stepCache = React.useRef<
		Record<
			string,
			{
				formValues?: any;
				tableData?: any[];
				total?: number;
				pageNum?: number;
				pageSize?: number;
				kstT?: any;
				delIds?: any[];
				detail?: any;
				suspendedVersion?: string;
			}
		>
	>({});
	// #endregion

	// #region State: Modals Visibility (各类弹窗控制)
	// 流程步骤增删改
	const [stepModalOpen, setStepModalOpen] = React.useState(false);
	const [stepModalMode, setStepModalMode] = React.useState<"add" | "edit">("add");
	const [editingStepId, setEditingStepId] = React.useState<string | null>(null);
	const [stepNameInput, setStepNameInput] = React.useState("");
	const [stepConfirmLoading, setStepConfirmLoading] = React.useState(false);

	// 人员选择与权限
	const [personModalOpen, setPersonModalOpen] = React.useState(false);
	const [planOwnerModalOpen, setPlanOwnerModalOpen] = React.useState(false);
	const [mainResponsibleModalOpen, setMainResponsibleModalOpen] = React.useState(false);
	const [planPermissionsDrawerOpen, setPlanPermissionsDrawerOpen] = React.useState(false);
	const [editingPermissionsRow, setEditingPermissionsRow] = React.useState<any>(null);
	const [editingResponsibleRow, setEditingResponsibleRow] = React.useState<any>(null);

	// 拆解对象与指标
	const [addDecomposeObjectModalOpen, setAddDecomposeObjectModalOpen] = React.useState(false);
	const [decomposeMetricModalOpen, setDecomposeMetricModalOpen] = React.useState(false);
	const [decomposeIndicatorModalOpen, setDecomposeIndicatorModalOpen] = React.useState(false);
	const [editingDecomposeRow, setEditingDecomposeRow] = React.useState<any>(null);
	const modal = useModal();

	// 任务跟进抽屉
	const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false);
	const [taskLogs] = React.useState(() => [
		{ id: "t1", event: "创建任务", actor: "张三", content: "初始化流程，添加指标配置" },
		{ id: "t2", event: "指派主责人", actor: "李四", content: "指派张三为主责人" },
	]);
	// #endregion

	// #region Effects: Initialization & Sync
	const genSuspendedVersion = () =>
		`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	// 同步 Ref
	React.useEffect(() => {
		currentStepRef.current = steps.find((s) => s.id === selected);
	}, [selected, steps]);

	// 监听拆解表容器尺寸，动态计算 Table 滚动高度，避免分页被遮挡
	React.useEffect(() => {
		if (!open) return;
		const el = decomposeTableWrapRef.current;
		if (!el) return;
		const computeScrollY = () => {
			// 容器高度 - 表头(约 40) - 分页区(约 56)
			const next = Math.max(160, el.clientHeight - 40 - 56);
			setDecomposeTableScrollY(next);
		};
		computeScrollY();
		const observer = new ResizeObserver(computeScrollY);
		observer.observe(el);
		return () => observer.disconnect();
	}, [open, selected]);

	// 同步表头滚动条占位列样式，修复右侧固定列(操作列)表头与表体不对齐问题
	// @see https://github.com/ant-design/ant-design/issues/53036
	React.useLayoutEffect(() => {
		const wrapper = decomposeTableWrapRef.current;
		if (!wrapper) return;
		// scrollbar-width: thin 在 Windows 上的实际宽度约为 10px
		const scrollbarWidth = 10;
		const syncStyle = () => {
			const body = wrapper.querySelector(".ant-table-body") as HTMLElement | null;
			const header = wrapper.querySelector(".ant-table-header") as HTMLElement | null;
			if (!body || !header) return;
			const hasScrollbar = body.scrollHeight > body.clientHeight;
			const scrollbarCell = header.querySelector(
				".ant-table-cell-scrollbar",
			) as HTMLElement | null;
			const fixRightCell = header.querySelector(
				".ant-table-cell-fix-right-first",
			) as HTMLElement | null;
			if (hasScrollbar) {
				if (scrollbarCell)
					scrollbarCell.style.cssText = `display: table-cell; width: ${scrollbarWidth}px; min-width: ${scrollbarWidth}px; position: sticky; right: 0;`;
				if (fixRightCell) fixRightCell.style.right = `${scrollbarWidth}px`;
			} else {
				if (scrollbarCell) scrollbarCell.style.display = "none";
				if (fixRightCell) fixRightCell.style.right = "0";
			}
		};
		const timer = setTimeout(syncStyle, 50);
		const body = wrapper.querySelector(".ant-table-body");
		const observer = new ResizeObserver(syncStyle);
		if (body) observer.observe(body);
		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	}, [open, selected, decomposeData, decomposeTableScrollY]);

	// 加载步骤N详情 (拆解详情)
	const fetchIndicatorTargetDecompositionDetail = async (id: number | string) => {
		try {
			const res: any = await request.get(`indicator/submit/${id}`).json();
			if (res && res.code === 200 && res.data) {
				const data = res.data;
				setDecomposeDetail(data);
				const start = data.startTime ? dayjs(data.startTime) : undefined;
				const end = data.deadline ? dayjs(data.deadline) : undefined;
				const date = start || end ? [start || null, end || null] : undefined;
				const note = data.remark ?? "";
				decomposeForm.setFieldsValue({ decompose: { date, note } });
				if (data.statusStr) {
					setSteps((prev) =>
						prev.map((s) =>
							s.id === String(id) ? { ...s, statusStr: data.statusStr } : s,
						),
					);
				}
			}
		} catch (e) {
			console.error("fetchIndicatorTargetDecompositionDetail failed", e);
		}
	};

	// 加载拆解表数据
	const loadDecomposeTable = async (p = 1, size = 5, stepId?: string) => {
		setDecomposeLoading(true);
		try {
			const numericStepId = Number(
				(stepId ?? currentStepRef.current?.id) &&
					!Number.isNaN(Number(stepId ?? currentStepRef.current?.id))
					? Number(stepId ?? currentStepRef.current?.id)
					: 0,
			);
			const payload = {
				pageNum: p,
				pageSize: size,
				searchCount: true,
				taskIndicatorSubmitId: numericStepId,
				suspendedVersion: collSuspendedVersion ?? "",
				submitUserDelIds: collDelIds ?? [],
				kstT: kstTRef.current,
			};
			const resp: any = await fetchSubmitUserSubmitPage(payload);
			if (!resp) {
				setDecomposeData([]);
				setDecomposeTotal(0);
				return;
			}
			const list = Array.isArray(resp.data)
				? resp.data
				: Array.isArray(resp?.data?.list)
					? resp.data.list
					: [];
			const filteredList = list.filter((item: any) => item.sort !== 0);
			const tot = resp?.total ?? resp?.data?.total ?? filteredList.length;
			const mappedList = filteredList.map((it: any) => ({
				key: String(it.id ?? it.effTaskIndicatorSubmitId ?? Math.random()),
				...it,
			}));
			setDecomposeData(mappedList);
			decomposeForm.setFieldsValue({ decompositions: mappedList });
			setDecomposeTotal(tot || filteredList.length);
			setDecomposePageNum(p);
			setDecomposePageSize(size);
		} catch (e) {
			console.error("loadDecomposeTable failed", e);
			setDecomposeData([]);
			setDecomposeTotal(0);
		} finally {
			setDecomposeLoading(false);
		}
	};

	// 加载步骤1详情 (指标配置)
	const fetchIndicatorConfDetail = async (targetPlanId: number | string) => {
		try {
			const res: any = await request
				.get(`indicator/conf/detail/byTargetPlanId/${targetPlanId}`)
				.json();
			if (res && res.code === 200 && res.data) {
				setConfDetail(res.data);
				const data = res.data;
				const owner = data.responsibleUserName ?? "";
				const responsibleUserId = data.responsibleUserId;
				const start = data.startTime ? dayjs(data.startTime) : undefined;
				const end = data.deadline ? dayjs(data.deadline) : undefined;
				const remark = data.remark ?? "";
				const dateRange = start || end ? [start || null, end || null] : undefined;
				const synVersion = res.data.synVersion;
				const targetPlanSynVersion = res.data.targetPlanSynVersion;

				mainForm.setFieldsValue({
					owner,
					responsibleUserId,
					date: dateRange,
					note: remark,
					synVersion,
				});

				// 更新 steps 中的版本号，防止被 useEffect 重置 currentStepRef 时丢失
				setSteps((prev) =>
					prev.map((s) => {
						if (s.id === currentStepRef.current?.id) {
							return { ...s, synVersion, targetPlanSynVersion };
						}
						return s;
					}),
				);

				currentStepRef.current = {
					...currentStepRef.current,
					targetPlanSynVersion: res.data.targetPlanSynVersion,
					synVersion,
				} as any;
			} else {
				setConfDetail(null);
			}
		} catch (e) {
			console.error("load indicator conf detail failed", e);
			setConfDetail(null);
		}
	};

	// 加载左侧实施流程列表
	const fetchImplementationProcess = async (
		targetPlanId: string | number,
		targetStepId?: string,
		forceFirst = false,
	) => {
		setLoadingSteps(true);
		try {
			const res: any = await request
				.get(`target/plan/implementationProcess/${targetPlanId}`, { errorMessage: true })
				.json();
			if (res && res.code === 200) {
				const list = Array.isArray(res.data) ? res.data : (res.data?.list ?? []);
				const mapped: Step[] = list.map((it: any, idx: number) => {
					const rawStatus = it.status;
					const isPublished =
						rawStatus === 1 ||
						rawStatus === "1" ||
						rawStatus === "published" ||
						rawStatus === "已发布" ||
						rawStatus === true ||
						it.published;
					return {
						id: String(it.id ?? it.stepId ?? `s_${idx}`),
						seq: Number(it.seq ?? it.order ?? idx + 1),
						name: it.name ?? it.title ?? `步骤 ${idx + 1}`,
						status: isPublished ? "published" : "unpublished",
						effTargetPlanId: it.effTargetPlanId ?? it.targetPlanId ?? undefined,
						effTargetPlanSynVersion:
							it.effTargetPlanSynVersion ?? it.synVersion ?? undefined,
						statusStr: it.statusStr,
					} as Step;
				});
				setSteps(mapped);

				// 决定选中哪个步骤
				let nextId = mapped[0]?.id ?? null;
				if (targetStepId) {
					const found = mapped.find((s) => s.id === targetStepId);
					if (found) nextId = found.id;
					else if (mapped.length > 0) nextId = mapped[mapped.length - 1].id; // Fallback to last
				} else if (
					!forceFirst &&
					currentStepRef.current?.id &&
					mapped.find((s) => s.id === currentStepRef.current?.id)
				) {
					nextId = currentStepRef.current.id;
				}
				setSelected(nextId);

				// 加载选中步骤的详情
				if (nextId) {
					const selectedStep = mapped.find((s) => s.id === nextId);
					currentStepRef.current = selectedStep;
				}
			}
		} catch (e) {
			console.error("fetch implementation process failed", e);
		} finally {
			setLoadingSteps(false);
		}
	};

	// 打开抽屉时初始化
	React.useEffect(() => {
		if (open) {
			loadDeptTree();
			collKstTRef.current = {};
			setCollDelIds([]);
			setCollSuspendedVersion(genSuspendedVersion());
			stepCache.current = {};

			if (record && (record.id || (record as any).targetPlanEntityId)) {
				const id = record.id || (record as any).targetPlanEntityId;
				setMainValuesMap({});
				setDecomposeValuesMap({});
				fetchImplementationProcess(id, undefined, true);
			} else {
				setSelected(steps[0]?.id ?? null);
			}
		} else {
			setSelected(steps[0]?.id ?? null);
		}
	}, [open, record]);

	// 加载协作人列表
	const loadCollaborators = async (
		p = 1,
		size = 5,
		overrideDelIds?: string[],
		stepId?: string,
	) => {
		setCollLoading(true);
		try {
			const numericStepId = Number(
				(stepId ?? currentStepRef.current?.id) &&
					!Number.isNaN(Number(stepId ?? currentStepRef.current?.id))
					? Number(stepId ?? currentStepRef.current?.id)
					: 0,
			);
			const payload = {
				pageNum: p,
				pageSize: size,
				searchCount: true,
				dataId: numericStepId,
				dataType: 2,
				suspendedVersion: collSuspendedVersion,
				delIds: typeof overrideDelIds !== "undefined" ? overrideDelIds : collDelIds,
				kstT: collKstTRef.current,
			};
			const resp: any = await request
				.post("user/perm/page", { json: payload, ignoreLoading: true })
				.json();
			if (!resp) {
				setCollaborators([]);
				setCollTotal(0);
				return;
			}
			const list = Array.isArray(resp?.data?.list)
				? resp.data.list
				: Array.isArray(resp?.data)
					? resp.data
					: Array.isArray(resp?.list)
						? resp.list
						: [];
			const filteredList = list.filter((item: any) => item.sort !== 0);
			const tot = resp?.data?.total ?? resp?.total ?? filteredList.length;
			setCollaborators(filteredList);
			setCollTotal(tot || filteredList.length);
			setCollPageNum(p);
			setCollPageSize(size);
		} catch (e) {
			console.error("load collaborators failed", e);
			setCollaborators([]);
			setCollTotal(0);
		} finally {
			setCollLoading(false);
		}
	};

	// 切换步骤时，回填表单数据或加载数据
	React.useEffect(() => {
		if (!open) return;
		const sel = selected ?? steps[0]?.id;
		if (!sel) return;

		const idx = steps.findIndex((s) => s.id === sel);
		const cached = stepCache.current[sel];
		const selStep = steps[idx];

		if (cached) {
			// 有缓存，恢复数据
			if (idx === 0) {
				mainForm.setFieldsValue(cached.formValues);
				setCollaborators(cached.tableData || []);
				setCollTotal(cached.total || 0);
				setCollPageNum(cached.pageNum || 1);
				setCollPageSize(cached.pageSize || 10);
				collKstTRef.current = cached.kstT || {};
				setCollDelIds(cached.delIds || []);
				setConfDetail(cached.detail);
				setCollSuspendedVersion(cached.suspendedVersion || genSuspendedVersion());
				if (cached.detail) {
					currentStepRef.current = {
						...currentStepRef.current,
						targetPlanSynVersion: cached.detail.targetPlanSynVersion,
						synVersion: cached.detail.synVersion,
					} as any;
				}
			} else {
				decomposeForm.setFieldsValue(cached.formValues);
				setDecomposeData(cached.tableData || []);
				setDecomposeTotal(cached.total || 0);
				setDecomposePageNum(cached.pageNum || 1);
				setDecomposePageSize(cached.pageSize || 10);
				kstTRef.current = cached.kstT || {};
				setCollDelIds(cached.delIds || []);
				setDecomposeDetail(cached.detail);
				setCollSuspendedVersion(cached.suspendedVersion || genSuspendedVersion());
			}
		} else {
			// 无缓存，加载数据
			if (idx === 0) {
				setCollaborators([]);
				setCollTotal(0);
				collKstTRef.current = {};
				setCollDelIds([]);
				setConfDetail(null);
				// 步骤1通常使用全局生成的suspendedVersion，或者如果需要隔离，这里可以重新生成
				// 这里保持使用当前的collSuspendedVersion (由open时生成)

				const targetPlanIdForConf =
					selStep?.effTargetPlanId ?? record?.id ?? (record as any)?.targetPlanId ?? 0;
				if (targetPlanIdForConf) fetchIndicatorConfDetail(targetPlanIdForConf);
				loadCollaborators(1, collPageSize, undefined, sel);
			} else {
				setDecomposeData([]);
				setDecomposeTotal(0);
				kstTRef.current = {};
				setCollDelIds([]);
				setDecomposeDetail(null);

				loadDecomposeTable(1, decomposePageSize, sel);
				if (sel && !sel.startsWith("s_")) {
					fetchIndicatorTargetDecompositionDetail(sel);
				}
			}
		}
	}, [open, selected, record]);
	// #endregion

	// #region API: Data Fetching (数据加载)

	// #endregion

	// #region Handlers: Step Navigation & CRUD (流程操作)

	// 保存当前表单状态到 Map
	const saveCurrentState = () => {
		if (!selected) return;
		try {
			const idx = steps.findIndex((s) => s.id === selected);
			const commonData = {
				suspendedVersion: collSuspendedVersion,
				delIds: [...collDelIds],
			};

			if (idx === 0) {
				stepCache.current[selected] = {
					...commonData,
					formValues: mainForm.getFieldsValue(),
					tableData: collaborators,
					total: collTotal,
					pageNum: collPageNum,
					pageSize: collPageSize,
					kstT: { ...collKstTRef.current },
					detail: confDetail,
				};
			} else {
				stepCache.current[selected] = {
					...commonData,
					formValues: decomposeForm.getFieldsValue(),
					tableData: decomposeData,
					total: decomposeTotal,
					pageNum: decomposePageNum,
					pageSize: decomposePageSize,
					kstT: { ...kstTRef.current },
					detail: decomposeDetail,
				};
			}
		} catch (e) {
			console.error(e);
		}
	};

	// 切换步骤
	const handleSelectStep = (id: string) => {
		saveCurrentState(); // 切换前保存当前表单状态
		const oldIdx = steps.findIndex((s) => s.id === selected);
		const selIdx = steps.findIndex((s) => s.id === id);
		if (oldIdx !== -1 && selIdx !== -1) {
			setDirection(selIdx > oldIdx ? 1 : -1);
		}

		const selStep = selIdx >= 0 ? steps[selIdx] : undefined;
		currentStepRef.current = selStep;
		setSelected(id);
	};

	// 打开新增流程弹窗
	const openAddModal = () => {
		if (readOnly) return;
		setStepModalMode("add");
		setEditingStepId(null);
		setStepNameInput("");
		setStepModalOpen(true);
	};

	// 打开编辑流程弹窗
	const openEditModal = (id: string) => {
		if (readOnly) return;
		const s = steps.find((x) => x.id === id);
		if (String(s?.status) === "1" || s?.status === "published") {
			message.warning("已发布的流程禁止修改");
			return;
		}
		setStepModalMode("edit");
		setEditingStepId(id);
		setStepNameInput(s?.name ?? "");
		setStepModalOpen(true);
	};

	// 确认新增/修改流程
	const handleStepOk = async () => {
		const name = stepNameInput.trim();
		if (!name) {
			Modal.warn({ title: "请输入流程名称" });
			return;
		}
		setStepConfirmLoading(true);
		try {
			if (stepModalMode === "add") {
				if (!record) {
					Modal.warn({ title: "无法识别目标计划，请先保存计划或重新打开页面" });
					return;
				}
				saveCurrentState();
				const targetPlanId =
					record.effTargetPlanId ?? record.id ?? (record as any).targetPlanId ?? 0;
				const payload = { name, targetPlanId };
				const res: any = await request
					.post("indicator/submit", { json: payload, errorMessage: true })
					.json();
				if (res && res.code === 200) {
					const newId = String(res.data?.id ?? res.data?.indicatorId ?? `s${Date.now()}`);
					fetchImplementationProcess(targetPlanId, newId);
				}
			} else if (stepModalMode === "edit" && editingStepId) {
				saveCurrentState();
				const payload = {
					id: Number.isFinite(Number(editingStepId))
						? Number(editingStepId)
						: editingStepId,
					name,
				};
				const res: any = await request
					.put("indicator/submit/editName", { json: payload, errorMessage: true })
					.json();
				if (res && res.code === 200) {
					setSteps((prev) =>
						prev.map((p) => (p.id === editingStepId ? { ...p, name } : p)),
					);
					const targetPlanId =
						record?.effTargetPlanId ?? record?.id ?? (record as any)?.targetPlanId ?? 0;
					fetchImplementationProcess(targetPlanId);
				}
			}
		} catch (e) {
			console.error("step operation failed", e);
		} finally {
			setStepConfirmLoading(false);
			setStepModalOpen(false);
			setEditingStepId(null);
			setStepNameInput("");
		}
	};

	const handleStepCancel = () => {
		setStepModalOpen(false);
		setEditingStepId(null);
		setStepNameInput("");
	};

	// 删除流程
	const handleDeleteStep = (id: string) => {
		if (readOnly) return;
		const s = steps.find((x) => x.id === id);
		if (String(s?.status) === "1" || s?.status === "published") {
			message.warning("已发布的流程禁止删除");
			return;
		}
		Modal.confirm({
			title: "确认删除该流程吗？",
			onOk: async () => {
				if (!record) return;
				const targetPlanId =
					record.effTargetPlanId ?? record.id ?? (record as any).targetPlanId ?? 0;
				try {
					const res: any = await request
						.delete(`indicator/submit/${targetPlanId}/${id}`, { errorMessage: true })
						.json();
					if (res && res.code === 200) {
						const nextSteps = steps
							.filter((s) => s.id !== id)
							.map((p, idx) => ({ ...p, seq: idx + 1 }));
						setSteps(nextSteps);
						if (stepCache.current[id]) {
							delete stepCache.current[id];
						}
						setMainValuesMap((prev) => {
							const n = { ...prev };
							delete n[id];
							return n;
						});
						setDecomposeValuesMap((prev) => {
							const n = { ...prev };
							delete n[id];
							return n;
						});
						setSelected(nextSteps[0]?.id ?? null);
						message.success(res.msg || "删除流程成功");
					}
				} catch (e) {
					console.error("delete step failed", e);
				}
			},
		});
	};
	// #endregion

	// #region Handlers: Global Actions (Save Draft & Publish)

	// 提交拆解 (暂存或发布)
	const submitDecomposition = async (status: number) => {
		const numericStepId = Number(
			currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current?.id))
				? Number(currentStepRef.current?.id)
				: 0,
		);
		try {
			const dateRange: any = decomposeForm.getFieldValue(["decompose", "date"]);
			const startMoment = Array.isArray(dateRange) ? dateRange[0] : dateRange;
			const endMoment = Array.isArray(dateRange) ? dateRange[1] : undefined;
			const formattedStart =
				startMoment && startMoment.format
					? startMoment.format("YYYY-MM-DD")
					: startMoment
						? String(startMoment)
						: "";
			const formattedEnd =
				endMoment && endMoment.format
					? endMoment.format("YYYY-MM-DD")
					: endMoment
						? String(endMoment)
						: "";
			const remark = decomposeForm.getFieldValue(["decompose", "note"]) ?? "";

			const payload = {
				effTaskIndicatorSubmitId: numericStepId,
				targetPlanId: currentStepRef.current?.effTargetPlanId ?? record?.id ?? 0,
				startTime: formattedStart,
				deadline: formattedEnd,
				remark,
				status,
				suspendedVersion: collSuspendedVersion,
				effTaskIndicatorSubmitUserDelIds: collDelIds,
				kstT: kstTRef.current,
			};

			const res = await submitIndicatorTargetDecompositionMainResponsibleSubmit(payload);
			if (res && res.code === 200) {
				message.success(status === 1 ? "发布成功" : "暂存成功");
				if (status === 1) {
					kstTRef.current = {};
					setCollDelIds([]);
					setCollSuspendedVersion(genSuspendedVersion());
				}
				fetchImplementationProcess(record?.id || (record as any).targetPlanEntityId);
				loadDecomposeTable(decomposePageNum, decomposePageSize);
				if (numericStepId) {
					fetchIndicatorTargetDecompositionDetail(numericStepId);
				}
			}
		} catch (e: any) {
			console.error("submit target decomposition failed", e);
		}
	};

	// 暂存按钮逻辑
	const handleSaveDraft = async () => {
		if (readOnly) return;
		saveCurrentState();
		const selIdx = steps.findIndex((s) => s.id === selected);
		const numericStepId = Number(
			currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current?.id))
				? Number(currentStepRef.current?.id)
				: 0,
		);

		if (selIdx === 0) {
			// 步骤1暂存
			try {
				const effForm = {
					dataId: numericStepId,
					dataType: 2,
					suspendedVersion: collSuspendedVersion,
					delIds: collDelIds,
					kstT: collKstTRef.current,
				};
				const ownerName = mainForm.getFieldValue("owner") ?? "";
				const responsibleUserId = mainForm.getFieldValue("responsibleUserId");
				const dateRange: any = mainForm.getFieldValue("date");
				const startMoment = Array.isArray(dateRange) ? dateRange[0] : dateRange;
				const endMoment = Array.isArray(dateRange) ? dateRange[1] : undefined;
				const formattedStart =
					startMoment && startMoment.format
						? startMoment.format("YYYY-MM-DD")
						: startMoment
							? String(startMoment)
							: "";
				const formattedEnd =
					endMoment && endMoment.format
						? endMoment.format("YYYY-MM-DD")
						: endMoment
							? String(endMoment)
							: "";
				const remark = mainForm.getFieldValue("note") ?? "";

				const payload: any = {
					id: numericStepId || 0,
					responsibleUserId,
					responsibleUserName: ownerName || "",
					startTime: formattedStart || "",
					deadline: formattedEnd || "",
					remark: remark || "",
					status: 0,
					targetPlanId: currentStepRef.current?.effTargetPlanId ?? record?.id ?? 0,
					synVersion: currentStepRef.current?.synVersion ?? record?.synVersion ?? 0,
					targetPlanSynVersion:
						currentStepRef.current?.targetPlanSynVersion ??
						record?.targetPlanSynVersion ??
						0,
					effUserDataPermEditForm: effForm,
				};
				const resp: ApiResponse<{ synVersion: number; targetPlanSynVersion: number }> =
					await request.put("indicator/conf", { json: payload }).json();
				if (resp && resp.code === 200) {
					message.success("暂存成功");
					// 清理 kstt 和 delids，并生成新的 suspendedVersion
					collKstTRef.current = {};
					setCollDelIds([]);
					setCollSuspendedVersion(genSuspendedVersion());

					if (resp.data) {
						if (currentStepRef.current) {
							currentStepRef.current.synVersion = resp.data.synVersion;
							currentStepRef.current.targetPlanSynVersion =
								resp.data.targetPlanSynVersion;
						}
						setSteps((prev) =>
							prev.map((s) => {
								if (s.id === selected) {
									return {
										...s,
										synVersion: resp.data.synVersion,
										targetPlanSynVersion: resp.data.targetPlanSynVersion,
									};
								}
								return s;
							}),
						);
					}
					await loadCollaborators(1, collPageSize);
				}
			} catch (e) {
				console.error("save draft indicator/conf failed", e);
			}
		} else {
			// 步骤N暂存
			await submitDecomposition(0);
		}
	};

	// 发布按钮逻辑
	const handlePublish = async () => {
		if (readOnly) return;
		saveCurrentState();
		const selIdx = steps.findIndex((s) => s.id === selected);

		try {
			if (selIdx === 0) await mainForm.validateFields();
			else await decomposeForm.validateFields([["decompose", "date"]]);
		} catch (e) {
			console.error("validation failed before publish", e);
			return;
		}

		Modal.confirm({
			title: "发布",
			content: `确认发布${currentStep?.name}吗？`,
			onOk: async () => {
				const numericStepId = Number(
					currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current?.id))
						? Number(currentStepRef.current?.id)
						: 0,
				);

				if (selIdx === 0) {
					// 步骤1发布
					try {
						const effForm = {
							dataId: numericStepId,
							dataType: 2,
							suspendedVersion: collSuspendedVersion,
							delIds: collDelIds,
							kstT: collKstTRef.current,
						};
						const ownerName = mainForm.getFieldValue("owner") ?? "";
						const ownerId = mainForm.getFieldValue("responsibleUserId");
						const dateRange: any = mainForm.getFieldValue("date");
						const startMoment = Array.isArray(dateRange) ? dateRange[0] : dateRange;
						const endMoment = Array.isArray(dateRange) ? dateRange[1] : undefined;
						const formattedStart =
							startMoment && startMoment.format
								? startMoment.format("YYYY-MM-DD")
								: startMoment
									? String(startMoment)
									: "";
						const formattedEnd =
							endMoment && endMoment.format
								? endMoment.format("YYYY-MM-DD")
								: endMoment
									? String(endMoment)
									: "";
						const remark = mainForm.getFieldValue("note") ?? "";

						const payload: any = {
							id: numericStepId || 0,
							responsibleUserId: ownerId,
							responsibleUserName: ownerName || "",
							startTime: formattedStart || "",
							deadline: formattedEnd || "",
							remark: remark || "",
							status: 1,
							targetPlanId:
								currentStepRef.current?.effTargetPlanId ?? record?.id ?? 0,
							targetPlanSynVersion:
								currentStepRef.current?.targetPlanSynVersion ??
								record?.targetPlanSynVersion ??
								0,
							synVersion:
								currentStepRef.current?.synVersion ?? record?.synVersion ?? 0,
							effUserDataPermEditForm: effForm,
						};
						const resp: any = await request
							.put("indicator/conf", {
								json: payload,
								successMessage: true,
								errorMessage: true,
							})
							.json();
						if (resp && resp.code === 200) {
							setSteps((prev) =>
								prev.map((p) =>
									p.id === currentStep?.id ? { ...p, status: "published" } : p,
								),
							);
							collKstTRef.current = {};
							setCollDelIds([]);
							setCollSuspendedVersion(genSuspendedVersion());
							await loadCollaborators(1, collPageSize);
							await fetchImplementationProcess(
								record?.id || (record as any).targetPlanEntityId,
							);
							const targetPlanIdForConf =
								currentStepRef.current?.effTargetPlanId ??
								record?.id ??
								(record as any)?.targetPlanId ??
								0;
							if (targetPlanIdForConf) {
								fetchIndicatorConfDetail(targetPlanIdForConf);
							}
						}
					} catch (e) {
						console.error("publish indicator/conf failed", e);
					}
				} else {
					// 步骤N发布
					await submitDecomposition(1);
				}
			},
		});
	};
	// #endregion

	// #region Handlers: Collaborators (协作人操作)

	// 删除协作人
	const handleDeleteCollaborator = (person: any) => {
		if (readOnly) return;
		Modal.confirm({
			title: "确认删除该人员吗？",
			onOk: async () => {
				const originalId = Object.keys(collKstTRef.current).find(
					(key) => collKstTRef.current[key] === person.id,
				);

				if (originalId) {
					setCollUpdatingIds((arr) => Array.from(new Set([...arr, person.id])));
					try {
						const resp: any = await request
							.delete(`user/perm/user/suspended/${person.id}`)
							.json();
						const ok = !(
							resp &&
							typeof resp === "object" &&
							resp.code &&
							resp.code !== 0 &&
							resp.code !== 200
						);
						if (ok) {
							message.success(resp?.msg ?? "删除成功");
							const newDelIds = Array.from(new Set([...collDelIds, originalId]));
							setCollDelIds(newDelIds);
							delete collKstTRef.current[originalId];
							loadCollaborators(collPageNum, collPageSize, newDelIds);
						}
					} catch (e) {
						console.error("delete collaborator failed", e);
					} finally {
						setCollUpdatingIds((arr) => arr.filter((i) => i !== person.id));
					}
					return;
				}

				if (!person.suspendedVersion) {
					const newDelIds = Array.from(new Set([...collDelIds, person.id]));
					setCollDelIds(newDelIds);
					try {
						await loadCollaborators(collPageNum, collPageSize, newDelIds);
					} catch (e) {
						console.error("refresh after local delete failed", e);
					}
					return;
				}

				setCollUpdatingIds((arr) => Array.from(new Set([...arr, person.id])));
				try {
					const resp: any = await request
						.delete(`user/perm/user/suspended/${person.id}`)
						.json();
					const ok = !(
						resp &&
						typeof resp === "object" &&
						resp.code &&
						resp.code !== 0 &&
						resp.code !== 200
					);
					if (ok) {
						message.success(resp?.msg ?? "删除成功");
						loadCollaborators(collPageNum, collPageSize);
					}
				} catch (e) {
					console.error("delete collaborator failed", e);
				} finally {
					setCollUpdatingIds((arr) => arr.filter((i) => i !== person.id));
				}
			},
		});
	};

	// 修改协作人权限
	const handleCollaboratorPermChange = async (person: any, newPerm: number) => {
		const id = person.id;
		setCollUpdatingIds((arr) => Array.from(new Set([...arr, id])));
		try {
			const isInKstT = Object.values(collKstTRef.current).includes(person.id);

			const payload: any = {
				id: person?.id ?? 0,
				suspendedVersion: person.suspendedVersion ?? collSuspendedVersion ?? "",
				perm: newPerm,
				sourceNewB: !!person.suspendedVersion,
				// kstT: kstTMap,
			};
			if (isInKstT) {
				payload.suspendedEditId = person.id;
			}
			const resp: any = await request
				.put("user/perm/user/suspended", { json: payload, errorMessage: true })
				.json();
			const ok = !(resp && typeof resp === "object" && resp.code && resp.code !== 200);
			if (ok) {
				if (resp && resp.data) collKstTRef.current[person.id] = resp.data;
				loadCollaborators(collPageNum, collPageSize);
			}
		} catch (e) {
			console.error("update collaborator perm failed", e);
		} finally {
			setCollUpdatingIds((arr) => arr.filter((i) => i !== id));
		}
	};

	// 新增人员弹窗关闭回调
	const handlePersonModalClose = async (res?: any) => {
		setPersonModalOpen(false);
		if (!res) return;
		const items: any[] = Array.isArray(res) ? res : [res];
		const userIds = items
			.map((it) => it.userId ?? it.id ?? it)
			.filter((v) => v !== undefined && v !== null);
		if (userIds.length === 0) {
			// Fallback: 仅本地合并显示，不调用接口
			setCollaborators((cs) => {
				const map = new Map<string, Collaborator>();
				items.forEach((it: any) =>
					map.set(String(it.id ?? it.userId ?? Math.random()), {
						id: String(it.id ?? it.userId ?? Math.random()),
						name: it.name ?? it.userName ?? "",
						employeeId: it.employeeId ?? it.userCode,
						department: it.department ?? it.departName ?? "",
					}),
				);
				cs.forEach((c) => {
					if (!map.has(c.id)) map.set(c.id, c);
				});
				return Array.from(map.values());
			});
			loadCollaborators(1, collPageSize);
			return;
		}

		setCollLoading(true);
		try {
			const numericStepId = Number(
				currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current?.id))
					? Number(currentStepRef.current?.id)
					: 0,
			);
			const payload = {
				dataId: numericStepId,
				dataType: record?.dataType ?? 2,
				userIds,
				suspendedVersion: collSuspendedVersion ?? "",
				delIds: collDelIds,
				kstT: collKstTRef.current,
			};
			const resp: any = await request
				.post("user/perm/save/batch", { json: payload, errorMessage: true })
				.json();
			if (resp && resp.code === 200) {
				if (resp.data) {
					if (!Array.isArray(resp.data) && typeof resp.data === "object") {
						Object.assign(collKstTRef.current, resp.data);
					} else if (Array.isArray(resp.data)) {
						const map: Record<string, any> = {};
						resp.data.forEach((it: any) => {
							const key = String(
								it.id ?? it.userId ?? it.employeeId ?? it.userCode ?? "",
							);
							if (key) map[key] = it;
						});
						Object.assign(collKstTRef.current, map);
					}
				}
				await loadCollaborators(1, collPageSize);
			}
		} catch (e) {
			console.error("save batch failed", e);
		} finally {
			setCollLoading(false);
		}
	};
	// #endregion

	// #region Handlers: Decomposition Rows (拆解行操作)

	// 修改拆解对象
	const handleDecomposeTargetChange = async (
		index: number,
		record: any,
		val: any,
		label: any,
	) => {
		const targetOrgCode = val;
		const targetOrgName = label;

		const isInKstT = Object.values(kstTRef.current).includes(record.id);

		const payload: any = {
			id: record.id,
			targetPlanId: record.targetPlanId || currentStepRef.current?.effTargetPlanId,
			effTaskIndicatorSubmitId: record.effTaskIndicatorSubmitId,
			targetOrgCode,
			targetOrgName: targetOrgName.join(""),
			suspendedVersion: collSuspendedVersion,
			sourceNewB: !!record.suspendedVersion,
		};

		if (isInKstT) {
			payload.suspendedEditId = record.id;
		}

		try {
			const res = await submitIndicatorTargetDecompositionObjectsEdit(payload);
			if (res && res.success !== false) {
				if (!kstTRef.current) kstTRef.current = {};
				// kstTRef.current[record.id] = { ...record, targetOrgCode, targetOrgName };
				if (res.data) {
					kstTRef.current[record.id] = res.data;
				}
				const newData = [...decomposeData];
				if (newData[index]) {
					newData[index] = { ...newData[index], targetOrgCode, targetOrgName };
					setDecomposeData(newData);
					decomposeForm.setFieldValue([index, "targetOrgCode"], targetOrgCode);
				}
			}
		} catch (e) {
			console.error(e);
		}
	};

	// 新增拆解行 (打开弹窗)
	const handleAddDecomposeRow = () => {
		if (readOnly) return;
		setAddDecomposeObjectModalOpen(true);
	};

	// 提交新增拆解对象
	const handleAddDecomposeObjectSubmit = async (nodes: any[]) => {
		const numericStepId = Number(
			currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current?.id))
				? Number(currentStepRef.current?.id)
				: 0,
		);
		const targetPlanId =
			record?.effTargetPlanId ?? record?.id ?? (record as any)?.targetPlanId ?? 0;

		try {
			const promises = nodes.map((node) => {
				const payload = {
					targetPlanId,
					effTaskIndicatorSubmitId: numericStepId,
					targetOrgCode: node.key || node.id,
					targetOrgName: node.title || node.name,
					suspendedVersion: collSuspendedVersion,
					delIds: collDelIds,
					kstT: collKstTRef.current,
				};
				return submitIndicatorTargetDecompositionObjects(payload);
			});

			await Promise.all(promises);
			loadDecomposeTable(1, decomposePageSize, selected ?? undefined);
			return true;
		} catch (e) {
			console.error("add decompose objects failed", e);
			return false;
		}
	};

	// 删除拆解行
	const handleDeleteDecomposeRow = (record: any) => {
		if (readOnly) return;
		Modal.confirm({
			title: "确认删除该条数据吗？",
			onOk: async () => {
				const id = record.id || record.key;

				const originalId = Object.keys(kstTRef.current).find(
					(key) => kstTRef.current[key] === id,
				);

				if (originalId) {
					try {
						const res = await deleteIndicatorTargetDecompositionMainResponsible(id);
						if (res && res.code === 200) {
							message.success("删除成功");
							const newDelIds = Array.from(new Set([...collDelIds, originalId]));
							setCollDelIds(newDelIds);
							delete kstTRef.current[originalId];
							loadDecomposeTable(decomposePageNum, decomposePageSize, undefined);
						}
					} catch (e) {
						console.error("delete decompose row failed", e);
					}
					return;
				}

				if (record.suspendedVersion) {
					try {
						const res = await deleteIndicatorTargetDecompositionMainResponsible(id);
						if (res && res.code === 200) {
							message.success("删除成功");
							loadDecomposeTable(decomposePageNum, decomposePageSize);
						}
					} catch (e) {
						console.error("delete decompose row failed", e);
					}
				} else {
					const newDelIds = Array.from(new Set([...collDelIds, id]));
					setCollDelIds(newDelIds);
					loadDecomposeTable(decomposePageNum, decomposePageSize);
				}
			},
		});
	};

	// 撤销发布拆解行
	const handleUndoPublishRow = (record: any) => {
		if (readOnly) return;
		Modal.confirm({
			title: "确认撤销发布吗？",
			content: "撤销后，该条数据将变为未发布状态。",
			onOk: async () => {
				const id = record.id || record.key;
				try {
					const res: any = await undoPublishFlow(id);
					if (res && res.code === 200) {
						message.success("撤销发布成功");
						loadDecomposeTable(decomposePageNum, decomposePageSize);
					}
				} catch (e) {
					console.error("undo publish row failed", e);
				}
			},
		});
	};

	// 主责人弹窗关闭
	const handlePlanOwnerModalClose = (res?: any) => {
		setPlanOwnerModalOpen(false);
		if (!res) return;
		const person = Array.isArray(res) ? res[0] : res;
		if (person) {
			mainForm.setFieldsValue({
				owner: person.name,
				responsibleUserId: person.id,
			});
		}
	};

	// 拆解行主责人弹窗关闭
	const handleMainResponsibleModalClose = async (res?: any) => {
		setMainResponsibleModalOpen(false);
		if (!res || !editingResponsibleRow) return;
		const items: any[] = Array.isArray(res) ? res : [res];
		if (items.length === 0) return;

		const isInKstT = Object.values(kstTRef.current).includes(editingResponsibleRow.id);

		try {
			const payload: any = {
				id: editingResponsibleRow.id,
				responsibleUserId: res[0].id,
				suspendedVersion: collSuspendedVersion,
				sourceNewB: !!editingResponsibleRow.suspendedVersion,
			};

			if (isInKstT) {
				payload.suspendedEditId = editingResponsibleRow.id;
			}

			const resp = await submitIndicatorTargetDecompositionMainResponsible(payload);
			if (resp && resp.success !== false) {
				if (resp.data) kstTRef.current[editingResponsibleRow.id] = resp.data;
				loadDecomposeTable(decomposePageNum, decomposePageSize);
			}
		} catch (e) {
			console.error(e);
		} finally {
			setEditingResponsibleRow(null);
		}
	};

	// 拆解指标相关
	const handleDecomposeMetricClose = () => setDecomposeMetricModalOpen(false);
	const handleDecomposeIndicatorSubmit = async (keys: React.Key[], selectedR: any[]) => {
		if (!editingDecomposeRow) return false;
		let isNew = false;
		const values = Object.values(kstTRef.current);
		const found = values.find((v: any) => String(v.id) === String(editingDecomposeRow.id));
		if (!editingDecomposeRow.suspendedVersion) {
			// 没有suspendedVersion, 也就是老数据，老数据是否存在于kstT中来判断是否为新数据
			isNew = !!found;
		} else {
			isNew = true;
		}

		const isInKstT = Object.values(kstTRef.current).includes(editingDecomposeRow.id);

		const indicatorConfDetailIdList = selectedR.map((item) => item.id || item.key);

		const payload: any = {
			id: editingDecomposeRow.id,
			suspendedVersion: collSuspendedVersion,
			indicatorConfDetailIdList,
			sourceNewB: isNew,
		};

		if (isInKstT) {
			payload.suspendedEditId = editingDecomposeRow.id;
		}

		const res: any =
			await submitIndicatorTargetDecompositionMainResponsibleDecomposingIndicators(payload);
		if (res && res.success !== false) {
			if (!editingDecomposeRow.suspendedVersion && res.data) {
				kstTRef.current[editingDecomposeRow.id] = res.data;
			}
			loadDecomposeTable(decomposePageNum, decomposePageSize);
			return true;
		} else {
			return false;
		}
	};

	const buildMainResponsibleExportExtObj = React.useCallback(() => {
		const effTaskIndicatorSubmitId = Number(
			currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current.id))
				? Number(currentStepRef.current.id)
				: 0,
		);
		const effTaskIndicatorConfId = Number(confDetail?.id ?? 0);

		if (!effTaskIndicatorSubmitId || !effTaskIndicatorConfId) {
			return null;
		}

		return JSON.stringify({
			effTaskIndicatorSubmitId,
			effTaskIndicatorConfId,
		});
	}, [confDetail?.id]);

	const buildMainResponsibleImportExtObj = React.useCallback(() => {
		const taskIndicatorSubmitId = Number(
			currentStepRef.current?.id && !Number.isNaN(Number(currentStepRef.current.id))
				? Number(currentStepRef.current.id)
				: 0,
		);

		if (!taskIndicatorSubmitId) {
			return null;
		}

		const extObj: Record<string, any> = {
			pageNum: decomposePageNum,
			pageSize: decomposePageSize,
			searchCount: true,
			taskIndicatorSubmitId,
			excelType: 2,
			suspendedVersion: collSuspendedVersion ?? "",
			submitUserDelIds: collDelIds ?? [],
			kstT: kstTRef.current,
		};

		return JSON.stringify(extObj);
	}, [collDelIds, collSuspendedVersion, decomposePageNum, decomposePageSize]);

	const handleMainResponsibleExportTemplate = React.useCallback(async () => {
		const extObj = buildMainResponsibleExportExtObj();
		if (!extObj) {
			message.warning("当前流程参数不完整，无法导出模板");
			return;
		}

		try {
			const blob = await strategyExcelTemplateExport({
				templateId: 6,
				extObj,
			});
			downloadBlob(blob, "主责人导入模板");
		} catch (e) {
			console.error("export main responsible template failed", e);
		}
	}, [buildMainResponsibleExportExtObj]);

	const handleMainResponsibleImportClick = React.useCallback(() => {
		const extObj = buildMainResponsibleImportExtObj();
		if (!extObj) {
			message.warning("当前流程参数不完整，无法导入");
			return;
		}

		mainResponsibleFileInputRef.current?.click();
	}, [buildMainResponsibleImportExtObj]);

	const handleMainResponsibleFileChange = React.useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				return;
			}

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
				const extMapStr = buildMainResponsibleImportExtObj();
				if (!extMapStr) {
					message.warning("当前流程参数不完整，无法导入");
					return;
				}

				const success = await strategyExcelDataImport({
					templateId: 6,
					extMapStr,
					file,
				});

				if (success) {
					loadDecomposeTable(decomposePageNum, decomposePageSize, selected ?? undefined);
				}
			} catch (e) {
				console.error("import main responsible excel failed", e);
			} finally {
				event.target.value = "";
			}
		},
		[buildMainResponsibleImportExtObj, decomposePageNum, decomposePageSize, selected],
	);
	// #endregion

	// #region Render Helpers (渲染辅助)

	// 渲染拆解表
	const renderDecomposeTable = () => {
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
		const cols: ColumnsType<any> = [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 300,
				render: (val, record, index) => (
					<Form.Item
						name={[index, "targetOrgCode"]}
						initialValue={record.targetOrgCode}
						rules={[{ required: true, message: "请选择拆解对象" }]}
						style={{ margin: 0 }}
					>
						<TreeSelect
							disabled={readOnly || record.status === 1}
							treeData={deptTree}
							fieldNames={{ label: "title", value: "key", children: "children" }}
							placeholder="请选择"
							treeDefaultExpandAll
							onChange={(v, label) =>
								handleDecomposeTargetChange(index, record, v, label)
							}
							style={{ width: "100%" }}
						/>
					</Form.Item>
				),
			},
			{
				title: "主责人",
				dataIndex: "responsibleUserName",
				key: "responsibleUserName",
				width: 120,
				render: (val, record, index) => (
					<Form.Item
						name={[index, "responsibleUserName"]}
						initialValue={val}
						style={{ margin: 0 }}
					>
						<Input
							disabled={readOnly}
							readOnly
							suffix={
								<EditOutlined
									style={{ color: "#1890ff" }}
									onClick={() => {
										if (!readOnly) {
											setEditingResponsibleRow(record);
											setMainResponsibleModalOpen(true);
										}
									}}
								/>
							}
							onClick={() => {
								if (!readOnly) {
									setEditingResponsibleRow(record);
									setMainResponsibleModalOpen(true);
								}
							}}
							placeholder="请选择"
							style={{ cursor: readOnly ? "not-allowed" : "pointer" }}
						/>
					</Form.Item>
				),
			},
			{
				title: "工号",
				dataIndex: "userCode",
				key: "userCode",
				width: 100,
				render: (val, record, index) => (
					<Form.Item name={[index, "userCode"]} initialValue={val} style={{ margin: 0 }}>
						<Input disabled />
					</Form.Item>
				),
			},
			{
				title: "所属部门",
				dataIndex: "departName",
				key: "departName",
				width: 150,
				render: (val, record, index) => (
					<Form.Item
						name={[index, "departName"]}
						initialValue={val}
						style={{ margin: 0 }}
					>
						<Input disabled />
					</Form.Item>
				),
			},
			{
				title: "拆解指标",
				dataIndex: "indicatorConfDetailIdCount",
				key: "indicatorConfDetailIdCount",
				width: 200,
				render: (val, row, index) => {
					const count = row.indicatorConfDetailIdCount;
					const hasCount = typeof count === "number" && count > 0;
					return (
						<Form.Item
							name={[index, "indicatorConfDetailIdCount"]}
							initialValue={val}
							style={{ margin: 0 }}
						>
							<div className="rounded-md border border-solid border-gray-300">
								<div
									className="ant-input"
									style={{
										display: "flex",
										alignItems: "center",
										cursor: readOnly ? "not-allowed" : "pointer",
										padding: "4px 11px",
										height: 32,
										width: "100%",
									}}
									onClick={() => {
										if (!readOnly) {
											setEditingDecomposeRow(row);
											setDecomposeIndicatorModalOpen(true);
										}
									}}
								>
									{hasCount ? (
										<div
											style={{
												backgroundColor: "rgba(240, 242, 245, 1)",
												padding: "0 8px",
												borderRadius: "4px",
												display: "inline-flex",
												alignItems: "center",
												height: "24px",
												fontSize: "12px",
												color: "rgba(0, 0, 0, 0.88)",
											}}
										>
											<span style={{ marginRight: 4 }}>+{count}</span>
										</div>
									) : (
										<span style={{ color: "#bfbfbf" }}>请选择</span>
									)}
									<EditOutlined
										style={{ color: "#1890ff", marginLeft: "auto" }}
									/>
								</div>
							</div>
						</Form.Item>
					);
				},
			},
			{
				title: "任务状态",
				dataIndex: "statusStr",
				key: "statusStr",
				width: 100,
				render: (val, record, index) => (
					<Form.Item name={[index, "statusStr"]} initialValue={val} style={{ margin: 0 }}>
						<Input disabled />
					</Form.Item>
				),
			},
			{
				title: "填报状态",
				dataIndex: "fillingStatusStr",
				key: "fillingStatusStr",
				width: 100,
				render: (val, record, index) => (
					<Form.Item
						name={[index, "fillingStatusStr"]}
						initialValue={val}
						style={{ margin: 0 }}
					>
						<Input disabled />
					</Form.Item>
				),
			},
		];
		if (!readOnly) {
			cols.push({
				title: "操作",
				key: "actions",
				width: 220,
				fixed: "right",
				render: (_: any, record: any) => (
					<Space split={splitNode}>
						{record?.status === 1 && (
							<>
								<Button type="link" onClick={() => handleUndoPublishRow(record)}>
									撤销发布
								</Button>
								<Button
									type="link"
									onClick={() => {
										setEditingPermissionsRow(record);
										setPlanPermissionsDrawerOpen(true);
									}}
								>
									新增协作人
								</Button>
							</>
						)}
						{record?.status !== 1 && record?.status !== 2 && (
							<Button type="link" onClick={() => handleDeleteDecomposeRow(record)}>
								删除
							</Button>
						)}
					</Space>
				),
			});
		}

		// 计算所有列宽总和作为横向滚动宽度，保证横向滚动时表头与表体对齐
		const decomposeTableScrollX = cols.reduce(
			(sum, c) => sum + (typeof c.width === "number" ? c.width : 150),
			0,
		);

		return (
			<ConfigProvider locale={zhCN}>
				<div ref={decomposeTableWrapRef} style={{ height: "100%", minHeight: 0 }}>
					<Table
						dataSource={decomposeData}
						columns={cols as any}
						loading={decomposeLoading}
						rowKey={(r) => r.key}
						bordered
						size="small"
						scroll={{
							x: decomposeTableScrollX,
							y: decomposeTableScrollY > 0 ? decomposeTableScrollY : undefined,
						}}
						summary={() => (
							<Table.Summary>
								<Table.Summary.Row>
									<Table.Summary.Cell index={0} colSpan={cols.length}>
										<Button type="link" onClick={handleAddDecomposeRow}>
											+ 新增
										</Button>
									</Table.Summary.Cell>
								</Table.Summary.Row>
							</Table.Summary>
						)}
						pagination={{
							current: decomposePageNum,
							pageSize: decomposePageSize,
							total: decomposeTotal,
							showSizeChanger: true,
							pageSizeOptions: ["5", "10", "20", "50"],
							showQuickJumper: true,
							showTotal: (total) => `共 ${total} 条`,
							onChange: (p: number, ps?: number) =>
								loadDecomposeTable(p, ps ?? decomposePageSize),
						}}
					/>
				</div>
			</ConfigProvider>
		);
	};

	// 协作人表格列定义
	const collaboratorColumns: ColumnsType<any> = [
		{
			title: "人员",
			dataIndex: "userName",
			key: "userName",
			render: (v: any, r: Collaborator) => v || r.name,
		},
		{
			title: "工号",
			dataIndex: "userCode",
			key: "userCode",
			render: (v: any, r: Collaborator) => v || r.employeeId,
		},
		{
			title: "所属部门",
			dataIndex: "departName",
			key: "departName",
			render: (v: any, r: Collaborator) => v || r.department,
		},
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					操作权限
				</span>
			),
			dataIndex: "perm",
			key: "perm",
			render: (v: any, r: Collaborator) => (
				<Select
					value={v === null || v === undefined ? undefined : Number(v)}
					onChange={(val: number) => handleCollaboratorPermChange(r, Number(val))}
					loading={collUpdatingIds.includes(r.id)}
					style={{ width: 120 }}
					options={[
						{ label: "编辑", value: 1 },
						{ label: "查看", value: 2 },
					]}
				/>
			),
		},
	];
	if (!readOnly) {
		collaboratorColumns.push({
			title: "操作",
			key: "actions",
			render: (_: any, r: any) => <a onClick={() => handleDeleteCollaborator(r)}>删除</a>,
		});
	}

	// 任务跟进表格列定义
	const taskColumns: ColumnsType<any> = [
		{ title: "操作时间", dataIndex: "event", key: "event" },
		{ title: "操作人", dataIndex: "actor", key: "actor" },
		{ title: "操作内容", dataIndex: "content", key: "content" },
	];
	// #endregion

	// #region Main Render
	return (
		<Drawer
			title={`${record?.name || record?.title || "实施流程"}`}
			placement="right"
			width="80%"
			open={open}
			styles={{ body: { padding: 0 } }}
			footer={
				!readOnly ? (
					<div className="flex w-full items-center justify-end gap-2">
						{steps.findIndex((s) => s.id === selected) === 0 && (
							<Button
								onClick={() =>
									modal.open("plan.history", {
										record: currentStep,
										bizCode: "INDICATOR_CONF_DETAILS",
									})
								}
							>
								任务跟进
							</Button>
						)}
						{String(currentStep?.status) !== "1" &&
							currentStep?.status !== "published" && (
								<Button onClick={handleSaveDraft}>暂存</Button>
							)}
						{(() => {
							const idx = steps.findIndex((s) => s.id === selected);
							if (idx > 0) {
								const prev = steps[idx - 1];
								if (prev.status !== "published") return null;
							}
							return (
								<Button type="primary" onClick={handlePublish}>
									发布
								</Button>
							);
						})()}
					</div>
				) : null
			}
			{...commonDrawerProps(onClose)}
			afterOpenChange={afterOpenChange}
		>
			<ConfigProvider locale={zhCN}>
				<div style={{ display: "flex", height: "100%" }}>
					{/* Left Sidebar: Steps List */}
					<div
						style={{
							width: 260,
							borderRight: "1px solid #f0f0f0",
							padding: 16,
							overflow: "auto",
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
							<div style={{ fontWeight: 600 }}>实施流程</div>
							{!readOnly && (
								<Button type="link" onClick={openAddModal}>
									新增
								</Button>
							)}
						</div>
						<List
							dataSource={steps}
							renderItem={(item) => {
								const isSelected = item.id === selected;
								const idx = steps.findIndex((s) => s.id === item.id);
								return (
									<List.Item
										style={{
											cursor: "pointer",
											padding: "12px 8px",
											background: "transparent",
										}}
										onClick={() => handleSelectStep(item.id)}
									>
										<div style={{ position: "relative", width: "100%" }}>
											{isSelected && (
												<motion.div
													layoutId="active-step-border"
													style={{
														position: "absolute",
														inset: 0,
														border: `1px solid ${token.colorPrimary}`,
														borderRadius: 4,
														background: "#f5f7fa",
														zIndex: 0,
													}}
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 30,
													}}
												>
													<div
														style={{
															position: "absolute",
															left: "50%",
															transform: "translateX(-50%)",
															bottom: -11,
															lineHeight: 0,
															width: 20,
															height: 12,
														}}
													>
														<div
															style={{
																position: "absolute",
																left: "50%",
																transform: "translateX(-50%)",
																top: 0,
																width: 20,
																height: 6,
																background: "#f5f7fa",
																zIndex: 3,
																borderRadius: 3,
															}}
														/>
														<svg
															style={{
																position: "absolute",
																left: "50%",
																transform: "translateX(-50%)",
																top: -1,
																zIndex: 4,
																display: "block",
															}}
															width="100%"
															height="100%"
															viewBox="0 0 16 8"
															xmlns="http://www.w3.org/2000/svg"
															aria-hidden
														>
															<polyline
																points="0,0 8,8 16,0"
																fill="none"
																stroke={token.colorPrimary}
																strokeWidth={1}
																strokeLinejoin="round"
																strokeLinecap="round"
															/>
														</svg>
													</div>
												</motion.div>
											)}
											<motion.div
												animate={
													isSelected ? { x: [0, -4, 4, -4, 4, 0] } : {}
												}
												transition={{ duration: 0.4 }}
												style={{
													zIndex: 1,
													position: "relative",
													display: "flex",
													alignItems: "center",
													gap: 12,
													padding: 12,
													border: `1px solid ${isSelected ? "transparent" : "#f0f0f0"}`,
													borderRadius: 4,
													background: "transparent",
												}}
											>
												<div
													style={{
														width: 24,
														height: 24,
														borderRadius: 14,
														color: isSelected ? "#fff" : "#000",
														background: isSelected
															? token.colorPrimary
															: "#f0f0f0",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontWeight: 600,
													}}
												>
													{item.seq}
												</div>
												<div style={{ flex: 1 }}>
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: 8,
														}}
													>
														<div style={{ fontWeight: 600 }}>
															{item.name}
														</div>
														{!readOnly &&
															idx !== 0 &&
															!(
																String(item.status) === "1" ||
																item.status === "published"
															) && (
																<div
																	style={{
																		marginLeft: "auto",
																		display: "flex",
																		gap: 4,
																	}}
																>
																	<Button
																		key="edit"
																		type="text"
																		icon={
																			<EditOutlined
																				onClick={(e) => {
																					e.stopPropagation();
																					openEditModal(
																						item.id,
																					);
																				}}
																			/>
																		}
																		onClick={(e) => {
																			e.stopPropagation();
																			openEditModal(item.id);
																		}}
																	/>
																	<Button
																		key="del"
																		type="text"
																		icon={<DeleteOutlined />}
																		onClick={(e) => {
																			e.stopPropagation();
																			handleDeleteStep(
																				item.id,
																			);
																		}}
																	/>
																</div>
															)}
													</div>
													<div style={{ fontSize: 12, color: "#888" }}>
														{String(item.status) === "1" ||
														item.status === "published" ? (
															<Tag color="green">已发布</Tag>
														) : (
															<Tag>未发布</Tag>
														)}
													</div>
												</div>
											</motion.div>
											{!isSelected && (
												<div
													style={{
														position: "absolute",
														left: "50%",
														transform: "translateX(-50%)",
														bottom: -11,
														lineHeight: 0,
														width: 20,
														height: 12,
													}}
												>
													<div
														style={{
															position: "absolute",
															left: "50%",
															transform: "translateX(-50%)",
															top: 0,
															width: 20,
															height: 6,
															background:
																token.colorBgContainer ?? "#fff",
															zIndex: 3,
															borderRadius: 3,
														}}
													/>
													<svg
														style={{
															position: "absolute",
															left: "50%",
															transform: "translateX(-50%)",
															top: -1,
															zIndex: 4,
															display: "block",
														}}
														width="100%"
														height="100%"
														viewBox="0 0 16 8"
														xmlns="http://www.w3.org/2000/svg"
														aria-hidden
													>
														<polyline
															points="0,0 8,8 16,0"
															fill="none"
															stroke="#f0f0f0"
															strokeWidth={1}
															strokeLinejoin="round"
															strokeLinecap="round"
														/>
													</svg>
												</div>
											)}
										</div>
									</List.Item>
								);
							}}
						/>
					</div>

					{/* Right Content: Forms & Tables */}
					<div style={{ flex: 1, padding: 20, overflow: "hidden" }}>
						<AnimatePresence mode="popLayout" custom={direction}>
							<motion.div
								key={selected}
								custom={direction}
								variants={{
									enter: (dir: number) => ({
										y: dir > 0 ? "100%" : "-100%",
										opacity: 0,
									}),
									center: {
										y: 0,
										opacity: 1,
									},
									exit: (dir: number) => ({
										y: dir > 0 ? "-100%" : "100%",
										opacity: 0,
									}),
								}}
								initial="enter"
								animate="center"
								exit="exit"
								transition={{ duration: 0.4, ease: "easeInOut" }}
								style={{ height: "100%", width: "100%" }}
							>
								{steps.findIndex((s) => s.id === selected) === 0 ? (
									// Step 1: Indicator Configuration
									<>
										<div style={{ padding: 12, marginBottom: 12 }}>
											<SectionTitle
												title="填报设置"
												className="mb-8 text-lg"
											/>
											<Form form={mainForm} layout="horizontal" colon={false}>
												<Row gutter={60}>
													<Col span={8}>
														<Form.Item
															label="主责人"
															name="owner"
															style={{ marginBottom: 0 }}
															rules={[
																{
																	required: true,
																	message: "请输入主责人",
																},
															]}
														>
															{readOnly ? (
																<div>
																	{mainForm.getFieldValue(
																		"owner",
																	) ?? "-"}
																</div>
															) : (
																<Input
																	placeholder="请选择主责人"
																	readOnly
																	onClick={() =>
																		setPlanOwnerModalOpen(true)
																	}
																	suffix={
																		<EditOutlined
																			style={{
																				color: "#1890ff",
																			}}
																			onClick={() =>
																				setPlanOwnerModalOpen(
																					true,
																				)
																			}
																		/>
																	}
																	style={{ cursor: "pointer" }}
																/>
															)}
														</Form.Item>
														<Form.Item name="responsibleUserId" hidden>
															<Input />
														</Form.Item>
													</Col>
													<Col span={8}>
														<Form.Item
															label="填报日期"
															style={{ marginBottom: 0 }}
															required={!readOnly}
														>
															{readOnly ? (
																<div>
																	{(() => {
																		const d: any =
																			mainForm.getFieldValue(
																				"date",
																			);
																		if (!d) return "-";
																		if (Array.isArray(d)) {
																			const s = d[0];
																			const e = d[1];
																			const sf =
																				s && s.format
																					? s.format(
																							"YYYY-MM-DD",
																						)
																					: s
																						? String(s)
																						: "";
																			const ef =
																				e && e.format
																					? e.format(
																							"YYYY-MM-DD",
																						)
																					: e
																						? String(e)
																						: "";
																			return sf && ef
																				? `${sf} ~ ${ef}`
																				: sf || ef || "-";
																		}
																		if (d.format)
																			return d.format(
																				"YYYY-MM-DD",
																			);
																		return String(d);
																	})()}
																</div>
															) : (
																<div
																	style={{
																		display: "flex",
																		gap: 8,
																		width: "100%",
																	}}
																>
																	<Form.Item
																		name="date"
																		noStyle
																		rules={[
																			{
																				required: true,
																				message:
																					"请选择填报日期",
																			},
																		]}
																	>
																		<DatePicker.RangePicker
																			style={{
																				width: "100%",
																			}}
																			disabledDate={(
																				current,
																			) =>
																				current &&
																				current <
																					dayjs().startOf(
																						"day",
																					)
																			}
																			disabled={
																				confDetail?.startTime &&
																				dayjs(
																					confDetail.startTime,
																				).isBefore(
																					dayjs(),
																					"day",
																				)
																			}
																		/>
																	</Form.Item>
																	{confDetail?.deadline &&
																		dayjs(
																			confDetail.deadline,
																		).isBefore(
																			dayjs(),
																			"day",
																		) && (
																			<Popover
																				content={
																					<DatePicker
																						disabledDate={(
																							current,
																						) =>
																							current &&
																							current <
																								dayjs().startOf(
																									"day",
																								)
																						}
																						onChange={(
																							date,
																						) => {
																							const currentRange =
																								mainForm.getFieldValue(
																									"date",
																								);
																							if (
																								currentRange &&
																								currentRange[0]
																							) {
																								mainForm.setFieldsValue(
																									{
																										date: [
																											currentRange[0],
																											date,
																										],
																									},
																								);
																							}
																						}}
																					/>
																				}
																				title="选择新的结束日期"
																				trigger="click"
																			>
																				<Button
																					type="link"
																					size="small"
																					style={{
																						paddingTop: 4,
																					}}
																				>
																					延期
																				</Button>
																			</Popover>
																		)}
																</div>
															)}
														</Form.Item>
													</Col>
													<Col span={8}>
														<Form.Item
															label="填报说明"
															name="note"
															style={{ marginBottom: 0 }}
														>
															{readOnly ? (
																<div>
																	{mainForm.getFieldValue(
																		"note",
																	) ?? "-"}
																</div>
															) : (
																<Input.TextArea
																	rows={3}
																	placeholder="请输入"
																	maxLength={100}
																/>
															)}
														</Form.Item>
													</Col>
												</Row>
											</Form>
										</div>

										<div style={{ padding: 12 }}>
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													marginBottom: 8,
												}}
											>
												<SectionTitle
													title="协作人"
													className="mb-8 text-lg"
												/>
												<Space>
													{!readOnly && (
														<Button
															onClick={() => setPersonModalOpen(true)}
														>
															新增人员
														</Button>
													)}
													{/* <Button>导出模板</Button>
														<Button>导入</Button> */}
												</Space>
											</div>
											<Table
												columns={collaboratorColumns}
												bordered
												dataSource={collaborators.map((c) => ({
													key: c.id,
													...c,
												}))}
												rowKey={(r) => r.id}
												loading={collLoading}
												pagination={{
													current: collPageNum,
													pageSize: collPageSize,
													total: collTotal,
													showSizeChanger: true,
													pageSizeOptions: ["5", "10", "20", "50"],
													showQuickJumper: true,
													showTotal: (total) => `共 ${total} 条`,
													onChange: (p: number, ps?: number) => {
														const newSize = ps ?? collPageSize;
														loadCollaborators(p, newSize);
													},
												}}
											/>
										</div>
									</>
								) : (
									// Step N: Decomposition
									<Form
										form={decomposeForm}
										layout="horizontal"
										colon={false}
										style={{
											height: "100%",
											display: "flex",
											flexDirection: "column",
											minHeight: 0,
										}}
									>
										<div
											style={{
												padding: 12,
												marginBottom: 12,
												flex: "0 0 auto",
											}}
										>
											<SectionTitle
												title="填报设置"
												className="mb-8 text-lg"
											/>
											<Row gutter={12}>
												<Col span={8}>
													<Form.Item
														label="填报日期"
														style={{ marginBottom: 0 }}
														required={!readOnly}
													>
														{readOnly ? (
															<div>
																{(() => {
																	const d: any =
																		decomposeForm.getFieldValue(
																			["decompose", "date"],
																		);
																	if (!d) return "-";
																	if (Array.isArray(d)) {
																		const s = d[0];
																		const e = d[1];
																		const sf =
																			s && s.format
																				? s.format(
																						"YYYY-MM-DD",
																					)
																				: s
																					? String(s)
																					: "";
																		const ef =
																			e && e.format
																				? e.format(
																						"YYYY-MM-DD",
																					)
																				: e
																					? String(e)
																					: "";
																		return sf && ef
																			? `${sf} ~ ${ef}`
																			: sf || ef || "-";
																	}
																	if (d.format)
																		return d.format(
																			"YYYY-MM-DD",
																		);
																	return String(d);
																})()}
															</div>
														) : (
															<div
																style={{
																	display: "flex",
																	gap: 8,
																	width: "100%",
																}}
															>
																<Form.Item
																	name={["decompose", "date"]}
																	noStyle
																	rules={[
																		{
																			required: true,
																			message:
																				"请选择填报日期",
																		},
																	]}
																>
																	<DatePicker.RangePicker
																		style={{ width: "100%" }}
																		disabledDate={(current) =>
																			current &&
																			current <
																				dayjs().startOf(
																					"day",
																				)
																		}
																		disabled={
																			decomposeDetail?.deadline &&
																			dayjs(
																				decomposeDetail.deadline,
																			).isBefore(
																				dayjs(),
																				"day",
																			)
																		}
																	/>
																</Form.Item>
																{decomposeDetail?.deadline &&
																	dayjs(
																		decomposeDetail.deadline,
																	).isBefore(dayjs(), "day") && (
																		<Popover
																			content={
																				<DatePicker
																					disabledDate={(
																						current,
																					) =>
																						current &&
																						current <
																							dayjs().startOf(
																								"day",
																							)
																					}
																					onChange={(
																						date,
																					) => {
																						const currentRange =
																							decomposeForm.getFieldValue(
																								[
																									"decompose",
																									"date",
																								],
																							);
																						if (
																							currentRange &&
																							currentRange[0]
																						) {
																							decomposeForm.setFieldsValue(
																								{
																									decompose:
																										{
																											date: [
																												currentRange[0],
																												date,
																											],
																										},
																								},
																							);
																						}
																					}}
																				/>
																			}
																			title="选择新的结束日期"
																			trigger="click"
																		>
																			<Button
																				type="link"
																				size="small"
																				style={{
																					padding: 0,
																				}}
																			>
																				延期
																			</Button>
																		</Popover>
																	)}
															</div>
														)}
													</Form.Item>
												</Col>
												<Col span={8}>
													<Form.Item
														label="填报说明"
														name={["decompose", "note"]}
														style={{ marginBottom: 0 }}
													>
														{readOnly ? (
															<div>
																{decomposeForm.getFieldValue([
																	"decompose",
																	"note",
																]) ?? "-"}
															</div>
														) : (
															<Input.TextArea rows={3} />
														)}
													</Form.Item>
												</Col>
											</Row>
										</div>

										<div
											style={{
												padding: 12,
												flex: "1 1 auto",
												minHeight: 0,
												display: "flex",
												flexDirection: "column",
											}}
										>
											<div
												style={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "center",
													marginBottom: 8,
													flex: "0 0 auto",
												}}
											>
												<SectionTitle
													title="主责人"
													className="mb-8 text-lg"
												/>
												<Space>
													<Button
														onClick={
															handleMainResponsibleExportTemplate
														}
													>
														导出模板
													</Button>
													<Button
														onClick={handleMainResponsibleImportClick}
													>
														导入
													</Button>
												</Space>
											</div>
											<input
												ref={mainResponsibleFileInputRef}
												type="file"
												accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
												style={{ display: "none" }}
												onChange={handleMainResponsibleFileChange}
											/>
											<Form.List name="decompositions">
												{() => (
													<div
														style={{
															flex: "1 1 auto",
															minHeight: 0,
															display: "flex",
															flexDirection: "column",
														}}
													>
														{renderDecomposeTable()}
													</div>
												)}
											</Form.List>
										</div>
									</Form>
								)}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>

				{/* Modals & Drawers */}
				<Drawer
					title="任务跟进"
					placement="right"
					width={720}
					onClose={() => setTaskDrawerOpen(false)}
					open={taskDrawerOpen}
				>
					<Table
						columns={taskColumns}
						dataSource={taskLogs.map((t) => ({ key: t.id, ...t }))}
						pagination={{
							size: "default" as const,
							showQuickJumper: false,
							showTotal: (t: number) => (
								<span className="text-gray-500">共{t} 条</span>
							),
							showSizeChanger: true,
							pageSizeOptions: ["10", "20", "50"],
						}}
						rowKey={(r) => r.id}
					/>
				</Drawer>

				<Modal
					title={stepModalMode === "add" ? "新增流程" : "修改流程"}
					open={stepModalOpen}
					onOk={handleStepOk}
					onCancel={handleStepCancel}
					okText="确定"
					cancelText="取消"
					confirmLoading={stepConfirmLoading}
				>
					<Form layout="vertical">
						<Form.Item label="流程名称" required>
							<Input
								value={stepNameInput}
								onChange={(e) => setStepNameInput(e.target.value)}
								placeholder="请输入流程名称"
							/>
						</Form.Item>
					</Form>
				</Modal>

				<PersonCreateModal
					open={personModalOpen}
					onClose={handlePersonModalClose}
					titleLabel="新增人员"
				/>
				<PlanPermissionsDrawer
					customTitle="协作人"
					open={planPermissionsDrawerOpen}
					record={editingPermissionsRow}
					onClose={() => {
						setPlanPermissionsDrawerOpen(false);
						setEditingPermissionsRow(null);
					}}
					dataType={3}
					disabledKeys={
						editingPermissionsRow?.responsibleUserId
							? [String(editingPermissionsRow.responsibleUserId)]
							: []
					}
				/>
				<PersonCreateModal
					open={planOwnerModalOpen}
					onClose={handlePlanOwnerModalClose}
					titleLabel="主责人"
					single={true}
					defaultSelected={(() => {
						const uid = mainForm.getFieldValue("responsibleUserId");
						const uname = mainForm.getFieldValue("owner");
						return uid ? [{ id: uid, name: uname }] : [];
					})()}
				/>
				<DecomposeMetricModal
					open={decomposeMetricModalOpen}
					onClose={handleDecomposeMetricClose}
				/>
				<AddDecomposeObjectModal
					open={addDecomposeObjectModalOpen}
					onClose={() => setAddDecomposeObjectModalOpen(false)}
					quickFilterId={0}
					customSubmit={handleAddDecomposeObjectSubmit}
					customFetchTree={async () => {
						const id = decomposeDetail?.id;
						if (!id) return [];
						const response: any = await fetchIndicatorTargetDecompositionObjectsTree({
							effTaskIndicatorSubmitId: id,
						});
						const res = response.data;
						// 递归处理树节点，适配 AddDecomposeObjectModal 的数据结构
						const processNodes = (nodes: any[]): any[] => {
							return nodes.map((node) => ({
								...node,
								title: node.name, // 映射 name 到 title
								key: node.id, // 映射 id 到 key
								disableCheckbox: !node.canChoose, // 映射 canChoose 到 disableCheckbox
								children: Array.isArray(node.children)
									? processNodes(node.children)
									: [],
							}));
						};

						if (Array.isArray(res)) {
							return processNodes(res);
						} else if (res && typeof res === "object") {
							// 如果 res 是一个对象，且包含 data 属性，那么它就是根节点
							// 直接处理这个对象
							return processNodes([res]);
						}
						return [];
					}}
				/>
				<PersonCreateModal
					open={mainResponsibleModalOpen}
					onClose={handleMainResponsibleModalClose}
					titleLabel="主责人"
					single={true}
					defaultSelected={
						editingResponsibleRow && editingResponsibleRow.responsibleUserId
							? [
									{
										id: editingResponsibleRow.responsibleUserId,
										name: editingResponsibleRow.responsibleUserName || "",
									},
								]
							: []
					}
				/>
				<AddGroupedIndicatorDrawer
					open={decomposeIndicatorModalOpen}
					onClose={() => setDecomposeIndicatorModalOpen(false)}
					title="拆解指标"
					effTaskIndicatorConfId={confDetail?.id ?? steps[0]?.id}
					customSubmit={handleDecomposeIndicatorSubmit}
					selectedIndicatorParams={
						editingDecomposeRow
							? (() => {
									let isNew = false;
									if (!editingDecomposeRow.suspendedVersion) {
										isNew = false;
									} else {
										const values = Object.values(kstTRef.current);
										const isInKstT = values.find(
											(v: any) =>
												String(v.id) === String(editingDecomposeRow.id),
										);
										isNew = !isInKstT;
									}
									return {
										effTaskIndicatorSubmitUserId: editingDecomposeRow.id,
										sourceNewB: isNew,
										suspendedEditId: isNew ? editingDecomposeRow.id : undefined,
									};
								})()
							: undefined
					}
				/>
			</ConfigProvider>
		</Drawer>
	);
}
