import type {
	OrgAdjustmentTaskDateValue,
	OrgAdjustmentTaskOrgItem,
} from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import type { DataNode } from "antd/es/tree";
import type { Dayjs } from "dayjs";
import { getArea } from "#src/api/area";
import { useDictOptions } from "#src/hooks";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import PersonCreateModal from "#src/pages/strategy/target-management/modal/Person-create-modal";
import { Button, DatePicker, Drawer, Input, message, Select, Tabs, TreeSelect } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";

export interface PrecreateSupplementFormValue {
	orgName: string;
	groupName: string;
	orgNature: string;
	orgLevel: string;
	isVirtual: boolean;
	parentOrgId?: string;
	preEstablishDate: Dayjs | null;
	companyAddress: string;
	principal: string;
	principalId: string;
	workProvince: string;
	workCity: string;
	workDistrict: string;
}

export type PrecreateSupplementFormMap = Record<string, PrecreateSupplementFormValue>;

interface PrecreateSupplementDrawerProps {
	open: boolean;
	onClose: () => void;
	precreateOrgs: OrgAdjustmentTaskOrgItem[];
	orgList: OrgAdjustmentTaskOrgItem[];
	valueMap?: PrecreateSupplementFormMap;
	onSave: (valueMap: PrecreateSupplementFormMap) => void;
}

interface PrecreateSupplementFormErrors {
	orgName?: string;
	groupName?: string;
	orgNature?: string;
	orgLevel?: string;
	parentOrgId?: string;
	preEstablishDate?: string;
	companyAddress?: string;
	principal?: string;
	workProvince?: string;
	workCity?: string;
	workDistrict?: string;
}

type PrecreateSupplementErrorMap = Record<string, PrecreateSupplementFormErrors>;

/** 校验单个预创建补充表单值（带 * 必填项），返回错误对象；无错误返回空对象 */
export function validatePrecreateSupplementValue(
	value: PrecreateSupplementFormValue | undefined,
): PrecreateSupplementFormErrors {
	const errors: PrecreateSupplementFormErrors = {};
	if (!value?.orgName?.trim()) errors.orgName = "请输入组织名称";
	if (!value?.groupName?.trim()) errors.groupName = "请输入所属集团";
	if (!value?.orgNature?.trim()) errors.orgNature = "请选择组织性质";
	if (!value?.orgLevel?.trim()) errors.orgLevel = "请选择组织级别";
	if (!value?.parentOrgId) errors.parentOrgId = "请选择上级组织";
	if (!value?.preEstablishDate) errors.preEstablishDate = "请选择预计成立日期";
	if (!value?.companyAddress?.trim()) errors.companyAddress = "请输入公司地址";
	if (!value?.principal?.trim()) errors.principal = "请选择负责人";
	if (!value?.workProvince?.trim()) errors.workProvince = "请选择工作省份";
	if (!value?.workCity?.trim()) errors.workCity = "请选择工作城市";
	if (!value?.workDistrict?.trim()) errors.workDistrict = "请选择工作县区";
	return errors;
}

export function isPrecreateSupplementValueComplete(
	value: PrecreateSupplementFormValue | undefined,
): boolean {
	return Object.keys(validatePrecreateSupplementValue(value)).length === 0;
}
type TreeNode = DataNode & {
	value?: string;
	children?: TreeNode[];
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
	paddingLeft: 10,
	borderLeft: "3px solid rgba(0, 117, 255, 1)",
	fontSize: 14,
	fontWeight: 600,
	lineHeight: "20px",
	color: "#303133",
};

const FORM_ROW_STYLE: React.CSSProperties = {
	display: "flex",
	alignItems: "flex-start",
	gap: 12,
};

const FORM_LABEL_STYLE: React.CSSProperties = {
	width: 88,
	minWidth: 88,
	paddingTop: 5,
	fontSize: 14,
	lineHeight: "22px",
	color: "#606266",
	textAlign: "right",
};

const FORM_GRID_STYLE: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 18,
	marginTop: 12,
};

const BOOLEAN_OPTIONS = [
	{ label: "是", value: "true" },
	{ label: "否", value: "false" },
];

function buildOrgTree(orgList: OrgAdjustmentTaskOrgItem[]): TreeNode[] {
	const childrenMap = new Map<string, OrgAdjustmentTaskOrgItem[]>();
	orgList.forEach((item) => {
		const parentId = String(item.parentOrgId ?? "");
		if (!childrenMap.has(parentId)) {
			childrenMap.set(parentId, []);
		}
		childrenMap.get(parentId)!.push(item);
	});

	const orgIdSet = new Set(orgList.map((item) => String(item.orgId)));
	const rootNodes = orgList.filter(
		(item) => !item.parentOrgId || !orgIdSet.has(String(item.parentOrgId)),
	);

	const buildNode = (item: OrgAdjustmentTaskOrgItem): TreeNode => ({
		title: item.orgName,
		value: String(item.orgId),
		key: String(item.orgId),
		children: (childrenMap.get(String(item.orgId)) ?? []).map(buildNode),
	});

	return rootNodes.map(buildNode);
}

function parsePreEstablishDate(value: OrgAdjustmentTaskDateValue | undefined) {
	if (typeof value !== "string" || !value) {
		return null;
	}
	const parsed = dayjs(value);
	return parsed.isValid() ? parsed : null;
}

function resolveGroupName(
	org: OrgAdjustmentTaskOrgItem,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
) {
	let currentParentId = org.parentOrgId ? String(org.parentOrgId) : "";
	let fallbackName = "";

	while (currentParentId) {
		const parentOrg = orgMap.get(currentParentId);
		if (!parentOrg) {
			break;
		}
		fallbackName = parentOrg.orgName;
		if (!parentOrg.parentOrgId) {
			return parentOrg.orgName;
		}
		currentParentId = String(parentOrg.parentOrgId);
	}

	return fallbackName;
}

function createInitialValue(
	org: OrgAdjustmentTaskOrgItem,
	orgMap: Map<string, OrgAdjustmentTaskOrgItem>,
	valueMap?: PrecreateSupplementFormMap,
): PrecreateSupplementFormValue {
	const savedValue = valueMap?.[String(org.orgId)];
	if (savedValue) {
		return savedValue;
	}

	return {
		orgName: org.orgName || "",
		groupName: resolveGroupName(org, orgMap),
		orgNature: "",
		orgLevel: typeof org.orgLevel === "string" ? org.orgLevel : "",
		isVirtual: Boolean(org.virtual),
		parentOrgId: org.parentOrgId ? String(org.parentOrgId) : undefined,
		preEstablishDate: parsePreEstablishDate(org.preEstablishTime),
		companyAddress: "",
		principal: "",
		principalId: "",
		workProvince: "",
		workCity: "",
		workDistrict: "",
	};
}

export const PrecreateSupplementDrawer: React.FC<PrecreateSupplementDrawerProps> = ({
	open,
	onClose,
	precreateOrgs,
	orgList,
	valueMap,
	onSave,
}) => {
	const { options: orgNatureOptions, isLoading: orgNatureLoading } = useDictOptions(
		"org_adjustment_org_nature",
	);
	const { options: orgLevelOptions, isLoading: orgLevelLoading } = useDictOptions(
		"org_adjustment_org_level",
	);

	const orgMap = useMemo(
		() => new Map(orgList.map((item) => [String(item.orgId), item])),
		[orgList],
	);
	const treeData = useMemo(() => buildOrgTree(orgList), [orgList]);
	const [activeTabKey, setActiveTabKey] = useState<string>("");
	const [formMap, setFormMap] = useState<PrecreateSupplementFormMap>({});
	const [errorMap, setErrorMap] = useState<PrecreateSupplementErrorMap>({});
	const [personModalOpen, setPersonModalOpen] = useState(false);
	const [personModalOrgId, setPersonModalOrgId] = useState<string>("");
	// 区域选项缓存,key 为 parentId,根省份使用 "" 作为 key
	const [areaCache, setAreaCache] = useState<Record<string, { label: string; value: string }[]>>(
		{},
	);

	const loadArea = async (parentId?: string) => {
		const resp = await getArea(parentId ? { parentId } : {});
		const list = (resp?.data || []).map((item) => ({ label: item.name, value: item.code }));
		setAreaCache((prev) => ({ ...prev, [parentId || ""]: list }));
	};

	useEffect(() => {
		if (!open) {
			return;
		}

		const nextFormMap = precreateOrgs.reduce<PrecreateSupplementFormMap>((acc, org) => {
			acc[String(org.orgId)] = createInitialValue(org, orgMap, valueMap);
			return acc;
		}, {});

		setFormMap(nextFormMap);
		setErrorMap({});
		setActiveTabKey(String(precreateOrgs[0]?.orgId ?? ""));
	}, [open, orgMap, precreateOrgs, valueMap]);

	// 打开抽屉时加载省份列表
	useEffect(() => {
		if (!open) return;
		loadArea();
	}, [open]);

	// 字典加载完成后，将默认 "分子公司"（名称）替换为对应的 code
	useEffect(() => {
		if (!open || orgNatureLoading || orgNatureOptions.length === 0) return;
		const defaultCode = orgNatureOptions.find((opt) => opt.label === "分子公司")?.value;
		if (!defaultCode) return;
		setFormMap((prev) => {
			let changed = false;
			const next: PrecreateSupplementFormMap = {};
			Object.keys(prev).forEach((orgId) => {
				const cur = prev[orgId];
				// 仅当 orgNature 为空，或仍是错误的中文名 "分子公司" 时才回填
				if (cur && (!cur.orgNature || cur.orgNature === "分子公司")) {
					next[orgId] = { ...cur, orgNature: defaultCode };
					changed = true;
				} else {
					next[orgId] = cur;
				}
			});
			return changed ? next : prev;
		});
	}, [open, orgNatureLoading, orgNatureOptions]);

	// 切换 tab 时,为当前 tab 的已选省份/城市预加载子级选项
	useEffect(() => {
		if (!open || !activeTabKey) return;
		const current = formMap[activeTabKey];
		if (!current) return;
		if (current.workProvince) loadArea(current.workProvince);
		if (current.workCity) loadArea(current.workCity);
	}, [open, activeTabKey]);

	const updateFormValue = <K extends keyof PrecreateSupplementFormValue>(
		orgId: string,
		key: K,
		value: PrecreateSupplementFormValue[K],
	) => {
		setFormMap((prev) => ({
			...prev,
			[orgId]: {
				...prev[orgId],
				[key]: value,
			},
		}));
		setErrorMap((prev) => ({
			...prev,
			[orgId]: {
				...prev[orgId],
				[key]: undefined,
			},
		}));
	};

	const validate = () => {
		const nextErrorMap: PrecreateSupplementErrorMap = {};
		let firstErrorOrgId = "";
		let firstErrorOrgName = "";

		precreateOrgs.forEach((org) => {
			const orgId = String(org.orgId);
			const currentValue = formMap[orgId];
			const currentErrors = validatePrecreateSupplementValue(currentValue);

			if (Object.keys(currentErrors).length > 0) {
				nextErrorMap[orgId] = currentErrors;
				if (!firstErrorOrgId) {
					firstErrorOrgId = orgId;
					firstErrorOrgName = currentValue?.orgName || org.orgName || `组织${orgId}`;
				}
			}
		});

		setErrorMap(nextErrorMap);

		if (firstErrorOrgId) {
			if (firstErrorOrgId !== activeTabKey) {
				setActiveTabKey(firstErrorOrgId);
				message.error(`「${firstErrorOrgName}」存在未填写的必填字段，请补充完整`);
			} else {
				message.error("存在未填写的必填字段，请补充完整");
			}
			return false;
		}

		return true;
	};

	const openPersonModal = (orgId: string) => {
		setPersonModalOrgId(orgId);
		setPersonModalOpen(true);
	};

	const handlePersonSelect = (result: any) => {
		if (result && Array.isArray(result) && result.length > 0) {
			const person = result[0];
			updateFormValue(personModalOrgId, "principal", person.name || "");
			updateFormValue(personModalOrgId, "principalId", person.id || "");
		}
		setPersonModalOpen(false);
	};

	const handleConfirm = () => {
		if (!validate()) {
			return;
		}

		onSave(formMap);
		onClose();
	};

	const renderFieldError = (orgId: string, field: keyof PrecreateSupplementFormErrors) => {
		const errorText = errorMap[orgId]?.[field];
		return errorText ? <div className="mt-1 text-xs text-[#F56C6C]">{errorText}</div> : null;
	};

	const tabItems = precreateOrgs.map((org) => {
		const orgId = String(org.orgId);
		const formValue = formMap[orgId] ?? createInitialValue(org, orgMap, valueMap);
		const tabHasError = !!errorMap[orgId] && Object.values(errorMap[orgId]).some(Boolean);
		const tabName = formValue.orgName || org.orgName || `组织${orgId}`;
		return {
			key: orgId,
			label: (
				<span className="inline-flex items-center gap-1">
					{tabName}
					{tabHasError ? (
						<span className="inline-block size-1.5 rounded-full bg-[#F56C6C]" />
					) : null}
				</span>
			),
			children: (
				<div style={FORM_GRID_STYLE}>
					<div style={SECTION_TITLE_STYLE}>预创建组织信息补充</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							组织名称
						</div>
						<div className="flex-1">
							<Input
								value={formValue.orgName}
								placeholder="请输入组织名称"
								disabled
							/>
							{renderFieldError(orgId, "orgName")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							所属集团
						</div>
						<div className="flex-1">
							<Input
								value={formValue.groupName}
								placeholder="根据上级组织所属集团自动带出，支持修改"
								onChange={(event) =>
									updateFormValue(orgId, "groupName", event.target.value)
								}
							/>
							{renderFieldError(orgId, "groupName")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							组织性质
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={formValue.orgNature}
								options={orgNatureOptions}
								loading={orgNatureLoading}
								placeholder="请选择"
								onChange={(value) => updateFormValue(orgId, "orgNature", value)}
							/>
							{renderFieldError(orgId, "orgNature")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							组织级别
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={formValue.orgLevel || undefined}
								placeholder="请选择"
								options={orgLevelOptions}
								loading={orgLevelLoading}
								onChange={(value) => updateFormValue(orgId, "orgLevel", value)}
							/>
							{renderFieldError(orgId, "orgLevel")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							是否虚拟
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={String(formValue.isVirtual)}
								options={BOOLEAN_OPTIONS}
								disabled
								onChange={(value) =>
									updateFormValue(orgId, "isVirtual", value === "true")
								}
							/>
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							上级组织
						</div>
						<div className="flex-1">
							<TreeSelect
								className="w-full"
								value={formValue.parentOrgId}
								treeData={treeData}
								placeholder="默认带出，不支持修改"
								popupMatchSelectWidth={360}
								listHeight={320}
								disabled
							/>
							{renderFieldError(orgId, "parentOrgId")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							预计成立日期
						</div>
						<div className="flex-1">
							<DatePicker
								className="w-full"
								value={formValue.preEstablishDate}
								placeholder="请选择"
								onChange={(value) =>
									updateFormValue(orgId, "preEstablishDate", value)
								}
							/>
							{renderFieldError(orgId, "preEstablishDate")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							公司地址
						</div>
						<div className="flex-1">
							<Input
								value={formValue.companyAddress}
								placeholder="请输入公司地址"
								onChange={(event) =>
									updateFormValue(orgId, "companyAddress", event.target.value)
								}
							/>
							{renderFieldError(orgId, "companyAddress")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							负责人
						</div>
						<div className="flex-1">
							<Input
								value={formValue.principal}
								placeholder="请选择负责人"
								readOnly
								onClick={() => openPersonModal(orgId)}
								suffix={
									formValue.principal ? (
										<span
											className="cursor-pointer text-gray-400 hover:text-gray-600"
											onClick={(e) => {
												e.stopPropagation();
												updateFormValue(orgId, "principal", "");
												updateFormValue(orgId, "principalId", "");
											}}
										>
											×
										</span>
									) : (
										<span />
									)
								}
								className="cursor-pointer"
							/>
							{renderFieldError(orgId, "principal")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							工作省份
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={formValue.workProvince || undefined}
								placeholder="请选择工作省份"
								options={areaCache[""] || []}
								showSearch
								optionFilterProp="label"
								allowClear
								onChange={(value) => {
									updateFormValue(orgId, "workProvince", value || "");
									updateFormValue(orgId, "workCity", "");
									updateFormValue(orgId, "workDistrict", "");
									if (value) loadArea(value);
								}}
							/>
							{renderFieldError(orgId, "workProvince")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							工作城市
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={formValue.workCity || undefined}
								placeholder="请选择工作城市"
								options={areaCache[formValue.workProvince] || []}
								disabled={!formValue.workProvince}
								showSearch
								optionFilterProp="label"
								allowClear
								onChange={(value) => {
									updateFormValue(orgId, "workCity", value || "");
									updateFormValue(orgId, "workDistrict", "");
									if (value) loadArea(value);
								}}
							/>
							{renderFieldError(orgId, "workCity")}
						</div>
					</div>
					<div style={FORM_ROW_STYLE}>
						<div style={FORM_LABEL_STYLE}>
							<span className="text-[#F56C6C]">*</span>
							工作县区
						</div>
						<div className="flex-1">
							<Select
								className="w-full"
								value={formValue.workDistrict || undefined}
								placeholder="请选择工作县区"
								options={areaCache[formValue.workCity] || []}
								disabled={!formValue.workCity}
								showSearch
								optionFilterProp="label"
								allowClear
								onChange={(value) =>
									updateFormValue(orgId, "workDistrict", value || "")
								}
							/>
							{renderFieldError(orgId, "workDistrict")}
						</div>
					</div>
				</div>
			),
		};
	});

	return (
		<Drawer
			placement="right"
			width={720}
			open={open}
			destroyOnHidden
			title="预创建组织信息补充"
			styles={{
				body: { padding: 24, background: "#fff" },
				footer: { padding: "12px 24px", borderTop: "1px solid #EBEEF5" },
			}}
			footer={
				<div className="flex justify-end gap-2">
					<Button onClick={onClose}>取消</Button>
					<Button type="primary" onClick={handleConfirm}>
						确定
					</Button>
				</div>
			}
			{...commonDrawerProps(onClose)}
		>
			<Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabItems} />
			<PersonCreateModal
				open={personModalOpen}
				single
				titleLabel="选择负责人"
				defaultSelected={
					personModalOrgId && formMap[personModalOrgId]?.principalId
						? [
								{
									id: formMap[personModalOrgId].principalId,
									name: formMap[personModalOrgId].principal,
								},
							]
						: []
				}
				onClose={handlePersonSelect}
			/>
		</Drawer>
	);
};

export default PrecreateSupplementDrawer;
