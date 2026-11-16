import React from "react";
import IndicatorConfigDrawer from "../../../../src/pages/strategy/target-decomposition/modal/IndicatorConfigDrawer";

export default function IndicatorConfigWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<IndicatorConfigDrawer
			open={true}
			record={props?.record}
			onClose={onClose}
			readonly={props?.readonly}
		/>
	);
}
