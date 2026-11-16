import type { JobPositionTreeNode } from "#src/api/tag-management/rule-library";
import type { TAG_RULE_TYPE_DICT } from "#src/pages/tag-management/config";
import type { TagCenterItem } from "./types";
import { TAG_TYPE, YES_NO } from "#src/pages/tag-management/config";
import { z } from "zod";
import { RULE_SOURCE_VALUES } from "./constants";

export interface TagFormValidationContext {
	tagLibraryType: TAG_RULE_TYPE_DICT;
	jobPositionNodeMap: Map<string, JobPositionTreeNode>;
}

export interface TagFormValidationError {
	field: string;
	message: string;
}

export interface TagFormValidationSuccessResult {
	valid: true;
	errors: Record<string, string[]>;
}

export interface TagFormValidationFailureResult {
	valid: false;
	errors: Record<string, string[]>;
	firstError: TagFormValidationError;
}

export type TagFormValidationResult =
	| TagFormValidationSuccessResult
	| TagFormValidationFailureResult;

const TAG_FORM_VALIDATION_FIELD_ORDER = [
	"tagType",
	"ruleSelectionType",
	"aliTagCode",
	"tagRulesId",
	"tagName",
	"tagValue",
	"businessCategory",
	"isRequired",
	"sensitivityLevel",
	"existenceCycle",
	"updateFrequency",
	"useScope",
	"maintainer",
	"auditor",
	"isAuditTagging",
	"auditProcessTagging",
	"isAttProofTagging",
	"attProofReqsTagging",
	"isFtfInterview",
	"ftfInterviewUpdFreq",
	"ftfInterviewer",
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

const BaseTagFormSchema = z
	.object({
		tagType: requiredString("请选择标签类型"),
		ruleSelectionType: z.string().optional(),
		tagRulesId: z.string().optional(),
		tagName: requiredString("请输入标签名称"),
		tagValue: requiredString("请输入标签值"),
		businessCategory: requiredBusinessCategory,
		isRequired: requiredString("请选择是否必填"),
		sensitivityLevel: requiredString("请选择敏感程度"),
		existenceCycle: optionalUnknown,
		updateFrequency: requiredString("请选择更新频次"),
		auditor: requiredString("请选择审核人"),
		maintainer: z.string().optional(),
		isAuditTagging: z.string().optional(),
		auditProcessTagging: optionalUnknown,
		isAttProofTagging: z.string().optional(),
		attProofReqsTagging: z.string().optional(),
		isFtfInterview: z.string().optional(),
		ftfInterviewUpdFreq: z.string().optional(),
		ftfInterviewer: z.string().optional(),
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
	.passthrough();

function toErrorMap(error: z.ZodError): Record<string, string[]> {
	return error.issues.reduce<Record<string, string[]>>((result, issue) => {
		const field = String(issue.path[0] || "form");
		result[field] = [...(result[field] || []), issue.message];
		return result;
	}, {});
}

function pickFirstError(errors: Record<string, string[]>): TagFormValidationError {
	for (const field of TAG_FORM_VALIDATION_FIELD_ORDER) {
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

function validateTagFormValues(
	values: TagCenterItem,
	context: TagFormValidationContext,
): TagFormValidationResult {
	const schema = BaseTagFormSchema.superRefine((formValues, ctx) => {
		const isTalentTagLibrary = context.tagLibraryType === "2";
		const isManualTag = formValues.tagType === TAG_TYPE.MANUAL;
		const isSystemTag = formValues.tagType === TAG_TYPE.SYSTEM;
		const isIntelligentTag = formValues.tagType === TAG_TYPE.INTELLIGENT;
		const isCustomSystemRule =
			isSystemTag && formValues.ruleSelectionType === RULE_SOURCE_VALUES.CUSTOM_RULE;
		const shouldUseRuleScope = isIntelligentTag || isCustomSystemRule;

		if (!formValues.existenceCycle) {
			ctx.addIssue({
				code: "custom",
				path: ["existenceCycle"],
				message: "请选择到期时间",
			});
		}

		if (isSystemTag && !formValues.ruleSelectionType) {
			ctx.addIssue({
				code: "custom",
				path: ["ruleSelectionType"],
				message: "请选择规则选取",
			});
		}

		if (isSystemTag && !isCustomSystemRule && !formValues.tagRulesId) {
			ctx.addIssue({
				code: "custom",
				path: ["tagRulesId"],
				message: "请选择规则",
			});
		}

		if (isSystemTag && isCustomSystemRule && !formValues.aliTagCode) {
			ctx.addIssue({
				code: "custom",
				path: ["aliTagCode"],
				message: "请先新建复合规则",
			});
		}

		if (isIntelligentTag) {
			if (!formValues.aiSessionId) {
				ctx.addIssue({
					code: "custom",
					path: ["aiSessionId"],
					message: "智能标签缺少 AI 会话信息，请重新向 AI 描述标签",
				});
			}

			if (!formValues.aliTagCode) {
				ctx.addIssue({
					code: "custom",
					path: ["aliTagCode"],
					message: "智能标签缺少阿里标签编码，请重新向 AI 描述标签",
				});
			}
		}

		if (isTalentTagLibrary && !shouldUseRuleScope) {
			const hasUseScope =
				Array.isArray(formValues.useScope) && formValues.useScope.length > 0;
			const hasTagPositionList =
				Array.isArray(formValues.tagPositionList) && formValues.tagPositionList.length > 0;
			if (!hasUseScope && !hasTagPositionList) {
				ctx.addIssue({
					code: "custom",
					path: ["useScope"],
					message: "请选择人员范围",
				});
			}
		}

		if (isTalentTagLibrary && isManualTag) {
			if (!formValues.maintainer) {
				ctx.addIssue({
					code: "custom",
					path: ["maintainer"],
					message: "请选择维护人",
				});
			}

			if (!formValues.isAuditTagging) {
				ctx.addIssue({
					code: "custom",
					path: ["isAuditTagging"],
					message: "请选择是否需审核",
				});
			}

			if (formValues.isAuditTagging === YES_NO.YES) {
				const auditProcessTagging = Array.isArray(formValues.auditProcessTagging)
					? formValues.auditProcessTagging
					: [];
				if (auditProcessTagging.length === 0) {
					ctx.addIssue({
						code: "custom",
						path: ["auditProcessTagging"],
						message: "请至少添加一个审批步骤",
					});
				} else {
					const incompleteSteps = auditProcessTagging.reduce<number[]>(
						(result, step, index) => {
							if (!step?.approver) {
								result.push(index + 1);
							}
							return result;
						},
						[],
					);
					if (incompleteSteps.length > 0) {
						ctx.addIssue({
							code: "custom",
							path: ["auditProcessTagging"],
							message: `第${incompleteSteps.join("、")}个审批步骤信息不完整`,
						});
					}
				}

				if (!formValues.isAttProofTagging) {
					ctx.addIssue({
						code: "custom",
						path: ["isAttProofTagging"],
						message: "请选择是否需要附件证明",
					});
				}

				if (
					formValues.isAttProofTagging === YES_NO.YES &&
					(!formValues.attProofReqsTagging ||
						!String(formValues.attProofReqsTagging).trim())
				) {
					ctx.addIssue({
						code: "custom",
						path: ["attProofReqsTagging"],
						message: "请输入附件证明要求",
					});
				}
			}

			if (!formValues.isFtfInterview) {
				ctx.addIssue({
					code: "custom",
					path: ["isFtfInterview"],
					message: "请选择是否需面谈",
				});
			}

			if (formValues.isFtfInterview === YES_NO.YES && !formValues.ftfInterviewUpdFreq) {
				ctx.addIssue({
					code: "custom",
					path: ["ftfInterviewUpdFreq"],
					message: "请选择面谈更新频次",
				});
			}

			if (formValues.isFtfInterview === YES_NO.YES && !formValues.ftfInterviewer) {
				ctx.addIssue({
					code: "custom",
					path: ["ftfInterviewer"],
					message: "请选择面谈人",
				});
			}
		}

		if (isTalentTagLibrary) {
			if (formValues.isDisplayInOrgBrain === undefined) {
				ctx.addIssue({
					code: "custom",
					path: ["isDisplayInOrgBrain"],
					message: "请选择在组织大脑呈现",
				});
			}

			if (formValues.isDisplayInOrgBrain === true && !formValues.tagVisibility) {
				ctx.addIssue({
					code: "custom",
					path: ["tagVisibility"],
					message: "请选择标签显隐情况",
				});
			}

			if (
				formValues.isDisplayInOrgBrain === true &&
				formValues.tagVisibility === YES_NO.NO &&
				!formValues.tagDistributionModule
			) {
				ctx.addIssue({
					code: "custom",
					path: ["tagDistributionModule"],
					message: "请选择标签分布模块",
				});
			}
		}
	});

	const parseResult = schema.safeParse(values);
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

/**
 * 校验单标签新增草稿。
 *
 * @param values - 新增入口当前单标签真相源
 * @param context - 校验上下文
 * @returns 统一校验结果
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function validateCreateSingleTagValues(
	values: TagCenterItem,
	context: TagFormValidationContext,
): TagFormValidationResult {
	return validateTagFormValues(values, context);
}

/**
 * 校验编辑入口单标签草稿。
 *
 * @param values - 编辑入口当前单标签真相源
 * @param context - 校验上下文
 * @returns 统一校验结果
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function validateUpdateTagValues(
	values: TagCenterItem,
	context: TagFormValidationContext,
): TagFormValidationResult {
	return validateTagFormValues(values, context);
}

/**
 * 将业务 schema 错误映射为 antd Form 可消费的字段错误结构。
 *
 * @param errors - schema 错误映射
 * @returns 表单字段错误数组
 *
 * @author 王善能
 * @since 2026-06-18
 */
export function toTagFormFieldErrors(errors: Record<string, string[]>) {
	return Object.entries(errors).map(([fieldName, messages]) => ({
		name: fieldName,
		errors: messages,
	}));
}
