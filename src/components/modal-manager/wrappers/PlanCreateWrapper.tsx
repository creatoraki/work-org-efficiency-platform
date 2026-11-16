import React from "react";
import PlanCreateModal from "../../../../src/pages/strategy/target-management/modal/Plan-create-modal";

export default function PlanCreateWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<PlanCreateModal
			open={true}
			record={props?.record}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose(res);
			}}
		/>
	);
}
