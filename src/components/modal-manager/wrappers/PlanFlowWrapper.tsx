import PlanFlowDrawer from "../../../../src/pages/strategy/target-management/modal/Plan-flow-drawer";

export default function PlanFlowWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<PlanFlowDrawer
			open={true}
			record={props?.record}
			readOnly={props?.readOnly}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose?.(res);
			}}
		/>
	);
}
