import React from "react";
import PlanViewDataDrawer from "../../../../src/pages/strategy/target-management/modal/Plan-view-data-drawer";

export default function PlanViewDataWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<PlanViewDataDrawer
			open={true}
			record={props?.record}
			{...(props?.type && { type: props.type })}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose?.(res);
			}}
		/>
	);
}
