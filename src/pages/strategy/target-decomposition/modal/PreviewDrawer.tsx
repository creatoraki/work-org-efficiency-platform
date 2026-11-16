import type { ColumnsType } from "antd/es/table";
import type {
	PreviewIndicatorHead,
	PreviewIndicatorRow,
} from "../../../../api/strategy/indicator-config";
import blankSvg from "#src/assets/svg/common-blank.svg";
import { useGlobalStore } from "#src/store";
import { Button, Drawer, Select, Space, Table, TreeSelect } from "antd";
import React from "react";
import { fetchOverallTargetAudience } from "../../../../api/strategy";
import {
	previewIndicatorConfigHead,
	previewIndicatorConfigList,
} from "../../../../api/strategy/indicator-config";
import { commonDrawerProps } from "../../target-management/constants/base";

interface Props {
	open: boolean;
	data?: any;
	indicators?: { label: string; value: string | number }[];
	onClose: (res?: any) => void;
}

function numFmt(v: number) {
	if (v === null || v === undefined) return "-";
	// show 1 decimal for percent-like fields if not integer
	return typeof v === "number" ? v.toLocaleString() : v;
}

export default function PreviewDrawer({ open, data, indicators, onClose }: Props) {
	const [rows, setRows] = React.useState<PreviewIndicatorRow[]>([]);
	const [columns, setColumns] = React.useState<ColumnsType<PreviewIndicatorRow>>([]);
	const [loading, setLoading] = React.useState(false);
	const [decompose, setDecompose] = React.useState<string | undefined>(undefined);
	const [currentIndicatorId, setCurrentIndicatorId] = React.useState<string | number | undefined>(
		undefined,
	);
	const [, setDecomposeOptions] = React.useState<{ label: string; value: string }[]>([]);
	const { oepOrgTree, loadOepOrgTree } = useGlobalStore();

	React.useEffect(() => {
		if (open && data?.indicatorDetail?.id) {
			loadOepOrgTree().catch(() => {
				/* ignore */
			});
			setCurrentIndicatorId(data.indicatorDetail.id);
			// 获取拆解对象选项
		} else {
			setRows([]);
			setColumns([]);
			setDecompose(undefined);
			setCurrentIndicatorId(undefined);
			setDecomposeOptions([]);
		}
	}, [open, data]);

	React.useEffect(() => {
		if (currentIndicatorId) {
			fetchData(currentIndicatorId, decompose);
			// 当切换指标时，重新加载拆解对象选项
			// loadDecomposeOptions(currentIndicatorId);
		}
	}, [currentIndicatorId, decompose]);

	const buildColumns = (head: PreviewIndicatorHead): ColumnsType<PreviewIndicatorRow> => {
		const cols: ColumnsType<PreviewIndicatorRow> = [
			{
				title: "拆解对象",
				dataIndex: "targetOrgName",
				key: "targetOrgName",
				width: 150,
				fixed: "left",
			},
			{
				title: head.subperiodName,
				children: [
					{
						title: `同期值${head.unitName ? `(${head.unitName})` : ""}`,
						dataIndex: "samePeriodValue",
						key: "samePeriodValue",
						width: 120,
						align: "right",
						render: (v: number) => numFmt(v),
					},
					{
						title: `参考值${head.unitName ? `(${head.unitName})` : ""}`,
						dataIndex: "referenceValue",
						key: "referenceValue",
						width: 120,
						align: "right",
						render: (v: number) => numFmt(v),
					},
					{
						title: `年度目标${head.unitName ? `(${head.unitName})` : ""}`,
						dataIndex: "annualTargetValue",
						key: "annualTargetValue",
						width: 120,
						align: "right",
						render: (v: number) => numFmt(v),
					},
					{
						title: "偏差",
						dataIndex: "deviationValue",
						key: "deviationValue",
						width: 120,
						align: "right",
						render: (v: number) => numFmt(v),
					},
				],
			},
		];

		// 动态指标列
		if (head.indicatorMap) {
			Object.entries(head.indicatorMap).forEach(([name, id]) => {
				cols.push({
					title: name,
					dataIndex: ["basicIndicator", String(id)],
					key: `basicIndicator-${id}`,
					width: 150,
					align: "right",
					render: (v: number) => numFmt(v),
				});
			});
		}

		// 动态周期列
		if (head.periodMap) {
			Object.entries(head.periodMap)
				.sort(([, aId], [, bId]) => Number(aId) - Number(bId))
				.forEach(([name, id]) => {
					cols.push({
						title: name,
						dataIndex: ["periodic", String(id)],
						key: `periodic-${id}`,
						width: 150,
						align: "right",
						render: (v: number) => numFmt(v),
					});
				});
		}

		cols.push({
			title: "状态",
			dataIndex: "statusStr",
			key: "statusStr",
			width: 100,
			fixed: "right",
		});

		return cols;
	};

	const fetchData = async (id: string | number, targetOrgCode?: string) => {
		setLoading(true);
		try {
			// 如果切换了指标，需要获取该指标的 totalTargetCode (targetOrgCode)
			// 如果是初始进入，data.indicatorDetail 已经有了
			// 但为了统一逻辑，我们可以重新获取详情，或者从 indicators 列表中查找（如果列表包含更多信息）
			// 这里选择重新获取详情以确保数据准确
			let totalTargetCode = data?.indicatorDetail?.totalTargetCode;
			if (String(id) !== String(data?.indicatorDetail?.id)) {
				const detail = await fetchOverallTargetAudience(id);
				totalTargetCode = detail?.totalTargetCode;
			}

			// 如果没有 targetOrgCode，可能无法预览，或者后端允许为空？
			// 假设必须有
			if (!totalTargetCode) {
				// console.warn("Missing targetOrgCode for preview");
			}

			const [headRes, listRes] = await Promise.all([
				previewIndicatorConfigHead({
					effTaskIndicatorConfDetailsId: String(id),
					...(totalTargetCode && { totalTargetCode }),
					...(targetOrgCode && { targetOrgCode }),
				}),
				previewIndicatorConfigList({
					effTaskIndicatorConfDetailsId: String(id),
					...(totalTargetCode && { totalTargetCode }),
					...(targetOrgCode && { targetOrgCode }),
					pageSize: 100,
					pageNum: 1,
				} as any),
			]);

			if (headRes.data) {
				setColumns(buildColumns(headRes.data));
			}
			if (listRes.data && listRes.data.list) {
				setRows(listRes.data.list);
			} else {
				setRows([]);
			}
		} catch (error) {
			console.error("Failed to fetch preview data", error);
		} finally {
			setLoading(false);
		}
	};

	// const filteredRows = decompose ? rows.filter(r => r.targetOrgName === decompose) : rows;

	return (
		<Drawer
			title="预览"
			placement="right"
			width={1536}
			open={open}
			{...commonDrawerProps(onClose)}
		>
			<div className="p-3">
				{/* top display fields: 指标 + 拆解对象 (select) */}
				<div className="mb-4 flex items-center gap-6">
					<div className="flex items-center">
						<div className="mr-2 w-12 text-sm text-gray-600">指标</div>
						<Select
							value={currentIndicatorId}
							onChange={(val) => setCurrentIndicatorId(val)}
							placeholder="请选择指标"
							style={{ minWidth: 220 }}
							options={indicators}
						/>
					</div>
					{/** 拆解对象树形下拉选 */}
					<div className="flex items-center">
						<div className="mr-2 text-sm text-gray-600">拆解对象</div>
						<TreeSelect
							value={decompose}
							onChange={(val) => setDecompose(val as string | undefined)}
							placeholder="请选择拆解对象"
							style={{ minWidth: 220 }}
							styles={{
								popup: {
									root: {
										minWidth: 420,
									},
								},
							}}
							allowClear
							showSearch
							treeData={oepOrgTree}
							fieldNames={{ label: "title", value: "key", children: "children" }}
							treeNodeFilterProp="title"
						/>
					</div>
				</div>

				{!loading && rows.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20">
						<img src={blankSvg} alt="暂无数据" />
						<div className="mt-2 text-gray-400">暂无数据</div>
					</div>
				) : (
					<Table
						columns={columns}
						dataSource={rows}
						pagination={false}
						bordered
						size="small"
						rowKey="targetOrgCode"
						loading={loading}
						scroll={{ x: 1400 }}
					/>
				)}
			</div>

			<div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 text-right">
				<Space>
					<Button onClick={() => onClose?.({ cancelled: true })}>关闭</Button>
				</Space>
			</div>
		</Drawer>
	);
}
