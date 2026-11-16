import type { ReactNode } from "react";

/** 表单项通用配置：标签列 92px 右对齐、无冒号、项间距 24px */
export const MODAL_FORM_PROPS = {
	colon: false,
	labelAlign: "right" as const,
	labelCol: { flex: "92px" },
	wrapperCol: { flex: "1" },
	/** 设计稿星号紧贴字段名（antd 默认星号后有 4px 间距），自定义渲染 */
	requiredMark: (label: ReactNode, { required }: { required: boolean }) => (
		<>
			{required ? <span className="text-[#F5222D]">*</span> : null}
			{label}
		</>
	),
	className:
		"[&_.ant-form-item]:mb-6 [&_.ant-form-item-label]:mr-6 [&_.ant-form-item-label]:!pb-0 [&_.ant-form-item-label>label]:!text-sm [&_.ant-form-item-label>label]:!text-[#323233] [&_.ant-form-item-label>label]:after:!hidden",
};
