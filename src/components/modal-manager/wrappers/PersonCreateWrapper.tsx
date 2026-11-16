import React from "react";
import PersonCreateModal from "../../../../src/pages/strategy/target-management/modal/Person-create-modal";

export default function PersonCreateWrapper({
	props,
	onClose,
}: {
	id: string;
	props?: any;
	onClose: (res?: any) => void;
}) {
	return <PersonCreateModal open={true} record={props?.record} onClose={onClose} />;
}
