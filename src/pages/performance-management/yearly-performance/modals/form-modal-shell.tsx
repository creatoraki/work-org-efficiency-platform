import type { ModalProps } from "antd";
import type { ReactNode } from "react";

import { Modal } from "antd";
import { CircleX } from "lucide-react";

interface FormModalShellProps extends Pick<
	ModalProps,
	"open" | "onOk" | "onCancel" | "confirmLoading" | "afterClose"
> {
	/** 标题 */
	title: string;
	/** 表单内容 */
	children: ReactNode;
}

/**
 * 年终述职表单弹窗外壳
 *
 * 统一设计稿弹窗规格（11-20 版 08 / 11 / 14）：宽 626px；头部 18px 中粗标题 + 22px 圆形关闭图标，底部分隔线；
 * 主体上下 36px、左右 24px；底部 12px / 24px 内边距，按钮右对齐。
 *
 * @param props - 组件属性
 * @param props.title - 标题
 * @param props.children - 表单内容
 * @returns 弹窗
 *
 * @since 2026-11-16
 */
export function FormModalShell({ title, children, ...rest }: FormModalShellProps) {
	return (
		<Modal
			{...rest}
			title={title}
			width={626}
			centered
			destroyOnHidden
			okText="确定"
			cancelText="取消"
			closeIcon={<CircleX className="size-[22px] text-[#323233]" strokeWidth={1.6} />}
			styles={{
				content: { padding: 0, borderRadius: 4 },
				header: {
					margin: 0,
					padding: "13px 24px",
					borderBottom: "1px solid #EBEEF5",
				},
				body: { padding: "36px 24px 13px" },
				footer: {
					margin: 0,
					padding: "12px 24px",
					borderTop: "1px solid #E4E7ED",
				},
			}}
			classNames={{
				// 关闭图标中心距顶部 26px、距右侧 37px（设计稿 08）
				content:
					"[&_.ant-modal-close]:!end-[26px] [&_.ant-modal-close]:!top-[15px] [&_.ant-modal-close]:!size-[22px]",
				header: "[&_.ant-modal-title]:!text-lg [&_.ant-modal-title]:!font-semibold [&_.ant-modal-title]:!leading-[25px] [&_.ant-modal-title]:!text-[#323233]",
			}}
		>
			{children}
		</Modal>
	);
}
