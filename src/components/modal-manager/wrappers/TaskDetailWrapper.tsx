import TaskDetailDrawer from "../../../../src/pages/strategy/target-decomposition/modal/Task-detail-drawer";

export default function TaskDetailWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return (
		<TaskDetailDrawer
			open={true}
			record={props?.record}
			onClose={(res: any) => {
				onClose(res);
				props?.afterClose?.(res);
			}}
		/>
	);
}
