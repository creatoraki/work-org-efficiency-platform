import type { PersonnelArchiveDetail } from "#src/api/org-brain/personnel-archive";
import type { PropsWithChildren } from "react";

import {
	fetchPersonnelArchiveCompanyHistory,
	fetchPersonnelArchiveDetail,
	fetchPersonnelArchiveTags,
} from "#src/api/org-brain/personnel-archive";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTalentArchiveQueries } from "./use-talent-archive-queries";

vi.mock("#src/api/org-brain/personnel-archive", () => ({
	fetchPersonnelArchiveCompanyHistory: vi.fn(),
	fetchPersonnelArchiveDetail: vi.fn(),
	fetchPersonnelArchiveTags: vi.fn(),
}));

const mockedFetchDetail = vi.mocked(fetchPersonnelArchiveDetail);
const mockedFetchTags = vi.mocked(fetchPersonnelArchiveTags);
const mockedFetchCompanyHistory = vi.mocked(fetchPersonnelArchiveCompanyHistory);

/**
 * 创建隔离的 React Query 测试容器。
 *
 * @param props          - 容器属性。
 * @param props.children - 待测试 hook 渲染内容。
 * @returns React Query Provider。
 *
 * @author 王善能
 * @since 2026-07-15
 */
function QueryWrapper({ children }: PropsWithChildren) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: { gcTime: 0, retry: false },
				},
			}),
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * 创建人员档案详情测试数据。
 *
 * @param userId - 用户ID。
 * @returns 满足接口约束的人员档案详情。
 *
 * @author 王善能
 * @since 2026-07-15
 */
function createDetail(userId: string): PersonnelArchiveDetail {
	return {
		basicInfo: {
			userId,
			name: "测试人员",
			userCode: "TEST001",
			gender: "男",
			age: 30,
			orgId: "org-1",
			orgName: "测试组织",
			tenure: 1,
			joinDate: "2025-01-01",
		},
		assessments: [],
		educations: [],
		trainings: [],
	};
}

describe("useTalentArchiveQueries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("启用查询时应在首轮同时请求三个接口", () => {
		const pendingRequest = new Promise<never>(() => undefined);
		mockedFetchDetail.mockReturnValue(pendingRequest);
		mockedFetchTags.mockReturnValue(pendingRequest);
		mockedFetchCompanyHistory.mockReturnValue(pendingRequest);

		const { unmount } = renderHook(() => useTalentArchiveQueries("user-1", true), {
			wrapper: QueryWrapper,
		});

		expect(mockedFetchDetail).toHaveBeenCalledTimes(1);
		expect(mockedFetchTags).toHaveBeenCalledTimes(1);
		expect(mockedFetchCompanyHistory).toHaveBeenCalledTimes(1);
		unmount();
	});

	it("无缓存数据时应暴露错误状态并支持局部重试", async () => {
		mockedFetchDetail.mockRejectedValueOnce(new Error("detail failed"));
		mockedFetchTags.mockRejectedValueOnce(new Error("tags failed"));
		mockedFetchCompanyHistory.mockRejectedValueOnce(new Error("company history failed"));

		const { result, unmount } = renderHook(() => useTalentArchiveQueries("user-2", true), {
			wrapper: QueryWrapper,
		});

		await waitFor(() => {
			expect(result.current.detailError).toBe(true);
			expect(result.current.tagsLoadFailed).toBe(true);
			expect(result.current.companyHistoryLoadFailed).toBe(true);
		});

		mockedFetchDetail.mockResolvedValueOnce(createDetail("user-2"));

		await act(async () => {
			result.current.retryDetail();
		});

		await waitFor(() => {
			expect(result.current.detailError).toBe(false);
			expect(result.current.basicInfo?.userId).toBe("user-2");
		});
		unmount();
	});
});
