import React from "react";
import IndicatorPlanDrawer from "../../../../src/pages/strategy/target-management/modal/Indicator-plan-drawer";

export default function IndicatorPlanWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return <IndicatorPlanDrawer open={true} record={props?.record} onClose={onClose} />;
}
