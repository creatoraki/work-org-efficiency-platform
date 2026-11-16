import type { SelectOption } from "../types";

export const USERS: SelectOption[] = [
	{ label: "张三", value: "zhangsan" },
	{ label: "李四", value: "lisi" },
	{ label: "王五", value: "wangwu" },
];

export const STATUS_OPTIONS: SelectOption[] = [
	{ label: "未提交", value: 0 },
	{ label: "已提交", value: 1 },
];

export const STATUS_MAP: Record<number, { text: string; color: string }> = {
	0: { text: "未提交", color: "#909399" },
	1: { text: "已提交", color: "#52c41a" },
};
