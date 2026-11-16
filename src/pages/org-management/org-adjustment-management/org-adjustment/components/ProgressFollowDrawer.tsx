/**
 * 进度跟进抽屉
 *
 * 通过 queryLog 拉取操作日志，并支持按状态（action.value）筛选。
 */

import type { QueryLogRes } from "#src/api/org-management/org-adjustment-management/org-adjustment/api";
import type { OrgAdjustmentTaskTableRow } from "../types";
import { queryLog2 } from "#src/api/org-management/org-adjustment-management/org-adjustment/api";
import BlankSvg from "#src/assets/svg/blank.svg";
import { commonDrawerProps } from "#src/pages/strategy/target-management/constants/base.js";
import { Button, ConfigProvider, Drawer, Select, Table } from "antd";
import zhCN from "antd/locale/zh_CN";
import React from "react";

interface Props {
	open: boolean;
	record?: OrgAdjustmentTaskTableRow | null;
	/** 业务编码，对应日志接口的 bizCode 字段 */
	bizCode?: string;
	onClose: () => void;
}

export default function ProgressFollowDrawer({
	open,
	record,
	bizCode = "ORG_ADJUSTMENT_TASK",
	onClose,
}: Props) {
	const [items, setItems] = React.useState<QueryLogRes[]>([]);
	const [loading, setLoading] = React.useState(false);
	/** Select 当前选择的值（未点查询前不参与过滤） */
	const [pendingStatus, setPendingStatus] = React.useState<string>("");
	/** 实际应用到表格过滤的状态值 */
	const [appliedStatus, setAppliedStatus] = React.useState<string>("");

	/** 拉取日志数据 */
	const load = React.useCallback(async () => {
		if (!record?.id) return;
		setLoading(true);
		try {
			const res = await queryLog2(String(record.id), bizCode);
			setItems(Array.isArray(res?.data) ? res.data : []);
		} catch (e) {
			console.error("加载进度跟进日志失败", e);
			setItems([]);
		} finally {
			setLoading(false);
		}
	}, [record?.id, bizCode]);

	React.useEffect(() => {
		if (open) {
			setPendingStatus("");
			setAppliedStatus("");
			load();
		}
	}, [open, load]);

	/** 基于日志数据动态生成状态筛选项（去重后的 action.value） */
	const statusOptions = React.useMemo(() => {
		const seen = new Set<string>();
		const options: { label: string; value: string }[] = [];
		items.forEach((it) => {
			const v = it.action?.value;
			if (v && !seen.has(v)) {
				seen.add(v);
				options.push({ label: v, value: v });
			}
		});
		return options;
	}, [items]);

	/** 客户端按状态筛选 */
	const filteredItems = React.useMemo(() => {
		if (!appliedStatus) return items;
		return items.filter((it) => it.action?.value === appliedStatus);
	}, [items, appliedStatus]);

	/** 点击查询：重新拉取数据并应用当前选中的状态过滤 */
	const handleQuery = async () => {
		setAppliedStatus(pendingStatus);
		await load();
	};

	/** 点击重置：清空状态筛选并重新拉取数据 */
	const handleReset = async () => {
		setPendingStatus("");
		setAppliedStatus("");
		await load();
	};

	const columns = [
		{
			title: "状态",
			dataIndex: ["action", "value"],
			key: "actionValue",
			width: "33.33%",
			render: (v: string) => v || "-",
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "时间",
			dataIndex: "operateTime",
			key: "operateTime",
			width: "33.33%",
			render: (t: unknown) => {
				if (!t) return "-";
				if (typeof t === "string" || typeof t === "number") {
					const date = new Date(t as any);
					return Number.isNaN(date.getTime()) ? String(t) : date.toLocaleString();
				}
				return String(t);
			},
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "内容",
			dataIndex: "content",
			key: "content",
			width: "33.34%",
			render: (content: QueryLogRes["content"]) => (
				<div style={{ whiteSpace: "pre-wrap" }}>
					{content?.options
						?.map((opt) => (opt.data as any)?.text ?? "")
						.filter(Boolean)
						.join(" ") || "-"}
				</div>
			),
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
	];

	return (
		<Drawer
			title="进度跟进"
			placement="right"
			width={680}
			open={open}
			destroyOnClose
			{...commonDrawerProps(onClose)}
		>
			<div className="mb-3 flex items-center gap-2">
				<Select
					prefix="状态 "
					style={{ width: 300 }}
					value={pendingStatus}
					options={statusOptions}
					onChange={setPendingStatus}
					placeholder="请选择状态"
				/>
				<Button
					type="primary"
					onClick={handleQuery}
					loading={loading}
					style={{ marginLeft: "auto" }}
				>
					查询
				</Button>
				<Button type="text" onClick={handleReset} disabled={loading}>
					重置
				</Button>
			</div>
			<ConfigProvider
				locale={zhCN}
				renderEmpty={() => (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							padding: "32px 0",
						}}
					>
						<img src={BlankSvg} alt="" />
						<span style={{ color: "rgba(0, 0, 0, 0.25)", marginTop: 8 }}>暂无数据</span>
					</div>
				)}
			>
				<Table
					columns={columns as any}
					dataSource={filteredItems.map((it, idx) => ({ key: it.id || idx, ...it }))}
					rowKey="id"
					size="small"
					loading={loading}
					pagination={{
						size: "default",
						pageSize: 10,
						showSizeChanger: true,
						pageSizeOptions: ["10", "20", "50"],
						showTotal: (t: number) => <span className="text-gray-500">共 {t} 条</span>,
					}}
				/>
			</ConfigProvider>
		</Drawer>
	);
}
