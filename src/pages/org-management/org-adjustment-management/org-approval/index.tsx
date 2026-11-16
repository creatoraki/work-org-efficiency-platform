import type { OrgApprovalRecord } from "./types";
import { fetchOrgApprovalList } from "#src/api/org-management/org-adjustment-management/org-approval";
import { SearchableTable } from "#src/components/searchable-table";
import { useDictOptions } from "#src/hooks/use-dict-options";
import { Tabs, theme } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getColumns } from "./config/columns";
import { buildSearchSchema } from "./config/searchSchema";
import {
	buildOrgApprovalListParams,
	buildOrgApprovalStatistics,
	buildUserSelectOptions,
	mapOrgApprovalRecord,
} from "./utils";

const OA_BASE_URL = import.meta.env.VITE_OA_BASE_URL;

/**
 * 组织审核页面
 */
export default function OrgApproval() {
	const { token } = theme.useToken();
	const [activeTab, setActiveTab] = useState("all");
	const [tableData, setTableData] = useState<OrgApprovalRecord[]>([]);
	const [searchOptionData, setSearchOptionData] = useState<OrgApprovalRecord[]>([]);
	const [reloadSignal, setReloadSignal] = useState(-1);
	const { options: statusOptions } = useDictOptions("approval_status");

	const handleOpenApprovalProcess = useCallback((fdId?: string) => {
		if (fdId) {
			const url = `${OA_BASE_URL}/km/review/km_review_main/kmReviewMain.do?method=view&fdId=${fdId}&s_css=default`;
			window.open(url, "_blank");
		}
	}, []);

	const columns = useMemo(
		() => getColumns(handleOpenApprovalProcess),
		[handleOpenApprovalProcess],
	);

	const fetchData = useCallback(
		async (params: Record<string, any>) => {
			const nextParams = {
				...params,
				status: activeTab === "all" ? params.status : activeTab,
			};
			const resp = await fetchOrgApprovalList(buildOrgApprovalListParams(nextParams));
			const records = (resp.data?.list || []).map(mapOrgApprovalRecord);
			return {
				data: records,
				total: resp.data?.total || 0,
			};
		},
		[activeTab],
	);

	const statistics = useMemo(() => buildOrgApprovalStatistics(tableData), [tableData]);
	const searchSchema = useMemo(
		() =>
			buildSearchSchema({
				currentApproverOptions: buildUserSelectOptions(searchOptionData, "currentApprover"),
				initiatorOptions: buildUserSelectOptions(searchOptionData, "initiatorUserName"),
				statusOptions,
			}),
		[searchOptionData, statusOptions],
	);
	const tabItems = useMemo(
		() => [
			{ key: "all", label: `全部 (${statistics.totalCount})` },
			{ key: "0", label: `流程中(${statistics.inProgressCount})` },
			{ key: "2", label: `已结束(${statistics.finishedCount})` },
			{ key: "1", label: `已中止(${statistics.abortedCount})` },
		],
		[statistics],
	);

	useEffect(() => {
		setReloadSignal((signal) => signal + 1);
	}, [activeTab]);

	useEffect(() => {
		let cancelled = false;

		const loadSearchOptions = async () => {
			const resp = await fetchOrgApprovalList(
				buildOrgApprovalListParams({
					pageNum: 1,
					pageSize: 500,
					status: activeTab === "all" ? undefined : activeTab,
				}),
			);

			if (cancelled) {
				return;
			}

			setSearchOptionData((resp.data?.list || []).map(mapOrgApprovalRecord));
		};

		void loadSearchOptions();

		return () => {
			cancelled = true;
		};
	}, [activeTab]);

	return (
		<div
			className="rounded px-6"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
			<SearchableTable<OrgApprovalRecord>
				className="mt-3"
				rowKey="id"
				columns={columns}
				searchSchema={searchSchema}
				fetchData={fetchData}
				onDataLoaded={(records) => {
					setTableData(records);
				}}
				pageSize={10}
				reloadSignal={reloadSignal}
				scroll={{ x: 1320 }}
			/>
		</div>
	);
}
