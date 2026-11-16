import { fetchConfirmUserIdsPage } from "#src/api/strategy/target-filling";
import { Button, ConfigProvider, Drawer, Select, Space, Table } from "antd";
import zhCN from "antd/locale/zh_CN";
import React, { useEffect, useRef, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";
import ConfirmedIndicatorDrawer from "./ConfirmedIndicatorDrawer";

interface Props {
	open: boolean;
	onClose: () => void;
	ids: any[];
	subperiods?: any[];
}

export default function ConfirmUserDrawer({ open, onClose, ids, subperiods }: Props) {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [total, setTotal] = useState(0);
	const [pageNum, setPageNum] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [targetOrgName, setTargetOrgName] = useState<string | undefined>(undefined);
	const [responsiblePersonName, setResponsiblePersonName] = useState<string | undefined>(
		undefined,
	);
	const [targetOrgOptions, setTargetOrgOptions] = useState<any[]>([]);
	const [responsiblePersonOptions, setResponsiblePersonOptions] = useState<any[]>([]);
	const [indicatorDrawerOpen, setIndicatorDrawerOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<any>(null);
	const tableWrapRef = useRef<HTMLDivElement>(null);
	const [scrollY, setScrollY] = useState<number>(0);

	useEffect(() => {
		if (!open) return;
		const el = tableWrapRef.current;
		if (!el) return;
		// 表头高度（small size 约 39px）+ 分页栏高度（约 56px，含上下 margin）
		const RESERVED = 39 + 64;
		const update = () => {
			const h = el.clientHeight - RESERVED;
			if (h > 0) setScrollY(h);
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, [open]);

	const loadData = async (p = pageNum, s = pageSize) => {
		setLoading(true);
		try {
			const res: any = await fetchConfirmUserIdsPage({
				indicatorListOverviewIds: ids,
				pageNum: p,
				pageSize: s,
				targetOrgName,
				responsiblePersonName,
			});
			const list =
				res && res.data ? (Array.isArray(res.data) ? res.data : res.data.list || []) : [];
			setData(list);
			setTotal(res?.data?.total || list.length || 0);
			setPageNum(p);
			setPageSize(s);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			setTargetOrgName(undefined);
			setResponsiblePersonName(undefined);
			setPageNum(1);
		}
	}, [open]);

	useEffect(() => {
		if (open && ids.length > 0) {
			loadData(1, pageSize);
			// Fetch options
			fetchConfirmUserIdsPage({
				indicatorListOverviewIds: ids,
				pageNum: 1,
				pageSize: 500,
			}).then((res: any) => {
				const list =
					res && res.data
						? Array.isArray(res.data)
							? res.data
							: res.data.list || []
						: [];
				const orgs = Array.from(
					new Set(list.map((item: any) => item.targetOrgName).filter(Boolean)),
				).map((name) => ({ label: name, value: name }));
				setTargetOrgOptions(orgs);

				const persons = Array.from(
					new Set(list.map((item: any) => item.responsiblePersonName).filter(Boolean)),
				).map((name) => ({ label: name, value: name }));
				setResponsiblePersonOptions(persons);
			});
		} else if (open) {
			setData([]);
			setTotal(0);
			setTargetOrgOptions([]);
			setResponsiblePersonOptions([]);
		}
	}, [open, ids]);

	const handleSearch = () => {
		loadData(1, pageSize);
	};

	const handleReset = () => {
		setTargetOrgName(undefined);
		setResponsiblePersonName(undefined);
		setLoading(true);
		fetchConfirmUserIdsPage({
			indicatorListOverviewIds: ids,
			pageNum: 1,
			pageSize,
			targetOrgName: undefined,
			responsiblePersonName: undefined,
		}).then((res: any) => {
			const list =
				res && res.data ? (Array.isArray(res.data) ? res.data : res.data.list || []) : [];
			setData(list);
			setTotal(res?.data?.total || list.length || 0);
			setPageNum(1);
			setLoading(false);
		});
	};

	const columns = [
		{
			title: "拆解对象",
			dataIndex: "targetOrgName",
			key: "targetOrgName",
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "负责人",
			dataIndex: "responsiblePersonName",
			key: "responsiblePersonName",
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
		},
		{
			title: "确认指标数",
			dataIndex: "number",
			key: "number",
			onHeaderCell: () => ({ style: { background: "#F0F2F5" } }),
			render: (text: number, record: any) => (
				<Button
					type="link"
					onClick={() => {
						setSelectedRecord(record);
						setIndicatorDrawerOpen(true);
					}}
				>
					{text}
				</Button>
			),
		},
	];

	return (
		<Drawer
			title="各组织负责人目标值确认"
			width="47vw"
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
				<div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
					<Space>
						<div style={{ display: "flex", alignItems: "center" }}>
							<Select
								prefix="拆解对象"
								placeholder="支持模糊搜索"
								value={targetOrgName}
								onChange={setTargetOrgName}
								style={{ width: 200 }}
								allowClear
								showSearch
								options={targetOrgOptions}
								filterOption={(input, option) =>
									(option?.label ?? "")
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							/>
						</div>
						<div style={{ display: "flex", alignItems: "center" }}>
							<Select
								prefix="负责人"
								placeholder="支持模糊搜索"
								value={responsiblePersonName}
								onChange={setResponsiblePersonName}
								style={{ width: 200 }}
								allowClear
								showSearch
								options={responsiblePersonOptions}
								filterOption={(input, option) =>
									(option?.label ?? "")
										.toLowerCase()
										.includes(input.toLowerCase())
								}
							/>
						</div>
					</Space>
					<Space>
						<Button type="primary" onClick={handleSearch}>
							查询
						</Button>
						<Button onClick={handleReset}>重置</Button>
					</Space>
				</div>
				<div ref={tableWrapRef} style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
					<ConfigProvider locale={zhCN}>
						<Table
							columns={columns}
							dataSource={data}
							rowKey={(record) =>
								record.id || record.targetOrgCode || Math.random().toString()
							}
							pagination={{
								current: pageNum,
								pageSize,
								total,
								showSizeChanger: true,
								showQuickJumper: true,
								showTotal: (total) => `共 ${total} 条`,
								onChange: (page, size) => loadData(page, size),
							}}
							loading={loading}
							scroll={scrollY > 0 ? { y: scrollY } : undefined}
							size="small"
						/>
					</ConfigProvider>
				</div>
			</div>
			<ConfirmedIndicatorDrawer
				open={indicatorDrawerOpen}
				onClose={() => setIndicatorDrawerOpen(false)}
				record={selectedRecord}
				subperiods={subperiods}
			/>
		</Drawer>
	);
}
