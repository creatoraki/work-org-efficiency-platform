import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TAG_TYPE } from "#src/pages/tag-management/config";
import type { TagCenterItem } from "./types";
import { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import {
	convertUseScopeToJobPositionList,
	getBusinessCategoryLeafCode,
	normalizeAuditProcessTaggingForSubmit,
	normalizeExistenceCycleForSubmit,
} from "./utils";

export interface TagCreatePayloadContext {
	tagLibraryType: TAG_RULE_TYPE_DICT;
	jobPositionNodeMap: Map<string, JobPositionTreeNode>;
}

export interface BuildCreateTagPayloadOptions {
	tagType: TAG_TYPE;
}

export interface BuildUpdateTagPayloadOptions {
	tagType: TAG_TYPE;
}

/**
 * 规范化规则库主键。
 *
 * 前端表单与 Select 回显统一使用字符串，但后端 `TagAddForm.tagRulesId`
 * 定义为 `Long`，提交前需要在契约边界统一转为 number。
 *
 * @param tagRulesId - 表单态规则 ID
 * @returns 可提交给后端的 number；非法值返回 undefined
 *
 * @author 王善能
 * @since 2026-06-18
 */
function normalizeTagRulesIdForSubmit(tagRulesId: TagCenterItem["tagRulesId"]) {
	if (tagRulesId === undefined || tagRulesId === null || tagRulesId === "") {
		return undefined;
	}

	const normalizedValue = Number(tagRulesId);
	return Number.isFinite(normalizedValue) ? normalizedValue : undefined;
}

/**
 * 构建创建接口的单条 payload。
 *
 * 表单草稿需要保留 UI 编辑态字段，例如 `useScope`、审核流程数组和 dayjs 日期值；
 * 但创建接口只接受稳定的后端合同字段。因此这里统一完成：
 * - 人员范围转 `tagPositionList`
 * - 审核流程数组转 JSON 字符串
 * - 到期时间转 `YYYY-MM-DD`
 * - 过滤掉仅前端使用的临时字段
 *
 * @param draft - 表单真相源草稿
 * @param context - 创建接口上下文
 * @param options - 创建场景附加信息
 * @returns 后端创建接口单条 payload
 *
 * @author 王善能
 * @since 2026-06-17
 */
export function buildCreateTagPayload(
	draft: TagCenterItem,
	context: TagCreatePayloadContext,
	options: BuildCreateTagPayloadOptions,
): Record<string, unknown> {
	const normalizedTagPositionList =
		context.tagLibraryType === TAG_RULE_TYPE_DICT.TALENT
			? Array.isArray(draft.tagPositionList) && draft.tagPositionList.length > 0
				? draft.tagPositionList.map((item) => ({
						id: String(item.id || "0"),
						type: String(item.type || "root"),
					}))
				: convertUseScopeToJobPositionList(
						Array.isArray(draft.useScope) ? draft.useScope : [],
						context.jobPositionNodeMap,
					)
			: draft.tagPositionList;

	const payload: Record<string, unknown> = {
		aiSessionId: draft.aiSessionId,
		aliTagCode: draft.aliTagCode,
		auditComment: draft.auditComment,
		auditProcessTagging: normalizeAuditProcessTaggingForSubmit(draft.auditProcessTagging),
		auditor: draft.auditor,
		auditorName: draft.auditorName,
		attProofReqsTagging: draft.attProofReqsTagging,
		businessCategory: getBusinessCategoryLeafCode(draft.businessCategory),
		existenceCycle: normalizeExistenceCycleForSubmit(draft.existenceCycle),
		ftfInterviewer: draft.ftfInterviewer,
		ftfInterviewUpdFreq: draft.ftfInterviewUpdFreq,
		isAttProofTagging: draft.isAttProofTagging,
		isAuditTagging: draft.isAuditTagging,
		isDisplayInOrgBrain: draft.isDisplayInOrgBrain,
		isFtfInterview: draft.isFtfInterview,
		isRequired: draft.isRequired,
		maintainer: draft.maintainer,
		maintainerName: draft.maintainerName,
		maintainerType: draft.maintainerType,
		ruleSelectionType: draft.ruleSelectionType,
		sensitivityLevel: draft.sensitivityLevel,
		status: draft.status,
		submitter: draft.submitter,
		submitterName: draft.submitterName,
		tagDescription: draft.tagDescription,
		tagDistributionModule: draft.tagDistributionModule,
		tagName: draft.tagName,
		tagPositionList: normalizedTagPositionList,
		tagRulesId: normalizeTagRulesIdForSubmit(draft.tagRulesId),
		tagType: options.tagType,
		tagValue: draft.tagValue,
		tagVisibility: draft.tagVisibility,
		type: context.tagLibraryType,
		updateFrequency: draft.updateFrequency,
	};

	return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

/**
 * 构建更新接口的单条 payload。
 *
 * 编辑流与新增流共享同一套字段规范化规则，但更新是单对象 patch 语义，
 * 因此单独暴露 update 转换函数，避免编辑入口继续借道创建聚合逻辑。
 *
 * @param draft - 编辑态真相源草稿
 * @param context - 更新接口上下文
 * @param options - 更新场景附加信息
 * @returns 后端更新接口单条 payload
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function buildUpdateTagPayload(
	draft: TagCenterItem,
	context: TagCreatePayloadContext,
	options: BuildUpdateTagPayloadOptions,
): Record<string, unknown> {
	return buildCreateTagPayload(draft, context, options);
}
