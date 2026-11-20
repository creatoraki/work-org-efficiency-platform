import type {
	AppraisalId,
	AppraisalOrgNode,
	AppraisalUserFilter,
} from "#src/api/performance-management/yearly-performance";
import type { Dayjs } from "dayjs";
import type { CascaderOption } from "./constants";
import type { ReportFilterValues } from "./types";

import dayjs from "dayjs";
import { FOLDER_ALL } from "./constants";

/** 星期文案（不依赖 dayjs 全局语言，避免切换英文时出现「Tue」） */
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** 后端 date-time 入参格式 */
const API_DATE_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

/**
 * 头像占位文字
 *
 * 规则与档案管理一致：未上传头像时，中文名取最后一个字，英文名取首字母（大写）。
 *
 * @param name - 姓名
 * @returns 占位文字
 */
export function getAvatarText(name: string): string {
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}
	if (/^[a-z]/i.test(trimmed)) {
		return trimmed[0].toUpperCase();
	}
	return Array.from(trimmed).pop() ?? "";
}

/**
 * 格式化日期为「2026-11-03 周二」（设计稿卡片 / 详情「述职日期」）
 *
 * @param value - 后端日期 / 日期时间，或 dayjs 对象
 * @param pattern - 日期部分格式，文件夹建议名称使用「MM-DD」
 * @returns 格式化文案，空值返回「-」
 */
export function formatDateWithWeekday(value?: string | Dayjs, pattern = "YYYY-MM-DD"): string {
	if (!value) {
		return "-";
	}
	const date = dayjs(value);
	if (!date.isValid()) {
		return String(value);
	}
	return `${date.format(pattern)} ${WEEKDAY_LABELS[date.day()]}`;
}

/**
 * 格式化日期时间为「11-05 10:32」
 *
 * @param value - 后端日期时间
 * @returns 格式化文案，空值返回空串
 */
export function formatShortDateTime(value?: string): string {
	if (!value) {
		return "";
	}
	const date = dayjs(value);
	return date.isValid() ? date.format("MM-DD HH:mm") : value;
}

/**
 * 秒数格式化为「mm:ss」，超过 1 小时为「HH:mm:ss」
 *
 * @param totalSeconds - 秒数
 * @returns 格式化文案
 */
export function formatDuration(totalSeconds?: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds ?? 0));
	const pad = (value: number) => String(value).padStart(2, "0");
	const hours = Math.floor(seconds / 3600);
	const rest = `${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
	return hours ? `${pad(hours)}:${rest}` : rest;
}

/**
 * 日期 → 后端 date-time 入参（按天起止补齐时分秒）
 *
 * @param value - 日期
 * @param edge - start 取当天 00:00:00，end 取当天 23:59:59
 * @returns 入参字符串
 */
export function toApiDateTime(value: Dayjs, edge: "start" | "end"): string {
	return (edge === "start" ? value.startOf("day") : value.endOf("day")).format(
		API_DATE_TIME_FORMAT,
	);
}

/**
 * 页面查询条件 → 接口筛选参数（列表与统计共用）
 *
 * - 组织：传选中组织 code，currentOrgOnly=false 表示包含下级组织；
 * - 文件夹：「全部」不传 folderId；
 * - 管理者类别：级联路径以「>」拼接为 jobType（与卡片展示格式一致，取值待后端确认）。
 *
 * @param params - 查询条件
 * @param params.orgCode - 选中组织
 * @param params.folderId - 选中文件夹
 * @param params.filter - 已生效筛选
 * @returns 接口筛选参数（不含状态时由调用方决定是否带 appraisalStatus）
 */
export function toUserFilter({
	orgCode,
	folderId,
	filter,
}: {
	orgCode?: string;
	folderId: string;
	filter: ReportFilterValues;
}): AppraisalUserFilter {
	const [start, end] = filter.appraisalDateRange ?? [];
	return {
		orgCode,
		currentOrgOnly: orgCode ? false : undefined,
		folderId: folderId === FOLDER_ALL ? undefined : folderId,
		userName: filter.userName?.trim() || undefined,
		jobType: filter.jobTypePath?.length ? filter.jobTypePath.join(">") : undefined,
		appraisalDateStart: start ? toApiDateTime(start, "start") : undefined,
		appraisalDateEnd: end ? toApiDateTime(end, "end") : undefined,
	};
}

/**
 * 是否为真实文件夹（排序、开始述职都依赖真实 folderId）
 *
 * @param folderId - 文件夹面板选中项
 * @returns 是否真实文件夹
 */
export function isRealFolder(folderId?: string): folderId is AppraisalId {
	return Boolean(folderId) && folderId !== FOLDER_ALL;
}

/**
 * 将 ID 移动到目标位置（越界时夹紧到首尾），返回新数组
 *
 * 用于文件夹内排序：拖拽（目标为被覆盖卡片的位置）与序号输入（目标为「序号 - 1」）共用。
 *
 * @param ids - 原有序 ID
 * @param id - 移动的 ID
 * @param toIndex - 目标下标
 * @returns 新的有序 ID；id 不在列表中时原样返回
 */
export function moveId<T>(ids: T[], id: T, toIndex: number): T[] {
	const from = ids.indexOf(id);
	if (from < 0) {
		return ids;
	}
	const next = ids.filter((item) => item !== id);
	const target = Math.min(Math.max(0, Math.trunc(toIndex)), next.length);
	next.splice(target, 0, id);
	return next;
}

/**
 * 查找组织在树中的路径（根 → 目标）
 *
 * @param nodes - 组织树
 * @param code - 目标组织编码
 * @returns 组织路径，未找到为空数组
 */
export function findOrgPath(nodes: AppraisalOrgNode[], code?: string): AppraisalOrgNode[] {
	if (!code) {
		return [];
	}
	for (const node of nodes) {
		if (node.code === code) {
			return [node];
		}
		const path = findOrgPath(node.children ?? [], code);
		if (path.length) {
			return [node, ...path];
		}
	}
	return [];
}

/**
 * 级联选项的起始层级：只有一个根节点（集团）时从根的下级开始，
 * 与设计稿「地区公司/杭州区域公司」的回显格式一致
 *
 * @param nodes - 组织树
 * @returns 起始层级节点
 */
export function getCascaderRoots(nodes: AppraisalOrgNode[]): AppraisalOrgNode[] {
	return nodes.length === 1 ? (nodes[0].children ?? []) : nodes;
}

/**
 * 组织树 → 「所属组织」级联选项（值为组织 code，不可访问节点禁用）
 *
 * @param nodes - 组织树
 * @returns 级联选项
 */
export function buildOrgCascaderOptions(nodes: AppraisalOrgNode[]): CascaderOption[] {
	const toOption = (node: AppraisalOrgNode): CascaderOption => ({
		value: node.code,
		label: node.name,
		disabled: !node.accessible && !node.children?.length,
		children: node.children?.length ? node.children.map(toOption) : undefined,
	});
	return getCascaderRoots(nodes).map(toOption);
}

/**
 * 根据级联路径找到各级选项名称
 *
 * @param options - 级联选项
 * @param path - 级联路径
 * @returns 各级名称，未命中时为空数组
 */
export function findCascaderLabels(options: CascaderOption[], path?: string[]): string[] {
	let level = options;
	const labels: string[] = [];
	for (const value of path ?? []) {
		const hit = level.find((option) => option.value === value);
		if (!hit) {
			return [];
		}
		labels.push(hit.label);
		level = hit.children ?? [];
	}
	return labels;
}

/**
 * 组织 code → 级联路径（与 buildOrgCascaderOptions 起始层级一致）
 *
 * @param nodes - 组织树
 * @param code - 组织编码
 * @returns 级联路径，不在级联范围内（如根节点）时为 undefined
 */
export function toOrgCascaderPath(nodes: AppraisalOrgNode[], code?: string): string[] | undefined {
	const path = findOrgPath(nodes, code);
	const offset = nodes.length === 1 ? 1 : 0;
	const values = path.slice(offset).map((node) => node.code);
	return values.length ? values : undefined;
}
