import { fetchImportTableData } from "#src/api/file/import-task";
import { useFileStore } from "#src/store/file";
import { message } from "antd";
import { useCallback } from "react";
import { mapImportTaskItem } from "../utils";

export function useImportTaskTable() {
	const setTableDataGlobal = useFileStore((state) => state.setTableData);

	const fetchData = useCallback(
		async (params: any) => {
			const { pageNum = 1, pageSize = 10, taskName, moduleName, status } = params || {};

			const moduleNameValue = Array.isArray(moduleName)
				? moduleName[moduleName.length - 1]
				: moduleName;

			try {
				const resp = await fetchImportTableData({
					pageNum,
					pageSize,
					searchCount: true,
					taskName,
					moduleName: moduleNameValue,
					status,
				});

				const list = resp?.data?.list ?? [];
				const total = resp?.data?.total ?? 0;
				const data = list.map(mapImportTaskItem);
				setTableDataGlobal(data);

				return { data, total };
			} catch (error) {
				console.error("fetch import tasks failed", error);
				message.error("加载导入任务失败");
				return { data: [], total: 0 };
			}
		},
		[setTableDataGlobal],
	);

	return { fetchData };
}
