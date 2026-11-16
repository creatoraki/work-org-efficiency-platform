import type { OrgAdjustmentResultDetailData } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { fetchOrgAdjustmentResultDetail } from "#src/api/org-management/org-adjustment-management/adjustment-canvas";
import { AdjustmentReportContent } from "#src/pages/org-management/org-adjustment-management/adjustment-canvas/components/AdjustmentSubmissionDrawer";
import { Result, Spin } from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export default function AdjustmentReportPage() {
	const [searchParams] = useSearchParams();
	const taskIdRaw = searchParams.get("taskId");
	const taskId = Number(taskIdRaw);

	const [loading, setLoading] = useState(true);
	const [errorMsg, setErrorMsg] = useState("");
	const [data, setData] = useState<OrgAdjustmentResultDetailData | null>(null);

	useEffect(() => {
		if (!taskIdRaw || Number.isNaN(taskId) || taskId <= 0) {
			setErrorMsg("链接缺少有效的 taskId 参数");
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);
		setErrorMsg("");

		fetchOrgAdjustmentResultDetail(taskId)
			.then((resp) => {
				if (cancelled) {
					return;
				}
				if (resp.code !== 200 || !resp.data) {
					setErrorMsg(resp.msg || "未查询到组织调整报告");
					return;
				}
				setData(resp.data);
			})
			.catch(() => {
				if (!cancelled) {
					setErrorMsg("报告数据加载失败");
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [taskId, taskIdRaw]);

	return (
		<div className="min-h-screen bg-[#F5F7FA] py-6">
			<div className="mx-auto w-full max-w-[1280px] px-4">
				<div className="mb-4 flex items-center gap-2">
					<span className="inline-block h-4 w-1 rounded-sm bg-[#1677FF]" />
					<span className="text-base font-medium text-[#303133]">组织调整报告</span>
				</div>
				<div className="rounded bg-white px-5 py-5 shadow-sm">
					{loading ? (
						<div className="flex h-[480px] items-center justify-center">
							<Spin tip="加载中..." />
						</div>
					) : errorMsg ? (
						<Result status="warning" title={errorMsg} />
					) : data ? (
						<AdjustmentReportContent
							readonly
							taskDetail={{
								taskName: data.taskName,
								remark: data.remark,
								orgList: data.orgEntityList ?? [],
							}}
							txtVer={data.txtVer}
							changeContent={data.changeContent}
							impactMeasurementPayload={{
								selectedOrgList: [],
								measurementResults: data.scopeEntityList ?? [],
							}}
						/>
					) : (
						<Result status="info" title="暂无数据" />
					)}
				</div>
			</div>
		</div>
	);
}
