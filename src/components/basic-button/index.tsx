import type { ButtonProps } from "antd";
import { useUserStore } from "#src/store/user.js";
import { Button } from "antd";
import React from "react";

interface BasicButtonProps extends ButtonProps {
	auth?: string;
}

const BasicButton = React.forwardRef<any, BasicButtonProps>((props, ref) => {
	const { auth } = props;
	const perms = useUserStore((state) => state.perms);
	if (auth) {
		const hasPermission = perms.includes("*") || perms.includes(auth);
		if (!hasPermission) return null;
	}

	return <Button ref={ref} {...props} />;
});

export { BasicButton };
export default BasicButton;
