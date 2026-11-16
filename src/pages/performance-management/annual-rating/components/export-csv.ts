/**
 * 转义 CSV 单元格，并阻止 Excel 将内容作为公式执行。
 *
 * @param cell - 原始单元格文本
 * @returns 转义后的单元格文本
 */
export function escapeCsvCell(cell: string): string {
	const safeCell = /^[=+\-@]/.test(cell) ? `'${cell}` : cell;
	return `"${safeCell.replace(/"/g, `""`)}"`;
}

/**
 * 解析符合 RFC 4180 的 CSV 文本，支持带引号的逗号、双引号与换行。
 *
 * @param text - CSV 文本
 * @returns 完整数据行
 */
export function parseCsv(text: string): string[][] {
	const input = text.replace(/^\uFEFF/, "");
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = "";
	let quoted = false;

	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];
		if (quoted) {
			if (char === '"' && input[index + 1] === '"') {
				cell += '"';
				index += 1;
			} else if (char === '"') {
				quoted = false;
			} else {
				cell += char;
			}
			continue;
		}
		if (char === '"' && cell === "") {
			quoted = true;
		} else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\r" || char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
			if (char === "\r" && input[index + 1] === "\n") {
				index += 1;
			}
		} else {
			cell += char;
		}
	}

	if (quoted) {
		throw new Error("CSV 存在未闭合的引号");
	}
	if (cell || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}
	return rows;
}

/**
 * 导出 CSV 文件（前端生成，供后端就绪前使用）
 *
 * 文件带 BOM，避免 Excel 打开中文乱码。
 *
 * @param filename - 文件名
 * @param headers - 表头
 * @param rows - 数据行
 */
export function exportCsv(filename: string, headers: string[], rows: string[][]) {
	const content = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
	const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
