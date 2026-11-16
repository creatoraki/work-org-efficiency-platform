import { TAG_RULE_TYPE_DICT, TAG_TYPE, YES_NO } from "#src/pages/tag-management/config";

/**
 * 表单模式枚举
 */
export enum FORM_MODE {
	/** 新增 */
	ADD = "add",
	/** 编辑 */
	EDIT = "edit",
	/** 只读 */
	READONLY = "readonly",
}

/**
 * 智能标签 AI 对话 iframe URL 配置（仅人才标签）
 */
export const AI_TAG_IFRAME_URL: Record<string, string> = {
	// 人才标签 - AI 对话页面 URL
	[TAG_RULE_TYPE_DICT.TALENT]:
		"https://hrbrain.dingtalk.com/hrbrain/talent/ai-tag?hideMenu=true&HIDDEN_HISTORY=true",
};

/**
 * 标签值 placeholder 文本常量
 */
export const TAG_VALUE_PLACEHOLDER: Record<string, string> = {
	[TAG_TYPE.MANUAL]: '请输入，多值请用英文逗号隔开，自定义输入标签请填"无"', // 手工标签
	[TAG_TYPE.SYSTEM]: "根据规则配置，自动带出，无需填写", // 系统标签
	[TAG_TYPE.INTELLIGENT]: "根据描述，自动识别标签值", // 智能标签
};

/**
 * 是否必填默认值常量
 */
export const DEFAULT_IS_REQUIRED = YES_NO.YES;

/**
 * 更新频次与面谈更新频次的映射关系
 */
export const UPDATE_TO_INTERVIEW_FREQ_MAP: Record<string, string> = {
	1: "1",
	2: "2",
	3: "3",
	4: "4",
	5: "5",
};

/**
 * 规则选取选项枚举
 */
export enum RULE_SOURCE_VALUES {
	/** 从规则库选取 */
	FROM_LIBRARY = "0",
	/** 新建自定义复合规则 */
	CUSTOM_RULE = "1",
}

/**
 * 审批人类型枚举
 */
export enum APPROVER_TYPE {
	/** 人员 */
	PERSON = "1",
	/** 角色 */
	ROLE = "2",
}

/**
 * 标签抽屉 body 样式。
 *
 * body padding 置 0，由内容区自行控制内边距；驳回原因、操作说明等 banner 可贴顶贴边展示。
 *
 * @author 王善能
 * @since 2026-06-11
 */
export const TAG_DRAWER_BODY_STYLES = {
	body: { padding: 0 },
} as const;

/**
 * 标签抽屉内容区内边距。
 *
 * 与 Drawer body padding: 0 配合，表单/详情主体使用 16px 水平与底部留白。
 *
 * @author 王善能
 * @since 2026-06-11
 */
export const TAG_DRAWER_CONTENT_CLASS = "px-6 py-4";
