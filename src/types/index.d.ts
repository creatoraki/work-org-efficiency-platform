/**
 * 接口返回数据格式
 * data: 接口返回数据
 * 注意：此类型定义与 src/utils/axios-request/types.ts 保持一致
 * 旧代码（使用 ky）和新代码（使用 axios-request）都可以使用此类型
 */
interface ApiResponse<T> {
	code: number;
	msg: string;
	data: T;
}

/**
 * 分页数据结构（列表接口返回的 data 部分）
 */
interface PagedData<T> {
	pageNum: number;
	pageSize: number;
	total: number;
	pages: number;
	list: T[];
	emptyFlag: boolean;
}

/**
 * 数组形式的接口返回数据格式
 * list: 接口返回数据
 */
interface ApiListResponse<T> extends ApiResponse<PagedData<T>> {}

/**
 * 拉取表格请求参数
 */
interface ApiTableRequest extends Record<string, any> {
	cqs?: string;
	pageSize?: number;
	pageNum?: number;
}

/**
 * 分页排序项
 */
interface SortItem {
	/** true正序|false倒序 */
	isAsc: boolean;

	/** 排序字段 */
	column: string;
}

/**
 * 分页查询基础参数
 */
interface PaginationParams {
	/** 页码(不能为空) */
	pageNum: number;

	/** 每页数量(不能为空) */
	pageSize: number;

	/** 是否查询总条数 */
	searchCount?: boolean;

	/** 排序字段集合 */
	sortItemList?: SortItem[];
}

type Recordable<T = any> = Record<string, T>;
