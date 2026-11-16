import React from "react";
import PlanDrawer from "../../../../src/pages/strategy/target-management/modal/Plan-drawer";

export default function PlanDrawerWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return <PlanDrawer open={true} record={props?.record} onClose={onClose} />;
}
