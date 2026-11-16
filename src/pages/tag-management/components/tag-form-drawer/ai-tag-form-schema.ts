import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import type { AiTagTabState, TagCenterItem } from "./types";
import { TAG_TYPE, YES_NO } from "#src/pages/tag-management/config";
import { z } from "zod";
import { buildCreateTagPayload } from "./tag-form-payload";

export type AiTagFormValues = TagCenterItem;

export interface AiTagValidationContext {
	tagLibraryType: TAG_RULE_TYPE_DICT;
	jobPositionNodeMap: Map<string, JobPositionTreeNode>;
}

export interface AiTagValidationError {
	field: string;
	message: string;
}

export interface AiTagTabValidationResult {
	tempId: string;
	valid: boolean;
	errors: Record<string, string[]>;
}

export interface AiTagBatchValidationResult {
	results: AiTagTabValidationResult[];
	firstInvalidTabId?: string;
	firstError?: AiTagValidationError;
}

const AI_TAG_VALIDATION_FIELD_ORDER = [
	"tagName",
	"tagValue",
	"businessCategory",
	"isRequired",
	"sensitivityLevel",
	"existenceCycle",
	"updateFrequency",
	"auditor",
	"isDisplayInOrgBrain",
	"tagVisibility",
	"tagDistributionModule",
] as const;

const requiredString = (message: string) =>
	z.preprocess(
		(value) => (typeof value === "string" ? value.trim() : value),
		z.string({ error: message }).min(1, message),
	);

const requiredBusinessCategory = z
	.unknown()
	.refine(
		(value) =>
			(typeof value === "string" && value.trim().length > 0) ||
			(Array.isArray(value) && value.length > 0),
		"请选择业务类别",
	);

const optionalUnknown = z.unknown().optional();

export const AiTagFormSchema = z
	.object({
		tagName: requiredString("请输入标签名称"),
		tagValue: requiredString("请输入标签值"),
		businessCategory: requiredBusinessCategory,
		isRequired: requiredString("请选择是否必填"),
		sensitivityLevel: requiredString("请选择敏感程度"),
		existenceCycle: optionalUnknown,
		updateFrequency: requiredString("请选择更新频次"),
		auditor: requiredString("请选择审核人"),
		aiSessionId: z.string().optional(),
		aliTagCode: z.string().optional(),
		isDisplayInOrgBrain: z.boolean().optional(),
		tagVisibility: z.string().optional(),
		tagDistributionModule: z.string().optional(),
		useScope: z.array(z.string()).optional(),
		tagPositionList: z
			.array(
				z.object({
					id: z.string().optional(),
					type: z.string().optional(),
				}),
			)
			.optional(),
	})
	.passthrough()
	.superRefine((values, ctx) => {
		if (values.tagType === TAG_TYPE.INTELLIGENT) {
			if (!values.aiSessionId) {
				ctx.addIssue({
					code: "custom",
					path: ["aiSessionId"],
					message: "智能标签缺少 AI 会话信息，请重新向 AI 描述标签",
				});
			}

			if (!values.aliTagCode) {
				ctx.addIssue({
					code: "custom",
					path: ["aliTagCode"],
					message: "智能标签缺少阿里标签编码，请重新向 AI 描述标签",
				});
			}
		}

		if (!values.existenceCycle) {
			ctx.addIssue({
				code: "custom",
				path: ["existenceCycle"],
				message: "请选择到期时间",
			});
		}

		if (values.isDisplayInOrgBrain === undefined) {
			ctx.addIssue({
				code: "custom",
				path: ["isDisplayInOrgBrain"],
				message: "请选择在组织大脑呈现",
			});
		}

		if (values.isDisplayInOrgBrain === true && !values.tagVisibility) {
			ctx.addIssue({
				code: "custom",
				path: ["tagVisibility"],
				message: "请选择标签显隐情况",
			});
		}

		if (
			values.isDisplayInOrgBrain === true &&
			values.tagVisibility === YES_NO.NO &&
			!values.tagDistributionModule
		) {
			ctx.addIssue({
				code: "custom",
				path: ["tagDistributionModule"],
				message: "请选择标签分布模块",
			});
		}
	});

function toErrorMap(error: z.ZodError): Record<string, string[]> {
	return error.issues.reduce<Record<string, string[]>>((result, issue) => {
		const field = String(issue.path[0] || "form");
		result[field] = [...(result[field] || []), issue.message];
		return result;
	}, {});
}

function pickFirstError(errors: Record<string, string[]>): AiTagValidationError {
	for (const field of AI_TAG_VALIDATION_FIELD_ORDER) {
		const messages = errors[field];
		if (messages?.length) {
			return {
				field,
				message: messages[0] || "请先完善必填信息",
			};
		}
	}

	const [fallbackField = "form", fallbackMessages = ["请先完善必填信息"]] =
		Object.entries(errors)[0] || [];
	return {
		field: fallbackField,
		message: fallbackMessages[0] || "请先完善必填信息",
	};
}

export function validateAiTagFormValues(
	values: AiTagFormValues,
	_context: AiTagValidationContext,
):
	| { valid: true; errors: Record<string, string[]> }
	| {
			valid: false;
			errors: Record<string, string[]>;
			firstError: AiTagValidationError;
	  } {
	const parseResult = AiTagFormSchema.safeParse(values);
	if (parseResult.success) {
		return { valid: true, errors: {} };
	}

	const errors = toErrorMap(parseResult.error);
	return {
		valid: false,
		errors,
		firstError: pickFirstError(errors),
	};
}

export function validateAllAiTagTabs(
	tabs: AiTagTabState[],
	context: AiTagValidationContext,
): AiTagBatchValidationResult {
	const results = tabs.map((tab) => {
		const result = validateAiTagFormValues(tab.values, context);
		return {
			tempId: tab.tempId,
			valid: result.valid,
			errors: result.errors,
		};
	});

	const firstInvalidResult = results.find((result) => !result.valid);
	const firstError = firstInvalidResult ? pickFirstError(firstInvalidResult.errors) : undefined;

	return {
		results,
		firstInvalidTabId: firstInvalidResult?.tempId,
		firstError,
	};
}

export function toAiTagSubmitPayload(
	tab: AiTagTabState,
	context: AiTagValidationContext,
): Record<string, unknown> {
	return buildCreateTagPayload(tab.values, context, {
		tagType: TAG_TYPE.INTELLIGENT,
	});
}
