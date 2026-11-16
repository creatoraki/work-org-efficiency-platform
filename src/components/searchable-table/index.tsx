import type { ColumnsType, TableProps } from "antd/es/table";
import { commonExport } from "#src/api/file/export-task";
import ImportIcon from "#src/assets/small-icons/target-filling/import-icon.svg?react";
import { TABLE_CONFIG } from "#src/pages/tag-management/config.js";
import { cn } from "#src/utils";
import { Button, Dropdown } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createUseStyles } from "react-jss";
import BasicButton from "../basic-button";
import { BasicTable } from "../basic-table";

/**
 * SearchableTable 组件
 * - 基于 Antd Table，透传所有 TableProps
 * - searchSchema: 用于渲染上方搜索表单的字段定义
 * - fetchData: 外部传入的查询函数 (params) => Promise<{ data: any[]; total: number }>
 * - renderRowActions: 渲染每行操作（例如 弹框/弹层）的函数
 *
 * searchSchema 示例：
 * [
 *  { name: 'name', label: '姓名', type: 'input' },
 *  { name: 'status', label: '状态', type: 'select', options: [{label: '是', value: 1}] },
 *  { name: 'createdAt', label: '时间', type: 'dateRange' }
 * ]
 */

export type SearchField =
	| {
			name: string;
			label?: string;
			type: "input" | "select" | "date" | "dateRange" | "number" | "cascader";
			placeholder?: string;
			options?: { label: string; value: any }[];
			fieldProps?: any;
			formItemProps?: any;
			formProps?: any;
	  }
	| any;

export interface FetchResult<T = any> {
	data: T[];
	total: number;
}

export interface ExportConfig {
	/** Excel ID */
	excelId: string | number;
	/** 额外的查询参数（与列表查询参数结构相同） */
	extraParams?: Record<string, any>;
}

export interface SearchableTableProps<T = any> extends Omit<TableProps<T>, "columns"> {
	columns: ColumnsType<T>;
	searchSchema?: SearchField[];
	fetchData?: (params: any) => Promise<FetchResult<T>>;
	onDataLoaded?: (data: T[], total: number) => void;
	initialSearchValues?: Record<string, any>;
	onResetSearch?: () => void;
	pageSize?: number;
	/** 可选：外部触发刷新信号（数字递增时触发重新加载），仅执行数据请求，不会重新挂载组件 */
	reloadSignal?: number;
	bottomOffset?: number;
	renderRowActions?: (record: T) => React.ReactNode;
	/** 行操作最多显示数量（默认：3，超出第 3 位显示“···”） */
	rowActionMaxVisible?: number;
	/** 可选：外部传入的左侧工具按钮 */
	toolbarActions?: React.ReactNode;
	columnEmptyText?: string;
	adaptive?: any;
	/** 可选：导出配置，传入后显示导出按钮 */
	exportConfig?: ExportConfig;
	/** 可选：自定义工具栏渲染 */
	toolBarRender?: () => React.ReactNode[];
}

const DEFAULT_SEARCH_SCHEMA: any[] = [];

const useStyles = createUseStyles({
	wrapper: {
		"& .ant-table-thead > tr > th": {
			paddingTop: "8px !important",
			paddingBottom: "8px !important",
		},
		"& .searchable-table-row-actions": {
			display: "inline-flex",
			alignItems: "center",
			gap: 4,
			flexWrap: "nowrap",
		},
		"& .searchable-table-row-action": {
			display: "inline-flex",
			alignItems: "center",
		},
		"& .searchable-table-row-action-divider": {
			display: "inline-block",
			width: 1,
			height: 14,
			background: "rgba(235,238,245,1)",
		},
		"& .searchable-table-row-actions-more": {
			display: "inline-flex",
			alignItems: "center",
			padding: 0,
			height: "auto",
			lineHeight: "normal",
			color: "var(--ant-color-link)",
		},
		"& .searchable-table-row-actions-more:hover": {
			color: "var(--ant-color-link-hover)",
		},
		"& .searchable-table-row-actions-more:active": {
			color: "var(--ant-color-link-active)",
		},
		"& .searchable-table-row-actions-menu": {
			minWidth: 120,
		},
		"& .searchable-table-row-actions-menu-item": {
			padding: "8px 16px",
			textAlign: "left",
		},
		"& .searchable-table-row-actions-menu-item:hover": {
			color: "var(--ant-color-primary)",
		},
	},
});

export function SearchableTable<T = any>(props: SearchableTableProps<T>) {
	const classes = useStyles();
	const {
		columns,
		searchSchema = DEFAULT_SEARCH_SCHEMA,
		fetchData,
		onDataLoaded,
		initialSearchValues,
		onResetSearch,
		pageSize: initialPageSize = 10,
		adaptive = true,
		renderRowActions,
		rowActionMaxVisible = 3,
		reloadSignal,
		dataSource,
		pagination: propPagination,
		loading: propLoading,
		exportConfig,
		toolBarRender,
		...rest
	} = props;
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const normalizedInitialSearchValues = useMemo(
		() =>
			initialSearchValues && Object.keys(initialSearchValues).length > 0
				? initialSearchValues
				: undefined,
		[initialSearchValues],
	);
	const tableInstanceKey = useMemo(
		() => JSON.stringify(normalizedInitialSearchValues ?? {}),
		[normalizedInitialSearchValues],
	);
	const isDataSourceControlled = dataSource !== undefined;

	// 计算表格可用高度（viewport - top - bottomOffset），并在窗口大小变化时更新
	const [pageSize, setPageSize] = useState(initialPageSize);
	// 使用 formRef 与 ProTable 的内部表单实例同步，避免重复渲染搜索表单
	const formRef = React.useRef<any>(null);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<T[]>([]);
	const [total, setTotal] = useState(0);
	const [current, setCurrent] = useState(1);
	const [activeParams, setActiveParams] = useState<any>(normalizedInitialSearchValues ?? {});
	const [columnsStateMap, setColumnsStateMap] = useState<Record<string, any>>({});

	const renderActionGroup = useCallback(
		(record: T) => {
			if (!renderRowActions) {
				return null;
			}
			let actionNodes = React.Children.toArray(renderRowActions(record)).filter(Boolean);
			if (actionNodes.length === 1 && React.isValidElement(actionNodes[0])) {
				const onlyElement = actionNodes[0] as React.ReactElement<any>;
				const elementType: any = onlyElement.type;
				const isSpace =
					elementType?.displayName === "Space" || elementType?.name === "Space";
				if (isSpace) {
					actionNodes = React.Children.toArray(onlyElement.props?.children).filter(
						Boolean,
					);
				}
			}
			if (actionNodes.length === 0) {
				return null;
			}
			const renderWithDividers = (nodes: React.ReactNode[]) => {
				return nodes.map((node, index) => (
					<React.Fragment key={`action-${index}`}>
						{index > 0 && <span className="searchable-table-row-action-divider" />}
						<span className="searchable-table-row-action">{node}</span>
					</React.Fragment>
				));
			};

			if (actionNodes.length <= rowActionMaxVisible) {
				return (
					<span className="searchable-table-row-actions">
						{renderWithDividers(actionNodes)}
					</span>
				);
			}

			const visibleCount = Math.max(1, rowActionMaxVisible - 1);
			const visibleNodes = actionNodes.slice(0, visibleCount);
			const overflowNodes = actionNodes.slice(visibleCount);

			const handlers: Record<string, (() => void) | undefined> = {};
			const menuItems = overflowNodes.map((node, index) => {
				const key = `more-${index}`;
				let label: React.ReactNode = node;
				let onClickFn: (() => void) | undefined;

				if (React.isValidElement(node)) {
					const props: any = node.props || {};
					label = props.children ?? node;
					onClickFn = props.onClick;
				}

				handlers[key] = onClickFn;
				return {
					key,
					label,
					className: "searchable-table-row-actions-menu-item",
				};
			});

			const dropdownTrigger = (
				<Dropdown
					menu={{
						items: menuItems,
						className: "searchable-table-row-actions-menu",
						onClick: ({ key }) => {
							const fn = handlers[key as string];
							if (fn) fn();
						},
					}}
					trigger={["hover"]}
					placement="top"
				>
					<Button type="link" size="small" className="searchable-table-row-actions-more">
						···
					</Button>
				</Dropdown>
			);

			return (
				<span className="searchable-table-row-actions">
					{renderWithDividers([...visibleNodes, dropdownTrigger])}
				</span>
			);
		},
		[renderRowActions, rowActionMaxVisible],
	);

	const mergedColumns = useMemo(() => {
		const propCols: any[] = (columns || []) as any[];

		// 建立映射以便搜索列能继承 columns 中的配置（如 valueEnum/options）
		const colMap = new Map<string, any>();
		propCols.forEach((c, i) => {
			const key = c.key ?? c.dataIndex ?? `col_${i}`;
			colMap.set(key, c);
			if (c.dataIndex) colMap.set(c.dataIndex, c);
		});

		// 本地搜索处理函数
		const handleEnterSearch = () => {
			const values =
				formRef.current && formRef.current.getFieldsValue
					? formRef.current.getFieldsValue()
					: {};
			// 简单处理 dateRange
			const params: any = { ...values };
			Object.keys(values).forEach((k) => {
				const v = values[k];
				if (v && v.length === 2 && dayjs.isDayjs(v[0])) {
					params[k] = [v[0].format("YYYY-MM-DD"), v[1].format("YYYY-MM-DD")];
				}
			});

			// 触发搜索
			if (fetchData) {
				setActiveParams(params);
				setCurrent(1);
				setLoading(true);
				fetchData({ ...params, pageNum: 1, pageSize })
					.then((res) => {
						const nextData = res.data || [];
						const nextTotal = res.total || 0;
						if (!isDataSourceControlled) {
							setData(nextData);
						}
						setTotal(nextTotal);
						onDataLoaded?.(nextData, nextTotal);
					})
					.catch(console.error)
					.finally(() => setLoading(false));
			}
		};

		// 1. 构建搜索列 (基于 searchSchema)
		const searchCols = (searchSchema || []).map((s: any) => {
			// 尝试从 columns 中找到对应的列定义
			const matchedCol = colMap.get(s.name);

			// 基础配置：搜索列默认不在表格显示
			const col: any = {
				...(matchedCol || {}),
				dataIndex: s.name,
				title: s.label || s.name,
				hideInTable: true,
				hideInSearch: false,
			};

			// 应用 schema 配置
			const t = {
				formItemProps: {
					colon: false,
					className: "rounded border-[1px] border-[#DCDFE6]",
				},
				fieldProps: {
					variant: "borderless",
				},
			};

			switch (s.type) {
				case "select":
					col.valueType = col.valueType || "select";
					col.fieldProps = t.fieldProps;
					col.formItemProps = t.formItemProps;
					if (s.fieldProps) {
						col.fieldProps = { ...col.fieldProps, ...s.fieldProps };
					}
					if (s.formItemProps) {
						col.formItemProps = { ...col.formItemProps, ...s.formItemProps };
					}
					col.fieldProps = {
						...(col.fieldProps || {}),
						options: s.options || col.fieldProps?.options || [],
					};
					break;
				case "treeSelect":
					col.valueType = col.valueType || "treeSelect";
					col.fieldProps = t.fieldProps;
					col.formItemProps = t.formItemProps;
					if (s.treeData)
						col.fieldProps = { ...(col.fieldProps || {}), treeData: s.treeData };
					else if (s.options)
						col.fieldProps = { ...(col.fieldProps || {}), treeData: s.options };
					if (s.fieldProps)
						col.fieldProps = { ...(col.fieldProps || {}), ...(s.fieldProps || {}) };
					col.fieldProps = {
						treeDefaultExpandAll: true,
						allowClear: true,
						...(col.fieldProps || {}),
					};
					break;
				case "cascader":
					col.valueType = col.valueType || "cascader";
					col.fieldProps = t.fieldProps;
					col.formItemProps = t.formItemProps;
					if (s.options)
						col.fieldProps = { ...(col.fieldProps || {}), options: s.options };
					if (s.fieldProps)
						col.fieldProps = { ...(col.fieldProps || {}), ...(s.fieldProps || {}) };
					col.fieldProps = { allowClear: true, ...(col.fieldProps || {}) };
					break;
				case "dateRange":
					col.valueType = col.valueType || "dateRange";
					break;
				case "date":
					col.valueType = col.valueType || "date";
					break;
				case "number":
					col.valueType = col.valueType || "digit";
					break;
				case "input":
				default:
					col.valueType = col.valueType || "text";
					col.formItemProps = t.formItemProps;
					col.fieldProps = { ...t.fieldProps, onPressEnter: handleEnterSearch };
					break;
			}

			if (s.formProps) {
				col.fieldProps = { ...(col.fieldProps || {}), ...s.formProps };
			}

			if (s.placeholder) {
				col.formItemProps = { ...(col.formItemProps || {}), placeholder: s.placeholder };
				col.fieldProps = { ...(col.fieldProps || {}), placeholder: s.placeholder };
			}

			return col;
		});

		// 2. 构建展示列 (基于 columns)，强制不在搜索栏显示
		// 如果展示列的 key 与搜索列冲突，修改展示列的 key（因为展示列不参与表单生成，改 key 风险较小）
		const searchKeys = new Set(searchCols.map((c: any) => c.key ?? c.dataIndex));
		const tableCols = propCols.map((c, i) => {
			const originalKey = c.key ?? c.dataIndex ?? `col_${i}`;
			let key = originalKey;
			if (searchKeys.has(key)) {
				key = `__table_${originalKey}`;
			}
			return {
				...c,
				key,
				hideInSearch: true,
			};
		});

		const allCols = [...searchCols, ...tableCols];

		if (renderRowActions) {
			allCols.push({
				title: "操作",
				key: "__actions",
				fixed: "right" as any,
				hideInSearch: true,
				width: 220,
				render: (_: any, record: T) => renderActionGroup(record),
			} as any);
		}

		return allCols;
	}, [
		columns,
		searchSchema,
		renderRowActions,
		renderActionGroup,
		fetchData,
		isDataSourceControlled,
		onDataLoaded,
		setActiveParams,
		setCurrent,
		setLoading,
		setData,
		setTotal,
	]);

	const getFormParams = useCallback(() => {
		const values =
			formRef.current && formRef.current.getFieldsValue
				? formRef.current.getFieldsValue()
				: {};
		// 简单处理 dateRange
		const params: any = { ...values };
		Object.keys(values).forEach((k) => {
			const v = values[k];
			if (v && v.length === 2 && dayjs.isDayjs(v[0])) {
				params[k] = [v[0].format("YYYY-MM-DD"), v[1].format("YYYY-MM-DD")];
			}
		});
		return params;
	}, []);

	const handleExport = useCallback(async () => {
		if (!exportConfig) return;

		// 1. 准备查询条件（排除分页参数）
		const { pageNum, pageSize, ...reqCondition } = activeParams;

		// 2. 合并额外的查询参数
		const finalReqCondition = {
			...reqCondition,
			...(exportConfig.extraParams || {}),
		};

		// 3. 获取当前显示的列（按顺序）
		const visibleColumns = mergedColumns
			.filter((col) => {
				const key = col.key as string;
				// 排除搜索专用列 (hideInTable = true)
				if (col.hideInTable) return false;
				// 排除操作列
				if (key === "__actions") return false;
				// 检查是否在 columnsStateMap 中被用户隐藏
				const state = columnsStateMap[key];
				return state?.show !== false;
			})
			.sort((a, b) => {
				// 按照用户调整后的顺序排序
				const orderA = columnsStateMap[a.key as string]?.order || 0;
				const orderB = columnsStateMap[b.key as string]?.order || 0;
				return orderA - orderB;
			})
			.map((col) => ({
				tableHeadCode: Array.isArray(col.dataIndex) ? col.title : col.dataIndex,
				tableHeadName: col.title,
			}));

		visibleColumns.unshift(
			{
				tableHeadCode: "serialNumber",
				tableHeadName: "序号",
			},
			{
				tableHeadCode: "orgCodeStatusStr",
				tableHeadName: "标签",
			},
		);

		// 4. 调用导出 API
		try {
			await commonExport({
				excelId: Number(exportConfig.excelId),
				reqCondition: finalReqCondition,
				exportTableHead: visibleColumns,
			});
		} catch (error) {
			console.error("导出失败:", error);
		}
	}, [exportConfig, activeParams, mergedColumns, columnsStateMap]);

	const load = useCallback(
		async (page = 1, searchParams?: any, explicitPageSize?: number) => {
			if (!fetchData) return;
			setLoading(true);
			try {
				// 如果传入了 searchParams，说明是点击查询/重置，更新 activeParams
				// 否则使用当前的 activeParams（翻页场景）
				const query = searchParams || activeParams;
				if (searchParams) {
					setActiveParams(searchParams);
				}

				const params = { ...query, pageNum: page, pageSize: explicitPageSize ?? pageSize };
				const res = await fetchData(params);
				const nextData = res.data || [];
				const nextTotal = res.total || 0;
				if (!isDataSourceControlled) {
					setData(nextData);
				}
				setTotal(nextTotal);
				onDataLoaded?.(nextData, nextTotal);
				setCurrent(page);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		},
		[fetchData, isDataSourceControlled, onDataLoaded, pageSize, activeParams],
	);

	useEffect(() => {
		load(1, normalizedInitialSearchValues ?? {});
	}, [tableInstanceKey]);

	useEffect(() => {
		if (!normalizedInitialSearchValues) {
			return;
		}

		let cancelled = false;
		const timeoutIds: number[] = [];
		const applyValues = (attempt: number) => {
			if (cancelled) {
				return;
			}

			const formInstance = formRef.current;
			void attempt;
			formInstance?.setFieldsValue?.(normalizedInitialSearchValues);
		};

		const frameId = window.requestAnimationFrame(() => {
			applyValues(0);
			[60, 180, 360, 720].forEach((delay, index) => {
				const timeoutId = window.setTimeout(() => applyValues(index + 1), delay);
				timeoutIds.push(timeoutId);
			});
		});

		return () => {
			cancelled = true;
			window.cancelAnimationFrame(frameId);
			timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
		};
	}, [normalizedInitialSearchValues, tableInstanceKey]);

	// 当父组件更新 reloadSignal（通常是一个自增数字）时，仅重新请求数据，而不卸载组件，避免闪烁
	useEffect(() => {
		if (reloadSignal !== undefined && reloadSignal > 0) {
			// 保持当前页，重新加载当前页的数据
			load(current);
		}
	}, [reloadSignal]);

	const pagination = useMemo(
		() => ({
			size: "default" as const,
			current,
			pageSize,
			total,
			showQuickJumper: false,
			showTotal: (t: number) => <span className="text-gray-500">共{t} 条</span>,
			onChange: (p: number, size?: number) => {
				const nextSize = size ?? pageSize;
				if (nextSize !== pageSize) {
					setPageSize(nextSize);
				}
				load(p, undefined, nextSize);
			},
			showSizeChanger: true,
			pageSizeOptions: ["10", "20", "50"],
		}),
		[current, pageSize, total, load],
	);

	const searchConfig = useMemo(() => {
		if (!searchSchema.length) return false;

		return {
			filterType: "query" as const,
			className: "!mb-0",
			searchGutter: 12,
			defaultCollapsed: false,
			optionRender: (searchConfig: any) => {
				return [
					<Button
						key="submit"
						type="primary"
						onClick={() => {
							const params = getFormParams();
							load(1, params);
						}}
					>
						查询
					</Button>,
					<Button
						type="text"
						key="reset"
						onClick={() => {
							searchConfig.form?.resetFields();
							onResetSearch?.();
							// 重置时，使用空对象作为查询参数
							load(1, {});
						}}
					>
						重置
					</Button>,
				];
			},
		};
	}, [searchSchema.length, getFormParams, load, onResetSearch]);

	return (
		// 增加局部覆盖：只影响该表格实例内的 Select 样式（移除边框并增加背景）
		<div className={cn("searchable-table-wrapper w-full", classes.wrapper)} ref={containerRef}>
			<BasicTable
				key={tableInstanceKey}
				rowKey={(record: any) => record.id || record.key}
				{...(rest as TableProps<T>)}
				columns={mergedColumns}
				dataSource={dataSource || data}
				loading={propLoading !== undefined ? propLoading : loading}
				pagination={propPagination === undefined ? (pagination as any) : propPagination}
				toolBarRender={
					toolBarRender ||
					(() => {
						return exportConfig
							? [
									<Button
										type="default"
										icon={<ImportIcon width={14} height={14} />}
										onClick={(e) => {
											e.stopPropagation();
											handleExport();
										}}
										className="translate-y-[1px]"
										key="export-button"
									>
										导出
									</Button>,
								]
							: [];
					})
				}
				options={{
					...TABLE_CONFIG.OPTIONS,
					setting: {
						settingIcon: (
							<>
								<BasicButton>列表选项</BasicButton>
							</>
						),
					},
				}}
				cardBordered={false}
				headerTitle={props.toolbarActions}
				toolbar={{
					className: "border-t",
				}}
				formRef={formRef}
				form={{
					className: "!p-0 !pb-4",
					initialValues: normalizedInitialSearchValues,
				}}
				cardProps={{
					bodyStyle: {
						padding: 0,
					},
				}}
				adaptive={adaptive}
				scroll={props.scroll ? props.scroll : { x: 1600 }}
				tableAlertRender={false}
				search={searchConfig}
				columnsState={{
					value: columnsStateMap,
					onChange: (newState) => {
						setColumnsStateMap(newState);
					},
				}}
			/>
		</div>
	);
}

export default SearchableTable;
