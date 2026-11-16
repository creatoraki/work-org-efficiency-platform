import type { ParamsType, ProTableProps } from "@ant-design/pro-components";

import type { TablePaginationConfig } from "antd";

import { footerHeight as layoutFooterHeight } from "#src/layout/constants";
import { usePreferencesStore } from "#src/store";
import { cn, isObject, isUndefined } from "#src/utils";

import { LoadingOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import { useSize } from "ahooks";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { BASIC_TABLE_ROOT_CLASS_NAME } from "./constants";
import { useStyles } from "./styles";

export interface BasicTableProps<D, U, V> extends ProTableProps<D, U, V> {
	/**
	 * @description 自适应内容区高度，如果设置了 scroll.y，则不进行自适应
	 * @default false
	 */
	adaptive?:
		| boolean
		| {
				/** 表格距离页面底部的偏移量，默认值为 `16` */
				offsetBottom?: number;
		  };
}

export function BasicTable<
	DataType extends Record<string, any>,
	Params extends ParamsType = ParamsType,
	ValueType = "text",
>(props: BasicTableProps<DataType, Params, ValueType>) {
	const classes = useStyles();
	const { t } = useTranslation();
	const { adaptive } = props;
	const tableWrapperRef = useRef<HTMLDivElement>(null);
	const size = useSize(tableWrapperRef);
	const { enableFooter, fixedFooter } = usePreferencesStore();
	/**
	 * @description 动态表格中为什么设置 scrollY 为 initial
	 * @see https://gist.github.com/condorheroblog/557c18c61084a1296b716bcb1203315e
	 */
	const [scrollY, setScrollY] = useState<number | string | undefined>(
		adaptive ? "initial" : undefined,
	);

	/**
	 * 同步表头滚动条占位列样式
	 * 修复右侧固定列表头和表体不对齐问题
	 *
	 * @see https://github.com/ant-design/ant-design/issues/53036
	 */
	useLayoutEffect(() => {
		const wrapper = tableWrapperRef.current;
		if (!wrapper) return;

		// scrollbar-width: thin 在 Windows 上的实际宽度约为 10px
		const scrollbarWidth = 10;

		const syncStyle = () => {
			const table = wrapper.querySelector(`.${BASIC_TABLE_ROOT_CLASS_NAME}`);
			if (!table) return;

			const body = table.querySelector(".ant-table-body") as HTMLElement;
			const header = table.querySelector(".ant-table-header") as HTMLElement;
			if (!body || !header) return;

			const hasScrollbar = body.scrollHeight > body.clientHeight;
			const scrollbarCell = header.querySelector(".ant-table-cell-scrollbar") as HTMLElement;
			const fixRightCell = header.querySelector(
				".ant-table-cell-fix-right-first",
			) as HTMLElement;

			if (hasScrollbar) {
				if (scrollbarCell) {
					scrollbarCell.style.cssText = `display: table-cell; width: ${scrollbarWidth}px; min-width: ${scrollbarWidth}px; position: sticky; right: 0;`;
				}
				if (fixRightCell) {
					fixRightCell.style.right = `${scrollbarWidth}px`;
				}
			} else {
				if (scrollbarCell) {
					scrollbarCell.style.display = "none";
				}
				if (fixRightCell) {
					fixRightCell.style.right = "0";
				}
			}
		};

		const timer = setTimeout(syncStyle, 50);
		const observer = new ResizeObserver(syncStyle);
		const table = wrapper.querySelector(`.${BASIC_TABLE_ROOT_CLASS_NAME}`);
		const body = table?.querySelector(".ant-table-body");
		if (body) {
			observer.observe(body);
		}

		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	}, [size]);

	/**
	 * @description 固定页脚的高度
	 * 如果启用了页脚并且页脚是固定的，则返回页脚的高度，否则返回 0
	 */
	const footerHeight = useMemo(() => {
		if (enableFooter && fixedFooter) {
			return layoutFooterHeight;
		}
		return 0;
	}, [enableFooter, fixedFooter]);

	const getPaginationProps = () => {
		if (props.pagination === false) {
			return false;
		}

		return {
			position: ["bottomRight"],
			defaultPageSize: 10,
			showQuickJumper: true,
			showSizeChanger: true,
			showTotal: (total) => t("common.pagination", { total }),
			...props.pagination,
		} satisfies TablePaginationConfig;
	};

	/**
	 * @description 计算分页器的高度
	 * 如果分页器被禁用，则返回 0，否则根据分页器的大小返回相应的高度
	 *
	 *
	 * 无法通过获取 DOM 的方式来计算分页器的高度，因为 pagination 是子组件，父组件无法加载子组件还未加载
	 */
	const paginationHeight = useMemo(() => {
		const paginationProps = getPaginationProps();
		const isPaginationDisabled = paginationProps === false;
		if (isPaginationDisabled) {
			return 0;
		} else {
			if (paginationProps.size === "default") {
				// 默认分页器高度为 32px
				return 32 + 16;
			} else {
				// 小分页器高度为 24px
				return 24 + 16;
			}
		}
	}, [getPaginationProps]);

	/**
	 * @description 表格高度自适应
	 * 这是一个 hook 方法，等待 antd 修复
	 * @see https://github.com/ant-design/ant-design/issues/23974
	 */
	useLayoutEffect(() => {
		if (!isUndefined(props.scroll?.y)) {
			// 如果 scroll.y 已经被设置，则不进行高度自适应
			return;
		}

		if (adaptive && tableWrapperRef.current) {
			const basicTable = tableWrapperRef.current.getElementsByClassName(
				BASIC_TABLE_ROOT_CLASS_NAME,
			)[0];

			if (!basicTable) return;

			const tableWrapperRect = tableWrapperRef.current.getBoundingClientRect();

			// 如果表格在屏幕外，不进行高度自适应
			if (tableWrapperRect.top > window.innerHeight) {
				return;
			}

			const tableBody = basicTable.querySelector("div.ant-table-body");

			if (!tableBody) return;

			// 获取元素的边界框
			const tableBodyRect = tableBody.getBoundingClientRect();

			// 24 是 BasicContent 的 padding 值
			const offsetBottom = isObject(adaptive) ? (adaptive.offsetBottom ?? 24) : 24;

			const realOffsetBottom = offsetBottom + (paginationHeight ?? 0) + footerHeight;

			// 首屏加载时需要在浏览器绘制前稳定表体高度，避免 ProTable loading 居中点二次跳动。
			const bodyHeight = Math.max(
				Math.floor(window.innerHeight - tableBodyRect.top - realOffsetBottom),
				0,
			);
			/**
			 * @zh scroll.y 设置的是 max-height，表体高度随数据撑开但不超过可用高度，
			 *    避免数据不足时表体与分页器之间出现空白。
			 * @en scroll.y sets the max-height, so the body height follows the data
			 *    and never exceeds the available height.
			 */
			tableBody.setAttribute("style", `overflow-y: auto;max-height: ${bodyHeight}px;`);
			setScrollY((currentScrollY) =>
				currentScrollY === bodyHeight ? currentScrollY : bodyHeight,
			);
		}
	}, [size, adaptive, paginationHeight, footerHeight, props.scroll?.y]);

	const getLoadingProps = () => {
		if (props.loading === false) {
			return false;
		}
		if (props.loading === true) {
			return true;
		}
		return {
			indicator: <LoadingOutlined spin />,
			...props.loading,
		};
	};

	/**
	 * @description 获取搜索配置，包含默认的响应式布局 span 配置
	 * 如果外部传入了 search.span，则使用外部的配置覆盖默认值
	 */
	const getSearchProps = () => {
		if (props.search === false) {
			return false;
		}

		// 默认的响应式布局配置：控制搜索表单字段在不同屏幕尺寸下占据的列数（基于 Ant Design 24 列栅格系统）
		const defaultSpan = {
			xs: 24, // 超小屏幕（<576px）：占满整行（24/24 = 100%），一行显示一个字段
			sm: 24, // 小屏幕（≥576px）：占满整行（24/24 = 100%），一行显示一个字段
			md: 12, // 中等屏幕（≥768px）：占一半（12/24 = 50%），一行显示两个字段
			lg: 12, // 大屏幕（≥992px）：占一半（12/24 = 50%），一行显示两个字段
			xl: 6, // 超大屏幕（≥1200px）：占四分之一（6/24 = 25%），一行显示四个字段
			xxl: 4, // 超超大屏幕（≥1600px）：占六分之一（4/24 = 16.67%），一行显示六个字段
		};

		// 如果外部传入了 span，则合并覆盖默认值
		const searchConfig = isObject(props.search) ? props.search : {};
		const mergedSpan =
			searchConfig.span && isObject(searchConfig.span)
				? { ...defaultSpan, ...searchConfig.span }
				: defaultSpan;

		return {
			...searchConfig,
			span: mergedSpan,
		};
	};

	return (
		<div className="h-full" ref={tableWrapperRef}>
			<ProTable
				cardBordered
				rowKey="id"
				dateFormatter="string"
				{...props}
				rootClassName={cn(BASIC_TABLE_ROOT_CLASS_NAME, props.rootClassName)}
				className={cn(classes.basicTable, props.className)}
				scroll={{ y: scrollY, x: "max-content", ...props.scroll }}
				loading={getLoadingProps()}
				pagination={getPaginationProps()}
				search={getSearchProps()}
				expandable={{
					// expandIcon: ({ expanded, onExpand, record }) => {
					// 	return expanded
					// 		? (
					// 			<RightOutlined onClick={e => onExpand(record, e)} />
					// 		)
					// 		: (
					// 			<DownOutlined onClick={e => onExpand(record, e)} />
					// 		);
					// },
					...props.expandable,
				}}
			/>
		</div>
	);
}
