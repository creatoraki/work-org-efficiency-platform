import type { ColumnsType } from "antd/es/table";
import { useCallback, useMemo, useRef, useState } from "react";

export interface UseMockTableOptions<T extends Record<string, any>> {
	initialData?: T[];
	pageSize?: number;
	idKey?: keyof T;
	mockCount?: number;
}

export interface UseMockTableResult<T extends Record<string, any>> {
	list: T[];
	total: number;
	fetchData: (params?: {
		pageNum?: number;
		pageSize?: number;
	}) => Promise<{ data: T[]; total: number }>;
	add: (record: Partial<T>) => void;
	update: (id: T[keyof T] | number | string, updates: Partial<T>) => void;
	delete: (id: T[keyof T] | number | string) => void;
}

function collectDataKeys<T>(columns: ColumnsType<T>): string[] {
	const keys: string[] = [];
	for (const col of columns) {
		if (!col) {
			continue;
		}
		if ("children" in col && Array.isArray(col.children)) {
			keys.push(...collectDataKeys(col.children));
		}
		if ("dataIndex" in col && col.dataIndex !== undefined) {
			const dataIndex = col.dataIndex as unknown;
			if (Array.isArray(dataIndex)) {
				keys.push(dataIndex.map(String).join("."));
			} else {
				keys.push(String(dataIndex));
			}
		}
	}
	return keys;
}

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomText(min = 3, max = 10) {
	const length = randomInt(min, max);
	const chars =
		"的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞";
	let result = "";
	for (let i = 0; i < length; i += 1) {
		result += chars.charAt(randomInt(0, chars.length - 1));
	}
	return result;
}

function randomDateString() {
	const now = Date.now();
	const offsetDays = randomInt(0, 30);
	const offsetMs = offsetDays * 24 * 60 * 60 * 1000 + randomInt(0, 86_399_999);
	const date = new Date(now - offsetMs);
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getMockValue(key: string, index: number) {
	const lowerKey = key.toLowerCase();
	if (lowerKey.includes("id")) {
		return index + 1;
	}
	if (lowerKey.includes("name") || lowerKey.includes("by") || lowerKey.includes("creator")) {
		return randomText(2, 3);
	}
	if (/(?:date|time)$/.test(lowerKey)) {
		return randomDateString();
	}
	if (
		lowerKey.includes("status") ||
		lowerKey.includes("perm") ||
		lowerKey.includes("count") ||
		lowerKey.includes("number")
	) {
		return Math.random() < 0.5 ? 0 : 1;
	}
	if (lowerKey.endsWith("str")) {
		return randomText(3, 20);
	}
	return randomText(3, 20);
}

function createMockData<T extends Record<string, any>>(
	columns: ColumnsType<T>,
	count: number,
	idKey: keyof T,
): T[] {
	const keys = collectDataKeys(columns);
	return Array.from({ length: count }, (_, index) => {
		const row: Record<string, any> = {};
		for (const key of keys) {
			row[key] = getMockValue(key, index);
		}
		if (row[idKey as string] === undefined) {
			row[idKey as string] = index + 1;
		}
		return row as T;
	});
}

export function useMockTable<T extends Record<string, any>>(
	columns: ColumnsType<T>,
	options?: UseMockTableOptions<T>,
): UseMockTableResult<T> {
	const { initialData, pageSize = 10, idKey = "id" as keyof T, mockCount = 5 } = options || {};
	const initialList = useMemo(
		() =>
			initialData && initialData.length > 0
				? initialData
				: createMockData(columns, mockCount, idKey),
		[columns, idKey, initialData, mockCount],
	);

	const dataRef = useRef<T[]>(initialList);
	const [list, setList] = useState<T[]>(initialList.slice(0, pageSize));
	const [total, setTotal] = useState<number>(dataRef.current.length);
	const nextIdRef = useRef<number>(dataRef.current.length + 1);

	const fetchData = useCallback(
		async (params?: { pageNum?: number; pageSize?: number }) => {
			const currentPage = params?.pageNum ?? 1;
			const currentPageSize = params?.pageSize ?? pageSize;
			const start = (currentPage - 1) * currentPageSize;
			const pageData = dataRef.current.slice(start, start + currentPageSize);
			setList(pageData);
			setTotal(dataRef.current.length);
			return { data: pageData, total: dataRef.current.length };
		},
		[pageSize],
	);

	const add = useCallback(
		(record: Partial<T>) => {
			const nextId = nextIdRef.current;
			nextIdRef.current += 1;
			const newRecord = {
				...record,
				[idKey]: (record as T)[idKey] ?? (nextId as any),
			} as T;
			dataRef.current = [newRecord, ...dataRef.current];
			void fetchData({ pageNum: 1, pageSize });
		},
		[fetchData, idKey, pageSize],
	);

	const update = useCallback(
		(id: T[keyof T] | number | string, updates: Partial<T>) => {
			dataRef.current = dataRef.current.map((item) => {
				return item[idKey] === id ? ({ ...item, ...updates } as T) : item;
			});
			void fetchData({ pageNum: 1, pageSize });
		},
		[fetchData, idKey, pageSize],
	);

	const deleteItem = useCallback(
		(id: T[keyof T] | number | string) => {
			dataRef.current = dataRef.current.filter((item) => item[idKey] !== id);
			void fetchData({ pageNum: 1, pageSize });
		},
		[fetchData, idKey, pageSize],
	);

	return {
		list,
		total,
		fetchData,
		add,
		update,
		delete: deleteItem,
	};
}
