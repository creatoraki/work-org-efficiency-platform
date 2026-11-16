import type { LabelMetaItem } from "#src/api/tag-management/tag-center/ai-tag";
import { defineFakeRoute } from "vite-plugin-fake-server/client";

import { resultSuccess } from "./utils";

/** AI 标签 fake 路由前缀，vitePluginFakeServer 会根据 basename 自动拼接 /shanshu-efficiency-api */
const AI_TAG_FAKE_PREFIX = "/fake-mock/ai-tag";

/** 本地模拟场景下，AI 对话弹窗自动关闭延迟（毫秒） */
export const AI_TAG_MOCK_AUTO_CLOSE_DELAY_MS = 600;

/**
 * 模拟 bySession 接口返回的标签元数据池。
 *
 * 数据结构对齐 `hrbrain/label/meta/bySession`，用于本地开发时模拟 AI 对话完成后的标签识别结果。
 *
 * @author 王善能
 * @since 2026-06-16
 */
export const MOCK_LABEL_META_POOL: LabelMetaItem[] = [
	{
		labelCode: "hrbrain_import_label_base_kv.department_type",
		labelName: "部门类型",
		labelValue: "无",
		labelDescription: "员工所属的部门类型分类",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.position_type",
		labelName: "岗位类型",
		labelValue: "无",
		labelDescription: "员工所在岗位的类型",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.project_department",
		labelName: "项目部门",
		labelValue: "无",
		labelDescription: "按具体项目划分的部门",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.regional_department",
		labelName: "区域部门",
		labelValue: "无",
		labelDescription: "按地理区域划分的部门",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.service_department",
		labelName: "服务部门",
		labelValue: "无",
		labelDescription: "提供服务支持的部门",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.functional_department",
		labelName: "职能部门",
		labelValue: "无",
		labelDescription: "承担职能管理工作的部门",
		labelCategoryCode: "",
		isExist: true,
		isSensitive: false,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.business_department",
		labelName: "业务部门",
		labelValue: "无",
		labelDescription: "直接面向业务产出的部门",
		labelCategoryCode: "",
		isExist: true,
		isSensitive: true,
	},
	{
		labelCode: "hrbrain_import_label_base_kv.support_department",
		labelName: "支撑部门",
		labelValue: "无",
		labelDescription: "为业务提供支撑服务的部门",
		labelCategoryCode: "",
		isExist: false,
		isSensitive: false,
	},
];

/**
 * 模拟 label/data 接口返回的人员明细。
 */
const MOCK_LABEL_DATA_LIST = Array.from({ length: 100 }, (_, index) => ({
	workNo: String(10001 + index),
	name: `测试员工${index + 1}`,
	deptName: index % 3 === 0 ? "技术研发部" : index % 3 === 1 ? "产品运营部" : "人力资源部",
	labelValue: "安保部门",
	labelTitle: "安保部门",
	deptNo: `D${String(index + 1).padStart(4, "0")}`,
}));

/**
 * 生成模拟 AI 会话 ID。
 *
 * @returns 本地 mock 使用的唯一 sessionId
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function generateMockAiSessionId(): string {
	return `mock-ai-session-${Date.now()}`;
}

/**
 * 从模拟数据池中随机抽取标签元数据。
 *
 * @returns 1 到 8 条不重复的标签元数据
 *
 * @author 王善能
 * @since 2026-06-16
 */
export function pickRandomMockLabelMetaList(): LabelMetaItem[] {
	const count = Math.floor(Math.random() * 8) + 1;
	const shuffled = [...MOCK_LABEL_META_POOL].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildMockLabelDataPage(pageNum = 1, pageSize = 20) {
	const start = (pageNum - 1) * pageSize;
	const list = MOCK_LABEL_DATA_LIST.slice(start, start + pageSize);
	const total = MOCK_LABEL_DATA_LIST.length;

	return {
		pageNum,
		pageSize,
		total,
		pages: Math.ceil(total / pageSize),
		list,
		emptyFlag: list.length === 0,
	};
}

export default defineFakeRoute([
	{
		url: `${AI_TAG_FAKE_PREFIX}/label/meta/bySession`,
		timeout: 300,
		method: "post",
		response: () => resultSuccess(pickRandomMockLabelMetaList()),
	},
	{
		url: `${AI_TAG_FAKE_PREFIX}/label/data`,
		timeout: 300,
		method: "post",
		response: ({ body }) => {
			const pageNum = Number(body?.pageNum) || 1;
			const pageSize = Number(body?.pageSize) || 20;
			return resultSuccess(buildMockLabelDataPage(pageNum, pageSize));
		},
	},
]);
