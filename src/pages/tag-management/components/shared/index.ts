/**
 * 共享组件导出
 *
 * 用于在多个组件间共享的子组件
 */

// AI 打标 Iframe Modal 组件
export { AiTagIframeModal } from "../ai-tag-iframe-modal";
export type {
	AiConversationCreatedPayload,
	AiConversationSubmittedPayload,
	AiSmartTagItem,
	AiSmartTagsReturnedPayload,
	AiTagIframeModalProps,
	TagGenerationSubmittedPayload,
} from "../ai-tag-iframe-modal";

// 查看组织规则标签抽屉
export { ViewOrgTagRuleDrawer } from "./view-org-tag-rule-drawer";
export type { ViewOrgTagRuleDrawerProps } from "./view-org-tag-rule-drawer";

// 查看人才 AI 打标人员弹窗
export { ViewTalentAiTagModal } from "./view-talent-ai-tag-modal";
export type { ViewTalentAiTagModalProps } from "./view-talent-ai-tag-modal";

// 查看人才规则标签抽屉
export { ViewTalentTagRuleDrawer } from "./view-talent-tag-rule-drawer";
export type { ViewTalentTagRuleDrawerProps } from "./view-talent-tag-rule-drawer";
