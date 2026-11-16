import CloseIcon from "#src/assets/svg/close-circle.svg?react";
import { Button } from "antd";

function closeBtn(onClose: any) {
	return (
		<Button
			type="text"
			onClick={() => onClose(null)}
			aria-label="关闭"
			style={{
				borderRadius: 6,
				background: "transparent",
				padding: 6,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				color: "rgba(0,0,0,0.65)",
			}}
		>
			<CloseIcon className="w-23" />
		</Button>
	);
}

export function commonDrawerProps(onClose: any) {
	return {
		closable: false,
		extra: closeBtn(onClose),
		onClose: () => onClose(null),
	};
}
