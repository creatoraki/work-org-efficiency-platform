import type { PersonnelArchiveItem } from "#src/api/org-brain/personnel-archive";
import type { PagedData } from "#src/utils/axios-request";
import type { PropsWithChildren } from "react";
import type {
	PersonnelArchiveFilters,
	PersonnelArchivePaginationState,
} from "./use-personnel-archive-list-query";
import { fetchPersonnelArchiveList } from "#src/api/org-brain/personnel-archive";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePersonnelArchiveListQuery } from "./use-personnel-archive-list-query";

vi.mock("#src/api/org-brain/personnel-archive", () => ({
	fetchPersonnelArchiveList: vi.fn(),
}));

const mockedFetchPersonnelArchiveList = vi.mocked(fetchPersonnelArchiveList);

/**
 * 创建可由测试控制完成时机的 Promise。
 *
 * @returns Promise 及其 resolve、reject 控制函数。
 *
 * @author 王善能
 * @since 2026-07-17
 */
function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, reject, resolve };
}

/**
 * 创建隔离的人员档案列表 QueryClient。
 *
 * @param props          - 容器属性。
 * @param props.children - 待测试 Hook。
 * @returns React Query 测试容器。
 *
 * @author 王善能
 * @since 2026-07-17
 */
function QueryWrapper({ children }: PropsWithChildren) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: { queries: { retry: false } },
			}),
	);
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * 创建人员档案分页测试数据。
 *
 * @param name - 员工姓名。
 * @returns 人员档案分页数据。
 *
 * @author 王善能
 * @since 2026-07-17
 */
function createPage(name: string): PagedData<PersonnelArchiveItem> {
	return {
		list: [
			{
				userId: name,
				name,
				userCode: `CODE-${name}`,
				orgId: "org-1",
				orgName: "测试组织",
				jobId: "job-1",
				jobName: "测试岗位",
				postId: "post-1",
				postName: "测试职位",
				joinDate: "2026-07-17",
			},
		],
		total: 20,
		pageNum: 1,
		pageSize: 10,
		pages: 2,
		emptyFlag: false,
	};
}

describe("usePersonnelArchiveListQuery", () => {
	beforeEach(() => {
		mockedFetchPersonnelArchiveList.mockReset();
	});

	it("下一页失败时应保留上一成功页并返回恢复分页", async () => {
		const nextPageRequest = createDeferred<PagedData<PersonnelArchiveItem>>();
		mockedFetchPersonnelArchiveList
			.mockResolvedValueOnce(createPage("第一页员工"))
			.mockReturnValueOnce(nextPageRequest.promise);
		const initialProps: {
			pagination: PersonnelArchivePaginationState;
			filters: PersonnelArchiveFilters;
		} = {
			pagination: { current: 1, pageSize: 10 },
			filters: {},
		};
		const { result, rerender } = renderHook(
			(props: typeof initialProps) =>
				usePersonnelArchiveListQuery(props.pagination, props.filters),
			{ initialProps, wrapper: QueryWrapper },
		);

		await waitFor(() => {
			expect(result.current.page?.list[0]?.name).toBe("第一页员工");
		});

		rerender({ ...initialProps, pagination: { current: 2, pageSize: 10 } });

		await waitFor(() => {
			expect(result.current.viewState).toBe("page-transition");
		});
		expect(result.current.page?.list[0]?.name).toBe("第一页员工");

		await act(async () => {
			nextPageRequest.reject(new Error("next page failed"));
		});
		await waitFor(() => {
			expect(result.current.viewState).toBe("recoverable-error");
		});
		expect(result.current.page?.list[0]?.name).toBe("第一页员工");
		expect(result.current.displayPagination).toEqual({ current: 1, pageSize: 10 });
	});

	it("筛选条件变化后失败时不应复用旧筛选结果", async () => {
		const filterRequest = createDeferred<PagedData<PersonnelArchiveItem>>();
		mockedFetchPersonnelArchiveList
			.mockResolvedValueOnce(createPage("旧筛选员工"))
			.mockReturnValueOnce(filterRequest.promise);
		const initialProps: {
			pagination: PersonnelArchivePaginationState;
			filters: PersonnelArchiveFilters;
		} = {
			pagination: { current: 1, pageSize: 10 },
			filters: {},
		};
		const { result, rerender } = renderHook(
			(props: typeof initialProps) =>
				usePersonnelArchiveListQuery(props.pagination, props.filters),
			{ initialProps, wrapper: QueryWrapper },
		);

		await waitFor(() => {
			expect(result.current.page?.list[0]?.name).toBe("旧筛选员工");
		});

		rerender({ ...initialProps, filters: { employeeName: "新筛选" } });

		await waitFor(() => {
			expect(result.current.viewState).toBe("initial-loading");
		});
		expect(result.current.page).toBeUndefined();

		await act(async () => {
			filterRequest.reject(new Error("filter failed"));
		});
		await waitFor(() => {
			expect(result.current.viewState).toBe("load-failed");
		});
		expect(result.current.page).toBeUndefined();
	});

	it("当前页后台刷新失败时应保留当前页且不触发分页回滚", async () => {
		mockedFetchPersonnelArchiveList
			.mockResolvedValueOnce(createPage("当前页员工"))
			.mockRejectedValueOnce(new Error("refresh failed"));
		const initialProps: {
			pagination: PersonnelArchivePaginationState;
			filters: PersonnelArchiveFilters;
		} = {
			pagination: { current: 1, pageSize: 10 },
			filters: {},
		};
		const { result } = renderHook(
			(props: typeof initialProps) =>
				usePersonnelArchiveListQuery(props.pagination, props.filters),
			{ initialProps, wrapper: QueryWrapper },
		);

		await waitFor(() => {
			expect(result.current.page?.list[0]?.name).toBe("当前页员工");
		});

		await act(async () => {
			await result.current.refetch();
		});

		await waitFor(() => {
			expect(result.current.viewState).toBe("refresh-error");
		});
		expect(result.current.page?.list[0]?.name).toBe("当前页员工");
		expect(result.current.displayPagination).toEqual({ current: 1, pageSize: 10 });
	});
});
