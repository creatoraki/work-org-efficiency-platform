import IndicatorDrawer from "../../../pages/strategy/target-management/modal/Indicator-drawer";

export default function IndicatorDrawerWrapper({
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
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose(res);
			}}
		/>
	);
}
