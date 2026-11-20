import {
	AppraisalStatus,
	createAppraisalFolder,
	deleteAppraisalFolders,
	fetchAppraisalFolderUserIds,
	fetchAppraisalUserDetail,
	fetchAppraisalUserPage,
	normalizeAppraisalStatistics,
	startAppraisalPresentation,
	updateAppraisalFolder,
} from "#src/api/performance-management/yearly-performance";
import { FOLDER_ALL } from "#src/pages/performance-management/yearly-performance/constants";
import {
	buildOrgCascaderOptions,
	formatDateWithWeekday,
	moveId,
	toOrgCascaderPath,
	toUserFilter,
} from "#src/pages/performance-management/yearly-performance/utils";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

/** axios 请求实例替身：年终述职接口走 #src/utils/axios-request（已解包 data） */
const { requestMock } = vi.hoisted(() => ({
	requestMock: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("#src/utils/axios-request", () => ({
	request: requestMock,
}));

/** 组织树替身：单根集团 → 地区公司 → 杭州区域公司 */
const ORG_TREE = [
	{
		id: "1",
		code: "LC",
		name: "绿城服务集团",
		accessible: true,
		children: [
			{
				id: "3",
				code: "QY",
				name: "地区公司",
				accessible: true,
				children: [{ id: "4", code: "HZ", name: "杭州区域公司", accessible: true }],
			},
			{ id: "9", code: "ZN", name: "浙南区域公司", accessible: false },
		],
	},
];

describe("年终述职 API 映射", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("述职人员分页：int64 ID 归一为字符串，空 folderId 归一为 undefined", async () => {
		requestMock.post.mockResolvedValueOnce({
			total: 2,
			list: [
				{ userId: 101, userName: "李彤运", folderId: 9001, appraisalStatus: 0, sort: 1 },
				{ userId: "102", userName: "YOUHUI", folderId: null, appraisalStatus: 1 },
			],
		});
		const query = {
			pageNum: 1,
			pageSize: 20,
			orgCode: "HZ",
			appraisalStatus: AppraisalStatus.PENDING,
		};
		const page = await fetchAppraisalUserPage(query);

		expect(requestMock.post).toHaveBeenCalledWith("appraisal/user/list", query);
		expect(page.total).toBe(2);
		expect(page.list[0]).toMatchObject({ userId: "101", folderId: "9001" });
		expect(page.list[1].folderId).toBeUndefined();
	});

	it("文件夹全量 ID：按 sort 升序，缺失 sort 保持原顺序", async () => {
		requestMock.post.mockResolvedValueOnce({
			total: 3,
			list: [
				{ userId: 3, userName: "c", appraisalStatus: 0, sort: 3 },
				{ userId: 1, userName: "a", appraisalStatus: 0, sort: 1 },
				{ userId: 2, userName: "b", appraisalStatus: 0, sort: 2 },
			],
		});
		await expect(fetchAppraisalFolderUserIds("9001")).resolves.toEqual(["1", "2", "3"]);
		expect(requestMock.post).toHaveBeenCalledWith("appraisal/user/list", {
			folderId: "9001",
			pageNum: 1,
			pageSize: 500,
		});
	});

	it("详情：AI 听记记录 status 统一为字符串", async () => {
		requestMock.get.mockResolvedValueOnce({
			userId: 101,
			userName: "YOUHUI",
			appraisalStatus: 1,
			appraisalRecords: [{ id: 1, status: 4, title: "闪记" }],
		});
		const detail = await fetchAppraisalUserDetail("101");
		expect(requestMock.get).toHaveBeenCalledWith("appraisal/user/101");
		expect(detail.appraisalRecords[0]).toMatchObject({ id: "1", status: "4" });
	});

	it("新增文件夹：兼容 data 为数字 / 对象 / 空", async () => {
		const form = {
			name: "杭州区域公司12-12 周四",
			appraisalDate: "2026-12-12 00:00:00",
			belongToOrgCode: "HZ",
		};
		requestMock.post.mockResolvedValueOnce(9100);
		await expect(createAppraisalFolder(form)).resolves.toBe("9100");
		requestMock.post.mockResolvedValueOnce({ id: 9101 });
		await expect(createAppraisalFolder(form)).resolves.toBe("9101");
		requestMock.post.mockResolvedValueOnce(null);
		await expect(createAppraisalFolder(form)).resolves.toBeUndefined();
		expect(requestMock.post).toHaveBeenCalledWith("appraisal/folder", form);
	});

	it("修改 / 删除文件夹：PUT 整体回传，DELETE 以逗号拼接路径参数", async () => {
		await updateAppraisalFolder({
			id: "1",
			name: "新名称",
			appraisalDate: "2026-12-12 00:00:00",
		});
		expect(requestMock.put).toHaveBeenCalledWith("appraisal/folder", {
			id: "1",
			name: "新名称",
			appraisalDate: "2026-12-12 00:00:00",
		});
		await deleteAppraisalFolders(["1", "2"]);
		expect(requestMock.delete).toHaveBeenCalledWith("appraisal/folder/1,2");
	});

	it("开始述职：关闭全局错误提示，交由页面以弹窗展示防重复录制文案", async () => {
		requestMock.post.mockResolvedValueOnce(null);
		await startAppraisalPresentation({ folderId: "9001", userId: "101" });
		expect(requestMock.post).toHaveBeenCalledWith(
			"appraisal/user/presentation/start",
			{ folderId: "9001", userId: "101" },
			{ errorMessage: false },
		);
	});
});

describe("年终述职统计归一", () => {
	it("数组形态：按 appraisalStatus 累加 count", () => {
		expect(
			normalizeAppraisalStatistics([
				{ appraisalStatus: 0, count: 13 },
				{ appraisalStatus: 1, count: 1 },
				{ status: "3", num: 2 },
			]),
		).toEqual({ 0: 13, 1: 1, 2: 0, 3: 2 });
	});

	it("对象形态：数字键视为状态", () => {
		expect(normalizeAppraisalStatistics({ 0: 2, 2: "1", other: 99 })).toEqual({
			0: 2,
			1: 0,
			2: 1,
			3: 0,
		});
	});

	it("未知结构兜底为 0", () => {
		expect(normalizeAppraisalStatistics(null)).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
		expect(normalizeAppraisalStatistics([{ appraisalStatus: 9, count: 5 }])).toEqual({
			0: 0,
			1: 0,
			2: 0,
			3: 0,
		});
	});
});

describe("年终述职页面工具", () => {
	it("moveId：移动到目标位置，越界夹紧，不存在时原样返回", () => {
		expect(moveId(["a", "b", "c", "d"], "a", 2)).toEqual(["b", "c", "a", "d"]);
		expect(moveId(["a", "b", "c", "d"], "d", 0)).toEqual(["d", "a", "b", "c"]);
		expect(moveId(["a", "b", "c"], "a", 99)).toEqual(["b", "c", "a"]);
		expect(moveId(["a", "b"], "x", 0)).toEqual(["a", "b"]);
	});

	it("toUserFilter：「全部」不传 folderId，管理者类别以「>」拼接，日期按天补齐时分秒", () => {
		const filter = toUserFilter({
			orgCode: "HZ",
			folderId: FOLDER_ALL,
			filter: {
				userName: "  李 ",
				jobTypePath: ["地区公司", "三级及以上管理者"],
				appraisalDateRange: [dayjs("2026-11-03"), dayjs("2026-11-04")],
			},
		});
		expect(filter).toEqual({
			orgCode: "HZ",
			currentOrgOnly: false,
			folderId: undefined,
			userName: "李",
			jobType: "地区公司>三级及以上管理者",
			appraisalDateStart: "2026-11-03 00:00:00",
			appraisalDateEnd: "2026-11-04 23:59:59",
		});
		expect(toUserFilter({ folderId: "9001", filter: {} })).toMatchObject({
			orgCode: undefined,
			currentOrgOnly: undefined,
			folderId: "9001",
		});
	});

	it("所属组织级联：单根时从根的下级开始，无权限叶子节点禁用", () => {
		const options = buildOrgCascaderOptions(ORG_TREE);
		expect(options.map((option) => option.value)).toEqual(["QY", "ZN"]);
		expect(options[1].disabled).toBe(true);
		expect(toOrgCascaderPath(ORG_TREE, "HZ")).toEqual(["QY", "HZ"]);
		expect(toOrgCascaderPath(ORG_TREE, "LC")).toBeUndefined();
	});

	it("述职日期展示「YYYY-MM-DD 周X」，空值展示「-」", () => {
		expect(formatDateWithWeekday("2026-11-03 00:00:00")).toBe("2026-11-03 周二");
		expect(formatDateWithWeekday(dayjs("2026-12-12"), "MM-DD")).toBe("12-12 周六");
		expect(formatDateWithWeekday(undefined)).toBe("-");
	});
});
