import type { NotificationItem } from "./types";

import { fetchNotifications } from "#src/api/notifications";

import { useEffect, useState } from "react";

export function NotificationContainer() {
	const [, setNotifications] = useState<NotificationItem[]>([]);

	useEffect(() => {
		fetchNotifications().then((res) => {
			setNotifications(Array.from({ length: 20 }).flatMap(() => res.data));
		});
	}, []);

	// return (
	// 	<NotificationPopup
	// 		notifications={notifications}
	// 		{...restProps}
	// 	/>
	// );
	return null;
}
