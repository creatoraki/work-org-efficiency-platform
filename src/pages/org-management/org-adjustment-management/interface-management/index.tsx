import type { InterfaceTask } from "./types";
import { SearchableTable } from "#src/components/searchable-table";
import { useMockTable } from "#src/hooks";
import React, { useMemo } from "react";
import { getColumns } from "./config/columns";
import { searchSchema } from "./config/searchSchema";

/**
 * 接口管理页面（mock）
 */
export default function InterfaceManagement() {
	const columns = useMemo(() => getColumns(), []);
	const { list, fetchData } = useMockTable<InterfaceTask>(columns, {
		pageSize: 20,
		mockCount: 100,
	});

	return (
		<div className="rounded p-6 pb-0">
			<SearchableTable<InterfaceTask>
				rowKey="id"
				columns={columns}
				searchSchema={searchSchema}
				fetchData={(params: any) => fetchData(params)}
				pageSize={10}
				dataSource={list}
			/>
		</div>
	);
}
