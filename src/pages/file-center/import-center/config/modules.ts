/**
 * 创建分层模块结构用于 Cascader
 */
function createModuleHierarchy() {
	// 所有模块（平铺形式）
	const allModules = [
		// 战略拆解
		["战略拆解", "目标管理", "指标库"],
		["战略拆解", "目标管理", "目标计划"],
		["战略拆解", "目标拆解", "指标配置"],
		["战略拆解", "目标拆解", "目标填报"],
		["战略拆解", "目标拆解", "目标确认"],
		["战略拆解", "目标拆解", "流程跟进"],
		// 标签管理
		["标签管理", "组织标签管理", "标签规则库"],
		["标签管理", "组织标签管理", "标签中心"],
		["标签管理", "组织标签管理", "标签审核"],
		["标签管理", "人才标签管理", "标签规则库"],
		["标签管理", "人才标签管理", "标签中心"],
		["标签管理", "人才标签管理", "标签审核"],
		["标签管理", "岗位描述管理", "岗位描述管理"],
		["标签管理", "岗位描述管理", "岗位描述审核"],
		["标签管理", "标签匹配管理", "匹配模型"],
		// 人员档案
		["人员档案", "档案管理"],
		["人员档案", "档案审核"],
		["人员档案", "面谈管理"],
	];

	// 构建树形结构
	const rootMap = new Map<string, any>();

	allModules.forEach((path) => {
		const [first, second, third] = path;

		if (!rootMap.has(first)) {
			rootMap.set(first, {
				label: first,
				value: first,
				children: [],
			});
		}

		const firstNode = rootMap.get(first);
		let secondNode = firstNode.children.find((c: any) => c.value === second);

		if (!secondNode) {
			secondNode = {
				label: second,
				value: second,
				children: [],
			};
			firstNode.children.push(secondNode);
		}

		// 如果有三级，添加到二级下面
		if (third) {
			if (!secondNode.children.find((c: any) => c.value === third)) {
				secondNode.children.push({
					label: third,
					value: third,
				});
			}
		}
	});

	return Array.from(rootMap.values());
}

/**
 * 从全路径提取叶子节点名称
 * 例如："标签管理 / 人才标签管理 / 标签规则库" -> "标签规则库"
 */
export function getLeafModuleName(fullPath: string): string {
	const parts = fullPath.split("/").map((p) => p.trim());
	return parts[parts.length - 1] || fullPath;
}

export const MODULE_OPTIONS = createModuleHierarchy();
