import type { ModalFuncProps } from "antd/es/modal";
import blueConfirm from "#src/assets/svg/blue-confirm.svg";
import yellowConfirm from "#src/assets/svg/yellow-confirm.svg";
import { modal } from "#src/utils";
import { CloseOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import "./custom-confirm.css";

const DEFAULTS: Partial<ModalFuncProps> = {
	centered: true,
	okText: "确认",
	cancelText: "取消",
	maskClosable: false,
	className: "custom-confirm-modal",
	okButtonProps: { type: "primary" },
	closable: true,
	closeIcon: <CloseOutlined />,
};

export function confirm(opts: ModalFuncProps) {
	const { styles, ...restOpts } = opts || {};

	const merged: ModalFuncProps = {
		...DEFAULTS,
		...restOpts,
		className: [DEFAULTS.className, opts?.className].filter(Boolean).join(" "),
		// merge bodyStyle objects if provided
		styles: {
			...(styles || {}),
			body: {
				...(styles?.body || {}),
			},
		},
	} as ModalFuncProps;

	// 支持通过 opts.icon 传入字符串来选择内置图标：'blue' | 'yellow'
	const rawIcon = (opts as any)?.icon;
	if (typeof rawIcon === "string") {
		if (rawIcon === "blue") {
			merged.icon = <img src={blueConfirm} alt="" className="custom-confirm-svg" />;
		} else if (rawIcon === "yellow") {
			merged.icon = <img src={yellowConfirm} alt="" className="custom-confirm-svg" />;
		}
	}
	return modal.confirm(merged);
}

// 保留 destroyAll 方便调用
export const destroyAll = Modal.destroyAll;

export default { confirm, destroyAll };
