import IndicatorDrawer from "../../../pages/strategy/target-management/modal/Indicator-drawer";

export default function IndicatorEditWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<IndicatorDrawer
			open={true}
			record={props?.record}
			readonly={props?.readonly}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose(res);
			}}
		/>
	);
}
