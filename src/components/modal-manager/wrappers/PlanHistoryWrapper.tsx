import React from "react";
import PlanHistoryDrawer from "../../../../src/pages/strategy/target-management/modal/Plan-history-drawer";

export default function PlanHistoryWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<PlanHistoryDrawer
			open={true}
			record={props?.record}
			bizCode={props?.bizCode}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose?.(res);
			}}
		/>
	);
}
