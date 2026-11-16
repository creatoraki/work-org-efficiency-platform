import type { MatchingModelListParams } from "#src/pages/tag-management/tag-matching/model/types";

import type { ReactNode } from "react";
import { fetchMatchingModelList } from "#src/api/tag-management/tag-matching/model";
import { useMatchingModelRemoteOptions } from "#src/pages/org-brain/hooks/useMatchingModelRemoteOptions";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("#src/api/tag-management/tag-matching/model", () => ({
	fetchMatchingModelList: vi.fn(),
}));

const mockedFetchMatchingModelList = vi.mocked(fetchMatchingModelList);

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});
}

function createWrapper(queryClient: QueryClient) {
	return function QueryWrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

function buildParams(): MatchingModelListParams {
	return {
		pageNum: 1,
		pageSize: 500,
		status: "1",
		orgMatchId: "1001",
		jobIds: ["2001"],
		postIds: ["3001"],
		postLevelIds: ["4001"],
	};
}

describe("useMatchingModelRemoteOptions", () => {
	it("默认不在参数齐全时自动请求匹配模型列表", async () => {
		const queryClient = createQueryClient();
		const wrapper = createWrapper(queryClient);

		renderHook(() => useMatchingModelRemoteOptions({ params: buildParams() }), {
			wrapper,
		});

		await waitFor(() => {
			expect(mockedFetchMatchingModelList).not.toHaveBeenCalled();
		});
	});

	it("手动 refreshOptions 时每次都会重新请求最新匹配模型列表", async () => {
		mockedFetchMatchingModelList.mockResolvedValue({
			list: [
				{
					id: "55",
					name: "浙大总部2",
					orgId: "1001",
					orgLevel: "SYS",
					status: "1",
				},
			],
			total: 1,
			pages: 1,
			pageNum: 1,
			pageSize: 500,
			emptyFlag: false,
		});

		const params = buildParams();
		const queryClient = createQueryClient();
		const wrapper = createWrapper(queryClient);
		const { result } = renderHook(
			() => useMatchingModelRemoteOptions({ params, staleTime: 60_000, gcTime: 60_000 }),
			{ wrapper },
		);

		await act(async () => {
			await result.current.refreshOptions();
		});

		await waitFor(() => {
			expect(mockedFetchMatchingModelList).toHaveBeenCalledTimes(1);
			expect(result.current.remoteState.queried).toBe(true);
		});

		await act(async () => {
			await result.current.refreshOptions();
		});

		await waitFor(() => {
			expect(mockedFetchMatchingModelList).toHaveBeenCalledTimes(2);
		});

		const cachedHook = renderHook(
			() => useMatchingModelRemoteOptions({ params, staleTime: 60_000, gcTime: 60_000 }),
			{ wrapper },
		);

		expect(
			cachedHook.result.current.getDisplayOptions({
				id: "55",
				name: "浙大总部2",
			}),
		).toEqual([
			expect.objectContaining({
				id: "55",
				name: "浙大总部2",
			}),
		]);
	});
});
