import { suspendIndicatorConfigIndicatorList } from "#src/api/strategy/indicator-config";
import { submitUserViewDataV1IndicatorName } from "#src/api/strategy/target-plan";
import blankSvg from "#src/assets/svg/blank.svg";
import { request } from "#src/utils/request";
import { VerticalAlignBottomOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Modal, Select, Space, Table } from "antd";
import React from "react";
import { commonDrawerProps } from "../constants/base";
import IndicatorRangeInput from "./IndicatorRangeInput";
import PersonCreateModal from "./Person-create-modal";
import PersonPermissionsModal from "./Person-permissions-modal";

interface Props {
	customTitle?: string;
	open: boolean;
	record?: any;
	onClose: (res?: any) => void;
	openModal?: (name: string, props?: any) => Promise<any>;
	dataType?: number;
	hideManager?: boolean;
	disabledKeys?: string[];
}

interface Person {
	id: string;
	userId?: number | string;
	userCode?: string; // 工号
	userName?: string; // 人员名称
	departName?: string; // 所属部门
	dataId?: number;
	dataType?: number;
	perm?: number; // 权限类型或标识
	sort?: number;
	suspendedVersion?: any;
	effTaskIndicatorSubmitIndicatorListIds?: number[];
	indicatorListIdsMaps?: Record<string, string>;
	// 兼容旧字段
	name?: string;
	employeeId?: string;
	department?: string;
	permissions?: string[];
	indicatorListIds?: string[];
}

interface IndicatorItem {
	id: number;
	indicatorId: number;
	name: string;
	tag: number;
	responsibleDepartment?: string;
	unitName?: string;
	definition?: string;
}

const DEFAULT_DISABLED_KEYS: string[] = [];

export default function PlanPermissionsDrawer({
	open,
	record,
	onClose,
	dataType = 0,
	customTitle = "权限编辑",
	hideManager = false,
	disabledKeys = DEFAULT_DISABLED_KEYS,
}: Props) {
	const [data, setData] = React.useState<Person[]>([]);
	const [drawerTitle, setDrawerTitle] = React.useState(customTitle);
	const [allIndicators, setAllIndicators] = React.useState<IndicatorItem[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [pageNum, setPageNum] = React.useState(1);
	const [pageSize, setPageSize] = React.useState(10);
	const [total, setTotal] = React.useState(0);
	const [suspendedVersion, setSuspendedVersion] = React.useState<string>("");
	const [confirming, setConfirming] = React.useState(false);
	const [updatingIds, setUpdatingIds] = React.useState<string[]>([]);
	const [validateFailedIds, setValidateFailedIds] = React.useState<string[]>([]);

	const kstTMapRef = React.useRef<Record<string, any>>({});
	const [delIds, setDelIds] = React.useState<string[]>([]);

	const [addVisible, setAddVisible] = React.useState(false);
	const [editVisible, setEditVisible] = React.useState(false);
	const [editingPerson, setEditingPerson] = React.useState<Person | null>(null);

	const buildPayload = (
		pNum = 1,
		pSize = 10,
		overrideDelIds?: string[],
		suspendedVersionOverride?: string,
	) => ({
		pageNum: pNum,
		pageSize: pSize,
		searchCount: true,
		dataId: record?.id ?? 0,
		// use prop dataType (default 0)
		dataType,
		suspendedVersion:
			typeof suspendedVersionOverride !== "undefined"
				? suspendedVersionOverride
				: suspendedVersion,
		delIds: typeof overrideDelIds !== "undefined" ? overrideDelIds : delIds,
		kstT: kstTMapRef.current,
	});

	const load = async (
		p = 1,
		size = 10,
		overrideDelIds?: string[],
		suspendedVersionOverride?: string,
	) => {
		setLoading(true);
		try {
			const payload = buildPayload(p, size, overrideDelIds, suspendedVersionOverride);
			const resp: any = await request
				.post("user/perm/page", { json: payload, ignoreLoading: true })
				.json();
			if (!resp) {
				setData([]);
				setTotal(0);
				return;
			}
			// 支持多种返回形态
			const list = Array.isArray(resp?.data?.list)
				? resp.data.list
				: Array.isArray(resp?.data)
					? resp.data
					: Array.isArray(resp?.list)
						? resp.list
						: [];
			const tot = resp?.data?.total ?? resp?.total ?? 0;
			// map backend fields to Person shape
			const mappedData = list.map((it: any) => ({
				id: String(it.id ?? it.userId ?? Math.random()),
				userId: it.userId ?? it.id,
				userCode: it.userCode ?? it.employeeCode ?? it.empNo ?? it.employeeId,
				userName: it.userName ?? it.name ?? it.userNick ?? "",
				departName: it.departName ?? it.department ?? it.deptName ?? "",
				dataId: it.dataId,
				dataType: it.dataType,
				// 保留后端返回的 null（不要把 null 误认为 0）
				perm: Object.prototype.hasOwnProperty.call(it, "perm")
					? it.perm
					: (it.permType ?? 0),
				sort: it.sort,
				suspendedVersion: it.suspendedVersion,
				effTaskIndicatorSubmitIndicatorListIds:
					it.effTaskIndicatorSubmitIndicatorListIds ?? [],
				indicatorListIdsMaps: it.indicatorListIdsMaps ?? {},
				// keep legacy props for compatibility
				name: it.userName ?? it.name,
				employeeId: it.userCode ?? it.employeeId ?? it.empNo,
				department: it.departName ?? it.department,
				permissions: it.permissions ?? it.permList ?? [],
				indicatorListIds: (
					it.effTaskIndicatorSubmitIndicatorListIds ??
					it.indicatorListIds ??
					[]
				).map(String),
			}));
			setData(hideManager ? mappedData.filter((p: Person) => p.perm !== 0) : mappedData);
			setTotal(tot || list.length);
			setPageNum(p);
			setPageSize(size);
		} catch (e) {
			console.error("load user perm page failed", e);
			setData([]);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	};

	const init = async () => {
		const sv = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
		// setSuspendedVersion is async but not awaitable; set the state and also pass the generated suspendedVersion
		setSuspendedVersion(sv);
		// 确保首次请求包含新生成的 suspendedVersion，因此通过参数直接传入
		load(1, pageSize, undefined, sv);

		if (dataType === 3) {
			try {
				const res = await submitUserViewDataV1IndicatorName(record?.id);
				if (res && res.code === 200 && res.data) {
					// 解析指标数据
					if (Array.isArray(res.data)) {
						// 映射后端返回的字段到组件需要的格式
						const indicators: IndicatorItem[] = res.data.map((item: any) => ({
							id: item.id ?? item.indicatorId,
							indicatorId: item.indicatorId ?? item.id,
							name: item.name ?? item.indicatorName ?? "",
							tag: item.tag ?? 0,
							responsibleDepartment:
								item.responsibleDepartment ?? item.department ?? "",
							unitName: item.unitName ?? item.unit ?? "",
							definition: item.definition ?? item.indicatorDefinition ?? "",
						}));
						setAllIndicators(indicators);
					} else if (typeof res.data === "object") {
						// 如果返回的是对象形式 { id: name, ... }
						// 转换为数组（此时可能缺少 tag 字段，需要后端补充）
						const indicators: IndicatorItem[] = Object.entries(res.data).map(
							([id, name]) => ({
								id: Number(id),
								indicatorId: Number(id),
								name: name as string,
								tag: 0, // 默认值，需要后端提供
								responsibleDepartment: "",
								unitName: "",
								definition: "",
							}),
						);
						setAllIndicators(indicators);
						console.warn("指标数据格式为对象，缺少 tag 字段，请联系后端补充");
					}
				}
			} catch (e) {
				console.error("fetchIndicatorName failed", e);
			}
		}
	};

	React.useEffect(() => {
		if (!open) {
			setAddVisible(false);
			setEditVisible(false);
			setEditingPerson(null);
			setData([]);
			setTotal(0);
			setPageNum(1);
			kstTMapRef.current = {};
			setDelIds([]);
			setValidateFailedIds([]);
			setDrawerTitle(customTitle);
		} else {
			// 当抽屉打开时加载列表
			// 生成随机的 suspendedVersion

			kstTMapRef.current = {};
			setDelIds([]);
			setValidateFailedIds([]);
			setDrawerTitle(customTitle);
			init();
		}
	}, [open]);

	const handleDelete = (person: Person) => {
		Modal.confirm({
			title: "确认删除该人员吗？",
			onOk: async () => {
				const originalId = Object.keys(kstTMapRef.current).find(
					(key) => kstTMapRef.current[key] === person.id,
				);

				if (originalId) {
					setUpdatingIds((arr) => Array.from(new Set([...arr, person.id])));
					try {
						const resp: any = await request
							.delete(`user/perm/user/suspended/${person.id}`, { errorMessage: true })
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
							const newDelIds = Array.from(new Set([...delIds, originalId]));
							setDelIds(newDelIds);
							delete kstTMapRef.current[originalId];
							load(pageNum, pageSize, newDelIds);
						}
					} catch (e) {
						console.error("delete user perm failed", e);
						message.error("删除失败");
					} finally {
						setUpdatingIds((arr) => arr.filter((i) => i !== person.id));
					}
					return;
				}

				if (!person.suspendedVersion) {
					const newDelIds = Array.from(new Set([...delIds, person.id]));
					setDelIds(newDelIds);
					try {
						await load(pageNum, pageSize, newDelIds);
					} catch (e) {
						console.error("refresh after local delete failed", e);
					}
					return;
				}

				setUpdatingIds((arr) => Array.from(new Set([...arr, person.id])));
				try {
					const resp: any = await request
						.delete(`user/perm/user/suspended/${person.id}`, { errorMessage: true })
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
						load(pageNum, pageSize);
					}
				} catch (e) {
					console.error("delete user perm failed", e);
					message.error("删除失败");
				} finally {
					setUpdatingIds((arr) => arr.filter((i) => i !== person.id));
				}
			},
		});
	};

	const handlePermChange = async (person: Person, newPerm: number) => {
		const id = person.id;
		if (validateFailedIds.includes(id)) {
			setValidateFailedIds((prev) => prev.filter((pid) => pid !== id));
		}
		setUpdatingIds((arr) => Array.from(new Set([...arr, id])));
		try {
			const isInKstT = Object.values(kstTMapRef.current).includes(person.id);

			const payload: any = {
				id: person?.id ?? 0,
				suspendedVersion: person.suspendedVersion ?? suspendedVersion ?? "",
				perm: newPerm,
				sourceNewB: !!person.suspendedVersion,
			};
			if (isInKstT) {
				payload.suspendedEditId = person.id;
			}
			const resp: any = await request
				.put("user/perm/user/suspended", { json: payload, errorMessage: true })
				.json();
			const ok = !(resp && typeof resp === "object" && resp.code && resp.code !== 200);
			if (ok) {
				if (resp && resp.data) {
					kstTMapRef.current[person.id] = resp.data;
				}
				await load(pageNum, pageSize);
				setData((old) =>
					old.map((it) =>
						it.id === person.id
							? {
									...it,
									perm: newPerm,
									suspendedVersion:
										resp?.data?.suspendedVersion ??
										resp?.suspendedVersion ??
										person.suspendedVersion ??
										suspendedVersion,
								}
							: it,
					),
				);
			}
		} catch (e) {
			console.error("update perm failed", e);
			// message.error("权限修改失败");
		} finally {
			setUpdatingIds((arr) => arr.filter((i) => i !== id));
		}
	};

	const handleIndicatorChange = async (person: Person, newIds: string[]) => {
		const id = person.id;
		if (newIds && newIds.length > 0 && validateFailedIds.includes(id)) {
			setValidateFailedIds((prev) => prev.filter((pid) => pid !== id));
		}
		setUpdatingIds((arr) => Array.from(new Set([...arr, id])));
		try {
			const isInKstT = Object.values(kstTMapRef.current).includes(person.id);
			const payload: any = {
				id: person?.id ?? 0,
				dataId: person?.dataId,
				suspendedVersion: person.suspendedVersion ?? suspendedVersion ?? "",
				indicatorListIds: newIds,
				sourceNewB: !!person.suspendedVersion,
			};
			if (isInKstT) {
				payload.suspendedEditId = person.id;
			}
			const resp: any = await suspendIndicatorConfigIndicatorList(payload);
			const ok = !(resp && typeof resp === "object" && resp.code && resp.code !== 200);
			if (ok) {
				if (resp && resp.data) {
					kstTMapRef.current[person.id] = resp.data;
				}
				await load(pageNum, pageSize);
				setData((old) =>
					old.map((it) =>
						it.id === person.id
							? {
									...it,
									indicatorListIds: newIds,
									effTaskIndicatorSubmitIndicatorListIds: newIds.map(Number),
									suspendedVersion:
										resp?.data?.suspendedVersion ??
										resp?.suspendedVersion ??
										person.suspendedVersion ??
										suspendedVersion,
								}
							: it,
					),
				);
			}
		} catch (e) {
			console.error("update indicator failed", e);
			// message.error("修改失败");
		} finally {
			setUpdatingIds((arr) => arr.filter((i) => i !== id));
		}
	};

	const handleConfirm = async () => {
		const failedIds = data
			.filter((p) => p.perm === undefined || p.perm === null)
			.map((p) => p.id);
		if (dataType === 3) {
			const indicatorFailedIds = data
				.filter((p) => !p.indicatorListIds || p.indicatorListIds.length === 0)
				.map((p) => p.id);
			failedIds.push(...indicatorFailedIds);
		}

		if (failedIds.length > 0) {
			setValidateFailedIds(Array.from(new Set(failedIds)));
			message.error("请完善信息");
			return;
		}

		Modal.confirm({
			title: "确认提交？",
			content: "提交后权限将立即生效，是否继续？",
			onOk: async () => {
				setConfirming(true);
				try {
					// 构建符合 /user/perm/edit 接口的参数
					const payload = {
						dataId: record?.id ?? 0,
						dataType,
						// 使用抽屉内生成或已有的 suspendedVersion
						suspendedVersion: suspendedVersion ?? "",
						// 如果有要删除的人员 id 列表，可以填入此处
						delIds,
						// 业务透传字段，保留为对象以便后端解析
						kstT: kstTMapRef.current,
					};
					const resp: any = await request
						.put("user/perm/edit", { json: payload, errorMessage: true })
						.json();
					const ok = !(
						resp &&
						typeof resp === "object" &&
						resp.code &&
						resp.code !== 200
					);
					if (ok) {
						// reload list
						load(1, pageSize);
						onClose();
					}
				} catch (e) {
					console.error("suspended request failed", e);
					// message.error("操作失败");
				} finally {
					setConfirming(false);
				}
			},
		});
	};

	const openAdd = () => setAddVisible(true);

	const handlePersonCreateClose = async (res: any) => {
		// res 可以是单个人员对象或数组，里面应包含 userId 或 id
		setAddVisible(false);
		if (!res) return;
		const items: any[] = Array.isArray(res) ? res : [res];
		// 提取 userId（优先）或 id 作为用户 id 列表
		const userIds = items
			.map((it) => it.userId ?? it.id ?? it)
			.filter((v) => v !== undefined && v !== null);
		if (userIds.length === 0) {
			// 如果没有可用的 userId，则把 items 合并到本地数据（保持向后兼容）
			setData((d) => {
				const map = new Map<string, Person>();
				items.forEach((it: any) =>
					map.set(String(it.id ?? it.userId ?? Math.random()), it),
				);
				d.forEach((it) => {
					if (!map.has(it.id)) map.set(it.id, it);
				});
				return Array.from(map.values());
			});
			// 无论如何，重新拉取最新列表以保证数据与后端一致
			load(1, pageSize);
			return;
		}

		// 调用后端批量新增接口
		setLoading(true);
		try {
			const payload = {
				dataId: record?.id ?? 0,
				dataType,
				userIds,
				suspendedVersion: suspendedVersion ?? "",
				delIds,
				kstT: kstTMapRef.current,
			};
			const resp: any = await request
				.post("user/perm/save/batch", { json: payload, errorMessage: true })
				.json();
			const ok = !(resp && typeof resp === "object" && resp.code && resp.code !== 200);
			if (ok) {
				// 如果后端同时返回 kstT 相关数据（放在 resp.data），合并到本地 kstTMap
				if (resp && resp.data) {
					// 如果 resp.data 是对象 map（key->value），合并
					if (!Array.isArray(resp.data) && typeof resp.data === "object") {
						Object.assign(kstTMapRef.current, resp.data);
					}
					// 如果是数组，尝试用 id/userId 字段建立 map
					else if (Array.isArray(resp.data)) {
						const map: Record<string, any> = {};
						resp.data.forEach((it: any) => {
							const key = String(
								it.id ?? it.userId ?? it.employeeId ?? it.userCode ?? "",
							);
							if (key) map[key] = it;
						});
						Object.assign(kstTMapRef.current, map);
					}
					// 然后 reload 列表
					load(1, pageSize);
				} else {
					load(1, pageSize);
				}
			}
		} catch (e) {
			console.error("save batch failed", e);
			// message.error("新增人员失败");
		} finally {
			setLoading(false);
		}
	};

	const handlePermissionsClose = (res: any) => {
		if (res && Array.isArray(res) && editingPerson) {
			setData((d) =>
				d.map((it) => (it.id === editingPerson.id ? { ...it, permissions: res } : it)),
			);
		}
		setEditVisible(false);
		setEditingPerson(null);
	};

	const columns = [
		{
			title: "人员",
			dataIndex: "userName",
			key: "userName",
			width: 60,
			ellipsis: true,
			render: (v: any, r: Person) => v || r.name,
		},
		{
			title: "工号",
			dataIndex: "userCode",
			key: "userCode",
			width: 80,
			ellipsis: true,
			render: (v: any, r: Person) => v || r.employeeId,
		},
		{
			title: "所属部门",
			dataIndex: "departName",
			key: "departName",
			width: 100,
			ellipsis: true,
			render: (v: any, r: Person) => v || r.department,
		},
		...(dataType === 3
			? [
					{
						title: (
							<span>
								<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
								指标范围
							</span>
						),
						dataIndex: "effTaskIndicatorSubmitIndicatorListIds",
						key: "effTaskIndicatorSubmitIndicatorListIds",
						width: 100,
						render: (v: any, r: Person) => (
							<IndicatorRangeInput
								allIndicators={allIndicators}
								value={r.indicatorListIds}
								onChange={(val: string[]) => handleIndicatorChange(r, val)}
								loading={updatingIds.includes(r.id)}
								status={
									validateFailedIds.includes(r.id) &&
									(!r.indicatorListIds || r.indicatorListIds.length === 0)
										? "error"
										: undefined
								}
							/>
						),
					},
				]
			: []),
		{
			title: (
				<span>
					<span style={{ color: "#ff4d4f", marginRight: 4 }}>*</span>
					操作权限
				</span>
			),
			dataIndex: "perm",
			key: "perm",
			width: 100,
			render: (v: any, r: Person) => {
				// 下拉：0=管理,1=编辑,2=查看。选择后立即发起更新请求
				const selectValue = v === null || v === undefined ? undefined : Number(v);
				return (
					<Select
						value={selectValue}
						onChange={(val: number) => handlePermChange(r, Number(val))}
						loading={updatingIds.includes(r.id)}
						status={validateFailedIds.includes(r.id) ? "error" : undefined}
						style={{ width: "100%" }}
						disabled={r.sort === 0}
						options={[
							{ label: "管理", value: 0 },
							{ label: "编辑", value: 1 },
							{ label: "查看", value: 2 },
						].filter((opt) => {
							if (dataType === 0) return opt.value !== 2;
							if (dataType === 3 || dataType === 2) return opt.value !== 0;
							return true;
						})}
					/>
				);
			},
		},
		{
			title: "操作",
			key: "actions",
			width: 80,
			// fixed: "right" as const,
			render: (_: any, record: Person) => (
				<Space>
					{record.sort !== 0 && (
						<Button type="link" onClick={() => handleDelete(record)}>
							删除
						</Button>
					)}
				</Space>
			),
		},
	];

	return (
		<>
			<Drawer
				title={drawerTitle}
				placement="right"
				width={680}
				open={open}
				footer={
					<div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
						<Button onClick={() => onClose(null)}>取消</Button>
						<Button type="primary" loading={confirming} onClick={handleConfirm}>
							确认
						</Button>
					</div>
				}
				{...commonDrawerProps(onClose)}
			>
				{data.length === 0 ? (
					<>
						<div
							style={{
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexDirection: "column",
								gap: 16,
							}}
						>
							<img src={blankSvg} alt="" />
							<Button type="primary" onClick={openAdd}>
								新增人员
							</Button>
						</div>
					</>
				) : (
					<>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 12,
							}}
						>
							<div style={{ display: "flex", gap: 8 }}>
								<Button type="primary" onClick={openAdd}>
									新增人员
								</Button>
								<Button>导出模板</Button>
							</div>
							<div>
								<Button>
									<VerticalAlignBottomOutlined />
									导入
								</Button>
							</div>
						</div>

						<Table<Person>
							columns={columns as any}
							dataSource={data.map((d) => ({ key: d.id, ...d }))}
							pagination={{
								current: pageNum,
								pageSize,
								total,
								showTotal: (t: number) => `共 ${t} 条`,
								onChange: (p: number, ps?: number) => {
									const newSize = ps ?? pageSize;
									load(p, newSize);
								},
							}}
							loading={loading}
							size="small"
							scroll={{ x: "max-content" }}
							tableLayout="fixed"
						/>
					</>
				)}
			</Drawer>

			{/* 内联公共 modal，显示控制仍在本组件管理 */}
			<PersonCreateModal
				titleLabel="新增人员"
				open={addVisible}
				record={null}
				onClose={handlePersonCreateClose}
				disabledKeys={[
					...disabledKeys,
					...data.map((p) => (p.userId ? String(p.userId) : p.id)),
				]}
			/>
			<PersonPermissionsModal
				open={editVisible}
				person={editingPerson}
				onClose={handlePermissionsClose}
			/>
		</>
	);
}
