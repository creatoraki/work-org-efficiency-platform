import { commonExport } from "#src/api/file/export-task/index.js";
import { fetchProjScale } from "#src/api/org-management/org-file";
import { BasicButton, BasicContent, BasicTable, SectionTitle } from "#src/components";
import { UploadOutlined } from "@ant-design/icons";
import { Descriptions } from "antd";
import { useEffect, useRef, useState } from "react";

import { useOrgStore } from "../store";
import { getProjScaleColumns, ORG_FILE_PERMISSIONS } from "./config";

export default function ProjScale() {
	const [totalItems, setTotalItems] = useState<any>([
		{ key: "projectNum", label: "在管项目数 ", children: "0个" },
		{ key: "planDeliveryProjectNum", label: "计划交付数 ", children: "0个" },
		{ key: "expandDeliveryProjectNum", label: "当拓当交储备数 ", children: "0个" },
	]);
	const [page, setPage] = useState<any>({
		pageNum: 1,
		pageSize: 10,
	});
	const { id } = useOrgStore();
	const actionRef = useRef<any>();

	const request = async (pramas: any) => {
		const { pageSize, current } = pramas;
		setPage({ pageNum: current, pageSize });
		if (!id) {
			return {
				data: [],
				success: true,
				total: 0,
				pageSize,
				pageNum: current,
			};
		}
		const { data } = await fetchProjScale({
			orgId: id,
			pageNum: current,
			pageSize,
		});
		setTotalItems([
			{
				key: "projectNum",
				label: "在管项目数 ",
				children: `${data.list?.[0]?.projectNum || 0}个`,
			},
			{
				key: "planDeliveryProjectNum",
				label: "计划交付数 ",
				children: `${data.list?.[0]?.planDeliveryProjectNum || 0}个`,
			},
			{
				key: "expandDeliveryProjectNum",
				label: "当拓当交储备数 ",
				children: `${data.list?.[0]?.expandDeliveryProjectNum || 0}个`,
			},
		]);
		return {
			data: data.list,
			success: true,
			total: data.total,
			pageSize,
			pageNum: current,
		};
	};
	const handleExport = async () => {
		try {
			const heads = getProjScaleColumns({ page })
				?.filter((item) => item.title !== "序号")
				?.map((item) => {
					return {
						tableHeadCode: item.dataIndex,
						tableHeadName: item.title,
					};
				});

			await commonExport({
				excelId: 10,
				reqCondition: { orgId: id, pageNum: 1, pageSize: 10000 },
				exportTableHead: heads,
			});
		} catch (error) {
			console.error("导出失败:", error);
		}
	};
	// 更新数据
	useEffect(() => {
		actionRef.current?.reload();
	}, [id]);

	return (
		<BasicContent
			className="flex min-h-0 min-w-0 flex-col rounded-md bg-[#FFFFFF] p-4 md:pt-2"
			style={{
				boxShadow: "0px 0px 12px 0px #0000001F ",
			}}
		>
			<div className="mb-3 flex h-auto w-full items-center justify-between">
				<div className="flex h-auto w-auto items-center justify-center">
					<SectionTitle title="项目规模" className="!w-[100px] text-base" />
					<Descriptions
						className="orgFileDescriptions h-auto w-[450px]"
						styles={{
							label: {
								textAlign: "right",
								display: "block",
								color: "#606266",
								whiteSpace: "nowrap",
								marginRight: "8px",
							},
							// header: {
							// 	display: "none"
							// },
							content: {
								color: "#000000",
								fontSize: 14,
								display: "block",
								whiteSpace: "nowrap",
							},
						}}
						items={totalItems}
					/>
				</div>
				<BasicButton
					type="default"
					key="import"
					icon={<UploadOutlined />}
					style={{ height: 28 }}
					onClick={handleExport}
					auth={ORG_FILE_PERMISSIONS.ORG_FILE_EXPORT}
				>
					<span className="text-xs">导出</span>
				</BasicButton>
			</div>

			<BasicTable
				className="h-full w-full min-w-0 flex-1"
				size="small"
				cardProps={false}
				rowKey="orgUuid"
				adaptive={{
					offsetBottom: 38,
				}}
				columns={getProjScaleColumns({ page })}
				request={request as any}
				actionRef={actionRef}
				cardBordered={false}
				search={{
					className:
						"!mb-0 !p-0 [&_.ant-pro-query-filter_.ant-form-item-label>label]:!whitespace-nowrap ",

					labelWidth: "auto",
					defaultCollapsed: false,
					optionRender: false,
				}}
				options={{
					reload: false,
					density: false,
					fullScreen: false,
					setting: false,
				}}
				toolbar={{
					className: "border-t",
				}}
			/>
		</BasicContent>
	);
}
