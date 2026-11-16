import PlanPermissionsDrawer from "../../../../src/pages/strategy/target-management/modal/Plan-permissions-drawer";

export default function PlanPermissionsWrapper({
	props,
	onClose,
	open,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
	open?: (name: string, props?: any) => Promise<any>;
}) {
	return (
		<PlanPermissionsDrawer
			open={true}
			record={props?.record}
			dataType={props?.dataType}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose(res);
			}}
			openModal={open}
		/>
	);
}
