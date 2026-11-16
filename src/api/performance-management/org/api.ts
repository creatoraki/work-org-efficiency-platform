import type { RatingOrgOption, RatingOrgTreeNode } from "./types";

import { request } from "#src/utils";

/**
 * 绩效管理 · 年度评级 · 组织
 *
 * 真实接口：
 * - POST annualevaluation/org/list/all  评级组织全量列表（执行范围树选择）
 */

/** 组织层级最大深度，用于路径异常时的防环兜底（正常层级 7~8 级） */
const MAX_TREE_DEPTH = 50;

/** 后端组织列表行（EffAnnualEvaluationOrgPageListBO 的展示子集） */
interface OrgListRow {
	/** 组织code */
	orgCode?: string;
	/** 上级组织code */
	parentOrgCode?: string;
	/** 组织编码路径（| 分隔） */
	orgCodePath?: string;
	/** 组织名称 */
	orgName?: string;
	/** 组织名称路径（| 分隔） */
	orgNamePath?: string;
}

/**
 * 查询评级组织选项
 *
 * 按 orgCode 去重；多计划下同一组织逐字段合并，空字段由后续行补齐。
 *
 * @returns 组织选项
 */
export async function fetchRatingOrgOptions(): Promise<RatingOrgOption[]> {
	const response = await request
		.post("annualevaluation/org/list/all")
		.json<ApiResponse<OrgListRow[]>>();

	const optionMap = new Map<string, RatingOrgOption>();
	for (const row of response?.data ?? []) {
		const orgCode = row.orgCode?.trim();
		if (!orgCode) {
			continue;
		}
		const parentOrgCode = row.parentOrgCode?.trim() || undefined;
		const orgCodePath = row.orgCodePath?.trim() || undefined;
		const orgName = row.orgName?.trim() ?? "";
		const orgNamePath = row.orgNamePath?.trim() || undefined;

		const existing = optionMap.get(orgCode);
		if (!existing) {
			optionMap.set(orgCode, { orgCode, parentOrgCode, orgCodePath, orgName, orgNamePath });
			continue;
		}
		existing.parentOrgCode ??= parentOrgCode;
		existing.orgCodePath ??= orgCodePath;
		existing.orgNamePath ??= orgNamePath;
		if (!existing.orgName && orgName) {
			existing.orgName = orgName;
		}
	}
	return Array.from(optionMap.values());
}

/**
 * 平铺组织列表组装为树
 *
 * 以 orgCodePath 为主：按路径逐段挂父子，缺失祖先用 orgNamePath 补节点；
 * 无可用路径的组织在路径处理完后按 parentOrgCode 兜底。复杂度 O(n·d)。
 *
 * @param options - 平铺组织选项
 * @returns 组织树
 */
export function buildOrgTree(options: RatingOrgOption[]): RatingOrgTreeNode[] {
	const nodeMap = new Map<string, RatingOrgTreeNode>();

	/**
	 * 确保节点存在
	 *
	 * 已存在时仅允许占位名（title === value）被真实名称覆盖。
	 *
	 * @param code - 组织code
	 * @param name - 组织名称，缺省时用 code 占位
	 * @returns 树节点
	 */
	const ensureNode = (code: string, name?: string): RatingOrgTreeNode => {
		const existing = nodeMap.get(code);
		const title = name?.trim();
		if (existing) {
			if (title && existing.title === existing.value) {
				existing.title = title;
			}
			return existing;
		}
		const node: RatingOrgTreeNode = { value: code, title: title || code };
		nodeMap.set(code, node);
		return node;
	};

	// 1. 先落接口行节点，名称以 orgName 为准
	for (const option of options) {
		ensureNode(option.orgCode, option.orgName);
	}

	/** 子节点 code → 父节点 code */
	const parentOf = new Map<string, string>();

	/**
	 * 挂载父子关系
	 *
	 * 同一父节点的边幂等跳过；换父节点时从旧父摘除；超出深度上限或成环则放弃。
	 *
	 * @param parentCode - 父组织code
	 * @param childCode - 子组织code
	 */
	const attach = (parentCode: string, childCode: string) => {
		if (parentCode === childCode || parentOf.get(childCode) === parentCode) {
			return;
		}
		const parent = nodeMap.get(parentCode);
		const child = nodeMap.get(childCode);
		if (!parent || !child) {
			return;
		}
		// 防环：child 若是 parent 的祖先则跳过；层级异常超过上限也放弃
		let cursor: string | undefined = parentCode;
		let depth = 0;
		while (cursor) {
			if (cursor === childCode || depth > MAX_TREE_DEPTH) {
				return;
			}
			cursor = parentOf.get(cursor);
			depth += 1;
		}

		const previous = parentOf.get(childCode);
		if (previous) {
			const previousParent = nodeMap.get(previous);
			if (previousParent?.children) {
				previousParent.children = previousParent.children.filter(
					(item) => item.value !== childCode,
				);
			}
		}

		(parent.children ??= []).push(child);
		parentOf.set(childCode, parentCode);
	};

	// 2. 按 orgCodePath 还原层级，缺失祖先用 orgNamePath 补名
	const fallbackOptions: RatingOrgOption[] = [];
	for (const option of options) {
		const rawCodes = (option.orgCodePath ?? "").split("|");
		const codes = rawCodes.map((code) => code.trim());
		// 正常末段为自身；异常数据时自身可能在中间，取最后一次出现
		const selfIndex = codes.lastIndexOf(option.orgCode);
		if (selfIndex <= 0) {
			fallbackOptions.push(option);
			continue;
		}

		// 名称按原始下标对齐，空段同步跳过
		const needsNames = codes
			.slice(0, selfIndex + 1)
			.some((code) => code !== "" && !nodeMap.has(code));
		const names = needsNames ? (option.orgNamePath ?? "").split("|") : [];
		const aligned = names.length === rawCodes.length;

		const entries: Array<{ code: string; name?: string }> = [];
		for (let index = 0; index <= selfIndex; index += 1) {
			const code = codes[index];
			if (!code) {
				continue;
			}
			entries.push({ code, name: aligned ? names[index]?.trim() : undefined });
		}
		if (entries.length <= 1) {
			fallbackOptions.push(option);
			continue;
		}

		for (const entry of entries) {
			ensureNode(entry.code, entry.name);
		}
		for (let index = 1; index < entries.length; index += 1) {
			attach(entries[index - 1].code, entries[index].code);
		}
	}

	// 3. 路径处理完再按 parentOrgCode 兜底
	for (const option of fallbackOptions) {
		if (option.parentOrgCode) {
			attach(option.parentOrgCode, option.orgCode);
		}
	}

	// children 懒创建；未被挂载的节点即根
	return Array.from(nodeMap.values()).filter((node) => !parentOf.has(node.value));
}

/**
 * 查询评级组织树
 *
 * 供评级待办筛选区的「执行范围」树选择使用。
 *
 * @returns 组织树
 */
export async function fetchRatingOrgTreeData(): Promise<RatingOrgTreeNode[]> {
	return buildOrgTree(await fetchRatingOrgOptions());
}
