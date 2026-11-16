import type { RatingOrgTreeNode } from "#src/api/performance-management/org";

import { buildOrgTree } from "#src/api/performance-management/org";
import { describe, expect, it, vi } from "vitest";

// 构树是纯函数，mock 掉请求模块以避开 #src/utils 带来的路由等副作用
vi.mock("#src/utils", () => ({
	request: { post: vi.fn() },
}));

/**
 * 深度优先取第一条链路（本测试数据都是单链路）
 *
 * @param root - 根节点
 * @returns 节点值链路
 */
function pickChain(root: RatingOrgTreeNode): string[] {
	const chain: string[] = [];
	let node: RatingOrgTreeNode | undefined = root;
	for (let guard = 0; node && guard < 50; guard += 1) {
		chain.push(node.value);
		node = node.children?.[0];
	}
	return chain;
}

describe("评级组织树构建", () => {
	it("按 orgCodePath 还原完整层级，缺失祖先用 orgNamePath 补齐", () => {
		const tree = buildOrgTree([
			{
				orgCode: "BMXX129714",
				orgName: "服务中心",
				parentOrgCode: "GSXX0770",
				orgCodePath: "GSXX0174|GSXX0613|GSXX0214|GSXX0911|GSXX1215|GSXX0770|BMXX129714",
				orgNamePath:
					"绿城服务集团|区域公司|上海区域公司|嘉兴地区|濮园项目群|桐乡顶度绿城物业服务有限公司|服务中心",
			},
		]);

		expect(tree).toHaveLength(1);
		expect(pickChain(tree[0])).toEqual([
			"GSXX0174",
			"GSXX0613",
			"GSXX0214",
			"GSXX0911",
			"GSXX1215",
			"GSXX0770",
			"BMXX129714",
		]);
		expect(tree[0].title).toBe("绿城服务集团");
	});

	it("自身出现在路径中间时不丢层级，也不会成环", () => {
		const tree = buildOrgTree([
			{
				orgCode: "A",
				orgName: "A组织",
				orgCodePath: "A|B|A",
				orgNamePath: "A组织|B组织|A组织",
			},
		]);

		expect(tree).toHaveLength(1);
		expect(pickChain(tree[0])).toEqual(["A", "B"]);
	});

	it("无路径时按 parentOrgCode 挂靠，父节点晚出现也能挂上", () => {
		const tree = buildOrgTree([
			{ orgCode: "C", orgName: "子组织", parentOrgCode: "P" },
			{ orgCode: "P", orgName: "父组织" },
		]);

		expect(tree).toHaveLength(1);
		expect(tree[0].value).toBe("P");
		expect(tree[0].children?.map((node) => node.value)).toEqual(["C"]);
	});

	it("真实名称优先于路径补出的占位名称", () => {
		const tree = buildOrgTree([
			{
				orgCode: "CHILD",
				orgName: "子组织",
				orgCodePath: "ROOT|CHILD",
				orgNamePath: "占位集团|子组织",
			},
			{ orgCode: "ROOT", orgName: "绿城服务集团" },
		]);

		expect(tree[0].title).toBe("绿城服务集团");
	});
});
