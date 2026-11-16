/**
 * 用户列表管理 Hook
 */

import type { UserInfo } from "#src/api/personnel-archive/common";

import { pageUserList } from "#src/api/personnel-archive/common";
import { useRequest } from "ahooks";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * 用户列表管理 Hook
 *
 * @param skipInitialize - 跳过自动初始化（由外部控制何时初始化）
 * @param isActive - 是否为激活状态（用于首次激活时自动请求）
 * @returns 用户列表管理相关的状态和方法
 */
export function useUserList(skipInitialize = false, isActive = false) {
	// 用户列表状态
	const [userSearchValue, setUserSearchValue] = useState("");
	const [userListPageNum, setUserListPageNum] = useState(1);
	const [userListTotal, setUserListTotal] = useState(0);
	const [allUserList, setAllUserList] = useState<UserInfo[]>([]);
	const [selectedDeptCode, setSelectedDeptCode] = useState("");

	const { loading: userListLoading, run: fetchUserList } = useRequest(
		async (deptCode: string, name: string, pageNum: number, _isLoadMore: boolean) => {
			const result = await pageUserList({
				deptCode: (deptCode || "").trim(),
				name: name || undefined,
				pageNum,
				pageSize: 20,
			});
			return result;
		},
		{
			manual: true,
			onSuccess: (
				result,
				[_deptCode, _name, pageNum, isLoadMore]: [string, string, number, boolean],
			) => {
				const newList = Array.isArray(result.list) ? result.list : [];
				const total = typeof result.total === "number" ? result.total : 0;

				if (isLoadMore) {
					setAllUserList((prev) => [...prev, ...newList]);
				} else {
					setAllUserList(newList);
				}

				setUserListTotal(total);
				setUserListPageNum(pageNum);
			},
			onError: (error) => {
				console.error("获取人员列表失败:", error);
				setAllUserList([]);
				setUserListTotal(0);
			},
		},
	);

	const debouncedUserSearch = useMemo(
		() =>
			debounce((deptCode: string, keyword: string) => {
				setUserListPageNum(1);
				setAllUserList([]);
				fetchUserList(deptCode, keyword, 1, false);
			}, 300),
		[fetchUserList],
	);

	useEffect(() => () => debouncedUserSearch.cancel(), [debouncedUserSearch]);

	const handleUserSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setUserSearchValue(e.target.value);
	}, []);

	// 当选中部门或搜索关键词变化时，触发防抖搜索
	const triggerUserSearch = useCallback(() => {
		if (selectedDeptCode || userSearchValue) {
			debouncedUserSearch(selectedDeptCode, userSearchValue);
		}
	}, [selectedDeptCode, userSearchValue, debouncedUserSearch]);

	useEffect(() => {
		triggerUserSearch();
	}, [triggerUserSearch]);

	const loadMoreUserData = useCallback(() => {
		if (userListLoading || allUserList.length >= userListTotal) {
			return;
		}
		const nextPage = userListPageNum + 1;
		fetchUserList(selectedDeptCode, userSearchValue, nextPage, true);
	}, [
		userListLoading,
		selectedDeptCode,
		allUserList.length,
		userListTotal,
		userListPageNum,
		userSearchValue,
		fetchUserList,
	]);

	// 首次激活时自动请求第一页数据
	useEffect(() => {
		if (isActive && allUserList.length === 0 && !userListLoading && !skipInitialize) {
			// 自动请求第一页
			fetchUserList(selectedDeptCode, userSearchValue, 1, false);
		}
	}, [
		isActive,
		allUserList.length,
		userListLoading,
		skipInitialize,
		selectedDeptCode,
		userSearchValue,
		fetchUserList,
	]);

	return {
		// 状态
		userSearchValue,
		userListPageNum,
		userListTotal,
		allUserList,
		userListLoading,
		selectedDeptCode,

		// 方法
		setSelectedDeptCode,
		handleUserSearchChange,
		loadMoreUserData,
		fetchUserList,
	};
}
