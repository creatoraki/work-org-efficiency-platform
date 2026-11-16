import {
	escapeCsvCell,
	parseCsv,
} from "#src/pages/performance-management/annual-rating/components/export-csv";
import { describe, expect, it } from "vitest";

describe("年度评级 CSV 工具", () => {
	it("导出时阻止 Excel 公式前缀执行", () => {
		expect(escapeCsvCell("=SUM(1,2)")).toBe('"\'=SUM(1,2)"');
		expect(escapeCsvCell("+cmd")).toBe('"\'+cmd"');
		expect(escapeCsvCell("-2")).toBe('"\'-2"');
		expect(escapeCsvCell("@formula")).toBe('"\'@formula"');
	});

	it("导出时保留普通文本并转义双引号", () => {
		expect(escapeCsvCell('张"三')).toBe('"张""三"');
	});

	it("解析带逗号、双引号、换行和 BOM 的合法 CSV", () => {
		const input = '\uFEFF"人员","工号"\r\n"张,三","E""1"\r\n"李\n四",E2';
		expect(parseCsv(input)).toEqual([
			["人员", "工号"],
			["张,三", 'E"1'],
			["李\n四", "E2"],
		]);
	});

	it("拒绝未闭合引号的 CSV，避免部分数据入库", () => {
		expect(() => parseCsv('"张三,E1001')).toThrow("CSV 存在未闭合的引号");
	});
});
