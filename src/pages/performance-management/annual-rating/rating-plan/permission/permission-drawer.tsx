import type { PlanPermissionMember, RatingPlanItem } from "#src/api/performance-management/plan";

import {
	fetchPlanPermissionList,
	PlanPermission,
	savePlanPermissions,
} from "#src/api/performance-management/plan";
import {
	exportCsv,
	parseCsv,
} from "#src/pages/performance-management/annual-rating/components/export-csv";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Select, Table } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";

/** 操作权限选项 */
const PERMISSION_OPTIONS = [
	{ label: "管理", value: "管理" },
	{ label: "查看", value: "查看" },
];

/**
 * 权限编辑抽屉属性
 */
interface PermissionDrawerProps {
	/** 当前计划 */
	plan?: RatingPlanItem;
	/** 是否可见 */
	open: boolean;
	/** 关闭回调 */
	onClose: () => void;
}

/**
 * 权限编辑抽屉
 *
 * 宽 680px 的基础抽屉，顶部为新增人员 / 导出模版 / 导入操作，
 * 主体为成员权限表格，底部为取消 / 确定。
 *
 * @param props - 组件属性
 * @param props.plan - 当前计划
 * @param props.open - 是否可见
 * @param props.onClose - 关闭回调
 * @returns 权限编辑抽屉
 *
 * @author 王善能
 * @since 2026-11-12
 */
export function PermissionDrawer({ plan, open, onClose }: PermissionDrawerProps) {
	const [members, setMembers] = useState<PlanPermissionMember[]>([]);
	const [saving, setSaving] = useState(false);
	const importInputRef = useRef<HTMLInputElement>(null);

	const load = useCallback(async () => {
		if (!plan) return;
		const result = await fetchPlanPermissionList(plan.id);
		setMembers(result);
	}, [plan]);

	useEffect(() => {
		if (open) {
			load();
		}
	}, [open, load]);

	/**
	 * 权限导入模版字典
	 *
	 * 与「导出模版」生成的 CSV 表头保持一致：首行首列为区块标题「人员」，
	 * 第四列为权限等级（管理 / 查看）。
	 */
	const IMPORT_TEMPLATE = {
		/** 人员区块标题 */
		SECTION_TITLE: "人员",
	} as const;

	const updatePermission = (id: string, permission?: PlanPermission) => {
		setMembers((current) =>
			current.map((item) => (item.id === id ? { ...item, permission } : item)),
		);
	};

	const handleSave = async () => {
		if (!plan) return;
		if (members.some((item) => !item.permission)) {
			message.error("请为所有成员选择操作权限");
			return;
		}
		setSaving(true);
		try {
			await savePlanPermissions({ planId: plan.id, members });
			message.success("权限保存成功");
			onClose();
		} finally {
			setSaving(false);
		}
	};

	return (
		<Drawer
			title={
				<span className="text-[20px] font-semibold leading-[28px] text-[#323233]">
					权限编辑
				</span>
			}
			open={open}
			onClose={onClose}
			width={680}
			footer={
				<div className="flex justify-end gap-2">
					<Button className="rounded-[3px] border-[#E4E7ED]" onClick={onClose}>
						取消
					</Button>
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						loading={saving}
						onClick={handleSave}
					>
						确定
					</Button>
				</div>
			}
		>
			<div className="mb-4 flex items-center justify-between">
				<div className="flex gap-2">
					<Button
						type="primary"
						className="rounded-[3px] bg-[#0075FF]"
						onClick={() => message.info("新增人员：人员选择器待接入")}
					>
						新增人员
					</Button>
					<Button
						className="rounded-[3px] border-[#E4E7ED]"
						onClick={() =>
							exportCsv(
								"权限导入模版.csv",
								["人员", "工号", "所属部门", "操作权限"],
								[["张三", "E1001", "善数创新部", "管理"]],
							)
						}
					>
						导出模版
					</Button>
				</div>
				<Button
					className="rounded-[3px] border-[#E4E7ED]"
					icon={<DownloadOutlined />}
					onClick={() => importInputRef.current?.click()}
				>
					导入
				</Button>
				<input
					ref={importInputRef}
					type="file"
					accept=".csv,text/csv"
					className="hidden"
					onChange={async (event) => {
						const file = event.target.files?.[0];
						event.target.value = "";
						if (!file) return;
						try {
							const rows = parseCsv(await file.text()).filter((row) =>
								row.some((cell) => cell.trim()),
							);
							const dataRows =
								rows[0]?.[0]?.trim() === IMPORT_TEMPLATE.SECTION_TITLE
									? rows.slice(1)
									: rows;
							const parsed = dataRows
								.map((cells, index) => ({
									id: `import-${Date.now()}-${index}`,
									name: cells[0]?.trim() ?? "",
									employeeNo: cells[1]?.trim() ?? "",
									department: cells[2]?.trim() ?? "",
									permission:
										cells[3]?.trim() === PlanPermission.MANAGE ||
										cells[3]?.trim() === PlanPermission.VIEW
											? (cells[3].trim() as PlanPermission)
											: undefined,
								}))
								.filter((item) => item.name);
							if (parsed.length === 0) {
								message.error("未解析到可导入的成员数据");
								return;
							}
							setMembers((current) => [...current, ...parsed]);
							message.success(`已导入 ${parsed.length} 条成员`);
						} catch (error) {
							message.error(error instanceof Error ? error.message : "CSV 解析失败");
						}
					}}
				/>
			</div>
			<Table<PlanPermissionMember>
				rowKey="id"
				size="middle"
				bordered
				pagination={false}
				dataSource={members}
				columns={[
					{ title: "人员", dataIndex: "name", key: "name", width: 66 },
					{ title: "工号", dataIndex: "employeeNo", key: "employeeNo", width: 81 },
					{ title: "所属部门", dataIndex: "department", key: "department", width: 216.5 },
					{
						title: (
							<span>
								<span className="mr-1 text-[#F5222D]">*</span>
								操作权限
							</span>
						),
						dataIndex: "permission",
						key: "permission",
						width: 216.5,
						render: (value: string | undefined, record: PlanPermissionMember) => (
							<Select
								allowClear
								placeholder="请选择"
								options={PERMISSION_OPTIONS}
								value={value}
								onChange={(next) =>
									updatePermission(record.id, next as PlanPermission | undefined)
								}
								className="w-full"
							/>
						),
					},
					{
						title: "操作",
						key: "action",
						width: 52,
						render: (_value: unknown, record: PlanPermissionMember) => (
							<button
								type="button"
								className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-[22px] text-[#0075FF]"
								onClick={() =>
									setMembers((current) =>
										current.filter((item) => item.id !== record.id),
									)
								}
							>
								删除
							</button>
						),
					},
				]}
				className="[&_.ant-table-thead>tr>th]:bg-[#f0f2f5]"
			/>
		</Drawer>
	);
}
