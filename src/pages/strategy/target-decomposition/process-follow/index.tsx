import type { ProcessListItem } from "#src/api/strategy/target-confirm";
import SearchableTable from "#src/components/searchable-table";
import { Button, theme } from "antd";
import React, { useEffect } from "react";
import { getColumns } from "./config/columns";
import { searchSchema } from "./config/searchSchema";
import { useProcessFollow } from "./hooks";

const OA_BASE_URL = import.meta.env.VITE_OA_BASE_URL;

export default function ProcessFollowPage() {
	const { token } = theme.useToken();

	const { getCount, fetchData, reloadTick } = useProcessFollow();

	useEffect(() => {
		getCount();
	}, [getCount]);

	const handleOpenApprovalProcess = (fdId?: string) => {
		if (fdId) {
			const url = `${OA_BASE_URL}/km/review/km_review_main/kmReviewMain.do?method=view&fdId=${fdId}&s_css=default`;
			window.open(url, "_blank");
		}
	};

	const columns = React.useMemo(() => getColumns(handleOpenApprovalProcess), []);

	return (
		<div
			className="rounded px-6 pt-3"
			style={{ background: token.colorBgContainer, color: token.colorText }}
		>
			<SearchableTable<ProcessListItem>
				className="mt-3"
				columns={columns}
				searchSchema={searchSchema}
				fetchData={(params: any) => fetchData(params)}
				pageSize={10}
				reloadSignal={reloadTick}
				toolbarActions={<Button type="primary">导出</Button>}
			/>
		</div>
	);
}
