import { fetchEnum } from "#src/api/strategy/index.js";
import {
	confirmUserIdsIndicatorCountHisPage,
	confirmUserIdsIndicatorCountPage,
	fetchConfirmUserIdsIndicatorCountHisHead,
} from "#src/api/strategy/target-filling";
import { Descriptions, Drawer, Table } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { commonDrawerProps } from "../../target-management/constants/base";

interface Props {
	open: boolean;
	onClose: () => void;
	record: any;
	effTaskSubmissionId?: string | number;
	subperiods?: any[];
}

export default function ConfirmedIndicatorDrawer({
	open,
	onClose,
	record,
	effTaskSubmissionId,
	subperiods,
}: Props) {
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
	const [columns, setColumns] = useState<any[]>([
		{ title: "指标名称", dataIndex: "name", key: "name" },
		{ title: "年度目标值", dataIndex: "annualTargetValue", key: "annualTargetValue" },
	]);
	const enumMap = useRef<Record<string, string>>({});
	const dynamicColsRef = useRef<any[]>([]);
	const fetchEnumData = async () => {
		const { data } = await fetchEnum("TimePeriod");
		enumMap.current = data;
	};

	const getRowUnitLabel = (row: any) => row?.unitName || row?.indicatorUnitStr || "";

	const buildColumns = (dynamicCols: any[]) => {
		const baseCols = [
			{ title: "指标名称", dataIndex: "name", key: "name" },
			{
				title: "年度目标值",
				dataIndex: "annualTargetValue",
				key: "annualTargetValue",
				render: (value: any, row: any) =>
					value !== null && value !== undefined && value !== ""
						? `${value}${getRowUnitLabel(row)}`
						: "-",
			},
			...dynamicCols.map((col: any) => ({
				...col,
				render: (value: any, row: any) =>
					value !== null && value !== undefined && value !== ""
						? `${value}${getRowUnitLabel(row)}`
						: "-",
			})),
		];

		setColumns(
			baseCols.map((col) => ({
				...col,
				ellipsis: true,
				onCell: () => ({ style: { whiteSpace: "nowrap" } }),
			})),
		);
	};

	const loadData = async (page = 1, size = 10) => {
		setLoading(true);
		try {
			if (effTaskSubmissionId) {
				// 获取动态列
				fetchConfirmUserIdsIndicatorCountHisHead(effTaskSubmissionId).then((res: any) => {
					if (res && res.data) {
						const dynamicCols = res.data.map((item: any) => ({
							title: item.name,
							dataIndex: ["map", String(item.id)],
							key: `period-${item.id}`,
							width: 100,
						}));
						dynamicColsRef.current = dynamicCols;
						buildColumns(dynamicColsRef.current);
					}
				});

				if (!record?.targetOrgCode || !record?.responsiblePersonId) return;
				const res: any = await confirmUserIdsIndicatorCountHisPage({
					effTaskSubmissionId: Number(effTaskSubmissionId),
					targetOrgCode: record.targetOrgCode,
					responsiblePersonId: record.responsiblePersonId,
				});
				if (res) {
					const list = Array.isArray(res.data) ? res.data : res.data?.list || [];
					setData(list);
					buildColumns(dynamicColsRef.current);
				} else {
					setData([]);
				}
			} else {
				// Page Mode: Use subperiods for columns
				const dynamicCols =
					subperiods && subperiods.length > 0
						? subperiods.map((id: any) => ({
								title: enumMap.current[String(id)], // Use ID as title for now
								dataIndex: ["map", String(id)],
								key: `period-${id}`,
								width: 100,
							}))
						: [];

				if (!record?.ids || record.ids.length === 0) return;
				const res: any = await confirmUserIdsIndicatorCountPage({
					indicatorListOverviewIds: record.ids,
					pageNum: page,
					pageSize: size,
					searchCount: true,
					subperiods: subperiods || [],
				});
				if (res) {
					const list = Array.isArray(res.data) ? res.data : res.data?.list || [];
					const total = res.total || res.data?.total || list.length || 0;
					setData(list);
					buildColumns(dynamicCols);
					setPagination({
						current: page,
						pageSize: size,
						total,
					});
				} else {
					setData([]);
					setPagination({ current: 1, pageSize: 10, total: 0 });
				}
			}
		} catch (e) {
			console.error(e);
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) {
			if (effTaskSubmissionId && record?.targetOrgCode && record?.responsiblePersonId) {
				loadData();
			} else if (!effTaskSubmissionId && record?.ids && record.ids.length > 0) {
				fetchEnumData().then(() => {
					loadData(1, 10);
				});
			}
		}
	}, [open, record, effTaskSubmissionId]);

	return (
		<Drawer
			title="确认指标数"
			placement="right"
			width={680}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<Descriptions
				style={{ width: "90%" }}
				column={3}
				colon={false}
				className="mb-4 [&_.ant-descriptions-item-content]:text-[rgba(0,0,0,1)] [&_.ant-descriptions-item-label]:text-[rgba(96,98,102,1)]"
			>
				<Descriptions.Item label="拆解对象">{record?.targetOrgName}</Descriptions.Item>
				<Descriptions.Item label="负责人">
					{record?.responsiblePersonName}
				</Descriptions.Item>
				<Descriptions.Item label="确认指标数">{record?.number}</Descriptions.Item>
			</Descriptions>
			<Table
				columns={columns}
				dataSource={data}
				loading={loading}
				tableLayout="fixed"
				scroll={{ x: "max-content" }}
				pagination={
					effTaskSubmissionId
						? false
						: {
								current: pagination.current,
								pageSize: pagination.pageSize,
								total: pagination.total,
								onChange: (p, s) => loadData(p, s),
								showSizeChanger: true,
								showTotal: (t) => `共 ${t} 条`,
							}
				}
				size="small"
				className="[&_.ant-table-cell]:text-[rgba(96,98,102,1)]"
				rowKey="id"
			/>
		</Drawer>
	);
}
