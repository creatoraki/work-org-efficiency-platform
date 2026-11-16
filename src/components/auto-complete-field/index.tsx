import type { StrictOptionType } from "#src/api/types/antd";
import { cn } from "#src/utils";
import { useRequest } from "ahooks";
import { AutoComplete } from "antd";
import React, { useCallback, useEffect, useState } from "react";

interface AutoCompleteFieldProps {
	/** 占位符文本 */
	placeholder?: string;
	/** 样式类名 */
	className?: string;
	/** 是否允许清除 */
	allowClear?: boolean;
	/** 搜索回调函数 */
	onSearch?: (value: string) => void;
	/** 获取选项的异步函数 */
	fetchOptions: (
		searchText: string,
		pageNum: number,
		pageSize: number,
	) => Promise<{
		options: StrictOptionType[];
		total: number;
		pageNum: number;
	}>;
	/** 每页大小，默认 10 */
	pageSize?: number;
	/** 防抖延迟时间（毫秒） */
	debounceWait?: number;
	/** 值 */
	value?: string;
	/** 值变化回调 */
	onChange?: (value: string) => void;
	/** 焦点事件回调 */
	onFocus?: () => void;
	/** 清除事件回调 */
	onClear?: () => void;
	/** 是否禁用 */
	disabled?: boolean;
	/** 尺寸 */
	size?: "small" | "middle" | "large";
	/** 输入框变体样式 */
	variant?: "outlined" | "borderless" | "filled";
	/** 刷新触发信号，父组件改变此值可触发数据刷新 */
	refreshKey?: number | string;
}

interface OptionState {
	currentPageNum: number;
	options: StrictOptionType[];
	total: number;
	hasMore: boolean;
}

export const AutoCompleteField: React.FC<AutoCompleteFieldProps> = ({
	placeholder = "请输入",
	className,
	allowClear = true,
	onSearch,
	fetchOptions,
	pageSize = 10,
	debounceWait = 300,
	value,
	onChange,
	onFocus,
	onClear,
	disabled = false,
	size = "middle",
	variant,
	refreshKey,
}) => {
	// AutoComplete 状态
	const [optionState, setOptionState] = useState<OptionState>({
		currentPageNum: 1,
		options: [],
		total: 0,
		hasMore: true,
	});

	// 获取选项
	const { loading: optionsLoading, run: runFetchOptions } = useRequest(
		async (searchText = "", pageNum = 1) => {
			const result = await fetchOptions(searchText, pageNum, pageSize);
			return result;
		},
		{
			refreshDeps: [pageSize],
			debounceWait,
			onSuccess: (result) => {
				const { options, total, pageNum } = result;
				setOptionState((prev) => {
					const isFirstPage = pageNum === 1;
					const combinedOptions = isFirstPage ? options : [...prev.options, ...options];
					const hasMore = combinedOptions.length < total;

					return {
						...prev,
						options: combinedOptions,
						total,
						hasMore,
						currentPageNum: pageNum,
					};
				});
			},
			onError: (error) => {
				// 获取选项失败时的错误处理
				throw error;
			},
		},
	);

	// 处理滚动分页
	const handleScroll = useCallback(
		async (e: React.UIEvent<HTMLDivElement>) => {
			const { target } = e;
			if (!(target instanceof HTMLElement)) return;

			const { hasMore, currentPageNum } = optionState;
			const searchValue = value || "";

			if (
				target.scrollTop + target.offsetHeight >= target.scrollHeight - 10 &&
				!optionsLoading &&
				hasMore
			) {
				const nextPageNum = currentPageNum + 1;
				await runFetchOptions(searchValue, nextPageNum);
			}
		},
		[optionState, optionsLoading, runFetchOptions, value],
	);

	// 处理搜索
	const handleSearch = useCallback(
		(searchValue: string) => {
			// 重置分页状态
			setOptionState((prev) => ({
				...prev,
				currentPageNum: 1,
				options: [],
				hasMore: true,
			}));
			runFetchOptions(searchValue, 1);
			onSearch?.(searchValue);
		},
		[runFetchOptions, onSearch],
	);

	// 处理焦点事件
	const handleFocus = useCallback(() => {
		// 如果没有选项，加载初始数据
		if (optionState.options.length === 0) {
			setOptionState((prev) => ({
				...prev,
				currentPageNum: 1,
				options: [],
				hasMore: true,
			}));
			runFetchOptions("", 1);
		}
		onFocus?.();
	}, [optionState.options.length, runFetchOptions, onFocus]);

	// 处理清除事件
	const handleClear = useCallback(() => {
		// 重置分页状态
		setOptionState((prev) => ({
			...prev,
			currentPageNum: 1,
			options: [],
			hasMore: true,
		}));
		onClear?.();
	}, [onClear]);

	// 监听刷新触发信号，重置状态并重新请求
	useEffect(() => {
		if (refreshKey !== undefined) {
			setOptionState({
				currentPageNum: 1,
				options: [],
				total: 0,
				hasMore: true,
			});
			runFetchOptions(value || "", 1);
		}
	}, [refreshKey, value, runFetchOptions]);

	// 组件挂载时加载初始选项
	useEffect(() => {
		runFetchOptions("", 1);
	}, []);

	return (
		<AutoComplete
			options={optionState.options}
			placeholder={placeholder}
			allowClear={allowClear}
			className={cn("w-full", className)}
			value={value}
			onChange={onChange}
			onSearch={handleSearch}
			onFocus={handleFocus}
			onClear={handleClear}
			onPopupScroll={handleScroll}
			filterOption={false}
			disabled={disabled}
			size={size}
			variant={variant}
			notFoundContent={
				optionsLoading
					? "搜索中..."
					: optionState.options.length === 0
						? "暂无数据"
						: !optionState.hasMore
							? "已加载全部数据"
							: "暂无数据"
			}
		/>
	);
};

export default AutoCompleteField;
