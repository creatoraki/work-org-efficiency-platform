import React from "react";
import IndicatorDetailDrawer from "../../../../src/pages/strategy/target-management/modal/Indicator-detail-drawer";

export default function IndicatorDetailWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return <IndicatorDetailDrawer open={true} record={props?.record} onClose={onClose} />;
}
