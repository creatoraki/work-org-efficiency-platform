import { Input, Modal } from "antd";
import { useEffect, useState } from "react";

/**
 * 备注事项弹窗属性
 */
interface RemarkModalProps {
	/** 是否可见 */
	open: boolean;
	/** 当前备注内容 */
	value: string;
	/** 关闭回调 */
	onClose: () => void;
	/** 确认回调，回传编辑后的备注 */
	onConfirm: (value: string) => void;
}

/** 备注最大长度（设计稿 0/100） */
const REMARK_MAX_LENGTH = 100;

/**
 * 备注事项弹窗
 *
 * 加分项 / 扣分项的备注统一通过弹窗填写：左侧必填标签，右侧 320px 文本域，
 * 右下角展示字数计数；底部为取消 / 确定，确定在内容为空时不可点击。
 * 对应 Figma 节点 10591:22891。
 *
 * @param props - 组件属性
 * @param props.open - 是否可见
 * @param props.value - 当前备注内容
 * @param props.onClose - 关闭回调
 * @param props.onConfirm - 确认回调
 * @returns 备注事项弹窗
 *
 * @author 王善能
 * @since 2026-11-14
 */
export function RemarkModal({ open, value, onClose, onConfirm }: RemarkModalProps) {
	const [draft, setDraft] = useState(value);

	// 每次打开时用外部最新值回填，避免上次取消后的草稿残留
	useEffect(() => {
		if (open) {
			setDraft(value);
		}
	}, [open, value]);

	return (
		<Modal
			centered
			open={open}
			width={572}
			title={<span className="font-medium">备注事项</span>}
			okText="确定"
			cancelText="取消"
			onCancel={onClose}
			onOk={() => onConfirm(draft.trim())}
			okButtonProps={{
				disabled: !draft.trim(),
				style: { background: draft.trim() ? "#0075FF" : undefined, borderRadius: 3 },
			}}
			cancelButtonProps={{
				style: { borderColor: "#E4E7ED", color: "#323233", borderRadius: 3 },
			}}
			styles={{
				header: { padding: "12px 24px", borderBottom: "1px solid #EBEEF5" },
				body: { padding: "12px 24px" },
				footer: { marginTop: 0, padding: "12px 24px", borderTop: "1px solid #E4E7ED" },
			}}
			destroyOnHidden
		>
			<div className="flex items-start gap-6 py-3">
				<span className="w-[92px] shrink-0 text-right text-sm leading-[22px] text-[#323233]">
					<span className="text-[#F5222D]">*</span>
					备注事项
				</span>
				<div className="flex w-[320px] flex-col items-end gap-0.5">
					<Input.TextArea
						value={draft}
						maxLength={REMARK_MAX_LENGTH}
						placeholder="请输入"
						className="!w-[320px]"
						style={{ height: 140, borderColor: "#E4E7ED", borderRadius: 3 }}
						onChange={(event) => setDraft(event.target.value)}
					/>
					<span className="text-xs leading-5 text-[#323233]">
						{draft.length}/{REMARK_MAX_LENGTH}
					</span>
				</div>
			</div>
		</Modal>
	);
}
